// Home (GAME_DESIGN §4.1, §8.2): one big button (next pearl / polish), the polish card, four doors, journey days.
import { h } from '../core/h';
import { t, num, has } from '../core/copy';
import { btn, castbar, lanternRow, iconBtn } from '../core/ui';
import { charArt, lanternArt, iconEl } from '../art';
import { profile, save, settings, learnedCount, lastSevenLamps, daysAway, newToday, award, storageOk } from '../core/store';
import { P, dueVerses, nextTarget, targetHash, checkStickers } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { say, sayPick } from '../core/voice';
import { mulberry32, hash } from '../core/rng';
import { sfx } from '../core/sfx';
import { env } from '../core/env';
import { setActive } from '../games/engine';
import { isAmin } from './profiles';

export function homeScreen(ctx: ScreenCtx): HTMLElement {
  const poem = P();
  const pr = profile();
  const rng = mulberry32(hash(env.seed ?? pr.seed, 'home', pr.days.length, learnedCount()));
  const due = dueVerses();
  const tg = nextTarget();
  const enough = settings().dailyNew > 0 && newToday() >= settings().dailyNew && tg.kind === 'verse';
  const nextLabel = tg.kind === 'boss' ? 'map.gate' : tg.kind === 'finale' ? 'map.gate' : tg.kind === 'done' ? 'home.necklace' : learnedCount() ? 'home.continue' : 'home.next';
  const goNext = () => go(targetHash(tg));
  const polishBig = due.length >= 3;
  let big: HTMLButtonElement;
  const small: HTMLElement[] = [];
  if (polishBig) {
    big = btn(t('home.polish'), { icon: 'cloth', primary: true, testid: 'btn-polish', cls: 'big-btn', onClick: () => go('#/polish') });
    small.push(btn(t(nextLabel), { icon: 'pearl', testid: 'btn-continue', onClick: goNext }));
  } else if (enough) {
    big = btn(t('home.listenNecklace'), { icon: 'necklace', primary: true, testid: 'btn-listen', cls: 'big-btn', onClick: () => go('#/necklace?play=1') });
    small.push(btn(t(nextLabel), { icon: 'pearl', testid: 'btn-continue', onClick: goNext }));
  } else {
    big = btn(t(nextLabel), { icon: 'pearl', primary: true, testid: 'btn-continue', cls: 'big-btn', onClick: goNext });
  }
  const polishCard = due.length && !polishBig
    ? h('button', { type: 'button', class: 'polish-card', 'data-testid': 'polish-card', onclick: () => { sfx('tap'); go('#/polish'); } }, iconEl('cloth'), h('span', null, t('home.polish.count', { n: due.length })))
    : null;
  const doors = h('nav', { class: 'doors' },
    door('map', 'home.map', '#/map'), door('necklace', 'home.necklace', '#/necklace'),
    door('stickers', 'home.stickers', '#/stickers'), door('heroes', 'home.heroes', '#/heroes'));
  const lamps = lastSevenLamps();
  const days = h('div', { class: 'days', 'data-testid': 'days' },
    h('span', { class: 'days-title' }, t('days.title', { n: pr.days.length })),
    h('div', { class: 'lamps', role: 'img', 'aria-label': t('aria.days', { n: lamps.filter(Boolean).length }) }, ...lamps.map((on, i) => h('span', { class: 'lamp' + (on ? ' on' : '') + (i === 0 ? ' today' : '') }, lanternArt(pr.lantern, on)))));
  let taps = 0;
  const mish = h('button', { type: 'button', class: 'home-mishmish', 'data-testid': 'home-mishmish', 'aria-label': t('aria.mishmish') }, charArt('mishmish', 'sleep'));
  mish.addEventListener('click', () => {
    taps++; sfx('pop');
    mish.replaceChildren(charArt('mishmish', taps % 2 ? 'wow' : 'happy'));
    if (taps === 10) { if (award('sardine')) { sfx('sparkle'); void say('reward.newSticker'); } pr.sardineTaps = 10; save(); }
    else void sayPick('mishmish.tap', rng);
    setTimeout(() => mish.replaceChildren(charArt('mishmish', 'sleep')), 1600 / env.speed);
  });
  save();   // a write now tells whether progress can be kept on this device
  const storageWarn = storageOk() ? null : h('p', { class: 'storage-warn', role: 'status', 'data-testid': 'storage-warn' }, t('error.storage.kid'));
  const cb = castbar({ mishmish: false, amin: false });   // Amin and Mishmish are already big on the home screen
  const root = h('div', { class: 'home', 'data-testid': 'home' },
    h('header', { class: 'home-top' },
      h('div', { class: 'logo' }, h('span', { class: 'logo-title' }, t('app.title.logo')), h('span', { class: 'logo-sub' }, t('app.subtitle'))),
      h('div', { class: 'home-hud' }, h('span', { class: 'hud-necklace static' }, iconEl('necklace'), h('span', { class: 'hud-n' }, num(learnedCount()), ' / ', num(poem.verses.length))))),
    h('div', { class: 'home-main' },
      h('div', { class: 'home-hero' }, charArt('amin', 'happy', pr.lantern), mish),
      storageWarn, big, ...small, polishCard, doors, days,
      h('div', { class: 'home-small' },
        iconBtn('gear', 'home.grownups', 'btn-grownups', () => go('#/grownups')),
        h('button', { type: 'button', class: 'heart-lantern', 'data-testid': 'btn-dedication', 'aria-label': t('aria.dedication'), onclick: () => { sfx('tap'); go('#/dedication'); } }, iconEl('heart')),
        iconBtn('info', 'about.title', 'btn-about', () => go('#/about')),
        S_players())),
    cb.el);
  setActive({ right: () => big, wrong: () => null, label: 'home' });
  setTimeout(async () => {
    try {
      if (!pr.seen.cast) {
        pr.seen.cast = true; save();
        for (const k of ['char.amin.hello', 'char.amin.meetMishmish', 'char.amin.meetLaqlaq', 'char.laqlaq.hello']) await say(k, { signal: ctx.signal });
        ['amin', 'mishmish', 'laqlaq'].forEach(award);
      } else if (daysAway() >= 3) await say('home.comeback', { signal: ctx.signal });
      else if (isAmin(pr.name)) await say('profile.easter.amin', { signal: ctx.signal });
      else if (enough) await say('home.enough', { signal: ctx.signal });
      else if (tg.kind === 'done') await say('home.allDone', { signal: ctx.signal });
      else await sayPick('home.greet', rng, { signal: ctx.signal });
      checkStickers();
    } catch { /* left the screen */ }
  }, 50);
  void has;
  return root;
}

function door(iconId: string, key: string, hash_: string) {
  return h('button', { type: 'button', class: 'door', 'data-testid': 'door-' + iconId, onclick: () => { sfx('tap'); go(hash_); } }, iconEl(iconId), h('span', null, t(key)));
}
function S_players() {
  return iconBtn('user', 'aria.player', 'btn-players', () => go('#/profiles'));
}
export { lanternRow };
