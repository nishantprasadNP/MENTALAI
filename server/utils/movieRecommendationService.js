const fetch = globalThis.fetch;
const Movie = require("../models/Movie");
const { generateMentalAIResponse } = require("../services/geminiService");

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

const MOOD_SEARCH_TERMS = {
  stressed: ["comedy", "feel-good", "uplifting"],
  sad: ["comedy", "adventure", "family"],
  anxious: ["nature", "documentary", "calming drama"],
  happy: ["adventure", "romance", "comedy"],
  angry: ["inspirational", "sports drama"],
  calm: ["nature", "documentary", "calming drama"],
  neutral: ["comedy", "drama", "adventure"],
};

const MOOD_SCORE_VALUES = {
  happy: 5,
  calm: 4,
  neutral: 3,
  stressed: 2,
  anxious: 1.5,
  angry: 1.5,
  sad: 1,
};

const TMDB_GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const DEFAULT_FALLBACK_MOVIES = [
  {
    id: "fallback-1",
    title: "Feel-good family adventure",
    overview: "A warm, uplifting story designed to help you feel more hopeful and supported.",
    rating: 7.2,
    tmdbUrl: "https://www.themoviedb.org/",
    poster: null,
    recommendationReason: "A comforting fallback pick to support your current mood.",
  },
  {
    id: "fallback-2",
    title: "Uplifting comedy",
    overview: "A lighthearted movie recommendation to help lift your spirits.",
    rating: 7.0,
    tmdbUrl: "https://www.themoviedb.org/",
    poster: null,
    recommendationReason: "A gentle selection meant to brighten your day.",
  },
  {
    id: "fallback-3",
    title: "Calming documentary",
    overview: "A thoughtful, relaxing film to support emotional balance.",
    rating: 7.1,
    tmdbUrl: "https://www.themoviedb.org/",
    poster: null,
    recommendationReason: "A fallback choice for grounding and calm.",
  },
];

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").toLowerCase().trim())
      .filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.toLowerCase().trim())
    .filter(Boolean);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getLatestJournalMood(journals) {
  if (!journals || journals.length === 0) return "neutral";
  return normalizeText(journals[0].mood || "neutral");
}

function calculateMoodTrend(journals) {
  const moodScores = journals.map((journal) => MOOD_SCORE_VALUES[normalizeText(journal.mood)] || 3);
  const recentSeven = moodScores.slice(0, 7);
  const previousSeven = moodScores.slice(7, 14);
  if (!recentSeven.length || !previousSeven.length) {
    return { score: 0.5, direction: "stable" };
  }

  const average = (arr) => arr.reduce((sum, value) => sum + value, 0) / arr.length;
  const recentAvg = average(recentSeven);
  const previousAvg = average(previousSeven);
  const delta = recentAvg - previousAvg;
  const direction = delta > 0.2 ? "improving" : delta < -0.2 ? "declining" : "stable";

  return {
    score: Math.min(1, Math.max(0, 0.5 + delta / 4)),
    direction,
  };
}

function buildMovieSearchQueries(mood) {
  return MOOD_SEARCH_TERMS[mood] || MOOD_SEARCH_TERMS.neutral;
}

function mapGenreIdsToNames(genreIds = []) {
  return genreIds.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean);
}

function buildReason({ latestMood, moodTrend, matchedGenres, interestMatches }) {
  const parts = [`Your latest journal mood is ${latestMood}.`];
  if (matchedGenres.length) {
    parts.push(`It follows your genre preferences like ${matchedGenres.join(", ")}.`);
  }
  if (interestMatches > 0) {
    parts.push("It also resonates with your interests.");
  }
  if (moodTrend === "improving") {
    parts.push("It supports your upward emotional momentum.");
  } else if (moodTrend === "declining") {
    parts.push("It is chosen to help steady your emotional state.");
  } else {
    parts.push("It aligns well with your current mood and preferences.");
  }
  return parts.join(" ");
}

const ALLOWED_MOODS = ["happy", "sad", "stressed", "anxious", "calm", "angry", "neutral"];

function sanitizeMood(mood) {
  const m = normalizeText(mood || "");
  return ALLOWED_MOODS.includes(m) ? m : "neutral";
}

function capitalize(word) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function getTMDBMovieUrl(id) {
  return `https://www.themoviedb.org/movie/${id}`;
}

function formatTMDBPoster(path) {
  return path ? `${TMDB_IMAGE_BASE}${path}` : null;
}

async function fetchTMDBMovies(queries, limit = 30) {
  if (!TMDB_API_KEY) {
    console.warn("TMDB API key is not configured; falling back to local movie catalog.");
    return [];
  }
  if (typeof fetch !== "function") {
    console.warn("Global fetch is unavailable; cannot query TMDB from this runtime.");
    return [];
  }

  const resultMap = new Map();
  for (const query of queries) {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=en-US&query=${encodeURIComponent(query)}&include_adult=false&page=1`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        console.warn(`TMDB search failed for query '${query}' with status ${response.status}: ${text}`);
        continue;
      }
      const data = await response.json();
      (data.results || []).forEach((movie) => {
        if (!movie.id || resultMap.has(movie.id)) return;
        resultMap.set(movie.id, {
          id: movie.id,
          title: movie.title,
          overview: movie.overview || "",
          rating: movie.vote_average || 0,
          poster: formatTMDBPoster(movie.poster_path),
          tmdbUrl: getTMDBMovieUrl(movie.id),
          genres: mapGenreIdsToNames(movie.genre_ids),
          raw: movie,
        });
      });
    } catch (err) {
      console.error("TMDB fetch error:", err.message);
    }
    if (resultMap.size >= limit * 2) break;
  }

  return Array.from(resultMap.values());
}

function calculateMovieScore(movie, moodTargets, moodTrend, preferredGenres, interests) {
  const favoriteGenres = normalizeArray(preferredGenres);
  const interestTerms = normalizeArray(interests);

  const titleOverview = normalizeText(`${movie.title} ${movie.overview} ${movie.genres?.join(" ") || ""}`);
  const moodMatchCount = moodTargets.reduce((count, term) => (titleOverview.includes(normalizeText(term)) ? count + 1 : count), 0);
  const matchedGenres = favoriteGenres.filter((genre) => movie.genres.map((g) => normalizeText(g)).includes(normalizeText(genre)));
  const interestMatches = interestTerms.filter((term) => titleOverview.includes(term)).length;

  const moodScore = moodTargets.length ? Math.min(1, moodMatchCount / moodTargets.length) : 0;
  const genreScore = favoriteGenres.length ? Math.min(1, matchedGenres.length / favoriteGenres.length) : 0;
  const interestScore = interestTerms.length ? Math.min(1, interestMatches / interestTerms.length) : 0;

  const weightedScore = moodScore * 0.6 + moodTrend.score * 0.2 + genreScore * 0.15 + interestScore * 0.05;

  return {
    ...movie,
    score: weightedScore,
    recommendationReason: buildReason({
      latestMood: moodTargets[0] || "neutral",
      moodTrend: moodTrend.direction,
      matchedGenres,
      interestMatches,
    }),
    matchedGenres,
    interestMatches,
  };
}

async function recommendMovies(userData, journals = [], limit = 10) {
  const rawLatestMood = getLatestJournalMood(journals);
  const latestMood = sanitizeMood(rawLatestMood);
  const moodTrend = calculateMoodTrend(journals);
  const moodTargets = buildMovieSearchQueries(latestMood);
  const preferredGenres = normalizeArray(userData.personalization?.favoriteGenres?.movies || []);
  const interests = normalizeArray(userData.personalization?.interests || []);

  let movies = await fetchTMDBMovies(moodTargets, limit * 3);

  if (!movies.length) {
    const localMovies = await Movie.find({}).lean();
    movies = localMovies.map((movie) => ({
      id: movie._id,
      title: movie.title,
      overview: movie.description || "",
      rating: movie.rating || 0,
      poster: movie.poster || null,
      tmdbUrl: movie.tmdbUrl || "https://www.themoviedb.org/",
      genres: movie.genres || [],
    }));
  }

  const recommendedBase = movies
    .map((movie) => calculateMovieScore(movie, moodTargets, moodTrend, preferredGenres, interests))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const recommended = await Promise.all(
    recommendedBase.map(async (movie) => {
      let explanation = movie.recommendationReason;
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
        try {
          explanation = await generateMentalAIResponse(
            `Movie: ${movie.title}\nOverview: ${movie.overview || "No overview available."}\nGenres: ${movie.genres?.join(", ") || "N/A"}\nUser recent mood: ${latestMood}\nMood trend: ${moodTrend.direction}\nInterests: ${interests.join(", ") || "none"}\n\nIn 2-3 sentences, explain why this movie was selected and how it supports the user's current emotional state and wellness goals.`,
            {
              selectedMovie: movie,
              dominantMood: latestMood,
              moodTrend: moodTrend.direction,
              interests,
            }
          );
        } catch (err) {
          console.error("Movie explanation generation error:", err.message);
        }
      }

      return {
        id: movie.id,
        title: movie.title,
        poster: movie.poster,
        overview: movie.overview,
        rating: movie.rating,
        tmdbUrl: movie.tmdbUrl,
        explanation: explanation || movie.recommendationReason,
        score: Number(movie.score.toFixed(2)),
      };
    })
  );
  if (!recommended.length) {
    console.warn("Movie recommender returned no scored items; using fallback movies.");
    const fallback = DEFAULT_FALLBACK_MOVIES.slice(0, limit);
    const summaryFallback = `Based on your profile and recent activity we could not find TMDB matches; showing fallback picks to support wellbeing.`;
    return { summary: summaryFallback, movies: fallback };
  }

  // Build a single summary for the request (used in UI header)
  const readableGenres = preferredGenres.length ? preferredGenres.map((g) => capitalize(g)).join(", ") : "None selected";
  const readableInterests = interests.length ? interests.map((i) => capitalize(i)).join(", ") : "None specified";
  const summary = `Based on your latest journal mood (${capitalize(latestMood)}), your selected genres (${readableGenres}), and your interests (${readableInterests}), we selected movies that best match your current emotional state.`;

  // Remove explanation-heavy text from each movie object returned to frontend (UI will show a single summary)
  const moviesForUi = recommended.map((m) => ({
    id: m.id,
    title: m.title,
    poster: m.poster,
    overview: m.overview,
    rating: m.rating,
    tmdbUrl: m.tmdbUrl,
    genres: m.genres,
    score: m.score,
  }));

  return { summary, movies: moviesForUi };
}

module.exports = {
  recommendMovies,
};
