import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Journal from "./pages/Journal";
import Chat from "./pages/Chat";
import Games from "./pages/Games";
import Movies from "./pages/Movies";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import BreathingGame from "./pages/games/BreathingGame";
import MemoryGame from "./pages/games/MemoryGame";
import ZenTyping from "./pages/games/ZenTyping";
import GratitudeJar from "./pages/games/GratitudeJar";
import FocusTap from "./pages/games/FocusTap";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  return user.onboardingCompleted ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />;
}

function OnboardingOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/onboarding" element={<OnboardingOnly><Onboarding /></OnboardingOnly>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
      <Route path="/movies" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
      <Route path="/games/breathing" element={<ProtectedRoute><BreathingGame /></ProtectedRoute>} />
      <Route path="/games/memory" element={<ProtectedRoute><MemoryGame /></ProtectedRoute>} />
      <Route path="/games/typing" element={<ProtectedRoute><ZenTyping /></ProtectedRoute>} />
      <Route path="/games/gratitude" element={<ProtectedRoute><GratitudeJar /></ProtectedRoute>} />
      <Route path="/games/focus" element={<ProtectedRoute><FocusTap /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
