const Joi = require('joi');

// Factory: returns Express middleware that validates req.body against schema
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
}

// ===== SCHEMAS =====

const plotCreate = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  city: Joi.string().trim().min(2).max(50).required(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  spaceType: Joi.string()
    .valid('rooftop', 'terrace', 'balcony', 'sidewalk', 'vacant_land', 'community_garden', 'parking_lot', 'wall', 'other')
    .required(),
  areaSqFt: Joi.number().positive().required(),
  cropTypes: Joi.array().items(Joi.string()).optional(),
  method: Joi.string().valid('container', 'hydroponic', 'aeroponic').optional(),
  description: Joi.string().max(1000).optional()
});

const plotUpdate = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  cropTypes: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  areaSqFt: Joi.number().positive().optional()
}).min(1);

const harvestLog = Joi.object({
  cropName: Joi.string().trim().min(1).max(100).required(),
  quantityKg: Joi.number().positive().required(),
  notes: Joi.string().max(500).optional()
});

const authRegister = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  displayName: Joi.string().trim().min(2).max(50).required()
});

const authLogin = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const chatMessage = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required(),
  sessionId: Joi.string().optional()
});

const SUPPORTED_CITIES = ['mumbai','delhi','bangalore','chennai','hyderabad','pune','kolkata','ahmedabad','jaipur','surat'];

const vacantZoneReport = Joi.object({
  city: Joi.string().valid(...SUPPORTED_CITIES).required(),
  landUseType: Joi.string().valid('vacant','brownfield','greenfield','allotments','wasteland','garden').required(),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
  areaSqm: Joi.number().min(1).max(100000).optional(),
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  photoUrl: Joi.string().uri().optional()
});

module.exports = {
  validate,
  schemas: { plotCreate, plotUpdate, harvestLog, authRegister, authLogin, chatMessage, vacantZoneReport }
};
