// Polishing = spaced review (GAME_DESIGN §4.9): up to 6 due pearls, one task each chosen by the verse's rung;
// a pass moves the pearl up a box, a "not yet" moves it down; stars and pearls are never taken away.
import { h, svg } from '../core/h';
import { t } from '../core/copy';
import { hash, mulberry32 } from '../core/rng';
import { frame, btn } from '../core/ui';
import { pearlSvg } from '../art';
import { sfx } from '../core/sfx';
import { say } from '../core/voice';
import { env, emit, isAbort, sleep } from '../core/env';
import { profile, save, vs, polishResult, markDay, today } from '../core/store';
import { P, dueVerses, checkStickers } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { Round, params, setActive, type GameCtx } from '../games/engine';
import { g1, g3, g6, g7, g9 } from '../games/games';
import { play } from '../core/audio';
import { pauseMenu } from './grownups';

let polishState: { n: number; i: number; total: number } | null = null;
export const getPolishState = () => polishState;

export function polishScreen(ctx: ScreenCtx): HTMLElement {
  polishState = null;
  const poem = P();
  const f = frame(poem, { back: () => pauseMenu(() => go('#/')), dots: false, title: t('polish.title'), cls: 'polish' });
  f.root.setAttribute('data-testid', 'polish');
  setTimeout(() => void run(f, ctx.signal).catch((e) => { if (!isAbort(e)) console.error(e); }), 0);
  return f.root;
}

async function run(f: ReturnType<typeof frame>, signal: AbortSignal) {
  const poem = P();
  const pr = profile();
  const due = dueVerses().slice(0, 6);
  const rng = mulberry32(hash(env.seed ?? pr.seed, 'polish', today(), pr.polish.sessions));
  const tray = h('div', { class: 'dust-tray', 'data-testid': 'dust-tray' }, ...due.map((n) => h('span', { class: 'tray-pearl', 'data-n': n }, svg(pearlSvg('s1', true)))));
  f.root.querySelector('.play-pane')!.prepend(tray);
  if (!due.length) {
    f.prompt.replaceChildren(h('p', { class: 'empty' }, t('polish.none')));
    f.play.replaceChildren(btn(t('btn.home'), { icon: 'home', primary: true, testid: 'btn-next', onClick: () => go('#/') }));
    return;
  }
  await say('polish.start', { signal, who: 'laqlaq' });
  if (rng() < 0.5) void say('polish.mishmish', { signal }).catch(() => {});
  // one chain question when 3+ due verses are consecutive in the poem
  const sorted = due.slice().sort((a, b) => a - b);
  let run3: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const r = [sorted[i]];
    while (sorted.includes(r[r.length - 1] + 1)) r.push(r[r.length - 1] + 1);
    if (r.length >= 3 && r.length > run3.length) run3 = r;
  }
  for (let i = 0; i < due.length; i++) {
    const n = due[i];
    const v = poem.verses.find((x) => x.n === n)!;
    polishState = { n, i, total: due.length };
    emit('kq:step', { polish: n, i });
    tray.querySelector(`[data-n="${n}"]`)?.classList.add('now');
    f.reset();
    const round = new Round();
    const gctx: GameCtx = { poem, verse: v, frame: f, rng, signal, mode: 'polish', p: params(n), round };
    const rung = vs(n)?.rung || 1;
    let pass: boolean;
    if (rung >= 5) { const s = await g7(gctx, { firstWord: false }); pass = s >= 2; }
    else {
      if (rung <= 1) await g1({ ...gctx, rung: 2 });
      else if (rung === 2) await g3(gctx, 2);
      else if (rung === 3) await g6(gctx, 2);
      else await g6(gctx, 3);
      pass = round.wrongs <= 1 && round.helps <= 1;
    }
    polishResult(n, pass);
    const tp = tray.querySelector(`[data-n="${n}"]`);
    if (pass) {
      sfx('sparkle');
      tp?.replaceChildren(svg(pearlSvg(vs(n)!.stars >= 3 ? 's3' : vs(n)!.stars === 2 ? 's2' : 's1')));
      tp?.classList.add('shiny');
      await say('polish.shiny', { signal });
    } else {
      await play(v, 'verse', signal).catch(() => {});
      await say('polish.later', { signal });
    }
    tp?.classList.remove('now');
    await sleep(300, signal);
  }
  if (run3.length >= 3) {
    f.reset();
    const v = poem.verses.find((x) => x.n === run3[0])!;
    await g9({ poem, verse: v, frame: f, rng, signal, mode: 'polish', p: params(v.n), round: new Round() }, run3.slice(0, 5).map((n) => poem.verses.find((x) => x.n === n)!));
  }
  pr.polish.sessions++; pr.polish.last = today();
  markDay(); save();
  checkStickers();
  polishState = null;
  f.reset();
  f.ear.hidden = true; f.help.hidden = true;
  f.prompt.replaceChildren(h('div', { class: 'polish-done', 'data-testid': 'polish-done' }, ...due.map((n) => h('span', { class: 'tray-pearl shiny' }, svg(pearlSvg(vs(n)!.stars >= 3 ? 's3' : vs(n)!.stars === 2 ? 's2' : 's1'))))));
  await say('polish.done', { signal });
  const more = dueVerses().length;
  const row = h('div', { class: 'reward-btns' });
  if (more) {
    void say('polish.moreAsk', { signal }).catch(() => {});
    row.append(btn(t('polish.more'), { icon: 'cloth', primary: true, testid: 'btn-polish-more', onClick: () => go('#/polish?r=' + Date.now()) }), btn(t('polish.enough'), { icon: 'home', testid: 'btn-next', onClick: () => go('#/') }));
  } else row.append(btn(t('btn.home'), { icon: 'home', primary: true, testid: 'btn-next', onClick: () => go('#/') }));
  f.play.replaceChildren(row);
  setActive({ right: () => row.querySelector('[data-testid=btn-next]'), wrong: () => null, label: 'polish-done' });
}
