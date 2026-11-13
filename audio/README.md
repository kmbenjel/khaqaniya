# audio/: Ghouthani's recitation cut into clips (agent G2)

153 mono mp3 clips of Sheikh Yahya al-Ghouthani reciting al-Khaqaniyya (51 verses), for the game and the poem site.

| path | what |
|---|---|
| `v/NNN.mp3` | the whole verse (NNN = 001..051), 9.0-10.6 s |
| `h/NNNa.mp3`, `h/NNNb.mp3` | the sadr (first hemistich) and the ajz (second), 4.2-5.2 s each |
| `timings.json` | per verse: `n, start, end, sadrEnd, ajzStart` (seconds on the original upload = the cut points), `file, sadr, ajz, dur, sadrDur, ajzDur`, `note`; plus `source` (reciter, url, credit) per docs/DATA.md |
| `contact_sheet.png` | waveforms of the 51 verse clips, red line = sadr/ajz boundary (magenta = v9 splice) |
| `QA.md` | checks done and the doubtful clips |
| `tools/` | scripts and their raw outputs (`cuts.json` every cut point and the level there, `qa_*.json`) |

Total size 6.99 MB (verse clips 3.5 MB, hemistich clips 3.5 MB). Format: mp3, mono, 44.1 kHz, 56 kbps CBR, no tags; works on iOS and Android.
Level: every clip normalised to -18 LUFS integrated (measured on the encoded files: -18.4 to -18.2), true peak at most -1.60 dBTP.

## How they were made (all on `khaqaniya-vm`, nothing heavy on the laptop)

Source: YouTube `3XtXhX2jgLQ`, the video's AAC audio decoded to 44.1 kHz stereo wav (L/R correlation 0.9987, so mono = plain mean).
Hemistich times come from `sources/ghouthani/segments.json` (see `sources/README.md`).

1. `tools/build.py` (venv `~/kq/venv-audio`: numpy, scipy, soundfile, pyloudnorm; ffmpeg 6.1 libmp3lame). Per verse:
   - start cut = quietest 10 ms-RMS point in [start-0.12, start-0.04] s, snapped to the nearest zero crossing;
   - last voiced frame = last 20 ms-RMS frame above -27 dBFS; end cut = that + 0.22 s (natural reverb tail), zero crossing;
   - sadr end = last voiced + 0.22 s, but never later than 0.05 s before the ajz onset; ajz start = quietest point in the 0.15 s before its onset;
   - fades: 15 ms in, 100 ms out (raised cosine). No other processing.
   - repeats (v8, v16, v18, v33 ajz): first take only; v9 sadr: second take (take 1 says «ابن كثير»; L1). v9's verse clip = sadr take 2 + ajz.
   - v25 (one line, no pause): split at 363.01 s, the middle of the geminate zay of «الزْ|زِيَادَةَ» (frication 362.82-363.20 s in the spectrogram); 50 ms fade out / 12 ms fade in.
2. Loudness: pyloudnorm integrated loudness of each clip (after fades) to -18 LUFS with a plain gain; if the 4x oversampled true peak would pass -2.0 dBTP the gain is reduced instead of limiting (none needed it).
3. Encode: `ffmpeg -f f32le -ar 44100 -ac 1 -i - -c:a libmp3lame -b:a 56k -map_metadata -1 -write_id3v2 0`.
4. QA: `tools/qa_asr.py` (faster-whisper turbo, ar, word timestamps, every clip), `tools/qa_compare.py`, `tools/qa_check.py` (ebur128 on the encoded files, contact sheet).
5. Denoise A/B (`tools/df_ab.py`): DeepFilterNet3 at 6 and 12 dB attenuation limit on two verses lowered the room floor by 3-11 dB but changed nothing the ear needs and cost Whisper word confidence (0.980 -> 0.969, 0.985 -> 0.981). The floor is his room reverb, part of his sound: the clips are left natural.

Rebuild: `scripts/vm.sh run '~/kq/venv-audio/bin/python audio/tools/build.py'` then `scripts/vm.sh pull audio/v audio/h audio/timings.json audio/tools/cuts.json`.

## Credit and licence

Credit line to show wherever the clips play: **«تلاوة الشيخ يحيى الغوثاني»** (YouTube `3XtXhX2jgLQ`, https://www.youtube.com/watch?v=3XtXhX2jgLQ).
The recitation belongs to Sheikh Yahya al-Ghouthani. It is used with credit, per verse, for non-commercial teaching, and will
be removed if he or his office asks (no written permission from him is on file: `sources/CONTENT_ID.md`). It is **not** covered by this repository's code licence and may not be redistributed or reused outside this project without his consent.
See `sources/CONTENT_ID.md` for the platform risk of republishing it.
