// Splash (the tap unlocks audio) and the 6-panel intro story (GAME_DESIGN §2.6), skippable, auto-advancing with the voice.
import { h } from '../core/h';
import { t } from '../core/copy';
import { btn } from '../core/ui';
import { charArt, lanternArt, blotArt, sceneArt, pearlSvg, artImg } from '../art';
import { svg } from '../core/h';
import { unlockAudio, sfx } from '../core/sfx';
import { say } from '../core/voice';
import { profile, save, S, learnedCount, session } from '../core/store';
import { nextTarget, targetHash } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { isAbort, sleep } from '../core/env';
import { setActive } from '../games/engine';
import { setBubbleHost, stopVoice } from '../core/voice';

export let audioUnlocked = false;
export function afterSplash(): string {
  const p = profile();
  if (S().profiles.length > 1 && !session.get('kq.picked')) return '#/profiles';
  return p.seen.intro ? '#/' : '#/intro';
}

export function splashScreen(_ctx: ScreenCtx): HTMLElement {
  const start = btn(t('app.start'), { icon: 'play', primary: true, testid: 'btn-start', cls: 'big-btn', onClick: () => { unlockAudio(); audioUnlocked = true; session.set('kq.started', '1'); const after = session.get('kq.after'); session.del('kq.after'); go(after && after !== '#/splash' && profile().seen.intro ? after : afterSplash()); } });
  setActive({ right: () => start, wrong: () => null, label: 'splash' });
  return h('div', { class: 'splash', 'data-testid': 'splash' },
    h('div', { class: 'splash-bg' }, sceneArt('gate', 'sunset')),
    h('div', { class: 'splash-lantern' }, lanternArt('gold', true)),
    h('h1', { class: 'logo' }, h('span', { class: 'logo-title' }, t('app.title.logo')), h('span', { class: 'logo-sub' }, t('app.subtitle'))),
    start);
}

const PANELS: { art: () => Element; key: string }[] = [
  { key: 'intro.1', art: () => h('div', { class: 'panel-art' }, charArt('laqlaq', 'think'), h('div', { class: 'pearl-string' }, ...Array.from({ length: 7 }, () => svg(pearlSvg('s2'))))) },
  { key: 'intro.2', art: () => h('div', { class: 'panel-art glow-city' }, sceneArt('gate', 'deepnight'), h('div', { class: 'necklace-glow' }, ...Array.from({ length: 9 }, () => svg(pearlSvg('s3'))))) },
  { key: 'intro.3', art: () => h('div', { class: 'panel-art' }, blotArt('qallab', false), blotArt('manfoukh', false), blotArt('nasyan', false)) },
  { key: 'intro.4', art: () => h('div', { class: 'panel-art bat' }, charArt('mishmish', 'wow'), ...Array.from({ length: 4 }, () => svg(pearlSvg('s1')))) },
  { key: 'intro.5', art: () => h('div', { class: 'panel-art' }, charArt('amin', 'point', profile().lantern)) },
  { key: 'intro.6', art: () => h('div', { class: 'panel-art' }, sceneArt('gate', 'sunset'), h('div', { class: 'blink-pearl' }, svg(pearlSvg('open')))) },
];

/** First launch (§13.5: the first game within 60 s): the story is told in three panels — the necklace, the gang
 *  snapping its thread, Amin's promise — and goes on a panel at a time later, before verse 2 (what a pearl is) and
 *  before verse 4 (Mishmish batting the pearls). Panel 6 («the journey starts at the gate») is the gate's own title
 *  card in this telling. A story skipped is not continued; a player with pearls sees the whole story. */
const SHORT = [0, 2, 4];
const LATER: [number, number][] = [[1, 1], [3, 3]];   // [pearls on the necklace, panel]
export function storyBeat(): number | null {
  const p = profile();
  if (!p.seen.tips.includes('story.short')) return null;
  const at = LATER.find(([n, i]) => learnedCount() === n && !p.seen.tips.includes('story.' + i));
  return at ? at[1] : null;
}
/** One more panel of the story, full screen, voiced, with «أُكْمِلُ» (and a tap anywhere) to go on. */
export async function storyInterlude(i: number, signal: AbortSignal, host: HTMLElement | null): Promise<void> {
  const p = profile();
  p.seen.tips.push('story.' + i); save();
  const cap = h('p', { class: 'intro-caption bubble', 'data-testid': 'story-caption', 'aria-live': 'polite' });
  const go_ = btn(t('btn.continue'), { icon: 'next', primary: true, testid: 'btn-next' });
  const ov = h('div', { class: 'overlay story-beat', 'data-testid': 'story-beat' },
    h('div', { class: 'intro-panel in' }, artImg('intro.panel-' + (i + 1), 'intro-art', () => PANELS[i].art(), true) || PANELS[i].art()), cap, go_);
  document.body.appendChild(ov);
  go_.focus({ preventScroll: true });   // a full-screen beat: its one button takes the focus
  setBubbleHost(cap);
  sfx('swoosh');
  setActive({ right: () => go_, wrong: () => null, label: 'story' });
  const tapped = new Promise<void>((r) => ov.addEventListener('click', () => r(), { once: true }));
  const said = say(PANELS[i].key, { signal }).then(() => sleep(400, signal));
  said.catch(() => {});   // the losing side of the race may reject later (screen left): never unhandled
  try { await Promise.race([said, tapped]); }
  finally { stopVoice(); ov.remove(); setActive(null); setBubbleHost(host); }
}

export function introScreen(ctx: ScreenCtx): HTMLElement {
  let i = 0, done = false;
  const short = learnedCount() === 0 && !profile().seen.intro;
  const order = short ? SHORT : PANELS.map((_, k) => k);
  const panel = h('div', { class: 'intro-panel' });
  const cap = h('p', { class: 'intro-caption bubble', 'data-testid': 'intro-caption', 'aria-live': 'polite' });
  const foot = h('p', { class: 'intro-foot' });
  // first launch (§1.1): the story leads straight into verse 1; later viewings go home
  let skipped = false;
  const finish = () => {
    if (done) return; done = true;
    const p = profile(); p.seen.intro = true;
    if (short && !skipped) p.seen.tips.push('story.short');   // the story goes on later, a panel at a time
    save(); go(learnedCount() ? '#/' : targetHash(nextTarget()));
  };
  const skip = btn(t('intro.skip'), { icon: 'next', testid: 'btn-skip', small: true, onClick: () => { skipped = true; finish(); } });
  let advance: (() => void) | null = null;
  // one tap = the next panel (its voice stops); «skip all» stays visible at the top (Q1 round 2: a voiced intro ran past 60 s)
  const next = () => { stopVoice(); advance?.(); };
  const nextPanel = btn(t('btn.next'), { icon: 'next', primary: true, testid: 'btn-panel-next', cls: 'panel-next' });
  const root = h('div', { class: 'intro', 'data-testid': 'intro' }, panel, cap, foot, nextPanel, skip);
  root.addEventListener('click', (e) => { if (e.target !== skip && !skip.contains(e.target as Node)) next(); });
  setActive({ right: () => skip, wrong: () => null, label: 'intro' });
  setTimeout(async () => {
    setBubbleHost(cap);
    try {
      for (i = 0; i < order.length && !done; i++) {
        // R1's painted panel when the manifest has it (the SVG composition otherwise, or if the file fails)
        const k = order[i];
        panel.replaceChildren(artImg('intro.panel-' + (k + 1), 'intro-art', () => PANELS[k].art(), true) || PANELS[k].art());
        panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in');
        foot.textContent = k === 2 ? t('intro.lahn') : '';
        foot.hidden = k !== 2;
        sfx('swoosh');
        await Promise.race([say(PANELS[k].key, { signal: ctx.signal }), new Promise<void>((r) => { advance = r; })]);
        await sleep(250, ctx.signal);
      }
      finish();
    } catch (e) { if (!isAbort(e)) console.error(e); }
  }, 50);
  return root;
}
