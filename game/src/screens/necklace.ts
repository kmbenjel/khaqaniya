// The necklace (GAME_DESIGN §4.10, §8.2): every pearl grouped by district; listen to all learned verses in the
// reciter's voice (loop, sleep timer, Media Session); a verse sheet per pearl; links to the poem site.
import { h, svg } from '../core/h';
import { t, num } from '../core/copy';
import type { Verse } from '../core/data';
import { pearlSvg } from '../art';
import { btn, iconBtn, sheet, verseCard, stars } from '../core/ui';
import { learned, vs, isDue, learnedCount, award, profile, save } from '../core/store';
import { P, verseUnlocked, versesOf } from '../core/progress';
import { play, stop, setMediaControls } from '../core/audio';
import { go, type ScreenCtx } from '../core/router';
import { sfx } from '../core/sfx';
import { isAbort } from '../core/env';
import { say } from '../core/voice';

export function necklaceScreen(ctx: ScreenCtx): HTMLElement {
  const poem = P();
  let playing = false, loop = false, sleepAt = 0, sleepTimer = 0;
  const pearls = new Map<number, HTMLElement>();
  const nowText = h('div', { class: 'now-playing', 'data-testid': 'now-playing', 'aria-live': 'polite' });
  const playBtn = btn(t('necklace.playAll'), { icon: 'play', primary: true, testid: 'btn-play-all', onClick: () => (playing ? stopAll() : void playAll()) });
  const loopBtn = btn(t('necklace.loop'), { icon: 'loop', small: true, testid: 'btn-loop', cls: 'toggle-btn', onClick: () => { loop = !loop; loopBtn.classList.toggle('on', loop); loopBtn.setAttribute('aria-pressed', String(loop)); } });
  loopBtn.setAttribute('aria-pressed', 'false');
  const sleepSel = h('select', { class: 'sleep-sel', 'data-testid': 'sleep', 'aria-label': t('necklace.sleep'), onchange: (e: Event) => {
    const m = Number((e.target as HTMLSelectElement).value);
    clearTimeout(sleepTimer);
    sleepAt = m ? Date.now() + m * 60000 : 0;
    if (m) sleepTimer = window.setTimeout(() => stopAll(), m * 60000);
  } }, h('option', { value: '0' }, t('necklace.sleep.off')), ...[5, 10, 15].map((m) => h('option', { value: String(m) }, t('necklace.sleep.' + m))));
  const ctl = new AbortController();
  ctx.signal.addEventListener('abort', () => { ctl.abort(); clearTimeout(sleepTimer); }, { once: true });
  let runId = 0;
  // the run is over (the UI only): the clip that cut it, if any, goes on
  const ended = () => { runId++; playing = false; playBtn.querySelector('.btn-label')!.textContent = t('necklace.playAll'); document.querySelectorAll('.pearl-btn.playing').forEach((e) => e.classList.remove('playing')); nowText.textContent = ''; };
  const stopAll = () => { ended(); stop(); };
  async function playAll(from = 0) {
    const list = poem.verses.filter((v) => learned(v.n));
    if (!list.length) { nowText.textContent = t('necklace.empty'); return; }
    const my = ++runId;
    playing = true;
    playBtn.querySelector('.btn-label')!.textContent = t('necklace.stop');
    let heard = 0;
    do {
      for (let i = from; i < list.length; i++) {
        if (my !== runId || (sleepAt && Date.now() > sleepAt)) return;
        const v = list[i];
        const el = pearls.get(v.n);
        document.querySelectorAll('.pearl-btn.playing').forEach((e) => e.classList.remove('playing'));
        el?.classList.add('playing');
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        nowText.replaceChildren(verseCard(v, { cls: 'now-card' }));
        // background: the one clip that keeps playing with the screen off (§4.10); cut by anything else → the run ends
        let whole = true;
        try { whole = await play(v, 'verse', ctl.signal, { background: true }); } catch (e) { if (isAbort(e)) return; }
        if (my !== runId) return;
        if (!whole) { ended(); return; }
        heard++;
        if (heard >= poem.verses.length) { if (award('wholeListen')) { sfx('sparkle'); void say('necklace.listenDone'); } }
      }
      from = 0;
    } while (loop && my === runId);
    if (my === runId) stopAll();
  }
  // the lock screen's / headset's «play» with nothing paused starts listening (audio.ts owns the Media Session handlers:
  // «pause» holds the verse, «play» goes on, «stop» stops); leaving the necklace, it does nothing again
  setMediaControls({ play: () => { if (!playing) void playAll(); } });
  ctx.signal.addEventListener('abort', () => setMediaControls(null), { once: true });
  const thread = h('div', { class: 'necklace-thread', 'data-testid': 'necklace-thread' });
  for (const d of poem.districts) {
    const group = h('div', { class: 'pearl-group' }, h('h3', null, t('district.' + d.skin + '.name')));
    const row = h('div', { class: 'pearl-row' });
    for (const v of versesOf(d)) {
      const st = vs(v.n);
      const state = !st ? (verseUnlocked(v.n) ? 'open' : 'locked') : st.stars >= 3 ? 's3' : st.stars === 2 ? 's2' : 's1';
      const b = h('button', { type: 'button', class: 'pearl-btn ' + state, 'data-testid': 'pearl-' + v.n, 'aria-label': t('aria.pearl', { n: v.n }) }, svg(pearlSvg(state as 's1', isDue(v.n))), h('span', { class: 'node-n' }, num(v.n)));
      b.addEventListener('click', () => { sfx('tap'); verseSheet(v); });
      pearls.set(v.n, b);
      row.appendChild(b);
    }
    group.appendChild(row);
    thread.appendChild(group);
  }
  const root = h('div', { class: 'page necklace', 'data-testid': 'necklace' },
    h('header', { class: 'topbar' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/'), 'back-btn'), h('div', { class: 'top-title' }, t('necklace.title')), h('span', { class: 'hud-n' }, t('necklace.count', { n: learnedCount(), total: poem.verses.length }))),
    h('div', { class: 'play-bar' }, playBtn, loopBtn, sleepSel), nowText, thread,
    h('a', { class: 'read-link', href: './qasida/', 'data-testid': 'read-poem' }, t('necklace.read')));
  if (ctx.query.get('play') === '1') setTimeout(() => void playAll(), 300);
  void profile; void save; void stars;
  return root;
}

export function verseSheet(v: Verse) {
  const st = vs(v.n);
  const unlocked = verseUnlocked(v.n);
  const ctl = new AbortController();
  const body = h('div', { class: 'verse-sheet' },
    unlocked || st ? verseCard(v, { cls: 'sheet-card' }) : h('p', { class: 'locked-note' }, t('necklace.locked')),
    st ? stars(st.stars) : null,
    unlocked && v.meaning?.kid ? h('p', { class: 'kid-meaning small' }, v.meaning.kid) : null,
    h('div', { class: 'row' },
      unlocked || st ? btn(t('necklace.sheet.play'), { icon: 'ear', testid: 'sheet-play', onClick: () => void play(v, 'verse', ctl.signal).catch(() => {}) }) : null,
      unlocked ? btn(t('necklace.sheet.replay'), { icon: 'pearl', primary: true, testid: 'sheet-level', onClick: () => { s.close(); go('#/verse/' + v.n); } }) : null,
      h('a', { class: 'btn btn-small', href: './qasida/#b' + v.n, 'data-testid': 'sheet-read' }, t('necklace.read'))));
  // closing stops this sheet's own clip only (not «listen to all»)
  const s = sheet(body, { testid: 'verse-sheet', title: t('necklace.sheet.verse', { n: v.n }), onClose: () => ctl.abort() });
}
