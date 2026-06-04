const express = require("express");
const auth = require("../middleware/auth");
const {
  recordGameEvent,
  recordChatEvent,
  getEngagementHistory,
} = require("../controllers/engagementController");

const router = express.Router();

router.post("/game", auth, recordGameEvent);
router.post("/chat", auth, recordChatEvent);
router.get("/history", auth, getEngagementHistory);

module.exports = router;
