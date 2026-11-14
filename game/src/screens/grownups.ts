// Grown-ups' corner behind a gate (GAME_DESIGN §10.4), the pause menu (no gate), About and privacy.
import { h } from '../core/h';
import { t, num, setNumerals, family, has } from '../core/copy';
import { btn, iconBtn, sheet, toast } from '../core/ui';
import { settings, save, S, profile, exportJSON, importJSON, resetAll, deleteProfile, addProfile, switchProfile, storageOk, type Settings, type Level } from '../core/store';
import { P } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { env } from '../core/env';
import { sfx } from '../core/sfx';
import { followSwitches } from '../core/audio';
import { downloadAll } from '../sw-client';
import { profileEditor } from './profiles';
import { charArt } from '../art';

export function applySettings() {
  const s = settings();
  const de = document.documentElement;
  de.dataset.textSize = s.textSize;
  const rm = env.motion === false || (s.reduceMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches);
  de.classList.toggle('reduce-motion', !!rm);
  de.classList.toggle('grownup', s.grownupMode);
  setNumerals(s.numerals);
  followSwitches();   // a sound switched off mid-clip falls silent at once
}

let gateOpenUntil = 0, gateLockUntil = 0;
const gateOpen = () => env.capture || Date.now() < gateOpenUntil;

function toggle(key: keyof Settings, labelKey: string, onChange?: () => void): HTMLElement {
  const s = settings();
  const input = h('input', { type: 'checkbox', checked: !!s[key], 'data-testid': 'set-' + key }) as HTMLInputElement;
  input.addEventListener('change', () => { (s as unknown as Record<string, unknown>)[key] = input.checked; save(); applySettings(); sfx('tap'); onChange?.(); });
  return h('label', { class: 'toggle row-toggle' }, input, h('span', null, t(labelKey)));
}
function choice<T extends string | number>(labelKey: string, vals: T[], get: () => T, set: (v: T) => void, labelOf: (v: T) => string, testid: string): HTMLElement {
  const row = h('div', { class: 'choice', role: 'radiogroup', 'aria-label': t(labelKey) });
  const render = () => { row.replaceChildren(...vals.map((v) => btn(labelOf(v), { cls: 'chip' + (get() === v ? ' on' : ''), testid: testid + '-' + v, onClick: () => { set(v); save(); applySettings(); render(); } }))); };
  render();
  return h('div', { class: 'field' }, h('span', null, t(labelKey)), row);
}
export const textSizeChoice = () => choice('settings.textSize', ['s', 'm', 'l'] as Settings['textSize'][], () => settings().textSize, (v) => { settings().textSize = v; }, (v) => t('settings.textSize.' + v), 'size');

/** The pause menu of play screens: resume · voices, effects, text size · exit to the map. */
export function pauseMenu(onExit: () => void) {
  const s = sheet(h('div', { class: 'pause' },
    btn(t('btn.resume'), { icon: 'play', primary: true, testid: 'btn-resume', onClick: () => s.close() }),
    toggle('voices', 'settings.voices'), toggle('sfx', 'settings.sfx'), toggle('recitation', 'settings.recitation'), textSizeChoice(),
    btn(t('btn.exitMap'), { icon: 'map', testid: 'btn-exit', onClick: () => { s.close(); onExit(); } })), { testid: 'pause', title: t('btn.pause') });
}

function gate(onOpen: () => void): HTMLElement {
  const a = 12 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 7);
  let wrong = 0;
  const input = h('input', { type: 'text', inputMode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', 'data-testid': 'gate-input', 'aria-label': t('grown.gate.q', { a, b }) }) as HTMLInputElement;
  const msg = h('p', { class: 'gate-msg', 'aria-live': 'polite' });
  const check = () => {
    if (Date.now() < gateLockUntil) { msg.textContent = t('grown.gate.wait', { n: Math.ceil((gateLockUntil - Date.now()) / 1000) }); return; }
    const v = Number(input.value.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
    if (v === a * b) { gateOpenUntil = Date.now() + 10 * 60000; onOpen(); return; }
    wrong++; input.value = ''; sfx('thud');
    if (wrong >= 3) { gateLockUntil = Date.now() + 30000; wrong = 0; msg.textContent = t('grown.gate.wait', { n: 30 }); } else msg.textContent = t('grown.gate.wrong');
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  setTimeout(() => input.focus(), 50);
  return h('div', { class: 'gate', 'data-testid': 'gate' }, h('h2', null, t('grown.gate.title')), h('p', { class: 'gate-hint' }, t('grown.gate.hint')), h('p', { class: 'gate-q' }, t('grown.gate.q', { a, b })), input, btn(t('grown.gate.ok'), { icon: 'check', primary: true, testid: 'gate-ok', onClick: check }), msg);
  void S;
}

export function grownupsScreen(_ctx: ScreenCtx): HTMLElement {
  const root = h('div', { class: 'page grownups', 'data-testid': 'grownups' },
    h('header', { class: 'topbar' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/'), 'back-btn'), h('div', { class: 'top-title' }, t('grown.title'))));
  const body = h('div', { class: 'grown-body' });
  root.appendChild(body);
  const open = () => body.replaceChildren(corner());
  if (gateOpen()) open(); else body.replaceChildren(gate(open));
  return root;
}

function corner(): HTMLElement {
  const s = settings();
  const tips = family('grown.tips');
  const players = h('div', { class: 'players' });
  const renderPlayers = () => players.replaceChildren(...S().profiles.map((p) => h('div', { class: 'player-row' + (p.id === profile().id ? ' me' : '') },
    h('span', { dir: 'auto' }, p.name || t('profile.guest')),
    btn(t('heroes.switch'), { small: true, testid: 'pick-' + p.id, onClick: () => { switchProfile(p.id); renderPlayers(); } }),
    btn(t('profile.rename'), { small: true, testid: 'edit-' + p.id, onClick: () => { switchProfile(p.id); const sh = sheet(profileEditor(() => { sh.close(); renderPlayers(); }), { testid: 'edit-sheet' }); } }),
    btn(t('profile.delete'), { small: true, testid: 'del-' + p.id, onClick: () => { if (confirm(t('profile.delete.confirm'))) { deleteProfile(p.id); renderPlayers(); } } }))),
    btn(t('heroes.new'), { icon: 'plus', small: true, testid: 'btn-add-player', onClick: () => { addProfile(); renderPlayers(); } }));
  renderPlayers();
  const fileIn = h('input', { type: 'file', accept: 'application/json', hidden: true, 'data-testid': 'import-file' }) as HTMLInputElement;
  fileIn.addEventListener('change', async () => { const f = fileIn.files?.[0]; if (f && importJSON(await f.text())) { applySettings(); toast(t('settings.import.done')); } });
  return h('div', { class: 'corner' },
    h('section', null, h('h2', null, t('grown.section.tips')), h('ul', { class: 'tips' }, ...tips.map((k) => h('li', null, t(k))))),
    h('section', null, h('h2', null, t('settings.title')),
      toggle('recitation', 'settings.recitation'), toggle('voices', 'settings.voices'), toggle('sfx', 'settings.sfx'), textSizeChoice(),
      choice<Level>('profile.level', ['easy', 'mid', 'strong'], () => profile().level, (v) => { profile().level = v; }, (v) => t('profile.level.' + v), 'level'),
      toggle('grownupMode', 'settings.grownupMode'),
      choice<number>('settings.dailyNew', [1, 2, 3, 0], () => s.dailyNew, (v) => { s.dailyNew = v; }, (v) => (v ? num(v) : t('settings.dailyNew.none')), 'daily'),
      toggle('openAll', 'settings.openAll'),
      choice<'latn' | 'arab'>('settings.numerals', ['latn', 'arab'], () => s.numerals, (v) => { s.numerals = v; }, (v) => (v === 'latn' ? '1 2 3' : '١ ٢ ٣'), 'num'),
      (() => { const el = h('label', { class: 'toggle row-toggle' }); const i = h('input', { type: 'checkbox', checked: s.reduceMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches, 'data-testid': 'set-reduceMotion' }) as HTMLInputElement; i.addEventListener('change', () => { s.reduceMotion = i.checked; save(); applySettings(); }); el.append(i, h('span', null, t('settings.reduceMotion'))); return el; })(),
      h('p', { class: 'soon' }, t('settings.mic'), ' — ', t('settings.soon')),
      btn(t('settings.replayIntro'), { icon: 'again', small: true, testid: 'btn-replay-intro', onClick: () => { profile().seen.intro = false; save(); go('#/intro'); } }),
      btn(t('grown.download'), { icon: 'save', testid: 'btn-download-all', onClick: async (e) => { const b = e.currentTarget as HTMLButtonElement; b.disabled = true; const r = await downloadAll((k, of) => { b.querySelector('.btn-label')!.textContent = t('grown.download.progress', { n: Math.round((100 * k) / of) }); }); const of = r.done + r.failed; b.querySelector('.btn-label')!.textContent = r.failed ? t('grown.download.progress', { n: Math.floor((100 * r.done) / Math.max(1, of)) }) : t('grown.download.done'); if (r.failed) b.disabled = false; /* some files failed: the percentage stays below 100 and the button can be pressed again */ } })),
    h('section', null, h('h2', null, t('grown.section.players')), players),
    h('section', null, h('h2', null, t('grown.section.data')),
      // progress cannot be saved here (private mode, storage blocked): the grown-ups' detail
      storageOk() ? null : h('p', { class: 'storage-warn', role: 'status', 'data-testid': 'storage-warn-grown' }, t('error.storage')),
      // iOS Safari has no install prompt: say how to add the game to the home screen (only on iOS, not already installed)
      isIOS() && !standalone() && has('app.install.ios') ? h('p', { class: 'install-ios', 'data-testid': 'install-ios' }, t('app.install.ios')) : null,
      btn(t('settings.export'), { icon: 'save', small: true, testid: 'btn-export', onClick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' })), download: 'khaqaniya-progress.json' }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 10_000); } }),
      btn(t('settings.import'), { icon: 'plus', small: true, testid: 'btn-import', onClick: () => fileIn.click() }), fileIn,
      btn(t('grown.reset'), { icon: 'again', small: true, testid: 'btn-reset', onClick: () => { if (confirm(t('grown.reset.confirm'))) { resetAll(); applySettings(); go('#/'); } } })),
    h('section', null, h('h2', null, t('grown.section.ai')), h('p', null, t('ai.desc')), h('p', { class: 'soon' }, t('ai.soon'))),
    h('section', null, h('h2', null, t('grown.section.privacy')), ...family('privacy').map((k) => h('p', null, t(k)))),
    h('section', null, h('h2', null, t('grown.section.about')), btn(t('about.title'), { icon: 'info', testid: 'btn-about', onClick: () => go('#/about') }), btn(t('dedication.title'), { icon: 'heart', onClick: () => go('#/dedication') }),
      h('a', { href: './qasida/', class: 'btn btn-small' }, t('settings.link.poem')), btn(t('grown.exit'), { icon: 'play', primary: true, onClick: () => go('#/') })));
}

export function aboutScreen(_ctx: ScreenCtx): HTMLElement {
  const poem = P();
  const src = poem.timingsSource;
  const cites = [...new Set(poem.verses.flatMap((v) => v.meaning?.cite || []))].slice(0, 12);
  const fixture = poem.build.fixture.length ? h('p', { class: 'fixture-note', 'data-testid': 'fixture-note' }, 'DEV BUILD · ', poem.build.fixture.join(' · ')) : null;
  const P_ = (k: string, params?: Record<string, string | number>) => h('p', null, t(k, params));
  // About is written for grown-ups (copy `aud: adult`, sources, versions): behind the same gate as their corner (G5)
  const page = h('div', { class: 'page about', 'data-testid': 'about' },
    h('header', { class: 'topbar' }, iconBtn('back', 'aria.back', 'btn-back', () => (history.length > 1 ? history.back() : go('#/')), 'back-btn'), h('div', { class: 'top-title' }, t(gateOpen() ? 'about.title' : 'grown.title'))));
  const body = () => h('div', { class: 'about-body' },
      h('div', { class: 'about-cast' }, charArt('laqlaq', 'happy')),
      h('h2', null, poem.fullTitle),
      P_('about.poem', { fullTitle: poem.fullTitle }),
      P_('about.author', { author: poem.author, death: poem.authorDeath || '' }),
      P_('about.metre', { metre: poem.metre || '' }),
      poem.basis ? P_('about.basis', { basis: poem.basis }) : null,
      src?.reciter ? h('p', { class: 'credit', 'data-testid': 'reciter-credit' }, poem.credits.reciterLine.replace('{reciter}', src.reciter)) : null,
      src?.reciter ? P_('about.reciter', { reciter: src.reciter }) : null,
      src?.url ? h('p', null, t('about.reciter.src', { url: '' }), h('a', { href: src.url, rel: 'noopener', target: '_blank', dir: 'ltr' }, src.url)) : null,
      src?.credit ? h('p', { class: 'small' }, src.credit) : null,
      P_('about.meanings'),
      cites.length ? P_('about.sources', { sources: cites.join('، ') }) : null,
      P_('about.voices'), P_('about.art'), h('p', { class: 'no-music' }, t('about.noMusic')), P_('about.offline'),
      P_('about.fonts', { fonts: 'Amiri · Tajawal (SIL Open Font License 1.1)' }),
      P_('about.license', { license: 'MIT' }),
      h('p', { class: 'dedication-line' }, t('about.dedication')),
      h('p', null, h('a', { href: './qasida/', 'data-testid': 'about-qasida' }, t('about.link.poem'))),
      h('p', { class: 'version' }, t('about.version', { v: poem.build.version + ' · ' + poem.build.built })), fixture);
  if (gateOpen()) page.appendChild(body());
  else { const wrap = h('div', { class: 'grown-body' }, gate(() => { wrap.replaceWith(body()); page.querySelector('.top-title')!.textContent = t('about.title'); })); page.appendChild(wrap); }
  return page;
}

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
