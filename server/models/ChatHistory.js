const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, default: null },
    userMessage: { type: String, trim: true, default: "" },
    assistantResponse: { type: String, trim: true, default: "" },
    moodTag: {
      type: String,
      trim: true,
      enum: ["happy", "sad", "stressed", "anxious", "calm", "angry", "neutral", ""],
      default: "",
    },
    topics: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
