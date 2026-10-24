const User = require("../models/User");
const Journal = require("../models/Journal");
const ChatHistory = require("../models/ChatHistory");
const { recommendMusic, sanitizeMood } = require("../services/musicService");

// The mood comes from the user's own entries: their latest journal entry, or, if they
// haven't journaled yet, the mood detected in their most recent chat.
async function detectUserMood(userId) {
  const latestJournal = await Journal.findOne({ userId }).sort({ createdAt: -1 }).lean();
  if (latestJournal?.mood) return { mood: latestJournal.mood, moodSource: "journal" };

  const latestChat = await ChatHistory.findOne({ userId, moodTag: { $nin: ["", null] } })
    .sort({ createdAt: -1 })
    .lean();
  if (latestChat?.moodTag) return { mood: latestChat.moodTag, moodSource: "chat" };

  return { mood: "neutral", moodSource: "default" };
}

// GET /api/recommendations/music?limit=
exports.getMusicRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const { mood, moodSource } = await detectUserMood(user._id);
    const limit = Math.min(Number(req.query.limit) || 12, 30);
    const favoriteGenres = user.personalization?.favoriteGenres?.music || [];
    const result = await recommendMusic({ mood: sanitizeMood(mood), favoriteGenres, limit });

    if (moodSource === "default") {
      result.summary = "Here's some easygoing music to start with.";
    }

    console.info("Music recommendations served", { userId: req.user.id, mood: result.mood, moodSource, count: result.songs.length });
    res.json({ ...result, moodSource });
  } catch (err) {
    console.error("Music recommendation error:", err);
    res.status(500).json({ message: "Unable to fetch music recommendations", error: err.message });
  }
};
