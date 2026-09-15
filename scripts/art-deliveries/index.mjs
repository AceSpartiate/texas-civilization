import { existsSync, readdirSync, readFileSync } from 'node:fs';
// Astra delivers in batches, sometimes days apart (owner, 2026-09-14), so a delivery file may name sheets whose
// pictures have not landed yet. Only a sheet whose PNG is on disk is registered, and only a clip whose every
// frame is on a registered sheet; the rest wait for their batch. A sheet also needs its provenance - the delivery's
// own record or one already in docs/art-provenance.json - because the registry refuses art whose origin is not
// recorded, and nobody but the artist can write that record. Nothing here ever breaks the build or the tests for
// art that is merely not here yet; pending says what is waiting and why.
const ATLASES = new URL('../../public/assets/frontier-v1/atlases/', import.meta.url);
// A delivered sheet held back after review, with why: its picture and provenance are here, but the manifest build's
// checks refuse it, and loosening a check for one sheet is not the fix. Held sheets wait like a missing picture does,
// and the stand-in they would replace stays in use. Remove the entry when the corrected sheet lands.
export const HELD = Object.freeze({
});
const recorded = new Set(JSON.parse(readFileSync(new URL('../../docs/art-provenance.json', import.meta.url), 'utf8')).assetSources.map(entry => entry.sheet));
export const SHEETS = {}, ANIMATION_CLIPS = {}, promptEntries = [], provenanceEntries = [], notes = [], pending = [];
for (const name of readdirSync(new URL('.', import.meta.url)).filter(name=>name.endsWith('.mjs')&&name!=='index.mjs').sort()) {
  const delivery = await import(new URL(name, import.meta.url));
  const sprites = new Set();
  for (const [id,value] of Object.entries(delivery.SHEETS||{})) {
    if (Object.hasOwn(SHEETS,id)) throw new Error(`Duplicate delivery SHEETS: ${id}`);
    const picture = existsSync(new URL(`${id}.png`, ATLASES));
    const origin = recorded.has(id) || (delivery.provenanceEntries || []).some(entry => entry.sheet === id);
    if (!picture || !origin || HELD[id]) { pending.push({ sheet: id, waitingFor: [!picture && 'picture', !origin && 'provenance', HELD[id] && HELD[id]].filter(Boolean) }); continue; }
    SHEETS[id]=value;
    for (const sprite of value) if (sprite) sprites.add(sprite);
  }
  for (const [id,value] of Object.entries(delivery.ANIMATION_CLIPS||{})) {
    if (Object.hasOwn(ANIMATION_CLIPS,id)) throw new Error(`Duplicate delivery ANIMATION_CLIPS: ${id}`);
    if (value.frames.every(frame => sprites.has(frame.sprite))) ANIMATION_CLIPS[id]=value;
  }
  const arrived = entry => !entry.sheet || Object.hasOwn(SHEETS, entry.sheet);
  promptEntries.push(...(delivery.promptEntries||[]).filter(arrived));
  provenanceEntries.push(...(delivery.provenanceEntries||[]).filter(arrived));
  notes.push(...(delivery.notes||[]));
}
