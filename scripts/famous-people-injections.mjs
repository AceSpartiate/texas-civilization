// The regressions the famous people's checks guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of the code with the mistake - found exactly once, CRLF or not - runs
// the check written for it, records what stopped it, and puts the file back byte for byte.
//
// Unit injections run tests/famous-people.test.mjs and require the named test, and no other in the file, to fail. Browser
// injections run scripts/famous-people-browser-proof.mjs and require its failure to be the message written for that check.
// Each gate is run clean first and again at the end.
//
// Run: node scripts/famous-people-injections.mjs [unit|browser]  -> writes docs/evidence/famous-people-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const T = 'tests/famous-people.test.mjs';
const UNIT = [
  { name: 'Travis on the map at Béxar into the siege, where the Alamo draws him too', file: 'sim/people.mjs',
    from: "map: [{ from: on(1836, 2, 3, 16), until: 'alamo-siege', site: 'bexar',", to: "map: [{ from: on(1836, 2, 3, 16), until: 'alamo-assault', site: 'bexar',",
    expect: 'the roster\'s itineraries fit the engagements\' clocks: nobody is on the campaign map while their own battle draws them' },
  { name: 'Travis falls somewhere other than the north battery', file: 'sim/battles/alamo.mjs',
    from: "        { id: 'travis', at: 'north-battery', pose: 'fire', face: 'north-out' },", to: "        { id: 'travis', at: 'north-in', pose: 'fire', face: 'north-out' },",
    expect: 'Travis falls at the north battery at his moment, and not a minute before; he lies there until the dead are carried out' },
  { name: 'Bowie drawn falling like a man in a fight, not lying still on his cot', file: 'sim/people.mjs',
    from: "claimId: 'HIST-TEX-543', pose: 'still-bed', liesUntil: 'after' },", to: "claimId: 'HIST-TEX-543', liesUntil: 'after' },",
    expect: 'Bowie lies ill on his cot in his room on the south side, and lies still there when that barrack is carried; nothing of how is drawn' },
  { name: 'Crockett\'s death shown as the record, not as one account', file: 'sim/battles/alamo.mjs',
    from: "pose: 'captive', tag: 'One account (de la Peña) · disputed' },", to: "pose: 'captive' },",
    expect: 'Crockett fights through the assault and, as de la Peña tells it, is taken and killed before Santa Anna after it - labelled one account, the other accounts on screen' },
  { name: 'Castrillón shot standing on his crate, not walking away', file: 'sim/battles/san-jacinto.mjs',
    from: "{ id: 'castrillon', keys: [[0, 'crate'], [2, 'crate'], [5, 'castrillonWalk']], face: 'mexicanCamp', pose: 'command' },", to: "{ id: 'castrillon', keys: [[0, 'crate'], [5, 'crate']], face: 'mexicanCamp', pose: 'command' },",
    expect: 'the church guns and their gunners fall together; Castrillón falls walking away at San Jacinto; Grant and Fannin are told, never drawn' },
  { name: 'a named line allowed from somebody not drawn in its phase', file: 'sim/battle-stage.mjs',
    from: "      if (line.person && !seenSpeaking(phase, line.person, line.at)) fail(`${line.person} says ${line.id} in ${phase.id} without being drawn there`);\n", to: '',
    expect: 'every named line comes out of its speaker\'s own figure, drawn there at that minute, and none is reconstructed' },
  { name: 'the account says every man who fought was killed', file: 'sim/alamo.mjs',
    from: 'In about an hour it was over. Nearly every defender was killed,', to: 'In about an hour it was over. Every man who fought was killed,',
    expect: 'Joe lives in every text: he fights beside Travis, takes cover and fires, comes out, is hurt and saved, is brought before Santa Anna and goes to Gonzales' },
  { name: 'Emily West\'s words without their stage direction', file: 'sim/battles/san-jacinto.mjs',
    from: "{ person: 'emily-west', manner, claimId: 'HIST-TEX-560', gloss: PICNIC_GLOSS }", to: "{ person: 'emily-west', claimId: 'HIST-TEX-560', gloss: PICNIC_GLOSS }",
    expect: 'Emily West\'s picnic is a story told later: tradition, with a stage direction, never the record, never more than talk and a meal' },
  { name: 'the line in the sand spoken as the record', file: 'sim/battles/alamo.mjs',
    from: "say('line-sand', 12, TEX, 'officer', 'tradition',", to: "say('line-sand', 12, TEX, 'officer', 'documented',",
    expect: 'the legends are spoken on the field as tradition, glossed as told later: the line in the sand, "stop that firing", the Napoleon of the West' },
  { name: 'the Twin Sisters unnamed on April 20', file: 'sim/battles/san-jacinto.mjs',
    from: "{ id: 'twins-20-1', person: 'twin-sisters', side: TEX,", to: "{ id: 'twins-20-1', side: TEX,",
    expect: 'the Twin Sisters are named and fire where the record puts them: before the camp on April 20 under Neill, who is hit, and within two hundred yards on the 21st under Hockley' },
  { name: 'Houston hurt in the volley, before the charge', file: 'sim/people.mjs',
    from: "fate: { kind: 'wounded', battle: 'san-jacinto', phase: 'charge', at: 3, claimId: 'HIST-TEX-564' },", to: "fate: { kind: 'wounded', battle: 'san-jacinto', phase: 'volley', at: 1, claimId: 'HIST-TEX-564' },",
    expect: 'Houston rides with the line, is wounded in the charge at his minute, and lies wounded the next day; the Napoleon of the West comes out of Santa Anna' },
  { name: 'a family sees a famous person a hundred times further off than its people could', file: 'sim/famous.mjs',
    from: 'eyes.some(at => Math.hypot(at.x - one.x, at.y - one.y) <= FAMOUS_SIGHT_MILES)', to: 'eyes.some(at => Math.hypot(at.x - one.x, at.y - one.y) <= FAMOUS_SIGHT_MILES * 100)',
    expect: 'a family sees a famous person on the map only where its own people could, and nobody is drawn on the map and a field at once' },
  { name: 'the famous dead sent lying on the field in the phases before they fall', file: 'sim/battle-stage.mjs',
    from: '    if (!fellIn || fellIn.index >= phase.index || phase.index >= until', to: '    if (!fellIn || fellIn.index === phase.index || phase.index >= until',
    expect: 'a fate is never sent before its minute, and nothing of a later phase is sent' },
].map(one => ({ ...one, test: T }));
const BROWSER = [
  { name: 'the famous drawn without their names', file: 'public/battle-view.js',
    from: "ctx.fillStyle = '#26382e'; ctx.fillText(text, x, top + font); said.labelled = true;", to: "ctx.fillStyle = '#26382e';",
    expect: 'was not drawn with his name on the screen at the assault' },
  { name: 'Crockett\'s "one account" tag not drawn', file: 'public/battle-view.js',
    from: "ctx.fillStyle = '#3b392f'; ctx.fillText(person.tag, x, ty + tagFont + 2); said.tag = person.tag;", to: "ctx.fillStyle = '#3b392f';",
    expect: 'The input did not match the regular expression /One account \\(de la Peña\\)/' },
  { name: 'the stage direction dropped from the bubble', file: 'public/speech.js',
    from: "  const manner = line.manner ? `(${line.manner})` : '';", to: "  const manner = '';",
    expect: 'her words lost their stage direction or their tradition label' },
];

const CR = '\r', LF = '\n';
function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${injection.file} ${count} times`);
  writeFileSync(injection.file, original.replace(from, () => to));
  try { return check(); } finally { writeFileSync(injection.file, original); }
}
function runUnit(file) {
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 20 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}
function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/famous-people-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 40 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: ([^\n]+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'all';
const record = { unit: [], browser: [] };
const evidencePath = 'docs/evidence/famous-people-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }
if (which === 'all' || which === 'unit') {
  const clean = runUnit(T); if (!clean.passed) throw new Error(`${T} fails before any injection: ${clean.failed.join('; ')}`);
  for (const injection of UNIT) {
    const seen = inject(injection, () => runUnit(injection.test));
    const caught = !seen.passed && seen.failed.length === 1 && seen.failed[0] === injection.expect;
    record.unit.push({ name: injection.name, file: injection.file, test: injection.test, expect: injection.expect, caught, failed: seen.failed });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
  }
  const after = runUnit(T); if (!after.passed) throw new Error(`${T} fails after every file was put back: ${after.failed.join('; ')}`);
}
if (which === 'all' || which === 'browser') {
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of BROWSER) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure, checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure || 'the gate passed'}`);
  }
}
mkdirSync('docs/evidence', { recursive: true });
const merged = {
  record: 'famous-people-injections', date: new Date().toISOString().slice(0, 10),
  gates: { unit: `node --test ${T}, the named test and no other`, browser: 'scripts/famous-people-browser-proof.mjs' },
  unit: record.unit.length ? record.unit : previous.unit || [],
  browser: record.browser.length ? record.browser : previous.browser || [],
  cleanBrowserChecks: record.cleanBrowserChecks ?? previous.cleanBrowserChecks ?? null,
  environment: 'Same computer: node --test, and local classroom servers with headless Chrome at 1366x768 and 1024x768.',
};
writeFileSync(evidencePath, `${JSON.stringify(merged, null, 2)}\n`.replace(/\n/g, '\r\n'));
const all = [...merged.unit, ...merged.browser];
console.log(`\n${all.filter(one => one.caught).length} of ${all.length} caught by the check written for them. Wrote ${evidencePath}`);
