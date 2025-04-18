const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { OpenAI } = require('openai');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// OpenAI Initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat Schema
const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

// System Prompt
const URBAN_FARMING_SYSTEM_PROMPT = `
You are an Urban Farming Assistant specializing in Indian agriculture and urban farming techniques. 
Use the following knowledge to provide accurate and helpful information:

1. Urban farming methods include vertical farming, rooftop farming, hydroponic systems, aeroponic systems, 
   aquaponic systems, urban beekeeping, and streetscape farming.

2. In Indian context, key challenges include:
   - Land acquisition for infrastructure development
   - Rural-to-urban migration reducing agricultural workforce
   - Climate change impacts on traditional farming

3. Vertical farming in urban settings can use up to 95% less water than traditional farming methods.

4. Hydrogel technology can improve water retention in urban farming systems, reducing irrigation needs by
   storing water and releasing it gradually.

5. Rooftop farming is widely practiced in Kerala, with over 20,000 rooftop farmers contributing to food security.

6. Agritecture (agriculture + architecture) is the integration of farming into urban structures using facades, 
   balconies, lobbies, and rooftops.

7. Hydroponics uses nutrient-rich water to grow plants without soil, ideal for crops like lettuce, tomatoes, 
   and strawberries.

8. Aeroponics uses nutrient mist and consumes 90% less water than hydroponics while increasing crop yield 
   by up to 75%.

9. Aquaponics combines hydroponics with fish farming in a closed-loop system where fish waste fertilizes plants,
   and plants clean water for fish.

Provide practical, accurate advice tailored to the Indian context, focusing on sustainability and efficiency
in urban environments.
`;

// 🔹 OpenFarm API Route
app.get('/api/plants/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const response = await axios.get(`https://openfarm.cc/api/v1/crops/?filter=${name}`);
    res.json(response.data);
  } catch (error) {
    console.error('OpenFarm API Error:', error);
    res.status(500).json({ error: 'Failed to fetch plant data', details: error.message });
  }
});

// 🔹 Open-Meteo API Route
app.get('/api/weather', async (req, res) => {
  const { lat = '28.6139', lon = '77.2090' } = req.query; // Default to Delhi coordinates
  try {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    res.json(response.data);
  } catch (error) {
    console.error('Open-Meteo API Error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
  }
});

// 🔹 Trefle API Route
app.get('/api/trefle/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const response = await axios.get(`https://trefle.io/api/v1/plants/search?token=${process.env.TREFLE_API_TOKEN}&q=${query}`);
    res.json(response.data);
  } catch (error) {
    console.error('Trefle API Error:', error);
    res.status(500).json({ error: 'Failed to fetch plant info from Trefle', details: error.message });
  }
});

// 💬 Chat Route with OpenAI
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous' } = req.body;
    
    // Log the incoming message for debugging
    console.log(`Received message from ${userId}: ${message}`);
    
    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({
        userId,
        messages: [{ role: 'system', content: URBAN_FARMING_SYSTEM_PROMPT }]
      });
    }
    
    chat.messages.push({ role: 'user', content: message });

    const openaiMessages = chat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('Sending request to OpenAI with messages...');
    
    try {
      // Check if API key is properly set
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key is not configured properly');
      }
      
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: openaiMessages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = chatCompletion.choices[0].message.content;
      console.log('Received response from OpenAI');
      
      chat.messages.push({ role: 'assistant', content: aiResponse });
      await chat.save();

      res.json({ message: aiResponse });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      res.status(500).json({ 
        error: 'OpenAI API Error', 
        details: openaiError.message,
        statusCode: openaiError.status || 'unknown'
      });
    }
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
});

// Static assets (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🌱 Urban Farming Server running on http://localhost:${PORT}`);
  console.log(`OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Trefle API Token configured: ${process.env.TREFLE_API_TOKEN ? 'Yes' : 'No'}`);
});