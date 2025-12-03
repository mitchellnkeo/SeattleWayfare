/**
 * RouteHealthDashboard Component
 * Shows overall transit health in the area with reliability insights
 * Unique feature that differentiates from Transit app
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * RouteHealthDashboard - Shows transit health summary
 * @param {Array} arrivals - Array of arrival objects with reliability data
 */
export default function RouteHealthDashboard({ arrivals = [] }) {
  if (!arrivals || arrivals.length === 0) {
    return null;
  }

  // Calculate health metrics
  const routesWithReliability = arrivals.filter((a) => a.reliability);
  const totalRoutes = routesWithReliability.length;
  
  if (totalRoutes === 0) {
    return null;
  }

  const highReliabilityCount = routesWithReliability.filter(
    (a) => a.reliability?.reliability === 'high'
  ).length;
  const mediumReliabilityCount = routesWithReliability.filter(
    (a) => a.reliability?.reliability === 'medium'
  ).length;
  const lowReliabilityCount = routesWithReliability.filter(
    (a) => a.reliability?.reliability === 'low'
  ).length;

  const averageOnTime = routesWithReliability.reduce((sum, a) => {
    return sum + (a.reliability?.onTimePerformance || 0.7);
  }, 0) / totalRoutes;

  const delayedCount = arrivals.filter((a) => a.delayMinutes > 0).length;
  const onTimeCount = arrivals.filter((a) => a.delayMinutes <= 0).length;

  // Determine overall health status
  const getHealthStatus = () => {
    if (averageOnTime >= 0.8 && lowReliabilityCount === 0) {
      return { status: 'excellent', color: '#10B981', icon: 'checkmark-circle' };
    } else if (averageOnTime >= 0.7 && lowReliabilityCount <= 1) {
      return { status: 'good', color: '#3B82F6', icon: 'checkmark-circle-outline' };
    } else if (averageOnTime >= 0.6) {
      return { status: 'fair', color: '#F59E0B', icon: 'warning-outline' };
    } else {
      return { status: 'poor', color: '#EF4444', icon: 'alert-circle' };
    }
  };

  const health = getHealthStatus();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={health.icon} size={20} color={health.color} />
        <Text style={styles.title}>Transit Health</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${health.color}20` }]}>
          <Text style={[styles.statusText, { color: health.color }]}>
            {health.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{Math.round(averageOnTime * 100)}%</Text>
          <Text style={styles.metricLabel}>Avg On-Time</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{highReliabilityCount}</Text>
          <Text style={styles.metricLabel}>Reliable Routes</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{delayedCount}</Text>
          <Text style={styles.metricLabel}>Delayed Now</Text>
        </View>
      </View>

      <View style={styles.reliabilityBreakdown}>
        <View style={styles.reliabilityBar}>
          <View
            style={[
              styles.reliabilitySegment,
              {
                width: `${(highReliabilityCount / totalRoutes) * 100}%`,
                backgroundColor: '#10B981',
              },
            ]}
          />
          <View
            style={[
              styles.reliabilitySegment,
              {
                width: `${(mediumReliabilityCount / totalRoutes) * 100}%`,
                backgroundColor: '#F59E0B',
              },
            ]}
          />
          <View
            style={[
              styles.reliabilitySegment,
              {
                width: `${(lowReliabilityCount / totalRoutes) * 100}%`,
                backgroundColor: '#EF4444',
              },
            ]}
          />
        </View>
        <View style={styles.reliabilityLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>High ({highReliabilityCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Medium ({mediumReliabilityCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Low ({lowReliabilityCount})</Text>
          </View>
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
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  reliabilityBreakdown: {
    marginTop: 8,
  },
  reliabilityBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  reliabilitySegment: {
    height: '100%',
  },
  reliabilityLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
  },
});

