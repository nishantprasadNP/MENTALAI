const mongoose = require("mongoose");

const videoWatchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    channelTitle: { type: String, trim: true, default: "" },
    publishedAt: { type: String, trim: true, default: "" },
    watchedAt: { type: Date, default: Date.now },
    moodTag: { type: String, trim: true, default: "" },
    sourceUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

videoWatchSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model("VideoWatch", videoWatchSchema);
