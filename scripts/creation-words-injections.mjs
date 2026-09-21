// The regressions tests/creation-words.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed"). Each injection puts one exact string back to the mistake the wizard actually carried before
// 2026-09-21 - or to a plausible new one - runs the test file, records which tests failed, and restores the file byte for
// byte.
//
// CRLF: this working copy is CRLF and a `from` written with bare newlines matches nothing in it, which is how two
// harnesses in this repo were found to have been silently catching zero. `ends` converts each pattern to the line endings
// the file on disk actually uses, and a replacement that is not found exactly once throws rather than passing quietly.
//
// Run: node scripts/creation-words-injections.mjs  → writes docs/evidence/creation-words-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/creation-words.test.mjs'];
const HTML = 'public/index.html';
const APP = 'public/app.js';
const APPEARANCE = 'public/appearance.js';
const CREATION = 'public/creation.js';
const GRANTS = 'sim/grants.mjs';

const INJECTIONS = [
  {
    name: 'the title card goes back to its pre-tutorial promise (the field, the timber, the town, at once)',
    file: HTML,
    from: '  <p>You are one family among the settlers of Texas in the autumn of 1835. First you make them, in four steps: roll the die\n    for who they are, give the family a last name, name each of them, and choose how the parents look.</p>',
    to: '  <p>You are one family among the settlers of Texas in the autumn of 1835. You will roll for who they are, name them, and\n    choose how the parents look. After that the country is yours to work: the field, the timber, the town, and whatever the\n    year brings.</p>',
  },
  {
    name: 'the title card drops the sentence saying the game walks the student through the farm',
    file: HTML,
    from: '  <p class="creation-begin-after">From the moment the wagon starts in, the game walks you through the farm one task at a\n    time - the house, the field, the crop, the town, the hunt and the well - and will not let you jump ahead. The country\n    is yours to work once that is done.</p>',
    to: '',
  },
  {
    name: 'the stock choice stops carrying the herd it brings, so the panel can only say the acres again',
    file: GRANTS,
    from: ', space: STOCK_SPACE, herd: { ...OPENING_HERD } } };',
    to: ', space: STOCK_SPACE } };',
  },
  {
    name: 'the wagon panel stops saying the family arrives with animals',
    file: APP,
    from: "    const herd = choice.herd ? ` The family arrives with ${choice.herd.cattle} cattle and ${choice.herd.hogs} hogs, which feed themselves on the range and feed the family.` : '';",
    to: "    const herd = '';",
  },
  {
    name: 'the wagon panel writes the herd numbers itself instead of reading the server’s',
    file: APP,
    from: '` The family arrives with ${choice.herd.cattle} cattle and ${choice.herd.hogs} hogs,',
    to: '` The family arrives with 6 cattle and 12 hogs,',
  },
  {
    name: '"Anything left out is not coming", which the blacksmith and the store contradict',
    file: HTML,
    from: '      <p id="wagon-load-text">What you load is what the family arrives with. Tools, seed and powder can be bought in a\n        town later, if there is coin; the things for the house cannot be bought anywhere.</p>',
    to: '      <p id="wagon-load-text">What you load is what your family has. Anything left out is not coming.</p>',
  },
  {
    name: 'the wagon panel stops saying when the choice closes',
    file: HTML,
    from: '      <p id="wagon-when">You can change all of this until your teacher presses Start. After that the wagon is packed.</p>\n',
    to: '',
  },
  {
    name: 'the die panel goes back to saying nothing about the roll being taken once',
    file: HTML,
    from: '      <p id="family-roll-text">The die decides how many are in your family and who they are. It is thrown once. There is no\n        second roll, so the family it gives you is the family you play.</p>',
    to: '      <p id="family-roll-text">Roll the die to find out who your family is.</p>',
  },
  {
    name: 'the die panel gives away the mapping the owner keeps hidden',
    file: HTML,
    from: 'The die decides how many are in your family and who they are.',
    to: 'The die decides how many parents and children your family has.',
  },
  {
    name: 'the last name box stops saying it is set once',
    file: HTML,
    from: '        <p id="surname-hint">Everybody in the family carries it. It is chosen once and cannot be changed afterwards; first\n          names can be changed at any time, on the family panel.</p>\n',
    to: '',
  },
  {
    name: 'the looks pop-up stops saying the looks are chosen once and the children are not asked for',
    file: HTML,
    from: 'Nothing about a person depends on how they look - it changes nothing in the game. Chosen once, and kept. The children are not asked for: they take after their parents.',
    to: 'Choose how they look. Nothing about a person depends on it.',
  },
  {
    name: 'the names card stops saying every box is already filled in',
    file: HTML,
    from: '    <p id="names-hint">Step 3 of 4. They are already named: change any you like, or press Continue and keep them. You can\n      rename anybody later on the family panel.</p>\n',
    to: '',
  },
  {
    name: 'the die panel loses its step number',
    file: HTML,
    from: '      <span class="eyebrow">STEP 1 OF 4</span>',
    to: '      <span class="eyebrow">BEFORE THE CLASS BEGINS</span>',
  },
  {
    name: 'the looks pop-up loses its step line, so a second parent is an unannounced second screen',
    file: APPEARANCE,
    from: "    step.textContent = `Step 4 of 4. ${of > 1 ? `Parent ${index + 1} of ${of}. ` : ''}Done ${last ? 'finishes your family' : 'brings up the next parent'}.`;",
    to: "    step.textContent = '';",
  },
  {
    name: 'the looks counter goes back to counting only the parents still waiting, so the total shrinks after the first Done',
    file: APPEARANCE,
    from: "const parentsOf = family => (family?.people || []).filter(person => person.choices);",
    to: "const parentsOf = family => (family?.people || []).filter(person => person.choices && !person.chosen);",
  },
  {
    name: 'an emptied name box is skipped silently again, leaving a box showing a name nobody has',
    file: CREATION,
    from: '        if (!typed) { if (input) input.value = person.given || person.name; continue; }\n        if (typed === (person.given || person.name)) continue;',
    to: '        if (!typed || typed === (person.given || person.name)) continue;',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file;
  const original = readFileSync(file, 'utf8');
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed, ...(injection.expect && { expect: injection.expect }) });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/creation-words-injections.json', `${JSON.stringify({
  record: 'creation-words-injections',
  date: new Date().toISOString().slice(0, 10),
  note: 'The words and the choices of the family-creation wizard (2026-09-21). Every injection is a sentence the wizard actually carried before this pass, or the code that made one true, put back.',
  files: FILES,
  injections: record,
}, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/creation-words-injections.json`);
