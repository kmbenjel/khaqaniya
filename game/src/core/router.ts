// Hash routes (GAME_DESIGN §8): #/ home · #/intro · #/map · #/verse/:n · #/boss/:id · #/polish · #/necklace · #/stickers ·
// #/heroes · #/finale · #/medal · #/dedication · #/grownups · #/about (+ #/profiles, #/cert, #/splash).
import { clear } from './h';
import { emit } from './env';
import { setBubbleHost, stopVoice } from './voice';
import { stop } from './audio';
import { sfx } from './sfx';
import { setActive } from '../games/engine';

export interface ScreenCtx { signal: AbortSignal; params: string[]; query: URLSearchParams }
export type Screen = (ctx: ScreenCtx) => HTMLElement | Promise<HTMLElement>;
const routes: { re: RegExp; screen: Screen; name: string }[] = [];
let app: HTMLElement;
let ctl: AbortController | null = null;
let current = '';
let guard: ((hash: string) => string | null) | null = null;

export function route(pattern: string, name: string, screen: Screen) {
  const re = new RegExp('^' + pattern.replace(/:\w+/g, '([^/?]+)') + '$');
  routes.push({ re, screen, name });
}
export function setGuard(g: (hash: string) => string | null) { guard = g; }
let rendering = '';
export function go(hash: string, replace = false, force = false) {
  if (location.hash === hash) { if (force || rendering !== hash) void render(); return; }
  if (replace) { history.replaceState(null, '', hash); void render(); }
  else location.hash = hash;
}
export const currentRoute = () => current;

export async function render(): Promise<void> {
  let hash = location.hash || '#/';
  if (guard) { const r = guard(hash); if (r && r !== hash) { history.replaceState(null, '', r); hash = r; } }
  rendering = hash;
  const [path, qs] = hash.slice(1).split('?');
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    ctl?.abort();
    stop();
    stopVoice();   // a character line never runs on into the next screen
    setActive(null);
    setBubbleHost(null);
    // sheets close through their own close() (it removes their key listener); overlays are plain nodes
    document.querySelectorAll('.sheet-wrap').forEach((e) => { const c = (e as HTMLElement & { kqClose?: () => void }).kqClose; if (c) c(); else e.remove(); });
    document.querySelectorAll('.overlay').forEach((e) => e.remove());
    const c = new AbortController();
    ctl = c;
    current = r.name;
    const el = await r.screen({ signal: c.signal, params: m.slice(1).map(decodeURIComponent), query: new URLSearchParams(qs || '') });
    if (c.signal.aborted) return;
    clear(app);
    el.classList.add('screen', 'screen-' + r.name);
    app.appendChild(el);
    app.dataset.screen = r.name;
    window.scrollTo(0, 0);
    // screen readers and keyboards start on the new screen, not on a detached button of the old one
    if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected || app.contains(document.activeElement) === false) {
      el.tabIndex = -1; el.focus({ preventScroll: true });
    }
    sfx('whoosh');
    emit('kq:screen', { name: r.name, params: m.slice(1) });
    return;
  }
  go('#/', true);
}

export function startRouter(root: HTMLElement) {
  app = root;
  window.addEventListener('hashchange', () => void render());
  void render();
}
