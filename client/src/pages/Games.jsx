import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getStats, getLevelInfo, getDailyChallenge } from "../utils/gameStats";

const GAMES = [
  {
    id: "breathing",
    title: "Breathing Bubble",
    desc: "Guided box breathing for calm and focus",
    icon: "🫧",
    category: "Mindfulness",
    xpReward: "10 XP per cycle",
    path: "/games/breathing",
    tip: "Reduces anxiety in under 5 minutes",
  },
  // {
  //   id: "memory",
  //   title: "Mood Memory",
  //   desc: "Match emotion cards to sharpen your mind",
  //   icon: "🧠",
  //   category: "Focus",
  //   xpReward: "Up to 50 XP",
  //   path: "/games/memory",
  //   tip: "Improves emotional recognition",
  // },
  {
    id: "typing",
    title: "Zen Typing",
    desc: "Type positive affirmations with calm focus",
    icon: "✍️",
    category: "Focus",
    xpReward: "Up to 30 XP",
    path: "/games/typing",
    tip: "Rewires negative thought patterns",
  },
  // {
  //   id: "gratitude",
  //   title: "Gratitude Jar",
  //   desc: "Fill your jar with daily gratitude",
  //   icon: "🫙",
  //   category: "Mindfulness",
  //   xpReward: "20 XP per entry",
  //   path: "/games/gratitude",
  //   tip: "Boosts happiness by 25%",
  // },
  // {
  //   id: "focus",
  //   title: "Focus Tap",
  //   desc: "Repeat patterns to train your working memory",
  //   icon: "🎯",
  //   category: "Focus",
  //   xpReward: "5 XP per round",
  //   path: "/games/focus",
  //   tip: "Builds concentration and recall",
  // },
];

const ACHIEVEMENTS = [
  { id: "first_game", icon: "🎮", title: "First Steps", desc: "Play your first game" },
  { id: "breathing_5", icon: "🫁", title: "Breathwork Beginner", desc: "Complete 5 breathing cycles" },
  { id: "breathing_20", icon: "🧘", title: "Breath Master", desc: "Complete 20 breathing cycles" },
  { id: "memory_win", icon: "🧠", title: "Sharp Mind", desc: "Win a memory game" },
  { id: "memory_hard", icon: "💎", title: "Memory Wizard", desc: "Win on hard difficulty" },
  { id: "typing_perfect", icon: "✨", title: "Perfect Type", desc: "100% accuracy on an affirmation" },
  { id: "gratitude_3", icon: "🙏", title: "Grateful Heart", desc: "Complete 3 gratitude entries" },
  { id: "gratitude_7", icon: "🌟", title: "Gratitude Streak", desc: "Complete 7 gratitude entries" },
  { id: "focus_10", icon: "🎯", title: "Laser Focus", desc: "Score 10 in Focus Tap" },
  { id: "xp_500", icon: "⭐", title: "Rising Star", desc: "Earn 500 XP total" },
  { id: "xp_1000", icon: "🌙", title: "Night Owl", desc: "Earn 1000 XP total" },
];

const CATEGORY_ICONS = {
  All: "🌀",
  Mindfulness: "🍃",
  Focus: "🔮",
  Relaxation: "🌊",
};

export default function Games() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    setStats(getStats());
  }, []);

  const xp = stats.totalXP || 0;
  const { current: levelInfo, next: nextLevel, progress } = getLevelInfo(xp);
  const unlockedAchievements = stats.achievements || [];
  const dailyChallengeId = getDailyChallenge(GAMES);
  const isDailyChallengeComplete =
    stats.dailyChallenge?.date === new Date().toDateString() &&
    stats.dailyChallenge?.completed;

  const categories = ["All", "Mindfulness", "Focus"];
  const filteredGames =
    selectedCategory === "All" ? GAMES : GAMES.filter((g) => g.category === selectedCategory);

  const dailyGame = GAMES.find((g) => g.id === dailyChallengeId);

  return (
    <div className="min-h-screen bg-calm">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mind Games</h1>
          <p className="text-gray-500 mt-1">
            Play games designed to boost your mental wellness
          </p>
        </div>

      {/* player rpofile card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold select-none">
                {levelInfo.level}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{levelInfo.title}</p>
                <p className="text-gray-500 text-sm">Level {levelInfo.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{xp} XP</p>
              {/* {nextLevel && (
                // <p className="text-xs text-gray-400">
                //   {nextLevel.min - xp} XP to level up → {nextLevel.title}
                // </p>
              )} */}
            </div>
          </div>

          {/* XP Progress Bar */}
          {nextLevel && (
            <div className="mb-3">
              {/* <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{levelInfo.title}</span>
                <span>{nextLevel.title}</span>
              </div> */}
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-brand-600 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* <div className="flex gap-5 mt-2 text-sm text-gray-500">
            <span>🎮 {stats.totalGamesPlayed || 0} games played</span>
            <span>
              🏆 {unlockedAchievements.length}/{ACHIEVEMENTS.length} achievements
            </span>
            {stats.highScores?.memory && (
              <span>🧠 Best memory: {stats.highScores.memory} pts</span>
            )}
          </div> */}
        </div>

        {/* Daily Challenge */}
        {dailyGame && (
          <div
            className={`rounded-2xl p-5 mb-6 border-2 ${
              isDailyChallengeComplete
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-brand-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                    Daily Challenge
                  </p>
                  <p className="font-bold text-gray-900 text-lg">{dailyGame.title}</p>
                  <p className="text-sm text-gray-500">{dailyGame.desc}</p>
                  {/* <p className="text-xs text-gray-400 mt-1">
                    Complete today for +30 bonus XP
                  </p> */}
                </div>
              </div>
              <div className="text-right">
                {isDailyChallengeComplete ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-green-600 font-semibold text-sm">Completed ✓</span>
                    <span className="text-xs text-gray-400">+30 XP earned</span>
                  </div>
                ) : (
                  <Link
                    to={`${dailyGame.path}?daily=true`}
                    className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors inline-block"
                  >
                    Play Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{CATEGORY_ICONS[cat]}</span> {cat}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredGames.map((game) => {
            const highScore = stats.highScores?.[game.id];
            const gamesPlayed = stats.gameCounts?.[game.id] || 0;
            const isDaily = game.id === dailyChallengeId && !isDailyChallengeComplete;

            return (
              <Link
                key={game.id}
                to={isDaily ? `${game.path}?daily=true` : game.path}
                className="bg-white border border-gray-200 hover:border-gray-400 rounded-2xl p-5 transition-all group relative hover:shadow-sm"
              >
                {isDaily && (
                  <span className="absolute top-3 right-3 bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Daily ⚡
                  </span>
                )}
                <div className="text-3xl mb-3">{game.icon}</div>
                <p className="font-semibold text-gray-900 group-hover:text-gray-700">
                  {game.title}
                </p>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{game.desc}</p>
                <p className="text-xs text-gray-400 mt-1 italic">{game.tip}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    {game.category}
                  </span>
                  <span className="text-xs text-gray-400">{game.xpReward}</span>
                </div>
                {(highScore || gamesPlayed > 0) && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    {highScore && <span>Best: {highScore}</span>}
                    <span>{gamesPlayed > 0 ? `${gamesPlayed}x played` : ""}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Achievements */}
        {/* <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg">Achievements</h2>
            <span className="text-sm text-gray-500">
              {unlockedAchievements.length} / {ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedAchievements.includes(a.id);
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    unlocked
                      ? "border-gray-200 bg-white"
                      : "border-gray-100 bg-gray-50 opacity-60"
                  }`}
                >
                  <span className={`text-2xl ${!unlocked ? "grayscale" : ""}`}>{a.icon}</span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        unlocked ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {a.title}
                      {unlocked && (
                        <span className="ml-1.5 text-xs font-normal text-green-600">Unlocked</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* Quick stats */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.breathingSessions || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Breathing cycles</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.highScores?.memory || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Best memory score</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.gratitudeCount || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Gratitude entries</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.highScores?.focus || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Focus Tap best</p>
          </div>
        </div> */}
      </main>
    </div>
  );
}
