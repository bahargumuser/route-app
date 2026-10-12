// A point is { latitude, longitude }; a route is an array of points.
const R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Distance (m) from point p to the polyline, plus the index of the closest segment start.
 * Uses a local equirectangular projection, accurate enough at city scale.
 */
export function distanceToRoute(p, route) {
  if (route.length === 0) return { distanceM: Infinity, index: 0 };
  if (route.length === 1) return { distanceM: haversine(p, route[0]), index: 0 };

  const cosLat = Math.cos(toRad(p.latitude));
  const project = (q) => ({
    x: toRad(q.longitude - p.longitude) * cosLat * R,
    y: toRad(q.latitude - p.latitude) * R,
  });

  let best = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = project(route[i]);
    const b = project(route[i + 1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : -(a.x * dx + a.y * dy) / len2; // p is the origin
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(a.x + t * dx, a.y + t * dy);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  return { distanceM: best, index: bestIdx };
}

/** Remaining distance (m) along the route from the user's projected position to its end. */
export function remainingDistance(p, route) {
  if (route.length < 2) return route.length ? haversine(p, route[0]) : 0;
  const { index } = distanceToRoute(p, route);
  let total = haversine(p, route[index + 1]);
  for (let i = index + 1; i < route.length - 1; i++) total += haversine(route[i], route[i + 1]);
  return total;
}

export function formatDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

export function formatDuration(s) {
  const mins = Math.max(1, Math.round(s / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}
