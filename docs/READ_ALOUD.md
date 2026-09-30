# Read aloud: choosing a voice

Research only, 2026-09-30. **Nothing is built and nothing is integrated.** The owner picks a voice from the samples
below before any of it is built. `package.json` is unchanged.

Owner, 2026-09-29, verbatim: *"i want to do read aloud as the option. but i don't want to use the stock voice. it's awful
and the players will hate it. i want to find free voices that we can legally download and use. i want to use the voices
(that can't sound robotic. it'll ruin it) to do the read alouds. it'll be done and processed on the host computer, and
streamed to the player devices so they don't have to download anything (unless that'd work better?)."*

This answers triage item D15, help for readers below grade (`docs/audits/2026-09-29-triage.md`). There, option B was
"a local read-aloud button".

## 1. The shortlist

Every sample below reads the same three lines: the rider's news (*"A rider has come in from Gonzales. The Mexican
soldiers came for the cannon, and the settlers told them to come and take it."*), the army question (*"The volunteers
are gathering on the Guadalupe. Will you send someone to join them, or keep everyone home to bring in the corn?"*) and
the names line (*"Juan Seguín's company rode out from Béxar."*). Voices that speak Spanish also read *"La compañía de
Juan Seguín salió de Béxar al amanecer."*

| # | Engine and voice | Licence (model / voice data) | Quality: honest read | CPU speed, one thread | Size to run it | Spanish |
|---|---|---|---|---|---|---|
| **1** | **Kokoro-82M v1.0**, full precision. `af_heart` (American woman), `am_fenrir` (American man), `bf_emma` (English woman) | Apache-2.0 weights. The data is described as "permissive/non-copyrighted" plus synthetic audio from commercial TTS (§5). | **The most natural of everything tried.** Top predicted naturalness (UTMOS 4.45 for `af_heart`). The author grades `af_heart` A, `bf_emma` B-, `am_fenrir` C+. Secondary sites report it as the highest-ranked open-weight model in public listening arenas; this was not verified here. | RTF 0.70 (a 6 s line takes 4.4 s). 1.3 s to load. | 310 MB model, 0.5 MB per voice, 17 MB espeak-ng data (can be trimmed to English and Spanish), 20 MB runtime | `ef_dora` and `em_alex` exist but are weak: UTMOS 3.4-3.7, and the author gives them no grade |
| **2** | **Supertonic 3** (int8, 10 preset voices). `sid0` (female by pitch), `sid5` (male by pitch) | **OpenRAIL-M** weights (use restrictions, §5). MIT code. | **Close to Kokoro by the numbers** (UTMOS 4.39-4.48 on all four voices tried), and it handles the names best of any engine. Newer, with less public listening evidence. | RTF 0.36, the fastest of the natural-sounding engines | 138 MB model, 20 MB runtime, **no espeak-ng** | **Native**, 31 languages. The Spanish line scored UTMOS 4.28. |
| **3** | **Piper**, Bryce Beattie's voices: `kristin` (woman) and `john` (man), medium quality | MIT model code. **The voices are public domain**, trained only on LibriVox, and the author says "use for any legal and ethical purpose". | Clean and quick. UTMOS 4.34 and 4.19, but it is VITS: I expect flatter phrasing than Kokoro, **the "robotic" risk the owner named**. This is the licence-safest fallback, not the first pick. | RTF 0.08: instant on any laptop | 61 MB per voice, 17 MB espeak-ng, 20 MB runtime | None of good quality. The only public-domain Spanish Piper voice (`carlfm`) is `x_low` quality. |

"RTF" is the real-time factor: seconds of computing per second of speech, so below 1 is faster than real time. It was
measured on this machine, which a school laptop is slower than (§6).

**Recommendation, subject to the owner's ear:** Kokoro `af_heart` or `am_fenrir` as the narrator. Supertonic 3 is the
alternative if the owner prefers its sound, wants real Spanish lines, or wants runtime generation to be cheap, **and**
accepts OpenRAIL-M's conditions. Piper `kristin` is the fallback if both are refused on licence.

### Listen

Committed (Opus, about 32 kbit/s, 26 files, 0.55 MB), all in [`docs/evidence/read-aloud/`](evidence/read-aloud/):

- Kokoro: `kokoro-af_heart-{news,army,names}.opus`, `kokoro-am_fenrir-{news,army,names}.opus`,
  `kokoro-bf_emma-{news,army,names}.opus`, and the Spanish line in Kokoro's Spanish voice, `kokoro-ef_dora-es.opus`.
- Kokoro with the names respelled for it (§4): `kokoro-af_heart-names-respelled.opus`, `kokoro-am_fenrir-names-respelled.opus`.
- Supertonic 3: `supertonic3-sid0-{news,army,names,es}.opus`, `supertonic3-sid5-{news,army,names,es}.opus`.
- Piper: `piper-kristin-{news,army,names}.opus`, `piper-john-{news,army,names}.opus`.

Every engine and voice tried, including the ones not shortlisted, is in this session's scratchpad as WAV and Opus. That
folder is temporary and is not in the repository:
`C:\Users\zachw\AppData\Local\Temp\claude\C--Users-zachw-Texas-Civilization\2f375bfe-91ab-4fc8-aa68-1531e617149c\scratchpad\read-aloud\samples\<engine>\<voice>-<line>.wav`.
The name variants are in `...\read-aloud\samples-names\`.

The measurements are in [`evidence/read-aloud/measurements.json`](evidence/read-aloud/measurements.json).

## 2. How the voices were judged, and what that cannot tell you

**Nobody listened.** The samples were judged by two machine proxies, and neither is an ear:

- **Did it say the words?** NVIDIA's Parakeet TDT 0.6B v2 speech recogniser transcribed every English clip, and its
  word error rate was measured against the text.
  - Every shortlisted voice was understood almost perfectly on the two plain lines (0-11%).
  - Most of the errors are the recogniser's, not the voice's: "rider" is heard as "writer", and "someone" as "some one".
- **Does it sound like clean, natural speech?** UTMOS22 predicts the mean opinion score a panel would give (1-5).
  - It was calibrated here against real people. Studio recordings (Kyutai's `alba-mackenna` clips) scored **3.9**. Home
    recordings of donated voices scored **2.4-3.5**.
  - So a synthetic voice at 4.4 is not "better than a person". **UTMOS rewards clean, steady audio and cannot hear
    whether a line is read with sense.** It separates good from bad (Kokoro int8 fell 0.4-0.8 below full precision). It
    cannot choose between the top three. That choice is the owner's to make by ear.

The CPU timings were taken while other builders' test suites held the machine at 30-100% load, and each run's load is
recorded. The one-thread figures are best of three and are the ones to trust. The two-thread runs were noisier: Piper
measured 0.05 at 50% load and 0.21 at 100%.

## 3. Considered and not shortlisted

| Engine | Licence | What was found | Verdict |
|---|---|---|---|
| Kokoro **int8** (sherpa-onnx's quantised build) | Apache-2.0 | UTMOS 0.4-0.8 below full precision, and **slower** on this CPU (RTF 1.08 against 0.70), because dynamic int8 kernels are slow here. It is smaller (109 MB). | **Refused.** A smaller model has to be listened to first (§7). |
| **Kitten TTS** mini 0.8 | Apache-2.0 | UTMOS 4.2-4.4 and 80 MB, but the **training data is not disclosed anywhere**. RTF 0.68. English only. | **Refused on provenance.** AUDIO_LICENSES.md refuses "unclear" sources. |
| **MeloTTS** English | MIT | Only the Australian voice scored well (4.46). The American voice scored 3.65, and the names came out spelt ("BXUR"), because the sherpa build uses a fixed lexicon. Data provenance is undisclosed. | **Refused.** |
| **Pocket TTS** (Kyutai, 100M, int8 ONNX) | CC-BY 4.0 weights. The voices are CC0 (`voice-donations`), CC-BY (`alba-mackenna`, `vctk`) or **CC-BY-NC** (`expresso`, `ears`). | Unstable in this build. Each run samples its speech afresh, so the same text comes out differently every time. The first run dropped the second sentence of one clip. The second run made a names clip the recogniser heard nothing in, and read "Will you send" as "Please send". UTMOS 2.6-4.4. It clones any reference voice, which is interesting later (§8). Its repository is gated behind a use policy. sherpa-onnx's README calls the ONNX export "non-commercial", but the export's own LICENSE file is CC-BY 4.0. | **Held.** Worth a second look in its official PyTorch form if the owner ever wants a custom narrator voice. |
| **Piper** `lessac` and every voice fine-tuned from it (`amy`, `joe`, `mike`, `sam`, `kusal`, Spanish `davefx`, `sharvard`, `ald`) | Lessac data is a **research licence** (Blizzard 2013) | A fine-tuned voice inherits weights trained on research-only recordings. | **Refused.** |
| Piper `ryan`, `hfc_male`, `hfc_female`, `l2arctic` | CC-BY-NC(-SA) data | Non-commercial. | **Refused.** |
| Piper `ljspeech` (high) | Public domain | Clean licence. UTMOS 4.14. Slower than the medium voices (RTF 0.53). | Acceptable, but not better than `kristin` |
| **XTTS v2** (Coqui) | CPML, **non-commercial** | Not sampled. | **Refused.** |
| **F5-TTS** | CC-BY-NC 4.0 weights (Emilia data) | Not sampled. | **Refused.** |
| **Parler-TTS** mini v1 | Apache-2.0. Data is CC-BY 4.0 (LibriTTS-R, MLS). | 0.9B parameters, and needs PyTorch at run time. Too heavy for a laptop's CPU in class. Not sampled. | **Refused on weight**, not licence |
| **StyleTTS 2** (its own checkpoints) | MIT code | The pretrained models require telling listeners the speech is synthesised. Kokoro is the productised StyleTTS-2 descendant. | **Superseded by Kokoro** |
| **Chatterbox** (Resemble) and **NeuTTS Air** | MIT / Apache-2.0 | Voice-cloning only, with no built-in voice. 0.35-0.7B parameters, GPU-first. Every output is watermarked. | **Refused on weight** |
| The browser's own `speechSynthesis` | n/a | The owner refused it outright ("it's awful"). | **Refused.** Not even as a fallback (§6). |

## 4. Spanish names: every engine needs a pronunciation table

The names line exposed the same fault in every engine. Kokoro, Piper and Kitten turn text into sounds through
espeak-ng. That step can be printed, so it was checked directly rather than by ear. `probe.py` printed these, in
`measurements.json`:

| Written | espeak-ng (en-us) says | Should be | Respelling that works |
|---|---|---|---|
| Juan | /hwˈɑːn/ | *hwahn* | (correct as written) |
| Seguín | /sˈɛɡwɪn/, "SEG-win" | *seh-GEEN* | `Seh-gheen`, which gives /sˈeɪɡˈiːn/ |
| Béxar | /bˈeɪksɑːɹ/, "BAKE-sar" | *BAY-har* | `Bayhar`, which gives /bˈeɪhɑːɹ/ |
| Refugio | /ɹɛfjˈuːdʒɪˌoʊ/, "ref-YOO-jee-oh" | a choice for HISTORY.md: Spanish *reh-FOO-hyo*, or the town's own *reh-FYOOR-ee-oh* | to be written |
| Músquiz | /mˈʌskwɪz/ | *MOOS-kees* | to be written |

- **Supertonic reads characters, not phonemes.** Its names came out closest: the recogniser heard "Seguin" and "Bexar".
  It cannot be checked the same way, though, so the owner has to listen.
- **The fix is the same for any engine:** a small, project-owned pronunciation table of every Tejano, Mexican and
  Spanish name the game says, applied before synthesis.
  - Compare `kokoro-af_heart-names.opus` with `kokoro-af_heart-names-respelled.opus`.
  - The game's vocabulary is known at build time, so the table can be complete. The names students type when renaming
    people are the exception, and go to the engine's own guess.
- **Kokoro's stock lexicon is not a way in.** In the sherpa-onnx build, English skips the lexicon file and goes straight
  to espeak-ng. This was tried and it changed nothing, so respelling (or feeding phonemes directly, §7) is the lever.

## 5. Licence findings that decide the build

1. **Owner's rule (AUDIO_LICENSES.md):** the game must stay sellable. Allowed: CC0, public domain, the project's own
   work, and CC-BY with attribution. Refused: NC, ND, share-alike, and anything unclear. The **generated audio** of all
   three shortlisted engines is ours to ship: no licence claims the output. What the rule has to be applied to is the
   **model and runtime shipped to run it**, and that only matters if generation happens on the teacher's laptop (§6).
2. **espeak-ng is GPL-3.0, and sherpa-onnx builds it in.**
   - Kokoro, Piper and Kitten all need it, and `cmake/espeak-ng-for-piper.cmake` builds it statically into the
     sherpa-onnx libraries.
   - Pre-generating at package time ships none of it, which is a strong reason to do so.
   - Shipping it for runtime generation means shipping a GPL program. Selling the game is still allowed; the obligation
     is the source offer for that component. It should run as a **separate process**, not loaded into `node.exe`, so
     the game stays a separate work.
   - **Supertonic and Pocket TTS do not use espeak-ng at all.**
3. **OpenRAIL-M (Supertonic 3) is not on the owner's allowed list**, and it is the owner's decision whether to add it.
   - Commercial use and redistribution are allowed. In return the licence requires:
     - including the licence;
     - passing its use restrictions on to end users "as an enforceable provision" (in practice, a clause in the game's
       licence or terms);
     - clearly disclosing that machine-generated content is machine-generated.
   - Nothing in a history game comes near the restricted uses (medical advice, law enforcement, deepfakes). The cost is
     paperwork, not design.
4. **Kokoro's training data** is stated as public-domain and permissively licensed audio, plus "synthetic audio
   generated by closed TTS models from large providers".
   - Those providers' terms bind whoever generated that audio, not users of Kokoro. Apache-2.0 on the weights is clear.
   - The residual risk is the kind nobody can remove: that the stated provenance is inaccurate. It is recorded here,
     not dismissed.
5. **Say so on screen either way:** "read by a computer voice" in the credits and beside the read-aloud control.
   - OpenRAIL-M requires it, and Kyutai's policy asks for it.
   - It is also honest with students, some of whose lines are spoken as named historical people (Seguín, Travis). It
     costs one sentence.

## 6. Architecture: a hybrid, and what it costs

**What the text is.** A rough count of the source (`sim/**/*.mjs` and `public/tips.js`; sentence-like literals of 30+
characters) gives:

- about **1,300 fixed lines** (138,000 characters): tips, calls, army questions, the timeline's news and people's words;
- about **920 templates** that fill in names and numbers (89,000 characters).

At the pace these voices read (about 20 characters a second), the fixed text is **about 2 hours of speech**.

**(a) Fixed text: made at package time, never on the teacher's laptop.**
- A build script on the developer's machine speaks every fixed line and stores it as Ogg Opus at 24-32 kbit/s, named by
  a hash of voice, model and text, with a manifest from text to file. Only changed lines are spoken again.
- **Size:** about 25-35 MB per voice. The setup program is 247-259 MB (DEPLOYMENT.md), so one narrator voice adds about
  12%.
- **Time:** at Kokoro's one-thread RTF of 0.7, two hours of speech takes about 85 minutes, or about 20 minutes across
  four processes. It is done once per release, and incrementally after that.
- This ships **no model, no Python and no espeak-ng**: only audio files, which go into `public/assets/audio/licenses.json`
  like any other sound.

**(b) Dynamic text: made on the Host, cached, only where a line has names or numbers in it.**
- **Split templates into sentences.** Sentences with nothing variable come from the package. Only the sentence holding
  the name is spoken on the Host. Never splice inside a sentence: the phrasing breaks audibly.
- **Speak when the server writes the line, not when the student taps.** News is created on the server before a student
  reads it, so the audio is usually ready first. Cache it in the class data folder by content hash with a size cap. The
  same news to twenty families is spoken once.
- **Run it in its own process**, at below-normal priority with one or two threads, so the tick never waits on a voice.
  The sherpa-onnx Windows command-line build was run here. It is `sherpa-onnx-offline-tts.exe` plus `onnxruntime.dll`,
  **20 MB with no Python and no npm package**, and it spoke Kokoro at RTF 0.41 on two threads, 2.4 s end to end
  including loading. That shape is the same as `runtime/node.exe`, and it keeps `package.json` at zero dependencies.
- **Host load, as an estimate: not measured on a school laptop.**
  - A typical school laptop core is 1.5-3 times slower than this desktop's, so Kokoro runs at about RTF 1-2 there: a
    5-second sentence takes 5-10 s of one core.
  - A moment that gives all 30 families a line with their own names in it therefore queues **2-5 minutes** of Kokoro, or
    about half that with Supertonic. Piper would take about 20 s.
  - `ceiling:` if that backlog matters in practice, speak the dynamic sentences with a faster voice, or read the name
    sentence as text only. **It has to be measured on the real teacher laptop before it is promised.**

**(c) Chromebooks: an `<audio>` element and nothing else.**
- The page asks for `/voice/<hash>.opus`, served with an immutable cache header, and Chrome plays Ogg Opus natively.
- Nothing is installed on the Chromebook. If a line's audio is not ready yet, the button says so. **It never falls back
  to the stock voice**, which the owner refused.
- "Unless that'd work better": it would not. Synthesising on the Chromebook means every device downloads the model: 110-330 MB
  times 30 is 3-10 GB over classroom Wi-Fi. The devices have the slowest CPUs in the room, and WASM runs slower than
  native code.

**LAN load for 30 students.**
- A 6-second line is about 25 KB.
- If all 30 students press play on the same news at once, that is 750 KB, well under a second of a classroom access
  point's capacity.
- If every student listened non-stop, it would be 30 × 32 kbit/s, about **1 Mbit/s** in total.
- For comparison, the game already sends about 112 KB per tick across 30 devices (REFERENCE_ARCHITECTURES.md). Read-aloud
  is a rounding error on the network. The Host's CPU (b) is the real budget.

**Suggested order, when the owner chooses to build it:**
1. Package-time voice for fixed text only: zero new runtime dependencies and zero GPL. This alone covers the tips, the
   calls and the army questions, which are the reading the classroom audit (M7) and the triage (D15) named.
2. Then Host-side generation for the sentences with names in them.
3. The pronunciation table (§4) is needed from step 1.

## 7. Not tried, and worth a look once a voice is chosen

- **Smaller Kokoro builds.** Official `onnx-community/Kokoro-82M-v1.0-ONNX` has fp16 and q8f16 files (about 86-170 MB).
  The int8 build tried here sounded measurably worse, so any smaller build must be listened to before it is used. It
  only matters for Host-side generation (b), because package-time generation (a) ships no model.
- **Feeding phonemes directly.** `kokoro-onnx` (MIT) accepts a phoneme string. With a complete name table, a runtime
  path could avoid espeak-ng entirely except for names students type themselves.
- **A second voice per role** (a rider, a woman at the door, Seguín himself). Kokoro and Supertonic both have enough
  voices. It is a design question, not a technical one.

## 8. Questions for the owner

1. **Which voice?** Listen to the `news` and `army` files of Kokoro `af_heart` and `am_fenrir`, Supertonic `sid0` and
   `sid5`, and Piper `kristin`.
2. **Is OpenRAIL-M acceptable** (Supertonic's use policy passed on to buyers, and a "computer voice" notice)? If not,
   Supertonic is out.
3. **One narrator, or different voices for different speakers?**
4. **Should Spanish lines be read in Spanish?** If yes, that argues for Supertonic, whose Spanish is native, over
   Kokoro, whose Spanish voices are weak.
5. **Is Pocket TTS worth a second look?** It could clone a narrator voice from a CC0 recording, or from the owner's own
   voice.

## 9. Reproducing

The scripts that made every number here are in [`evidence/read-aloud/scripts/`](evidence/read-aloud/scripts/):

- `gen.py` speaks the lines and times them;
- `score.py` runs the recogniser and UTMOS;
- `probe.py` prints espeak-ng's phonemes.

They need Python 3.11 with `sherpa-onnx soundfile numpy scipy onnxruntime`, and `torch torchaudio` (CPU) for scoring,
in a virtual environment **outside** this repository. Their `models/` folder is filled from sherpa-onnx's `tts-models`
and `asr-models` GitHub releases: the file names are in `gen.py`. The reference voices come from `kyutai/tts-voices` on
Hugging Face.

The licences were read at their sources on 2026-09-30:

- Kokoro: `hexgrad/Kokoro-82M`, the model card and VOICES.md.
- Piper: each voice's MODEL_CARD in `rhasspy/piper-voices`, Bryce Beattie's page (brycebeattie.com/files/tts), and the
  Lessac/Blizzard 2013 licence page at cstr.ed.ac.uk.
- Supertonic: `Supertone/supertonic-3` and its LICENSE.
- Kitten TTS: `KittenML/kitten-tts-mini-0.8`.
- MeloTTS: `myshell-ai/MeloTTS-English`.
- Pocket TTS: `kyutai/pocket-tts`, `kyutai/tts-voices`, and `KevinAHM/pocket-tts-onnx` `onnx/LICENSE`.
- XTTS: `coqui/XTTS-v2`.
- F5-TTS: `SWivid/F5-TTS`.
- Parler-TTS: `parler-tts/parler-tts-mini-v1`.
- StyleTTS 2: `yl4579/StyleTTS2`.
- Chatterbox: `ResembleAI/chatterbox-turbo`.
- NeuTTS Air: `neuphonic/neutts-air`.
- The espeak-ng build: `k2-fsa/sherpa-onnx` `cmake/espeak-ng-for-piper.cmake`.
