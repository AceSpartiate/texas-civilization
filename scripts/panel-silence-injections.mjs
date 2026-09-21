// The regressions tests/panel-silence.test.mjs guards, injected one at a time (CLAUDE.md: "A new test is not evidence
// until it has failed"). Each injection replaces one exact piece of public/family-panel.js with the mistake a test is
// written against, runs the tests, records which failed, and puts the file back byte for byte. It stops if a replacement
// does not match exactly once, so a stale injection is never passed off as a proof.
//
// The page's half - the line really drawn on a row, hidden on the main person's row because the bar at the bottom of the
// screen carries it there - is public/app.js and public/style.css, and is proved by scripts/panel-silence-browser-proof.mjs,
// which injects its own three faults with `--inject`.
//
// Run: node scripts/panel-silence-injections.mjs  → writes docs/evidence/panel-silence-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/panel-silence.test.mjs', 'tests/family-panel.test.mjs'];
const FILE = 'public/family-panel.js';
const INJECTIONS = [
  {
    // The rule the whole line rests on: a row with anything open is not a row with nothing to do. Somebody at work is
    // the case that bites - every other chore is refused to them in one and the same sentence (sim/chores.mjs), so
    // without this the bar collapses and takes the glowing icon and the only way to stop the work with it.
    name: 'a row with work still open is collapsed to one line, so somebody at work loses their glow and their call-off',
    from: '  if (icons.some(icon => icon.can)) return null;',
    to: '  if (!icons.length && !offered.length) return null;',
  },
  {
    name: 'the line is read from every icon at once, so the orders’ blank reasons drown the work’s and the main person says nothing',
    from: '  const chores = icons.filter(icon => icon.kind === \'chore\');\n  if (chores.length) return only(chores);',
    to: '  const chores = [];\n  if (chores.length) return only(chores);',
  },
  {
    name: 'a blank reason counts as a reason, so a row shows an empty line where it should show none',
    from: '    return list.length && reasons.size === 1 ? [...reasons][0] || null : null;',
    to: '    return list.length && reasons.size === 1 ? [...reasons][0] : null;',
  },
  {
    name: 'a row refused for two different reasons picks the first, so a student is told the wrong one and loses the other',
    from: '    return list.length && reasons.size === 1 ? [...reasons][0] || null : null;',
    to: '    return list.length ? [...reasons].find(Boolean) || null : null;',
  },
  {
    name: 'the dead and the captured, whose row has no icons at all, are read like everybody else and stay silent',
    from: '  return gone(entity) ? only(offered.map(entry => ({ why: entry.can ? \'\' : whyOf(entry, offered) }))) : null;',
    to: '  return null;',
  },
  {
    // The standing rule of this codebase: the sentence is the server's (CLAUDE.md, "valid refusal"). A page that writes
    // its own is the exact thing the owner's instruction ruled out.
    name: 'the page writes its own sentence for a row with nothing on it, instead of the one the server sent',
    from: '  return gone(entity) ? only(offered.map(entry => ({ why: entry.can ? \'\' : whyOf(entry, offered) }))) : null;',
    to: '  return gone(entity) ? \'There is nothing for them to do.\' : null;',
  },
  {
    name: 'the one refused icon of a serving row is not read, so a man shut in the Alamo has a row that says nothing',
    from: '  if (icons.length) return only(icons);',
    to: '  if (icons.length) return null;',
  },
  {
    // sim/chores.mjs `choresFor` deletes the land hunt's `why` when the timber hunt already carries it. Read literally,
    // that one blank turns a child's unanimous refusal into two reasons and the row goes silent again.
    name: 'the land hunt’s shared refusal is read as a blank, so a child under ten has two reasons and is given none',
    from: 'const whyOf = (entry, offered) => (entry.id === \'hunt-land\' && !entry.can && !entry.why\n  ? offered.find(other => other.id === \'hunt-timber\')?.why\n  : entry.why);',
    to: 'const whyOf = entry => entry.why;',
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file || FILE;
  const original = readFileSync(file, 'utf8');
  // The patterns above are written with plain newlines; a working copy on Windows has CRLF, and a pattern that cannot
  // match is a harness that quietly proves nothing. Four harnesses in this repository have been caught doing exactly
  // that, one of them on 2026-09-21.
  const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
  const ends = text => (original.includes(CR + LF) ? text.split(LF).join(CR + LF) : text);
  const from = ends(injection.from), to = ends(injection.to);
  const count = original.split(from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(from, to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/panel-silence-injections.json', `${JSON.stringify({ record: 'panel-silence-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/panel-silence-injections.json`);
