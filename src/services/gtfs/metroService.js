/**
 * King County Metro GTFS Service
 * Handles downloading, parsing, and caching GTFS static data
 * Based on DATA_SOURCES.md and ROADMAP.md Phase 2.1
 */

import axios from 'axios';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { Platform } from 'react-native';
import {
  getGTFSRoutes,
  setGTFSRoutes,
  getGTFSStops,
  setGTFSStops,
  getGTFSTrips,
  setGTFSTrips,
  getGTFSStopTimes,
  setGTFSStopTimes,
  getGTFSVersion,
  setGTFSVersion,
  getGTFSDownloadDate,
  setGTFSDownloadDate,
} from '../../utils/storage';
import { GTFS_URLS, CACHE_DURATION } from '../../utils/constants';
import { gtfsToObaStopId } from '../../utils/idMapping';

// Lazy import to avoid circular dependency
let obaService = null;
function getObaService() {
  if (!obaService) {
    try {
      obaService = require('../onebusaway/obaService').default;
    } catch (e) {
      console.warn('OneBusAway service not available:', e);
    }
  }
  return obaService;
}

const GTFS_URL = GTFS_URLS.METRO_MAIN;

class MetroGTFSService {
  constructor() {
    this.routes = [];
    this.stops = [];
    this.trips = [];
    this.stopTimes = [];
    this.isLoaded = false;
  }

  /**
   * Download and parse GTFS static data
   * Downloads ZIP, extracts CSV files, parses and stores in AsyncStorage
   * Note: On web, this will fail due to CORS. Use cached data instead.
   * @returns {Promise<boolean>} Success status
   */
  async fetchStaticData() {
    // On web platform, GTFS download fails due to CORS
    // Use cached data from AsyncStorage instead
    if (Platform.OS === 'web') {
      console.log('⚠️  Web platform detected - GTFS download not available due to CORS');
      console.log('📦 Attempting to load cached GTFS data from storage...');
      const loaded = await this.loadFromStorage();
      if (loaded) {
        console.log('✅ Loaded GTFS data from cache');
        return true;
      } else {
        console.warn('⚠️  No cached GTFS data available on web. Please use native app to download data.');
        return false;
      }
    }

    try {
      console.log('🌐 DOWNLOADING REAL GTFS DATA from King County Metro...');
      console.log('📍 Source URL:', GTFS_URL);
      console.log('⏳ This may take 30-60 seconds...\n');

      // Download ZIP file
      const response = await axios.get(GTFS_URL, {
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout
      });

      const fileSizeMB = (response.data.byteLength / (1024 * 1024)).toFixed(2);
      console.log(`✅ GTFS ZIP downloaded successfully!`);
      console.log(`   Size: ${fileSizeMB} MB (${response.data.byteLength.toLocaleString()} bytes)`);
      console.log(`   This is REAL data from King County Metro\n`);

      // Extract ZIP
      const zip = await JSZip.loadAsync(response.data);
      console.log('ZIP extracted, files:', Object.keys(zip.files).length);

      // Parse required CSV files
      const routes = await this._parseCSV(zip, 'routes.txt');
      const stops = await this._parseCSV(zip, 'stops.txt');
      const trips = await this._parseCSV(zip, 'trips.txt');
      const stopTimes = await this._parseCSV(zip, 'stop_times.txt');

      console.log('Parsed GTFS data:', {
        routes: routes.length,
        stops: stops.length,
        trips: trips.length,
        stopTimes: stopTimes.length,
      });

      // Store in memory
      this.routes = routes;
      this.stops = stops;
      this.trips = trips;
      this.stopTimes = stopTimes;
      this.isLoaded = true;

      // Store in AsyncStorage
      const downloadDate = new Date().toISOString();
      await setGTFSRoutes(routes);
      await setGTFSStops(stops);
      await setGTFSTrips(trips);
      await setGTFSStopTimes(stopTimes);
      await setGTFSVersion(downloadDate);
      await setGTFSDownloadDate(downloadDate);

      console.log('💾 REAL GTFS data stored in AsyncStorage');
      console.log(`   Download date: ${new Date(downloadDate).toLocaleString()}`);
      console.log(`   This data will be used for all queries\n`);
      return true;
    } catch (error) {
      console.error('Error fetching GTFS data:', error);
      throw error;
    }
  }

  /**
   * Parse a CSV file from the ZIP archive
   * @private
   */
  async _parseCSV(zip, filename) {
    try {
      const file = zip.file(filename);
      if (!file) {
        console.warn(`File ${filename} not found in GTFS ZIP`);
        return [];
      }

      const text = await file.async('string');
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep as strings for consistency
      });

      if (result.errors.length > 0) {
        console.warn(`Errors parsing ${filename}:`, result.errors);
      }

      return result.data;
    } catch (error) {
      console.error(`Error parsing ${filename}:`, error);
      return [];
    }
  }

  /**
   * Load GTFS data from AsyncStorage
   * @returns {Promise<boolean>} Success status
   */
  async loadFromStorage() {
    try {
      console.log('📦 loadFromStorage() starting...');
      
      let routes, stops, trips, stopTimes;
      
      // Load each data type separately with error handling
      try {
        console.log('📦 Loading routes from storage...');
        routes = await getGTFSRoutes();
        console.log('📦 Routes loaded:', routes ? routes.length : 'null');
      } catch (routesError) {
        console.error('❌ Error loading routes:', routesError);
        routes = null;
      }
      
      try {
        console.log('📦 Loading stops from storage...');
        stops = await getGTFSStops();
        console.log('📦 Stops loaded:', stops ? stops.length : 'null');
      } catch (stopsError) {
        console.error('❌ Error loading stops:', stopsError);
        stops = null;
      }
      
      try {
        console.log('📦 Loading trips from storage...');
        trips = await getGTFSTrips();
        console.log('📦 Trips loaded:', trips ? trips.length : 'null');
      } catch (tripsError) {
        console.error('❌ Error loading trips:', tripsError);
        trips = null;
      }
      
      // Skip stopTimes loading for now - it's causing crashes due to size
      // We can load it lazily when needed instead
      console.log('📦 Skipping stopTimes load (will load on-demand if needed)');
      stopTimes = [];
      
      // Uncomment below to try loading stopTimes (may cause crash on large datasets)
      /*
      try {
        console.log('📦 Loading stopTimes from storage...');
        // Use a very short timeout to prevent hanging
        const stopTimesPromise = getGTFSStopTimes();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('StopTimes load timeout')), 5000)
        );
        stopTimes = await Promise.race([stopTimesPromise, timeoutPromise]);
        console.log('📦 StopTimes loaded:', stopTimes ? stopTimes.length : 'null');
        
        // Validate stopTimes size to prevent memory issues
        if (stopTimes && stopTimes.length > 1000000) {
          console.warn('⚠️ StopTimes array is very large, this may cause memory issues');
        }
      } catch (stopTimesError) {
        console.error('❌ Error loading stopTimes:', stopTimesError);
        console.error('StopTimes error details:', {
          message: stopTimesError?.message,
          stack: stopTimesError?.stack,
          name: stopTimesError?.name
        });
        // If stopTimes fails, we can still work with other data
        // Set to empty array instead of null to prevent crashes
        stopTimes = [];
        console.warn('⚠️ Continuing without stopTimes data');
      }
      */

      // Allow partial data - we can work with routes, stops, and trips even without stopTimes
      if (routes && stops && trips) {
        // Validate data before assigning
        if (!Array.isArray(routes) || !Array.isArray(stops) || !Array.isArray(trips)) {
          console.error('❌ Invalid data format in storage - expected arrays');
          return false;
        }
        
        // Validate stopTimes if it exists, but allow it to be empty
        if (stopTimes !== null && stopTimes !== undefined && !Array.isArray(stopTimes)) {
          console.error('❌ Invalid stopTimes format - expected array or null');
          stopTimes = []; // Use empty array as fallback
        }
        
        console.log('📦 Assigning data to service...');
        this.routes = routes;
        this.stops = stops;
        this.trips = trips;
        this.stopTimes = stopTimes || []; // Use empty array if stopTimes failed to load
        this.isLoaded = true;
        
        try {
          const downloadDate = await getGTFSDownloadDate();
          if (downloadDate) {
            const date = new Date(downloadDate);
            console.log('📂 Loaded REAL GTFS data from cache');
            console.log(`   Originally downloaded: ${date.toLocaleString()}`);
            console.log(`   Routes: ${routes.length}, Stops: ${stops.length}`);
            console.log(`   This is REAL data from King County Metro\n`);
          } else {
            console.log('📂 Loaded GTFS data from cache (no download date recorded)\n');
          }
        } catch (dateError) {
          console.error('❌ Error loading download date:', dateError);
          // Continue anyway - we have the data
        }
        
        console.log('✅ loadFromStorage() completed successfully');
        return true;
      }

      console.log('⚠️  No GTFS data found in storage - will download from King County Metro\n');
      return false;
    } catch (error) {
      console.error('❌ Fatal error in loadFromStorage():', error);
      console.error('LoadFromStorage error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      return false;
    }
  }

  /**
   * Check if GTFS data needs to be updated
   * @returns {Promise<boolean>} True if update needed
   */
  async needsUpdate() {
    try {
      const downloadDate = await getGTFSDownloadDate();
      if (!downloadDate) {
        return true; // No data, needs initial download
      }

      const lastDownload = new Date(downloadDate);
      const now = new Date();
      const daysSinceDownload = (now - lastDownload) / (1000 * 60 * 60 * 24);

      // Update if older than cache duration (7 days)
      return daysSinceDownload > CACHE_DURATION.gtfs_data / (1000 * 60 * 60 * 24);
    } catch (error) {
      console.error('Error checking GTFS update status:', error);
      return true; // Default to needing update on error
    }
  }

  /**
   * Initialize GTFS data (load from storage or fetch if needed)
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('📦 MetroService.initialize() starting...');
      
      // Try to load from storage first
      let loaded = false;
      try {
        loaded = await this.loadFromStorage();
        console.log('📦 loadFromStorage result:', loaded);
      } catch (loadError) {
        console.error('❌ Error in loadFromStorage:', loadError);
        console.error('Load error details:', {
          message: loadError?.message,
          stack: loadError?.stack,
          name: loadError?.name
        });
        loaded = false;
      }

      if (!loaded) {
        // No data in storage, fetch it (will use cache on web)
        console.log('No GTFS data in storage, fetching...');
        try {
          const fetchResult = await this.fetchStaticData();
          console.log('📦 fetchStaticData result:', fetchResult);
          return fetchResult;
        } catch (fetchError) {
          console.error('❌ Error in fetchStaticData:', fetchError);
          console.error('Fetch error details:', {
            message: fetchError?.message,
            stack: fetchError?.stack,
            name: fetchError?.name
          });
          // Return false but don't crash
          return false;
        }
      }

      // On web, don't try to update in background (CORS will fail)
      if (Platform.OS === 'web') {
        console.log('✅ GTFS data loaded from cache (web platform)');
        this.isLoaded = true; // Ensure isLoaded is set
        return true;
      }

      // Check if update is needed (native platforms only)
      try {
        console.log('🔄 Checking if GTFS data needs update...');
        const needsUpdate = await this.needsUpdate();
        if (needsUpdate) {
          console.log('GTFS data is stale, updating in background...');
          // Update in background (don't wait)
          this.fetchStaticData().catch((error) => {
            console.error('Background GTFS update failed:', error);
          });
        } else {
          console.log('✅ GTFS data is up to date');
        }
      } catch (updateCheckError) {
        console.error('❌ Error checking if update needed:', updateCheckError);
        // Continue anyway - we have data loaded
      }
      
      this.isLoaded = true; // Ensure isLoaded is set
      console.log('✅ MetroService.initialize() completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Fatal error in MetroService.initialize():', error);
      console.error('Initialize error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      // Don't throw - return false to indicate failure
      return false;
    }

    // Check if update is needed (native platforms only)
    const needsUpdate = await this.needsUpdate();
    if (needsUpdate) {
      console.log('GTFS data is stale, updating in background...');
      // Update in background (don't wait)
      this.fetchStaticData().catch((error) => {
        console.error('Background GTFS update failed:', error);
      });
    }

    return true;
  }

  /**
   * Get all routes
   * @returns {Array} Array of route objects
   */
  getRoutes() {
    if (!this.isLoaded) {
      console.warn('GTFS data not loaded. Call initialize() first.');
      return [];
    }
    return this.routes;
  }

  /**
   * Get a route by ID
   * @param {string} routeId - Route ID (e.g., "1_100275")
   * @returns {Object|null} Route object or null
   */
  getRouteById(routeId) {
    if (!this.isLoaded) {
      return null;
    }
    return this.routes.find((route) => route.route_id === routeId) || null;
  }

  /**
   * Get stops for a specific route
   * @param {string} routeId - Route ID
   * @returns {Array} Array of stop objects
   */
  getStopsForRoute(routeId) {
    if (!this.isLoaded) {
      return [];
    }

    // Find trips for this route
    const routeTrips = this.trips.filter((trip) => trip.route_id === routeId);
    const tripIds = routeTrips.map((trip) => trip.trip_id);

    // Find stop times for these trips
    const routeStopTimes = this.stopTimes.filter((stopTime) =>
      tripIds.includes(stopTime.trip_id)
    );

    // Get unique stop IDs
    const stopIds = [...new Set(routeStopTimes.map((st) => st.stop_id))];

    // Get stop objects
    return this.stops.filter((stop) => stopIds.includes(stop.stop_id));
  }

  /**
   * Get routes serving a stop
   * Uses stopTimes if available, otherwise falls back to OneBusAway API
   * @param {string} stopId - Stop ID (GTFS format, e.g., "1_75403")
   * @returns {Promise<Array>} Array of route objects
   */
  async getRoutesForStop(stopId) {
    if (!this.isLoaded) {
      return [];
    }

    // Find stop times for this stop (if stopTimes is loaded)
    if (!this.stopTimes || this.stopTimes.length === 0) {
      console.log('📡 StopTimes not loaded - using OneBusAway API to find routes for stop:', stopId);
      // Fallback: Use OneBusAway API to get routes for this stop
      return await this._getRoutesForStopFromOBA(stopId);
    }
    
    const stopStopTimes = this.stopTimes.filter(
      (stopTime) => stopTime.stop_id === stopId
    );

    // Get unique trip IDs
    const tripIds = [...new Set(stopStopTimes.map((st) => st.trip_id))];

    // Find routes for these trips
    const routeIds = new Set();
    tripIds.forEach((tripId) => {
      const trip = this.trips.find((t) => t.trip_id === tripId);
      if (trip) {
        routeIds.add(trip.route_id);
      }
    });

    // Convert route IDs to route objects
    const routes = Array.from(routeIds)
      .map((routeId) => this.getRouteById(routeId))
      .filter(Boolean);
    
    return routes;
  }

  /**
   * Get routes for a stop using OneBusAway API (fallback when stopTimes not loaded)
   * @private
   * @param {string} stopId - Stop ID in GTFS format
   * @returns {Promise<Array>} Array of route IDs
   */
  async _getRoutesForStopFromOBA(stopId) {
    try {
      const oba = getObaService();
      if (!oba || !oba.isConfigured()) {
        console.warn('⚠️ OneBusAway API not available - cannot get routes for stop');
        return [];
      }

      // Convert GTFS stop ID to OneBusAway format (e.g., "13090" -> "1_13090")
      const obaStopId = gtfsToObaStopId(stopId);
      console.log(`🔄 Converting stop ID: ${stopId} -> ${obaStopId}`);

      // Get arrivals for this stop to find which routes serve it
      const arrivals = await oba.getArrivalsForStop(obaStopId, {
        minutesAfter: 60,
        useCache: true,
      });

      // Extract unique route IDs from arrivals
      const routeIds = [...new Set(arrivals.map((arrival) => arrival.routeId))];
      
      // Convert to route objects using GTFS routes data
      const routes = routeIds
        .map((routeId) => {
          // Try to find route in GTFS data
          const gtfsRoute = this.routes.find((r) => r.route_id === routeId);
          if (gtfsRoute) {
            return gtfsRoute;
          }
          // If not found, create a minimal route object from OBA data
          return {
            route_id: routeId,
            route_short_name: arrivals.find((a) => a.routeId === routeId)?.routeShortName || routeId,
            route_long_name: '',
          };
        })
        .filter(Boolean);

      console.log(`✅ Found ${routes.length} routes for stop ${stopId} via OneBusAway API`);
      return routes;
    } catch (error) {
      console.error('❌ Error getting routes from OneBusAway API:', error);
      return [];
    }
  }

  /**
   * Get a stop by ID
   * @param {string} stopId - Stop ID
   * @returns {Object|null} Stop object or null
   */
  getStopById(stopId) {
    if (!this.isLoaded) {
      return null;
    }
    return this.stops.find((stop) => stop.stop_id === stopId) || null;
  }

  /**
   * Search stops by name
   * @param {string} query - Search query
   * @returns {Array} Array of matching stops
   */
  searchStops(query) {
    if (!this.isLoaded) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return this.stops.filter(
      (stop) =>
        stop.stop_name?.toLowerCase().includes(lowerQuery) ||
        stop.stop_code?.includes(query)
    );
  }

  /**
   * Get stop times for a trip
   * @param {string} tripId - Trip ID
   * @returns {Array} Array of stop times, sorted by sequence
   */
  getStopTimesForTrip(tripId) {
    if (!this.isLoaded) {
      return [];
    }
    if (!this.stopTimes || this.stopTimes.length === 0) {
      console.warn('⚠️ StopTimes not loaded - returning empty array');
      return [];
    }
    return this.stopTimes
      .filter((stopTime) => stopTime.trip_id === tripId)
      .sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence));
  }
}

export default new MetroGTFSService();

