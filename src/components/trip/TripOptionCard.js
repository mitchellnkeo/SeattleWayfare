/**
 * TripOptionCard Component
 * Displays a single trip option with reliability and transfer risk
 * Based on ROADMAP.md Phase 3.2
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import ReliabilityBadge from '../transit/ReliabilityBadge';
import TransferRiskWarning from './TransferRiskWarning';

/**
 * TripOptionCard - Shows a trip option with details
 * @param {Object} itinerary - Itinerary object with legs and reliability
 * @param {boolean} recommended - Whether this is the recommended option
 * @param {Function} onPress - Callback when card is pressed
 */
export default function TripOptionCard({ itinerary, recommended = false, onPress }) {
  if (!itinerary) {
    return null;
  }

  const {
    startTime,
    endTime,
    duration,
    walkTime,
    transitTime,
    waitingTime,
    legs,
    overallReliability,
    transferRisks,
    rank,
  } = itinerary;

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const transitLegs = legs.filter((leg) => leg.mode !== 'WALK');

  return (
    <TouchableOpacity
      style={[styles.card, recommended && styles.cardRecommended]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {recommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>⭐ Recommended</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{format(startDate, 'h:mm a')}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.timeText}>{format(endDate, 'h:mm a')}</Text>
        </View>
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>{duration} min</Text>
        </View>
      </View>

      <View style={styles.reliabilityContainer}>
        <ReliabilityBadge 
          reliability={
            typeof overallReliability === 'string' 
              ? overallReliability 
              : overallReliability?.reliability || 'medium'
          } 
          size="small" 
        />
        <Text style={styles.reliabilityText}>
          {(() => {
            const rel = typeof overallReliability === 'string' 
              ? overallReliability 
              : overallReliability?.reliability || 'medium';
            return rel === 'high'
              ? 'Most reliable'
              : rel === 'medium'
              ? 'Moderately reliable'
              : 'Less reliable';
          })()}
        </Text>
      </View>

      <View style={styles.legsContainer}>
        {legs.map((leg, index) => {
          if (leg.mode === 'WALK') {
            return (
              <View key={index} style={styles.leg}>
                <Text style={styles.walkLeg}>
                  🚶 Walk {leg.duration} min ({Math.round(leg.distance || 0)}m)
                </Text>
              </View>
            );
          }

          return (
            <View key={index} style={styles.leg}>
              <View style={styles.transitLeg}>
                <Text style={styles.routeNumber}>{leg.routeShortName || 'N/A'}</Text>
                <Text style={styles.destination}>{leg.headsign || 'Unknown'}</Text>
                <Text style={styles.legTime}>{leg.duration} min</Text>
              </View>
              {leg.reliability && (
                <ReliabilityBadge 
                  reliability={
                    typeof leg.reliability === 'string'
                      ? leg.reliability
                      : leg.reliability?.reliability || 'medium'
                  } 
                  size="small" 
                />
              )}
            </View>
          );
        })}
      </View>

      {transferRisks && transferRisks.length > 0 && (
        <View style={styles.transferRisksContainer}>
          {transferRisks.map((risk, index) => {
            const fromLeg = legs[risk.fromLegIndex];
            const toLeg = legs[risk.toLegIndex];
            return (
              <TransferRiskWarning
                key={index}
                transferRisk={risk}
                fromRoute={fromLeg?.routeShortName || 'Route'}
                toRoute={toLeg?.routeShortName || 'Route'}
              />
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Transit: {transitTime} min • Walk: {walkTime} min • Wait: {waitingTime} min
        </Text>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRecommended: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  arrow: {
    fontSize: 18,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  durationContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reliabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reliabilityText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  legsContainer: {
    marginBottom: 12,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  walkLeg: {
    fontSize: 14,
    color: '#6B7280',
  },
  transitLeg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginRight: 12,
    minWidth: 50,
  },
  destination: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  legTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  transferRisksContainer: {
    marginTop: 8,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

