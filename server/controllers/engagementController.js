const GameHistory = require("../models/GameHistory");
const ChatHistory = require("../models/ChatHistory");

exports.recordGameEvent = async (req, res) => {
  try {
    const { gameId, categories = [], moodTags = [], duration = 0, score = 0, completed = false, playedAt } = req.body;
    if (!gameId) return res.status(400).json({ message: "gameId is required" });

    const record = await GameHistory.create({
      userId: req.user.id,
      gameId,
      categories: Array.isArray(categories) ? categories : [categories],
      moodTags: Array.isArray(moodTags) ? moodTags : [moodTags],
      duration,
      score,
      completed,
      playedAt: playedAt ? new Date(playedAt) : undefined,
    });

    res.status(201).json({ message: "Game event recorded", record });
  } catch (err) {
    console.error("Game event error:", err);
    res.status(500).json({ message: "Unable to record game event", error: err.message });
  }
};

exports.recordChatEvent = async (req, res) => {
  try {
    const { sessionId, userMessage = "", assistantResponse = "", moodTag = "", topics = [] } = req.body;
    const record = await ChatHistory.create({
      userId: req.user.id,
      sessionId,
      userMessage,
      assistantResponse,
      moodTag,
      topics: Array.isArray(topics) ? topics : [topics],
    });

    res.status(201).json({ message: "Chat event recorded", record });
  } catch (err) {
    console.error("Chat event error:", err);
    res.status(500).json({ message: "Unable to record chat event", error: err.message });
  }
};

exports.getEngagementHistory = async (req, res) => {
  try {
    const [games, chats] = await Promise.all([
      GameHistory.find({ userId: req.user.id }).sort({ playedAt: -1 }).limit(50).lean(),
      ChatHistory.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    res.json({ games, chats });
  } catch (err) {
    console.error("Engagement history error:", err);
    res.status(500).json({ message: "Unable to fetch engagement history", error: err.message });
  }
};
