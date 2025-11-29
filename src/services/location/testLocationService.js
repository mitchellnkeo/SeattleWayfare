/**
 * Test script for Location Service
 * Tests location permissions, getting location, and nearby stops
 */

import locationService from './locationService';
import metroService from '../gtfs/metroService';

/**
 * Test the Location Service
 */
export async function testLocationService() {
  console.log('🧪 Testing Location Service...\n');

  try {
    // Test 1: Check permissions
    console.log('1️⃣ Checking location permissions...');
    const hasPermission = await locationService.hasPermissions();
    console.log(`   Permission status: ${hasPermission ? 'Granted' : 'Not granted'}`);
    if (!hasPermission) {
      console.log('   Requesting permissions...');
      const granted = await locationService.requestPermissions();
      console.log(`   Request result: ${granted ? 'Granted' : 'Denied'}`);
    }
    console.log('');

    // Test 2: Get current location
    console.log('2️⃣ Getting current location...');
    let location = await locationService.getCurrentLocation();
    let testLat, testLon;
    
    if (location) {
      console.log(`   ✅ Location obtained:`);
      console.log(`   Latitude: ${location.latitude.toFixed(6)}`);
      console.log(`   Longitude: ${location.longitude.toFixed(6)}`);
      console.log(`   Accuracy: ${Math.round(location.accuracy)}m`);
      console.log(`   In Seattle area: ${locationService.isInSeattleArea(location.latitude, location.longitude) ? 'Yes' : 'No'}`);
      testLat = location.latitude;
      testLon = location.longitude;
    } else {
      console.log('   ⚠️  Could not get location (permissions may be denied)');
      console.log('   Using test coordinates (Downtown Seattle)...');
      // Use downtown Seattle as test coordinates
      testLat = 47.609421;
      testLon = -122.337631;
      console.log(`   Test location: ${testLat}, ${testLon}`);
    }
    console.log('');

    // Test 3: Find nearby stops
    console.log('3️⃣ Finding nearby stops...');
    await metroService.initialize();
    const allStops = metroService.stops || [];
    console.log(`   Total stops in GTFS: ${allStops.length}`);
    
    const nearbyStops = locationService.findNearbyStops(
      testLat,
      testLon,
      allStops,
      500 // 500 meter radius
    );
    console.log(`   ✅ Found ${nearbyStops.length} stops within 500m`);
    
    if (nearbyStops.length > 0) {
      console.log('   Closest stops:');
      nearbyStops.slice(0, 5).forEach((stop, index) => {
        const stopName = stop.stop_name || stop.name || 'Unknown';
        console.log(`     ${index + 1}. ${stopName} (${stop.distance}m away)`);
      });
    }
    console.log('');

    // Test 4: Distance calculation
    console.log('4️⃣ Testing distance calculation:');
    const stop1 = nearbyStops[0];
    if (stop1) {
      const distance = locationService.calculateDistance(
        testLat,
        testLon,
        stop1.stop_lat || stop1.lat,
        stop1.stop_lon || stop1.lon
      );
      console.log(`   Distance to "${stop1.stop_name || stop1.name}": ${Math.round(distance)}m`);
      console.log(`   (Service calculated: ${stop1.distance}m)`);
    }
    console.log('');

    // Test 5: Location watching (brief test)
    console.log('5️⃣ Testing location watching...');
    let watchCallbackCalled = false;
    const watchCallback = (loc) => {
      watchCallbackCalled = true;
      console.log(`   📍 Location update: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
    };

    const watching = await locationService.watchPosition(watchCallback, {
      timeInterval: 5000, // 5 seconds for testing
      distanceInterval: 10, // 10 meters
    });

    if (watching) {
      console.log('   ✅ Started watching position');
      console.log('   Waiting 6 seconds for location update...');
      
      // Wait for a location update
      await new Promise((resolve) => setTimeout(resolve, 6000));
      
      if (watchCallbackCalled) {
        console.log('   ✅ Received location update');
      } else {
        console.log('   ⚠️  No location update received (may be normal if device is stationary)');
      }
      
      locationService.stopWatching();
      console.log('   ✅ Stopped watching position');
    } else {
      console.log('   ⚠️  Could not start watching (permissions may be denied)');
    }
    console.log('');

    console.log('✅ Location service tests completed!\n');
    return {
      success: true,
      locationObtained: !!location,
      nearbyStopsFound: nearbyStops.length,
      watchingTested: watching,
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default testLocationService;

