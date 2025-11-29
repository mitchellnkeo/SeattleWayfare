/**
 * Test script for Sound Transit service
 * Tests service alerts integration
 */

import stService from './stService';

/**
 * Test the Sound Transit service
 */
export async function testSTService() {
  console.log('🧪 Testing Sound Transit Service...\n');

  try {
    // Test 1: Get all Link alerts
    console.log('1️⃣ Fetching Sound Transit service alerts...');
    const alerts = await stService.getLinkAlerts({ filterActive: true });
    console.log(`   ✅ Found ${alerts.length} active alerts\n`);

    if (alerts.length > 0) {
      // Test 2: Display sample alerts
      console.log('2️⃣ Sample Alerts:');
      alerts.slice(0, 5).forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.header}`);
        if (alert.description) {
          const desc = alert.description.substring(0, 80);
          console.log(`      ${desc}${alert.description.length > 80 ? '...' : ''}`);
        }
        if (alert.affectedRoutes.length > 0) {
          console.log(`      Affected routes: ${alert.affectedRoutes.slice(0, 5).join(', ')}`);
        }
        if (alert.activePeriod.length > 0) {
          const period = alert.activePeriod[0];
          const start = new Date(period.start).toLocaleString();
          const end = period.end
            ? new Date(period.end).toLocaleString()
            : 'Ongoing';
          console.log(`      Active: ${start} - ${end}`);
        }
        console.log('');
      });

      // Test 3: Get alerts by severity
      console.log('3️⃣ Alerts by Severity:');
      const severeAlerts = await stService.getAlertsBySeverity('severe');
      const warningAlerts = await stService.getAlertsBySeverity('warning');
      const infoAlerts = await stService.getAlertsBySeverity('info');
      console.log(`   Severe: ${severeAlerts.length}`);
      console.log(`   Warning: ${warningAlerts.length}`);
      console.log(`   Info: ${infoAlerts.length}`);
      console.log('');

      // Test 4: Cache status
      console.log('4️⃣ Cache Status:');
      const cacheStatus = stService.getCacheStatus();
      if (cacheStatus.cached) {
        console.log(`   ✅ Cached: ${cacheStatus.alertCount} alerts`);
        console.log(`   Age: ${cacheStatus.age} seconds`);
        console.log(`   Valid: ${cacheStatus.isValid ? 'Yes' : 'No (stale)'}`);
      } else {
        console.log('   ⚠️  No cached data');
      }
      console.log('');
    } else {
      console.log('   ℹ️  No active alerts at this time');
      console.log('   (This is normal - there may not be any service disruptions)\n');

      // Test with all alerts (including inactive)
      console.log('2️⃣ Checking all alerts (including inactive)...');
      const allAlerts = await stService.getLinkAlerts({ filterActive: false });
      console.log(`   Total alerts: ${allAlerts.length}`);
      const activeCount = allAlerts.filter((a) => a.isActive).length;
      console.log(`   Active: ${activeCount}, Inactive: ${allAlerts.length - activeCount}`);
      console.log('');
    }

    console.log('✅ Sound Transit service tests completed!\n');
    return {
      success: true,
      alertCount: alerts.length,
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

export default testSTService;

