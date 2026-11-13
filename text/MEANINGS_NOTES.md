# Meanings of the Khaqaniya: method and notes (M1b)

Author: «M1b meanings (Opus max)», 2026-11-13. Output: `text/meanings.json` (contract in `docs/DATA.md`, plus top-level
`about` and `sources`). First reader: an 8-year-old Moroccan child; second: adults and teachers. To be checked by M2 and
the cross-model reviewers against the same sources.

## 1. Inputs actually read

| source | what was read | how |
|---|---|---|
| Verse text and numbering | the established `text/khaqaniya.json` (read only, landed during this work); before it landed, Ghouthani's 107 slides (`sources/media/ghouthani/frames`), all of them, on contact sheets, and T1's transcription `sources/media/editions/t1_notes/G_ghouthani_frames.txt` | every `words[].w` is checked by script to be a whole word or word sequence of `text/khaqaniya.json` (sadr + ajz), harakat and silah marks included |
| **al-Dani**, شرح قصيدة أبي مزاحم, ed. al-Umari, vol. 2 | the lemma page and the first 1–4 pages of commentary of every verse as **page images**, the TOC (pp. 549–562), plus the pages quoted below; the rest skimmed in the archive.org OCR (`t1_ia_sa71mir_djvu/v2_searchtext.txt`, readable, unlike the PDF text layer) | printed page = PDF page; paragraph numbers [ف] and riwaya numbers [ر] are al-Umari's |
| **هدي المجيد** (جمال الدين محمد شرف, دار الصحابة) | pp. 2–5 (title, authorship) and pp. 16–34 (the whole Khaqaniya commentary), page images | the commentary is Jamal Sharaf's «إعادة التحقيق والشرح» (p. 4 and its note); the bundled «القول السديد» is al-Husayni al-Haddad's |
| **Ghouthani's lectures** | full ASR transcripts: session 1 `5pW_de5wxX0` (vv. 1–20, explains 1–16), session 2 `rvKpoUZJSlk` (vv. 20–51), Tripoli 2026 `rcKChw2_Zx8` (biography, merits, vv. 1–11) | times in `cite` are the transcript's start seconds as mm:ss; the ASR has no harakat and errors, so only the sense is used, never wording |
| **Qaddouri al-Hamad**, أبحاث في علم التجويد | pp. 15–26 (biography, works, title), 35–36 (influence) | page images |
| **al-'Ubayd**, منظومة الخلاصة … وذكر الخاقانية | pp. 115–121 (text and footnotes) | page images |
| Shamela | غاية النهاية 2/320–321; تاريخ بغداد 15/62; معجم الشعراء ص380; النشر 1/317; كشف الظنون 1/354; لسان العرب (roots ستر، وتر، قدح، ذرب، كعب، حرى، مرر، نظم، زهر، خبر، نكر، ذخر) | local Shamela DB via `shamela_search` and the MCP |

Not used: Dani's short edition (31 verses, same text as vol. 2 for those verses; vol. 2 is the critical edition), `reviews/` (not read, as instructed).

## 2. Rules followed

- **Main meaning = al-Dani.** The `kid` line follows Dani's explanation; where هدي المجيد or Ghouthani differ, the `adult`
  text names the other view briefly. Nothing is attributed to a commentator unless it is on the cited page or minute.
- **`kid`:** 1–2 sentences, 13–23 words, one concrete picture (balloon, gold scale, arrow, necklace, curtain, hats…),
  gender-neutral (first person plural «نَحْنُ», «مَنْ», or the poet in the third person; no «أَنْتَ/أَنْتِ», no singular
  imperatives), no digits, brackets, quotation marks or symbols, full tashkeel with full i'rab. The TTS step should
  read the last word before each pause in its waqf form (musammi-promo convention); captions keep the vowels.
- **Qur'anic words inside `kid`** only where the verse itself is about them (vv. 33 «نُوحِيهَا», 41, 42, 47) or as a
  one-word example: check the TTS of those lines by ear, or let the game play the word from a recitation instead.
- **Warsh.** The first player is Moroccan, so examples were chosen to be true in Warsh as well as in Hafs
  (v35 «السَّمَاءِ» / «يُوقِنُونَ», not «يُؤْمِنُونَ», which Warsh reads without hamza; v36 «شَيْءٍ»; no «الصَّلَاةِ» example
  in v37). Where a verse describes a way that Warsh does not take (v36, Dani 2/395–398), the `adult` text says so and
  says that Warsh's way is a valid reading.
- **`words`:** quoted exactly as vocalised in `text/khaqaniya.json` (plain alif wasla, the silah marks ۥ ۦ kept where
  the text has them, e.g. v3 «نَوَيْتُهُۥ», no dagger alif on alif maqsura), so the game can find each word in the verse
  by plain string search; proclitics dropped when the chip reads better without them (v9 «الْحَرَمَيْنِ» from
  «فَبِالْحَرَمَيْنِ»: the check accepts a word that ends a token of the verse). Only exception: v25 «الزِّيَادَةَ»,
  which the verse splits across the hemistichs as «الزْ / زِيَادَةَ».
  Meanings ≤ 8 words, fully vocalised; imperatives of the verse are glossed with a verbal noun so the chip does not
  address a boy or a girl (e.g. «فَاحْذَرِ» → «أَمْرٌ بِالْحَذَرِ وَالِانْتِبَاهِ»).
- **`lesson`:** one line in the «we» voice, fully vocalised.
- **`cite`:** al-Dani as `2/16، ف6` (volume/printed page, paragraph), riwayat as `ر`; هدي المجيد by page; Ghouthani by
  session and mm:ss–mm:ss; Shamela books by printed volume/page plus the Shamela book id.
- **Checks run before each commit** (by a throw-away script; `text/meanings.json` itself is now the master, edit it
  directly): every letter of `kid`, `lesson` and `words` carries a mark except alif, alif maqsura, long-vowel waw/ya,
  the lam of the article before a sun letter and the silent waw of «عمرو»; `kid` has no digits, brackets, quotation
  marks, «ﷺ» or «أَنْتَ/أَنْتِ»; `kid` 10–26 words, `adult` 35–105 words (actual: 13–23 and 53–89); each gloss ≤ 8
  words; each `words[].w` is a whole word or word sequence of `text/khaqaniya.json`; the file is NFC and has no tatweel
  except in the Hijri «هـ». The script checks presence, not correctness: harakat and i'rab are for the reviewers.

## 3. Verse notes: disagreements and how they were settled

Verse numbers are Ghouthani's. al-Dani comments on vv. 2–4 together («كل ما في هذه الأبيات الثلاث إنما هو تنبيه … ولم نقصد
إلى شرح شيء من هذا، إذ هو معلوم», 2/15), on 17–19 together (2/193), 23–24, 25–26, 32–33, 42–43 and 44–47 together.

- **v1.** «مُعْجِبًا»: Ghouthani insists the إعجاب is the joy of the listener, not self-admiration (session 1, 04:20–05:00);
  Dani's hadith «من تواضع لله درجة …» is weak per al-Umari (2/14 n.1), so the adult text gives his sound شاهد from Muslim.
- **v2–4.** Dani does not explain them (2/15); meanings from هدي المجيد p. 17 and Ghouthani. **v4** Dani's text has
  «وذا سِتْرِ» for «وذا غَفْرِ» (2/15): mentioned in `adult` only.
- **v5.** «الأداء»: Ghouthani's distinction تحمّل/أداء (session 1, 10:59–11:16) added to the adult text; Dani's
  hadith «الماهر بالقرآن» is متفق عليه per al-Umari (2/19 n.3).
- **v6.** Dani's text «ولا كلُّ» for «وما كلُّ»; no effect on the meaning. Dani says the line is taken from Ali b.
  al-Jahm's «فما كل من قاد الجياد يسوسها» and that the whole poem follows that poem's metre and rhyme (2/55–56, ف22):
  used in v6 and in `about`.
- **v7.** «ذَوِي السَّتْرِ»: no gloss in Dani or هدي المجيد. Ghouthani glosses it «المستورين الذين سترهم الله» (2021) and
  «الذين ستروا علومهم وذواتهم» (2026), and mentions the reading «السَّبْر» (people who probe deeply; Qaddouri's text has
  «السبر»). The text may still change to «السِّتْرِ» after a listening check (coordinator, 2026-11-13), so the meaning is
  written to hold for both: «السَّتْر» masdar of سَتَرَ (to cover, keep safe: «يحب السَّتر والصون»), «رجل مستور وسَتِير أي
  عفيف»; «السِّتْر» what covers, and «ما لفلان سِتْر ولا حِجْر، فالسِّتر الحياء» (لسان العرب 4/343–344). Both give «people of
  modesty and decency», which is the kid gloss; the adult text names both vowels. Dani himself lists «عفاف وستر» among
  a reciter's virtues (2/206). **If the text changes, update `words[].w` of v7 to «ذَوِي السِّتْرِ»** (the meaning stays).
  Not pinned down by a commentary.
- **v8.** «الوِتْر» = God, the One: هدي المجيد p. 18 («رب العزة المتصف بالوحدانية») and لسان العرب 5/273–274 («إن الله
  وِتر يحب الوتر»); Dani is silent. What the «حقّ» is: Dani speaks of the seven as God's favour to us (2/70); هدي المجيد
  says their right is that we follow what they transmitted (p. 18). The kid line takes the latter.
- **v9.** al-Umari's note: the manuscript of the commentary and some copies have «ابن العلاء», which breaks the metre;
  his text keeps «ابنٌ للعلاء» (2/90 n.1). The kid
  line adds that Moroccans read the riwaya of Warsh from Nafi' (Ghouthani, session 1, 19:58–20:10): a fact the child
  knows from the mosque.
- **v10.** «وهو أبو بكر» = ʿĀṣim's kunya (هدي المجيد p. 19); not to be confused with his rawi Abu Bakr Shu'ba, so the
  kid line says «يُدْعَى أَبَا بَكْرٍ».

- **v11.** Ghouthani, 2021: praising the last of the seven praises them all (session 1, 22:22–22:27); Tripoli 2026:
  «it is said» the poet praised only al-Kisa'i because he loved his reading and read by it (50:05–50:20). What is
  documented is that Abu Muzahim was «إمامًا في قراءة الكسائي ضابطًا لها» (Dani, quoted in غاية النهاية 2/321); the
  adult text says that and gives Ghouthani's 2021 view, not the «it is said». The kid picture (people writing the vowel
  marks into their copies while he read) is Khalaf's report in Dani 2/128 ف75 («ينقطون مصاحفهم بقراءته»). al-Dhahabi
  took the «نَقْط» to be the i'rab dots of Abu l-Aswad, before the vowel signs; al-Umari doubts it, since al-Khalil's
  signs were already in use in al-Kisa'i's lifetime (2/128 n.1). «يَكْتُبُونَ الْحَرَكَاتِ» holds in both readings.
- **v12–13.** Terms: in the poem ترتيل = slow and حدر = fast, the old two-term usage (Ghouthani, session 1, 23:59–24:55).
  Dani adds a finer point used later in vv. 25 and 27: ترتيل serves reflection, تحقيق serves training the tongue
  (2/137). هدي المجيد p. 20 calls ترتيل the best of the ranks. No conflict.
- **v14.** Dani's text «وإنْ ما» = «وإمّا». Terminology clash, not a disagreement of substance: Dani allows «الحدر
  والهذرمة» for revision as long as the letters stay whole (2/150), while Ghouthani calls «هذرمة» the slurred fast reading
  that is *not* allowed (session 1, 27:55–28:08). The kid and adult texts avoid the word and keep the shared condition.
- **v15.** Dani's text «ليدري به» for «ليدريَه»; same sense. His grammatical note on «ما» (relative, not negative) is
  summarised in the adult text because it is the whole of his commentary on the line.
- **v16.** Ghouthani's slide gives «الذَّخْر» (main) and «الذُّخْر» (red); Dani's edition has the fatha (2/189);
  Lisan gives the masdar ذُخْرًا (4/302). Same meaning either way.
- **v17–19.** Dani comments on the three together and only on i'rab (2/193 ف87); Ghouthani only recites them
  (session 1, 38:03–38:30); هدي المجيد p. 21 has one sentence for all three. So the meanings of 17 and 18 rest on هدي
  المجيد and the plain sense, plus the poet's own lines in Dani 2/539 for the count. The hadiths Dani gives for
  i'rab are weak, one fabricated, per al-Umari (2/194–195 notes): the adult text of v19 says so rather than quoting them.
- **v20.** «القِدْح»: هدي المجيد p. 21 («السهم قبل أن يراش ويركب عليه النصل») and Lisan 2/556; Ghouthani: the shaft
  cut from a branch and trimmed straight (session 2, 03:52–04:11). Dani's commentary is on the reciter's conduct (2/201).

- **v21.** Dani's commentary turns to the reciter's conduct (thank God for the gift, do not court rulers with it,
  avoid «الألحان المطرِّبة», 2/206–207); هدي المجيد p. 21 and Ghouthani (session 2, 04:21–04:43) stay on practice
  making the tongue eloquent. The kid line keeps the verse's own point (practice adorns recitation).
- **v22.** «أذى الصدر»: Dani reads it bodily («ما يتولد في صدره من الأذى»، «قراءة القرآن تقطع البلغم», 2/218; the
  editor notes the phlegm saying is Ibn Sirin's, not a hadith, 2/218–219 n.1); Ghouthani gives a bodily and an inner
  sense and warns against puffing the chest (session 2, 05:11–06:08). The kid line («تُرِيحُ الصَّدْرَ مِمَّا يُتْعِبُهُ») fits both.
- **v23–24.** Dani comments on both together (ف92–95). His text «فيه إذا يجري» is Ghouthani's; Qaddouri's «مِن فيك إذ
  يجري» is not used. Hamza's «لا، جعلني الله فداك» (2/226) is in the adult text of v24 because it is Dani's own
  illustration of how the masters met a lahn.
- **v25–26.** Dani comments on both together (ف98). v25 is the joined verse (the article «الزْ» ends the sadr, «زِيَادَةَ»
  opens the ajz): `words` gives «الزِّيَادَةَ» whole, flagged in the generator as joined. v26 is Ghouthani's «البيت الذهبي»
  (session 2, 11:22–13:23; Tripoli 2026, 31:41–32:23); his story of memorising it is in the adult text because the
  game honours him as the reciter.
- **v27.** Dani speaks as the teacher who «takes» the reading from a student (10 verses in tahqiq until mastery; his
  own preference: 5 in تلقين, and no more than a sixtieth of the Qur'an in عرض, 2/262–263); Ghouthani applies it from the
  student's side, 10 verses per sitting (session 2, 13:23–14:47). Same rule; the kid line uses «we read to the teacher».
- **v28–29.** Definitions from Dani (2/285–290, 2/308–309), هدي المجيد pp. 23–24 agrees («الإدغام فيه تشديد، والإخفاء
  ليس معه تشديد»). Spelling «إذًا» (text) vs «إذنْ» (Dani, هدي المجيد): no effect. v29: «فَفَرِّقْهُ» (text, Dani) vs
  «فعرِّفه» (some copies per Dani 2/308 n.1; هدي المجيد's text): same lesson.
- **v30.** Dani's text «بجزمها … بالرفع» for «لجزمها … للرفع»: same sense. Dani's three causes of sukun (عامل، بناء،
  تخفيف) are in the adult text; the kid picture of a «hat» each letter wears matches the game's S2 «hats» special.

- **v31.** «واقطعن تارة وصل»: Dani (what is cut and what is joined among the alifs, i.e. hamzat al-qat' and alif al-wasl,
  2/337–338) and Ghouthani (session 2, 19:09–19:58, examples «أنزل، أحمد» / «ابن، امرأة») agree; هدي المجيد reads it as
  المقطوع والموصول of the rasm when stopping (pp. 24–30). Kid line follows Dani and Ghouthani (with Ghouthani's
  non-Qur'anic examples أحمد / ابن); the adult text names هدي المجيد's reading. «ميّز بين مدك والقصر»: Dani's two
  possibilities (2/358 ف194) are both in the adult text.
- **v32–33.** Ghouthani: for the early scholars «حروف اللين» are the madd letters; later «لين» was kept for و/ي sakin
  after a fatha (session 2, 21:11–21:43). Dani says the same in substance (2/362–363). Text variant «تَسْكُنَانِ» (text)
  / «يَسْكُنَانِ» (several editions): no effect.
- **v34.** Three readings of «اشدد الفكّ»: Dani, separating and clarifying each letter, «ففكّ الحروف بيانها وإخراج بعضها
  من بعض بيسر وتؤدة» like freeing a captive (2/373–374, main, in the kid line); Ghouthani, the jaw held firm on doubled
  letters (session 2, 24:28–24:53, in the adult text); هدي المجيد, do not undo a doubled letter without a sound riwaya
  (p. 30, not used). The word gloss holds both main readings. Al-'Ubayd prints «واشدد الحرف عامدًا» and glosses
  «عامدًا»: «قاصدًا التعمّل والتكلّف في نطق المشدد، لا التنطّع» (p. 120 n.1). «ولا تفرطن في فتحك الحرف والكسر»: Dani, no
  excess in fatha or imala (2/374); هدي المجيد, do not stretch a vowel into a madd letter (p. 30); Ghouthani, the quality
  of the vowel (session 2, 25:00–27:35). The kid line («no exaggeration in the fatha or the kasra») fits all three.
- **v35.** Example chosen for Warsh: Dani's rule makes «يُؤْمِنُونَ» hamzated, but Warsh reads it «يُومِنُونَ», so the kid
  line uses «السَّمَاءِ» (hamza in every riwaya) and Dani's own non-hamzated «يُوقِنُونَ» (2/392). Dani's reports that
  masters lightened the hamza in prayer («من علامة الأستاذية ترك الهمز في المحاريب», 2/389) are not in the kid text.
  هدي المجيد and al-'Ubayd's note have «ما كان يخفى لدى النبر» for «ما كان لحنًا»: not used.
- **v36.** Dani's examples are across words and concern Warsh's naql (2/395–398); هدي المجيد's are inside a word
  («شيء، سوء», p. 31). The kid line uses «شَيْءٍ» because the hamza there is pronounced in every riwaya, Warsh included;
  the adult text explains Dani's point and says that Warsh's naql is a valid mutawatir reading (Ghouthani, session 2,
  30:02–30:45). Text variant «يَكُ» / «تَكُ»: no effect.
- **v37.** Dani's accepted reading (do not over-thicken ra and lam) is the kid line; his rejected one (thin them
  everywhere) is in the adult text with his reason. هدي المجيد's example «الصلاة» for a thin lam is Hafs-only (Warsh
  thickens it, as Dani himself reports, 2/414), so it is not used. «ينذرب»: Lisan 1/385; al-'Ubayd notes «يندرب» (p. 121 n.1).
- **v38.** Ghouthani's tongue-twister for the throat letters (session 2, 34:45–35:40) is garbled in the ASR, so it is
  not quoted. The kid example «عَهْدٍ» is a plain word with ع and ه side by side, after Ghouthani's «أعهد / بعهد».
- **v39.** Two layers, both Dani's: stop where the sense is complete (2/421–422) and stop on the written form of the
  mushaf, «الذي أشار أبو مزاحم في هذا البيت إلى اتباعه» (2/453 ف297). Ghouthani's example «امرأة / امرأت» (session 2,
  36:22–37:38) is in the adult text.
- **v40.** Mim before ba: Dani's shaykhs differ, ikhfa or izhar (2/457–458); هدي المجيد prefers ikhfa (p. 32); Ghouthani
  teaches ikhfa shafawi (session 2, 38:13–38:20). The kid line keeps to the verse's own rule (no idgham of mim into
  another letter) and does not take sides on the ba.

- **v41.** Dani's commentary is a refutation: some read «مشبعًا» as lengthening the damma into a waw (a report from
  Egyptian and Qayrawani shaykhs from Warsh), which he calls «من عظيم اللحن»; «الإشباع» here is giving the damma in full,
  without the اختلاس that weakens it (2/462–465). هدي المجيد says the same (p. 32). Ghouthani's image of the waw that
  «snatches» the damma of the dal (session 2, 39:08–39:17) is the kid picture. «في المرّ»: no gloss in Dani or هدي
  المجيد; Ghouthani: the Maghribi term for الوصل (session 2, 38:30–38:51); Lisan: المرّ = المرور (5/165). Kept.
- **v42.** **Word not pinned down: «وَاسْتَجْرِ».** The text has the jim, like هدي المجيد, al-'Ubayd and the verses as quoted
  in النشر 1/317; al-Umari's Dani prints «واستحر» with ha, unpointed, in the lemma and in the commentary (2/472, 2/475;
  T1's zoom agrees). Dani is tentative: the poet may
  have meant that this madd is a little shorter than the madd before a hamza, «هذا إن كان أتى به لتأثير معنى ولم يأتِ به
  حشوًا للقافية» (2/475). Ghouthani gives two readings, «استجرِ» from الجرأة (be bold in stretching it) and «استحرِ» from
  التحرّي (take care) (session 2, 40:10–40:21). Lisan has حَرَى = نَقَصَ (14/172), which would fit Dani's gloss, but Dani
  does not name a root, so I do not claim it. The `words` entry says plainly that the commentators differ; the kid
  line and lesson only say «stretch it», on which all agree (Dani: «فلا خلاف في زيادة التمكين لهن», 2/472; Ibn al-Jazari:
  the readers agree on lengthening it fully, النشر 1/317, which also reports al-Jajani citing these two verses for the
  lowest degree).
- **v43.** Text «فَصَارَا» (dual, Ghouthani) vs Dani's «فصار»: same sense. «ذو الخُبْر» = the expert (Lisan 4/227; Ghouthani:
  أهل الخبرة, session 2, 41:41–41:50).
- **v44–48.** Dani comments on 44–47 of his own order together (2/486–488) and puts «وإظهارك التنوين» before «ولا تشدد
  النون» (his 47 and 48); Ghouthani and هدي المجيد have the order of the text. Each `cite` says which number the line
  has in Dani. v46: Dani's text «فدَيتُك بيّنها» for «فدونك» (2/486), named in the adult text.
- **v48.** «الكاعب البِكر»: Dani is silent. هدي المجيد: «أي بالحور العين» (p. 34); Ghouthani: the maidens of Paradise,
  added by the poet to keep his hearers awake after dry rules (session 2, 44:56–46:12). The literal sense (a young
  woman, Lisan 1/719) is given in the adult text only; the kid line and the word gloss say «a beautiful reward of the
  bliss of Paradise», which is what both commentators mean, without the image. **Reviewers: please check that this
  softening is acceptable.**
- **v49.** Dani's edition prints «أسماءُ» where the text has «أشياءُ»; his own commentary says «الأشياء اللطيفة» (2/502).
  His list of what the poet left out, and al-Umari's remark that the poem is «أول نظم في التجويد، بل أول ما أُلّف فيه»
  (2/503 n.1), are in the adult text.
- **v50–51.** Dani comments on both together (2/532–539 ف356): the duty of praying for one's teachers, the hadith of the
  divine descent in the last third of the night «حتى يطلع الفجر» (why dawn), and the hadith of Abu al-Darda' (Muslim).
  Final prayer screen rule (GAME_DESIGN §1.5): the kid lines of 50–51 are plain and sincere, no image or joke.

## 4. Words I could not pin down

- v42 «وَاسْتَجْرِ»: meaning disputed (see v42); glossed as «a rhyme word whose meaning the commentators dispute».
- v7 «ذَوِي السَّتْرِ» / «السِّتْرِ»: no commentary gloss; dictionary sense used (see v7).
- v41 «فِي الْمَرِّ»: no gloss in Dani or هدي المجيد; Ghouthani + Lisan (see v41).
- v34 «الْفَكَّ»: two readings (separating the letters / the jaw); the gloss gives both.
- v8 «الْوِتْرِ»: هدي المجيد + Lisan, not Dani.

## 5. `about`: facts and where they come from

- Name, Baghdad, death in Dhu l-Hijja 325, father vizier of al-Mutawakkil, «ثقة دينًا من أهل السنة», ring «دِنْ بالسنن موسى
  تُعَن»: تاريخ بغداد 15/62 (6987). Birth 248: المرزباني, معجم الشعراء ص380; Qaddouri p. 18 follows him.
- «إمام مقرئ مجود محدث أصيل ثقة سني»، «كان إمامًا في قراءة الكسائي ضابطًا لها» (from Dani), «ترك الدنيا وأعمل نفسه في
  رواية الحديث وأقرأ الناس»، «بصيرًا بالعربية شاعرًا مجودًا»، and **«هو أول من صنّف في التجويد فيما أعلم، وقصيدته الرائية
  مشهورة، وشرحها الحافظ أبو عمرو»**: غاية النهاية 2/320–321 (3689). Ibn al-Jazari hedges («فيما أعلم»), so the kid text
  says «يَرَاهَا الْعُلَمَاءُ أَوَّلَ مَا كُتِبَ فِي التَّجْوِيدِ», not a flat «the first». Echoed by كشف الظنون 1/354, Qaddouri p. 23
  («يشير إليها العلماء على أنها أول مؤلَّف كُتب في علم التجويد»), al-Umari (2/503 n.1) and Ghouthani (session 1, 00:50).
- The poet's own claim «قد قلتُ قولًا ما سُبِقتُ بمثلِه في وصف حِذق قراءة القرآن» and «أبياتها أحد وخمسون»: five lines
  Dani heard from Faris b. Ahmad and appended to his commentary (2/539 ف357).
- Why Dani commented on it: «استحسان خواص الناس وعوامهم لها، وشدة اهتبال قراء القرآن بها، وأخذهم أنفسهم بحفظها …» (2/8 ف2).
- Metre and rhyme taken from Ali b. al-Jahm's Rusafiyya (Dani 2/55–56 ف22); metre الطويل also in Ghouthani (session 1, 02:24).
- The poet named no title; Dani called it «قصيدة أبي مزاحم الخاقاني التي قالها في القراء وحسن الأداء» (Qaddouri p. 26).

## 6. For the reviewers

- Check every Arabic line of `kid`, `lesson` and `words` for harakat and i'rab (the script only checks presence).
- Check the attributions: each «قال الداني» paraphrases the page cited in that verse's `cite`; quotation marks «» in the
  adult texts mark wording taken from the source.
- Points where I chose and could be wrong: v7 (السَّتر), v8 (the حق of the seven, from هدي المجيد), v34 (الفكّ), v36 (example
  «شَيْءٍ» instead of Dani's cross-word examples), v42 (واستجر), v48 (the softened «الكاعب البكر»).
- Qur'anic words in `kid` (vv. 33, 35, 36, 41, 42, 47) need the TTS checked by ear.
- The ASR transcripts of Ghouthani are rough; the minute ranges are right, the wording in my notes is a paraphrase.
