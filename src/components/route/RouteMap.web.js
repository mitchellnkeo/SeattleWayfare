/**
 * RouteMap Web Stub
 * Web-specific version that doesn't use react-native-maps
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function RouteMap({ routeId, stops = [], route }) {
  return (
    <View style={styles.container}>
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>Route Map</Text>
        <Text style={styles.fallbackText}>
          Maps are not available on web. Showing stop list instead.
        </Text>
        {stops.length > 0 ? (
          <ScrollView style={styles.stopsList}>
            {stops.map((stop, index) => (
              <View key={stop.stop_id || index} style={styles.stopItem}>
                <Text style={styles.stopNumber}>{index + 1}</Text>
                <Text style={styles.stopName}>{stop.stop_name || stop.name || 'Unknown Stop'}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noStopsText}>No stops available</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  fallbackContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  stopsList: {
    maxHeight: 200,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stopName: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  noStopsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
});

