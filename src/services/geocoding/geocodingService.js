/**
 * Geocoding Service
 * Converts addresses to coordinates and vice versa
 * Uses Expo Location geocoding API
 */

import * as Location from 'expo-location';

class GeocodingService {
  /**
   * Geocode an address to coordinates
   * @param {string} address - Address string (e.g., "123 Main St, Seattle, WA")
   * @returns {Promise<Object|null>} Location object with lat/lon or null
   */
  async geocodeAddress(address) {
    try {
      if (!address || address.trim().length === 0) {
        return null;
      }

      const results = await Location.geocodeAsync(address);
      
      if (results && results.length > 0) {
        const location = results[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.name || address,
          formattedAddress: location.formattedAddress || address,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<string|null>} Address string or null
   */
  async reverseGeocode(lat, lon) {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      if (results && results.length > 0) {
        const address = results[0];
        // Format address
        const parts = [];
        if (address.streetNumber) parts.push(address.streetNumber);
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.postalCode) parts.push(address.postalCode);

        return parts.length > 0 ? parts.join(', ') : null;
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Check if a string looks like an address (vs a stop name)
   * Simple heuristic: addresses typically contain numbers or common address words
   * @param {string} query - Input string
   * @returns {boolean} True if likely an address
   */
  looksLikeAddress(query) {
    if (!query) return false;
    
    const lowerQuery = query.toLowerCase();
    
    // Contains numbers (street numbers)
    if (/\d/.test(query)) return true;
    
    // Contains common address words
    const addressWords = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd', 'drive', 'dr', 'lane', 'ln', 'way', 'place', 'pl', 'court', 'ct'];
    if (addressWords.some(word => lowerQuery.includes(word))) return true;
    
    // Contains zip code pattern
    if (/\b\d{5}(-\d{4})?\b/.test(query)) return true;
    
    return false;
  }
}

export default new GeocodingService();

