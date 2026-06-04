import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { addXP } from "../../utils/gameStats";

const PHASES = [
  { id: "inhale", label: "Inhale", instruction: "Breathe in slowly through your nose...", duration: 4 },
  { id: "hold1", label: "Hold", instruction: "Hold your breath gently...", duration: 4 },
  { id: "exhale", label: "Exhale", instruction: "Breathe out slowly through your mouth...", duration: 4 },
  { id: "hold2", label: "Hold", instruction: "Rest and prepare...", duration: 4 },
];

const PHASE_COLORS = {
  inhale: "bg-blue-100 border-blue-300",
  hold1: "bg-purple-100 border-purple-300",
  exhale: "bg-green-100 border-green-300",
  hold2: "bg-gray-100 border-gray-300",
};

export default function BreathingGame() {
  const [searchParams] = useSearchParams();
  const isDaily = searchParams.get("daily") === "true";

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(PHASES[0].duration);
  const [cycles, setCycles] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [xpFlash, setXpFlash] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);

  const stateRef = useRef({ phaseIdx: 0, countdown: PHASES[0].duration, cycles: 0 });
  const intervalRef = useRef(null);
  const dailyAwardedRef = useRef(false);

  function tick() {
    stateRef.current.countdown -= 1;
    if (stateRef.current.countdown <= 0) {
      const nextIdx = (stateRef.current.phaseIdx + 1) % PHASES.length;
      stateRef.current.phaseIdx = nextIdx;
      stateRef.current.countdown = PHASES[nextIdx].duration;
      setPhaseIdx(nextIdx);
      setCountdown(PHASES[nextIdx].duration);

      if (nextIdx === 0) {
        stateRef.current.cycles += 1;
        const newCycles = stateRef.current.cycles;
        setCycles(newCycles);

        const xpGain = isDaily && !dailyAwardedRef.current ? 40 : 10;
        const extra = { isDaily: isDaily && !dailyAwardedRef.current };
        if (isDaily && !dailyAwardedRef.current) dailyAwardedRef.current = true;

        const updatedStats = addXP(xpGain, "breathing", extra);
        setSessionXP((s) => s + xpGain);
        setXpFlash(true);
        setTimeout(() => setXpFlash(false), 1200);

        // Check achievements
        if (
          updatedStats.achievements?.includes("breathing_5") &&
          (updatedStats.breathingSessions || 0) === 5
        ) {
          setNewAchievement({ icon: "🫁", title: "Breathwork Beginner" });
          setTimeout(() => setNewAchievement(null), 3000);
        }
        if (
          updatedStats.achievements?.includes("breathing_20") &&
          (updatedStats.breathingSessions || 0) === 20
        ) {
          setNewAchievement({ icon: "🧘", title: "Breath Master" });
          setTimeout(() => setNewAchievement(null), 3000);
        }
      }
    } else {
      setCountdown(stateRef.current.countdown);
    }
  }

  function start() {
    stateRef.current = { phaseIdx: 0, countdown: PHASES[0].duration, cycles: 0 };
    setPhaseIdx(0);
    setCountdown(PHASES[0].duration);
    setCycles(0);
    setSessionXP(0);
    setRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }

  function stop() {
    clearInterval(intervalRef.current);
    setRunning(false);
  }

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const phase = PHASES[phaseIdx];
  const totalSeconds = stateRef.current.cycles * 16;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  // Circle scale: inhale/hold1 = large, exhale/hold2 = small
  const isBig = phaseIdx === 0 || phaseIdx === 1;
  const circleScale = running ? (isBig ? "scale-[1.45]" : "scale-[0.65]") : "scale-100";
  const circleTransitionDuration = phase.duration * 1000;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          to="/games"
          className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-flex items-center gap-1 transition-colors"
        >
          ← Back to Games
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🫧 Breathing Bubble</h1>
          <p className="text-gray-500 text-sm mt-1">
            Box breathing — a technique used by the Navy SEALs to calm the mind
          </p>
          {isDaily && (
            <span className="inline-block mt-2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full font-medium">
              ⚡ Daily Challenge — +30 bonus XP
            </span>
          )}
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{cycles}</p>
            <p className="text-xs text-gray-500 mt-0.5">Cycles</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p
              className={`text-2xl font-bold transition-colors duration-300 ${
                xpFlash ? "text-green-500" : "text-gray-900"
              }`}
            >
              {sessionXP > 0 ? `+${sessionXP}` : "0"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">XP Earned</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {mins}:{String(secs).padStart(2, "0")}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Time</p>
          </div>
        </div>

        {/* Achievement Toast */}
        {newAchievement && (
          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm animate-pulse">
            <span className="text-2xl">{newAchievement.icon}</span>
            <div>
              <p className="text-xs text-gray-400">Achievement Unlocked!</p>
              <p className="text-sm font-semibold text-gray-900">{newAchievement.title}</p>
            </div>
          </div>
        )}

        {/* Breathing Circle */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative flex items-center justify-center w-72 h-72">
            {/* Outer glow ring */}
            <div
              className={`absolute w-64 h-64 rounded-full border-2 transition-transform ${circleScale} ${
                running ? PHASE_COLORS[phase.id] : "border-gray-200 bg-gray-50"
              }`}
              style={{ transitionDuration: `${running ? phase.duration * 900 : 300}ms` }}
            />
            {/* Middle ring */}
            <div
              className={`absolute w-52 h-52 rounded-full border transition-transform ${circleScale} ${
                running ? PHASE_COLORS[phase.id] : "border-gray-100 bg-gray-50"
              }`}
              style={{ transitionDuration: `${running ? phase.duration * 900 : 300}ms` }}
            />
            {/* Inner circle */}
            <div
              className={`absolute w-40 h-40 rounded-full transition-transform ${circleScale} ${
                running ? "bg-gray-900 opacity-10" : "bg-gray-100"
              }`}
              style={{ transitionDuration: `${running ? phase.duration * 900 : 300}ms` }}
            />
            {/* Center text */}
            <div className="relative z-10 text-center">
              {running ? (
                <>
                  <p className="text-5xl font-bold text-gray-900">{countdown}</p>
                  <p className="text-base font-semibold text-gray-700 mt-1">{phase.label}</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-sm">Press Start</p>
                  <p className="text-3xl mt-1">🫧</p>
                </>
              )}
            </div>
          </div>

          {running && (
            <p className="text-gray-500 text-sm mt-4 text-center max-w-xs animate-pulse">
              {phase.instruction}
            </p>
          )}
        </div>

        {/* Phase Indicators */}
        {running && (
          <div className="flex justify-center gap-3 mb-8">
            {PHASES.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === phaseIdx ? "w-8 bg-gray-900" : "w-2 bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-400">{p.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Control Button */}
        <div className="flex justify-center gap-3 mb-8">
          {!running ? (
            <button
              onClick={start}
              className="bg-gray-900 text-white px-10 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-base"
            >
              Start Breathing
            </button>
          ) : (
            <button
              onClick={stop}
              className="border border-gray-300 text-gray-700 px-10 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-base"
            >
              Stop
            </button>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">How Box Breathing Works</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { emoji: "😮‍💨", phase: "Inhale", duration: "4s", desc: "Fill your lungs" },
              { emoji: "😶", phase: "Hold", duration: "4s", desc: "Pause at the top" },
              { emoji: "😮", phase: "Exhale", duration: "4s", desc: "Release tension" },
              { emoji: "😌", phase: "Hold", duration: "4s", desc: "Rest and reset" },
            ].map((s, i) => (
              <div key={i} className="p-2">
                <p className="text-2xl mb-1">{s.emoji}</p>
                <p className="font-semibold text-gray-700 text-sm">{s.phase}</p>
                <p className="text-gray-900 font-bold text-xs">{s.duration}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 leading-relaxed">
              Box breathing activates the parasympathetic nervous system, lowering cortisol levels
              and heart rate. Each completed cycle earns you <strong>10 XP</strong>. Practice
              daily for the best results.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
