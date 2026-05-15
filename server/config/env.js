const REQUIRED = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GROQ_API_KEY',
  'GEMINI_API_KEY',
  'HUGGINGFACE_API_KEY'
];

const OPTIONAL = ['PORT', 'NODE_ENV', 'WEATHER_API_BASE_URL'];

function validateEnv() {
  const missing = REQUIRED.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('Set these in your .env file and restart the server.');
    process.exit(1);
  }

  OPTIONAL.forEach(key => {
    if (!process.env[key]) {
      console.warn(`⚠️  Optional env var not set: ${key}`);
    }
  });
}

module.exports = { validateEnv };
