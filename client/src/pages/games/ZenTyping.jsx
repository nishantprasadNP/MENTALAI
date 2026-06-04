import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { addXP, getStats } from "../../utils/gameStats";

const AFFIRMATIONS = [
  "I am worthy of love and belonging.",
  "I choose to be kind to myself today.",
  "My feelings are valid and I honor them.",
  "I am enough, exactly as I am.",
  "Today I choose peace over worry.",
  "I trust the process of my healing.",
  "I am resilient and I can handle this.",
  "Small steps forward are still progress.",
  "I deserve rest and self-compassion.",
  "My mind is calm and my heart is open.",
  "I release what I cannot control.",
  "Every breath I take brings me calm.",
  "I am growing stronger every single day.",
  "My worth is not measured by productivity.",
  "I give myself permission to feel good.",
];

function pickRandom(arr, exclude) {
  const options = arr.filter((a) => a !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

export default function ZenTyping() {
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get("daily") === "true";

  const [affirmation, setAffirmation] = useState(() => pickRandom(AFFIRMATIONS, ""));
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle"); // idle | typing | complete
  const [startTime, setStartTime] = useState(null);
  // const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [sessionStats, setSessionStats] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);
  // const [highScoreWpm, setHighScoreWpm] = useState(() => getStats().highScores?.typing || 0);
  const inputRef = useRef(null);
  const dailyAwardedRef = useRef(false);

  function handleInput(e) {
    const value = e.target.value;

    if (status === "idle" && value.length > 0) {
      setStatus("typing");
      setStartTime(Date.now());
    }

    if (value.length > affirmation.length) return;
    setTyped(value);

    if (value === affirmation) {
      const elapsed = (Date.now() - startTime) / 1000 / 60;
      const words = affirmation.split(" ").length;
      const finalWpm = Math.round(words / elapsed);

      let correct = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === affirmation[i]) correct++;
      }
      const finalAccuracy = Math.round((correct / affirmation.length) * 100);

      setWpm(finalWpm);
      setAccuracy(finalAccuracy);
      setStatus("complete");

      const xpGain = Math.round(finalAccuracy / 5) + (isDaily && !dailyAwardedRef.current ? 30 : 0);
      if (isDaily) dailyAwardedRef.current = true;

      const updatedStats = addXP(xpGain, "typing", {
        accuracy: finalAccuracy,
        wpm: finalWpm,
        isDaily,
      });

      setSessionStats((prev) => [...prev, { affirmation, wpm: finalWpm, accuracy: finalAccuracy, xp: xpGain }]);

      if (finalWpm > highScoreWpm) setHighScoreWpm(finalWpm);

      if (
        finalAccuracy === 100 &&
        updatedStats.achievements?.includes("typing_perfect") &&
        !(getStats().achievements?.includes("typing_perfect"))
      ) {
        setNewAchievement({ icon: "✨", title: "Perfect Type" });
        setTimeout(() => setNewAchievement(null), 3000);
      }
    }
  }

  function nextAffirmation() {
    setAffirmation(pickRandom(AFFIRMATIONS, affirmation));
    setTyped("");
    setStatus("idle");
    setStartTime(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function getCharClass(index) {
    if (index >= typed.length) return "text-gray-300";
    if (typed[index] === affirmation[index]) return "text-gray-900";
    return "text-red-500 bg-red-50";
  }

  const progress = affirmation.length > 0 ? (typed.length / affirmation.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to="/games"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1"
        >
          ← Back to Games
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">✍️ Zen Typing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Type each affirmation carefully — mindfully, not quickly
          </p>
          {isDaily && (
            <span className="inline-block mt-2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full font-medium">
              ⚡ Daily Challenge — +30 bonus XP
            </span>
          )}
        </div>

        {/* Achievement toast */}
        {newAchievement && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">{newAchievement.icon}</span>
            <div>
              <p className="text-xs text-gray-400">Achievement Unlocked!</p>
              <p className="text-sm font-semibold text-gray-900">{newAchievement.title}</p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{highScoreWpm}</p>
            <p className="text-xs text-gray-500">Best WPM</p>
          </div> */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{sessionStats.length}</p>
            <p className="text-xs text-gray-500">This session</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {sessionStats.reduce((a, s) => a + s.xp, 0)}
            </p>
            <p className="text-xs text-gray-500">XP Earned</p>
          </div>
        </div>

        {/* Main typing card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
          {/* Affirmation display */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-medium">
              Type this affirmation
            </p>
            <div className="text-xl leading-relaxed font-medium tracking-wide select-none p-4 bg-gray-50 rounded-xl">
              {affirmation.split("").map((char, i) => (
                <span key={i} className={`transition-colors duration-100 ${getCharClass(i)}`}>
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
            <div
              className={`h-1.5 rounded-full transition-all duration-150 ${
                status === "complete" ? "bg-green-500" : "bg-gray-900"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Input */}
          <textarea
            ref={inputRef}
            value={typed}
            onChange={handleInput}
            disabled={status === "complete"}
            placeholder="Start typing..."
            rows={2}
            className="w-full resize-none border border-gray-200 rounded-xl p-3 text-gray-900 text-base focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            autoFocus
          />

          {/* Live stats while typing */}
          {status === "typing" && (
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>{typed.length} / {affirmation.length} chars</span>
              <span>
                {Math.round(
                  (typed.split("").filter((c, i) => c === affirmation[i]).length / Math.max(typed.length, 1)) * 100
                )}% accuracy
              </span>
            </div>
          )}
        </div>

        {/* Completion card */}
        {status === "complete" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center mb-4">
            <p className="text-4xl mb-3">
              {accuracy === 100 ? "✨" : accuracy >= 90 ? "🎉" : "👍"}
            </p>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {accuracy === 100 ? "Perfect!" : accuracy >= 90 ? "Excellent!" : "Well done!"}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {accuracy === 100
                ? "Flawless typing — you earned bonus XP!"
                : "Keep practicing for perfect accuracy."}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "WPM", value: wpm },
                { label: "Accuracy", value: `${accuracy}%` },
                { label: "XP Earned", value: `+${Math.round(accuracy / 5) + (isDaily && !dailyAwardedRef.current ? 30 : 0)}` },
              ].map((s) => (
                <div key={s.label} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={nextAffirmation}
              className="bg-gray-900 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Next Affirmation
            </button>
          </div>
        )}

        {/* Session history */}
        {sessionStats.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">This Session</h3>
            <div className="space-y-2">
              {sessionStats.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
                >
                  <p className="text-gray-600 truncate max-w-xs italic">"{s.affirmation}"</p>
                  <div className="flex gap-3 text-xs text-gray-400 shrink-0 ml-3">
                    <span>{s.wpm} WPM</span>
                    <span>{s.accuracy}%</span>
                    <span className="text-gray-900 font-medium">+{s.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {status === "idle" && sessionStats.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">About Zen Typing</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Mindfully typing positive affirmations combines the cognitive benefits of typing
              practice with the therapeutic effects of positive self-talk. Take your time —
              this isn't a race. Higher accuracy earns more XP.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">20 XP</p>
                <p className="text-gray-400">100% accuracy</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">18 XP</p>
                <p className="text-gray-400">90% accuracy</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="font-bold text-gray-900">+30 XP</p>
                <p className="text-gray-400">Daily bonus</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
