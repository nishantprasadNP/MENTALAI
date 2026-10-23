import Logo from "./Logo";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen bg-calm flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-brand-200/50 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-peach-200/50 blur-3xl animate-float [animation-delay:-7s]" />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="text-3xl font-semibold text-gray-900 mt-6">{title}</h1>
          <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
        </div>
        <div className="card p-7">{children}</div>
        <p className="text-center text-gray-500 text-sm mt-6">{footer}</p>
      </div>
    </div>
  );
}

export const inputClass =
  "w-full bg-gray-50/60 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-100 transition text-sm";

export const primaryButtonClass =
  "w-full bg-brand-600 hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-soft transition text-sm";
