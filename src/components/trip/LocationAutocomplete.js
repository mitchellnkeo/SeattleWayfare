/**
 * LocationAutocomplete Component
 * Provides autocomplete suggestions for both addresses and bus stops
 * Similar to Google Maps search
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import metroService from '../../services/gtfs/metroService';
import geocodingService from '../../services/geocoding/geocodingService';

export default function LocationAutocomplete({
  value,
  onChangeText,
  onSelectLocation,
  onSelectStop,
  placeholder,
  iconName = 'location',
  iconColor = '#3B82F6',
  onUseCurrentLocation,
  onClear,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const results = [];

      // 1. Search bus stops
      await metroService.initialize();
      const stopResults = metroService.searchStops(query);
      
      // Sort stops by relevance
      const sortedStops = stopResults
        .sort((a, b) => {
          const aName = a.stop_name?.toLowerCase() || '';
          const bName = b.stop_name?.toLowerCase() || '';
          const lowerQuery = query.toLowerCase();
          
          if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
          if (!aName.startsWith(lowerQuery) && bName.startsWith(lowerQuery)) return 1;
          return aName.length - bName.length;
        })
        .slice(0, 3) // Top 3 stops
        .map((stop) => ({
          type: 'stop',
          id: stop.stop_id,
          name: stop.stop_name || stop.stop_id,
          subtitle: stop.stop_code ? `Stop #${stop.stop_code}` : 'Transit Stop',
          icon: 'bus-outline',
          data: stop,
        }));

      results.push(...sortedStops);

      // 2. Try geocoding if it looks like an address
      const looksLikeAddress = geocodingService.looksLikeAddress(query);
      if (looksLikeAddress || query.length >= 5) {
        try {
          const geocoded = await geocodingService.geocodeAddress(query);
          if (geocoded) {
            results.unshift({
              type: 'address',
              id: `address-${geocoded.latitude}-${geocoded.longitude}`,
              name: geocoded.formattedAddress || geocoded.address,
              subtitle: 'Location',
              icon: 'map-outline',
              data: {
                address: geocoded.formattedAddress || geocoded.address,
                lat: geocoded.latitude,
                lon: geocoded.longitude,
              },
            });
          }
        } catch (geocodeError) {
          // Geocoding failed, continue with stops only
          console.log('Geocoding not available for:', query);
        }
      }

      setSuggestions(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        searchLocations(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [value, searchLocations]);

  const handleSelect = (item) => {
    if (item.type === 'stop') {
      onChangeText(item.name);
      if (onSelectStop) {
        onSelectStop(item.data);
      }
    } else if (item.type === 'address') {
      onChangeText(item.name);
      if (onSelectLocation) {
        onSelectLocation(item.data);
      }
    }
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name={iconName} size={20} color={iconColor} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Clear selections when text changes
            if (onSelectStop) onSelectStop(null);
            if (onSelectLocation) onSelectLocation(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholderTextColor="#9CA3AF"
        />
        {loading && (
          <ActivityIndicator size="small" color="#6B7280" style={styles.loadingIndicator} />
        )}
        {value.length > 0 && !loading && onClear && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
        {onUseCurrentLocation && value.length === 0 && (
          <TouchableOpacity onPress={onUseCurrentLocation} style={styles.currentLocationButton}>
            <Ionicons name="locate" size={18} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {isFocused && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.type === 'address' ? '#3B82F6' : '#6B7280'}
                  style={styles.suggestionIcon}
                />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="always"
            scrollEnabled={suggestions.length > 3}
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  currentLocationButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  suggestionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

