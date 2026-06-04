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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">How are you feeling today?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Day Streak"
            value={`${streak} day${streak !== 1 ? "s" : ""}`}
            sub="Keep it up!"
            icon="🔥"
          />
          <StatCard
            label="Journal Entries"
            value={journals.length}
            sub="total entries"
            icon="📓"
          />
          <StatCard
            label="Latest Mood"
            value={
              journals[0]
                ? `${MOOD_EMOJI[journals[0].mood]} ${capitalize(journals[0].mood)}`
                : "—"
            }
            sub={journals[0] ? formatDate(journals[0].createdAt) : "No entries yet"}
            icon="💭"
          />
        </div>

        {/* Quote */}
        <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-white">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Daily quote</p>
          <p className="text-gray-700 text-sm italic leading-relaxed">"{quote}"</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link
            to="/journal"
            className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 flex items-center gap-4 group transition-colors"
          >
            <span className="text-3xl">📓</span>
            <div>
              <p className="font-semibold text-gray-900">Write in Journal</p>
              <p className="text-gray-500 text-sm">Log your thoughts and mood</p>
            </div>
          </Link>
          <Link
            to="/chat"
            className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 flex items-center gap-4 group transition-colors"
          >
            <span className="text-3xl">💬</span>
            <div>
              <p className="font-semibold text-gray-900">Chat with AI</p>
              <p className="text-gray-500 text-sm">Talk to your wellness companion</p>
            </div>
          </Link>
          <Link
            to="/movies"
            className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 flex items-center gap-4 group transition-colors"
          >
            <span className="text-3xl">🎬</span>
            <div>
              <p className="font-semibold text-gray-900">Watch a movie</p>
              <p className="text-gray-500 text-sm">Find something emotionally fitting</p>
            </div>
          </Link>
        </div>

        <PersonalizedRecommendations />

        {/* Recent moods */}
        {journals.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Moods</h2>
            <div className="space-y-3">
              {journals.map((j) => (
                <div key={j._id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{MOOD_EMOJI[j.mood]}</span>
                    <span className="text-gray-700">{j.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-medium">{capitalize(j.mood)}</span>
                    <span className="text-gray-400 text-xs">{formatDate(j.createdAt)}</span>
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

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
    </div>
  );
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
