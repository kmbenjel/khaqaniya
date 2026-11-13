// Finale (GAME_DESIGN §5.5–5.7): dawn and the necklace closing, the prayer (sincere: no joke, no effect, no motion,
// no synthetic voice), «وسام أمين», the printable certificate, share cards, the dedication.
import { h, svg } from '../core/h';
import { t, tt, family, num, has } from '../core/copy';
import type { District } from '../core/data';
import { btn, iconBtn } from '../core/ui';
import { medalSvg, blotArt, lanternArt, charArt, sceneArt, artImg, artFile } from '../art';
import { skyOnly } from '../art/scenes';
import { sfx } from '../core/sfx';
import { say } from '../core/voice';
import { stop } from '../core/audio';
import { env, emit, isAbort, sleep } from '../core/env';
import { profile, save, today, starsTotal, learnedCount, award } from '../core/store';
import { P, checkStickers } from '../core/progress';
import { go, type ScreenCtx } from '../core/router';
import { setActive } from '../games/engine';

export function finaleScreen(ctx: ScreenCtx): HTMLElement {
  const poem = P();
  const lanterns = h('div', { class: 'finale-lanterns' }, ...poem.districts.map((d) => h('span', { class: 'fl', 'data-d': d.id }, lanternArt('gold', false))));
  const gang = h('div', { class: 'finale-gang' }, ...poem.districts.filter((d) => d.boss).map((d) => h('span', { class: 'fg' }, blotArt(d.boss!, true))));
  const thread = h('div', { class: 'finale-thread' }, ...poem.verses.map(() => h('span', { class: 'fp' })));
  const caption = h('p', { class: 'finale-caption', 'data-testid': 'finale-caption', 'aria-live': 'polite' });
  const skip = btn(t('btn.continue'), { icon: 'next', small: true, testid: 'btn-skip', onClick: () => goPrayer() });
  const root = h('div', { class: 'finale', 'data-testid': 'finale' },
    h('div', { class: 'finale-sky night' }, h('div', { class: 'sky-a' }, svg(skyOnly('latenight'))), h('div', { class: 'sky-b' }, svg(skyOnly('dawn')))),
    h('div', { class: 'finale-stage' }, thread, lanterns, gang, h('div', { class: 'finale-cast' }, charArt('amin', 'happy', profile().lantern), charArt('mishmish', 'happy'), charArt('laqlaq', 'happy')), caption), skip);
  let left = false;
  const goPrayer = () => { if (left) return; left = true; go('#/prayer'); };
  setActive({ right: () => skip, wrong: () => null, label: 'finale' });
  emit('kq:step', { finale: 'dawn' });
  setTimeout(async () => {
    try {
      root.querySelector('.finale-sky')!.classList.replace('night', 'day');
      await sleep(1200, ctx.signal);
      thread.classList.add('closing'); sfx('swoosh');
      await sleep(900, ctx.signal);
      for (const el of lanterns.querySelectorAll('.fl')) { el.replaceChildren(lanternArt('gold', true)); el.classList.add('lit'); sfx('pop'); await sleep(260, ctx.signal); }
      sfx('sparkle');
      gang.classList.add('cheer');
      caption.textContent = t('boss.thanks');
      await say('boss.thanks', { signal: ctx.signal });
      for (const k of ['finale.amin.thanks', 'finale.dawn', 'finale.heart']) { caption.textContent = t(k); await say(k, { signal: ctx.signal }); }
      caption.textContent = t('finale.dua.intro');
      await say('finale.dua.intro', { signal: ctx.signal, who: 'laqlaq' });
      goPrayer();
    } catch (e) { if (!isAbort(e)) console.error(e); }
  }, 100);
  return root;
}

/** The prayer: a still, quiet screen. Nothing moves, nothing sounds. */
export function prayerScreen(_ctx: ScreenCtx): HTMLElement {
  stop();
  const amen = h('button', { type: 'button', class: 'btn btn-primary amen', 'data-testid': 'btn-amen' }, t('finale.dua.amen'));
  amen.addEventListener('click', () => {
    const pr = profile();
    if (!pr.medal.date) { pr.medal.date = today(); save(); award('medal'); checkStickers(); }
    go('#/medal');
  });
  setActive({ right: () => amen, wrong: () => null, label: 'prayer' });
  emit('kq:step', { finale: 'prayer' });
  return h('div', { class: 'prayer', 'data-testid': 'prayer', 'data-still': '1' }, h('p', { class: 'dua-text', 'data-testid': 'dua-text' }, t('finale.dua.text')), amen);
}

export function medalScreen(ctx: ScreenCtx): HTMLElement {
  const pr = profile();
  if (!pr.medal.date && !env.capture) { setTimeout(() => go('#/map', true)); return h('div'); }
  const medal = h('div', { class: 'medal spin-in', 'data-testid': 'medal' }, artImg('medal', 'medal-art', () => svg(medalSvg()), true) || svg(medalSvg()), h('span', { class: 'medal-name' }, t('app.title.logo')));
  const root = h('div', { class: 'page medal-page' },
    h('div', { class: 'medal-bg' }, sceneArt('hill', 'dawn')),
    medal, h('p', { class: 'medal-line' }, t('finale.medal')),
    h('div', { class: 'row wrap' },
      btn(t('btn.print'), { icon: 'print', testid: 'btn-print', onClick: () => go('#/cert') }),
      btn(t('btn.share'), { icon: 'share', testid: 'btn-share', onClick: () => void shareCard('final') }),
      btn(t('btn.saveImage'), { icon: 'save', testid: 'btn-save-image', onClick: () => void shareCard('final', undefined, true) }),
      btn(t('finale.toDedication'), { icon: 'heart', primary: true, testid: 'btn-next', onClick: () => go('#/dedication') })));
  sfx('sparkle');
  setTimeout(() => void say('finale.mishmish', { signal: ctx.signal, who: 'mishmish' }).catch(() => {}), 1200 / env.speed);
  setActive({ right: () => root.querySelector('[data-testid=btn-next]'), wrong: () => null, label: 'medal' });
  return root;
}

export function dedicationScreen(_ctx: ScreenCtx): HTMLElement {
  const lines = family('dedication.line');
  const body = lines.length ? lines : [1, 2, 3, 4, 5].map((i) => 'dedication.' + i).filter(has);
  const from = tt('dedication.from');
  const root = h('div', { class: 'page dedication', 'data-testid': 'dedication' },
    h('header', { class: 'topbar' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/'), 'back-btn'), h('div', { class: 'top-title' })),
    h('div', { class: 'dedication-paper' }, lanternArt('gold', true), h('h1', null, t('dedication.title')),
      ...(body.length ? body : ['dedication.1']).map((k) => h('p', null, t(k))), from ? h('p', { class: 'from' }, from) : null),
    profile().medal.date ? btn(t('btn.map'), { icon: 'map', primary: true, testid: 'btn-next', onClick: () => { go('#/map'); setTimeout(() => void say('finale.keep'), 600); } }) : btn(t('dedication.back'), { icon: 'home', primary: true, testid: 'btn-next', onClick: () => go('#/') }));
  setActive({ right: () => root.querySelector('[data-testid=btn-next]'), wrong: () => null, label: 'dedication' });
  return root;
}

const fmt = (cal: string) => { try { return new Intl.DateTimeFormat(cal, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch { return new Date().toISOString().slice(0, 10); } };
export function certScreen(_ctx: ScreenCtx): HTMLElement {
  const poem = P();
  const pr = profile();
  const name = h('input', { type: 'text', maxLength: 30, dir: 'auto', value: pr.medal.certName || pr.name, 'data-testid': 'cert-name', 'aria-label': t('cert.name.ask') }) as HTMLInputElement;
  const nameOut = h('span', { class: 'cert-name', dir: 'auto' }, name.value);
  name.addEventListener('input', () => { nameOut.textContent = name.value; pr.medal.certName = name.value.trim(); save(); });
  const paper = h('article', { class: 'cert', 'data-testid': 'cert' },
    h('div', { class: 'cert-medal' }, artImg('medal', 'medal-art', () => svg(medalSvg()), true) || svg(medalSvg())),
    h('h1', null, t('cert.title')), h('p', { class: 'cert-sub' }, t('cert.subtitle')),
    h('p', { class: 'cert-to' }, t('cert.grantedTo'), ' ', nameOut),
    h('p', null, t('cert.reason')),
    h('p', { class: 'cert-poem' }, poem.fullTitle), h('p', { class: 'cert-author' }, t('cert.author'), ' ', poem.author),
    h('p', { class: 'cert-facts' }, t('cert.verses', { n: learnedCount() }), ' · ', t('cert.stars', { n: starsTotal(), total: poem.verses.length * 3 })),
    h('p', { class: 'cert-date' }, t('cert.date', { hijri: fmt('ar-u-ca-islamic-umalqura-nu-latn'), gregorian: fmt('ar-u-nu-latn') })),
    h('p', { class: 'cert-named' }, t('cert.named')),
    h('div', { class: 'cert-sign' }, h('span', null, t('cert.sign')), h('span', { class: 'sign-line' })),
    h('p', { class: 'cert-game' }, t('app.title'), ' · ', P().build.base.replace(/^https?:\/\//, '')));
  return h('div', { class: 'page cert-page' },
    h('header', { class: 'topbar no-print' }, iconBtn('back', 'aria.back', 'btn-back', () => go('#/medal'), 'back-btn'), h('div', { class: 'top-title' }, t('cert.title'))),
    h('label', { class: 'field no-print' }, h('span', null, t('cert.name.ask')), name, h('small', null, t('cert.name.local'))),
    h('p', { class: 'no-print note' }, t('cert.print.hint')),
    h('div', { class: 'row no-print' }, btn(t('btn.print'), { icon: 'print', primary: true, testid: 'btn-print-now', onClick: () => window.print() })), paper);
}

/** Share card (canvas → PNG). Never the child's name unless typed for the certificate and ticked. */
export async function shareCard(kind: 'final' | 'district', d?: District, download = false, tall = false): Promise<Blob | null> {
  const W = 1080, H = tall ? 1920 : 1350;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); if (!g) return null;
  await document.fonts?.ready;
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#f2a99b'); grd.addColorStop(0.55, '#f9d29b'); grd.addColorStop(1, '#fff1d0');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // R1's painted background (a dawn sky with a pale disc for the medal) and medal, when present
  const bg = await loadImage(artFile(tall ? 'share.final-9x16' : 'share.final-4x5'));
  if (bg) { const r = Math.max(W / bg.naturalWidth, H / bg.naturalHeight); g.drawImage(bg, (W - bg.naturalWidth * r) / 2, (H - bg.naturalHeight * r) / 2, bg.naturalWidth * r, bg.naturalHeight * r); }
  const painted = kind === 'final' ? await loadImage(artFile('medal')) : null;
  const img = painted || (await svgToImage(kind === 'final' ? medalSvg() : lanternSvgString()));
  if (img) { const w = painted ? 560 : 520, hh = painted ? 560 : 624; g.drawImage(img, W / 2 - w / 2, H * 0.1, w, hh); }
  if (bg) { g.fillStyle = 'rgba(255,248,232,.82)'; if (g.roundRect) { g.beginPath(); g.roundRect(70, H * 0.6, W - 140, H * 0.34, 40); g.fill(); } else g.fillRect(70, H * 0.6, W - 140, H * 0.34); }
  g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = '#3b2418';
  g.font = '700 84px Amiri, serif';
  g.fillText(kind === 'final' ? t('share.final.title') : t('share.district', { district: d ? t('district.' + d.skin + '.name') : '' }), W / 2, H * 0.66);
  g.font = '400 52px Amiri, serif';
  g.fillText(kind === 'final' ? t('share.final.sub') : P().title, W / 2, H * 0.73);
  g.font = '700 46px Tajawal, sans-serif';
  g.fillText(t('app.title'), W / 2, H * 0.86);
  g.font = '400 34px Tajawal, sans-serif';
  g.fillText(P().build.base.replace(/^https?:\/\//, ''), W / 2, H * 0.9);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  if (!blob) return null;
  const file = new File([blob], 'khaqaniya.png', { type: 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (!download && nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text: t(kind === 'final' ? 'share.text' : 'share.district.text', { url: P().build.base }) }); return blob; } catch { /* cancelled */ }
  }
  const a = h('a', { href: URL.createObjectURL(blob), download: 'khaqaniya.png' });
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  document.body.appendChild(a); a.click(); a.remove();
  return blob;
}
function lanternSvgString() { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60"><path d="M10 10 h20 l-3 6 h-14z" fill="#c98a2b"/><rect x="11" y="16" width="18" height="26" rx="5" fill="#fff1c1" stroke="#c98a2b" stroke-width="2.5"/><path d="M20 21 q-5 7 0 15 q5 -8 0 -15z" fill="#e9b44c"/><path d="M10 42 h20 l-3 6 h-14z" fill="#c98a2b"/></svg>'; }
function svgToImage(markup: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const m = markup.includes('xmlns') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const img = new Image();
    img.onload = () => res(img); img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(m);
  });
}
export { num };

/** An image for the share-card canvas (same origin, from the cache when offline); null if it cannot load. */
function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
