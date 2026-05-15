const express = require('express');
const router = express.Router();
const VacantZone = require('../models/VacantZone');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const paginate = require('../utils/paginate');
const { fetchVacantZonesForCity, CITY_BBOX } = require('../services/osmService');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Helper: check if OSM cache is stale for a city
async function isCacheStale(city) {
  const recent = await VacantZone.findOne({
    city,
    source: 'osm',
    lastFetchedAt: { $gte: new Date(Date.now() - SEVEN_DAYS_MS) }
  });
  return !recent;
}

// GET /api/vacant-zones
router.get('/', async (req, res, next) => {
  try {
    const { city, source, landUseType, page = 1, limit = 20 } = req.query;
    if (!city) return res.status(400).json({ error: 'city is required' });

    const cityKey = city.toLowerCase();

    // Trigger OSM fetch if cache is stale and not filtering to user_reported only
    let cacheInfo = { source: 'cache' };
    if (source !== 'user_reported' && CITY_BBOX[cityKey]) {
      const stale = await isCacheStale(cityKey);
      if (stale) {
        await fetchVacantZonesForCity(cityKey);
        cacheInfo = { source: 'fresh', lastFetched: new Date() };
      } else {
        const latest = await VacantZone.findOne({ city: cityKey, source: 'osm' }).sort({ lastFetchedAt: -1 });
        cacheInfo = { source: 'cache', lastFetched: latest?.lastFetchedAt };
      }
    }

    const filter = { city: cityKey };
    if (source) filter.source = source;
    if (landUseType) filter.landUseType = landUseType;

    const query = VacantZone.find(filter).sort({ createdAt: -1 });
    const result = await paginate(query, page, limit);

    res.json({ ...result, cacheInfo });
  } catch (err) {
    next(err);
  }
});

// GET /api/vacant-zones/nearby
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 3, limit = 10 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const radius = Math.min(parseFloat(radiusKm) || 3, 20) * 1000; // metres
    const lim = Math.min(parseInt(limit) || 10, 50);

    const zones = await VacantZone.find({
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radius
        }
      }
    }).limit(lim);

    res.json({ data: zones, count: zones.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/vacant-zones/:id
router.get('/:id', async (req, res, next) => {
  try {
    const zone = await VacantZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Vacant zone not found' });
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

// POST /api/vacant-zones/report — auth required
router.post('/report', auth, validate(schemas.vacantZoneReport), async (req, res, next) => {
  try {
    const { city, landUseType, location, areaSqm, name, description, photoUrl } = req.body;
    const zone = await VacantZone.create({
      source: 'user_reported',
      city: city.toLowerCase(),
      landUseType,
      location: { type: 'Point', coordinates: location.coordinates },
      areaSqm,
      name,
      description,
      photoUrl,
      reportedBy: req.user.id,
      verifiedBy: 'community'
    });
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/vacant-zones/:id/verify — admin only
router.patch('/:id/verify', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const zone = await VacantZone.findByIdAndUpdate(
      req.params.id,
      { verifiedBy: 'admin' },
      { new: true }
    );
    if (!zone) return res.status(404).json({ error: 'Vacant zone not found' });
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/vacant-zones/:id — reporter or admin
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const zone = await VacantZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Vacant zone not found' });
    if (zone.reportedBy !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await zone.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
