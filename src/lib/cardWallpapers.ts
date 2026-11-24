export interface CardWallpaperPreset {
  id: string;
  name: string;
  url: string;
}

function encodeSvg(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const CARD_WALLPAPER_PRESETS: CardWallpaperPreset[] = [
  {
    id: 'misty-peaks',
    name: 'Misty Peaks',
    url: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2c3144"/>
            <stop offset="55%" stop-color="#4e4656"/>
            <stop offset="100%" stop-color="#8b6b6c"/>
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#sky1)"/>
        <circle cx="560" cy="115" r="46" fill="#f3d5c0" opacity="0.22"/>
        <path d="M0,250 Q160,185 320,230 T640,210 T800,235 L800,320 L0,320 Z" fill="#1e222e" opacity="0.55"/>
        <path d="M0,275 L150,210 L290,260 L470,185 L650,245 L800,205 L800,320 L0,320 Z" fill="#13151b" opacity="0.88"/>
      </svg>
    `),
  },
  {
    id: 'midnight-dunes',
    name: 'Obsidian Dunes',
    url: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#191b22"/>
            <stop offset="55%" stop-color="#2b2d38"/>
            <stop offset="100%" stop-color="#14151a"/>
          </linearGradient>
          <radialGradient id="glow2" cx="72%" cy="32%" r="48%">
            <stop offset="0%" stop-color="#e2e8f0" stop-opacity="0.24"/>
            <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="800" height="320" fill="url(#sky2)"/>
        <rect width="800" height="320" fill="url(#glow2)"/>
        <path d="M0,220 C220,165 360,260 580,205 C690,178 750,192 800,210 L800,320 L0,320 Z" fill="#1e2028" opacity="0.72"/>
        <path d="M0,265 C190,225 410,290 610,235 C710,208 765,222 800,242 L800,320 L0,320 Z" fill="#111216" opacity="0.95"/>
      </svg>
    `),
  },
  {
    id: 'arctic-fog',
    name: 'Arctic Fog',
    url: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e2c3a"/>
            <stop offset="60%" stop-color="#334b5c"/>
            <stop offset="100%" stop-color="#537284"/>
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#sky3)"/>
        <ellipse cx="260" cy="145" rx="340" ry="70" fill="#bae6fd" opacity="0.09"/>
        <path d="M0,245 Q210,190 430,240 T800,215 L800,320 L0,320 Z" fill="#1b2630" opacity="0.65"/>
        <path d="M0,275 Q270,235 510,268 T800,248 L800,320 L0,320 Z" fill="#101419" opacity="0.92"/>
      </svg>
    `),
  },
  {
    id: 'lavender-dusk',
    name: 'Soft Dusk',
    url: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#221e33"/>
            <stop offset="55%" stop-color="#3c3352"/>
            <stop offset="100%" stop-color="#69536f"/>
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#sky4)"/>
        <circle cx="240" cy="110" r="64" fill="#ddd6fe" opacity="0.12"/>
        <path d="M0,238 C180,195 380,255 590,212 C690,192 750,208 800,225 L800,320 L0,320 Z" fill="#1d1a26" opacity="0.68"/>
        <path d="M0,270 C240,230 480,285 800,238 L800,320 L0,320 Z" fill="#121116" opacity="0.95"/>
      </svg>
    `),
  },
  {
    id: 'emerald-pine',
    name: 'Sage Mist',
    url: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#192826"/>
            <stop offset="60%" stop-color="#283d39"/>
            <stop offset="100%" stop-color="#455f58"/>
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#sky5)"/>
        <ellipse cx="540" cy="120" rx="280" ry="65" fill="#a7f3d0" opacity="0.09"/>
        <path d="M0,242 L180,198 L360,242 L560,190 L800,235 L800,320 L0,320 Z" fill="#16211f" opacity="0.72"/>
        <path d="M0,275 L220,238 L440,272 L650,230 L800,262 L800,320 L0,320 Z" fill="#101313" opacity="0.95"/>
      </svg>
    `),
  },
  {
    id: 'warm-amber',
    name: 'Horizon Glow',
    url: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky6" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#231d21"/>
            <stop offset="55%" stop-color="#493534"/>
            <stop offset="100%" stop-color="#7c5749"/>
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#sky6)"/>
        <circle cx="400" cy="185" r="78" fill="#fde68a" opacity="0.16"/>
        <path d="M0,245 Q220,210 420,240 T800,222 L800,320 L0,320 Z" fill="#1e1819" opacity="0.72"/>
        <path d="M0,278 Q280,252 540,272 T800,260 L800,320 L0,320 Z" fill="#111012" opacity="0.96"/>
      </svg>
    `),
  },
];

export function resolvePresetWallpaperUrl(coverValue?: string): string | null {
  if (!coverValue || !coverValue.startsWith('preset:')) return null;
  const presetId = coverValue.slice('preset:'.length);
  return CARD_WALLPAPER_PRESETS.find((p) => p.id === presetId)?.url || null;
}

export function getDefaultWallpaperForNote(noteId: string): CardWallpaperPreset {
  let hash = 0;
  for (let i = 0; i < noteId.length; i++) {
    hash = (hash * 31 + noteId.charCodeAt(i)) | 0;
  }
  return CARD_WALLPAPER_PRESETS[Math.abs(hash) % CARD_WALLPAPER_PRESETS.length];
}
