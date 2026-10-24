// Watchmode (https://api.watchmode.com) supplies movies, posters and Indian streaming
// sources. The free plan allows ~1000 requests/month, so results are stored in the
// Movie collection and reused for CACHE_DAYS before a mood is fetched again.
const Movie = require("../models/Movie");

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";
const REGION = "IN";
const CACHE_DAYS = 7;
const MOVIES_PER_MOOD = 12;
const REQUEST_TIMEOUT_MS = 10000;

// Watchmode genre names to search for each journal mood
const MOOD_GENRES = {
  stressed: ["Comedy", "Animation", "Family"],
  sad: ["Comedy", "Family", "Animation"],
  anxious: ["Documentary", "Animation", "Family"],
  happy: ["Adventure", "Romance", "Comedy"],
  angry: ["Comedy", "Adventure", "Documentary"],
  calm: ["Documentary", "Drama", "Romance"],
  neutral: ["Comedy", "Drama", "Adventure"],
};

let genreIdCache = null;

function getApiKey() {
  const key = process.env.WATCHMODE_API_KEY;
  return key && key !== "your_watchmode_api_key_here" ? key : null;
}

function isWatchmodeConfigured() {
  return Boolean(getApiKey());
}

async function watchmodeGet(path, params = {}) {
  const query = new URLSearchParams({ apiKey: getApiKey(), ...params });
  const res = await fetch(`${WATCHMODE_BASE_URL}${path}?${query}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Watchmode ${path} failed with ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function getGenreIds(names) {
  if (!genreIdCache) {
    const genres = await watchmodeGet("/genres/");
    genreIdCache = new Map(genres.map((genre) => [genre.name.toLowerCase(), genre.id]));
  }
  return names.map((name) => genreIdCache.get(name.toLowerCase())).filter(Boolean);
}

function pickStreamingSources(sources = []) {
  const streaming = sources.filter((s) => s.region === REGION && ["sub", "free"].includes(s.type));
  const platforms = [...new Set(streaming.map((s) => s.name))];
  return { platforms, watchUrl: streaming[0]?.web_url || "" };
}

// Watchmode posters are hosted on TMDB, which some networks block, so the YouTube
// trailer thumbnail is kept as a fallback image.
function getYouTubeThumbnail(trailerUrl) {
  const match = String(trailerUrl || "").match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : "";
}

async function fetchMoviesFromWatchmode(mood) {
  const genreIds = await getGenreIds(MOOD_GENRES[mood] || MOOD_GENRES.neutral);
  const list = await watchmodeGet("/list-titles/", {
    types: "movie",
    regions: REGION,
    genres: genreIds.join(","),
    sort_by: "popularity_desc",
    limit: String(MOVIES_PER_MOOD),
  });

  const saved = [];
  for (const title of list.titles || []) {
    try {
      const details = await watchmodeGet(`/title/${title.id}/details/`, {
        append_to_response: "sources",
        regions: REGION,
      });
      const { platforms, watchUrl } = pickStreamingSources(details.sources);
      const movie = await Movie.findOneAndUpdate(
        { watchmodeId: details.id },
        {
          $set: {
            title: details.title,
            genres: details.genre_names || [],
            description: details.plot_overview || "No description available.",
            poster: details.posterMedium || details.poster || "",
            year: details.year,
            rating: details.user_rating,
            streamingPlatforms: platforms,
            watchUrl,
            trailerUrl: details.trailer || "",
            trailerThumbnail: getYouTubeThumbnail(details.trailer),
            source: "watchmode",
          },
          $addToSet: { moods: mood },
        },
        { upsert: true, new: true }
      ).lean();
      saved.push(movie);
    } catch (err) {
      console.warn(`Watchmode details failed for title ${title.id}:`, err.message);
    }
  }
  return saved;
}

// Returns Watchmode movies for a mood, using the stored copy while it is fresh.
async function getMoviesForMood(mood) {
  if (!isWatchmodeConfigured()) return [];

  const freshSince = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000);
  // Movies saved before trailers were stored have no trailerUrl and are refreshed once
  const cached = await Movie.find({
    source: "watchmode",
    moods: mood,
    updatedAt: { $gte: freshSince },
    trailerUrl: { $exists: true },
  }).lean();
  if (cached.length >= MOVIES_PER_MOOD / 2) return cached;

  try {
    const fetched = await fetchMoviesFromWatchmode(mood);
    console.info(`Watchmode: fetched ${fetched.length} movies for mood '${mood}'`);
    return fetched.length ? fetched : cached;
  } catch (err) {
    console.error("Watchmode fetch error:", err.message);
    return cached;
  }
}

module.exports = {
  MOOD_GENRES,
  getMoviesForMood,
  isWatchmodeConfigured,
};
