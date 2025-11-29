/**
 * ReliabilityChart Component
 * Displays historical reliability data for a route
 * Based on ROADMAP.md Phase 3.3
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReliabilityBadge from '../transit/ReliabilityBadge';

/**
 * ReliabilityChart - Shows reliability metrics for a route
 * @param {Object} reliability - Reliability score object
 * @param {Object} delayPrediction - Delay prediction for current time
 */
export default function ReliabilityChart({ reliability, delayPrediction }) {
  if (!reliability) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Reliability data not available</Text>
      </View>
    );
  }

  const onTimePercentage = Math.round(reliability.onTimePerformance * 100);
  const avgDelay = reliability.averageDelayMinutes;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reliability Overview</Text>
        <ReliabilityBadge reliability={reliability.reliability} size="small" />
      </View>

      <View style={styles.metricsContainer}>
        {/* On-Time Performance */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>On-Time Performance</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${onTimePercentage}%`,
                    backgroundColor:
                      onTimePercentage >= 80
                        ? '#10B981'
                        : onTimePercentage >= 60
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              />
            </View>
            <Text style={styles.metricValue}>{onTimePercentage}%</Text>
          </View>
        </View>

        {/* Average Delay */}
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Average Delay</Text>
          <Text style={styles.metricValueLarge}>{avgDelay.toFixed(1)} min</Text>
        </View>

        {/* Rush Hour Delay */}
        {reliability.rushHourDelay && (
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Rush Hour Delay</Text>
            <Text style={styles.metricValueLarge}>
              {reliability.rushHourDelay.toFixed(1)} min
            </Text>
            <Text style={styles.metricNote}>
              Typical delay during peak hours (7-9am, 4-7pm)
            </Text>
          </View>
        )}

        {/* Weekend Performance */}
        {reliability.weekendPerformance && (
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Weekend Performance</Text>
            <Text style={styles.metricValueLarge}>
              {Math.round(reliability.weekendPerformance * 100)}%
            </Text>
            <Text style={styles.metricNote}>On-time percentage on weekends</Text>
          </View>
        )}

        {/* Current Delay Prediction */}
        {delayPrediction && (
          <View style={[styles.metricCard, styles.predictionCard]}>
            <Text style={styles.metricLabel}>Expected Delay Now</Text>
            <Text style={styles.metricValueLarge}>
              {delayPrediction.expectedDelayMinutes.toFixed(1)} min
            </Text>
            <Text style={styles.metricNote}>
              Based on current time and historical patterns
            </Text>
            {delayPrediction.isRushHour && (
              <View style={styles.rushHourBadge}>
                <Text style={styles.rushHourText}>Rush Hour</Text>
              </View>
            )}
          </View>
        )}

        {/* Data Source */}
        <View style={styles.dataSource}>
          <Text style={styles.dataSourceText}>
            Data: {reliability.dataSource || 'Historical performance'}
          </Text>
          {reliability.lastUpdated && (
            <Text style={styles.dataSourceText}>
              Updated: {new Date(reliability.lastUpdated).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 20,
  },
  metricsContainer: {
    gap: 12,
  },
  metricCard: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  predictionCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 50,
    textAlign: 'right',
  },
  metricValueLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricNote: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  rushHourBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  rushHourText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dataSource: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  dataSourceText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

