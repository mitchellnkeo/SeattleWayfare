/**
 * Environment configuration
 * Loads environment variables with defaults
 * 
 * For OneBusAway API key:
 * 1. Request key from: oba_api_key@soundtransit.org
 * 2. Create .env file in project root (or set directly here for development)
 * 3. Add: OBA_API_KEY=your_key_here
 * 
 * Note: For React Native, you may need to use react-native-dotenv or
 * set the API key directly in this file for development.
 */

// TODO: Replace with your actual API key or use environment variable loader
// For now, set directly here for testing (DO NOT COMMIT WITH REAL KEY)
const OBA_API_KEY_FROM_ENV = ''; // Set your key here or use env loader

const ENV = {
  // OneBusAway API
  OBA_API_KEY: OBA_API_KEY_FROM_ENV || '',
  OBA_BASE_URL: 'https://api.pugetsound.onebusaway.org/api/where',

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

