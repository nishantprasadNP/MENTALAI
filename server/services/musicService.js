// Mood-based music recommendations from the iTunes Search API (free, no API key).
// Each result includes album art, a 30-second preview and an Apple Music link.
const { checkImages } = require("./imageSafetyService");
const MusicSearchCache = require("../models/MusicSearchCache");

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const COUNTRY = "IN";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_SONGS_PER_ARTIST = 2;
// How long a page load waits for new cover checks before responding without those covers
const COVER_CHECK_BUDGET_MS = 2000;
const EXCLUDED_GENRES = ["Children's Music", "Children’s Music", "Kids"];

// Words that make a title/album unsuitable for a wellness app (explicit, drugs, self-harm, violence)
const BLOCKED_WORDS = [
  "fuck", "shit", "bitch", "nigga", "dick", "pussy", "cock", "whore", "slut", "hoe", "sex", "sexy", "nude", "naked",
  "porn", "horny", "booty", "ass", "damn", "hell", "drug", "drugs", "cocaine", "weed", "high", "drunk", "molly",
  "lean", "pills", "suicide", "suicidal", "kill", "killer", "killing", "die", "dying", "dead", "death", "murder",
  "gun", "guns", "blood", "bloody", "cut", "hate", "hang", "overdose", "devil", "satan",
];
const BLOCKED_PATTERN = new RegExp(`\\b(${BLOCKED_WORDS.join("|")})\\b`, "i");

// Only songs that are clean AND come from a clean album (explicit albums can have explicit cover art),
// and whose title, album and artist contain no blocked words.
function isSafeTrack(track) {
  if (track.kind !== "song" || !track.previewUrl) return false;
  if (track.trackExplicitness !== "notExplicit" || track.collectionExplicitness !== "notExplicit") return false;
  if (EXCLUDED_GENRES.includes(track.primaryGenreName)) return false;
  // Budget "Various Artists" compilations often use suggestive cover art
  if (/various artists/i.test(track.collectionArtistName || "")) return false;
  const text = `${track.trackName} ${track.collectionName} ${track.artistName}`;
  return !BLOCKED_PATTERN.test(text);
}

const ALLOWED_MOODS = ["happy", "sad", "stressed", "anxious", "calm", "angry", "neutral"];

// Search terms per journal mood, plus a word used to blend the mood with favourite genres
const MOOD_MUSIC = {
  stressed: { terms: ["lofi chill beats", "calm piano", "acoustic chill"], adjective: "chill", label: "calm, unwinding music" },
  sad: { terms: ["comforting acoustic songs", "uplifting pop", "hopeful indie"], adjective: "uplifting", label: "gentle, comforting songs" },
  anxious: { terms: ["ambient relaxation", "peaceful piano", "meditation music"], adjective: "calm", label: "soothing, grounding music" },
  happy: { terms: ["feel good pop", "happy upbeat songs", "feel good indie"], adjective: "happy", label: "upbeat, feel-good songs" },
  angry: { terms: ["calm instrumental", "chill rock", "lofi beats"], adjective: "calm", label: "music to cool down" },
  calm: { terms: ["acoustic chill", "soft jazz", "ambient chill"], adjective: "relaxing", label: "relaxed, easy listening" },
  neutral: { terms: ["indie chill", "feel good acoustic", "lofi beats"], adjective: "chill", label: "easygoing music" },
};

const searchCache = new Map();

function sanitizeMood(mood) {
  const value = String(mood || "").toLowerCase().trim();
  return ALLOWED_MOODS.includes(value) ? value : "neutral";
}

// Search results are cached in memory and in MongoDB (so restarts don't mean slow loads)
async function searchSongs(term) {
  const cached = searchCache.get(term);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.results;

  const stored = await MusicSearchCache.findOne({ term }).lean();
  if (stored && Date.now() - new Date(stored.updatedAt).getTime() < CACHE_TTL_MS) {
    searchCache.set(term, { at: new Date(stored.updatedAt).getTime(), results: stored.results });
    return stored.results;
  }

  try {
    const query = new URLSearchParams({ term, media: "music", entity: "song", limit: "25", country: COUNTRY });
    const res = await fetch(`${ITUNES_SEARCH_URL}?${query}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`iTunes search failed with ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).filter(isSafeTrack);
    searchCache.set(term, { at: Date.now(), results });
    await MusicSearchCache.updateOne({ term }, { $set: { results } }, { upsert: true });
    return results;
  } catch (err) {
    if (stored) return stored.results; // stale results are better than none
    throw err;
  }
}

function toSong(track) {
  const searchTerm = encodeURIComponent(`${track.trackName} ${track.artistName}`);
  return {
    id: String(track.trackId),
    title: track.trackName,
    artist: track.artistName,
    album: track.collectionName,
    genre: track.primaryGenreName,
    artwork: (track.artworkUrl100 || "").replace("100x100bb", "400x400bb"),
    previewUrl: track.previewUrl,
    appleMusicUrl: track.trackViewUrl,
    spotifySearchUrl: `https://open.spotify.com/search/${searchTerm}`,
    durationMs: track.trackTimeMillis,
  };
}

// Takes songs from each search in turn so the list mixes all search terms
function interleave(lists, limit) {
  const songs = [];
  const seenTitles = new Set();
  const artistCounts = new Map();
  const maxLength = Math.max(0, ...lists.map((list) => list.length));

  for (let i = 0; i < maxLength && songs.length < limit; i++) {
    for (const list of lists) {
      const track = list[i];
      if (!track || songs.length >= limit) continue;
      const titleKey = `${track.trackName}`.toLowerCase().replace(/\s*[([].*?[)\]]\s*/g, "").trim();
      const artistCount = artistCounts.get(track.artistName) || 0;
      if (seenTitles.has(titleKey) || artistCount >= MAX_SONGS_PER_ARTIST) continue;
      seenTitles.add(titleKey);
      artistCounts.set(track.artistName, artistCount + 1);
      songs.push(toSong(track));
    }
  }
  return songs;
}

// waitForCovers: true is used by background warm-up, which can wait for every cover check
async function recommendMusic({ mood, favoriteGenres = [], limit = 12, waitForCovers = false }) {
  const safeMood = sanitizeMood(mood);
  const profile = MOOD_MUSIC[safeMood];
  const genreTerms = favoriteGenres.slice(0, 2).map((genre) => `${profile.adjective} ${genre}`);
  const terms = [...genreTerms, ...profile.terms];

  const lists = await Promise.all(
    terms.map((term) =>
      searchSongs(term).catch((err) => {
        console.warn(`Music search failed for '${term}':`, err.message);
        return [];
      })
    )
  );

  // Take extra candidates, then check every cover: unsafe covers drop the song, covers that
  // aren't checked yet are hidden (plain gradient) and filled in on a later load. Checks keep
  // running in the background, so the page never waits long on Gemini.
  const candidates = interleave(lists, limit * 2);
  const check = checkImages(candidates.map((song) => song.artwork)).catch(() => new Map());
  const verdicts = waitForCovers
    ? await check
    : await Promise.race([check, new Promise((resolve) => setTimeout(() => resolve(null), COVER_CHECK_BUDGET_MS))]).then(
        (result) => result || checkImages(candidates.map((song) => song.artwork), { cachedOnly: true })
      );
  const songs = candidates
    .filter((song) => verdicts.get(song.artwork) !== "unsafe")
    .map((song) => (verdicts.get(song.artwork) === "safe" ? song : { ...song, artwork: "" }))
    .slice(0, limit);
  const genreText = favoriteGenres.length ? ` with a touch of ${favoriteGenres.slice(0, 2).join(" and ")}` : "";
  const summary = `You're feeling ${safeMood}, so here's ${profile.label}${genreText}.`;
  const coversPending = [...verdicts.values()].includes("unknown");
  return { mood: safeMood, summary, songs, coversPending };
}

module.exports = {
  ALLOWED_MOODS,
  recommendMusic,
  sanitizeMood,
};
