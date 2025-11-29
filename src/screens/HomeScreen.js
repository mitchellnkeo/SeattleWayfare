/**
 * HomeScreen Component
 * Main screen showing nearby stops, arrivals, and quick access to saved commutes
 * Based on ROADMAP.md Phase 3.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NearbyStopsMap from '../components/map/NearbyStopsMap';
import ArrivalCard from '../components/transit/ArrivalCard';
import locationService from '../services/location/locationService';
import metroService from '../services/gtfs/metroService';
import obaService from '../services/onebusaway/obaService';
import reliabilityService from '../services/reliability/reliabilityService';

export default function HomeScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeScreen();
    
    // Set up location watching
    const watchCallback = (location) => {
      setUserLocation(location);
      updateNearbyStops(location);
    };
    
    locationService.watchPosition(watchCallback);

    return () => {
      locationService.stopWatching();
    };
  }, []);

  useEffect(() => {
    if (selectedStop) {
      loadArrivalsForStop(selectedStop);
    } else if (nearbyStops.length > 0) {
      // Load arrivals for closest stop by default
      loadArrivalsForStop(nearbyStops[0]);
    }
  }, [nearbyStops, selectedStop]);

  const initializeScreen = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize services
      await reliabilityService.initialize();
      await metroService.initialize();

      // Get user location
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        updateNearbyStops(location);
      } else {
        // Use default Seattle location
        const defaultLocation = {
          latitude: 47.609421,
          longitude: -122.337631,
          accuracy: 50,
        };
        setUserLocation(defaultLocation);
        updateNearbyStops(defaultLocation);
      }
    } catch (err) {
      console.error('Error initializing screen:', err);
      setError('Failed to initialize. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateNearbyStops = async (location) => {
    try {
      const allStops = metroService.stops || [];
      const stops = locationService.findNearbyStops(
        location.latitude,
        location.longitude,
        allStops,
        500 // 500 meter radius
      );
      setNearbyStops(stops);
    } catch (err) {
      console.error('Error updating nearby stops:', err);
    }
  };

  const loadArrivalsForStop = async (stop) => {
    try {
      if (!stop) return;

      // Get stop ID - handle both GTFS and OneBusAway formats
      const stopId = stop.stop_id || stop.id;
      if (!stopId) return;

      // Convert GTFS stop ID to OneBusAway format if needed
      // GTFS: "100275", OneBusAway: "1_100275"
      let obaStopId = stopId;
      if (!stopId.includes('_')) {
        obaStopId = `1_${stopId}`;
      }

      // Check if OneBusAway is configured
      if (!obaService.isConfigured()) {
        console.warn('OneBusAway API key not configured');
        setArrivals([]);
        return;
      }

      // Get arrivals from OneBusAway
      const obaArrivals = await obaService.getArrivalsForStop(obaStopId, {
        maxResults: 10,
      });

      // Enhance arrivals with reliability data
      const enhancedArrivals = obaArrivals.map((arrival) => {
        const routeReliability = reliabilityService.getRouteReliability(
          arrival.routeId
        );
        return {
          ...arrival,
          reliability: routeReliability,
        };
      });

      setArrivals(enhancedArrivals);
    } catch (err) {
      console.error('Error loading arrivals:', err);
      setArrivals([]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeScreen();
    if (selectedStop || nearbyStops.length > 0) {
      await loadArrivalsForStop(selectedStop || nearbyStops[0]);
    }
    setRefreshing(false);
  }, [selectedStop, nearbyStops]);

  const handleStopPress = (stop) => {
    setSelectedStop(stop);
    loadArrivalsForStop(stop);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading nearby stops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={initializeScreen}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStop = selectedStop || nearbyStops[0];
  const stopName = currentStop
    ? currentStop.stop_name || currentStop.name || 'Unknown Stop'
    : 'No stops nearby';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nearby Stops</Text>
          <Text style={styles.subtitle}>
            {nearbyStops.length} stop{nearbyStops.length !== 1 ? 's' : ''}{' '}
            within 500m
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <NearbyStopsMap
            radiusMeters={500}
            onStopPress={handleStopPress}
          />
        </View>

        {/* Current Stop Info */}
        {currentStop && (
          <View style={styles.stopInfo}>
            <Text style={styles.stopName}>{stopName}</Text>
            <Text style={styles.stopDistance}>
              {currentStop.distance}m away
            </Text>
          </View>
        )}

        {/* Arrivals */}
        {arrivals.length > 0 ? (
          <View style={styles.arrivalsSection}>
            <Text style={styles.sectionTitle}>Next Arrivals</Text>
            {arrivals.map((arrival, index) => (
              <ArrivalCard
                key={`${arrival.tripId}-${arrival.scheduledArrivalTime}-${index}`}
                arrival={arrival}
                onPress={() => {
                  // Navigate to route detail (to be implemented)
                  console.log('Navigate to route:', arrival.routeId);
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noArrivals}>
            <Text style={styles.noArrivalsText}>
              {obaService.isConfigured()
                ? 'No arrivals available'
                : 'OneBusAway API key not configured'}
            </Text>
          </View>
        )}

        {/* Nearby Stops List */}
        {nearbyStops.length > 1 && (
          <View style={styles.stopsListSection}>
            <Text style={styles.sectionTitle}>Other Nearby Stops</Text>
            {nearbyStops.slice(1, 6).map((stop, index) => {
              const name = stop.stop_name || stop.name || 'Unknown Stop';
              return (
                <TouchableOpacity
                  key={stop.stop_id || stop.id || `stop-${index}`}
                  style={styles.stopItem}
                  onPress={() => handleStopPress(stop)}
                >
                  <Text style={styles.stopItemName}>{name}</Text>
                  <Text style={styles.stopItemDistance}>{stop.distance}m</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  mapContainer: {
    height: 300,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  stopInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  stopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stopDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  arrivalsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  noArrivals: {
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  noArrivalsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stopsListSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  stopItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  stopItemDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
});

