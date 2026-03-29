const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const cron = require('node-cron');
const Groq = require('groq-sdk');

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/plots', require('./routes/plots'));
app.use('/api/community', require('./routes/community'));
app.use('/api/tools', require('./routes/tools'));

// Cron: sync government data every 24 hours at 2am
const { runGovtSync } = require('./services/govtSync');
cron.schedule('0 2 * * *', () => runGovtSync());

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbanfarming')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

// Chat Schema
const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  context: {
    location: String, space: String, crops: [String],
    lastQuestion: String, intent: String
  }
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

// Extract context from user message
function analyzeUserInput(userMessage, currentContext = {}) {
  const u = userMessage.toLowerCase();
  const ctx = { ...currentContext };

  if (u.includes('balcony') || u.includes('terrace')) ctx.space = 'balcony';
  else if (u.includes('rooftop') || u.includes('roof')) ctx.space = 'rooftop';
  else if (u.includes('window') || u.includes('sill')) ctx.space = 'window';
  else if (u.includes('indoor') || u.includes('inside')) ctx.space = 'indoor';
  else if (u.includes('yard') || u.includes('garden')) ctx.space = 'yard';

  const crops = ['tomato','chili','pepper','okra','brinjal','eggplant','beans','peas',
    'carrot','radish','spinach','lettuce','methi','fenugreek','coriander','mint','basil','tulsi','cucumber','gourd'];
  const found = crops.filter(c => u.includes(c));
  if (found.length > 0) ctx.crops = found;

  const cities = ['delhi','mumbai','bangalore','chennai','kolkata','hyderabad','pune','jaipur','lucknow','ahmedabad','surat','kochi','bhopal'];
  const city = cities.find(c => u.includes(c));
  if (city) ctx.location = city;

  if (['found a vacant','report empty','add rooftop','empty terrace','report plot','vacant plot'].some(p => u.includes(p)))
    ctx.intent = 'report_plot';
  else if (['find me a plot','vacant space near','where can i farm','find plot','nearby plot'].some(p => u.includes(p)))
    ctx.intent = 'find_plot';

  return ctx;
}

const SYSTEM_PROMPT = `You are an expert urban farming assistant with deep knowledge of:
- Container gardening, rooftop farms, balcony gardens, vertical farming, hydroponics, aeroponics, and aquaponics
- Crop selection, soil mixes, composting, organic pest control, and fertilization
- Water conservation techniques like drip irrigation and self-watering containers
- Indian urban farming context: regional climates, local crops (methi, coriander, okra, brinjal, tulsi, etc.), Indian cities, seasons (Kharif/Rabi/Zaid), and local resources
- Beginner to advanced techniques, cost-effective DIY setups, and commercial-scale systems

Guidelines:
- Answer ANY question the user asks, even if not directly about urban farming
- Be conversational, friendly, and encouraging
- Give specific, actionable advice
- Tailor advice to user's location, space, and crops when known
- Use markdown formatting for readability`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous', langInstruction = '' } = req.body;

    let conversationHistory = [];
    let context = {};
    try {
      const chat = await Chat.findOne({ userId });
      if (chat) {
        context = chat.context || {};
        conversationHistory = chat.messages
          .filter(m => m.role !== 'system')
          .slice(-10)
          .map(m => ({ role: m.role, content: m.content }));
      }
    } catch (_) {}

    context = analyzeUserInput(message, context);

    let dynamicPrompt = SYSTEM_PROMPT;
    const ctxParts = [];
    if (context.location) ctxParts.push(`location: ${context.location}`);
    if (context.space) ctxParts.push(`farming space: ${context.space}`);
    if (context.crops?.length) ctxParts.push(`crops: ${context.crops.join(', ')}`);

    // Live weather injection
    if (context.location) {
      try {
        const coords = { delhi:[28.6139,77.2090], mumbai:[19.0760,72.8777], bangalore:[12.9716,77.5946],
          chennai:[13.0827,80.2707], kolkata:[22.5726,88.3639], hyderabad:[17.3850,78.4867],
          pune:[18.5204,73.8567], kochi:[9.9312,76.2673] }[context.location];
        if (coords) {
          const w = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current_weather=true`);
          const cw = w.data.current_weather;
          ctxParts.push(`current weather: ${cw.temperature}°C, wind ${cw.windspeed} km/h`);
        }
      } catch (_) {}
    }

    if (ctxParts.length) dynamicPrompt += `\n\nUser context: ${ctxParts.join(', ')}. Personalize your response accordingly.`;
    if (langInstruction) dynamicPrompt += `\n\n${langInstruction}`;
    if (context.intent === 'report_plot') dynamicPrompt += `\n\nUser wants to report a vacant plot. Direct them to the 📍 Report a Plot page.`;
    if (context.intent === 'find_plot') dynamicPrompt += `\n\nUser wants to find a plot. Direct them to the 🗺️ Plot Finder page.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: dynamicPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    const aiResponse = completion.choices[0].message.content;

    try {
      let chatDoc = await Chat.findOne({ userId });
      if (chatDoc) {
        chatDoc.messages.push({ role: 'user', content: message }, { role: 'assistant', content: aiResponse });
        chatDoc.context = context;
      } else {
        chatDoc = new Chat({ userId, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: message }, { role: 'assistant', content: aiResponse }], context });
      }
      await chatDoc.save();
    } catch (_) {}

    res.json({ message: aiResponse });

  } catch (error) {
    console.error('Chat error:', error.message);
    let msg = 'Sorry, something went wrong. Please try again.';
    if (error.status === 429) msg = '⚠️ Too many requests. Please wait a moment.';
    else if (error.status === 401 || error.status === 403) msg = '⚠️ Invalid API key. Check GROQ_API_KEY in .env';
    res.status(500).json({ error: 'Failed', details: msg });
  }
});

app.get('/api/test', (_req, res) => res.json({ status: 'Urban Farming API is operational' }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

app.listen(PORT, () => console.log(`🌱 Server running on http://localhost:${PORT}`));
