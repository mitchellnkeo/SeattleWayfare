/**
 * OneBusAway Real-Time API Service
 * Handles real-time arrival predictions, vehicle locations, and service alerts
 * Based on DATA_SOURCES.md and ROADMAP.md Phase 2.2
 */

import axios from 'axios';
import ENV from '../../config/env';
import { CACHE_DURATION, UPDATE_INTERVALS } from '../../utils/constants';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { obaToGtfsRouteId, obaToGtfsStopId } from '../../utils/idMapping';

const OBA_BASE_URL = ENV.OBA_BASE_URL;
const API_KEY = ENV.OBA_API_KEY;

// Cache for API responses
const cache = new Map();

/**
 * Get cache key for a request
 */
function getCacheKey(endpoint, params) {
  return `${endpoint}_${JSON.stringify(params)}`;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cachedData, ttl = CACHE_DURATION.arrivals) {
  if (!cachedData || !cachedData.timestamp) return false;
  return Date.now() - cachedData.timestamp < ttl;
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let delay = initialDelay;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on rate limit errors (429) - return empty data instead
      if (error.message && (error.message.includes('429') || error.message.includes('Rate limit'))) {
        console.warn(`Rate limit error - skipping retry and returning empty data`);
        return { data: { code: 429, text: 'Rate limit exceeded', data: null } };
      }
      
      // Don't retry on "no data" errors - return empty data instead
      if (error.message && error.message.includes('no data')) {
        console.warn(`No data error - skipping retry and returning empty data`);
        return { data: { code: 200, data: null } };
      }
      
      if (attempt < maxRetries - 1) {
        console.warn(`Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  // For arrivals endpoints, return empty data instead of throwing
  if (lastError && lastError.config && lastError.config.url && 
      lastError.config.url.includes('arrivals-and-departures-for-stop')) {
    console.warn(`All retries failed for arrivals endpoint - returning empty data`);
    return { data: { code: 200, data: null } };
  }

  throw lastError;
}

class OneBusAwayService {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = OBA_BASE_URL;
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Make API request with caching and error handling
   * @private
   */
  async _makeRequest(endpoint, params = {}, useCache = true, cacheTTL = CACHE_DURATION.arrivals) {
    if (!this.isConfigured()) {
      throw new Error('OneBusAway API key not configured. Request key from oba_api_key@soundtransit.org');
    }

    const cacheKey = getCacheKey(endpoint, params);

    // Check cache
    if (useCache) {
      const cached = cache.get(cacheKey);
      if (cached && isCacheValid(cached, cacheTTL)) {
        console.log(`📦 Using cached data for ${endpoint}`);
        return cached.data;
      }
    }

    // Make request with retry logic
    const response = await retryWithBackoff(async () => {
      const url = `${this.baseUrl}/${endpoint}`;
      const requestParams = {
        ...params,
        key: this.apiKey,
      };

      let response;
      try {
        response = await axios.get(url, {
          params: requestParams,
          timeout: 10000, // 10 second timeout
        });
      } catch (axiosError) {
        // Handle network errors, timeouts, etc.
        if (axiosError.response) {
          // Server responded with error status
          const status = axiosError.response.status;
          console.warn(`OneBusAway API HTTP error: ${status} for ${endpoint}`);
          
          // Include rate limit info in error message for retry function to catch
          if (status === 429) {
            throw new Error(`OneBusAway API HTTP error: 429 (Rate limit)`);
          }
          
          throw new Error(`OneBusAway API HTTP error: ${status}`);
        } else if (axiosError.request) {
          // Request made but no response
          console.warn(`OneBusAway API no response for ${endpoint}`);
          throw new Error('OneBusAway API no response (network error)');
        } else {
          // Error setting up request
          console.warn(`OneBusAway API request error for ${endpoint}:`, axiosError.message);
          throw new Error(`OneBusAway API request error: ${axiosError.message}`);
        }
      }

      // Check for API errors in response
      if (!response) {
        console.warn(`OneBusAway API returned null response for ${endpoint}`);
        throw new Error('OneBusAway API returned null response');
      }

      if (!response.data) {
        console.warn(`OneBusAway API returned response without data for ${endpoint} - returning empty data`);
        // Return a valid response structure with null data instead of throwing
        return { data: { code: 200, data: null } };
      }

      // Check if response has error code (OneBusAway API format)
      if (response.data.code !== undefined && response.data.code !== null) {
        if (response.data.code !== 200) {
          const errorText = response.data.text || `Error code: ${response.data.code}`;
          // Handle specific error codes gracefully
          if (response.data.code === 404) {
            console.log(`OneBusAway API: Stop/route not found (404) for ${endpoint}`);
            // Return a response that indicates no data
            return { data: { code: 404, text: 'Not found', data: null } };
          }
          if (response.data.code === 429) {
            // Rate limit - return empty data instead of throwing
            console.warn(`OneBusAway API rate limit (429) for ${endpoint} - using cached data if available`);
            // Return a response that indicates rate limit
            return { data: { code: 429, text: 'Rate limit exceeded', data: null } };
          }
          // For other errors, log but don't throw if it's a non-critical endpoint
          if (endpoint.includes('arrivals-and-departures-for-stop')) {
            console.warn(`OneBusAway API error (${response.data.code}): ${errorText} for ${endpoint} - returning empty data`);
            return { data: { code: response.data.code, text: errorText, data: null } };
          }
          console.warn(`OneBusAway API error (${response.data.code}): ${errorText} for ${endpoint}`);
          throw new Error(`OneBusAway API error: ${errorText}`);
        }
      }

      // Check if response.data exists but is empty or null
      if (response.data && response.data.data === null) {
        console.log(`OneBusAway API returned null data for ${endpoint}`);
        // Return a valid response structure with null data
        return { data: { code: 200, data: null } };
      }

      return response;
    });

    const data = response.data;

    // Cache the response
    if (useCache) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    return data;
  }

  /**
   * Get real-time arrivals for a stop
   * @param {string} stopId - Stop ID in OneBusAway format (e.g., "1_75403")
   * @param {Object} options - Options for the request
   * @returns {Promise<Array>} Array of arrival objects
   */
  async getArrivalsForStop(stopId, options = {}) {
    try {
      const {
        minutesBefore = 5,
        minutesAfter = 60,
        useCache = true,
        cacheTTL = CACHE_DURATION.arrivals, // Allow custom cache TTL for vehicle tracking
      } = options;

      const data = await this._makeRequest(
        `arrivals-and-departures-for-stop/${stopId}.json`,
        {
          minutesBefore,
          minutesAfter,
        },
        useCache,
        cacheTTL // Use custom TTL if provided
      );

      if (!data) {
        console.warn(`OneBusAway API returned null/undefined for stop ${stopId}`);
        return [];
      }

      // Handle 404 responses (stop not found)
      if (data.code === 404 || (data.data && data.data.code === 404)) {
        console.log(`Stop ${stopId} not found in OneBusAway API`);
        return [];
      }

      // Handle 429 rate limit responses
      if (data.code === 429 || (data.data && data.data.code === 429)) {
        console.warn(`Rate limit exceeded for stop ${stopId} - returning empty array`);
        return [];
      }

      // Handle null or missing data
      if (!data.data || data.data === null) {
        console.log(`OneBusAway API returned null data for stop ${stopId} - no arrivals available`);
        return [];
      }

      if (!data.data.entry) {
        // Some stops may not have arrivals - return empty array instead of error
        console.log(`No arrivals data for stop ${stopId}`);
        return [];
      }

      const arrivals = data.data.entry.arrivalsAndDepartures || [];

      return arrivals.map((arrival) => {
        const now = Date.now();
        const scheduledTime = arrival.scheduledArrivalTime;
        const predictedTime = arrival.predictedArrivalTime || scheduledTime;
        const predicted = arrival.predicted === true;

        // Calculate minutes until arrival
        const minutesUntilArrival = Math.max(
          0,
          Math.round((predictedTime - now) / 60000)
        );

        // Calculate delay in minutes
        const delayMinutes = predicted
          ? Math.round((predictedTime - scheduledTime) / 60000)
          : 0;

        // Determine status
        let status = 'SCHEDULED';
        if (minutesUntilArrival <= 0) {
          status = 'DEPARTED';
        } else if (minutesUntilArrival <= 2) {
          status = 'ARRIVING';
        }

        // Extract vehicle position if available
        // OneBusAway API includes vehicle position in the arrival data
        // Check multiple possible field structures
        let vehiclePosition = null;
        
        // Try vehicleStatus.position (most common structure in OneBusAway)
        if (arrival.vehicleStatus && arrival.vehicleStatus.position) {
          vehiclePosition = {
            latitude: arrival.vehicleStatus.position.lat,
            longitude: arrival.vehicleStatus.position.lon,
            heading: arrival.vehicleStatus.position.heading || 0,
            lastUpdateTime: arrival.vehicleStatus.lastUpdateTime || predictedTime,
          };
        }
        // Try direct position fields
        else if (arrival.position && arrival.position.lat) {
          vehiclePosition = {
            latitude: arrival.position.lat,
            longitude: arrival.position.lon,
            heading: arrival.position.heading || 0,
            lastUpdateTime: arrival.lastUpdateTime || predictedTime,
          };
        }
        // Try vehiclePosition field
        else if (arrival.vehiclePosition) {
          vehiclePosition = {
            latitude: arrival.vehiclePosition.lat || arrival.vehiclePosition.latitude,
            longitude: arrival.vehiclePosition.lon || arrival.vehiclePosition.longitude,
            heading: arrival.vehiclePosition.heading || 0,
            lastUpdateTime: arrival.vehiclePosition.lastUpdateTime || predictedTime,
          };
        }
        // If we have vehicleId but no position, try to get it from trip details
        // This is a fallback - trip details might have more complete vehicle info
        else if (arrival.vehicleId && arrival.tripId) {
          // We'll fetch trip details separately if needed
          // For now, mark that we need to fetch trip details
          vehiclePosition = {
            needsTripDetails: true,
            vehicleId: arrival.vehicleId,
            tripId: arrival.tripId,
          };
        }

        return {
          routeId: arrival.routeId,
          routeShortName: arrival.routeShortName,
          tripId: arrival.tripId,
          tripHeadsign: arrival.tripHeadsign,
          scheduledArrivalTime: scheduledTime,
          predictedArrivalTime: predictedTime,
          predicted,
          minutesUntilArrival,
          delayMinutes,
          vehicleId: arrival.vehicleId,
          distanceFromStop: arrival.distanceFromStop,
          status,
          vehiclePosition, // Real vehicle position from API
        };
      });
    } catch (error) {
      console.error('Error fetching arrivals for stop:', stopId, error);
      // Return empty array instead of throwing to prevent app crashes
      // The error is already logged above
      return [];
    }
  }

  /**
   * Get stops near a location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} radius - Search radius in meters (default: 500, max: 5000)
   * @returns {Promise<Array>} Array of stop objects
   */
  async getStopsNearLocation(lat, lon, radius = 500) {
    try {
      // Clamp radius to max 5000 meters
      const clampedRadius = Math.min(radius, 5000);

      const data = await this._makeRequest(
        'stops-for-location.json',
        {
          lat,
          lon,
          radius: clampedRadius,
        },
        true,
        CACHE_DURATION.location
      );

      if (!data.data || !data.data.list) {
        return [];
      }

      return data.data.list.map((stop) => ({
        id: stop.id,
        name: stop.name,
        code: stop.code,
        lat: stop.lat,
        lon: stop.lon,
        direction: stop.direction,
        routeIds: stop.routeIds || [],
        locationType: stop.locationType,
      }));
    } catch (error) {
      console.error('Error fetching stops near location:', error);
      throw error;
    }
  }

  /**
   * Get trip details
   * @param {string} tripId - Trip ID in OneBusAway format
   * @returns {Promise<Object>} Trip details object
   */
  async getTripDetails(tripId) {
    try {
      const data = await this._makeRequest(
        `trip-details/${tripId}.json`,
        {},
        true,
        CACHE_DURATION.arrivals
      );

      if (!data.data || !data.data.entry) {
        // Don't throw for rate limits or missing data - return null instead
        if (data.code === 429 || (data.data && data.data.code === 429)) {
          console.debug('Rate limit for trip details - skipping');
          return null;
        }
        // For other invalid responses, return null instead of throwing
        // This prevents cascading errors
        console.debug('Invalid trip details response - missing entry data');
        return null;
      }

      return data.data.entry;
    } catch (error) {
      // Don't log errors for rate limits or expected failures
      // Only log unexpected errors at debug level
      if (error.message && !error.message.includes('429') && !error.message.includes('Rate limit')) {
        if (__DEV__) {
          console.debug('Error fetching trip details:', error.message);
        }
      }
      // Return null instead of throwing to prevent cascading errors
      return null;
    }
  }

  /**
   * Get vehicle location (real-time bus tracking) from trip details
   * @param {string} tripId - Trip ID in OneBusAway format
   * @returns {Promise<Object|null>} Vehicle position object with lat/lon/heading or null
   */
  async getVehicleForTrip(tripId) {
    try {
      const tripDetails = await this.getTripDetails(tripId);
      
      // If trip details returned null (rate limit, etc.), return null
      if (!tripDetails) {
        return null;
      }
      
      // Extract vehicle position from trip status
      if (tripDetails.status && tripDetails.status.position) {
        const pos = tripDetails.status.position;
        const status = tripDetails.status;
        
        // Get heading from orientation (OneBusAway uses orientation in degrees)
        // orientation is the direction the vehicle is facing (0-360 degrees)
        let heading = 0;
        if (status.orientation !== undefined && status.orientation !== null) {
          heading = status.orientation;
        } else if (status.lastKnownOrientation !== undefined && status.lastKnownOrientation !== null) {
          heading = status.lastKnownOrientation;
        }
        
        return {
          latitude: pos.lat,
          longitude: pos.lon,
          heading: heading,
          lastUpdateTime: status.lastUpdateTime || status.lastLocationUpdateTime || Date.now(),
        };
      }
      
      return null;
    } catch (error) {
      // Don't log errors - they're expected (rate limits, network issues, etc.)
      // getTripDetails already handles error logging at appropriate levels
      // Only log unexpected errors at debug level
      if (__DEV__ && error.message && !error.message.includes('429') && !error.message.includes('Rate limit')) {
        console.debug('Error fetching vehicle for trip:', error.message);
      }
      return null;
    }
  }

  /**
   * Get all vehicles (buses) currently running on a route with REAL-TIME positions
   * Uses arrivals data to extract actual vehicle positions from OneBusAway API
   * @param {string} routeId - Route ID in OneBusAway format (e.g., "1_100275")
   * @param {Array} stops - Array of stop IDs to check for vehicles
   * @returns {Promise<Array>} Array of vehicle position objects with real GPS coordinates
   */
  async getVehiclesForRoute(routeId, stops = [], options = {}) {
    try {
      // OPTIMIZATION: Use vehiclePosition from arrivals response instead of separate trip detail calls
      // This reduces API calls from ~15 per update to ~3-5 per update (67-80% reduction!)
      const vehicles = new Map(); // Use Map to deduplicate by vehicleId

      // OPTIMIZATION: Prioritize followed vehicle with faster updates
      const { priorityVehicleId } = options;
      
      // Sample a few stops along the route (or use provided stops)
      // If following a specific vehicle, we can check fewer stops (it's already visible)
      const maxStops = priorityVehicleId ? 2 : 3; // Fewer stops if following a vehicle
      const stopsToCheck = stops.length > 0 
        ? stops.slice(0, Math.min(maxStops, stops.length))
        : [];

      if (stopsToCheck.length === 0) {
        return [];
      }

      // OPTIMIZATION: Stagger stop requests to spread API calls over time
      // This prevents all requests from hitting at once (reduces rate limit risk)
      for (let i = 0; i < stopsToCheck.length; i++) {
        const stop = stopsToCheck[i];
        
        // Stagger requests: wait 100ms between each stop request
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          const stopId = typeof stop === 'string' ? stop : (stop.stop_id || stop.id);
          if (!stopId) continue;

          const obaStopId = stopId.includes('_') ? stopId : `1_${stopId}`;
          
          // OPTIMIZATION: Use shorter cache TTL if following a vehicle (fresher data)
          const cacheTTL = priorityVehicleId ? 3000 : 5000; // 3s if following, 5s otherwise
          
          const arrivals = await this.getArrivalsForStop(obaStopId, {
            minutesAfter: 30,
            useCache: true,
            cacheTTL, // Dynamic cache TTL based on priority
          });

          // Extract vehicle positions directly from arrivals (no trip detail calls needed!)
          for (const arrival of arrivals) {
            // Only include vehicles for this route
            if (arrival.routeId === routeId && arrival.vehicleId) {
              const vehicleId = arrival.vehicleId;
              const isPriorityVehicle = priorityVehicleId === vehicleId;
              
              // OPTIMIZATION: Prioritize followed vehicle - always update it, even if data is slightly older
              // For other vehicles, only update if data is newer
              const existing = vehicles.get(vehicleId);
              
              // Use vehiclePosition from arrival if available (most efficient)
              if (arrival.vehiclePosition && arrival.vehiclePosition.latitude && arrival.vehiclePosition.longitude) {
                const newUpdateTime = arrival.vehiclePosition.lastUpdateTime || arrival.predictedArrivalTime;
                
                // Update if: priority vehicle, new vehicle, or newer data
                const shouldUpdate = isPriorityVehicle || 
                                    !existing || 
                                    newUpdateTime > existing.lastUpdateTime;
                
                if (shouldUpdate) {
                  vehicles.set(vehicleId, {
                    vehicleId: vehicleId,
                    tripId: arrival.tripId,
                    routeId: arrival.routeId,
                    latitude: arrival.vehiclePosition.latitude,
                    longitude: arrival.vehiclePosition.longitude,
                    heading: arrival.vehiclePosition.heading || 0,
                    lastUpdateTime: newUpdateTime,
                    distanceFromStop: arrival.distanceFromStop,
                    isPriority: isPriorityVehicle, // Mark priority vehicle
                  });
                }
              }
              // Fallback: If vehiclePosition not in arrival, try trip details (rare case)
              // ONLY fetch trip details for priority vehicles (followed vehicles) to avoid rate limits
              // For other vehicles, skip if no position data - they'll appear in next update
              else if (arrival.tripId && isPriorityVehicle && !vehicles.has(vehicleId)) {
                // Only fetch trip details for priority vehicles (followed vehicles)
                // This is a last resort to get position for a vehicle the user is actively tracking
                try {
                  const tripVehicle = await this.getVehicleForTrip(arrival.tripId);
                  if (tripVehicle && tripVehicle.latitude && tripVehicle.longitude) {
                    vehicles.set(arrival.vehicleId, {
                      vehicleId: arrival.vehicleId,
                      tripId: arrival.tripId,
                      routeId: arrival.routeId,
                      latitude: tripVehicle.latitude,
                      longitude: tripVehicle.longitude,
                      heading: tripVehicle.heading || 0,
                      lastUpdateTime: tripVehicle.lastUpdateTime || arrival.predictedArrivalTime,
                      distanceFromStop: arrival.distanceFromStop,
                      isPriority: isPriorityVehicle,
                    });
                  }
                } catch (tripError) {
                  // Silently skip if trip details fail (rate limit, network error, etc.)
                  // This is expected - we'll use cached data or try again later
                  // Only log at debug level to avoid noise
                  if (__DEV__) {
                    console.debug(`Trip details not available for priority vehicle ${arrival.tripId}:`, tripError.message);
                  }
                }
              }
              // For non-priority vehicles without position, skip them (they'll appear in next update with position)
              // This prevents unnecessary API calls that cause rate limits
            }
          }
        } catch (error) {
          console.warn(`Error getting arrivals for stop ${stop} to find vehicles:`, error);
          // Continue with other stops
        }
      }

      const vehicleArray = Array.from(vehicles.values()).filter(v => v.latitude && v.longitude);
      return vehicleArray;
    } catch (error) {
      console.warn('Error fetching vehicles for route:', routeId, error);
      return [];
    }
  }

  /**
   * Get service alerts for a route
   * @param {string} routeId - Route ID in OneBusAway format (e.g., "1_100275")
   * @returns {Promise<Array>} Array of service alert objects
   */
  async getAlertsForRoute(routeId) {
    try {
      const data = await this._makeRequest(
        `route/${routeId}.json`,
        {},
        true,
        CACHE_DURATION.alerts
      );

      if (!data.data || !data.data.references) {
        return [];
      }

      const situations = data.data.references.situations || [];

      return situations.map((situation) => {
        const activePeriods = situation.activePeriod || [];
        const informedEntities = situation.informedEntity || [];

        return {
          id: situation.id,
          activePeriod: activePeriods.map((period) => ({
            start: period.start * 1000, // Convert to milliseconds
            end: period.end ? period.end * 1000 : undefined,
          })),
          affectedRoutes: informedEntities
            .filter((entity) => entity.routeId)
            .map((entity) => entity.routeId),
          affectedStops: informedEntities
            .filter((entity) => entity.stopId)
            .map((entity) => entity.stopId),
          header: situation.headerText?.translation?.[0]?.text || '',
          description: situation.descriptionText?.translation?.[0]?.text || '',
          url: situation.url?.translation?.[0]?.text,
          severity: situation.severity || 'info',
          effect: situation.effect,
        };
      });
    } catch (error) {
      console.error('Error fetching alerts for route:', error);
      return [];
    }
  }

  /**
   * Get route information
   * @param {string} routeId - Route ID in OneBusAway format
   * @returns {Promise<Object>} Route information object
   */
  async getRouteInfo(routeId) {
    try {
      const data = await this._makeRequest(
        `route/${routeId}.json`,
        {},
        true,
        CACHE_DURATION.alerts
      );

      if (!data.data || !data.data.entry) {
        throw new Error('Invalid route info response');
      }

      return data.data.entry;
    } catch (error) {
      console.error('Error fetching route info:', error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific endpoint or all cache
   * @param {string} endpoint - Optional endpoint to clear (clears all if not provided)
   */
  clearCache(endpoint = null) {
    if (endpoint) {
      // Clear specific endpoint cache
      const keysToDelete = [];
      for (const key of cache.keys()) {
        if (key.startsWith(endpoint)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => cache.delete(key));
      console.log(`Cleared cache for ${endpoint}`);
    } else {
      // Clear all cache
      cache.clear();
      console.log('Cleared all OneBusAway cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  }
}

export default new OneBusAwayService();

