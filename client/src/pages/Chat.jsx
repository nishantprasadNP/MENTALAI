import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const WELCOME = {
  role: "assistant",
  content: "Hello. I'm Mental AI — a space to talk, think, and feel heard.\n\nI'm here to listen without judgment. You can share whatever is on your mind — stress, relationships, how your day went, or something deeper. I'll do my best to respond thoughtfully.\n\nHow are you doing today?",
  timestamp: new Date(),
};

// Stages: 'idle' | 'thinking' | 'typing'
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mental AI Chat</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {msgCount === 0
                ? "Start the conversation"
                : `${msgCount} message${msgCount !== 1 ? "s" : ""} in this session`}
            </p>
          </div>
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-gray-900 border border-gray-300 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            New chat
          </button>
        </div>

        {/* Chat window */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-y-auto p-5 space-y-6 mb-4 min-h-[440px] max-h-[60vh]">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Thinking indicator */}
          {stage === "thinking" && (
            <div className="flex gap-3 items-start">
              <AIAvatar />
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-xs text-gray-400">{thinkingLabel}</span>
                <ThinkingDots />
              </div>
            </div>
          )}

          {/* Typewriter streaming */}
          {stage === "typing" && typingText && (
            <div className="flex gap-3 items-start">
              <AIAvatar />
              <div className="flex-1 max-w-[85%]">
                <span className="text-xs text-gray-400 block mb-1">Mental AI</span>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {typingText}
                  <span className="cursor-blink inline-block w-0.5 h-4 bg-gray-600 ml-0.5 align-text-bottom" />
                </p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind... (Enter to send, Shift+Enter for newline)"
            disabled={isActive}
            rows={3}
            className="w-full text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none disabled:opacity-40 leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {input.length > 0 ? `${input.length} characters` : "Press Enter to send"}
            </span>
            <button
              onClick={sendMessage}
              disabled={isActive || !input.trim()}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isActive ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* <p className="text-center text-gray-400 text-xs mt-3">
          Mental AI is not a substitute for professional mental health care. In crisis? Call iCall: 9152987821
        </p> */}
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? <UserAvatar /> : <AIAvatar />}
      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <span className="text-xs text-gray-400">
          {isUser ? "You" : "Mental AI"} · {formatTime(message.timestamp)}
        </span>
        <div
          className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-gray-900 text-white rounded-tr-sm"
              : "bg-gray-100 text-gray-800 rounded-tl-sm"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

function AIAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0 mt-5">
      AI
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-5">
      You
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
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
