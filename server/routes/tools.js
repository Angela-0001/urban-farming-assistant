const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { analyzeImage } = require('../services/imageService');

const upload = multer({ dest: 'uploads/' });

// Lazy-init Groq so it doesn't crash if env not loaded yet
function getGroq() {
  const Groq = require('groq-sdk');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ===== WEATHER =====
router.get('/weather', async (req, res) => {
  const { city } = req.query;
  const cityCoords = {
    delhi: [28.6139, 77.2090], mumbai: [19.0760, 72.8777],
    bangalore: [12.9716, 77.5946], chennai: [13.0827, 80.2707],
    kolkata: [22.5726, 88.3639], hyderabad: [17.3850, 78.4867],
    pune: [18.5204, 73.8567], jaipur: [26.9124, 75.7873],
    ahmedabad: [23.0225, 72.5714], kochi: [9.9312, 76.2673]
  };
  const [lat, lon] = cityCoords[city?.toLowerCase()] || cityCoords.delhi;
  try {
    const r = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&timezone=Asia/Kolkata`);
    res.json({ ...r.data.current_weather, city: city || 'delhi', humidity: r.data.hourly?.relative_humidity_2m?.[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== CROP CALENDAR =====
router.get('/crop-calendar', (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const city = (req.query.city || 'delhi').toLowerCase();

  const calendar = {
    kharif: { months: [6,7,8,9], crops: ['Rice', 'Maize', 'Jowar', 'Bajra', 'Cotton', 'Groundnut', 'Soybean', 'Okra', 'Cucumber', 'Bottle Gourd'] },
    rabi: { months: [10,11,12,1,2,3], crops: ['Wheat', 'Barley', 'Mustard', 'Peas', 'Chickpea', 'Spinach', 'Fenugreek', 'Coriander', 'Carrot', 'Radish', 'Tomato'] },
    zaid: { months: [3,4,5,6], crops: ['Watermelon', 'Muskmelon', 'Cucumber', 'Bitter Gourd', 'Pumpkin', 'Moong', 'Sunflower', 'Chilli'] }
  };

  const urbanFriendly = {
    kharif: ['Okra', 'Cucumber', 'Bottle Gourd', 'Chilli', 'Basil', 'Mint'],
    rabi: ['Spinach', 'Fenugreek', 'Coriander', 'Tomato', 'Peas', 'Carrot', 'Radish'],
    zaid: ['Cucumber', 'Bitter Gourd', 'Chilli', 'Mint', 'Coriander']
  };

  let season = 'rabi';
  if ([6,7,8,9].includes(month)) season = 'kharif';
  else if ([3,4,5].includes(month)) season = 'zaid';

  // South India adjustments
  const southCities = ['chennai', 'bangalore', 'kochi', 'hyderabad'];
  const isSouth = southCities.includes(city);

  res.json({
    month, season, city,
    all_crops: calendar[season].crops,
    urban_friendly: urbanFriendly[season],
    tip: isSouth
      ? `${city} has a tropical climate — you can grow most crops year-round. Focus on heat-tolerant varieties.`
      : `It's ${season} season. Best time to plant ${urbanFriendly[season].slice(0,3).join(', ')} in containers.`
  });
});

// ===== PLANT DISEASE DETECTOR (PlantVillage dataset model) =====
router.post('/disease-detect', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });

  const fs = require('fs');
  const { getDiseaseInfo } = require('../services/diseaseKnowledge');

  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    let topLabel = null;
    let confidence = 0;
    let allPredictions = [];

    // Step 1: Try HF Inference API with a hosted PlantVillage model
    const HF_MODELS = [
      'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification',
      'ozair23/mobilenet_v2_1.0_224-finetuned-plantdisease'
    ];

    for (const modelId of HF_MODELS) {
      try {
        const { HfInference } = require('@huggingface/inference');
        const hf = new HfInference(process.env.HF_API_KEY);
        const predictions = await hf.imageClassification({
          model: modelId,
          data: imageBuffer
        });
        if (predictions?.length > 0) {
          allPredictions = predictions;
          topLabel = predictions[0].label;
          confidence = predictions[0].score;
          console.log(`HF model ${modelId} succeeded: ${topLabel} (${Math.round(confidence*100)}%)`);
          break;
        }
      } catch (hfErr) {
        console.error(`HF model ${modelId} failed:`, hfErr.message);
      }
    }

    // Step 2: Look up in knowledge base
    let diseaseInfo = topLabel ? getDiseaseInfo(topLabel) : null;

    // Step 3: Gemini vision fallback (if HF failed or low confidence)
    if (!diseaseInfo || confidence < 0.4) {
      console.log('Using Gemini vision fallback...');
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const base64 = imageBuffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';

        const prompt = `You are a plant pathologist. Analyze this plant image and identify diseases or health issues.
Respond ONLY in this exact JSON format (no markdown, no extra text):
{"healthy":false,"issues":[{"name":"Disease Name","severity":"mild","description":"What it looks like"}],"treatments":[{"method":"Treatment name","instructions":"How to apply","organic":true}],"prevention":["tip1","tip2"],"overall_assessment":"One sentence summary"}`;

        const result = await model.generateContent([
          prompt,
          { inlineData: { data: base64, mimeType } }
        ]);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const geminiResult = JSON.parse(jsonMatch[0]);
          try { fs.unlinkSync(req.file.path); } catch (_) {}
          return res.json({
            ...geminiResult,
            source: 'gemini_vision',
            model_label: topLabel,
            confidence: topLabel ? Math.round(confidence * 100) : null
          });
        }
      } catch (geminiErr) {
        console.error('Gemini fallback error:', geminiErr.message);
      }
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    // If both failed but we have a label, use knowledge base anyway
    if (!diseaseInfo) {
      return res.json({
        healthy: false,
        source: 'unknown',
        overall_assessment: 'Could not fully analyze the image. Please upload a clear, well-lit photo of the affected leaf.',
        issues: [], treatments: [], prevention: ['Ensure good lighting', 'Focus on the affected leaf area', 'Avoid blurry images']
      });
    }

    const isHealthy = diseaseInfo.severity === 'none';
    res.json({
      healthy: isHealthy,
      source: 'plantvillage_model',
      model_label: topLabel,
      confidence: Math.round(confidence * 100),
      all_predictions: allPredictions.slice(0, 3).map(p => ({
        label: p.label.split('___').pop()?.replace(/_/g, ' ') || p.label,
        confidence: Math.round(p.score * 100)
      })),
      overall_assessment: isHealthy
        ? `Your ${diseaseInfo.plant} plant looks healthy! Keep up the good care.`
        : `Detected: ${diseaseInfo.name} on ${diseaseInfo.plant} (${Math.round(confidence * 100)}% confidence). ${diseaseInfo.description}`,
      issues: isHealthy ? [] : [{ name: diseaseInfo.name, severity: diseaseInfo.severity, description: diseaseInfo.description }],
      treatments: diseaseInfo.treatments,
      prevention: diseaseInfo.prevention
    });

  } catch (e) {
    console.error('Disease detect error:', e.message);
    try { require('fs').unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ error: e.message });
  }
});

// ===== YIELD ESTIMATOR =====
router.post('/yield-estimate', async (req, res) => {
  const { crop, space_sqft, sunlight_hours, method = 'container' } = req.body;
  if (!crop || !space_sqft) return res.status(400).json({ error: 'crop and space_sqft required' });

  const yieldData = {
    tomato: { kg_per_sqft_month: 0.8, price_per_kg: 40, water_l_per_day: 1.5 },
    spinach: { kg_per_sqft_month: 0.5, price_per_kg: 30, water_l_per_day: 0.5 },
    coriander: { kg_per_sqft_month: 0.3, price_per_kg: 80, water_l_per_day: 0.3 },
    mint: { kg_per_sqft_month: 0.4, price_per_kg: 60, water_l_per_day: 0.4 },
    chilli: { kg_per_sqft_month: 0.3, price_per_kg: 100, water_l_per_day: 0.8 },
    okra: { kg_per_sqft_month: 0.6, price_per_kg: 35, water_l_per_day: 1.0 },
    methi: { kg_per_sqft_month: 0.4, price_per_kg: 25, water_l_per_day: 0.4 },
    lettuce: { kg_per_sqft_month: 0.5, price_per_kg: 120, water_l_per_day: 0.5 },
    default: { kg_per_sqft_month: 0.4, price_per_kg: 50, water_l_per_day: 0.7 }
  };

  const data = yieldData[crop.toLowerCase()] || yieldData.default;
  const sunlightFactor = Math.min((sunlight_hours || 6) / 6, 1.3);
  const methodFactor = method === 'hydroponic' ? 1.5 : method === 'aeroponic' ? 1.8 : 1.0;

  const monthly_kg = +(data.kg_per_sqft_month * space_sqft * sunlightFactor * methodFactor).toFixed(2);
  const monthly_savings = +(monthly_kg * data.price_per_kg).toFixed(0);
  const annual_savings = monthly_savings * 12;
  const water_per_day = +(data.water_l_per_day * space_sqft).toFixed(1);

  res.json({ crop, space_sqft, method, monthly_kg, monthly_savings, annual_savings, water_per_day,
    note: `Based on ${sunlight_hours || 6}h sunlight/day and ${method} growing method` });
});

// ===== WATERING SCHEDULER =====
router.post('/watering-schedule', async (req, res) => {
  const { crops, pot_size_liters, city } = req.body;
  if (!crops?.length) return res.status(400).json({ error: 'crops array required' });

  // Get weather for adjustment
  let temp = 28, humidity = 60;
  try {
    const cityCoords = { delhi: [28.6139, 77.2090], mumbai: [19.0760, 72.8777], bangalore: [12.9716, 77.5946] };
    const [lat, lon] = cityCoords[city?.toLowerCase()] || cityCoords.delhi;
    const r = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
    temp = r.data.current_weather.temperature;
    humidity = r.data.hourly?.relative_humidity_2m?.[0] || 60;
  } catch (_) {}

  const baseSchedule = {
    tomato: { frequency: 'daily', amount_ml: 500, tip: 'Water at base, avoid leaves' },
    spinach: { frequency: 'every 2 days', amount_ml: 200, tip: 'Keep soil moist but not waterlogged' },
    coriander: { frequency: 'daily', amount_ml: 150, tip: 'Mist lightly, avoid overwatering' },
    mint: { frequency: 'daily', amount_ml: 200, tip: 'Loves moisture, never let dry out' },
    chilli: { frequency: 'every 2 days', amount_ml: 300, tip: 'Water deeply, allow slight drying between' },
    default: { frequency: 'every 2 days', amount_ml: 250, tip: 'Check soil moisture before watering' }
  };

  const heatFactor = temp > 35 ? 1.4 : temp > 30 ? 1.2 : 1.0;
  const humidityFactor = humidity < 40 ? 1.2 : humidity > 70 ? 0.8 : 1.0;

  const schedule = crops.map(crop => {
    const base = baseSchedule[crop.toLowerCase()] || baseSchedule.default;
    const adjusted_ml = Math.round(base.amount_ml * heatFactor * humidityFactor);
    return { crop, frequency: temp > 35 ? 'daily' : base.frequency, amount_ml: adjusted_ml, tip: base.tip };
  });

  res.json({ schedule, weather: { temp, humidity, city }, note: temp > 35 ? '⚠️ High temperature — increase watering frequency' : null });
});

// ===== SHOPPING LIST =====
router.post('/shopping-list', async (req, res) => {
  const { crops, space_sqft, method = 'container' } = req.body;
  if (!crops?.length) return res.status(400).json({ error: 'crops array required' });

  const seedPrices = { tomato: 50, spinach: 30, coriander: 20, mint: 25, chilli: 40, okra: 35, methi: 20, default: 30 };
  const items = [];

  // Seeds
  crops.forEach(crop => {
    items.push({ category: 'Seeds', item: `${crop} seeds`, qty: '1 packet', price_inr: seedPrices[crop.toLowerCase()] || seedPrices.default, where: 'Local nursery / Amazon' });
  });

  // Containers
  const containers = Math.ceil(space_sqft / 2);
  items.push({ category: 'Containers', item: 'Grow bags (12 inch)', qty: `${containers} pcs`, price_inr: containers * 40, where: 'Amazon / Nursery' });

  // Soil
  const soilBags = Math.ceil(space_sqft / 10);
  items.push({ category: 'Soil', item: 'Potting mix', qty: `${soilBags} bags (5kg each)`, price_inr: soilBags * 150, where: 'Local nursery' });
  items.push({ category: 'Soil', item: 'Vermicompost', qty: '2 kg', price_inr: 80, where: 'Nursery / Online' });

  if (method === 'hydroponic') {
    items.push({ category: 'Hydroponics', item: 'Nutrient solution (A+B)', qty: '500ml each', price_inr: 350, where: 'Amazon / Hydro store' });
    items.push({ category: 'Hydroponics', item: 'Net pots', qty: '20 pcs', price_inr: 120, where: 'Amazon' });
    items.push({ category: 'Hydroponics', item: 'pH meter', qty: '1', price_inr: 450, where: 'Amazon' });
  }

  items.push({ category: 'Tools', item: 'Watering can', qty: '1', price_inr: 200, where: 'Hardware store' });
  items.push({ category: 'Tools', item: 'Neem oil spray', qty: '100ml', price_inr: 80, where: 'Nursery / Amazon' });

  const total = items.reduce((sum, i) => sum + i.price_inr, 0);
  res.json({ items, total_inr: total, crops, method });
});

module.exports = router;
