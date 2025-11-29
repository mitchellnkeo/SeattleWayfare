/**
 * Location Service
 * Handles user location tracking and permissions
 * Based on ROADMAP.md Phase 3.1
 */

import * as Location from 'expo-location';
import { SEATTLE_BOUNDS } from '../../utils/constants';

class LocationService {
  constructor() {
    this.watchSubscription = null;
    this.currentLocation = null;
    this.locationCallbacks = [];
  }

  /**
   * Request location permissions
   * @returns {Promise<boolean>} True if permissions granted
   */
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission denied');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   * @returns {Promise<boolean>} True if permissions granted
   */
  async hasPermissions() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location
   * @param {Object} options - Location options
   * @returns {Promise<Object|null>} Location object with lat, lon, accuracy, etc.
   */
  async getCurrentLocation(options = {}) {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return null;
        }
      }

      const locationOptions = {
        accuracy: Location.Accuracy.Balanced,
        ...options,
      };

      const location = await Location.getCurrentPositionAsync(locationOptions);

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };

      this.currentLocation = locationData;
      this._notifyCallbacks(locationData);

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start watching position updates
   * @param {Function} callback - Callback function to receive location updates
   * @param {Object} options - Watch options
   * @returns {Promise<boolean>} True if watching started successfully
   */
  async watchPosition(callback, options = {}) {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      // Add callback to list
      if (typeof callback === 'function') {
        this.locationCallbacks.push(callback);
      }

      // If already watching, just return
      if (this.watchSubscription) {
        return true;
      }

      const watchOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Update every 50 meters
        ...options,
      };

      this.watchSubscription = await Location.watchPositionAsync(
        watchOptions,
        (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };

          this.currentLocation = locationData;
          this._notifyCallbacks(locationData);
        }
      );

      console.log('📍 Started watching position');
      return true;
    } catch (error) {
      console.error('Error watching position:', error);
      return false;
    }
  }

  /**
   * Stop watching position updates
   */
  stopWatching() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      this.locationCallbacks = [];
      console.log('📍 Stopped watching position');
    }
  }

  /**
   * Remove a location callback
   * @param {Function} callback - Callback to remove
   */
  removeCallback(callback) {
    this.locationCallbacks = this.locationCallbacks.filter(
      (cb) => cb !== callback
    );
  }

  /**
   * Notify all callbacks of location update
   * @private
   */
  _notifyCallbacks(locationData) {
    this.locationCallbacks.forEach((callback) => {
      try {
        callback(locationData);
      } catch (error) {
        console.error('Error in location callback:', error);
      }
    });
  }

  /**
   * Get last known location
   * @returns {Object|null} Last known location or null
   */
  getLastKnownLocation() {
    return this.currentLocation;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if coordinates are within Seattle area
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} True if within Seattle bounds
   */
  isInSeattleArea(lat, lon) {
    return (
      lat >= SEATTLE_BOUNDS.lat.min &&
      lat <= SEATTLE_BOUNDS.lat.max &&
      lon >= SEATTLE_BOUNDS.lon.min &&
      lon <= SEATTLE_BOUNDS.lon.max
    );
  }

  /**
   * Find nearby stops within a radius
   * @param {number} lat - User latitude
   * @param {number} lon - User longitude
   * @param {Array} stops - Array of stop objects with lat/lon
   * @param {number} radiusMeters - Search radius in meters (default: 500)
   * @returns {Array} Array of stops sorted by distance
   */
  findNearbyStops(lat, lon, stops, radiusMeters = 500) {
    const nearbyStops = stops
      .map((stop) => {
        const distance = this.calculateDistance(
          lat,
          lon,
          stop.stop_lat || stop.lat,
          stop.stop_lon || stop.lon
        );
        return {
          ...stop,
          distance: Math.round(distance),
        };
      })
      .filter((stop) => stop.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);

    return nearbyStops;
  }
}

export default new LocationService();

