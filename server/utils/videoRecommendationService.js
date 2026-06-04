const VideoWatch = require("../models/VideoWatch");
const WELLNESS_VIDEOS = require("./wellnessVideos.json");

const MOOD_VIDEO_MAP = {
  anxious: ["breathing", "calming", "grounding", "meditation"],
  stressed: ["breathing", "relaxation", "mindfulness", "calming"],
  sad: ["reflection", "gratitude", "comfort", "storytelling"],
  angry: ["calming", "grounding", "breathing", "self-care"],
  calm: ["music", "reflection", "nature", "gratitude"],
  happy: ["growth", "uplifting", "music", "gratitude"],
  neutral: ["wellness", "balance", "mindfulness", "calm"],
};

const MOOD_PRIORITY_CATEGORIES = {
  anxious: ["breathing", "meditation", "calming", "mindfulness"],
  stressed: ["breathing", "relaxation", "calming", "grounding"],
  sad: ["gratitude", "reflection", "comfort", "storytelling"],
  angry: ["calming", "grounding", "breathing", "self-care"],
  calm: ["nature", "reflection", "gratitude", "music"],
  happy: ["growth", "uplifting", "music", "gratitude"],
  neutral: ["wellness", "balance", "focus", "calm"],
};

const INTEREST_CATEGORY_MAP = {
  productivity: ["focus", "productivity", "music"],
  focus: ["focus", "music"],
  music: ["music", "therapy", "ambient"],
  reading: ["reflection", "storytelling", "calm"],
  journaling: ["reflection", "gratitude", "storytelling"],
  mindfulness: ["meditation", "breathing", "relaxation"],
  creativity: ["creative", "music"],
  wellness: ["wellness", "reflection", "relaxation"],
  health: ["wellness", "relaxation"],
  nature: ["nature", "calming"],
};

const STRESS_PREFERENCE_CATEGORY_MAP = {
  "breathing exercises": ["breathing", "meditation", "relaxation"],
  "listening to music": ["music", "ambient"],
  "taking a walk": ["nature", "calm"],
  journaling: ["reflection", "gratitude"],
  meditation: ["meditation", "calming"],
  stretching: ["movement", "calming"],
  "talking with someone": ["comfort", "storytelling"],
  reading: ["reflection", "storytelling"],
  resting: ["sleep", "relaxation"],
};

const MOVIE_GENRE_CATEGORY_MAP = {
  drama: ["reflection", "storytelling", "calm"],
  comedy: ["uplifting", "feel-good"],
  adventure: ["energy", "focus", "wonder"],
  documentary: ["reflection", "learning"],
  "sci-fi": ["wonder", "focus"],
  fantasy: ["imaginative", "calm"],
  romance: ["comfort", "storytelling"],
  thriller: ["energy", "focus"],
  animation: ["uplifting", "feel-good"],
  horror: ["grounding", "calming"],
};

const MUSIC_GENRE_CATEGORY_MAP = {
  classical: ["calm", "focus"],
  ambient: ["calm", "focus"],
  electronic: ["music", "focus"],
  rock: ["energy", "uplifting"],
  pop: ["uplifting", "music"],
  jazz: ["calm", "music"],
  "r&b": ["music", "comfort"],
  country: ["storytelling", "calm"],
  indie: ["creative", "music"],
};

const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const cache = new Map();

function normalizeList(values) {
  if (!values) return [];
  if (Array.isArray(values)) {
    return values.map((value) => String(value || "").toLowerCase().trim()).filter(Boolean);
  }
  return String(values)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeWatchIds(watches) {
  return Array.isArray(watches) ? watches.map((item) => String(item.videoId || "").trim()).filter(Boolean) : [];
}

function uniqueValues(values) {
  return [...new Set(normalizeList(values))];
}

function countMatches(candidateValues, targetValues) {
  const targetSet = new Set(normalizeList(targetValues));
  return normalizeList(candidateValues).filter((value) => targetSet.has(value)).length;
}

function buildCategoryHintsFromProfile({ interests, movieGenres, musicGenres, stressPreferences }) {
  const categories = [];
  normalizeList(interests).forEach((interest) => {
    (INTEREST_CATEGORY_MAP[interest] || []).forEach((category) => categories.push(category));
  });
  normalizeList(movieGenres).forEach((genre) => {
    (MOVIE_GENRE_CATEGORY_MAP[genre] || []).forEach((category) => categories.push(category));
  });
  normalizeList(musicGenres).forEach((genre) => {
    (MUSIC_GENRE_CATEGORY_MAP[genre] || []).forEach((category) => categories.push(category));
  });
  normalizeList(stressPreferences).forEach((preference) => {
    (STRESS_PREFERENCE_CATEGORY_MAP[preference] || []).forEach((category) => categories.push(category));
  });
  return uniqueValues(categories);
}

function getTopJournalMoods(journals) {
  const moodCounts = {};
  (journals || []).forEach((journal) => {
    const mood = String(journal?.mood || "neutral").toLowerCase().trim();
    if (!mood) return;
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  return Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood]) => mood)
    .slice(0, 3);
}

function buildExplanation(video, signals) {
  const parts = [];
  if (signals.latestJournalMood) {
    parts.push(`Recommended because your latest journal mood was ${signals.latestJournalMood}`);
  }
  if (countMatches(video.categories, MOOD_PRIORITY_CATEGORIES[signals.latestJournalMood] || []) > 0) {
    parts.push(`It matches the kinds of videos that help when you're feeling ${signals.latestJournalMood}`);
  }
  if (countMatches(video.moodTags, [signals.dominantMood]) > 0) {
    parts.push(`Supports your dominant mood of ${signals.dominantMood}`);
  }
  if (countMatches(video.categories, signals.profileCategoryHints) > 0) {
    parts.push("Aligned with your interests and stress relief preferences");
  }
  if (countMatches(video.tags, signals.journalMoods) > 0) {
    parts.push("Matches the mood themes in your recent journal entries");
  }
  if (signals.trendDirection === "declining" && video.categories.includes("calming")) {
    parts.push("Helps steady a downward mood trend with calming support");
  }
  if (!parts.length) {
    parts.push("Selected for supportive wellness and emotional balance");
  }
  return parts.join(". ") + ".";
}

function buildCacheKey({ latestJournalMood, dominantMood, trendDirection, interests, movieGenres, musicGenres, stressPreferences }) {
  const normalizedInterests = normalizeList(interests).sort().join(",");
  const normalizedMovieGenres = normalizeList(movieGenres).sort().join(",");
  const normalizedMusicGenres = normalizeList(musicGenres).sort().join(",");
  const normalizedStressPreferences = normalizeList(stressPreferences).sort().join(",");
  return `${latestJournalMood || "neutral"}|${dominantMood || "neutral"}|${trendDirection || "stable"}|${normalizedInterests}|${normalizedMovieGenres}|${normalizedMusicGenres}|${normalizedStressPreferences}`;
}

function getCachedRecommendations(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.videos;
}

function setCachedRecommendations(key, videos) {
  cache.set(key, { videos, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function getWatchedVideoIds(userId) {
  const records = await VideoWatch.find({ userId }).lean();
  return normalizeWatchIds(records);
}

function calculateVideoScore(video, signals) {
  let score = 0;
  const userInterests = normalizeList(signals.interests);
  const profileHints = normalizeList(signals.profileCategoryHints);
  const stressPreferences = normalizeList(signals.stressPreferences);
  const moodPriorityCategories = MOOD_PRIORITY_CATEGORIES[signals.latestJournalMood] || [];

  if (countMatches(video.moodTags, [signals.dominantMood]) > 0) {
    score += 4;
  }

  score += countMatches(video.categories, moodPriorityCategories) * 2.5;
  score += countMatches(video.categories, MOOD_VIDEO_MAP[signals.dominantMood] || []) * 1.5;
  score += countMatches(video.categories, profileHints) * 2;
  score += countMatches(video.interests, userInterests) * 2;
  score += countMatches(video.tags, signals.journalMoods) * 1.5;
  score += countMatches(video.categories, normalizeList(signals.musicGenres)) * 1.2;
  score += countMatches(video.categories, normalizeList(signals.movieGenres)) * 1.0;
  score += countMatches(video.categories, stressPreferences) * 3;

  if (signals.trendDirection === "declining" && video.categories.includes("calming")) {
    score += 2;
  }

  if (video.categories.includes("focus") && userInterests.includes("productivity")) {
    score += 2;
  }

  return Math.max(0, Number(score.toFixed(2)));
}

function buildSignals({ user, journals, moodAnalytics, overrides = {} }) {
  const interests = normalizeList(overrides.interests || user.personalization?.interests || []);
  const movieGenres = normalizeList(overrides.movieGenres || user.personalization?.favoriteGenres?.movies || []);
  const musicGenres = normalizeList(overrides.musicGenres || user.personalization?.favoriteGenres?.music || []);
  const stressPreferences = normalizeList(overrides.stressPreferences || user.personalization?.stressReliefPreferences || []);
  const latestJournalMood = String(journals?.[0]?.mood || "neutral").toLowerCase().trim();
  const dominantMood = String(moodAnalytics?.dominantMood || latestJournalMood).toLowerCase().trim();
  const trendDirection = moodAnalytics?.trend?.direction || "stable";
  const journalMoods = getTopJournalMoods(journals);
  const profileCategoryHints = buildCategoryHintsFromProfile({ interests, movieGenres, musicGenres, stressPreferences });

  return {
    interests,
    movieGenres,
    musicGenres,
    stressPreferences,
    latestJournalMood,
    dominantMood,
    trendDirection,
    journalMoods,
    profileCategoryHints,
  };
}

function createResultEntry(video, score, signals) {
  return {
    id: video.id,
    type: "video",
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    channelTitle: video.channelTitle,
    sourceUrl: video.youtubeUrl || video.sourceUrl,
    youtubeUrl: video.youtubeUrl || video.sourceUrl,
    categories: video.categories,
    interests: video.interests,
    moodTags: video.moodTags,
    score,
    reason: buildExplanation(video, signals),
  };
}

async function recommendVideos({ user, journals = [], moodAnalytics = null, overrides = {}, limit = 8 }) {
  const signals = buildSignals({ user, journals, moodAnalytics, overrides });
  const cacheKey = buildCacheKey({
    latestJournalMood: signals.latestJournalMood,
    dominantMood: signals.dominantMood,
    trendDirection: signals.trendDirection,
    interests: signals.interests,
    movieGenres: signals.movieGenres,
    musicGenres: signals.musicGenres,
    stressPreferences: signals.stressPreferences,
  });

  const cached = getCachedRecommendations(cacheKey);
  if (cached) {
    return cached;
  }

  const watchedIds = user?.id || user?._id ? await getWatchedVideoIds(user.id || user._id) : [];
  const scoredVideos = WELLNESS_VIDEOS.filter((video) => !watchedIds.includes(video.id))
    .map((video) => ({ video, score: calculateVideoScore(video, signals) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ video, score }) => createResultEntry(video, score, signals));

  const result = scoredVideos.length
    ? scoredVideos
    : WELLNESS_VIDEOS.slice(0, limit).map((video) => createResultEntry(video, 0, signals));

  if (!scoredVideos.length) {
    console.warn("Wellness video recommender returned no scored matches; using fallback catalog.");
  }

  setCachedRecommendations(cacheKey, result);
  return result;
}

module.exports = {
  recommendVideos,
};