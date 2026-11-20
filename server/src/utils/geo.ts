/**
 * Haversine distance formula to calculate distance between two coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters rounded to nearest whole meter
}

/**
 * Validates whether GPS coordinates fall within location's geofence radius.
 */
export function validateGeofence(
  userLat: number,
  userLon: number,
  locLat: number,
  locLon: number,
  radiusMeters: number,
  accuracyMeters?: number
): { isWithinGeofence: boolean; distanceMeters: number; message?: string } {
  const distanceMeters = calculateHaversineDistance(userLat, userLon, locLat, locLon);

  // Consider an acceptable margin if accuracy is reported (max 20m tolerance)
  const effectiveRadius = radiusMeters + Math.min(accuracyMeters ? accuracyMeters * 0.2 : 0, 20);
  const isWithinGeofence = distanceMeters <= effectiveRadius;

  return {
    isWithinGeofence,
    distanceMeters,
    message: isWithinGeofence
      ? `Within geofence (${distanceMeters}m from site, allowed radius ${radiusMeters}m)`
      : `Outside geofence (${distanceMeters}m from site, allowed radius ${radiusMeters}m)`,
  };
}
