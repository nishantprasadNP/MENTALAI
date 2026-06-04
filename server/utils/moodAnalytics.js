const mongoose = require("mongoose");
const Journal = require("../models/Journal");

const MOOD_LIST = ["happy", "sad", "stressed", "anxious", "calm", "angry", "neutral"];
const MOOD_SCORES = {
  happy: 5,
  calm: 4,
  neutral: 3,
  stressed: 2,
  anxious: 1.5,
  angry: 1.5,
  sad: 1,
};

function normalizeCounts(rows) {
  const counts = MOOD_LIST.reduce((acc, mood) => {
    acc[mood] = 0;
    return acc;
  }, {});
  for (const row of rows) {
    if (MOOD_LIST.includes(row._id)) {
      counts[row._id] = row.count;
    }
  }
  return counts;
}

function buildPercentage(counts) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const percentages = {};
  for (const mood of MOOD_LIST) {
    percentages[mood] = total ? Number(((counts[mood] / total) * 100).toFixed(1)) : 0;
  }
  return { counts, total, percentages };
}

function getDominantMood(counts) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length && sorted[0][1] > 0 ? sorted[0][0] : "neutral";
}

function getMoodScore(counts) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (!total) return 0;
  const weighted = Object.entries(counts).reduce(
    (sum, [mood, count]) => sum + count * (MOOD_SCORES[mood] || 3),
    0
  );
  return Number((weighted / total).toFixed(2));
}

function moodLabel(score) {
  if (score >= 4.5) return "Very positive";
  if (score >= 3.5) return "Positive";
  if (score >= 2.5) return "Neutral";
  if (score >= 1.8) return "Challenged";
  return "Struggling";
}

function calculateTrend(currentScore, previousScore) {
  if (!currentScore && !previousScore) {
    return { direction: "stable", scoreChange: 0, message: "Not enough mood data to determine a trend." };
  }
  const delta = Number((currentScore - previousScore).toFixed(2));
  if (Math.abs(delta) < 0.2) {
    return {
      direction: "stable",
      scoreChange: delta,
      message: "Your mood has been relatively stable compared to the previous week.",
    };
  }
  if (delta > 0) {
    return {
      direction: "improving",
      scoreChange: delta,
      message: "Your mood is improving compared to the previous week.",
    };
  }
  return {
    direction: "declining",
    scoreChange: delta,
    message: "Your mood is showing a decline compared to the previous week.",
  };
}

function buildRecommendations(breakdown, trend) {
  const recommendations = new Set();
  const anxiety = breakdown.last7.percentages.anxious;
  const stress = breakdown.last7.percentages.stressed;
  const sadness = breakdown.last7.percentages.sad;
  const anger = breakdown.last7.percentages.angry;
  const calm = breakdown.last7.percentages.calm;
  const happy = breakdown.last7.percentages.happy;

  if (anxiety >= 12 || trend.direction === "declining") {
    recommendations.add("Try a guided breathing exercise");
    recommendations.add("Spend a few minutes in meditation or mindfulness");
  }
  if (stress >= 12 || anxiety >= 10) {
    recommendations.add("Use the Zen Typing game to unwind");
    recommendations.add("Write a short journal entry about what is stressing you");
  }
  if (sadness >= 12) {
    recommendations.add("Try a gratitude exercise to shift your focus");
    recommendations.add("Open a supportive chat conversation");
  }
  if (anger >= 10) {
    recommendations.add("Take a calming breathing break");
    recommendations.add("Write down how you are feeling in your journal");
  }
  if (calm >= 30 || happy >= 25) {
    recommendations.add("Keep up the positive habits that are working for you");
  }
  if (!recommendations.size) {
    recommendations.add("Check in with your journal regularly to notice patterns");
    recommendations.add("Try a mindful breathing or creativity activity today");
  }

  return Array.from(recommendations);
}

function countRows(rows) {
  return normalizeCounts(rows);
}

exports.getMoodAnalytics = async function (userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const last7Start = new Date(now);
  last7Start.setDate(last7Start.getDate() - 7);
  const prev7Start = new Date(now);
  prev7Start.setDate(prev7Start.getDate() - 14);
  const last30Start = new Date(now);
  last30Start.setDate(last30Start.getDate() - 30);

  const aggregation = await Journal.aggregate([
    {
      $match: {
        userId: userObjectId,
        mood: { $in: MOOD_LIST },
      },
    },
    {
      $facet: {
        last7: [
          { $match: { createdAt: { $gte: last7Start } } },
          { $group: { _id: "$mood", count: { $sum: 1 } } },
        ],
        prev7: [
          { $match: { createdAt: { $gte: prev7Start, $lt: last7Start } } },
          { $group: { _id: "$mood", count: { $sum: 1 } } },
        ],
        last30: [
          { $match: { createdAt: { $gte: last30Start } } },
          { $group: { _id: "$mood", count: { $sum: 1 } } },
        ],
        allTime: [{ $group: { _id: "$mood", count: { $sum: 1 } } }],
        recentWeeks: [
          {
            $group: {
              _id: {
                year: { $isoWeekYear: "$createdAt" },
                week: { $isoWeek: "$createdAt" },
              },
              averageScore: {
                $avg: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$mood", "happy"] }, then: 5 },
                      { case: { $eq: ["$mood", "calm"] }, then: 4 },
                      { case: { $eq: ["$mood", "neutral"] }, then: 3 },
                      { case: { $eq: ["$mood", "stressed"] }, then: 2 },
                      { case: { $eq: ["$mood", "anxious"] }, then: 1.5 },
                      { case: { $eq: ["$mood", "angry"] }, then: 1.5 },
                      { case: { $eq: ["$mood", "sad"] }, then: 1 },
                    ],
                    default: 3,
                  },
                },
              },
            },
          },
          { $sort: { "_id.year": -1, "_id.week": -1 } },
          { $limit: 4 },
        ],
      },
    },
  ]);

  const faceted = aggregation[0] || {};
  const last7Counts = countRows(faceted.last7 || []);
  const prev7Counts = countRows(faceted.prev7 || []);
  const last30Counts = countRows(faceted.last30 || []);
  const allTimeCounts = countRows(faceted.allTime || []);

  const last7Breakdown = buildPercentage(last7Counts);
  const last30Breakdown = buildPercentage(last30Counts);
  const allTimeBreakdown = buildPercentage(allTimeCounts);
  const last7Score = getMoodScore(last7Counts);
  const prev7Score = getMoodScore(prev7Counts);
  const averageWeeklyMoodScore = faceted.recentWeeks?.length
    ? Number(
        (
          faceted.recentWeeks.reduce((sum, week) => sum + week.averageScore, 0) /
          faceted.recentWeeks.length
        ).toFixed(2)
      )
    : last7Score;

  const averageWeeklyMood = {
    score: averageWeeklyMoodScore,
    label: moodLabel(averageWeeklyMoodScore),
  };

  const trend = calculateTrend(last7Score, prev7Score);
  const dominantMood = getDominantMood(last30Counts);
  const recommendations = buildRecommendations({ last7: last7Breakdown, last30: last30Breakdown, allTime: allTimeBreakdown }, trend);

  return {
    dominantMood,
    moodBreakdown: {
      last7: last7Breakdown,
      last30: last30Breakdown,
      allTime: allTimeBreakdown,
      averageWeeklyMood,
    },
    trend,
    recommendations,
  };
};
