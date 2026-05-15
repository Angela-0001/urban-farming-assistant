const mongoose = require('mongoose');

const vacantZoneSchema = new mongoose.Schema({
  source:       { type: String, enum: ['osm', 'user_reported'], required: true },
  name:         { type: String },
  city:         { type: String, required: true },
  landUseType:  { type: String, enum: ['vacant', 'brownfield', 'greenfield', 'allotments', 'wasteland', 'garden'], required: true },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }   // [lng, lat]
  },
  polygon:      { type: mongoose.Schema.Types.Mixed },  // GeoJSON Polygon, optional
  areaSqm:      { type: Number },
  osmId:        { type: String, unique: true, sparse: true },
  reportedBy:   { type: String },
  verifiedBy:   { type: String, enum: ['community', 'admin'], default: 'community' },
  description:  { type: String, maxlength: 500 },
  photoUrl:     { type: String },
  lastFetchedAt:{ type: Date },
  createdAt:    { type: Date, default: Date.now }
});

// Indexes
vacantZoneSchema.index({ location: '2dsphere' });
vacantZoneSchema.index({ city: 1 });
vacantZoneSchema.index({ source: 1 });
// osmId unique sparse index defined via schema field options above

module.exports = mongoose.model('VacantZone', vacantZoneSchema);
