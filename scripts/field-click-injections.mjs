// Each check of the field clicked for its crop and of the carreta and the hunt found, watched failing (CLAUDE.md: "A new test is not
// evidence until it has failed"; owner, 2026-09-30, docs/FAMILY_PANEL.md §23, docs/LAND_GRANTS.md §5.3, docs/WOODS_AND_BUILDING.md
// §6.9). Every injection is the exact regression a check guards, put into the code; the test file or the browser proof is run; the
// test named must fail and every other test in the file pass - or, for the browser proof, it must stop at the step named, every step
// before it passing - and the code is put back.
//
// Run: node scripts/field-click-injections.mjs [--node] [--browser] [--only <words>]  → docs/evidence/field-click-injections.json
// (PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE as for every browser proof; the browser half takes some ten minutes).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const TEST = 'tests/field-click-hunt.test.mjs', TOUCH = 'tests/tips-touch.test.mjs', PROOF = 'scripts/field-click-browser-proof.mjs';
const NODE = [
  { file: 'sim/carreta.mjs', test: TEST, fails: 'a carreta short of its logs', from: '    short: carretaShort,\n', to: '' },
  { file: 'sim/carreta.mjs', test: TEST, fails: 'a carreta short of its logs', from: "export const carretaShort = (world, household, entity, why) => Boolean(why) && carretaOffered(world) && why === carretaShortOf(household);", to: "export const carretaShort = (world, household, entity, why) => Boolean(why) && carretaOffered(world);" },
  { file: 'sim/carreta.mjs', test: TEST, fails: 'a carreta short of its logs', also: ['the carreta\'s tip'], from: '  if (beastsOf(world, household, \'wagon\').length >= BEASTS_MOST || !carretaShortOf(household)) return null;', to: '  return null;' },
  { file: 'sim/chores.mjs', test: TEST, fails: 'a hunt whose rifle is at the war', from: "CHORES['hunt-land'] = {\n  short: rifleShort,\n", to: "CHORES['hunt-land'] = {\n" },
  { file: 'sim/wants.mjs', test: TEST, fails: 'a hunt whose rifle is at the war', from: "  const rifle = toolCount(household, 'rifle') > 0 && !userOf(world, household, 'rifle') ? 1 : 0;", to: "  const rifle = toolCount(household, 'rifle') > 0 ? 1 : 0;" },
  { file: 'sim/chores.mjs', test: TEST, fails: 'the chore catalogue carries the seed', from: "    ...(chore.plants && { seeds: Object.fromEntries(Object.keys(CROPS).map(crop => [crop, seedFor(crop)])) }),\n", to: '' },
  { file: 'public/family-panel.js', test: TEST, fails: 'the page keeps a short goal', from: '  return icons.filter(icon => open.includes(icon) || icon.goal);', to: '  return open;' },
  { file: 'public/family-panel.js', test: TEST, fails: 'the page keeps a short goal', from: '      ...(!entry.can && !waits && entry.short && { goal: true }),\n', to: '' },
  { file: 'public/family-panel.js', test: TEST, fails: 'the page keeps a short goal', from: '    const key = from?.keys.find(one => keysOnBar.includes(one));', to: '    const key = from?.keys[0];' },
  { file: 'public/family-panel.js', test: TEST, fails: 'a plot tapped on the map is read', from: '  return [barId, mainId, ...order].find(may) || barId || mainId || order[0] || null;', to: '  return barId || mainId || order[0] || null;' },
  { file: 'public/family-panel.js', test: TEST, fails: 'a plot tapped on the map is read', from: "export const plotWorkFor = plot => ({ staked: 'clear-plot', bare: 'plant-field', ripe: 'harvest-field' })[plotStage(plot)] || null;", to: "export const plotWorkFor = plot => ({ staked: 'clear-plot', bare: 'plant-field', growing: 'plant-field', ripe: 'harvest-field' })[plotStage(plot)] || null;" },
  { file: 'public/tips.js', test: TEST, fails: 'the carreta\'s tip', from: "    cart: !leading && Boolean(world.household.wants?.carreta) && !(world.entities || []).some(", to: "    cart: !leading && Boolean(world.household.wants?.carreta) || !(world.entities || []).some(" },
  { file: 'public/app.js', test: TOUCH, fails: 'the page asks iconPress', from: "if (icon && !icon.contains(event.relatedTarget) && !panelTipFor?.armed && !panelTipFor?.pinned) hidePanelTip();", to: "if (icon && !icon.contains(event.relatedTarget) && !panelTipFor?.armed) hidePanelTip();" },
];
// The browser proof: `after` is the last step that must still pass before it stops (null: it stops at the first).
const BROWSER = [
  { file: 'public/app.js', after: null, guards: 'a plot under the mouse is lit', from: '      id = plot ? plot.id : null;', to: '      id = null;' },
  { file: 'public/app.js', after: 'off the plot it is not lit', guards: 'a plot clicked opens the chooser', from: '      if (plot && openPlotChooser(window.__snapshot.world, plot)) return;', to: '' },
  { file: 'public/app.js', after: 'off the plot it is not lit', guards: 'each crop\'s seed on its button', from: "      button.replaceChildren(document.createTextNode(label), ...(seedWords ? [element('small', seedWords, 'plant-seed')] : []));", to: '      button.replaceChildren(document.createTextNode(label));' },
  { file: 'public/app.js', after: 'a growing plot clicked', guards: 'the field line\'s chip opens a plot from the keyboard', from: "      span.addEventListener('click', event => openChipPlot(chip.crop, chip.stage, event.detail === 0));", to: '' },
  { file: 'public/app.js', after: 'from the keyboard', guards: 'the carreta kept on the bar greyed', from: '    const visibleIcons = barIcons(icons, icon => icon.active || (icon.can && (!shutting || allowsIcon(lesson, icon))))', to: '    const visibleIcons = icons.filter(icon => icon.active || (icon.can && (!shutting || allowsIcon(lesson, icon))))' },
  { file: 'public/app.js', after: 'pressed, its popup says', guards: 'Go hunting opens the hunt', from: '  if (target) { target.focus(); target.click(); }', to: '' },
  { file: 'public/app.js', after: 'a place clicked', guards: 'hides on the supplies line', from: "  if (hides > 0) supplies.push({ key: 'hides', text: `Hides ${hides.toFixed(0)}`, level: 'good' });", to: '' },
  { file: 'public/app.js', after: 'the hunt brought', guards: 'Bring it in on a ripe plot', from: "    harvest.hidden = !(stage === 'ripe' && facts);", to: '    harvest.hidden = true;' },
];

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const wantNode = !args.includes('--browser') || args.includes('--node'), wantBrowser = !args.includes('--node') || args.includes('--browser');
const pick = list => (only ? list.filter(one => (one.fails || one.guards).includes(only)) : list);
const results = [];
let bad = 0;

function inject(injection, check) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = crlf ? original.replace(/\r\n/g, '\n') : original;
  if (!text.includes(injection.from)) { bad++; results.push({ ...injection, ok: false, why: 'the code to inject into was not found' }); console.log('NOT FOUND', injection.file, injection.from.slice(0, 80)); return; }
  const changed = text.replace(injection.from, injection.to);
  writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
  try { check(); } finally { writeFileSync(injection.file, original); }
}
function runTest(test) {
  try { return execFileSync(process.execPath, ['--test', '--test-reporter=tap', test], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (error) { return String(error.stdout || ''); }
}
const failedNames = out => [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map(match => match[1]);
function runProof() {
  try { return { code: 0, out: execFileSync(process.execPath, [PROOF], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000 }) }; }
  catch (error) { return { code: error.status ?? 1, out: String(error.stdout || '') }; }
}
const passedSteps = out => [...out.matchAll(/^PASS (.*)$/gm)].map(match => match[1]);

if (wantNode) {
  const list = pick(NODE);
  const files = [...new Set(list.map(one => one.test))];
  for (const file of files) if (failedNames(runTest(file)).length) throw new Error(`${file} fails before any injection`);
  for (const injection of list) inject(injection, () => {
    const failed = failedNames(runTest(injection.test));
    const ok = failed.some(name => name.includes(injection.fails)) && failed.every(name => name.includes(injection.fails) || (injection.also || []).some(other => name.includes(other)));
    if (!ok) bad++;
    results.push({ kind: 'node', file: injection.file, test: injection.test, expected: injection.fails, failed, ok });
    console.log(ok ? 'CAUGHT' : 'MISSED', injection.file, '→', failed.join(' | ') || 'nothing failed');
  });
}
if (wantBrowser) {
  const list = pick(BROWSER);
  if (list.length) {
    const clean = runProof();
    if (clean.code !== 0) throw new Error(`the proof fails before any injection:\n${clean.out.slice(-2000)}`);
  }
  for (const injection of list) inject(injection, () => {
    const run = runProof();
    const steps = passedSteps(run.out);
    const last = steps.at(-1) || null;
    const ok = run.code !== 0 && (injection.after === null ? steps.length === 0 : Boolean(last?.startsWith(injection.after) || last?.includes(injection.after)));
    if (!ok) bad++;
    results.push({ kind: 'browser', file: injection.file, guards: injection.guards, stoppedAfter: last, expectedAfter: injection.after, exit: run.code, ok });
    console.log(ok ? 'CAUGHT' : 'MISSED', injection.guards, '→ stopped after:', last || '(the first step)', `exit ${run.code}`);
  });
}
const total = results.length;
writeFileSync('docs/evidence/field-click-injections.json', `${JSON.stringify({ at: new Date().toISOString(), caught: total - bad, of: total, results }, null, 1)}\n`);
console.log(`\n${total - bad} of ${total} injected regressions caught by their own check.`);
if (bad) process.exit(1);
