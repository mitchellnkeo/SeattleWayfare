/**
 * TripPlannerScreen Component
 * Main trip planning screen with origin/destination input and route options
 * Based on ROADMAP.md Phase 3.2
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RouteModeToggle from '../components/trip/RouteModeToggle';
import TripOptionCard from '../components/trip/TripOptionCard';
import locationService from '../services/location/locationService';
import metroService from '../services/gtfs/metroService';
import reliabilityService from '../services/reliability/reliabilityService';

export default function TripPlannerScreen({ navigation }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState('fast'); // 'fast' or 'safe'
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  useEffect(() => {
    // Initialize services
    reliabilityService.initialize();
    metroService.initialize();
  }, []);

  const handleUseCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        // Find nearest stop to current location
        await metroService.initialize();
        const allStops = metroService.stops || [];
        const nearbyStops = locationService.findNearbyStops(
          location.latitude,
          location.longitude,
          allStops,
          200 // 200m radius
        );

        if (nearbyStops.length > 0) {
          const nearestStop = nearbyStops[0];
          setOrigin(nearestStop.stop_name || nearestStop.name || 'Current Location');
          setUseCurrentLocation(true);
        } else {
          setOrigin('Current Location');
          setUseCurrentLocation(true);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setError('Could not get current location');
    }
  };

  const searchStops = async (query) => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      await metroService.initialize();
      const stops = metroService.searchStops(query);
      return stops.slice(0, 10); // Return top 10 matches
    } catch (error) {
      console.error('Error searching stops:', error);
      return [];
    }
  };

  const planTrip = async () => {
    if (!origin || !destination) {
      setError('Please enter both origin and destination');
      return;
    }

    setLoading(true);
    setError(null);
    setItineraries([]);

    try {
      // For now, create a simplified trip plan
      // In a full implementation, this would use a routing API
      // This is a placeholder that shows the structure

      // Find origin and destination stops
      await metroService.initialize();
      const originStops = await searchStops(origin);
      const destStops = await searchStops(destination);

      if (originStops.length === 0 || destStops.length === 0) {
        setError('Could not find stops matching your origin or destination');
        setLoading(false);
        return;
      }

      const originStop = originStops[0];
      const destStop = destStops[0];

      // Get routes serving these stops
      const originRoutes = metroService.getRoutesForStop(originStop.stop_id);
      const destRoutes = metroService.getRoutesForStop(destStop.stop_id);

      // Find common routes (direct connection)
      const commonRoutes = originRoutes.filter((route) =>
        destRoutes.some((dr) => dr.route_id === route.route_id)
      );

      // Generate simplified itineraries
      const generatedItineraries = [];

      // Direct route option
      if (commonRoutes.length > 0) {
        const route = commonRoutes[0];
        const routeReliability = reliabilityService.getRouteReliability(route.route_id);
        const now = Date.now();
        const estimatedDuration = 30; // Simplified estimate

        generatedItineraries.push({
          id: 'direct-1',
          startTime: now + 5 * 60000, // 5 min from now
          endTime: now + (5 + estimatedDuration) * 60000,
          duration: estimatedDuration,
          walkTime: 5,
          transitTime: estimatedDuration - 5,
          waitingTime: 5,
          legs: [
            {
              mode: 'WALK',
              duration: 5,
              distance: 400,
            },
            {
              mode: 'BUS',
              routeId: route.route_id,
              routeShortName: route.route_short_name,
              headsign: 'Destination',
              duration: estimatedDuration - 10,
              reliability: routeReliability,
            },
            {
              mode: 'WALK',
              duration: 5,
              distance: 300,
            },
          ],
          overallReliability: routeReliability.reliability,
          transferRisks: [],
          rank: 1,
        });
      }

      // Transfer option (if no direct route)
      if (commonRoutes.length === 0 && originRoutes.length > 0 && destRoutes.length > 0) {
        const route1 = originRoutes[0];
        const route2 = destRoutes[0];
        const route1Reliability = reliabilityService.getRouteReliability(route1.route_id);
        const route2Reliability = reliabilityService.getRouteReliability(route2.route_id);

        const now = Date.now();
        const leg1Duration = 20;
        const leg2Duration = 15;
        const transferTime = 5;
        const totalDuration = leg1Duration + transferTime + leg2Duration;

        // Calculate transfer risk
        const firstArrival = {
          routeId: route1.route_id,
          predictedArrivalTime: now + (5 + leg1Duration) * 60000,
          scheduledArrivalTime: now + (5 + leg1Duration) * 60000,
        };
        const secondDeparture = {
          scheduledDepartureTime: now + (5 + leg1Duration + transferTime) * 60000,
        };

        const transferRisk = reliabilityService.calculateTransferRisk(
          firstArrival,
          secondDeparture,
          2
        );

        const itineraryReliability = reliabilityService.calculateItineraryReliability([
          {
            mode: 'WALK',
            duration: 5,
          },
          {
            mode: 'BUS',
            routeId: route1.route_id,
            routeShortName: route1.route_short_name,
            startTime: now + 5 * 60000,
            endTime: now + (5 + leg1Duration) * 60000,
            duration: leg1Duration,
          },
          {
            mode: 'WALK',
            duration: 2,
          },
          {
            mode: 'BUS',
            routeId: route2.route_id,
            routeShortName: route2.route_short_name,
            startTime: now + (5 + leg1Duration + transferTime) * 60000,
            endTime: now + (5 + totalDuration) * 60000,
            duration: leg2Duration,
          },
          {
            mode: 'WALK',
            duration: 5,
          },
        ]);

        generatedItineraries.push({
          id: 'transfer-1',
          startTime: now + 5 * 60000,
          endTime: now + (5 + totalDuration) * 60000,
          duration: totalDuration,
          walkTime: 12,
          transitTime: leg1Duration + leg2Duration,
          waitingTime: transferTime,
          legs: [
            {
              mode: 'WALK',
              duration: 5,
              distance: 400,
            },
            {
              mode: 'BUS',
              routeId: route1.route_id,
              routeShortName: route1.route_short_name,
              headsign: 'Transfer Point',
              duration: leg1Duration,
              reliability: route1Reliability,
            },
            {
              mode: 'WALK',
              duration: 2,
              distance: 150,
            },
            {
              mode: 'BUS',
              routeId: route2.route_id,
              routeShortName: route2.route_short_name,
              headsign: 'Destination',
              duration: leg2Duration,
              reliability: route2Reliability,
            },
            {
              mode: 'WALK',
              duration: 5,
              distance: 300,
            },
          ],
          overallReliability: itineraryReliability.overallReliability,
          transferRisks: [transferRisk],
          rank: 2,
        });
      }

      // Sort by mode preference
      if (mode === 'safe') {
        generatedItineraries.sort((a, b) => {
          const reliabilityOrder = { high: 3, medium: 2, low: 1 };
          return (
            reliabilityOrder[b.overallReliability] - reliabilityOrder[a.overallReliability] ||
            a.transferRisks.length - b.transferRisks.length ||
            a.duration - b.duration
          );
        });
      } else {
        generatedItineraries.sort((a, b) => a.duration - b.duration);
      }

      // Mark first as recommended
      if (generatedItineraries.length > 0) {
        generatedItineraries[0].recommended = true;
      }

      setItineraries(generatedItineraries);
    } catch (error) {
      console.error('Error planning trip:', error);
      setError('Failed to plan trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Plan Trip</Text>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={20} color="#3B82F6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="From (stop name or address)"
                value={origin}
                onChangeText={setOrigin}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                style={styles.currentLocationButton}
              >
                <Ionicons name="locate" size={18} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#EF4444" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="To (stop name or address)"
                value={destination}
                onChangeText={setDestination}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={planTrip}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={styles.searchButtonText}>Plan Trip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Mode Toggle */}
          <RouteModeToggle mode={mode} onModeChange={setMode} />

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Results */}
          {itineraries.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                {itineraries.length} Route Option{itineraries.length !== 1 ? 's' : ''} Found
              </Text>
              {itineraries.map((itinerary) => (
                <TripOptionCard
                  key={itinerary.id}
                  itinerary={itinerary}
                  recommended={itinerary.recommended}
                  onPress={() => {
                    // Navigate to route detail (to be implemented)
                    console.log('View itinerary:', itinerary.id);
                  }}
                />
              ))}
            </View>
          )}

          {/* Empty State */}
          {!loading && itineraries.length === 0 && !error && (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>Enter origin and destination to plan your trip</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  currentLocationButton: {
    padding: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});

