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

const router = express.Router();

router.get("/", auth, getRecommendations);
router.get("/public", getPublicRecommendations);
router.get("/resolve", resolveExternal);
router.get("/history", auth, getRecommendationHistory);
router.get("/movies", auth, getMovieRecommendations);
router.post("/movies/click", auth, trackMovieClick);
router.get("/videos", auth, getVideoRecommendations);
router.post("/videos/watched", auth, recordWatchedVideo);

module.exports = router;
