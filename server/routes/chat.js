const express = require("express");
const auth = require("../middleware/auth");
const { matchRule, getFallback, getThinkingTime } = require("../utils/chatRules");
const User = require("../models/User");
const ChatHistory = require("../models/ChatHistory");
const { getMoodAnalytics } = require("../utils/moodAnalytics");
const {
  buildUserContext,
  buildConversationSummary,
  buildGeminiContext,
  refreshUserMemory,
  truncateMessages,
  loadRecentJournals,
} = require("../utils/memoryService");
const { generateMentalAIResponse } = require("../services/geminiService");

const router = express.Router();
const MESSAGE_CHAR_BUDGET = 4200;

// POST /api/chat
router.post("/", auth, async (req, res) => {
  try {
    const { messages, sessionId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const journalEntries = await loadRecentJournals(user._id, 12);
    const moodAnalytics = await getMoodAnalytics(user._id);
    const chatHistoryRecords = await ChatHistory.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();
    const recentChatHistory = chatHistoryRecords.reverse();

    const summaryData = buildConversationSummary(user, journalEntries, messages, moodAnalytics);
    const userContext = buildUserContext(user, journalEntries, messages);
    const geminiContext = buildGeminiContext(user, journalEntries, recentChatHistory, moodAnalytics);
    const safeMessages = truncateMessages(messages, MESSAGE_CHAR_BUDGET, summaryData.summary);
    const lastUserMessage = safeMessages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";

    let reply = null;

    console.info("Chat request received", {
      userId: req.user.id,
      sessionId: sessionId || null,
      messageCount: messages.length,
      lastUserMessageLength: lastUserMessage.length,
      moodAnalytics: {
        dominantMood: moodAnalytics?.dominantMood,
        trend: moodAnalytics?.trend?.direction,
      },
    });

    // 1. Try rule-based engine first
    const ruleMatch = matchRule(lastUserMessage);
    if (ruleMatch) {
      reply = ruleMatch.response;
    }

    // 2. If no rule matched, try Gemini
    if (!reply && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      try {
        reply = await generateMentalAIResponse(lastUserMessage, geminiContext);
      } catch (err) {
        console.error("Gemini error:", err.message);
      }
    }

    // 3. Fallback to generic supportive response
    if (!reply) {
      reply = getFallback();
    }

    await refreshUserMemory(user, summaryData);
    await ChatHistory.create({
      userId: user._id,
      sessionId: sessionId || null,
      userMessage: lastUserMessage,
      assistantResponse: reply,
      moodTag: summaryData.moodTag,
      topics: summaryData.topics,
    });

    const thinkingTime = getThinkingTime(reply);
    res.json({ reply, thinkingTime, memorySnapshot: summaryData.summary });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
