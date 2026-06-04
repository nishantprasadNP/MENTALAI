const Journal = require("../models/Journal");

const ISSUE_KEYWORDS = {
  exams: ["exam", "exams", "test", "tests", "midterm", "final", "study", "studying"],
  overthinking: ["overthinking", "overthink", "thinking too much", "mind won't stop", "ruminating", "can't stop thinking"],
  burnout: ["burnout", "burned out", "exhausted", "overwhelmed", "too much", "running on empty"],
  anxiety: ["anxious", "anxiety", "panic", "panic attack", "worrying", "nervous"],
  selfWorth: ["worthless", "failure", "not good enough", "hate myself", "useless", "burden"],
  relationships: ["relationship", "partner", "family", "friend", "breakup", "arguments", "communication"],
  sleep: ["sleep", "insomnia", "can't sleep", "restless", "tired"],
  work: ["work", "job", "career", "boss", "deadline", "performance", "promotion"],
};

const ACTIVITY_KEYWORDS = {
  music: ["music", "song", "playlist", "sing", "listen to music"],
  journaling: ["journal", "journaling", "writing", "write down"],
  walking: ["walk", "walking", "walked", "hike", "stroll"],
  meditation: ["meditation", "meditate", "mindful", "mindfulness"],
  reading: ["read", "reading", "book", "novel"],
  drawing: ["draw", "art", "painting", "sketch"],
  cooking: ["cook", "cooking", "bake", "baking"],
  nature: ["nature", "outside", "park", "trees", "fresh air"],
};

const COPING_KEYWORDS = {
  "deep breathing": ["deep breathing", "breathing exercise", "take a deep breath", "box breathing", "breathwork"],
  journaling: ["journal", "journaling", "write down", "writing"],
  music: ["music", "song", "listen to music", "play music"],
  walking: ["walk", "walking", "going for a walk", "outside"],
  meditation: ["meditation", "meditate", "mindfulness"],
  talking: ["talk to", "talk with", "call someone", "friend", "support"],
  stretching: ["stretch", "stretching", "yoga", "movement"],
};

const STRENGTH_PATTERNS = [
  { label: "resilient", pattern: /\b(i (?:can|was able to|managed to|got through|survived|am proud of myself))\b/gi },
  { label: "self-aware", pattern: /\b(i (?:noticed|realized|understand|recognize|know))\b/gi },
  { label: "persistent", pattern: /\b(i (?:keep going|keep trying|don't give up|continue despite))\b/gi },
  { label: "calm-seeking", pattern: /\b(i (?:feel calmer|feel better|find peace|stay calm|slow down))\b/gi },
];

const MOOD_PATTERNS = {
  happy: ["happy", "joy", "joyful", "good", "grateful", "content"],
  sad: ["sad", "down", "low", "blue", "unhappy", "tearful"],
  stressed: ["stressed", "stress", "pressure", "overwhelmed", "burnout"],
  anxious: ["anxious", "anxiety", "panic", "worry", "nervous"],
  calm: ["calm", "peace", "relaxed", "serene"],
  angry: ["angry", "mad", "frustrated", "irritated", "annoyed"],
};

const MEMORY_ITEM_LIMIT = 8;
const SUMMARY_CHAR_LIMIT = 1200;
const CONTEXT_CHAR_LIMIT = 2400;
const MESSAGE_CHAR_BUDGET = 4200;

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(items) {
  return [...new Set(items.filter(Boolean).map((item) => normalizeText(item)))].slice(0, MEMORY_ITEM_LIMIT);
}

function extractMatches(text, dictionary) {
  const source = normalizeText(text).toLowerCase();
  const matches = new Set();
  for (const [label, phrases] of Object.entries(dictionary)) {
    if (phrases.some((phrase) => source.includes(phrase))) {
      matches.add(label.replace(/([A-Z])/g, " $1").trim().toLowerCase());
    }
  }
  return Array.from(matches);
}

function extractStrengths(text) {
  const source = normalizeText(text);
  const strengths = new Set();
  for (const { label, pattern } of STRENGTH_PATTERNS) {
    if (pattern.test(source)) {
      strengths.add(label);
    }
  }
  return Array.from(strengths);
}

function buildMoodTrendLines(journals) {
  if (!journals || journals.length === 0) return [];
  const raw = journals.map((journal) => journal.mood).filter(Boolean);
  const counts = raw.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  const lines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => `${mood} appears ${count} time${count > 1 ? "s" : ""}`);

  if (journals.length >= 8) {
    const recent = journals.slice(0, 7).map((journal) => journal.mood).filter(Boolean);
    const older = journals.slice(7, 30).map((journal) => journal.mood).filter(Boolean);
    const recentCounts = recent.reduce((acc, mood) => { acc[mood] = (acc[mood] || 0) + 1; return acc; }, {});
    for (const mood of Object.keys(MOOD_PATTERNS)) {
      const recentCount = recentCounts[mood] || 0;
      const olderCount = older.filter((m) => m === mood).length;
      if (recentCount > olderCount + 1) {
        lines.push(`${mood} is trending upward`);
      } else if (olderCount > recentCount + 1) {
        lines.push(`${mood} appears to be easing`);
      }
    }
  }

  return uniqueStrings(lines).slice(0, 4);
}

function buildJournalSummary(journals) {
  if (!journals || journals.length === 0) return "No recent journal entries available.";
  const top = journals.slice(0, 3).map((journal) => {
    const content = normalizeText(journal.content);
    return `(${journal.mood}) ${journal.title}: ${content.length > 120 ? `${content.slice(0, 120).trim()}...` : content}`;
  });
  return top.join(" \n");
}

function buildUserProfileLine(user) {
  const profile = [];
  if (Array.isArray(user.personalization?.interests) && user.personalization.interests.length) {
    profile.push(`enjoys ${user.personalization.interests.join(", ")}`);
  }
  if (Array.isArray(user.personalization?.preferredActivities) && user.personalization.preferredActivities.length) {
    profile.push(`prefers ${user.personalization.preferredActivities.join(", ")}`);
  }
  if (user.personalization?.age) profile.push(`age ${user.personalization.age}`);
  if (user.personalization?.gender) profile.push(`gender ${user.personalization.gender}`);
  return profile.length ? profile.join("; ") : "No profile details available yet.";
}

function buildUserContext(user, journals, messages) {
  const memory = user.memory || {};
  const profileLine = buildUserProfileLine(user);
  const moodTrends = memory.moodPatterns && memory.moodPatterns.length ? memory.moodPatterns : buildMoodTrendLines(journals);
  const recentJournalSummary = memory.conversationSummary || buildJournalSummary(journals);

  const lines = [
    "User Profile:",
    `- ${profileLine}`,
  ];

  if (Array.isArray(memory.favoriteActivities) && memory.favoriteActivities.length) {
    lines.push(`Favorite Activities: ${memory.favoriteActivities.join(", ")}`);
  }
  if (Array.isArray(memory.recurringIssues) && memory.recurringIssues.length) {
    lines.push(`Recurring Issues: ${memory.recurringIssues.join(", ")}`);
  }
  if (Array.isArray(memory.strengths) && memory.strengths.length) {
    lines.push(`Strengths: ${memory.strengths.join(", ")}`);
  }
  if (Array.isArray(memory.copingMechanisms) && memory.copingMechanisms.length) {
    lines.push(`Coping Mechanisms: ${memory.copingMechanisms.join(", ")}`);
  }
  if (moodTrends.length) {
    lines.push(`Mood Trends: ${moodTrends.join("; ")}`);
  }
  if (recentJournalSummary) {
    lines.push("Recent Journal Summary:");
    lines.push(recentJournalSummary);
  }

  return truncateText(lines.join("\n"), CONTEXT_CHAR_LIMIT);
}

function extractMoodTag(messages, journals) {
  const source = normalizeText(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .concat(journals.map((journal) => `${journal.title} ${journal.content}`))
      .join(" ")
  ).toLowerCase();
  const moodMatches = extractMatches(source, MOOD_PATTERNS);
  return moodMatches.length ? moodMatches[0] : "neutral";
}

function buildConversationSummary(user, journals, messages, moodAnalytics = {}) {
  const combinedText = normalizeText(
    messages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join(" ") + " " + journals.map((journal) => `${journal.title} ${journal.content}`).join(" ")
  );

  const recurringIssues = uniqueStrings([...(user.memory?.recurringIssues || []), ...extractMatches(combinedText, ISSUE_KEYWORDS)]);
  const favoriteActivities = uniqueStrings([
    ...(user.memory?.favoriteActivities || []),
    ...extractMatches(combinedText, ACTIVITY_KEYWORDS),
    ...(user.personalization?.preferredActivities || []),
  ]);
  const strengths = uniqueStrings([...(user.memory?.strengths || []), ...extractStrengths(combinedText)]);
  const copingMechanisms = uniqueStrings([...(user.memory?.copingMechanisms || []), ...extractMatches(combinedText, COPING_KEYWORDS)]);
  const moodPatterns = uniqueStrings([...(user.memory?.moodPatterns || []), ...buildMoodTrendLines(journals)]);

  const journalSummary = buildJournalSummary(journals);
  const moodTag = extractMoodTag(messages, journals);
  const dominantMood = moodAnalytics?.dominantMood || moodTag || "neutral";
  const moodTrend = moodAnalytics?.trend?.direction || "stable";
  const recentConversation = messages
    .slice(-6)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${normalizeText(message.content)}`)
    .join(" \n");

  const summary = truncateText(
    `User Profile: ${buildUserProfileLine(user)}\nDominant Mood: ${dominantMood}\nMood Trend: ${moodTrend}\nMood Patterns: ${moodPatterns.join(", ")}\nRecurring Issues: ${recurringIssues.join(", ") || "none identified yet"}\nRecent Journal Summary:\n${journalSummary}\nRecent Conversation:\n${recentConversation}`,
    SUMMARY_CHAR_LIMIT
  );

  const topics = uniqueStrings([...recurringIssues, ...favoriteActivities, ...strengths]).slice(0, 8);

  return {
    summary,
    recurringIssues,
    favoriteActivities,
    strengths,
    copingMechanisms,
    moodPatterns,
    moodTag,
    dominantMood,
    moodTrend,
    topics,
  };
}

function truncateText(value, max) {
  const text = normalizeText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trim()}...`;
}

function estimateCharCount(value) {
  return normalizeText(value).length;
}

function truncateMessages(messages, maxChars, extraContext = "") {
  const reversed = [...messages].reverse();
  const selected = [];
  let total = estimateCharCount(extraContext);
  for (const message of reversed) {
    const messageText = `${message.role}: ${normalizeText(message.content)}`;
    const messageLength = estimateCharCount(messageText) + 1;
    if (total + messageLength > maxChars) break;
    selected.unshift(message);
    total += messageLength;
  }
  return selected.length ? selected : messages.slice(-4);
}

async function refreshUserMemory(user, summaryData) {
  if (!user.memory) {
    user.memory = {};
  }

  user.memory.recurringIssues = uniqueStrings([...(user.memory.recurringIssues || []), ...summaryData.recurringIssues]);
  user.memory.strengths = uniqueStrings([...(user.memory.strengths || []), ...summaryData.strengths]);
  user.memory.favoriteActivities = uniqueStrings([...(user.memory.favoriteActivities || []), ...summaryData.favoriteActivities]);
  user.memory.copingMechanisms = uniqueStrings([...(user.memory.copingMechanisms || []), ...summaryData.copingMechanisms]);
  user.memory.moodPatterns = uniqueStrings([...(user.memory.moodPatterns || []), ...summaryData.moodPatterns]);
  user.memory.conversationSummary = summaryData.summary;
  user.memory.summaryUpdatedAt = new Date();

  await user.save();
  return user;
}

function buildGeminiContext(user, journals, chatHistory = [], moodAnalytics = {}) {
  const interests = uniqueStrings(user.personalization?.interests || []);
  const preferredGenres = uniqueStrings([
    ...(user.personalization?.favoriteGenres?.movies || []),
    ...(user.personalization?.favoriteGenres?.music || []),
  ]);
  const stressReliefPreferences = uniqueStrings(user.personalization?.stressReliefPreferences || []);
  const dominantMood = moodAnalytics.dominantMood || "neutral";
  const moodTrend = moodAnalytics?.trend?.direction || "stable";
  const moodBreakdown = moodAnalytics?.moodBreakdown || {};

  const recentJournalEntries = (journals || [])
    .slice(0, 5)
    .map((entry) => ({
      title: normalizeText(entry.title || "Untitled"),
      mood: normalizeText(entry.mood || "neutral"),
      content: normalizeText(entry.content || ""),
      createdAt: entry.createdAt,
    }));

  const previousConversationHistory = (chatHistory || [])
    .map((record) => `User: ${normalizeText(record.userMessage)}\nAssistant: ${normalizeText(record.assistantResponse)}`)
    .join("\n\n");

  return {
    interests,
    preferredGenres,
    stressReliefPreferences,
    dominantMood,
    moodTrend,
    moodBreakdown,
    recentJournalEntries,
    previousConversationHistory,
  };
}

async function loadRecentJournals(userId, limit = 10) {
  return Journal.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = {
  buildUserContext,
  buildConversationSummary,
  buildGeminiContext,
  refreshUserMemory,
  truncateMessages,
  loadRecentJournals,
};
