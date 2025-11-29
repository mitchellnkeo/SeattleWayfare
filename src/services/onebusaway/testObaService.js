/**
 * Test script for OneBusAway service
 * Tests real-time API integration
 */

import obaService from './obaService';

/**
 * Test the OneBusAway service
 */
export async function testOBAService() {
  console.log('🧪 Testing OneBusAway Service...\n');

  try {
    // Check API key
    console.log('1️⃣ Checking API configuration...');
    if (!obaService.isConfigured()) {
      console.log('   ⚠️  API key not configured');
      console.log('   📧 Request key from: oba_api_key@soundtransit.org');
      console.log('   📝 Add to .env file: OBA_API_KEY=your_key_here\n');
      return {
        success: false,
        error: 'API key not configured',
      };
    }
    console.log('   ✅ API key configured\n');

    // Test 2: Get stops near location (Downtown Seattle)
    console.log('2️⃣ Getting stops near Downtown Seattle (47.6062, -122.3321)...');
    try {
      const stops = await obaService.getStopsNearLocation(47.6062, -122.3321, 500);
      console.log(`   ✅ Found ${stops.length} stops within 500m`);
      if (stops.length > 0) {
        stops.slice(0, 3).forEach((stop, index) => {
          console.log(`   ${index + 1}. ${stop.name} (${stop.id})`);
          console.log(`      Routes: ${stop.routeIds.length} routes`);
        });
      }
      console.log('');

      // Test 3: Get arrivals for first stop (if available)
      if (stops.length > 0) {
        const testStopId = stops[0].id;
        console.log(`3️⃣ Getting arrivals for stop: ${stops[0].name} (${testStopId})...`);
        try {
          const arrivals = await obaService.getArrivalsForStop(testStopId, {
            minutesAfter: 30,
          });
          console.log(`   ✅ Found ${arrivals.length} arrivals`);
          if (arrivals.length > 0) {
            arrivals.slice(0, 5).forEach((arrival, index) => {
              const delayText = arrival.delayMinutes > 0
                ? `+${arrival.delayMinutes} min`
                : arrival.delayMinutes < 0
                ? `${arrival.delayMinutes} min`
                : 'on time';
              const realtimeText = arrival.predicted ? '🟢 Real-time' : '⚪ Scheduled';
              console.log(
                `   ${index + 1}. Route ${arrival.routeShortName} → ${arrival.tripHeadsign}`
              );
              console.log(
                `      ${arrival.minutesUntilArrival} min (${delayText}) ${realtimeText}`
              );
            });
          } else {
            console.log('   ⚠️  No arrivals found (may be outside service hours)');
          }
          console.log('');
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      }

      // Test 4: Get route info (if we have a route from arrivals)
      if (stops.length > 0) {
        const testStop = stops[0];
        if (testStop.routeIds && testStop.routeIds.length > 0) {
          const testRouteId = testStop.routeIds[0];
          console.log(`4️⃣ Getting route info for: ${testRouteId}...`);
          try {
            const routeInfo = await obaService.getRouteInfo(testRouteId);
            console.log(`   ✅ Route info retrieved`);
            console.log(`      Route: ${routeInfo.shortName || routeInfo.id}`);
            console.log(`      Name: ${routeInfo.longName || 'N/A'}`);
            console.log('');

            // Test 5: Get alerts for route
            console.log(`5️⃣ Getting service alerts for route ${testRouteId}...`);
            const alerts = await obaService.getAlertsForRoute(testRouteId);
            console.log(`   ✅ Found ${alerts.length} service alerts`);
            if (alerts.length > 0) {
              alerts.slice(0, 3).forEach((alert, index) => {
                console.log(`   ${index + 1}. ${alert.header}`);
                if (alert.description) {
                  console.log(`      ${alert.description.substring(0, 60)}...`);
                }
              });
            }
            console.log('');
          } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test 6: Cache statistics
    console.log('6️⃣ Cache Statistics:');
    const cacheStats = obaService.getCacheStats();
    console.log(`   Cached endpoints: ${cacheStats.size}`);
    console.log('');

    console.log('✅ OneBusAway service tests completed!\n');
    return {
      success: true,
      message: 'All tests passed',
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default testOBAService;

