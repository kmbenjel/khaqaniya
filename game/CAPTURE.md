# Capture mode (for the video: V1 script, V2 render)

Everything here works only with `?capture=1` (GAME_DESIGN §12) and never changes normal play. Tested by
`tests/capture.spec.ts` (VM: `npx playwright test tests/capture.spec.ts`).

## URL switches (GAME_DESIGN §12, plus)
`capture=1` · `seed=` · `profile=demo:<k>` · `goto=` · `level=` · `grownup=` · `recitation=0|1` · `voices=0|1` · `sfx=0|1` ·
`speed=` · `motion=0` (reduced motion) · `fresh=1` (an empty store) · `today=+N` (clock) and:

- **`timings=<url>|reader`**: the karaoke reading light, the echo windows and the silent clip lengths (recitation off)
  follow another reader's durations. The file has the `audio/timings.json` schema; only `dur`, `sadrDur`, `ajzDur` are
  taken (files are ignored: with `recitation=1` the game would still play Ghouthani's clips, so use it with
  `recitation=0`). `reader` means `./video/reader-timings.json`: `tests/serve.mjs` exposes the repo's `video/` there (it
  is never deployed; the service worker never caches `video/`). Verses the file lacks keep their normal timings.
  `__kq.timings()` → `{ url, verses: [n…] }` when applied, `null` otherwise; `__kq.timingOf(n)` → the timing in use.
  A missing or broken file only logs a warning.

## Hooks
- `window.kq = { state, solve, fail, next, goto }`, `window.__kq` (all of `src/test-api.ts`).
- **`__kq.say(key, params?)`**: shows a `design/copy.ar.json` line in the game's own speech bubble and plays its voice clip
  (`audio/voice/` via `voice.json`) when voices are on and the clip exists, even for lines marked `voice: false`; emits
  `kq:say` (and `kq:audio {kind: 'voice'}` when a clip plays, `kq:say-end` at the end); resolves when the clip ends (or
  after the caption time when there is no clip). On screens without a cast bar (medal, dedication, finale pages) the
  bubble floats at the bottom for the line and then goes. For the lines the game never voices itself: `joke.14`,
  `joke.21` + `joke.21.real`, `finale.medal`, `dedication.1`–`dedication.5`.
- `solve(skip?)` taps the next right target at once (waits up to 15 s); pass the labels of items to leave alone
  (`reward`, `boss-done`, `polish-done`, `finale`, `medal`, `name-sheet`) when a script waits for them.

## Events (on `window`)
- `kq:step` `{verse, step}` / `{boss, step}` / `{polish, i}` / `{finale}` · `kq:item` `{label}` · `kq:screen` `{name}`
- `kq:audio` `{kind: verse|sadr|ajz|meaning|voice, id, startedAt, dur}` (fires with the recitation off too)
- `kq:say` `{key, who, text}` · `kq:say-end` `{key}`
- **`kq:sfx`** `{name, t, muted}`: every sound effect (`t` = `performance.now()` ms; `muted` = the effects switch was off or
  audio was not unlocked). Playwright's video is silent: V2 rebuilds the effect track from these (the synth recipes are
  in `src/core/sfx.ts`, GAME_DESIGN §7.2).

## First-time lines
`fresh=1` starts an empty profile: at `#/verse/1` the gate chapter plays every first-time line (district title card
`district.gate.intro`, `level.start.first`, `listen.tip.shatr`, the spoken instructions, `game.rhyme.tip`, the radar
lines, `game.missingWord.mishmish` at verse 2, the name sheet after pearl 1). `profile=demo:<k>` marks the tips, the
intro and the name question as seen, so use `fresh=1` alone for the opening chapter (checked in `tests/capture.spec.ts`).
