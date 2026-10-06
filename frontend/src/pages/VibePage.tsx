import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Track, VibeRecommendationResponse } from '../types/api';
import { ApiError, vibeApi } from '../services/vibeApi';

export default function VibePage() {
  const { vibeId = '' } = useParams<{ vibeId: string }>();
  const [data, setData] = useState<VibeRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

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

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <Link
        to="/"
        className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        ← Back
      </Link>

      {loading && <p className="mt-12 text-neutral-400">Loading tracks…</p>}

      {notFound && (
        <div className="mt-12">
          <h1 className="text-2xl font-semibold">Unknown vibe</h1>
          <p className="text-neutral-500 mt-2">"{vibeId}" isn't in the catalog.</p>
        </div>
      )}

      {error && (
        <div className="mt-12">
          <h1 className="text-2xl font-semibold text-red-400">Something went wrong</h1>
          <p className="text-neutral-500 mt-2">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          <header className="mt-8 mb-6 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{data.vibeName}</h1>
              <p className="text-neutral-500 text-sm mt-1">
                {data.tracks.length} tracks
              </p>
            </div>
            <button
              onClick={() => setShuffleKey((k) => k + 1)}
              className="rounded-full px-4 py-2 text-sm bg-neutral-900
                         hover:bg-neutral-800 border border-neutral-800
                         hover:border-neutral-700 transition-colors"
            >
              Shuffle again
            </button>
          </header>

          {data.tracks.length === 0 ? (
            <p className="text-neutral-500">
              No tracks found for this vibe. Try another one.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.tracks.map((t) => (
                <TrackRow key={t.id} track={t} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function TrackRow({ track }: { track: Track }) {
  const content = (
    <>
      <p className="font-medium truncate">{track.name}</p>
      <p className="text-sm text-neutral-500 truncate mt-0.5">
        {track.artist}
        {track.album ? ` · ${track.album}` : ''}
      </p>
    </>
  );

  const className =
    'block rounded-xl p-4 bg-neutral-900/60 border border-neutral-900 ' +
    'hover:border-neutral-800 transition-colors';

  if (track.externalUrl) {
    return (
      <li>
        <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      </li>
    );
  }

  return <li className={className}>{content}</li>;
}