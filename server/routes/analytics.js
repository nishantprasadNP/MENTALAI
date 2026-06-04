const express = require("express");
const auth = require("../middleware/auth");
const { getMoodAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/mood", auth, getMoodAnalytics);

module.exports = router;
