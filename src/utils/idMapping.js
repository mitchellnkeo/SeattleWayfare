/**
 * ID Mapping Utilities
 * Converts between GTFS format and OneBusAway format
 * 
 * GTFS format: "100275" (numeric route ID)
 * OneBusAway format: "1_100275" (agency prefix + route ID)
 */

/**
 * Convert GTFS route ID to OneBusAway format
 * @param {string} gtfsRouteId - GTFS route ID (e.g., "100275")
 * @param {string} agencyId - Agency ID (default: "1" for King County Metro)
 * @returns {string} OneBusAway format ID (e.g., "1_100275")
 */
export function gtfsToObaRouteId(gtfsRouteId, agencyId = '1') {
  if (!gtfsRouteId) return null;
  // If already in OBA format, return as-is
  if (gtfsRouteId.includes('_')) return gtfsRouteId;
  return `${agencyId}_${gtfsRouteId}`;
}

/**
 * Convert OneBusAway route ID to GTFS format
 * @param {string} obaRouteId - OneBusAway route ID (e.g., "1_100275")
 * @returns {string} GTFS format ID (e.g., "100275")
 */
export function obaToGtfsRouteId(obaRouteId) {
  if (!obaRouteId) return null;
  // If already in GTFS format, return as-is
  if (!obaRouteId.includes('_')) return obaRouteId;
  return obaRouteId.split('_').slice(1).join('_');
}

/**
 * Convert GTFS stop ID to OneBusAway format
 * @param {string} gtfsStopId - GTFS stop ID (may already have prefix)
 * @param {string} agencyId - Agency ID (default: "1")
 * @returns {string} OneBusAway format ID
 */
export function gtfsToObaStopId(gtfsStopId, agencyId = '1') {
  if (!gtfsStopId) return null;
  // If already in OBA format, return as-is
  if (gtfsStopId.includes('_')) return gtfsStopId;
  return `${agencyId}_${gtfsStopId}`;
}

/**
 * Convert OneBusAway stop ID to GTFS format
 * @param {string} obaStopId - OneBusAway stop ID (e.g., "1_75403")
 * @returns {string} GTFS format ID
 */
export function obaToGtfsStopId(obaStopId) {
  if (!obaStopId) return null;
  // If already in GTFS format, return as-is
  if (!obaStopId.includes('_')) return obaStopId;
  return obaStopId.split('_').slice(1).join('_');
}

/**
 * Find GTFS route by OneBusAway route ID
 * @param {Object} metroService - MetroGTFSService instance
 * @param {string} obaRouteId - OneBusAway route ID
 * @returns {Object|null} Route object or null
 */
export function findRouteByObaId(metroService, obaRouteId) {
  const gtfsRouteId = obaToGtfsRouteId(obaRouteId);
  return metroService.getRouteById(gtfsRouteId);
}

/**
 * Find GTFS stop by OneBusAway stop ID
 * @param {Object} metroService - MetroGTFSService instance
 * @param {string} obaStopId - OneBusAway stop ID
 * @returns {Object|null} Stop object or null
 */
export function findStopByObaId(metroService, obaStopId) {
  const gtfsStopId = obaToGtfsStopId(obaStopId);
  return metroService.getStopById(gtfsStopId);
}

