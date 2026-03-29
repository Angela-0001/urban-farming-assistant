const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  plot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot', required: true },
  user_id: { type: String, default: 'anonymous' },
  name: { type: String, default: 'Anonymous' },
  message: { type: String, required: true },
  contact: String
}, { timestamps: true });

const successStorySchema = new mongoose.Schema({
  user_id: { type: String, default: 'anonymous' },
  name: { type: String, default: 'Anonymous' },
  title: { type: String, required: true },
  story: { type: String, required: true },
  before_image: String,
  after_image: String,
  city: String,
  crop: String,
  harvest_kg: Number,
  likes: { type: Number, default: 0 }
}, { timestamps: true });

const harvestLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  crop: { type: String, required: true },
  quantity_kg: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: String,
  space_sqft: Number
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
const SuccessStory = mongoose.model('SuccessStory', successStorySchema);
const HarvestLog = mongoose.model('HarvestLog', harvestLogSchema);

module.exports = { Comment, SuccessStory, HarvestLog };
