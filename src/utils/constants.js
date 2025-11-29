/**
 * App-wide constants
 * Based on DATA_SCHEMA.md
 */

// Storage Keys
export const STORAGE_KEYS = {
  // User data
  SAVED_STOPS: '@wayfare_saved_stops',
  SAVED_COMMUTES: '@wayfare_saved_commutes',
  USER_PREFERENCES: '@wayfare_preferences',
  TRIP_HISTORY: '@wayfare_trip_history',

  // GTFS data
  GTFS_ROUTES: '@wayfare_gtfs_routes',
  GTFS_STOPS: '@wayfare_gtfs_stops',
  GTFS_TRIPS: '@wayfare_gtfs_trips',
  GTFS_STOP_TIMES: '@wayfare_gtfs_stop_times',
  GTFS_VERSION: '@wayfare_gtfs_version',
  GTFS_DOWNLOAD_DATE: '@wayfare_gtfs_download_date',

  // Reliability data
  RELIABILITY_SCORES: '@wayfare_reliability',
  RELIABILITY_UPDATED: '@wayfare_reliability_updated',

  // Cache
  CACHE_PREFIX: '@wayfare_cache_',
  LAST_LOCATION: '@wayfare_last_location',

  // App state
  ONBOARDING_COMPLETE: '@wayfare_onboarding',
  NOTIFICATIONS_PERMISSION: '@wayfare_notifications',
};

// Reliability Thresholds
export const RELIABILITY_THRESHOLDS = {
  high: 0.8, // >= 80% on-time
  medium: 0.6, // 60-79% on-time
  low: 0.6, // < 60% on-time
};

// Transfer Risk Thresholds
export const TRANSFER_RISK_THRESHOLDS = {
  safe: 5, // >= 5 min buffer = low risk
  risky: 3, // 3-4 min buffer = medium risk
  dangerous: 3, // < 3 min buffer = high risk
};

// Delay Categories
export const DELAY_CATEGORIES = {
  onTime: { min: -5, max: 5, label: 'On Time', color: '#10B981' },
  minorDelay: { min: 5, max: 10, label: 'Minor Delay', color: '#F59E0B' },
  majorDelay: { min: 10, max: 20, label: 'Major Delay', color: '#EF4444' },
  severe: { min: 20, max: Infinity, label: 'Severe Delay', color: '#991B1B' },
};

// Update Intervals (milliseconds)
export const UPDATE_INTERVALS = {
  arrivals: 30000, // 30 seconds
  alerts: 120000, // 2 minutes
  location: 60000, // 1 minute
  backgroundFetch: 900000, // 15 minutes
};

// GTFS Data URLs
export const GTFS_URLS = {
  METRO_MAIN: 'https://metro.kingcounty.gov/GTFS/google_transit.zip',
  METRO_DAILY: 'https://metro.kingcounty.gov/GTFS/google_daily_transit.zip',
};

// API Base URLs
export const API_BASE_URLS = {
  ONEBUSAWAY: 'https://api.pugetsound.onebusaway.org/api/where',
  SOUND_TRANSIT_ALERTS: 'https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json',
};

// Cache Duration (milliseconds)
export const CACHE_DURATION = {
  gtfs_data: 7 * 24 * 60 * 60 * 1000, // 7 days
  arrivals: 30 * 1000, // 30 seconds
  alerts: 2 * 60 * 1000, // 2 minutes
  reliability: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// King County Metro Service Area Bounds (for validation)
// Includes: Seattle, Bothell, Lynnwood, Bellevue, Redmond, Renton, Kent, etc.
export const SEATTLE_BOUNDS = {
  lat: { min: 47.2, max: 47.9 }, // South King County to North King County
  lon: { min: -122.5, max: -121.8 }, // West to East King County
};

