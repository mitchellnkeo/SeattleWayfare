# Testing Guide - Seattle Wayfare

## Overview
Comprehensive testing procedures for Seattle Wayfare to ensure reliable, bug-free transit predictions and notifications before launch.

---

## Testing Strategy

### Testing Pyramid
1. **Manual Testing** (60% - critical for real-world transit scenarios)
2. **Integration Testing** (30% - API and data integration)
3. **Automated Testing** (10% - core utilities)

### Testing Phases
1. **Development Testing** - Continuous during development
2. **Data Integration Testing** - Verify all APIs working
3. **Real-World Testing** - Test with actual transit rides
4. **System Testing** - Complete app testing
5. **Acceptance Testing** - Pre-launch validation

---

## Manual Testing Checklist

### Home Screen - Nearby Stops & Arrivals

**Initial Load:**
- [ ] App opens without crashes
- [ ] Location permission prompt appears
- [ ] Map loads with user location (if granted)
- [ ] Nearby stops appear within 500m
- [ ] Stop markers are visible and tappable

**Arrival Display:**
- [ ] Real-time arrivals load within 2 seconds
- [ ] Route numbers display correctly
- [ ] Headsign/destination shows
- [ ] Minutes until arrival displays
- [ ] "Real-time" vs "scheduled" indicator shows
- [ ] Delay information displays (if delayed)
- [ ] Reliability badges appear correctly
- [ ] Pull-to-refresh updates arrivals
- [ ] Loading indicator shows during refresh

**Reliability Badges:**
- [ ] High reliability (green) for E Line, RapidRide
- [ ] Low reliability (red) for Route 8
- [ ] Medium reliability (amber) for most routes
- [ ] On-time percentage displays
- [ ] Badge colors are readable and distinct

**Error Handling:**
- [ ] No location permission: Shows manual location entry
- [ ] No network: Shows cached data with indicator
- [ ] API timeout: Shows error message and retry
- [ ] No nearby stops: Shows empty state

### Trip Planner

**Trip Input:**
- [ ] Origin input accepts address/stop
- [ ] Destination input accepts address/stop
- [ ] Current location can be used as origin
- [ ] Can swap origin/destination
- [ ] Time picker works (leave now, arrive by, depart at)
- [ ] Can save locations for future use

**Route Options:**
- [ ] Multiple route options display
- [ ] Sorted by recommended/fastest
- [ ] Each option shows:
  - [ ] Start and end times
  - [ ] Total duration
  - [ ] Number of transfers
  - [ ] Walking time
  - [ ] Transit time
  - [ ] Reliability score
- [ ] Recommended route is highlighted
- [ ] Can tap to see route details

**Route Details:**
- [ ] Full leg-by-leg breakdown
- [ ] Each leg shows:
  - [ ] Mode (walk/bus/light rail)
  - [ ] Route number (if transit)
  - [ ] Departure/arrival times
  - [ ] Duration
  - [ ] Stop names
- [ ] Map shows route path
- [ ] Transfer points are clear
- [ ] Walking directions provided

**Transfer Risk Warnings:**
- [ ] High-risk transfers flagged (< 3 min buffer)
- [ ] Medium-risk transfers noted (3-5 min buffer)
- [ ] Low-risk transfers shown (> 5 min buffer)
- [ ] Risk percentage displays
- [ ] Alternative suggestions provided
- [ ] Warning explains why risky

**Mode Toggle:**
- [ ] "Fastest" mode prioritizes speed
- [ ] "Safest" mode adds buffer time
- [ ] "Balanced" mode finds middle ground
- [ ] Results update when mode changes
- [ ] Setting persists

### Route Detail Screen

**Route Information:**
- [ ] Route number and name display
- [ ] Full route map shows
- [ ] All stops listed in order
- [ ] Can tap stop for arrivals
- [ ] Direction toggle works (northbound/southbound)

**Reliability Data:**
- [ ] Historical on-time performance shows
- [ ] Average delay displays
- [ ] Reliability chart shows time-of-day patterns
- [ ] Rush hour delays highlighted
- [ ] Data source and date shown

**Service Alerts:**
- [ ] Active alerts display prominently
- [ ] Alert severity indicated (info/warning/severe)
- [ ] Full alert text readable
- [ ] Affected stops/detours shown
- [ ] Can tap for more details
- [ ] Multiple alerts display properly

**Real-Time Vehicles:**
- [ ] Vehicle locations show on map (if available)
- [ ] Vehicle updates every 30 seconds
- [ ] Vehicle icon shows direction
- [ ] Can tap vehicle for details

### Saved Commutes

**Creating Commute:**
- [ ] Can create new commute
- [ ] Name commute (e.g., "Work", "Home")
- [ ] Select origin and destination
- [ ] Set usual departure time
- [ ] Select days of week
- [ ] Choose notification preferences
- [ ] Can select preferred routes
- [ ] Can set "safe mode" buffer

**Commute List:**
- [ ] All saved commutes display
- [ ] Shows name, origin, destination
- [ ] Displays usual departure time
- [ ] Shows reliability score
- [ ] Shows average delay
- [ ] Can tap to view details
- [ ] Can edit commute
- [ ] Can delete commute

**Commute Details:**
- [ ] Full route options show
- [ ] Historical performance data
- [ ] Weekly reliability chart
- [ ] Best departure times suggested
- [ ] Can launch trip with one tap

**Commute Analytics:**
- [ ] Total trips tracked
- [ ] On-time percentage
- [ ] Average delay calculated
- [ ] Most reliable route identified
- [ ] Trends over time shown
- [ ] Can export data (premium feature)

### Notifications

**Notification Setup:**
- [ ] Notification permission prompt appears
- [ ] Can enable/disable notifications in settings
- [ ] Can set minutes before departure
- [ ] Can enable delay notifications
- [ ] Can enable service alert notifications

**Delay Notifications:**
- [ ] Receives notification when bus is delayed 5+ min
- [ ] Notification shows route and delay
- [ ] Notification suggests alternatives
- [ ] Tapping notification opens app to route
- [ ] Notification sound/vibration works
- [ ] Can dismiss notification

**"When to Leave" Notifications:**
- [ ] Notification sent 30 min before departure (or user setting)
- [ ] Shows expected delays
- [ ] Adjusts time if route is delayed
- [ ] Suggests leaving earlier/later
- [ ] Shows alternative routes if needed

**Service Alert Notifications:**
- [ ] Notified of alerts affecting saved routes
- [ ] Alert severity indicated
- [ ] Full alert text shown
- [ ] Can tap to see alternatives

**Background Notifications:**
- [ ] Notifications work when app closed
- [ ] Background fetch runs every 15 min
- [ ] Battery usage acceptable
- [ ] Can disable background fetch

### Map View

**Map Display:**
- [ ] Map loads smoothly
- [ ] User location shows
- [ ] Stop markers appear
- [ ] Route lines display
- [ ] Zoom in/out works
- [ ] Pan works smoothly

**Stop Markers:**
- [ ] Different colors for active/inactive stops
- [ ] Cluster when zoomed out
- [ ] Tap to see arrivals
- [ ] Preview sheet shows stop info

**Route Overlay:**
- [ ] Can show/hide routes
- [ ] Route colors match transit agency
- [ ] Direction arrows visible
- [ ] Multiple routes distinguishable

**Performance:**
- [ ] 60 FPS scrolling
- [ ] Smooth marker updates
- [ ] No lag with 50+ stops
- [ ] Loads in < 1 second

### Settings Screen

**Preferences:**
- [ ] Notification settings work
- [ ] Theme toggle (light/dark/auto)
- [ ] Map style selection
- [ ] Default trip mode setting
- [ ] Max walking distance setting
- [ ] Units (imperial/metric)

**Data Management:**
- [ ] Can clear cache
- [ ] Can update GTFS data
- [ ] Can update reliability data
- [ ] Shows last update dates
- [ ] Shows data size

**Account/Profile:**
- [ ] Can view saved stops
- [ ] Can view saved commutes
- [ ] Can export data
- [ ] Can delete all data

**About:**
- [ ] App version displays
- [ ] Privacy policy link works
- [ ] Terms of service link works
- [ ] Data attribution shown
- [ ] Can contact support
- [ ] Can rate app

---

## Data Integration Testing

### OneBusAway API Testing

**Test Stop ID: `1_75403` (3rd Ave & Pike St)**

```javascript
// Test arrival fetch
const arrivals = await obaService.getArrivalsForStop('1_75403');

Verify:
- [ ] Response returns within 2 seconds
- [ ] Array of arrivals returned
- [ ] Each arrival has required fields:
  - [ ] routeId
  - [ ] routeShortName
  - [ ] tripHeadsign
  - [ ] scheduledArrivalTime
  - [ ] predictedArrivalTime (if available)
  - [ ] minutesUntilArrival
  - [ ] delayMinutes
```

**Test Nearby Stops:**
```javascript
// Downtown Seattle
const stops = await obaService.getStopsNearLocation(47.6062, -122.3321, 500);

Verify:
- [ ] Returns stops within radius
- [ ] Each stop has:
  - [ ] id, name, lat, lon
  - [ ] routeIds array
  - [ ] direction
```

**Test Service Alerts:**
```javascript
const alerts = await soundTransitService.getLinkAlerts();

Verify:
- [ ] Returns current alerts
- [ ] Each alert has:
  - [ ] header, description
  - [ ] affectedRoutes
  - [ ] activePeriod
```

**Error Handling:**
- [ ] 404 error (invalid stop): Shows user-friendly error
- [ ] 500 error: Retry with backoff
- [ ] Network timeout: Fallback to schedule
- [ ] Rate limit hit: Queue requests
- [ ] Invalid API key: Shows setup error

### GTFS Data Testing

**Static Data Load:**
```javascript
const gtfs = await metroService.fetchStaticData();

Verify:
- [ ] Routes parsed correctly
- [ ] Stops parsed correctly
- [ ] Stop times available
- [ ] Shapes loaded
- [ ] Data cached locally
```

**Data Quality Checks:**
- [ ] All Route 8 stops present
- [ ] Link light rail stops correct
- [ ] Capitol Hill Station connections valid
- [ ] Ferry terminals included
- [ ] Stop coordinates in Seattle area

### Reliability Data Testing

**Test Route 8 (Known Unreliable):**
```javascript
const reliability = reliabilityService.getRouteReliability('1_100275');

Verify:
- [ ] onTimePerformance < 0.50 (below 50%)
- [ ] averageDelayMinutes > 5
- [ ] reliability === 'low'
- [ ] Data source cited
```

**Test E Line (Known Reliable):**
```javascript
const reliability = reliabilityService.getRouteReliability('1_100479');

Verify:
- [ ] onTimePerformance > 0.80
- [ ] averageDelayMinutes < 3
- [ ] reliability === 'high'
```

**Transfer Risk Calculation:**
```javascript
const risk = reliabilityService.calculateTransferRisk(
  firstLeg,
  secondLeg,
  2 // 2 min walking time
);

Verify:
- [ ] Risk level calculated correctly
- [ ] Factors in route reliability
- [ ] Accounts for walking time
- [ ] Provides recommendation
```

---

## Real-World Testing

### Test Scenario 1: Morning Commute (Route 8)

**Setup:** Capitol Hill to South Lake Union, 8 AM weekday

**Test Steps:**
1. Open app at 7:45 AM
2. Check nearby arrivals for Route 8
3. Note scheduled vs predicted time
4. Board the bus
5. Track actual arrival time at destination
6. Compare with app prediction

**Success Criteria:**
- [ ] App showed delay before boarding
- [ ] Prediction within 3 minutes of actual
- [ ] Reliability badge was accurate
- [ ] Alternative routes were suggested

### Test Scenario 2: Link Transfer (Capitol Hill Station)

**Setup:** Downtown to UW, requiring bus-to-Link transfer

**Test Steps:**
1. Plan trip from 3rd & Pike to UW
2. Note transfer time at Capitol Hill Station
3. Board first bus
4. Check real-time updates during ride
5. Arrive at Capitol Hill Station
6. Check Link arrival time
7. Make/miss connection

**Success Criteria:**
- [ ] Transfer risk was correctly identified
- [ ] Warning given if risky
- [ ] Real-time updates during trip
- [ ] Alternative suggested if connection missed

### Test Scenario 3: Service Disruption

**Setup:** Link maintenance closure weekend

**Test Steps:**
1. Check for service alerts
2. Plan trip affected by closure
3. Note bus shuttle information
4. Follow alternative route
5. Compare to actual service

**Success Criteria:**
- [ ] Alert displayed prominently
- [ ] Alternative routes suggested
- [ ] Bus shuttle included in options
- [ ] Accurate replacement service info

### Test Scenario 4: Notification Test

**Setup:** Saved commute with notifications enabled

**Test Steps:**
1. Save commute for tomorrow morning
2. Close app
3. Wait for notification time
4. Verify notification received
5. Check notification accuracy

**Success Criteria:**
- [ ] Notification received on time
- [ ] Delay information accurate
- [ ] Alternative routes helpful
- [ ] Tapping opens app correctly

---

## Edge Cases & Error Scenarios

### Network Conditions

**Offline Mode:**
- [ ] App opens without network
- [ ] Shows cached arrivals with indicator
- [ ] Shows GTFS schedule times
- [ ] Explains limited functionality
- [ ] Reconnects when network available

**Slow Network (3G):**
- [ ] Loading indicators show
- [ ] Requests timeout appropriately
- [ ] Fallback data displayed
- [ ] User informed of slow connection

**Intermittent Connection:**
- [ ] Requests retry automatically
- [ ] Data updates when connection returns
- [ ] No duplicate notifications
- [ ] State preserved

### Location Scenarios

**No Location Permission:**
- [ ] Manual location entry works
- [ ] Can search for stops
- [ ] Trip planner works
- [ ] Explains need for location

**Location Services Disabled:**
- [ ] Prompts to enable
- [ ] Offers manual entry
- [ ] Still functional without

**GPS Accuracy Issues:**
- [ ] Falls back to approximate location
- [ ] Expands search radius
- [ ] Informs user of accuracy

**Outside Seattle Area:**
- [ ] Shows message: "No transit data for this area"
- [ ] Suggests supported regions
- [ ] Allows manual location entry

### Data Scenarios

**No Arrivals Available:**
- [ ] Shows schedule times instead
- [ ] Explains no real-time data
- [ ] Shows next service time

**All Buses Delayed:**
- [ ] Shows all delays prominently
- [ ] Suggests alternatives
- [ ] Explains systemic issue

**Conflicting Data:**
- [ ] Prioritizes real-time over schedule
- [ ] Shows data timestamp
- [ ] Allows refresh

**Stale Data (> 5 min old):**
- [ ] Shows data age
- [ ] Auto-refreshes when possible
- [ ] Warns user

### Time-Based Scenarios

**Late Night (No Service):**
- [ ] Shows "No service at this time"
- [ ] Shows first/last departure times
- [ ] Suggests night owl routes (if available)

**Service Change Day:**
- [ ] Updates GTFS data
- [ ] Shows service change notice
- [ ] Validates routes still exist

**Holiday Service:**
- [ ] Checks calendar exceptions
- [ ] Shows modified schedule
- [ ] Warns about reduced service

---

## Performance Testing

### Metrics to Measure

**App Launch:**
- Cold start: < 3 seconds ✓
- Warm start: < 1 second ✓

**API Response Times:**
- Arrivals: < 2 seconds ✓
- Stops nearby: < 1 second ✓
- Trip planning: < 3 seconds ✓

**Map Performance:**
- Initial render: < 1 second ✓
- 60 FPS scrolling ✓
- Marker load: < 500ms for 50 stops ✓

**Memory Usage:**
- Idle: < 80MB ✓
- Active use: < 150MB ✓
- Map view: < 200MB ✓

**Battery Usage:**
- Background fetch: < 5% per hour ✓
- Active location: < 10% per hour ✓
- Idle: < 1% per hour ✓

### Load Testing

**Test with 100+ stops:**
- [ ] Map renders without lag
- [ ] List scrolls smoothly
- [ ] Memory doesn't spike

**Test with 50+ arrivals:**
- [ ] All display correctly
- [ ] Sorted properly
- [ ] Updates don't cause flicker

**Test with multiple notifications:**
- [ ] All deliver
- [ ] No duplicate
- [ ] Proper priority

---

## Accessibility Testing

### VoiceOver (iOS) / TalkBack (Android)

**Navigation:**
- [ ] All screens accessible
- [ ] Tab order logical
- [ ] Buttons have labels
- [ ] Images have descriptions

**Content:**
- [ ] Route numbers announced
- [ ] Times are readable
- [ ] Delays are clear
- [ ] Alerts are announced

**Actions:**
- [ ] Can refresh arrivals
- [ ] Can plan trips
- [ ] Can save commutes
- [ ] Can adjust settings

### Visual Accessibility

**Color Contrast:**
- [ ] Text meets 4.5:1 ratio
- [ ] Buttons meet 3:1 ratio
- [ ] Status colors distinguishable
- [ ] Works in sunlight

**Text Sizing:**
- [ ] Supports dynamic type
- [ ] Layout adjusts properly
- [ ] No text cutoff
- [ ] Minimum 16pt body text

**Color Independence:**
- [ ] Reliability uses icons + color
- [ ] Delays shown with text
- [ ] Status has multiple indicators

---

## Security Testing

### API Key Security

- [ ] API keys not in source code
- [ ] Keys stored in environment variables
- [ ] Keys not in crash reports
- [ ] Keys not in logs

### Data Privacy

- [ ] Location not logged
- [ ] No PII collected
- [ ] Saved data encrypted (if sensitive)
- [ ] Can delete all data

### Network Security

- [ ] All API calls use HTTPS
- [ ] Certificate pinning (optional)
- [ ] No data sent to unknown servers

---

## Regression Testing

**Run Before Each Release:**

1. **Core Flow 1:** Nearby stops → View arrivals → Route details
2. **Core Flow 2:** Plan trip → Save commute → Receive notification
3. **Core Flow 3:** Service alert → View alternatives → Plan trip
4. **Core Flow 4:** Map view → Select stop → View arrivals
5. **Core Flow 5:** Settings → Toggle preferences → Verify changes

---

## Pre-Launch Testing Protocol

### One Week Before Launch:

**Device Testing:**
- [ ] iPhone 12 (iOS 17)
- [ ] iPhone 15 Pro (iOS 18)
- [ ] iPhone SE (small screen)
- [ ] Samsung Galaxy S21
- [ ] Google Pixel 7
- [ ] Budget Android device

**Real-World Testing:**
- [ ] 5 complete commute tests
- [ ] 3 transfer scenarios
- [ ] 2 service disruption scenarios
- [ ] Weekend service test
- [ ] Late-night service test

**Data Validation:**
- [ ] All Route 8 stops correct
- [ ] Link stations accurate
- [ ] Ferry schedules current
- [ ] Reliability data updated

**Performance Validation:**
- [ ] All metrics within targets
- [ ] Battery usage acceptable
- [ ] No memory leaks
- [ ] Crash-free rate > 99%

### Final Checklist:

- [ ] No console errors or warnings
- [ ] All features working
- [ ] Legal documents accessible
- [ ] Data attribution present
- [ ] Support email working
- [ ] Privacy policy current
- [ ] Terms of service current

---

## Post-Launch Monitoring

### First 24 Hours:
- Monitor crash rate (target: < 1%)
- Check app store reviews
- Test on fresh installs
- Verify notifications working
- Monitor API usage

### First Week:
- Daily regression testing
- Track user completion rates
- Monitor performance metrics
- Gather user feedback
- Fix critical bugs immediately

### First Month:
- Weekly testing
- User journey analysis
- Feature usage tracking
- Plan improvements

---

## Bug Reporting Template

```markdown
## Bug Report

**Severity:** Critical / High / Medium / Low

**Environment:**
- Device: iPhone 14 Pro / Pixel 7
- OS: iOS 18.0 / Android 14
- App Version: 1.0.0
- Network: WiFi / 4G / 5G

**Steps to Reproduce:**
1. Open app
2. Navigate to...
3. Tap on...
4. Observe...

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Frequency:** Always / Sometimes / Once

**Screenshots/Video:**
[Attach if applicable]

**API Response (if applicable):**
```json
{...}
```

**Console Logs:**
```
[Errors or warnings]
```
```

---

## Testing Best Practices

1. **Test with Real Transit Data** - Use actual stops and routes
2. **Test During Peak Hours** - When delays are most common
3. **Test Real Commutes** - Walk through actual scenarios
4. **Test Edge Cases** - Late night, no service, disruptions
5. **Test on Real Devices** - Simulators miss issues
6. **Test Offline** - Network isn't always available
7. **Test Notifications** - Critical for user value
8. **Test Accessibility** - Should work for everyone
9. **Document Everything** - Record issues systematically
10. **Test Iteratively** - Test each feature as built

---

## Definition of Done

A feature is "done" when:
- [ ] Functionality works as designed
- [ ] Tested on iOS and Android
- [ ] Tested with real transit data
- [ ] Tested offline mode
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] Edge cases handled
- [ ] Error states implemented
- [ ] Notifications tested
- [ ] Code reviewed
- [ ] Documented

---

**Remember:** Seattle Wayfare's reliability depends on thorough testing with real transit scenarios. Don't skip real-world testing - it's where you'll find the most important bugs! 🚌
