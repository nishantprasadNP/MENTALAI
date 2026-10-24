const mongoose = require("mongoose");

// Gemini-written journal prompts and content-based activity/video picks for a user,
// reused until they write a new journal entry
const journalPromptCacheSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    latestJournalId: { type: mongoose.Schema.Types.ObjectId, required: true },
    prompts: { type: [String], default: [] },
    activityIds: { type: [String], default: [] },
    videoIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JournalPromptCache", journalPromptCacheSchema);
