const Movie = require("../models/Movie");
const { MOOD_GENRES, getMoviesForMood } = require("../services/watchmodeService");

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


const DEFAULT_FALLBACK_MOVIES = [
  {
    id: "fallback-1",
    title: "Feel-good family adventure",
    overview: "A warm, uplifting story designed to help you feel more hopeful and supported.",
    rating: 7.2,
    poster: null,
    recommendationReason: "A comforting fallback pick to support your current mood.",
  },
  {
    id: "fallback-2",
    title: "Uplifting comedy",
    overview: "A lighthearted movie recommendation to help lift your spirits.",
    rating: 7.0,
    poster: null,
    recommendationReason: "A gentle selection meant to brighten your day.",
  },
  {
    id: "fallback-3",
    title: "Calming documentary",
    overview: "A thoughtful, relaxing film to support emotional balance.",
    rating: 7.1,
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

function calculateMovieScore(movie, moodTargets, moodTrend, preferredGenres, interests, latestMood) {
  const favoriteGenres = normalizeArray(preferredGenres);
  const interestTerms = normalizeArray(interests);

  const titleOverview = normalizeText(
    `${movie.title} ${movie.overview} ${movie.genres?.join(" ") || ""} ${movie.moods?.join(" ") || ""}`
  );
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
      latestMood,
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
  const moodTargets = [...buildMovieSearchQueries(latestMood), ...(MOOD_GENRES[latestMood] || [])];
  const preferredGenres = normalizeArray(userData.personalization?.favoriteGenres?.movies || []);
  const interests = normalizeArray(userData.personalization?.interests || []);

  // Watchmode movies for this mood first; the seeded local catalog is the fallback.
  let candidates = await getMoviesForMood(latestMood);
  if (!candidates.length) {
    candidates = await Movie.find({ source: { $ne: "watchmode" } }).lean();
  }

  const movies = candidates.map((movie) => ({
    id: String(movie._id),
    title: movie.title,
    overview: movie.description || "",
    rating: movie.rating ?? null,
    year: movie.year ?? null,
    poster: movie.poster || null,
    genres: movie.genres || [],
    moods: movie.moods || [],
    platforms: movie.streamingPlatforms || [],
    watchUrl: movie.watchUrl || "",
    trailerUrl: movie.trailerUrl || "",
    trailerThumbnail: movie.trailerThumbnail || "",
  }));

  const recommended = movies
    .map((movie) => calculateMovieScore(movie, moodTargets, moodTrend, preferredGenres, interests, latestMood))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (!recommended.length) {
    console.warn("Movie recommender returned no scored items; using fallback movies.");
    const fallback = DEFAULT_FALLBACK_MOVIES.slice(0, limit);
    const summaryFallback = "We couldn't load movies right now, so here are a few gentle picks to support your wellbeing.";
    return { summary: summaryFallback, movies: fallback };
  }

  // Build a single summary for the request (used in UI header)
  const readableGenres = preferredGenres.length ? preferredGenres.map((g) => capitalize(g)).join(", ") : "None selected";
  const readableInterests = interests.length ? interests.map((i) => capitalize(i)).join(", ") : "None specified";
  const summary = `Based on your latest journal mood (${capitalize(latestMood)}), your selected genres (${readableGenres}), and your interests (${readableInterests}), we selected movies that best match your current emotional state.`;

  // Per-movie explanations are not sent; the UI shows the single summary above
  const moviesForUi = recommended.map((m) => ({
    id: m.id,
    title: m.title,
    poster: m.poster,
    overview: m.overview,
    rating: m.rating,
    year: m.year,
    genres: m.genres,
    platforms: m.platforms,
    watchUrl: m.watchUrl,
    trailerUrl: m.trailerUrl,
    trailerThumbnail: m.trailerThumbnail,
    score: Number(m.score.toFixed(2)),
  }));

  return { summary, movies: moviesForUi };
}

module.exports = {
  recommendMovies,
};
