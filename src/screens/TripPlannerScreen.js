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
import StopAutocomplete from '../components/trip/StopAutocomplete';
import locationService from '../services/location/locationService';
import metroService from '../services/gtfs/metroService';
import reliabilityService from '../services/reliability/reliabilityService';
import obaService from '../services/onebusaway/obaService';

export default function TripPlannerScreen({ navigation, route }) {
  try {
    console.log('🚀 TripPlannerScreen rendering...', { hasNavigation: !!navigation, hasRoute: !!route });
  } catch (e) {
    console.error('Error in initial log:', e);
  }
  
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [originStop, setOriginStop] = useState(null); // Selected stop object
  const [destinationStop, setDestinationStop] = useState(null); // Selected stop object
  const [mode, setMode] = useState('fast'); // 'fast' or 'safe'
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  
  try {
    console.log('📊 TripPlannerScreen state initialized');
  } catch (e) {
    console.error('Error logging state:', e);
  }

  // Handle route params (if navigating from saved commutes)
  useEffect(() => {
    try {
      if (route && route.params) {
        const { origin: routeOrigin, destination: routeDest, safeMode } = route.params;
        if (routeOrigin) {
          const originValue = typeof routeOrigin === 'string' 
            ? routeOrigin 
            : (routeOrigin?.name || routeOrigin?.address || '');
          if (originValue) {
            setOrigin(originValue);
          }
        }
        if (routeDest) {
          const destValue = typeof routeDest === 'string' 
            ? routeDest 
            : (routeDest?.name || routeDest?.address || '');
          if (destValue) {
            setDestination(destValue);
          }
        }
        if (safeMode !== undefined) {
          setMode(safeMode ? 'safe' : 'fast');
        }
      }
    } catch (err) {
      console.error('Error handling route params:', err);
    }
  }, [route]);

  useEffect(() => {
    let isMounted = true;
    
    // Initialize services
    const initServices = async () => {
      try {
        console.log('🔄 Initializing Trip Planner services...');
        
        // Initialize reliability service first
        if (reliabilityService) {
          try {
            console.log('📊 Initializing reliability service...');
            await reliabilityService.initialize();
            console.log('✅ Reliability service initialized');
          } catch (reliabilityError) {
            console.error('❌ Error initializing reliability service:', reliabilityError);
            console.error('Reliability error stack:', reliabilityError?.stack);
            // Continue even if reliability service fails
          }
        } else {
          console.warn('⚠️ Reliability service not available');
        }
        
        // Initialize metro service
        if (metroService) {
          try {
            console.log('🚌 Initializing metro service...');
            await metroService.initialize();
            console.log('✅ Metro service initialized');
          } catch (metroError) {
            console.error('❌ Error initializing metro service:', metroError);
            console.error('Metro error stack:', metroError?.stack);
            // Continue even if metro service fails
          }
        } else {
          console.warn('⚠️ Metro service not available');
        }
        
        if (isMounted) {
          setIsInitialized(true);
          console.log('✅ Trip Planner services initialized');
        }
      } catch (error) {
        console.error('❌ Fatal error initializing services:', error);
        console.error('Error stack:', error.stack);
        // Don't crash the app, just log the error
        if (isMounted) {
          setIsInitialized(true); // Set to true anyway so UI can render
        }
      }
    };
    
    // Use setTimeout with delay to ensure component is mounted before async operations
    // Also wrap in try-catch to prevent unhandled promise rejections
    const timeoutId = setTimeout(() => {
      initServices().catch((err) => {
        console.error('❌ Unhandled error in initServices:', err);
        if (isMounted) {
          setIsInitialized(true);
        }
      });
    }, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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
      await metroService.initialize();
      
      // Use selected stops if available, otherwise search
      let selectedOriginStop = originStop;
      let selectedDestStop = destinationStop;
      
      if (!selectedOriginStop) {
        const originStops = await searchStops(origin);
        if (originStops.length === 0) {
          setError('Could not find stops matching your origin');
          setLoading(false);
          return;
        }
        selectedOriginStop = originStops[0];
      }
      
      if (!selectedDestStop) {
        const destStops = await searchStops(destination);
        if (destStops.length === 0) {
          setError('Could not find stops matching your destination');
          setLoading(false);
          return;
        }
        selectedDestStop = destStops[0];
      }

      const originStopObj = selectedOriginStop;
      const destStopObj = selectedDestStop;

      // Get routes serving these stops (now always async)
      console.log('🔍 Finding routes for origin stop:', originStopObj.stop_id);
      const originRoutes = await metroService.getRoutesForStop(originStopObj.stop_id);
      console.log('🔍 Finding routes for destination stop:', destStopObj.stop_id);
      const destRoutes = await metroService.getRoutesForStop(destStopObj.stop_id);
      
      console.log(`✅ Found ${originRoutes.length} routes for origin, ${destRoutes.length} routes for destination`);
      
      if (originRoutes.length === 0) {
        setError(`No routes found serving ${originStopObj.stop_name || origin}. Try a different origin.`);
        setLoading(false);
        return;
      }
      
      if (destRoutes.length === 0) {
        setError(`No routes found serving ${destStopObj.stop_name || destination}. Try a different destination.`);
        setLoading(false);
        return;
      }

      // Find common routes (direct connection)
      const commonRoutes = originRoutes.filter((route) =>
        destRoutes.some((dr) => dr.route_id === route.route_id)
      );

      // Generate simplified itineraries
      const generatedItineraries = [];

      // Direct route option
      if (commonRoutes.length > 0) {
        const route = commonRoutes[0];
        const routeReliability = reliabilityService.getRouteReliability(route.route_id) || {
          reliability: 'medium',
          onTimePerformance: 0.7,
          averageDelayMinutes: 5,
        };
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
          overallReliability: routeReliability?.reliability || 'medium',
          transferRisks: [],
          rank: 1,
        });
      }

      // Transfer option (if no direct route)
      if (commonRoutes.length === 0 && originRoutes.length > 0 && destRoutes.length > 0) {
        const route1 = originRoutes[0];
        const route2 = destRoutes[0];
        const route1Reliability = reliabilityService.getRouteReliability(route1.route_id) || {
          reliability: 'medium',
          onTimePerformance: 0.7,
          averageDelayMinutes: 5,
        };
        const route2Reliability = reliabilityService.getRouteReliability(route2.route_id) || {
          reliability: 'medium',
          onTimePerformance: 0.7,
          averageDelayMinutes: 5,
        };

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
          overallReliability: itineraryReliability?.overallReliability || 'medium',
          transferRisks: [transferRisk],
          rank: 2,
        });
      }

      // Sort by mode preference
      if (mode === 'safe') {
        generatedItineraries.sort((a, b) => {
          const reliabilityOrder = { high: 3, medium: 2, low: 1 };
          const aRel = typeof a.overallReliability === 'string' ? a.overallReliability : a.overallReliability?.reliability || 'medium';
          const bRel = typeof b.overallReliability === 'string' ? b.overallReliability : b.overallReliability?.reliability || 'medium';
          return (
            (reliabilityOrder[bRel] || 2) - (reliabilityOrder[aRel] || 2) ||
            (a.transferRisks?.length || 0) - (b.transferRisks?.length || 0) ||
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

  // Ensure navigation is available
  if (!navigation) {
    console.error('❌ Navigation prop is missing');
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Navigation error. Please try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Loading trip planner...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        style={styles.keyboardView}
        enabled={Platform.OS !== 'web'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
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
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="location" size={20} color="#3B82F6" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="From (stop name or address)"
                  value={origin || ''}
                  onChangeText={(text) => {
                    try {
                      setOrigin(text);
                      setShowOriginSuggestions(true);
                      setOriginStop(null); // Clear selected stop when typing
                    } catch (error) {
                      console.error('Error updating origin:', error);
                    }
                  }}
                  onFocus={() => setShowOriginSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  style={styles.currentLocationButton}
                >
                  <Ionicons name="locate" size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
              <StopAutocomplete
                value={origin}
                onChangeText={setOrigin}
                onSelectStop={(stop) => {
                  setOriginStop(stop);
                  setShowOriginSuggestions(false);
                }}
                placeholder="From"
                iconName="location"
                iconColor="#3B82F6"
                showSuggestions={showOriginSuggestions && origin.length >= 2}
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#EF4444" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="To (stop name or address)"
                  value={destination || ''}
                  onChangeText={(text) => {
                    try {
                      setDestination(text);
                      setShowDestSuggestions(true);
                      setDestinationStop(null); // Clear selected stop when typing
                    } catch (error) {
                      console.error('Error updating destination:', error);
                    }
                  }}
                  onFocus={() => setShowDestSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <StopAutocomplete
                value={destination}
                onChangeText={setDestination}
                onSelectStop={(stop) => {
                  setDestinationStop(stop);
                  setShowDestSuggestions(false);
                }}
                placeholder="To"
                iconName="location-outline"
                iconColor="#EF4444"
                showSuggestions={showDestSuggestions && destination.length >= 2}
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
          {mode && (
            <RouteModeToggle 
              mode={mode} 
              onModeChange={(newMode) => {
                try {
                  if (newMode === 'fast' || newMode === 'safe') {
                    setMode(newMode);
                  }
                } catch (error) {
                  console.error('Error changing mode:', error);
                }
              }} 
            />
          )}

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
              {itineraries.map((itinerary, index) => {
                if (!itinerary || !itinerary.id) {
                  console.warn('Invalid itinerary at index', index, itinerary);
                  return null;
                }
                return (
                  <TripOptionCard
                    key={itinerary.id || `itinerary-${index}`}
                    itinerary={itinerary}
                    recommended={itinerary.recommended || false}
                    onPress={() => {
                      try {
                        // Navigate to route detail (to be implemented)
                        console.log('View itinerary:', itinerary.id);
                      } catch (err) {
                        console.error('Error handling itinerary press:', err);
                      }
                    }}
                  />
                );
              })}
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
  scrollContent: {
    flexGrow: 1,
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
  inputWrapper: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
});

