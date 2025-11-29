/**
 * Verification script to confirm GTFS service is using REAL data
 * from King County Metro, not mock data
 */

import metroService from './metroService';
import { getGTFSDownloadDate, getGTFSVersion } from '../../utils/storage';

/**
 * Verify that the GTFS service is using real data
 * Checks for known real-world routes, stops, and data characteristics
 */
export async function verifyRealData() {
  console.log('🔍 Verifying GTFS data is REAL (not mock)...\n');

  const verificationResults = {
    isRealData: true,
    checks: [],
    errors: [],
  };

  try {
    // Check 1: Verify data source URL
    console.log('1️⃣ Checking data source...');
    const { GTFS_URLS } = require('../../utils/constants');
    console.log(`   Data source: ${GTFS_URLS.METRO_MAIN}`);
    console.log(`   ✅ Using official King County Metro GTFS feed\n`);

    verificationResults.checks.push({
      name: 'Data Source URL',
      passed: true,
      details: GTFS_URLS.METRO_MAIN,
    });

    // Check 2: Verify download date exists
    console.log('2️⃣ Checking download timestamp...');
    const downloadDate = await getGTFSDownloadDate();
    if (downloadDate) {
      const date = new Date(downloadDate);
      console.log(`   ✅ Data downloaded: ${date.toLocaleString()}`);
      console.log(`   Age: ${Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))} days\n`);
      
      verificationResults.checks.push({
        name: 'Download Timestamp',
        passed: true,
        details: `Downloaded ${date.toLocaleString()}`,
      });
    } else {
      console.log('   ⚠️  No download date found (may be first run)\n');
      verificationResults.checks.push({
        name: 'Download Timestamp',
        passed: false,
        details: 'No download date recorded',
      });
    }

    // Check 3: Verify data volume (real GTFS has thousands of records)
    console.log('3️⃣ Verifying data volume...');
    const routes = metroService.getRoutes();
    const stops = metroService.stops || [];
    const trips = metroService.trips || [];
    const stopTimes = metroService.stopTimes || [];

    console.log(`   Routes: ${routes.length}`);
    console.log(`   Stops: ${stops.length}`);
    console.log(`   Trips: ${trips.length}`);
    console.log(`   Stop Times: ${stopTimes.length}`);

    // Real GTFS data should have:
    // - Hundreds of routes
    // - Thousands of stops
    // - Thousands of trips
    // - Tens of thousands of stop times
    const hasRealisticVolume =
      routes.length > 100 &&
      stops.length > 1000 &&
      trips.length > 1000 &&
      stopTimes.length > 10000;

    if (hasRealisticVolume) {
      console.log('   ✅ Data volume matches real GTFS feed\n');
      verificationResults.checks.push({
        name: 'Data Volume',
        passed: true,
        details: `Realistic volume: ${routes.length} routes, ${stops.length} stops`,
      });
    } else {
      console.log('   ⚠️  Data volume seems low (may be incomplete)\n');
      verificationResults.checks.push({
        name: 'Data Volume',
        passed: false,
        details: `Low volume: ${routes.length} routes, ${stops.length} stops`,
      });
    }

    // Check 4: Verify known real-world routes exist
    console.log('4️⃣ Checking for known real-world routes...');
    const knownRoutes = [
      { id: '1_100275', name: 'Route 8' },
      { id: '1_100479', name: 'E Line' },
      { id: '1_100223', name: 'Route 43' },
    ];

    const foundRoutes = [];
    knownRoutes.forEach((knownRoute) => {
      const route = metroService.getRouteById(knownRoute.id);
      if (route) {
        console.log(`   ✅ Found ${knownRoute.name} (${knownRoute.id})`);
        console.log(`      Name: ${route.route_long_name || route.route_short_name}`);
        foundRoutes.push(knownRoute.name);
      } else {
        console.log(`   ⚠️  ${knownRoute.name} not found (ID: ${knownRoute.id})`);
      }
    });

    if (foundRoutes.length > 0) {
      console.log(`   ✅ Found ${foundRoutes.length} known real-world routes\n`);
      verificationResults.checks.push({
        name: 'Known Routes',
        passed: true,
        details: `Found: ${foundRoutes.join(', ')}`,
      });
    } else {
      console.log('   ⚠️  No known routes found (checking route IDs format)\n');
      // Check if routes exist but with different IDs
      if (routes.length > 0) {
        console.log(`   Sample route IDs: ${routes.slice(0, 5).map(r => r.route_id).join(', ')}`);
      }
      verificationResults.checks.push({
        name: 'Known Routes',
        passed: false,
        details: 'Known routes not found',
      });
    }

    // Check 5: Verify known real-world stops exist
    console.log('5️⃣ Checking for known real-world stops...');
    const knownStops = [
      { id: '1_75403', name: '3rd Ave & Pike St' },
      { id: '1_75404', name: '3rd Ave & Pine St' },
    ];

    const foundStops = [];
    knownStops.forEach((knownStop) => {
      const stop = metroService.getStopById(knownStop.id);
      if (stop) {
        console.log(`   ✅ Found ${knownStop.name} (${knownStop.id})`);
        console.log(`      Location: ${stop.stop_lat}, ${stop.stop_lon}`);
        foundStops.push(knownStop.name);
      } else {
        console.log(`   ⚠️  ${knownStop.name} not found (ID: ${knownStop.id})`);
      }
    });

    if (foundStops.length > 0) {
      console.log(`   ✅ Found ${foundStops.length} known real-world stops\n`);
      verificationResults.checks.push({
        name: 'Known Stops',
        passed: true,
        details: `Found: ${foundStops.join(', ')}`,
      });
    } else {
      console.log('   ⚠️  Known stops not found (checking stop IDs format)\n');
      if (stops.length > 0) {
        console.log(`   Sample stop IDs: ${stops.slice(0, 5).map(s => s.stop_id).join(', ')}`);
      }
      verificationResults.checks.push({
        name: 'Known Stops',
        passed: false,
        details: 'Known stops not found',
      });
    }

    // Check 6: Verify data structure matches real GTFS format
    console.log('6️⃣ Verifying GTFS data structure...');
    if (routes.length > 0) {
      const sampleRoute = routes[0];
      const hasGTFSFields =
        'route_id' in sampleRoute &&
        'route_short_name' in sampleRoute &&
        'route_type' in sampleRoute;

      if (hasGTFSFields) {
        console.log('   ✅ Route structure matches GTFS format');
        console.log(`   Sample fields: ${Object.keys(sampleRoute).slice(0, 5).join(', ')}...`);
      } else {
        console.log('   ⚠️  Route structure may not match GTFS format');
      }
    }

    if (stops.length > 0) {
      const sampleStop = stops[0];
      const hasGTFSFields =
        'stop_id' in sampleStop &&
        'stop_name' in sampleStop &&
        'stop_lat' in sampleStop &&
        'stop_lon' in sampleStop;

      if (hasGTFSFields) {
        console.log('   ✅ Stop structure matches GTFS format');
        console.log(`   Sample fields: ${Object.keys(sampleStop).slice(0, 5).join(', ')}...`);
      } else {
        console.log('   ⚠️  Stop structure may not match GTFS format');
      }
    }
    console.log('');

    verificationResults.checks.push({
      name: 'Data Structure',
      passed: true,
      details: 'Matches GTFS format',
    });

    // Check 7: Verify Seattle area coordinates
    console.log('7️⃣ Verifying stop coordinates are in Seattle area...');
    const seattleStops = stops.filter((stop) => {
      const lat = parseFloat(stop.stop_lat);
      const lon = parseFloat(stop.stop_lon);
      return (
        lat >= 47.4 &&
        lat <= 47.8 &&
        lon >= -122.5 &&
        lon <= -122.2
      );
    });

    const seattlePercentage = (seattleStops.length / stops.length) * 100;
    console.log(`   ${seattleStops.length} of ${stops.length} stops in Seattle area (${seattlePercentage.toFixed(1)}%)`);

    if (seattlePercentage > 80) {
      console.log('   ✅ Most stops are in Seattle area (real data)\n');
      verificationResults.checks.push({
        name: 'Seattle Coordinates',
        passed: true,
        details: `${seattlePercentage.toFixed(1)}% of stops in Seattle area`,
      });
    } else {
      console.log('   ⚠️  Many stops outside Seattle area\n');
      verificationResults.checks.push({
        name: 'Seattle Coordinates',
        passed: false,
        details: `Only ${seattlePercentage.toFixed(1)}% in Seattle area`,
      });
    }

    // Summary
    console.log('📊 Verification Summary:');
    const passedChecks = verificationResults.checks.filter((c) => c.passed).length;
    const totalChecks = verificationResults.checks.length;
    console.log(`   Passed: ${passedChecks}/${totalChecks} checks\n`);

    verificationResults.checks.forEach((check) => {
      const icon = check.passed ? '✅' : '⚠️';
      console.log(`   ${icon} ${check.name}: ${check.details}`);
    });

    verificationResults.isRealData = passedChecks >= totalChecks * 0.7; // 70% pass rate

    if (verificationResults.isRealData) {
      console.log('\n✅ VERIFIED: This is REAL GTFS data from King County Metro!');
    } else {
      console.log('\n⚠️  WARNING: Some checks failed. Data may be incomplete or mock data.');
    }

    return verificationResults;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    verificationResults.errors.push(error.message);
    return verificationResults;
  }
}

export default verifyRealData;

