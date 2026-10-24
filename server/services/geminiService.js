const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const FALLBACK_MODEL = "gemini-flash-lite-latest";
const GEMINI_TIMEOUT_MS = 15000;

const systemPrompt = [
  "You are Mental AI, a warm, supportive mental wellness companion. You talk like a caring friend who really listens, not like a self-help article.",
  "",
  "How to reply:",
  "- Keep it short: 2-4 sentences, like a text message. No lists, headings or bullet points unless the user asks for steps.",
  "- Respond to what the user just said first. Reflect their feeling or point in your own words so they feel heard.",
  "- Personalize naturally: bring in something they told you before (people, pets, events, worries, journal entries) only when it is relevant to what they are saying now. Never recite their profile or say things like 'since your mood is stable' or 'based on your data'.",
  "- Ask at most one gentle follow-up question, and only when it helps the conversation continue.",
  "- Give advice only when they ask for it or clearly need it, and keep it to one small, concrete suggestion.",
  "- Match their tone and energy. If they write one line, reply briefly.",
  "",
  "Boundaries:",
  "- Never diagnose or claim to be a therapist.",
  "- If the user mentions self-harm, suicide or being in danger, respond with care and encourage them to contact a local emergency number or crisis line right away.",
].join("\n");

function getClient() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

function getModel(client, modelName, systemInstruction) {
  return client.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: { temperature: 0.75 },
  }, { timeout: GEMINI_TIMEOUT_MS });
}

async function sendPrompt(client, modelName, request) {
  const model = getModel(client, modelName, request.systemInstruction);
  const result = await model.generateContent({ contents: request.contents });
  const responseText = result?.response?.text?.();
  if (!responseText || typeof responseText !== "string") {
    throw new Error("Gemini returned an unexpected response format.");
  }
  return responseText.trim();
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
    lines.push("Memory from past conversations:");
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

// Only the current conversation is sent as chat turns, so the model replies to what the user
// is saying now. Past conversations, profile, mood and journals go in the system instruction
// as background knowledge about the user.
function buildRequest(userMessage, context) {
  const contents = [];
  const current = Array.isArray(context.currentConversation) ? context.currentConversation : [];
  [...current, { role: "user", content: userMessage }].forEach((message) => {
    const text = String(message.content || "").trim();
    if (!text) return;
    const role = message.role === "user" ? "user" : "model";
    const last = contents[contents.length - 1];
    if (!last && role === "model") return; // Gemini conversations must start with the user
    if (last && last.role === role) {
      last.parts[0].text += `\n${text}`;
    } else {
      contents.push({ role, parts: [{ text }] });
    }
  });

  const instructions = [
    systemPrompt,
    "",
    "Memory: the background below (including notes from past conversations) is what you already know about this person. Use it silently to understand who they are, what they like, what helps them and what they are going through, and let it shape your tone and suggestions. Do not bring up past topics or say you remember something unless the user mentions it or it is directly relevant to what they are saying now.",
  ];
  const contextText = formatContext(context);
  if (contextText) {
    instructions.push("", "Background about the user (never recite it):", contextText);
  }

  return { systemInstruction: instructions.join("\n"), contents };
}

async function generateMentalAIResponse(userMessage, context = {}) {
  if (!userMessage || !String(userMessage).trim()) {
    return "";
  }

  const client = getClient();
  const request = buildRequest(String(userMessage).trim(), context);

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
    return await sendPrompt(client, PRIMARY_MODEL, request);
  } catch (err) {
    console.warn(`Gemini service: ${PRIMARY_MODEL} failed, retrying with ${FALLBACK_MODEL}.`, err.message);
  }

  try {
    return await sendPrompt(client, FALLBACK_MODEL, request);
  } catch (err) {
    console.error("Gemini service error:", err.message);
    throw new Error("Unable to generate Mental AI response.");
  }
}

module.exports = {
  generateMentalAIResponse,
};
