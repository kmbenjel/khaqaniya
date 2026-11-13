// Effects synthesised in the browser (GAME_DESIGN §7.2): noise and envelopes only, fast sweeps, no pitched notes,
// no bells, no instrument timbres, no samples. Ducked under any voice or recitation.
import { settings } from './store';
import { isPlaying } from './audio';
import { env, emit } from './env';

let ctx: AudioContext | null = null;
let master: GainNode;
let noiseBuf: AudioBuffer;
let duck = 1;
export type Sfx = 'tap' | 'pop' | 'sparkle' | 'whoosh' | 'swoosh' | 'thud' | 'clack' | 'roll' | 'drip' | 'hiss' | 'stretch' | 'flip' | 'puff' | 'reveal' | 'page' | 'lock';
export const played: Sfx[] = [];   // for tests

export function unlockAudio(): void {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export function setDuck(voiceOn: boolean) { duck = voiceOn ? 0.5 : 1; }

function noise(t0: number, dur: number, gain: number, filt: { type: BiquadFilterType; f0: number; f1?: number; q?: number }, env: 'click' | 'swell' | 'fall' = 'fall', trem = 0) {
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = filt.type; f.Q.value = filt.q ?? 1.2;
  f.frequency.setValueAtTime(filt.f0, t0);
  if (filt.f1) f.frequency.exponentialRampToValueAtTime(filt.f1, t0 + dur);
  const g = ctx.createGain();
  const peak = gain * duck;
  g.gain.setValueAtTime(0.0001, t0);
  if (env === 'swell') { g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); }
  else { g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.004, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); }
  let last: AudioNode = g;
  if (trem) {
    const tg = ctx.createGain(); tg.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.frequency.value = trem;
    const lg = ctx.createGain(); lg.gain.value = 0.5;
    lfo.connect(lg).connect(tg.gain); lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    g.connect(tg); last = tg;
  }
  src.connect(f).connect(g);
  last.connect(master);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.05);
}
function sweep(t0: number, dur: number, f0: number, f1: number, gain: number) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * duck, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function sfx(id: Sfx): void {
  played.push(id); if (played.length > 50) played.shift();
  // capture mode: the video is silent, V2 rebuilds the effect track from these events (muted: the switch was off)
  if (env.capture) emit('kq:sfx', { name: id, t: performance.now(), muted: !settings().sfx || !ctx });
  if (!settings().sfx || !ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const t = ctx.currentTime + 0.01;
  const soft = isPlaying() ? 0.5 : 1;   // under the recitation: 6 dB down
  const G = (x: number) => x * soft;
  switch (id) {
    case 'tap': noise(t, 0.012, G(0.2), { type: 'bandpass', f0: 2000, q: 2 }, 'click'); break;
    case 'pop': sweep(t, 0.07, 520, 180, G(0.35)); noise(t, 0.005, G(0.2), { type: 'highpass', f0: 3000 }, 'click'); break;
    case 'sparkle': for (let i = 0; i < 8; i++) noise(t + Math.random() * 0.48, 0.025, G(0.12 * (1 - i / 10)), { type: 'highpass', f0: 6000 }, 'click'); break;
    case 'whoosh': noise(t, 0.28, G(0.18), { type: 'bandpass', f0: 400, f1: 2500, q: 1.5 }, 'swell'); break;
    case 'swoosh': noise(t, 0.16, G(0.18), { type: 'bandpass', f0: 1200, f1: 300, q: 1.5 }, 'swell'); break;
    case 'thud': sweep(t, 0.14, 110, 70, G(0.4)); noise(t, 0.03, G(0.15), { type: 'lowpass', f0: 400 }, 'click'); break;
    case 'clack': noise(t, 0.008, G(0.25), { type: 'bandpass', f0: 1800, q: 3 }, 'click'); noise(t + 0.07, 0.008, G(0.22), { type: 'bandpass', f0: 1800, q: 3 }, 'click'); break;
    case 'roll': noise(t, 0.6, G(0.16), { type: 'lowpass', f0: 600 }, 'swell', 18); break;
    case 'drip': sweep(t, 0.09, 300, 90, G(0.35)); break;
    case 'hiss': noise(t, 0.6, G(0.14), { type: 'bandpass', f0: 3000, f1: 900, q: 2 }, 'fall'); break;
    case 'stretch': noise(t, 0.5, G(0.16), { type: 'bandpass', f0: 300, f1: 900, q: 2 }, 'swell', 30); break;
    case 'flip': noise(t, 0.16, G(0.16), { type: 'bandpass', f0: 300, f1: 1200, q: 1.5 }, 'swell'); noise(t + 0.17, 0.16, G(0.16), { type: 'bandpass', f0: 1200, f1: 300, q: 1.5 }, 'swell'); break;
    case 'puff': sweep(t, 0.14, 110, 70, G(0.35)); noise(t + 0.05, 0.2, G(0.15), { type: 'lowpass', f0: 500 }, 'fall'); break;
    case 'reveal': noise(t, 0.4, G(0.12), { type: 'highpass', f0: 4000 }, 'swell'); for (let i = 0; i < 6; i++) noise(t + 0.35 + Math.random() * 0.4, 0.025, G(0.1), { type: 'highpass', f0: 6000 }, 'click'); break;
    case 'page': noise(t, 0.09, G(0.18), { type: 'bandpass', f0: 3000, q: 1 }, 'fall', 60); break;
    case 'lock': sweep(t, 0.12, 100, 70, G(0.3)); sweep(t + 0.16, 0.12, 100, 70, G(0.3)); break;
  }
}
