/**
 * TripRouteMap Web Stub
 * Web-specific version that doesn't use react-native-maps
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TripRouteMap({ itinerary, userLocation, height = 300 }) {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>Route Map</Text>
        <Text style={styles.fallbackText}>
          Maps are not available on web. Showing route summary instead.
        </Text>
        {itinerary && itinerary.legs && (
          <View style={styles.legsList}>
            {itinerary.legs.map((leg, index) => (
              <Text key={index} style={styles.legItem}>
                {index + 1}. {leg.mode === 'WALK' ? '🚶 Walk' : `🚌 ${leg.routeShortName || 'Bus'}`} - {leg.duration} min
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fallbackContainer: {
    padding: 20,
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  legsList: {
    width: '100%',
  },
  legItem: {
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
});

