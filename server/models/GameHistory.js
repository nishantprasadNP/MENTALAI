const mongoose = require("mongoose");

const gameHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gameId: { type: String, required: true },
    categories: { type: [String], default: [] },
    moodTags: { type: [String], default: [] },
    duration: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameHistory", gameHistorySchema);
