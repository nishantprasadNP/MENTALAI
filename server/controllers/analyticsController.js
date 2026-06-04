const { getMoodAnalytics } = require("../utils/moodAnalytics");

exports.getMoodAnalytics = async (req, res) => {
  try {
    const analytics = await getMoodAnalytics(req.user.id);
    res.json(analytics);
  } catch (err) {
    console.error("Mood analytics error:", err);
    res.status(500).json({ message: "Could not calculate mood analytics", error: err.message });
  }
};
