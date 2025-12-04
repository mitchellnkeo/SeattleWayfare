/**
 * RouteMap Component
 * Displays a route on a map with all stops
 * Based on ROADMAP.md Phase 3.3
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import locationService from '../../services/location/locationService';
import metroService from '../../services/gtfs/metroService';
import obaService from '../../services/onebusaway/obaService';
import { gtfsToObaRouteId } from '../../utils/idMapping';

// Lazy load MapView - only on native platforms (not web)
// On web, Metro will use RouteMap.web.js instead
let MapView = null;
let Marker = null;
let Polyline = null;
let mapsAvailable = false;

// Only attempt to load maps on native platforms
// This file should not be used on web - RouteMap.web.js will be used instead
if (Platform.OS !== 'web') {
  try {
    // Dynamic require to prevent Metro from analyzing on web
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
 * RouteMap - Shows route on map with stops
 * @param {string} routeId - Route ID
 * @param {Array} stops - Array of stops on the route
 * @param {Object} route - Route object with details
 */
export default function RouteMap({ routeId, stops = [], route }) {
  const [mapReady, setMapReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [region, setRegion] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [showVehicles, setShowVehicles] = useState(true);
  const [followedVehicleId, setFollowedVehicleId] = useState(null);
  const vehicleUpdateInterval = useRef(null);
  const mapRef = useRef(null);

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

  // Follow the selected vehicle as it moves
  useEffect(() => {
    if (followedVehicleId && mapRef.current && mapInitialized) {
      const followedVehicle = vehicles.find(v => v.vehicleId === followedVehicleId);
      if (followedVehicle && followedVehicle.latitude && followedVehicle.longitude) {
        // Smoothly animate map to follow the vehicle
        mapRef.current.animateToRegion({
          latitude: followedVehicle.latitude,
          longitude: followedVehicle.longitude,
          latitudeDelta: 0.01, // Zoomed in view
          longitudeDelta: 0.01,
        }, 500); // 500ms animation
      }
    }
  }, [followedVehicleId, vehicles, mapInitialized]);

  // Fetch live vehicle positions
  useEffect(() => {
    if (!routeId || !obaService.isConfigured() || stops.length === 0) {
      return;
    }

    const fetchVehicles = async () => {
      try {
        // Convert GTFS route ID to OBA format
        const obaRouteId = gtfsToObaRouteId(routeId);
        // Pass stops to help find vehicles
        const routeVehicles = await obaService.getVehiclesForRoute(obaRouteId, stops);
        setVehicles(routeVehicles || []);
      } catch (error) {
        console.warn('Error fetching vehicles for route:', error);
        setVehicles([]);
      }
    };

    // Fetch immediately
    fetchVehicles();

    // Update every 10 seconds for smoother live tracking
    vehicleUpdateInterval.current = setInterval(() => {
      fetchVehicles();
    }, 10000);

    return () => {
      if (vehicleUpdateInterval.current) {
        clearInterval(vehicleUpdateInterval.current);
      }
    };
  }, [routeId, stops]);

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

  // Check platform first - web doesn't support maps
  if (Platform.OS === 'web' || !MapView || !mapsAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Route Map</Text>
          <Text style={styles.fallbackText}>
            {Platform.OS === 'web'
              ? 'Maps are not available on web. Showing stop list instead.'
              : 'Map not available. Showing stop list instead.'}
          </Text>
          {stops.length > 0 && (
            <View style={styles.stopsList}>
              {stops.map((stop, index) => (
                <Text key={stop.stop_id || index} style={styles.stopItem}>
                  {index + 1}. {stop.stop_name || stop.name || 'Unknown Stop'}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // If we have stops but no region yet, keep loading
  if (stops && stops.length > 0 && !region) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading route map...</Text>
      </View>
    );
  }

  // If no stops available, show message
  if (!stops || stops.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Route Map</Text>
          <Text style={styles.fallbackText}>
            Stop information not available for this route.
          </Text>
          <Text style={styles.fallbackSubtext}>
            This may be because stop data is still loading or the route has no active stops.
          </Text>
        </View>
      </View>
    );
  }

  // If map not ready but we have stops and region, show loading
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
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          region={followedVehicleId ? undefined : region} // Let region control when not following
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
          onPress={() => {
            // Tap outside vehicle - unlock following
            if (followedVehicleId) {
              setFollowedVehicleId(null);
            }
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

        {/* Live vehicle markers with animation */}
        {mapInitialized && showVehicles && vehicles.length > 0 &&
          vehicles.map((vehicle) => {
            if (!vehicle.latitude || !vehicle.longitude) {
              return null;
            }

            const isFollowed = followedVehicleId === vehicle.vehicleId;

            return (
              <AnimatedVehicleMarker
                key={vehicle.vehicleId || `vehicle-${vehicle.tripId}`}
                vehicle={vehicle}
                route={route}
                isFollowed={isFollowed}
                onPress={() => {
                  // Toggle follow state
                  if (isFollowed) {
                    setFollowedVehicleId(null);
                  } else {
                    setFollowedVehicleId(vehicle.vehicleId);
                  }
                }}
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

/**
 * Animated vehicle marker component for smooth movement
 * Uses interpolation to smoothly transition between position updates
 */
function AnimatedVehicleMarker({ vehicle, route, isFollowed = false, onPress }) {
  const [displayCoordinate, setDisplayCoordinate] = useState({
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
  });
  const [displayRotation, setDisplayRotation] = useState(vehicle.heading || 0);
  const animationRef = useRef(null);

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    const startLat = displayCoordinate.latitude;
    const startLon = displayCoordinate.longitude;
    const endLat = vehicle.latitude;
    const endLon = vehicle.longitude;
    const startRotation = displayRotation;
    const endRotation = vehicle.heading || 0;

    const duration = 1000; // 1 second animation
    const steps = 20; // 20 steps for smooth animation
    const stepDuration = duration / steps;
    let currentStep = 0;

    animationRef.current = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // Linear interpolation
      const newLat = startLat + (endLat - startLat) * progress;
      const newLon = startLon + (endLon - startLon) * progress;
      
      // Handle rotation (account for 360-degree wrap)
      let newRotation = startRotation;
      if (Math.abs(endRotation - startRotation) > 180) {
        // Handle wrap-around
        if (endRotation > startRotation) {
          newRotation = startRotation - (360 - (endRotation - startRotation)) * progress;
        } else {
          newRotation = startRotation + (360 - (startRotation - endRotation)) * progress;
        }
      } else {
        newRotation = startRotation + (endRotation - startRotation) * progress;
      }
      // Normalize rotation to 0-360
      newRotation = ((newRotation % 360) + 360) % 360;

      setDisplayCoordinate({ latitude: newLat, longitude: newLon });
      setDisplayRotation(newRotation);

      if (currentStep >= steps) {
        // Animation complete - set final values
        setDisplayCoordinate({ latitude: endLat, longitude: endLon });
        setDisplayRotation(endRotation);
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }, stepDuration);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [vehicle.latitude, vehicle.longitude, vehicle.heading]);

  return (
    <Marker
      coordinate={displayCoordinate}
      title={`🚌 Route ${route?.route_short_name || 'Bus'}`}
      description={isFollowed ? 'Following - Tap to unlock' : 'Tap to follow'}
      pinColor={isFollowed ? "#3B82F6" : "#22C55E"} // Blue when followed, green otherwise
      rotation={displayRotation}
      onPress={(e) => {
        e.stopPropagation(); // Prevent map onPress from firing
        if (onPress) {
          onPress();
        }
      }}
      zIndex={isFollowed ? 1000 : 1} // Bring followed vehicle to front
    >
      {/* Custom bus icon */}
      <View style={[styles.vehicleMarker, isFollowed && styles.vehicleMarkerFollowed]}>
        <Text style={styles.vehicleEmoji}>🚌</Text>
        {isFollowed && (
          <View style={styles.followIndicator}>
            <Text style={styles.followIndicatorText}>📍</Text>
          </View>
        )}
      </View>
    </Marker>
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
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
  vehicleMarker: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vehicleMarkerFollowed: {
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    elevation: 8,
  },
  vehicleEmoji: {
    fontSize: 20,
  },
  followIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  followIndicatorText: {
    fontSize: 12,
  },
});

