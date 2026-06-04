const User = require("../models/User");
const Journal = require("../models/Journal");
const MovieClick = require("../models/MovieClick");
const { recommendMovies } = require("../utils/movieRecommendationService");

exports.getMovieRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const journals = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(12).lean();
    const limit = Number(req.query.limit) || 10;
    const result = await recommendMovies(user, journals, limit);
    // backward compat: service may return array or { summary, movies }
    let summary = "";
    let movies = [];
    if (Array.isArray(result)) {
      movies = result;
    } else if (result && typeof result === "object") {
      summary = result.summary || "";
      movies = Array.isArray(result.movies) ? result.movies : [];
    }

    console.info("Movie recommendations served", {
      userId: req.user.id,
      limit,
      resultCount: movies.length,
    });

    res.json({ summary, movies });
  } catch (err) {
    console.error("Movie recommendation error:", err);
    res.status(500).json({ message: "Unable to fetch movie recommendations", error: err.message });
  }
};

exports.trackMovieClick = async (req, res) => {
  try {
    const { movieId, movieTitle, platform, moodTag, sessionId } = req.body;
    if (!movieId || !movieTitle) {
      return res.status(400).json({ message: "movieId and movieTitle are required" });
    }

    await MovieClick.create({
      userId: req.user.id,
      movieId: String(movieId),
      movieTitle,
      platform: platform || "",
      moodTag: moodTag || "",
      sessionId: sessionId || null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Movie click tracking error:", err);
    res.status(500).json({ message: "Unable to record movie click", error: err.message });
  }
};
