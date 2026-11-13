#!/usr/bin/env node
// Renders public/icons/icon.svg to the PNG icons of the manifest (run on the VM: needs google-chrome + playwright).
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icons');
const svg = readFileSync(path.join(DIR, 'icon.svg'), 'utf8');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
for (const [name, size, pad, bg] of [['icon-192.png', 192, 0, ''], ['icon-512.png', 512, 0, ''], ['maskable-512.png', 512, 0.12, '#1b2550'], ['apple-touch-icon.png', 180, 0.06, '#1b2550']]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - 2 * pad));
  await page.setContent(`<html><body style="margin:0;background:${bg || 'transparent'};display:grid;place-items:center;width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await page.screenshot({ path: path.join(DIR, name), omitBackground: !bg });
}
await browser.close();
console.log('icons written');
