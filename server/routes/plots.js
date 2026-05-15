const express = require('express');
const router = express.Router();
const { Plot } = require('../models/Plot');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const paginate = require('../utils/paginate');

// GET /api/plots — list with filters + pagination
router.get('/', async (req, res, next) => {
  try {
    const { city, cropType, method, status, page = 1, limit = 20 } = req.query;

    const filter = { deletedAt: { $exists: false } };
    if (city) filter.city = city.toLowerCase();
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (cropType) filter.cropTypes = cropType;

    const query = Plot.find(filter).sort({ createdAt: -1 });
    const result = await paginate(query, page, limit);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/plots/nearby — geospatial radius search
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 5 } = req.query;

    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const radius = Math.min(parseFloat(radiusKm) || 5, 50);
    const radiusMeters = radius * 1000;

    const plots = await Plot.find({
      deletedAt: { $exists: false },
      'location.coordinates': {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radiusMeters
        }
      }
    }).limit(50);

    res.json({ data: plots, count: plots.length, radiusKm: radius });
  } catch (err) {
    next(err);
  }
});

// GET /api/plots/:id — single plot detail
router.get('/:id', async (req, res, next) => {
  try {
    const plot = await Plot.findOne({ _id: req.params.id, deletedAt: { $exists: false } });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    res.json(plot);
  } catch (err) {
    next(err);
  }
});

// POST /api/plots — create a plot
router.post('/', auth, validate(schemas.plotCreate), async (req, res, next) => {
  try {
    const { name, city, location, spaceType, areaSqFt, cropTypes, method, description } = req.body;

    const plot = await Plot.create({
      title: name,
      city: city.toLowerCase(),
      location: { type: 'Point', coordinates: location.coordinates },
      latitude: location.coordinates[1],
      longitude: location.coordinates[0],
      plot_type: spaceType,
      area_sqft: areaSqFt,
      cropTypes: cropTypes || [],
      method: method || 'container',
      description,
      ownerId: req.user.id,
      user_id: req.user.id,
      source: 'user_submitted',
      status: 'pending_verification'
    });

    res.status(201).json(plot);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/plots/:id — update a plot (owner only)
router.patch('/:id', auth, validate(schemas.plotUpdate), async (req, res, next) => {
  try {
    const plot = await Plot.findOne({ _id: req.params.id, deletedAt: { $exists: false } });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    if (String(plot.ownerId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    const { name, description, cropTypes, status, areaSqFt } = req.body;
    if (name !== undefined) plot.title = name;
    if (description !== undefined) plot.description = description;
    if (cropTypes !== undefined) plot.cropTypes = cropTypes;
    if (status !== undefined) plot.status = status;
    if (areaSqFt !== undefined) plot.area_sqft = areaSqFt;

    await plot.save();
    res.json(plot);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plots/:id — soft delete (owner only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const plot = await Plot.findOne({ _id: req.params.id, deletedAt: { $exists: false } });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    if (String(plot.ownerId) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    plot.deletedAt = new Date();
    await plot.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/plots/:id/harvest-log — add harvest entry
router.post('/:id/harvest-log', auth, validate(schemas.harvestLog), async (req, res, next) => {
  try {
    const plot = await Plot.findOne({ _id: req.params.id, deletedAt: { $exists: false } });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });

    const entry = { cropName: req.body.cropName, quantityKg: req.body.quantityKg, notes: req.body.notes, loggedAt: new Date() };
    plot.harvestLogs = plot.harvestLogs || [];
    plot.harvestLogs.push(entry);
    await plot.save();

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// GET /api/plots/:id/harvest-log — get harvest history
router.get('/:id/harvest-log', async (req, res, next) => {
  try {
    const plot = await Plot.findOne({ _id: req.params.id, deletedAt: { $exists: false } });
    if (!plot) return res.status(404).json({ error: 'Plot not found' });

    const { page = 1, limit = 20 } = req.query;
    const logs = (plot.harvestLogs || []).sort((a, b) => b.loggedAt - a.loggedAt);

    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const start = (p - 1) * l;
    const data = logs.slice(start, start + l);
    const total = logs.length;

    res.json({ data, total, page: p, totalPages: Math.ceil(total / l), hasNext: start + l < total, hasPrev: p > 1 });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
