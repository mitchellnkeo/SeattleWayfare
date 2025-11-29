/**
 * ServiceAlerts Component
 * Displays service alerts for a route
 * Based on ROADMAP.md Phase 3.3
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

/**
 * ServiceAlerts - Shows service alerts affecting a route
 * @param {Array} alerts - Array of service alert objects
 * @param {Array} routeIds - Route IDs to filter alerts for
 */
export default function ServiceAlerts({ alerts = [], routeIds = [] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.title}>No Service Alerts</Text>
        </View>
        <Text style={styles.noAlertsText}>All routes operating normally</Text>
      </View>
    );
  }

  // Filter alerts that affect the specified routes
  const relevantAlerts = alerts.filter((alert) => {
    if (!routeIds || routeIds.length === 0) return true;
    return alert.affectedRoutes.some((routeId) => routeIds.includes(routeId));
  });

  if (relevantAlerts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.title}>No Alerts for This Route</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={20} color="#EF4444" />
        <Text style={styles.title}>Service Alerts ({relevantAlerts.length})</Text>
      </View>

      <ScrollView style={styles.alertsList} nestedScrollEnabled={true}>
        {relevantAlerts.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              alert.severity === 'severe' && styles.alertCardSevere,
              alert.severity === 'warning' && styles.alertCardWarning,
            ]}
          >
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{alert.header}</Text>
              {alert.severity === 'severe' && (
                <View style={styles.severityBadge}>
                  <Text style={styles.severityText}>SEVERE</Text>
                </View>
              )}
            </View>

            {alert.description && (
              <Text style={styles.alertDescription}>{alert.description}</Text>
            )}

            {alert.activePeriod && alert.activePeriod.length > 0 && (
              <View style={styles.alertPeriod}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.alertPeriodText}>
                  {alert.activePeriod[0].end
                    ? `Until ${format(new Date(alert.activePeriod[0].end), 'MMM d, h:mm a')}`
                    : 'Ongoing'}
                </Text>
              </View>
            )}

            {alert.url && (
              <TouchableOpacity
                style={styles.alertLink}
                onPress={() => {
                  // Open URL (to be implemented)
                  console.log('Open alert URL:', alert.url);
                }}
              >
                <Text style={styles.alertLinkText}>Learn more →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
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
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  alertsList: {
    maxHeight: 300,
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertCardSevere: {
    backgroundColor: '#FEE2E2',
    borderLeftColor: '#EF4444',
  },
  alertCardWarning: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#F59E0B',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  alertPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  alertPeriodText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  alertLink: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  alertLinkText: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '500',
  },
});

