import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PersonalizedRecommendations() {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moviesSummary, setMoviesSummary] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchRecs() {
      try {
        let res;
        try {
          res = await axios.get("/api/recommendations");
        } catch (err) {
          // if unauthorized or failed, try public catalog
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            res = await axios.get("/api/recommendations/public");
          } else {
            throw err;
          }
        }
        if (mounted) setRecs(res.data);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchRecs();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`/api/recommendations/movies?limit=3`)
      .then((res) => {
        if (!mounted) return;
        setMoviesSummary(res.data.summary || "");
      })
      .catch(() => {})
      .finally(() => {
        mounted = false;
      });
    return () => (mounted = false);
  }, []);

  if (loading) return <div className="card p-6 mb-8 text-sm text-gray-500 animate-pulse">Finding things for you…</div>;
  if (!recs) return <div className="card p-6 mb-8 text-sm text-gray-500">No recommendations yet. Write a journal entry to get personalized picks.</div>;

  return (
    <div className="card p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Picked for you</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecCardList title="Movies" items={recs.movies || []} summary={moviesSummary} onOpen={(id) => navigate(`/movies?recommended=${id}`)} />
        <RecCardList title="Wellness Videos" items={recs.videos || []} onOpen={(item) => openVideo(item)} />
        <RecCardList title="Music" items={recs.music || []} onOpen={(item) => openMusic(item)} />
        <RecCardList title="Activities" items={recs.activities || []} onOpen={(id) => navigate(`/games`)} />
        <RecCardList title="Journal Prompts" items={recs.journalPrompts || []} onOpen={(item) => startPrompt(item)} />
      </div>
    </div>
  );

  function openVideo(item) {
    // open a blank window synchronously to avoid popup blockers
    let win = null;
    try {
      win = window.open("about:blank", "_blank");
    } catch (err) {
      win = null;
    }

    const fallback = item.sourceUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title)}`;

    // try to resolve a best-match YouTube URL via server (requires server YOUTUBE_API_KEY)
    axios
      .get(`/api/recommendations/resolve?q=${encodeURIComponent(item.title)}`)
      .then((res) => {
        const url = res.data?.watchUrl || fallback;
        if (win) win.location = url;
        else window.open(url, "_blank");
      })
      .catch(() => {
        if (win) win.location = fallback;
        else window.open(fallback, "_blank");
      });

    if (item.id) axios.post(`/api/recommendations/videos/watched`, { videoId: item.id, title: item.title }).catch(() => {});
  }

  function openMusic(item) {
    const url = item.sourceUrl || `https://open.spotify.com/search/${encodeURIComponent(item.title)}`;
    try {
      window.open(url, "_blank");
    } catch (err) {}
  }

  function startPrompt(item) {
    // navigate to journal page with prefilled prompt via query param
    navigate(`/journal?prompt=${encodeURIComponent(item.title)}`);
  }
}

function RecCardList({ title, items, onOpen, summary }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
      <h3 className="font-semibold text-sm text-gray-900 mb-2">{title}</h3>
      {summary && <div className="text-xs text-gray-500 mb-3 leading-relaxed">{summary}</div>}
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 bg-white border border-gray-100 p-3 rounded-xl hover:border-brand-200 transition-colors">
            <div className="min-w-0">
              <div className="font-medium text-sm text-gray-900">{it.title}</div>
              {!summary && it.explanation && <div className="text-xs text-gray-500 mt-1">{it.explanation}</div>}
            </div>
            <button
              onClick={() => onOpen(it)}
              className="flex-shrink-0 text-brand-700 bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
