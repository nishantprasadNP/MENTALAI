import { Link } from "react-router-dom";

export default function Logo({ to = "/", size = "md" }) {
  const mark = size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const text = size === "lg" ? "text-2xl" : "text-xl";
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 group">
      <span
        className={`${mark} rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center shadow-soft transition-transform group-hover:scale-105`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2" aria-hidden="true">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </span>
      <span className={`font-display font-semibold ${text} text-gray-900 tracking-tight`}>Mental AI</span>
    </Link>
  );
}
