// Progress and settings on the device only: localStorage["kq.v1"], one JSON document (GAME_DESIGN §10.2).
export type Level = 'easy' | 'mid' | 'strong';
export interface VerseState { stars: number; box: number; due: string; rung: number; plays: number; lapses: number; weak: Record<string, number>; last: string }
export interface Profile {
  id: string; name: string; lantern: string; level: Level; seed: number; created: string;
  days: string[]; skill: number; boost: number; items: number;
  seen: { intro?: boolean; cast?: boolean; how: Record<string, number>; tips: string[]; jokes: string[]; lines: string[]; lahn?: boolean; askedName?: boolean; listened?: number[]; facts?: string[]; book?: string[]; tomorrow?: string };
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
/** true when the stored progress could not be read nor set aside: nothing is written over it this session */
let holdStored = false;
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

function load(): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { return fresh(); }
  if (!raw) return fresh();
  try {
    const s = JSON.parse(raw);
    if (isObj(s)) return migrate(s);
  } catch { /* unreadable */ }
  // an unreadable store (cut by a full disk, edited by hand) is kept aside for a grown-up, never silently lost (G6); if
  // even that copy cannot be written, this session plays from memory and never writes over it (R1)
  try { localStorage.setItem(KEY + '.unreadable', raw); } catch { holdStored = true; }
  return fresh();
}
function fresh(): State { return { v: 1, activeProfile: 'p1', settings: defaultSettings(), profiles: [newProfile('p1')] }; }

// ── a stored or imported store, made safe field by field (G6): what has the expected type is kept, the rest is the
// default. A wrong field never crashes a screen later, and one bad field never costs the whole progress.
const isObj = (x: unknown): x is Record<string, any> => !!x && typeof x === 'object' && !Array.isArray(x);
const isDate = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const finite = (x: unknown): number | null => { const n = typeof x === 'string' && x.trim() ? Number(x) : x; return typeof n === 'number' && Number.isFinite(n) ? n : null; };
const strs = (x: unknown): string[] => (Array.isArray(x) ? x.filter((e): e is string => typeof e === 'string') : []);
const nums = (x: unknown): number[] => (Array.isArray(x) ? x.filter((e): e is number => typeof e === 'number' && Number.isFinite(e)) : []);
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
/** Same type as the default, else the default (arrays and plain objects told apart). */
function fit<T>(def: T, val: unknown): T {
  if (Array.isArray(def)) return (Array.isArray(val) ? val : def) as T;
  if (isObj(def)) return (isObj(val) ? val : def) as T;
  if (def === null) return (val === null || typeof val === 'string' ? val : def) as T;
  return (typeof val === typeof def ? val : def) as T;
}
function cleanSettings(x: unknown): Settings {
  const d = defaultSettings();
  const s = isObj(x) ? x : {};
  const out = { ...d } as Settings & Record<string, unknown>;
  for (const k of Object.keys(d) as (keyof Settings)[]) (out as Record<string, unknown>)[k] = fit(d[k], s[k]);
  if (!['s', 'm', 'l'].includes(out.textSize)) out.textSize = d.textSize;
  if (!['latn', 'arab'].includes(out.numerals)) out.numerals = d.numerals;
  out.reduceMotion = typeof s.reduceMotion === 'boolean' ? s.reduceMotion : null;
  out.dailyNew = clamp(Math.round(finite(s.dailyNew) ?? d.dailyNew), 0, 51);
  out.ai = { on: isObj(s.ai) && s.ai.on === true, mode: isObj(s.ai) && typeof s.ai.mode === 'string' ? s.ai.mode : null };
  if (typeof s.slow === 'boolean') out.slow = s.slow;
  return out;
}
function cleanVerse(x: unknown, d: string): VerseState | null {
  if (!isObj(x)) return null;
  const stars = finite(x.stars);
  if (stars === null) return null;
  const weak: Record<string, number> = {};
  if (isObj(x.weak)) for (const [k, c] of Object.entries(x.weak)) { const n = finite(c); if (n !== null && n > 0) weak[k] = n; }
  return {
    stars: clamp(Math.round(stars), 0, 3), box: clamp(Math.round(finite(x.box) ?? 1), 1, 6), due: isDate(x.due) ? x.due : d,
    rung: clamp(Math.round(finite(x.rung) ?? 1), 1, 5), plays: Math.max(0, Math.round(finite(x.plays) ?? 1)),
    lapses: Math.max(0, Math.round(finite(x.lapses) ?? 0)), weak, last: isDate(x.last) ? x.last : d,
  };
}
function cleanProfile(x: Record<string, any>, id: string): Profile {
  const p = newProfile(id, typeof x.seed === 'number' && Number.isFinite(x.seed) ? x.seed : undefined);
  const d = today();
  p.name = typeof x.name === 'string' ? x.name : '';
  if ((LANTERNS as readonly string[]).includes(x.lantern)) p.lantern = x.lantern;
  if (['easy', 'mid', 'strong'].includes(x.level)) p.level = x.level;
  if (isDate(x.created)) p.created = x.created;
  p.days = [...new Set(strs(x.days).filter(isDate))].sort();
  p.skill = clamp(finite(x.skill) ?? p.skill, 0, 1);
  p.boost = clamp(Math.round(finite(x.boost) ?? 0), -1, 2);
  p.items = Math.max(0, Math.round(finite(x.items) ?? 0));
  const seen = isObj(x.seen) ? x.seen : {};
  p.seen = { ...seen, how: {}, tips: strs(seen.tips), jokes: strs(seen.jokes), lines: strs(seen.lines) };
  if (isObj(seen.how)) for (const [k, c] of Object.entries(seen.how)) { const n = finite(c); if (n !== null) p.seen.how[k] = n; }
  for (const k of ['intro', 'cast', 'lahn', 'askedName'] as const) { if (k in seen && typeof seen[k] !== 'boolean') delete p.seen[k]; }
  for (const k of ['facts', 'book'] as const) { if (k in seen) p.seen[k] = strs(seen[k]); }
  if ('listened' in seen) p.seen.listened = nums(seen.listened);
  if ('tomorrow' in seen && typeof seen.tomorrow !== 'string') delete p.seen.tomorrow;
  if (isObj(x.verses)) for (const [k, v] of Object.entries(x.verses)) { const c = /^\d+$/.test(k) ? cleanVerse(v, d) : null; if (c) p.verses[k] = c; }
  if (isObj(x.bosses)) for (const [k, b] of Object.entries(x.bosses)) if (isObj(b)) p.bosses[k] = { stars: clamp(Math.round(finite(b.stars) ?? 1), 0, 3), crown: b.crown === true, date: isDate(b.date) ? b.date : d, ...(typeof b.noHelp === 'boolean' ? { noHelp: b.noHelp } : {}) };
  if (isObj(x.stickers)) for (const [k, v] of Object.entries(x.stickers)) if (typeof v === 'string') p.stickers[k] = v;
  if (isObj(x.polish)) p.polish = { sessions: Math.max(0, Math.round(finite(x.polish.sessions) ?? 0)), last: typeof x.polish.last === 'string' ? x.polish.last : '' };
  if (isObj(x.medal)) p.medal = { date: isDate(x.medal.date) ? x.medal.date : null, certName: typeof x.medal.certName === 'string' ? x.medal.certName : null, ...(typeof x.medal.showName === 'boolean' ? { showName: x.medal.showName } : {}) };
  if (isObj(x.newToday) && isDate(x.newToday.date)) p.newToday = { date: x.newToday.date, count: Math.max(0, Math.round(finite(x.newToday.count) ?? 0)) };
  p.rewards = Math.max(0, Math.round(finite(x.rewards) ?? 0));
  if (finite(x.sardineTaps) !== null) p.sardineTaps = finite(x.sardineTaps)!;
  return p;
}
function migrate(s: Record<string, any>): State {
  const profiles: Profile[] = [];
  for (const x of Array.isArray(s.profiles) ? s.profiles : []) {
    if (!isObj(x)) continue;
    let id = typeof x.id === 'string' && /^p\d+$/.test(x.id) ? x.id : '';
    if (!id || profiles.some((p) => p.id === id)) id = 'p' + (Math.max(0, ...profiles.map((p) => Number(p.id.slice(1)) || 0)) + 1);
    profiles.push(cleanProfile(x, id));
  }
  if (!profiles.length) profiles.push(newProfile('p1'));
  const active = profiles.find((p) => p.id === s.activeProfile)?.id || profiles[0].id;
  return { v: 1, activeProfile: active, settings: cleanSettings(s.settings), profiles };
}

// after the helpers above (they are consts: loading earlier would hit them before they exist)
let state: State = load();

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
  if (holdStored) { storageFailed = true; return; }   // says so (error.storage.*), as a full disk would
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageFailed = false; }
  catch { storageFailed = true; /* quota or private mode: play on, and say so (error.storage.kid / error.storage) */ }
}
export const S = () => state;
export const settings = () => state.settings;
export function profile(): Profile { return state.profiles.find((p) => p.id === state.activeProfile) || state.profiles[0]; }
export function setState(s: State) { state = migrate(s); save(); }
/** A fresh start (grown-ups' «reset», tests' fresh=1): the set-aside unreadable copy goes too, and saving resumes. */
export function resetAll(seed?: number) {
  state = fresh(); if (seed !== undefined) state.profiles[0].seed = seed;
  holdStored = false;
  try { localStorage.removeItem(KEY + '.unreadable'); } catch { /* storage blocked */ }
  save();
}
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
export function lastSevenLamps(p: Profile = profile()): boolean[] {
  const d = today(); const set = new Set(p.days);
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
