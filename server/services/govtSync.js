const axios = require('axios');
const { Plot, GovtSyncLog } = require('../models/Plot');

// City config — add new cities here without touching code
const CITY_CONFIG = {
  mumbai: {
    api_url: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
    dataset_id: '9ef84268-d588-465a-a308-a864a43d0070',
    lat_field: 'latitude',
    lng_field: 'longitude',
    area_field: 'area',
    name_field: 'property_name',
    address_field: 'address'
  },
  delhi: {
    api_url: 'https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6',
    dataset_id: '6176ee09-3d56-4a3b-8115-21841576b2f6',
    lat_field: 'lat',
    lng_field: 'long',
    area_field: 'plot_area',
    name_field: 'plot_name',
    address_field: 'location'
  }
};

// Haversine distance in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function syncCity(cityKey) {
  const config = CITY_CONFIG[cityKey];
  if (!config) return { inserted: 0, updated: 0, error: 'Unknown city' };

  const apiKey = process.env.GOVT_DATA_API_KEY;
  if (!apiKey) return { inserted: 0, updated: 0, error: 'No GOVT_DATA_API_KEY set' };

  let inserted = 0, updated = 0;

  try {
    const response = await axios.get(config.api_url, {
      params: { 'api-key': apiKey, format: 'json', limit: 100 },
      timeout: 15000
    });

    const records = response.data?.records || [];

    for (const record of records) {
      const lat = parseFloat(record[config.lat_field]);
      const lng = parseFloat(record[config.lng_field]);
      if (isNaN(lat) || isNaN(lng)) continue;

      // Check for duplicates within 50m
      const nearby = await Plot.findOne({
        latitude: { $gte: lat - 0.0005, $lte: lat + 0.0005 },
        longitude: { $gte: lng - 0.0005, $lte: lng + 0.0005 },
        source: 'government_api'
      });

      if (nearby) {
        await Plot.updateOne({ _id: nearby._id }, {
          area_sqft: record[config.area_field] || nearby.area_sqft,
          updatedAt: new Date()
        });
        updated++;
      } else {
        await Plot.create({
          title: record[config.name_field] || `Government Plot - ${cityKey}`,
          description: `Official vacant land listed by municipal corporation`,
          plot_type: 'vacant_land',
          status: 'government_listed',
          source: 'government_api',
          latitude: lat,
          longitude: lng,
          address: record[config.address_field] || '',
          city: cityKey,
          area_sqft: record[config.area_field] || null,
          user_id: 'government'
        });
        inserted++;
      }
    }
  } catch (err) {
    return { inserted, updated, error: err.message };
  }

  return { inserted, updated };
}

async function runGovtSync() {
  console.log('🏛️ Running government data sync...');
  for (const city of Object.keys(CITY_CONFIG)) {
    const result = await syncCity(city);
    await GovtSyncLog.create({
      city,
      inserted: result.inserted || 0,
      updated: result.updated || 0,
      errors: result.error || null
    });
    console.log(`  ${city}: +${result.inserted} inserted, ${result.updated} updated${result.error ? ' | Error: ' + result.error : ''}`);
  }
}

module.exports = { runGovtSync, haversineDistance };
