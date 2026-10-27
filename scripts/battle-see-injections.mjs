// The regressions the checks of 2026-10-27 guard - the smoke going the way the shot goes, and the fight seen through its smoke and
// framed where it is fought (docs/BATTLES.md §17) - injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Each injection replaces exact text (found exactly once, CRLF or not), runs the test file written for it, requires the
// named tests and no others in that file to fail, and puts the file back byte for byte. Each file is run clean first and again
// at the end. Same computer. `browser`: the checks of §17.2 in scripts/battle-cinema-browser-proof.mjs, each run of the proof required to fail
// with the message written for its check; the proof is run clean first and again at the end.
// Run: node scripts/battle-see-injections.mjs [unit|browser]  -> docs/evidence/battle-see-injections.json (each mode keeps the other's record)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const DIRECTION = 'tests/battle-smoke-direction.test.mjs', SEEN = 'tests/battle-see.test.mjs';
const LINE = 'a line firing north throws its smoke north, and one firing south throws it south - not east or west';
const GUN = 'a gun laid north throws its four puffs north, and a man in a square fires out of his own face';
const NAMED = 'a named man drawn firing north - Travis at the north battery - makes smoke, and it goes north';
const WIND = 'the smoke drifts with the wind and never against it, however light: rising is height, not ground';
const WALL = 'a volley\'s wall of smoke lies along the rank, whichever way the rank faces';
const FRAME = 'the camera frames where the fighting is: a body standing silent far off is left out, the men being fired at are kept';
const THROUGH = 'every man in the fight is seen through its smoke: the banks thinned round each of them, a fresh plume over a man drawn thinner';
const VIEW = 'public/battle-view.js';
const UNIT = [
  // §17.1: the way the smoke goes.
  { name: 'every plume thrown east or west by the sign of the aim, as before 2026-10-27', file: VIEW,
    from: '      jetX: aim ? aim.x * thrown : 0, jetY: aim ? aim.y * thrown : 0,', to: '      jetX: aim ? (aim.x >= 0 ? 1 : -1) * thrown : 0, jetY: 0,',
    test: DIRECTION, expect: [LINE, GUN, NAMED] },
  { name: 'a man firing at will throws his smoke the way his figure is drawn', file: VIEW,
    from: "              puff(muzzle.x, muzzle.y, now, { wind, dir: aimOf(facing, slot) }); flash(muzzle.x, muzzle.y, right, now, 1);\n            }\n          }\n        } else if (volley", to: "              puff(muzzle.x, muzzle.y, now, { wind, dir: right ? 1 : -1 }); flash(muzzle.x, muzzle.y, right, now, 1);\n            }\n          }\n        } else if (volley",
    test: DIRECTION, expect: LINE },
  { name: 'a gun throws its puffs east or west', file: VIEW,
    from: '      for (let i = 0; i < 4; i++) puff(muzzle.x + fx * i * reach * 0.4, muzzle.y + fy * i * reach * 0.4 + (Math.random() - 0.5) * reach * 0.5, now, { big: true, wind, dir: aim });',
    to: '      for (let i = 0; i < 4; i++) puff(muzzle.x + fx * i * reach * 0.4, muzzle.y + fy * i * reach * 0.4 + (Math.random() - 0.5) * reach * 0.5, now, { big: true, wind, dir: fx >= 0 ? 1 : -1 });',
    test: DIRECTION, expect: GUN },
  { name: 'a square\'s faces all fire the way the square faces', file: VIEW,
    from: '  if (!slot?.out) return f;', to: '  return f;', test: DIRECTION, expect: GUN },
  { name: 'a named man drawn firing makes no smoke', file: VIEW,
    from: '        if (view.holding || t < at || t >= at + 400 || view.hiddenShots.has(shotKey)) return;', to: '        return;',
    test: DIRECTION, expect: NAMED },
  { name: 'the smoke\'s rising counted as ground going north', file: VIEW,
    from: '      vx: w.x * 1.7e-6 + (Math.random() - 0.5) * 1.2e-7, vy: w.y * 1.7e-6, rise: 0.5e-7, h: 0,', to: '      vx: w.x * 1.7e-6 + (Math.random() - 0.5) * 1.2e-7, vy: w.y * 1.7e-6 - 0.5e-7, rise: 0, h: 0,',
    test: DIRECTION, expect: WIND },
  { name: 'a volley\'s wall always laid east to west', file: VIEW,
    from: "    const line = shape === 'wall' && across ? unitOf(across) : { x: 1, y: 0 };", to: '    const line = { x: 1, y: 0 };',
    test: DIRECTION, expect: WALL },
  // §17.2: the fight seen.
  { name: 'the whole field framed, the silent ring and all, as before 2026-10-27', file: 'public/battle-frame.js',
    from: '  if (active.length) {', to: '  if (false) {', test: SEEN, expect: FRAME },
  { name: 'the men being fired on left out of the frame', file: 'public/battle-frame.js',
    from: '    const near = one => active.includes(one) || anchors.some(other => reach(one, other, FIGHT_REACH)) || active.some(other => reach(one, other, GUN_SIDE));', to: '    const near = one => active.includes(one);',
    test: SEEN, expect: FRAME },
  { name: 'the reach reckoned from a gun beside the men as from the men', file: 'public/battle-frame.js',
    from: '    const anchors = bodiesActive.length ? bodiesActive : active;', to: '    const anchors = active;', test: SEEN, expect: FRAME },
  { name: 'the smoke thinned round the class\'s own men only, as before 2026-10-27', file: VIEW,
    from: '      const hole = menAt.length ? holeSprite() : null;', to: '      const hole = null;', test: SEEN, expect: THROUGH },
  { name: 'a fresh plume over a man drawn at full strength', file: VIEW,
    from: '      else if (grid.size && manUnder(', to: '      else if (false && manUnder(', test: SEEN, expect: THROUGH },
];
// §17.2 on the page: scripts/battle-cinema-browser-proof.mjs, each failure carrying the message written for its check.
const BROWSER = [
  { name: 'the class panel and the Rumor Mill left open over the film', file: 'public/app.js', from: "    if (filming) { filmFolded = ['#host-class', '#rumor-mill'].map(one => $(one)).filter(one => one?.open); for (const one of filmFolded) one.open = false; }", to: '    if (filming) { filmFolded = []; }', expect: 'the class panel or the Rumor Mill stood open over the fight' },
  { name: 'the teacher\'s column left whole over the film', file: 'public/style.css', from: 'body[data-film=host] #recover,body[data-film=host] #join-links,body[data-film=host] #class-days,body[data-film=host] #late,body[data-film=host] #classes{display:none}', to: '', expect: 'the teacher\'s column stood over the fight' },
  { name: 'the panels not given back when the teacher takes the camera', file: 'public/app.js', from: '    else { for (const one of filmFolded) one.open = true; filmFolded = []; }', to: '    else { filmFolded = []; }', expect: 'the page did not come back when the teacher took the camera' },
  { name: 'the student\'s column left open while watching', file: 'public/app.js', from: '  } else setPanelFolded(filming || placingWas || panelFolded());', to: '  } else setPanelFolded(placingWas || panelFolded());', expect: 'the student\'s page stood over the fight while watching' },
  { name: 'Watch pressed before the fight was drawn leaves a still frame', file: 'public/app.js', from: '    if (!(fieldWatch && !fieldWatch.filmed && manualView === fieldWatch.view && world.battle?.sides)) return;', to: '    return;', expect: 'Watch pressed before the fight was drawn' },
];

const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
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
  const result = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 10 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const summary = output.split('✖ failing tests:')[1] || '';
  const failed = [...new Set([...summary.matchAll(/^✖ (.+?) \(\d[\d.]*m?s\)\s*$/gm)].map(match => match[1]))];
  if (result.status !== 0 && !failed.length) failed.push(`exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failed };
}

function runBrowser() {
  const result = spawnSync(process.execPath, ['scripts/battle-cinema-browser-proof.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const output = `${result.stdout}${result.stderr}`;
  const failure = /AssertionError[^:]*: (.+)/.exec(output)?.[1]?.trim() || /Error: (.+)/.exec(output)?.[1]?.trim() || (result.status === 0 ? null : `exit ${result.status}: ${output.slice(-300)}`);
  return { passed: result.status === 0, failure, checks: (output.match(/^PASS /gm) || []).length };
}

const which = process.argv[2] || 'unit';
const evidencePath = 'docs/evidence/battle-see-injections.json';
let previous = {};
try { previous = JSON.parse(readFileSync(evidencePath, 'utf8')); } catch { /* the first run */ }
const record = { unit: previous.unit || [], browser: previous.browser || [] };
if (which === 'unit') {
record.unit = [];
const files = [...new Set(UNIT.map(one => one.test))];
for (const file of files) { const clean = runUnit(file); if (!clean.passed) throw new Error(`${file} fails before any injection: ${clean.failed.join('; ')}`); }
for (const injection of UNIT) {
  const seen = inject(injection, () => runUnit(injection.test));
  const expected = [].concat(injection.expect);
  const caught = !seen.passed && seen.failed.length === expected.length && expected.every(name => seen.failed.includes(name));
  record.unit.push({ name: injection.name, file: injection.file, test: injection.test, expect: injection.expect, caught, failed: seen.failed });
  console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER OR MORE THAN ONE'}: ${injection.name} -> ${seen.failed.join(' | ') || 'every test passed'}`);
}
for (const file of files) { const after = runUnit(file); if (!after.passed) throw new Error(`${file} fails after every file was put back: ${after.failed.join('; ')}`); }
}
if (which === 'browser') {
  record.browser = [];
  const clean = runBrowser();
  if (!clean.passed) throw new Error(`The browser gate fails before any injection: ${clean.failure}`);
  record.cleanBrowserChecks = clean.checks;
  for (const injection of BROWSER) {
    const seen = inject(injection, runBrowser);
    const caught = !seen.passed && Boolean(seen.failure?.includes(injection.expect));
    record.browser.push({ name: injection.name, file: injection.file, expect: injection.expect, caught, failure: seen.failure?.slice(0, 400), checksPassedFirst: seen.checks });
    console.log(`${caught ? 'caught' : seen.passed ? 'MISSED' : 'CAUGHT BY ANOTHER CHECK'}: ${injection.name} -> ${seen.failure?.slice(0, 300) || 'the gate passed'}`);
  }
  const after = runBrowser();
  if (!after.passed) throw new Error(`The browser gate fails after every file was put back: ${after.failure}`);
}
mkdirSync('docs/evidence', { recursive: true });
record.at = new Date().toISOString();
const all = [...record.unit, ...record.browser];
record.caught = all.filter(one => one.caught).length;
record.of = all.length;
writeFileSync(evidencePath, `${JSON.stringify(record, null, 2)}\n`);
console.log(`${record.caught} of ${record.of} caught (unit ${record.unit.length}, browser ${record.browser.length})`);
if (record.caught !== record.of) process.exitCode = 1;
