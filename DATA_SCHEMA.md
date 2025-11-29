# Data Schema Documentation - Seattle Wayfare

## Overview
This document defines all data structures, types, and models used throughout Seattle Wayfare. Use this as the single source of truth for data modeling.

---

## Core Data Types

### Stop
Transit stop/station information.

```typescript
interface Stop {
  // Identification
  id: string;                          // Stop ID (e.g., "1_75403")
  code: string;                        // Stop code for signage (e.g., "75403")
  name: string;                        // Stop name (e.g., "3rd Ave & Pike St")
  
  // Location
  lat: number;                         // Latitude
  lon: number;                         // Longitude
  
  // Metadata
  direction?: string;                  // Direction (N, S, E, W, NE, etc.)
  locationType?: number;               // 0 = stop, 1 = station
  wheelchairBoarding?: number;         // 0 = unknown, 1 = accessible, 2 = not accessible
  
  // Routes serving this stop
  routeIds: string[];                  // Array of route IDs
  
  // Additional info
  zoneId?: string;                     // Fare zone
  parentStation?: string;              // Parent station ID (for platforms)
}
```

### Route
Transit route information.

```typescript
interface Route {
  // Identification
  id: string;                          // Route ID (e.g., "1_100275")
  shortName: string;                   // Route number/letter (e.g., "8", "E Line")
  longName: string;                    // Full route name
  
  // Route details
  type: RouteType;                     // Bus, light rail, etc.
  color?: string;                      // Route color (hex)
  textColor?: string;                  // Text color for contrast
  
  // Agency
  agencyId: string;                    // Agency operating route
  agencyName: string;                  // Agency name (Metro, Sound Transit)
  
  // Reliability (custom data)
  reliability?: ReliabilityScore;
  
  // URL
  url?: string;                        // Route info URL
}

type RouteType = 
  | 0  // Tram/Streetcar/Light rail
  | 1  // Subway/Metro
  | 2  // Rail
  | 3  // Bus
  | 4  // Ferry
  | 5  // Cable tram
  | 6  // Aerial lift
  | 7  // Funicular
  | 11 // Trolleybus
  | 12; // Monorail
```

### Arrival
Real-time arrival prediction.

```typescript
interface Arrival {
  // Route info
  routeId: string;                     // Route ID
  routeShortName: string;              // Route number (e.g., "8")
  tripId: string;                      // Trip ID
  tripHeadsign: string;                // Destination (e.g., "Rainier Beach")
  
  // Timing
  scheduledArrivalTime: number;        // Scheduled arrival (Unix timestamp ms)
  predictedArrivalTime: number;        // Real-time prediction (Unix timestamp ms)
  predicted: boolean;                  // Whether prediction is available
  
  // Calculated fields
  minutesUntilArrival: number;         // Minutes until arrival
  delayMinutes: number;                // Delay from schedule (negative = early)
  
  // Vehicle info
  vehicleId?: string;                  // Vehicle ID
  distanceFromStop?: number;           // Distance in meters
  
  // Status
  status?: string;                     // "SCHEDULED" | "ARRIVING" | "DEPARTED"
  
  // Reliability
  reliability?: ReliabilityScore;      // Route reliability info
}
```

### Trip
Individual trip on a route.

```typescript
interface Trip {
  // Identification
  id: string;                          // Trip ID
  routeId: string;                     // Route this trip belongs to
  serviceId: string;                   // Service calendar ID
  
  // Display
  headsign: string;                    // Trip destination
  shortName?: string;                  // Trip short name
  
  // Direction
  directionId: number;                 // 0 or 1 (inbound/outbound)
  
  // Shape
  shapeId?: string;                    // Geographic path ID
  
  // Accessibility
  wheelchairAccessible?: number;       // 0 = unknown, 1 = yes, 2 = no
  bikesAllowed?: number;               // 0 = unknown, 1 = yes, 2 = no
  
  // Schedule
  stopTimes: StopTime[];               // Ordered list of stop times
}
```

### StopTime
Scheduled stop time for a trip.

```typescript
interface StopTime {
  tripId: string;                      // Trip ID
  stopId: string;                      // Stop ID
  stopSequence: number;                // Order in trip (1, 2, 3...)
  
  // Times (HH:MM:SS format, can exceed 24:00:00)
  arrivalTime: string;                 // Arrival time
  departureTime: string;               // Departure time
  
  // Pickup/dropoff rules
  pickupType: number;                  // 0 = regular, 1 = none
  dropOffType: number;                 // 0 = regular, 1 = none
  
  // Display
  stopHeadsign?: string;               // Override headsign for this stop
  
  // Distance
  shapeDistTraveled?: number;          // Distance from start of shape
}
```

### ReliabilityScore
Custom reliability scoring for routes.

```typescript
interface ReliabilityScore {
  routeId: string;
  routeShortName: string;
  
  // Performance metrics
  onTimePerformance: number;           // Percentage (0.0 - 1.0)
  averageDelayMinutes: number;         // Average delay in minutes
  
  // Rating
  reliability: 'high' | 'medium' | 'low';
  
  // Time-based patterns
  rushHourDelay?: number;              // Additional delay during rush hour
  weekendPerformance?: number;         // Weekend on-time percentage
  
  // Metadata
  dataSource: string;                  // Source of reliability data
  lastUpdated: string;                 // ISO date string
}
```

### ServiceAlert
Transit service disruption or alert.

```typescript
interface ServiceAlert {
  id: string;                          // Alert ID
  
  // Time period
  activePeriod: {
    start: number;                     // Unix timestamp
    end?: number;                      // Unix timestamp (optional if ongoing)
  }[];
  
  // Affected entities
  affectedRoutes: string[];            // Route IDs affected
  affectedStops?: string[];            // Stop IDs affected
  
  // Alert content
  header: string;                      // Short alert text
  description: string;                 // Full description
  url?: string;                        // More info URL
  
  // Severity
  severity?: 'info' | 'warning' | 'severe';
  
  // Effect
  effect?: AlertEffect;
}

type AlertEffect = 
  | 'NO_SERVICE'
  | 'REDUCED_SERVICE'
  | 'SIGNIFICANT_DELAYS'
  | 'DETOUR'
  | 'ADDITIONAL_SERVICE'
  | 'MODIFIED_SERVICE'
  | 'OTHER_EFFECT'
  | 'UNKNOWN_EFFECT';
```

---

## Trip Planning Types

### TripPlan
Complete trip plan from origin to destination.

```typescript
interface TripPlan {
  // Origin/destination
  from: Location;
  to: Location;
  
  // Timing
  requestedTime: number;               // Unix timestamp
  arriveBy: boolean;                   // True if user wants to arrive by time
  
  // Options
  itineraries: Itinerary[];            // Multiple route options
  
  // Metadata
  planTime: number;                    // When plan was generated
}
```

### Itinerary
Single route option for a trip.

```typescript
interface Itinerary {
  id: string;                          // Unique itinerary ID
  
  // Timing
  startTime: number;                   // Trip start (Unix timestamp)
  endTime: number;                     // Trip end (Unix timestamp)
  duration: number;                    // Total duration (minutes)
  walkTime: number;                    // Total walking time (minutes)
  transitTime: number;                 // Time on transit (minutes)
  waitingTime: number;                 // Waiting/transfer time (minutes)
  
  // Legs
  legs: Leg[];                         // Individual trip segments
  
  // Reliability
  overallReliability: 'high' | 'medium' | 'low';
  transferRisk?: TransferRisk[];       // Risk of missing connections
  
  // Comparison
  rank: number;                        // Ranking among options
  recommended?: boolean;               // Recommended by app
}
```

### Leg
Individual segment of a trip.

```typescript
interface Leg {
  // Type
  mode: LegMode;
  
  // Endpoints
  from: Location;
  to: Location;
  
  // Timing
  startTime: number;                   // Unix timestamp
  endTime: number;                     // Unix timestamp
  duration: number;                    // Minutes
  
  // Transit details (if transit leg)
  routeId?: string;
  routeShortName?: string;
  tripId?: string;
  headsign?: string;
  
  // Walking details (if walk leg)
  distance?: number;                   // Meters
  
  // Path
  geometry?: string;                   // Encoded polyline
  
  // Reliability (if transit)
  reliability?: ReliabilityScore;
  expectedDelay?: number;              // Predicted delay (minutes)
}

type LegMode = 
  | 'WALK'
  | 'BUS'
  | 'LIGHT_RAIL'
  | 'STREETCAR'
  | 'FERRY'
  | 'BICYCLE';
```

### Location
Geographic location for trip planning.

```typescript
interface Location {
  // Coordinates
  lat: number;
  lon: number;
  
  // Name/address
  name?: string;                       // Location name
  address?: string;                    // Full address
  
  // If transit stop
  stopId?: string;                     // Stop ID if at transit stop
  
  // Arrival time (for itinerary legs)
  time?: number;                       // Unix timestamp
}
```

### TransferRisk
Risk assessment for transfers.

```typescript
interface TransferRisk {
  // Transfer details
  fromLegIndex: number;                // Index of first leg
  toLegIndex: number;                  // Index of second leg
  transferStop: Stop;                  // Transfer location
  
  // Timing
  scheduledTransferTime: number;       // Scheduled time (minutes)
  walkingTime: number;                 // Walking time between stops
  bufferTime: number;                  // Additional buffer time
  
  // Risk assessment
  risk: 'low' | 'medium' | 'high';
  missedConnectionProbability: number; // 0.0 - 1.0
  
  // Recommendation
  recommendation: string;              // Text explanation
  alternatives?: string[];             // Alternative route suggestions
}
```

---

## User Data Types

### SavedStop
User's saved favorite stop.

```typescript
interface SavedStop {
  id: string;                          // Unique ID
  stopId: string;                      // Stop ID
  stopName: string;                    // Stop name
  nickname?: string;                   // User-given name (e.g., "Home stop")
  
  // Filters
  routeFilters?: string[];             // Show only these routes
  
  // Notifications
  notificationsEnabled: boolean;
  
  // Metadata
  createdAt: string;                   // ISO date string
  lastUsed: string;                    // ISO date string
  useCount: number;                    // Number of times accessed
}
```

### SavedCommute
User's regular commute.

```typescript
interface SavedCommute {
  id: string;                          // Unique ID
  name: string;                        // User-given name (e.g., "Work")
  
  // Trip details
  origin: Location;
  destination: Location;
  
  // Schedule
  daysOfWeek: number[];                // 0 = Sunday, 6 = Saturday
  usualDepartureTime: string;          // HH:MM format
  
  // Preferences
  preferredRoutes?: string[];          // Preferred route IDs
  avoidRoutes?: string[];              // Routes to avoid
  safeMode: boolean;                   // Add extra buffer time
  
  // Notifications
  notifyMinutesBefore: number;         // Notify X minutes before departure
  notifyOnDelays: boolean;
  
  // Analytics
  totalTrips: number;                  // Number of times taken
  averageDelay: number;                // Historical average delay
  reliabilityScore: number;            // 0.0 - 1.0
  
  // Metadata
  createdAt: string;
  lastUsed: string;
}
```

### UserPreferences
App-wide user preferences.

```typescript
interface UserPreferences {
  // Notifications
  notificationsEnabled: boolean;
  notifyDelays: boolean;
  notifyServiceAlerts: boolean;
  notifyMinutesBefore: number;         // Default for new commutes
  
  // Display
  theme: 'light' | 'dark' | 'auto';
  mapStyle: 'standard' | 'satellite' | 'hybrid';
  showReliabilityBadges: boolean;
  
  // Trip planning
  defaultTripMode: 'fastest' | 'safest' | 'balanced';
  maxWalkingDistance: number;          // Meters
  preferredAgencies?: string[];        // Prefer Metro vs ST, etc.
  
  // Accessibility
  wheelchairAccessibleOnly: boolean;
  visualImpairmentsMode: boolean;
  
  // Location
  lastKnownLocation?: {
    lat: number;
    lon: number;
    timestamp: number;
  };
}
```

---

## Analytics Types

### CommuteAnalytics
Analytics for a saved commute.

```typescript
interface CommuteAnalytics {
  commuteId: string;
  
  // Time period
  startDate: string;                   // ISO date
  endDate: string;                     // ISO date
  
  // Trip statistics
  totalTrips: number;
  onTimeTrips: number;
  lateTrips: number;
  cancelledTrips: number;
  
  // Delay statistics
  averageDelay: number;                // Minutes
  maxDelay: number;
  totalDelayMinutes: number;
  
  // Route usage
  routeUsage: {
    routeId: string;
    routeShortName: string;
    count: number;
    averageDelay: number;
  }[];
  
  // Recommendations
  mostReliableRoute?: string;
  bestDepartureTime?: string;
  alternativeRoutes: string[];
}
```

### TripHistory
Record of a completed trip.

```typescript
interface TripHistory {
  id: string;
  
  // Trip details
  origin: Location;
  destination: Location;
  commuteId?: string;                  // If part of saved commute
  
  // Timing
  plannedStartTime: number;
  actualStartTime: number;
  plannedEndTime: number;
  actualEndTime: number;
  
  // Routes taken
  routesTaken: string[];
  
  // Performance
  totalDelay: number;                  // Minutes late
  missedConnections: number;
  
  // Metadata
  date: string;                        // ISO date
}
```

---

## Cache Types

### CachedArrivals
Cached arrival data to reduce API calls.

```typescript
interface CachedArrivals {
  stopId: string;
  arrivals: Arrival[];
  timestamp: number;                   // Unix timestamp
  ttl: number;                         // Time to live (ms)
}
```

### CachedGTFS
Cached GTFS static data.

```typescript
interface CachedGTFS {
  version: string;                     // GTFS version/date
  routes: Route[];
  stops: Stop[];
  trips: Trip[];
  stopTimes: StopTime[];
  shapes: Shape[];
  downloadDate: string;                // ISO date
  expiryDate: string;                  // ISO date
}
```

---

## Constants

### Reliability Thresholds
```typescript
const RELIABILITY_THRESHOLDS = {
  high: 0.80,    // >= 80% on-time
  medium: 0.60,  // 60-79% on-time
  low: 0.60,     // < 60% on-time
};
```

### Transfer Risk Thresholds
```typescript
const TRANSFER_RISK_THRESHOLDS = {
  safe: 5,       // >= 5 min buffer = low risk
  risky: 3,      // 3-4 min buffer = medium risk
  dangerous: 3,  // < 3 min buffer = high risk
};
```

### Delay Categories
```typescript
const DELAY_CATEGORIES = {
  onTime: { min: -5, max: 5, label: 'On Time', color: '#10B981' },
  minorDelay: { min: 5, max: 10, label: 'Minor Delay', color: '#F59E0B' },
  majorDelay: { min: 10, max: 20, label: 'Major Delay', color: '#EF4444' },
  severe: { min: 20, max: Infinity, label: 'Severe Delay', color: '#991B1B' },
};
```

### Update Intervals
```typescript
const UPDATE_INTERVALS = {
  arrivals: 30000,           // 30 seconds
  alerts: 120000,            // 2 minutes
  location: 60000,           // 1 minute
  backgroundFetch: 900000,   // 15 minutes
};
```

---

## Storage Keys

### AsyncStorage Keys
```typescript
const STORAGE_KEYS = {
  // User data
  SAVED_STOPS: '@wayfare_saved_stops',
  SAVED_COMMUTES: '@wayfare_saved_commutes',
  USER_PREFERENCES: '@wayfare_preferences',
  TRIP_HISTORY: '@wayfare_trip_history',
  
  // GTFS data
  GTFS_ROUTES: '@wayfare_gtfs_routes',
  GTFS_STOPS: '@wayfare_gtfs_stops',
  GTFS_VERSION: '@wayfare_gtfs_version',
  
  // Reliability data
  RELIABILITY_SCORES: '@wayfare_reliability',
  RELIABILITY_UPDATED: '@wayfare_reliability_updated',
  
  // Cache
  CACHE_PREFIX: '@wayfare_cache_',
  LAST_LOCATION: '@wayfare_last_location',
  
  // App state
  ONBOARDING_COMPLETE: '@wayfare_onboarding',
  NOTIFICATIONS_PERMISSION: '@wayfare_notifications',
};
```

---

## Validation Rules

### Data Validation Functions
```typescript
// Validate coordinates
function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Validate Seattle area coordinates
function isSeattleArea(lat: number, lon: number): boolean {
  return lat >= 47.4 && lat <= 47.8 && lon >= -122.5 && lon <= -122.2;
}

// Validate stop ID format
function isValidStopId(stopId: string): boolean {
  return /^\d+_\d+$/.test(stopId); // Format: "1_75403"
}

// Validate route ID format
function isValidRouteId(routeId: string): boolean {
  return /^\d+_\d+$/.test(routeId); // Format: "1_100275"
}

// Validate time string
function isValidTimeString(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time); // Format: "HH:MM"
}
```

---

## Example Data

### Sample Stop
```json
{
  "id": "1_75403",
  "code": "75403",
  "name": "3rd Ave & Pike St",
  "lat": 47.609421,
  "lon": -122.337631,
  "direction": "S",
  "locationType": 0,
  "wheelchairBoarding": 1,
  "routeIds": ["1_100275", "1_100224", "1_100479"],
  "zoneId": "1"
}
```

### Sample Arrival
```json
{
  "routeId": "1_100275",
  "routeShortName": "8",
  "tripId": "1_604318805",
  "tripHeadsign": "Rainier Beach",
  "scheduledArrivalTime": 1638360000000,
  "predictedArrivalTime": 1638360480000,
  "predicted": true,
  "minutesUntilArrival": 8,
  "delayMinutes": 8,
  "vehicleId": "1_4201",
  "distanceFromStop": 1250.5,
  "status": "ARRIVING",
  "reliability": {
    "routeId": "1_100275",
    "routeShortName": "8",
    "onTimePerformance": 0.45,
    "averageDelayMinutes": 8,
    "reliability": "low",
    "dataSource": "2024 Q3 Metro Report",
    "lastUpdated": "2024-10-01T00:00:00Z"
  }
}
```

### Sample Itinerary
```json
{
  "id": "itin_001",
  "startTime": 1638360000000,
  "endTime": 1638362400000,
  "duration": 40,
  "walkTime": 10,
  "transitTime": 25,
  "waitingTime": 5,
  "legs": [
    {
      "mode": "WALK",
      "from": { "lat": 47.6062, "lon": -122.3321, "name": "Home" },
      "to": { "lat": 47.6094, "lon": -122.3376, "stopId": "1_75403" },
      "startTime": 1638360000000,
      "endTime": 1638360600000,
      "duration": 10,
      "distance": 800
    },
    {
      "mode": "BUS",
      "routeId": "1_100275",
      "routeShortName": "8",
      "tripId": "1_604318805",
      "headsign": "Rainier Beach",
      "from": { "lat": 47.6094, "lon": -122.3376, "stopId": "1_75403", "name": "3rd Ave & Pike St" },
      "to": { "lat": 47.6205, "lon": -122.3493, "stopId": "1_75415", "name": "Denny Way & Fairview Ave N" },
      "startTime": 1638360600000,
      "endTime": 1638362100000,
      "duration": 25,
      "reliability": {
        "onTimePerformance": 0.45,
        "reliability": "low"
      },
      "expectedDelay": 8
    },
    {
      "mode": "WALK",
      "from": { "lat": 47.6205, "lon": -122.3493, "stopId": "1_75415" },
      "to": { "lat": 47.6210, "lon": -122.3500, "name": "Work" },
      "startTime": 1638362100000,
      "endTime": 1638362400000,
      "duration": 5,
      "distance": 400
    }
  ],
  "overallReliability": "low",
  "transferRisk": [],
  "rank": 1,
  "recommended": false
}
```

---

## Data Migration

### Version 1.0 to 1.1
```typescript
interface MigrationConfig {
  fromVersion: string;
  toVersion: string;
  migrate: (oldData: any) => any;
}

const migrations: MigrationConfig[] = [
  {
    fromVersion: '1.0',
    toVersion: '1.1',
    migrate: (oldData) => {
      // Example: Add new reliability field to saved stops
      if (oldData.savedStops) {
        return {
          ...oldData,
          savedStops: oldData.savedStops.map((stop: any) => ({
            ...stop,
            notificationsEnabled: false, // New field with default
          })),
        };
      }
      return oldData;
    },
  },
];
```

---

This data schema provides a complete foundation for building Seattle Wayfare with consistent, well-structured data models.
