/**
 * Reliability Scoring Service
 * Provides reliability scores, transfer risk assessment, and delay predictions
 * Based on ROADMAP.md Phase 2.4 and DATA_SCHEMA.md
 */

import { RELIABILITY_THRESHOLDS, TRANSFER_RISK_THRESHOLDS } from '../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wayfare_reliability';
const STORAGE_UPDATED_KEY = '@wayfare_reliability_updated';

/**
 * Historical reliability data structure
 * Data sourced from King County Metro performance reports
 * Format: OneBusAway route IDs (e.g., "1_100275")
 */
const DEFAULT_ROUTE_RELIABILITY = {
  // Route 8: Notoriously unreliable
  '1_100275': {
    routeId: '1_100275',
    routeShortName: '8',
    onTimePerformance: 0.45, // 45% on-time
    averageDelayMinutes: 8,
    reliability: 'low',
    rushHourDelay: 12,
    weekendPerformance: 0.50,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  // Route 43: Moderately reliable
  '1_100223': {
    routeId: '1_100223',
    routeShortName: '43',
    onTimePerformance: 0.72,
    averageDelayMinutes: 3,
    reliability: 'medium',
    rushHourDelay: 5,
    weekendPerformance: 0.75,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  // RapidRide E Line: More reliable
  '1_100479': {
    routeId: '1_100479',
    routeShortName: 'E Line',
    onTimePerformance: 0.85,
    averageDelayMinutes: 2,
    reliability: 'high',
    rushHourDelay: 3,
    weekendPerformance: 0.88,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  // Route 2: Moderately reliable
  '1_100002': {
    routeId: '1_100002',
    routeShortName: '2',
    onTimePerformance: 0.68,
    averageDelayMinutes: 4,
    reliability: 'medium',
    rushHourDelay: 6,
    weekendPerformance: 0.70,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  // Route 5: Low reliability
  '1_100005': {
    routeId: '1_100005',
    routeShortName: '5',
    onTimePerformance: 0.55,
    averageDelayMinutes: 7,
    reliability: 'low',
    rushHourDelay: 10,
    weekendPerformance: 0.58,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  // Route 7: Medium reliability
  '1_100007': {
    routeId: '1_100007',
    routeShortName: '7',
    onTimePerformance: 0.70,
    averageDelayMinutes: 3.5,
    reliability: 'medium',
    rushHourDelay: 5,
    weekendPerformance: 0.72,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  // Link 1 Line: High reliability (light rail)
  '40_100479': {
    routeId: '40_100479',
    routeShortName: '1 Line',
    onTimePerformance: 0.92,
    averageDelayMinutes: 1,
    reliability: 'high',
    rushHourDelay: 1.5,
    weekendPerformance: 0.94,
    dataSource: '2024 Q3 Sound Transit Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
};

class ReliabilityService {
  constructor() {
    this.routeReliability = { ...DEFAULT_ROUTE_RELIABILITY };
    this.loaded = false;
  }

  /**
   * Initialize reliability data from storage
   */
  async initialize() {
    if (this.loaded) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults (stored data takes precedence)
        this.routeReliability = { ...DEFAULT_ROUTE_RELIABILITY, ...parsed };
        console.log('📊 Loaded reliability data from storage');
      } else {
        // Save defaults to storage
        await this.saveToStorage();
        console.log('📊 Initialized default reliability data');
      }
      this.loaded = true;
    } catch (error) {
      console.error('Error loading reliability data:', error);
      this.loaded = true; // Continue with defaults
    }
  }

  /**
   * Save reliability data to storage
   */
  async saveToStorage() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.routeReliability));
      await AsyncStorage.setItem(
        STORAGE_UPDATED_KEY,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('Error saving reliability data:', error);
    }
  }

  /**
   * Get reliability score for a route
   * @param {string} routeId - Route ID (OneBusAway format: "1_100275")
   * @returns {Object} Reliability score object
   */
  getRouteReliability(routeId) {
    if (!this.loaded) {
      console.warn('Reliability service not initialized. Call initialize() first.');
      return this._getDefaultReliability(routeId);
    }

    return this.routeReliability[routeId] || this._getDefaultReliability(routeId);
  }

  /**
   * Get default reliability for unknown routes
   * @private
   */
  _getDefaultReliability(routeId) {
    return {
      routeId,
      routeShortName: routeId.split('_')[1] || 'Unknown',
      onTimePerformance: 0.70, // Default assumption: 70% on-time
      averageDelayMinutes: 4,
      reliability: 'medium',
      rushHourDelay: 6,
      weekendPerformance: 0.72,
      dataSource: 'Default estimate',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Calculate transfer risk between two legs
   * @param {Object} firstArrival - First leg arrival prediction
   * @param {Object} secondDeparture - Second leg departure time
   * @param {number} walkingMinutes - Walking time between stops (default: 2)
   * @returns {Object} Transfer risk assessment
   */
  calculateTransferRisk(firstArrival, secondDeparture, walkingMinutes = 2) {
    const firstArrivalTime =
      firstArrival.predictedArrivalTime || firstArrival.scheduledArrivalTime;
    const bufferTime = firstArrivalTime + walkingMinutes * 60000; // Convert to ms

    const timeUntilConnection =
      secondDeparture.scheduledDepartureTime - bufferTime;
    const connectionMinutes = timeUntilConnection / 60000;

    // Factor in first leg reliability
    const firstLegReliability = this.getRouteReliability(firstArrival.routeId);
    const expectedDelay = firstLegReliability.averageDelayMinutes;

    // Adjust connection time based on expected delay
    const adjustedConnectionMinutes = connectionMinutes - expectedDelay;

    // Risk assessment based on TRANSFER_RISK_THRESHOLDS
    let risk, likelihood, recommendation;

    if (adjustedConnectionMinutes < TRANSFER_RISK_THRESHOLDS.dangerous) {
      risk = 'high';
      likelihood = 0.80;
      recommendation = `High risk: Only ${Math.round(
        adjustedConnectionMinutes
      )} min buffer. Consider leaving earlier or alternative route.`;
    } else if (
      adjustedConnectionMinutes < TRANSFER_RISK_THRESHOLDS.risky
    ) {
      risk = 'medium';
      likelihood = 0.40;
      recommendation = `Medium risk: ${Math.round(
        adjustedConnectionMinutes
      )} min buffer. Monitor first leg for delays.`;
    } else {
      risk = 'low';
      likelihood = 0.10;
      recommendation = `Low risk: ${Math.round(
        adjustedConnectionMinutes
      )} min buffer. Transfer should be safe.`;
    }

    return {
      risk,
      likelihood,
      connectionMinutes: Math.round(connectionMinutes * 10) / 10,
      adjustedConnectionMinutes: Math.round(adjustedConnectionMinutes * 10) / 10,
      expectedDelay,
      walkingMinutes,
      recommendation,
    };
  }

  /**
   * Predict if bus will be late based on time of day and route
   * @param {string} routeId - Route ID
   * @param {string} stopId - Stop ID (optional, for future stop-specific predictions)
   * @param {Date|number} timeOfDay - Time of day (Date object or timestamp)
   * @returns {Object} Delay prediction
   */
  predictDelay(routeId, stopId, timeOfDay) {
    const reliability = this.getRouteReliability(routeId);
    const date = timeOfDay instanceof Date ? timeOfDay : new Date(timeOfDay);

    // Rush hour factor (7-9am, 4-7pm)
    const hour = date.getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);

    // Weekend factor
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Calculate predicted delay
    let predictedDelay = reliability.averageDelayMinutes;
    if (isRushHour) {
      predictedDelay = reliability.rushHourDelay || predictedDelay * 1.5;
    }
    if (isWeekend && reliability.weekendPerformance) {
      // Weekend performance is typically better, so reduce delay slightly
      predictedDelay = predictedDelay * 0.9;
    }

    // Confidence based on on-time performance
    const confidence = reliability.onTimePerformance;

    return {
      expectedDelayMinutes: Math.round(predictedDelay * 10) / 10,
      confidence,
      isRushHour,
      isWeekend,
      reliability: reliability.reliability,
    };
  }

  /**
   * Calculate overall reliability score for an itinerary
   * @param {Array} legs - Array of itinerary legs
   * @returns {Object} Overall reliability assessment
   */
  calculateItineraryReliability(legs) {
    const transitLegs = legs.filter((leg) => leg.mode !== 'WALK');
    if (transitLegs.length === 0) {
      return {
        overallReliability: 'high',
        averageOnTimePerformance: 1.0,
        totalExpectedDelay: 0,
        transferRisks: [],
      };
    }

    // Calculate average on-time performance
    const reliabilities = transitLegs.map((leg) =>
      this.getRouteReliability(leg.routeId)
    );
    const avgOnTimePerformance =
      reliabilities.reduce((sum, r) => sum + r.onTimePerformance, 0) /
      reliabilities.length;

    // Determine overall reliability
    let overallReliability = 'medium';
    if (avgOnTimePerformance >= RELIABILITY_THRESHOLDS.high) {
      overallReliability = 'high';
    } else if (avgOnTimePerformance < RELIABILITY_THRESHOLDS.medium) {
      overallReliability = 'low';
    }

    // Calculate total expected delay
    const totalExpectedDelay = reliabilities.reduce(
      (sum, r) => sum + r.averageDelayMinutes,
      0
    );

    // Calculate transfer risks
    const transferRisks = [];
    for (let i = 0; i < transitLegs.length - 1; i++) {
      const firstLeg = transitLegs[i];
      const secondLeg = transitLegs[i + 1];
      // Find walking leg between them (if any)
      const walkingLeg = legs.find(
        (leg, idx) =>
          leg.mode === 'WALK' &&
          idx > legs.indexOf(firstLeg) &&
          idx < legs.indexOf(secondLeg)
      );
      const walkingMinutes = walkingLeg
        ? Math.round(walkingLeg.duration)
        : 2; // Default 2 min

      const risk = this.calculateTransferRisk(
        {
          routeId: firstLeg.routeId,
          predictedArrivalTime: firstLeg.endTime,
          scheduledArrivalTime: firstLeg.endTime,
        },
        {
          scheduledDepartureTime: secondLeg.startTime,
        },
        walkingMinutes
      );

      transferRisks.push({
        fromLegIndex: legs.indexOf(firstLeg),
        toLegIndex: legs.indexOf(secondLeg),
        ...risk,
      });
    }

    return {
      overallReliability,
      averageOnTimePerformance: Math.round(avgOnTimePerformance * 100) / 100,
      totalExpectedDelay: Math.round(totalExpectedDelay * 10) / 10,
      transferRisks,
      routeCount: transitLegs.length,
    };
  }

  /**
   * Update reliability data for a route
   * @param {string} routeId - Route ID
   * @param {Object} reliabilityData - New reliability data
   */
  async updateRouteReliability(routeId, reliabilityData) {
    this.routeReliability[routeId] = {
      ...this.getRouteReliability(routeId),
      ...reliabilityData,
      routeId,
      lastUpdated: new Date().toISOString(),
    };
    await this.saveToStorage();
  }

  /**
   * Get all known route reliabilities
   * @returns {Object} All route reliability data
   */
  getAllRouteReliabilities() {
    return { ...this.routeReliability };
  }

  /**
   * Get routes by reliability level
   * @param {string} level - 'high' | 'medium' | 'low'
   * @returns {Array} Array of route reliability objects
   */
  getRoutesByReliability(level) {
    return Object.values(this.routeReliability).filter(
      (r) => r.reliability === level
    );
  }
}

export default new ReliabilityService();

