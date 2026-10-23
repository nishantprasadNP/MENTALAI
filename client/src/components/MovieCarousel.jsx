import { useEffect, useState } from "react";
import axios from "axios";
import RecommendationSummary from "./RecommendationSummary";

export default function MovieCarousel({ limit = 8 }) {
  const [movies, setMovies] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`/api/recommendations/movies?limit=${limit}`)
      .then((res) => {
        if (!mounted) return;
        setSummary(res.data.summary || "");
        setMovies(res.data.movies || []);
      })
      .catch(() => {
        if (mounted) {
          setSummary("");
          setMovies([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [limit]);

  function handleMovieClick(movie) {
    axios.post("/api/recommendations/movies/click", {
      movieId: movie.id,
      movieTitle: movie.title,
      platform: movie.streamingPlatforms?.[0] || "Unknown",
    });

    const searchQuery = encodeURIComponent(`${movie.title}`.trim());
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
    window.open(searchUrl, "_blank");
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Loading movie recommendations...
      </div>
    );
  }

  if (!movies.length) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No movie recommendations available yet. Try adding a journal entry or updating your preferences.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RecommendationSummary title="Movies for your mood" summary={summary} />

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {movies.map((movie) => (
            <div key={movie.id} className="snap-start w-56 shrink-0 rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative h-64 bg-slate-100">
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-100 via-peach-100 to-lavender-200 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <span className="text-4xl" aria-hidden="true">🎬</span>
                    <span className="font-display text-lg font-semibold text-gray-800 leading-snug">{movie.title}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">{movie.title}</h3>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    {movie.genres?.slice(0, 2).map((genre) => (
                      <span key={genre} className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-1">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{movie.rating ?? "—"}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleMovieClick(movie)}
                    className="inline-flex items-center justify-center rounded-full bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition"
                  >
                    Watch / View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
