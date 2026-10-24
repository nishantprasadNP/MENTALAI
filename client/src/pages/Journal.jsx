import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const MOODS = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "anxious", label: "Anxious", emoji: "😟" },
  { value: "stressed", label: "Stressed", emoji: "😰" },
  { value: "angry", label: "Angry", emoji: "😠" },
];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", mood: "neutral" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchEntries() {
    try {
      const { data } = await axios.get("/api/journal");
      setEntries(data);
    } catch {
      // silently fail
    }
  }

  useEffect(() => { fetchEntries(); }, []);

  // Opened from a Dashboard journal prompt (/journal?prompt=...): start a new entry with it
  useEffect(() => {
    const prompt = new URLSearchParams(window.location.search).get("prompt");
    if (prompt) {
      setForm((prev) => ({ ...prev, title: prompt.slice(0, 120) }));
      setShowForm(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post("/api/journal", form);
      setForm({ title: "", content: "", mood: "neutral" });
      setShowForm(false);
      fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save entry.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    try {
      await axios.delete(`/api/journal/${id}`);
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {
      alert("Failed to delete entry.");
    }
  }

  return (
    <div className="min-h-screen bg-calm">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "+ New Entry"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-4 shadow-sm"
          >
            <h2 className="font-semibold text-gray-900">New Entry</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
                placeholder="What's on your mind?"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, mood: m.value }))}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      form.mood === m.value
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white border-gray-300 text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Entry</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                required
                rows={5}
                placeholder="Write freely..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-colors resize-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "Saving..." : "Save Entry"}
            </button>
          </form>
        )}

        {/* Entries */}
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📓</p>
            <p>No entries yet. Write your first one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const mood = MOODS.find((m) => m.value === entry.mood);
              return (
                <div
                  key={entry._id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mood && (
                        <span className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 font-medium">
                          {mood.emoji} {mood.label}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-xl leading-none"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
