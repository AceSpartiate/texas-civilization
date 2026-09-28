// The regressions scripts/chatter-browser-proof.mjs guards, injected one at a time into the page's code (CLAUDE.md: "A new test
// is not evidence until it has failed"). Each injection makes its edits, runs the whole proof in the browser, records which of
// its checks failed, and puts every file back byte for byte. **Caught** means a check written for it failed; **alone** means no
// check of any other kind did (`expect` names the kind: the same check is made at the farm, the town and the camp).
//
// CRLF: patterns are converted to each file's own line endings, and an edit that does not match exactly once stops the run.
//
// Run: npm run test:chatter-injections  → writes docs/evidence/chatter-injections.json (about six minutes an injection)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const AMBIENT = 'public/ambient.js', APP = 'public/app.js', MOTION = 'public/motion.js', ARMY = 'public/army-view.js';
const INJECTIONS = [
  { name: 'the page draws the idle standing', edits: [{ file: MOTION, from: "  if (entity.kind === 'person' && entity.amb?.p) return ambientClip(variant, entity.amb);", to: '' }], expect: /people at activities/ },
  { name: 'the camp\'s men stand as a body of men', edits: [{ file: ARMY, from: '    const doing = man ? man(index) : null;', to: '    const doing = null;' }], expect: /force's men at the fire/ },
  { name: 'nobody talks', edits: [{ file: APP, from: '    drawAmbientSpeech(ctx, world.ambient?.lines || [], headOf, {', to: '    if (false) drawAmbientSpeech(ctx, world.ambient?.lines || [], headOf, {' }], expect: /bubbles drawn|men talk/ },
  { name: 'bubbles pile up, both halves at once and over each other', edits: [
    { file: AMBIENT, from: 'export const ON_SCREEN = 3, EXCHANGES_AT_ONCE = 2;', to: 'export const ON_SCREEN = 12, EXCHANGES_AT_ONCE = 12;' },
    { file: AMBIENT, from: 'export const LINE_MS = 3800, REPLY_AFTER_MS = LINE_MS + 600;', to: 'export const LINE_MS = 9000, REPLY_AFTER_MS = 0;' },
    { file: AMBIENT, from: '    if (!box || boxes.some(other => overlaps(box, other))) continue;', to: '    if (!box) continue;' },
  ], expect: /at most 3 bubbles/ },
  { name: 'a visitor stays at their own door', edits: [{ file: AMBIENT, from: '  const target = amb?.at || home;', to: '  const target = home;' }], expect: /walked to a neighbour/ },
  { name: 'the talk is slow to draw', edits: [{ file: AMBIENT, from: '  const showing = [];', to: '  const showing = []; { const until = performance.now() + 70; while (performance.now() < until); }' }], expect: /inside the gate/ },
];

const run = () => {
  const result = spawnSync(process.execPath, ['scripts/chatter-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
  return [...`${result.stdout}${result.stderr}`.matchAll(/^FAIL (.+?)(?: - |$)/gm)].map(match => match[1]);
};
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const chosen = INJECTIONS.filter(injection => !only || only.test(injection.name));
const clean = run();
if (clean.length) throw new Error(`the proof fails before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of chosen) {
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      const original = originals.get(edit.file) ?? readFileSync(edit.file, 'utf8');
      if (!originals.has(edit.file)) originals.set(edit.file, original);
      const current = readFileSync(edit.file, 'utf8');
      const ends = text => (original.includes('\r\n') ? text.split('\n').join('\r\n') : text);
      const from = ends(edit.from), to = ends(edit.to);
      const count = current.split(from).length - 1;
      if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count} times`);
      writeFileSync(edit.file, current.replace(from, to));
    }
    const failed = run();
    const caught = failed.some(label => injection.expect.test(label));
    const alone = caught && failed.every(label => injection.expect.test(label));
    record.push({ name: injection.name, files: [...originals.keys()], caught, alone, failed });
    console.log(`${caught ? (alone ? 'caught alone' : 'caught') : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally {
    for (const [file, original] of originals) writeFileSync(file, original);
  }
}
if (!only) {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/chatter-injections.json', `${JSON.stringify({
    record: 'chatter-injections', date: new Date().toISOString().slice(0, 10),
    note: 'Ambient life and chatter in the browser (docs/AMBIENT.md, 2026-09-28). Each injection runs the whole of scripts/chatter-browser-proof.mjs; "alone" means only checks of the kind written for it failed. Same computer only.',
    injections: record,
  }, null, 2)}\n`);
}
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught, ${record.filter(r => r.alone).length} alone`);
