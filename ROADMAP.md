# Seattle Wayfare - Development Roadmap

## Project Overview
**App Name:** Seattle Wayfare  
**Purpose:** Intelligent transit companion that helps Seattle riders navigate unreliable transit with smart delay predictions, alternative route suggestions, and transfer protection  
**Tech Stack:** React Native + Expo + NativeWind  
**Target Platform:** iOS and Android (App Store & Google Play)  
**Development Timeline:** 2-3 months for MVP

---

## Core Value Proposition
**"Never miss your connection. Get there on time, even when transit doesn't."**

Seattle Wayfare solves the biggest pain point in Seattle transit: unreliability. While existing apps show scheduled times, Wayfare predicts delays, suggests alternatives, and protects your transfers using historical reliability data and real-time information.

---

## Competitive Advantages

### vs. OneBusAway
- **Predictive vs Reactive**: Wayfare predicts delays before they affect you
- **Route reliability scoring**: Shows which routes are chronically late
- **Transfer protection**: Calculates if you'll make connections

### vs. Transit App / Google Maps
- **Seattle-optimized**: Built around local issues (Route 8 unreliability, Link disruptions)
- **Reliability intelligence**: Uses historical performance data
- **Proactive notifications**: Alerts before problems affect your trip

---

## Phase 1: Project Setup & Data Integration (Week 1-2)

### 1.1 Initialize Project
```bash
git a
cd seattle-wayfare
npx expo install nativewind tailwindcss
```

### 1.2 Install Core Dependencies
```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Maps & Location
npx expo install react-native-maps expo-location

# Storage
npx expo install @react-native-async-storage/async-storage

# Background Tasks & Notifications
npx expo install expo-task-manager expo-notifications expo-background-fetch

# Icons
npx expo install @expo/vector-icons

# Date/Time
npx expo install date-fns

# HTTP Client
npm install axios
```

### 1.3 Project Structure
```
seattle-wayfare/
├── src/
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   ├── transit/             # Transit-specific components
│   │   └── map/                 # Map components
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── TripPlannerScreen.js
│   │   ├── RouteDetailScreen.js
│   │   ├── SavedCommutesScreen.js
│   │   └── SettingsScreen.js
│   ├── services/
│   │   ├── gtfs/                # GTFS data services
│   │   ├── onebusaway/          # OneBusAway API
│   │   ├── soundtransit/        # Sound Transit API
│   │   └── reliability/         # Reliability scoring
│   ├── utils/
│   │   ├── storage.js
│   │   ├── notifications.js
│   │   ├── constants.js
│   │   └── timeUtils.js
│   ├── data/
│   │   ├── routes.json          # Cached route data
│   │   └── reliability.json     # Historical reliability data
│   └── hooks/
│       ├── useRealtimeArrivals.js
│       ├── useReliability.js
│       └── useTripPlanner.js
├── assets/
├── app.json
└── ROADMAP.md
```

### 1.4 App Configuration (app.json)
```json
{
  "expo": {
    "name": "Seattle Wayfare",
    "slug": "seattle-wayfare",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E3A8A"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.seattlewayfare.app",
      "infoPlist": {
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E3A8A"
      },
      "package": "com.seattlewayfare.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Seattle Wayfare to show nearby transit and send delay notifications."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#1E3A8A"
        }
      ]
    ]
  }
}
```

---

## Phase 2: Data Services Integration (Week 2-3)

### 2.1 King County Metro GTFS Integration

**Data Source:** https://metro.kingcounty.gov/GTFS/google_transit.zip

Create `src/services/gtfs/metroService.js`:
```javascript
import axios from 'axios';

const GTFS_URL = 'https://metro.kingcounty.gov/GTFS/google_transit.zip';

class MetroGTFSService {
  constructor() {
    this.routes = [];
    this.stops = [];
    this.trips = [];
    this.stopTimes = [];
  }

  /**
   * Download and parse GTFS static data
   * Note: This should be done on app install and updated weekly
   */
  async fetchStaticData() {
    // Download ZIP file
    // Parse CSV files: routes.txt, stops.txt, trips.txt, stop_times.txt
    // Store in AsyncStorage
  }

  /**
   * Get all routes
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Get stops for a specific route
   */
  getStopsForRoute(routeId) {
    // Query stop_times and trips to find stops
  }

  /**
   * Find routes serving a stop
   */
  getRoutesForStop(stopId) {
    // Query to find routes
  }
}

export default new MetroGTFSService();
```

### 2.2 OneBusAway Real-Time API Integration

**API Endpoint:** https://api.pugetsound.onebusaway.org/api/where/
**API Key Required:** Email oba_api_key@soundtransit.org

Create `src/services/onebusaway/obaService.js`:
```javascript
import axios from 'axios';

const OBA_BASE_URL = 'https://api.pugetsound.onebusaway.org/api/where';
const API_KEY = 'YOUR_API_KEY'; // Store in environment variable

class OneBusAwayService {
  /**
   * Get real-time arrivals for a stop
   * @param {string} stopId - Stop ID (e.g., "1_75403")
   */
  async getArrivalsForStop(stopId) {
    try {
      const response = await axios.get(
        `${OBA_BASE_URL}/arrivals-and-departures-for-stop/${stopId}.json`,
        {
          params: {
            key: API_KEY,
            minutesBefore: 5,
            minutesAfter: 60,
          },
        }
      );
      
      return response.data.data.entry.arrivalsAndDepartures.map(arrival => ({
        routeId: arrival.routeId,
        routeShortName: arrival.routeShortName,
        tripHeadsign: arrival.tripHeadsign,
        scheduledArrivalTime: arrival.scheduledArrivalTime,
        predictedArrivalTime: arrival.predictedArrivalTime,
        predicted: arrival.predicted,
        minutesUntilArrival: Math.round((arrival.predictedArrivalTime - Date.now()) / 60000),
        // Calculate delay
        delayMinutes: arrival.predicted 
          ? Math.round((arrival.predictedArrivalTime - arrival.scheduledArrivalTime) / 60000)
          : 0,
      }));
    } catch (error) {
      console.error('Error fetching arrivals:', error);
      throw error;
    }
  }

  /**
   * Get stops near a location
   */
  async getStopsNearLocation(lat, lng, radius = 500) {
    try {
      const response = await axios.get(
        `${OBA_BASE_URL}/stops-for-location.json`,
        {
          params: {
            key: API_KEY,
            lat,
            lon: lng,
            radius, // meters
            latSpan: 0.01,
            lonSpan: 0.01,
          },
        }
      );
      
      return response.data.data.list.map(stop => ({
        id: stop.id,
        name: stop.name,
        code: stop.code,
        lat: stop.lat,
        lon: stop.lon,
        direction: stop.direction,
        routes: stop.routeIds,
      }));
    } catch (error) {
      console.error('Error fetching stops:', error);
      throw error;
    }
  }

  /**
   * Get trip details
   */
  async getTripDetails(tripId) {
    try {
      const response = await axios.get(
        `${OBA_BASE_URL}/trip-details/${tripId}.json`,
        {
          params: { key: API_KEY },
        }
      );
      
      return response.data.data.entry;
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  }

  /**
   * Get vehicle location (real-time bus tracking)
   */
  async getVehicleForTrip(tripId) {
    try {
      const tripDetails = await this.getTripDetails(tripId);
      return tripDetails.status?.position || null;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return null;
    }
  }

  /**
   * Get service alerts
   */
  async getAlertsForRoute(routeId) {
    try {
      const response = await axios.get(
        `${OBA_BASE_URL}/route/${routeId}.json`,
        {
          params: { key: API_KEY },
        }
      );
      
      return response.data.data.references.situations || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }
}

export default new OneBusAwayService();
```

### 2.3 Sound Transit API Integration

**Data Source:** https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json

Create `src/services/soundtransit/stService.js`:
```javascript
import axios from 'axios';

const ST_ALERTS_URL = 'https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json';

class SoundTransitService {
  /**
   * Get Link light rail alerts
   */
  async getLinkAlerts() {
    try {
      const response = await axios.get(ST_ALERTS_URL);
      
      return response.data.entity.map(alert => ({
        id: alert.id,
        header: alert.alert.headerText?.translation?.[0]?.text || '',
        description: alert.alert.descriptionText?.translation?.[0]?.text || '',
        url: alert.alert.url?.translation?.[0]?.text || '',
        activePeriod: alert.alert.activePeriod,
        affectedRoutes: alert.alert.informedEntity?.map(e => e.routeId) || [],
      }));
    } catch (error) {
      console.error('Error fetching ST alerts:', error);
      return [];
    }
  }
}

export default new SoundTransitService();
```

### 2.4 Reliability Scoring Service

Create `src/services/reliability/reliabilityService.js`:
```javascript
/**
 * Historical reliability data structure
 * Data sourced from King County Metro performance reports
 */
const ROUTE_RELIABILITY = {
  // Route 8: Notoriously unreliable
  '1_100275': {
    routeShortName: '8',
    onTimePerformance: 0.45, // 45% on-time
    averageDelayMinutes: 8,
    reliability: 'low',
  },
  // Route 43: Moderately reliable
  '1_100223': {
    routeShortName: '43',
    onTimePerformance: 0.72,
    averageDelayMinutes: 3,
    reliability: 'medium',
  },
  // RapidRide E Line: More reliable
  '1_100479': {
    routeShortName: 'E Line',
    onTimePerformance: 0.85,
    averageDelayMinutes: 2,
    reliability: 'high',
  },
  // Add more routes based on Metro's performance data
};

class ReliabilityService {
  /**
   * Get reliability score for a route
   */
  getRouteReliability(routeId) {
    return ROUTE_RELIABILITY[routeId] || {
      onTimePerformance: 0.70, // Default assumption
      averageDelayMinutes: 4,
      reliability: 'medium',
    };
  }

  /**
   * Calculate transfer risk
   * @param {Object} firstArrival - First leg arrival prediction
   * @param {Object} secondDeparture - Second leg departure time
   * @param {number} walkingMinutes - Walking time between stops
   */
  calculateTransferRisk(firstArrival, secondDeparture, walkingMinutes = 2) {
    const firstArrivalTime = firstArrival.predictedArrivalTime || firstArrival.scheduledArrivalTime;
    const bufferTime = firstArrivalTime + (walkingMinutes * 60000); // Convert to ms
    
    const timeUntilConnection = secondDeparture.scheduledDepartureTime - bufferTime;
    const connectionMinutes = timeUntilConnection / 60000;
    
    // Factor in first leg reliability
    const firstLegReliability = this.getRouteReliability(firstArrival.routeId);
    const expectedDelay = firstLegReliability.averageDelayMinutes;
    
    const adjustedConnectionMinutes = connectionMinutes - expectedDelay;
    
    // Risk levels
    if (adjustedConnectionMinutes < 2) return { risk: 'high', likelihood: 0.80 };
    if (adjustedConnectionMinutes < 5) return { risk: 'medium', likelihood: 0.40 };
    return { risk: 'low', likelihood: 0.10 };
  }

  /**
   * Suggest alternative routes based on reliability
   */
  suggestBetterRoute(origin, destination, currentRoute) {
    // Logic to find alternative routes with better reliability
    // This would query GTFS data and compare reliability scores
  }

  /**
   * Predict if bus will be late based on time of day and route
   */
  predictDelay(routeId, stopId, timeOfDay) {
    const reliability = this.getRouteReliability(routeId);
    
    // Rush hour factor (7-9am, 4-7pm)
    const hour = new Date(timeOfDay).getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
    
    const rushHourMultiplier = isRushHour ? 1.5 : 1.0;
    const predictedDelay = reliability.averageDelayMinutes * rushHourMultiplier;
    
    return {
      expectedDelayMinutes: Math.round(predictedDelay),
      confidence: reliability.onTimePerformance,
    };
  }
}

export default new ReliabilityService();
```

---

## Phase 3: Core UI Components (Week 3-5)

### 3.1 Home Screen - Nearby Stops & Arrivals

**Features:**
- Show user location on map
- Display nearby transit stops (within 500m)
- Real-time arrivals for nearby stops
- Reliability badges on each arrival
- Quick access to saved commutes

**Components:**
- `HomeScreen.js`
- `NearbyStopsMap.js`
- `ArrivalCard.js` (with reliability indicator)
- `ReliabilityBadge.js`

### 3.2 Trip Planner

**Features:**
- Origin/destination input (address or stop)
- Multiple route options
- Show reliability score for each option
- "Safe Mode" vs "Fast Mode" toggle
- Transfer risk warnings
- Alternative routes if primary has issues

**Components:**
- `TripPlannerScreen.js`
- `TripOptionCard.js`
- `TransferRiskWarning.js`
- `RouteModeToggle.js`

### 3.3 Route Detail Screen

**Features:**
- Full route map
- All stops with real-time arrivals
- Historical reliability chart
- Service alerts
- Typical delays by time of day

**Components:**
- `RouteDetailScreen.js`
- `RouteMap.js`
- `ReliabilityChart.js`
- `ServiceAlerts.js`

### 3.4 Saved Commutes

**Features:**
- Save frequent trips
- Quick launch trip with reliability check
- "When to leave" notifications
- Weekly reliability summary

**Components:**
- `SavedCommutesScreen.js`
- `CommuteCard.js`
- `WeeklyReliabilityReport.js`

---

## Phase 4: Smart Notifications (Week 5-6)

### 4.1 Delay Notifications
```javascript
// src/utils/notifications.js
import * as Notifications from 'expo-notifications';

export async function setupNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  
  // Configure notification behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  return true;
}

export async function sendDelayNotification(route, delayMinutes, alternative) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ Route ${route} Delayed`,
      body: alternative 
        ? `Running ${delayMinutes} min late. Take Route ${alternative} instead.`
        : `Running ${delayMinutes} min late. Adjust your departure time.`,
      data: { route, delayMinutes, alternative },
    },
    trigger: null, // Send immediately
  });
}

export async function sendTransferRiskNotification(firstRoute, secondRoute) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Transfer Risk',
      body: `${firstRoute} is delayed. You may miss your ${secondRoute} connection.`,
      data: { firstRoute, secondRoute },
    },
    trigger: null,
  });
}
```

### 4.2 Background Monitoring
```javascript
// src/services/backgroundService.js
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import obaService from './onebusaway/obaService';
import reliabilityService from './reliability/reliabilityService';

const BACKGROUND_FETCH_TASK = 'wayfare-background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Get user's saved commutes
    const savedCommutes = await getSavedCommutes();
    
    for (const commute of savedCommutes) {
      // Check if user should be notified
      const now = new Date();
      const departureTime = commute.usualDepartureTime;
      
      // Check 30 minutes before usual departure
      const notifyTime = new Date(departureTime - 30 * 60000);
      
      if (Math.abs(now - notifyTime) < 5 * 60000) { // Within 5 min window
        const arrivals = await obaService.getArrivalsForStop(commute.originStopId);
        const relevantArrival = arrivals.find(a => a.routeId === commute.routeId);
        
        if (relevantArrival && relevantArrival.delayMinutes > 5) {
          // Send notification about delay
          await sendDelayNotification(
            relevantArrival.routeShortName,
            relevantArrival.delayMinutes
          );
        }
      }
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch() {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

---

## Phase 5: Advanced Features (Week 6-7)

### 5.1 Trip Planning Algorithm
- Multi-modal routing (bus + light rail)
- Minimize transfers
- Factor in reliability when comparing routes
- "Safe mode": Add buffer time for unreliable routes

### 5.2 Reliability Analytics Dashboard
- Show user's most-used routes
- Weekly reliability summary
- Compare scheduled vs actual arrival times
- Identify most problematic connections

### 5.3 Service Alerts Integration
- Pull from Sound Transit alerts API
- Pull from OneBusAway situations
- Filter alerts relevant to user's routes
- Show on map and in route details

---

## Phase 6: Polish & Testing (Week 7-8)

### 6.1 Performance Optimization
- Cache GTFS data locally
- Limit API calls (use caching)
- Optimize map rendering
- Background location tracking only when needed

### 6.2 Error Handling
- Offline mode (show cached data)
- API failure fallbacks
- Network error messages
- Retry mechanisms

### 6.3 Accessibility
- VoiceOver support
- High contrast mode for reliability badges
- Large text support
- Haptic feedback for notifications

---

## Phase 7: Launch Preparation (Week 8-9)

### 7.1 Legal Requirements
- **Privacy Policy**: Explain location tracking, notification usage
- **Terms of Service**: Disclaimer about data accuracy
- **Data Attribution**: Credit King County Metro, Sound Transit, OneBusAway

### 7.2 App Store Assets
- Screenshots showing key features:
  1. Nearby stops with arrivals
  2. Reliability badges
  3. Trip planning with alternatives
  4. Delay notification
  5. Transfer risk warning

---

## Key Technical Decisions

### Data Update Strategy
- **Static GTFS**: Download weekly, store locally
- **Real-time data**: Poll every 30 seconds when app active
- **Reliability data**: Update monthly from Metro reports

### Notification Strategy
- **Immediate**: Delays affecting active trips
- **Scheduled**: "Time to leave" reminders 30 min before departure
- **Daily**: Morning summary of commute conditions

### Battery Optimization
- Use significant location changes (not continuous tracking)
- Background fetch max every 15 minutes
- Suspend monitoring when user hasn't used app for 24 hours

---

## MVP Definition

### Must-Have:
✅ Real-time arrivals for nearby stops  
✅ Reliability badges on arrivals  
✅ Basic trip planning  
✅ Delay notifications  
✅ Save favorite stops/routes  
✅ Service alerts  

### Nice-to-Have (v1.1):
- Transfer risk calculation
- Route comparison
- Historical reliability charts
- Saved commutes with smart notifications
- "When to leave" recommendations

---

## Success Metrics

### Launch Targets (First 3 Months):
- 1,000+ downloads
- 200+ weekly active users
- 50+ saved commutes created
- 4+ star average rating
- <2% crash rate

### User Engagement:
- Average 3+ opens per day
- Notification engagement rate >40%
- Trip planner usage 2+ times per week

---

## Post-Launch Roadmap

### Version 1.1 (Month 4-6):
- Commute learning (auto-detect regular trips)
- Weekly reliability reports
- Integration with ORCA for fare info
- Bike share integration

### Version 1.2 (Month 7-9):
- Social features (share trip with friends)
- Crowdsourced delay reports
- Accessibility improvements
- Expansion to Tacoma/Bellevue

### Version 2.0 (Year 2):
- Premium features (advanced analytics, priority notifications)
- Partnership with King County Metro
- Transit advocacy features (report issues)
- Integration with other regional transit

---

## Resources

### Official Data Sources
- King County Metro GTFS: https://metro.kingcounty.gov/GTFS/
- OneBusAway API: https://api.pugetsound.onebusaway.org/
- Sound Transit Open Data: https://www.soundtransit.org/help-contacts/business-information/open-transit-data-otd
- Metro Performance Reports: https://kingcounty.gov/en/dept/metro/about/data-and-reports/performance-reports

### Development Resources
- Expo Docs: https://docs.expo.dev
- GTFS Specification: https://gtfs.org
- OneBusAway API Docs: https://developer.onebusaway.org/api/where

---

**Remember:** Seattle Wayfare's competitive advantage is intelligence, not just information. Focus on making transit **predictable** in an unpredictable system.
