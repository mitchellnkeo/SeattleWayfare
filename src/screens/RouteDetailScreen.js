/**
 * RouteDetailScreen Component
 * Shows detailed information about a route
 * Based on ROADMAP.md Phase 3.3
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RouteMap from '../components/route/RouteMap';
import ReliabilityChart from '../components/route/ReliabilityChart';
import ServiceAlerts from '../components/route/ServiceAlerts';
import ArrivalCard from '../components/transit/ArrivalCard';
import metroService from '../services/gtfs/metroService';
import obaService from '../services/onebusaway/obaService';
import reliabilityService from '../services/reliability/reliabilityService';
import stService from '../services/soundtransit/stService';

export default function RouteDetailScreen({ route, navigation }) {
  const routeId = route?.params?.routeId;
  const routeShortName = route?.params?.routeShortName;

  const [routeData, setRouteData] = useState(null);
  const [stops, setStops] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);

  useEffect(() => {
    loadRouteData();
  }, [routeId]);

  const loadRouteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize services
      await reliabilityService.initialize();
      await metroService.initialize();

      // Get route data
      let routeInfo;
      if (routeId) {
        routeInfo = metroService.getRouteById(routeId);
      } else if (routeShortName) {
        const routes = metroService.getRoutes();
        routeInfo = routes.find((r) => r.route_short_name === routeShortName);
      }

      if (!routeInfo) {
        setError('Route not found');
        setLoading(false);
        return;
      }

      setRouteData(routeInfo);

      // Get stops for this route (now async with OneBusAway fallback)
      const routeStops = await metroService.getStopsForRoute(routeInfo.route_id);
      setStops(routeStops);

      // Get reliability data
      const reliability = reliabilityService.getRouteReliability(routeInfo.route_id);

      // Get delay prediction for current time
      const delayPrediction = reliabilityService.predictDelay(
        routeInfo.route_id,
        null,
        new Date()
      );

      // Load arrivals for first stop (if OneBusAway is configured)
      if (routeStops.length > 0 && obaService.isConfigured()) {
        try {
          const stopId = routeStops[0].stop_id;
          const obaStopId = stopId.includes('_') ? stopId : `1_${stopId}`;
          const stopArrivals = await obaService.getArrivalsForStop(obaStopId, {
            maxResults: 5,
            routeId: routeInfo.route_id,
          });

          // getArrivalsForStop now returns [] on error, so we can safely use it
          const enhancedArrivals = (stopArrivals || []).map((arrival) => ({
            ...arrival,
            reliability,
          }));

          setArrivals(enhancedArrivals);
          setSelectedStop(routeStops[0]);
        } catch (err) {
          // Error already handled in getArrivalsForStop, just log for debugging
          console.warn('Error loading arrivals (non-critical):', err.message || err);
          setArrivals([]); // Set empty array on error
        }
      }

      // Load service alerts
      try {
        const allAlerts = await stService.getLinkAlerts({ filterActive: true });
        const routeAlerts = allAlerts.filter((alert) =>
          alert.affectedRoutes.includes(routeInfo.route_id)
        );
        setAlerts(routeAlerts);
      } catch (err) {
        console.error('Error loading alerts:', err);
      }
    } catch (err) {
      console.error('Error loading route data:', err);
      setError('Failed to load route information');
    } finally {
      setLoading(false);
    }
  };

  const handleStopPress = async (stop) => {
    setSelectedStop(stop);
    if (obaService.isConfigured()) {
      try {
        const stopId = stop.stop_id;
        const obaStopId = stopId.includes('_') ? stopId : `1_${stopId}`;
        const stopArrivals = await obaService.getArrivalsForStop(obaStopId, {
          maxResults: 5,
          routeId: routeData?.route_id,
        });

        const reliability = reliabilityService.getRouteReliability(routeData?.route_id);
        const enhancedArrivals = stopArrivals.map((arrival) => ({
          ...arrival,
          reliability,
        }));

        setArrivals(enhancedArrivals);
      } catch (err) {
        // Error already handled in getArrivalsForStop, just log for debugging
        console.warn('Error loading arrivals for stop (non-critical):', err.message || err);
        setArrivals([]); // Set empty array on error
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading route details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !routeData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Route not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const reliability = reliabilityService.getRouteReliability(routeData.route_id);
  const delayPrediction = reliabilityService.predictDelay(
    routeData.route_id,
    null,
    new Date()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.routeNumber}>{routeData.route_short_name}</Text>
            <Text style={styles.routeName} numberOfLines={2}>
              {routeData.route_long_name}
            </Text>
          </View>
        </View>

        {/* Route Map */}
        <View style={styles.mapContainer}>
          <RouteMap routeId={routeData.route_id} stops={stops} route={routeData} />
        </View>

        {/* Reliability Chart */}
        <View style={styles.section}>
          <ReliabilityChart
            reliability={reliability}
            delayPrediction={delayPrediction}
          />
        </View>

        {/* Service Alerts */}
        <View style={styles.section}>
          <ServiceAlerts alerts={alerts} routeIds={[routeData.route_id]} />
        </View>

        {/* Stops List */}
        {stops.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Stops ({stops.length})
            </Text>
            <View style={styles.stopsList}>
              {stops.slice(0, 20).map((stop, index) => {
                const isSelected = selectedStop?.stop_id === stop.stop_id;
                return (
                  <TouchableOpacity
                    key={stop.stop_id || index}
                    style={[styles.stopItem, isSelected && styles.stopItemSelected]}
                    onPress={() => handleStopPress(stop)}
                  >
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopName}>{stop.stop_name || stop.name}</Text>
                      {stop.stop_code && (
                        <Text style={styles.stopCode}>Stop {stop.stop_code}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Arrivals for Selected Stop */}
        {selectedStop && arrivals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Next Arrivals at {selectedStop.stop_name || selectedStop.name}
            </Text>
            {arrivals.map((arrival, index) => (
              <ArrivalCard
                key={`${arrival.tripId}-${arrival.scheduledArrivalTime}-${index}`}
                arrival={arrival}
              />
            ))}
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
    marginTop: 16,
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  routeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  routeName: {
    fontSize: 16,
    color: '#6B7280',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  stopsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stopItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  stopCode: {
    fontSize: 12,
    color: '#6B7280',
  },
});

