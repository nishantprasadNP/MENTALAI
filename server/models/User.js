const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    personalization: {
      age: { type: Number, min: 0 },
      gender: { type: String, trim: true },
      interests: { type: [String], default: [] },
      favoriteGenres: {
        movies: { type: [String], default: [] },
        music: { type: [String], default: [] },
      },
      preferredActivities: { type: [String], default: [] },
      wellnessGoals: { type: [String], default: [] },
      stressReliefPreferences: { type: [String], default: [] },
      onboardingAnswers: {
        type: Map,
        of: String,
        default: {},
      },
    },
    onboardingCompleted: { type: Boolean, default: false },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
    memory: {
      recurringIssues: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      favoriteActivities: { type: [String], default: [] },
      moodPatterns: { type: [String], default: [] },
      copingMechanisms: { type: [String], default: [] },
      conversationSummary: { type: String, default: "" },
      summaryUpdatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
