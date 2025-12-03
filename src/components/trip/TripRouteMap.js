/**
 * TripRouteMap Component
 * Displays a planned trip route on a map with all legs (walking + transit)
 * Similar to Google Maps transit view
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import locationService from '../../services/location/locationService';

// Lazy load MapView - only on native platforms (not web)
let MapView = null;
let Marker = null;
let Polyline = null;
let mapsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    mapsAvailable = true;
  } catch (error) {
    console.warn('⚠️ react-native-maps not available:', error.message);
    mapsAvailable = false;
  }
}

/**
 * TripRouteMap - Shows planned trip route on map
 * @param {Object} itinerary - Itinerary object with legs
 * @param {Object} userLocation - Current user location {lat, lon}
 * @param {number} height - Map height (default: 300)
 */
export default function TripRouteMap({ itinerary, userLocation, height = 300 }) {
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [region, setRegion] = useState(null);
  const [polylines, setPolylines] = useState([]);
  const [markers, setMarkers] = useState([]);

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
    if (itinerary && itinerary.legs) {
      calculateRouteData();
    }
  }, [itinerary, userLocation]);

  const calculateRouteData = () => {
    if (!itinerary || !itinerary.legs || itinerary.legs.length === 0) {
      return;
    }

    const allCoordinates = [];
    const newPolylines = [];
    const newMarkers = [];

    // Process each leg
    itinerary.legs.forEach((leg, legIndex) => {
      if (leg.mode === 'WALK') {
        // Walking leg - draw straight line between from and to
        if (leg.from && leg.to) {
          const fromCoord = {
            latitude: leg.from.lat || leg.from.latitude,
            longitude: leg.from.lon || leg.from.longitude,
          };
          const toCoord = {
            latitude: leg.to.lat || leg.to.latitude,
            longitude: leg.to.lon || leg.to.longitude,
          };

          allCoordinates.push(fromCoord, toCoord);

          // Add walking polyline (dashed or different color)
          newPolylines.push({
            id: `walk-${legIndex}`,
            coordinates: [fromCoord, toCoord],
            color: '#10B981', // Green for walking
            width: 4,
            type: 'walk',
          });

          // Add markers for walking endpoints
          if (legIndex === 0) {
            // Origin marker
            newMarkers.push({
              id: 'origin',
              coordinate: fromCoord,
              title: leg.from.address || leg.from.name || 'Origin',
              type: 'origin',
            });
          }

          if (legIndex === itinerary.legs.length - 1) {
            // Destination marker
            newMarkers.push({
              id: 'destination',
              coordinate: toCoord,
              title: leg.to.address || leg.to.name || 'Destination',
              type: 'destination',
            });
          }
        }
      } else if (leg.mode === 'BUS' || leg.mode === 'TRANSIT') {
        // Transit leg - draw line between stops
        if (leg.fromStop && leg.toStop) {
          const fromCoord = {
            latitude: leg.fromStop.stop_lat || leg.fromStop.lat,
            longitude: leg.fromStop.stop_lon || leg.fromStop.lon,
          };
          const toCoord = {
            latitude: leg.toStop.stop_lat || leg.toStop.lat,
            longitude: leg.toStop.stop_lon || leg.toStop.lon,
          };

          allCoordinates.push(fromCoord, toCoord);

          // Add transit polyline (blue)
          newPolylines.push({
            id: `transit-${legIndex}`,
            coordinates: [fromCoord, toCoord],
            color: '#3B82F6', // Blue for transit
            width: 5,
            type: 'transit',
          });

          // Add stop markers
          newMarkers.push({
            id: `stop-from-${legIndex}`,
            coordinate: fromCoord,
            title: leg.fromStop.stop_name || leg.fromStop.name || 'Stop',
            description: `Route ${leg.routeShortName || leg.routeId}`,
            type: 'stop',
          });

          newMarkers.push({
            id: `stop-to-${legIndex}`,
            coordinate: toCoord,
            title: leg.toStop.stop_name || leg.toStop.name || 'Stop',
            description: `Route ${leg.routeShortName || leg.routeId}`,
            type: 'stop',
          });
        } else if (leg.from && leg.to) {
          // Fallback: use from/to coordinates if stops not available
          const fromCoord = {
            latitude: leg.from.lat || leg.from.latitude,
            longitude: leg.from.lon || leg.from.longitude,
          };
          const toCoord = {
            latitude: leg.to.lat || leg.to.latitude,
            longitude: leg.to.lon || leg.to.longitude,
          };

          allCoordinates.push(fromCoord, toCoord);

          newPolylines.push({
            id: `transit-${legIndex}`,
            coordinates: [fromCoord, toCoord],
            color: '#3B82F6',
            width: 5,
            type: 'transit',
          });
        }
      }
    });

    // Add user location if available
    if (userLocation) {
      allCoordinates.push({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      newMarkers.push({
        id: 'user-location',
        coordinate: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        title: 'Your Location',
        type: 'user',
      });
    }

    // Calculate region to fit all coordinates
    if (allCoordinates.length > 0) {
      const lats = allCoordinates.map((coord) => coord.latitude);
      const lons = allCoordinates.map((coord) => coord.longitude);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      const latDelta = (maxLat - minLat) * 1.3 + 0.01;
      const lonDelta = (maxLon - minLon) * 1.3 + 0.01;

      setRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLon + maxLon) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lonDelta, 0.01),
      });
    }

    setPolylines(newPolylines);
    setMarkers(newMarkers);
  };

  // Check platform first - web doesn't support maps
  if (Platform.OS === 'web' || !MapView || !mapsAvailable) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Route Map</Text>
          <Text style={styles.fallbackText}>
            {Platform.OS === 'web'
              ? 'Maps are not available on web. Showing route summary instead.'
              : 'Map not available. Showing route summary instead.'}
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

  if (!mapReady || !region || !itinerary) {
    return (
      <View style={[styles.container, { height }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading route map...</Text>
      </View>
    );
  }

  const getMarkerColor = (type) => {
    switch (type) {
      case 'origin':
        return '#10B981'; // Green
      case 'destination':
        return '#EF4444'; // Red
      case 'user':
        return '#3B82F6'; // Blue
      case 'stop':
        return '#F59E0B'; // Orange
      default:
        return '#6B7280'; // Gray
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'origin':
        return '📍';
      case 'destination':
        return '🎯';
      case 'user':
        return '👤';
      case 'stop':
        return '🚏';
      default:
        return '📍';
    }
  };

  try {
    return (
      <MapView
        style={[styles.map, { height }]}
        initialRegion={region}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        mapType="standard"
        loadingEnabled={true}
        onMapReady={() => {
          console.log('✅ Trip route map loaded');
          setMapInitialized(true);
        }}
        onError={(error) => {
          console.error('❌ Trip route map error:', error);
        }}
      >
        {/* Polylines for route */}
        {mapInitialized &&
          polylines.map((polyline) => (
            <Polyline
              key={polyline.id}
              coordinates={polyline.coordinates}
              strokeColor={polyline.color}
              strokeWidth={polyline.width}
              lineCap="round"
              lineJoin="round"
            />
          ))}

        {/* Markers */}
        {mapInitialized &&
          markers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={getMarkerColor(marker.type)}
            >
              <View style={styles.customMarker}>
                <Text style={styles.markerIcon}>{getMarkerIcon(marker.type)}</Text>
              </View>
            </Marker>
          ))}
      </MapView>
    );
  } catch (error) {
    console.error('Error rendering trip route map:', error);
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.errorText}>Failed to load route map</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 14,
    padding: 20,
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
  customMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  markerIcon: {
    fontSize: 20,
  },
});

