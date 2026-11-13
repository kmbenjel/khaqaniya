// Boot: data → copy → audio/voices → routes → capture mode → service worker.
import './styles.css';
import { loadAll } from './core/data';
import { loadCopy, t } from './core/copy';
import { initAudio } from './core/audio';
import { initVoice } from './core/voice';
import { initProgress } from './core/progress';
import { setArtManifest } from './art';
import { route, startRouter, setGuard, go } from './core/router';
import { env } from './core/env';
import { settings, save, resetAll, setClockOffset, profile, setMemoryOnly, session } from './core/store';
import { unlockAudio } from './core/sfx';
import { h } from './core/h';
import { registerSW } from './sw-client';
import { installTestApi, gotoTarget, demoProfile } from './test-api';
import { applySettings, grownupsScreen, aboutScreen } from './screens/grownups';
import { splashScreen, introScreen, afterSplash } from './screens/splash';
import { homeScreen } from './screens/home';
import { mapScreen } from './screens/map';
import { levelScreen } from './screens/level';
import { bossScreen } from './screens/boss';
import { polishScreen } from './screens/polish';
import { necklaceScreen } from './screens/necklace';
import { stickersScreen, heroesScreen } from './screens/book';
import { finaleScreen, prayerScreen, medalScreen, dedicationScreen, certScreen } from './screens/finale';
import { profilesScreen } from './screens/profiles';

async function boot() {
  const app = document.getElementById('app')!;
  if (env.fresh) { setMemoryOnly(false); resetAll(env.seed ?? 42); }
  if (env.today) setClockOffset(Number(env.today.replace('+', '')) || 0);
  const st = settings();
  if (env.recitation !== null) st.recitation = env.recitation;
  if (env.voices !== null) st.voices = env.voices;
  if (env.sfx !== null) st.sfx = env.sfx;
  if (env.grownup !== null) st.grownupMode = env.grownup;
  if (env.level) profile().level = env.level;
  if (env.seed !== null) profile().seed = env.seed;
  save();
  applySettings();
  // the OS «reduce motion» switch can change while the game is open
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => applySettings());
  document.documentElement.classList.toggle('capture', env.capture);
  let data;
  try { data = await loadAll(); }
  catch (e) {
    console.error(e);
    try { loadCopy(await (await fetch('./data/copy.json')).json()); } catch { /* no copy either */ }
    app.replaceChildren(h('div', { class: 'error-screen', 'data-testid': 'error' }, h('p', null, t('error.data')), h('button', { class: 'btn', onclick: () => location.reload() }, '↻')));
    return;
  }
  loadCopy(data.copy);
  const { poem } = data;
  initProgress(poem); initAudio(poem); initVoice(poem); setArtManifest(poem.art, poem.faceless, poem.artX2);
  document.title = t('app.title');
  for (const w of poem.warnings) console.warn('[kq]', w);
  if (poem.build.fixture.length) document.documentElement.classList.add('fixture-build');
  installTestApi();
  if (env.profile?.startsWith('demo:')) demoProfile(Number(env.profile.slice(5)) || 0);

  route('/splash', 'splash', splashScreen);
  route('/intro', 'intro', introScreen);
  route('/', 'home', homeScreen);
  route('/map', 'map', mapScreen);
  route('/verse/:n', 'verse', levelScreen);
  route('/boss/:id', 'boss', bossScreen);
  route('/polish', 'polish', polishScreen);
  route('/necklace', 'necklace', necklaceScreen);
  route('/stickers', 'stickers', stickersScreen);
  route('/heroes', 'heroes', heroesScreen);
  route('/profiles', 'profiles', profilesScreen);
  route('/finale', 'finale', finaleScreen);
  route('/prayer', 'prayer', prayerScreen);
  route('/medal', 'medal', medalScreen);
  route('/cert', 'cert', certScreen);
  route('/dedication', 'dedication', dedicationScreen);
  route('/grownups', 'grownups', grownupsScreen);
  route('/about', 'about', aboutScreen);
  // first screen of a session is the splash (its tap unlocks audio), except in capture mode
  setGuard((hash) => {
    if (env.capture || session.get('kq.started')) return null;
    if (hash.startsWith('#/splash')) return null;
    session.set('kq.after', hash === '#/' || hash === '' ? '' : hash);
    return '#/splash';
  });
  const unlock = () => { unlockAudio(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
  if (env.capture) session.set('kq.started', '1');
  startRouter(app);
  if (env.goto) setTimeout(() => gotoTarget(env.goto!), 0);
  else if (env.capture && (location.hash === '' || location.hash === '#/')) { /* home */ }
  registerSW();
  void afterSplash; void go;
}
void boot();
