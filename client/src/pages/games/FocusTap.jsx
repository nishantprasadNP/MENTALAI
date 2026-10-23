  import { useState, useEffect, useRef } from "react";
  import { Link, useSearchParams } from "react-router-dom";
  import Navbar from "../../components/Navbar";
  import { addXP, getStats } from "../../utils/gameStats";

  const GRID_SIZE = 9; // 3x3

  const DOT_COLORS = [
    "bg-blue-400",
    "bg-purple-400",
    "bg-green-400",
    "bg-amber-400",
    "bg-rose-400",
  ];

  function generateSequence(length) {
    return Array.from({ length }, () => Math.floor(Math.random() * GRID_SIZE));
  }

  export default function FocusTap() {
    const [searchParams] = useSearchParams();
    const isDaily = searchParams.get("daily") === "true";

    const [gameState, setGameState] = useState("idle"); // idle | showing | input | win | lose
    const [sequence, setSequence] = useState([]);
    const [userInput, setUserInput] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null); // which dot is lit
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(() => getStats().highScores?.focus || 0);
    const [sessionXP, setSessionXP] = useState(0);
    const [newAchievement, setNewAchievement] = useState(null);
    const [wrongDot, setWrongDot] = useState(null);
    const dailyAwardedRef = useRef(false);

    function startGame() {
      const firstSeq = generateSequence(1);
      setSequence(firstSeq);
      setUserInput([]);
      setScore(0);
      setSessionXP(0);
      setWrongDot(null);
      setGameState("showing");
      showSequence(firstSeq);
    }

    function showSequence(seq) {
      let i = 0;
      const interval = setInterval(() => {
        setActiveIndex(seq[i]);
        setTimeout(() => setActiveIndex(null), 500);
        i++;
        if (i >= seq.length) {
          clearInterval(interval);
          setTimeout(() => setGameState("input"), 700);
        }
      }, 800);
    }

    function handleDotClick(index) {
      if (gameState !== "input") return;

      const expected = sequence[userInput.length];
      if (index === expected) {
        const newInput = [...userInput, index];
        setUserInput(newInput);

        if (newInput.length === sequence.length) {
          // Correct full sequence
          const newScore = score + 1;
          setScore(newScore);

          const xpGain = 5 + (isDaily && !dailyAwardedRef.current ? 30 : 0);
          if (isDaily && !dailyAwardedRef.current) dailyAwardedRef.current = true;

          const updatedStats = addXP(xpGain, "focus", {
            score: newScore,
            isDaily: isDaily && !dailyAwardedRef.current,
          });
          setSessionXP((s) => s + xpGain);
          if (newScore > bestScore) setBestScore(newScore);

          if (
            updatedStats.achievements?.includes("focus_10") &&
            newScore === 10
          ) {
            setNewAchievement({ icon: "🎯", title: "Laser Focus" });
            setTimeout(() => setNewAchievement(null), 3000);
          }

          // Add one more to sequence
          setTimeout(() => {
            const nextSeq = [...sequence, ...generateSequence(1)];
            setSequence(nextSeq);
            setUserInput([]);
            setGameState("showing");
            showSequence(nextSeq);
          }, 600);
        }
      } else {
        // Wrong!
        setWrongDot(index);
        setTimeout(() => setWrongDot(null), 500);
        setGameState("lose");
      }
    }

    const gridPositions = Array.from({ length: GRID_SIZE }, (_, i) => i);

    return (
      <div className="min-h-screen bg-calm">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <Link
            to="/games"
            className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
          >
            ← Back to Games
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">🎯 Focus Tap</h1>
            <p className="text-gray-500 text-sm mt-1">
              Watch the sequence light up, then tap the dots in the same order
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{score}</p>
              <p className="text-xs text-gray-500">Round</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{bestScore}</p>
              <p className="text-xs text-gray-500">Best</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">+{sessionXP}</p>
              <p className="text-xs text-gray-500">XP Earned</p>
            </div>
          </div>

          {/* Game Area */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-4">
            {/* Status label */}
            <div className="text-center mb-6">
              {gameState === "idle" && (
                <p className="text-gray-400">Press start to begin</p>
              )}
              {gameState === "showing" && (
                <p className="text-gray-900 font-semibold animate-pulse">
                  Watch carefully... ({sequence.length} step{sequence.length !== 1 ? "s" : ""})
                </p>
              )}
              {gameState === "input" && (
                <p className="text-gray-900 font-semibold">
                  Your turn! ({userInput.length}/{sequence.length} tapped)
                </p>
              )}
              {gameState === "lose" && (
                <p className="text-red-500 font-semibold">Wrong! You reached round {score}</p>
              )}
            </div>

            {/* Dot Grid */}
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
              {gridPositions.map((i) => {
                const isActive = activeIndex === i;
                const isWrong = wrongDot === i;
                const isInputted = gameState === "input" && userInput.includes(i);

                return (
                  <button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    disabled={gameState !== "input"}
                    className={`w-20 h-20 rounded-2xl border-2 transition-all duration-150 flex items-center justify-center text-2xl ${
                      isWrong
                        ? "bg-red-400 border-red-500 scale-95"
                        : isActive
                        ? `${DOT_COLORS[i % DOT_COLORS.length]} border-transparent scale-110 shadow-lg`
                        : gameState === "input"
                        ? "bg-gray-100 border-gray-200 hover:bg-gray-200 hover:scale-105 cursor-pointer active:scale-95"
                        : "bg-gray-100 border-gray-200 cursor-default"
                    }`}
                  >
                    {isActive ? (
                      <span className="text-white font-bold text-2xl">●</span>
                    ) : (
                      <span className="text-gray-300 text-xl">○</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress dots showing input progress */}
            {gameState === "input" && (
              <div className="flex justify-center gap-2">
                {sequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < userInput.length ? "bg-brand-600" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 mb-6">
            {(gameState === "idle" || gameState === "lose") && (
              <button
                onClick={startGame}
                className="bg-brand-600 text-white px-10 py-3 rounded-2xl font-semibold hover:bg-brand-700 transition-colors"
              >
                {gameState === "lose" ? "Try Again" : "Start Game"}
              </button>
            )}
          </div>

          {/* How to play */}
          {gameState === "idle" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">How to Play</h3>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Dots will light up in a sequence — watch carefully</li>
                <li>• After the sequence plays, tap the dots in the same order</li>
                <li>• Each correct round adds one more step to the sequence</li>
                <li>• One mistake ends the game — how far can you go?</li>
                <li>• Score 10+ rounds to unlock the Laser Focus achievement!</li>
              </ul>
            </div>
          )}

          {/* High score message */}
          {gameState === "lose" && score > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-500">
                You remembered a sequence of{" "}
                <span className="font-bold text-gray-900">{sequence.length} steps</span>.
                {score >= bestScore && score > 0 && (
                  <span className="ml-1 text-green-600 font-medium">New best! 🏆</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">+{sessionXP} XP earned this session</p>
            </div>
          )}
        </main>
      </div>
    );
  }
