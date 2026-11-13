// shatr themes — named colour presets that drive the engine's CSS variables.
// A preset gives light + dark palettes; build.mjs appends the generated override
// CSS to the inlined <style> (so later rules win, and it's flash-free since it's
// in the first paint). Add a preset by adding an entry to engine/themes.json —
// no engine CSS edits needed. Pure (no side effects) so the tests can import it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const THEMES = JSON.parse(readFileSync(path.join(ROOT, 'engine/themes.json'), 'utf8'));
export const DEFAULT_THEME = 'stone';

// palette key → CSS custom property
const VAR = { bg: '--bg-color', text: '--text-color', title: '--title-color', accent: '--accent-color', card: '--card-bg' };

export const themeNames = () => Object.keys(THEMES);
export const resolveTheme = (name) => THEMES[name] || null;

// CSS that overrides the engine's :root / html.dark-mode variables for a preset.
export function themeCss(name) {
    const t = THEMES[name] || THEMES[DEFAULT_THEME];
    const block = (p) => Object.entries(VAR).map(([k, v]) => `${v}:${p[k]}`).join(';');
    const grad = (p, sel) => (Array.isArray(p.progress) ? `${sel}{background:linear-gradient(90deg,${p.progress[0]},${p.progress[1]})}` : '');
    return `:root{${block(t.light)}}html.dark-mode{${block(t.dark)}}`
        + grad(t.light, '#progressBar') + grad(t.dark, 'html.dark-mode #progressBar');
}
