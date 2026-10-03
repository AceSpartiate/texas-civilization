// Browser injections for `npm run test:land-paths` (CLAUDE.md: "a new test is not evidence until it has failed"). Each puts back one
// exact mistake in the page, runs the proof, and expects it to stop at the check that guards it; every file is restored.
// Run: node scripts/land-paths-browser-injections.mjs (with PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE set as for the proof).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const INJECTIONS = [
  { name: 'the page draws a land walk as the straight line between ticks', expect: /seen on her way|the page draws her on the server's points walked/,
    file: 'public/motion.js', from: "  if (!Array.isArray(points) || points.length < 2 || entity.travel", to: "  if (true || !Array.isArray(points) || points.length < 2 || entity.travel" },
  { name: 'no tree is drawn over somebody in front of it', expect: /a tree in front of her is drawn over her/,
    file: 'public/app.js', from: "      if (point.y <= person.point.y || point.y - look.height >= person.point.y) continue;", to: "      continue;" },
  // Not here: the page's own keeping of a child inside the rails (`drawEntity`, the yard clamp). The server keeps play inside them,
  // and this proof's child is never drawn near enough the rails for the clamp to matter (removing it, 2026-10-02, the proof passed).
  { name: 'the yard\'s rails are not drawn', expect: /window.__yardDrawn|Timeout/,
    file: 'public/app.js', from: "    try { drawYardFence(ground, world, camera); } catch { /* the ground without the yard's rails */ }", to: "" },
  // Paths all automatic (owner, 2026-10-03, "All automatic").
  { name: 'the ways trodden on their own are not drawn', expect: /Timeout/,
    file: 'public/app.js', from: "  for (const path of land.paths || []) {", to: "  for (const path of []) {" },
  { name: 'the yard\'s gate is not left open in the drawn rails', expect: /the gate left open in the drawn rails/,
    file: 'public/app.js', from: "  const gate = yard.fence !== 'ruined' && yard.gate ? [", to: "  const gate = false && yard.gate ? [" },
];
const run = () => { try { execFileSync(process.execPath, ['scripts/land-paths-browser-proof.mjs'], { encoding: 'utf8', stdio: 'pipe', timeout: 900000 }); return ''; } catch (error) { return `${error.stdout}\n${error.stderr}`; } };
const results = [];
for (const injection of INJECTIONS) {
  const text = readFileSync(injection.file, 'utf8'), crlf = text.includes('\r\n'), plain = crlf ? text.replace(/\r\n/g, '\n') : text;
  if (!plain.includes(injection.from)) throw new Error(`${injection.name}: not found`);
  const changed = plain.replace(injection.from, injection.to);
  try {
    writeFileSync(injection.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    const out = run();
    const caught = Boolean(out) && injection.expect.test(out);
    const line = (out.match(/(AssertionError[^\n]*|TimeoutError[^\n]*|page\.waitForFunction[^\n]*)/) || [''])[0];
    results.push({ injection: injection.name, caught, stopped: line });
    console.log(`${caught ? 'CAUGHT' : 'MISSED'}: ${injection.name} -> ${line}`);
  } finally { writeFileSync(injection.file, text); }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/land-paths-browser-injections.json', `${JSON.stringify({ date: new Date().toISOString().slice(0, 10), caught: results.filter(r => r.caught).length, of: results.length, results }, null, 2)}\n`);
console.log(`${results.filter(r => r.caught).length} of ${results.length} caught`);
