/**
 * StopAutocomplete Component
 * Provides autocomplete suggestions for stop search
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import metroService from '../../services/gtfs/metroService';

export default function StopAutocomplete({
  value,
  onChangeText,
  onSelectStop,
  placeholder,
  iconName = 'location',
  iconColor = '#3B82F6',
  showSuggestions = true,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchStops = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        await metroService.initialize();
        const results = metroService.searchStops(value);
        
        // Sort by relevance (exact matches first, then partial)
        const sorted = results.sort((a, b) => {
          const aName = a.stop_name?.toLowerCase() || '';
          const bName = b.stop_name?.toLowerCase() || '';
          const query = value.toLowerCase();
          
          // Exact match at start gets highest priority
          if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
          if (!aName.startsWith(query) && bName.startsWith(query)) return 1;
          
          // Then by length (shorter names are usually more relevant)
          return aName.length - bName.length;
        });
        
        setSuggestions(sorted.slice(0, 5)); // Show top 5
      } catch (error) {
        console.error('Error searching stops:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchStops, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelectStop = (stop) => {
    onChangeText(stop.stop_name || stop.stop_id);
    if (onSelectStop) {
      onSelectStop(stop);
    }
    setSuggestions([]);
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestionsContainer}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={iconColor} />
        </View>
      )}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.stop_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSelectStop(item)}
          >
            <Ionicons name="location-outline" size={18} color="#6B7280" style={styles.suggestionIcon} />
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionName} numberOfLines={1}>
                {item.stop_name || item.stop_id}
              </Text>
              {item.stop_code && (
                <Text style={styles.suggestionCode}>Stop #{item.stop_code}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionCode: {
    fontSize: 12,
    color: '#6B7280',
  },
});

