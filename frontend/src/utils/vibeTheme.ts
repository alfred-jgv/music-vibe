import type { CSSProperties } from 'react';

export interface VibeStripe {
  colors: [string, string, string, string]; // 4 flat stripes
  accent: string;
}

const STRIPES: Record<string, VibeStripe> = {
  'late-night': { colors: ['#1e3a5f', '#2d4a6f', '#3b5879', '#4a6683'], accent: '#3b5879' },
  'road-trip':  { colors: ['#8b5a2b', '#c17d3e', '#e8a860', '#f4c88b'], accent: '#c17d3e' },
  party:        { colors: ['#7a1e4e', '#c23b6f', '#e85a8a', '#f4a0b8'], accent: '#c23b6f' },
  chill:        { colors: ['#1e4d4a', '#2d6f6a', '#4a948d', '#8bc4bd'], accent: '#2d6f6a' },
  'rainy-day':  { colors: ['#2e3a4a', '#47536a', '#6b7789', '#98a4b5'], accent: '#47536a' },
  hype:         { colors: ['#7a2e0e', '#c24a1c', '#e8703a', '#f4a06a'], accent: '#c24a1c' },
  romantic:     { colors: ['#7a1e3a', '#b83e5a', '#e85a7a', '#f4a0b0'], accent: '#b83e5a' },
  'feel-good':  { colors: ['#7a5a0e', '#c29a2e', '#e8c04a', '#f4dc8b'], accent: '#c29a2e' },
};

const FALLBACK: VibeStripe = {
  colors: ['#3a3a3a', '#5a5a5a', '#7a7a7a', '#9a9a9a'],
  accent: '#5a5a5a',
};

export function getVibeStripe(vibeId: string): VibeStripe {
  return STRIPES[vibeId] ?? FALLBACK;
}

/** Flat 4-band stripe pattern — no gradient. */
export function stripeBackground(vibeId: string): CSSProperties {
  const { colors } = getVibeStripe(vibeId);
  return {
    backgroundImage: `linear-gradient(90deg,
      ${colors[0]} 0%, ${colors[0]} 25%,
      ${colors[1]} 25%, ${colors[1]} 50%,
      ${colors[2]} 50%, ${colors[2]} 75%,
      ${colors[3]} 75%, ${colors[3]} 100%)`,
  };
}

/** Single flat color — used for tile backgrounds. */
export function tileColor(vibeId: string, index: number): string {
  const { colors } = getVibeStripe(vibeId);
  return colors[index % colors.length];
}

/** Darkest stripe color, used for record label text/background accents. */
export function vibeLabelColors(vibeId: string) {
  const { colors, accent } = getVibeStripe(vibeId);
  return { dark: colors[0], accent, light: colors[3] };
}