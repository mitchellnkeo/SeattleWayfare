/**
 * WeeklyReliabilityReport Component
 * Displays weekly reliability summary for a commute
 * Based on ROADMAP.md Phase 3.4
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReliabilityBadge from '../transit/ReliabilityBadge';

/**
 * WeeklyReliabilityReport - Shows weekly reliability metrics
 * @param {Object} commute - Saved commute object with analytics
 */
export default function WeeklyReliabilityReport({ commute }) {
  if (!commute || !commute.weeklyStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No weekly data available yet</Text>
      </View>
    );
  }

  const { weeklyStats, reliabilityScore, averageDelay, totalTrips } = commute;

  // Calculate on-time percentage
  const onTimePercentage = reliabilityScore ? Math.round(reliabilityScore * 100) : 0;

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Reliability</Text>

      {/* Summary Stats */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>On-Time</Text>
          <Text style={styles.summaryValue}>{onTimePercentage}%</Text>
          <ReliabilityBadge
            reliability={reliabilityScore >= 0.8 ? 'high' : reliabilityScore >= 0.6 ? 'medium' : 'low'}
            size="small"
          />
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Avg Delay</Text>
          <Text style={[styles.summaryValue, averageDelay > 5 && styles.delayWarning]}>
            {averageDelay > 0 ? '+' : ''}{Math.round(averageDelay)} min
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Trips</Text>
          <Text style={styles.summaryValue}>{totalTrips || 0}</Text>
        </View>
      </View>

      {/* Daily Breakdown */}
      {weeklyStats && weeklyStats.length > 0 && (
        <View style={styles.dailyBreakdown}>
          <Text style={styles.sectionTitle}>This Week</Text>
          {weeklyStats.map((day, index) => {
            const dayName = dayNames[day.dayOfWeek] || `Day ${day.dayOfWeek}`;
            const dayReliability = day.reliabilityScore || 0;
            const dayDelay = day.averageDelay || 0;

            return (
              <View key={index} style={styles.dayRow}>
                <Text style={styles.dayName}>{dayName}</Text>
                <View style={styles.dayStats}>
                  <ReliabilityBadge
                    reliability={dayReliability >= 0.8 ? 'high' : dayReliability >= 0.6 ? 'medium' : 'low'}
                    size="small"
                  />
                  <Text style={[styles.dayDelay, dayDelay > 5 && styles.delayWarning]}>
                    {dayDelay > 0 ? '+' : ''}{Math.round(dayDelay)} min
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Best/Worst Times */}
      {commute.bestDepartureTime && (
        <View style={styles.recommendations}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>Best departure time:</Text>
            <Text style={styles.recommendationValue}>{commute.bestDepartureTime}</Text>
          </View>
          {commute.worstDepartureTime && (
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationLabel}>Avoid:</Text>
              <Text style={styles.recommendationValue}>{commute.worstDepartureTime}</Text>
            </View>
          )}
        </View>
      )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  delayWarning: {
    color: '#EF4444',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dailyBreakdown: {
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    width: 40,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayDelay: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 50,
    textAlign: 'right',
  },
  recommendations: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recommendationLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  recommendationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
});

