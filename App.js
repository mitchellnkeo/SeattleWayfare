/**
 * Seattle Wayfare - Main App Component
 * Entry point for the application
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotifications } from './src/utils/notifications';
import { registerBackgroundFetch } from './src/services/backgroundService';

export default function App() {
  useEffect(() => {
    // Initialize notifications on app start
    const initNotifications = async () => {
      try {
        await setupNotifications();
        console.log('✅ Notifications initialized');
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      }
    };

    // Register background fetch (only on native platforms)
    const initBackgroundFetch = async () => {
      if (Platform.OS === 'web') {
        console.log('ℹ️ Background fetch not available on web');
        return;
      }
      try {
        await registerBackgroundFetch();
        console.log('✅ Background fetch initialized');
      } catch (error) {
        console.error('❌ Failed to initialize background fetch:', error);
      }
    };

    initNotifications();
    initBackgroundFetch();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
