import { useEffect, useState } from 'react';
import type { VibeRecommendationResponse } from '../types/api';
import { vibeApi } from '../services/vibeApi';
import { getVibeStripe } from '../utils/vibeTheme';
import TrackCard from './TrackCard';

interface NowPlayingPanelProps {
  vibeId: string | null;
  /** Layout variant: 'panel' for side, 'bar' for the mobile compact header */
  variant?: 'panel' | 'bar';
}

export default function NowPlayingPanel({
  vibeId,
  variant = 'panel',
}: NowPlayingPanelProps) {
  const [data, setData] = useState<VibeRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vibeId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setError(null);
    setData(null);
    vibeApi
      .recommend(vibeId)
      .then((res) => !cancelled && setData(res))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [vibeId]);

  // ---- Compact bar (mobile) ----
  if (variant === 'bar') {
    const stripe = vibeId ? getVibeStripe(vibeId) : null;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: stripe?.accent ?? '#7a8699' }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#7a8699]">
            Now playing
          </p>
          <p className="font-serif text-base truncate text-[#0d1117]">
            {data?.vibeName ?? 'Nothing on the platter'}
          </p>
        </div>
        {stripe && (
          <div className="flex h-2 w-20 overflow-hidden rounded-full shrink-0">
            {stripe.colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Full panel (desktop side / mobile expanded) ----
  if (!vibeId) {
    return (
      <div className="h-full flex flex-col justify-center py-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#7a8699] mb-3">
          Now playing
        </p>
        <h2 className="font-serif text-4xl text-[#0d1117]/40">
          Nothing on the platter
        </h2>
        <p className="text-sm text-[#7a8699] mt-3 max-w-xs">
          Grab a record from the desk and drop it on the turntable.
        </p>
      </div>
    );
  }

  const stripe = getVibeStripe(vibeId);

  return (
    <div key={vibeId} className="animate-fade-in">
      <p
        className="text-[10px] uppercase tracking-[0.3em] font-medium mb-2"
        style={{ color: stripe.accent }}
      >
        Now playing · Vibe
      </p>
      <h2 className="font-serif text-5xl leading-none text-[#0d1117]">
        {data?.vibeName ?? '…'}
      </h2>

      <div className="flex h-3 w-full max-w-xs overflow-hidden rounded-full mt-5">
        {stripe.colors.map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mt-6">{error}</p>}
      {!data && !error && (
        <p className="text-sm text-[#7a8699] mt-6">Dropping the needle…</p>
      )}

      {data && (
        <div className="mt-6 space-y-3">
          {data.tracks.length === 0 && (
            <p className="text-[#7a8699] text-sm">
              No tracks found for this vibe.
            </p>
          )}
          {data.tracks.slice(0, 8).map((t) => (
            <TrackCard key={t.id} track={t} vibeId={vibeId} />
          ))}
        </div>
      )}

      <p className="mt-10 text-[10px] uppercase tracking-[0.3em] text-[#7a8699]">
        Powered by Spotify
      </p>
    </div>
  );
}