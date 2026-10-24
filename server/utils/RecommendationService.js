const mongoose = require("mongoose");
const User = require("../models/User");
const Journal = require("../models/Journal");
const GameHistory = require("../models/GameHistory");
const ChatHistory = require("../models/ChatHistory");
const RecommendationHistory = require("../models/RecommendationHistory");
const { getMoodAnalytics } = require("./moodAnalytics");
const { recommendVideos } = require("./videoRecommendationService");
const { getPersonalJournalPrompts } = require("../services/journalPromptService");

const CANDIDATES = {
  games: [
    {
      id: "breathing",
      title: "Breathing Bubble",
      type: "game",
      categories: ["mindfulness", "relaxation"],
      moodTags: ["stressed", "anxious", "calm"],
      interests: ["Mindfulness", "Health", "Wellness"],
    },
    {
      id: "typing",
      title: "Zen Typing",
      type: "game",
      categories: ["focus", "creativity"],
      moodTags: ["stressed", "anxious", "calm"],
      interests: ["Writing", "Creativity", "Focus"],
    },
    {
      id: "memory",
      title: "Mood Memory",
      type: "game",
      categories: ["focus", "cognitive"],
      moodTags: ["neutral", "happy"],
      interests: ["Games", "Brain", "Focus"],
    },
    {
      id: "gratitude",
      title: "Gratitude Jar",
      type: "game",
      categories: ["mindfulness", "gratitude"],
      moodTags: ["sad", "anxious", "calm"],
      interests: ["Gratitude", "Journaling", "Wellness"],
    },
    {
      id: "focus",
      title: "Focus Tap",
      type: "game",
      categories: ["focus", "attention"],
      moodTags: ["stressed", "neutral"],
      interests: ["Productivity", "Games", "Focus"],
    },
  ],
  activities: [
    {
      id: "gratitude_journal",
      title: "Gratitude journaling",
      type: "activity",
      categories: ["wellness", "reflection"],
      moodTags: ["sad", "anxious", "neutral"],
      interests: ["Journaling", "Wellness", "Reflection"],
    },
    {
      id: "guided_breathing",
      title: "Guided breathing practice",
      type: "activity",
      categories: ["mindfulness", "calm"],
      moodTags: ["stressed", "anxious", "angry"],
      interests: ["Mindfulness", "Health", "Breathing"],
    },
    {
      id: "creative_break",
      title: "Creative art break",
      type: "activity",
      categories: ["creativity", "self-care"],
      moodTags: ["sad", "neutral", "happy"],
      interests: ["Art", "Creativity", "Self-care"],
    },
    {
      id: "nature_walk",
      title: "Short nature walk",
      type: "activity",
      categories: ["movement", "wellness"],
      moodTags: ["stressed", "anxious", "calm"],
      interests: ["Nature", "Movement", "Mindfulness"],
    },
    {
      id: "mindful_stretch",
      title: "Mindful stretching",
      type: "activity",
      categories: ["relaxation", "self-care"],
      moodTags: ["stressed", "anxious", "calm"],
      interests: ["Movement", "Health", "Mindfulness"],
    },
    {
      id: "share_good_news",
      title: "Share your good mood with a friend",
      type: "activity",
      categories: ["connection", "gratitude"],
      moodTags: ["happy"],
      interests: ["Friends", "Social", "Wellness"],
    },
    {
      id: "dance_break",
      title: "Dance to an upbeat song",
      type: "activity",
      categories: ["movement", "creativity"],
      moodTags: ["happy", "neutral"],
      interests: ["Music", "Movement", "Feel-good"],
    },
    {
      id: "plan_something_fun",
      title: "Plan something to look forward to",
      type: "activity",
      categories: ["growth", "creativity"],
      moodTags: ["happy", "calm"],
      interests: ["Productivity", "Creativity", "Travel"],
    },
    {
      id: "reach_out",
      title: "Reach out to someone you trust",
      type: "activity",
      categories: ["support", "connection"],
      moodTags: ["sad", "anxious"],
      interests: ["Friends", "Family", "Wellness"],
    },
    {
      id: "comfort_routine",
      title: "Make a cosy comfort moment: warm drink, blanket, soft music",
      type: "activity",
      categories: ["self-care", "support"],
      moodTags: ["sad", "stressed"],
      interests: ["Self-care", "Music", "Relaxation"],
    },
    {
      id: "self_compassion_pause",
      title: "Self-compassion pause: talk to yourself like a friend",
      type: "activity",
      categories: ["support", "reflection"],
      moodTags: ["sad"],
      interests: ["Mindfulness", "Wellness", "Reflection"],
    },
    {
      id: "shake_it_out",
      title: "Shake it out: 5 minutes of brisk movement",
      type: "activity",
      categories: ["movement", "calm"],
      moodTags: ["angry", "stressed"],
      interests: ["Movement", "Fitness", "Health"],
    },
    {
      id: "unsent_letter",
      title: "Write an unsent letter to let the anger out",
      type: "activity",
      categories: ["journaling", "release"],
      moodTags: ["angry"],
      interests: ["Journaling", "Writing", "Reflection"],
    },
  ],
  videos: [
    {
      id: "calming_breathing_video",
      title: "Calming breathing video",
      type: "video",
      genres: ["Wellness", "Meditation"],
      moodTags: ["anxious", "stressed", "calm"],
      interests: ["Mindfulness", "Health", "Relaxation"],
    },
    {
      id: "focus_music_playlist",
      title: "Focus music playlist",
      type: "video",
      genres: ["Electronic", "Ambient"],
      moodTags: ["anxious", "stressed", "neutral"],
      interests: ["Music", "Focus", "Productivity"],
    },
    {
      id: "guided_gratitude_video",
      title: "Guided gratitude practice",
      type: "video",
      genres: ["Wellness", "Self-help"],
      moodTags: ["sad", "neutral", "calm"],
      interests: ["Gratitude", "Wellness", "Reflection"],
    },
    {
      id: "animated_relaxation_video",
      title: "Animated relaxation short",
      type: "video",
      genres: ["Animation", "Relaxation"],
      moodTags: ["stressed", "anxious", "calm"],
      interests: ["Art", "Relaxation", "Mindfulness"],
    },
  ],
  movies: [
    {
      id: "feel_good_comedy",
      title: "Feel-good comedy",
      type: "movie",
      genres: ["Comedy", "Drama"],
      moodTags: ["sad", "neutral", "happy"],
      interests: ["Movies", "Feel-good", "Comedy"],
    },
    {
      id: "nature_documentary",
      title: "Nature documentary",
      type: "movie",
      genres: ["Documentary", "Adventure"],
      moodTags: ["stressed", "anxious", "calm"],
      interests: ["Nature", "Learning", "Calm"],
    },
    {
      id: "uplifting_drama",
      title: "Uplifting drama",
      type: "movie",
      genres: ["Drama", "Inspiration"],
      moodTags: ["sad", "neutral", "happy"],
      interests: ["Stories", "Inspiration", "Reflection"],
    },
  ],
  music: [
    {
      id: "focus_playlist",
      title: "Focus & Ambient Playlist",
      type: "music",
      genres: ["Ambient", "Electronic"],
      moodTags: ["neutral", "stressed"],
      interests: ["Music", "Focus", "Productivity"],
    },
    {
      id: "calm_piano",
      title: "Calm Piano Collection",
      type: "music",
      genres: ["Classical", "Ambient"],
      moodTags: ["anxious", "stressed", "calm"],
      interests: ["Music", "Relaxation"],
    },
    {
      id: "uplifting_hits",
      title: "Uplifting Hits",
      type: "music",
      genres: ["Pop", "Indie"],
      moodTags: ["sad", "neutral", "happy"],
      interests: ["Music", "Feel-good"],
    },
  ],
  journalPrompts: [
    {
      id: "gratitude_prompt",
      title: "Write three things you are grateful for today.",
      type: "journalPrompt",
      categories: ["gratitude", "reflection"],
      moodTags: ["sad", "anxious", "neutral"],
      interests: ["Journaling", "Gratitude", "Reflection"],
    },
    {
      id: "small_wins_prompt",
      title: "Describe one small win you had this week.",
      type: "journalPrompt",
      categories: ["confidence", "reflection"],
      moodTags: ["neutral", "sad", "stressed"],
      interests: ["Journaling", "Growth", "Reflection"],
    },
    {
      id: "brain_dump_prompt",
      title: "Brain dump anything that is on your mind.",
      type: "journalPrompt",
      categories: ["clarity", "stress relief"],
      moodTags: ["anxious", "stressed", "neutral"],
      interests: ["Journaling", "Wellness", "Mindfulness"],
    },
  ],
};

// What happens when an activity is opened: `link` goes to a page in the app,
// otherwise `steps` are shown as a short how-to.
const journalLink = (prompt) => `/journal?prompt=${encodeURIComponent(prompt)}`;
const ACTIVITY_ACTIONS = {
  gratitude_journal: { link: "/games/gratitude" },
  guided_breathing: { link: "/games/breathing" },
  dance_break: { link: "/music" },
  plan_something_fun: { link: journalLink("Something I'd love to look forward to, and my plan to make it happen") },
  self_compassion_pause: { link: journalLink("What I'd say to a good friend feeling the way I feel right now") },
  unsent_letter: { link: journalLink("An unsent letter: what I really want to say") },
  creative_break: {
    steps: [
      "Grab any paper and a pen, pencil or colours.",
      "Set a 10-minute timer and doodle, sketch or colour whatever comes to mind.",
      "There's no right or wrong: focus on the movement, not the result.",
    ],
  },
  nature_walk: {
    steps: [
      "Step outside for 10–15 minutes, no destination needed.",
      "Leave your phone in your pocket and walk at an easy pace.",
      "Notice five things you can see, four you can hear and three you can feel.",
    ],
  },
  mindful_stretch: {
    steps: [
      "Stand or sit comfortably and take three slow breaths.",
      "Gently roll your neck and shoulders, then reach your arms overhead.",
      "Fold forward slowly, let your arms hang for a few breaths, then roll back up.",
      "Move slowly and stop if anything hurts.",
    ],
  },
  share_good_news: {
    steps: [
      "Think of someone who'd be happy to hear from you.",
      "Send them a message or call to share what's going well.",
      "Ask how they're doing too: good moods are better shared.",
    ],
  },
  reach_out: {
    steps: [
      "Pick one person you feel safe with: a friend, family member or mentor.",
      "Send a simple message, like \"Hey, are you free to talk for a bit?\"",
      "You don't have to explain everything; just letting someone in can help.",
      "If you ever feel unsafe, contact a local helpline or emergency number right away.",
    ],
  },
  comfort_routine: {
    steps: [
      "Make a warm drink you like: tea, hot chocolate or warm milk.",
      "Get cosy with a blanket somewhere comfortable.",
      "Put on some soft music or a comforting show and give yourself 15 minutes.",
    ],
  },
  shake_it_out: {
    steps: [
      "Stand up and shake out your hands, arms and legs for 30 seconds.",
      "Do a few minutes of brisk movement: fast walking, jumping jacks or stairs.",
      "Finish with three slow, deep breaths and notice how your body feels.",
    ],
  },
};

const MOOD_IMPROVEMENT_KEYWORDS = {
  anxious: ["calm", "mindfulness", "breathing"],
  stressed: ["relaxation", "breathing", "focus"],
  sad: ["gratitude", "support", "reflection"],
  angry: ["calm", "breathing", "journaling"],
  neutral: ["balance", "focus", "wellness"],
  happy: ["growth", "creativity", "gratitude"],
};

function normalizeArray(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  return String(input)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function daysSince(date) {
  return date ? Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 86400000)) : Infinity;
}

function scoreRecency(days) {
  if (days === Infinity) return 0;
  return Math.max(0, (14 - Math.min(days, 14)) / 14);
}

function scoreEngagement(count) {
  return Math.min(1, count / 5);
}

function scoreInterest(matches) {
  return Math.min(1, matches / 3);
}

// The current mood (latest journal entry) dominates: an item tagged for it scores up to 3,
// well above the other signals (each 0-1), so happy and sad users get clearly different picks.
// The past week's moods only add a small bonus.
function scoreMoodRelevance(candidate, currentMood, weeklyMoods, trendDirection) {
  const moodTags = new Set((candidate.moodTags || []).map((tag) => (tag === "anger" ? "angry" : String(tag).toLowerCase())));
  const themes = new Set([...(candidate.categories || []), ...(candidate.interests || [])].map((t) => String(t).toLowerCase()));

  const currentMatch = moodTags.has(currentMood) ? 2 : 0;
  const improvementMatch = (MOOD_IMPROVEMENT_KEYWORDS[currentMood] || []).filter((keyword) => themes.has(keyword)).length;
  const improvementBonus = Math.min(0.6, improvementMatch * 0.3);
  const weeklyBonus = weeklyMoods.some((mood) => moodTags.has(mood)) ? 0.3 : 0;
  const trendBonus = trendDirection === "declining" && currentMatch ? 0.1 : 0;
  return currentMatch + improvementBonus + weeklyBonus + trendBonus;
}

function buildGenres(userGenres, itemGenres) {
  if (!userGenres || !itemGenres) return 0;
  const favorites = new Set(normalizeArray(userGenres));
  return itemGenres
    .map((genre) => String(genre).trim().toLowerCase())
    .filter(Boolean)
    .filter((genre) => favorites.has(genre)).length;
}

function buildInterestMatch(userInterests, candidateInterests) {
  const interests = new Set(normalizeArray(userInterests));
  return (candidateInterests || [])
    .map((interest) => String(interest).trim().toLowerCase())
    .filter(Boolean)
    .filter((interest) => interests.has(interest)).length;
}

async function getRecentRecommendationKeys(userId, days = 14) {
  const since = new Date(Date.now() - days * 86400000);
  const history = await RecommendationHistory.find({ userId, createdAt: { $gte: since } }).lean();
  return new Set(history.map((item) => `${item.itemType}:${item.itemId}`));
}

async function getRecentEngagement(userId) {
  const since = new Date(Date.now() - 90 * 86400000);
  const gameRecords = await GameHistory.find({ userId, playedAt: { $gte: since } }).sort({ playedAt: -1 }).lean();
  const chatRecords = await ChatHistory.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean();

  const engagements = {};

  gameRecords.forEach((record) => {
    const key = `game:${record.gameId}`;
    if (!engagements[key]) {
      engagements[key] = { count: 0, latest: record.playedAt, categories: new Set(), moodTags: new Set() };
    }
    engagements[key].count += 1;
    if (record.playedAt && new Date(record.playedAt) > new Date(engagements[key].latest)) {
      engagements[key].latest = record.playedAt;
    }
    record.categories.forEach((cat) => engagements[key].categories.add(cat));
    record.moodTags.forEach((tag) => engagements[key].moodTags.add(tag));
  });

  chatRecords.forEach((record) => {
    const key = `chat:${record.moodTag || "general"}`;
    if (!engagements[key]) {
      engagements[key] = { count: 0, latest: record.createdAt, categories: new Set(), moodTags: new Set() };
    }
    engagements[key].count += 1;
    if (record.createdAt && new Date(record.createdAt) > new Date(engagements[key].latest)) {
      engagements[key].latest = record.createdAt;
    }
    record.topics.forEach((topic) => engagements[key].categories.add(topic));
    if (record.moodTag) engagements[key].moodTags.add(record.moodTag);
  });

  return engagements;
}

function flattenCandidates(items) {
  return items.map((item) => ({ ...item, key: `${item.type}:${item.id}` }));
}

function chooseTopCandidates(candidates, count = 3, allCandidatesList = []) {
  const top = candidates.slice(0, count).map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    categories: c.categories || c.genres || [],
    genres: c.genres || [],
    moodTags: c.moodTags || [],
    interests: c.interests || [],
    score: Number((c.score || 0).toFixed(2)),
    explanation: c.explanation || "",
    sourceUrl:
      c.sourceUrl ||
      (c.type === "video" ? `https://www.youtube.com/results?search_query=${encodeURIComponent(c.title)}` : null) ||
      (c.type === "music" ? `https://open.spotify.com/search/${encodeURIComponent(c.title)}` : null) ||
      null,
  }));

  if (top.length >= count) return top;

  const ttype = candidates.length ? candidates[0].type : null;
  if (!ttype || !Array.isArray(allCandidatesList)) return top;

  const existingIds = new Set(top.map((i) => i.id));
  const extras = allCandidatesList
    .filter((c) => c.type === ttype && !existingIds.has(c.id))
    .slice(0, count - top.length)
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      categories: c.categories || c.genres || [],
      genres: c.genres || [],
      moodTags: c.moodTags || [],
      interests: c.interests || [],
      score: Number(((c.score || 0) || 0).toFixed(2)),
      explanation: c.explanation || "Suggested to support your wellbeing.",
      sourceUrl:
        c.sourceUrl ||
        (c.type === "video" ? `https://www.youtube.com/results?search_query=${encodeURIComponent(c.title)}` : null) ||
        (c.type === "music" ? `https://open.spotify.com/search/${encodeURIComponent(c.title)}` : null) ||
        null,
    }));

  return [...top, ...extras];
}

async function saveRecommendationBatch(userId, recommendedItems) {
  if (!recommendedItems.length) return;
  const historyDocs = recommendedItems.map((item) => ({
    userId,
    itemType: item.type,
    itemId: item.id,
    title: item.title,
  }));
  await RecommendationHistory.insertMany(historyDocs);
}

exports.buildRecommendations = async function (userId, options = {}) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userObjectId).lean();
  if (!user) throw new Error("User not found");

  const journalEntries = await Journal.find({ userId: userObjectId }).sort({ createdAt: -1 }).lean();
  const moodAnalytics = await getMoodAnalytics(userId);
  const engagementMap = await getRecentEngagement(userObjectId);
  const recentKeys = options.fresh ? new Set() : await getRecentRecommendationKeys(userObjectId, 14);

  const userInterests = normalizeArray(user.personalization?.interests);
  const favoriteMovies = normalizeArray(user.personalization?.favoriteGenres?.movies);
  const favoriteMusic = normalizeArray(user.personalization?.favoriteGenres?.music);

  const journalRecencyDays = journalEntries.length ? daysSince(journalEntries[0].createdAt) : Infinity;
  const topMoodCandidates = Object.entries(moodAnalytics?.moodBreakdown?.last7?.percentages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([mood]) => mood);
  const trendDirection = moodAnalytics?.trend?.direction || "stable";
  const ALLOWED_MOODS = ["happy", "sad", "stressed", "anxious", "calm", "angry", "neutral"];
  const latestMood = String(journalEntries[0]?.mood || "").toLowerCase().trim();
  const currentMood = ALLOWED_MOODS.includes(latestMood) ? latestMood : topMoodCandidates[0] || "neutral";

  const allCandidates = flattenCandidates([
    ...CANDIDATES.games,
    ...CANDIDATES.activities,
    ...CANDIDATES.videos,
    ...CANDIDATES.movies,
    ...CANDIDATES.journalPrompts,
    ...(CANDIDATES.music || []),
  ]);

  const RECENT_PENALTY = 0.25; // reduce score by 25% if recently recommended

  const scored = allCandidates
    .map((candidate) => {
      const engagementKey = candidate.type === "game" ? `game:${candidate.id}` : null;
      const engagementRecord = engagementKey ? engagementMap[engagementKey] : null;
      const universalEngagement = Object.values(engagementMap);
      const relatedEngagements = universalEngagement.filter((record) => {
        const sharedCategory = record.categories
          ? [...record.categories].some((cat) => (candidate.categories || []).includes(String(cat).toLowerCase()))
          : false;
        const sharedMood = record.moodTags
          ? [...record.moodTags].some((tag) => (candidate.moodTags || []).includes(String(tag).toLowerCase()))
          : false;
        return sharedCategory || sharedMood;
      });

      const engagementCount =
        (engagementRecord ? engagementRecord.count : 0) +
        relatedEngagements.reduce((sum, record) => sum + record.count, 0);

      const lastEngagedDays = Math.min(
        engagementRecord ? daysSince(engagementRecord.latest) : Infinity,
        ...relatedEngagements.map((record) => daysSince(record.latest)),
        journalEntries.length && candidate.type === "journalPrompt" ? journalRecencyDays : Infinity
      );

      const interestMatches = buildInterestMatch(userInterests, candidate.interests);
      const genreMatches =
        candidate.type === "movie"
          ? buildGenres(favoriteMovies, candidate.genres)
          : candidate.type === "video"
          ? buildGenres([...favoriteMovies, ...favoriteMusic], candidate.genres)
          : 0;

      const moodRelevance = scoreMoodRelevance(candidate, currentMood, topMoodCandidates, trendDirection);
      const recencyScore = scoreRecency(lastEngagedDays);
      const engagementScore = scoreEngagement(engagementCount);
      const interestScore = Math.min(1, scoreInterest(interestMatches + genreMatches));

      const explanationParts = [];
      if (interestMatches > 0) explanationParts.push(`Matches your interests (${interestMatches})`);
      if (genreMatches > 0) explanationParts.push(`Aligns with your favorite genres (${genreMatches})`);
      if (moodRelevance >= 2) explanationParts.push(`Picked for how you're feeling (${currentMood})`);
      else if (moodRelevance > 0) explanationParts.push(`Relevant to your recent mood`);
      if (recencyScore > 0.5) explanationParts.push(`You engaged with similar content recently`);
      if (engagementScore > 0.4) explanationParts.push(`Popular based on your recent activity`);

      // base score before recency penalty
      let baseScore = recencyScore + engagementScore + interestScore + moodRelevance;

      const key = `${candidate.type}:${candidate.id}`;
      const wasRecent = recentKeys.has(key);
      if (wasRecent) {
        baseScore = Number((baseScore * (1 - RECENT_PENALTY)).toFixed(4));
        explanationParts.push("Seen recently — slightly deprioritized");
      }

      const explanation = explanationParts.length ? explanationParts.join(". ") + "." : "Suggested to support your wellbeing.";

      return {
        ...candidate,
        score: baseScore,
        recencyScore,
        engagementScore,
        interestScore,
        moodRelevance,
        explanation,
        wasRecent,
      };
    })
    .sort((a, b) => b.score - a.score);

  const topGames = chooseTopCandidates(scored.filter((item) => item.type === "game"), 3, allCandidates);

  // Prompts and picks chosen by Gemini from what the user wrote in their latest entry
  // (written in the background after each entry); mood-based scoring fills any gaps.
  const personalPicks = await getPersonalJournalPrompts(userObjectId, journalEntries);
  const PICKED_REASON = "Chosen for what you wrote in your latest journal entry.";
  const preferPicked = (items, pickedIds) => {
    const byId = new Map(items.map((item) => [String(item.id), item]));
    const picked = pickedIds.map((id) => byId.get(id)).filter(Boolean).map((item) => ({ ...item, explanation: PICKED_REASON }));
    const pickedSet = new Set(picked.map((item) => String(item.id)));
    return [...picked, ...items.filter((item) => !pickedSet.has(String(item.id)))];
  };

  const scoredActivities = preferPicked(scored.filter((item) => item.type === "activity"), personalPicks.activityIds);
  const topActivities = chooseTopCandidates(scoredActivities, 3, allCandidates).map(
    (activity) => ({ ...activity, ...(ACTIVITY_ACTIONS[activity.id] || {}) })
  );
  let topVideos = chooseTopCandidates(scored.filter((item) => item.type === "video"), 3, allCandidates);

  // If video results are sparse or missing valid URLs, prefer the dedicated video recommender
  const hasDirectVideoUrl = topVideos.some(
    (v) => v.sourceUrl && (v.sourceUrl.includes("watch?v=") || v.sourceUrl.includes("youtu.be/"))
  );
  const needsBetterVideos = topVideos.length < 3 || !hasDirectVideoUrl;
  if (needsBetterVideos) {
    try {
      const videoResults = await recommendVideos({ user, journals: journalEntries, moodAnalytics, limit: 20 });
      if (Array.isArray(videoResults) && videoResults.length) {
        topVideos = preferPicked(videoResults, personalPicks.videoIds).slice(0, 3).map((v) => ({
          id: v.id,
          title: v.title,
          type: "video",
          categories: v.categories || v.genres || [],
          genres: v.genres || [],
          moodTags: v.moodTags || [],
          interests: v.interests || [],
          score: Number((v.score || 0).toFixed(2)),
          explanation: v.explanation || "",
          sourceUrl: v.sourceUrl || (v.title ? `https://www.youtube.com/results?search_query=${encodeURIComponent(v.title)}` : null),
        }));
      }
    } catch (e) {
      // fallback silently to catalog-based videos
    }
  }
  const topMovies = chooseTopCandidates(scored.filter((item) => item.type === "movie"), 3, allCandidates);
  const topMusic = chooseTopCandidates(scored.filter((item) => item.type === "music"), 3, allCandidates);
  // Personal prompts written from the user's own journal entries; static prompts are the fallback
  const topJournalPrompts =
    personalPicks.prompts ||
    chooseTopCandidates(scored.filter((item) => item.type === "journalPrompt"), 3, allCandidates);

  const recommendedItems = [...topGames, ...topActivities, ...topVideos, ...topMovies, ...topMusic, ...topJournalPrompts];
  await saveRecommendationBatch(userObjectId, recommendedItems);

  return {
    games: topGames,
    activities: topActivities,
    videos: topVideos,
    movies: topMovies,
    music: topMusic,
    journalPrompts: topJournalPrompts,
    journalPromptsPending: personalPicks.pending,
  };
};

exports.getPublicCatalog = function () {
  const pick = (arr) => (Array.isArray(arr) ? arr.slice(0, 3).map((c) => ({ id: c.id, title: c.title, type: c.type, categories: c.categories || c.genres || [], genres: c.genres || [], moodTags: c.moodTags || [], interests: c.interests || [], explanation: "General recommendation" })) : []);
  return {
    games: pick(CANDIDATES.games),
    activities: pick(CANDIDATES.activities),
    videos: pick(CANDIDATES.videos),
    movies: pick(CANDIDATES.movies),
    music: pick(CANDIDATES.music || []),
    journalPrompts: pick(CANDIDATES.journalPrompts),
  };
};

// Activities the Dashboard can recommend, for choosing picks from a journal entry's content
exports.getActivityCatalog = function () {
  return CANDIDATES.activities.map((a) => ({ id: a.id, title: a.title, moodTags: a.moodTags || [] }));
};
