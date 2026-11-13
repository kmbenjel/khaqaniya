# الخاقانية: sources, conventions and every disagreement

Text owner: T1b (Opus max), 2026-11-13. The text in `text/khaqaniya.json` is **Sheikh Yaḥyā al-Ghawthānī's ḍabṭ as shown on
the slides of his video, black reading**, checked word by word and ḥaraka by ḥaraka against eight witnesses (six editions, two online texts), his
own lessons, Shamela quotations and, for the doubtful vowels, an acoustic probe of his recitation. 51 verses, nothing
added, nothing missing; the metre check (`text/work/scan.py`, output `text/metre.md`) passes on all 102 hemistichs.

## 1. The base: Ghouthani

| what | details |
|---|---|
| **Video (base)** | «قصيدة رائية الخاقاني في القرَّاء وحسن الأداء بصوت د. يحيى الغوثاني \| الخاقانية بجودة عالية 4k», channel «د. يحيى الغوثاني», YouTube **`3XtXhX2jgLQ`** (https://www.youtube.com/watch?v=3XtXhX2jgLQ), uploaded 2022-11-16, 12:04. Basmala and title 0:00–0:31, verses 0:35.05–11:45.26, closing credit 11:49–12:04. One hemistich per slide, fully vocalised (Mushaf-style font), verse number on the sadr slide; second readings in **red** over the black text. Frames read from the 4K stream: `sources/media/ghouthani/frames/` (map: `sources/ghouthani/FRAMES.md`). |
| His own statement on the colours | lesson `rcKChw2_Zx8` (2026), 25:45–26:03: «ثم ضبطتُ المتن بأشهر ضبطين وقفتُ عليهما من خلال مقابلة النسخ … واحد أسود والثاني أحمر حتى يلفت النظر أن فيها نسخة أخرى، ووضعتُ في الهامش فوارق النسخ» (ASR, `sources/ghouthani/lectures/`). |
| Lessons on the poem (ASR, no ḥarakāt) | `5pW_de5wxX0` and `rvKpoUZJSlk` (2021 commentary sessions), `rcKChw2_Zx8` (2026 reading in a mosque). Used as evidence for his readings: v4 «قرأتُ: غَفْرِ» (rcK 46:49), v7 «ذوي السَّتر أو السِّتر … يجوز» (5pW 12:12–12:25) and «أو السَّبْر، رواية السبر … أولي السبر» (rcK 48:36–49:09), v8 «الوِتر أو الوَتر» (rcK 49:36), v16 «الذخر هو الادّخار» (5pW 32:06), v36 «وإن يكُ» (rvK 30:56), v33 «تسكنان» (rvK 21:50), v42 «واستجرِ أو واستحرِ … فيها روايتان … من التحرّي» (rvK 40:05–41:06), v43 «فصار» (rvK 41:34, the slide and the video have «فصارا»). |
| His printed edition | «منظومة رائية الخاقاني – الخاقانية»، تحقيق د. يحيى عبد الرزاق الغوثاني، دار الغوثاني للدراسات القرآنية 2023 (16 pp., ISBN 9789933685355): app/paper only, **not seen**. |

Per-verse timings in the video (from `sources/ghouthani/segments.json`; the clips in `audio/` use the first take of repeated hemistichs):

| v | start | sadr → ajz | end | slide notes |
|---|---|---|---|---|
| 1 | 0:35.05 | 0:39.53 | 0:44.70 |  |
| 2 | 0:45.42 | 0:49.92 | 0:55.16 |  |
| 3 | 0:55.90 | 1:00.38 | 1:05.98 |  |
| 4 | 1:06.72 | 1:11.07 | 1:16.52 |  |
| 5 | 1:26.86 | 1:31.63 | 1:37.04 |  |
| 6 | 1:37.84 | 1:42.76 | 1:47.71 |  |
| 7 | 1:48.77 | 1:53.12 | 1:57.94 | silent recap slide 1:59–2:13 |
| 8 | 2:17.84 | 2:22.43 | 2:32.81 | ajz said twice: 2:23.09–2:28.24 / 2:28.24–2:32.81 |
| 9 | 2:33.77 | 2:38.27 | 2:48.04 | sadr said twice: 2:33.77–2:38.27 / 2:38.27–2:42.39 |
| 10 | 2:49.03 | 2:53.58 | 2:58.51 |  |
| 11 | 2:59.28 | 3:03.82 | 3:09.10 |  |
| 12 | 3:19.06 | 3:23.40 | 3:28.75 |  |
| 13 | 3:29.22 | 3:34.02 | 3:39.11 |  |
| 14 | 3:39.84 | 3:44.58 | 3:49.38 |  |
| 15 | 3:50.18 | 3:54.94 | 4:00.60 |  |
| 16 | 4:01.59 | 4:06.43 | 4:16.79 | ajz said twice: 4:06.69–4:12.07 / 4:12.07–4:16.79 |
| 17 | 4:17.45 | 4:22.18 | 4:27.29 |  |
| 18 | 4:28.26 | 4:32.90 | 4:43.38 | ajz said twice: 4:33.71–4:38.76 / 4:38.76–4:43.38 |
| 19 | 4:44.43 | 4:49.25 | 4:54.53 |  |
| 20 | 4:55.37 | 4:59.84 | 5:04.80 |  |
| 21 | 5:05.60 | 5:09.68 | 5:14.75 |  |
| 22 | 5:15.48 | 5:20.01 | 5:25.32 |  |
| 23 | 5:37.92 | 5:42.31 | 5:47.44 |  |
| 24 | 5:48.13 | 5:52.83 | 5:58.18 |  |
| 25 | 5:58.86 | 6:03.10 | 6:07.93 | one slide for the whole verse |
| 26 | 6:08.53 | 6:13.23 | 6:18.46 |  |
| 27 | 6:19.09 | 6:23.67 | 6:28.81 |  |
| 28 | 6:40.50 | 6:45.06 | 6:50.12 |  |
| 29 | 6:50.75 | 6:55.17 | 7:00.14 |  |
| 30 | 7:10.86 | 7:15.20 | 7:21.01 |  |
| 31 | 7:21.87 | 7:26.53 | 7:31.43 |  |
| 32 | 7:40.18 | 7:44.45 | 7:50.02 |  |
| 33 | 7:50.87 | 7:55.44 | 8:06.08 | ajz said twice: 7:56.35–8:01.57 / 8:01.57–8:06.08 |
| 34 | 8:06.86 | 8:11.69 | 8:17.25 |  |
| 35 | 8:17.97 | 8:22.55 | 8:27.56 |  |
| 36 | 8:28.39 | 8:32.39 | 8:37.09 |  |
| 37 | 8:48.68 | 8:52.89 | 8:58.01 |  |
| 38 | 8:58.43 | 9:03.12 | 9:07.95 |  |
| 39 | 9:08.66 | 9:13.07 | 9:17.88 |  |
| 40 | 9:18.51 | 9:23.04 | 9:28.33 |  |
| 41 | 9:28.87 | 9:33.16 | 9:38.23 |  |
| 42 | 9:47.12 | 9:51.46 | 9:56.21 |  |
| 43 | 9:57.17 | 10:01.54 | 10:06.35 |  |
| 44 | 10:16.09 | 10:20.30 | 10:25.52 |  |
| 45 | 10:26.56 | 10:31.43 | 10:36.56 |  |
| 46 | 10:37.29 | 10:41.91 | 10:46.70 |  |
| 47 | 10:47.04 | 10:51.75 | 10:57.09 |  |
| 48 | 10:57.60 | 11:02.07 | 11:06.84 |  |
| 49 | 11:15.76 | 11:19.88 | 11:24.80 |  |
| 50 | 11:25.55 | 11:29.92 | 11:34.63 |  |
| 51 | 11:35.62 | 11:40.06 | 11:45.26 |  |

Sections are the chapters of his video description (0:00 المقدمة · 1:21 حسن الأداء والقراءة · 2:13 ذكر القراء السبعة ·
3:14 مراتب التلاوة · 5:31 أهمية حفظ القرآن ومعرفة اللحن · 6:34 أحكام الإظهار والإدغام والإخفاء · 7:05 الحروف السواكن والمتحركة ·
7:36 المد · 8:41 تنبيهات على بعض الحروف المفردة · 9:43 المد اللازم · 10:11 الإظهار · 11:11 الخاتمة); each chapter time falls in
the pause before its first verse (5, 8, 12, 23, 28, 30, 32, 37, 42, 44, 49).

## 2. Printed witnesses (sigla used below)

| siglum | edition | editor / author, publisher, year | pages used | what it represents |
|---|---|---|---|---|
| **A** | أبو عمرو الداني، «شرح قصيدة أبي مزاحم الخاقاني التي قالها في القراء وحسن الأداء»، المجلد الثاني: الكتاب المحقق | تحقيق غازي بن بنيدر العمري (رسالة ماجستير، جامعة أم القرى، 1998؛ طبعها دار المآثر بالمدينة، سنة الطبع غير مؤكدة); PDF archive.org `sa71mir_gmail_201602` | vol. 2 pp. 9–532 (verse at the head of each section: v1 p9, v2–4 p15, v5 p16, v6 p29, v7 p57, v8 p70, v9 p90 … v50–51 p532; list in `text/work/witnesses/A_dani_umari.txt`); vol. 1 pp. 237–246 (study, **A2**) | **Dani's riwaya**: الداني ← أبو عبد الله محمد بن عبد الواحد البغدادي ← أبو الفرج محمد بن إبراهيم الشنبوذي ← أبو مزاحم (vol. 2 p9). Partial tashkeel. |
| **B** | غانم قدوري الحمد، «علم التجويد: نشأته ومعالمه الأولى» ضمن «أبحاث في علم التجويد» | دار عمار، عمّان، 1422هـ/2002م (first in مجلة كلية الشريعة، بغداد، ع6، 1400هـ); PDF archive.org `eng_677` | pp. 27–34 | First scholarly edition, from **B-CB** = Chester Beatty 3653/10 (Dani's commentary, vv. 1–31 only) and **B-Az** = Azhar [192] 16230 (complete). **B07** = his corrections on ملتقى أهل التفسير, 27/01/2007 (with al-Bawwāb's edition **Bw**, المورد 14/1, 1405هـ, pp. 115–128, and an Indian MS in Maghribi script). |
| **D** | عبد الله بن صالح العبيد، «منظومة الخلاصة في التجويد وشرحها وذكر الخاقانية ومعارضاتها» | ط1 1440هـ/2019م; PDF archive.org `Mndhma-Khlsa-Tajweed` | appendix pp. 115–123 (PDF 118–126) | Fully vocalised; based on Dani's commentary (Chester Beatty, King Fahd Library copy) and the editions of al-Qāriʾ, ʿUzayr Shams and Hamad (his p115). |
| **E** | محمد بن علي بن خلف الحسيني الحداد، «هدي المجيد في شرح قصيدتي الخاقاني والسخاوي في التجويد» | مراجعة وتقديم جمال محمد شرف، دار الصحابة للتراث بطنطا (no year printed); archive.org `alfirdwsiy2018_gmail_1484` | pp. 16–34 | Text of **al-Qāriʾ**'s edition (قصيدتان في تجويد القرآن، 1402هـ; single MS Ẓāhiriyya 46 = **al-Ājurrī's riwaya**), so an indirect witness of al-Qāriʾ. Careless typesetting. |
| **F** | «المنظومة الخاقانية»، in a collection of mutūn | مكتبة أولاد الشيخ للتراث (مصر); archive.org `khaqanea` (`matn_0021.pdf`) | pp. 29–32 | Popular vocalised text in coloured naskh. Low-resolution scan. |
| **H** | عمرو بن هيمان المصري، «القصيدة الخاقانية؛ في حُسْن الأداء، ومدح القرّاء» | ط1 1443هـ/2021م (سلسلة «تكحيل العيون بجامع المتون»), 4 pp.; https://amribnhaiman.blogspot.com/2021/09/pdf.html | pp. 1–4 | Eclectic text with an apparatus naming **H-Aj** (al-Ājurrī's riwaya, Ẓāhiriyya 3782 = ʿUmariyya 46, samāʿs 599 and 624 هـ), **H-Dn** (Dani's riwaya: Chester Beatty 3653, copied 859 هـ, and A) and **H-Ms** (الشهرزوري، «المصباح الزاهر» 2/737 no. 1485, ed. al-Dawsarī). Al-Ājurrī says the poet vocalised his copy himself (H p1). |
| **K1** | «رائية الخاقاني في التجويد» | ketabonline book 102568 | 4 pp. | Popular vocalised text. |
| **K2** | «أول مصنف في التجويد» | ketabonline book 15976 | 3 pp. | Hamad's text (B), vocalised by «أم حمزة». |
| **Sh** | عبد الرحمن الشهري، «قصيدة أبي مزاحم الخاقاني (ت325هـ) في التجويد وتحقيقاتها»، ملتقى أهل التفسير 20/01/2007 | mtafsir.net thread 10191 | – | Lists where **Q** (عبد العزيز القارئ 1402هـ) and **ʿŠ** (محمد عزير شمس، «روائع التراث» pp. 79–112, MSS Ẓāhiriyya 46, Azhar 274, Umm al-Qurā 72/6, Rampur 279, Chester Beatty) differ from B. |

Known but not seen: Boneschi 1938; ʿUzayr Shams and al-Qāriʾ directly (only through Sh and E); al-Bawwāb directly (only through B07);
al-Miṣbāḥ directly (only through H; complete at 4/1539–1547 per A2); Ghouthani's 2023 edition.
Page images re-read by T1b where witnesses differ: see `text/work/witnesses/README.md` (corrections to T1's notes: H v16, H v18, F v7).

**Shamela quotations** (book id : page): al-Dhahabī, معجم الشيوخ الكبير [12531] 2/150: vv. 1–3, 5 («لِمَوْلَايَ»). Ibn al-Jazarī, غاية النهاية
(al-Khānjī) [12040] 2/86 and (al-Ṣaḥāba) [30040] 2/1005: v1 sadr, cited in a later poem. Hamad, محاضرات في علوم القرآن [12917] p158: v1 and the
count 51. المجيدي، إذهاب الحزن [9764] p454: vv. 5–7 («وما كل»، «ذوي الستر»); p268: vv. 13–14 («لبثنا»، «ومهما حدرنا»); p242: vv. 23–24 («من فيك
إذ جرى»، «وما للذي»). مجلة الجامعة الإسلامية [4473] 43/393: v6 («وما كل»); 43/422: v12 sadr; 43/429: vv. 23–24 («من فيك إذا يجري»، «وما للذي»).
الجرمي، معجم علوم القرآن [38068] p158: vv. 5–6. مجلة البحوث الإسلامية [8322] 70/367: v6. الوجيز في حكم تجويد الكتاب العزيز [21557] pp. 22–23, 56, 65:
vv. 5–7, 12, 23–24. al-Sakhāwī, جمال القراء [10460] p643: v12. Ibn al-Jazarī, النشر [22642] 1/317: vv. 42–43 (from al-Jājānī: «وإن حرفُ مدٍّ»، «فصارَ»،
«ذو الخَبَر»); 2/129: v39. al-Qasṭallānī, لطائف الإشارات [30041] 2/403: v39; 2/260: vv. 42–43. عقيلة، الزيادة والإحسان [150960] 3/453: v39; 4/63:
vv. 42–43 («مدغما»). فتاوى الشبكة الإسلامية [27107] 2/1374: v43 («فصارا»). al-Hudhalī, الكامل [36957] p96: vv. 38, 37. أبو جعفر البلوي، الثبت
[10736] p472: Ibn Ghāzī (Meknes, d. 919هـ) quotes v16 in his ijāza of 896هـ. Raw hits: `text/work/witnesses/S_shamela_raw*.txt`.

Not part of the poem: the five verses in al-Kāmil «قد قلتُ قولًا ما سُبقتُ بمثله …» (A p539, H p1, B07) are a separate epilogue by
the poet; Ibn al-Jazarī's «فهذا مقالي واضحا وبيانه …» is another poet's poem quoting v1. Verse count: 51 in the poet's own line
(v18), in the epilogue («أبياتها أحدٌ وخمسون»), in every complete witness and in the video. B-CB (Dani's commentary) stops at 31.
Order: as Ghouthani in B, D, E, F, H, K1, K2; A (Dani) has 48 before 47; B-Az has 7 before 6 and 14 before 13.

## 3. Orthographic conventions (decided once)

1. **Standard orthography, not the Mushaf's.** The slides use a Mushaf font (ٱ, small ۥ/ۦ for ṣila, ۟ on the silent waw of
   «أُولِي», dagger alif on ى). The text keeps his vowels and writes them in standard spelling, like every printed witness and
   the owner's `~/projects/alfiya`, so one convention serves the game and the shatr site.
2. **Hamzat al-waṣl** is a plain alif U+0627 with no mark (DATA.md allowed ٱ because the base has it; chosen against for the
   reason above). The scanner rejects U+0671.
3. **Article**: sukun on the lam before a qamarī letter («الْحِجْرِ»); unmarked lam and shadda on the next letter before a shamsī
   letter («الشِّعْرِ»). «الَّذِي، الَّتِي» are spelt with one lam. «اللَّه» has shadda and vowel on the lam, no dagger alif.
4. **Hamzat al-qaṭʿ** always written with seat and ḥaraka (أَ إِ أُ ؤ ئ ء); madda in «الْقُرْآنِ، آخِذًا، آيَاتِهِ، كَآخِرِ».
5. **Long vowels** unmarked (no sukun on madd letters); sukun on the w/y of diphthongs («عَوْنِي، بَيْتًا»). Alif maqṣūra without
   dagger alif («عَلَى، مُوسَى»).
6. **Dagger alif** U+0670 with its fatḥa only where the long ā is not written, as on the slides: «ذَٰلِكَ» (v16), «إِلَٰهِي» (v17),
   «فَهَٰذِي» (v46).
7. **Tanwīn al-fatḥ** on the letter before the alif («مَقَالًا»). Tanwīn is kept before a waṣl and read with a kasra
   («وَعَاصِمٌ الْكُوفِيُّ» = wa-ʿāṣimuni l-kūfiyyu; the slide writes a small red «نِ»).
8. **Rhyme**: kasra on the final rāʾ without tanwīn («حَدْرِ، عُذْرِ، عَشْرِ»); written ي kept («عُمْرِي، مُقْرِي، يَدْرِي»); the silent و of
   «عَمْرِو». The rhyme vowel is lengthened in recitation (ـرِي).
9. **Ṣila** of the pronoun hāʾ and of mīm al-jamʿ is not written (metre.md shows it). The mīm keeps its ḍamma where the base has it
   («مِنْكُمُ يَدْرِي»، «رَبِّهِمُ الْوِتْرِ»). «وَهْوَ، فَهْوَ» with sukun on the hāʾ, as on the slides.
10. **Assimilation** written only where the base writes it: «مَدَدتَّ» (v43, also D) and «أَلَّا» (v27); elsewhere standard
    («إِذْ دِينُ»). v28 «إِذًا» as on the slide (most editions «إِذَنْ», same sound).
11. **v25** is a run-on verse: the sadr ends «فَاحْذَرِ الزْ» and the ajz starts «زِيَادَةَ» (the doubled zāy of «الزِّيَادَةَ» is
    split, as in Ghouthani, D, H, K1).
12. **«أُولِي» (v1)**: the waw is written but silent (li-ʾulī); readers and any TTS must not say «ʾūlī».
13. **No punctuation** inside `sadr`/`ajz` (the slides' teaching colons, commas and the dashes of v50 are left to layouts); no
    tatweel; NFC (so a fatḥa is stored before a shadda; renderers reorder). Proper names and Quran quotations are plain text
    (v41 «إِيَّاكَ نَعْبُدُ», v42 «الْحَمْدِ», v47 «مِنْ خَيْلٍ» are noted in `notes`).

## 4. Disagreements, verse by verse

Sigla: **G** slide (black), **G-red** slide (red), **G-rec** his recitation in the video, **G-lec** his lessons; witnesses as in §2.
«kept» is what `text/khaqaniya.json` has. Orthographic trivia (إِذَنْ/إِذًا spelling, missing ḥarakāt, obvious misprints in K1/K2)
are mentioned only where they touch a reading.

1. **v1** No variant in any witness. Kept.
2. **v2** B-CB «والفجر» (slip, B's footnote); al-Dhahabī «لِمَوْلَايَ». Kept «بِمَوْلَايَ … وَالْفَخْرِ» (G and all).
3. **v3** B's first edition and K2 «عِلْمَ مَا» (misreading; Sh and B07: «عَلَى مَا»). «وَحِفْظِيَ» with fatḥa (G, D, H, K1; the metre needs it).
   Kept G.
4. **v4** «وَذَا غَفْرِ» G, G-lec («قرأتُ: غَفْرِ»), B, D, E, F, H (= H-Aj), K1, K2; «وَذَا سِتْرِ» A (= H-Dn). Kept G.
5. **v5** No variant (K2 misprints «الأجْرٍ»). Kept.
6. **v6** «وَمَا كُلُّ» G, E, F, H-Aj, Shamela quotations (إذهاب الحزن، مجلة الجامعة الإسلامية، معجم علوم القرآن، الوجيز، مجلة البحوث);
   «وَلَا كُلُّ» A, B, D, H (text), K1, K2. Dani (A2 p245) says the line imitates ʿAlī ibn al-Jahm's «فما كلُّ من قاد الجيادَ يسوسُها ∴
   ولا كلُّ من أجرى يقال له مُجري», which favours «ولا». Kept G «وَمَا» (his base, al-Ājurrī's riwaya; same sense).
7. **v7** sadr: «سُنَّةٌ» G, G-rec, A, D, E, F, H, K1, B07; «سُنَّةً» G-red, B (first ed.), K2. ajz: «ذَوِي السَّتْرِ» G, A, E, F (probable,
   low-res); «ذَوِي السِّتْرِ» **G-red and G-rec** (see §5), H, K1, K2, Q, ʿŠ, the Indian MS (B07); «ذَوِي السَّبْرِ» B-Az, D, Bw; «أُولِي السَّبْرِ» B07;
   H-Ms «الْمُقْرِئِينَ الْأَوَّلِينَ». G-lec gives both «السَّتر/السِّتر» and mentions «السَّبر». **Kept the black «سُنَّةٌ … السَّتْرِ»**;
   variants hold «سُنَّةً» and «السِّتْرِ». Proposal P1 below.
8. **v8** «الْوِتْرِ» G, G-rec take 1, all witnesses; «الْوَتْرِ» G-red (and G-lec). B and K2 «رَبِّهُمُ لِلْوِتْرِ» (corrupt). Kept G.
9. **v9** sadr «ابْنُ الْكَثِيرِ» G and all but B-Az and K1 «ابن كثير» (Hamad's footnote). ajz «ابْنٌ لِلْعَلَاءِ» G, A (footnote: the MS and some
   copies «ابن العلاء»، «وبه ينكسر البيت»), D, H, K1, ʿŠ, B07 (Indian MS); «ابْنُ الْعَلَاءِ» B, E, F, K2, Q, Bw (unmetrical unless the waṣl is
   pronounced). «وَنَافِعٌ» with tanwīn on the slide (the ʿarūḍ needs it; K2 «وَنَافِعُ»). Kept G. G-rec take 1 probably says «ابنُ
   كثيرٍ»: P2.
10. **v10** «وَعَاصِمٌ الْكُوفِيُّ» G (with the red «نِ»), A, D, H (also with «نِ»), K1, K2; E «وَعَاصِمُ الكُوفِىُّ» (no tanwīn: breaks the metre).
    «وَهْوَ» twice (G, A, D, H). Kept G.
11. **v11** B-Az «حوى» for «أخو». Kept.
12. **v12** No variant; quoted by al-Sakhāwī. Kept.
13. **v13** «مُكْثِنَا» all editions; «لُبْثِنَا» Ibn Umm Qāsim (المفيد, per B) and إذهاب الحزن. Kept.
14. **v14** «وَإِمَّا» G, G-rec (/i/ after the hamza, §5), D, H (H-Aj: «مدغمة»), K1, G-lec; A «وَإِنْ مَا» (the same words spelt apart);
    «وَأَمَّا» B, K2, H-Ms; «وَمَهْمَا» F and إذهاب الحزن; E «وَأَمَّا إِنْ» (unmetrical). Kept G.
15. **v15** «لِيَدْرِيَهُ» G, G-lec, B, H (text), K2; «لِيَدْرِي بِهِ» A (= H-Dn), D («لِيَدْرِيْ بِهِ»), E, F, K1. Kept G. Both scan.
16. **v16** «بِالذَّخْرِ» G, G-rec take 1, A (fatḥa, A2 p244 «بفتح الذال»), H (fatḥa, verified); «بِالذُّخْرِ» G-red, B, D, E, F, K1, K2; B-Az
    «بالدخر». Kept G (G-lec: «الذخر هو الادّخار»).
17. **v17** No variant (spelling إِلَٰهِي/إِلَاهِي/إِلَهِي only). Kept.
18. **v18** «تُنَظَّمُ» G, G-rec take 1, A, D, E, F, H (text; T1 had noted «تَنَظَّمُ», the page has the ḍamma; H's footnote 7 «في رواية
    الداني: تُنَظَّرُ» is a misprint), K1; «تَنَظَّمُ» G-red, B, K2. Kept G.
19. **v19** «إِعْرَابَ آيَاتِهِ» all but E and F «أَبْيَاتَ إِعْرَابِهِ» (corrupt). Kept.
20. **v20** No variant. Kept.
21. **v21** B-Az «أَلَا فَاعْلَمَنْ أَنَّ التِّلَاوَةَ زَيَّنَتْ». Kept G = all others.
22. **v22** No variant. G reads «عَنْهُو» (ṣila on the slide; optional for the metre). Kept.
23. **v23** «فِيهِ إِذَا يَجْرِي» G, G-lec, A, H, al-Samāṭī (per B); «مِنْ فِيكَ إِذْ يَجْرِي» B-CB, Ibn Umm Qāsim (شرح الواضحة, per B), D, F, K1, K2;
    «مِنْهُ إِذَا يَجْرِي» B-Az; Shamela: «من فيك إذا يجري» (مجلة الجامعة، الوجيز), «من فيك إذ جرى» (إذهاب الحزن, unmetrical). E «فِي اللَّحْنِ
    فِيهِ» (misprint for «بِاللَّحْنِ»). Kept G.
24. **v24** «وَمَا لِلَّذِي» G, A, E, F, B-Az, H-Aj, Shamela; «فَمَا» D, H (text), K1, K2, B-CB, al-Samāṭī. Kept G.
25. **v25** «وَإِنْ أَنْتَ» G, A, D, E, F, H, K1; «فَإِنْ أَنْتَ» B-CB, K2; B-Az «وَإِنْ خَفِيَتْ عَنْكَ الْقِرَاءَةُ فَاحْذَرِ». Split «الزْ | زِيَادَةَ» G, D, H, K1, F;
    A «الْ | زِيادةَ»; B «الزِ | زيادةَ»; K2 «الزِ | زْيَادَةَ»; E «الزِّ | يَادَةَ» (wrong split: the ʿarūḍ would end short). Kept G.
26. **v26** B-Az «أَعْظَمِ» for «أَفْضَلِ». Kept.
27. **v27** «أَلَّا» G, D, E, F, K1 = «أَنْ لَا» A, B, H, K2. B-Az «عَلَى أَخْذٍ». Kept G.
28. **v28** «إِذًا» G, H = «إِذَنْ» A, B, D, E, F, K1, K2 (H's note: «إِذَنْ» in Dani's riwaya). Kept G.
29. **v29** «فَفَرِّقْهُ» G, G-lec, A (footnote: some copies «فعرّفه»), B, D, K1, K2; «فَعَرِّفْهُ» E, F, H (text = H-Aj; H-Dn has both); H-Ms (some MSS)
    «بِالنَّشْرِ». Same rhyme word as v14 (إيطاء at 15 verses, allowed). Kept G.
30. **v30** «لِجَزْمِهَا … لِلرَّفْعِ» G, G-lec, E, F, H (= H-Aj), K1; «بِجَزْمِهَا … بِالرَّفْعِ» A (= H-Dn), B, D, K2; some MSS of H-Ms «بِجَزْمِهَا»
    only. «وَتَحْرِيكَهَا» (G, A, D, E, F, H, K1: coordinated with the ism of إِنَّ); B «وَتَحْرِيكُهَا», K2 «وَتَحْرِيكِهَا» (wrong). Kept G.
31. **v31** H-Ms «فَسَكِّنْ وَحَرِّكْ». Kept.
32. **v32** No variant. Kept.
33. **v33** «وَيَاءٌ وَوَاوٌ تَسْكُنَانِ» G, G-rec take 1, G-lec, A (= H-Dn); «يَسْكُنَانِ» G-red, D, E, F, H (text), K1; B and K2 «وَوَاوٌ وَيَاءٌ يَسْكُنَانِ».
    Kept G.
34. **v34** «الْفَكَّ عَامِدًا … فِي فَتْحِكَ الْحَرْفَ وَالْكَسْرِ» G, G-lec, A (Dani: «أراد أن يتعمد القارئ بيان كل حرف»), E, F, H; «الْحَرْفَ عَامِدًا …
    فِي الْفَتْحِ وَالضَّمِّ وَالْكَسْرِ» D, Q, ʿŠ; «الْفَكَّ مُذْ أَتَى … فِي الْفَتْحِ وَالضَّمِّ وَالْكَسْرِ» B, K2; K1 «الْفَكَّ عَامِدًا … فِي الْفَتْحِ وَالضَّمِّ وَالْكَسْرِ».
    Kept G.
35. **v35** «لَحْنًا» G, G-lec, A, B, D, H, K1, K2; «يَخْفَى» E, F, a copy cited by D. D misprints «النَّثْرِ». Kept G.
36. **v36** «وَإِنْ يَكُ» G, G-rec (§5), G-lec, A (= H-Dn); «فَإِنْ يَكُ» B, K2; «وَإِنْ تَكُ» G-red, D, E, F, H (text = H-Aj), K1; «فَإِنْ تَكُ» al-Saʿīdī,
    التنبيه (per B). Kept G.
37. **v37** «وَرَقِّقْ» G, G-lec, A (text, «من نسخ القصيدة»; Dani's MSS ر/س «وأرقق»), D, E, F, K1; «وَأَرْقِقْ» B, H (= H-Dn and H-Aj), K2, Q,
    ʿŠ. «يَنْذَرِبْ» G, A, D, E, F, H, K1, Q, ʿŠ; «تَنْدَرِبْ» B, K2; «يَنْدَرِبْ» a copy cited by D. E «تُنْظِمَ» (misprint). Quoted (vv. 38, 37) by
    al-Hudhalī. Kept G; both verbs scan.
38. **v38** No variant. Kept.
39. **v39** No variant (النشر، لطائف الإشارات، الزيادة والإحسان). Kept.
40. **v40** «جِئْتَ» G, A, B, D, H, K1, K2; «جِيتَ» E, F (eased hamza). «وَلَا تُدْغِمَنَّ» all; al-Saʿīdī «فَلَا» (per B); A's base MS «وَلَا تُدْغِمِ».
    Kept G.
41. **v41** No variant. Kept.
42. **v42** «حَرْفُ لِينٍ» all editions; «حَرْفُ مَدٍّ» النشر 1/317 (al-Jājānī), لطائف الإشارات، الزيادة والإحسان. «مِنْ قَبْلِ مُدْغَمٍ» G, A, D, F, H, K1;
    «مُدْغَمَا» E (with a note preferring the genitive), الزيادة والإحسان; «مِنْ قَبْلُ مُدْغَمًا» Q, ʿŠ (Sh); «مِنْ قَبْلِ سَاكِنٍ» B, K2, a copy cited
    by D. «وَاسْتَجْرِ» G, G-rec (ASR «واستجري»), all editions; Dani's riwaya «واستحر» with ḥāʾ (A prints «واستحر» and discusses it p475;
    H-Dn «وَاسْتَحِرْ», which does not scan; read «وَاسْتَحْرِ» from التحرّي it scans, as G-lec explains). Kept G.
43. **v43** «مَدَدتَّ» G, D; «مَدَدْتَ» A, B, E, F, K1, K2 (H «مَدَدْتَّ»). «فَصَارَا» G, G-rec (ASR «فصاراك تحريك»), B, D, K2, فتاوى الشبكة;
    «فَصَارَ» A, E, F, H, K1, النشر، لطائف الإشارات، الزيادة والإحسان, G-lec 2021. «ذُو الْخُبْرِ» all editions (النشر prints «ذو الخَبَر»).
    Kept G.
44. **v44** «أَبَدَ الدَّهْرِ» G and all; B-Az unclear «ايمدا الدهر» (B: «أي مدى الدهر» or «أبد الدهر»). A prints «وَأَسْمِي» (fatḥa, slip).
    Kept G.
45. **v45** No variant («قَوْلِيَ» with fatḥa: the metre needs it). Kept.
46. **v46** «فَدُونَكَ» G and all but A «فَدَيْتُكَ» (Dani, = H-Dn); margin of B-Az «فدونك أظهرها». Kept G.
47. **v47–48 order** «وَلَا تَشْدُدِ» (47) then «وَإِظْهَارُكَ» (48): G, B, D, E, F, H (= H-Aj), K1, K2; A (Dani) the reverse. Numbering follows
    G (DATA.md). v47 «تَشْدُدِ» G, D, E, F, H, K1; «تُشْدِدِ» B, K2.
48. **v48** «فَقِسْهُ» G, A, D, E, F, H, K1, Q, ʿŠ; «فَنَبِّهْ» B, K2, a copy cited by D. Kept G.
49. **v49** «أَشْيَاءُ» G and all; A prints «أسماء» but Dani's commentary says «الأشياء اللطيفة». «يُلَقَّنُهَا بَاغِي» G, G-lec, D, E, F, H, K1,
    Bw and the Indian MS (B07); «يُلَقَّنُهَا رَاعِي» Q, ʿŠ (Sh); «يُبَيِّنُهَا رَاعِي» B, K2; «يُبَيِّنُهَا» one of Bw's MSS. Kept G.
50. **v50** «الدُّعَاءُ» G, A, D, E, F, H, K1; «الدُّعَاءَ» B, K2 (and K2 «الْفَخْرِ», misprint). Kept G.
51. **v51** «أَخِي» in all but B-Az (restored by Hamad from the Berlin catalogue; the metre needs it). Kept.

**Where Ghouthani's slide breaks metre or grammar, or stands alone against all witnesses: nowhere.** Every reading of the black
text has at least one printed witness (most have several), and every hemistich scans (metre.md). The one real problem is
between his slide and his own voice (v7 ajz, §5).

## 5. The recitation against the slides (acoustic probe of the game clips)

The game clips are the first takes (`audio/h/*.mp3`). Where the slide shows two readings, `text/work/acoustic.py` measures the
contested vowel (LPC formants) against his own /a/ (F1 ≥ 480 Hz), /i/ (F1 260–320, F2 2300–2600) and /u/ (F2 800–1100) in the
same clips, or looks for a stop closure (ت) versus a glide (يّ). Output: `text/work/acoustic_out.txt`. Evidence, not a verdict.

| verse | reading on the clip (take 1) | evidence | matches the text? |
|---|---|---|---|
| v7 sadr «سُنَّةٌ / سُنَّةً» | **سُنَّةٌ** | after the t closure (1:52.39–1:52.47) the vowel (1:52.49–1:52.63) has F1≈320, F2≈900–1200 (/u/), then the nasal | yes |
| v7 ajz «السَّتْرِ / السِّتْرِ» | **السِّتْرِ** | after the 240 ms geminate s (1:56.77–1:57.01) the vowel (1:57.02–1:57.09) has F1≈300, F2≈2330 (/i/); his /a/ in the same clip: F1≈490, F2≈1700 | **no: the voice has the red reading** |
| v8 ajz «الْوِتْرِ / الْوَتْرِ» | **الْوِتْرِ** | after l-w (F2≈800) the vowel has F1≈270, F2≈2500 (/i/) | yes |
| v14 sadr «وَإِمَّا / وَأَمَّا» | **وَإِمَّا** | after the hamza closure: F1≈320, F2≈2550 (/i/) | yes |
| v16 ajz «بِالذَّخْرِ / بِالذُّخْرِ» | **بِالذَّخْرِ** | after the voiced geminate ðð: F1≈580, F2≈1600 (/a/) | yes |
| v18 ajz «تُنَظَّمُ / تَنَظَّمُ» | **تُنَظَّمُ** | after the t closure: F1≈330, F2 falling to ≈830 (/u/), then /a/ of «نَ» F1≈600 | yes |
| v33 ajz «تَسْكُنَانِ / يَسْكُنَانِ» | **تَسْكُنَانِ** | a 100 ms closure (−17 → −30 dB) after «وَوَاوٌ» | yes |
| v36 sadr «يَكُ / تَكُ» | **يَكُ** | voiced glide from «إِنْ» (F2 2400 → 1800, no closure) into /a/; the closure that follows is the k | yes |
| v9 sadr «ابْنُ الْكَثِيرِ» | probably **«ابنُ كثيرٍ»** | Whisper on the whole video hears «بن كثير» in take 1 (p 0.89) and «بن الكثير» in take 2 (p 1.00); Whisper on the clip alone again «بِنُ كَثِيرٍ» (p 0.98); the word lasts 0.80 s in take 1 against 0.96 s in take 2; the red circle on «الكثير» appears during take 2 | **probably no** (take 2 does) |

## 6. Needs listening

| # | verse | timestamp (video) | word | options | why |
|---|---|---|---|---|---|
| 1 | 7 ajz | 1:56.30–1:57.64 | «ذَوِي السَّتْرِ» | السَّتْرِ (slide black, text) / السِّتْرِ (slide red) | probe hears السِّتْر in the only take: decide P1 |
| 2 | 9 sadr | take 1 2:33.77–2:38.27 (word 2:35.16–2:35.96); take 2 2:38.27–2:42.39 (word 2:39.86–2:40.82) | «ابْنُ الْكَثِيرِ» | «ابنُ كثيرٍ» / «ابنُ الكثيرِ» | if take 1 lacks «الْـ», re-cut the v9 clips from take 2 (P2) |
| 3 | 8, 16, 18, 33 ajz | second takes 2:28.24–2:32.81, 4:12.07–4:16.79, 4:38.76–4:43.38, 8:01.57–8:06.08 | الوِتر، الذَّخر، تُنَظَّم، تَسْكُنان | black / red | for the record only (clips use take 1, which has the black reading): does take 2 carry the red one? |
| 4 | 10 ajz | 2:52.92–2:56.08 | «وَعَاصِمٌ الْكُوفِيُّ» | ʿāṣimuni l-kūfī / ʿāṣimu l-kūfī | the metre and the slide's «نِ» want the first |
| 5 | 25 | split at 6:03.0 ±0.1 | «الزْ \| زِيَادَةَ» | cut inside the geminate | already in `audio/QA.md` |
| 6 | 42 ajz | 9:54.76–9:55.82 | «وَاسْتَجْرِ» | جيم / حاء («وَاسْتَحْرِ») | ASR hears جيم; the slide has جيم |
| 7 | 43 ajz | about 10:01.7–10:02.8 | «فَصَارَا» | فَصَارَا / فَصَارَ | ASR «فصاراك»; his 2021 lesson has «فصار» |
| 8 | 22, 23, 48, 51 ajz | 5:22.96–5:23.66, 5:44.98–5:45.62, about 11:02.1–11:03.0, 11:42.82–11:43.46 | «عَنْهُ، فِيهِ، فَقِسْهُ، مِنْهُ» | with or without ṣila | slides mark ṣila; the metre allows both; metre.md assumes ṣila |
| 9 | 1 sadr | 0:37.68–0:38.20 | «لِأُولِي» | li-ʾulī / li-ʾūlī | metre needs ʾulī (silent waw); check before any TTS uses the text |

## 7. Proposals for the orchestrator

- **P1 (v7 ajz).** The text keeps the slide's black «ذَوِي السَّتْرِ» as instructed, but his voice says «السِّتْرِ» (the red). Since the
  game and site pair his audio with the text, I propose making «السِّتْرِ» the main reading and «السَّتْرِ» the variant (both are his;
  «السِّتر» is the reading of H, K1, K2, Q, ʿŠ, the usual sense «أهل السِّتر والصيانة», and fits his gloss «المستورين الذين سترهم الله
  بستره»). Otherwise keep the black and accept that clip `audio/h/007b.mp3` (and `v/007.mp3`) says «السِّتْر».
- **P2 (v9 clip).** If item 2 is confirmed by ear, rebuild `audio/h/009a.mp3` and `audio/v/009.mp3` from take 2 (2:38.27–2:42.39), which
  matches the text «ابْنُ الْكَثِيرِ».
- **P3 (site copy, not mine).** `site/poem.config.json` `description` says «فِي القِرَاءَاتِ وَحُسْنِ الأَدَاءِ»; the poem is «فِي الْقُرَّاءِ
  وَحُسْنِ الْأَدَاءِ» (Dani's title, the video's title).
- **P4 (spelling, low).** «مَدَدتَّ» (v43) follows the slide and D; the plain spelling «مَدَدْتَ» is also correct if layouts prefer it.

## 8. Site credits

<!-- site:credits -->
- أبو عمرو الداني، شرح قصيدة أبي مزاحم الخاقاني، تحقيق غازي بن بنيدر العمري
- غانم قدوري الحمد، أبحاث في علم التجويد، دار عمار، عمّان 2002م
- عبد الله بن صالح العبيد، منظومة الخلاصة في التجويد وشرحها وذكر الخاقانية ومعارضاتها، 2019م
- عمرو بن هيمان المصري، القصيدة الخاقانية في حسن الأداء ومدح القرّاء، 2021م
- جمال محمد شرف، «هدي المجيد في شرح قصيدتي الخاقاني والسخاوي»، دار الصحابة للتراث بطنطا
- المكتبة الشاملة: النشر لابن الجزري، ولطائف الإشارات للقسطلاني، ومعجم الشيوخ للذهبي، وجمال القراء للسخاوي
<!-- /site:credits -->

## 9. Reconciliation T1b × T2b (orchestrator, 2026-11-13)

Two texts were established independently (T1b here; T2b blind, `reviews/t2/khaqaniya.t2.json` + `NOTES.md`).
After mapping T2b's conventions (ٱ → ا, ṣila marks removed) the two agree on **all 102 hemistichs but one mark**:
v43 sadr «مَدَدْتَّ» (T2b, sukun on the second dal) vs «مَدَدتَّ» (T1b). The slide (`v043_sadr.jpg`) clearly shows the sukun:
**«مَدَدْتَّ» kept.**

Conventions adopted for the shipped text: plain alif for hamzat al-waṣl (T1b); **ṣila marks ۥ ۦ kept exactly where
Ghouthani's slides put them** (T2b; five are required by the metre: v3, v4, v13, v15 ×2; they also guide a child's
recitation). Fonts used by the game and the site must render U+06E5/U+06E6.

Still open, to be settled by listening (Gemini audio checks) — see §6 and `reviews/t2/NOTES.md` «doubts»:
v7 «السَّتْرِ / السِّتْرِ» (slide black = fatḥa; both agents measure a kasra in his only take; his lecture: «يجوز»),
v9 take 1 «ابن كثير» vs take 2/slide «ابن الكثير» (clip choice only), optional ṣila in v22, v23, v48, v51 (keep the
mark only if he lengthens). v16 «الذَّخْرِ» stays (slide black, take 1, al-Dānī/al-ʿUmarī «بفتح الذال», Hayman).

## 10. Listening verdicts applied (orchestrator, after L1 — `reviews/listening/REPORT.md`)
- v7 ajz: main reading now **«السِّتْرِ»** (his only take: kasra, 12/12 runs of three Gemini models on two cuts, formants
  agree; also Hayman, al-Qāriʾ, ketabonline, ʿUzayr Shams); «السَّتْرِ» (his slide's black, al-Dānī/al-ʿUmarī) kept as the
  variant; his lecture allows both. Text and clip now agree.
- Ṣila marks dropped where he recites short: v23 ajz «فِيهِ», v48 ajz «فَقِسْهُ»; kept where he lengthens: v22 «عَنْهُۥ», v51 «مِنْهُۥ».
- Confirmed as written: v1 «لِأُولِي» read short (li-ʾulī), v9 «ابْنُ الْكَثِيرِ» (take 2; take 1 says «ابن كثير», the clip now uses
  take 2), v10 «وَعَاصِمٌ» read «عَاصِمُنِ الْكُوفِيُّ», v16 «بِالذَّخْرِ» (take 1), v42 «وَاسْتَجْرِ», v43 «فَصَارَا».
- Cross-model reviews (`reviews/XREVIEW_TEXT.md`): no vocalisation error confirmed; v6 «وَمَا كُلُّ» kept (slide, al-Ājurrī's
  riwaya; «وَلَا كُلُّ» of al-Dānī and six editions noted).
