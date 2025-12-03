/**
 * SavedCommutesScreen
 * Displays and manages saved commutes
 * Based on ROADMAP.md Phase 3.4
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CommuteCard from '../components/commute/CommuteCard';
import WeeklyReliabilityReport from '../components/commute/WeeklyReliabilityReport';
import {
  getSavedCommutes,
  deleteSavedCommute,
  updateSavedCommute,
} from '../utils/storage';
import reliabilityService from '../services/reliability/reliabilityService';

export default function SavedCommutesScreen({ navigation }) {
  const [commutes, setCommutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommute, setSelectedCommute] = useState(null);

  // Load commutes when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadCommutes();
    }, [])
  );

  const loadCommutes = async () => {
    try {
      setLoading(true);
      const savedCommutes = await getSavedCommutes();
      
      if (!Array.isArray(savedCommutes) || savedCommutes.length === 0) {
        setCommutes([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Enhance commutes with reliability data
      const enhancedCommutes = await Promise.all(
        savedCommutes.map(async (commute) => {
          // Get reliability for preferred routes
          let reliabilityScore = 0.8; // Default
          let averageDelay = 0;

          if (commute.preferredRoutes && commute.preferredRoutes.length > 0) {
            const routeId = commute.preferredRoutes[0];
            const reliability = reliabilityService.getRouteReliability(routeId);
            if (reliability) {
              reliabilityScore = reliability.onTimePerformance || 0.8;
              averageDelay = reliability.averageDelayMinutes || 0;
            }
          }

          return {
            ...commute,
            reliabilityScore,
            averageDelay,
          };
        })
      );

      setCommutes(enhancedCommutes);
    } catch (error) {
      console.error('Error loading commutes:', error);
      Alert.alert('Error', 'Failed to load saved commutes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCommutes();
  };

  const handleLaunchTrip = (commute) => {
    // Trip Planner removed - just update last used and navigate home
    updateSavedCommute(commute.id, { lastUsed: new Date().toISOString() });
    navigation.navigate('Home');
  };

  const handleEdit = (commute) => {
    // Trip Planner removed - show alert that editing is not available
    Alert.alert(
      'Edit Commute',
      'Trip planning feature has been removed. You can delete and create a new commute instead.',
      [{ text: 'OK' }]
    );
  };

  const handleDelete = (commute) => {
    Alert.alert(
      'Delete Commute',
      `Are you sure you want to delete "${commute.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedCommute(commute.id);
              loadCommutes();
            } catch (error) {
              console.error('Error deleting commute:', error);
              Alert.alert('Error', 'Failed to delete commute');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    // Trip Planner removed - show alert
    Alert.alert(
      'Create Commute',
      'Trip planning feature has been removed. This feature is no longer available.',
      [{ text: 'OK' }]
    );
  };

  if (loading && commutes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Commutes</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading commutes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Commutes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateNew}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {commutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No saved commutes</Text>
            <Text style={styles.emptyText}>
              Create a commute to quickly plan your regular trips
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreateNew}
            >
              <Text style={styles.emptyButtonText}>Create Your First Commute</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {commutes.map((commute) => (
              <View key={commute.id}>
                <CommuteCard
                  commute={commute}
                  onPress={() => setSelectedCommute(selectedCommute === commute.id ? null : commute.id)}
                  onLaunch={handleLaunchTrip}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
                {selectedCommute === commute.id && (
                  <WeeklyReliabilityReport commute={commute} />
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Native shadow props
    ...(Platform.OS !== 'web' && {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
    // Web shadow (boxShadow)
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

