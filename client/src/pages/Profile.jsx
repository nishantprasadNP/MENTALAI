import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import TagInput from "../components/TagInput";

const INTEREST_OPTIONS = [
  "Mental wellness",
  "Creativity",
  "Movement",
  "Mindfulness",
  "Books",
  "Music",
  "Nature",
  "Cooking",
  "Productivity",
  "Art",
];

const MOVIE_GENRES = [
  "Drama",
  "Comedy",
  "Adventure",
  "Documentary",
  "Sci-Fi",
  "Fantasy",
  "Romance",
  "Thriller",
  "Animation",
  "Horror",
];

const MUSIC_GENRES = [
  "Pop",
  "Rock",
  "Hip-hop",
  "Electronic",
  "Classical",
  "Jazz",
  "R&B",
  "Country",
  "Ambient",
  "Indie",
];

const STRESS_PREFERENCES = [
  "Breathing exercises",
  "Listening to music",
  "Taking a walk",
  "Journaling",
  "Meditation",
  "Stretching",
  "Talking with someone",
  "Reading",
  "Resting",
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    age: "",
    gender: "",
    interests: [],
    preferredActivities: [],
    favoriteGenres: { movies: [], music: [] },
    stressReliefPreferences: [],
    wellnessGoals: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await axios.get("/api/profile");
        setProfile(data);
        setForm({
          age: data.personalization?.age || "",
          gender: data.personalization?.gender || "",
          interests: data.personalization?.interests || [],
          preferredActivities: data.personalization?.preferredActivities || [],
          favoriteGenres: {
            movies: data.personalization?.favoriteGenres?.movies || [],
            music: data.personalization?.favoriteGenres?.music || [],
          },
          stressReliefPreferences: data.personalization?.stressReliefPreferences || [],
          wellnessGoals: data.personalization?.wellnessGoals || [],
        });
      } catch (err) {
        // ignore silently, profile may still load from cached user
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function updateField(path, value) {
    setForm((prev) => {
      if (path.includes("favoriteGenres.")) {
        const [_, key] = path.split(".");
        return {
          ...prev,
          favoriteGenres: {
            ...prev.favoriteGenres,
            [key]: value,
          },
        };
      }
      return { ...prev, [path]: value };
    });
  }

  function toggleSelection(path, value) {
    const current = path.includes("favoriteGenres.")
      ? form.favoriteGenres[path.split(".")[1]]
      : form[path];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateField(path, next);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const { data } = await axios.put("/api/profile", {
        personalization: {
          age: Number(form.age),
          gender: form.gender,
          interests: form.interests,
          preferredActivities: form.preferredActivities,
          favoriteGenres: form.favoriteGenres,
          stressReliefPreferences: form.stressReliefPreferences,
          wellnessGoals: form.wellnessGoals,
        },
      });
      setProfile(data.user);
      updateUser(data.user);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-calm flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-calm">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Personalization</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">Your wellness profile</h1>
              <p className="mt-3 text-gray-500">Update your preferences and interests to keep recommendations relevant.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Status: {profile?.onboardingCompleted ? "Completed" : "Pending"}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Basic details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  placeholder="Your age"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-colors text-sm"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Interests</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {INTEREST_OPTIONS.map((option) => {
                const active = form.interests.includes(option);
                return (
                  <button
                    type="button"
                    key={option}
                    onClick={() => toggleSelection("interests", option)}
                    className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                      active
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Genres</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700">Movie genres</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MOVIE_GENRES.map((genre) => {
                    const active = form.favoriteGenres.movies.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => toggleSelection("favoriteGenres.movies", genre)}
                        className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                          active
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Music genres</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MUSIC_GENRES.map((genre) => {
                    const active = form.favoriteGenres.music.includes(genre);
                    return (
                      <button
                        type="button"
                        key={genre}
                        onClick={() => toggleSelection("favoriteGenres.music", genre)}
                        className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                          active
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Wellness preferences</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700">Stress relief preferences</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STRESS_PREFERENCES.map((option) => {
                    const active = form.stressReliefPreferences.includes(option);
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => toggleSelection("stressReliefPreferences", option)}
                        className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                          active
                            ? "bg-brand-600 text-white border-brand-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              <TagInput
                label="Preferred activities"
                placeholder="Example: walking, creative arts, meditation"
                value={form.preferredActivities}
                onChange={(next) => updateField("preferredActivities", next)}
              />
              <TagInput
                label="Wellness goals"
                placeholder="Example: sleep better, manage stress, feel calmer"
                value={form.wellnessGoals}
                onChange={(next) => updateField("wellnessGoals", next)}
              />
            </div>
          </div>

          {message && (
            <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
