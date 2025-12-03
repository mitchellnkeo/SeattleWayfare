/**
 * DelayPredictionBadge Component
 * Shows predicted delay based on historical reliability data
 * Unique feature: Predictive vs reactive (Transit app only shows current delays)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import reliabilityService from '../../services/reliability/reliabilityService';

/**
 * DelayPredictionBadge - Shows predicted delay for a route
 * @param {string} routeId - Route ID
 * @param {Object} arrival - Arrival object
 */
export default function DelayPredictionBadge({ routeId, arrival }) {
  if (!routeId || !arrival) {
    return null;
  }

  // Get delay prediction based on time of day
  const now = new Date();
  const delayPrediction = reliabilityService.predictDelay(routeId, null, now);

  // Only show if there's a meaningful prediction
  if (delayPrediction.expectedDelayMinutes < 1) {
    return null;
  }

  const isRushHour = delayPrediction.isRushHour;
  const confidence = delayPrediction.confidence;

  // Determine if prediction is concerning
  const isConcerning = delayPrediction.expectedDelayMinutes >= 5;

  return (
    <View
      style={[
        styles.container,
        isConcerning ? styles.containerWarning : styles.containerInfo,
      ]}
    >
      <Ionicons
        name={isConcerning ? 'warning' : 'time-outline'}
        size={14}
        color={isConcerning ? '#DC2626' : '#6B7280'}
      />
      <Text
        style={[
          styles.text,
          isConcerning ? styles.textWarning : styles.textInfo,
        ]}
      >
        Predicted: +{delayPrediction.expectedDelayMinutes.toFixed(0)} min
        {isRushHour && ' (rush hour)'}
      </Text>
      {confidence < 0.7 && (
        <Text style={styles.confidenceText}>
          {Math.round(confidence * 100)}% confidence
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  containerWarning: {
    backgroundColor: '#FEE2E2',
  },
  containerInfo: {
    backgroundColor: '#F3F4F6',
  },
  text: {
    fontSize: 11,
    marginLeft: 4,
  },
  textWarning: {
    color: '#DC2626',
    fontWeight: '600',
  },
  textInfo: {
    color: '#6B7280',
  },
  confidenceText: {
    fontSize: 9,
    color: '#9CA3AF',
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

