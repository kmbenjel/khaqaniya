# «رحلة أمين في مدينة القرّاء» — game design

Author: D1 game design & world (Fable max), 2026-11-13. For G1 game build (Opus high), Q1 QA, A1 proofreading, V1/V2 video.
Companion files: `design/copy.ar.json` (every Arabic string, keyed; never type Arabic UI text in code) and
`design/STYLE.md` (art, colours, type, generated-art prompts, SVG fallback).

Reading order for the builder: §0 (one page), §3 (data), §4 (the loop), §8 (screens), §13 (scope and build order).
Everything marked **[v1]** must ship; **[v1+]** ships if time allows; **[later]** is designed but not built now.

---

## 0. The game in one page

**Pitch.** More than a thousand years ago a scholar-poet strung a necklace of 51 pearls: a poem that teaches how to recite
the Qur'an beautifully. One night the mischievous **Lahn gang** (ink-blot creatures; «اللحن» = a mistake in recitation)
snapped the string and the pearls rolled all over the **City of Reciters**. **Amin**, a boy with a lantern, his kitten
**Mishmish** and the wise stork **Laqlaq** walk the city from sunset to dawn and bring the pearls back, one verse at a time,
to the only place nobody can scatter them again: memory. Each verse learned = one pearl on the necklace. Each district ends
with a gang member who is not beaten but **corrected** (he becomes a friend). At dawn the necklace is whole, the player does
what the poet asks for in his last verses (a prayer for him at dawn), and receives **«وسام أمين»**.

**Why it works for an 8-year-old.** He plays within five seconds, hears every verse many times in the reciter's voice,
understands it from a 10-second explanation, then recalls it in games that ask a little more each time (recognise → complete
→ rebuild → say it). He cannot lose, there is no clock, a wrong tap is answered by the right audio. Old pearls get "dusty"
and are polished in one-minute reviews (spaced repetition he never sees as such). Jokes come from a kitten who loves
sardines and tries to rhyme in «ـرِ» like the poem.

**Why it works for grown-ups and teachers.** A grown-up mode (fuller meanings with their sources, faster pace, skip what you
know), a "someone is listening to me" recitation mode, a local class board, a printable certificate, and the whole poem
one tap away on the poem site (`./qasida/`).

**Honouring Amin.** The hero and guide carries his name; «أمين» also means *the trustworthy keeper*, so finishing makes the
player "a keeper of the poem" and the medal is «وسام أمين»; a dedication screen; an Easter-egg greeting when the typed name is
Amin; the final prayer screen ends with a button that says «آمين». Publicly: first name only, no surname, photo or place.

**The numbers.** 51 verses (from data) · 10 districts · 10 gang members · 9 mini-game types (+5 district specials) ·
42 stickers · 0 music · 0 accounts · 0 trackers.

---

## 1. Rules that override everything else

1. **Fun first.** First launch: one tap, a 30-second story (skippable), then verse 1. No form before the first pearl.
2. **Hear → understand → recall → say.** Every verse goes through the same loop (§4). Every correct answer replays the
   correct audio, so playing *is* repetition.
3. **Kind by construction.** No fail screen, no lives, no clock for the child, no lost progress, no punishment for a missed
   day. The word «خطأ» is never shown as a verdict. (Lives and a clock exist only in the optional challenge mode, off by default.)
4. **Data-driven.** Verses, sections, meanings and recitation come from `text/khaqaniya.json`, `text/meanings.json`,
   `audio/timings.json` (`docs/DATA.md`). No verse, hemistich or rhyme word is typed in code or in `copy.ar.json`.
   The poem is always shown with its full tashkeel, in every mode, on every tile.
5. **Respect.**
   - Nothing mocks the Qur'an, reciters or scholars. The butt of every joke is the kitten or a gang member himself.
   - Gang members mangle only **their own names** and everyday words. No verse and no Qur'anic word is ever shown or
     spoken wrongly as a joke. Wrong options in games are real words from other verses, intact.
   - Qur'anic words quoted inside verses (two verses do this, see §3.4) are **locked**: never blanked, shuffled, used as a
     wrong option, or animated as "wrong".
   - Tokens containing the Divine Name or «ربّ / إله / مولى» with a pronoun are never used as wrong options.
   - The seven reciters are never drawn. They appear as seven named lanterns.
   - The prayer screen of the finale is sincere: no joke, no effect, no character animation, no synthetic voice.
6. **No music at all** (owner's rule): no loops, jingles, instruments, bells or chimes. Sound = the reciter's clips,
   character voices, short non-melodic effects, cheering voices (§7).
7. **Privacy.** Publicly «أمين» only. Names, progress and the board stay on the device. Nothing leaves the device unless a
   grown-up turns on the optional live AI (§9).
8. **One way of speaking.** All copy is gender-neutral by construction (characters say "we", buttons are in the child's own
   voice). No string has a feminine variant; the game never asks "boy or girl".
9. **Original.** Characters, names, art and layout are our own (see STYLE.md "Don'ts").
10. **Web constraints.** RTL, mobile-first, offline PWA, relative URLs only (the site may live at `/khaqaniya/` or at a
    subdomain root), service-worker cache prefix `kq-game-`, never answer navigations under `qasida/` (site/README.md).

---

## 2. World and story

### 2.1 The object of the quest: the necklace

The poem calls well-ordered speech "like pearls" and Arabic calls composing verse *نَظْم* (stringing). So:
verse = **دُرَّة** (pearl), the poem = **العِقد** (necklace), learning = bringing a pearl back, review = **تلميع** (polishing),
forgetting = dust (never loss). The HUD always shows the necklace count `n / total`.

### 2.2 One night, from sunset to dawn

The journey happens in a single story-night that lasts as long as the player needs (weeks in real life). The sky changes
with progress, never with the clock: sunset at the gate, deep night in the middle, first light in the cave, sunrise on the
last hill, because the poet's closing verses ask for a prayer **at dawn**. This gives each district its own colour (good for
the video's chapters) and gives the ending a meaning.

### 2.3 Cast

| who | what | personality | job in the game | voice |
|---|---|---|---|---|
| **أمين** Amin | boy of about nine, short hooded tunic, brass lantern, satchel with the pearl string | brave, kind, quick, encouraging | guide: gives every instruction, most praise; walks the map | bright, energetic |
| **مِشمِش** Mishmish | apricot-coloured kitten with a blue neckerchief | hungry (sardines), sleepy, a coward who boasts, tries to make verses in «ـرِ» | comic relief; "took" the missing word; holds the polishing cloth; reacts to everything | squeaky, mock-dramatic |
| **لَقلَق** Laqlaq | old white stork with small round glasses, lives on the city gate | calm, warm, a little absent-minded, stands on one leg to think | explains the meaning of each verse, gives the one-line lesson, opens each district, presents reviews | warm, unhurried |
| **عصابة اللحن** | ten ink-blot creatures | each is one mistake the poem warns about | district challenges; become friends when corrected | one distinct voice each |

Why a stork and not an owl: storks nest on walls and minarets all over Morocco and are well loved there, the owl is a bad
omen in local folklore, and an owl mascot in a learning app looks borrowed. Why a kitten: «مُشّ» is "cat" in Moroccan Arabic,
so «مِشمِش» makes Amin smile before the first joke.

The player has no avatar body: the player is "the other lantern" walking beside Amin (a small lantern in the colour chosen
in the profile). This avoids gendered avatars and keeps art small.

### 2.4 The Lahn gang (one per district)

Each member embodies a mistake named or implied in his district's verses, has one visual gag, mangles his own name, and has
a verse of his district that "corrects" him (`bossVerse`, the last question of his challenge). Lines: `boss.<id>.*`.

| # | id | name | the mistake | visual gag | corrected form | grounded in verse* |
|---|---|---|---|---|---|---|
| 1 | `manfoukh` | مَنفوخ | boasting about what you learned | a balloon blot that inflates with every boast | small, relaxed, a leaf instead of his ink crown | 1 |
| 2 | `khallat` | خَلّاط | mixing up who is who and what goes where | two colours swirled, shoe on head, hat on foot | colours in neat halves, shoe on foot | 8 |
| 3 | `ajoul` | عَجول | rushing so fast that letters get eaten | comet shape, legs a blur, cannot finish his own name | sits with a glass of mint tea | 12 |
| 4 | `kaslan` | كَسلان | "tomorrow, tomorrow": never practising | melted over a cushion, yawning | upright, a small daily checklist | 22 |
| 5 | `mattat` | مَطّاط | adding too much, over-stretching | chewing-gum body stretched across the screen | normal size, holding a small scale | 26 |
| 6 | `qallab` | قَلّاب | flipping the vowels (the loud, obvious kind of lahn) | upside-down, walks on his hands, gets the vowel of his own name wrong | upright, hands on hips | 30 |
| 7 | `fuwaq` | فُواق | adding a hamza where there is none | jelly blot that hiccups; little «ء» bubbles pop out | holds a glass of water, bubbles in a jar | 35 |
| 8 | `duhrouj` | دُحروج | not stopping where one should | a ball that rolls and crashes into cushions | feet on the ground, holding a stop paddle | 39 |
| 9 | `khafiyy` | خَفِيّ | hiding the sound of letters (the subtle kind of lahn) | a nearly invisible wisp, only eyes; revealed by the lantern | fully visible, glowing | 46 |
| 10 | `nasyan` | نَسيان | forgetting: the gang's leader | sleepy cloud with a nightcap, looks for the glasses on his own head | wide awake, glasses on, hands back the thread | 49 |

\* Verse numbers follow the reciter's order (1..51); see Appendix A. They are bound by data (§3.3), not hard-coded in logic.

The two kinds of lahn named in the tajwid books (جليّ obvious, خفيّ subtle) are explained by Laqlaq in three bubbles
(`lahn.what`, `lahn.kinds`, `lahn.fix`) after the meaning of the two verses that speak about lahn (flag `lahnTip`, Appendix A).

### 2.5 Districts

Ten districts, bottom to top of one long map (sunset → dawn). District = a run of consecutive verses. Names:
`district.<id>.name`; Laqlaq's one-line opening: `district.<id>.intro`. Section titles from the data are shown as the
district's subtitle (`map.district.section`), so the scholarly headings stay data-driven.

| # | id | verses* | reciter's own chapter(s) | name (copy) | what it looks like | sky | gang | special game |
|---|---|---|---|---|---|---|---|---|
| 1 | `gate` | 1–7 | المقدمة + حسن الأداء والقراءة | بابُ النِّيَّة | the great city gate, stork nest on top, first lanterns | sunset | manfoukh | rhyme "radar" (tutorial) |
| 2 | `seven` | 8–11 | ذكر القراء السبعة | ساحةُ القُرّاءِ السَّبعة | a round square with seven lantern towers and five road signs | dusk | khallat | S1 caravan [v1+] |
| 3 | `garden` | 12–14 | مراتب التلاوة (first part) | حديقةُ التَّرتيل | a quiet riad garden, water channels, orange trees | early night | ajoul | (none) |
| 4 | `fountain` | 15–22 | مراتب التلاوة (rest) | سِقايةُ العِلم | a courtyard with a public fountain (سقاية) and benches | starry night | kaslan | (none) |
| 5 | `market` | 23–27 | أهمية حفظ القرآن ومعرفة اللحن | سوقُ الميزان | a covered souk lane with brass scales and hanging lanterns | night | mattat | (none) |
| 6 | `workshop` | 28–31 | الإظهار والإدغام والإخفاء + السواكن والمتحركة | وَرشةُ الحَرَكات | a calligrapher's workshop: reed pens, inkwells, vowel marks drying on lines | deep night, full moon | qallab | S2 hats [v1+] |
| 7 | `bridge` | 32–36 | المد | جِسرُ المَدّ | three long bridges over a moonlit river | moonlit | fuwaq | S5 doors [later] |
| 8 | `lane` | 37–43 | تنبيهات على بعض الحروف المفردة + المد اللازم | دَربُ الحُروف | a lane of differently shaped doors ending in a caravan stop | late night | duhrouj | S3 stop [later] |
| 9 | `cave` | 44–48 | الإظهار | مَغارةُ الصَّدى | a cave with six echoing openings and first light at its mouth | first light | khafiyy | S4 throat letters [later] |
| 10 | `hill` | 49–51 | الخاتمة | تَلّةُ الفَجر | a hilltop garden above the whole city, sunrise | dawn | nasyan (final, cumulative) | (finale) |

\* Default ranges; the binding rule is in §3.3. The reciter's video has 12 chapters; three pairs of short chapters are merged
and one 11-verse chapter is split in two so that every district has 3 to 8 verses and a challenge of its own.

### 2.6 Story beats

- **Intro** (6 panels, ≤ 35 s, auto-advance with voice, `intro.skip` always visible): `intro.1` … `intro.6`, with
  `intro.lahn` as a footnote bubble on panel 3. Panels: 1 the poet stringing pearls · 2 the necklace glowing over the city ·
  3 the gang snaps the string · 4 Mishmish batting pearls like balls · 5 Amin lifts the lantern · 6 the map, first pearl blinking.
- **Meeting the cast** (first map visit, 3 bubbles): `char.amin.hello`, `char.amin.meetMishmish`, `char.amin.meetLaqlaq`,
  then `char.laqlaq.hello`.
- **District opening**: sky cross-fade (1.2 s), title card (district name + verse range + section title), Laqlaq's line.
- **Challenge** at the end of each district (§4.8).
- **Finale** (§5.7): dawn, the necklace closes, the prayer, the medal, the dedication.
- **After the end**: polishing continues for ever; `finale.keep`.

### 2.7 Humour bible

Lands for an 8-year-old: food obsession (sardines), naps, cowardly bragging ("I am guarding this basket… from the inside"),
taking credit, counting mistakes, funny sounds (hiccup, deflating, rolling), a grown-up-looking villain who forgets his own
name, upside-down things, characters who are wrong while the player is right.
Mishmish's "verses" always rhyme in «ـرِ» and are always about food or sleep (`joke-rhyme` tag): they teach the rhyme by play.
Never: jokes on Qur'an, reciters, scholars, the poet, prayer, the player's mistakes, anyone's looks, dialect or accent.
Puns on tajwid terms are few, always on the kitten's ignorance, always followed by the real meaning, and carry the tag
`joke-term` so the owner can drop the family in one line.
Rate: at most one joke per level (after the reward), one per challenge intro. Never the same joke twice until all were heard.

---

## 3. Data binding

### 3.1 Files read at boot

| file | used for | if missing or partial |
|---|---|---|
| `text/khaqaniya.json` | title, author, sections, verses (`sadr`, `ajz`, `rhymeWord`), order | game cannot start: show `error.data` |
| `text/meanings.json` | `kid`, `adult`, `words`, `lesson`, `cite` per verse | MEANING step shows `meaning.empty`; G5 falls back to G1 |
| `audio/timings.json` + clips | per-verse clip, hemistich boundary, reciter credit | text-only play; LISTEN shows `error.audio`; games that need audio fall back to text variants |
| `design/copy.ar.json` | every UI string and caption | build fails |
| `audio/voice/index.json` + `audio/voice/<key>.mp3` | character voices (generated from `say`) | captions only (bubbles), no voice |
| `audio/meanings.json` + clips | Laqlaq reading each `kid` meaning | text only; `meaning.hear` hidden |

`variants` and `notes` in the poem file are ignored by the game (the second riwaya is not shown).
`sadrEnd`, `start`, `end` are source-recording times: inside a clip use `sadrEnd - start`.

### 3.2 Proposed additions to the contracts (for the orchestrator; the game works without them)

1. `audio/meanings.json` `{ "voice": "…", "verses": [ { "n": 1, "file": "audio/m/001.mp3", "dur": 7.4 } ] }`: TTS of
   `meanings.kid` in Laqlaq's voice. This is what makes "understand" work for a slow reader. **[v1+]**, high value.
2. `audio/voice/index.json` `{ "<copy key>": { "file": "audio/voice/<key>.mp3", "dur": 2.1 } }`.
3. In `text/khaqaniya.json` verses, two optional fields so the game need not guess:
   `"quran": [ { "where": "ajz", "text": "…" } ]` (Qur'anic words quoted in the verse) and `"joined": true` (a word runs
   across the two hemistichs). Without them the game uses `game/data/overrides.json` (§3.4).
4. Optional per-word timings later (`words: [{i,start,end}]`) for true karaoke. **[later]**

### 3.3 The world table and how districts bind to sections

`game/data/world.json` (written by G1 from §2.5) lists the ten districts in order with
`{ id, to, sky, boss, bossVerse, special, picto }`. `to` = last verse of the district:
`[7, 11, 14, 22, 27, 31, 36, 43, 48, 51]`. `from` = previous `to` + 1.

At build time and at boot, validate against the data:

1. `verses.length` must equal the last `to` (51). If the count differs, the last district absorbs the difference and a
   console warning names it.
2. Every district end must be **either** the end of a section in `sections[]` **or** fall inside a section longer than
   8 verses (a permitted split). With the reciter's 12 chapters (ends 4, 7, 11, 22, 27, 29, 31, 36, 41, 43, 48, 51) this holds.
3. If rule 2 fails (the text agent chose other sections), **do not guess silently**: fall back to the generic builder and
   log a build warning for the orchestrator:
   merge every section shorter than 3 verses into the previous one (the next one if it is first), split every section
   longer than 8 at its midpoint, then give each resulting district the skin whose `bossVerse` falls inside it (first
   come, first served); districts left without a skin use the generic `alley` skin and Mishmish's quiz instead of a gang member.
4. The district subtitle is always the data's own section title(s): `map.district.section` with titles joined by « · ».

### 3.4 Verse extras and overrides (`game/data/verse-extras.json`, from Appendix A)

Per verse number: `pictos` (1–2 pictogram ids for the meaning card), and flags:

| flag | meaning for the game | default (verify against the final text) |
|---|---|---|
| `joined` | a word is split across the hemistichs: build and blank the verse as one string; ORDER-HALVES and ECHO treat it as one unit; no hemistich audio segments | verse 25 |
| `quran` | the verse quotes Qur'anic words: those tokens are locked (pre-placed, never options) | verses 41 and 47 (two words each, in the ajz) |
| `lahnTip` | after MEANING show Laqlaq's three lahn bubbles (once per profile) | verses 23 and 24 (the tip shows after 24) |
| `countJoke` | the verse states the number of verses: allows `joke.14` | verse 18 |
| `special` | district special replaces Round A here | 11 (S1), 31 (S2), 38 (S5), 39 (S3), 45 (S4) |

The build prints a table `n · rhymeWord · district · pictos · flags` so that a human or Q1 can check the alignment against
Appendix A in one look. If the text marks quotations with ﴿ ﴾ or « », derive `quran` from the marks instead.

### 3.5 Determinism

All random choices (option order, distractors, joke order) use one seeded RNG (`mulberry32`), seed =
`hash(profile.seed, verse, attempt)`; `?seed=` in capture mode overrides it. This makes QA runs and the video reproducible.

---

## 4. The learning loop

### 4.1 A session

Home shows one big button and one card:

- **Next pearl** (`home.continue` / `home.next`): the next unlearned verse.
- **Polish** card (`home.polish.count`) when verses are due (§4.9).

The big button is "polish" when 3 or more verses are due, otherwise "next pearl"; the other is always one tap away.
After the day's suggested number of new verses (default 2, setting 1/2/3/none) Laqlaq says `home.enough`, the big button
becomes "listen to my necklace", and "next pearl" stays available as a small button. Nothing is ever blocked.
Typical child session: polish (1–2 min) + one new pearl (4–6 min).

### 4.2 The level = one verse (state machine)

```
INTRO → LISTEN → MEANING → PLAY A → PLAY B → PLAY C → RECITE → LINK → REWARD
 2 s      40 s     15 s      20 s     30 s     45 s     25 s    20 s    5 s      (first time, child)
```

Step dots in the top bar (5 dots: `step.listen`, `step.meaning`, `step.play`, `step.recite`, `step.reward`).
Leaving mid-level keeps nothing (levels are short); the verse stays "open".
Replaying a learned verse: LISTEN (one pass, skippable) → B → C → RECITE → REWARD, stars = best ever.

**INTRO** — the dull pearl rolls in on the district backdrop; banner `map.pearl`; Amin `level.start.*` (rotating).
Grown-up mode adds a button "I know it" (`btn.skip`) that jumps to PLAY C + RECITE.

**LISTEN** (`listen.*`) — the verse card (sadr line, ajz line, big type) and the reciter's clip.
1. Pass 1: whole verse. The hemistich being recited is highlighted; a soft "reading light" sweeps its words, timed by
   spreading the hemistich's duration over its words in proportion to their letter count (approximate karaoke, no extra data).
2. Pass 2, "echo" (`listen.echo`): sadr plays → a silent window of `max(2.5 s, 1.1 × sadr duration)` with a pulsing mouth and
   `listen.yourTurn` → ajz plays → same window. The child repeats aloud. No recording, no judging.
3. `btn.next` appears after pass 2 (level easy/mid) or after pass 1 (strong, grown-up). The ear button replays; the
   turtle-free "slow" toggle (`listen.slow`) sets `playbackRate = 0.8` with `preservesPitch`.
First verse ever: Laqlaq's `listen.tip.shatr` (what a hemistich is) before pass 2. `joined` verses: echo = whole verse, one window.

**MEANING** (`meaning.*`) — Laqlaq's card: `meanings.kid` in big type, read aloud if a clip exists (auto-plays once; replay with
`meaning.hear`), 1–2 pictograms, up to three hard-word chips (tap = bubble with the meaning; more behind «…»), the lesson
line under `meaning.lesson`, the "ask" button (`ai.ask.btn`, §9). Continue with `meaning.gotIt`. Grown-up mode opens with
`meanings.adult` and the sources (`meaning.cite`). `lahnTip` verses add the three lahn bubbles.

**PLAY A, B, C** — three mini-games of rising recall (§4.3), chosen by the verse's position `i` in its district:

| i | A (recognise) | B (complete) | C (rebuild) |
|---|---|---|---|
| 1 | G1 listen & pick | G4 catch the rhyme | G6 string the words |
| 2 | G2 order the halves | G3 the runaway word | G6 |
| 3 | G5 verse & meaning | G4 | G6 |
| 4, 5, 6 … | repeat rows 1–3 | alternate G4 / G3 | G6 |

Verse 1 of the poem plays G4 in its "radar" variant (learn what the rhyme is). A district special, when built, replaces
Round A at its `special` verse.

**RECITE** (`game.recite.*`, G7) — say the whole verse from memory (§4.3).

**LINK** (G8, from the second verse of the poem on) — "which verse comes next?" with the previous verse as the prompt, then
the two verses play back to back joined by a thread. Not scored; it builds the order of the poem.

**REWARD** — the pearl lights up with 1–3 stars and flies to the necklace in the HUD; Amin `reward.pearl.*`;
`reward.stars.N`; sometimes Mishmish (one `joke.*`); buttons `btn.next` (primary), `btn.replay`, `btn.map`.
Guest's first pearl: `profile.askName` (optional name entry, §10.1).

### 4.3 Mini-games (exact mechanics)

Common frame: goal banner 1.5 s (title + icon), prompt zone, play zone, the **help lantern** (`btn.help`) and the **ear**
(replay prompt audio). The instruction line (`game.<id>.how`) is spoken the first three times a game is met (easy), the first
time (mid), on demand only (strong, grown-up); the "؟" in the banner always replays it.

**Right answer:** pop + sparkle-noise, the piece turns mint with a check, the correct hemistich or verse audio plays, then next.
**Wrong answer:** the piece wobbles (300 ms) and returns, soft thud, the prompt audio replays. After 2 wrong tries on the same
item (3 on strong) the right piece glows. A voiced "try again" at most once per three wrong taps (`fb.retry.*`).
**Help lantern:** first press replays the relevant audio; second press removes one wrong option / places the next piece.
**Round score:** 3 = no wrong tap and no help · 2 = one wrong tap or one help · 1 = more. Never 0.

| id | name (copy key) | what the child does | rungs (difficulty) |
|---|---|---|---|
| **G1** | `game.listenPick` | Hears the sadr; picks the ajz that completes it among cards. | 1: cards are **audio buttons** (tap to hear, tap ✓ to choose) with the text small: no reading needed · 2: text cards with an ear each · 3: reversed (hear ajz, pick sadr) |
| **G2** | `game.orderHalves` | Two shuffled cards (sadr, ajz): taps them in order or drags them to slots 1 and 2. Each card has an ear. | 1: one verse · 2: previous + this verse (4 cards) · 3: three verses (challenge, polish) |
| **G3** | `game.missingWord` | The verse with blanks, one active at a time, right to left; picks the word tile among options. Mishmish "took" it (`game.missingWord.mishmish`, first time). | blanks 1 → 2 → 3 → every other word |
| **G4** | `game.rhyme` | The verse without its last word (socket shows «…ـرِ»); three word-pearls roll down three lanes toward Amin's basket; the child taps a lane (or drags, or ←/→) to catch the right one. A wrong catch bounces out; the wave repeats until the right pearl is caught. Two waves: this verse, then one earlier verse (free review). | fall time 4.5 s → 3.5 s → 2.8 s; with reduced motion: three static choices |
| G4r | `game.rhymeRadar` | Tutorial variant, verse 1 only: eight words fall one by one (five real rhyme words of the first district, three everyday decoys `decoy.*`); tap every word that ends in «ـرِ». Laqlaq's `game.rhyme.tip` before, Mishmish's `game.rhymeRadar.done` after. | — |
| **G5** | `game.meaningMatch` | a) sees and hears a kid meaning, picks the verse (cards with text + ear) · b) sees the verse, picks the meaning · c) `game.wordMatch`: joins hard words to their meanings. | a for easy, b for mid/strong, c when the verse has ≥ 2 `words` |
| **G6** | `game.build` | A thread with empty beads and a tray of shuffled word-pearls; taps the next word (or drags). On completion the thread plays the audio and ties a knot. | 1: hemistich by hemistich, first word given · 2: by hemistich · 3: whole verse · 4: whole verse + 2 extra words from other verses |
| **G7** | `game.recite` | Text hidden; says the verse aloud; then compares (below). | first word shown (`game.recite.firstWord`) → nothing shown |
| **G8** | `game.next` | Sees and hears the previous verse; picks the sadr that comes next. | 2 → 3 options |
| **G9** | `game.chain` | 3–5 cards (first two words of each verse + ear): taps them in poem order. | challenge and polish only |

**G7 in detail** (the only step with no right/wrong from the machine):

- Default, **self-check**: `game.recite.how` → the child recites → taps `game.recite.reveal` → the text appears and the clip
  plays (`game.recite.compare`) → after the clip, three big faces: `rate.good` (3), `rate.almost` (2), `rate.again`
  (replays the clip, hides the text, one more try; counts 2 at most).
- **Someone is listening** (`game.recite.listener`, a toggle on the screen, no gate): the text is shown at once for the
  grown-up holding the phone; buttons `listener.ok` / `listener.again`; tapping a word marks it as missed
  (`listener.mark`). Marked words become the verse's **weak words** and are the first to be blanked in later games. **[v1]**
- **Record and compare** (needs the microphone setting, §10.4): `record` → `stop` → two bars "my voice" / "the reciter"
  play one after the other; then the three faces. The recording lives in memory only. **[v1+]**
- **Recite to the stork** (live AI, §9) replaces the faces by the stork's verdict. **[later]**

**Interaction rules for all games:** tap-to-place always works (drag is optional sugar); targets ≥ 56 px; pieces fill right to
left; keys 1–4 choose options, Space replays audio, Enter = next; nothing times out.

### 4.4 District specials (skins on the same engines)

| id | where | mechanic | data |
|---|---|---|---|
| S1 `game.caravan` **[v1+]** | `seven`, Round A of its last verse | seven name-lanterns to five city gates (Kufa takes three); tap a lantern then a gate | `reciter.*`, `city.*` in copy (tag `fact-verify`); pairs: ibnkathir→makkah, nafi→madinah, abuamr→basra, ibnamir→sham, asim/hamza/kisai→kufa |
| S2 `game.hats` **[v1+]** | `workshop` | one word of the verse loses its last vowel mark; pick the right "hat" among fatha, damma, kasra, sukun (`game.hats.*`); G3 engine at mark level | computed from the token's own last mark; skip tokens ending in a long vowel, tanwin or shadda |
| S3 `game.stop` **[later]** | `lane`, the verse about stopping | the clip plays while a caravan moves; tap «قِفْ!» at the end of the first hemistich (± 0.6 s, generous, repeatable) | `sadrEnd` |
| S4 `game.throat` **[later]** | `cave` | G4 engine with single letters: catch the six throat letters among others | the six letters, fixed in config: ء هـ ع ح غ خ (they are listed in the district's own verses; check with the meanings) |
| S5 `game.doors` **[later]** | `bridge` or `lane` | a letter is shown on a door; tap the word of the verse that contains it | computed |

### 4.5 Scoring and stars

Verse stars = from the four scored steps A + B + C + RECITE (max 12): **10–12 → 3★ · 7–9 → 2★ · 4–6 → 1★**.
Finishing always gives at least one star. Stars only go up (replay or a strong polish, §4.9). Three stars = a "golden pearl".
No points, coins or XP: the child's numbers are pearls (`n / total`), stars and journey days.

### 4.6 Choosing words and wrong options (so nobody has to guess)

- **Tokens** = the hemistich split on spaces, marks kept. A `joined` verse is tokenised as one string, the split word merged.
- **Locked tokens** (`quran`): shown, pre-placed, never options. **Sacred tokens** (the Divine Name; ربّ / إله / مولى with a
  pronoun): may be blanks or tiles, never wrong options.
- **Which word to blank (G3):** weak words first, then words of 4+ letters, then the rest; never the first word at one blank;
  never the rhyme word in a level that also has G4.
- **Wrong options (G3, G6 extras):** real tokens from other verses, same slot type (rhyme slot ↔ other rhyme words; otherwise
  non-final words), length within ± 2 letters, not present in the current verse (compare without marks), prefer verses
  already learned.
- **G4:** other verses' `rhymeWord`, learned ones first; never one equal to the answer once marks are stripped.
- **G1, G2, G8:** hemistichs of the same district; never one whose first two words equal the answer's.
- Identical tokens inside a verse are interchangeable. Tokens that differ only in marks are distinct; on easy one of them is
  pre-placed.

### 4.7 Levels of difficulty and adaptation

Profile level (`profile.level.*`): **خفيف** (default for a child), **متوسّط**, **قويّ**. Separate toggles: grown-up mode, challenge mode.

| | خفيف | متوسّط | قويّ |
|---|---|---|---|
| options per question | 2 for the first three verses, then 3 | 3 | 4 |
| G3 blanks when learning | 1, then 2 from the 4th verse | 2 | 3 |
| G6 when learning | rung 1 | rung 2 | rung 3 |
| LISTEN | full + echo | full + echo | full (echo on demand) |
| G4 fall time | 4.5 s | 3.5 s | 2.8 s |
| auto-hint after | 2 wrong | 2 wrong | 3 wrong |
| spoken instructions | first 3 times | first time | on demand |

Adaptation inside a level: `skill` = moving average (weight 0.2) of "right at first try", starts at 0.6. Every 10 items:
above 0.85 → `boost + 1` (max +2); below 0.5 → `boost − 1` (min −1). `boost` adds to options, blanks and the G6 rung (within
2–4 options, ≥ 1 blank, rungs 1–4). The child never sees a difficulty label change.

**Grown-up mode** (`settings.grownupMode`): opens MEANING on the adult text with sources; "I know it" on INTRO; skip on
LISTEN and MEANING; animations at 0.6× duration; a joke only one reward in four; instructions as text. Works with any level.

**Challenge mode** (`settings.challenge`, off by default, hidden from the child): in gang challenges only, three lanterns
(a wrong answer dims one) and a 25-second oil bar per question; at zero lanterns the member "slips away" and the challenge
restarts at once. Reward: a small crown on his sticker. **[later]**

### 4.8 Gang challenges (the "boss" of each district)

**Unlock:** every verse of the district has ≥ 1★ (or `openAll`). The gate node on the map shows the member's silhouette.

**Sequence**

1. *Entrance* (≤ 6 s, skippable): ink splash, name card (`boss.<id>.title`, `.tagline`), the member's `intro` line with his
   gag animation, Amin `boss.intro.amin`. First challenge only: Mishmish `joke.5` and Laqlaq `boss.rule`.
   `qallab` has an extra beat: Amin corrects his name (`boss.qallab.intro.amin`).
2. *Questions.* An **ink meter** of K drops (`boss.meter`), K = clamp(verses in district + 1, 4, 8). Plan: one question per
   verse of the district in shuffled order, type drawn from {G3 one rung up, G4, G1 rung 1, G5, G2 rung 2}; one order
   question (G9 if the district has ≥ 3 verses, else G8); last question always **G6 rung 3 on `bossVerse`**, announced by
   Amin (`boss.final`). Too many → drop the questions of the strongest verses; too few → add for the weakest.
   - Right: the lantern's beam washes one drop (drip sound), the member reacts (`right.1` / `right.2`, voiced every other
     time) and his gag goes one step back (Manfoukh deflates a notch, Khafiyy becomes a little more visible…).
   - Wrong: his gag plays (`wrong`; voiced at most once in three), **nothing is lost**, the question comes back two places later.
3. *Correction* (not defeat): the blot's ragged edge smooths into a clean shape (2 s), he says `fixed`, Laqlaq gives the
   one-line `lesson`, the sticker `sticker.<id>` drops into the book, the district's lantern lights on the map, Amin `boss.win`,
   banner `boss.next`, optional share card. Sometimes Mishmish `joke.12`. Kaslan's entrance may add `joke.16`.
4. *Stars:* 0–1 wrong → 3★ · 2–4 → 2★ · more → 1★ (best ever).

**The final challenge (`nasyan`, district `hill`)** is cumulative: K = 10. Nine questions, one from each earlier district
(a random learned verse of it, any type at the verse's current rung), then G6 rung 3 on his `bossVerse`. It is the "exam"
without the word. Then the finale (§5.7).

The player cannot lose a challenge. The tension is in the staging (the entrance, the meter, the last pearl), not in a penalty.

### 4.9 Polishing = spaced review

Per verse: `box` 1–6, `due` (a local date), `rung` 1–5, `lapses`. Intervals by box, in days: **1, 2, 4, 8, 16, 32**.
A new pearl starts in box 1, due tomorrow, rung 1.

A polish session takes up to **6** due verses (longest overdue first), one task each, chosen by the verse's rung:
rung 1 → G1 · 2 → G3 with two blanks · 3 → G6 rung 2 · 4 → G6 rung 3 · 5 → G7. If three or more due verses are consecutive in
the poem, add one G9. Laqlaq opens (`polish.start`), Mishmish holds the cloth (`polish.mishmish`, sometimes).

- **Pass** (at most one wrong tap, no second help; for G7 "good" or "almost"): the dust flies off, `polish.shiny`;
  `box + 1`, `rung + 1`, `due = today + interval[box]`. A pass at rung ≥ 4 adds a star if the verse has fewer than three.
- **Not yet**: the right audio plays, `polish.later`; `box − 1` (min 1), `rung − 1` (min 1), due tomorrow, `lapses + 1`.
- End: `polish.done`; if more are due: `polish.more` / `polish.enough`.

On the map and the necklace a due pearl looks **dusty** (desaturated, a little cloth icon, `map.dusty`). Dust never becomes
loss: stars and pearls are never taken away. After a long absence there may be many dusty pearls; sessions stay capped at 6.

### 4.10 Listening to the necklace

`necklace.playAll`: all learned verses in order, in the reciter's voice, each pearl lighting as it plays, text following;
loop (`necklace.loop`) and a sleep timer of 5/10/15 min (`necklace.sleep`); Media Session metadata so it keeps playing with
the screen off. Passive listening before sleep is the cheapest and strongest memory aid in the whole game. **[v1]**

---

## 5. Rewards

### 5.1 Pearls and stars
One pearl per verse, 1–3 stars. Shine states: locked (outline) · open (dull, blinking) · 1★ matte · 2★ glossy · 3★ golden rim
· dusty (any of the three, desaturated). The necklace screen is the trophy room.

### 5.2 Sticker book (`stickers.*`, `sticker.*`) — 42 stickers, three pages

| page | stickers | earned by |
|---|---|---|
| الأصدقاء (13) | `amin`, `mishmish`, `laqlaq` | meeting the cast (first map visit) |
| | `manfoukh` … `nasyan` (10, corrected forms) | correcting each gang member |
| الأحياء (10) | one lit lantern per district (name = district name, caption `sticker.district.cap`) | finishing the district's challenge |
| الإنجازات (19) | `firstPearl`, `sevenPearls`, `half`, `all` | 1, 7, ⌈total/2⌉, total pearls |
| | `golden` | first verse with 3★ |
| | `polish5` | 5 polish sessions |
| | `days3`, `days7`, `days14`, `days30` | journey days (§5.3) |
| | `weekFull` | 7 lamps lit in the last 7 days |
| | `comeback` | playing again after 7+ days away (a reward for coming back, not a penalty for leaving) |
| | `seven` | the caravan special without a wrong pairing (or the `seven` challenge with 3★ if S1 is not built) |
| | `calm` | Ajoul's challenge without using help |
| | `listener` | first verse recited in "someone is listening" mode |
| | `wholeListen` | listening to the whole necklace once (all 51) |
| | `recorded` | first record-and-compare |
| | `sardine` | Easter egg: tap Mishmish ten times on the home screen |
| | `medal` | the finale |

Locked stickers show a grey silhouette and `stickers.locked`. A new sticker drops with a paper-flip sound and `reward.newSticker`.
One reward in six also plays a small extra Mishmish animation (variable reward; no gambling mechanics, no purchases).

### 5.3 Journey days: a streak that cannot break
`days.title` counts the **distinct days played**, ever. It only goes up. Beside it, a strip of **seven lamps** for the last
seven days (`days.week`; today at the leading edge), lit for each day played. A day counts after one new pearl or one polish
session (`days.lit`). No "you lost your streak", no reset, no notification. After 3+ days away Mishmish greets with
`home.comeback`; after 7+ days the `comeback` sticker.

### 5.4 Unlocks
Verses unlock in order inside a district; the challenge after all its verses; the next district after the challenge.
`settings.openAll` (teachers, adults) opens everything. Listening to the necklace is available from the first pearl.
All six lantern colours are free from the start (nothing cosmetic is locked behind play).

### 5.5 «وسام أمين», certificate and share cards
- **Medal screen** after the finale: the medal (gold, a pearl at its centre, teal ribbon; text set by the app) spins in,
  `finale.medal`, Mishmish `finale.mishmish`. Buttons: `btn.print`, `btn.share`, `btn.saveImage`, `finale.toDedication`.
- **Certificate** (`cert.*`), A4 landscape, print stylesheet (`@page { size: A4 landscape; margin: 12mm }`), cream paper,
  zellige border, medal at the top centre: title, subtitle, "granted to:" + the name typed now (`cert.name.ask`, stays on the
  device), the reason line, the poem's full title and author **from data**, verse count, stars, date (Hijri and Gregorian via
  `Intl.DateTimeFormat('ar-u-ca-islamic-umalqura')` and `'ar'`), the line `cert.named`, a signature line `cert.sign`, the game's
  name and address.
- **Share card** (canvas → PNG, 1080×1350 and 1080×1920): medal, `share.final.title`, `share.final.sub`, the game's name;
  never the child's name unless typed for the certificate and ticked "show my name". Web Share API with `share.text`,
  download as fallback. A smaller card per district (`share.district`).

### 5.6 Dedication (`dedication.*`)
Reached from the heart-lantern on the home screen and after the medal. Cream page, Amin's lantern, the five lines, read once
in Laqlaq's voice if generated. First name only. `dedication.from` is empty until the owner says who signs.

### 5.7 Finale sequence
1. Last pearl + `nasyan` corrected.
2. The sky turns to dawn (3 s); the pearls travel along the thread and the clasp closes; district lanterns light one after
   another with pops, sparkle-noise and the corrected gang cheering (`boss.thanks`). `finale.dawn`, `finale.heart`.
3. **The prayer.** Laqlaq: `finale.dua.intro`. Then a still, quiet screen: the text `finale.dua.text` and one button,
   `finale.dua.amen`. No voice, no effect, no character movement. The child (or a parent) reads it.
4. The medal (§5.5). 5. The dedication. 6. `finale.keep`: back to the map in daylight; polishing goes on.

### 5.8 Easter eggs
- A profile named أمين (also "Amin", "Amine", with or without marks): Amin greets with `profile.easter.amin` and the
  player's lantern gets a golden glow.
- Ten taps on Mishmish: the sardine sticker. Single taps: `mishmish.tap.*`.

---

## 6. Less reading

1. **Audio first.** Every instruction is spoken (short, by Amin) and shown as a caption bubble. Every meaning should have a
   voice (§3.2). Options in early games are audio buttons. An ear button is on every screen that has text to hear.
2. **One idea per screen.** One task, one primary button, at most two secondary ones.
3. **Icons with every label.** Buttons are icon + one or two words; the map uses no sentences.
4. **Big type** (CSS px at 360-wide; clamp up to desktop; the text-size setting multiplies by 1 / 1.15 / 1.3):

| text | min size | line height | font |
|---|---|---|---|
| verse (cards, tiles) | 28 (tiles 24) | 2.1 | Amiri Bold |
| kid meaning | 22 | 1.9 | Amiri |
| speech bubbles, captions | 20 | 1.8 | Amiri |
| buttons, titles | 20 (primary 22) | 1.3 | Tajawal 700/800 |
| HUD numbers | 18 | 1 | Tajawal 700 |
| adult text (settings, sources) | 16 | 1.7 | Tajawal 500 |

5. **Short lines.** A bubble has at most 14 words and three lines; longer copy is split into taps.
6. **Full tashkeel** on everything a child reads; the poem always exactly as in the data.
7. **Digits** follow `settings.numerals`: Western digits (1 2 3) by default, as in Moroccan schools; ١٢٣ optional
   (`Intl.NumberFormat('ar-u-nu-latn' | 'ar-u-nu-arab')`).
8. Hemistichs are stacked (sadr above, ajz below, indented) on phones; side by side from 900 px.

---

## 7. Sound (no music)

### 7.1 Layers and priorities
1. **Recitation** (the reciter's clips): highest priority, nothing ever plays over it.
2. **Character voices** (TTS at build time from `say`): one at a time; an instruction interrupts a joke; queue of two at most.
3. **Effects**: short, non-melodic, synthesised in the browser (no samples), ducked 6 dB under any voice.
4. **Cheers**: human-like voices only (layered TTS), for the big moments.

No bed of sound, no ambience loop: silence between sounds is part of the design (and keeps the video's narrator clear).
Three independent switches: recitation, voices, effects (§10.4). A caption bubble always shows the line even when voices are off.

### 7.2 Effects (Web Audio; noise and envelopes only; no pitched notes, no bells, no instrument timbres)

| id | when | recipe |
|---|---|---|
| `tap` | any button | 12 ms white noise, band-pass 2 kHz, gain 0.2 |
| `pop` | right answer, sticker lands | sine sweep 520→180 Hz in 70 ms with a 5 ms noise click (a mouth "pop", not a note) |
| `sparkle` | pearl earned, star | 8 grains of 25 ms high-passed (6 kHz) noise scattered over 500 ms, fading |
| `whoosh` | screen change | pink noise, band-pass sweeping 400→2500 Hz, 280 ms |
| `swoosh` | card or pearl flying | noise, band-pass 1200→300 Hz, 160 ms |
| `thud` | wrong tap (soft) | sine 110→70 Hz, 140 ms, plus 30 ms low-passed noise |
| `clack` | Laqlaq's beak, tile placed | two 8 ms noise bursts, band-pass 1.8 kHz, 70 ms apart |
| `roll` | pearl rolling in | low-passed noise with 18 Hz tremolo, 400–900 ms |
| `drip` | ink drop washed | sine sweep 300→90 Hz, 90 ms |
| `hiss` | Manfoukh deflating | band-passed noise 3 kHz falling, 600 ms |
| `stretch` | Mattat stretching | noise sweep 300→900 Hz, 500 ms, 30 Hz amplitude creak |
| `flip` | Qallab flipping | `swoosh` up then down |
| `puff` | Duhrouj into cushions | `thud` + 200 ms low-passed noise |
| `reveal` | lantern beam on Khafiyy | 400 ms high-passed noise swell + `sparkle` |
| `page` | sticker book page | 90 ms noise burst, band-pass 3 kHz, fast tremolo |
| `lock` | locked node tapped | two dull `thud`s |
| `cheer` | pearl 3★, challenge won, finale | **voices**: 3–4 TTS takes of «هِييييه!» / «ما شاءَ الله!» layered with small offsets, 1.5 s; two variants (files, not synthesis) |

Applause and clapping are left out on purpose (rhythm reads as music); ask the owner before adding any.

### 7.3 Voices
Cast, suggested prebuilt voices and delivery notes are in `copy.ar.json` → `_meta.speakers` (model `gemini-3.8-flash-tts`;
delivery goes in the `speech_metadata.style` annotation, never in the text). The TTS input is the line's `say` field exactly
(pausal forms, no instructions, no tags). Cache per line (hash of model, voice, `say`). Batch per speaker in one request and
split at silences, as `musammi-promo/video/tts.py` does. Voiced lines: **194** (117 with `p: 1` for v1, the rest `p: 2`).
The list of every voiced line *is* the copy file: every entry with `"voice": true`.

Speaking rules in play: praise is voiced on every second right answer at most (`fb.right.*`, rotating; otherwise effect
only); "try again" at most once in three wrong taps; jokes only after a reward or at a challenge entrance; the reciter's
verse is never interrupted. A missing voice file is not an error: the bubble shows for `max(2.5 s, 0.35 s × words)`.

The meanings' voice (51 clips of `meanings.kid`, Laqlaq's voice) is generated from the meanings file, not from the copy file.

---

## 8. Screens and layouts

Canvas: phone portrait **360×740** first; fluid to 480; tablet from 768; desktop from 1024 (two panes). `<html lang="ar" dir="rtl">`.
Everything uses logical CSS properties. "Next" arrows point left, "back" arrows point right; progress and trays fill right to
left; the map path starts bottom-right. Player-typed names render with `dir="auto"`.

Routes (hash): `#/` home · `#/intro` · `#/map` · `#/verse/:n` · `#/boss/:id` · `#/polish` · `#/necklace` · `#/stickers` ·
`#/heroes` · `#/finale` · `#/medal` · `#/dedication` · `#/grownups` (gate) · `#/about`.

### 8.1 Shared frame (levels, challenges, polish)

```
┌──────────────────────────────────────┐  top bar 56
│ [→ back]   ● ● ◐ ○ ○    [necklace 12/51] [🔊] │  step dots; necklace counter; quick mute
├──────────────────────────────────────┤
│  goal banner (title + icon + ؟)  40  │
│                                      │
│  PROMPT ZONE  (verse card / meaning) │  ~30 %
│                                      │
│  PLAY ZONE   (options, tiles, lanes) │  ~45 %
│                                      │
├──────────────────────────────────────┤
│ [ear]  (Mishmish) bubble… (Amin) [🏮 help] │  bottom bar 88: characters 64 px + caption bubble
└──────────────────────────────────────┘
```

Desktop (≥ 1024): a 16:9-friendly stage, max 1280×720, centred on the district backdrop: **play pane** (58 %, prompt + play
zones) at the reading start (right), **story pane** (42 %: characters at full size, caption bubble, verse card or meaning,
necklace progress) at the left. Same components, CSS grid areas only.

### 8.2 Screen list

| screen | content (top → bottom) | notes |
|---|---|---|
| **Splash** | lantern, logo (`app.title.logo` + `app.subtitle`), `app.start` | the tap unlocks audio; preloads district 1 |
| **Intro** | 6 full-bleed panels, caption at the bottom, `intro.skip` | auto-advance with the voice; tap = next |
| **Home** | greeting bubble (Amin) · big button (next pearl / polish) · polish card · row of four: map, necklace, stickers, heroes · journey days + 7 lamps · small: grown-ups, dedication (heart-lantern) | Mishmish sleeps in a corner (tap reactions) |
| **Profiles** (`profile.who`) | lantern tiles with names · "new player" | shown at launch only if 2+ profiles exist |
| **Map** | one vertical scroll, 10 district backdrops stacked (each ≈ 1.4 screens), winding path with pearl nodes and a gate node per district; district header chips; Amin + the player's lantern at the current node; floating "today" button | opens scrolled to the current node; side rail of 10 dots to jump |
| **Verse level** | the frame above with the step's content | §4.2 |
| **Challenge** | the frame; the gang member occupies the top third with his ink meter; questions below | entrance and correction are full-screen moments |
| **Polish** | the frame; a tray of dusty pearls at the top, one comes forward per task | §4.9 |
| **Necklace** | title + count · play-all bar (play/stop, loop, sleep) · the thread: pearls grouped under district names; tap a pearl → verse sheet (text, play, meaning, stars, replay level) · link `necklace.read` to `./qasida/#b<n>` | the pearl being played is centred |
| **Sticker book** | three tabs, grid of 3 columns, tap = big sticker + caption | |
| **Heroes board** | rows: lantern, name, pearls `n/total`, stars, days, a rank from `heroes.rank.*`; "new player"; note `heroes.local` | sorted by pearls then stars; no "last place" styling; tap a row = switch player |
| **Finale / prayer / medal / certificate / dedication** | §5.5–5.7 | the prayer screen has nothing but the text and the button |
| **Pause menu** (`btn.pause`) | resume · quick switches: voices, effects, text size · exit to map | no gate |
| **Grown-ups' corner** (gate) | tips (`grown.tips.*`) · settings · players · live AI · privacy · about | §10.4 |
| **About** | poem, author, text basis, reciter credit, meanings' sources, voices and art notes, "no music", links | values from the data files (`about.*`) |
| **Ask the stork sheet** | bottom sheet: chips `ai.ask.q.*`, answer area | offline version answers from the meanings file (§9) |

### 8.3 Wireframes of the key play screens (360×740)

```
LISTEN                               G3  RUNAWAY WORD                      G4  CATCH THE RHYME
┌─────────────────────────┐         ┌─────────────────────────┐          ┌─────────────────────────┐
│ → ●○○○○        🏮12/51 🔊│         │ → ●●◐○○        🏮12/51 🔊│          │ → ●●◐○○        🏮12/51 🔊│
│   أَسْمَعُ الْبَيْتَ   ؟        │         │  الْكَلِمَةُ الْهَارِبَةُ  ؟       │          │   صَيَّادُ الْقَافِيَةِ   ؟       │
│ ╭─────────────────────╮ │         │ ╭─────────────────────╮ │          │ ╭─────────────────────╮ │
│ │  sadr (highlighted) │ │         │ │ word word ▢▢▢ word  │ │          │ │ sadr                │ │
│ │       ajz           │ │         │ │   word word word    │ │          │ │   ajz …  ( …ـرِ )    │ │
│ ╰─────────────────────╯ │         │ ╰─────────────────────╯ │          │ ╰─────────────────────╯ │
│        ( ◉ ear )        │         │                         │          │  │ pearl│      │      │ │
│   reader's name (data)  │         │   🐾 🐾 🐾 (paw prints)  │          │  │      │ pearl│      │ │
│                         │         │ ╭─────╮ ╭─────╮ ╭─────╮ │          │  │      │      │ pearl│ │
│   «دَوْرِي!» 👄 (echo)    │         │ │ opt │ │ opt │ │ opt │ │          │  │      │      │      │ │
│      [ بِبُطْءٍ ]          │         │ ╰─────╯ ╰─────╯ ╰─────╯ │          │  ╰──────┴─(Amin)┴──────╯ │
│        [ التَّالِي ← ]     │         │                         │          │   tap a lane / drag     │
│ ◉  😺 "…"        👦  🏮  │         │ ◉  😺 "…"        👦  🏮  │          │ ◉  😺            👦  🏮  │
└─────────────────────────┘         └─────────────────────────┘          └─────────────────────────┘

G6  STRING THE WORDS                 RECITE                                CHALLENGE
┌─────────────────────────┐         ┌─────────────────────────┐          ┌─────────────────────────┐
│ → ●●●○○        🏮12/51 🔊│         │ → ●●●◐○        🏮12/51 🔊│          │ →  تَحَدِّي …      🏮12/51 🔊│
│   أَنْظِمُ الدُّرَرَ     ؟        │         │      مِنْ حِفْظِي      ؟        │          │   (gang member, big)    │
│ thread: ○─○─●─●  (RTL)  │         │   ╭ pearl under cloth ╮ │          │   ink meter ●●●●○○○     │
│        ○─○─○─○          │         │   │  first word …     │ │          │ ╭─────────────────────╮ │
│                         │         │   ╰───────────────────╯ │          │ │ question (any game) │ │
│  tray (shuffled pearls) │         │  [ أَرِنِي الْبَيْتَ ]       │          │ ╰─────────────────────╯ │
│  (word) (word) (word)   │         │   then: 😀  🙂  ↺        │          │   options / tiles       │
│  (word) (word)          │         │  ☐ مَعِي مَنْ يَسْمَعُنِي     │          │                         │
│ ◉  😺            👦  🏮  │         │ ◉ [🎙]           👦  🏮  │          │ ◉  😺 (in a basket) 👦 🏮│
└─────────────────────────┘         └─────────────────────────┘          └─────────────────────────┘
```

### 8.4 Sizes and touch
Targets ≥ 56×56, primary buttons 64 high, 12 px between targets; safe-area insets respected; no hover-only affordance;
no long press anywhere except the parent gate. Reduced motion (`prefers-reduced-motion` or the setting): no particles, no lane
animation (G4 becomes three choices), cross-fades instead of flights.

---

## 9. Optional live AI (off by default; a grown-up turns it on) **[later]**

Both features sit behind `#/grownups` → `ai.*` (description, consent, key). With the switch off the game makes **no**
network request beyond its own static files. Model: `gemini-3.8-live` (see the `gemini-live-api-dev` skill and
`~/projects/hifz-warsh` HANDOFF for the client, prompt patterns and lessons; check its licence before reusing code).

**A. «أُسَمِّعُ لِلَّقْلَق» — recite to the stork.**
- Where: a mic-lantern button on RECITE and on the necklace's verse sheet (`ai.recite.btn`); state `ai.recite.listening`.
- Flow: open a short Live session (≤ 60 s) with the **exact text of the verse sent in the turn** and the instruction to judge
  only the audio against that text, never from memory; the model must answer through a function call
  `report({ verdict: "right" | "almost" | "again", missed: [token indexes], say: "<one short cheerful sentence>" })`.
  The UI shows the verse with missed words underlined, plays the model's short voice line (or a canned one), and maps the
  verdict to 3 / 2 / retry. Missed words become weak words.
- Guard rails in the system prompt: speak simple Arabic to a child; one sentence; never comment on voice or accent; never
  judge Qur'an recitation or tajwid, only whether the words of this verse of the poem were said; if the child says anything
  else, gently ask for the verse.
- Key: never in the bundle. Either a **family link** (a small Cloudflare Worker holds the key, mints ephemeral tokens,
  checks a signed family code, limits to 20 sessions a day) or **BYOK** stored on the device (`ai.key.*`).
- Offline, over quota, or off: the button shows a small "no network" mark and RECITE works as in §4.3 (`ai.recite.offline`,
  `ai.status.*`).

**B. «أَسْأَلُ اللَّقْلَق» — ask the stork.**
- **[v1] without any AI**: a bottom sheet with chips that answer from `meanings.json` for the current verse: the meaning
  (`kid`), hard words (`words`), the lesson (`lesson`), the fuller explanation (`adult`), the sources (`cite`).
- With live AI on, one more chip `ai.ask.q.free` (voice or text). The model receives only the current verse and its
  meanings entry and must answer from them in two short sentences; anything else gets the fixed line `ai.ask.outside`
  ("ask your teacher"). No free answers on rulings.

**C. Testing** (BRIEF idea 4): a Playwright run feeds recorded/TTS recitations, right and with planted mistakes, and scores
the verdicts before a child ever uses it.

---

## 10. Players, progress, settings

### 10.1 Profiles
- First launch creates a **guest** (`profile.guest`) silently. After the first pearl Amin offers to write a name
  (`profile.askName`): name (≤ 20 characters), lantern colour (six), level (three). All optional.
- Several profiles per device (family, class of up to 40). The profile picker appears at launch only when there are two or more.
- Names never leave the device. No e-mail, no account, no cloud.

### 10.2 Storage
`localStorage["kq.v1"]`, one JSON document (a few kB per profile), written after every step:

```js
{ v: 1, activeProfile: "p1",
  settings: { recitation: true, voices: true, sfx: true, textSize: "m", numerals: "latn", reduceMotion: null,
              grownupMode: false, challenge: false, dailyNew: 2, openAll: false, mic: false, ai: { on: false, mode: null } },
  profiles: [ { id: "p1", name: "", lantern: "gold", level: "easy", seed: 123456, created: "2026-11-13",
      days: ["2026-11-13"],                       // distinct local dates played
      skill: 0.6, boost: 0,
      seen: { intro: true, cast: true, how: { "game.rhyme": 2 }, tips: ["listen.tip.shatr"], jokes: ["joke.1"] },
      verses: { "1": { stars: 3, box: 2, due: "2026-11-15", rung: 2, plays: 3, lapses: 0, weak: { "a2": 1 }, last: "2026-11-13" } },
      bosses: { "manfoukh": { stars: 3, crown: false, date: "2026-11-14" } },
      stickers: { "firstPearl": "2026-11-13" },
      polish: { sessions: 4, last: "2026-11-14" },
      medal: { date: null, certName: null } } ] }
```
`weak` keys: `s<index>` / `a<index>` = token index in sadr / ajz. Schema changes bump `v` with a migration.
Export / import as a JSON file from the grown-ups' corner (`settings.export`, `settings.import`).

### 10.3 Heroes board (local family or class board)
Computed from the profiles on this device: pearls, stars, journey days, a rank that describes the necklace
(`heroes.rank.0…4`). No network, no global ranking. A teacher adds players, hands the device around, each child taps his row.

### 10.4 Settings and the parent gate
- **Pause menu, no gate:** voices on/off, effects on/off, text size (3 steps), exit.
- **Grown-ups' corner, behind the gate** (`grown.gate.*`): a multiplication `a × b` with a ∈ 12…19, b ∈ 3…9, typed with the
  numeric keypad; three wrong answers → 30 s pause. Inside: recitation/voices/effects, text size, level, grown-up mode,
  challenge mode, daily suggestion (1/2/3/none), open all, digits style, reduce motion, microphone (for record-and-compare),
  download everything for offline, players (rename, delete, new), export/import, start again, live AI, privacy, about, tips.
- External links (GitHub, the poem site) exist only inside the corner and on the necklace's "read the poem" link (same site).

---

## 11. Offline, performance, accessibility

- **PWA.** Manifest with relative `start_url` and `scope` (`./`), icons from STYLE.md. Service worker: precache the shell,
  the three data files, the copy, fonts, district 1's art and audio; cache each district's clips and voices when its header
  first scrolls into view (`map.download` while it happens); "download everything" in settings; cache-first for media,
  stale-while-revalidate for data; cache names start with `kq-game-`; **ignore** any request whose path contains `/qasida/`.
- **Budget.** Shell + data + fonts ≤ 600 kB gzip; all audio ≈ 9 MB (51 verse clips, 51 meaning clips, ~190 voice lines at
  ~48 kbps mono); art ≤ 3 MB (WebP) or 0 with the SVG fallback. First play possible after the shell + district 1 (≈ 1.5 MB).
- **Audio unlock** on the splash tap; one `AudioContext`; clips through `HTMLAudioElement` pool of 3 for Media Session support.
- **Accessibility.** Captions for every spoken line; nothing conveyed by colour alone (icons + motion); focus rings; full
  keyboard play on desktop (§4.3); `aria-label`s from `aria.*`; contrast ≥ 4.5:1 for text (STYLE.md pairs); text size setting;
  reduced motion.
- **Low-end phones.** DOM + SVG + CSS transforms; at most 24 particles; no canvas engine needed (G4 may use one small canvas or DOM).

---

## 12. Made to be filmed (the YouTube walkthrough and the promos)

What makes a level read well on screen, and is therefore part of the design, not decoration:

1. **A clear goal in two seconds:** every game opens with its banner (icon + 2–3 words) and the instruction as a caption.
2. **Big, calm verse text** that stays put while pieces move around it.
3. **Juicy, fast feedback:** every right tap = pop + sparkle + a pearl-meter tick within 300 ms; no feedback animation
   longer than 900 ms; everything skippable by tap.
4. **A visible score that is a picture:** the necklace in the HUD fills pearl by pearl; the ink meter empties drop by drop.
5. **Ten places, ten skies, ten villains with one gag each:** a viewer who lands anywhere in the video knows where he is.
   District title cards (name, verse range, section title) double as chapter cards.
6. **Short units:** a game lasts 20–45 s, a level 4–6 min, a challenge 2–3 min: easy to cut.
7. **Characters react** to right and wrong, so the narrator has something to laugh with.
8. **No music**, so the narrator's voice sits alone over effects; in capture mode character voices can be turned off.

**Capture mode** (for Playwright on the VM; also Q1's test harness), all by URL:
`?capture=1` (no install prompt, no update toast, gate pre-opened, pointer highlight on) ·
`&seed=42` · `&profile=demo:<k>` (a demo player with the first k verses learned at 2–3★, stickers to match) ·
`&goto=verse:12 | boss:ajoul | polish | necklace | finale | medal` · `&level=easy|mid|strong` · `&grownup=1` ·
`&recitation=0|1` (0 for the video: Content ID, see `sources/CONTENT_ID.md`) · `&voices=0|1` · `&sfx=0|1` · `&speed=1`.

Hooks: `window.kq = { state(), solve(), fail(), next(), goto(target) }` (`solve()` performs the right action for the
current item with a visible tap, `fail()` a wrong one), DOM events `kq:step` (`{verse, step}`), `kq:audio`
(`{kind: "verse"|"sadr"|"ajz"|"voice", id, startedAt, dur}`) so the video pipeline can lay its own recitation or captions
exactly where the game "played" a clip, and `data-testid` on every interactive element
(`btn-next`, `opt-0…3`, `tile-<i>`, `lane-0…2`, `pearl-<n>`, `boss-gate-<id>`, `ear`, `help`).

---

## 13. Scope

### 13.1 v1 must-haves
1. Data-driven core: the three data files + copy; fallbacks of §3.1; world binding and validation of §3.3; verse extras.
2. Map with 10 districts, 51 pearl nodes, 10 gates, dusk-to-dawn skies; SVG fallback art for everything (STYLE.md §8).
3. The level loop of §4.2 with **G1, G2, G3, G4 (+ radar), G5a, G6, G7 self-check + "someone is listening", G8**; help
   lantern; gentle wrong answers; stars.
4. Gang challenges for all 10 districts (question plans, ink meter, entrance, correction, final cumulative challenge), with
   the ten blots as SVG, their two states and their lines as captions.
5. Polishing (§4.9), dusty pearls, weak words.
6. Necklace screen with listen-all (loop, sleep timer, Media Session) and links to `./qasida/#b<n>`.
7. Rewards: stickers (42), journey days + seven lamps, finale with the prayer screen, «وسام أمين», printable certificate,
   share card, dedication, the Amin Easter egg.
8. Profiles (guest first), heroes board, pause menu, grown-ups' corner with the gate and the settings of §10.4 (except
   microphone and live AI, shown as "soon" or hidden), about/credits from data, privacy text.
9. Sound: reciter clips with hemistich segments; synthesised effects of §7.2; voice lines with `p: 1` if the audio exists,
   captions always; three independent switches; **no music**.
10. Levels خفيف / متوسّط / قويّ and adaptation; grown-up mode.
11. PWA offline with the rules of §11; RTL; phone and desktop layouts; reduced motion; keyboard play.
12. Capture mode and hooks of §12; the offline "ask the stork" sheet (§9 B, no AI).

### 13.2 v1+ (in this order, if the day allows)
Meaning clips in Laqlaq's voice (needs TTS run) · generated art replacing the SVG fallback where it passes QA ·
S1 caravan · S2 hats · record-and-compare · G9 in polish · `p: 2` voice lines · share cards per district · G5 b/c.

### 13.3 Later
Live AI (recite to the stork, free questions) · challenge mode · S3, S4, S5 · word-level karaoke · English interface ·
teacher export of the board · cosmetic lantern skins · whole-poem recitation mode ("recite my necklace").

### 13.4 Suggested build order for G1 (one strong day)
1. Data loader + validation + seeded RNG + `t()` on the copy file + storage (profile, verse state).
2. Verse card, audio player with hemistich segments, LISTEN and MEANING.
3. The option engine (G1, G3, G5, G8 share it), then G2, G6, then G4.
4. RECITE, REWARD, stars; the level state machine; the map with nodes and unlocks.
5. Polishing; necklace + listen-all.
6. Challenge engine; the ten blots in SVG with two states; entrance and correction.
7. Stickers, days, heroes, profiles, pause, grown-ups' corner, gate.
8. Finale, prayer, medal, certificate (print CSS), share card (canvas), dedication.
9. Effects synth, voice player with captions and rate limits.
10. PWA, capture mode, hooks, test ids. Then v1+ items.

### 13.5 Acceptance checklist (for Q1)
- A new player reaches the first game within 60 s of the first tap and earns pearl 1 without reading a sentence.
- Every verse can be completed with only wrong taps first (no dead end), and with only the help lantern.
- No screen shows a verse, hemistich or rhyme word that differs by even one mark from `text/khaqaniya.json`.
- Locked tokens never appear as options; sacred tokens never appear as wrong options (automated check over all 51 verses
  × all games with 200 seeds).
- Airplane mode after first load: all of district 1 playable; after "download everything": the whole game.
- 360×740 and 1280×720: no text below the sizes of §6, no clipped tashkeel (line-height), no horizontal scroll.
- With all three sound switches off, every instruction is still understandable from captions and icons.
- Dates: polish intervals follow §4.9 when the clock is moved forward 1, 2, 4, 8 days; nothing is lost when moved back.
- The prayer screen has no animation and plays no synthetic voice.
- Grep the bundle: no API key, no surname, no tracker, no request to another origin with live AI off.

---

## 14. Open questions

For the owner:
1. **Who signs the dedication?** `dedication.from` is empty; one relation word or leave it unsigned.
2. **Faces.** Characters are drawn simply (dot eyes, a smile). If the owner prefers figures without facial features,
   STYLE.md has a faceless variant (lantern glow instead of a face); say which.
3. **Cheering voices and praise words.** «تبارك الله» and «ما شاء الله» are spoken by a synthetic voice as praise; fine? And
   may corrected gang members cheer with a plain «هِييه»? No clapping is used.
4. **Jokes on tajwid terms** (`joke-term`, two lines): keep or drop.
5. **The title** keeps the chat's name «رحلة أمين في مدينة القرّاء»; the logo shows «رحلة أمين».

For the orchestrator and the other agents:
6. **Sections (T1).** The design expects the reciter's 12 chapters (ends 4, 7, 11, 22, 27, 29, 31, 36, 41, 43, 48, 51) or any
   sectioning compatible with §3.3 rule 2. If `sections[]` differ, tell G1 which fallback to use.
7. **Contract additions (§3.2):** meaning clips, voice index, `quran` and `joined` fields. Accept or leave to overrides.
8. **Meanings (M1/M2):** the kid meaning of the verse that ends with "winning the prize" should carry the commentators' sense
   (attaining something precious) in a child's words; the one-line `lesson`s are what Laqlaq's district and gang lines
   lean on, so please check the lines tagged `fact-verify` in the copy file (27 lines: lahn kinds, the seven reciters and
   their cities, the Warsh/Hafs facts, each gang lesson) against the شروح.
9. **Audio (G2):** hemistich segments are needed for G1, G2, echo and S3: `sadrEnd` per verse (the joined verse excepted);
   for the five verses where the reciter repeats a hemistich, the clip should hold the first take only.
10. **TTS:** which voice plays Amin? A young-sounding prebuilt voice is suggested; Voice Design could give a more boyish
    one. A1 should proofread `say` as well as `text` (the TTS reads `say`).
11. **Fonts:** Amiri (already in `site/fonts`) + Tajawal (in `~/projects/musammi-promo/fonts`, OFL). Confirm or replace.

---

## Appendix A — verse table (alignment aid; verify against the final text and meanings)

Numbers follow the reciter's order. Gists are mine, in English, only so the builder can check that pictograms and flags
sit on the right verses; **the game never shows them** (meanings come from `text/meanings.json`).
Pictograms: `icon:<id>` = SVG from STYLE.md §6, `glyph:<text>` = letters drawn by the verse font in a pearl.

| n | district | gist (alignment only) | pictos | flags |
|---|---|---|---|---|
| 1 | gate | a fine saying for people of understanding; no boasting, it leads to arrogance | icon:speech-spark, icon:balloon | boss manfoukh |
| 2 | gate | he teaches recitation, seeking refuge from showing off | icon:shield | |
| 3 | gate | asks God's help for what he intends, and to keep his religion safe | icon:hands-dua | |
| 4 | gate | asks pardon on the day to come | icon:heart | |
| 5 | gate | reciter: recite beautifully, the reward is multiplied | icon:mouth-spark, icon:gift | |
| 6 | gate | not everyone who recites does it right; not everyone who teaches is a teacher | icon:lantern-book | |
| 7 | gate | recitation is received from the early teachers | icon:chain | |
| 8 | seven | the seven reciters are owed thanks by all | icon:seven-lanterns | boss khallat |
| 9 | seven | the two Sanctuaries: two reciters; Basra: one | icon:haramayn, icon:palm | |
| 10 | seven | Sham: one; Kufa: the first of three | icon:arches | |
| 11 | seven | two more of Kufa; the last also a master of grammar and poetry | icon:pen | special S1 |
| 12 | garden | the skilled reciter gives each letter its due, slow or fast | icon:walk-run | boss ajoul |
| 13 | garden | slow, thoughtful recitation is better | icon:walk, icon:think | |
| 14 | garden | fast reading is allowed: religion is ease | icon:run, icon:feather | |
| 15 | fountain | memorise this short description | icon:heart-pearl | |
| 16 | fountain | if knowledge were a drink he would pour it for you | icon:cup | |
| 17 | fountain | he made this poem hoping his burden is lifted | icon:scroll | |
| 18 | fountain | the number of its verses, one after another | glyph:{count} | countJoke |
| 19 | fountain | success and reward are from God, in setting the verses' endings right | icon:harakat | |
| 20 | fountain | who recites straight as an arrow should obey in private and public | icon:arrow, icon:sun-moon | |
| 21 | fountain | fluency adorns the one who keeps studying | icon:repeat | |
| 22 | fountain | practice makes the tongue supple | icon:tongue | boss kaslan |
| 23 | market | first: solid memorisation, and knowing a mistake when it happens | icon:heart-pearl, icon:magnifier | lahnTip |
| 24 | market | know the mistake to remove it; no excuse for not knowing | icon:magnifier, icon:eraser | lahnTip (show here) |
| 25 | market | in careful recitation, beware of excess | icon:ruler | joined |
| 26 | market | weigh each letter: no more, no less | icon:scale | boss mattat |
| 27 | market | when teaching carefully, no more than ten at a time | glyph:10 | |
| 28 | workshop | make clear what is clear; merge and hide without strain | icon:sun, icon:merge | |
| 29 | workshop | hiding is not merging: know the difference | icon:merge, icon:hide | |
| 30 | workshop | rest for one case, the three vowels for the others | icon:harakat | boss qallab |
| 31 | workshop | vowel and rest, stop and join, long and short | icon:scissors-link, icon:long-short | special S2 |
| 32 | bridge | lengthening lives in three letters | glyph:ا و ي | |
| 33 | bridge | which three, and when | glyph:ا و ي | |
| 34 | bridge | lighten and stress; do not overdo the vowels | icon:feather-weight | |
| 35 | bridge | say the hamza where there is one; add none | glyph:ء | boss fuwaq |
| 36 | bridge | ya' or waw between a fatha and a hamza: with measure | glyph:ء, glyph:ي و | |
| 37 | lane | ra' and lam clear and fine, until speech runs like strung pearls | glyph:ر ل, icon:pearls | |
| 38 | lane | 'ayn and ha' clear; be balanced in study | glyph:ع هـ | special S5 |
| 39 | lane | stop where the meaning is complete | icon:stop | boss duhrouj, special S3 |
| 40 | lane | do not merge mim into a different letter | glyph:م | |
| 41 | lane | the damma before waw in full (a Qur'anic example) | glyph:ـُو | quran |
| 42 | lane | a soft letter before a doubled one is lengthened | icon:long-short, glyph:ـّ | |
| 43 | lane | because two resting letters met | icon:two-sakins | |
| 44 | cave | six letters before which nun is always clear | glyph:ن, glyph:6 | |
| 45 | cave | the six letters named | glyph:ء هـ ع ح غ خ | special S4 |
| 46 | cave | the throat letters: make them clear | icon:throat, icon:sun | boss khafiyy |
| 47 | cave | do not double the clear nun (a Qur'anic example) | glyph:نْ | quran |
| 48 | cave | tanwin follows the same rule; the prize of mastering it | glyph:ـً ـٌ ـٍ, icon:trophy | |
| 49 | hill | finer points remain for the patient learner | icon:hourglass | boss nasyan |
| 50 | hill | the poet asks his learners for a prayer at dawn | icon:dawn, icon:hands-dua | |
| 51 | hill | a prayer for both: forgiveness and help | icon:hands-dua, icon:heart | |

## Appendix B — copy namespaces (`design/copy.ar.json`, 626 strings)

`app` · `btn` · `home` · `intro` · `char` · `district` · `map` · `step` · `level` · `listen` · `meaning` · `game` (titles,
`how` lines, RECITE buttons, specials) · `fb` (praise, retry, hints) · `reward` · `joke` + `mishmish` · `boss` (generic + ten
members × name, title, tagline, intro, gag, right.1, right.2, wrong, fixed, lesson) · `lahn` · `sticker` + `stickers` ·
`polish` · `necklace` · `days` · `heroes` · `profile` · `finale` · `dedication` · `cert` · `share` · `ai` · `error` · `decoy` ·
`fact` · `reciter` + `city` · adult: `grown` · `settings` · `privacy` · `about` · `aria`.

Rules for the builder: show `text`; send `say` to TTS; `voice: true` lines are always also captions; `aud: "adult"` lines
use the UI font at 16 px; never concatenate strings to build a sentence; never inflect a placeholder (names go after a
colon or stand alone); `{n}`-style placeholders only.
