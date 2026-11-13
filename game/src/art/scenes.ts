// District backdrops (GAME_DESIGN §2.5): one sky per district from sunset to dawn, and a silhouette of the place.
// viewBox 360×500, anchored to the bottom.
import { mulberry32 } from '../core/rng';

export const SKIES: Record<string, { top: string; mid: string; low: string; stars: number; moon?: 'full' | 'crescent'; sun?: 'low' | 'rise'; ink: string; text: string }> = {
  sunset:     { top: '#3B3A78', mid: '#B8648A', low: '#F7B267', stars: 0, sun: 'low', ink: '#3a2440', text: '#fff' },
  dusk:       { top: '#2B2F6B', mid: '#6A4E8E', low: '#E0796B', stars: 6, moon: 'crescent', ink: '#3d2a5a', text: '#fff' },
  evening:    { top: '#1E2556', mid: '#36407E', low: '#4E4A8C', stars: 20, moon: 'crescent', ink: '#22284f', text: '#fff' },
  starry:     { top: '#141A45', mid: '#1F2A60', low: '#2E3B7A', stars: 60, ink: '#121a3a', text: '#fff' },
  night:      { top: '#11163A', mid: '#1B2450', low: '#273266', stars: 30, moon: 'crescent', ink: '#0b1030', text: '#fff' },
  deepnight:  { top: '#0C1030', mid: '#151C45', low: '#1F2858', stars: 40, moon: 'full', ink: '#070b22', text: '#fff' },
  moonlit:    { top: '#0E1436', mid: '#1A2C5E', low: '#23407A', stars: 40, moon: 'full', ink: '#0b1736', text: '#fff' },
  latenight:  { top: '#0B0F2C', mid: '#141A40', low: '#1B2350', stars: 70, moon: 'crescent', ink: '#090e26', text: '#fff' },
  firstlight: { top: '#1A2150', mid: '#3A4A88', low: '#5A6AA8', stars: 15, ink: '#16223f', text: '#fff' },
  dawn:       { top: '#5B7BC9', mid: '#F2A5A0', low: '#FFD58A', stars: 2, sun: 'rise', ink: '#4a3550', text: '#fff' },
};

function skyLayer(sky: string, seed: number): string {
  const s = SKIES[sky] || SKIES.night;
  const r = mulberry32(seed);
  let stars = '';
  for (let i = 0; i < s.stars; i++) stars += `<circle cx="${(r() * 360).toFixed(0)}" cy="${(r() * 260).toFixed(0)}" r="${(0.6 + r() * 1.4).toFixed(1)}" fill="#F5EFE0" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
  const moon = s.moon === 'full' ? '<circle cx="270" cy="80" r="30" fill="#fdf6d8"/><circle cx="270" cy="80" r="48" fill="#fdf6d8" opacity=".12"/>'
    : s.moon === 'crescent' ? '<path d="M282 52 a30 30 0 1 0 6 52 a24 24 0 1 1 -6 -52z" fill="#fdf0c0"/>' : '';
  const sun = s.sun === 'low' ? '<circle cx="90" cy="330" r="46" fill="#ffd27a" opacity=".9"/>' : s.sun === 'rise' ? '<circle cx="180" cy="300" r="56" fill="#ffe08a"/><circle cx="180" cy="300" r="90" fill="#ffe08a" opacity=".25"/>' : '';
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.top}"/><stop offset=".55" stop-color="${s.mid}"/><stop offset="1" stop-color="${s.low}"/></linearGradient></defs>
  <rect width="360" height="500" fill="url(#sky)"/>${stars}${moon}${sun}`;
}

const windows = (xs: number[], y: number, c = '#ffd36b') => xs.map((x) => `<rect x="${x}" y="${y}" width="7" height="11" rx="3.5" fill="${c}"/>`).join('');

const PLACES: Record<string, (ink: string) => string> = {
  gate: (k) => `<path d="M0 420 h360 v80 h-360z" fill="${k}"/>
    <path d="M90 420 v-150 h180 v150z" fill="${k}"/><path d="M80 270 h200 v-14 h-200z" fill="${k}"/>
    ${[90, 120, 150, 180, 210, 240, 262].map((x) => `<rect x="${x}" y="244" width="14" height="14" fill="${k}"/>`).join('')}
    <path d="M140 420 v-80 a40 40 0 0 1 80 0 v80z" fill="#ffcf7a" opacity=".55"/>
    <path d="M30 420 v-110 h50 v110z M280 420 v-120 h50 v120z" fill="${k}"/>
    <path d="M236 244 q14 -14 34 -4 q-6 8 -34 4z" fill="#8a5a2b"/><path d="M252 238 q2 -16 8 -22" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M262 214 l12 -2" stroke="#e8743b" stroke-width="3"/>
    ${windows([45, 62, 295, 312], 330)}`,
  seven: (k) => `<path d="M0 430 h360 v70 h-360z" fill="${k}"/>
    ${[22, 70, 118, 166, 214, 262, 310].map((x, i) => `<rect x="${x}" y="${300 - (i % 3) * 22}" width="28" height="${130 + (i % 3) * 22}" fill="${k}"/><path d="M${x - 4} ${300 - (i % 3) * 22} h36 l-18 -26z" fill="${k}"/><circle cx="${x + 14}" cy="${318 - (i % 3) * 22}" r="7" fill="#ffd36b"/>`).join('')}`,
  garden: (k) => `<path d="M0 430 h360 v70 h-360z" fill="${k}"/><path d="M0 450 h360 v8 h-360z" fill="#6cb4ee" opacity=".55"/>
    ${[40, 130, 230, 320].map((x) => `<path d="M${x} 430 v-40" stroke="${k}" stroke-width="8"/><circle cx="${x}" cy="370" r="34" fill="${k}"/>${[0, 1, 2, 3].map((i) => `<circle cx="${x - 18 + i * 12}" cy="${360 + (i % 2) * 14}" r="4" fill="#f4a259"/>`).join('')}`).join('')}
    <path d="M150 430 v-70 a30 30 0 0 1 60 0 v70z" fill="${k}"/>`,
  fountain: (k) => `<path d="M0 430 h360 v70 h-360z" fill="${k}"/>
    <path d="M100 430 v-120 a80 80 0 0 1 160 0 v120z" fill="${k}"/><path d="M130 430 v-70 a50 50 0 0 1 100 0 v70z" fill="#2aa2b8" opacity=".5"/>
    <path d="M150 400 h60 v30 h-60z" fill="${k}"/><path d="M180 400 v-28" stroke="#8fdbe6" stroke-width="4" opacity=".8"/><path d="M180 372 q-16 6 -20 26 M180 372 q16 6 20 26" stroke="#8fdbe6" stroke-width="2.5" fill="none" opacity=".8"/>
    <path d="M10 430 v-30 h70 v30z M280 430 v-30 h70 v30z" fill="${k}"/>`,
  market: (k) => `<path d="M0 440 h360 v60 h-360z" fill="${k}"/>
    ${[0, 90, 180, 270].map((x) => `<path d="M${x} 440 v-110 h90 v110 h-12 v-60 a33 33 0 0 0 -66 0 v60z" fill="${k}"/><path d="M${x + 45} 330 v20" stroke="#c98a2b" stroke-width="1.5"/><path d="M${x + 38} 350 h14 l-3 12 h-8z" fill="#ffd36b"/>`).join('')}
    <path d="M150 360 h60 M180 350 v10" stroke="#e9b44c" stroke-width="2.5"/><path d="M152 362 l-6 14 h20z M208 362 l-6 14 h20z" fill="#e9b44c"/>`,
  workshop: (k) => `<path d="M0 430 h360 v70 h-360z" fill="${k}"/><path d="M40 430 v-150 h280 v150z" fill="${k}"/>
    <rect x="70" y="320" width="220" height="70" rx="6" fill="#fbf3e2" opacity=".85"/>
    <path d="M90 345 h180 M90 370 h180" stroke="#1d2340" stroke-width="1" opacity=".4"/>
    ${[110, 150, 200, 240].map((x, i) => `<text x="${x}" y="${342 + (i % 2) * 25}" font-family="Amiri, serif" font-size="22" fill="#1d2340">${['ـَ', 'ـُ', 'ـِ', 'ـْ'][i]}</text>`).join('')}
    <path d="M300 300 l-30 40" stroke="#c98a2b" stroke-width="4" stroke-linecap="round"/><ellipse cx="80" cy="410" rx="16" ry="9" fill="#1d2340"/>`,
  bridge: (k) => `<path d="M0 420 h360 v80 h-360z" fill="#284a7a"/><path d="M0 440 q180 -12 360 0 v60 h-360z" fill="${k}" opacity=".6"/>
    ${[0, 1, 2].map((i) => `<path d="M-20 ${380 + i * 18} q190 -${60 - i * 10} 400 0" stroke="${k}" stroke-width="${10 - i * 2}" fill="none"/>`).join('')}
    ${[60, 180, 300].map((x) => `<path d="M${x} 420 v-40" stroke="${k}" stroke-width="10"/>`).join('')}
    <path d="M60 460 q60 -6 120 0 M200 470 q50 -5 100 0" stroke="#fdf6d8" stroke-width="2" opacity=".5"/>`,
  lane: (k) => `<path d="M0 430 h360 v70 h-360z" fill="${k}"/>
    ${[[10, 'M30 430 v-60 a20 20 0 0 1 40 0 v60z'], [90, 'M110 430 v-80 h40 v80z'], [170, 'M190 430 v-70 l20 -20 l20 20 v70z'], [250, 'M270 430 v-64 a20 26 0 0 1 40 0 v64z']].map(([x, d]) => `<path d="M${x} 430 v-150 h80 v150z" fill="${k}"/><path d="${d}" fill="#c98a2b" opacity=".75"/>`).join('')}
    <path d="M330 430 v-50 h30 v50z" fill="${k}"/>`,
  cave: (k) => `<path d="M0 500 v-300 q60 -60 180 -70 q120 10 180 70 v300z" fill="${k}"/>
    ${[[60, 330], [120, 300], [180, 290], [240, 300], [300, 330], [180, 370]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="28" fill="#4d6c98" opacity=".7"/>`).join('')}
    <path d="M120 500 v-60 a60 60 0 0 1 120 0 v60z" fill="#b3c8d8" opacity=".8"/>`,
  hill: (k) => `<path d="M0 500 v-110 q180 -90 360 0 v110z" fill="${k}"/>
    <path d="M120 360 q-10 -40 14 -60 q22 20 12 60z M220 350 q-12 -46 16 -66 q24 22 12 66z" fill="${k}"/>
    ${[40, 80, 280, 320].map((x) => `<circle cx="${x}" cy="${410 - (x % 3) * 6}" r="16" fill="${k}"/>`).join('')}
    <path d="M150 340 h60 v12 h-60z" fill="${k}"/>`,
  alley: (k) => `<path d="M0 430 h360 v70 h-360z" fill="${k}"/><path d="M20 430 v-120 h100 v120z M240 430 v-140 h100 v140z" fill="${k}"/>${windows([40, 70, 260, 300], 340)}`,
};

export function scene(place: string, sky: string): string {
  const s = SKIES[sky] || SKIES.night;
  const p = PLACES[place] || PLACES.alley;
  return `<svg viewBox="0 0 360 500" preserveAspectRatio="xMidYMax slice" class="scene scene-${place}">${skyLayer(sky, place.length * 31 + 7)}${p(s.ink)}</svg>`;
}
export function skyOnly(sky: string): string {
  return `<svg viewBox="0 0 360 500" preserveAspectRatio="xMidYMid slice" class="scene">${skyLayer(sky, sky.length * 13)}</svg>`;
}
