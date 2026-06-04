# Mental AI — Detailed Project README

A production-focused mental wellness web application combining journaling, mood analytics, personalized recommendations (movies, wellness videos, activities, games), and an AI chat assistant. This repository contains a React + Vite frontend and an Express + MongoDB backend with JWT authentication and optional integrations for Gemini (Google Generative AI), TMDB (movie metadata), and YouTube resolution.

This README documents: quick start, environment variables, architecture, API reference, data model overview, recommendation engine internals, third-party integrations, development and deployment instructions, troubleshooting, and contribution guidance.

---

## Table of Contents

- Project summary
- Quick start (development)
- Environment variables
- Project layout
- Running & building
- Seeding the database
- API surface (endpoints)
- Data models (overview)
- Recommendation engine (design & signals)
- Gemini / Generative integration
- TMDB and external media resolution
- Frontend structure and UX notes
- Debugging & troubleshooting
- Security and production hardening
- Deployment & Docker notes
- Contributing
- License

---

## Project summary

Mental AI is a full-stack mental wellness platform focused on delivering personalized, mood-aware content and supportive AI conversations. The platform combines these capabilities:

- Journaling (with mood labels)
- Mood analytics (trend, distribution, dominant mood)
- Personalized recommendations (movies, videos, music, activities, games, journal prompts)
- AI chat assistant (Gemini integration with safe fallbacks)
- Lightweight games for engagement and wellbeing
- Recommendation history and event tracking

The system is designed for production-readiness: logging, schema indexes, caching, safe fallbacks when third-party APIs are unavailable, and a clear separation between signal layers used by the recommender.

---

## Quick start (development)

Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas) and a connection URI
- Optional API keys (Gemini, TMDB, YouTube) for enhanced features

Install dependencies for both server and client from the repository root:

```bash
# From repository root (d:\MentalAi)
npm run install
```

Start the backend (development with automatic reload):

```bash
cd mental-ai/server
npm run dev    # uses nodemon
```

Start the frontend:

```bash
cd mental-ai/client
npm run dev    # starts Vite dev server (default: http://localhost:5173)
```

By default the backend listens on port 5000 (see `server.js`) and the frontend expects the API at `http://localhost:5000`. Adjust `CLIENT_ORIGIN` or proxy settings if needed.

---

## Environment variables

Create a `.env` file inside `mental-ai/server` with the following values (example):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mentalai
JWT_SECRET=supersecretjwtkey
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=sk-GEMINI_KEY_IF_AVAILABLE
TMDB_API_KEY=tmdb_your_key_here
YOUTUBE_API_KEY=google_youtube_key_here
```

- `MONGO_URI` (required): MongoDB connection string.
- `JWT_SECRET` (required): Secret for signing JWT tokens.
- `CLIENT_ORIGIN` (optional): Frontend origin for CORS.
- `GEMINI_API_KEY` (optional): Google Generative AI key. If not present, the chat falls back to safe, rule-based responses.
- `TMDB_API_KEY` (optional): TMDB key used to enrich movie results. The recommender uses local fallbacks if TMDB is missing.
- `YOUTUBE_API_KEY` (optional): Used by the `/api/recommendations/resolve` endpoint to translate titles to watch URLs. If missing, the app uses local dataset fallbacks for wellness videos.

Important: never commit `.env` or API keys to source control.

---

## Project layout (high-level)

- `mental-ai/server` — Express backend
  - `server.js` — entry point (connects to MongoDB, mounts routes)
  - `controllers/` — route handlers (movies, videos, recommendations, auth, journal, chat)
  - `routes/` — express route definitions
  - `models/` — Mongoose models (User, Journal, MovieClick, RecommendationHistory, etc.)
  - `utils/` — business logic (movieRecommendationService.js, videoRecommendationService.js, geminiService.js, RecommendationService.js, moodAnalytics.js)
  - `seed/` — seed scripts (seedMovies.js)

- `mental-ai/client` — React + Vite frontend
  - `src/pages` — route pages (Dashboard, Journal, Chat, Movies, Onboarding, Profile)
  - `src/components` — reusable UI components (MovieCarousel, RecommendationSummary, VideoRecommendationsSection)
  - `src/context` — AuthContext for token/user state

---

## Running & building

Development

```bash
# Start server (dev)
cd mental-ai/server
npm run dev

# Start client
cd ../client
npm run dev
```

Production build

```bash
# Build client
cd mental-ai/client
npm run build

# Serve server normally (NODE_ENV=production) — assumes static assets served by a separate server or CDN
cd ../server
npm start
```

Recommended: serve built client assets from a CDN or static host and configure the server only as an API. You can also serve the built `dist` statics from Express if desired.

---

## Seeding the database

The server includes a movie seed script to populate local movie data for development. To run it:

```bash
cd mental-ai/server
npm run seed:movies
```

The seed script inserts sample movies used by the local recommendation fallback and testing.

---

## API surface (main endpoints)

All endpoints are mounted under `/api`.

Auth

- `POST /api/auth/signup` — register new user
- `POST /api/auth/login` — login
- `GET /api/auth/me` — get current user profile (requires `Authorization` header)

Journal

- `GET /api/journal` — fetch user's journal entries
- `POST /api/journal` — create a journal entry (includes `mood` field)

Recommendations

- `GET /api/recommendations` — aggregated personalized recommendations (requires auth)
- `GET /api/recommendations/public` — public fallback catalog
- `GET /api/recommendations/movies` — movies recommendations; returns `{ summary, movies }`
- `POST /api/recommendations/movies/click` — record when a user clicks/opens a movie
- `GET /api/recommendations/videos` — wellness video recommendations
- `POST /api/recommendations/videos/watched` — record watched video event
- `GET /api/recommendations/resolve?q=...` — resolve a title to a YouTube watch URL (requires `YOUTUBE_API_KEY`)

Chat

- `POST /api/chat` — chat with the AI assistant; the system builds contextual prompts including recent journals, mood analytics, and conversation history. Gemini is used when `GEMINI_API_KEY` is configured.

Profile

- `GET /api/profile` — get profile
- `PUT /api/profile` — update profile

Analytics

- `GET /api/analytics/mood` — get mood analytics and trend info

Recommendation history

- `GET /api/recommendations/history` — user's recommendation history

---

## Data model overview (important schemas)

This is a condensed overview — see `server/models` for the full Mongoose schemas.

- `User` — authentication info, personalization preferences (interests, favoriteGenres, onboardingState), profile metadata.
- `Journal` — entries with `text`, `mood` (sanitized to allowed moods), `createdAt`, optionally `tags`.
- `ChatHistory` — stored conversational turns, optionally used to summarize context for Gemini.
- `RecommendationHistory` — records of recommended items (itemType, itemId, userId, createdAt) used to apply soft penalties for recency.
- `MovieClick` — stores click/save/open events for movies (userId, movieId, movieTitle, platform, moodTag, sessionId).
- `VideoWatch` — records wellness video watches and durations.

Allowed moods

Journal moods are expected to be one of this canonical set:

- `happy`, `sad`, `stressed`, `anxious`, `calm`, `angry`, `neutral`

The backend sanitizes journal-provided mood values early (for example in `movieRecommendationService.js`) to avoid displaying unintended category names (e.g., `nature`) as moods.

---

## Recommendation engine — design & signals

The recommender is intentionally layered and signal-driven. Main signals include:

- Latest journal mood and mood trend (from `moodAnalytics`)
- User profile: `interests`, `favoriteGenres`, and personalization settings
- Engagement: Game/Chat history, recent interactions
- Recency: recommendations shown in the last N days are penalized (soft penalty)
- Genre/interest matching

Key algorithmic notes

- Scoring: each candidate item is assigned sub-scores (recencyScore, engagementScore, interestScore, moodRelevance) and combined into a final score.
- Soft penalties: recently recommended items are reduced by a configurable factor (e.g., `RECENT_PENALTY = 0.25`) rather than excluded — this prevents empty result sets while still encouraging freshness.
- Video fallback: the `RecommendationService` will call `videoRecommendationService.recommendVideos()` when the catalog has sparse video results; the video recommender uses a local `wellnessVideos.json` dataset and caches results.
- Top-level summary: to reduce UI repetition, the backend generates a single human-readable `summary` (via Gemini when configured) and the list of movies no longer includes repeated per-item explanations. The frontend renders the single `RecommendationSummary` header component.

Where to find the code

- Signal orchestration: `server/utils/RecommendationService.js`
- Movies: `server/utils/movieRecommendationService.js` (TMDB enrichment + Gemini explanations)
- Videos: `server/utils/videoRecommendationService.js` (local dataset + YouTube resolution)

---

## Gemini / Generative integration

The project integrates a small wrapper around Google Generative AI (Gemini) to produce natural-language explanations and conversation responses.

Key points

- Service file: `server/services/geminiService.js` — centralizes prompt templates, context formatting, temperature, and request logging.
- Context: `memoryService.js` builds a compact context payload that includes recent journal snippets, mood analytics, and a short conversation summary to keep responses grounded and consistent across requests.
- Safety & fallback: When `GEMINI_API_KEY` is not configured, the chat endpoints fall back to rule-based, supportive templates to ensure the app still responds safely.
- Cost & rate limiting: Use the `GEMINI_API_KEY` judiciously and consider adding server-side rate limiting and caching for expensive calls.

Example usage

The chat endpoint sends a `userMessage` and `context` to `geminiService.generateMentalAIResponse(userMessage, context)`, which returns a friendly assistant reply and optional structured output used by the frontend.

---

## TMDB and external media resolution

- `movieRecommendationService.js` uses TMDB to resolve movie metadata (titles, posters, genre names). If `TMDB_API_KEY` is missing or TMDB calls fail, the service falls back to local seeded movies and lightweight heuristics.
- The `GET /api/recommendations/resolve?q=...` endpoint attempts to resolve wellness video titles to YouTube watch URLs using the YouTube Data API when `YOUTUBE_API_KEY` is configured. If not available, the app falls back to pre-computed `sourceUrl` values in the local dataset.

Rate limits and caching

- External API calls (TMDB, YouTube, Gemini) are potentially rate-limited. The code implements basic in-memory caching for expensive or repeated lookups; for production, replace it with a shared cache (Redis) and add robust retry/backoff.

---

## Frontend structure & UI notes

- `client/src/components/MovieCarousel.jsx` — simplified movie cards (Poster, Title, Genres, Rating, Watch/View button) and a top-level `RecommendationSummary` component that displays the single explanation returned by the API.
- `client/src/components/RecommendationSummary.jsx` — dedicated summary UI shown above movie cards to avoid repeated per-card explanations.
- `client/src/components/VideoRecommendationsSection.jsx` — uses `video.reason` (per-video short reason) and `youtubeUrl` for Watch links.
- `client/src/pages/Onboarding.jsx` — multi-step onboarding flow that populates `user.personalization`, which strongly influences recommendations.

UX considerations

- The frontend suppresses per-item `explanation` strings when a top-level `summary` is present (to reduce redundancy).
- The movie click flow posts to `/api/recommendations/movies/click` and opens an external search/watch link in a new tab (to avoid storing platform/link data in the core service).

---

## Debugging & troubleshooting

Common checks

- Verify MongoDB connectivity: check `MONGO_URI` and that `server.js` logs a successful connection.
- Ensure env vars exist for optional APIs (Gemini/TMDB/Youtube) when expecting enhanced responses.
- If the frontend shows empty recommendations, inspect the backend logs for `Movie recommendations served` and `Recommendation error` messages.

Logs & quick diagnostics

- The backend uses `console.info`, `console.warn`, and `console.error` at key paths. Check the terminal where `npm run dev` runs.
- Test module loading quickly:

```bash
cd mental-ai
node -e "require('./server/models/MovieClick'); require('./server/models/RecommendationHistory'); console.log('model modules loaded')"
```

Known issues & gotchas

- Mood sanitation: the system enforces a canonical set of moods (`happy`, `sad`, `stressed`, `anxious`, `calm`, `angry`, `neutral`) — if you see an explanation saying `nature` as a mood, it indicates an earlier stage bug where categories leaked into mood fields. The fix is implemented in `server/utils/movieRecommendationService.js` using `sanitizeMood()`.
- Per-item explanation duplication: the UI now uses a single summary to reduce noise. If you have older frontend builds, clear browser cache or rebuild the client.

---

## Security & production hardening suggestions

- Use HTTPS and secure cookies in production.
- Store secrets in a secrets manager (Vault, cloud KMS), not in `.env` files in production.
- Enable CORS with explicit origins and strong CSP headers.
- Add rate limiting and authentication checks for endpoints that call external APIs (e.g., `/api/recommendations/resolve`).
- Run dependency vulnerability scans and keep packages up to date.

---

## Deployment & Docker (simple example)

Example Dockerfile for the server (serving API only):

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
```

You can build and run using standard Docker commands, and host the built frontend on a CDN or static host.

---

## Development workflow & recommendations

- Use `npm run dev` in `server` and `client` concurrently during development.
- Keep API keys out of Git. Use a local `.env` file and add it to `.gitignore`.
- Add automated tests (unit and integration) for `RecommendationService` and `movieRecommendationService` to prevent regressions in scoring logic.
- Replace in-memory caches with Redis for scale and multi-instance deployments.

---

## Contributing

Thanks for contributing ideas and code! A few guidelines:

- Open an issue describing the feature or bug first.
- Create a feature branch: `git checkout -b feat/short-description`.
- Keep changes scoped to one concern and add tests for logic-heavy modules (recommendation scoring, Gemini prompt formatting).
- Ensure secrets are not included in pull requests.

If you'd like, I can:

- Add CI scripts and basic test harness.
- Add a Docker Compose setup for local dev (Mongo + server + client).
- Add Redis caching and an example migration.

Tell me which of these you'd like me to implement next.

---

## License

This repo does not include a license file. Add `LICENSE` if you plan to publish or share the project publicly.

---

## Contact / Maintainers

This README was generated from the repository structure by the Copilot assistant. For questions about architecture or to request follow-up tasks (tests, Docker Compose, CI), reply in the workspace or open an issue in the repo.
