# Data Sources Documentation - Seattle Wayfare

## Overview
This document provides comprehensive information about all data sources used in Seattle Wayfare, including APIs, data formats, update frequencies, and integration guidelines.

---

## Primary Data Sources

### 1. King County Metro GTFS (Static Schedule Data)

**Purpose:** Static schedule information, routes, stops, and service patterns

**Data Format:** GTFS (General Transit Feed Specification)  
**Update Frequency:** 2-4 times per year (with service changes)  
**Access:** Public, no API key required  
**Cost:** Free  

**Endpoints:**
- **Main GTFS Feed:** https://metro.kingcounty.gov/GTFS/google_transit.zip
- **Daily GTFS Feed:** https://metro.kingcounty.gov/GTFS/google_daily_transit.zip

**Coverage:**
- King County Metro buses
- Seattle Streetcar
- King County Water Taxi
- Sound Transit Link light rail (some routes)
- Some Sound Transit Express bus routes

**Files Included:**
```
google_transit.zip
├── agency.txt           # Transit agency info
├── calendar.txt         # Service patterns by day type
├── calendar_dates.txt   # Service exceptions (holidays, etc.)
├── routes.txt           # All bus/rail routes
├── stops.txt            # All transit stops
├── stop_times.txt       # Stop arrival/departure times
├── trips.txt            # Individual trips per route
├── shapes.txt           # Route path geometries
├── fare_attributes.txt  # Fare information
└── fare_rules.txt       # Fare rules by route/zone
```

**Key Data Fields:**

**routes.txt:**
```csv
route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color
100275,1,"8","","Seattle Center - Capitol Hill - Rainier Beach",3,https://kingcounty.gov/...
```

**stops.txt:**
```csv
stop_id,stop_code,stop_name,stop_desc,stop_lat,stop_lon,zone_id,stop_url
1_75403,75403,"3rd Ave & Pike St",,47.609421,-122.337631,,https://...
```

**stop_times.txt:**
```csv
trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type
604318805,08:30:00,08:30:00,1_75403,1,,0,0
```

**Integration Notes:**
- Download and cache locally on app install
- Update weekly or when Metro announces service changes
- Parse CSV files using Papa Parse or similar
- Store in SQLite or AsyncStorage for offline access
- File size: ~10-15 MB compressed

**Terms of Use:**
You must accept King County Metro's Terms of Use: King County will not be liable for any damages arising from use of the data. Information provided "as is" without warranty.

---

### 2. OneBusAway API (Real-Time Data)

**Purpose:** Real-time bus arrival predictions, vehicle locations, service alerts

**Data Format:** JSON REST API  
**Update Frequency:** Real-time (30-60 second updates recommended)  
**Access:** API key required (free)  
**Cost:** Free  

**API Base URL:** https://api.pugetsound.onebusaway.org/api/where/

**API Key Request:**
- Email: oba_api_key@soundtransit.org
- Include: Name, email, acknowledgment of Terms of Use
- Processing time: ~2 business days

**Key Endpoints:**

#### 2.1 Arrivals and Departures for Stop
```
GET /arrivals-and-departures-for-stop/{stopId}.json?key={API_KEY}
```

**Parameters:**
- `stopId` (required): Stop ID (e.g., "1_75403")
- `minutesBefore` (optional): Minutes before current time (default: 5)
- `minutesAfter` (optional): Minutes after current time (default: 35)

**Response Example:**
```json
{
  "data": {
    "entry": {
      "stopId": "1_75403",
      "arrivalsAndDepartures": [
        {
          "routeId": "1_100275",
          "routeShortName": "8",
          "tripHeadsign": "Rainier Beach",
          "scheduledArrivalTime": 1638360000000,
          "predictedArrivalTime": 1638360240000,
          "predicted": true,
          "tripId": "1_604318805",
          "vehicleId": "1_4201",
          "distanceFromStop": 1250.5
        }
      ]
    }
  }
}
```

**Key Fields:**
- `predicted`: Whether real-time prediction is available
- `scheduledArrivalTime`: Scheduled arrival (Unix timestamp in ms)
- `predictedArrivalTime`: Real-time prediction (Unix timestamp in ms)
- `distanceFromStop`: Distance of vehicle from stop (meters)

#### 2.2 Stops for Location
```
GET /stops-for-location.json?key={API_KEY}&lat={lat}&lon={lon}&radius={radius}
```

**Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `radius` (optional): Search radius in meters (default: 100, max: 5000)
- `latSpan` / `lonSpan` (optional): Coordinate span for results

**Response:** List of nearby stops with routes

#### 2.3 Trip Details
```
GET /trip-details/{tripId}.json?key={API_KEY}
```

**Response:** Full trip information including schedule, vehicle position, and service alerts

#### 2.4 Route Information
```
GET /route/{routeId}.json?key={API_KEY}
```

**Response:** Route details, stops, and service alerts

#### 2.5 Service Alerts (Situations)
```
GET /route/{routeId}.json?key={API_KEY}
```

Service alerts are included in route and trip responses under `references.situations`

**Rate Limits:**
- No official rate limit documented
- Recommended: Max 1 request per second per endpoint
- Cache responses for 30-60 seconds

**Integration Strategy:**
```javascript
// Poll every 30 seconds for active trips
setInterval(async () => {
  const arrivals = await fetchArrivals(stopId);
  updateUI(arrivals);
}, 30000);

// Use exponential backoff on errors
let retryDelay = 1000;
try {
  await fetchArrivals(stopId);
  retryDelay = 1000; // Reset on success
} catch (error) {
  setTimeout(retry, retryDelay);
  retryDelay *= 2; // Double delay each retry
}
```

---

### 3. Sound Transit GTFS & Real-Time Data

**Purpose:** Link light rail schedules, alerts, and real-time updates

**Data Format:** GTFS Static + GTFS-RT  
**Update Frequency:** Static (quarterly), Real-time (continuous)  
**Access:** Public  
**Cost:** Free  

**Static GTFS Feeds:**
- **King County Metro (via ST):** https://www.soundtransit.org/GTFS-KCM/google_transit.zip
- **Pierce Transit:** https://www.soundtransit.org/GTFS-PT/gtfs.zip
- **Intercity Transit:** https://gtfs.sound.obaweb.org/prod/19_gtfs.zip

**Real-Time Feeds:**

#### 3.1 Service Alerts (GTFS-RT)
```
GET https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json
```

**Format:** GTFS-Realtime in JSON format

**Coverage:**
- 1 Line (Northgate to Angle Lake)
- 2 Line (Seattle to Redmond - opening 2025)
- N Line (Northgate to Lynnwood)
- S Line (Sounder South)
- T Line (Tacoma Link)

**Response Structure:**
```json
{
  "entity": [
    {
      "id": "alert_12345",
      "alert": {
        "activePeriod": [
          {
            "start": 1638360000,
            "end": 1638370000
          }
        ],
        "informedEntity": [
          {
            "routeId": "40_100479",
            "routeType": 1
          }
        ],
        "headerText": {
          "translation": [
            {
              "text": "Link service suspended between Capitol Hill and Stadium",
              "language": "en"
            }
          ]
        },
        "descriptionText": {
          "translation": [
            {
              "text": "Bus shuttle running every 25-30 minutes",
              "language": "en"
            }
          ]
        }
      }
    }
  ]
}
```

**Integration Notes:**
- Poll every 1-2 minutes
- Parse and display alerts for routes in user's area
- Show prominently when affecting active trips

---

### 4. King County Metro Performance Data

**Purpose:** Historical reliability statistics for route scoring

**Data Format:** PDF reports, dashboards  
**Update Frequency:** Quarterly  
**Access:** Public  
**Cost:** Free  

**Sources:**
- **Performance Reports:** https://kingcounty.gov/en/dept/metro/about/data-and-reports/performance-reports
- **Rider Dashboard:** https://app.powerbigov.us/view?r=eyJrIjoiZDMw... (Power BI dashboard)
- **System Evaluation:** Annual reports with on-time performance by route

**Key Metrics:**
- On-time performance (% of trips within 5 min of schedule)
- Average delay by route
- Service reliability
- Passenger load factors

**Data Extraction:**
Manual extraction from reports to create reliability database:

```json
{
  "routes": [
    {
      "routeId": "1_100275",
      "routeShortName": "8",
      "onTimePerformance": 0.45,
      "averageDelayMinutes": 8,
      "reliability": "low",
      "dataSource": "2024 Q3 Performance Report",
      "lastUpdated": "2024-10-01"
    },
    {
      "routeId": "1_100479",
      "routeShortName": "E Line",
      "onTimePerformance": 0.85,
      "averageDelayMinutes": 2,
      "reliability": "high",
      "dataSource": "2024 Q3 Performance Report",
      "lastUpdated": "2024-10-01"
    }
  ]
}
```

**Update Strategy:**
- Manual quarterly updates
- Scrape from published reports
- Validate against community reports
- Store in app's local database

---

## Secondary Data Sources

### 5. Seattle Open Data Portal

**Purpose:** Additional transit-related datasets

**URL:** https://data.seattle.gov

**Relevant Datasets:**
- Bus stop locations with amenities
- Transit routes GIS data
- Streetcar real-time locations
- Traffic flow data (for delay correlation)

**Access:** Public API (Socrata Open Data API)  
**Format:** JSON, CSV, GeoJSON  
**No API key required**

---

### 6. WSDOT Traffic Data

**Purpose:** Traffic incidents affecting transit

**URL:** https://wsdot.wa.gov/traffic/api/

**Data:** Real-time traffic incidents, road closures, construction

**Integration:** Cross-reference with bus routes to predict delays

---

## Data Architecture

### Local Data Storage

```javascript
// AsyncStorage structure
{
  // Static GTFS data (updated weekly)
  "gtfs_routes": [...],
  "gtfs_stops": [...],
  "gtfs_stop_times": [...],
  
  // Reliability data (updated quarterly)
  "reliability_scores": {...},
  
  // User data
  "saved_stops": [...],
  "saved_commutes": [...],
  "user_preferences": {...},
  
  // Cache (TTL: 5 minutes)
  "cache_arrivals_1_75403": {
    "data": [...],
    "timestamp": 1638360000000
  }
}
```

### API Request Flow

```
User Opens App
     ↓
Load GTFS from Local Storage
     ↓
Get User Location
     ↓
Fetch Nearby Stops (OBA API)
     ↓
For Each Stop: Fetch Arrivals (OBA API)
     ↓
Enhance with Reliability Scores (Local Data)
     ↓
Display to User
```

### Real-Time Update Loop

```javascript
// While app is active
const updateLoop = async () => {
  while (appIsActive) {
    try {
      // Update arrivals for visible stops
      const stops = getVisibleStops();
      const arrivalPromises = stops.map(stop => 
        obaService.getArrivalsForStop(stop.id)
      );
      const arrivals = await Promise.all(arrivalPromises);
      
      // Check for delays and notify
      arrivals.forEach(checkForDelays);
      
      // Wait 30 seconds
      await sleep(30000);
    } catch (error) {
      console.error('Update error:', error);
      await sleep(60000); // Longer wait on error
    }
  }
};
```

---

## Data Quality & Validation

### GTFS Validation
- Use GTFS validator tools before importing
- Check for required files and fields
- Validate date ranges (service_id validity)
- Ensure stop coordinates are in Seattle area

### Real-Time Data Validation
```javascript
function validateArrival(arrival) {
  // Check timestamps are reasonable
  if (arrival.predictedArrivalTime < Date.now()) {
    console.warn('Predicted time in past');
    return false;
  }
  
  // Check delay is reasonable (< 60 min)
  const delay = (arrival.predictedArrivalTime - arrival.scheduledArrivalTime) / 60000;
  if (Math.abs(delay) > 60) {
    console.warn('Unrealistic delay');
    return false;
  }
  
  return true;
}
```

---

## API Error Handling

### Common Errors

**OneBusAway API:**
- `404`: Stop or route not found
- `500`: Internal server error (retry with backoff)
- Network timeout: Retry up to 3 times

**Sound Transit:**
- CORS issues: Use server proxy if needed
- Stale data: Check timestamp, use cached data if too old

### Fallback Strategy
```javascript
async function getArrivalsWithFallback(stopId) {
  try {
    // Try OneBusAway API
    return await obaService.getArrivalsForStop(stopId);
  } catch (error) {
    console.warn('OBA API failed, using schedule');
    // Fall back to GTFS schedule data
    return getScheduledArrivals(stopId);
  }
}
```

---

## Privacy & Terms Compliance

### Data Usage Requirements

**King County Metro:**
- Attribute data source in app
- Include disclaimer about accuracy
- No liability for Metro

**OneBusAway:**
- Free for non-commercial use
- Attribute OneBusAway
- Respect rate limits

**Sound Transit:**
- Agree to Transit Data Terms of Use
- Credit Sound Transit
- Report issues to open_transit_data@soundtransit.org

### User Data Privacy
- Location data stored locally only
- No transmission to third parties
- Clear privacy policy
- Allow users to disable location tracking

---

## Performance Optimization

### Caching Strategy
```javascript
const CACHE_DURATION = {
  gtfs_data: 7 * 24 * 60 * 60 * 1000,    // 7 days
  arrivals: 30 * 1000,                    // 30 seconds
  alerts: 2 * 60 * 1000,                  // 2 minutes
  reliability: 30 * 24 * 60 * 60 * 1000, // 30 days
};
```

### Request Batching
```javascript
// Batch multiple stop queries
const stops = ['1_75403', '1_75404', '1_75405'];
const arrivals = await Promise.all(
  stops.map(stopId => obaService.getArrivalsForStop(stopId))
);
```

### Offline Mode
- Store last known arrivals
- Show GTFS schedule times
- Disable real-time features
- Display offline indicator

---

## Testing Data Sources

### Development API Keys
- Request separate dev API key
- Use rate-limited test environment
- Don't use production keys in commits

### Mock Data
Create mock responses for testing:
```javascript
// __mocks__/obaService.js
export const mockArrivals = {
  data: {
    entry: {
      arrivalsAndDepartures: [
        {
          routeId: '1_100275',
          routeShortName: '8',
          scheduledArrivalTime: Date.now() + 300000,
          predictedArrivalTime: Date.now() + 480000, // 8 min late
          predicted: true,
        },
      ],
    },
  },
};
```

---

## Future Data Sources

### Potential Additions
- **Community Transit:** Snohomish County buses
- **Pierce Transit:** Tacoma area buses
- **Everett Transit:** Everett local buses
- **Bike Share APIs:** Lime, Jump (for multimodal)
- **Rideshare APIs:** Uber, Lyft (for last-mile)

### Expansion Considerations
- Additional API keys needed
- More complex trip planning
- Higher data storage requirements
- Separate reliability databases per agency

---

## Support & Resources

### Getting Help
- **OneBusAway GitHub:** https://github.com/OneBusAway
- **GTFS Community:** https://groups.google.com/g/gtfs-changes
- **Metro Developer Support:** Via website contact form

### Documentation
- **GTFS Spec:** https://gtfs.org/reference/static
- **GTFS-RT Spec:** https://gtfs.org/reference/realtime/v2/
- **OneBusAway API Docs:** https://developer.onebusaway.org/

---

**Note:** Always check data sources for updates to endpoints, formats, or terms of use before major releases.
