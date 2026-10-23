import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const WELCOME = {
  role: "assistant",
  content: "Hi, I'm Mental AI. This is a judgment-free space to talk about anything — stress, relationships, your day, or something deeper.\n\nHow are you doing today?",
  timestamp: new Date(),
};

// Stages: 'idle' | 'thinking' | 'typing'
const SUGGESTIONS = [
  "I'm feeling stressed today",
  "I can't sleep well lately",
  "Help me reflect on my day",
  "I just want to vent",
];

const THINKING_LABELS = [
  "Thinking...",
  "Reading your message...",
  "Considering this carefully...",
  "Putting thoughts together...",
  "Reflecting on what you shared...",
];

export default function Chat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle"); // 'idle' | 'thinking' | 'typing'
  const [typingText, setTypingText] = useState("");
  const [thinkingLabel, setThinkingLabel] = useState(THINKING_LABELS[0]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText, stage]);

  // Typewriter effect
  const typeMessage = useCallback((text, onDone) => {
    setStage("typing");
    setTypingText("");
    let i = 0;
    const speed = Math.max(8, Math.min(25, Math.floor(3000 / text.length)));

    function tick() {
      if (i <= text.length) {
        setTypingText(text.slice(0, i));
        i++;
        typingRef.current = setTimeout(tick, speed);
      } else {
        onDone();
      }
    }
    typingRef.current = setTimeout(tick, speed);
  }, []);

  useEffect(() => {
    return () => clearTimeout(typingRef.current);
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || stage !== "idle") return;

    const userMsg = { role: "user", content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    // Pick a random thinking label
    setThinkingLabel(THINKING_LABELS[Math.floor(Math.random() * THINKING_LABELS.length)]);
    setStage("thinking");

    try {
      const payload = newMessages.filter((_, i) => i > 0).map(({ role, content }) => ({ role, content }));
      const { data } = await axios.post("/api/chat", { messages: payload });

      const { reply, thinkingTime } = data;

      // Wait for the server-suggested thinking time
      await sleep(thinkingTime || 1500);

      // Then typewriter
      typeMessage(reply, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, timestamp: new Date() },
        ]);
        setTypingText("");
        setStage("idle");
        inputRef.current?.focus();
      });
    } catch {
      await sleep(1000);
      const errMsg = "I'm sorry, something went wrong on my end. Please try again.";
      typeMessage(errMsg, () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errMsg, timestamp: new Date() },
        ]);
        setTypingText("");
        setStage("idle");
        inputRef.current?.focus();
      });
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }

  function clearChat() {
    clearTimeout(typingRef.current);
    setMessages([{ ...WELCOME, timestamp: new Date() }]);
    setTypingText("");
    setStage("idle");
    setInput("");
  }

  const isActive = stage !== "idle";
  const msgCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="h-[100dvh] bg-calm flex flex-col">
      <Navbar />

      <div className="flex-1 min-h-0 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AIAvatar size="lg" />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-brand-400 ring-2 ring-gray-50" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">Mental AI</h1>
              <p className="text-gray-500 text-xs mt-0.5">
                {isActive
                  ? "typing..."
                  : msgCount === 0
                  ? "Here to listen, whenever you need"
                  : `${msgCount} message${msgCount !== 1 ? "s" : ""} in this chat`}
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="text-sm font-medium text-gray-600 hover:text-brand-700 bg-white/70 hover:bg-white border border-gray-200 px-4 py-2 rounded-full transition-colors"
          >
            + New chat
          </button>
        </div>

        {/* Chat window */}
        <div className="flex-1 min-h-0 card overflow-y-auto px-4 sm:px-6 py-6 space-y-5 mb-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {msgCount === 0 && stage === "idle" && (
            <div className="flex flex-wrap gap-2 pl-11">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="text-sm text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-100 px-3.5 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Thinking indicator */}
          {stage === "thinking" && (
            <div className="flex gap-3 items-end animate-fade-up">
              <AIAvatar />
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <ThinkingDots />
                <span className="sr-only">{thinkingLabel}</span>
              </div>
            </div>
          )}

          {/* Typewriter streaming */}
          {stage === "typing" && typingText && (
            <div className="flex gap-3 items-end">
              <AIAvatar />
              <p className="max-w-[80%] bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md text-[15px] leading-relaxed whitespace-pre-wrap">
                {typingText}
                <span className="cursor-blink inline-block w-0.5 h-4 bg-brand-500 ml-0.5 align-text-bottom" />
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <form
          onSubmit={sendMessage}
          className="card flex items-end gap-2 p-2 pl-5 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100 transition"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            aria-label="Message"
            disabled={isActive}
            rows={1}
            className="flex-1 py-2.5 text-[15px] text-gray-900 placeholder-gray-400 bg-transparent resize-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-40 leading-relaxed max-h-40"
            style={{ fieldSizing: "content" }}
          />
          <button
            type="submit"
            disabled={isActive || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 flex-shrink-0 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
        <p className="text-center text-gray-400 text-xs mt-2">Enter to send · Shift + Enter for a new line</p>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`group flex gap-3 items-end animate-fade-up ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && <AIAvatar />}
      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-brand-600 text-white rounded-br-md"
              : "bg-gray-100 text-gray-800 rounded-bl-md"
          }`}
        >
          {message.content}
        </div>
        <span className="text-[11px] text-gray-400 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function AIAvatar({ size = "sm" }) {
  const dims = size === "lg" ? "w-10 h-10" : "w-8 h-8 mb-5";
  return (
    <div className={`${dims} rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center flex-shrink-0 shadow-soft`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2" aria-hidden="true">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
