# «رحلة أمين في مدينة القرّاء» — art style sheet

Author: D1b game copy & style sheet (Opus max), 2026-11-13, completing D1 game design (Fable max).
Companions: `design/GAME_DESIGN.md` (rules, screens, ids) and `design/copy.ar.json` (every Arabic string).
Readers: G1 game build (CSS tokens, SVG fallback, motion), the art run (Nano Banana prompts, §11), Q1 QA (contrast,
sizes, motion), V1/V2 video (the look of each district).

Sections referenced from the design: **§6** icons and pictograms (`icon:<id>` in Appendix A), **§8** SVG fallback art,
**§1.2** contrast pairs, **§3.7** the faceless variant, **§12** Don'ts.

---

## 0. The look in one paragraph

A picture book of **cut paper lit by lanterns**. An imaginary walled city of the Maghreb and al-Andalus (horseshoe arches,
zellige stars, carved wooden doors, flat roofs, a few green-tiled eaves and square towers), seen on one night that slowly
turns to dawn. Shapes are flat and rounded, colour comes in large calm areas with soft gradients, and the only strong
light is warm: Amin's brass lantern, windows, the moon, then the sunrise. The poem's text is the brightest, calmest thing
on every screen. Nothing is scary, nothing is busy, nothing flashes.

Principles, in order:

1. **The verse is the hero.** Art stays behind cards; text never sits directly on art (§1.2).
2. **Warm light on cool night.** Gold and cream glow against indigo; the sky warms district by district (§1.3).
3. **Few shapes, big shapes.** Every element reads as a silhouette at 48 px.
4. **One gag per villain, one colour per place.** A viewer who lands anywhere in the video knows where he is.
5. **Respect.** No reciter, scholar, prophet or companion is drawn; the poet is never shown; no text or letters in
   generated images; no music in sound or in pictures (no instruments, no notes, no bells).

---

## 1. Palette

### 1.1 UI tokens (CSS custom properties)

The UI follows `prefers-color-scheme`; the **night** theme is the default look of the game (the story is a night), the
**day** theme is used when the system asks for light, on the certificate, and on the map after the finale.

| token | night (dark) | day (light) | use |
|---|---|---|---|
| `--bg` | `#12142B` | `#FBF5E9` | page behind everything |
| `--surface` | `#1C1F3D` | `#FFFFFF` | cards, sheets, verse card back |
| `--surface-2` | `#262A52` | `#F3E9D6` | secondary cards, tray, chips |
| `--glass` | `rgba(18,20,43,.78)` + `backdrop-filter: blur(6px)` | `rgba(251,245,233,.86)` + blur | title cards and banners over art |
| `--text` | `#F5EFE0` (pearl cream) | `#1E2140` (ink) | body text, verse on dark cards |
| `--text-muted` | `#C9C3D9` | `#555A78` | secondary labels, adult text |
| `--verse-card` | `#FFF8EC` | `#FFFFFF` | the verse card is always light, in both themes |
| `--verse-ink` | `#1E2140` | `#1E2140` | the poem's text |
| `--gold` | `#F2B33D` | `#F2B33D` | primary buttons, lantern, pearls' rim, focus of attention |
| `--on-gold` | `#1E1606` | `#1E1606` | text and icons on gold |
| `--gold-text` | `#F2B33D` | `#8A5A00` | gold used as text (labels, numbers) |
| `--teal` | `#2BB3A8` | `#0F766F` | secondary buttons, ribbon, links |
| `--on-teal` | `#0B1F1D` | `#FFFFFF` | text on teal |
| `--mint` | `#5FD3A6` | `#1A7D59` | right answer: fill (night) / check and text (day) |
| `--mint-fill` | `#BDEFD9` | `#BDEFD9` | a placed, correct tile (text `#0E2A20` on it) |
| `--hint` | `#FFD978` | `#FFD978` | the glow on the right piece after 2 wrong tries |
| `--focus` | `#FFD978` | `#6B3FD1` | focus ring, 3 px, offset 2 px |
| `--neutral-line` | `#8A93B8` | `#6E7699` | outlines of locked things, dividers |
| `--ink` | `#1F1B3F` | `#1F1B3F` | the Lahn gang's ink |
| `--caption` | `#0E1030` at 92 % | `#0E1030` at 92 % | the caption bar under characters (text `--text` night value) |

There is **no red** in the UI. A wrong tap is a wobble and a soft thud, never a colour verdict (design §1.3).

### 1.2 Contrast pairs (WCAG 2.2, computed)

All text ≥ 4.5:1, all UI component outlines ≥ 3:1. Values computed with the WCAG relative-luminance formula.

| pair | ratio |
|---|---|
| night `--text` on `--bg` / `--surface` / `--surface-2` | 15.77 / 13.94 / 11.92 |
| night `--text-muted` on `--surface` | 9.36 |
| `--verse-ink` on `--verse-card` (#FFF8EC) | 14.77 |
| `--on-gold` on `--gold` | 9.63 |
| night `--on-teal` on `--teal` | 6.61 |
| night `--mint` on `--surface` | 8.65 |
| night `--focus` on `--bg` | 13.31 |
| caption text `#F5EFE0` on `#0E1030` | 16.12 |
| day `--text` on `--bg` / `--surface` / `--surface-2` | 14.36 / 15.59 / 12.95 |
| day `--text-muted` on `--bg` | 6.20 |
| day `--teal` (#0F766F) on `--bg`; white on day `--teal` | 5.03; 5.47 |
| day `--gold-text` (#8A5A00) on `--bg` | 5.46 |
| day `--mint` (#1A7D59) on white | 5.10 |
| day `--focus` (#6B3FD1) on `--bg` | 5.94 |
| tile text `#1E2140` on pearl `#F6F1E7`; on `--mint-fill` `#0E2A20` | 13.85; 12.05 |
| locked outline night `#8A93B8` on `--surface`; day `#6E7699` on `--bg` | 5.29; 4.10 (UI ≥ 3:1) |

**Text never sits directly on art.** The skies are too varied for any one text colour (cream on the sunset coral is
2.57:1, ink on the night blues is 1.1–2:1). Every word sits on a surface: the verse card, a bubble, the caption bar, a
`--glass` title card or a chip.

### 1.3 The night that turns to dawn (sky per district)

The sky changes with progress, never with the clock (design §2.2). Each district has a vertical gradient
(`top → middle → horizon`), a star density and one light source. Cross-fade between skies in 1.2 s.

| # | district | top | middle | horizon | stars | light source |
|---|---|---|---|---|---|---|
| 1 | `gate` sunset | `#3B3A78` | `#B8648A` | `#F7B267` | 0 | low sun half behind the wall, `#FFD58A` |
| 2 | `seven` dusk | `#2B2F6B` | `#6A4E8E` | `#E0796B` | 6 | afterglow + the seven tower lanterns |
| 3 | `garden` early night | `#1E2556` | `#36407E` | `#4E4A8C` | 20 | thin crescent low in the west |
| 4 | `fountain` starry night | `#141A45` | `#1F2A60` | `#2E3B7A` | 60 | stars; lamps around the fountain |
| 5 | `market` night | `#11163A` | `#1B2450` | `#273266` | 30 (between awnings) | hanging brass lanterns |
| 6 | `workshop` deep night, full moon | `#0C1030` | `#151C45` | `#1F2858` | 40 | big full moon `#F4EFD8` with a halo |
| 7 | `bridge` moonlit | `#0E1436` | `#1A2C5E` | `#23407A` | 40 | the moon and its reflection on the river |
| 8 | `lane` late night | `#0B0F2C` | `#141A40` | `#1B2350` | 70 | small window lights, one lamp per door |
| 9 | `cave` first light | `#1A2150` | `#3A4A88` | `#5A6AA8` | 15 fading | warm glow at the cave mouth `#E9B58C` |
| 10 | `hill` dawn | `#5B7BC9` | `#F2A5A0` | `#FFD58A` | 2 (morning star) | the sun rising over the city |
| — | `alley` (fallback skin) | `#161B42` | `#202A57` | `#2A3466` | 25 | one lantern |

Stars: dots of `#F5EFE0` at 60–100 % opacity, radius 0.6–1.6 px at 360 wide, placed by the seeded RNG; at most two
"twinkle" at any moment (opacity 0.6 ↔ 1 over ≥ 1.2 s; never a blink).

### 1.4 Character colours

| who | colours |
|---|---|
| Amin | skin `#C98D63` · hair `#2B1B14` · hooded tunic teal `#1F8A85` with cream trim `#F3E6C8` · trousers `#EADCC0` · yellow slippers `#E8B84A` · satchel `#8A5A35` · lantern brass `#D9A441`, glass glow `#FFE29A` |
| Mishmish | fur apricot `#F4A259` · muzzle, belly, paws `#FFE0B8` · stripes `#E07B39` · inner ears `#F6A6A1` · nose `#E86F7A` · neckerchief blue `#2F6FB5` · eyes `#2A2140` with a white highlight |
| Laqlaq | feathers `#FAFAF5`, shade `#DCE3EC` · flight-feather edge `#1E2230` · beak and legs `#E8613C` · round glasses, brass rims `#C99A3B` · eyes `#2A2140` |
| the gang | ink `#1F1B3F`, sheen `#3A2F6E`, white eyes `#FFFFFF` with `#1F1B3F` pupils, one accent each (§4) |

### 1.5 Lanterns

The player's lantern colours (profile, `profile.lantern.<id>`; all free from the start):

| id | glass | glow |
|---|---|---|
| `gold` | `#F2B33D` | `#FFE29A` |
| `teal` | `#2BB3A8` | `#A8F0E8` |
| `rose` | `#E9779A` | `#FFC9D8` |
| `sky` | `#4FA3E0` | `#BFE3FF` |
| `leaf` | `#6BB34A` | `#CDEDB4` |
| `violet` | `#9B7BD8` | `#DCCBFF` |

The seven reciters' lanterns (district `seven`, S1 caravan): one lantern design, seven glass colours, the name set by the
app under each (`reciter.<id>`), never a face, a figure or a silhouette of a person.

| id | glass | city (S1) |
|---|---|---|
| `nafi` | `#6BC5A0` | `madinah` |
| `ibnkathir` | `#F2B33D` | `makkah` |
| `abuamr` | `#4FA3E0` | `basra` |
| `ibnamir` | `#E9779A` | `sham` |
| `asim` | `#9B7BD8` | `kufa` |
| `hamza` | `#F0884A` | `kufa` |
| `kisai` | `#2BB3A8` | `kufa` |

District lanterns (map, sticker page «الأحياء»): each district's lantern uses its horizon colour from §1.3 as glass, the
gold cap, and lights up (glow on, 400 ms) when the district's challenge is done.

### 1.6 States and feedback colours

| state | look |
|---|---|
| right | piece fills `--mint-fill`, a mint check draws in 180 ms, a gold sparkle |
| wrong | piece wobbles, outline `--neutral-line`, no colour change |
| hint | the right piece breathes a `--hint` glow (scale 1 ↔ 1.04, 900 ms, 3 times) |
| dusty (due for polishing) | pearl desaturated to 30 %, three dust specks `#B9A98A`, a small cloth icon |
| locked | outline only, 2 px `--neutral-line`, 40 % opacity fill |
| disabled | 45 % opacity, no hover change |

---

## 2. Shape, line, light, texture

**Shapes.** Circles (pearls, heads, the moon), horseshoe and pointed arches (doors, gates, frames), the eight-pointed star
(zellige, the medal), soft blobs (the gang). Corner radii: tiles and chips 18 px, cards 24 px, buttons fully rounded
(pill), sheets 28 px on the top corners. Frames of important screens (title cards, the medal, the certificate) may carry
a thin zellige border; play screens do not.

**Line.** World art has **no black outlines**: shapes are separated by value. Characters have a soft 2.5 px outline in a
darker tone of their own fill (Amin's tunic `#16625F`, Mishmish `#C46A2E`, Laqlaq `#AEB8C6`); the gang has no outline in
the blot state (ink edges) and a 2 px outline of its accent colour once corrected. Icons: 2.5 px rounded strokes (§6).

**Light.** One warm key light per scene: Amin's lantern (a radial glow, `#FFE29A` → transparent, radius about three times
the lantern) plus the sky's own light (§1.3). Lit faces of buildings take a warm tint, the rest stays cool. Windows glow
`#FFD27A`. The "reading light" that sweeps a hemistich during LISTEN is a soft gold underline glow (`--gold` at 35 %,
height 0.5 em, feathered edges), never a box.

**Texture.** Optional paper grain at ≤ 4 % opacity on backdrops (one tiled 256 px noise WebP, 8 kB); none on cards and
text. Zellige patterns only as thin borders, never behind text.

**Depth.** Three layers per backdrop: far (city silhouette, cool, low contrast), middle (the district's props), near
(path and ground, darkest). Parallax only on the map scroll (0.15 / 0.35 / 1.0), never on play screens.

---

## 3. Characters (model sheets in words)

Proportions are given in heads (h). Draw everyone with the same rounded, slightly chunky hand; every pose must read as a
silhouette. Faces: two dot eyes with a tiny white highlight, a small curved mouth, no nose for Amin (a dot at most),
rosy cheeks at 35 % opacity. The faceless variant is in §3.7.

### 3.1 Amin «أَمِين» — the guide

- **Build:** a boy of about nine, 3.2 h tall, head slightly large (friendly, not a baby), short dark curls showing at the
  hood's edge, warm medium-brown skin (§1.4).
- **Clothes:** a short hooded tunic (knee length, teal, cream trim at the hood, cuffs and hem, two cream toggle buttons),
  cream trousers, yellow pointed slippers, a leather satchel across the body with a **thread of pearls** peeking out.
  The hood is usually down (on the shoulders); up only in the cave and in the faceless variant.
- **Lantern:** a brass Maghrebi lantern, hexagonal body, domed cap with a ring, cut-out stars in its walls through which
  the glow spills as little star-shaped light spots. It is his signature: in every pose it is visible, and it is the
  light source of the scene.
- **Personality in the body:** leans forward, quick steps, lantern raised when he encourages, a thumbs-up with the free
  hand when praising, a wink is allowed (one eye closed), never mocking.
- **Poses to produce:** `idle` (lantern at hip, smile) · `walk` (3/4 view, mid-stride) · `point` (free hand pointing to
  the play zone) · `cheer` (lantern held high, both feet off the ground) · `think` (finger on chin) · `surprised` (eyebrows
  up, mouth "o") · `rest` (sitting on a step, lantern beside him) · `beam` (lantern held out, its beam washing an ink
  drop, used in challenges) · `bow-hand` (hand on heart, for the finale and the dedication).
- **Never:** a weapon, a phone, a modern logo, sunglasses, a mean face, an adult body.

### 3.2 Mishmish «مِشْمِش» — the kitten

- **Build:** a small kitten, 1.6 h tall when sitting (half Amin's height), big round head, short body, thick curled tail.
- **Colours:** apricot with three darker stripes on the head and tail, cream muzzle, belly and paws, pink nose, blue
  neckerchief knotted at the side.
- **Face:** big round eyes (larger than Amin's), three whiskers each side, a "w" mouth; expressions carried by the eyes
  and ears: proud (chin up, eyes half closed), scared (fur puffed, ears flat, tail bottle-brush), sleepy (eyes as two
  gentle arcs), hungry (eyes huge, a single tiny drool sparkle), sheepish (paw behind the head).
- **Props:** a sardine (silver-blue, never a fish skeleton except in `joke.4`), a white polishing cloth with one blue
  stripe, a woven basket he hides in (challenges), a little "verse" he recites with a paw raised (rhyme jokes).
- **Poses:** `idle` · `sleep` (curled, tail over nose) · `scared` · `basket` (only ears and eyes above the rim) · `proud`
  · `cloth` (holding the cloth like a flag) · `cheer` (on hind legs, paws up) · `pounce` (batting a pearl, intro panel 4).
- **Never:** a bow on the head, a missing mouth, a plain white cat, a cat in clothes other than the neckerchief.

### 3.3 Laqlaq «لَقْلَق» — the stork

- **Build:** a white stork about 1.2 × Amin's height when standing straight, long S-shaped neck, long legs, often
  on **one leg** (the other folded), wings folded with the black flight-feather edge showing like a cape's hem.
- **Face:** small round brass-rimmed glasses on the beak's base, calm eyes, long orange-red beak (closed when listening,
  half open when speaking), no eyebrows; kindness shown by a slight head tilt.
- **Home:** a big twig nest on top of the city gate (district 1), visible from the map's start.
- **Gestures:** a raised wing like an open hand when explaining; wing tip touching the glasses when thinking; a slow
  bow when presenting the medal.
- **Poses:** `idle` (one leg) · `explain` (wing raised) · `think` (eyes closed, one leg) · `smile` (head tilt) · `fly`
  (wings open, crossing the sky on district openings) · `nest` (sitting in the nest, for the map and the intro).
- **Never:** an owl's face, a mortarboard cap, a book in the beak, a sly look.

### 3.4 The player's lantern

The player has no body: a small lantern in the chosen colour (§1.5) floats beside Amin at knee height, bobbing 3 px over
2.4 s, with two tiny glow dots for "eyes" only in the Easter egg (a golden glow for a player named Amin). On the heroes
board each row is that lantern. It never has arms, legs, hair or clothes (no gendered avatar).

### 3.5 The poet

**Never drawn**, neither face nor figure nor silhouette. Intro panel 1 shows his desk only: a low wooden reading stand,
a reed pen, an inkwell, a blank manuscript page with no visible writing, an oil lamp, and the string of pearls being
threaded in the lamplight, the thread rising out of frame.

### 3.6 The seven reciters

**Seven named lanterns**, never people (design §1.5). In district 2 they stand on seven slim towers around a round
square; in S1 they are portable lanterns carried along the caravan path. One shared lantern design (taller and more
ornate than Amin's: a two-tier body, a crown of small arches), seven glass colours (§1.5), the Arabic name set by the app
on a cream plate under each lantern. No faces, no silhouettes inside the glass, no turbans or robes anywhere near them.

### 3.7 Faceless variant (owner's choice, design §14.2)

If the owner prefers figures without facial features:

- **Amin:** the hood is always up; inside the hood opening there is a warm glow (radial `#FFE29A` → `#C98D63`), no eyes,
  no mouth, no cheeks. Emotion moves to the body (lean, arms, jumps) and to the lantern (glow brighter when happy,
  steady when calm, a little flicker when surprised).
- **Animals and blots** keep their dot eyes by default; a stricter "F+" setting replaces their eyes with two small soft
  highlights of the same colour as the body, and Mishmish's mouth disappears.
- Same file names with the suffix `.faceless` (§11.6); SVG fallback has a `faceless` flag (§8).

---

## 4. The Lahn gang «عِصَابَةُ اللَّحْن»

**Shared rules.** Each member is a drop of ink with a personality, never a monster: a rounded blob body of `--ink` with a
violet sheen, two big white eyes with small pupils, a tiny mouth, no teeth, no claws, no horns, no tails, no fire, no red
eyes. Blot state: a ragged, splashy outline with 3–5 small droplets around it and a little "ink crown" of drips on top.
Corrected state: the edge becomes smooth (2 s morph), the ink turns into a soft pastel of the member's accent, a 2 px
accent outline appears, the eyes get a happy curve. Height ≈ Amin's (1.0) unless the gag says otherwise. They live in the
top third of the challenge screen; their ink meter is a row of drops under them.

| # | id | name | accent | blot state (the gag) | corrected state |
|---|---|---|---|---|---|
| 1 | `manfoukh` | مَنفوخ | `#E86F7A` | a round balloon blot with a knot at the bottom, cheeks puffed; inflates a notch with every boast (scale 1.0 → 1.35 over the challenge), a pompous little ink crown | small and relaxed (scale 0.8), a green leaf instead of the crown, soft pink |
| 2 | `khallat` | خَلّاط | `#F2B33D` + `#2BB3A8` | two colours swirled like a marbled sweet, a slipper on his head and a little hat on his foot, eyes looking two ways | neat halves (gold left, teal right, a clean S-line between), slipper on the foot |
| 3 | `ajoul` | عَجول | `#FF8A3D` | a comet: blob in front, a long orange-streaked tail behind, legs as a blur of three lines, leaning so far forward he almost falls | sitting on a cushion holding a small glass of mint tea, tail gone, warm orange |
| 4 | `kaslan` | كَسلان | `#8FA3C8` | melted like a puddle over a lilac cushion `#C7B6E8`, half-closed eyes, a yawn bubble | standing upright, eyes open, holding a small paper checklist with three ticks |
| 5 | `mattat` | مَطّاط | `#F28DB2` | chewing-gum body stretched across the screen (scaleX up to 2.4), thinning in the middle, hands at both ends | normal size, holding a small brass scale level in both hands, bubble-gum pink |
| 6 | `qallab` | قَلّاب | `#7FD1E0` | upside down, walking on two small round hands, eyes on the "bottom", a cyan swirl | upright, hands on hips, a proud little smile |
| 7 | `fuwaq` | فُواق | `#9BD66B` | a jelly blot that jumps at each hiccup; little round bubbles pop out (the app may draw a «ء» in one bubble with the verse font; generated art never shows letters) | holding a glass of water, the bubbles sealed in a small jar, lime green |
| 8 | `duhrouj` | دُحروج | `#F6C453` | a ball with yellow stripes, rolling, crashing into a pile of cushions, dizzy stars around (shapes, not letters) | feet on the ground, holding a round "stop" paddle (a plain hand-palm shape, no word) |
| 9 | `khafiyy` | خَفِيّ | `#B9B3FF` | a nearly invisible wisp (body at 18 % opacity, only the eyes fully visible); the lantern beam reveals him in a cone | fully visible, glowing lavender, a soft halo |
| 10 | `nasyan` | نَسيان | `#A0A6B8` | a sleepy cloud of three merged blobs with a blue nightcap `#5C6BC0`, round glasses pushed up on his head while he looks for them | wide awake, glasses on his eyes, holding out the necklace's thread with both hands, a little gold on his cap |

**Animation steps for the challenge** (one notch per right answer, back toward corrected): Manfoukh deflates · Khallat's
colours unswirl a little · Ajoul's tail shortens · Kaslan lifts off the cushion · Mattat shrinks · Qallab tilts upright
· Fuwaq's bubbles slow · Duhrouj rolls slower · Khafiyy gains opacity (18 → 100 %) · Nasyan's glasses slide down.

---

## 5. Districts

Ten districts stacked bottom (sunset) to top (dawn) on one long map. Each has a **band** image (4:5, the illustrated part)
over its own sky gradient (§1.3, CSS) so the 1.4-screen section height stays cheap. The same band, dimmed with
`--glass`, is the backdrop of the district's play screens (desktop: behind the story pane).

| # | id | name key | composition of the band | props that make it readable in two seconds |
|---|---|---|---|---|
| 1 | `gate` | `district.gate.name` | the great city gate, a tall horseshoe arch in ochre wall `#C68B59`, crenellations, Laqlaq's nest on top, the first lanterns lit on either side, the low sun behind | the arch, the nest, two lanterns |
| 2 | `seven` | `district.seven.name` | a round square paved in a star pattern, seven slim towers in a ring each topped by a reciter lantern (§3.6), five wooden road signs pointing out of the square (blank boards) | seven coloured lanterns in a ring |
| 3 | `garden` | `district.garden.name` | a quiet riad garden: four orange trees, a cross of narrow water channels, a low fountain, arcade arches around | orange trees and straight water lines |
| 4 | `fountain` | `district.fountain.name` | a courtyard with a public wall fountain (a tiled arch with a basin and a brass spout), wooden benches, cups on a ledge | the tiled fountain arch and its basin |
| 5 | `market` | `district.market.name` | a covered souk lane: reed awnings with gaps of starry sky, stalls with brass scales of many sizes, hanging pierced lanterns | the brass scales |
| 6 | `workshop` | `district.workshop.name` | a calligrapher's workshop open to the night: low table, reed pens in a cup, inkwells, thin strings across the room on which the vowel marks hang "drying" (the app draws the marks; generated art shows only empty strings with small paper tags) | inkwells, reed pens, hanging strings, the full moon in the window |
| 7 | `bridge` | `district.bridge.name` | three long stone bridges of different lengths over a moonlit river, lanterns along the parapets, the moon's reflection | three bridges, long, short, middle |
| 8 | `lane` | `district.lane.name` | a narrow lane of doors of different shapes (horseshoe, pointed, round, square, double), each with a lamp, ending in a caravan stop with a resting camel and bales | the row of different doors |
| 9 | `cave` | `district.cave.name` | inside a cave: six round openings in the rock wall (some deeper than others), first light warming the cave mouth, a few glowing stones | six openings and the warm mouth |
| 10 | `hill` | `district.hill.name` | a hilltop garden above the whole city, a low wall, a cypress pair, the sun rising over far roofs; the necklace closes here | the sunrise and the city below |
| — | `alley` | `district.alley.name` | a quiet alley of lanterns (fallback skin of the generic builder) | lanterns on both walls |

**The map.** One vertical scroll; a winding path (sand `#E6C48F` on night, 18 px wide, dashed edge `#B88F5A`) climbs from
bottom-right; pearl nodes (36 px) on the path; a gate node per district (a small arch, 56 px, the member's silhouette in
it while locked, the member's corrected sticker after); district header chips (name + verse range) on `--glass`; a side
rail of ten dots (district horizon colours). Amin and the player's lantern stand at the current node.

---

## 6. Icons and pictograms

One family: 24 px grid for UI icons, 48 px for pictograms on the meaning card, 2.5 px rounded strokes (`stroke-linecap:
round; stroke-linejoin: round`), fills only in gold, cream or the accent named. They are hand-made SVG (never generated).
`glyph:<text>` pictograms are not icons: the app sets the letters with the verse font (Amiri) inside a pearl (a cream
circle with a gold rim), e.g. `glyph:ء`, `glyph:ا و ي`, `glyph:{count}`.

**UI icons:** `ear` (an ear with two sound arcs) · `speaker`, `speaker-off` (a speaker with arcs / crossed: never notes)
· `lantern-help` (Amin's lantern with a small "؟" drawn as a shape) · `next` (arrow pointing **left**) · `back` (arrow
pointing **right**) · `map` (folded map with a dotted path) · `necklace` (an arc of five pearls) · `stickers` (a book with
a star sticker) · `heroes` (three lanterns of different heights) · `heart-lantern` (the dedication: a lantern with a heart
cut-out) · `grownups` (a key) · `pause` · `play` · `stop` · `loop` · `moon-timer` (sleep) · `slow` (a snail is too
cliché: use a small feather) · `mic` · `share` · `print` · `download` · `check` · `cloth` (polishing) · `star`,
`star-empty` · `drop` (ink drop) · `lamp-on`, `lamp-off` (the seven lamps) · `lock`.

**Pictograms of Appendix A** (meaning cards):

| id | drawing |
|---|---|
| `speech-spark` | a speech bubble with a small four-point sparkle |
| `balloon` | a round balloon with a knot (Manfoukh's shape, no face) |
| `shield` | a rounded shield with a single star |
| `hands-dua` | two open hands side by side, palms up, as in supplication; simple mitten shapes, no arms beyond the wrists |
| `heart` | a rounded heart |
| `mouth-spark` | a smiling mouth with a sparkle at the corner |
| `gift` | a box with a ribbon |
| `lantern-book` | a closed book on a reading stand under a small hanging lantern (the book is on a stand, never on the ground) |
| `chain` | three linked rings in a row (passing from one to the next) |
| `seven-lanterns` | seven small lanterns in an arc |
| `haramayn` | two small generic mosque silhouettes side by side (dome + square tower), no recognisable building |
| `palm` | a date palm |
| `arches` | three arches in a row |
| `pen` | a reed pen with a split nib |
| `walk-run` | two footprints, one plain, one with speed lines |
| `walk` | two calm footprints |
| `think` | a light bulb is too modern: a small thought cloud with three dots |
| `run` | a footprint with three speed lines |
| `feather` | a feather |
| `heart-pearl` | a heart with a pearl at its centre (memorising by heart) |
| `cup` | a cup with a wisp of steam |
| `scroll` | a rolled scroll, blank |
| `harakat` | three small strokes and a ring arranged in a square (fatha, damma, kasra, sukun as shapes) |
| `arrow` | a straight arrow (straight as an arrow) |
| `sun-moon` | half sun, half crescent in one circle (private and public) |
| `repeat` | two circular arrows |
| `tongue` | a smiling mouth with the tongue tip showing |
| `magnifier` | a magnifying glass |
| `eraser` | an eraser wiping a smudge |
| `ruler` | a straight ruler |
| `scale` | a brass two-pan scale, level |
| `sun` | a sun (clear, open) |
| `merge` | two drops flowing into one |
| `hide` | a drop half behind a curtain |
| `scissors-link` | scissors and a chain link side by side (stop and join) |
| `long-short` | a long bar above a short bar |
| `pearls` | a short strand of five pearls |
| `stop` | a raised open palm in a circle |
| `two-sakins` | two small rings touching |
| `throat` | a simple neck profile with a dot at the throat |
| `trophy` | a cup-shaped trophy with handles |
| `hourglass` | an hourglass |
| `dawn` | a half sun rising over a line |

---

## 7. UI components

**Buttons.** Primary: pill, 64 px high, gold fill, `--on-gold` text (Tajawal 800, 22 px), icon at the reading start
(right), a 0 2px 0 `#B9862B` bottom edge that disappears on press (pressed = translateY(2px), scale .98, 90 ms).
Secondary: pill, 56 px, `--surface-2` fill, `--text`, 2 px `--teal` outline. Icon buttons: 56×56 circles. At most one
primary per screen (design §6.2). Focus: 3 px `--focus` ring, 2 px offset, always visible on keyboard focus.

**Option cards and audio cards.** Cream cards (`--verse-card`), radius 24, 2 px `--neutral-line`; the hemistich in
Amiri 24–28 px; an ear icon at the reading end; on G1 rung 1 the card is an audio button (big ear, waveform-like dots,
the text small at the bottom) with a separate ✓ button (`game.listenPick.choose`).

**Word tiles (word-pearls).** Capsules with a pearl gradient (`#FFFFFF` → `#F6F1E7` → `#E6DDCC`), Amiri Bold 24 px,
min 56 px high, 12 px between tiles, a tiny highlight dot at the top-left; placed tiles turn `--mint-fill`. Empty slots
(beads on the thread): dashed 2 px `--neutral-line` capsules of the expected width ±20 %. Locked Qur'anic tokens: pre-placed,
a thin gold underline, never animated as wrong.

**Pearls** (necklace, map nodes, rewards), drawn as SVG radial gradients:

| state | rendering |
|---|---|
| locked | outline circle only, 2 px `--neutral-line`, fill at 15 % |
| open | dull pearl `#D9D3C7` with a slow pulse (opacity .75 ↔ 1, 1.6 s) |
| 1★ | matte pearl `#F1ECE2`, no specular |
| 2★ | glossy pearl: base `#F6F1E7`, highlight `#FFFFFF` at top-left, shade `#C9C1B3` at bottom-right |
| 3★ "golden" | glossy pearl with a 3 px gold rim `#E7B54A` and a faint gold glow |
| dusty | the pearl's own state at 30 % saturation + three specks `#B9A98A` + a cloth badge |

**The necklace.** A thread (2 px `#E7B54A` curve) with pearls spaced by 2 px; in the HUD a compact arc of the last
seven pearls + the count `n / total` (Tajawal 700, 18 px); on the necklace screen pearls grouped under district names,
the playing pearl centred and glowing, the clasp a small gold eight-pointed star that closes at the finale.

**Stickers.** Die-cut: the art with a 6 px white border and a soft shadow `0 3px 0 rgba(0,0,0,.18)`; locked stickers are a
flat `--neutral-line` silhouette at 35 % with `stickers.locked` under it. Grid of three columns, 104 px tiles at 360 wide.
Friends page: characters and corrected gang members; districts page: the ten district lanterns; feats page: round badges
with a pictogram (gold ring, cream disc) for each feat.

**Speech bubbles and the caption bar.** Bubbles: cream `#FFF8EC`, ink text (Amiri 20 px, line-height 1.8), radius 20,
a tail toward the speaker, max three lines and 14 words, inner padding 12 px × 16 px. The caption bar at the
bottom (88 px) holds the characters at 64 px and the current bubble; when voices are off the bubble stays
`max(2.5 s, 0.35 s × words)`.

**Goal banner.** 40 px band on `--glass`: icon, two or three words (`game.<id>`, Tajawal 800, 20 px), a round «؟» button
at the reading end that replays the instruction.

**Step dots.** Five dots, 10 px, gap 8: done = gold filled, current = gold ring with a half fill, next = `--neutral-line`
ring. Order fills right to left.

**Ink meter.** A row of K ink drops (20 px) under the gang member; a washed drop turns into a small sparkle and fades.

**Seven lamps** (journey days). Seven small oil lamps in a row, today at the leading (right) edge; lit = gold flame with
a glow, unlit = grey outline; the count `days.title` above in Tajawal 700.

**Bottom sheet** (ask the stork, verse sheet). `--surface` with a 28 px top radius, a grab handle, chips (`--surface-2`,
pill, 48 px high, Tajawal 700 18 px).

**Parent gate keypad.** 3×4 grid of 64 px keys, digits in Tajawal 800 28 px, a cream display field; no long press.

**The medal «وسام أمين».** A gold disc `#E7B54A` with a raised eight-pointed star (`#F2C766` faces, `#B9862B` edges), a
single large pearl at the centre (the 3★ pearl), a teal ribbon `#1F8A85` with two cream stripes hanging from a gold ring;
the app sets the words «وِسَامُ أَمِينٍ» under it (never inside the art). Spin-in: rotateY 540° over 1.2 s, ease-out,
then a single slow shine sweep (one pass, 900 ms).

**Certificate** (A4 landscape, print CSS of design §5.5). Cream paper `#FBF5E9`, a 14 mm zellige border (SVG pattern of
eight-pointed stars in teal `#1F8A85`, gold `#C9A24A` and ink `#1E2140`), the medal at the top centre (40 mm), title in
Amiri Bold 34 pt, subtitle Amiri 20 pt, body Amiri 16 pt, the typed name Amiri Bold 30 pt on a dotted line, the poem's
full title and author from data, dates, `cert.named`, a signature line. All ink on cream: prints well in grayscale.

**Share card** (1080×1350 and 1080×1920). Dawn sky of `hill`, the necklace closing in an arc, the medal centred, the title
and subtitle in Amiri Bold 64/40 px on a cream ribbon, the game name at the bottom; the child's name only if typed for the
certificate and ticked `cert.name.show`.

**PWA icons.** A brass lantern (Amin's) with one glowing pearl inside, on a night-indigo rounded square `#12142B` with a
soft gold glow; maskable variant keeps the lantern within the central 80 % safe zone; no letters. Files in §11.6.

---

## 8. SVG fallback art

Every image the game shows has an SVG fallback drawn in code, so the game is complete with **0 kB of raster art**.
Rules: hand-built from primitives (circle, ellipse, rect with rx, simple paths); one `<symbol>` per character pose and per
district layer; colours only from §1 as CSS variables (`fill: var(--amin-tunic)`), so themes and the faceless flag
are CSS; ≤ 4 kB per character pose, ≤ 10 kB per district (gzip); no filters heavier than one `feGaussianBlur` for
glows; seeded RNG (`mulberry32`, design §3.5) for stars, blot edges and droplets so every run is identical.

### 8.1 Characters

- **Amin** (`viewBox="0 0 100 160"`): slippers = two yellow ellipses (rx 9, ry 4) at y 152; legs = two cream rounded
  rects (w 10, h 26); tunic = a trapezoid path from shoulders (x 30–70, y 62) to hem (x 24–76, y 118) with rx-like
  rounded corners, teal, a cream trim stroke 3 px at the hem; satchel strap = a brown 4 px diagonal line, satchel = a
  rounded rect at the hip with three tiny cream circles (pearls) peeking out; head = circle r 22 at (50, 40), skin; hair =
  three dark circles r 7 along the top edge clipped by the hood; hood (down) = a teal crescent behind the neck;
  eyes = two circles r 2.4 at (42, 40) and (58, 40) with white r 0.8 highlights; mouth = a quadratic curve 8 px wide at
  y 49; cheeks = two rose circles r 3.5 at 35 %; arm holding the lantern = a teal capsule; lantern = a hexagon body
  (14×18) in brass, a dome cap (half circle r 7) with a ring, four tiny star cut-outs (5-point stars r 2) filled with
  `#FFE29A`, glow = radial gradient circle r 40 behind everything at 55 % opacity. Poses are rotations of the arm and
  legs groups; `cheer` lifts the whole group by 10 px. **Faceless:** hide eyes, mouth and cheeks, draw the hood up
  (a teal circle r 26 behind the head + an inner opening ellipse) and fill the opening with the warm radial glow.
- **Mishmish** (`viewBox="0 0 100 100"`): body = ellipse (rx 26, ry 20) at (50, 70); head = circle r 24 at (50, 40);
  ears = two rounded triangles with pink inner triangles; stripes = three short dark-apricot arcs on the forehead; eyes =
  circles r 4.5 with white r 1.5 highlights (sleepy: two arcs); nose = a small pink rounded triangle; mouth = a "w" path;
  whiskers = six 0.8 px lines; tail = a thick cubic path curling up at the right; neckerchief = a blue triangle under the
  chin with a knot circle. `scared` scales the tail stroke ×2 and adds a zigzag outline to the body; `basket` draws a
  woven rect (horizontal brown stripes) over the lower 60 %.
- **Laqlaq** (`viewBox="0 0 100 180"`): body = a white teardrop path (point toward the tail) at y 70–110; wing = a
  slightly darker teardrop on the body with a black hem path along its lower edge; neck = a 7 px white stroke on an S
  cubic from body to head; head = circle r 10 at (60, 30); beak = a long orange triangle (30 px) pointing toward the
  screen's centre (mirror the symbol with `scale(-1,1)` when he stands on the other side); glasses = two brass-stroked circles r 4 joined by a bridge; eye = dot r 1.6;
  legs = two orange 2.5 px lines, one straight to y 175, one folded (a "<" shape) at knee height; nest = an ellipse of
  brown strokes at random angles (seeded).
- **The player's lantern**: Amin's lantern alone, in the profile's glass colour, with its glow.

### 8.2 The gang (blots that become friends)

- **Blot path:** take N = 16 points on a circle of radius r; radius of point i = r × (1 + a × n_i), with n_i from the
  seeded RNG in [−1, 1]; join with a closed Catmull-Rom spline. Blot state a = 0.22 plus 3–5 droplets (circles r 2–5 at
  1.2–1.5 r from the centre) and an ink crown (3 drips: rounded rects with circle ends on top). Corrected state: same N
  and same angles, a = 0.03, droplets and crown removed: the 2 s morph tweens the radii (same point count, so it is a
  simple path interpolation). Colour tweens from `--ink` to the pastel accent; a 2 px accent stroke fades in.
- **Eyes:** two white ellipses (rx 7, ry 8) with pupils r 3; happy = the lower half masked into a curve.
- **Gags in code:** `manfoukh` scale 1 → 1.35 + a small triangle knot at the bottom; `khallat` two-colour fill with a
  curved clip-path (S-curve) and a slipper (rounded rect + ellipse) on top; `ajoul` scaleX 1.4, a tail of three tapering
  strokes behind, legs as three short lines; `kaslan` scaleY 0.6 on a lilac ellipse cushion, eyelids as half-circles;
  `mattat` scaleX up to 2.4 with a waist (two quadratic curves pinching the middle); `qallab` rotate(180) and two hand
  circles on the ground; `fuwaq` a vertical jump (translateY −8 px, 140 ms) per hiccup and 3–5 bubbles (stroke circles)
  rising; `duhrouj` a circle with three yellow stripe arcs, rotating while translating, a cushion pile of three ellipses;
  `khafiyy` body opacity 0.18 with full-opacity eyes, revealed through a radial-gradient mask from the lantern beam;
  `nasyan` three merged circles (cloud) + a blue triangle nightcap with a pompom + glasses drawn on top of the head.

### 8.3 Districts

Each district = sky (CSS gradient §1.3) + stars (seeded circles) + three `<symbol>` layers built from a small kit:

- **Kit:** `wall` (rect with a crenellated top: a repeated 8-unit tooth), `house` (rect + flat roof line + 1–2 window
  rects glowing `#FFD27A`), `dome` (half ellipse on a rect), `tower` (tall rect with a small top box and a dome or a
  pyramid cap), `arch-horseshoe` (path: a circle arc > 180° on two short jambs), `arch-pointed`, `door` (arch + a dark
  fill + a ring knocker dot), `tree-orange` (a dark green circle with 5 orange dots), `cypress` (a tall narrow ellipse),
  `palm` (a curved trunk + 6 leaf strokes), `lantern-hanging` (a short line + Amin's lantern scaled), `scale`
  (a T + two half-circle pans), `bridge` (a long rect deck on 2–4 arches, reflection = the same flipped at 25 % opacity),
  `rock` (blob path, dark), `river` (a band with three lighter horizontal dashes).
- **Recipes:** `gate` = wall across + `arch-horseshoe` at centre (ochre) + nest (brown strokes) on top + two hanging
  lanterns + a low sun circle half hidden behind the wall · `seven` = an ellipse square + seven `tower`s on the ellipse,
  each topped with a reciter lantern colour · `garden` = arcade of 5 small arches + 4 `tree-orange` + two crossing water
  bands · `fountain` = a tiled arch (zellige border as a dashed stroke pattern) + basin (half ellipse) + spout + two
  benches · `market` = repeated awning triangles with star gaps + 3 `scale`s of sizes S/M/L + hanging lanterns ·
  `workshop` = a table rect + 3 inkwell circles + a cup of 4 pen lines + 3 strings (catenary curves) with small tags; the
  app may draw the four vowel marks on the tags with the verse font + the full moon circle in a window arch · `bridge` =
  river + three `bridge`s of lengths 0.9 / 0.5 / 0.7 of the width at three depths + moon and reflection · `lane` = 5
  doors of different arch types along a perspective path + a camel silhouette (simple shapes) at the end · `cave` = dark
  rock blobs framing + 6 openings (ellipses, darker inside) in two rows + a warm radial glow at the mouth · `hill` = a low
  wall + two cypresses + the city kit small and far below + a sun half circle with soft rays (no flash) · `alley` = two
  walls in perspective + 6 hanging lanterns.

### 8.4 Other fallbacks

Intro panels: compose the same symbols (panel 1 desk = a rect stand + pen + inkwell + a strand of pearls rising;
panel 2 = the `gate` skyline + a glowing arc of pearls; panel 3 = the arc breaking into pearls with five blots; panel 4 =
Mishmish `pounce` with pearls; panel 5 = Amin `cheer` on a roof line; panel 6 = the map). Medal = two squares rotated
45° (star) + circle + pearl gradient + ribbon paths. Certificate border = an SVG `<pattern>` of eight-pointed stars.

---

## 9. Type

### 9.1 Fonts

| role | font | why | files |
|---|---|---|---|
| the poem (cards, tiles, karaoke), kid meanings, speech bubbles, certificate | **Amiri** Regular 400 and Bold 700 | a classical naskh with complete harakat and mark positioning (`mark`, `mkmk`); the voice of Moroccan school texts | `amiri-regular-arabic.woff2` exists in `site/fonts/` (108 kB); add Amiri Bold (OFL) subset to Arabic + punctuation |
| buttons, titles, HUD, chips, adult text | **Tajawal** 500, 700, 800 | a clear rounded sans; its Arabic subset has every harakah used in the copy, with `mark`/`mkmk` positioning (checked 2026-11-13); **it has no glyph for alif wasla «ٱ»**, so UI strings never use it (copy rule) and the poem is always set in Amiri | the Tajawal woff2 files (weights 300–800, Arabic and Latin subsets) in `~/projects/musammi-promo/fonts/` (OFL); ship 500, 700, 800 only |

Fallback stacks: `"Amiri", "Noto Naskh Arabic", "Scheherazade New", serif` and `"Tajawal", "Noto Sans Arabic",
system-ui, sans-serif`. Preload Amiri Bold and Tajawal 800 (the first screen uses them); `font-display: swap` for Tajawal,
`block` (≤ 300 ms) for Amiri on verse cards so a verse never flashes in a fallback font without its marks.

### 9.2 Sizes (CSS px at 360 wide; the text-size setting multiplies by 1 / 1.15 / 1.3)

| text | min size | fluid size | line height | font |
|---|---|---|---|---|
| verse on cards | 28 | `clamp(28px, 7.4vw, 44px)` | 2.1 | Amiri Bold |
| verse on tiles and options | 24 | `clamp(24px, 6.4vw, 34px)` | 2.0 | Amiri Bold |
| kid meaning | 22 | `clamp(22px, 5.6vw, 30px)` | 1.9 | Amiri |
| speech bubbles, captions | 20 | `clamp(20px, 5vw, 26px)` | 1.8 | Amiri |
| primary buttons | 22 | `clamp(22px, 5.4vw, 26px)` | 1.5 when vocalised | Tajawal 800 |
| other buttons, titles, banners | 20 | `clamp(20px, 5vw, 24px)` | 1.5 when vocalised, else 1.3 | Tajawal 700/800 |
| HUD numbers | 18 | 18–22 | 1 | Tajawal 700 |
| adult text (settings, sources, about) | 16 | 16–18 | 1.7 | Tajawal 500 |
| certificate | — | 16 / 20 / 30 / 34 pt | 1.6 | Amiri |

Minimums for an eight-year-old: nothing he reads is under 20 px, the poem never under 24 px, tap targets ≥ 56 px.
Line heights are generous on purpose: stacked harakat (shadda + vowel, tanwin) must never be clipped (Q1 checks it).

### 9.3 Setting rules

- `lang="ar" dir="rtl"`; player names with `dir="auto"`. No letter-spacing on Arabic. No kashida in UI; the poem's
  justification is the shatr site's job, not the game's (cards are centred, hemistichs stacked on phones).
- Digits follow `settings.numerals` (Latin by default, as in Moroccan schools); Arabic-Indic optional.
- Never fake bold or italic Arabic; never all-caps Latin next to Arabic.
- **Harakat test string** (render at every size above, both themes, before shipping):
  «اللَّهُمَّ، سُؤَالٌ، شَيْءٌ، جِدًّا، يَقْرَؤُونَ، مُؤَقِّتٌ، الْقُرَّاءِ، قِطٌّ، كُرَةٌ، مَوَازِينُ، أُسَمِّعُ».

---

## 10. Motion and juice

**Tokens.** `--t-press: 90ms` · `--t-fast: 160ms` · `--t-base: 240ms` · `--t-slow: 400ms` · `--t-scene: 600ms` ·
`--ease-out: cubic-bezier(.2,.8,.2,1)` · `--ease-pop: cubic-bezier(.34,1.56,.64,1)` (small overshoot) ·
`--ease-inout: cubic-bezier(.65,0,.35,1)`.

| moment | motion | sound (design §7.2) |
|---|---|---|
| button press | scale .98, translateY 2 px, 90 ms | `tap` |
| right answer (≤ 300 ms after the tap) | piece scale 1 → 1.12 → 1 (240 ms, pop), fill to mint, check draws in 180 ms, 8–12 sparkles over 500 ms | `pop` + `sparkle` |
| wrong answer | wobble ±6 px, 3 cycles in 300 ms, piece returns to the tray | `thud` |
| hint | the right piece breathes (scale 1 ↔ 1.04, 900 ms × 3) with a `--hint` glow | — |
| tile placed | slides on a curve to its bead (240 ms), a tiny bounce | `clack` |
| pearl earned | the pearl lights (400 ms), flies on an arc to the HUD necklace (700 ms, inout), 6 trailing sparkles | `sparkle`, `swoosh` |
| sticker | drops from the top with a paper flip (rotateX 90 → 0, 400 ms) | `page`, `pop` |
| screen change | cross-fade + 12 px slide toward the reading direction (240 ms) | `whoosh` |
| district opening | sky cross-fade 1.2 s, title card in 400 ms, holds 1.6 s, Laqlaq flies across (1.4 s) | `whoosh` |
| gang entrance (≤ 6 s, skippable) | ink splash: blot grows from a drop with a splat (500 ms, pop), name card in, gag loop | `drip`, then the gag's effect |
| a drop washed | the lantern beam sweeps (300 ms), the drop turns into sparkles | `drip` |
| correction | edge morph and colour change over 2 s, eyes turn happy, a soft glow ring | `reveal` |
| dawn (finale) | sky to `hill` over 3 s; the pearls travel along the thread (1.5 s); the clasp closes; district lanterns light one by one (200 ms apart) | `pop` per lantern, `cheer` once |
| prayer screen | **none**: no motion, no sound, no character (design §1.5) | — |
| medal | rotateY 540° over 1.2 s, one shine sweep | `sparkle` |
| idle loops | Amin breathes (scale 1 ↔ 1.01, 3 s), lantern glow varies 0.9 ↔ 1.0 (random 0.8–1.6 s, smooth), Mishmish's tail sways (2.4 s), Laqlaq blinks every 4–7 s | — |

**Juice budget.** At most 24 particles at once; no feedback animation longer than 900 ms; everything skippable by a
tap; nothing waits on an animation to accept input (except the 300 ms wobble).

**No flashing.** Nothing changes luminance by more than 10 % of the screen area more than three times per second
(WCAG 2.3.1); no full-screen white or gold flashes; sparkles are small (each < 0.5 % of the screen) and fade, they do
not blink; the lantern's flicker is a slow, smooth variation, never a strobe; the moon and stars do not twinkle faster than
one cycle per 1.2 s.

**Reduced motion** (`prefers-reduced-motion` or the setting): no particles, no flights (cross-fades instead), no
parallax, no idle loops, G4 becomes three still choices, the correction becomes a 400 ms cross-fade between the two
states, the medal fades in without spinning.

---

## 11. Generated art (Nano Banana, at build time)

### 11.1 Pipeline

1. **Model:** Nano Banana, the Gemini image model; take its current id and parameters from the `gemini-api-dev` skill at
   run time. Keys per CLAUDE.md: test keys for probes, the owner's key for what ships. Run on `khaqaniya-vm`, cache every
   result by hash(model, prompt, references), never regenerate an approved image.
2. **References first.** Generate the three character sheets (§11.3) and one style frame (district 1). After approval,
   pass the approved sheet(s) and the style frame as **input images** with every later prompt that shows those
   characters or that place, with the line "Use the attached reference images for the character design, proportions,
   clothes and colours; keep them identical."
3. **Backgrounds for cut-outs.** Characters, gang members, the medal and props are generated on a flat pure magenta
   `#FF00FF` background (no colour of §1 is near it) and keyed to alpha at build (despill magenta, 1 px feather).
4. **Formats.** WebP (quality 76, alpha where cut out), sizes of §11.6; a 2× and a 1× file for characters.
5. **QA** (§11.5) on a contact sheet; if a review page is made for the owner, build and serve it from the VM (owner's
   rule), never from the laptop.
6. **Fallback.** Any asset that fails QA twice uses its SVG fallback (§8); the game ships complete either way.

### 11.2 Shared style preamble (prepend to every prompt)

> Children's picture-book illustration for a calm, joyful learning game. An imaginary walled city of North Africa and
> al-Andalus at night: horseshoe arches, eight-pointed star tiles, carved wooden doors, flat roofs, a few green-tiled
> eaves, square towers. Flat rounded shapes like layered cut paper, soft gradients, a faint paper grain. Warm lantern
> light against a cool indigo night. Palette: deep indigo #12142B, night blue #1F2858, lantern gold #F2B33D, warm cream
> #F5EFE0, teal #1F8A85, apricot #F4A259, rose #E9779A. Clean silhouettes, big simple shapes, generous empty space, no
> clutter. Characters are cute and simple: round heads, small dot eyes, tiny smiles. Absolutely no text, no letters,
> no calligraphy, no numbers, no signs with writing, no logos, no watermark. No real people, no recognisable buildings
> or places, no religious figures, no musical instruments, no weapons, nothing scary.

### 11.3 Character reference sheets (not shipped: `game/art/ref/`)

| file | prompt (after the preamble) |
|---|---|
| `ref/amin.sheet.png` | Character turnaround sheet of Amin, a cheerful boy of about nine with warm medium-brown skin and short dark curly hair, wearing a knee-length teal hooded tunic with cream trim at the hood, cuffs and hem and two cream toggle buttons, cream trousers, yellow pointed slippers, a brown leather satchel across his body with a few pearls peeking out, holding a hexagonal brass lantern with star-shaped cut-outs that glows warm gold. Front, three-quarter, side and back views standing in a row, plus four small head studies (smile, surprise, determination, laughing). Even soft light, flat light-cream background. |
| `ref/amin.faceless.sheet.png` | Same character, the teal hood always up, inside the hood opening only a warm golden glow and no facial features at all; same four views, four body-language studies (happy jump, thinking, pointing, calm). |
| `ref/mishmish.sheet.png` | Character sheet of Mishmish, a small apricot-orange kitten with three darker stripes on the head and tail, cream muzzle, belly and paws, pink nose, big round dark eyes with highlights, three whiskers on each side, a blue neckerchief knotted at the side, a thick curled tail. Sitting front view, side view, walking, curled asleep, plus five expressions (proud, scared with puffed fur, sleepy, hungry, sheepish). Flat light-cream background. |
| `ref/laqlaq.sheet.png` | Character sheet of Laqlaq, a kind old white stork with black flight-feather edges on the wings, a long orange-red beak and legs, small round brass-rimmed glasses, standing on one leg; front, side, three-quarter, wings open in flight, sitting in a twig nest, explaining with one wing raised like a hand. Flat light-cream background. |
| `ref/style.gate.png` | The style frame: the great horseshoe-arched gate of the city at sunset, ochre walls with crenellations, a stork's twig nest on top, two lanterns being lit, a sky from indigo to coral to apricot. |

### 11.4 Per-asset prompts (after the preamble; attach the references named)

**Characters** (on flat pure magenta #FF00FF, full body, no ground shadow; refs: the character's sheet). Poses face the
left of the picture; the app mirrors them with `scale(-1,1)` when a character stands on the other side (the lantern and
the clothes are symmetric enough to mirror):

| file | prompt |
|---|---|
| `char/amin.idle` | Amin standing relaxed, lantern at his hip glowing, friendly smile, three-quarter view. |
| `char/amin.walk` | Amin walking forward with quick steps, lantern swinging slightly, three-quarter view. |
| `char/amin.point` | Amin pointing with his free hand toward the left of the picture, lantern in the other hand, encouraging face. |
| `char/amin.cheer` | Amin jumping with joy, lantern held high above his head, both feet off the ground. |
| `char/amin.think` | Amin thinking, finger on his chin, eyes looking up, lantern at his side. |
| `char/amin.surprised` | Amin surprised, eyebrows up, mouth a small round "o", leaning back a little. |
| `char/amin.rest` | Amin sitting on a stone step, lantern beside him, smiling softly. |
| `char/amin.beam` | Amin holding the lantern out at arm's length; a soft golden beam of light comes from it toward the left. |
| `char/amin.bow-hand` | Amin standing calmly with his hand on his heart, eyes gently closed, lantern at his side. |
| `char/mishmish.idle` | Mishmish sitting, tail curled around his paws, curious look. |
| `char/mishmish.sleep` | Mishmish curled up asleep, tail over his nose, eyes closed as two gentle arcs. |
| `char/mishmish.scared` | Mishmish startled, fur puffed, ears flat, tail like a bottle brush, comic not frightening. |
| `char/mishmish.basket` | Mishmish hiding in a small woven basket, only his ears and wide eyes above the rim. |
| `char/mishmish.proud` | Mishmish sitting very upright, chin up, eyes half closed, proud and a bit silly. |
| `char/mishmish.cloth` | Mishmish holding a white cloth with a blue stripe, waving it like a flag. |
| `char/mishmish.cheer` | Mishmish standing on his hind legs, front paws up, happy. |
| `char/mishmish.pounce` | Mishmish batting a shiny pearl with his paw like a ball, playful. |
| `char/laqlaq.idle` | Laqlaq standing on one leg, calm, glasses on. |
| `char/laqlaq.explain` | Laqlaq explaining, one wing raised like an open hand, beak half open, kind eyes. |
| `char/laqlaq.think` | Laqlaq thinking with eyes closed, standing on one leg, wing tip touching his glasses. |
| `char/laqlaq.smile` | Laqlaq tilting his head with a warm smile. |
| `char/laqlaq.fly` | Laqlaq flying across, wings fully open, legs trailing behind. |

**The gang** (two files each, `gang/<id>.blot` and `gang/<id>.fixed`, on magenta; the blot prompt starts with: "A cute,
mischievous little creature made of a drop of dark indigo ink with a violet sheen, a ragged splashy ink edge, a few ink
droplets around, big white eyes with small pupils, a tiny mouth, no teeth, no claws, no horns, no tail, not scary";
the fixed prompt starts with: "The same little ink creature, now smooth-edged and friendly, its ink turned into a soft
pastel colour with a thin outline, happy eyes"):

| id | blot (gag) | fixed |
|---|---|---|
| `manfoukh` | puffed up like a round balloon with a knot at the bottom, cheeks blown out, a pompous little crown of ink drips, pink tint | small and relaxed, soft pink, a small green leaf on his head instead of the crown |
| `khallat` | marbled gold and teal swirled together, a slipper on his head and a tiny hat on his foot, eyes looking two ways | neatly half gold and half teal with a clean curved line between, slipper on his foot |
| `ajoul` | shaped like a comet with a long orange-streaked tail, legs a blur, leaning so far forward he almost falls | sitting calmly on a cushion holding a small glass of mint tea, warm orange |
| `kaslan` | melted like a puddle over a lilac cushion, eyes half closed, yawning | standing upright and awake, pale blue, holding a small paper checklist with three ticks and no writing |
| `mattat` | stretched long and thin like chewing gum, pinched in the middle, hands at both ends, bubble-gum pink | normal size, holding a small level brass scale with both hands, pink |
| `qallab` | upside down, walking on two small round hands, cyan swirl | upright with hands on hips, cyan, proud little smile |
| `fuwaq` | jelly-like, mid-hiccup jump, small round bubbles popping out of his mouth, lime | holding a glass of water, a little jar of sealed bubbles beside him, lime green |
| `duhrouj` | a round ball with yellow stripes rolling into a pile of cushions, dizzy stars around his head | standing with both feet on the ground, holding a round paddle with an open-palm shape on it, yellow |
| `khafiyy` | almost invisible, a faint transparent wisp where only the two eyes are clearly visible, lavender | fully visible and glowing soft lavender with a gentle halo |
| `nasyan` | a sleepy cloud made of three merged puffs wearing a blue nightcap, round glasses pushed up on top of his head, searching | wide awake, glasses on his eyes, holding out a golden thread with both hands, grey with a touch of gold |

**District bands** (`district/<id>.band`, 4:5, no characters unless named; refs: `ref/style.gate.png`; the sky of §1.3 in
words):

| id | prompt |
|---|---|
| `gate` | The great horseshoe-arched city gate at sunset, ochre crenellated walls, a twig stork nest on top, two lanterns lit beside the arch, a low sun half hidden behind the wall, sky from indigo through dusty rose to apricot. |
| `seven` | A round city square paved with a star pattern at dusk, seven slim towers in a ring each topped by a tall ornate lantern in a different coloured glass (green, gold, sky blue, rose, violet, amber, teal), five blank wooden signposts, afterglow sky. |
| `garden` | A quiet courtyard garden at early night, four orange trees, two narrow water channels crossing at a small low fountain, an arcade of arches around, a thin crescent moon low in the sky, a few stars. |
| `fountain` | A courtyard with a tiled public wall fountain under an arch, a stone basin and a brass spout, wooden benches, small cups on a ledge, a deep starry night sky full of stars. |
| `market` | A covered market lane at night, reed awnings with gaps showing stars, stalls with many brass two-pan scales of different sizes, pierced brass lanterns hanging and glowing, no people, no goods with writing. |
| `workshop` | A calligrapher's workshop open to the night, a low wooden table with reed pens in a cup and round inkwells, thin strings stretched across the room with small blank paper tags hanging on them, a big full moon in an arched window. No letters anywhere. |
| `bridge` | Three long stone bridges of different lengths over a calm river at night, lanterns along the parapets, a full moon and its shimmering reflection on the water. |
| `lane` | A narrow city lane at late night lined with doors of different arch shapes (horseshoe, pointed, round, square, double), a small lamp by each door, the lane ending at a caravan stop with a resting camel and bundles, window lights. |
| `cave` | Inside a cave, six round openings in the rock wall in two rows, some deeper than others, a few softly glowing stones, warm first light of morning entering at the cave mouth. |
| `hill` | A hilltop garden above a whole sleeping city at dawn, a low wall, two cypress trees, the sun rising over far roofs, sky from morning blue through rose to gold. |
| `alley` | A quiet narrow alley at night with lanterns hanging on both walls, soft and simple. |

**Intro panels** (`intro/panel-<1..6>`, 9:16, full bleed; refs as named):

| panel | prompt |
|---|---|
| 1 | A scholar's low wooden reading stand in warm lamplight at night: a reed pen, an inkwell, a blank page with no writing, an oil lamp, and a glowing string of pearls being threaded upward out of the frame. No person, no hands, no face. |
| 2 | A glowing necklace of pearls floating in a gentle arc over the skyline of the walled city at sunset (ref: style frame). |
| 3 | The necklace's thread snapping in the night sky, pearls flying apart, five cute little ink-drop creatures tugging the broken ends with mischievous grins (refs: gang blots). |
| 4 | Mishmish on a rooftop batting a rolling pearl like a ball, other pearls scattered across the roofs and alleys (ref: Mishmish sheet). |
| 5 | Amin on a rooftop lifting his glowing lantern high, determined smile, the scattered pearls glinting below (ref: Amin sheet). |
| 6 | The whole city seen from above at night like a storybook map, a winding sandy path climbing from the gate at the bottom to a hill at the top, ten areas with different lights, one pearl blinking at the start. |

**Others:**

| file | prompt |
|---|---|
| `medal` | A round gold medal with a raised eight-pointed star relief, one large shining pearl at its centre, hanging from a gold ring on a teal ribbon with two cream stripes; front view, on flat magenta #FF00FF. No text. |
| `share/final-4x5`, `share/final-9x16` | The hilltop at dawn (ref: hill band) with a necklace of pearls closing into a full circle in the sky, empty cream space in the middle for a medal and a title. No text. |
| `reciter-lantern` | One tall ornate standing lantern with a two-tier body and a crown of small arches, plain glass (recoloured in seven colours at build), on magenta. |

### 11.5 QA checklist for every generated image

Reject and regenerate (twice at most, then use the SVG fallback) if any of these is true:

- any text, letter, number, pseudo-script, calligraphy or sign with marks on it (image models invent pseudo-Arabic: look
  closely at doors, tags, books, signs);
- a person other than Amin, any face that could be a real person, any figure that could read as a reciter, scholar,
  prophet or companion, a figure praying;
- a musical instrument, musical notes, a bell, speakers with notes;
- a recognisable real building or place, a flag, a brand or logo;
- a character off-model (wrong colours, missing lantern, Mishmish without his neckerchief, Laqlaq without glasses);
- the gang looking scary (teeth, claws, horns, red eyes, fire, devil tails) or like any known franchise's creatures;
- a book that could be the Qur'an on the ground, near feet or shoes, or under a character;
- clutter behind where text will sit; harsh contrast or bright flashes of light.

### 11.6 Sizes, file names, budget

All under `game/art/` (relative URLs; cached per district by the service worker). Art budget ≤ 3 MB (design §11).

| asset | file | size (px) | ~kB each | count |
|---|---|---|---|---|
| character poses | `char/<who>.<pose>.webp` and `char/<who>.<pose>@2x.webp` (srcset: a device loads one) | 384×576 (Amin, Laqlaq), 384×384 (Mishmish); @2x double | 14 / 32 | 22 |
| faceless Amin (only if chosen; replaces, not adds) | `char/amin.<pose>.faceless.webp` | as above | 14 / 32 | 9 |
| gang | `gang/<id>.blot.webp`, `gang/<id>.fixed.webp` | 512×512 | 20 | 20 |
| district bands | `district/<id>.band.webp` (quality 72) | 1080×1350 | 100 | 11 |
| intro panels | `intro/panel-<n>.webp` | 720×1280 | 60 | 6 |
| medal | `medal.webp` | 1024×1024 | 60 | 1 |
| share backgrounds | `share/final-4x5.webp`, `share/final-9x16.webp` | 1080×1350, 1080×1920 | 110 | 2 |
| reciter lantern base | `reciter-lantern.webp` | 256×512 | 15 | 1 |
| PWA icons (from SVG, outside `art/`) | `game/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`, `favicon.svg` | as named | — | 5 |
| references (not shipped) | `ref/*.png` | model default | — | 5 |

Stickers reuse the character, gang and lantern art with the die-cut border drawn by the app (§7); feat badges are SVG.
Pictograms and icons are SVG only (§6). Per device ≈ 2.8 MB with all raster art (22 × 32 + 20 × 20 + 11 × 100 + 6 × 60 +
60 + 220 + 15 kB), 0 MB with the SVG fallback.

---

## 12. Don'ts

**Originality** (nothing that recalls an existing game, app or cartoon):

- No green owl or any owl mascot; no streak flame, gems, hearts-as-lives or league tables (language-learning apps).
- No round angry birds, no slingshots; no candy-coloured match-three sweets; no tiny round green monster with a big mouth
  hungry for candy; no talking cat that repeats what you say; no kitten with a bow and no mouth.
- The ink blots are not bean-shaped crewmates with visors, not sticky goo balls in towers, not pocket monsters, not
  dust sprites from Japanese animation, not friendly ghosts.
- No genie lamp, no flying carpet, no "Arabian Nights" palace with onion domes and a sultan's city; no Moorish palace
  courtyard copied from a real monument; no cartoon desert prince.
- No style copied from a known Islamic children's cartoon or app (character shapes, colour schemes, title lettering); our
  type is Amiri and Tajawal, our lettering is set by the app, never drawn as a logo imitation.
- No blocky voxel worlds, no isometric puzzle-palace geometry, no endless-runner snowy hills.
- Names stay ours: أمين، مشمش، لقلق and the ten gang names; no character is renamed to echo a known one.

**Respect:**

- Never draw the reciters, the poet, scholars, prophets, companions or anyone praying; the reciters are lanterns.
- No Qur'anic text, verse text or any letters in generated images; the app sets all text with its fonts.
- A book that may be read as the Qur'an is always on a stand or held with respect, never on the floor, near feet, under
  a character, or used as a prop for a joke.
- No jokes in pictures about the Qur'an, reciters, scholars, the poet or prayer; the prayer screen has no art at all
  beyond the cream page and the button.
- No recognisable real city, landmark or flag (privacy: nothing says where Amin lives); no photo of anyone.

**Sound in pictures and motion:**

- No musical instruments, notes, bells, chimes or rhythm games anywhere in the art or the UI (no music at all).
- No flashing, no strobing, no full-screen light bursts, no screen shake.

**Kindness:**

- No red crosses, skulls, broken hearts, crying faces or "game over" imagery; no timers on child screens.
- No gendered avatar choice; no lipstick, bows or princess crowns as "girl" markers and no muscles as "boy" markers.
- No ads, no purchase buttons, no loot boxes, no slot-machine or wheel-of-fortune reward visuals.
