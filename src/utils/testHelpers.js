/**
 * Test helper utilities for consistent testing
 */

/**
 * Create a mock stop object
 */
export const createMockStop = (overrides = {}) => ({
  id: '1_75403',
  code: '75403',
  name: '3rd Ave & Pike St',
  lat: 47.609421,
  lon: -122.337631,
  direction: 'S',
  locationType: 0,
  wheelchairBoarding: 1,
  routeIds: ['1_100275', '1_100224', '1_100479'],
  ...overrides,
});

/**
 * Create a mock arrival object
 */
export const createMockArrival = (overrides = {}) => {
  const now = Date.now();
  return {
    routeId: '1_100275',
    routeShortName: '8',
    tripId: '1_604318805',
    tripHeadsign: 'Rainier Beach',
    scheduledArrivalTime: now + 300000, // 5 min from now
    predictedArrivalTime: now + 480000, // 8 min from now
    predicted: true,
    minutesUntilArrival: 8,
    delayMinutes: 3,
    vehicleId: '1_4201',
    distanceFromStop: 1250.5,
    status: 'SCHEDULED',
    ...overrides,
  };
};

/**
 * Create a mock route object
 */
export const createMockRoute = (overrides = {}) => ({
  id: '1_100275',
  shortName: '8',
  longName: 'Seattle Center - Capitol Hill - Rainier Beach',
  type: 3, // Bus
  color: 'FF0000',
  textColor: 'FFFFFF',
  agencyId: '1',
  agencyName: 'King County Metro',
  ...overrides,
});

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock current time for testing
 */
export const mockDate = (timestamp) => {
  const originalDate = Date;
  global.Date = jest.fn(() => new originalDate(timestamp));
  global.Date.now = jest.fn(() => timestamp);
  return () => {
    global.Date = originalDate;
  };
};

/**
 * Create mock AsyncStorage data
 */
export const createMockStorage = (data = {}) => {
  const storage = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(storage[key] || data[key] || null)),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
  };
};

