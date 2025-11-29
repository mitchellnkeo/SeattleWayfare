/**
 * Mock OneBusAway API responses for testing
 * Based on DATA_SOURCES.md specifications
 */

export const mockArrivalsResponse = {
  data: {
    entry: {
      stopId: '1_75403',
      arrivalsAndDepartures: [
        {
          routeId: '1_100275',
          routeShortName: '8',
          tripHeadsign: 'Rainier Beach',
          scheduledArrivalTime: Date.now() + 300000, // 5 min from now
          predictedArrivalTime: Date.now() + 480000, // 8 min from now (3 min delay)
          predicted: true,
          tripId: '1_604318805',
          vehicleId: '1_4201',
          distanceFromStop: 1250.5,
        },
        {
          routeId: '1_100479',
          routeShortName: 'E Line',
          tripHeadsign: 'Aurora Village',
          scheduledArrivalTime: Date.now() + 600000, // 10 min from now
          predictedArrivalTime: Date.now() + 600000, // On time
          predicted: true,
          tripId: '1_604318806',
          vehicleId: '1_4202',
          distanceFromStop: 2500.0,
        },
        {
          routeId: '1_100223',
          routeShortName: '43',
          tripHeadsign: 'UW Medical Center',
          scheduledArrivalTime: Date.now() + 900000, // 15 min from now
          predictedArrivalTime: Date.now() + 1020000, // 2 min delay
          predicted: true,
          tripId: '1_604318807',
          vehicleId: '1_4203',
          distanceFromStop: 3500.0,
        },
      ],
    },
  },
};

export const mockStopsResponse = {
  data: {
    list: [
      {
        id: '1_75403',
        name: '3rd Ave & Pike St',
        code: '75403',
        lat: 47.609421,
        lon: -122.337631,
        direction: 'S',
        routeIds: ['1_100275', '1_100224', '1_100479'],
      },
      {
        id: '1_75404',
        name: '3rd Ave & Pine St',
        code: '75404',
        lat: 47.610421,
        lon: -122.338631,
        direction: 'S',
        routeIds: ['1_100275', '1_100223'],
      },
    ],
  },
};

export const mockRouteResponse = {
  data: {
    entry: {
      id: '1_100275',
      shortName: '8',
      longName: 'Seattle Center - Capitol Hill - Rainier Beach',
      type: 3, // Bus
      color: 'FF0000',
      textColor: 'FFFFFF',
      agencyId: '1',
    },
  },
};

export const mockServiceAlerts = [
  {
    id: 'alert_12345',
    alert: {
      activePeriod: [
        {
          start: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          end: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        },
      ],
      informedEntity: [
        {
          routeId: '1_100275',
          routeType: 3,
        },
      ],
      headerText: {
        translation: [
          {
            text: 'Route 8 experiencing delays',
            language: 'en',
          },
        ],
      },
      descriptionText: {
        translation: [
          {
            text: 'Route 8 is running 10-15 minutes late due to traffic.',
            language: 'en',
          },
        ],
      },
    },
  },
];

