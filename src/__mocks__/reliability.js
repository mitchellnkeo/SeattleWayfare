/**
 * Mock reliability data for testing
 * Based on DATA_SCHEMA.md and ROADMAP.md specifications
 */

export const mockReliabilityData = {
  '1_100275': {
    // Route 8: Notoriously unreliable
    routeId: '1_100275',
    routeShortName: '8',
    onTimePerformance: 0.45, // 45% on-time
    averageDelayMinutes: 8,
    reliability: 'low',
    rushHourDelay: 12,
    weekendPerformance: 0.50,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  '1_100479': {
    // E Line: More reliable
    routeId: '1_100479',
    routeShortName: 'E Line',
    onTimePerformance: 0.85, // 85% on-time
    averageDelayMinutes: 2,
    reliability: 'high',
    rushHourDelay: 3,
    weekendPerformance: 0.88,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
  '1_100223': {
    // Route 43: Moderately reliable
    routeId: '1_100223',
    routeShortName: '43',
    onTimePerformance: 0.72, // 72% on-time
    averageDelayMinutes: 3,
    reliability: 'medium',
    rushHourDelay: 5,
    weekendPerformance: 0.75,
    dataSource: '2024 Q3 Metro Report',
    lastUpdated: '2024-10-01T00:00:00Z',
  },
};

export const getMockReliability = (routeId) => {
  return (
    mockReliabilityData[routeId] || {
      routeId,
      routeShortName: 'Unknown',
      onTimePerformance: 0.70, // Default assumption
      averageDelayMinutes: 4,
      reliability: 'medium',
      dataSource: 'Default',
      lastUpdated: new Date().toISOString(),
    }
  );
};

