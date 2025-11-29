/**
 * Notification Utilities
 * Handles all app notifications including delays, transfers, and reminders
 * Based on ROADMAP.md Phase 4.1
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Setup notifications - request permissions and configure behavior
 * @returns {Promise<boolean>} True if permissions granted, false otherwise
 */
export async function setupNotifications() {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
      return false;
    }

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A8A',
      });

      // Delay notifications channel
      await Notifications.setNotificationChannelAsync('delays', {
        name: 'Delay Alerts',
        description: 'Notifications about route delays',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EF4444',
        sound: 'default',
      });

      // Transfer risk channel
      await Notifications.setNotificationChannelAsync('transfers', {
        name: 'Transfer Warnings',
        description: 'Notifications about transfer risks',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F59E0B',
        sound: 'default',
      });

      // Reminders channel
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Departure Reminders',
        description: 'Time to leave notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });
    }

    console.log('✅ Notifications configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Error setting up notifications:', error);
    return false;
  }
}

/**
 * Send delay notification
 * @param {string} route - Route number/name
 * @param {number} delayMinutes - Delay in minutes
 * @param {string|null} alternative - Alternative route suggestion (optional)
 * @param {string} stopId - Stop ID for navigation (optional)
 */
export async function sendDelayNotification(route, delayMinutes, alternative = null, stopId = null) {
  try {
    const body = alternative
      ? `Running ${delayMinutes} min late. Take Route ${alternative} instead.`
      : `Running ${delayMinutes} min late. Adjust your departure time.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ Route ${route} Delayed`,
        body: body,
        data: {
          type: 'delay',
          route,
          delayMinutes,
          alternative,
          stopId,
        },
        sound: true,
      },
      trigger: null, // Send immediately
      channelId: Platform.OS === 'android' ? 'delays' : undefined,
    });

    console.log(`📢 Delay notification sent: Route ${route}, ${delayMinutes} min delay`);
  } catch (error) {
    console.error('❌ Error sending delay notification:', error);
  }
}

/**
 * Send transfer risk notification
 * @param {string} firstRoute - First route number/name
 * @param {string} secondRoute - Second route number/name
 * @param {number} bufferMinutes - Transfer buffer time in minutes
 */
export async function sendTransferRiskNotification(firstRoute, secondRoute, bufferMinutes = 0) {
  try {
    const body = bufferMinutes < 0
      ? `${firstRoute} is delayed. You may miss your ${secondRoute} connection.`
      : `Low transfer buffer (${bufferMinutes} min) between ${firstRoute} and ${secondRoute}.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Transfer Risk',
        body: body,
        data: {
          type: 'transfer_risk',
          firstRoute,
          secondRoute,
          bufferMinutes,
        },
        sound: true,
      },
      trigger: null, // Send immediately
      channelId: Platform.OS === 'android' ? 'transfers' : undefined,
    });

    console.log(`📢 Transfer risk notification sent: ${firstRoute} → ${secondRoute}`);
  } catch (error) {
    console.error('❌ Error sending transfer risk notification:', error);
  }
}

/**
 * Send "when to leave" reminder notification
 * @param {Object} commute - Saved commute object
 * @param {Date} departureTime - Recommended departure time
 * @param {number} expectedDelay - Expected delay in minutes
 * @param {Array} alternativeRoutes - Alternative route options (optional)
 */
export async function sendDepartureReminder(commute, departureTime, expectedDelay = 0, alternativeRoutes = []) {
  try {
    const commuteName = commute.name || 'Your commute';
    const delayText = expectedDelay > 0 ? ` (Route running ${expectedDelay} min late)` : '';
    const alternativeText = alternativeRoutes.length > 0
      ? ` Consider Route ${alternativeRoutes[0]} instead.`
      : '';

    const body = `Time to leave for ${commuteName}.${delayText}${alternativeText}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Time to Leave',
        body: body,
        data: {
          type: 'departure_reminder',
          commuteId: commute.id,
          departureTime: departureTime.toISOString(),
          expectedDelay,
          alternativeRoutes,
        },
        sound: true,
      },
      trigger: null, // Send immediately
      channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    });

    console.log(`📢 Departure reminder sent: ${commuteName}`);
  } catch (error) {
    console.error('❌ Error sending departure reminder:', error);
  }
}

/**
 * Send service alert notification
 * @param {string} route - Route number/name
 * @param {string} alertTitle - Alert title
 * @param {string} alertDescription - Alert description
 */
export async function sendServiceAlertNotification(route, alertTitle, alertDescription) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚧 ${route}: ${alertTitle}`,
        body: alertDescription,
        data: {
          type: 'service_alert',
          route,
          alertTitle,
        },
        sound: true,
      },
      trigger: null, // Send immediately
      channelId: Platform.OS === 'android' ? 'delays' : undefined,
    });

    console.log(`📢 Service alert notification sent: ${route}`);
  } catch (error) {
    console.error('❌ Error sending service alert notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
  }
}

/**
 * Get notification permissions status
 * @returns {Promise<string>} Permission status ('granted', 'denied', 'undetermined')
 */
export async function getNotificationPermissions() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('❌ Error getting notification permissions:', error);
    return 'undetermined';
  }
}

/**
 * Check if notifications are enabled
 * @returns {Promise<boolean>} True if notifications are enabled
 */
export async function areNotificationsEnabled() {
  const status = await getNotificationPermissions();
  return status === 'granted';
}

