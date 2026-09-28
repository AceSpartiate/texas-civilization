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

**No audio file.** Every sound and every note is made by the page (`public/audio-synth.js`, `public/audio-music.js`).

| Kind | Items | Licence | Author / source |
|---|---|---|---|
| Effects (24) | musket, volley, cannon, bugle, drum, hoof, horse-snort, wagon, ox, cattle, hens, step, axe, tree-fall, hammer, thunder, baby, bell, alto, click, card, question, lapse, news | project-owned | Synthesised in the browser from code written for this game, 2026-09-28. No sample or recording. |
| Lasting beds (4) | rain, wind, river, fire | project-owned | As above. |
| Music (4) | Brazos Morning, Muster, Before the Guns, The Long Road East | project-owned (composition and performance) | Composed for this game, 2026-09-28; played by the page's own instruments. |
| Music (1) | La Folía | ground: public domain; melody: project-owned | The Spanish/Portuguese dance ground of the 16th-17th centuries (varied by Corelli, 1700, among many). Melody over it written for this game. |
| Music (1) | New Britain ("Amazing Grace") | composition public domain; arrangement and performance project-owned | Anonymous American tune, first printed 1829 (*Columbian Harmony*). Notes written here from the tune; no published arrangement copied. |
| Music (1) | Auld Lang Syne | composition public domain; arrangement and performance project-owned | Scottish traditional air, printed with Burns's words by George Thomson, 1799. Notes written here from the air. |

Nothing was downloaded for this work.

## Adding a recorded sound later (owner question AU3)

1. Take it only from a source whose licence is stated on the item and is CC0 (Kenney.nl's audio packs are published as
   CC0; on Freesound, filter to "Creative Commons 0"; OpenGameArt items explicitly marked CC0). A Sonniss GDC bundle may
   be used only after its licence text for that year has been read and cited here - not assumed.
2. Convert to Ogg Opus (mono, 48-64 kbps for effects), under `public/assets/audio/`; `.gitattributes` already keeps it binary.
3. Add a manifest entry with `file` (path under `public/`), `source` (the item's https URL), `author`, `licence`, `checked`
   (the date you read the licence), and `attribution` if CC-BY. `npm test` fails until it is there.
4. Serving: `server/app.mjs` `assetTypes` serves only png, webp and json today; add `ogg: 'audio/ogg'` with the first file.
