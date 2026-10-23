import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { addXP, getStats } from "../../utils/gameStats";

const CARD_EMOJIS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😟", label: "Anxious" },
  { emoji: "😎", label: "Confident" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😐", label: "Neutral" },
];

const DIFFICULTIES = {
  easy: { pairs: 6, label: "Easy", cols: "grid-cols-4" },
  medium: { pairs: 8, label: "Medium", cols: "grid-cols-4" },
  hard: { pairs: 10, label: "Hard", cols: "grid-cols-5" },
};

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildCards(pairs) {
  const selected = CARD_EMOJIS.slice(0, pairs);
  const doubled = [...selected, ...selected];
  return shuffle(doubled).map((item, i) => ({
    id: i,
    emoji: item.emoji,
    label: item.label,
    flipped: false,
    matched: false,
  }));
}

function calcScore(moves, timeSeconds, pairs) {
  const base = pairs * 100;
  const movePenalty = Math.max(0, (moves - pairs) * 8);
  const timePenalty = Math.max(0, (timeSeconds - pairs * 3) * 2);
  return Math.max(0, base - movePenalty - timePenalty);
}

export default function MemoryGame() {
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get("daily") === "true";

  const [difficulty, setDifficulty] = useState("easy");
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameState, setGameState] = useState("idle"); // idle | playing | won
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [highScore, setHighScore] = useState(() => getStats().highScores?.memory || 0);

  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  function startGame(diff = difficulty) {
    setDifficulty(diff);
    setCards(buildCards(DIFFICULTIES[diff].pairs));
    setFlipped([]);
    setMoves(0);
    setMatched(0);
    setTimer(0);
    setScore(0);
    setLocked(false);
    setGameState("playing");
  }

  function handleFlip(id) {
    if (locked || gameState !== "playing") return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flipped.length >= 2) return;

    const newFlipped = [...flipped, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped.map((fid) => cards.find((c) => c.id === fid));
      const secondCard = { ...card };

      if (a?.emoji === secondCard.emoji && a.id !== secondCard.id) {
        // Match!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a.id || c.id === secondCard.id ? { ...c, matched: true } : c
            )
          );
          setFlipped([]);
          setMatched((m) => {
            const newMatched = m + 1;
            const totalPairs = DIFFICULTIES[difficulty].pairs;
            if (newMatched === totalPairs) {
              const finalScore = calcScore(moves + 1, timer, totalPairs);
              setScore(finalScore);
              setGameState("won");
              handleWin(finalScore, difficulty);
            }
            return newMatched;
          });
        }, 400);
      } else {
        // No match
        setLocked(true);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.id) ? { ...c, flipped: false } : c
            )
          );
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  }

  function handleWin(finalScore, diff) {
    const dailyBonus = isDaily ? 30 : 0;
    const xpEarned = Math.round(finalScore / 20) + dailyBonus;
    const updatedStats = addXP(xpEarned, "memory", {
      won: true,
      difficulty: diff,
      score: finalScore,
      isDaily,
    });
    if (finalScore > (getStats().highScores?.memory || 0)) {
      setHighScore(finalScore);
    }
    if (
      updatedStats.achievements?.includes("memory_win") &&
      !getStats().achievements?.includes("memory_win")
    ) {
      setNewAchievement({ icon: "🧠", title: "Sharp Mind" });
      setTimeout(() => setNewAchievement(null), 3000);
    }
    if (
      updatedStats.achievements?.includes("memory_hard") &&
      diff === "hard" &&
      !getStats().achievements?.includes("memory_hard")
    ) {
      setNewAchievement({ icon: "💎", title: "Memory Wizard" });
      setTimeout(() => setNewAchievement(null), 3000);
    }
  }

  const totalPairs = DIFFICULTIES[difficulty].pairs;
  const config = DIFFICULTIES[difficulty];

  return (
    <div className="min-h-screen bg-calm">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/games"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
        >
          ← Back to Games
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🧠 Mood Memory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Match pairs of emotion cards — sharpen your mind and emotional awareness
          </p>
          {isDaily && (
            <span className="inline-block mt-2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-medium">
              ⚡ Daily Challenge — +30 bonus XP
            </span>
          )}
        </div>

        {/* Achievement toast */}
        {newAchievement && (
          <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">{newAchievement.icon}</span>
            <div>
              <p className="text-xs text-gray-400">Achievement Unlocked!</p>
              <p className="text-sm font-semibold text-gray-900">{newAchievement.title}</p>
            </div>
          </div>
        )}

        {gameState === "idle" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Choose Difficulty</h2>
            <p className="text-sm text-gray-500 mb-5">
              More pairs = higher XP potential but harder to remember
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Object.entries(DIFFICULTIES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`p-4 rounded-2xl border-2 text-center transition-colors ${
                    difficulty === key
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-gray-200 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  <p className="font-bold text-lg">{val.label}</p>
                  <p className={`text-sm mt-1 ${difficulty === key ? "text-gray-300" : "text-gray-400"}`}>
                    {val.pairs} pairs
                  </p>
                </button>
              ))}
            </div>
            {highScore > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Your best score: <span className="font-bold text-gray-900">{highScore} pts</span>
              </p>
            )}
            <button
              onClick={() => startGame()}
              className="w-full bg-brand-600 text-white py-3 rounded-2xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Start Game
            </button>
          </div>
        )}

        {gameState === "playing" && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Pairs", value: `${matched}/${totalPairs}` },
                { label: "Moves", value: moves },
                { label: "Time", value: `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}` },
                { label: "Difficulty", value: DIFFICULTIES[difficulty].label },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Card Grid */}
            <div className={`grid ${config.cols} gap-3`}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleFlip(card.id)}
                  disabled={card.matched || card.flipped || locked}
                  className={`aspect-square rounded-2xl border-2 text-3xl font-bold transition-all duration-200 flex items-center justify-center ${
                    card.matched
                      ? "bg-green-50 border-green-300 scale-95"
                      : card.flipped
                      ? "bg-white border-gray-400 scale-100"
                      : "bg-gray-100 border-gray-200 hover:bg-gray-50 hover:border-gray-400 cursor-pointer"
                  }`}
                >
                  {card.flipped || card.matched ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{card.emoji}</span>
                      <span className="text-xs text-gray-500 font-normal">{card.label}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300">?</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={() => setGameState("idle")}
                className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg"
              >
                Restart
              </button>
            </div>
          </>
        )}

        {gameState === "won" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You Won!</h2>
            <p className="text-gray-500 mb-6">
              All {totalPairs} pairs matched — great work!
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Score", value: score },
                { label: "Moves", value: moves },
                { label: "Time", value: `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, "0")}` },
              ].map((s) => (
                <div key={s.label} className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {score >= highScore && score > 0 && (
              <p className="text-sm text-green-600 font-medium mb-3">
                🏆 New personal best!
              </p>
            )}

            <p className="text-sm text-gray-500 mb-6">
              XP Earned: <span className="font-bold text-gray-900">+{Math.round(score / 20) + (isDaily ? 30 : 0)} XP</span>
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startGame()}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-2xl font-semibold hover:bg-brand-700 transition-colors"
              >
                Play Again
              </button>
              <Link
                to="/games"
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Back to Hub
              </Link>
            </div>
          </div>
        )}

        {/* How to play */}
        {gameState === "idle" && (
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">How to Play</h3>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Click any card to flip it and reveal an emotion emoji</li>
              <li>• Click a second card to try to find its match</li>
              <li>• Matched pairs stay face-up and glow green</li>
              <li>• Unmatched pairs flip back after a moment</li>
              <li>• Match all pairs to win — fewer moves = higher score!</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
