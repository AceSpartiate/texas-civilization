// Glory is never named before the ending (docs/MONEY_AND_GLORY.md §2, "It must be genuinely hidden until the end").
//
// tests/glory.test.mjs proves no glory *value* reaches a screen. This proves the *word* does not either: a note on a button
// saying a regular who leaves "loses glory" tells a student the hidden count exists and which way an answer moves it, which
// the doc forbids ("no answer may be labelled by the glory it would earn"). An audit on 2026-09-28 found three such notes -
// on sending for a regular (the family panel and the person's card) and on the camp's question after Goliad (sim/camp.mjs) -
// none of which a value-marker test could see, because they carry no number. So this looks for the word itself:
//
//   - in every string the pages can draw (public/, its scripts and its HTML), except the ending's own screen;
//   - in every string the server can write (sim/, server/), except the ending's own module;
//   - and in what the server actually sends while a class runs: every family's view, its family book and the Host's, through
//     the Gonzales slice and through a whole class on the real land, autumn, winter and spring.
//
// And, so a quiet pass means something, it checks the ending does say "glory" once the class has ended.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { applyAction, projectFamily, projectWorld, stepWorld } from '../sim/world.mjs';
import { learn } from '../sim/knowledge.mjs';
import { endedClass } from './support/ended-class.mjs';
import { stringsOf } from './support/source-strings.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WORD = /glory/i;
/**
 * The only places the word may be written. The ending is where glory is revealed (public/ending.js draws it, sim/ending.mjs
 * writes its sum and its questions); `'glory'` in sim/glory.mjs is the kind of the sealed award event, which the log drops
 * before any view is made (the wire walks below are what prove it never arrives). Anything new is a failure until it is
 * added here with its reason.
 */
const ALLOWED = [
  { file: 'public/ending.js' },
  { file: 'sim/ending.mjs' },
  // The farm at the end (owner, 2026-09-29, D8): a burned farm's glory, read only by sim/ending.mjs at the ending proper.
  { file: 'sim/farm-sale.mjs' },
  { file: 'sim/glory.mjs', text: 'glory' },
];
const allowed = (file, text) => ALLOWED.some(entry => entry.file === file && (entry.text === undefined || entry.text === text));
const IMPORT_PATH = /^\.{1,2}\/[\w./-]+\.m?js$/;

function sourcesUnder(dir, extensions) {
  return readdirSync(join(ROOT, dir), { recursive: true })
    .filter(name => extensions.test(name))
    .map(name => ({ file: relative(ROOT, join(ROOT, dir, name)).split(sep).join('/'), text: readFileSync(join(ROOT, dir, name), 'utf8') }));
}

/** Every string in the pages' scripts and the server's modules that names glory and is not the ending's. */
function namedInSource(sources) {
  const found = [];
  for (const { file, text } of sources) {
    if (/\.html$/.test(file)) {
      // What a page shows is its text, not its comments; an inline script's strings are read as a script's.
      const shown = text.replace(/<!--[\s\S]*?-->/g, '');
      for (const [index, line] of shown.split('\n').entries()) if (WORD.test(line) && !allowed(file, line.trim())) found.push(`${file}:${index + 1} ${line.trim().slice(0, 140)}`);
      continue;
    }
    for (const { text: words, line } of stringsOf(text)) {
      if (!WORD.test(words) || IMPORT_PATH.test(words) || allowed(file, words)) continue;
      found.push(`${file}:${line} "${words.slice(0, 140)}"`);
    }
  }
  return found;
}

test('no string a page draws or the server writes names glory, except the ending\'s', () => {
  const sources = [...sourcesUnder('public', /\.(m?js|html)$/), ...sourcesUnder('sim', /\.m?js$/), ...sourcesUnder('server', /\.m?js$/)];
  assert.ok(sources.some(one => one.file === 'public/family-panel.js') && sources.some(one => one.file === 'sim/camp.mjs'), 'the scan did not read the sources');
  // The scan sees the word where it is written: the ending's screen names it (were the reader blind, this would fail).
  assert.ok(stringsOf(readFileSync(join(ROOT, 'public/ending.js'), 'utf8')).some(one => WORD.test(one.text)), 'the scan found no glory even on the ending\'s screen');
  assert.deepEqual(namedInSource(sources), [], 'glory is named where a student or the Host can read it before the ending');
});

/** Everything the server sends while the class runs, to every family, its family book, and the Host, searched for the word. */
function watch(world, seen) {
  if (world.status !== 'running') return;
  const payloads = [['host', projectWorld(world, undefined, 'host', { includeMap: false })]];
  for (const householdId of Object.keys(world.households)) {
    payloads.push([householdId, projectWorld(world, householdId, 'student', { includeMap: false })]);
    payloads.push([`${householdId}'s family book`, projectFamily(world, householdId)]);
  }
  for (const [who, payload] of payloads) {
    const text = JSON.stringify(payload);
    const at = text.search(WORD);
    assert.equal(at, -1, `${who} was sent the word at tick ${world.tick}${world.period ? ` in period ${world.period}` : ''}: …${text.slice(Math.max(0, at - 160), at + 60)}…`);
  }
  seen.checks++;
}

test('the Gonzales slice names glory to nobody while it runs, and the ending does', () => {
  const world = createGonzalesWorld('glory-words-slice', 5);
  world.status = 'running';
  while (!world.truth['cannon-request']) stepWorld(world);
  // Two families go (one on up the river), one stays in town, and the rest stay home: glory is earned while the slice runs on.
  const policies = { 'hh-1': 'go-upriver', 'hh-2': 'stay-in-town', 'hh-3': 'stay' };
  for (const householdId of Object.keys(policies)) learn(world, householdId, 'cannon-request', { status: 'confirmed', source: 'Somebody who saw it' });
  const seen = { checks: 0 }, answered = new Set();
  while (world.status === 'running') {
    stepWorld(world);
    for (const [householdId, policy] of Object.entries(policies)) {
      const call = projectWorld(world, householdId, 'student', { includeMap: false }).request;
      if (call?.status !== 'open') continue;
      if (call.kind === 'supplies' && !answered.has(householdId)) {
        applyAction(world, householdId, { action: policy === 'stay' ? 'stay' : 'help', entityId: world.households[householdId].principalId });
        answered.add(householdId);
      }
      if (call.kind === 'march' && policy !== 'stay') applyAction(world, householdId, { action: policy, entityId: call.actorId });
    }
    watch(world, seen);
  }
  assert.ok(Object.keys(world.glory || {}).length >= 2, 'nobody earned any glory, so there was nothing to keep quiet');
  assert.ok(seen.checks > 25, `only ${seen.checks} ticks were watched`);
  assert.equal(world.status, 'ended');
  assert.match(JSON.stringify(projectWorld(world, 'hh-1', 'student', { includeMap: false }).ending), WORD, 'the ending does not name glory, so the watch above proves nothing');
});

test('a whole class on the real land - autumn, winter, spring - names glory to nobody before its end', () => {
  const seen = { checks: 0 };
  // Every fourth tick of some 1,250, and every tick on which a family's glory changed: an award is written the moment its
  // cause is, so what was said about it is on the wire that same tick. (Every tick costs a minute more and was not needed.)
  let lastTotals = '';
  const world = endedClass('glory-words-class', 5, {
    played: 2,
    onTick: world => {
      const totals = JSON.stringify(Object.values(world.glory || {}).map(ledger => ledger.total));
      if (world.tick % 4 && totals === lastTotals) return;
      lastTotals = totals;
      watch(world, seen);
    },
  });
  const awards = Object.values(world.glory || {}).reduce((sum, ledger) => sum + Object.keys(ledger.awards).length, 0);
  assert.ok(awards >= 5, `only ${awards} glory awards were made in a whole class, so there was little to keep quiet`);
  assert.ok(seen.checks > 250, `only ${seen.checks} ticks were watched`);
  const first = Object.keys(world.households)[0];
  assert.match(JSON.stringify(projectWorld(world, first, 'student', { includeMap: false }).ending), WORD, 'the ending does not name glory, so the watch above proves nothing');
});
