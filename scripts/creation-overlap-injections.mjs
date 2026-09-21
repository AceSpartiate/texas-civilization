// The regressions `scripts/creation-browser-proof.mjs` guards, injected one at a time (CLAUDE.md: "A new test is not
// evidence until it has failed"). Five of these seven are the faults a real screen was measured to have on 2026-09-21
// (docs/evidence/creation-overlap*.json) put back one by one; the other two are the two ways this kind of check goes
// quietly vacuous - a card nothing is drawn on, and a card whose controls have all been made invisible.
//
// Caught is not enough. An injection that trips some *other* check has not proved the check it was written for, so each
// one names the sentence it expects and the run records the sentence the proof actually failed with.
//
// Run: node scripts/creation-overlap-injections.mjs  -> docs/evidence/creation-overlap-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PROOF = 'scripts/creation-browser-proof.mjs';
const INJECTIONS = [
  {
    name: 'the world behind the curtain is left reachable, as it was until 2026-09-21: Tab walked off every step onto the map and as many as 89 controls of a world the student cannot see',
    file: 'public/creation.js',
    from: '    node.inert = up;',
    to: '    node.inert = false;',
    expect: 'Tab leaves the',
  },
  {
    name: 'nothing puts focus on the card a step arrives on, so a keyboard starts at the top of the document and a screen reader never reads the step\'s heading',
    file: 'public/creation.js',
    from: '  card.focus({ preventScroll: true });',
    to: '  void card;',
    expect: 'focus does not arrive on the',
  },
  {
    // The wagon rather than the naming card, and on purpose. A button pushed *outside* its card is caught by the
    // covering check first, which is right but proves nothing about this one. A button left *inside* a card that
    // scrolls as a whole - the wagon's Done packing, 771px down the list on 2026-09-21 - is the case only this check can
    // see, because a control scrolled out of a box that scrolls is reachable and is deliberately not called covered.
    name: 'the wagon goes back to scrolling as a whole, so Done packing sits 771px down a list a student must scroll to the end of',
    file: 'public/style.css',
    from: 'max-height:calc(100% - 150px);display:flex;flex-direction:column;overflow:hidden;',
    to: 'max-height:calc(100% - 150px);overflow:auto;',
    expect: 'below the fold of its own card',
  },
  {
    name: 'the box the family\'s last name is typed into goes back to 37px, under the 44px a finger needs',
    file: 'public/style.css',
    from: '#surname-input{font-size:18px;padding:6px 8px;min-height:44px}',
    to: '#surname-input{font-size:18px;padding:6px 8px}',
    expect: 'smaller than a finger',
  },
  {
    name: 'the looks options go back to 6px apart, closer than a finger can tell two targets apart',
    file: 'public/style.css',
    from: '.looks-options{display:flex;flex-wrap:wrap;gap:8px}',
    to: '.looks-options{display:flex;flex-wrap:wrap;gap:6px}',
    expect: 'apart, closer than the',
  },
  {
    name: 'the curtain is drawn over the cards that stand on it, so every control of every step is covered by the scene behind it',
    file: 'public/style.css',
    from: '#creation{position:fixed;inset:0;z-index:40;background:#1d2218;overflow:hidden}',
    to: '#creation{position:fixed;inset:0;z-index:42;background:#1d2218;overflow:hidden}',
    expect: 'is drawn over a control of the',
  },
  {
    name: 'the list of parts on the looks card is made invisible - the way this check would go vacuous, since a control nothing draws covers nothing, is never off the screen and is never too small',
    file: 'public/style.css',
    from: '#looks-parts{overflow-y:auto;min-height:0;flex:1 1 auto}',
    to: '#looks-parts{overflow-y:auto;min-height:0;flex:1 1 auto;visibility:hidden}',
    expect: 'fewer than the',
  },
];

const run = () => {
  const result = spawnSync(process.execPath, [PROOF], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: process.env });
  const output = `${result.stdout}${result.stderr}`;
  if (!result.status) return { failed: false, passes: [...output.matchAll(/^PASS (.+)$/gm)].length };
  // Not greedy: an assertion whose own sentence contains a colon ("focus does not arrive on the X card: it is on Y")
  // was otherwise recorded by whatever followed its *last* colon, and so read as caught by another check. Three of
  // these seven read that way until this was one character different.
  const said = /AssertionError[^\n]*?: ([^\n]+)/.exec(output) || /Error: ([^\n]+)/.exec(output);
  // A proof that fell over without saying why is not a caught injection, and hiding that behind a tidy sentence is how a
  // harness comes to prove nothing: the last of what it printed is kept instead.
  return { failed: true, why: said ? said[1].trim() : `the proof failed without a sentence: ${output.trim().split('\n').slice(-6).join(' / ')}`, passes: [...output.matchAll(/^PASS (.+)$/gm)].length };
};

const clean = run();
if (clean.failed) throw new Error(`The proof fails before any injection: ${clean.why}`);
console.log(`clean: ${clean.passes} checks pass\n`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  // This working copy is CRLF. Two harnesses here were found to have been silently matching nothing for want of these
  // three lines, which is a harness that proves exactly nothing while printing that everything was caught.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, to));
  let result;
  try { result = run(); } finally { writeFileSync(injection.file, original); }
  const forItsOwnReason = result.failed && (result.why || '').toLowerCase().includes(injection.expect.toLowerCase());
  record.push({ name: injection.name, file: injection.file, expect: injection.expect, caught: result.failed, forItsOwnReason, why: result.why || null, checksPassedFirst: result.passes });
  console.log(`${!result.failed ? 'MISSED' : forItsOwnReason ? 'caught' : 'caught, but by another check'}: ${injection.name}\n   -> ${result.why || 'the proof passed anyway'}\n`);
}
if (run().failed) throw new Error('The proof fails after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/creation-overlap-injections.json', `${JSON.stringify({ record: 'creation-overlap-injections', date: new Date().toISOString().slice(0, 10), proof: PROOF, cleanChecks: clean.passes, injections: record }, null, 2)}\n`);
console.log(`${record.filter(one => one.forItsOwnReason).length} of ${record.length} caught by the check written for them; wrote docs/evidence/creation-overlap-injections.json`);
