const mongoose = require("mongoose");

const recommendationHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemType: {
      type: String,
      required: true,
      enum: ["game", "activity", "video", "movie", "journalPrompt", "music"],
    },
    itemId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

recommendationHistorySchema.index({ userId: 1, itemType: 1, itemId: 1 }, { unique: false });

module.exports = mongoose.model("RecommendationHistory", recommendationHistorySchema);
