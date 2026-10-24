const mongoose = require("mongoose");

// iTunes search results per search term, kept so server restarts don't mean slow music loads
const musicSearchCacheSchema = new mongoose.Schema(
  {
    term: { type: String, required: true, unique: true, trim: true },
    results: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MusicSearchCache", musicSearchCacheSchema);
