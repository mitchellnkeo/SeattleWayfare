/**
 * ArrivalCard Component
 * Displays arrival information with reliability indicator
 * Based on ROADMAP.md Phase 3.1
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import ReliabilityBadge from './ReliabilityBadge';
import DelayPredictionBadge from './DelayPredictionBadge';
import fareService from '../../services/fare/fareService';

/**
 * ArrivalCard - Shows arrival prediction with route info and reliability
 * @param {Object} arrival - Arrival object with route, timing, and reliability info
 * @param {Function} onPress - Optional callback when card is pressed
 */
export default function ArrivalCard({ arrival, onPress }) {
  if (!arrival) {
    return null;
  }

  const {
    routeShortName,
    routeId,
    tripHeadsign,
    scheduledArrivalTime,
    predictedArrivalTime,
    predicted,
    minutesUntilArrival,
    delayMinutes,
    reliability,
  } = arrival;

  // Calculate display values
  const isDelayed = delayMinutes > 0;
  const isEarly = delayMinutes < 0;
  const arrivalTime = predicted && predictedArrivalTime 
    ? new Date(predictedArrivalTime)
    : new Date(scheduledArrivalTime);
  
  const reliabilityLevel = reliability?.reliability || 'medium';

  // Format time display
  const timeDisplay = minutesUntilArrival !== undefined
    ? minutesUntilArrival <= 0
      ? 'Arriving'
      : minutesUntilArrival === 1
      ? '1 min'
      : `${minutesUntilArrival} min`
    : format(arrivalTime, 'h:mm a');

  const CardContent = (
    <View style={styles.card}>
      {/* Header: Route and Reliability */}
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeNumber}>{routeShortName || 'N/A'}</Text>
          {tripHeadsign && (
            <Text style={styles.headsign} numberOfLines={1}>
              {tripHeadsign}
            </Text>
          )}
        </View>
        <ReliabilityBadge reliability={reliabilityLevel} size="small" />
      </View>

      {/* Main: Time and Status */}
      <View style={styles.main}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{timeDisplay}</Text>
          {predicted && (
            <Text style={styles.scheduledTime}>
              Scheduled: {format(new Date(scheduledArrivalTime), 'h:mm a')}
            </Text>
          )}
        </View>

        {/* Delay indicator */}
        {predicted && delayMinutes !== undefined && delayMinutes !== 0 && (
          <View
            style={[
              styles.delayBadge,
              isDelayed ? styles.delayBadgeLate : styles.delayBadgeEarly,
            ]}
          >
            <Text style={styles.delayText}>
              {isDelayed ? '+' : ''}
              {Math.round(delayMinutes)} min
            </Text>
          </View>
        )}
      </View>

      {/* Footer: Additional info */}
      <View style={styles.footer}>
        {reliability && (
          <Text style={styles.footerText}>
            {reliability.onTimePerformance
              ? `${Math.round(reliability.onTimePerformance * 100)}% on-time`
              : 'Reliability data available'}
          </Text>
        )}
        {/* Delay Prediction - Unique feature */}
        {routeId && (
          <DelayPredictionBadge
            routeId={routeId}
            arrival={arrival}
          />
        )}
        
        {/* Fare Information */}
        {routeId && routeShortName && (() => {
          const fare = fareService.getFare(routeId, routeShortName);
          return (
            <View style={styles.fareContainer}>
              <Ionicons name="cash-outline" size={14} color="#6B7280" />
              <Text style={styles.fareText}>{fare.displayText}</Text>
            </View>
          );
        })()}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
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
  routeInfo: {
    flex: 1,
    marginRight: 8,
  },
  routeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  headsign: {
    fontSize: 14,
    color: '#6B7280',
  },
  main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  delayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  delayBadgeLate: {
    backgroundColor: '#FEE2E2',
  },
  delayBadgeEarly: {
    backgroundColor: '#D1FAE5',
  },
  delayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  fareText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
});

