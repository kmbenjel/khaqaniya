// The Lahn gang (GAME_DESIGN §2.4): ten ink-blot creatures, each with one visual gag, in two states: «ragged» (the
// mistake) and «fixed» (corrected, a friend). `step` 0..1 moves the gag back as the ink meter empties.
import { mulberry32 } from '../core/rng';

const COLORS: Record<string, [string, string]> = {
  manfoukh: ['#6a4fb3', '#9d86e0'], khallat: ['#d0543f', '#3f7fd0'], ajoul: ['#e0703a', '#f4b36b'], kaslan: ['#5d6b88', '#97a3bd'],
  mattat: ['#d65a9a', '#f29cc6'], qallab: ['#2f9a6a', '#7fd0a8'], fuwaq: ['#2aa2b8', '#8fdbe6'], duhrouj: ['#8a5a3b', '#c9936a'],
  khafiyy: ['#7a86a8', '#c8d0e6'], nasyan: ['#7d6fb0', '#c9c0ee'],
};

function blobPath(cx: number, cy: number, rx: number, ry: number, ragged: boolean, seed: number): string {
  const rnd = mulberry32(seed);
  const n = ragged ? 22 : 12;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = ragged ? (i % 2 ? 0.78 + rnd() * 0.12 : 1.02 + rnd() * 0.16) : 0.97 + rnd() * 0.06;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  if (ragged) return 'M' + pts.map((p) => p.map((x) => x.toFixed(1)).join(' ')).join(' L') + 'Z';
  // smooth closed curve through the points (Catmull-Rom → Bézier)
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const face = (x: number, y: number, fixed: boolean, s = 1, sleepy = false) => `
  <g transform="translate(${x} ${y}) scale(${s})">
   ${sleepy && !fixed ? '<path d="M-10 0 q4 3 8 0 M2 0 q4 3 8 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' :
    `<ellipse cx="-6" cy="0" rx="4.2" ry="5" fill="#fff"/><ellipse cx="6" cy="0" rx="4.2" ry="5" fill="#fff"/><circle cx="-5.4" cy="${fixed ? 0.8 : -0.6}" r="2.2" fill="#1d2340"/><circle cx="6.6" cy="${fixed ? 0.8 : -0.6}" r="2.2" fill="#1d2340"/>`}
   ${fixed ? '<path d="M-6 9 q6 6 12 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>' : '<path d="M-6 11 q6 -4 12 0" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>'}
  </g>`;

/** SVG markup of one gang member. */
export function blot(id: string, fixed: boolean, step = 0): string {
  const [c, c2] = COLORS[id] || ['#444a66', '#8890aa'];
  const seed = id.length * 977 + id.charCodeAt(0);
  const R = !fixed;
  const body = (cx = 60, cy = 66, rx = 34, ry = 30, fill = c) => `<path d="${blobPath(cx, cy, rx, ry, R, seed)}" fill="${fill}"/><ellipse cx="${cx - rx * 0.35}" cy="${cy - ry * 0.45}" rx="${rx * 0.22}" ry="${ry * 0.14}" fill="#fff" opacity=".25"/>`;
  const drops = R ? `<circle cx="22" cy="100" r="3" fill="${c}"/><circle cx="98" cy="104" r="2.2" fill="${c}"/><circle cx="90" cy="30" r="2" fill="${c}"/>` : '';
  let inner = '';
  switch (id) {
    case 'manfoukh': { const s = fixed ? 0.8 : 1.25 - step * 0.4; inner = `<g transform="translate(60 66) scale(${s}) translate(-60 -66)">${body()}${face(60, 64, fixed)}</g>` +
      (fixed ? '<path d="M58 30 q8 -12 16 -6 q-6 8 -16 6z" fill="#3bbf8f"/><path d="M58 30 l8 -5" stroke="#1f8a5a" stroke-width="1.2"/>' : `<path d="M44 ${38 - (1 - step) * 8} l6 -10 l6 8 l6 -10 l6 8 l6 -8 l2 12z" fill="#1d2340"/><path d="M60 ${96 + (1 - step) * 6} v14" stroke="#555" stroke-width="1.2"/>`); break; }
    case 'khallat': inner = fixed
      ? `<clipPath id="half"><rect x="0" y="0" width="60" height="120"/></clipPath>${body(60, 66, 32, 30, c2)}<g clip-path="url(#half)">${body(60, 66, 32, 30, c)}</g>${face(60, 64, true)}<path d="M40 100 h14 l2 6 h-18z M66 100 h14 l2 6 h-18z" fill="#1d2340"/>`
      : `${body(60, 66, 32, 30, c)}<path d="M40 60 q20 -30 40 0 q-20 30 -40 0" fill="${c2}" opacity=".85"/>${face(60, 66, false)}<path d="M48 28 h22 l4 8 h-28z" fill="#1d2340"/><path d="M50 100 l10 -6 l10 6 z" fill="#c98a2b"/>`; break;
    case 'ajoul': inner = fixed
      ? `${body(60, 70, 30, 28)}${face(60, 68, true)}<rect x="82" y="80" width="10" height="14" rx="2" fill="#cfe9df" stroke="#fff" stroke-width="1"/><path d="M84 80 q2 -6 4 0" stroke="#3bbf8f" stroke-width="2" fill="none"/>`
      : `<path d="M90 66 l26 -10 M92 76 l24 4 M88 56 l20 -18" stroke="${c2}" stroke-width="5" stroke-linecap="round" opacity="${0.9 - step * 0.6}"/>${body(54, 66, 30, 26)}${face(48, 64, false)}<path d="M40 92 l-8 12 M52 94 l-2 14 M64 92 l6 12" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`; break;
    case 'kaslan': inner = fixed
      ? `${body(60, 62, 26, 30)}${face(60, 58, true)}<rect x="84" y="56" width="18" height="24" rx="2" fill="#fbf3e2"/><path d="M87 62 l2 2 l4 -4 M87 70 l2 2 l4 -4" stroke="#1f8a8a" stroke-width="1.6" fill="none"/>`
      : `<rect x="18" y="84" width="84" height="22" rx="10" fill="#c4515a"/>${body(60, 82, 40, 16 + step * 8)}${face(60, 80, false, 1, true)}<text x="88" y="56" font-size="12" fill="${c2}" font-family="sans-serif">z</text>`; break;
    case 'mattat': { const sx = fixed ? 1 : 1.7 - step * 0.6; inner = `<g transform="translate(60 66) scale(${sx} ${fixed ? 1 : 0.8}) translate(-60 -66)">${body(60, 66, 30, 28)}</g>${face(60, 64, fixed)}` +
      (fixed ? '<path d="M82 72 h20 M92 66 v22 M84 74 l-3 8 h8z M100 74 l-3 8 h8z" stroke="#c98a2b" stroke-width="1.6" fill="#e9b44c"/>' : `<path d="M8 66 q-6 10 4 14 M112 66 q6 10 -4 14" stroke="${c2}" stroke-width="4" fill="none"/>`); break; }
    case 'qallab': inner = fixed
      ? `${body(60, 64, 30, 30)}${face(60, 62, true)}<path d="M32 70 l-8 -6 M88 70 l8 -6" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`
      : `<g transform="rotate(${180 - step * 60} 60 64)">${body(60, 64, 30, 30)}${face(60, 62, false)}</g><path d="M46 100 v12 M74 100 v12" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`; break;
    case 'fuwaq': inner = `${body(60, 68, 30, 28)}${face(60, 66, fixed)}` + (fixed
      ? '<rect x="84" y="74" width="12" height="18" rx="2" fill="#bfe6f0" stroke="#fff"/><path d="M84 80 h12" stroke="#6cb4ee" stroke-width="2"/>'
      : `<g fill="#fff" font-family="Amiri, serif" font-size="14"><circle cx="92" cy="${34 + step * 10}" r="9" fill="${c2}" opacity=".7"/><text x="87" y="${39 + step * 10}">ء</text><circle cx="26" cy="28" r="7" fill="${c2}" opacity=".6"/><text x="22" y="33" font-size="11">ء</text></g>`); break;
    case 'duhrouj': inner = fixed
      ? `${body(60, 62, 28, 28)}${face(60, 60, true)}<path d="M46 90 v14 M74 90 v14" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M88 36 v40" stroke="#8a5a2b" stroke-width="3"/><circle cx="88" cy="34" r="10" fill="#e2687a"/><rect x="82" y="32" width="12" height="4" fill="#fff"/>`
      : `<g transform="rotate(${(1 - step) * 50} 60 66)">${body(60, 66, 30, 30)}${face(60, 64, false)}</g><path d="M16 96 h30 M20 104 h40" stroke="${c2}" stroke-width="3" stroke-linecap="round" opacity=".6"/><rect x="92" y="80" width="22" height="24" rx="8" fill="#e9b44c" opacity=".8"/>`; break;
    case 'khafiyy': inner = fixed
      ? `<circle cx="60" cy="64" r="44" fill="#fff1c1" opacity=".35"/>${body(60, 64, 30, 30, c)}${face(60, 62, true)}`
      : `<g opacity="${0.12 + step * 0.6}">${body(60, 64, 30, 30, c2)}</g>${face(60, 62, false)}`; break;
    case 'nasyan': inner = `${body(60, 68, 34, 26)}<circle cx="34" cy="60" r="14" fill="${c}"/><circle cx="86" cy="60" r="14" fill="${c}"/>` + (fixed
      ? `${face(60, 66, true)}<g fill="none" stroke="#1d2340" stroke-width="1.8"><circle cx="54" cy="66" r="6.5"/><circle cx="66" cy="66" r="6.5"/><path d="M60.5 66 h-1"/></g><path d="M44 96 q16 6 32 0" stroke="#e9b44c" stroke-width="2" fill="none"/>`
      : `${face(60, 70, false, 1, step < 0.5)}<path d="M36 50 q20 -34 48 -6 q-24 -8 -48 6z" fill="#3d4c7c"/><circle cx="88" cy="40" r="4" fill="#fff"/><g fill="none" stroke="#1d2340" stroke-width="1.6"><circle cx="54" cy="44" r="5"/><circle cx="66" cy="44" r="5"/></g>`); break;
    default: inner = `${body()}${face(60, 64, fixed)}`;
  }
  return `<svg viewBox="0 0 120 120" class="blot blot-${id} ${fixed ? 'fixed' : 'ragged'}">${drops}${inner}</svg>`;
}
export const BLOT_IDS = Object.keys(COLORS);
