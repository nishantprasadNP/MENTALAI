import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function VideoRecommendationsSection() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchedIds, setWatchedIds] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    async function fetchVideos() {
      try {
        const params = new URLSearchParams();
        if (user?.personalization?.interests?.length) {
          params.set("interests", user.personalization.interests.join(","));
        }
        if (user?.personalization?.favoriteGenres?.movies?.length) {
          params.set("movieGenres", user.personalization.favoriteGenres.movies.join(","));
        }
        if (user?.personalization?.favoriteGenres?.music?.length) {
          params.set("musicGenres", user.personalization.favoriteGenres.music.join(","));
        }
        if (user?.personalization?.stressReliefPreferences?.length) {
          params.set("stressPreferences", user.personalization.stressReliefPreferences.join(","));
        }
        params.set("limit", "8");

        const response = await axios.get(`/api/recommendations/videos?${params.toString()}`);
        if (!mounted) return;
        setVideos(response.data.videos || []);
        if (Array.isArray(response.data.watchedIds)) {
          setWatchedIds(new Set(response.data.watchedIds.map((id) => String(id))));
        }
      } catch (err) {
        if (!mounted) return;
        setError("Unable to load video recommendations right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchVideos();
    return () => {
      mounted = false;
    };
  }, [user]);

  function handleWatch(video) {
    // Open the video synchronously to avoid popup blockers
    const url = video.youtubeUrl || video.sourceUrl || "https://www.youtube.com";
    try {
      window.open(url, "_blank");
    } catch (err) {
      // ignore popup block errors
    }

    // Fire-and-forget: record watched in background
    axios
      .post("/api/recommendations/videos/watched", {
        videoId: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        sourceUrl: video.sourceUrl || "https://www.youtube.com",
        moodTag: user?.personalization?.currentMood || "",
      })
      .catch((err) => console.warn("Could not save watch event", err));

    // Optimistically mark as watched
    setWatchedIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(String(video.id));
      return next;
    });
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Loading wellness video recommendations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No personalized wellness videos available yet. Try checking your mood and interests.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Wellness videos</h2>
          <p className="text-sm text-gray-500">Emotionally aligned videos for your current mood and focus.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <article key={video.id} className="relative overflow-hidden rounded-3xl border border-gray-200 bg-slate-50 shadow-sm">
            <div className="relative h-44 overflow-hidden bg-black">
              <img src={video.thumbnail || "https://via.placeholder.com/400x225?text=No+Thumbnail"} alt={video.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
              <p className="text-xs text-gray-500 mt-2 line-clamp-3">{video.channelTitle}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleWatch(video)}
                          className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                            watchedIds.has(String(video.id)) ? "bg-gray-400 cursor-default" : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                          disabled={watchedIds.has(String(video.id))}
                        >
                          {watchedIds.has(String(video.id)) ? "Watched" : "Watch now"}
                        </button>
                        <span className="text-xs text-gray-400">Score {video.score.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-3 line-clamp-3">{video.reason || video.explanation}</p>
            </div>
                  {watchedIds.has(String(video.id)) && (
                    <div className="absolute top-3 right-3 rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1">Watched</div>
                  )}
          </article>
        ))}
      </div>
    </div>
  );
}
