/**
 * TransitInfoScreen Component
 * Comprehensive view of all transit information: routes, stops, arrivals, delays
 * Provides access to all transportation services beyond the 500m radius
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import metroService from '../services/gtfs/metroService';
import obaService from '../services/onebusaway/obaService';
import reliabilityService from '../services/reliability/reliabilityService';
import stService from '../services/soundtransit/stService';
import ArrivalCard from '../components/transit/ArrivalCard';
import RouteHealthDashboard from '../components/transit/RouteHealthDashboard';
import ReliabilityBadge from '../components/transit/ReliabilityBadge';

export default function TransitInfoScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('routes'); // 'routes', 'stops', 'arrivals', 'alerts'
  
  // Data states
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [allArrivals, setAllArrivals] = useState([]);
  const [serviceAlerts, setServiceAlerts] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [filteredStops, setFilteredStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [stopArrivals, setStopArrivals] = useState([]);

  useEffect(() => {
    initializeScreen();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      filterData();
    } else {
      setFilteredRoutes(routes);
      setFilteredStops(stops);
    }
  }, [searchQuery, routes, stops]);

  const initializeScreen = async () => {
    try {
      setLoading(true);
      await loadAllData();
    } catch (error) {
      console.error('Error initializing TransitInfoScreen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      // Initialize services
      await reliabilityService.initialize();
      await metroService.initialize();
      
      // Load routes
      const allRoutes = metroService.getRoutes() || [];
      setRoutes(allRoutes);
      setFilteredRoutes(allRoutes);

      // Load stops
      const allStops = metroService.stops || [];
      setStops(allStops);
      setFilteredStops(allStops);

      // Load service alerts
      if (stService) {
        try {
          const alerts = await stService.getLinkAlerts();
          setServiceAlerts(alerts || []);
        } catch (error) {
          console.error('Error loading service alerts:', error);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterData = () => {
    const query = searchQuery.toLowerCase();
    
    if (activeTab === 'routes') {
      const filtered = routes.filter((route) => {
        const shortName = route.route_short_name?.toLowerCase() || '';
        const longName = route.route_long_name?.toLowerCase() || '';
        return shortName.includes(query) || longName.includes(query);
      });
      setFilteredRoutes(filtered);
    } else if (activeTab === 'stops') {
      const filtered = stops.filter((stop) => {
        const name = stop.stop_name?.toLowerCase() || '';
        const code = stop.stop_code?.toLowerCase() || '';
        return name.includes(query) || code.includes(query);
      });
      setFilteredStops(filtered);
    }
  };

  const loadArrivalsForStop = async (stop) => {
    try {
      if (!stop) return;

      const stopId = stop.stop_id || stop.id;
      if (!stopId) {
        console.warn('Stop missing stop_id');
        return;
      }

      // Convert to OneBusAway format
      let obaStopId = String(stopId);
      if (!obaStopId.includes('_')) {
        obaStopId = `1_${obaStopId}`;
      }

      if (!obaService.isConfigured()) {
        console.warn('OneBusAway API not configured');
        setStopArrivals([]);
        setSelectedStop(stop);
        setActiveTab('arrivals');
        return;
      }

      const arrivals = await obaService.getArrivalsForStop(obaStopId, {
        maxResults: 20,
      });

      // Enhance with reliability data
      const enhancedArrivals = (arrivals || []).map((arrival) => {
        try {
          if (!arrival || !arrival.routeId) {
            return arrival;
          }
          const routeReliability = reliabilityService.getRouteReliability(
            arrival.routeId
          );
          return {
            ...arrival,
            reliability: routeReliability,
          };
        } catch (error) {
          console.warn('Error enhancing arrival with reliability:', error);
          return arrival;
        }
      });

      setStopArrivals(enhancedArrivals);
      setSelectedStop(stop);
      setActiveTab('arrivals');
    } catch (error) {
      console.error('Error loading arrivals:', error);
      // Set empty arrivals and show the stop anyway
      setStopArrivals([]);
      setSelectedStop(stop);
      setActiveTab('arrivals');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);


  const renderArrivalsTab = () => {
    if (!selectedStop) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>Select a stop to view arrivals</Text>
          <Text style={styles.emptyStateSubtext}>
            Go to the "Stops" tab and tap a stop
          </Text>
        </View>
      );
    }

    if (stopArrivals.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No arrivals available</Text>
          <Text style={styles.emptyStateSubtext}>
            {selectedStop.stop_name || 'This stop'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.arrivalsContainer}>
        <View style={styles.selectedStopInfo}>
          <Text style={styles.selectedStopName}>
            {selectedStop.stop_name || 'Unknown Stop'}
          </Text>
          {selectedStop.stop_code && (
            <Text style={styles.selectedStopCode}>Stop #{selectedStop.stop_code}</Text>
          )}
        </View>

        <RouteHealthDashboard arrivals={stopArrivals} />

        {stopArrivals.map((arrival, index) => (
          <ArrivalCard
            key={`${arrival.tripId}-${arrival.scheduledArrivalTime}-${index}`}
            arrival={arrival}
            onPress={() => navigation.navigate('RouteDetail', {
              routeId: arrival.routeId,
              routeShortName: arrival.routeShortName,
            })}
          />
        ))}
      </ScrollView>
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading transit information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transit Information</Text>
        <Text style={styles.subtitle}>
          All routes, stops, arrivals, and alerts
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === 'routes'
              ? 'Search routes...'
              : activeTab === 'stops'
              ? 'Search stops...'
              : 'Search...'
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          style={styles.tabsScrollView}
          nestedScrollEnabled={true}
        >
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('routes')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'routes' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Routes ({routes.length})
            </Text>
            {activeTab === 'routes' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('stops')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'stops' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Stops ({stops.length})
            </Text>
            {activeTab === 'stops' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('arrivals')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'arrivals' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Arrivals
            </Text>
            {activeTab === 'arrivals' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('alerts')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'alerts' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Alerts ({serviceAlerts.length})
            </Text>
            {activeTab === 'alerts' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {activeTab === 'routes' && (
        <FlatList
          data={filteredRoutes}
          keyExtractor={(item) => item.route_id}
          renderItem={({ item }) => {
            const reliability = reliabilityService.getRouteReliability(item.route_id);
            return (
              <TouchableOpacity
                style={styles.routeCard}
                onPress={() => navigation.navigate('RouteDetail', {
                  routeId: item.route_id,
                  routeShortName: item.route_short_name,
                })}
              >
                <View style={styles.routeCardHeader}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeNumber}>{item.route_short_name || 'N/A'}</Text>
                    <Text style={styles.routeName} numberOfLines={2}>
                      {item.route_long_name || 'No description'}
                    </Text>
                  </View>
                  <ReliabilityBadge
                    reliability={reliability?.reliability || 'medium'}
                    size="small"
                  />
                </View>
                {reliability && (
                  <View style={styles.routeStats}>
                    <Text style={styles.routeStat}>
                      {Math.round(reliability.onTimePerformance * 100)}% on-time
                    </Text>
                    <Text style={styles.routeStat}>
                      Avg delay: {reliability.averageDelayMinutes} min
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No routes found</Text>
            </View>
          }
        />
      )}
      {activeTab === 'stops' && (
        <FlatList
          data={filteredStops}
          keyExtractor={(item) => item.stop_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.stopCard}
              onPress={() => loadArrivalsForStop(item)}
            >
              <View style={styles.stopCardContent}>
                <Ionicons name="location" size={20} color="#3B82F6" />
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{item.stop_name || 'Unknown Stop'}</Text>
                  {item.stop_code && (
                    <Text style={styles.stopCode}>Stop #{item.stop_code}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No stops found</Text>
            </View>
          }
        />
      )}
      {activeTab === 'arrivals' && (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderArrivalsTab()}
        </ScrollView>
      )}
      {activeTab === 'alerts' && (
        <FlatList
          data={serviceAlerts}
          keyExtractor={(item, index) => item.id || `alert-${index}`}
          renderItem={({ item }) => (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Ionicons
                  name={
                    item.severity === 'high'
                      ? 'alert-circle'
                      : item.severity === 'medium'
                      ? 'warning'
                      : 'information-circle'
                  }
                  size={20}
                  color={
                    item.severity === 'high'
                      ? '#EF4444'
                      : item.severity === 'medium'
                      ? '#F59E0B'
                      : '#3B82F6'
                  }
                />
                <Text style={styles.alertSeverity}>
                  {item.severity?.toUpperCase() || 'INFO'}
                </Text>
              </View>
              <Text style={styles.alertTitle}>{item.header || 'Service Alert'}</Text>
              {item.description && (
                <Text style={styles.alertDescription}>{item.description}</Text>
              )}
              {item.affectedRoutes && item.affectedRoutes.length > 0 && (
                <View style={styles.alertRoutes}>
                  <Text style={styles.alertRoutesLabel}>Affected Routes:</Text>
                  <Text style={styles.alertRoutesText}>
                    {item.affectedRoutes.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text style={styles.emptyStateText}>No active service alerts</Text>
              <Text style={styles.emptyStateSubtext}>
                All transit services are operating normally
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: 50,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    height: 50,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextInactive: {
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  routeName: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  routeStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  stopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stopCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stopInfo: {
    flex: 1,
    marginLeft: 12,
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
  arrivalsContainer: {
    padding: 20,
  },
  selectedStopInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedStopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  selectedStopCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertSeverity: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
    color: '#6B7280',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  alertRoutes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  alertRoutesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  alertRoutesText: {
    fontSize: 12,
    color: '#111827',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

