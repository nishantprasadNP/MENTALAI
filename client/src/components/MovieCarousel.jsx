import { useEffect, useState } from "react";
import axios from "axios";
import RecommendationSummary from "./RecommendationSummary";

export default function MovieCarousel({ limit = 8 }) {
  const [movies, setMovies] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [brokenImages, setBrokenImages] = useState(() => new Set());

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
      platform: movie.platforms?.[0] || "Unknown",
    });

    const searchQuery = encodeURIComponent(`${movie.title} ${movie.year || ""} watch online`.trim());
    window.open(movie.watchUrl || `https://www.google.com/search?q=${searchQuery}`, "_blank", "noopener");
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
          {movies.map((movie) => {
            // Poster first; if it can't load (e.g. TMDB blocked), use the trailer thumbnail
            const image = [movie.poster, movie.trailerThumbnail].find((url) => url && !brokenImages.has(url));
            const isTrailerImage = image && image === movie.trailerThumbnail;
            return (
            <div key={movie.id} className="snap-start w-56 shrink-0 rounded-3xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="relative h-64 bg-gray-900 overflow-hidden">
                {image ? (
                  <img
                    key={image}
                    src={image}
                    alt={movie.title}
                    // hqdefault thumbnails are letterboxed; scaling crops the black bars
                    className={`h-full w-full object-cover ${isTrailerImage ? "scale-[1.35]" : ""}`}
                    onError={() => setBrokenImages((prev) => new Set(prev).add(image))}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-100 via-peach-100 to-lavender-200 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <span className="text-4xl" aria-hidden="true">🎬</span>
                    <span className="font-display text-lg font-semibold text-gray-800 leading-snug">{movie.title}</span>
                  </div>
                )}
                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-black/75 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                    Trailer
                  </a>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">{movie.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[movie.year, movie.rating ? `★ ${Number(movie.rating).toFixed(1)}` : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {movie.genres?.slice(0, 2).map((genre) => (
                    <span key={genre} className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-1">
                      {genre}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleMovieClick(movie)}
                  className="w-full inline-flex items-center justify-center rounded-full bg-brand-600 text-white px-4 py-2 text-sm font-medium hover:bg-brand-700 transition truncate"
                >
                  {movie.watchUrl && movie.platforms?.[0] ? `Watch on ${movie.platforms[0]}` : "Find where to watch"}
                </button>
                {movie.platforms?.length > 1 && (
                  <p className="text-[11px] text-gray-400 mt-2 truncate">Also on {movie.platforms.slice(1, 3).join(", ")}</p>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
