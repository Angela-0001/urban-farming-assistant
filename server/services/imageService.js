const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Only init Cloudinary if credentials are present
let cloudinaryUploader = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name') {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  cloudinaryUploader = cloudinary.uploader;
}

async function uploadImage(filePath) {
  if (!cloudinaryUploader) {
    // Cloudinary not configured — clean up temp file and return null
    try { fs.unlinkSync(filePath); } catch (_) {}
    return null;
  }
  const result = await cloudinaryUploader.upload(filePath, { folder: 'urban-farming-plots' });
  try { fs.unlinkSync(filePath); } catch (_) {}
  return result.secure_url;
}

async function analyzeImage(filePath) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const imageData = fs.readFileSync(filePath);
    const base64 = imageData.toString('base64');
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this image and determine:
1. Is this a viable urban farming location? (yes/no/maybe)
2. What type of space is it? (rooftop/terrace/balcony/sidewalk/vacant_land/other)
3. Estimated size category: tiny (<50sqft), small (50-200sqft), medium (200-500sqft), large (>500sqft)
4. Sunlight assessment: full_sun / partial_sun / shade
5. Visible challenges — list as array
6. Farming suitability score: 1-10
Respond ONLY in valid JSON with keys: viable, plot_type, size_category, sunlight, challenges, suitability_score`;

    const result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType } }]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Image analysis error:', err.message);
  }
  return null;
}

module.exports = { uploadImage, analyzeImage };
