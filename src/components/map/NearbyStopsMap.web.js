/**
 * NearbyStopsMap Web Stub
 * Web-specific version that doesn't use react-native-maps
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function NearbyStopsMap({ radiusMeters = 500, onStopPress }) {
  return (
    <View style={styles.container}>
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>📍 Nearby Stops</Text>
        <Text style={styles.fallbackWarning}>
          Maps are not available on web. Showing list view instead.
        </Text>
        <Text style={styles.fallbackNote}>
          Use the iOS or Android app for full map functionality.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  fallbackContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  fallbackWarning: {
    fontSize: 14,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

