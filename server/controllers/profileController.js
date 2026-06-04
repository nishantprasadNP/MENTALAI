const User = require("../models/User");

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== "").map((item) => String(item).trim());
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function buildPersonalization(body) {
  const personalization = {};
  if (body.age !== undefined && body.age !== null && body.age !== "") {
    personalization.age = typeof body.age === "number" ? body.age : Number(body.age);
  }
  if (body.gender !== undefined) {
    personalization.gender = body.gender ? String(body.gender).trim() : "";
  }
  if (body.interests !== undefined) {
    personalization.interests = normalizeStringArray(body.interests);
  }
  if (body.preferredActivities !== undefined) {
    personalization.preferredActivities = normalizeStringArray(body.preferredActivities);
  }
  if (body.wellnessGoals !== undefined) {
    personalization.wellnessGoals = normalizeStringArray(body.wellnessGoals);
  }
  if (body.stressReliefPreferences !== undefined) {
    personalization.stressReliefPreferences = normalizeStringArray(body.stressReliefPreferences);
  }
  if (body.favoriteGenres !== undefined) {
    personalization.favoriteGenres = {
      movies: normalizeStringArray(body.favoriteGenres.movies),
      music: normalizeStringArray(body.favoriteGenres.music),
    };
  }
  if (body.onboardingAnswers !== undefined) {
    personalization.onboardingAnswers = body.onboardingAnswers;
  }
  return personalization;
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email streak onboardingCompleted personalization"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      streak: user.streak,
      onboardingCompleted: user.onboardingCompleted,
      personalization: user.personalization || {},
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const personalization = buildPersonalization(req.body.personalization || req.body);
    const updateFields = {};
    if (Object.keys(personalization).length > 0) {
      updateFields.personalization = personalization;
    }
    if (typeof req.body.onboardingCompleted === "boolean") {
      updateFields.onboardingCompleted = req.body.onboardingCompleted;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No profile fields provided" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("name email streak onboardingCompleted personalization");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const personalization = buildPersonalization(req.body);
    if (!personalization.age || !personalization.interests.length || !personalization.wellnessGoals.length) {
      return res.status(400).json({
        message: "Age, interests, and wellness goals are required to complete onboarding",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          personalization,
          onboardingCompleted: true,
        },
      },
      { new: true, runValidators: true }
    ).select("name email streak onboardingCompleted personalization");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Onboarding completed successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
