// The map (GAME_DESIGN §8.2): one vertical scroll, ten district backdrops stacked from sunset (bottom) to dawn (top),
// a winding path of pearl nodes and a gate node per district; opens scrolled to the current node.
import { h, svg } from '../core/h';
import { t, tt, num } from '../core/copy';
import type { District } from '../core/data';
import { sceneArt, blotArt, charArt, lanternArt, pearlSvg, iconEl } from '../art';
import { profile, vs, isDue } from '../core/store';
import { P, versesOf, verseUnlocked, bossUnlocked, bossBeaten, districtUnlocked, nextTarget, targetHash, bossKey } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { iconBtn, btn } from '../core/ui';
import { sfx } from '../core/sfx';
import { cacheDistrict } from '../sw-client';
import { setActive } from '../games/engine';

const STEP = 92;   // px between nodes

export function mapScreen(ctx: ScreenCtx): HTMLElement {
  const poem = P();
  const tg = nextTarget();
  const currentN = tg.kind === 'verse' ? tg.n : null;
  const currentBoss = tg.kind === 'boss' ? bossKey(tg.d) : null;
  const scroller = h('div', { class: 'map-scroll', 'data-testid': 'map' });
  const rail = h('nav', { class: 'map-rail', 'aria-label': t('aria.rail') });
  const sections: HTMLElement[] = [];
  let currentEl: HTMLElement | null = null;
  const ds = poem.districts.slice().reverse();
  for (const d of ds) {
    const sec = districtSection(d, currentN, currentBoss);
    sections.push(sec.el);
    if (sec.current) currentEl = sec.current;
    scroller.appendChild(sec.el);
  }
  poem.districts.forEach((d, i) => {
    const b = h('button', { type: 'button', class: 'rail-dot' + (districtUnlocked(d) ? ' open' : '') + (bossBeaten(d) ? ' done' : ''), 'data-testid': 'rail-' + d.id, 'aria-label': t('aria.rail.item', { n: i + 1, district: t('district.' + d.skin + '.name') }) }, num(i + 1));
    b.addEventListener('click', () => { sfx('tap'); document.getElementById('d-' + d.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    rail.appendChild(b);
  });
  const today = btn(t('map.today'), { icon: 'pearl', primary: true, testid: 'map-today', cls: 'map-today', onClick: () => go(targetHash(tg)) });
  const root = h('div', { class: 'map' },
    h('header', { class: 'topbar map-top' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/'), 'back-btn'), h('div', { class: 'top-title' }, t('map.title')), iconBtn('home', 'btn.home', 'btn-home', () => go('#/'))),
    scroller, rail, today);
  setActive({ right: () => currentEl, wrong: () => null, label: 'map' });
  // download each district's clips when its header scrolls into view
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const id = (e.target as HTMLElement).dataset.district!; void cacheDistrict(poem.districts.find((x) => x.id === id)!); io.unobserve(e.target); } }), { root: scroller, rootMargin: '200px' });
    sections.forEach((s) => io.observe(s));
    ctx.signal.addEventListener('abort', () => io.disconnect(), { once: true });
  }
  requestAnimationFrame(() => {
    const target = currentEl || sections[sections.length - 1];
    target.scrollIntoView({ block: 'center' });
    if (!currentEl) scroller.scrollTop = scroller.scrollHeight;
  });
  return root;
}

function districtSection(d: District, currentN: number | null, currentBoss: string | null): { el: HTMLElement; current: HTMLElement | null } {
  const vv = versesOf(d);
  const nodes = vv.length + 1;
  const height = nodes * STEP + 150;
  const xs = (k: number) => 50 + Math.sin(k * 1.1 + d.from) * 26;   // % from the inline start
  const pts: string[] = [];
  const nodeEls: HTMLElement[] = [];
  let current: HTMLElement | null = null;
  // bottom = first verse; gate on top
  vv.forEach((v, k) => {
    const y = height - 70 - k * STEP;
    const x = xs(k);
    pts.push(`${100 - x},${y}`);
    const st = vs(v.n);
    const unlocked = verseUnlocked(v.n);
    const state = !unlocked ? 'locked' : !st ? 'open' : st.stars >= 3 ? 's3' : st.stars === 2 ? 's2' : 's1';
    const dusty = isDue(v.n);
    const node = h('button', {
      type: 'button', class: `node pearl-node ${state}${dusty ? ' dusty' : ''}${v.n === currentN ? ' current' : ''}`, 'data-testid': 'pearl-' + v.n, 'data-state': state,
      style: { insetInlineStart: `calc(${x}% - 30px)`, top: y - 30 + 'px' }, 'aria-label': t(state === 'locked' ? 'aria.pearl.locked' : state === 'open' ? 'aria.pearl.open' : dusty ? 'aria.pearl.dusty' : 'aria.pearl.stars', { n: v.n, s: st?.stars || 0 }),
    }, svg(pearlSvg(state as 'locked', dusty)), h('span', { class: 'node-n' }, num(v.n)), dusty ? h('span', { class: 'dust-mark', title: t('map.dusty') }, iconEl('cloth')) : null);
    node.addEventListener('click', () => {
      if (!unlocked) { sfx('lock'); node.classList.remove('wobble'); void node.offsetWidth; node.classList.add('wobble'); return; }
      sfx('tap'); go('#/verse/' + v.n);
    });
    if (v.n === currentN) current = node;
    nodeEls.push(node);
  });
  // gate node
  const gy = height - 70 - vv.length * STEP;
  const gx = xs(vv.length);
  pts.push(`${100 - gx},${gy}`);
  const bk = bossKey(d);
  const beaten = bossBeaten(d);
  const open = bossUnlocked(d);
  const gate = h('button', {
    type: 'button', class: `node gate-node${beaten ? ' beaten' : open ? ' open' : ' locked'}${bk === currentBoss ? ' current' : ''}`, 'data-testid': 'boss-gate-' + bk,
    style: { insetInlineStart: `calc(${gx}% - 44px)`, top: gy - 44 + 'px' }, 'aria-label': t('aria.gate', { boss: d.boss ? t('boss.' + d.boss + '.name') : t('boss.quiz.title') }),
  }, d.boss ? blotArt(d.boss, beaten) : lanternArt('gold', beaten), beaten ? h('span', { class: 'gate-lantern' }, lanternArt('gold', true)) : null);
  gate.addEventListener('click', () => { if (!open) { sfx('lock'); gate.classList.remove('wobble'); void gate.offsetWidth; gate.classList.add('wobble'); return; } sfx('tap'); go('#/boss/' + bk); });
  if (bk === currentBoss) current = gate;
  const path = svg(`<svg class="map-path" viewBox="0 0 100 ${height}" preserveAspectRatio="none"><polyline points="${pts.map((p) => { const [x, y] = p.split(','); return `${x},${y}`; }).join(' ')}" fill="none" stroke="#fff3d0" stroke-width="2.2" stroke-dasharray="1 5" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`);
  const header = h('div', { class: 'district-head', 'data-testid': 'district-' + d.id },
    h('h2', null, t('district.' + d.skin + '.name')),
    h('p', { class: 'district-range' }, t('map.district.range', { from: d.from, to: d.to })),
    h('p', { class: 'district-section' }, t('map.district.section', { titles: d.sections.map((s) => s.title).join(tt('map.district.section.sep') || ' · ') })));
  const el = h('section', { class: 'district', id: 'd-' + d.id, 'data-district': d.id, 'data-sky': d.sky, style: { height: height + 'px' } },
    h('div', { class: 'district-bg' }, sceneArt(d.skin, d.sky)), path, header, ...nodeEls, gate);
  if (current) {
    const here = h('div', { class: 'here', 'aria-hidden': 'true' }, charArt('amin', 'point', profile().lantern), h('span', { class: 'here-lantern' }, lanternArt(profile().lantern)));
    (current as HTMLElement).appendChild(here);
  }
  return { el, current };
}
