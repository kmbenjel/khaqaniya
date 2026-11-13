// Q1: a few 1280×800 screenshots with the generated art (VM; needs `node tests/serve.mjs 4321`). → test-shots/desk/*.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
mkdirSync('test-shots/desk', { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const api = (f, ...a) => p.evaluate(([f, a]) => window.__kq[f](...a), [f, a]);
await p.goto('http://127.0.0.1:4321/khaqaniya/?capture=1&recitation=0&voices=0&sfx=0&fresh=1&seed=7&motion=1&speed=1&profile=demo:9#/');
await p.waitForFunction(() => !!window.__kq);
await p.waitForTimeout(1200); await p.screenshot({ path: 'test-shots/desk/home.png' });
await api('goto', 'map'); await p.waitForTimeout(1200); await p.screenshot({ path: 'test-shots/desk/map.png' });
await api('goto', 'verse:10'); await p.waitForTimeout(4000); await p.screenshot({ path: 'test-shots/desk/listen.png' });
await api('goto', 'boss:khallat'); await p.waitForTimeout(2500); await p.screenshot({ path: 'test-shots/desk/entrance.png' });
await api('speed', 25); for (let i = 0; i < 6; i++) { await api('solve'); await p.waitForTimeout(80); }
await p.waitForTimeout(500); await p.screenshot({ path: 'test-shots/desk/boss.png' });
await b.close();
console.log('deskshots done');
