import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { addXP, getStats } from "../../utils/gameStats";

const PROMPTS = [
  "Something that made you smile today",
  "A person who made your life better",
  "A small pleasure you enjoyed today",
  "Something about your body you're grateful for",
  "A challenge that helped you grow",
  "A memory that brings you joy",
  "Something in nature you appreciate",
  "A skill or talent you're proud of",
  "Someone who has been kind to you recently",
  "Something you often take for granted",
];

function getTodayKey() {
  return new Date().toDateString();
}

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem("gratitudeEntries") || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem("gratitudeEntries", JSON.stringify(entries));
  } catch {}
}

export default function GratitudeJar() {
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get("daily") === "true";

  const [entries, setEntries] = useState(() => loadEntries());
  const [inputs, setInputs] = useState(["", "", ""]);
  const [status, setStatus] = useState("idle"); // idle | done
  const [newAchievement, setNewAchievement] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);

  const todayEntry = entries.find((e) => e.date === getTodayKey());
  const hasEntryToday = Boolean(todayEntry);

  const totalEntries = entries.length;
  const jarFill = Math.min(100, (totalEntries / 30) * 100);

  const todayPrompts = (() => {
    const seed = getTodayKey().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return [0, 1, 2].map((i) => PROMPTS[(seed + i * 3) % PROMPTS.length]);
  })();

  function handleInput(i, val) {
    setInputs((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  function handleSubmit() {
    const filled = inputs.map((v) => v.trim()).filter(Boolean);
    if (filled.length < 1) return;

    const newEntry = {
      date: getTodayKey(),
      items: inputs.map((v) => v.trim()),
      prompts: todayPrompts,
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);

    const xpGain = 20 + (isDaily ? 30 : 0);
    const updatedStats = addXP(xpGain, "gratitude", { isDaily });
    setXpEarned(xpGain);
    setStatus("done");

    if (
      updatedStats.achievements?.includes("gratitude_3") &&
      (updatedStats.gratitudeCount || 0) === 3
    ) {
      setNewAchievement({ icon: "🙏", title: "Grateful Heart" });
      setTimeout(() => setNewAchievement(null), 3000);
    }
    if (
      updatedStats.achievements?.includes("gratitude_7") &&
      (updatedStats.gratitudeCount || 0) === 7
    ) {
      setNewAchievement({ icon: "🌟", title: "Gratitude Streak" });
      setTimeout(() => setNewAchievement(null), 3000);
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">🫙 Gratitude Jar</h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill your jar daily — gratitude rewires your brain for positivity
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

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Visual Jar */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center">
            <div className="relative w-24 h-32 mb-3">
              {/* Jar outline */}
              <div className="absolute inset-0 border-2 border-gray-300 rounded-b-2xl rounded-t-lg" />
              {/* Jar lid */}
              <div className="absolute -top-2 left-2 right-2 h-3 bg-gray-200 rounded-t-lg border border-gray-300" />
              {/* Fill level */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-200 to-amber-100 rounded-b-2xl transition-all duration-700"
                style={{ height: `${jarFill}%` }}
              >
                {jarFill > 15 && (
                  <div className="absolute inset-0 flex flex-wrap gap-1 p-2 items-end justify-center overflow-hidden">
                    {Array.from({ length: Math.min(Math.floor(jarFill / 5), 12) }).map((_, i) => (
                      <span key={i} className="text-xs">
                        {["💛", "🌟", "✨", "💫", "🙏"][i % 5]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{totalEntries}</p>
            <p className="text-xs text-gray-500">entries total</p>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
              <p className="text-xs text-gray-500">Total days</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{Math.round(jarFill)}%</p>
              <p className="text-xs text-gray-500">Jar filled</p>
            </div>
          </div>
        </div>

        {/* Today's entry */}
        {!hasEntryToday && status === "idle" ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-1">Today's Gratitude</h2>
            <p className="text-sm text-gray-500 mb-5">
              Answer the prompts below — write as much or as little as you like.
            </p>
            <div className="space-y-4">
              {todayPrompts.map((prompt, i) => (
                <div key={i}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {i + 1}. {prompt}
                  </label>
                  <input
                    type="text"
                    value={inputs[i]}
                    onChange={(e) => handleInput(i, e.target.value)}
                    placeholder="I'm grateful for..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={inputs.every((v) => !v.trim())}
              className="w-full mt-5 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add to Jar +20 XP
            </button>
          </div>
        ) : status === "done" ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center mb-6">
            <p className="text-4xl mb-3">🌟</p>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Added to your jar!</h2>
            <p className="text-gray-500 text-sm mb-3">
              You earned <span className="font-bold text-gray-900">+{xpEarned} XP</span>
            </p>
            <p className="text-sm text-gray-400 italic">
              "Gratitude turns what we have into enough." — Melody Beattie
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center mb-6">
            <p className="text-3xl mb-2">✅</p>
            <h2 className="font-semibold text-gray-900">Already done today!</h2>
            <p className="text-sm text-gray-500 mt-1">Come back tomorrow to fill your jar more.</p>
            {todayEntry && (
              <div className="mt-4 text-left space-y-2">
                {todayEntry.items.map((item, i) =>
                  item ? (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-400 mt-0.5">✦</span>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* Past entries */}
        {entries.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Past Entries</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {entries.slice(1, 10).map((entry, i) => (
                <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-xs text-gray-400 mb-1">{entry.date}</p>
                  <div className="space-y-1">
                    {entry.items.map((item, j) =>
                      item ? (
                        <p key={j} className="text-sm text-gray-700 flex items-start gap-1.5">
                          <span className="text-amber-300 shrink-0">✦</span> {item}
                        </p>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Science note */}
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Why it works</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Research shows that keeping a gratitude journal for just 3 weeks significantly
            increases happiness and reduces depression. Writing 3 things daily rewires neural
            pathways to notice the positive — making optimism a habit, not just a feeling.
          </p>
        </div>
      </main>
    </div>
  );
}
