const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    genres: { type: [String], default: [] },
    moods: { type: [String], default: [] },
    ageRating: {
      type: String,
      enum: ["G", "PG", "PG-13", "R", "TV-14", "TV-MA", "NR"],
      default: "PG",
    },
    description: { type: String, required: true, trim: true },
    poster: { type: String, trim: true, default: "" },
    streamingPlatforms: { type: [String], default: [] },
    // Fields filled for movies fetched from Watchmode
    source: { type: String, enum: ["seed", "watchmode"], default: "seed" },
    watchmodeId: { type: Number },
    year: { type: Number },
    rating: { type: Number },
    watchUrl: { type: String, trim: true, default: "" },
    trailerUrl: { type: String, trim: true },
    trailerThumbnail: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

movieSchema.index({ watchmodeId: 1 }, { unique: true, sparse: true });
movieSchema.index({ source: 1, moods: 1, updatedAt: -1 });

module.exports = mongoose.model("Movie", movieSchema);
