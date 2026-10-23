import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const navLinks = [
  { to: "/dashboard", label: "Home" },
  { to: "/journal", label: "Journal" },
  { to: "/chat", label: "Chat" },
  { to: "/movies", label: "Movies" },
  { to: "/games", label: "Games" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const firstName = user?.name?.split(" ")[0] || "";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-gray-50/75 backdrop-blur-md border-b border-gray-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo to="/dashboard" />

        <nav className="hidden md:flex items-center gap-1 bg-white/70 border border-gray-200/80 rounded-full p-1 shadow-soft">
          {navLinks.map((link) => (
            <NavItem key={link.to} link={link} active={location.pathname.startsWith(link.to)} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            title="Profile"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-peach-200 to-lavender-200 text-gray-800 font-semibold text-sm flex items-center justify-center ring-2 ring-white"
          >
            {firstName.charAt(0).toUpperCase() || "?"}
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex gap-1 overflow-x-auto px-4 pb-3 -mt-1 [scrollbar-width:none]">
        {navLinks.map((link) => (
          <NavItem key={link.to} link={link} active={location.pathname.startsWith(link.to)} />
        ))}
      </nav>
    </header>
  );
}

function NavItem({ link, active }) {
  return (
    <Link
      to={link.to}
      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "bg-brand-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {link.label}
    </Link>
  );
}
