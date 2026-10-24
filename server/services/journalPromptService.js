// Writes personal journal prompts with Gemini from the user's recent journal entries, and in
// the same request picks the activities and wellness videos that fit what the user wrote.
// Prompts are generated in the background when a journal entry is saved and stored per
// user, so the Dashboard never waits on Gemini (and doesn't spend Gemini requests,
// shared with the chatbot, on every visit).
const { GoogleGenerativeAI } = require("@google/generative-ai");
const JournalPromptCache = require("../models/JournalPromptCache");
const Journal = require("../models/Journal");
const WELLNESS_VIDEOS = require("../utils/wellnessVideos.json");

const MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 30000;
const ENTRIES_TO_USE = 5;
const PROMPT_COUNT = 3;

function isConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== "your_gemini_api_key_here");
}

function describeEntry(entry) {
  const content = String(entry.content || "").replace(/\s+/g, " ").trim().slice(0, 600);
  return `[mood: ${entry.mood || "unknown"}] ${entry.title || "Untitled"}: ${content || "(no text)"}`;
}

function describeEntries(journals) {
  const [latest, ...earlier] = journals.slice(0, ENTRIES_TO_USE);
  return [
    "MOST RECENT ENTRY (base the prompts and picks on this):",
    describeEntry(latest),
    "",
    "Earlier entries (background only; do not focus on them unless the latest entry continues the same topic):",
    earlier.length ? earlier.map((entry, i) => `${i + 1}. ${describeEntry(entry)}`).join("\n") : "(none)",
  ].join("\n");
}

function describeCatalog(items) {
  return items.map((item) => `- ${item.id}: ${item.title} (moods: ${(item.moodTags || []).join(", ")})`).join("\n");
}

async function generateForEntries(journals) {
  // Required here, not at the top, because RecommendationService also requires this file
  const activities = require("../utils/RecommendationService").getActivityCatalog();
  const videos = WELLNESS_VIDEOS.map((v) => ({ id: v.id, title: v.title, moodTags: v.moodTags }));

  const instructions = [
    "You personalise a mental wellness app from the user's journal. Focus on the MOST RECENT ENTRY below: what happened,",
    "who they were with, what they did and how they feel. Earlier entries are only background.",
    `1. Write ${PROMPT_COUNT} short, personal journal prompts about the most recent entry, suited to its mood:`,
    "gentle and supportive if they feel low, grounding if anxious or stressed, reflective or celebratory if they feel good.",
    "Each prompt is one question or invitation of at most 20 words, written to the user as 'you'.",
    "Never diagnose, never mention therapy or medication, and never quote the entries word for word.",
    "2. From the ACTIVITIES list, choose the 3 ids that best fit the most recent entry: match the situation, not just the mood",
    "(e.g. someone enjoying time alone suits solo activities; someone celebrating with people suits social ones).",
    "3. From the VIDEOS list, choose the 3 ids that best fit the most recent entry the same way.",
    'Reply with JSON: {"prompts": [3 strings], "activities": [3 ids], "videos": [3 ids]}. Use only ids from the lists.',
    "",
    "ACTIVITIES:",
    describeCatalog(activities),
    "",
    "VIDEOS:",
    describeCatalog(videos),
    "",
    describeEntries(journals),
  ].join("\n");

  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel(
    { model: MODEL, generationConfig: { temperature: 0.8, responseMimeType: "application/json" } },
    { timeout: TIMEOUT_MS }
  );
  const result = await model.generateContent(instructions);
  const data = JSON.parse(result.response.text());
  if (!data || !Array.isArray(data.prompts)) throw new Error("Gemini returned an unexpected format");

  const validIds = (ids, items) => {
    const allowed = new Set(items.map((item) => item.id));
    return [...new Set((Array.isArray(ids) ? ids : []).map(String))].filter((id) => allowed.has(id)).slice(0, 3);
  };
  return {
    prompts: data.prompts.map((prompt) => String(prompt).trim()).filter(Boolean).slice(0, PROMPT_COUNT),
    activityIds: validIds(data.activities, activities),
    videoIds: validIds(data.videos, videos),
  };
}

const inProgress = new Set();

// Regenerates a user's prompts if their latest journal entry is newer than the stored ones.
// Safe to call without awaiting; concurrent calls for the same user are ignored.
async function refreshPersonalJournalPrompts(userId) {
  const key = String(userId);
  if (inProgress.has(key) || !isConfigured()) return;
  inProgress.add(key);
  try {
    const journals = await Journal.find({ userId }).sort({ createdAt: -1 }).limit(ENTRIES_TO_USE).lean();
    if (!journals.length) return;
    const cached = await JournalPromptCache.findOne({ userId }).lean();
    if (cached && String(cached.latestJournalId) === String(journals[0]._id) && Array.isArray(cached.activityIds)) return;

    let generated;
    try {
      generated = await generateForEntries(journals);
    } catch (err) {
      console.warn("Journal prompt generation failed, retrying once:", err.message.slice(0, 120));
      generated = await generateForEntries(journals);
    }
    if (generated.prompts.length) {
      await JournalPromptCache.updateOne(
        { userId },
        { $set: { latestJournalId: journals[0]._id, ...generated } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("Journal prompt generation failed:", err.message.slice(0, 200));
  } finally {
    inProgress.delete(key);
  }
}

// Returns { prompts, pending, activityIds, videoIds } for the Dashboard without waiting on Gemini.
// `prompts` is null if the user has none yet (callers then show the static prompts); `pending`
// is true while new prompts and picks for the latest journal entry are still being written.
// activityIds/videoIds are only returned when they belong to the latest entry.
async function getPersonalJournalPrompts(userId, journals = []) {
  const latest = journals[0];
  if (!latest) return { prompts: null, pending: false, activityIds: [], videoIds: [] };

  const cached = await JournalPromptCache.findOne({ userId }).lean();
  // Prompts saved before picks existed have no activityIds and are regenerated once
  const stale = !cached || String(cached.latestJournalId) !== String(latest._id) || !Array.isArray(cached.activityIds);
  const pending = isConfigured() && stale;
  if (pending) refreshPersonalJournalPrompts(userId);

  // Older prompts are better than none while new ones are being written
  const isCurrent = !stale;
  const picks = { activityIds: isCurrent ? cached.activityIds || [] : [], videoIds: isCurrent ? cached.videoIds || [] : [] };
  if (!cached?.prompts?.length) return { prompts: null, pending, ...picks };
  const prompts = cached.prompts.map((title, i) => ({
    id: `personal_prompt_${i + 1}`,
    title,
    type: "journalPrompt",
    categories: ["reflection"],
    genres: [],
    moodTags: [latest.mood].filter(Boolean),
    interests: ["Journaling"],
    explanation: "Written for you from your recent journal entries.",
    sourceUrl: null,
  }));
  return { prompts, pending, ...picks };
}

module.exports = { getPersonalJournalPrompts, refreshPersonalJournalPrompts };
