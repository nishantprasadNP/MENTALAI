import { Link } from "react-router-dom";

const features = [
  { icon: "📓", title: "Smart Journal", desc: "Write your thoughts and track your mood over time." },
  { icon: "💬", title: "AI Chat", desc: "Talk to a compassionate AI whenever you need support." },
  { icon: "🌡️", title: "Mood Tracker", desc: "Log your feelings and notice patterns over time." },
  { icon: "🔥", title: "Daily Streak", desc: "Build healthy habits with a daily activity streak." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <span className="text-xl font-bold text-gray-900">Mental AI</span>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm rounded-lg bg-gray-900 hover:bg-gray-700 text-white font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full mb-6 border border-gray-200">
          Your mental wellness companion
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6 max-w-2xl">
          Take care of your{" "}
          <span className="underline decoration-2 underline-offset-4">mental health</span>{" "}
          every day
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mb-10">
          Journal your thoughts, chat with an AI that listens, and track your
          mood — all in one private, safe space.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            to="/signup"
            className="px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-lg font-semibold text-base transition-colors"
          >
            Start for free
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold text-base transition-colors"
          >
            I have an account
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="border border-gray-200 rounded-xl p-6 hover:border-gray-400 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-gray-400 text-sm pb-6">
        Mental AI — built for your well-being
      </footer>
    </div>
  );
}
