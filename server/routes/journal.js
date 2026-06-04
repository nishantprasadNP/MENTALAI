const express = require("express");
const Journal = require("../models/Journal");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/journal — get all entries for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/journal — create a new entry
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, mood } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "Title and content are required" });

    const entry = await Journal.create({
      userId: req.user.id,
      title,
      content,
      mood: mood || "neutral",
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/journal/:id — delete an entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const entry = await Journal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await entry.deleteOne();
    res.json({ message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
