import type { Track } from '../types/api';
import { getVibeStripe } from '../utils/vibeTheme';

interface TrackCardProps {
  track: Track;
  vibeId: string;
}

export default function TrackCard({ track, vibeId }: TrackCardProps) {
  const { colors } = getVibeStripe(vibeId);

  return (
    <div
      className="w-full h-full rounded-3xl overflow-hidden bg-[#fbf9f4]
                 shadow-xl shadow-[#0d1117]/8 border border-[#0d1117]/10
                 flex flex-col"
    >
      {/* Warming stripes — 4 flat bands */}
      <div className="h-40 w-full flex">
        <div className="flex-1" style={{ backgroundColor: colors[0] }} />
        <div className="flex-1" style={{ backgroundColor: colors[1] }} />
        <div className="flex-1" style={{ backgroundColor: colors[2] }} />
        <div className="flex-1" style={{ backgroundColor: colors[3] }} />
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#7a8699] mb-2">
            Now discovering
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1117] leading-tight">
            {track.name}
          </h2>
          <p className="text-sm text-[#7a8699] mt-3">
            {track.artist}
            {track.album ? ` · ${track.album}` : ''}
          </p>
        </div>

        {track.externalUrl && (
          <a
            href={track.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium
                       text-[#0d1117] hover:text-[#ff8a5c] transition-colors"
          >
            Open in Spotify
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}