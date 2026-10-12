/** Distance (metres) from the destination at which we consider the user "arrived". */
export const ARRIVAL_THRESHOLD_M = 30;

/** Distance (metres) from the route line after which we automatically re-route. */
export const OFF_ROUTE_THRESHOLD_M = 80;

/** Minimum time between automatic re-routes (ms). */
export const REROUTE_COOLDOWN_MS = 15000;

/** Public OSRM demo server (free, no API key). Replace for production use. */
export const OSRM_BASE_URL = 'https://router.project-osrm.org';

/** Public Nominatim geocoder (free, no API key; please respect their usage policy). */
export const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const DEFAULT_REGION = { latitude: 41.0082, longitude: 28.9784 }; // Istanbul
