// Minimal geocode proxy (Photon first then Nominatim) - optional for frontend centralization.
// Uses native fetch (Node >=18). If on older Node, install node-fetch and import it here.
import createError from 'http-errors';

async function queryPhoton(q) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw createError(r.status, 'Photon failed');
  const data = await r.json();
  const features = data.features || [];
  return features.map(f => {
    const props = f.properties || {};
    const addrParts = [props.name, props.city, props.state, props.country].filter(Boolean);
    return { address: addrParts.join(', '), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
  });
}

async function queryNominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=0&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw createError(r.status, 'Nominatim failed');
  const data = await r.json();
  return data.map(item => ({ address: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }));
}

export async function geocode(q) {
  if (!q || !q.trim()) return [];
  try {
    const photon = await queryPhoton(q);
    if (photon.length) return photon;
  } catch {/* ignore */}
  try {
    return await queryNominatim(q);
  } catch {
    return [];
  }
}
