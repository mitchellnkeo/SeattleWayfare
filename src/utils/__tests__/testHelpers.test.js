/**
 * Example test file demonstrating testing setup
 * This validates our test utilities work correctly
 */

import {
  createMockStop,
  createMockArrival,
  createMockRoute,
  waitForAsync,
} from '../testHelpers';

describe('Test Helpers', () => {
  describe('createMockStop', () => {
    it('should create a valid stop object with defaults', () => {
      const stop = createMockStop();
      expect(stop).toHaveProperty('id');
      expect(stop).toHaveProperty('name');
      expect(stop).toHaveProperty('lat');
      expect(stop).toHaveProperty('lon');
      expect(stop).toHaveProperty('routeIds');
    });

    it('should allow overriding default values', () => {
      const stop = createMockStop({ name: 'Custom Stop', id: 'custom_123' });
      expect(stop.name).toBe('Custom Stop');
      expect(stop.id).toBe('custom_123');
    });
  });

  describe('createMockArrival', () => {
    it('should create a valid arrival object', () => {
      const arrival = createMockArrival();
      expect(arrival).toHaveProperty('routeId');
      expect(arrival).toHaveProperty('routeShortName');
      expect(arrival).toHaveProperty('scheduledArrivalTime');
      expect(arrival).toHaveProperty('predictedArrivalTime');
      expect(arrival.minutesUntilArrival).toBeGreaterThan(0);
    });

    it('should calculate delay correctly', () => {
      const arrival = createMockArrival();
      const delay =
        (arrival.predictedArrivalTime - arrival.scheduledArrivalTime) / 60000;
      expect(arrival.delayMinutes).toBe(Math.round(delay));
    });
  });

  describe('createMockRoute', () => {
    it('should create a valid route object', () => {
      const route = createMockRoute();
      expect(route).toHaveProperty('id');
      expect(route).toHaveProperty('shortName');
      expect(route).toHaveProperty('longName');
      expect(route).toHaveProperty('type');
    });
  });

  describe('waitForAsync', () => {
    it('should resolve after async operations', async () => {
      let resolved = false;
      waitForAsync().then(() => {
        resolved = true;
      });
      await waitForAsync();
      expect(resolved).toBe(true);
    });
  });
});

