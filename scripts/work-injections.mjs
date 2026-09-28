// Injections for people drawn at their work (owner, 2026-09-28; public/work-art.js, docs/ART_REQUESTS.md request 2026-09-28 —
// people at work). CLAUDE.md: "a new test is not evidence until it has failed". Each injection puts back one exact mistake:
// the unit injections run tests/work-art.test.mjs and the binding tests beside it and record which tests fail against the
// test the injection was written for; the browser injections run the browser proof (npm run test:work) and record the
// assertion it fails on. Every file is restored. Run: node scripts/work-injections.mjs [--unit-only]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILES = ['tests/work-art.test.mjs', 'tests/motion-binding.test.mjs', 'tests/animation.test.mjs'];
const T = {
  table: 'every activity the server can report is in the one table',
  strokes: 'every stroke is a pose the library holds, moving, and every stand-in names its request and shows the work',
  drawn: 'somebody at each piece of work is drawn at it, not standing beside it',
  parts: 'the part of the work is told by its own words, and going to it or carrying from it is walking',
  ring: 'several people at one piece of work stand round it and face it; one alone stands at it',
  strike: 'the tool and its effect land on the pose’s own strike, and change from frame to frame',
  beat: 'each strike is told once to whoever listens (the work sounds)',
  axe: 'felling, the lane, the bee tree, the carreta, the house and splitting rails show an axe or a maul, not the hoe, moving with the swing',
};
const one = (file, from, to) => ({ file, from, to });
const UNIT = [
  { name: 'a chore the table does not draw (felling left out)', expect: T.table, edits: [one('public/work-art.js', "  'fell-trees': { stroke: 'chop', spread: 0.45 },\n", '')] },
  { name: 'working about the place not drawn', expect: T.table, edits: [one('public/work-art.js', "  'task:work': { stroke: 'about', spread: 0.9 },\n", '')] },
  { name: 'a stand-in that shows nothing (chopping in a one-frame idle, no chips)', expect: T.strokes, edits: [one('public/work-art.js', "  chop: { pose: 'work', art: 'stand-in', tool: 'axe', effect: 'chips', beat: 2, request: item(1) },", "  chop: { pose: 'idle-e', art: 'stand-in', request: item(1) },")] },
  { name: 'a stand-in with no request', expect: T.strokes, edits: [one('public/work-art.js', "  dig: { pose: 'work', art: 'stand-in', effect: 'earth', beat: 2, request: item(4) },", "  dig: { pose: 'work', art: 'stand-in', effect: 'earth', beat: 2 },")] },
  { name: 'a pose the library does not hold', expect: T.strokes, edits: [one('public/work-art.js', "  fish: { pose: 'rest', art: 'stand-in',", "  fish: { pose: 'fish', art: 'stand-in',")] },
  { name: 'the renderer never asks the work table', expect: T.drawn, edits: [one('public/motion.js', '    const work = workClip(entity, variant);\n', '    const work = null;\n')] },
  { name: 'working about the place drawn for a child', expect: T.drawn, edits: [one('public/work-art.js', "  if (entity.task === 'work' && entity.atHome && !CHILD_BANDS.has(entity.band)) return 'task:work';", "  if (entity.task === 'work' && entity.atHome) return 'task:work';")] },
  { name: 'the part of the work not read from its words', expect: T.parts, edits: [one('public/work-art.js', '  for (const [pattern, stroke] of entry.by || NONE) if (pattern.test(doing)) return stroke;\n', '')] },
  { name: 'somebody stepped over the land to the next tree drawn chopping', expect: T.parts, edits: [one('public/work-art.js', '  if (entity.strolling || stroke.art === \'journey\' || GOING.test(doing)) {', "  if (stroke.art === 'journey' || GOING.test(doing)) {")] },
  { name: 'several at one piece of work stacked on one spot', expect: T.ring, edits: [one('public/work-art.js', '    if (other.id < entity.id) index++;\n', '')] },
  { name: 'at the work facing away from it', expect: T.ring, edits: [one('public/work-art.js', "  out.face = out.x > 0.01 ? 'w' : 'e';", "  out.face = 'e';")] },
  { name: 'builders stood inside the house', expect: T.ring, edits: [one('public/work-art.js', "Math.PI * (1 - (index + 0.5) / count)", "Math.PI * (1 + (index + 0.5) / count)")] },
  { name: 'the chips fly a frame late', expect: T.strike, edits: [one('public/work-art.js', '  if (!own && Number.isFinite(stroke.beat)) for (let i = 0; i < stroke.beat && i < durations.length; i++) beatAt += durations[i];', '  if (!own && Number.isFinite(stroke.beat)) for (let i = 0; i <= stroke.beat && i < durations.length; i++) beatAt += durations[i];')] },
  { name: 'the chips frozen in the air', expect: T.strike, edits: [one('public/work-art.js', '    const px = sx + dir * size * effect.out * (0.35 + 0.65 * a) * u;', '    const px = sx + dir * size * effect.out * (0.35 + 0.65 * a);'), one('public/work-art.js', '    const py = sy - size * effect.up * (0.5 + b) * (u - u * u * 1.6);', '    const py = sy - size * effect.up * (0.5 + b);')] },
  { name: 'the float does not bob', expect: T.strike, edits: [one('public/work-art.js', '    const bob = still ? 0 : Math.sin((since / clock.period) * Math.PI * 2) * size * 0.025;', '    const bob = 0;'), one('public/work-art.js', "      ctx.strokeStyle = `rgba(230,240,245,${(0.6 * (1 - u)).toFixed(3)})`; ctx.lineWidth = 1;\n      ctx.beginPath(); ctx.ellipse(floatX, floatY + size * 0.01, size * (0.04 + 0.16 * u), size * (0.015 + 0.05 * u), 0, 0, Math.PI * 2); ctx.stroke();", "      ctx.beginPath(); ctx.ellipse(floatX, floatY, size * 0.1, size * 0.03, 0, 0, Math.PI * 2); ctx.stroke();")] },
  { name: 'felling drawn with the hoe (no axe)', expect: T.axe, edits: [one('public/work-art.js', "  chop: { pose: 'work', art: 'stand-in', tool: 'axe', effect: 'chips', beat: 2, request: item(1) },", "  chop: { pose: 'work', art: 'stand-in', effect: 'chips', beat: 2, request: item(1) },")] },
  { name: 'the axe held still while the swing goes on', expect: T.axe, edits: [one('public/work-art.js', "drawn += drawHaftTool(ctx, stroke.tool, figure, still ? 0 : clock.frame, x, y, size, dir);", "drawn += drawHaftTool(ctx, stroke.tool, figure, 0, x, y, size, dir);")] },
  { name: 'splitting rails drawn with the axe', expect: T.axe, edits: [one('public/work-art.js', "  split: { pose: 'work', art: 'stand-in', tool: 'maul',", "  split: { pose: 'work', art: 'stand-in', tool: 'axe',")] },
  { name: 'every frame a strike to the work sounds', expect: T.beat, edits: [one('public/work-art.js', '  if (beatSeen.get(id) === clock.count) return;\n', '')] },
];
// In the browser (the proof's own assertion is what is expected to fail).
const BROWSER = [
  { name: 'at work drawn frozen, with nothing over it', expect: /hoeing cycle showed|dust was never thrown|pixels round the hoer/, edits: [one('public/app.js', "    paused: binding.frozen, flip, appearance: entity.appearance,\n    timeMs: animationTime + seed,", "    paused: true, flip, appearance: entity.appearance,\n    timeMs: animationTime + seed,"), one('public/app.js', '  const marks = drawWorkLayer(ctx, stroke, x + shift, y, size, dir, workClockOut, still);', '  const marks = 0;')] },
  { name: 'the page never draws anybody at the work', expect: /working about the place|__workDrawn|Timeout/, edits: [one('public/app.js', '    if (binding.work) { if (drawAtWork(ctx, binding, clip, x, y, size, entity)) return; }\n    else if (animated(', '    if (animated(')] },
  { name: 'three on the house drawn on one spot', expect: /stacked on one spot/, edits: [one('public/app.js', '    : atWork ? { x: workSlotOut.x * 26, y: workSlotOut.y * 26 }', '    : atWork ? { x: 0, y: 0 }')] },
  { name: 'the page never puts the axe in their hands', expect: /no drawn axe in hand/, edits: [one('public/app.js', "workClockOut, still, clip.slice(0, clip.length - stroke.pose.length - 1));", "workClockOut, still, null);")] },
  { name: 'the survey drawn standing still', expect: /pacing:/, edits: [one('public/app.js', '  const shift = still ? 0 : strokeShift(stroke, workClockOut) * size, face = still ? null : strokeFace(stroke, workClockOut);', '  const shift = 0, face = null;')] },
];

function failing() {
  try { execFileSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', stdio: 'pipe' }); return []; }
  catch (error) { return [...new Set(String(error.stdout).split('\n').filter(line => /^✖ /.test(line) && !/failing tests/.test(line)).map(line => line.replace(/^✖ /, '').replace(/ \(\d+(\.\d+)?ms\)$/, '')))]; }
}
function proof() {
  try { execFileSync(process.execPath, ['scripts/work-browser-proof.mjs'], { encoding: 'utf8', stdio: 'pipe', timeout: 600000 }); return null; }
  catch (error) { return `${error.stdout || ''}\n${error.stderr || ''}`.split('\n').filter(line => /Error|assert|Timeout/i.test(line)).slice(0, 3).join(' / ') || String(error.message); }
}
// Whatever is injected is put back if the run is stopped part way (Ctrl+C, a timeout), not only when an injection ends.
let pending = null;
const putBack = () => { if (pending) for (const [file, text] of pending) writeFileSync(file, text); pending = null; };
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => { putBack(); process.exit(130); });
process.on('exit', putBack);
function withEdits(injection, run) {
  const originals = new Map();
  for (const { file } of injection.edits) if (!originals.has(file)) originals.set(file, readFileSync(file, 'utf8'));
  const changed = new Map(originals);
  for (const { file, from, to } of injection.edits) {
    // The working copy may be CRLF: the patterns are matched in its own line endings, and each must be there exactly once.
    const text = changed.get(file), crlf = text.includes('\r\n');
    const wanted = crlf ? from.replace(/\n/g, '\r\n') : from, put = crlf ? to.replace(/\n/g, '\r\n') : to;
    if (text.split(wanted).length !== 2) throw new Error(`${injection.name}: the text to replace is not in ${file} exactly once`);
    changed.set(file, text.replace(wanted, () => put));
  }
  pending = originals;
  try { for (const [file, text] of changed) writeFileSync(file, text); return run(); } finally { putBack(); }
}

const baseline = failing();
if (baseline.length) throw new Error(`the suite fails before anything is injected: ${baseline.join(' | ')}`);
const results = [];
for (const injection of UNIT) {
  const failed = withEdits(injection, failing);
  const caught = failed.includes(injection.expect);
  results.push({ kind: 'unit', name: injection.name, expect: injection.expect, caught, onlyThat: caught && failed.length === 1, failed });
  console.log(caught ? (failed.length === 1 ? 'CAUGHT' : 'CAUGHT+') : 'MISSED', injection.name, '->', failed.join(' | '));
}
if (!process.argv.includes('--unit-only')) {
  const clean = proof();
  if (clean) throw new Error(`the browser proof fails before anything is injected: ${clean}`);
  for (const injection of BROWSER) {
    const failed = withEdits(injection, proof);
    const caught = Boolean(failed) && injection.expect.test(failed);
    results.push({ kind: 'browser', name: injection.name, expect: String(injection.expect), caught, failed });
    console.log(caught ? 'CAUGHT' : 'MISSED', injection.name, '->', failed);
  }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/work-injections.json', JSON.stringify({ record: 'work-injections', date: new Date().toISOString().slice(0, 10), files: FILES,
  caught: results.filter(r => r.caught).length, onlyThat: results.filter(r => r.onlyThat).length, of: results.length, results }, null, 2) + '\n');
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught (${results.filter(r => r.onlyThat).length} unit injections by their test alone); wrote docs/evidence/work-injections.json`);
