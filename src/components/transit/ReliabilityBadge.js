/**
 * ReliabilityBadge Component
 * Displays a reliability indicator badge for routes/arrivals
 * Based on ROADMAP.md Phase 3.1
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * ReliabilityBadge - Shows reliability level with color coding
 * @param {string} reliability - 'high' | 'medium' | 'low'
 * @param {string} size - 'small' | 'medium' | 'large' (default: 'medium')
 */
export default function ReliabilityBadge({ reliability = 'medium', size = 'medium' }) {
  const getColor = () => {
    switch (reliability) {
      case 'high':
        return '#10B981'; // Green
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getLabel = () => {
    switch (reliability) {
      case 'high':
        return 'Reliable';
      case 'medium':
        return 'Moderate';
      case 'low':
        return 'Unreliable';
      default:
        return 'Unknown';
    }
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 10,
      borderRadius: 4,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
      borderRadius: 6,
    },
    large: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
      borderRadius: 8,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getColor(),
          ...currentSize,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {getLabel()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

