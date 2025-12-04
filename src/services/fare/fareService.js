/**
 * Fare Service
 * Provides fare information for transit routes
 * Based on King County Metro and Sound Transit fare structures
 */

/**
 * King County Metro Fare Structure (as of 2024)
 * - Adult: $2.75 (flat fare)
 * - Reduced (Senior/Disabled/Low-Income): $1.00
 * - Youth (6-18): Free
 * - ORCA card discounts available
 */
const METRO_FARES = {
  adult: 2.75,
  reduced: 1.00,
  youth: 0.00, // Free for youth 6-18
  orca: 2.50, // ORCA card discount
};

/**
 * Sound Transit Fare Structure (as of 2024)
 * - Distance-based for Link Light Rail
 * - Flat fare for buses
 */
const SOUND_TRANSIT_FARES = {
  link: {
    // Distance-based: $2.25 - $3.50
    // Short trips (1-2 zones): $2.25
    // Medium trips (3-4 zones): $2.75
    // Long trips (5+ zones): $3.50
    short: 2.25,
    medium: 2.75,
    long: 3.50,
    reduced: {
      short: 1.00,
      medium: 1.00,
      long: 1.00,
    },
  },
  bus: {
    adult: 2.75,
    reduced: 1.00,
    youth: 0.00,
  },
};

/**
 * Route type mapping
 * Determines fare structure based on route characteristics
 */
const ROUTE_TYPES = {
  BUS: 'bus',
  RAPIDRIDE: 'rapidride', // RapidRide uses same fare as regular bus
  LINK: 'link', // Link Light Rail
  STREETCAR: 'streetcar',
  FERRY: 'ferry',
};

class FareService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the fare service
   */
  async initialize() {
    this.initialized = true;
    return true;
  }

  /**
   * Get fare for a route
   * @param {string} routeId - Route ID
   * @param {string} routeShortName - Route short name (e.g., "8", "E Line", "1-Line")
   * @param {string} routeType - Route type from GTFS (0-7)
   * @param {Object} options - Fare options
   * @param {string} options.fareType - 'adult', 'reduced', 'youth', 'orca'
   * @param {number} options.distance - Distance in miles (for distance-based fares)
   * @returns {Object} Fare information
   */
  getFare(routeId, routeShortName, routeType = null, options = {}) {
    const { fareType = 'adult', distance = null } = options;

    // Determine route category
    const routeCategory = this._categorizeRoute(routeShortName, routeType);

    // Get base fare
    let baseFare = this._getBaseFare(routeCategory, fareType, distance);

    return {
      amount: baseFare,
      currency: 'USD',
      fareType,
      routeCategory,
      displayText: this._formatFare(baseFare),
      details: this._getFareDetails(routeCategory, fareType),
    };
  }

  /**
   * Categorize route based on name and type
   * @private
   */
  _categorizeRoute(routeShortName, routeType) {
    if (!routeShortName) return ROUTE_TYPES.BUS;

    const routeName = routeShortName.toLowerCase();

    // Link Light Rail
    if (routeName.includes('line') && (routeName.includes('1') || routeName.includes('2'))) {
      return ROUTE_TYPES.LINK;
    }

    // RapidRide (A, B, C, D, E, F, G, H, J, K Lines)
    if (routeName.match(/^[a-k]\s*line$/i) || routeName.includes('rapidride')) {
      return ROUTE_TYPES.RAPIDRIDE;
    }

    // Streetcar
    if (routeName.includes('streetcar') || routeType === 0) {
      return ROUTE_TYPES.STREETCAR;
    }

    // Default to bus
    return ROUTE_TYPES.BUS;
  }

  /**
   * Get base fare for route category
   * @private
   */
  _getBaseFare(routeCategory, fareType, distance) {
    switch (routeCategory) {
      case ROUTE_TYPES.LINK:
        // Link Light Rail: distance-based
        if (distance) {
          if (distance <= 2) {
            return fareType === 'reduced'
              ? SOUND_TRANSIT_FARES.link.reduced.short
              : SOUND_TRANSIT_FARES.link.short;
          } else if (distance <= 4) {
            return fareType === 'reduced'
              ? SOUND_TRANSIT_FARES.link.reduced.medium
              : SOUND_TRANSIT_FARES.link.medium;
          } else {
            return fareType === 'reduced'
              ? SOUND_TRANSIT_FARES.link.reduced.long
              : SOUND_TRANSIT_FARES.link.long;
          }
        }
        // Default to medium distance if not specified
        return fareType === 'reduced'
          ? SOUND_TRANSIT_FARES.link.reduced.medium
          : SOUND_TRANSIT_FARES.link.medium;

      case ROUTE_TYPES.RAPIDRIDE:
      case ROUTE_TYPES.BUS:
        // King County Metro and Sound Transit buses: flat fare
        if (fareType === 'orca') {
          return METRO_FARES.orca;
        }
        if (fareType === 'reduced') {
          return METRO_FARES.reduced;
        }
        if (fareType === 'youth') {
          return METRO_FARES.youth;
        }
        return METRO_FARES.adult;

      case ROUTE_TYPES.STREETCAR:
        // Streetcar: same as bus
        if (fareType === 'orca') {
          return METRO_FARES.orca;
        }
        if (fareType === 'reduced') {
          return METRO_FARES.reduced;
        }
        if (fareType === 'youth') {
          return METRO_FARES.youth;
        }
        return METRO_FARES.adult;

      default:
        return METRO_FARES.adult;
    }
  }

  /**
   * Format fare amount for display
   * @private
   */
  _formatFare(amount) {
    if (amount === 0) {
      return 'Free';
    }
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Get fare details/notes
   * @private
   */
  _getFareDetails(routeCategory, fareType) {
    const details = [];

    if (routeCategory === ROUTE_TYPES.LINK) {
      details.push('Distance-based fare');
      if (fareType === 'reduced') {
        details.push('Reduced fare: $1.00');
      }
    } else {
      details.push('Flat fare');
      if (fareType === 'orca') {
        details.push('ORCA card discount');
      } else if (fareType === 'reduced') {
        details.push('Senior/Disabled/Low-Income');
      } else if (fareType === 'youth') {
        details.push('Youth 6-18 ride free');
      }
    }

    return details;
  }

  /**
   * Get all fare options for a route
   * @param {string} routeId - Route ID
   * @param {string} routeShortName - Route short name
   * @param {string} routeType - Route type
   * @returns {Array} Array of fare options
   */
  getAllFareOptions(routeId, routeShortName, routeType = null) {
    const fareTypes = ['adult', 'reduced', 'youth', 'orca'];
    return fareTypes.map((fareType) => ({
      type: fareType,
      ...this.getFare(routeId, routeShortName, routeType, { fareType }),
    }));
  }
}

export default new FareService();

