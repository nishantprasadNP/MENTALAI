# Mental AI

A mental wellness web app: mood-tagged journaling, mood analytics, an AI chat companion (Google Gemini), personalized recommendations (movies, wellness videos, activities) and a set of small calming games.

- **Frontend** — `client/`: React 18, Vite 5, Tailwind CSS 3, React Router 6, axios
- **Backend** — `server/`: Node.js, Express 4, MongoDB (Mongoose 8), JWT auth

---

## Quick start

Prerequisites: Node.js 18+, npm, and a MongoDB instance (local or Atlas).

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # then edit the values (see below)
npm run seed:movies       # optional: sample movies for the local recommender
npm run dev               # API on http://localhost:5001

# 2. Frontend (in a second terminal)
cd client
npm install
npm run dev               # UI on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5001` (see `client/vite.config.js`). If you change the backend `PORT`, update the proxy target too.

## Environment variables (`server/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign auth tokens |
| `PORT` | no | API port (default `5001`; macOS uses 5000 for AirPlay) |
| `CLIENT_ORIGIN` | no | Allowed CORS origin (default `http://localhost:5173`) |
| `GEMINI_API_KEY` | no | Enables AI chat replies and movie summaries. Without it, chat uses rule-based replies |
| `TMDB_API_KEY` | no | Movie metadata and posters from TMDB. Without it, seeded local movies are used |
| `YOUTUBE_API_KEY` | no | Lets `/api/recommendations/resolve` turn a title into a YouTube link (`GOOGLE_API_KEY` also works) |

Never commit `.env`.

## Scripts

| Where | Command | What it does |
|---|---|---|
| `server` | `npm run dev` | Start API with nodemon |
| `server` | `npm start` | Start API with node |
| `server` | `npm run seed:movies` | Insert sample movies |
| `client` | `npm run dev` | Vite dev server |
| `client` | `npm run build` | Production build to `client/dist` |
| `client` | `npm run preview` | Serve the production build locally |

## Project layout

```
client/src/
  App.jsx                 routes + auth guards (protected / guest / onboarding-only)
  context/AuthContext.jsx JWT stored in localStorage, set as axios Authorization header
  pages/                  Landing, Login, Signup, Onboarding, Dashboard, Journal, Chat,
                          Movies, Games, Profile
  pages/games/            BreathingGame, MemoryGame, ZenTyping, GratitudeJar, FocusTap
  components/             Navbar, MovieCarousel, RecommendationSummary, VideoRecommendationsSection, ...

server/
  server.js               Express app, MongoDB connection, route mounting
  routes/                 auth, journal, chat, profile, analytics, recommendations, engagement
  controllers/            request handlers for recommendations, movies, videos, profile, analytics, engagement
  models/                 User, Journal, ChatHistory, GameHistory, Movie, MovieClick,
                          RecommendationHistory, VideoWatch
  services/geminiService.js  Gemini client, system prompt, model fallback
  utils/
    RecommendationService.js        main scoring engine
    movieRecommendationService.js   TMDB + local movie recommendations
    videoRecommendationService.js   wellness videos from wellnessVideos.json
    chatRules.js                    rule-based chat replies and fallbacks
    memoryService.js                builds chat context from journals, mood and history
    moodAnalytics.js                mood trend / distribution
  seed/seedMovies.js
```

## API

Everything is under `/api`. All routes except signup, login and `/recommendations/public` need an `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Register |
| POST | `/auth/login` | Log in, returns a JWT |
| GET | `/auth/me` | Current user |
| GET | `/journal` | List journal entries |
| POST | `/journal` | Create entry (with `mood`) |
| DELETE | `/journal/:id` | Delete entry |
| POST | `/chat` | Send messages to the AI assistant |
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile |
| POST | `/profile/onboarding` | Save onboarding answers |
| GET | `/analytics/mood` | Mood analytics |
| POST | `/engagement/game` | Record a game session |
| POST | `/engagement/chat` | Record chat engagement |
| GET | `/engagement/history` | Engagement history |
| GET | `/recommendations` | Personalized recommendations |
| GET | `/recommendations/public` | Generic catalog (no auth) |
| GET | `/recommendations/history` | Past recommendations |
| GET | `/recommendations/movies` | Movie recommendations `{ summary, movies }` |
| POST | `/recommendations/movies/click` | Track a movie click |
| GET | `/recommendations/videos` | Wellness video recommendations |
| POST | `/recommendations/videos/watched` | Track a watched video |
| GET | `/recommendations/resolve?q=` | Resolve a title to a YouTube URL |

## How it works

**Chat** (`server/routes/chat.js`): each message goes through
1. keyword rules in `chatRules.js`,
2. Gemini (`gemini-flash-lite-latest`, retrying with `gemini-flash-latest`), with context from recent journals, mood analytics and past chats,
3. a generic supportive fallback reply.

Every exchange is saved to `ChatHistory`.

**Recommendations** (`server/utils/RecommendationService.js`): items are scored on mood relevance (latest journal mood and trend), interest/genre match from onboarding, engagement history and recency. Recently shown items get a soft penalty (`RECENT_PENALTY`) instead of being removed, so results never come back empty.

**Moods** are normalized to: `happy`, `sad`, `stressed`, `anxious`, `calm`, `angry`, `neutral`.

## Production notes

- Build the client (`npm run build`) and host `client/dist` on any static host or CDN; run the server as an API only.
- Set `CLIENT_ORIGIN` to your real frontend URL.
- External calls (Gemini, TMDB, YouTube) use in-memory caching only; add rate limiting and a shared cache (e.g. Redis) before scaling to several instances.

## Disclaimer

Mental AI is a self-care tool, not a medical service. It does not diagnose or replace a licensed professional.
