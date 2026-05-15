const axios = require('axios');
const VacantZone = require('../models/VacantZone');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// [south, west, north, east]
const CITY_BBOX = {
  mumbai:    [18.87, 72.77, 19.27, 72.99],
  delhi:     [28.40, 76.84, 28.88, 77.35],
  bangalore: [12.83, 77.46, 13.14, 77.78],
  chennai:   [12.90, 80.17, 13.23, 80.33],
  hyderabad: [17.24, 78.27, 17.56, 78.63],
  pune:      [18.42, 73.72, 18.63, 73.97],
  kolkata:   [22.45, 88.24, 22.65, 88.47],
  ahmedabad: [22.95, 72.47, 23.13, 72.68],
  jaipur:    [26.79, 75.70, 26.97, 75.90],
  surat:     [21.10, 72.76, 21.28, 72.93]
};

const LANDUSE_MAP = {
  vacant:     'vacant',
  brownfield: 'brownfield',
  greenfield: 'greenfield',
  allotments: 'allotments',
  wasteland:  'wasteland',
  garden:     'garden'
};

// Compute centroid from an array of [lon, lat] node coords
function computeCentroid(nodes) {
  if (!nodes || nodes.length === 0) return [0, 0];
  const lngSum = nodes.reduce((s, n) => s + n[0], 0);
  const latSum = nodes.reduce((s, n) => s + n[1], 0);
  return [lngSum / nodes.length, latSum / nodes.length];
}

async function fetchVacantZonesForCity(city) {
  const cityKey = city.toLowerCase();
  const bbox = CITY_BBOX[cityKey];
  if (!bbox) {
    console.warn(`[OSM] No bounding box for city: ${city}`);
    return { skipped: true, reason: 'unknown_city' };
  }

  // Cache check — skip if fetched within last 7 days
  const recent = await VacantZone.findOne({
    city: cityKey,
    source: 'osm',
    lastFetchedAt: { $gte: new Date(Date.now() - SEVEN_DAYS_MS) }
  });
  if (recent) {
    const count = await VacantZone.countDocuments({ city: cityKey, source: 'osm' });
    console.log(`[OSM] Cache hit for ${city} — skipping fetch (${count} zones cached)`);
    return { skipped: true, reason: 'cache_valid', count };
  }

  const [S, W, N, E] = bbox;
  const query = `[out:json][timeout:30];
(
  way["landuse"="vacant"](${S},${W},${N},${E});
  way["landuse"="brownfield"](${S},${W},${N},${E});
  way["landuse"="greenfield"](${S},${W},${N},${E});
  way["landuse"="allotments"](${S},${W},${N},${E});
  way["landuse"="wasteland"](${S},${W},${N},${E});
  way["leisure"="garden"]["access"="public"](${S},${W},${N},${E});
);
out body;
>;
out skel qt;`;

  let osmData;
  try {
    const response = await axios.post(
      OVERPASS_URL,
      `data=${encodeURIComponent(query)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 35000
      }
    );
    osmData = response.data;
  } catch (err) {
    console.error(`[OSM] Overpass fetch failed for ${city}:`, err.message);
    return { skipped: false, error: err.message, upserted: 0 };
  }

  if (!osmData || !osmData.elements) {
    console.warn(`[OSM] Empty response for ${city}`);
    return { skipped: false, upserted: 0 };
  }

  // Build node lookup map: nodeId -> [lon, lat]
  const nodeMap = {};
  for (const el of osmData.elements) {
    if (el.type === 'node') {
      nodeMap[el.id] = [el.lon, el.lat];
    }
  }

  const ways = osmData.elements.filter(el => el.type === 'way' && el.nodes);
  let upserted = 0;
  const now = new Date();

  for (const way of ways) {
    const tags = way.tags || {};
    const landuse = tags.landuse || (tags.leisure === 'garden' ? 'garden' : null);
    const landUseType = LANDUSE_MAP[landuse];
    if (!landUseType) continue;

    const nodeCoords = way.nodes.map(nid => nodeMap[nid]).filter(Boolean);
    if (nodeCoords.length < 3) continue;

    const centroid = computeCentroid(nodeCoords);

    // Build polygon — close the ring if needed
    const ring = [...nodeCoords];
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
      ring.push(ring[0]);
    }
    const polygon = { type: 'Polygon', coordinates: [ring] };

    try {
      await VacantZone.findOneAndUpdate(
        { osmId: String(way.id) },
        {
          $set: {
            osmId: String(way.id),
            source: 'osm',
            city: cityKey,
            landUseType,
            name: tags.name || tags['name:en'] || null,
            location: { type: 'Point', coordinates: centroid },
            polygon,
            lastFetchedAt: now
          }
        },
        { upsert: true, new: true }
      );
      upserted++;
    } catch (e) {
      // Skip duplicate key or other per-record errors
      if (e.code !== 11000) console.error(`[OSM] Upsert error for way ${way.id}:`, e.message);
    }
  }

  console.log(`[OSM] ${city}: upserted ${upserted} zones from ${ways.length} ways`);
  return { skipped: false, upserted, total: ways.length };
}

module.exports = { fetchVacantZonesForCity, CITY_BBOX };
