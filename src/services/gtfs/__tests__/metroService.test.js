/**
 * Test file for MetroGTFSService
 * Tests GTFS data loading and querying functionality
 */

import metroService from '../metroService';
import { getGTFSRoutes, getGTFSStops } from '../../../utils/storage';

// Mock storage functions for testing
jest.mock('../../../utils/storage', () => ({
  getGTFSRoutes: jest.fn(),
  setGTFSRoutes: jest.fn(),
  getGTFSStops: jest.fn(),
  setGTFSStops: jest.fn(),
  getGTFSTrips: jest.fn(),
  setGTFSTrips: jest.fn(),
  getGTFSStopTimes: jest.fn(),
  setGTFSStopTimes: jest.fn(),
  getGTFSVersion: jest.fn(),
  setGTFSVersion: jest.fn(),
  getGTFSDownloadDate: jest.fn(),
  setGTFSDownloadDate: jest.fn(),
}));

describe('MetroGTFSService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset service state
    metroService.routes = [];
    metroService.stops = [];
    metroService.trips = [];
    metroService.stopTimes = [];
    metroService.isLoaded = false;
  });

  describe('loadFromStorage', () => {
    it('should load data from storage when available', async () => {
      const mockRoutes = [
        { route_id: '1_100275', route_short_name: '8', route_long_name: 'Route 8' },
      ];
      const mockStops = [
        { stop_id: '1_75403', stop_name: '3rd Ave & Pike St', stop_lat: '47.609421', stop_lon: '-122.337631' },
      ];
      const mockTrips = [{ trip_id: '1_604318805', route_id: '1_100275' }];
      const mockStopTimes = [{ trip_id: '1_604318805', stop_id: '1_75403', stop_sequence: '1' }];

      getGTFSRoutes.mockResolvedValue(mockRoutes);
      getGTFSStops.mockResolvedValue(mockStops);
      require('../../../utils/storage').getGTFSTrips.mockResolvedValue(mockTrips);
      require('../../../utils/storage').getGTFSStopTimes.mockResolvedValue(mockStopTimes);

      const result = await metroService.loadFromStorage();

      expect(result).toBe(true);
      expect(metroService.isLoaded).toBe(true);
      expect(metroService.routes).toEqual(mockRoutes);
      expect(metroService.stops).toEqual(mockStops);
    });

    it('should return false when no data in storage', async () => {
      getGTFSRoutes.mockResolvedValue(null);
      getGTFSStops.mockResolvedValue(null);

      const result = await metroService.loadFromStorage();

      expect(result).toBe(false);
      expect(metroService.isLoaded).toBe(false);
    });
  });

  describe('getRoutes', () => {
    it('should return all routes when loaded', () => {
      metroService.routes = [
        { route_id: '1_100275', route_short_name: '8' },
        { route_id: '1_100479', route_short_name: 'E Line' },
      ];
      metroService.isLoaded = true;

      const routes = metroService.getRoutes();

      expect(routes).toHaveLength(2);
      expect(routes[0].route_short_name).toBe('8');
    });

    it('should return empty array when not loaded', () => {
      metroService.isLoaded = false;

      const routes = metroService.getRoutes();

      expect(routes).toEqual([]);
    });
  });

  describe('getRouteById', () => {
    it('should return route when found', () => {
      metroService.routes = [
        { route_id: '1_100275', route_short_name: '8' },
        { route_id: '1_100479', route_short_name: 'E Line' },
      ];
      metroService.isLoaded = true;

      const route = metroService.getRouteById('1_100275');

      expect(route).not.toBeNull();
      expect(route.route_short_name).toBe('8');
    });

    it('should return null when route not found', () => {
      metroService.routes = [{ route_id: '1_100275', route_short_name: '8' }];
      metroService.isLoaded = true;

      const route = metroService.getRouteById('1_999999');

      expect(route).toBeNull();
    });
  });

  describe('getStopsForRoute', () => {
    it('should return stops for a route', () => {
      metroService.routes = [{ route_id: '1_100275' }];
      metroService.trips = [
        { trip_id: 'trip1', route_id: '1_100275' },
        { trip_id: 'trip2', route_id: '1_100275' },
      ];
      metroService.stopTimes = [
        { trip_id: 'trip1', stop_id: 'stop1' },
        { trip_id: 'trip2', stop_id: 'stop2' },
      ];
      metroService.stops = [
        { stop_id: 'stop1', stop_name: 'Stop 1' },
        { stop_id: 'stop2', stop_name: 'Stop 2' },
        { stop_id: 'stop3', stop_name: 'Stop 3' },
      ];
      metroService.isLoaded = true;

      const stops = metroService.getStopsForRoute('1_100275');

      expect(stops).toHaveLength(2);
      expect(stops.map((s) => s.stop_id)).toContain('stop1');
      expect(stops.map((s) => s.stop_id)).toContain('stop2');
    });
  });

  describe('getRoutesForStop', () => {
    it('should return routes serving a stop', () => {
      metroService.stops = [{ stop_id: 'stop1' }];
      metroService.stopTimes = [
        { trip_id: 'trip1', stop_id: 'stop1' },
        { trip_id: 'trip2', stop_id: 'stop1' },
      ];
      metroService.trips = [
        { trip_id: 'trip1', route_id: 'route1' },
        { trip_id: 'trip2', route_id: 'route2' },
      ];
      metroService.isLoaded = true;

      const routes = metroService.getRoutesForStop('stop1');

      expect(routes).toHaveLength(2);
      expect(routes).toContain('route1');
      expect(routes).toContain('route2');
    });
  });

  describe('searchStops', () => {
    it('should search stops by name', () => {
      metroService.stops = [
        { stop_id: '1', stop_name: '3rd Ave & Pike St' },
        { stop_id: '2', stop_name: 'Capitol Hill Station' },
        { stop_id: '3', stop_name: 'Pike Street' },
      ];
      metroService.isLoaded = true;

      const results = metroService.searchStops('Pike');

      expect(results).toHaveLength(2);
      expect(results[0].stop_name).toContain('Pike');
    });

    it('should search stops by code', () => {
      metroService.stops = [
        { stop_id: '1', stop_name: 'Stop 1', stop_code: '75403' },
        { stop_id: '2', stop_name: 'Stop 2', stop_code: '75404' },
      ];
      metroService.isLoaded = true;

      const results = metroService.searchStops('75403');

      expect(results).toHaveLength(1);
      expect(results[0].stop_code).toBe('75403');
    });
  });
});

