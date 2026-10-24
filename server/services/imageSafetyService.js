// Checks album artwork with Gemini vision before it is shown in the app. Store metadata
// (e.g. iTunes "explicit" flags) only rates audio, so covers with nudity or suggestive
// images can still slip through. Verdicts are stored in the database so each image is
// only checked once, and covers are sent to Gemini in batches (one request per batch)
// to stay within the free-plan rate limit. A "safe" verdict is a best-effort check,
// not a guarantee.
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ImageVerdict = require("../models/ImageVerdict");

const MODEL = "gemini-flash-lite-latest";
const TIMEOUT_MS = 30000;
const BATCH_SIZE = 16;

const PROMPT = [
  "You are moderating album cover art for a mental wellness app used by teenagers and adults.",
  "For each image, answer UNSAFE if it shows any nudity, partial nudity, underwear or swimwear focus, sexualised or suggestive poses,",
  "violence, weapons, blood, drugs, alcohol, smoking, self-harm, horror or disturbing imagery, or offensive gestures or text.",
  "Otherwise answer SAFE.",
].join(" ");

function isConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== "your_gemini_api_key_here");
}

// iTunes artwork URLs encode their size; a smaller copy is enough to judge the image
function smallVersion(url) {
  return url.replace(/\/\d+x\d+bb\./, "/200x200bb.");
}

async function downloadImage(url) {
  const res = await fetch(smallVersion(url), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`image download failed with ${res.status}`);
  return {
    mimeType: res.headers.get("content-type") || "image/jpeg",
    data: Buffer.from(await res.arrayBuffer()).toString("base64"),
  };
}

// Sends one batch of covers to Gemini and returns Map(url -> "safe" | "unsafe")
async function classifyBatch(urls) {
  const images = await Promise.all(urls.map((url) => downloadImage(url).catch(() => null)));
  const usable = urls.map((url, i) => ({ url, image: images[i] })).filter((item) => item.image);
  if (!usable.length) return new Map();

  const parts = [{ text: `${PROMPT} There are ${usable.length} images, labelled in order.` }];
  usable.forEach((item, i) => {
    parts.push({ text: `Image ${i + 1}:` });
    parts.push({ inlineData: item.image });
  });
  parts.push({
    text: `Reply with a JSON array of exactly ${usable.length} strings, "SAFE" or "UNSAFE", one per image in order.`,
  });

  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel(
    { model: MODEL, generationConfig: { temperature: 0, responseMimeType: "application/json" } },
    { timeout: TIMEOUT_MS }
  );
  const result = await model.generateContent(parts);
  const answers = JSON.parse(result.response.text());
  if (!Array.isArray(answers) || answers.length !== usable.length) {
    throw new Error("Gemini returned an unexpected number of verdicts");
  }
  // Anything other than a clear SAFE is treated as unsafe
  return new Map(
    usable.map((item, i) => [item.url, String(answers[i]).trim().toUpperCase() === "SAFE" ? "safe" : "unsafe"])
  );
}

// Returns Map(url -> "safe" | "unsafe" | "unknown"); "unknown" means not checked (yet).
// cachedOnly: only read stored verdicts, never call Gemini.
const inFlight = new Set();
async function checkImages(urls, { cachedOnly = false } = {}) {
  const unique = [...new Set(urls.filter(Boolean))];
  const verdicts = new Map();

  const stored = await ImageVerdict.find({ url: { $in: unique } }).lean();
  stored.forEach((doc) => verdicts.set(doc.url, doc.verdict));

  // Skip covers another request is already checking
  const unchecked = unique.filter((url) => !verdicts.has(url) && !inFlight.has(url));
  if (!cachedOnly && unchecked.length && isConfigured()) {
    unchecked.forEach((url) => inFlight.add(url));
    for (let i = 0; i < unchecked.length; i += BATCH_SIZE) {
      try {
        const batch = await classifyBatch(unchecked.slice(i, i + BATCH_SIZE));
        if (batch.size) {
          await ImageVerdict.bulkWrite(
            [...batch].map(([url, verdict]) => ({
              updateOne: { filter: { url }, update: { $set: { verdict } }, upsert: true },
            }))
          );
        }
        batch.forEach((verdict, url) => verdicts.set(url, verdict));
      } catch (err) {
        console.warn("Image safety check failed:", err.message.slice(0, 200));
      }
    }
    unchecked.forEach((url) => inFlight.delete(url));
  }

  return new Map(unique.map((url) => [url, verdicts.get(url) || "unknown"]));
}

module.exports = { checkImages };
