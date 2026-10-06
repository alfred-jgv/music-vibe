import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { VibeRecommendationResponse } from '../types/api';
import { ApiError, vibeApi } from '../services/vibeApi';
import SwipeStack from '../components/SwipeStack';
import TrackCard from '../components/TrackCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import NowPlayingPanel from '../components/NowPlayingPanel';
import { getVibeStripe } from '../utils/vibeTheme';

export default function VibePage() {
  const { vibeId = '' } = useParams<{ vibeId: string }>();
  const [data, setData] = useState<VibeRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [kept, setKept] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setKept([]);

    vibeApi
      .recommend(vibeId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vibeId, shuffleKey]);

  const stripe = getVibeStripe(vibeId);

  return (
    <main className="h-dvh flex flex-col lg:flex-row overflow-hidden bg-[#fbf9f4]">
      {/* ---------- Left / Top: Now Playing panel ---------- */}

      {/* Mobile: slim top bar */}
      <div className="lg:hidden shrink-0 border-b border-[#0d1117]/10">
        <NowPlayingPanel vibeId={vibeId} variant="bar" />
      </div>

      {/* Desktop: side panel */}
      <aside className="hidden lg:flex lg:w-110 lg:shrink-0 flex-col
                        border-r border-[#0d1117]/10 overflow-y-auto">
        <div className="p-8 flex-1">
          <NowPlayingPanel vibeId={vibeId} variant="panel" />
        </div>
      </aside>

      {/* ---------- Right / Bottom: Swipe stack stage ---------- */}

      <section className="relative flex-1 min-h-0 flex flex-col">
        {/* Back link floating top-left */}
        <Link
          to="/"
          className="absolute top-4 left-4 z-20 inline-flex items-center gap-2
                     text-sm text-[#7a8699] hover:text-[#0d1117] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        {/* Shuffle button floating top-right */}
        {data && !loading && (
          <button
            onClick={() => setShuffleKey((k) => k + 1)}
            className="absolute top-4 right-4 z-20 rounded-full px-5 py-2 text-sm font-medium
                       text-[#fbf9f4] transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: stripe.accent }}
          >
            Shuffle
          </button>
        )}

        {/* Stage */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 py-20">
          {notFound && (
            <div className="text-center">
              <h1 className="text-4xl">Unknown vibe</h1>
              <p className="text-[#7a8699] mt-2">
                "{vibeId}" isn't in the catalog.
              </p>
            </div>
          )}

          {error && !notFound && (
            <div className="text-center">
              <h1 className="text-4xl text-red-600">Something went wrong</h1>
              <p className="text-[#7a8699] mt-2">{error}</p>
            </div>
          )}

          {loading && !notFound && !error && (
            <div className="w-full max-w-md">
              <div className="h-10 w-48 rounded bg-[#0d1117]/8 animate-pulse mb-6 mx-auto" />
              <div className="w-full h-105 sm:h-120 relative">
                <LoadingSkeleton vibeId={vibeId} />
              </div>
            </div>
          )}

          {data && !loading && !notFound && !error && (
            <>
              {data.tracks.length === 0 ? (
                <p className="text-[#7a8699]">
                  No tracks found for this vibe.
                </p>
              ) : (
                <SwipeStack
                  onSwipe={(i, dir) => {
                    if (dir === 'right') {
                      setKept((prev) => [...prev, data.tracks[i].id]);
                    }
                  }}
                >
                  {data.tracks.map((t) => (
                    <TrackCard key={t.id} track={t} vibeId={vibeId} />
                  ))}
                </SwipeStack>
              )}

              {kept.length > 0 && (
                <p className="mt-6 text-sm text-[#7a8699] text-center">
                  {kept.length} kept this session
                </p>
              )}
            </>
          )}
        </div>

        {/* Hint footer (desktop only) */}
        {data && !loading && (
          <p className="hidden lg:block text-[10px] uppercase tracking-[0.3em]
                        text-[#7a8699] text-center pb-6">
            Swipe right to keep · left to skip
          </p>
        )}
      </section>
    </main>
  );
}