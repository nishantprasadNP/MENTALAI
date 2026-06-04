const User = require("../models/User");
const Journal = require("../models/Journal");
const VideoWatch = require("../models/VideoWatch");
const { recommendVideos } = require("../utils/videoRecommendationService");
const { getMoodAnalytics } = require("../utils/moodAnalytics");

exports.getVideoRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const journals = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(12).lean();
    const moodAnalytics = await getMoodAnalytics(req.user.id);
    const limit = Number(req.query.limit) || 8;

    const overrides = {
      interests: req.query.interests ? req.query.interests.split(",").map((i) => i.trim()).filter(Boolean) : undefined,
      movieGenres: req.query.movieGenres ? req.query.movieGenres.split(",").map((i) => i.trim()).filter(Boolean) : undefined,
      musicGenres: req.query.musicGenres ? req.query.musicGenres.split(",").map((i) => i.trim()).filter(Boolean) : undefined,
      stressPreferences: req.query.stressPreferences ? req.query.stressPreferences.split(",").map((i) => i.trim()).filter(Boolean) : undefined,
    };

    const videos = await recommendVideos({
      user,
      journals,
      moodAnalytics,
      overrides,
      limit,
    });

    const watchedRecords = await VideoWatch.find({ userId: req.user.id }).lean();
    const watchedIds = Array.isArray(watchedRecords) ? watchedRecords.map((r) => String(r.videoId)) : [];

    console.info("Video recommendations served", {
      userId: req.user.id,
      limit,
      returned: Array.isArray(videos) ? videos.length : 0,
    });

    res.json({ videos: Array.isArray(videos) ? videos : [], watchedIds });
  } catch (err) {
    console.error("Video recommendation error:", err);
    res.status(500).json({ message: "Unable to fetch video recommendations", error: err.message });
  }
};

exports.recordWatchedVideo = async (req, res) => {
  try {
    const { videoId, title, channelTitle, sourceUrl, moodTag } = req.body;
    if (!videoId || !title) {
      return res.status(400).json({ message: "videoId and title are required" });
    }

    await VideoWatch.findOneAndUpdate(
      { userId: req.user.id, videoId },
      {
        userId: req.user.id,
        videoId,
        title,
        channelTitle: channelTitle || "",
        sourceUrl: sourceUrl || `https://www.youtube.com/watch?v=${videoId}`,
        moodTag: moodTag || "",
        watchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Record watched video error:", err);
    res.status(500).json({ message: "Unable to record watched video", error: err.message });
  }
};
