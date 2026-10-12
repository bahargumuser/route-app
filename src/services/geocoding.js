import { NOMINATIM_BASE_URL } from '../config/constants';

/** Searches an address / place name with OpenStreetMap Nominatim. */
export async function searchPlace(query) {
  const url = `${NOMINATIM_BASE_URL}/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Search service error (${res.status})`);
  const data = await res.json();
  return data.map((d) => ({
    latitude: parseFloat(d.lat),
    longitude: parseFloat(d.lon),
    label: d.display_name,
  }));
}
