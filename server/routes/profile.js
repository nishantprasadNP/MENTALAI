const express = require("express");
const auth = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  completeOnboarding,
} = require("../controllers/profileController");

const router = express.Router();

router.get("/", auth, getProfile);
router.put("/", auth, updateProfile);
router.post("/onboarding", auth, completeOnboarding);

module.exports = router;
