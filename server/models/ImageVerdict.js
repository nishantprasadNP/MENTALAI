const mongoose = require("mongoose");

// Result of the album-cover safety check, stored so each image is only checked once
const imageVerdictSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true, trim: true },
    verdict: { type: String, enum: ["safe", "unsafe"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImageVerdict", imageVerdictSchema);
