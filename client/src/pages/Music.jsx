import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const MOOD_DISPLAY = {
  happy: { emoji: "😊", label: "Happy" },
  calm: { emoji: "😌", label: "Calm" },
  neutral: { emoji: "😐", label: "Okay" },
  sad: { emoji: "😢", label: "Sad" },
  anxious: { emoji: "😟", label: "Anxious" },
  stressed: { emoji: "😰", label: "Stressed" },
  angry: { emoji: "😠", label: "Angry" },
};

const MOOD_SOURCE_TEXT = {
  journal: "Based on your latest journal entry",
  chat: "Based on your recent chat",
  default: "Write a journal entry to get music matched to how you feel",
};

export default function Music() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    axios
      .get("/api/recommendations/music?limit=12")
      .then((res) => mounted && setData(res.data))
      .catch(() => mounted && setError("Couldn't load music right now. Please try again in a moment."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Some covers may still be getting their safety check; fetch again shortly to fill them in.
  // Only artwork is updated (songs whose cover turned out unsafe are removed), so the list doesn't jump.
  const coverChecks = useRef(0);
  useEffect(() => {
    if (!data?.coversPending || coverChecks.current >= 3) return;
    const timer = setTimeout(async () => {
      coverChecks.current += 1;
      try {
        const res = await axios.get("/api/recommendations/music?limit=12");
        const fresh = new Map(res.data.songs.map((song) => [song.id, song]));
        setData((prev) => ({
          ...prev,
          coversPending: res.data.coversPending,
          songs: prev.songs.filter((song) => fresh.has(song.id)).map((song) => ({ ...song, artwork: fresh.get(song.id).artwork })),
        }));
      } catch {
        // keep what's shown
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [data]);

  // Stop any preview when leaving the page
  useEffect(() => () => audioRef.current?.pause(), []);

  function togglePreview(song) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === song.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = song.previewUrl;
    audio.play().then(() => setPlayingId(song.id)).catch(() => setPlayingId(null));
  }

  const mood = MOOD_DISPLAY[data?.mood];

  return (
    <div className="min-h-screen bg-calm">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-up">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Music for your mood</h1>
          <p className="text-gray-500 mt-2">Songs picked for how you feel. Tap play for a 30-second preview.</p>
        </div>

        {data && mood && (
          <div className="card p-5 mb-6 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
              {mood.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">{MOOD_SOURCE_TEXT[data.moodSource] || MOOD_SOURCE_TEXT.default}</p>
              <p className="text-gray-900 font-semibold mt-0.5">{data.summary}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-sm text-gray-500 text-center">{error}</div>
        ) : !data?.songs?.length ? (
          <div className="card p-6 text-sm text-gray-500 text-center">No songs found for this mood. Try another one.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.songs.map((song) => (
              <SongCard key={song.id} song={song} playing={playingId === song.id} onToggle={() => togglePreview(song)} />
            ))}
          </div>
        )}

        <audio ref={audioRef} onEnded={() => setPlayingId(null)} preload="none" />
      </main>
    </div>
  );
}

function SongCard({ song, playing, onToggle }) {
  return (
    <div className={`card overflow-hidden group transition ${playing ? "ring-2 ring-brand-400" : "hover:shadow-lift"}`}>
      <div className="relative aspect-square bg-gradient-to-br from-brand-100 via-peach-100 to-lavender-200">
        {song.artwork && <img src={song.artwork} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <button
          onClick={onToggle}
          aria-label={playing ? `Pause ${song.title}` : `Play preview of ${song.title}`}
          className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lift transition ${
            playing ? "opacity-100" : "opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
          }`}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        {playing && (
          <span className="absolute top-3 left-3 flex items-end gap-0.5 h-4 bg-black/50 rounded-full px-2 py-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-0.5 bg-white rounded-full animate-bounce h-full" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-sm text-gray-900 truncate" title={song.title}>{song.title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5" title={song.artist}>{song.artist}</p>
        <div className="flex gap-2 mt-3">
          <a
            href={song.appleMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-full py-1.5 transition-colors"
          >
            Apple Music
          </a>
          <a
            href={song.spotifySearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full py-1.5 transition-colors"
          >
            Spotify
          </a>
        </div>
      </div>
    </div>
  );
}
