const mongoose = require('mongoose');

const plotImageSchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  uploaded_by: String,
  ml_tags: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now }
});

const plotSchema = new mongoose.Schema({
  user_id: { type: String, default: 'anonymous' },
  title: { type: String, required: true },
  description: String,
  plot_type: {
    type: String,
    enum: ['rooftop', 'terrace', 'balcony', 'sidewalk', 'vacant_land', 'community_garden', 'parking_lot', 'wall', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'pending_verification', 'government_listed'],
    default: 'pending_verification'
  },
  source: {
    type: String,
    enum: ['user_submitted', 'government_api', 'ml_detected'],
    default: 'user_submitted'
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: String,
  city: String,
  pincode: String,
  area_sqft: Number,
  sunlight_hours: { type: Number, min: 1, max: 12 },
  water_access: { type: Boolean, default: false },
  images: [plotImageSchema],
  upvotes: { type: Number, default: 0 },
  suitability_score: { type: Number, min: 1, max: 10 },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

// Index for geospatial queries using Haversine
plotSchema.index({ latitude: 1, longitude: 1 });
plotSchema.index({ city: 1, status: 1 });

const plotRequestSchema = new mongoose.Schema({
  user_id: String,
  latitude: Number,
  longitude: Number,
  radius_km: { type: Number, default: 2 },
  plot_type_preference: String,
  created_at: { type: Date, default: Date.now }
});

const govtSyncLogSchema = new mongoose.Schema({
  city: String,
  synced_at: { type: Date, default: Date.now },
  inserted: { type: Number, default: 0 },
  updated: { type: Number, default: 0 },
  errors: String
});

const Plot = mongoose.model('Plot', plotSchema);
const PlotRequest = mongoose.model('PlotRequest', plotRequestSchema);
const GovtSyncLog = mongoose.model('GovtSyncLog', govtSyncLogSchema);

module.exports = { Plot, PlotRequest, GovtSyncLog };
