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

  if (loading) return <div className="bg-white border rounded-xl p-4">Loading recommendations…</div>;
  if (!recs) return <div className="bg-white border rounded-xl p-4">No recommendations available.</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-semibold mb-3">Personalized Recommendations</h2>
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
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
      <h3 className="font-medium text-sm mb-2">{title}</h3>
      {summary && <div className="text-xs text-gray-500 mb-2">{summary}</div>}
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-start justify-between gap-3 bg-white p-3 rounded-lg">
            <div>
              <div className="font-semibold text-sm">{it.title}</div>
              {!summary && it.explanation && <div className="text-xs text-gray-500 mt-1">{it.explanation}</div>}
              <div className="text-xs text-gray-400 mt-1">Score: {it.score ?? "—"}</div>
            </div>
            <div className="flex flex-col items-end">
              <button
                onClick={() => onOpen(it)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
