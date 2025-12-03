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
import LocationAutocomplete from '../components/trip/LocationAutocomplete';
import TripRouteMap from '../components/trip/TripRouteMap';
import locationService from '../services/location/locationService';
import metroService from '../services/gtfs/metroService';
import reliabilityService from '../services/reliability/reliabilityService';
import obaService from '../services/onebusaway/obaService';
import geocodingService from '../services/geocoding/geocodingService';
import tripRoutingService from '../services/routing/tripRoutingService';

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
  const [originLocation, setOriginLocation] = useState(null); // Selected address/location object
  const [destinationLocation, setDestinationLocation] = useState(null); // Selected address/location object
  const [mode, setMode] = useState('fast'); // 'fast' or 'safe'
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  
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
      console.log('🗺️ Planning trip from:', origin, 'to:', destination);
      
      // Build location objects for routing service
      // Use selected location/stop if available, otherwise use text input
      const originLocationObj = originLocation
        ? { lat: originLocation.lat, lon: originLocation.lon, address: originLocation.address }
        : originStop
        ? { stop: originStop }
        : { address: origin }; // Fallback to text input
      
      const destLocationObj = destinationLocation
        ? { lat: destinationLocation.lat, lon: destinationLocation.lon, address: destinationLocation.address }
        : destinationStop
        ? { stop: destinationStop }
        : { address: destination }; // Fallback to text input

      // Use the new routing service for multi-modal planning
      const generatedItineraries = await tripRoutingService.planTrip(
        originLocationObj,
        destLocationObj,
        {
          mode,
          maxWalkingDistance: 1000, // 1km max walking
          maxResults: 5,
        }
      );

      if (generatedItineraries.length === 0) {
        setError('No route options found. Try different origin or destination locations.');
        setLoading(false);
        return;
      }

      console.log(`✅ Generated ${generatedItineraries.length} trip options`);

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
            <LocationAutocomplete
              placeholder="From (address or stop name)"
              iconName="location"
              iconColor="#3B82F6"
              value={origin}
              onChangeText={setOrigin}
              onSelectStop={(stop) => {
                setOriginStop(stop);
                setOriginLocation(null);
              }}
              onSelectLocation={(location) => {
                setOriginLocation(location);
                setOriginStop(null);
              }}
              onClear={() => {
                setOrigin('');
                setOriginStop(null);
                setOriginLocation(null);
              }}
              onUseCurrentLocation={handleUseCurrentLocation}
            />

            <LocationAutocomplete
              placeholder="To (address or stop name)"
              iconName="location-outline"
              iconColor="#EF4444"
              value={destination}
              onChangeText={setDestination}
              onSelectStop={(stop) => {
                setDestinationStop(stop);
                setDestinationLocation(null);
              }}
              onSelectLocation={(location) => {
                setDestinationLocation(location);
                setDestinationStop(null);
              }}
              onClear={() => {
                setDestination('');
                setDestinationStop(null);
                setDestinationLocation(null);
              }}
            />

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
                        // Select itinerary to show on map
                        setSelectedItinerary(itinerary);
                        // Scroll to map if needed
                      } catch (err) {
                        console.error('Error handling itinerary press:', err);
                      }
                    }}
                  />
                );
              })}
            </View>
          )}

          {/* Route Map - Show selected itinerary or first one */}
          {!loading && itineraries.length > 0 && (selectedItinerary || itineraries[0]) && (
            <View style={styles.mapSection}>
              <TripRouteMap
                itinerary={selectedItinerary || itineraries[0]}
                userLocation={currentUserLocation}
                height={300}
              />
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
  mapSection: {
    marginBottom: 16,
    marginHorizontal: 20,
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

