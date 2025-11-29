/**
 * AsyncStorage utility functions
 * Provides typed storage operations for app data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

/**
 * Get item from storage
 */
export async function getStorageItem(key) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

/**
 * Set item in storage
 */
export async function setStorageItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    return false;
  }
}

/**
 * Remove item from storage
 */
export async function removeStorageItem(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
}

/**
 * Clear all storage
 */
export async function clearStorage() {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Get multiple items
 */
export async function getMultipleItems(keys) {
  try {
    const values = await AsyncStorage.multiGet(keys);
    return values.reduce((acc, [key, value]) => {
      acc[key] = value ? JSON.parse(value) : null;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error reading multiple items:', error);
    return {};
  }
}

/**
 * Set multiple items
 */
export async function setMultipleItems(items) {
  try {
    const entries = Object.entries(items).map(([key, value]) => [
      key,
      JSON.stringify(value),
    ]);
    await AsyncStorage.multiSet(entries);
    return true;
  } catch (error) {
    console.error('Error writing multiple items:', error);
    return false;
  }
}

// GTFS-specific storage helpers
export async function getGTFSRoutes() {
  return getStorageItem(STORAGE_KEYS.GTFS_ROUTES);
}

export async function setGTFSRoutes(routes) {
  return setStorageItem(STORAGE_KEYS.GTFS_ROUTES, routes);
}

export async function getGTFSStops() {
  return getStorageItem(STORAGE_KEYS.GTFS_STOPS);
}

export async function setGTFSStops(stops) {
  return setStorageItem(STORAGE_KEYS.GTFS_STOPS, stops);
}

export async function getGTFSTrips() {
  return getStorageItem(STORAGE_KEYS.GTFS_TRIPS);
}

export async function setGTFSTrips(trips) {
  return setStorageItem(STORAGE_KEYS.GTFS_TRIPS, trips);
}

export async function getGTFSStopTimes() {
  return getStorageItem(STORAGE_KEYS.GTFS_STOP_TIMES);
}

export async function setGTFSStopTimes(stopTimes) {
  return setStorageItem(STORAGE_KEYS.GTFS_STOP_TIMES, stopTimes);
}

export async function getGTFSVersion() {
  return getStorageItem(STORAGE_KEYS.GTFS_VERSION);
}

export async function setGTFSVersion(version) {
  return setStorageItem(STORAGE_KEYS.GTFS_VERSION, version);
}

export async function getGTFSDownloadDate() {
  return getStorageItem(STORAGE_KEYS.GTFS_DOWNLOAD_DATE);
}

export async function setGTFSDownloadDate(date) {
  return setStorageItem(STORAGE_KEYS.GTFS_DOWNLOAD_DATE, date);
}

// Saved Commutes storage helpers
export async function getSavedCommutes() {
  const commutes = await getStorageItem(STORAGE_KEYS.SAVED_COMMUTES);
  return Array.isArray(commutes) ? commutes : [];
}

export async function setSavedCommutes(commutes) {
  return setStorageItem(STORAGE_KEYS.SAVED_COMMUTES, commutes);
}

export async function addSavedCommute(commute) {
  const commutes = await getSavedCommutes();
  const newCommutes = [...commutes, commute];
  return setSavedCommutes(newCommutes);
}

export async function updateSavedCommute(commuteId, updates) {
  const commutes = await getSavedCommutes();
  const updatedCommutes = commutes.map((c) =>
    c.id === commuteId ? { ...c, ...updates, lastUsed: new Date().toISOString() } : c
  );
  return setSavedCommutes(updatedCommutes);
}

export async function deleteSavedCommute(commuteId) {
  const commutes = await getSavedCommutes();
  const filteredCommutes = commutes.filter((c) => c.id !== commuteId);
  return setSavedCommutes(filteredCommutes);
}

export async function getSavedCommute(commuteId) {
  const commutes = await getSavedCommutes();
  return commutes.find((c) => c.id === commuteId) || null;
}

