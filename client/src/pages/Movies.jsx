import Navbar from "../components/Navbar";
import MovieCarousel from "../components/MovieCarousel";

export default function Movies() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Movie recommendations</h1>
          <p className="text-gray-500 mt-2">Emotionally intelligent movies chosen for your mood and interests.</p>
        </div>

        <MovieCarousel limit={12} />
      </main>
    </div>
  );
}
