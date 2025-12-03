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
      } = options;

      const data = await this._makeRequest(
        `arrivals-and-departures-for-stop/${stopId}.json`,
        {
          minutesBefore,
          minutesAfter,
        },
        useCache,
        CACHE_DURATION.arrivals
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
        throw new Error('Invalid trip details response');
      }

      return data.data.entry;
    } catch (error) {
      console.error('Error fetching trip details:', error);
      throw error;
    }
  }

  /**
   * Get vehicle location (real-time bus tracking)
   * @param {string} tripId - Trip ID in OneBusAway format
   * @returns {Promise<Object|null>} Vehicle position object or null
   */
  async getVehicleForTrip(tripId) {
    try {
      const tripDetails = await this.getTripDetails(tripId);
      return tripDetails.status?.position || null;
    } catch (error) {
      console.error('Error fetching vehicle for trip:', error);
      return null;
    }
  }

  /**
   * Get all vehicles (buses) currently running on a route
   * Uses arrivals data to extract vehicle positions (more reliable than vehicles-for-route endpoint)
   * @param {string} routeId - Route ID in OneBusAway format (e.g., "1_100275")
   * @param {Array} stops - Array of stop IDs to check for vehicles
   * @returns {Promise<Array>} Array of vehicle position objects
   */
  async getVehiclesForRoute(routeId, stops = []) {
    try {
      // Strategy: Get arrivals from multiple stops on the route to find active vehicles
      // This is more reliable than the vehicles-for-route endpoint which may not be available
      const vehicles = new Map(); // Use Map to deduplicate by vehicleId

      // Sample a few stops along the route (or use provided stops)
      const stopsToCheck = stops.length > 0 
        ? stops.slice(0, Math.min(5, stops.length)) // Check up to 5 stops
        : [];

      if (stopsToCheck.length === 0) {
        // If no stops provided, try to get vehicles from route info
        // For now, return empty array - we'll enhance this later
        return [];
      }

      // Get arrivals from multiple stops to find active vehicles
      for (const stop of stopsToCheck) {
        try {
          const stopId = typeof stop === 'string' ? stop : (stop.stop_id || stop.id);
          if (!stopId) continue;

          const obaStopId = stopId.includes('_') ? stopId : `1_${stopId}`;
          const arrivals = await this.getArrivalsForStop(obaStopId, {
            minutesAfter: 30,
            useCache: false, // Don't cache for real-time vehicle tracking
          });

          // Extract vehicle positions from arrivals
          arrivals.forEach((arrival) => {
            // Only include vehicles for this route
            if (arrival.routeId === routeId && arrival.vehicleId && arrival.distanceFromStop !== undefined) {
              // If we have distance from stop, we can estimate position
              // For now, we'll use the stop position as a proxy
              // In a full implementation, we'd calculate the vehicle position based on distance and heading
              if (!vehicles.has(arrival.vehicleId)) {
                const stopObj = typeof stop === 'object' ? stop : null;
                vehicles.set(arrival.vehicleId, {
                  vehicleId: arrival.vehicleId,
                  tripId: arrival.tripId,
                  routeId: arrival.routeId,
                  // Use stop position as proxy (would need actual vehicle position from API)
                  latitude: stopObj?.stop_lat || stopObj?.lat || null,
                  longitude: stopObj?.stop_lon || stopObj?.lon || null,
                  heading: 0, // Would need from API
                  distanceFromStop: arrival.distanceFromStop,
                  lastUpdateTime: arrival.predictedArrivalTime,
                });
              }
            }
          });
        } catch (error) {
          console.warn(`Error getting arrivals for stop ${stop} to find vehicles:`, error);
          // Continue with other stops
        }
      }

      return Array.from(vehicles.values()).filter(v => v.latitude && v.longitude);
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

