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
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      // Default to Bothell if location is invalid
      return {
        latitude: 47.7619,
        longitude: -122.2056,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }

    const lat = parseFloat(userLocation.latitude);
    const lon = parseFloat(userLocation.longitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      // Default to Bothell if coordinates are invalid
      return {
        latitude: 47.7619,
        longitude: -122.2056,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    
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

  const region = getInitialRegion();

  // Don't render map if region is invalid
  if (!region || isNaN(region.latitude) || isNaN(region.longitude)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid map region</Text>
      </View>
    );
  }

  try {
    return (
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false} // Disable to prevent crashes, we'll show it manually
        showsMyLocationButton={false}
        followsUserLocation={false}
        mapType="standard"
        loadingEnabled={true}
        onMapReady={() => {
          console.log('Map loaded successfully');
        }}
        onError={(error) => {
          console.error('Map error:', error);
          setError('Map failed to load');
        }}
      >
      {/* User location marker */}
      {userLocation && userLocation.latitude && userLocation.longitude && (
        <>
          {/* User location accuracy circle */}
          {userLocation.accuracy && userLocation.accuracy > 0 && (
            <Circle
              center={{
                latitude: parseFloat(userLocation.latitude),
                longitude: parseFloat(userLocation.longitude),
              }}
              radius={Math.min(userLocation.accuracy, 1000)} // Cap at 1km
              strokeColor="#3B82F6"
              fillColor="rgba(59, 130, 246, 0.1)"
              strokeWidth={2}
            />
          )}

          {/* User location marker */}
          <Marker
            coordinate={{
              latitude: parseFloat(userLocation.latitude),
              longitude: parseFloat(userLocation.longitude),
            }}
            title="Your Location"
            pinColor="#3B82F6"
          />

          {/* Search radius circle */}
          <Circle
            center={{
              latitude: parseFloat(userLocation.latitude),
              longitude: parseFloat(userLocation.longitude),
            }}
            radius={radiusMeters}
            strokeColor="#10B981"
            fillColor="rgba(16, 185, 129, 0.1)"
            strokeWidth={2}
          />
        </>
      )}

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
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load map</Text>
        <Text style={styles.errorDetails}>{error.message}</Text>
      </View>
    );
  }
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
  errorDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
});

