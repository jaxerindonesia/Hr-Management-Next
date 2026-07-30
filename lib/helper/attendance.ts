export type GeoPoint = {
  lat: number;
  lng: number;
  timestamp: number;
};

export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const p1 = toRad(aLat);
  const p2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function getBranchDistanceMeters(
  branch: { latitude: number; longitude: number },
  location: unknown,
) {
  if (!location || typeof location !== "object") return null;
  const latitude = Number((location as { latitude?: unknown }).latitude);
  const longitude = Number((location as { longitude?: unknown }).longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return haversineKm(
    branch.latitude,
    branch.longitude,
    latitude,
    longitude,
  ) * 1000;
}
