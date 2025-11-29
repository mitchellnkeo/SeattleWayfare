/**
 * TransferRiskWarning Component
 * Displays transfer risk warnings for trip legs
 * Based on ROADMAP.md Phase 3.2
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReliabilityBadge from '../transit/ReliabilityBadge';

/**
 * TransferRiskWarning - Shows transfer risk information
 * @param {Object} transferRisk - Transfer risk object from reliability service
 * @param {string} fromRoute - First leg route name
 * @param {string} toRoute - Second leg route name
 */
export default function TransferRiskWarning({ transferRisk, fromRoute, toRoute }) {
  if (!transferRisk) {
    return null;
  }

  const { risk, likelihood, connectionMinutes, adjustedConnectionMinutes, recommendation } =
    transferRisk;

  const getRiskColor = () => {
    switch (risk) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getRiskIcon = () => {
    switch (risk) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: getRiskColor() }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getRiskIcon()}</Text>
        <Text style={styles.title}>Transfer Risk: {risk.toUpperCase()}</Text>
        <ReliabilityBadge reliability={risk} size="small" />
      </View>

      <View style={styles.details}>
        <Text style={styles.routeInfo}>
          {fromRoute} → {toRoute}
        </Text>
        <Text style={styles.timeInfo}>
          Connection time: {connectionMinutes.toFixed(1)} min
        </Text>
        {adjustedConnectionMinutes !== connectionMinutes && (
          <Text style={styles.adjustedTime}>
            Adjusted for delays: {adjustedConnectionMinutes.toFixed(1)} min
          </Text>
        )}
        <Text style={styles.likelihood}>
          Missed connection probability: {(likelihood * 100).toFixed(0)}%
        </Text>
      </View>

      {recommendation && (
        <View style={styles.recommendation}>
          <Text style={styles.recommendationText}>{recommendation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  details: {
    marginTop: 4,
  },
  routeInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  timeInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  adjustedTime: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginBottom: 2,
  },
  likelihood: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  recommendation: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  recommendationText: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
  },
});

