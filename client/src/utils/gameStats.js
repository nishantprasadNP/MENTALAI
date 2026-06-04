export function getStats() {
  try {
    return JSON.parse(localStorage.getItem("gameStats") || "{}");
  } catch {
    return {};
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem("gameStats", JSON.stringify(stats));
  } catch {}
}

export function addXP(amount, gameId, extra = {}) {
  const stats = getStats();
  stats.totalXP = (stats.totalXP || 0) + amount;
  stats.totalGamesPlayed = (stats.totalGamesPlayed || 0) + 1;
  stats.gameCounts = { ...(stats.gameCounts || {}), [gameId]: ((stats.gameCounts || {})[gameId] || 0) + 1 };
  stats.achievements = stats.achievements || [];
  stats.highScores = stats.highScores || {};

  if (!stats.achievements.includes("first_game")) stats.achievements.push("first_game");
  if (stats.totalXP >= 500 && !stats.achievements.includes("xp_500")) stats.achievements.push("xp_500");
  if (stats.totalXP >= 1000 && !stats.achievements.includes("xp_1000")) stats.achievements.push("xp_1000");

  if (gameId === "breathing") {
    const n = (stats.breathingSessions || 0) + 1;
    stats.breathingSessions = n;
    if (n >= 5 && !stats.achievements.includes("breathing_5")) stats.achievements.push("breathing_5");
    if (n >= 20 && !stats.achievements.includes("breathing_20")) stats.achievements.push("breathing_20");
  }

  if (gameId === "memory") {
    if (extra.won && !stats.achievements.includes("memory_win")) stats.achievements.push("memory_win");
    if (extra.won && extra.difficulty === "hard" && !stats.achievements.includes("memory_hard")) stats.achievements.push("memory_hard");
    if (extra.score && (!stats.highScores.memory || extra.score > stats.highScores.memory)) {
      stats.highScores.memory = extra.score;
    }
  }

  if (gameId === "typing") {
    if (extra.accuracy === 100 && !stats.achievements.includes("typing_perfect")) stats.achievements.push("typing_perfect");
    if (extra.wpm && (!stats.highScores.typing || extra.wpm > stats.highScores.typing)) {
      stats.highScores.typing = extra.wpm;
    }
  }

  if (gameId === "gratitude") {
    const n = (stats.gratitudeCount || 0) + 1;
    stats.gratitudeCount = n;
    if (n >= 3 && !stats.achievements.includes("gratitude_3")) stats.achievements.push("gratitude_3");
    if (n >= 7 && !stats.achievements.includes("gratitude_7")) stats.achievements.push("gratitude_7");
    if (!stats.highScores.gratitude || n > stats.highScores.gratitude) {
      stats.highScores.gratitude = n;
    }
  }

  if (gameId === "focus") {
    if (extra.score >= 10 && !stats.achievements.includes("focus_10")) stats.achievements.push("focus_10");
    if (extra.score && (!stats.highScores.focus || extra.score > stats.highScores.focus)) {
      stats.highScores.focus = extra.score;
    }
  }

  const today = new Date().toDateString();
  if (extra.isDaily) {
    stats.dailyChallenge = { date: today, completed: true, gameId };
  }

  saveStats(stats);
  return stats;
}

export const LEVEL_TABLE = [
  { level: 1, min: 0, title: "Seedling" },
  { level: 2, min: 100, title: "Sprout" },
  { level: 3, min: 250, title: "Sapling" },
  { level: 4, min: 500, title: "Tree" },
  { level: 5, min: 1000, title: "Forest" },
  { level: 6, min: 2000, title: "Elder" },
  { level: 7, min: 3500, title: "Sage" },
  { level: 8, min: 5000, title: "Enlightened" },
];

export function getLevelInfo(xp) {
  let current = LEVEL_TABLE[0];
  let next = LEVEL_TABLE[1] || null;
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TABLE[i].min) {
      current = LEVEL_TABLE[i];
      next = LEVEL_TABLE[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? Math.round(((xp - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { current, next, progress };
}

export function getDailyChallenge(games) {
  const seed = new Date().toDateString();
  const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return games[hash % games.length].id;
}
