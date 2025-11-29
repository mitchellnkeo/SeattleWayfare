/**
 * Environment configuration
 * Loads environment variables with defaults
 */

const ENV = {
  // OneBusAway API
  OBA_API_KEY: process.env.OBA_API_KEY || '',
  OBA_BASE_URL:
    process.env.OBA_BASE_URL ||
    'https://api.pugetsound.onebusaway.org/api/where',

  // Sound Transit
  ST_ALERTS_URL:
    process.env.ST_ALERTS_URL ||
    'https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json',

  // King County Metro GTFS
  METRO_GTFS_URL:
    process.env.METRO_GTFS_URL ||
    'https://metro.kingcounty.gov/GTFS/google_transit.zip',

  // App Configuration
  APP_ENV: process.env.APP_ENV || 'development',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',

  // Feature Flags
  ENABLE_BACKGROUND_FETCH: process.env.ENABLE_BACKGROUND_FETCH !== 'false',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
};

// Validate required environment variables
if (__DEV__ && !ENV.OBA_API_KEY) {
  console.warn(
    '⚠️  OBA_API_KEY not set. Real-time data will not work. ' +
      'Request a key from oba_api_key@soundtransit.org'
  );
}

export default ENV;

