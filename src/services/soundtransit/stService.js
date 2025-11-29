/**
 * Sound Transit Service
 * Handles Link light rail service alerts and real-time data
 * Based on DATA_SOURCES.md and ROADMAP.md Phase 2.3
 */

import axios from 'axios';
import ENV from '../../config/env';
import { CACHE_DURATION } from '../../utils/constants';

const ST_ALERTS_URL = ENV.ST_ALERTS_URL;

// Cache for alerts
const alertsCache = {
  data: null,
  timestamp: null,
};

class SoundTransitService {
  /**
   * Get Link light rail service alerts
   * @param {Object} options - Options for the request
   * @returns {Promise<Array>} Array of service alert objects
   */
  async getLinkAlerts(options = {}) {
    try {
      const { useCache = true, filterActive = true } = options;

      // Check cache
      if (useCache && alertsCache.data && alertsCache.timestamp) {
        const cacheAge = Date.now() - alertsCache.timestamp;
        if (cacheAge < CACHE_DURATION.alerts) {
          console.log('📦 Using cached Sound Transit alerts');
          return filterActive
            ? this._filterActiveAlerts(alertsCache.data)
            : alertsCache.data;
        }
      }

      console.log('🌐 Fetching Sound Transit alerts...');

      // Fetch alerts
      const response = await axios.get(ST_ALERTS_URL, {
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || !response.data.entity) {
        console.warn('Invalid response from Sound Transit API');
        return [];
      }

      // Parse alerts
      const alerts = response.data.entity
        .filter((entity) => entity.alert) // Only entities with alerts
        .map((entity) => this._parseAlert(entity));

      // Cache the results
      alertsCache.data = alerts;
      alertsCache.timestamp = Date.now();

      console.log(`✅ Fetched ${alerts.length} Sound Transit alerts`);

      // Filter to only active alerts if requested
      return filterActive ? this._filterActiveAlerts(alerts) : alerts;
    } catch (error) {
      console.error('Error fetching Sound Transit alerts:', error);
      // Return cached data if available, even if stale
      if (alertsCache.data) {
        console.warn('Using stale cached alerts due to error');
        return filterActive
          ? this._filterActiveAlerts(alertsCache.data)
          : alertsCache.data;
      }
      return [];
    }
  }

  /**
   * Parse a single alert entity from Sound Transit API
   * Note: API uses snake_case (header_text, active_period, etc.)
   * @private
   */
  _parseAlert(entity) {
    const alert = entity.alert;
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    // Parse active periods (API uses snake_case: active_period)
    const activePeriods = (alert.active_period || []).map((period) => ({
      start: period.start * 1000, // Convert to milliseconds
      end: period.end ? period.end * 1000 : undefined,
    }));

    // Check if alert is currently active
    const isActive = activePeriods.some((period) => {
      const start = period.start / 1000;
      const end = period.end ? period.end / 1000 : Infinity;
      return now >= start && now <= end;
    });

    // Parse affected entities (API uses snake_case: informed_entity, route_id, stop_id)
    const informedEntities = alert.informed_entity || [];
    const affectedRoutes = informedEntities
      .filter((entity) => entity.route_id)
      .map((entity) => entity.route_id);
    const affectedStops = informedEntities
      .filter((entity) => entity.stop_id)
      .map((entity) => entity.stop_id);

    // Parse text translations (API uses snake_case: header_text, description_text)
    const headerText =
      alert.header_text?.translation?.find((t) => t.language === 'en')
        ?.text || '';
    const descriptionText =
      alert.description_text?.translation?.find((t) => t.language === 'en')
        ?.text || '';
    const urlText =
      alert.url?.translation?.find((t) => t.language === 'en')?.text || '';

    // Determine severity - check severity_level first, then fall back to effect
    let severity = 'info';
    if (alert.severity_level) {
      const level = alert.severity_level.toUpperCase();
      if (level === 'SEVERE' || level === 'CRITICAL') {
        severity = 'severe';
      } else if (level === 'WARNING') {
        severity = 'warning';
      }
    } else if (alert.effect === 'NO_SERVICE' || alert.effect === 'SIGNIFICANT_DELAYS') {
      severity = 'severe';
    } else if (
      alert.effect === 'REDUCED_SERVICE' ||
      alert.effect === 'DETOUR' ||
      alert.effect === 'ACCESSIBILITY_ISSUE'
    ) {
      severity = 'warning';
    }

    return {
      id: entity.id,
      header: headerText,
      description: descriptionText,
      url: urlText,
      activePeriod: activePeriods,
      affectedRoutes,
      affectedStops,
      severity,
      effect: alert.effect,
      severityLevel: alert.severity_level,
      isActive,
      cause: alert.cause,
    };
  }

  /**
   * Filter alerts to only those currently active
   * @private
   */
  _filterActiveAlerts(alerts) {
    return alerts.filter((alert) => alert.isActive);
  }

  /**
   * Get alerts affecting specific routes
   * @param {Array<string>} routeIds - Array of route IDs to check
   * @returns {Promise<Array>} Array of alerts affecting the routes
   */
  async getAlertsForRoutes(routeIds) {
    try {
      const allAlerts = await this.getLinkAlerts({ filterActive: true });
      return allAlerts.filter((alert) =>
        alert.affectedRoutes.some((routeId) => routeIds.includes(routeId))
      );
    } catch (error) {
      console.error('Error getting alerts for routes:', error);
      return [];
    }
  }

  /**
   * Get alerts affecting specific stops
   * @param {Array<string>} stopIds - Array of stop IDs to check
   * @returns {Promise<Array>} Array of alerts affecting the stops
   */
  async getAlertsForStops(stopIds) {
    try {
      const allAlerts = await this.getLinkAlerts({ filterActive: true });
      return allAlerts.filter((alert) =>
        alert.affectedStops.some((stopId) => stopIds.includes(stopId))
      );
    } catch (error) {
      console.error('Error getting alerts for stops:', error);
      return [];
    }
  }

  /**
   * Get alerts by severity
   * @param {string} severity - 'info' | 'warning' | 'severe'
   * @returns {Promise<Array>} Array of alerts with the specified severity
   */
  async getAlertsBySeverity(severity) {
    try {
      const allAlerts = await this.getLinkAlerts({ filterActive: true });
      return allAlerts.filter((alert) => alert.severity === severity);
    } catch (error) {
      console.error('Error getting alerts by severity:', error);
      return [];
    }
  }

  /**
   * Clear alerts cache
   */
  clearCache() {
    alertsCache.data = null;
    alertsCache.timestamp = null;
    console.log('Cleared Sound Transit alerts cache');
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    if (!alertsCache.timestamp) {
      return { cached: false };
    }

    const age = Date.now() - alertsCache.timestamp;
    const isValid = age < CACHE_DURATION.alerts;

    return {
      cached: true,
      age: Math.round(age / 1000), // Age in seconds
      isValid,
      alertCount: alertsCache.data ? alertsCache.data.length : 0,
    };
  }
}

export default new SoundTransitService();

