/**
 * Environment configuration
 * Loads environment variables with defaults
 * 
 * For OneBusAway API key:
 * Option 1 (Recommended): Create .env file in project root with:
 *   EXPO_PUBLIC_OBA_API_KEY=your_key_here
 * 
 * Option 2: Set directly here for development (DO NOT COMMIT WITH REAL KEY)
 *   const OBA_API_KEY_FROM_ENV = 'your_key_here';
 * 
 * Note: Expo uses EXPO_PUBLIC_ prefix for environment variables
 */

// Get API key from environment variable (EXPO_PUBLIC_ prefix for Expo)
// Or set directly here for development (DO NOT COMMIT WITH REAL KEY)
const OBA_API_KEY_FROM_ENV = process.env.EXPO_PUBLIC_OBA_API_KEY || '';

const ENV = {
  // OneBusAway API
  OBA_API_KEY: OBA_API_KEY_FROM_ENV || '',
  OBA_BASE_URL:
    process.env.EXPO_PUBLIC_OBA_BASE_URL ||
    'https://api.pugetsound.onebusaway.org/api/where',

  // Sound Transit
  ST_ALERTS_URL: 'https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json',

  // King County Metro GTFS
  METRO_GTFS_URL: 'https://metro.kingcounty.gov/GTFS/google_transit.zip',

  // App Configuration
  APP_ENV: __DEV__ ? 'development' : 'production',
  APP_VERSION: '1.0.0',

  // Feature Flags
  ENABLE_BACKGROUND_FETCH: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false,
};

// Validate required environment variables
if (__DEV__ && !ENV.OBA_API_KEY) {
  console.warn(
    '⚠️  OBA_API_KEY not set. Real-time data will not work.',
    'Request a key from oba_api_key@soundtransit.org',
    'Then set it in src/config/env.js'
  );
}

export default ENV;

