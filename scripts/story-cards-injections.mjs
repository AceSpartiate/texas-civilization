// The regressions the story cards (owner, 2026-09-29: the house's card; the big moments in the same frame) are guarded against,
// injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"): each replaces exact text with the mistake,
// runs the check written for it - tests/military-attention.test.mjs, or with --browser `npm run test:story-cards` and
// `npm run test:family-panel` - records what failed, and puts every file back byte for byte.
//
// Run: node scripts/story-cards-injections.mjs           → docs/evidence/story-cards-injections.json
// and: node scripts/story-cards-injections.mjs --browser → docs/evidence/story-cards-injections-browser.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const withBrowser = process.argv.includes('--browser');
const M = 'public/military-attention.js';
const INJECTIONS = [
  // ------------------------------------------------------------------ the moments' cards (tests/military-attention.test.mjs)
  { name: 'the family\'s big moments are not put up as cards (as before)', edits: [{ file: M, from: '      const moment = MOMENTS[need.kind];', to: '      const moment = null;' }] },
  { name: 'the call to arms is put up once for every person who may answer it', edits: [{ file: M, from: "      if (need.kind === 'call') { if (seenCall.has(world.request?.id)) continue; seenCall.add(world.request?.id); }\n", to: '' }] },
  { name: 'a very sick person holds the Watch card back', edits: [{ file: M, from: "  const deciding = !world.watching && (notices.some(notice => notice.kind !== 'siege') || world.request?.status === 'open' || meeting?.status === 'open' || roadAsking);", to: "  const deciding = !world.watching && (notices.some(notice => notice.kind !== 'siege') || world.request?.status === 'open' || meeting?.status === 'open' || roadAsking || own.some(person => person.sickness?.grave));" }] },
  { name: 'the Watch card goes up over the order to leave and ¡Alto!', edits: [{ file: M, from: ' || meeting?.status === \'open\' || roadAsking);', to: ' || meeting?.status === \'open\');' }], browserToo: true },
  { name: '¡Alto! is not first', edits: [{ file: M, from: 'alto: -3, road: -2', to: 'alto: 0.5, road: -2' }] },
  // ------------------------------------------------------------------ the page (npm run test:story-cards, npm run test:family-panel)
  { name: 'the house card is never shown', browser: 'both', edits: [{ file: 'public/app.js', from: '  if (card.hidden !== !shown) { card.hidden = !shown; queueColumnFit(); }', to: '  if (!card.hidden) { card.hidden = true; queueColumnFit(); }' }] },
  { name: 'the house card loses its own colour, and cannot be told from the neighbours\' card', browser: 'story', edits: [{ file: 'public/style.css', from: '.story-card[data-accent=house]{--card-edge:#7f9a3f;', to: '.story-card[data-accent=house-lost]{--card-edge:#7f9a3f;' }] },
  { name: 'the house card does not glow', browser: 'both', edits: [{ file: 'public/style.css', from: '.story-card[data-quiet=true]{animation:none;', to: '.story-card[data-accent=house]{animation:none}\n.story-card[data-quiet=true]{animation:none;' }] },
  { name: 'an alert keeps the old plain look: no accent of its own', browser: 'story', edits: [{ file: 'public/app.js', from: "  setData(panel, 'accent', notice.kind);\n", to: '' }] },
  { name: 'an alert has no icon', browser: 'story', edits: [{ file: 'public/app.js', from: "    const drawn = ICONS[notice.kind] && drawSprite(ctx, ICONS[notice.kind], icon.width / 2, icon.height * 0.9, icon.height * 0.84);", to: '    const drawn = false;' }] },
  { name: 'an alert\'s time left is not on its card', browser: 'story', edits: [{ file: 'public/app.js', from: '  militaryDeadline = Number.isFinite(notice.leftMs) ? performance.now() + notice.leftMs : null;', to: '  militaryDeadline = null;' }] },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const runTests = () => { const result = spawnSync(process.execPath, ['--test', 'tests/military-attention.test.mjs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };
const runProof = script => {
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 1500000 });
  if (result.status === 0) return [];
  const passed = [...`${result.stdout}`.matchAll(/^PASS (.+)$/gm)].length;
  const why = `${result.stderr}`.split('\n').find(line => /Error|assert|Timeout/.test(line)) || `exit ${result.status}`;
  return [`${script} failed after ${passed} checks: ${why.trim().slice(0, 220)}`];
};
if (runTests().length) throw new Error('The tests fail before any injection');
const record = [];
const CR = String.fromCharCode(13), LF = String.fromCharCode(10);
for (const injection of INJECTIONS) {
  const browser = injection.browser || (withBrowser && injection.browserToo ? 'story' : null);
  if (withBrowser ? !browser : Boolean(injection.browser)) continue;
  const originals = new Map();
  try {
    for (const edit of injection.edits) {
      if (!originals.has(edit.file)) originals.set(edit.file, readFileSync(edit.file, 'utf8'));
      const text = readFileSync(edit.file, 'utf8');
      const count = needle => text.split(needle).length - 1;
      const crlf = !count(edit.from) && count(edit.from.split(LF).join(CR + LF));
      const from = crlf ? edit.from.split(LF).join(CR + LF) : edit.from, to = crlf ? edit.to.split(LF).join(CR + LF) : edit.to;
      if (count(from) !== 1) throw new Error(`${injection.name}: the text to replace is in ${edit.file} ${count(from)} times`);
      writeFileSync(edit.file, text.replace(from, to));
    }
    const failed = withBrowser
      ? [...(['story', 'both'].includes(browser) ? runProof('scripts/story-cards-browser-proof.mjs') : []), ...(browser === 'both' ? runProof('scripts/family-panel-browser-proof.mjs') : [])]
      : runTests();
    record.push({ name: injection.name, files: [...originals.keys()], ...(withBrowser && { proofs: browser }), caught: failed.length > 0, failed });
    console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
  } finally { for (const [file, text] of originals) writeFileSync(file, text); }
}
if (runTests().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
const out = `docs/evidence/story-cards-injections${withBrowser ? '-browser' : ''}.json`;
writeFileSync(out, `${JSON.stringify({ record: 'story-cards-injections', date: new Date().toISOString().slice(0, 10), injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.caught).length} of ${record.length} caught; wrote ${out}`);
