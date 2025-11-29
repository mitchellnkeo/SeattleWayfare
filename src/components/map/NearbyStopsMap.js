/**
 * NearbyStopsMap Component
 * Displays user location and nearby transit stops on a map
 * Based on ROADMAP.md Phase 3.1
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import locationService from '../../services/location/locationService';
import metroService from '../../services/gtfs/metroService';

/**
 * NearbyStopsMap - Shows user location and nearby stops on map
 * @param {number} radiusMeters - Search radius in meters (default: 500)
 * @param {Function} onStopPress - Callback when a stop marker is pressed
 */
export default function NearbyStopsMap({ radiusMeters = 500, onStopPress }) {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        await loadLocationAndStops();
      } catch (error) {
        if (isMounted) {
          console.error('Error in loadLocationAndStops:', error);
          setError('Failed to load location');
        }
      }
    };

    loadData();
    
    // Watch for location updates
    const watchCallback = (location) => {
      if (isMounted) {
        setUserLocation(location);
        updateNearbyStops(location);
      }
    };
    
    locationService.watchPosition(watchCallback, {
      timeInterval: 30000, // Update every 30 seconds
      distanceInterval: 50, // Update every 50 meters
    }).catch((error) => {
      if (isMounted) {
        console.error('Error watching position:', error);
      }
    });

    return () => {
      isMounted = false;
      locationService.stopWatching();
    };
  }, [radiusMeters]);

  const loadLocationAndStops = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current location
      const location = await locationService.getCurrentLocation();
      if (!location) {
        // Use default Bothell location if permission denied (user mentioned they live in Bothell)
        const defaultLocation = {
          latitude: 47.7619, // Bothell
          longitude: -122.2056,
          accuracy: 50,
        };
        setUserLocation(defaultLocation);
        await updateNearbyStops(defaultLocation);
        setLoading(false);
        return;
      }

      setUserLocation(location);
      await updateNearbyStops(location);
    } catch (err) {
      console.error('Error loading location:', err);
      setError('Could not get location');
      // Use default Bothell location
      const defaultLocation = {
        latitude: 47.7619, // Bothell
        longitude: -122.2056,
        accuracy: 50,
      };
      setUserLocation(defaultLocation);
      await updateNearbyStops(defaultLocation);
    } finally {
      setLoading(false);
    }
  };

  const updateNearbyStops = async (location) => {
    try {
      // Ensure GTFS is loaded
      await metroService.initialize();
      const allStops = metroService.stops || [];

      // Find nearby stops
      const stops = locationService.findNearbyStops(
        location.latitude,
        location.longitude,
        allStops,
        radiusMeters
      );

      setNearbyStops(stops);
    } catch (err) {
      console.error('Error finding nearby stops:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error && !userLocation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!userLocation) {
    return null;
  }

  // Calculate appropriate region based on location
  // Use larger delta for areas outside Seattle city center
  const getInitialRegion = () => {
    const lat = userLocation.latitude;
    const lon = userLocation.longitude;
    
    // Adjust delta based on location - larger for suburban areas
    let latDelta = 0.015; // ~1.5km
    let lonDelta = 0.015;
    
    // If in Bothell/Lynnwood area (north), use larger delta
    if (lat > 47.7) {
      latDelta = 0.02;
      lonDelta = 0.02;
    }
    
    // If in Bellevue/Redmond area (east), use larger delta
    if (lon > -122.1) {
      latDelta = 0.02;
      lonDelta = 0.02;
    }
    
    return {
      latitude: lat,
      longitude: lon,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    };
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={getInitialRegion()}
      showsUserLocation={true}
      showsMyLocationButton={true}
      followsUserLocation={false}
      mapType="standard"
    >
      {/* User location accuracy circle */}
      {userLocation.accuracy && (
        <Circle
          center={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          radius={userLocation.accuracy}
          strokeColor="#3B82F6"
          fillColor="rgba(59, 130, 246, 0.1)"
          strokeWidth={2}
        />
      )}

      {/* Search radius circle */}
      <Circle
        center={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        radius={radiusMeters}
        strokeColor="#10B981"
        fillColor="rgba(16, 185, 129, 0.1)"
        strokeWidth={2}
      />

      {/* Nearby stops markers */}
      {nearbyStops.map((stop, index) => {
        try {
          const stopLat = parseFloat(stop.stop_lat || stop.lat);
          const stopLon = parseFloat(stop.stop_lon || stop.lon);
          const stopName = stop.stop_name || stop.name || 'Unknown Stop';

          if (!stopLat || !stopLon || isNaN(stopLat) || isNaN(stopLon)) {
            return null;
          }

          return (
            <Marker
              key={stop.stop_id || stop.id || `stop-${index}-${stopLat}-${stopLon}`}
              coordinate={{
                latitude: stopLat,
                longitude: stopLon,
              }}
              title={stopName}
              description={`${stop.distance || 0}m away`}
              pinColor="#EF4444"
              onPress={() => {
                if (onStopPress) {
                  onStopPress(stop);
                }
              }}
            />
          );
        } catch (error) {
          console.error('Error rendering stop marker:', error);
          return null;
        }
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
  },
});

