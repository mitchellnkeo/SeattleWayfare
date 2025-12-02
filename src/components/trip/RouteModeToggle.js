/**
 * RouteModeToggle Component
 * Toggle between "Safe Mode" and "Fast Mode" for trip planning
 * Based on ROADMAP.md Phase 3.2
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * RouteModeToggle - Toggle between Safe and Fast modes
 * @param {string} mode - Current mode: 'safe' | 'fast'
 * @param {Function} onModeChange - Callback when mode changes
 */
export default function RouteModeToggle({ mode = 'fast', onModeChange }) {
  if (!onModeChange) {
    console.warn('RouteModeToggle: onModeChange prop is missing');
    return null;
  }

  const handleModeChange = (newMode) => {
    try {
      if (onModeChange && typeof onModeChange === 'function') {
        onModeChange(newMode);
      }
    } catch (error) {
      console.error('Error changing mode:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Trip Mode:</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'fast' && styles.toggleButtonActive]}
          onPress={() => handleModeChange('fast')}
        >
          <Text style={[styles.toggleText, mode === 'fast' && styles.toggleTextActive]}>
            ⚡ Fast
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'safe' && styles.toggleButtonActive]}
          onPress={() => handleModeChange('safe')}
        >
          <Text style={[styles.toggleText, mode === 'safe' && styles.toggleTextActive]}>
            🛡️ Safe
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>
        {mode === 'safe'
          ? 'Prioritizes reliable routes with safer transfers'
          : 'Prioritizes fastest routes, may include risky transfers'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

