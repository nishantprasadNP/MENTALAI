import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import VideoRecommendationsSection from "../components/VideoRecommendationsSection";
import PersonalizedRecommendations from "../components/PersonalizedRecommendations";
import { useAuth } from "../context/AuthContext";

const QUOTES = [
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Mental health is not a destination, but a process. It's about how you drive, not where you're going.",
  "Self-care is not self-indulgence, it is self-preservation. — Audre Lorde",
  "You are not your illness. You have an individual story to tell.",
  "There is hope, even when your brain tells you there isn't. — John Green",
  "Your present circumstances don't determine where you can go; they merely determine where you start.",
  "Be gentle with yourself. You are a child of the universe.",
];

const MOOD_EMOJI = {
  happy: "😊", calm: "😌", neutral: "😐",
  sad: "😢", anxious: "😟", stressed: "😰", angry: "😠",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [streak, setStreak] = useState(0);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [journalRes, userRes] = await Promise.all([
          axios.get("/api/journal"),
          axios.get("/api/auth/me"),
        ]);
        setJournals(journalRes.data.slice(0, 5));
        setStreak(userRes.data.streak);
      } catch {
        // silently fail
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-calm">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        {/* Greeting */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-7 sm:p-9 mb-6 shadow-lift">
          <div className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-brand-300/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 right-32 w-56 h-56 rounded-full bg-peach-300/20 blur-2xl" />
          <div className="relative">
            <p className="text-brand-100 text-sm font-medium">{formatToday()}</p>
            <h1 className="text-3xl sm:text-4xl font-semibold mt-1">
              Good {getGreeting()}, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-brand-100 mt-2">How are you feeling today?</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/journal" className="px-5 py-2.5 bg-white text-brand-800 rounded-full text-sm font-semibold hover:bg-brand-50 transition-colors">
                Check in
              </Link>
              <Link to="/chat" className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-full text-sm font-semibold transition-colors">
                Talk it out
              </Link>
            </div>
            <blockquote className="mt-7 pt-5 border-t border-white/15 text-brand-50/90 text-sm italic leading-relaxed max-w-2xl">
              “{quote}”
            </blockquote>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Day streak"
            value={`${streak} day${streak !== 1 ? "s" : ""}`}
            sub="Keep it up!"
            icon="🔥"
            tint="bg-peach-100"
          />
          <StatCard
            label="Journal entries"
            value={journals.length}
            sub="recent entries"
            icon="📓"
            tint="bg-brand-100"
          />
          <StatCard
            label="Latest mood"
            value={
              journals[0]
                ? `${MOOD_EMOJI[journals[0].mood] || ""} ${capitalize(journals[0].mood)}`
                : "—"
            }
            sub={journals[0] ? formatDate(journals[0].createdAt) : "No entries yet"}
            icon="💭"
            tint="bg-lavender-100"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <ActionCard to="/journal" icon="📓" tint="bg-peach-100" title="Write in journal" desc="Log your thoughts and mood" />
          <ActionCard to="/chat" icon="💬" tint="bg-brand-100" title="Chat with Mental AI" desc="Talk to your wellness companion" />
          <ActionCard to="/movies" icon="🎬" tint="bg-lavender-100" title="Watch a movie" desc="Find something that fits your mood" />
        </div>

        <PersonalizedRecommendations />

        {/* Recent moods */}
        {journals.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent moods</h2>
            <div className="divide-y divide-gray-100">
              {journals.map((j) => (
                <div key={j._id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {MOOD_EMOJI[j.mood]}
                    </span>
                    <span className="text-gray-800 font-medium truncate">{j.title}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                      {capitalize(j.mood)}
                    </span>
                    <span className="text-gray-400 text-xs w-12 text-right">{formatDate(j.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, icon, tint }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${tint} flex items-center justify-center text-2xl flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-medium">{label}</p>
        <p className="text-xl font-semibold text-gray-900 truncate">{value}</p>
        <p className="text-gray-400 text-xs">{sub}</p>
      </div>
    </div>
  );
}

function ActionCard({ to, icon, tint, title, desc }) {
  return (
    <Link to={to} className="card p-5 flex items-center gap-4 group hover:-translate-y-0.5 hover:shadow-lift transition">
      <span className={`w-12 h-12 rounded-2xl ${tint} flex items-center justify-center text-2xl flex-shrink-0`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-gray-500 text-sm">{desc}</p>
      </div>
      <span className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition" aria-hidden="true">→</span>
    </Link>
  );
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
