/**
 * NearbyStopsMap Component
 * Displays user location and nearby transit stops on a map
 * Based on ROADMAP.md Phase 3.1
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import locationService from '../../services/location/locationService';
import metroService from '../../services/gtfs/metroService';

// Lazy load MapView to prevent crashes if native module isn't available
// On web, Metro will use NearbyStopsMap.web.js instead
let MapView = null;
let Marker = null;
let Circle = null;
let mapsAvailable = false;

// Only attempt to load maps on native platforms
// This file should not be used on web - NearbyStopsMap.web.js will be used instead
if (Platform.OS !== 'web') {
  try {
    // Dynamic require to prevent Metro from analyzing on web
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Circle = maps.Circle;
    mapsAvailable = true;
    console.log('✅ react-native-maps loaded successfully');
  } catch (error) {
    console.warn('⚠️ react-native-maps not available:', error.message);
    mapsAvailable = false;
  }
}

// Check if we're in Expo Go (maps don't work in Expo Go)
const isExpoGo = () => {
  try {
    return Constants?.executionEnvironment === 'storeClient';
  } catch {
    return false;
  }
};

let Constants;
try {
  Constants = require('expo-constants').default;
} catch {
  // Constants not available
}

/**
 * NearbyStopsMap - Shows user location and nearby stops on map
 * @param {number} radiusMeters - Search radius in meters (default: 500)
 * @param {Function} onStopPress - Callback when a stop marker is pressed
 */
export default function NearbyStopsMap({ radiusMeters = 500, onStopPress }) {
  // ALL hooks must be declared at the top, before any conditional returns
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // ALL useEffect hooks must be declared before any conditional returns
  // First useEffect: Initialize map ready state
  useEffect(() => {
    // Longer delay to ensure native module is fully initialized
    const timer = setTimeout(() => {
      setMapReady(true);
      // Additional delay before showing markers
      setTimeout(() => {
        setMapInitialized(true);
      }, 500);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Second useEffect: Load location and watch position
  useEffect(() => {
    let isMounted = true;
    let watchSubscription = null;

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

    // Delay initial load slightly to prevent race conditions
    const loadTimer = setTimeout(() => {
      if (isMounted) {
        loadData();
      }
    }, 100);
    
    // Watch for location updates - but only after initial load
    const watchCallback = (location) => {
      if (isMounted && location) {
        // Validate location before setting
        const lat = parseFloat(location.latitude);
        const lon = parseFloat(location.longitude);
        
        if (!isNaN(lat) && !isNaN(lon) && 
            lat >= -90 && lat <= 90 && 
            lon >= -180 && lon <= 180) {
          setUserLocation(location);
          updateNearbyStops(location).catch((err) => {
            console.error('Error updating stops:', err);
          });
        } else {
          console.warn('Invalid location received:', location);
        }
      }
    };
    
    // Start watching after a delay
    const watchTimer = setTimeout(() => {
      locationService.watchPosition(watchCallback, {
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Update every 50 meters
      }).catch((error) => {
        if (isMounted) {
          console.error('Error watching position:', error);
        }
      });
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(loadTimer);
      clearTimeout(watchTimer);
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
      if (!location || !location.latitude || !location.longitude) {
        console.warn('Invalid location for updateNearbyStops:', location);
        return;
      }

      const lat = parseFloat(location.latitude);
      const lon = parseFloat(location.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        console.warn('Location coordinates are not numbers:', lat, lon);
        return;
      }

      // Ensure GTFS is loaded
      await metroService.initialize();
      const allStops = metroService.stops || [];

      if (!allStops || allStops.length === 0) {
        console.warn('No stops available from GTFS');
        setNearbyStops([]);
        return;
      }

      // Find nearby stops
      const stops = locationService.findNearbyStops(
        lat,
        lon,
        allStops,
        radiusMeters
      );

      setNearbyStops(stops || []);
    } catch (err) {
      console.error('Error finding nearby stops:', err);
      setNearbyStops([]);
    }
  };

  // Check platform first - web doesn't support maps
  if (Platform.OS === 'web' || !MapView || !mapsAvailable) {
    const inExpoGo = isExpoGo();
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>📍 Nearby Stops</Text>
          {inExpoGo && (
            <Text style={styles.fallbackWarning}>
              Maps require a development build. Running in Expo Go.
            </Text>
          )}
          {!inExpoGo && (
            <Text style={styles.fallbackWarning}>
              Map component not available. Showing list view instead.
            </Text>
          )}
          {userLocation && (
            <Text style={styles.fallbackLocation}>
              Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          )}
          {nearbyStops.length > 0 ? (
            <View style={styles.fallbackList}>
              {nearbyStops.slice(0, 10).map((stop, index) => {
                const stopName = stop.stop_name || stop.name || 'Unknown Stop';
                return (
                  <View key={stop.stop_id || stop.id || index} style={styles.fallbackItem}>
                    <Text style={styles.fallbackItemName}>{stopName}</Text>
                    <Text style={styles.fallbackItemDistance}>{stop.distance}m away</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.fallbackEmpty}>No stops found within {radiusMeters}m</Text>
          )}
        </View>
      </View>
    );
  }

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
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
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

  // Now we can do conditional returns (all hooks are declared above)
  if (!mapReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Initializing map...</Text>
      </View>
    );
  }

  // Validate region one more time before rendering
  if (!region || isNaN(region.latitude) || isNaN(region.longitude) || 
      region.latitude < -90 || region.latitude > 90 ||
      region.longitude < -180 || region.longitude > 180) {
    console.error('Invalid region:', region);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invalid map region</Text>
        <Text style={styles.errorDetails}>
          Latitude: {region?.latitude}, Longitude: {region?.longitude}
        </Text>
      </View>
    );
  }

  try {
    return (
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false} // Disable to prevent crashes
        showsMyLocationButton={false}
        followsUserLocation={false}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor="#3B82F6"
        loadingBackgroundColor="#F9FAFB"
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        onMapReady={() => {
          console.log('✅ Map loaded successfully');
          setMapInitialized(true);
        }}
        onError={(error) => {
          console.error('❌ Map error:', error);
          setError('Map failed to load: ' + (error?.message || 'Unknown error'));
        }}
        onLayout={() => {
          console.log('Map layout completed');
        }}
      >
      {/* Only render markers after map is fully initialized and ready */}
      {mapInitialized && userLocation && 
       userLocation.latitude && userLocation.longitude &&
       !isNaN(parseFloat(userLocation.latitude)) && 
       !isNaN(parseFloat(userLocation.longitude)) && (
        <>
          {/* User location marker - simplified, no circles to reduce complexity */}
          <Marker
            coordinate={{
              latitude: parseFloat(userLocation.latitude),
              longitude: parseFloat(userLocation.longitude),
            }}
            title="Your Location"
            pinColor="#3B82F6"
            identifier="user-location"
          />
        </>
      )}

      {/* Nearby stops markers - only render after map is ready and stops are loaded */}
      {mapInitialized && nearbyStops && nearbyStops.length > 0 && nearbyStops.map((stop, index) => {
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
                try {
                  if (onStopPress) {
                    onStopPress(stop);
                  }
                } catch (error) {
                  console.error('Error in stop press handler:', error);
                }
              }}
            />
          );
        } catch (error) {
          console.error('Error rendering stop marker:', error, stop);
          return null;
        }
      })}
      </MapView>
    );
  } catch (error) {
    console.error('❌ Error rendering map:', error);
    console.error('Error stack:', error.stack);
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load map</Text>
        <Text style={styles.errorDetails}>
          {error?.message || 'Unknown error occurred'}
        </Text>
        <Text style={styles.errorDetails}>
          Please check console for details
        </Text>
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
  fallbackContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  fallbackWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  fallbackLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  fallbackList: {
    marginTop: 8,
  },
  fallbackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  fallbackItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  fallbackItemDistance: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  fallbackEmpty: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
});

