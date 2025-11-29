/**
 * Test script for Reliability Service
 * Tests reliability scoring, transfer risk, and delay prediction
 */

import reliabilityService from './reliabilityService';

/**
 * Test the Reliability Service
 */
export async function testReliabilityService() {
  console.log('🧪 Testing Reliability Service...\n');

  try {
    // Initialize service
    console.log('1️⃣ Initializing reliability service...');
    await reliabilityService.initialize();
    console.log('   ✅ Service initialized\n');

    // Test 2: Get route reliability
    console.log('2️⃣ Testing Route Reliability:');
    const route8 = reliabilityService.getRouteReliability('1_100275');
    console.log(`   Route 8: ${route8.reliability.toUpperCase()}`);
    console.log(`   On-time: ${(route8.onTimePerformance * 100).toFixed(1)}%`);
    console.log(`   Avg delay: ${route8.averageDelayMinutes} min`);
    console.log('');

    const routeE = reliabilityService.getRouteReliability('1_100479');
    console.log(`   E Line: ${routeE.reliability.toUpperCase()}`);
    console.log(`   On-time: ${(routeE.onTimePerformance * 100).toFixed(1)}%`);
    console.log(`   Avg delay: ${routeE.averageDelayMinutes} min`);
    console.log('');

    const unknownRoute = reliabilityService.getRouteReliability('1_999999');
    console.log(`   Unknown Route: ${unknownRoute.reliability.toUpperCase()} (default)`);
    console.log(`   On-time: ${(unknownRoute.onTimePerformance * 100).toFixed(1)}%`);
    console.log('');

    // Test 3: Delay prediction
    console.log('3️⃣ Testing Delay Prediction:');
    const now = new Date();
    const rushHour = new Date(now);
    rushHour.setHours(8, 0, 0, 0); // 8 AM
    const evening = new Date(now);
    evening.setHours(18, 0, 0, 0); // 6 PM
    const offPeak = new Date(now);
    offPeak.setHours(14, 0, 0, 0); // 2 PM

    const rushHourDelay = reliabilityService.predictDelay(
      '1_100275',
      null,
      rushHour
    );
    console.log(`   Route 8 @ Rush Hour (8 AM):`);
    console.log(`   Expected delay: ${rushHourDelay.expectedDelayMinutes} min`);
    console.log(`   Confidence: ${(rushHourDelay.confidence * 100).toFixed(1)}%`);
    console.log(`   Rush hour: ${rushHourDelay.isRushHour ? 'Yes' : 'No'}`);
    console.log('');

    const offPeakDelay = reliabilityService.predictDelay(
      '1_100275',
      null,
      offPeak
    );
    console.log(`   Route 8 @ Off-Peak (2 PM):`);
    console.log(`   Expected delay: ${offPeakDelay.expectedDelayMinutes} min`);
    console.log(`   Rush hour: ${offPeakDelay.isRushHour ? 'Yes' : 'No'}`);
    console.log('');

    // Test 4: Transfer risk calculation
    console.log('4️⃣ Testing Transfer Risk:');
    const nowTime = Date.now();
    const firstArrival = {
      routeId: '1_100275', // Route 8 - unreliable
      predictedArrivalTime: nowTime + 10 * 60000, // 10 min from now
      scheduledArrivalTime: nowTime + 10 * 60000,
    };
    const secondDeparture = {
      scheduledDepartureTime: nowTime + 12 * 60000, // 2 min later
    };

    const riskyTransfer = reliabilityService.calculateTransferRisk(
      firstArrival,
      secondDeparture,
      2 // 2 min walking
    );
    console.log(`   Risky Transfer (2 min buffer):`);
    console.log(`   Risk: ${riskyTransfer.risk.toUpperCase()}`);
    console.log(`   Connection time: ${riskyTransfer.connectionMinutes} min`);
    console.log(`   Adjusted (with delay): ${riskyTransfer.adjustedConnectionMinutes} min`);
    console.log(`   Likelihood of missing: ${(riskyTransfer.likelihood * 100).toFixed(1)}%`);
    console.log(`   Recommendation: ${riskyTransfer.recommendation}`);
    console.log('');

    // Safe transfer
    const safeSecondDeparture = {
      scheduledDepartureTime: nowTime + 20 * 60000, // 10 min later
    };
    const safeTransfer = reliabilityService.calculateTransferRisk(
      firstArrival,
      safeSecondDeparture,
      2
    );
    console.log(`   Safe Transfer (10 min buffer):`);
    console.log(`   Risk: ${safeTransfer.risk.toUpperCase()}`);
    console.log(`   Connection time: ${safeTransfer.connectionMinutes} min`);
    console.log(`   Adjusted: ${safeTransfer.adjustedConnectionMinutes} min`);
    console.log(`   Likelihood: ${(safeTransfer.likelihood * 100).toFixed(1)}%`);
    console.log('');

    // Test 5: Itinerary reliability
    console.log('5️⃣ Testing Itinerary Reliability:');
    const sampleItinerary = {
      legs: [
        {
          mode: 'WALK',
          duration: 5,
        },
        {
          mode: 'BUS',
          routeId: '1_100275', // Route 8 - low reliability
          startTime: nowTime + 5 * 60000,
          endTime: nowTime + 30 * 60000,
        },
        {
          mode: 'WALK',
          duration: 3,
        },
        {
          mode: 'BUS',
          routeId: '1_100479', // E Line - high reliability
          startTime: nowTime + 33 * 60000,
          endTime: nowTime + 50 * 60000,
        },
      ],
    };

    const itineraryReliability =
      reliabilityService.calculateItineraryReliability(sampleItinerary.legs);
    console.log(`   Sample Itinerary:`);
    console.log(`   Overall: ${itineraryReliability.overallReliability.toUpperCase()}`);
    console.log(`   Avg on-time: ${(itineraryReliability.averageOnTimePerformance * 100).toFixed(1)}%`);
    console.log(`   Total expected delay: ${itineraryReliability.totalExpectedDelay} min`);
    console.log(`   Transfer risks: ${itineraryReliability.transferRisks.length}`);
    if (itineraryReliability.transferRisks.length > 0) {
      itineraryReliability.transferRisks.forEach((risk, idx) => {
        console.log(`     Risk ${idx + 1}: ${risk.risk.toUpperCase()} (${risk.likelihood * 100}% chance)`);
      });
    }
    console.log('');

    // Test 6: Routes by reliability
    console.log('6️⃣ Routes by Reliability Level:');
    const highReliability = reliabilityService.getRoutesByReliability('high');
    const mediumReliability = reliabilityService.getRoutesByReliability('medium');
    const lowReliability = reliabilityService.getRoutesByReliability('low');
    console.log(`   High: ${highReliability.length} routes`);
    console.log(`   Medium: ${mediumReliability.length} routes`);
    console.log(`   Low: ${lowReliability.length} routes`);
    console.log('');

    console.log('✅ Reliability service tests completed!\n');
    return {
      success: true,
      routesTested: 3,
      predictionsTested: 2,
      transfersTested: 2,
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

export default testReliabilityService;

