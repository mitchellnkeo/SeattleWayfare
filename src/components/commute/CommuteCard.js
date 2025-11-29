/**
 * CommuteCard Component
 * Displays a saved commute with quick actions
 * Based on ROADMAP.md Phase 3.4
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { format } from 'date-fns';
import ReliabilityBadge from '../transit/ReliabilityBadge';

/**
 * CommuteCard - Shows saved commute with reliability info
 * @param {Object} commute - Saved commute object
 * @param {Function} onPress - Callback when card is pressed
 * @param {Function} onLaunch - Callback to launch trip
 * @param {Function} onEdit - Callback to edit commute
 * @param {Function} onDelete - Callback to delete commute
 */
export default function CommuteCard({ commute, onPress, onLaunch, onEdit, onDelete }) {
  if (!commute) {
    return null;
  }

  const {
    name,
    origin,
    destination,
    usualDepartureTime,
    reliabilityScore,
    averageDelay,
    totalTrips,
    safeMode,
    lastUsed,
  } = commute;

  // Format origin/destination
  const originText = origin?.name || origin?.address || 'Unknown Origin';
  const destText = destination?.name || destination?.address || 'Unknown Destination';

  // Format departure time
  const [hours, minutes] = usualDepartureTime.split(':');
  const departureTime = format(new Date().setHours(parseInt(hours), parseInt(minutes)), 'h:mm a');

  // Format last used
  const lastUsedDate = lastUsed ? format(new Date(lastUsed), 'MMM d') : 'Never';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{name}</Text>
          {safeMode && (
            <View style={styles.safeModeBadge}>
              <Text style={styles.safeModeText}>Safe Mode</Text>
            </View>
          )}
        </View>
        <ReliabilityBadge reliability={reliabilityScore >= 0.8 ? 'high' : reliabilityScore >= 0.6 ? 'medium' : 'low'} size="small" />
      </View>

      <View style={styles.route}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>{originText}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <Text style={styles.locationText} numberOfLines={1}>{destText}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Departure</Text>
          <Text style={styles.statValue}>{departureTime}</Text>
        </View>
        {averageDelay !== undefined && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Delay</Text>
            <Text style={[styles.statValue, averageDelay > 5 && styles.delayWarning]}>
              {averageDelay > 0 ? '+' : ''}{Math.round(averageDelay)} min
            </Text>
          </View>
        )}
        {totalTrips > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Trips</Text>
            <Text style={styles.statValue}>{totalTrips}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.lastUsed}>Last used: {lastUsedDate}</Text>
        <View style={styles.actions}>
          {onLaunch && (
            <TouchableOpacity
              style={styles.launchButton}
              onPress={(e) => {
                e.stopPropagation();
                onLaunch(commute);
              }}
            >
              <Text style={styles.launchButtonText}>Launch</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(commute);
              }}
            >
              <Text style={styles.iconButtonText}>✏️</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(commute);
              }}
            >
              <Text style={styles.iconButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  safeModeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  safeModeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  route: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#10B981',
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  delayWarning: {
    color: '#EF4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUsed: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  launchButton: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  launchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  iconButtonText: {
    fontSize: 18,
  },
});

