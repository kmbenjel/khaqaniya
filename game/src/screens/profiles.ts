// Players on this device (GAME_DESIGN §10.1): a guest first; after the first pearl an optional name, lantern colour, level.
import { h } from '../core/h';
import { t } from '../core/copy';
import { btn, sheet } from '../core/ui';
import { lanternArt, charArt } from '../art';
import { LANTERNS, profile, save, S, switchProfile, addProfile, learnedCount, session, type Level } from '../core/store';
import { say } from '../core/voice';
import { go, type ScreenCtx } from '../core/router';
import { stripMarks } from '../core/arabic';

/** Easter egg: a player named Amin (Arabic or Latin, with or without marks). */
export const isAmin = (name: string) => /^(أمين|امين|آمين|amin|amine|ameen)$/i.test(stripMarks(name.trim()).replace(/\s+/g, ''));

export function profileEditor(onDone: () => void, o: { first?: boolean } = {}): HTMLElement {
  const p = profile();
  const name = h('input', { type: 'text', maxLength: 20, value: p.name, dir: 'auto', 'data-testid': 'name-input', 'aria-label': t('profile.name'), placeholder: t('profile.name'), autocomplete: 'off' }) as HTMLInputElement;
  const colors = h('div', { class: 'lantern-pick', role: 'radiogroup', 'aria-label': t('profile.lantern') },
    ...LANTERNS.map((c) => {
      const b = h('button', { type: 'button', class: 'lantern-choice' + (p.lantern === c ? ' on' : ''), role: 'radio', 'aria-checked': String(p.lantern === c), 'aria-label': t('profile.lantern.' + c), 'data-testid': 'lantern-' + c }, lanternArt(c));
      b.addEventListener('click', () => { p.lantern = c; colors.querySelectorAll('.lantern-choice').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); }); });
      return b;
    }));
  const levels = h('div', { class: 'level-pick', role: 'radiogroup' },
    ...(['easy', 'mid', 'strong'] as Level[]).map((l) => {
      const b = btn(t('profile.level.' + l), { cls: 'chip' + (p.level === l ? ' on' : ''), testid: 'level-' + l, onClick: () => { p.level = l; levels.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b)); } });
      return b;
    }));
  const ok = btn(t('profile.save'), { icon: 'check', primary: true, testid: 'profile-ok', onClick: async () => {
    p.name = name.value.trim().slice(0, 20); save();
    if (isAmin(p.name)) { document.documentElement.classList.add('amin-glow'); await say('profile.easter.amin'); await say('profile.easter.amin.laqlaq'); }
    onDone();
  } });
  return h('div', { class: 'profile-editor' }, o.first ? h('p', { class: 'ask-name' }, t('profile.askName')) : null,
    h('label', { class: 'field' }, h('span', null, t('profile.name')), name), h('div', { class: 'field' }, h('span', null, t('profile.lantern')), colors),
    h('div', { class: 'field' }, h('span', null, t('profile.level')), levels), h('div', { class: 'row' }, ok, o.first ? btn(t('profile.skip'), { testid: 'profile-later', onClick: onDone }) : null));
}

export function askNameSheet(): Promise<void> {
  return new Promise((resolve) => {
    let s: { close: () => void } | null = null;
    const done = () => { s?.close(); resolve(); };
    s = sheet(profileEditor(done, { first: true }), { testid: 'name-sheet', onClose: () => resolve() });
  });
}

/** Profile picker (shown at launch when 2+ players exist). */
export function profilesScreen(_ctx: ScreenCtx): HTMLElement {
  const st = S();
  return h('div', { class: 'page profiles' },
    h('h1', null, t('profile.who')),
    h('div', { class: 'profile-tiles' }, ...st.profiles.map((p) => {
      const b = h('button', { type: 'button', class: 'profile-tile', 'data-testid': 'profile-' + p.id }, lanternArt(p.lantern), h('span', { dir: 'auto' }, p.name || t('profile.guest')));
      b.addEventListener('click', () => { switchProfile(p.id); session.set('kq.picked', '1'); go('#/'); });
      return b;
    }), (() => { const b = h('button', { type: 'button', class: 'profile-tile new', 'data-testid': 'profile-new' }, charArt('amin', 'happy'), h('span', null, t('heroes.new'))); b.addEventListener('click', () => { addProfile(); session.set('kq.picked', '1'); go('#/'); }); return b; })()),
  );
}
export { learnedCount };
