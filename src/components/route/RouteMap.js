/**
 * RouteMap Component
 * Displays a route on a map with all stops
 * Based on ROADMAP.md Phase 3.3
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import locationService from '../../services/location/locationService';
import metroService from '../../services/gtfs/metroService';

// Lazy load MapView
let MapView, Marker, Polyline;
let mapsAvailable = false;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  mapsAvailable = true;
} catch (error) {
  console.warn('⚠️ react-native-maps not available:', error.message);
  MapView = null;
  mapsAvailable = false;
}

/**
 * RouteMap - Shows route on map with stops
 * @param {string} routeId - Route ID
 * @param {Array} stops - Array of stops on the route
 * @param {Object} route - Route object with details
 */
export default function RouteMap({ routeId, stops = [], route }) {
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
      setTimeout(() => {
        setMapInitialized(true);
      }, 500);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (stops && stops.length > 0) {
      calculateRegion();
    }
  }, [stops]);

  const calculateRegion = () => {
    if (!stops || stops.length === 0) return;

    const validStops = stops.filter(
      (stop) =>
        stop.stop_lat &&
        stop.stop_lon &&
        !isNaN(parseFloat(stop.stop_lat)) &&
        !isNaN(parseFloat(stop.stop_lon))
    );

    if (validStops.length === 0) return;

    const lats = validStops.map((stop) => parseFloat(stop.stop_lat));
    const lons = validStops.map((stop) => parseFloat(stop.stop_lon));

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latDelta = (maxLat - minLat) * 1.2 + 0.01; // Add padding
    const lonDelta = (maxLon - minLon) * 1.2 + 0.01;

    setRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lonDelta, 0.01),
    });
  };

  if (!MapView || !mapsAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Route Map</Text>
          <Text style={styles.fallbackText}>
            Map not available. Showing stop list instead.
          </Text>
          {stops.length > 0 && (
            <View style={styles.stopsList}>
              {stops.slice(0, 10).map((stop, index) => (
                <Text key={index} style={styles.stopItem}>
                  {index + 1}. {stop.stop_name || stop.name || 'Unknown Stop'}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  if (!mapReady || !region) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading route map...</Text>
      </View>
    );
  }

  // Create polyline coordinates from stops
  const routeCoordinates = stops
    .filter(
      (stop) =>
        stop.stop_lat &&
        stop.stop_lon &&
        !isNaN(parseFloat(stop.stop_lat)) &&
        !isNaN(parseFloat(stop.stop_lon))
    )
    .map((stop) => ({
      latitude: parseFloat(stop.stop_lat),
      longitude: parseFloat(stop.stop_lon),
    }));

  try {
    return (
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
        loadingEnabled={true}
        onMapReady={() => {
          console.log('✅ Route map loaded');
          setMapInitialized(true);
        }}
        onError={(error) => {
          console.error('❌ Route map error:', error);
        }}
      >
        {/* Route polyline */}
        {mapInitialized && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#1E3A8A"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Stop markers */}
        {mapInitialized &&
          stops.map((stop, index) => {
            const lat = parseFloat(stop.stop_lat || stop.lat);
            const lon = parseFloat(stop.stop_lon || stop.lon);

            if (isNaN(lat) || isNaN(lon)) return null;

            return (
              <Marker
                key={stop.stop_id || stop.id || `stop-${index}`}
                coordinate={{ latitude: lat, longitude: lon }}
                title={stop.stop_name || stop.name || 'Stop'}
                description={`Stop ${index + 1} of ${stops.length}`}
                pinColor="#EF4444"
              />
            );
          })}
      </MapView>
    );
  } catch (error) {
    console.error('Error rendering route map:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load route map</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
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
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
    paddingLeft: 8,
  },
});

