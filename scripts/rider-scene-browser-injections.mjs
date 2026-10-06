// The regressions the rider scene's browser proof guards (scripts/rider-scene-browser-proof.mjs), injected one at a time (CLAUDE.md:
// "A new test is not evidence until it has failed"): each edits the page or the server as the mistake would, runs the proof, checks
// it fails with the sentence written for that mistake, and puts every file back byte for byte.
//
// Run: node scripts/rider-scene-browser-injections.mjs  → writes docs/evidence/rider-scene-browser-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const one = (file, from, to) => ({ file, from, to });
const INJECTIONS = [
  { name: 'the yard painted, not the map\'s ground', edits: [one('public/app.js', 'hooks: { camera: (...args) => flashbackCamera(...args), ground: (...args) => flashbackGround(...args) } });', 'hooks: { camera: (...args) => flashbackCamera(...args) } });')], expect: /laid from the map's own ground/ },
  { name: 'the question\'s asker not sent', edits: [one('sim/encounters.mjs', 'questions: open ? questionsFor(encounter).map(line => ({ id: line.id, ask: line.ask, by: askerFor(world, encounter, line) }))', 'questions: open ? questionsFor(encounter).map(line => ({ id: line.id, ask: line.ask }))')], expect: /does not say who of the scene asks it/ },
  { name: 'Done puts it away without his riding off', edits: [one('public/app.js', "  if (event.target.closest('.ask-leave')) { const ride = !event.target.closest('.ask-done');", "  if (event.target.closest('.ask-leave')) { const ride = false;")], expect: /timed out|Timeout|mounting/ },
  { name: 'the town\'s people left out', edits: [one('sim/rider-scene.mjs', "  if (person.resident || person.keeper || person.townSiteId) return 'town';", "  if (false) return 'town';")], expect: /nobody of the town is in the scene/ },
];
for (const injection of INJECTIONS) for (const edit of injection.edits) {
  const text = readFileSync(edit.file, 'utf8').replace(/\r\n/g, '\n');
  if (!text.includes(edit.from)) throw new Error(`Injection pattern not found in ${edit.file}: ${injection.name}`);
}
const run = () => {
  const result = spawnSync(process.execPath, ['scripts/rider-scene-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 900000 });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
};
const record = [];
for (const injection of INJECTIONS) {
  const originals = new Map(injection.edits.map(edit => [edit.file, readFileSync(edit.file, 'utf8')]));
  let result;
  try {
    for (const edit of injection.edits) {
      const original = readFileSync(edit.file, 'utf8'), crlf = original.includes('\r\n');
      const text = original.replace(/\r\n/g, '\n').replace(edit.from, edit.to);
      writeFileSync(edit.file, crlf ? text.replace(/\n/g, '\r\n') : text);
    }
    result = run();
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
  const failLine = result.out.split('\n').find(line => line.startsWith('FAIL')) || '';
  const caught = result.status !== 0 && injection.expect.test(failLine);
  record.push({ name: injection.name, caught, failed: failLine.slice(0, 300) });
  console.log(`${caught ? 'CAUGHT' : 'MISSED'} ${injection.name}: ${failLine.slice(0, 200)}`);
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/rider-scene-browser-injections.json', `${JSON.stringify({ record: 'rider-scene-browser-injections', date: new Date().toISOString().slice(0, 10), caught: record.filter(one => one.caught).length, of: record.length, injections: record }, null, 1)}\n`);
console.log(`\n${record.filter(one => one.caught).length} of ${record.length} caught.`);
