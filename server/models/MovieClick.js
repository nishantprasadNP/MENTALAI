const mongoose = require("mongoose");

const movieClickSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movieId: { type: String, required: true, trim: true },
    movieTitle: { type: String, required: true, trim: true },
    platform: { type: String, trim: true, default: "" },
    moodTag: { type: String, trim: true, default: "" },
    sessionId: { type: String, default: null },
  },
  { timestamps: true }
);

movieClickSchema.index({ userId: 1, movieId: 1 });

module.exports = mongoose.model("MovieClick", movieClickSchema);
