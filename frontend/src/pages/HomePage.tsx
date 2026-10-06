import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Vibe } from '../types/api';
import { vibeApi } from '../services/vibeApi';
import { getVibeStripe } from '../utils/vibeTheme';
import Turntable from '../components/Turntable';
import NowPlayingPanel from '../components/NowPlayingPanel';

type SheetState = 'hidden' | 'half' | 'full';

export default function HomePage() {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);

  // Mobile: start collapsed so the whole crate is visible.
  const [sheet, setSheet] = useState<SheetState>('hidden');
  const autoOpened = useRef(false);

  useEffect(() => {
    let cancelled = false;
    vibeApi
      .listVibes()
      .then((d) => !cancelled && setVibes(d.vibes))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // The first time a record starts playing, slide the Vibe sheet half open.
  useEffect(() => {
    if (activeVibe && !autoOpened.current) {
      autoOpened.current = true;
      setSheet('half');
    }
  }, [activeVibe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#1a1512]">
        <p className="text-sm text-[#ffb347]/80 font-mono uppercase tracking-[0.2em]">
          Loading vibes…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh gap-2 px-6 text-center bg-[#1a1512]">
        <p className="text-red-400 font-medium">Couldn't load vibes</p>
        <p className="text-[#c9bfb2] text-sm max-w-sm">{error}</p>
      </div>
    );
  }

  const active = vibes.find((v) => v.id === activeVibe);
  const accent = activeVibe ? getVibeStripe(activeVibe).accent : '#7a8699';

  // Cycle: half → full → hidden → half → …
  function cycleSheet() {
    setSheet((s) => (s === 'half' ? 'full' : s === 'full' ? 'hidden' : 'half'));
  }

  const mobileHeight = sheet === 'hidden' ? '5rem' : sheet === 'half' ? '40dvh' : '88dvh';
  // the stage keeps its own space above the sheet (full = overlay on top of the half size)
  const stagePad = sheet === 'hidden' ? '5rem' : '40dvh';

  return (
    <main className="h-dvh flex flex-col lg:flex-row overflow-hidden bg-[#1a1512]">
      {/* Stage: the turntable bleeds off the edges */}
      <section
        className="relative z-0 flex-1 min-h-0 min-w-0 transition-[padding] duration-500 ease-out pb-(--sheet-pad) lg:pb-0"
        style={{ '--sheet-pad': stagePad } as CSSProperties}
      >
        <div className="relative w-full h-full">
          <Turntable vibes={vibes} onChange={setActiveVibe} />
        </div>
      </section>

      {/* Vibe display: bottom sheet on mobile, companion panel on desktop */}
      <aside
        className={`
          fixed inset-x-0 bottom-0 z-50 flex flex-col bg-[#fbf9f4]
          rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,.35)]
          transition-[height] duration-500 ease-out
          lg:relative lg:z-10 lg:inset-auto lg:h-auto! lg:w-110 lg:shrink-0
          lg:-ml-7 lg:rounded-l-[28px] lg:rounded-r-none
          lg:shadow-[-24px_0_40px_rgba(0,0,0,.5)]
        `}
        style={{ height: mobileHeight }}
      >
        <button
          onClick={cycleSheet}
          className="lg:hidden shrink-0 pt-3 pb-2 px-5 flex flex-col items-stretch"
        >
          <span className="self-center w-10 h-1 rounded-full bg-[#0d1117]/15 mb-3" />
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0 transition-colors"
              style={{ backgroundColor: accent }}
            />
            <span className="flex-1 min-w-0 text-left">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-[#7a8699]">
                Now playing
              </span>
              <span className="block font-serif text-lg truncate text-[#0d1117]">
                {active ? active.name : 'Nothing on the platter'}
              </span>
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-[#7a8699] transition-transform duration-500 ${
                sheet === 'full' ? 'rotate-180' : ''
              }`}
            >
              <path d="M6 15l6-6 6 6" />
            </svg>
          </div>
        </button>

        {/* keyed so the display "refreshes" each time a new record is placed */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-8 lg:p-8 lg:pl-12 lg:pt-8">
          <div key={activeVibe ?? 'none'} className="vibe-refresh">
            <NowPlayingPanel vibeId={activeVibe} variant="panel" />
          </div>
        </div>
      </aside>
    </main>
  );
}