const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Comment, SuccessStory, HarvestLog } = require('../models/Community');
const { uploadImage } = require('../services/imageService');

const upload = multer({ dest: 'uploads/' });

// ===== COMMENTS =====
router.get('/plots/:plotId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ plot_id: req.params.plotId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/plots/:plotId/comments', async (req, res) => {
  try {
    const comment = await Comment.create({ plot_id: req.params.plotId, ...req.body });
    res.status(201).json(comment);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== SUCCESS STORIES =====
router.get('/stories', async (req, res) => {
  try {
    const stories = await SuccessStory.find().sort({ likes: -1, createdAt: -1 }).limit(20);
    res.json(stories);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/stories', upload.fields([{ name: 'before', maxCount: 1 }, { name: 'after', maxCount: 1 }]), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.before) data.before_image = await uploadImage(req.files.before[0].path);
    if (req.files?.after) data.after_image = await uploadImage(req.files.after[0].path);
    const story = await SuccessStory.create(data);
    res.status(201).json(story);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/stories/:id/like', async (req, res) => {
  try {
    const story = await SuccessStory.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
    res.json({ likes: story.likes });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== HARVEST LOGS =====
router.get('/harvest/:userId', async (req, res) => {
  try {
    const logs = await HarvestLog.find({ user_id: req.params.userId }).sort({ date: -1 });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/harvest', async (req, res) => {
  try {
    const log = await HarvestLog.create(req.body);
    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/harvest/:id', async (req, res) => {
  try {
    await HarvestLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
