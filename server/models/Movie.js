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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
