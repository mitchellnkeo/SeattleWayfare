/**
 * Trip Routing Service
 * Multi-modal trip planning (walking + transit + walking)
 * Similar to Google Maps transit routing
 */

import locationService from '../location/locationService';
import metroService from '../gtfs/metroService';
import obaService from '../onebusaway/obaService';
import reliabilityService from '../reliability/reliabilityService';
import geocodingService from '../geocoding/geocodingService';

// Average walking speed: 5 km/h = 1.39 m/s = 83.4 m/min
const WALKING_SPEED_M_PER_MIN = 83.4;

class TripRoutingService {
  /**
   * Find nearest transit stop to a location
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} maxDistanceMeters - Maximum distance to search (default: 1000m)
   * @returns {Promise<Object|null>} Nearest stop with distance, or null
   */
  async findNearestStop(lat, lon, maxDistanceMeters = 1000) {
    try {
      await metroService.initialize();
      const allStops = metroService.stops || [];
      
      const nearbyStops = locationService.findNearbyStops(
        lat,
        lon,
        allStops,
        maxDistanceMeters
      );

      if (nearbyStops.length === 0) {
        return null;
      }

      return nearbyStops[0]; // Already sorted by distance
    } catch (error) {
      console.error('Error finding nearest stop:', error);
      return null;
    }
  }

  /**
   * Calculate walking time and distance between two points
   * @param {number} lat1 - Origin latitude
   * @param {number} lon1 - Origin longitude
   * @param {number} lat2 - Destination latitude
   * @param {number} lon2 - Destination longitude
   * @returns {Object} {distance: meters, duration: minutes}
   */
  calculateWalkingLeg(lat1, lon1, lat2, lon2) {
    const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);
    const duration = Math.ceil(distance / WALKING_SPEED_M_PER_MIN);
    
    return {
      distance: Math.round(distance),
      duration, // minutes
      mode: 'WALK',
    };
  }

  /**
   * Plan a trip from origin to destination
   * Supports addresses, stops, or coordinates
   * @param {Object} origin - {address, lat, lon, stopId, stop}
   * @param {Object} destination - {address, lat, lon, stopId, stop}
   * @param {Object} options - {mode: 'fast'|'safe', maxWalkingDistance: 1000}
   * @returns {Promise<Array>} Array of itinerary options
   */
  async planTrip(origin, destination, options = {}) {
    const {
      mode = 'fast',
      maxWalkingDistance = 1000, // meters
      maxResults = 5,
    } = options;

    try {
      // Step 1: Resolve origin location
      const originLocation = await this._resolveLocation(origin);
      if (!originLocation) {
        throw new Error('Could not resolve origin location');
      }

      // Step 2: Resolve destination location
      const destLocation = await this._resolveLocation(destination);
      if (!destLocation) {
        throw new Error('Could not resolve destination location');
      }

      // Step 3: Find nearest stops
      const originStop = await this.findNearestStop(
        originLocation.lat,
        originLocation.lon,
        maxWalkingDistance
      );
      const destStop = await this.findNearestStop(
        destLocation.lat,
        destLocation.lon,
        maxWalkingDistance
      );

      if (!originStop) {
        throw new Error(`No transit stops found within ${maxWalkingDistance}m of origin`);
      }
      if (!destStop) {
        throw new Error(`No transit stops found within ${maxWalkingDistance}m of destination`);
      }

      // Step 4: Calculate walking legs
      const walkToOriginStop = this.calculateWalkingLeg(
        originLocation.lat,
        originLocation.lon,
        originStop.stop_lat || originStop.lat,
        originStop.stop_lon || originStop.lon
      );
      const walkFromDestStop = this.calculateWalkingLeg(
        destStop.stop_lat || destStop.lat,
        destStop.stop_lon || destStop.lon,
        destLocation.lat,
        destLocation.lon
      );

      // Step 5: Find transit routes between stops
      const transitOptions = await this._findTransitRoutes(
        originStop,
        destStop,
        mode
      );

      // Step 6: Build complete itineraries
      const itineraries = transitOptions.map((transitOption, index) => {
        const totalWalkTime = walkToOriginStop.duration + walkFromDestStop.duration;
        const totalTransitTime = transitOption.duration || 30;
        const totalDuration = totalWalkTime + totalTransitTime + (transitOption.waitTime || 5);

        return {
          id: `itinerary-${index + 1}`,
          startTime: Date.now() + (walkToOriginStop.duration + (transitOption.waitTime || 5)) * 60000,
          endTime: Date.now() + totalDuration * 60000,
          duration: totalDuration,
          walkTime: totalWalkTime,
          transitTime: totalTransitTime,
          waitingTime: transitOption.waitTime || 5,
          legs: [
            {
              mode: 'WALK',
              duration: walkToOriginStop.duration,
              distance: walkToOriginStop.distance,
              from: {
                lat: originLocation.lat,
                lon: originLocation.lon,
                address: originLocation.address,
              },
              to: {
                lat: originStop.stop_lat || originStop.lat,
                lon: originStop.stop_lon || originStop.lon,
                name: originStop.stop_name || originStop.name,
              },
            },
            ...transitOption.legs,
            {
              mode: 'WALK',
              duration: walkFromDestStop.duration,
              distance: walkFromDestStop.distance,
              from: {
                lat: destStop.stop_lat || destStop.lat,
                lon: destStop.stop_lon || destStop.lon,
                name: destStop.stop_name || destStop.name,
              },
              to: {
                lat: destLocation.lat,
                lon: destLocation.lon,
                address: destLocation.address,
              },
            },
          ],
          overallReliability: transitOption.reliability || 'medium',
          transferRisks: transitOption.transferRisks || [],
          rank: index + 1,
        };
      });

      // Sort by mode preference
      if (mode === 'safe') {
        itineraries.sort((a, b) => {
          const reliabilityOrder = { high: 3, medium: 2, low: 1 };
          const aRel = typeof a.overallReliability === 'string' 
            ? a.overallReliability 
            : a.overallReliability?.reliability || 'medium';
          const bRel = typeof b.overallReliability === 'string' 
            ? b.overallReliability 
            : b.overallReliability?.reliability || 'medium';
          return (
            (reliabilityOrder[bRel] || 2) - (reliabilityOrder[aRel] || 2) ||
            (a.transferRisks?.length || 0) - (b.transferRisks?.length || 0) ||
            a.duration - b.duration
          );
        });
      } else {
        itineraries.sort((a, b) => a.duration - b.duration);
      }

      return itineraries.slice(0, maxResults);
    } catch (error) {
      console.error('Error planning trip:', error);
      throw error;
    }
  }

  /**
   * Resolve a location from various input types
   * @private
   * @param {Object} location - {address, lat, lon, stopId, stop}
   * @returns {Promise<Object>} {lat, lon, address}
   */
  async _resolveLocation(location) {
    // If coordinates provided, use them
    if (location.lat && location.lon) {
      return {
        lat: location.lat,
        lon: location.lon,
        address: location.address || await geocodingService.reverseGeocode(location.lat, location.lon),
      };
    }

    // If stop provided, use stop coordinates
    if (location.stop) {
      const stop = location.stop;
      return {
        lat: stop.stop_lat || stop.lat,
        lon: stop.stop_lon || stop.lon,
        address: stop.stop_name || stop.name,
      };
    }

    // If stopId provided, look up stop
    if (location.stopId) {
      await metroService.initialize();
      const stop = metroService.getStopById(location.stopId);
      if (stop) {
        return {
          lat: stop.stop_lat || stop.lat,
          lon: stop.stop_lon || stop.lon,
          address: stop.stop_name || stop.name,
        };
      }
    }

    // If address provided, geocode it
    if (location.address) {
      const geocoded = await geocodingService.geocodeAddress(location.address);
      if (geocoded) {
        return {
          lat: geocoded.latitude,
          lon: geocoded.longitude,
          address: geocoded.formattedAddress || location.address,
        };
      }
    }

    return null;
  }

  /**
   * Find transit routes between two stops
   * @private
   * @param {Object} originStop - Origin stop object
   * @param {Object} destStop - Destination stop object
   * @param {string} mode - 'fast' or 'safe'
   * @returns {Promise<Array>} Array of transit route options
   */
  async _findTransitRoutes(originStop, destStop, mode) {
    try {
      // Get routes serving each stop
      const originRoutes = await metroService.getRoutesForStop(originStop.stop_id);
      const destRoutes = await metroService.getRoutesForStop(destStop.stop_id);

      if (originRoutes.length === 0 || destRoutes.length === 0) {
        return [];
      }

      const options = [];

      // Option 1: Direct route (same route serves both stops)
      const directRoutes = originRoutes.filter((route) =>
        destRoutes.some((dr) => dr.route_id === route.route_id)
      );

      for (const route of directRoutes.slice(0, 2)) {
        const reliability = reliabilityService.getRouteReliability(route.route_id) || {
          reliability: 'medium',
          onTimePerformance: 0.7,
          averageDelayMinutes: 5,
        };

        // Estimate transit time (simplified - would use actual trip data in production)
        const estimatedTime = 30; // minutes

        options.push({
          duration: estimatedTime,
          waitTime: 5,
          legs: [
            {
              mode: 'BUS',
              routeId: route.route_id,
              routeShortName: route.route_short_name,
              routeLongName: route.route_long_name,
              headsign: destStop.stop_name || 'Destination',
              duration: estimatedTime,
              reliability,
              fromStop: originStop,
              toStop: destStop,
            },
          ],
          reliability: reliability.reliability,
          transferRisks: [],
        });
      }

      // Option 2: Transfer routes (if no direct route or we want alternatives)
      if (directRoutes.length === 0 || options.length < 2) {
        const transferOptions = this._findTransferRoutes(
          originRoutes,
          destRoutes,
          originStop,
          destStop
        );
        options.push(...transferOptions);
      }

      return options;
    } catch (error) {
      console.error('Error finding transit routes:', error);
      return [];
    }
  }

  /**
   * Find routes with transfers
   * @private
   */
  _findTransferRoutes(originRoutes, destRoutes, originStop, destStop) {
    const options = [];
    
    // Simple transfer logic: find a common stop between routes
    // In production, this would use actual route shapes and stop sequences
    if (originRoutes.length > 0 && destRoutes.length > 0) {
      const route1 = originRoutes[0];
      const route2 = destRoutes[0];
      
      const route1Reliability = reliabilityService.getRouteReliability(route1.route_id) || {
        reliability: 'medium',
        onTimePerformance: 0.7,
        averageDelayMinutes: 5,
      };
      const route2Reliability = reliabilityService.getRouteReliability(route2.route_id) || {
        reliability: 'medium',
        onTimePerformance: 0.7,
        averageDelayMinutes: 5,
      };

      const leg1Duration = 20;
      const leg2Duration = 15;
      const transferTime = 5;
      const totalDuration = leg1Duration + transferTime + leg2Duration;

      // Calculate transfer risk
      const firstArrival = {
        routeId: route1.route_id,
        predictedArrivalTime: Date.now() + (5 + leg1Duration) * 60000,
        scheduledArrivalTime: Date.now() + (5 + leg1Duration) * 60000,
      };
      const secondDeparture = {
        scheduledDepartureTime: Date.now() + (5 + leg1Duration + transferTime) * 60000,
      };

      const transferRisk = reliabilityService.calculateTransferRisk(
        firstArrival,
        secondDeparture,
        2
      );

      options.push({
        duration: totalDuration,
        waitTime: 5,
        legs: [
          {
            mode: 'BUS',
            routeId: route1.route_id,
            routeShortName: route1.route_short_name,
            routeLongName: route1.route_long_name,
            headsign: 'Transfer Point',
            duration: leg1Duration,
            reliability: route1Reliability,
            fromStop: originStop,
            toStop: null, // Transfer stop
          },
          {
            mode: 'BUS',
            routeId: route2.route_id,
            routeShortName: route2.route_short_name,
            routeLongName: route2.route_long_name,
            headsign: destStop.stop_name || 'Destination',
            duration: leg2Duration,
            reliability: route2Reliability,
            fromStop: null, // Transfer stop
            toStop: destStop,
          },
        ],
        reliability: route1Reliability.reliability === 'high' && route2Reliability.reliability === 'high' 
          ? 'high' 
          : route1Reliability.reliability === 'low' || route2Reliability.reliability === 'low'
          ? 'low'
          : 'medium',
        transferRisks: [transferRisk],
      });
    }

    return options;
  }
}

export default new TripRoutingService();

