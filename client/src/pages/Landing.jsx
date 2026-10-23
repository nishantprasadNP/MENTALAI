import { Link } from "react-router-dom";
import Logo from "../components/Logo";

const features = [
  { icon: "📓", tint: "bg-peach-100", title: "Mood journal", desc: "Write freely, tag how you feel, and see your patterns over time." },
  { icon: "💬", tint: "bg-brand-100", title: "A companion that listens", desc: "Talk anytime to an AI that remembers what matters to you." },
  { icon: "🎬", tint: "bg-lavender-100", title: "Picks for your mood", desc: "Movies, videos and activities chosen for how you feel today." },
  { icon: "🌿", tint: "bg-brand-50", title: "Calming games", desc: "Breathing, focus and gratitude exercises for a quick reset." },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-calm flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute top-24 -left-32 w-[28rem] h-[28rem] rounded-full bg-brand-200/40 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-40 -right-32 w-[26rem] h-[26rem] rounded-full bg-peach-200/50 blur-3xl animate-float [animation-delay:-5s]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[22rem] h-[22rem] rounded-full bg-lavender-200/40 blur-3xl animate-float [animation-delay:-9s]" />

      <header className="relative max-w-6xl w-full mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
        <Logo />
        <div className="flex gap-2">
          <Link to="/login" className="px-4 py-2 text-sm rounded-full text-gray-700 hover:bg-white/70 transition-colors">
            Log in
          </Link>
          <Link to="/signup" className="px-5 py-2 text-sm rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-soft transition-colors">
            Get started
          </Link>
        </div>
      </header>

      <main className="relative flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-12 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div className="text-center lg:text-left animate-fade-up">
          <span className="inline-flex items-center gap-2 bg-white/80 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-100 shadow-soft mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Your mental wellness companion
          </span>
          <h1 className="text-5xl sm:text-6xl font-semibold text-gray-900 leading-[1.05] mb-6">
            A gentle space to <em className="text-brand-600">feel heard</em>, every day.
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
            Journal your thoughts, talk to an AI that truly listens, and get recommendations that fit your mood — all in one private place.
          </p>
          <div className="flex gap-3 flex-wrap justify-center lg:justify-start">
            <Link to="/signup" className="px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-semibold shadow-lift transition-colors">
              Start for free
            </Link>
            <Link to="/login" className="px-7 py-3.5 bg-white/80 border border-gray-200 hover:bg-white text-gray-800 rounded-full font-semibold transition-colors">
              I have an account
            </Link>
          </div>
        </div>

        {/* Chat preview */}
        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms]">
          <div className="card p-5 shadow-lift">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-700" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Mental AI</p>
                <p className="text-xs text-brand-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Here for you
                </p>
              </div>
            </div>
            <div className="space-y-3 pt-4 text-sm">
              <p className="ml-auto w-fit max-w-[80%] bg-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
                couldn't study at all today, exams are monday 😩
              </p>
              <p className="w-fit max-w-[85%] bg-gray-100 text-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-md">
                That sounds really draining. Want to try just ten minutes of review tonight, or call it and rest?
              </p>
              <p className="ml-auto w-fit max-w-[80%] bg-brand-600 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
                ten minutes. with lofi on
              </p>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 card px-4 py-3 flex items-center gap-2 text-sm">
            <span className="text-lg">😌</span>
            <span className="text-gray-700 font-medium">Mood: calmer</span>
          </div>
        </div>
      </main>

      <section className="relative px-4 sm:px-6 pb-20 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:-translate-y-1 hover:shadow-lift transition">
              <div className={`w-11 h-11 rounded-xl ${f.tint} flex items-center justify-center text-xl mb-4`}>{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative text-center text-gray-400 text-sm pb-8">
        Mental AI is a self-care tool, not a substitute for professional care.
      </footer>
    </div>
  );
}
