// Each regression put into the page and the proof written for it run against it (CLAUDE.md: a new test is not evidence until it
// has failed). Two owner decisions of 2026-09-29, both in docs/FAMILY_PANEL.md §20c:
//   - "Warn, then allow": somebody on auto made main on the flight is made main, and one plain line says they will answer the
//     soldiers themselves - held by `npm run test:scrape-pursuit`;
//   - a traveller the map is not drawing has a greyed row that cannot be chosen until they are drawn again - held by
//     `npm run test:travel-sight`.
// Every file is put back after each run, whatever happens.
//
// Run: node scripts/unseen-and-auto-injections.mjs → docs/evidence/unseen-and-auto-injections.json
// (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for the proofs; about half an hour.)
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PURSUIT = 'scripts/scrape-pursuit-browser-proof.mjs', SIGHT = 'scripts/travel-sight-proof.mjs';
const INJECTIONS = [
  { name: 'made main on auto in the flight, and nothing is said', proof: PURSUIT, edits: [{ file: 'public/app.js', from: '  if (warning) say(warning);\n', to: '' }] },
  { name: 'the warning is said for the order to leave in the chase too (the wrong words)', proof: PURSUIT, edits: [{ file: 'public/app.js', from: "${flight.status === 'ordered' ? 'the order to leave' : 'the soldiers'}", to: "${'the order to leave'}" }] },
  { name: 'a traveller out of sight keeps a live row', proof: SIGHT, edits: [{ file: 'public/app.js', from: "    setData(row.item, 'unseen', String(Boolean(words)));", to: "    setData(row.item, 'unseen', 'false');" }] },
  { name: 'the row greys but does not say where they are going', proof: SIGHT, edits: [{ file: 'public/app.js', from: "    if (row.away.textContent !== words) row.away.textContent = words;", to: '' }] },
  { name: 'a press on an unseen traveller\'s portrait goes through', proof: SIGHT, edits: [{ file: 'public/app.js', from: '  if (portrait) { if (!refusedUnseen(portrait.dataset.portrait)) pressStar(portrait.dataset.portrait); return; }', to: '  if (portrait) { pressStar(portrait.dataset.portrait); return; }' }] },
  { name: 'the row is never live again once they are back in view', proof: SIGHT, edits: [{ file: 'public/app.js', from: "  noteUnseen(host || world.watching ? new Map() : unseenNext, world);", to: "  noteUnseen(host || world.watching ? new Map() : new Map([...unseenOnRoad, ...unseenNext]), world);" }] },
  { name: 'the camera keeps its watch on somebody out of sight', proof: SIGHT, edits: [
    { file: 'public/app.js', from: '  if (watchedId && next.has(watchedId)) { watchedId = null; if (world?.flight?.chase) watchChase(world, { draw: false }); }', to: '' },
    { file: 'public/app.js', from: '  if (watchedId && unseenOnRoad.has(watchedId)) watchedId = null;\n', to: '' }] },
];

const runProof = script => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 2400000, env: { ...process.env, PROOF_NO_WRITE: '1' } });
  if (result.status === 0) return [];
  const passed = [...`${result.stdout}`.matchAll(/^PASS (.+)$/gm)].length;
  const why = `${result.stderr}`.split('\n').find(line => /Error|assert|Timeout/.test(line)) || `exit ${result.status}`;
  return [`${script} failed after ${passed} checks: ${why.trim().slice(0, 240)}`];
};
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
for (const injection of INJECTIONS) {
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = runProof(injection.proof);
    record.push({ name: injection.name, proof: injection.proof, caught: failed.length > 0, failed });
    console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
mkdirSync('docs/evidence', { recursive: true });
const out = 'docs/evidence/unseen-and-auto-injections.json';
writeFileSync(out, `${JSON.stringify({ record: 'unseen-and-auto-injections', date: new Date().toISOString().slice(0, 10), injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught; wrote ${out}`);
