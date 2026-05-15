const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Comment, SuccessStory, HarvestLog } = require('../models/Community');
const { uploadImage } = require('../services/imageService');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const paginate = require('../utils/paginate');

const upload = multer({ dest: 'uploads/' });

// ===== COMMENTS =====
router.get('/plots/:plotId/comments', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = Comment.find({ plot_id: req.params.plotId }).sort({ createdAt: -1 });
    const result = await paginate(query, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/plots/:plotId/comments', auth, validate(schemas.commentCreate), async (req, res, next) => {
  try {
    const comment = await Comment.create({
      plot_id: req.params.plotId,
      user_id: req.user.id,
      name: req.body.name,
      message: req.body.message
    });
    res.status(201).json(comment);
  } catch (err) { next(err); }
});

// ===== SUCCESS STORIES =====
router.get('/stories', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = SuccessStory.find().sort({ likes: -1, createdAt: -1 });
    const result = await paginate(query, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/stories', auth, validate(schemas.storyCreate), upload.fields([{ name: 'before', maxCount: 1 }, { name: 'after', maxCount: 1 }]), async (req, res, next) => {
  try {
    const data = {
      title: req.body.title,
      story: req.body.story,
      city: req.body.city,
      crop: req.body.crop,
      user_id: req.user.id
    };
    if (req.files?.before) data.before_image = await uploadImage(req.files.before[0].path);
    if (req.files?.after) data.after_image = await uploadImage(req.files.after[0].path);
    const story = await SuccessStory.create(data);
    res.status(201).json(story);
  } catch (err) { next(err); }
});

router.post('/stories/:id/like', async (req, res, next) => {
  try {
    const story = await SuccessStory.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    if (!story) return res.status(404).json({ error: 'Story not found' });
    res.json({ likes: story.likes });
  } catch (err) { next(err); }
});

// ===== HARVEST LOGS =====
router.get('/harvest/:userId', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = HarvestLog.find({ user_id: req.params.userId }).sort({ date: -1 });
    const result = await paginate(query, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/harvest', auth, validate(schemas.harvestLogCreate), async (req, res, next) => {
  try {
    const log = await HarvestLog.create({
      crop: req.body.crop,
      quantity_kg: req.body.quantity_kg,
      notes: req.body.notes,
      user_id: req.user.id
    });
    res.status(201).json(log);
  } catch (err) { next(err); }
});

router.delete('/harvest/:id', auth, async (req, res, next) => {
  try {
    const log = await HarvestLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    if (String(log.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await log.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
