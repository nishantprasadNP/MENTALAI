import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import OnboardingStepper from "../components/OnboardingStepper";
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

const ACTIVITY_OPTIONS = [
  "Walking",
  "Yoga",
  "Breathing",
  "Journaling",
  "Creative arts",
  "Cooking",
  "Reading",
  "Gardening",
  "Music",
  "Stretching",
];

export default function Onboarding() {
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    age: "",
    gender: "",
    interests: [],
    preferredActivities: [],
    favoriteGenres: { movies: [], music: [] },
    stressReliefPreferences: [],
    wellnessGoals: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

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

  function validateStep(currentStep) {
    const nextErrors = {};
    if (currentStep === 1) {
      if (!form.age || Number(form.age) <= 0) {
        nextErrors.age = "Please enter your age.";
      }
    }
    if (currentStep === 2) {
      if (!form.interests.length) {
        nextErrors.interests = "Pick at least one interest.";
      }
    }
    if (currentStep === 3) {
      if (!form.favoriteGenres.movies.length) {
        nextErrors.favoriteGenresMovies = "Choose at least one movie genre.";
      }
      if (!form.favoriteGenres.music.length) {
        nextErrors.favoriteGenresMusic = "Choose at least one music genre.";
      }
    }
    if (currentStep === 4) {
      if (!form.wellnessGoals.length) {
        nextErrors.wellnessGoals = "Add at least one wellness goal.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildOnboardingAnswers() {
    return {
      age: String(form.age),
      gender: form.gender,
      interests: form.interests.join(", "),
      favoriteMovieGenres: form.favoriteGenres.movies.join(", "),
      favoriteMusicGenres: form.favoriteGenres.music.join(", "),
      stressReliefPreferences: form.stressReliefPreferences.join(", "),
      preferredActivities: form.preferredActivities.join(", "),
      wellnessGoals: form.wellnessGoals.join(", "),
    };
  }

  async function handleSubmit() {
    if (!validateStep(step)) return;
    setSubmitError("");
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/profile/onboarding", {
        age: Number(form.age),
        gender: form.gender,
        interests: form.interests,
        preferredActivities: form.preferredActivities,
        favoriteGenres: form.favoriteGenres,
        stressReliefPreferences: form.stressReliefPreferences,
        wellnessGoals: form.wellnessGoals,
        onboardingAnswers: buildOnboardingAnswers(),
      });
      updateUser(response.data.user);
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Unable to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <section className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                min="1"
                placeholder="Enter your age"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition-colors text-sm"
              />
              {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender (optional)</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  "Female",
                  "Male",
                  "Non-binary",
                  "Prefer not to say",
                  "Other",
                ].map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => updateField("gender", option)}
                    className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                      form.gender === option
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </section>
        );
      case 2:
        return (
          <section className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose what interests you most</p>
              <p className="text-sm text-gray-500">Select one or more topics that suit your wellness journey.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = form.interests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleSelection("interests", interest)}
                      className={`rounded-2xl border px-4 py-2 text-sm transition-colors ${
                        active
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              {errors.interests && <p className="text-sm text-red-600">{errors.interests}</p>}
            </div>
            <TagInput
              label="Preferred activities"
              placeholder="Add activities like walking, journaling, or yoga"
              value={form.preferredActivities}
              onChange={(value) => updateField("preferredActivities", value)}
              description="Enter one item at a time and click Add."
            />
          </section>
        );
      case 3:
        return (
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Favorite movie genres</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              {errors.favoriteGenresMovies && <p className="text-sm text-red-600">{errors.favoriteGenresMovies}</p>}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Favorite music genres</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              {errors.favoriteGenresMusic && <p className="text-sm text-red-600">{errors.favoriteGenresMusic}</p>}
            </div>
          </section>
        );
      case 4:
        return (
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Stress relief preferences</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              label="Wellness goals"
              placeholder="Add goals like sleep better, reduce stress, or feel calmer"
              value={form.wellnessGoals}
              onChange={(value) => updateField("wellnessGoals", value)}
            />
            {errors.wellnessGoals && <p className="text-sm text-red-600">{errors.wellnessGoals}</p>}
          </section>
        );
      case 5:
        return (
          <section className="space-y-5">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Review your profile</h2>
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">Age</p>
                  <p>{form.age}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Gender</p>
                  <p>{form.gender || "Prefer not to say"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Interests</p>
                  <p>{form.interests.join(", ") || "None"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Favorite movie genres</p>
                  <p>{form.favoriteGenres.movies.join(", ") || "None"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Favorite music genres</p>
                  <p>{form.favoriteGenres.music.join(", ") || "None"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Stress relief preferences</p>
                  <p>{form.stressReliefPreferences.join(", ") || "None"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Preferred activities</p>
                  <p>{form.preferredActivities.join(", ") || "None"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Wellness goals</p>
                  <p>{form.wellnessGoals.join(", ") || "None"}</p>
                </div>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-calm py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-gray-500">Personalize your experience</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900 sm:text-4xl">
            Let us get to know you better.
          </h1>
          <p className="mt-4 text-gray-500">Answer a few questions so Mental AI can tailor recommendations, activities, and support to you.</p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <OnboardingStepper step={step} />

          {submitError && (
            <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {renderStepContent()}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => {
                setErrors({});
                setStep((prev) => Math.max(1, prev - 1));
              }}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : step < 5 ? "Next" : "Complete onboarding"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
