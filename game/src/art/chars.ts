// SVG fallback art for the cast (GAME_DESIGN §2.3): Amin (boy with a brass lantern), Mishmish (apricot kitten with a blue
// neckerchief), Laqlaq (white stork with round glasses, on one leg). Simple shapes, dot eyes, a smile.
export type Pose = 'idle' | 'happy' | 'think' | 'wow' | 'sleep' | 'point' | 'walk' | 'beam' | 'bow' | 'cloth' | 'basket' | 'scared' | 'explain';

const eyes = (x1: number, x2: number, y: number, pose: Pose, r = 2.6) =>
  pose === 'sleep'
    ? `<path d="M${x1 - 3} ${y} q3 2.5 6 0 M${x2 - 3} ${y} q3 2.5 6 0" stroke="#1d2340" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    : pose === 'happy'
      ? `<path d="M${x1 - 3} ${y + 1} q3 -3.5 6 0 M${x2 - 3} ${y + 1} q3 -3.5 6 0" stroke="#1d2340" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      : `<circle cx="${x1}" cy="${y}" r="${pose === 'wow' ? r + 0.6 : r}" fill="#1d2340"/><circle cx="${x2}" cy="${y}" r="${pose === 'wow' ? r + 0.6 : r}" fill="#1d2340"/><circle cx="${x1 + 0.9}" cy="${y - 0.9}" r="0.8" fill="#fff"/><circle cx="${x2 + 0.9}" cy="${y - 0.9}" r="0.8" fill="#fff"/>`;
const mouth = (x: number, y: number, pose: Pose, w = 5) =>
  pose === 'wow' ? `<ellipse cx="${x}" cy="${y + 1}" rx="2.2" ry="2.8" fill="#7a2e2e"/>`
    : pose === 'sleep' ? `<path d="M${x - 2} ${y + 1} h4" stroke="#7a2e2e" stroke-width="1.4" stroke-linecap="round"/>`
      : `<path d="M${x - w / 2} ${y} q${w / 2} ${pose === 'happy' ? 4.5 : 3} ${w} 0" stroke="#7a2e2e" stroke-width="1.6" fill="${pose === 'happy' ? '#c4515a' : 'none'}" stroke-linecap="round"/>`;

let facelessAmin = false;
/** Amin has the simple face of STYLE §3.1 by default (owner 2026-11-13); data/art.json "faceless": true draws the STYLE §3.7 variant. */
export function setFaceless(on: boolean) { facelessAmin = on; }

export function amin(pose: Pose = 'idle', lantern = '#F2B33D'): string {
  const up = pose === 'point' || pose === 'wow' || pose === 'happy';
  const arm = up ? 'M58 60 q12 -10 18 -22' : 'M58 62 q10 2 14 10';
  const lx = up ? 76 : 73, ly = up ? 30 : 74;
  const glowBoost = pose === 'happy' || pose === 'wow' ? 0.95 : 0.7;
  const head = facelessAmin
    ? `<circle cx="50" cy="42" r="24" fill="#1F8A85"/><path d="M28 50 q0 -32 22 -32 q22 0 22 32" fill="#1F8A85"/>
       <ellipse cx="50" cy="45" rx="15" ry="17" fill="url(#face)"/>
       <path d="M35 45 q0 -18 15 -18 q15 0 15 18" fill="none" stroke="#F3E6C8" stroke-width="3"/>`
    : `<path d="M28 44 q0 -28 22 -28 q22 0 22 28 q-2 8 -6 10 h-32 q-4 -2 -6 -10z" fill="#17706f"/>
       <circle cx="50" cy="44" r="17" fill="#C98D63"/>
       <path d="M34 38 q4 -14 16 -14 q12 0 16 14 q-8 -6 -16 -6 q-8 0 -16 6z" fill="#2B1B14"/>
       ${eyes(44, 56, 45, pose)}
       <circle cx="40" cy="51" r="2.6" fill="#f08f8f" opacity=".55"/><circle cx="60" cy="51" r="2.6" fill="#f08f8f" opacity=".55"/>
       ${mouth(50, 52, pose)}`;
  return `<svg viewBox="0 0 100 110" class="char char-amin${facelessAmin ? ' faceless' : ''}">
  <defs><radialGradient id="glow"><stop offset="0" stop-color="#FFE29A" stop-opacity="${glowBoost}"/><stop offset="1" stop-color="${lantern}" stop-opacity="0"/></radialGradient>
  <radialGradient id="face" cx=".5" cy=".45"><stop offset="0" stop-color="#FFE29A"/><stop offset="1" stop-color="#C98D63"/></radialGradient></defs>
  <ellipse cx="50" cy="106" rx="24" ry="3.5" fill="#000" opacity=".18"/>
  <circle cx="${lx}" cy="${ly + 9}" r="${pose === 'happy' ? 21 : 17}" fill="url(#glow)"/>
  <rect x="39" y="92" width="9" height="12" rx="3" fill="#EADCC0"/><rect x="52" y="92" width="9" height="12" rx="3" fill="#EADCC0"/>
  <ellipse cx="43" cy="105" rx="7" ry="3" fill="#E8B84A"/><ellipse cx="57" cy="105" rx="7" ry="3" fill="#E8B84A"/>
  <path d="M30 96 q-1 -34 20 -36 q21 2 20 36 q-20 6 -40 0z" fill="#1F8A85"/>
  <path d="M30.5 94 q19.5 6 39 0" stroke="#F3E6C8" stroke-width="3" fill="none"/>
  <circle cx="50" cy="70" r="1.8" fill="#F3E6C8"/><circle cx="50" cy="77" r="1.8" fill="#F3E6C8"/>
  <path d="M33 70 q-8 8 -6 18" stroke="#1F8A85" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="${arm}" stroke="#1F8A85" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M34 66 l30 20" stroke="#8A5A35" stroke-width="2.4"/><rect x="58" y="82" width="13" height="11" rx="3" fill="#8A5A35"/>
  <circle cx="61" cy="82" r="1.4" fill="#FFF8EC"/><circle cx="64.5" cy="81.5" r="1.4" fill="#FFF8EC"/><circle cx="68" cy="82" r="1.4" fill="#FFF8EC"/>
  <g transform="translate(${lx - 6} ${ly})"><path d="M6 0 v3" stroke="#8a5a2b" stroke-width="1.5"/><path d="M1 4 h10 l-1.5 3 h-7z" fill="#D9A441"/><path d="M2 7 h8 l1 5 l-1 5 h-8 l-1 -5z" fill="#FFE29A" stroke="#D9A441" stroke-width="1.6"/><path d="M6 9 q-2 3 0 6 q2 -3 0 -6z" fill="${lantern}"/><path d="M1.5 17 h9 l-1 2.5 h-7z" fill="#D9A441"/></g>
  ${head}
</svg>`;
}

export function mishmish(pose: Pose = 'idle'): string {
  const tail = pose === 'sleep' ? 'M70 92 q16 2 12 -12' : 'M70 88 q18 -4 14 -24 q-1 -6 4 -8';
  const body = pose === 'sleep'
    ? '<ellipse cx="52" cy="88" rx="26" ry="14" fill="#f4a259"/>'
    : '<path d="M32 98 q-4 -30 20 -32 q24 2 20 32z" fill="#f4a259"/><path d="M40 98 q0 -16 12 -18 q12 2 12 18z" fill="#fbd3a6"/>';
  const head = pose === 'sleep' ? 'translate(-6 30) rotate(-8 50 50)' : 'translate(0 0)';
  return `<svg viewBox="0 0 100 110" class="char char-mishmish">
  <ellipse cx="52" cy="104" rx="26" ry="3.5" fill="#000" opacity=".18"/>
  <path d="${tail}" stroke="#e08a3e" stroke-width="7" fill="none" stroke-linecap="round"/>
  ${body}
  <g transform="${head}">
    <path d="M30 40 l2 -20 l14 10z M70 40 l-2 -20 l-14 10z" fill="#f4a259"/><path d="M33 34 l1 -9 l7 5z M67 34 l-1 -9 l-7 5z" fill="#f7c0b0"/>
    <ellipse cx="50" cy="46" rx="22" ry="19" fill="#f4a259"/>
    <path d="M44 30 l2 6 M50 29 v7 M56 30 l-2 6" stroke="#e08a3e" stroke-width="2" stroke-linecap="round"/>
    ${eyes(42, 58, 46, pose, 3)}
    <path d="M48 52 h4 l-2 2.4z" fill="#d9636b"/>
    ${pose === 'sleep' ? '' : mouth(50, 56, pose, 6)}
    <path d="M30 52 h-10 M30 55 l-9 3 M70 52 h10 M70 55 l9 3" stroke="#7a4a2a" stroke-width="1" stroke-linecap="round" opacity=".7"/>
  </g>
  ${pose === 'sleep' ? '<text x="74" y="56" font-size="12" fill="#6cb4ee" font-family="sans-serif">z</text><text x="82" y="46" font-size="9" fill="#6cb4ee" font-family="sans-serif">z</text>' : '<path d="M34 64 q16 10 32 0 l-4 8 q-12 6 -24 0z" fill="#2f6fd0"/><path d="M48 70 l-6 10 l8 -4z" fill="#2f6fd0"/>'}
</svg>`;
}

export function laqlaq(pose: Pose = 'idle'): string {
  const beakOpen = pose === 'wow' || pose === 'happy';
  return `<svg viewBox="0 0 100 120" class="char char-laqlaq">
  <ellipse cx="50" cy="116" rx="20" ry="3" fill="#000" opacity=".18"/>
  <path d="M48 82 v34 M54 82 q8 8 0 14 q-4 3 -2 8" stroke="#e8743b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M44 116 h8" stroke="#e8743b" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M28 70 q4 -26 26 -24 q20 4 18 26 q-4 14 -22 14 q-18 0 -22 -16z" fill="#fbfbf7" stroke="#d8d8d0" stroke-width="1"/>
  <path d="M62 54 q16 8 14 26 l-10 -6 q2 -10 -4 -20z" fill="#1d2340"/>
  <path d="M44 50 q-2 -16 4 -26" stroke="#fbfbf7" stroke-width="9" fill="none" stroke-linecap="round"/>
  <circle cx="48" cy="22" r="11" fill="#fbfbf7" stroke="#d8d8d0" stroke-width="1"/>
  ${beakOpen ? '<path d="M38 20 l-28 -4 l28 2z M38 24 l-26 4 l26 -1z" fill="#e8743b"/>' : '<path d="M38 20 l-30 3 l30 3z" fill="#e8743b"/>'}
  ${pose === 'sleep' ? '<path d="M43 21 q3 2 6 0" stroke="#1d2340" stroke-width="1.5" fill="none"/>' : `<circle cx="46" cy="20" r="${pose === 'wow' ? 2.4 : 1.8}" fill="#1d2340"/>`}
  <circle cx="46" cy="20" r="5" fill="none" stroke="#8a5a2b" stroke-width="1.3"/><path d="M51 19 l4 -1" stroke="#8a5a2b" stroke-width="1.3"/>
  ${pose === 'think' ? '<circle cx="70" cy="10" r="2" fill="#fff" opacity=".8"/><circle cx="77" cy="4" r="3" fill="#fff" opacity=".8"/>' : ''}
</svg>`;
}

/** Small lantern in the player's colour (the player has no avatar body, §2.3). */
export function lantern(color = '#e9b44c', lit = true): string {
  return `<svg viewBox="0 0 40 60" class="lantern">
  <defs><radialGradient id="lg"><stop offset="0" stop-color="${color}" stop-opacity=".8"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs>
  ${lit ? '<circle cx="20" cy="34" r="20" fill="url(#lg)"/>' : ''}
  <path d="M20 2 v6" stroke="#8a5a2b" stroke-width="2"/><circle cx="20" cy="3" r="2.4" fill="none" stroke="#8a5a2b" stroke-width="1.5"/>
  <path d="M10 10 h20 l-3 6 h-14z" fill="#c98a2b"/>
  <rect x="11" y="16" width="18" height="26" rx="5" fill="${lit ? '#fff1c1' : '#9aa3b8'}" stroke="#c98a2b" stroke-width="2.5"/>
  <path d="M20 21 q-5 7 0 15 q5 -8 0 -15z" fill="${lit ? color : '#6b7390'}"/>
  <path d="M10 42 h20 l-3 6 h-14z" fill="#c98a2b"/>
</svg>`;
}
export const LANTERN_COLORS: Record<string, string> = { gold: '#F2B33D', teal: '#2BB3A8', rose: '#E9779A', sky: '#4FA3E0', leaf: '#6BB34A', violet: '#9B7BD8' };
