# Audio licences

Owner, 2026-09-28: *"everything has to be free, and shouldn't prevent me from selling the game in the future."*

The machine-readable manifest is `public/assets/audio/licenses.json`; `tests/audio-licenses.test.mjs` holds the game to it
(docs/AUDIO.md §1, §7). This page is the same list for a person. Checked 2026-09-28.

## The rule

**Allowed:** the project's own work; CC0 1.0; public domain; CC-BY 3.0/4.0 only if unavoidable, with the attribution
recorded in the manifest's `attribution` and shown in the game's credits.

**Refused:** anything NC (non-commercial), ND (no derivatives), CC-BY-SA (share-alike) for bundled assets, "free for
personal use", unclear or unstated licences, and anything with a trademark or likeness problem.

A music composition must itself be public domain (or the project's own) - a free recording of a copyrighted song is not
free to sell.

## What ships today

**No recorded audio file.** Every sound and every note is made by the page (`public/audio-synth.js`, `public/audio-music.js`).
The only audio files are read-aloud's spoken sentences, made by the game from its own text (below).

| Kind | Items | Licence | Author / source |
|---|---|---|---|
| Effects (24) | musket, volley, cannon, bugle, drum, hoof, horse-snort, wagon, ox, cattle, hens, step, axe, tree-fall, hammer, thunder, baby, bell, alto, click, card, question, lapse, news | project-owned | Synthesised in the browser from code written for this game, 2026-09-28. No sample or recording. |
| Lasting beds (4) | rain, wind, river, fire | project-owned | As above. |
| Music (4) | Brazos Morning, Muster, Before the Guns, The Long Road East | project-owned (composition and performance) | Composed for this game, 2026-09-28; played by the page's own instruments. |
| Music (1) | La Folía | ground: public domain; melody: project-owned | The Spanish/Portuguese dance ground of the 16th-17th centuries (varied by Corelli, 1700, among many). Melody over it written for this game. |
| Music (1) | New Britain ("Amazing Grace") | composition public domain; arrangement and performance project-owned | Anonymous American tune, first printed 1829 (*Columbian Harmony*). Notes written here from the tune; no published arrangement copied. |
| Music (1) | Auld Lang Syne | composition public domain; arrangement and performance project-owned | Scottish traditional air, printed with Burns's words by George Thomson, 1799. Notes written here from the air. |

Nothing was downloaded for this work. (Read-aloud's model and programs were, on 2026-09-30: below.)

## Read-aloud speech (owner-decided 2026-09-30, built, not released)

The owner chose **Kokoro-82M v1.0, full precision**, with a man's and a woman's voice ([READ_ALOUD.md](READ_ALOUD.md)). The
manifest lists it three ways, and `tests/audio-licenses.test.mjs` holds the game to all three.

**The speech** (`kind: "speech"`, one entry a voice). What Kokoro says is the game's own: no licence claims a model's output, so
every spoken sentence is `project-owned`. The files are every `.opus` under `public/voice/` that `scripts/build-voice.mjs`
lists in `public/voice/manifest.json`, plus what the Host speaks into the class data folder (`voice-cache/`, never shipped).

| Role | Kokoro voice | Speaks |
|---|---|---|
| narrator | `af_heart` (American woman) | tips, the record, the story cards, news nobody in particular says |
| woman | `af_kore` (American woman) | a line a woman or a girl of the game says |
| man | `am_puck` (American man) | a line a man or a boy of the game says |
| rider | `am_fenrir` (American man) | a rider or a runner at the family's side |

Attribution, recorded in each entry and in the button's own label ("a computer voice"): *Voices: Kokoro-82M by hexgrad
(Apache-2.0). Read by a computer voice.*

**The model** (`speechModel`): Kokoro-82M v1.0 by hexgrad, **Apache-2.0**
([hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M)), in the form k2-fsa's sherpa-onnx publishes it
(`kokoro-multi-lang-v1_0`, read 2026-09-30). Apache-2.0 allows selling; it asks that the licence travel with the model, which it
does (`runtime/voice/LICENSES/Kokoro-82M-LICENSE.txt`). Its training data is stated as permissive or non-copyrighted audio plus
synthetic audio from commercial services: the weights' licence is clear, and the residual risk that the stated provenance is
wrong is recorded here, not dismissed. The rule above governs bundled audio; the model is software, and Apache-2.0 is recorded
as the owner's own choice of it.

**The programs** (`speechRuntime`), all in `runtime/voice/`, fetched and checked by `scripts/bundle-voice.mjs`:

| Program | Licence | Note |
|---|---|---|
| `sherpa-onnx-offline-tts.exe` 1.13.8 (k2-fsa) | Apache-2.0 | runs Kokoro; no Python, no npm package |
| espeak-ng (k2-fsa's fork, commit `ed530aa`), **built into that program** | **GPL-3.0-or-later** | see below |
| piper-phonemize (built in) | MIT | |
| ONNX Runtime 1.28.2 (`onnxruntime*.dll`) | MIT | |
| `opusenc.exe` (Xiph.Org opus-tools 0.2, with libopus) | BSD-2-Clause (libopus BSD-3-Clause) | `opusinfo`, GPL-2.0, is **not** shipped |

**espeak-ng and the GPL.** espeak-ng turns English words into sounds for Kokoro, and sherpa-onnx builds it into
`sherpa-onnx-offline-tts.exe`, so that program as a whole is GPL-3.0. What the game does about it:

1. **It runs apart from the game.** The server starts it as a separate program for each sentence (`server/voice/service.mjs`,
   `child_process.spawn`), passes it words and reads back a WAV file. It is never linked, never loaded into `node.exe`, and no
   game code is in it: the game is not a work based on it. The test holds this (no `process.dlopen`, no addon, no npm
   dependency).
2. **Its source ships beside it.** `runtime/voice/LICENSES/source/` holds the complete source of the espeak-ng built in
   (`espeak-ng-ed530aa….zip`, the commit and SHA-256 sherpa-onnx 1.13.8 pins), and the source of sherpa-onnx 1.13.8 and
   piper-phonemize. `LICENSES/README.txt` names every other part the program's build fetches, with its URL and hash, and makes a
   **written offer** (three years) to supply the complete corresponding source on request.
3. **Its licence text ships**: `LICENSES/espeak-ng-COPYING-GPL-3.0.txt`.
4. **Selling is not restricted.** The GPL allows charging for copies; its obligations are the source and the licence, which
   travel with every package (the setup, the update zip, and the NeedsNode zip, which keeps `runtime/voice`).

The fixed sentences are spoken at package time on the developer's machine, so for most of what a student hears no GPL program
runs on the teacher's laptop at all; it runs there only for sentences with a family's names in them.

## Adding a recorded sound later (owner question AU3)

1. Take it only from a source whose licence is stated on the item and is CC0 (Kenney.nl's audio packs are published as
   CC0; on Freesound, filter to "Creative Commons 0"; OpenGameArt items explicitly marked CC0). A Sonniss GDC bundle may
   be used only after its licence text for that year has been read and cited here - not assumed.
2. Convert to Ogg Opus (mono, 48-64 kbps for effects), under `public/assets/audio/`; `.gitattributes` already keeps it binary.
3. Add a manifest entry with `file` (path under `public/`), `source` (the item's https URL), `author`, `licence`, `checked`
   (the date you read the licence), and `attribution` if CC-BY. `npm test` fails until it is there.
4. Serving: `server/app.mjs` `assetTypes` serves only png, webp and json today; add `ogg: 'audio/ogg'` with the first file.
   (Read-aloud's speech is served by its own route, `/voice/<key>.opus`, not as an asset.)
