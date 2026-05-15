# Urban Farming Assistant

A Node.js/Express/MongoDB backend for an urban farming assistant app targeting Indian cities. It combines AI-powered chat (Groq LLaMA 3.3 70B), geospatial plot discovery, and agricultural tools (crop calendar, yield estimator, watering scheduler, shopping list) into a single API.

## Prerequisites

- Node.js 18+
- MongoDB 6+
- API keys: `GROQ_API_KEY`, `GEMINI_API_KEY`
- A `JWT_SECRET` (any long random string)

## Setup

```bash
git clone https://github.com/Angela-0001/urban-farming-assistant.git
cd urban-farming-assistant/server
npm install
cp ../.env.example .env   # fill in your values
npm run dev
```

The server starts at `http://localhost:5000`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register a new user |
| POST | /api/auth/login | No | Login, receive JWT |
| GET | /api/plots | No | List plots (filters: city, cropType, method, status, page, limit) |
| GET | /api/plots/nearby | No | Plots within radius (lat, lng, radiusKm) |
| GET | /api/plots/:id | No | Single plot detail |
| POST | /api/plots | Yes | Create a plot |
| PATCH | /api/plots/:id | Yes (owner) | Update a plot |
| DELETE | /api/plots/:id | Yes (owner) | Soft-delete a plot |
| POST | /api/plots/:id/harvest-log | Yes | Add harvest entry |
| GET | /api/plots/:id/harvest-log | No | Get harvest history |
| GET | /api/community/plots/:plotId/comments | No | Get comments (paginated) |
| POST | /api/community/plots/:plotId/comments | Yes | Post a comment |
| GET | /api/community/stories | No | List success stories (paginated) |
| POST | /api/community/stories | Yes | Submit a success story |
| POST | /api/community/stories/:id/like | No | Like a story |
| GET | /api/community/harvest/:userId | No | Get harvest logs for user |
| POST | /api/community/harvest | Yes | Add a harvest log |
| DELETE | /api/community/harvest/:id | Yes | Delete a harvest log |
| POST | /api/chat | No | AI chat (rate limited: 20/15min) |
| GET | /api/tools/weather | No | Current weather for a city |
| GET | /api/tools/crop-calendar | No | Seasonal crop recommendations |
| POST | /api/tools/disease-detect | No | Plant disease detection (image upload) |
| POST | /api/tools/yield-estimate | No | Yield and savings estimator |
| POST | /api/tools/watering-schedule | No | Watering schedule for crops |
| POST | /api/tools/shopping-list | No | Shopping list with cost breakdown |
| GET | /api/test | No | Health check |

Protected routes require `Authorization: Bearer <token>` header.

## Architecture

- `server.js` — Express app entry point, rate limiting, CORS, chat endpoint
- `config/env.js` — Validates required environment variables on startup
- `routes/` — auth, plots, community, tools route handlers
- `models/` — Mongoose schemas: User, Plot, Community (Comment, SuccessStory, HarvestLog)
- `middleware/` — auth (JWT), validate (Joi), errorHandler (centralized)
- `utils/paginate.js` — Reusable pagination helper
- `services/` — imageService (Cloudinary + Gemini), govtSync (data.gov.in cron), diseaseKnowledge (38-class DB)
