const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";

const systemPrompt = [
  "You are Mental AI, a supportive mental wellness assistant.",
  "You help users with emotional support, journaling, wellness activities, and mindful self-care.",
  "You never provide medical diagnoses or claim to be a therapist.",
  "Use the user's profile, recent journal mood, mood analytics, and conversation history to personalize your response.",
  "If the user asks about a movie recommendation, explain how the choice supports their current mood and interests.",
].join("\n");

function getClient() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
}

function getModel(client) {
  try {
    return client.getGenerativeModel({ model: PRIMARY_MODEL });
  } catch (err) {
    console.warn("Gemini service: failed to load primary model, falling back to 1.5 flash.", err.message);
    return client.getGenerativeModel({ model: FALLBACK_MODEL });
  }
}

function formatContext(context) {
  if (!context || typeof context !== "object") return "";

  const lines = [];
  if (Array.isArray(context.interests) && context.interests.length) {
    lines.push(`User interests: ${context.interests.join(", ")}`);
  }
  if (Array.isArray(context.preferredGenres) && context.preferredGenres.length) {
    lines.push(`Preferred genres: ${context.preferredGenres.join(", ")}`);
  }
  if (Array.isArray(context.stressReliefPreferences) && context.stressReliefPreferences.length) {
    lines.push(`Stress relief preferences: ${context.stressReliefPreferences.join(", ")}`);
  }
  if (context.dominantMood) {
    lines.push(`Dominant mood: ${context.dominantMood}`);
  }
  if (context.moodTrend) {
    lines.push(`Mood trend: ${context.moodTrend}`);
  }
  if (context.recentJournalEntries && context.recentJournalEntries.length) {
    lines.push("Recent journal entries:");
    context.recentJournalEntries.slice(0, 5).forEach((entry, index) => {
      lines.push(`  ${index + 1}. [${entry.mood || "unknown"}] ${entry.title || "Untitled"}: ${entry.content?.trim().slice(0, 180) || "(no content)"}`);
    });
  }
  if (typeof context.previousConversationHistory === "string" && context.previousConversationHistory.trim()) {
    lines.push("Previous conversation history:");
    lines.push(context.previousConversationHistory.trim());
  }
  if (context.selectedMovie) {
    const movie = context.selectedMovie;
    lines.push("Selected movie:");
    lines.push(`- Title: ${movie.title}`);
    if (movie.overview) lines.push(`- Overview: ${movie.overview}`);
    if (Array.isArray(movie.genres) && movie.genres.length) lines.push(`- Genres: ${movie.genres.join(", ")}`);
  }

  return lines.join("\n");
}

async function generateMentalAIResponse(userMessage, context = {}) {
  if (!userMessage || !String(userMessage).trim()) {
    return "";
  }

  const client = getClient();
  const model = getModel(client);
  const contextText = formatContext(context);

  const userPrompt = [
    "User Message:",
    String(userMessage).trim(),
    "",
    contextText ? "Context:" : "",
    contextText,
  ]
    .filter(Boolean)
    .join("\n");

  console.debug("Gemini request prepared", {
    contextSummary: {
      interests: context.interests?.length,
      preferredGenres: context.preferredGenres?.length,
      stressReliefPreferences: context.stressReliefPreferences?.length,
      dominantMood: context.dominantMood,
      moodTrend: context.moodTrend,
      journalCount: context.recentJournalEntries?.length,
      conversationHistoryLength: context.previousConversationHistory?.length,
    },
  });

  try {
    const chat = model.startChat({ systemInstruction: systemPrompt, temperature: 0.75 });
    const result = await chat.sendMessage(userPrompt);
    const responseText = result?.response?.text?.();

    if (!responseText || typeof responseText !== "string") {
      throw new Error("Gemini returned an unexpected response format.");
    }

    return responseText.trim();
  } catch (err) {
    console.error("Gemini service error:", err.message);
    throw new Error("Unable to generate Mental AI response.");
  }
}

module.exports = {
  generateMentalAIResponse,
};
