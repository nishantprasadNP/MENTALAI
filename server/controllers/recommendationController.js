const { buildRecommendations } = require("../utils/RecommendationService");
const RecommendationHistory = require("../models/RecommendationHistory");
const { getPublicCatalog } = require("../utils/RecommendationService");

exports.getRecommendations = async (req, res) => {
  try {
    const fresh = req.query.fresh === '1' || req.query.fresh === 'true';
    const recommendations = await buildRecommendations(req.user.id, { fresh });
    res.json(recommendations);
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ message: "Unable to build recommendations", error: err.message });
  }
};

exports.getRecommendationHistory = async (req, res) => {
  try {
    const history = await RecommendationHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ history });
  } catch (err) {
    console.error("Recommendation history error:", err);
    res.status(500).json({ message: "Unable to fetch recommendation history", error: err.message });
  }
};

exports.getPublicRecommendations = async (req, res) => {
  try {
    const catalog = getPublicCatalog();
    res.json(catalog);
  } catch (err) {
    console.error("Public recommendations error:", err);
    res.status(500).json({ message: "Unable to fetch public recommendations", error: err.message });
  }
};

exports.resolveExternal = async (req, res) => {
  try {
    const q = req.query.q || req.query.qs || req.query.query || req.query.title;
    if (!q) return res.status(400).json({ message: "query parameter 'q' is required" });
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(400).json({ message: "YouTube API key not configured on server" });

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${encodeURIComponent(
      q
    )}&key=${apiKey}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(502).json({ message: "YouTube API error", detail: text });
    }
    const data = await resp.json();
    const item = data.items && data.items[0];
    if (!item) return res.status(404).json({ message: "No video found" });
    const videoId = item.id.videoId;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    res.json({ videoId, watchUrl, snippet: item.snippet });
  } catch (err) {
    console.error("External resolve error:", err);
    res.status(500).json({ message: "Unable to resolve external video", error: err.message });
  }
};
