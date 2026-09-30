// The regressions the checks of 2026-09-29 guard - the art as WebP (triage D14), the Tips button (D16) and tap, then send
// (D17) - injected one at a time (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces one exact piece
// of a file with the mistake a test is written against, runs the test files, records which tests failed, checks that the test
// written for it is among them and no other, and puts the file back byte for byte.
//
// Run: node scripts/webp-tips-touch-injections.mjs  → writes docs/evidence/webp-tips-touch-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/webp.test.mjs', 'tests/delivery.test.mjs', 'tests/creation.test.mjs', 'tests/tips-touch.test.mjs', 'tests/tips.test.mjs', 'tests/family-panel.test.mjs', 'tests/asset-http.test.mjs'];
const T = {
  lossless: 'every sheet with a person the page recolours is lossless', current: 'the server sends the WebP only while it was made from the PNG',
  http: 'a WebP never made is answered with its PNG over HTTP', asks: 'the page asks for each sheet by the hash its manifest records',
  title: 'the curtain', reread: 'the Tips list holds every tip put away', gates: 'the Tips list gates nothing',
  tap: 'on a touch screen the first tap on an icon', wiring: 'the page asks iconPress for every press on an icon',
};
const INJECTIONS = [
  // D14: the art as WebP.
  { name: 'every sheet quality 90, the recoloured people too', file: 'scripts/build-webp.mjs', from: 'const lossless = people.has(sheet);', to: 'const lossless = false;', expect: T.lossless },
  { name: 'the creation screen\'s landscapes are not made', file: 'scripts/build-webp.mjs', from: "matchAll(/url\\(['\"]?assets\\/webp\\/", to: "matchAll(/url\\(['\"]?assets\\/nowhere\\/", expect: T.lossless },
  { name: 'a WebP is sent whatever PNG it was made from', file: 'server/delivery.mjs', from: 'const current = Boolean(webp && fileFacts(webp).sha256 === entry.webp && (!png || fileFacts(png).sha256 === entry.png));', to: 'const current = Boolean(webp);', expect: T.current },
  { name: 'a package with no PNG answers the PNG\'s URL with nothing', file: 'server/delivery.mjs', from: "  if (current) return { path: webp, extension: 'webp', pins: [entry.png] };\n  return made", to: "  if (current && made) return { path: webp, extension: 'webp', pins: [entry.png] };\n  return made", expect: T.current },
  { name: 'a tree with no WebP made shows no art', file: 'server/delivery.mjs', from: "return made && png ? { path: png, extension: 'png', pins: null } : null;", to: 'return null;', expect: T.current },
  { name: 'a PNG sent for a WebP is kept by the browser for good', file: 'server/delivery.mjs', from: "return made && png ? { path: png, extension: 'png', pins: null } : null;", to: "return made && png ? { path: png, extension: 'png', pins: [] } : null;", expect: T.current },
  { name: 'the page asks for the PNG again', file: 'public/art.js', from: "const image = await loadImage(`${WEBP_BASE}${sheetPath(source).replace(/\\.png$/, '.webp')}${pin}`);", to: 'const image = await loadImage(`/assets/${sheetPath(source)}${pin}`);', expect: T.asks },
  { name: 'the title screen\'s landscape is the PNG again', file: 'public/style.css', from: "url('assets/webp/creation-title-landscape.webp')", to: "url('assets/creation-title-landscape.png')", expect: T.lossless },
  // D16: the Tips button.
  { name: 'the tips list is in the order they were seen, oldest first', file: 'public/tips.js', from: '  return ids.reverse().map(', to: '  return ids.map(', expect: T.reread },
  { name: 'the tips list offers "Resume tutorial" again', file: 'public/tips.js', from: "export const NOT_REREAD = Object.freeze(['resume']);", to: 'export const NOT_REREAD = Object.freeze([]);', expect: T.reread },
  { name: 'opening the tips list marks a tip seen on the server', file: 'public/app.js', from: "  $('#tips-toggle')?.setAttribute('aria-expanded', 'true');\n", to: "  $('#tips-toggle')?.setAttribute('aria-expanded', 'true');\n  api('/api/command', { action: 'seen-tip', tip: 'order' });\n", expect: T.gates },
  { name: 'the Host is given the Tips button', file: 'public/app.js', from: "const own = world && world.role !== 'host' && world.householdId && !world.watching;", to: 'const own = world && world.householdId && !world.watching;', expect: T.gates },
  // D17: tap, then send.
  { name: 'a tap sends at once, as a mouse press does', file: 'public/family-panel.js', from: "  if (!touch || opensChooser || armed) return 'send';\n  return 'arm';", to: "  return 'send';", expect: T.tap },
  { name: 'a second tap arms again and never sends', file: 'public/family-panel.js', from: "  if (!touch || opensChooser || armed) return 'send';", to: "  if (!touch || opensChooser) return 'send';", expect: T.tap },
  { name: 'a refused icon armed by a tap', file: 'public/family-panel.js', from: "  if (refused) return 'explain';\n", to: '', expect: T.tap },
  { name: 'the page never asks whether a press was a tap', file: 'public/app.js', from: '      touch: touchPress(event), refused:', to: '      touch: false, refused:', expect: T.wiring },
  { name: 'the armed popup goes when the finger lifts', file: 'public/app.js', from: "if (icon && !icon.contains(event.relatedTarget) && !panelTipFor?.armed) hidePanelTip();", to: 'if (icon && !icon.contains(event.relatedTarget)) hidePanelTip();', expect: T.wiring },
  { name: 'a keyboard press is taken for a tap', file: 'public/app.js', from: '  if (!event || event.detail === 0) return false;', to: '  if (!event) return false;', expect: T.wiring },
];

const failing = output => [...new Set([...output.matchAll(/^\s*✖ (.+?) \(\d/gm)].map(match => match[1].trim()).filter(name => !/^tests[\\/]/.test(name) && name !== 'failing tests:'))];
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  if (!original.replace(/\r\n/g, '\n').includes(injection.from)) throw new Error(`Injection pattern not found in ${injection.file}: ${injection.name}`);
}
const clean = run();
if (clean.length) throw new Error(`The tests fail before anything is injected: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const original = readFileSync(injection.file, 'utf8');
  const crlf = original.includes('\r\n');
  const text = original.replace(/\r\n/g, '\n').replace(injection.from, injection.to);
  writeFileSync(injection.file, crlf ? text.replace(/\n/g, '\r\n') : text);
  let failed;
  try { failed = run(); } finally { writeFileSync(injection.file, original); }
  const caught = failed.some(name => name.includes(injection.expect));
  const only = caught && failed.every(name => name.includes(injection.expect));
  record.push({ name: injection.name, file: injection.file, expected: injection.expect, caught, only, failed });
  console.log(`${caught ? (only ? 'CAUGHT' : 'CAUGHT+') : 'MISSED'}  ${injection.name}${caught && !only ? ` (also: ${failed.filter(name => !name.includes(injection.expect)).join('; ')})` : ''}`);
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/webp-tips-touch-injections.json', `${JSON.stringify({ record: 'webp-tips-touch-injections', date: new Date().toISOString().slice(0, 10), files: FILES, caught: record.filter(one => one.caught).length, of: record.length, injections: record }, null, 2)}\n`);
const missed = record.filter(one => !one.caught);
console.log(`\n${record.length - missed.length} of ${record.length} caught. Wrote docs/evidence/webp-tips-touch-injections.json`);
if (missed.length) process.exit(1);
