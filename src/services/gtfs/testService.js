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
    // Test 1: Check if service is loaded
    console.log('1️⃣ Checking service status...');
    const isLoaded = metroService.isLoaded;
    console.log(`   Service loaded: ${isLoaded}`);
    if (!isLoaded) {
      console.log('   ⚠️  Service not loaded. Initializing...');
      await metroService.initialize();
    }
    console.log('');

    // Test 2: Get all routes
    console.log('2️⃣ Getting all routes...');
    const routes = metroService.getRoutes();
    console.log(`   ✅ Found ${routes.length} routes`);
    if (routes.length > 0) {
      const sampleRoute = routes[0];
      console.log(`   📍 Sample route: ${sampleRoute.route_short_name || 'N/A'} - ${sampleRoute.route_long_name || sampleRoute.route_id}`);
      console.log(`   Route ID format: ${sampleRoute.route_id}`);
    } else {
      console.log('   ⚠️  No routes found. Service may need to download GTFS data.');
    }
    console.log('');

    // Test 3: Get a specific route (Route 8)
    console.log('3️⃣ Getting Route 8 (ID: 1_100275)...');
    const route8 = metroService.getRouteById('1_100275');
    if (route8) {
      console.log(`   ✅ Found Route 8:`);
      console.log(`      Short Name: ${route8.route_short_name}`);
      console.log(`      Long Name: ${route8.route_long_name || 'N/A'}`);
      console.log(`      Type: ${route8.route_type} (3 = Bus)`);
    } else {
      console.log('   ⚠️  Route 8 not found. Trying alternative route IDs...');
      // Try to find any route with "8" in the name
      const route8Alt = routes.find(r => 
        r.route_short_name === '8' || 
        r.route_short_name === '8' ||
        r.route_id.includes('100275')
      );
      if (route8Alt) {
        console.log(`   ✅ Found route with ID: ${route8Alt.route_id}`);
      }
    }
    console.log('');

    // Test 4: Get stops for Route 8 (if found)
    if (route8) {
      console.log('4️⃣ Getting stops for Route 8...');
      const stops = metroService.getStopsForRoute('1_100275');
      console.log(`   ✅ Found ${stops.length} stops for Route 8`);
      if (stops.length > 0) {
        const sampleStop = stops[0];
        console.log(`   📍 Sample stop: ${sampleStop.stop_name || sampleStop.stop_id}`);
        console.log(`      Location: ${sampleStop.stop_lat}, ${sampleStop.stop_lon}`);
        if (stops.length > 1) {
          console.log(`   📍 Another stop: ${stops[1].stop_name || stops[1].stop_id}`);
        }
      }
      console.log('');
    } else {
      // Test with first available route
      if (routes.length > 0) {
        const firstRoute = routes[0];
        console.log(`4️⃣ Getting stops for route ${firstRoute.route_id}...`);
        const stops = metroService.getStopsForRoute(firstRoute.route_id);
        console.log(`   ✅ Found ${stops.length} stops for this route`);
        if (stops.length > 0) {
          console.log(`   📍 Sample stop: ${stops[0].stop_name || stops[0].stop_id}`);
        }
        console.log('');
      }
    }

    // Test 5: Search for stops
    console.log('5️⃣ Searching for stops with "Pike" in name...');
    const searchResults = metroService.searchStops('Pike');
    console.log(`   ✅ Found ${searchResults.length} stops matching "Pike"`);
    if (searchResults.length > 0) {
      searchResults.slice(0, 5).forEach((stop, index) => {
        console.log(`   ${index + 1}. ${stop.stop_name || stop.stop_id} (Code: ${stop.stop_code || 'N/A'})`);
      });
      if (searchResults.length > 5) {
        console.log(`   ... and ${searchResults.length - 5} more`);
      }
    } else {
      console.log('   ⚠️  No stops found. Trying different search...');
      const allStops = metroService.stops || [];
      if (allStops.length > 0) {
        console.log(`   Total stops in database: ${allStops.length}`);
        console.log(`   Sample stop: ${allStops[0].stop_name || allStops[0].stop_id}`);
      }
    }
    console.log('');

    // Test 6: Get routes for a specific stop (3rd Ave & Pike St)
    console.log('6️⃣ Getting routes for stop "1_75403" (3rd Ave & Pike St)...');
    const stopRoutes = metroService.getRoutesForStop('1_75403');
    console.log(`   ✅ Found ${stopRoutes.length} routes serving this stop`);
    if (stopRoutes.length > 0) {
      stopRoutes.slice(0, 10).forEach((routeId, index) => {
        const route = metroService.getRouteById(routeId);
        if (route) {
          console.log(`   ${index + 1}. Route ${route.route_short_name || routeId}: ${route.route_long_name || 'N/A'}`);
        } else {
          console.log(`   ${index + 1}. Route ID: ${routeId}`);
        }
      });
      if (stopRoutes.length > 10) {
        console.log(`   ... and ${stopRoutes.length - 10} more routes`);
      }
    } else {
      console.log('   ⚠️  Stop not found. Trying to find a stop with routes...');
      // Try to find any stop that has routes
      const allStops = metroService.stops || [];
      if (allStops.length > 0) {
        const testStop = allStops[0];
        const testRoutes = metroService.getRoutesForStop(testStop.stop_id);
        console.log(`   Test with stop ${testStop.stop_id}: Found ${testRoutes.length} routes`);
      }
    }
    console.log('');

    // Test 7: Get stop by ID
    console.log('7️⃣ Getting stop by ID "1_75403"...');
    const stop = metroService.getStopById('1_75403');
    if (stop) {
      console.log(`   ✅ Found stop: ${stop.stop_name || stop.stop_id}`);
      console.log(`      Code: ${stop.stop_code || 'N/A'}`);
      console.log(`      Location: ${stop.stop_lat}, ${stop.stop_lon}`);
      console.log(`      Direction: ${stop.direction || 'N/A'}`);
    } else {
      console.log('   ⚠️  Stop not found');
    }
    console.log('');

    // Test 8: Data statistics
    console.log('8️⃣ Data Statistics:');
    console.log(`   Routes: ${metroService.routes.length}`);
    console.log(`   Stops: ${metroService.stops.length}`);
    console.log(`   Trips: ${metroService.trips.length}`);
    console.log(`   Stop Times: ${metroService.stopTimes.length}`);
    console.log('');

    console.log('✅ All tests completed!\n');
    return {
      success: true,
      stats: {
        routes: metroService.routes.length,
        stops: metroService.stops.length,
        trips: metroService.trips.length,
        stopTimes: metroService.stopTimes.length,
      },
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export default test function
export default testGTFSService;
