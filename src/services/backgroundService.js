/**
 * Background Service
 * Handles background monitoring of saved commutes and sends notifications
 * Based on ROADMAP.md Phase 4.2
 */

import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { getSavedCommutes, getStorageItem, setStorageItem } from '../utils/storage';
import obaService from './onebusaway/obaService';
import reliabilityService from './reliability/reliabilityService';
import {
  sendDelayNotification,
  sendDepartureReminder,
  sendTransferRiskNotification,
} from '../utils/notifications';

const BACKGROUND_FETCH_TASK = 'wayfare-background-fetch';

/**
 * Background task definition
 * Runs periodically to check for delays and send notifications
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('🔄 Background fetch task started');

    // Check if OneBusAway is configured
    if (!obaService.isConfigured()) {
      console.log('⚠️ OneBusAway not configured, skipping background fetch');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Get user's saved commutes
    const savedCommutes = await getSavedCommutes();
    
    if (!savedCommutes || savedCommutes.length === 0) {
      console.log('ℹ️ No saved commutes, skipping background fetch');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const now = new Date();
    let notificationsSent = 0;

    // Check each saved commute
    for (const commute of savedCommutes) {
      try {
        // Skip if notifications are disabled for this commute
        if (!commute.notifyOnDelays && !commute.notifyMinutesBefore) {
          continue;
        }

        // Check for "when to leave" reminders
        if (commute.notifyMinutesBefore && commute.usualDepartureTime) {
          await checkDepartureReminder(commute, now);
        }

        // Check for delays if enabled
        if (commute.notifyOnDelays && commute.origin?.stopId) {
          await checkDelayNotifications(commute, now);
        }

        // Check for transfer risks if commute has multiple routes
        if (commute.preferredRoutes && commute.preferredRoutes.length > 1) {
          await checkTransferRisks(commute, now);
        }
      } catch (error) {
        console.error(`❌ Error processing commute ${commute.id}:`, error);
      }
    }

    console.log(`✅ Background fetch completed. Notifications sent: ${notificationsSent}`);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Background fetch task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Check if departure reminder should be sent
 */
async function checkDepartureReminder(commute, now) {
  try {
    if (!commute.usualDepartureTime || !commute.notifyMinutesBefore) {
      return;
    }

    // Parse departure time
    const [hours, minutes] = commute.usualDepartureTime.split(':');
    const departureTime = new Date(now);
    departureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If departure time has passed today, check tomorrow
    if (departureTime < now) {
      departureTime.setDate(departureTime.getDate() + 1);
    }

    // Calculate notification time
    const notifyTime = new Date(departureTime);
    notifyTime.setMinutes(notifyTime.getMinutes() - commute.notifyMinutesBefore);

    // Check if we're within the notification window (5 minute window)
    const timeDiff = Math.abs(now - notifyTime);
    const windowMs = 5 * 60 * 1000; // 5 minutes

    if (timeDiff <= windowMs) {
      // Check for delays on preferred routes
      let expectedDelay = 0;
      const alternativeRoutes = [];

      if (commute.preferredRoutes && commute.preferredRoutes.length > 0 && commute.origin?.stopId) {
        try {
          const arrivals = await obaService.getArrivalsForStop(commute.origin.stopId);
          const relevantArrival = arrivals.find(
            (a) => commute.preferredRoutes.includes(a.routeId)
          );

          if (relevantArrival && relevantArrival.delayMinutes > 5) {
            expectedDelay = relevantArrival.delayMinutes;
          }

          // Find alternative routes
          const otherArrivals = arrivals
            .filter((a) => !commute.preferredRoutes.includes(a.routeId))
            .slice(0, 2);
          alternativeRoutes.push(...otherArrivals.map((a) => a.routeShortName));
        } catch (error) {
          console.error('Error checking delays for reminder:', error);
        }
      }

      // Send reminder
      await sendDepartureReminder(commute, departureTime, expectedDelay, alternativeRoutes);
    }
  } catch (error) {
    console.error('Error checking departure reminder:', error);
  }
}

/**
 * Check for delays and send notifications
 */
async function checkDelayNotifications(commute, now) {
  try {
    if (!commute.origin?.stopId || !commute.preferredRoutes || commute.preferredRoutes.length === 0) {
      return;
    }

    const arrivals = await obaService.getArrivalsForStop(commute.origin.stopId);

    for (const routeId of commute.preferredRoutes) {
      const arrival = arrivals.find((a) => a.routeId === routeId);

      if (arrival && arrival.delayMinutes > 5) {
        // Check if we've already notified about this delay recently
        const lastNotificationKey = `delay_notification_${commute.id}_${routeId}`;
        const lastNotification = await getStorageItem(lastNotificationKey);
        const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;

        if (!lastNotification || lastNotification < fiveMinutesAgo) {
          // Find alternative route
          const alternative = arrivals
            .filter((a) => a.routeId !== routeId && a.delayMinutes <= 5)
            .sort((a, b) => a.minutesUntilArrival - b.minutesUntilArrival)[0];

          await sendDelayNotification(
            arrival.routeShortName || routeId,
            arrival.delayMinutes,
            alternative?.routeShortName || null,
            commute.origin.stopId
          );

          // Store notification timestamp
          await setStorageItem(lastNotificationKey, now.getTime());
        }
      }
    }
  } catch (error) {
    console.error('Error checking delay notifications:', error);
  }
}

/**
 * Check for transfer risks
 */
async function checkTransferRisks(commute, now) {
  try {
    if (!commute.preferredRoutes || commute.preferredRoutes.length < 2) {
      return;
    }

    // This is a simplified check - in a real implementation, you'd need
    // to check actual trip connections and transfer times
    // For now, we'll check if the first route is significantly delayed
    if (commute.origin?.stopId) {
      const arrivals = await obaService.getArrivalsForStop(commute.origin.stopId);
      const firstRouteArrival = arrivals.find(
        (a) => a.routeId === commute.preferredRoutes[0]
      );

      if (firstRouteArrival && firstRouteArrival.delayMinutes > 10) {
        // Calculate transfer buffer (simplified)
        const transferBuffer = 5; // Default 5 min buffer
        const adjustedBuffer = transferBuffer - firstRouteArrival.delayMinutes;

        if (adjustedBuffer < 3) {
          await sendTransferRiskNotification(
            firstRouteArrival.routeShortName || commute.preferredRoutes[0],
            commute.preferredRoutes[1] || 'connecting route',
            adjustedBuffer
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking transfer risks:', error);
  }
}

/**
 * Register background fetch task
 * @returns {Promise<boolean>} True if registration successful
 */
export async function registerBackgroundFetch() {
  // Background fetch is not available on web
  if (Platform.OS === 'web') {
    console.log('ℹ️ Background fetch not available on web platform');
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      console.log('✅ Background fetch already registered');
      return true;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log('✅ Background fetch registered successfully');
    return true;
  } catch (error) {
    console.error('❌ Error registering background fetch:', error);
    return false;
  }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundFetch() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('✅ Background fetch unregistered');
    }
  } catch (error) {
    console.error('❌ Error unregistering background fetch:', error);
  }
}

/**
 * Check if background fetch is registered
 * @returns {Promise<boolean>} True if registered
 */
export async function isBackgroundFetchRegistered() {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  } catch (error) {
    console.error('❌ Error checking background fetch status:', error);
    return false;
  }
}

