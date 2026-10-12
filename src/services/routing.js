import { OSRM_BASE_URL } from '../config/constants';

/** Calculates a route with the OSRM HTTP API. Returns { coordinates, distanceM, durationS }. */
export async function fetchRoute(from, to, profile = 'driving') {
  const url =
    `${OSRM_BASE_URL}/route/v1/${profile}/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing service error (${res.status})`);
  const json = await res.json();
  if (json.code !== 'Ok' || !json.routes?.length) {
    throw new Error('No route could be found between these points.');
  }
  const r = json.routes[0];
  return {
    coordinates: r.geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
    distanceM: r.distance,
    durationS: r.duration,
  };
}
