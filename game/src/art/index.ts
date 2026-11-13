// Art behind one manifest (data/art.json): an id maps to a file (generated art) or, by default, to the SVG fallback.
// Replacing an SVG by a picture is a one-line change in art.json, no code change.
import { svg, h } from '../core/h';
import { amin, laqlaq, lantern, mishmish, setFaceless, LANTERN_COLORS, type Pose } from './chars';
import { blot } from './blots';
import { scene } from './scenes';
import { icon, hasIcon } from './icons';

let manifest: Record<string, string | null> = {};
let x2: Record<string, string> = {};
let facelessOn = false;
const faceless = () => facelessOn;
export function setArtManifest(m: Record<string, string | null>, faceless = false, retina: Record<string, string> = {}) { manifest = m || {}; x2 = retina || {}; facelessOn = faceless; setFaceless(faceless); }

/** The generated picture of an id (with its @2x in srcset), or null when the manifest has none. A file that fails to
 *  load is replaced by `fallback()` (the SVG), so a missing asset never leaves a hole. */
export function artImg(id: string, cls: string, fallback?: () => Element, eager = false): HTMLImageElement | null {
  const key = id + (id.startsWith('char.amin') && faceless() && manifest[id + '.faceless'] ? '.faceless' : '');
  const f = manifest[key];
  if (!f) return null;
  const img = h('img', { src: './' + f, alt: '', class: cls + ' art-img', loading: eager ? 'eager' : 'lazy', decoding: 'async', draggable: false }) as HTMLImageElement;
  if (x2[key]) img.srcset = `./${f} 1x, ./${x2[key]} 2x`;
  if (fallback) img.addEventListener('error', () => { if (img.isConnected) img.replaceWith(fallback()); }, { once: true });
  return img;
}
/** The URL of an id's file (for canvases), or null. */
export const artFile = (id: string): string | null => (manifest[id] ? './' + manifest[id] : null);
function fileOr(id: string, fallback: () => string, cls: string): Element {
  return artImg(id, cls, () => svg(fallback(), cls)) || svg(fallback(), cls);
}

/** The game's poses → the drawn poses of game/art (R1). Unknown poses fall back to idle, then to the SVG. */
const POSES: Record<string, Record<string, string>> = {
  amin: { idle: 'idle', happy: 'cheer', think: 'think', wow: 'surprised', sleep: 'rest', point: 'point', walk: 'walk', beam: 'beam', bow: 'bow-hand' },
  mishmish: { idle: 'idle', happy: 'cheer', think: 'idle', wow: 'pounce', sleep: 'sleep', point: 'proud', cloth: 'cloth', basket: 'basket', scared: 'scared' },
  laqlaq: { idle: 'idle', happy: 'smile', think: 'think', wow: 'fly', sleep: 'idle', point: 'explain', explain: 'explain' },
};
export const charArt = (who: string, pose: Pose = 'idle', color?: string) => {
  const drawn = POSES[who]?.[pose] || pose;
  const fb = () => (who === 'mishmish' ? mishmish(pose) : who === 'laqlaq' ? laqlaq(pose) : amin(pose, color ? LANTERN_COLORS[color] : undefined));
  const cls = `char-art char-${who} pose-${pose} drawn-${drawn}`;
  return artImg(`char.${who}.${drawn}`, cls, () => svg(fb(), cls)) || artImg(`char.${who}.idle`, cls, () => svg(fb(), cls)) || svg(fb(), cls);
};
/** A gang member; `step` 0→1 = how far he is corrected (SVG morphs; with the drawn blot: Manfoukh deflates, Khafiyy
 *  slowly shows himself — his drawn blot is a plain dark blob, the near-invisible gag stays in CSS opacity). */
export const blotArt = (id: string, fixed: boolean, step = 0) => {
  const el = fileOr(`boss.${id}.${fixed ? 'fixed' : 'ragged'}`, () => blot(id, fixed, step), 'blot-art blot-' + id + (fixed ? ' fixed' : ''));
  if (el instanceof HTMLImageElement && !fixed) {
    if (id === 'khafiyy') el.style.opacity = String(0.22 + 0.6 * step);
    if (id === 'manfoukh') el.style.transform = `scale(${1 - 0.22 * step})`;
  }
  return el;
};
export const sceneArt = (place: string, sky: string) => fileOr(`district.${place}`, () => scene(place, sky), 'scene-art');
export const lanternArt = (color = 'gold', lit = true) => svg(lantern(LANTERN_COLORS[color] || color, lit), 'lantern-art');
export const iconEl = (id: string, cls = '') => svg(icon(id, cls));

/** A pictogram of a meaning card: `glyph:<text>` draws letters in a pearl, otherwise an icon. */
export function picto(id: string, count?: number): Element {
  if (id.startsWith('glyph:')) {
    const g = id.slice(6).replace('{count}', String(count ?? ''));
    return h('span', { class: 'picto picto-glyph', 'aria-hidden': 'true' }, g);
  }
  const map: Record<string, string> = { stop: 'stopsign' };
  const k = map[id] || id;
  if (manifest['icon.' + k]) return h('img', { src: './' + manifest['icon.' + k], alt: '', class: 'picto' });
  return h('span', { class: 'picto', 'aria-hidden': 'true' }, svg(icon(hasIcon(k) ? k : 'pearl')));
}

export function pearlSvg(state: 'locked' | 'open' | 's1' | 's2' | 's3', dusty = false): string {
  const fill = state === 'locked' ? 'none' : state === 'open' ? '#d9d4c8' : '#fdf8ee';
  const rim = state === 's3' ? '#e9b44c' : state === 'locked' ? '#8890aa' : '#cfc6b4';
  const gloss = state === 's2' || state === 's3' ? '<ellipse cx="13" cy="12" rx="5" ry="3.5" fill="#fff" opacity=".9" transform="rotate(-30 13 12)"/>' : state === 's1' ? '<circle cx="13" cy="12" r="2.5" fill="#fff" opacity=".6"/>' : '';
  return `<svg viewBox="0 0 40 40" class="pearl-svg ${dusty ? 'dusty' : ''}"><defs><radialGradient id="pg" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${fill}"/></radialGradient></defs>
    <circle cx="20" cy="20" r="15" fill="${state === 'locked' ? 'none' : 'url(#pg)'}" stroke="${rim}" stroke-width="${state === 's3' ? 3.5 : 2}" ${state === 'locked' ? 'stroke-dasharray="3 3"' : ''}/>${gloss}
    ${dusty ? '<g fill="#8a7a5a" opacity=".55"><circle cx="24" cy="25" r="1.3"/><circle cx="17" cy="27" r="1"/><circle cx="27" cy="18" r="1"/><circle cx="20" cy="22" r=".8"/></g>' : ''}</svg>`;
}

export function medalSvg(): string {
  return `<svg viewBox="0 0 200 240" class="medal-svg">
  <defs><radialGradient id="mg" cx=".4" cy=".35"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="#e9b44c"/><stop offset="1" stop-color="#b37a1f"/></radialGradient>
  <radialGradient id="pp" cx=".35" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e8e1d2"/></radialGradient></defs>
  <path d="M70 0 h24 l-6 90 h-30z M106 0 h24 l12 90 h-30z" fill="#1f8a8a"/><path d="M82 0 h8 l-4 90 h-8z M110 0 h8 l8 90 h-8z" fill="#17706f"/>
  <circle cx="100" cy="150" r="74" fill="url(#mg)"/>
  ${Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<circle cx="${(100 + Math.cos(a) * 64).toFixed(1)}" cy="${(150 + Math.sin(a) * 64).toFixed(1)}" r="3.2" fill="#fff6d6"/>`; }).join('')}
  <circle cx="100" cy="150" r="54" fill="none" stroke="#b37a1f" stroke-width="2"/>
  <path d="M100 104 l10 22 24 4-17 17 4 24-21-11-21 11 4-24-17-17 24-4z" fill="#f5cf6a" stroke="#b37a1f" stroke-width="1.5"/>
  <circle cx="100" cy="146" r="16" fill="url(#pp)" stroke="#cfc6b4"/><ellipse cx="95" cy="140" rx="5" ry="3" fill="#fff"/>
</svg>`;
}
