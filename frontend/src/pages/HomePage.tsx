import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vibe } from '../types/api';
import { vibeApi } from '../services/vibeApi';

export default function HomePage() {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    vibeApi
      .listVibes()
      .then((data) => {
        if (!cancelled) setVibes(data.vibes);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-neutral-400">Loading vibes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center">
        <p className="text-red-400 font-medium">Couldn't load vibes</p>
        <p className="text-neutral-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Vibe</h1>
        <p className="text-neutral-400 mt-2">Pick a mood. Get tracks.</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {vibes.map((v) => (
          <button
            key={v.id}
            onClick={() => navigate(`/vibes/${v.id}`)}
            className="aspect-square rounded-2xl bg-neutral-900 hover:bg-neutral-800
                       border border-neutral-800 hover:border-neutral-700
                       transition-colors duration-150
                       flex items-end p-4 text-left"
          >
            <span className="font-medium">{v.name}</span>
          </button>
        ))}
      </div>
    </main>
  );
}