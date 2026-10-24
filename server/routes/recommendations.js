const express = require("express");
const auth = require("../middleware/auth");
const {
  getRecommendations,
  getRecommendationHistory,
  getPublicRecommendations,
  resolveExternal,
} = require("../controllers/recommendationController");
const {
  getMovieRecommendations,
  trackMovieClick,
} = require("../controllers/movieController");
const {
  getVideoRecommendations,
  recordWatchedVideo,
} = require("../controllers/videoRecommendationController");
const { getMusicRecommendations } = require("../controllers/musicController");

const router = express.Router();

router.get("/", auth, getRecommendations);
router.get("/public", getPublicRecommendations);
router.get("/resolve", auth, resolveExternal);
router.get("/history", auth, getRecommendationHistory);
router.get("/movies", auth, getMovieRecommendations);
router.post("/movies/click", auth, trackMovieClick);
router.get("/videos", auth, getVideoRecommendations);
router.get("/music", auth, getMusicRecommendations);
router.post("/videos/watched", auth, recordWatchedVideo);

module.exports = router;
