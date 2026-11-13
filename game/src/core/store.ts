// Progress and settings on the device only: localStorage["kq.v1"], one JSON document (GAME_DESIGN §10.2).
export type Level = 'easy' | 'mid' | 'strong';
export interface VerseState { stars: number; box: number; due: string; rung: number; plays: number; lapses: number; weak: Record<string, number>; last: string }
export interface Profile {
  id: string; name: string; lantern: string; level: Level; seed: number; created: string;
  days: string[]; skill: number; boost: number; items: number;
  seen: { intro?: boolean; cast?: boolean; how: Record<string, number>; tips: string[]; jokes: string[]; lines: string[]; lahn?: boolean; askedName?: boolean; listened?: number[] };
  verses: Record<string, VerseState>;
  bosses: Record<string, { stars: number; crown: boolean; date: string; noHelp?: boolean }>;
  stickers: Record<string, string>;
  polish: { sessions: number; last: string };
  medal: { date: string | null; certName: string | null; showName?: boolean };
  newToday: { date: string; count: number };
  rewards: number;
  sardineTaps?: number;
}
export interface Settings {
  recitation: boolean; voices: boolean; sfx: boolean; textSize: 's' | 'm' | 'l'; numerals: 'latn' | 'arab'; reduceMotion: boolean | null;
  grownupMode: boolean; challenge: boolean; dailyNew: number; openAll: boolean; mic: boolean; ai: { on: boolean; mode: string | null };
  slow?: boolean;
}
export interface State { v: 1; activeProfile: string; settings: Settings; profiles: Profile[] }

const KEY = 'kq.v1';
export const LANTERNS = ['gold', 'teal', 'rose', 'sky', 'leaf', 'violet'] as const;
export const INTERVALS = [1, 2, 4, 8, 16, 32];

let clockOffsetDays = 0;
let memoryOnly = false;
export function setClockOffset(d: number) { clockOffsetDays = d; }
export function getClockOffset() { return clockOffsetDays; }
export function setMemoryOnly(v: boolean) { memoryOnly = v; }

/** Local calendar date YYYY-MM-DD (moved by the test clock). */
export function today(): string { return dateStr(new Date(Date.now() + clockOffsetDays * 86400000)); }
export function dateStr(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function addDays(date: string, n: number): string { const [y, m, d] = date.split('-').map(Number); return dateStr(new Date(y, m - 1, d + n)); }
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function defaultSettings(): Settings {
  return { recitation: true, voices: true, sfx: true, textSize: 's', numerals: 'latn', reduceMotion: null, grownupMode: false, challenge: false, dailyNew: 2, openAll: false, mic: false, ai: { on: false, mode: null } };
}
export function newProfile(id: string, seed?: number): Profile {
  return {
    id, name: '', lantern: 'gold', level: 'easy', seed: seed ?? Math.floor(Math.random() * 1e9), created: today(),
    days: [], skill: 0.6, boost: 0, items: 0,
    seen: { how: {}, tips: [], jokes: [], lines: [] }, verses: {}, bosses: {}, stickers: {},
    polish: { sessions: 0, last: '' }, medal: { date: null, certName: null }, newToday: { date: '', count: 0 }, rewards: 0,
  };
}

let state: State = load();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* fresh */ }
  return fresh();
}
function fresh(): State { return { v: 1, activeProfile: 'p1', settings: defaultSettings(), profiles: [newProfile('p1')] }; }
function migrate(s: State): State {
  const d = defaultSettings();
  s.settings = { ...d, ...(s.settings || {}) };
  if (!s.profiles?.length) s.profiles = [newProfile('p1')];
  for (const p of s.profiles) {
    const np = newProfile(p.id, p.seed);
    Object.assign(np, p);
    np.seen = { ...newProfile(p.id).seen, ...(p.seen || {}) };
    Object.assign(p, np);
  }
  if (!s.profiles.find((p) => p.id === s.activeProfile)) s.activeProfile = s.profiles[0].id;
  return s;
}

/** sessionStorage that never throws (Safari private mode, storage blocked): falls back to memory for the session. */
const sessionMem = new Map<string, string>();
export const session = {
  get: (k: string): string | null => { try { return sessionStorage.getItem(k); } catch { return sessionMem.get(k) ?? null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { sessionMem.set(k, v); } },
  del: (k: string) => { try { sessionStorage.removeItem(k); } catch { /* */ } sessionMem.delete(k); },
};
let storageFailed = false;
/** false once progress could not be written (private mode, storage blocked, quota): the game plays on in memory. */
export const storageOk = () => !storageFailed;
export function save(): void {
  if (memoryOnly) return;
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageFailed = false; }
  catch { storageFailed = true; /* quota or private mode: play on, and say so (error.storage.kid / error.storage) */ }
}
export const S = () => state;
export const settings = () => state.settings;
export function profile(): Profile { return state.profiles.find((p) => p.id === state.activeProfile) || state.profiles[0]; }
export function setState(s: State) { state = migrate(s); save(); }
export function resetAll(seed?: number) { state = fresh(); if (seed !== undefined) state.profiles[0].seed = seed; save(); }
export function exportJSON(): string { return JSON.stringify(state, null, 1); }
export function importJSON(txt: string): boolean {
  try { const s = JSON.parse(txt); if (s && s.v === 1 && Array.isArray(s.profiles)) { setState(s); return true; } } catch { /* ignore */ }
  return false;
}
export function addProfile(): Profile {
  const id = 'p' + (Math.max(0, ...state.profiles.map((p) => Number(p.id.slice(1)) || 0)) + 1);
  const p = newProfile(id);
  state.profiles.push(p);
  state.activeProfile = id;
  save();
  return p;
}
export function switchProfile(id: string) { if (state.profiles.find((p) => p.id === id)) { state.activeProfile = id; save(); } }
export function deleteProfile(id: string) {
  state.profiles = state.profiles.filter((p) => p.id !== id);
  if (!state.profiles.length) state.profiles.push(newProfile('p1'));
  if (!state.profiles.find((p) => p.id === state.activeProfile)) state.activeProfile = state.profiles[0].id;
  save();
}

// ── verse progress ─────────────────────────────────────────────────────────────────
export const vs = (n: number): VerseState | undefined => profile().verses[String(n)];
export const learned = (n: number) => (vs(n)?.stars || 0) > 0;
export const learnedCount = () => Object.values(profile().verses).filter((v) => v.stars > 0).length;
export const starsTotal = () => Object.values(profile().verses).reduce((a, v) => a + (v.stars || 0), 0);
export function isDue(n: number, on = today()): boolean { const v = vs(n); return !!v && v.stars > 0 && v.due <= on; }

/** A verse finished as a level: stars only go up; a first finish starts box 1, due tomorrow, rung 1 (§4.9). */
export function finishVerse(n: number, stars: number): { first: boolean; stars: number } {
  const p = profile(); const k = String(n); const d = today();
  const cur = p.verses[k];
  if (!cur) {
    p.verses[k] = { stars, box: 1, due: addDays(d, INTERVALS[0]), rung: 1, plays: 1, lapses: 0, weak: pendingWeak[k] || {}, last: d };
    delete pendingWeak[k];
    if (p.newToday.date !== d) p.newToday = { date: d, count: 0 };
    p.newToday.count++;
    markDay();
    save();
    return { first: true, stars };
  }
  cur.stars = Math.max(cur.stars, stars); cur.plays++; cur.last = d;
  markDay();
  save();
  return { first: false, stars: cur.stars };
}
export function polishResult(n: number, pass: boolean): void {
  const v = vs(n); if (!v) return;
  const d = today();
  if (pass) {
    if (v.rung >= 4 && v.stars < 3) v.stars++;
    v.box = Math.min(6, v.box + 1); v.rung = Math.min(5, v.rung + 1);
    v.due = addDays(d, INTERVALS[v.box - 1]);
  } else {
    v.box = Math.max(1, v.box - 1); v.rung = Math.max(1, v.rung - 1); v.due = addDays(d, 1); v.lapses++;
  }
  v.last = d;
  save();
}
/** Words marked as missed in RECITE ("someone is listening"). On a first learning the verse has no state yet: keep the
 *  marks here until finishVerse creates it (leaving mid-level keeps nothing, §4.2). */
const pendingWeak: Record<string, Record<string, number>> = {};
export function clearPendingWeak() { for (const k of Object.keys(pendingWeak)) delete pendingWeak[k]; }
export function markWeak(n: number, key: string) {
  const v = vs(n);
  const w = v ? v.weak : (pendingWeak[String(n)] ||= {});
  w[key] = (w[key] || 0) + 1;
  if (v) save();
}

/** Distinct days played: counted after one new pearl or one polish session (§5.3). */
export function markDay(): void {
  const p = profile(); const d = today();
  if (!p.days.includes(d)) { p.days.push(d); p.days.sort(); }
}
export function lastSevenLamps(): boolean[] {
  const d = today(); const set = new Set(profile().days);
  return Array.from({ length: 7 }, (_, i) => set.has(addDays(d, -i)));
}
export function daysAway(): number {
  const ds = profile().days.filter((d) => d < today());
  return ds.length ? daysBetween(ds[ds.length - 1], today()) : 0;
}
export function newToday(): number { const p = profile(); return p.newToday.date === today() ? p.newToday.count : 0; }

export function award(id: string): boolean {
  const p = profile();
  if (p.stickers[id]) return false;
  p.stickers[id] = today();
  save();
  return true;
}

/** Adaptation inside play (§4.7): moving average of "right at first try", boost every 10 items. */
export function adapt(firstTry: boolean): void {
  const p = profile();
  p.skill = p.skill * 0.8 + (firstTry ? 1 : 0) * 0.2;
  p.items++;
  if (p.items % 10 === 0) {
    if (p.skill > 0.85) p.boost = Math.min(2, p.boost + 1);
    else if (p.skill < 0.5) p.boost = Math.max(-1, p.boost - 1);
  }
}
