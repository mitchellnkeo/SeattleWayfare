/**
 * Simple test script to verify GTFS service works
 * Can be run manually to test the service
 */

import metroService from './metroService';

/**
 * Test the GTFS service
 * Run this function to test loading and querying GTFS data
 */
export async function testGTFSService() {
  console.log('🧪 Testing MetroGTFSService...\n');

  try {
    // Test 1: Initialize service
    console.log('1️⃣ Initializing GTFS service...');
    const initialized = await metroService.initialize();
    console.log(`   ✅ Initialized: ${initialized}\n`);

    // Test 2: Get all routes
    console.log('2️⃣ Getting all routes...');
    const routes = metroService.getRoutes();
    console.log(`   ✅ Found ${routes.length} routes`);
    if (routes.length > 0) {
      console.log(`   📍 Sample route: ${routes[0].route_short_name} - ${routes[0].route_long_name}`);
    }
    console.log('');

    // Test 3: Get a specific route (Route 8)
    console.log('3️⃣ Getting Route 8...');
    const route8 = metroService.getRouteById('1_100275');
    if (route8) {
      console.log(`   ✅ Found Route 8: ${route8.route_long_name}`);
    } else {
      console.log('   ⚠️  Route 8 not found (may need to download GTFS data)');
    }
    console.log('');

    // Test 4: Get stops for Route 8
    if (route8) {
      console.log('4️⃣ Getting stops for Route 8...');
      const stops = metroService.getStopsForRoute('1_100275');
      console.log(`   ✅ Found ${stops.length} stops for Route 8`);
      if (stops.length > 0) {
        console.log(`   📍 Sample stop: ${stops[0].stop_name}`);
      }
      console.log('');
    }

    // Test 5: Search for a stop
    console.log('5️⃣ Searching for "Pike" stops...');
    const searchResults = metroService.searchStops('Pike');
    console.log(`   ✅ Found ${searchResults.length} stops matching "Pike"`);
    if (searchResults.length > 0) {
      searchResults.slice(0, 3).forEach((stop) => {
        console.log(`   📍 ${stop.stop_name} (${stop.stop_code || 'no code'})`);
      });
    }
    console.log('');

    // Test 6: Get routes for a specific stop (3rd Ave & Pike St)
    console.log('6️⃣ Getting routes for stop "1_75403" (3rd Ave & Pike St)...');
    const stopRoutes = metroService.getRoutesForStop('1_75403');
    console.log(`   ✅ Found ${stopRoutes.length} routes serving this stop`);
    if (stopRoutes.length > 0) {
      stopRoutes.slice(0, 5).forEach((routeId) => {
        const route = metroService.getRouteById(routeId);
        if (route) {
          console.log(`   🚌 Route ${route.route_short_name}: ${route.route_long_name}`);
        }
      });
    }
    console.log('');

    console.log('✅ All tests completed!\n');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export default test function
export default testGTFSService;

