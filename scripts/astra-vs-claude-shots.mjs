// Astra's art against Claude's, subject by subject, as three builds resolve the same requests (owner, 2026-09-29: "a lot of
// astra art has been replaced with worse versions"). For each subject the page asks for Claude's pose by name and falls back to
// Astra's nearest pose when the library has none - the rule every caller follows (public/app.js `drawnClipOf`, `drawSeated`,
// public/battle-view.js `fallback`, public/work-art.js `drawnStroke`). This draws that request with each build's own
// public/art.js and manifests:
//   v2026.09.28.1   the last build before Claude's art: the fallback, Astra's
//   v2026.09.29.1   the released build: Claude's pose, where Claude drew one
//   main 3dd5209d   unreleased main before the fix: the same, and the wagon and ox as one drawing, its tail open
//   this tree       the fix (public/art-subjects.js): Astra's wherever she has drawn the subject, Claude's only where not
// Writes docs/evidence/astra-vs-claude/<group>.png (one row a subject, a column a build) and index.json (what each drew).
// A few fallbacks are two of her pictures put together by the page (a child over a horse, the wagon and its ox apart); they are
// drawn here side by side, not laid out as the page lays them.
//
// Run: node scripts/astra-vs-claude-shots.mjs   (PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE as for the proofs)
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = join(ROOT, 'docs/evidence/astra-vs-claude');
mkdirSync(OUT, { recursive: true });

// [label, Claude's pose the page asks for, Astra's fallback (a name, or names drawn side by side)]
const GROUPS = {
  'a-work': [
    ['rust felling', 'rust-chop', 'rust-work'], ['teal splitting', 'teal-split', 'teal-work'], ['elder digging', 'elder-dig', 'elder-work'],
    ['indigo reaping', 'indigo-reap', 'indigo-work'], ['rust at the mark', 'rust-aim', 'rust-idle-e'], ['ochre fishing', 'ochre-fish', 'ochre-rest'],
    ['blue-girl gathering', 'blue-girl-gather', 'blue-girl-sow'], ['rust-woman butchering', 'rust-woman-butcher', 'rust-woman-care'],
  ],
  'a-ambient': [
    ['rust whittling', 'rust-whittle', 'rust-repair'], ['indigo sewing', 'indigo-sew', 'indigo-repair'], ['teal at his pipe', 'teal-pipe', 'teal-rest'],
    ['rust-woman washing', 'rust-woman-wash', 'rust-woman-care'], ['elder sweeping', 'elder-sweep', 'elder-work'], ['ochre carrying water', 'ochre-carry-water', 'ochre-carry'],
    ['firewood by the house', 'woodpile-frontier', 'alamo-firewood'], ['hens', 'hens-pecking', 'chicken-idle'], ['the wall logs', 'wood-pile-3', 'log-fallen'],
  ],
  'b-children': [
    ['girl at play', 'girl-play-run', 'girl-walk'], ['girl at play, going south', 'girl-play-run-s', 'girl-walk-s'], ['boy galloping a stick horse', 'boy-play-gallop', 'boy-walk'],
    ['small child with a doll', 'smallchild-play-sit-doll', 'smallchild-rest'], ['girl carrying water', 'girl-carry-water', 'girl-walk'], ['boy sick', 'boy-sick-rest-e', 'boy-injured-rest-e'],
    ['the baby crawling', 'infant-crawl', 'infant-idle-e'], ['the baby crying', 'infant-cry', 'infant-idle-s'], ['indigo holding the baby', 'indigo-hold-baby', 'indigo-carry'],
  ],
  'c-battles': [
    ['rust firing', 'rust-fire-reload', 'volunteer-fire-reload'], ['a volunteer sitting at camp', 'volunteer-camp-sit', 'volunteer-injured-rest'], ['a regular lying in the grass', 'regular-prone-lie', 'regular-load'],
    ['a Texian horseman', 'volunteer-mounted', 'mounted-courier-e'], ['the wounded carried', 'bearers-carry', 'volunteer-march'], ['the sentry at the bell', 'sentry-bell-ring', 'volunteer-e'],
    ['Castrillón walking south', 'castrillon-walk-s', 'castrillon-walk-e'], ['Gregorio Esparza asleep sitting', 'esparza-seated', 'volunteer-injured-rest'],
    ['Kimbell (Astra has not drawn him)', 'kimbell-idle', 'volunteer-e'], ['Ana Esparza (Astra has not drawn her)', 'ana-esparza-idle', 'indigo-idle-e'],
  ],
  'd-transport': [
    ['the milk cow', 'milk-cow-walk-e', 'cow-walk'], ['the horse herd', 'herd-drove', 'mustang-gallop'], ['a lancer', 'lancer-march', 'dragoon-march'],
    ['a dragoon at the gallop', 'dragoon-gallop-e', 'dragoon-march'], ['the girl riding', 'girl-ride-e', ['horse-walk', 'girl-idle-e']], ['indigo driving the wagon', 'indigo-wagon-driver-e', 'indigo-idle-e'],
    ['the wagon and its ox', 'wagon-ox-e', ['ox-walk', 'wagon-travel']], ['the wagon, its tail open', 'wagon-ox-open-e', ['ox-walk', 'wagon-travel']],
    ['the cart', 'cart-travel-e', 'cart-open-e'], ['the carreta laden', 'carreta-loaded-travel-e', 'carreta-travel-e'], ['Seguín riding', 'seguin-ride-e', 'seguin-mounted-e'],
    ['a Tejano rider (Astra has not drawn one)', 'tejano-rider-ride-e', 'rust-ride-e'], ['a pack mule (Astra has not drawn one)', 'mule-packed-grass-walk-e', 'horse-walk'],
  ],
  'e-places': [
    ['a round-log house from behind', 'house-round-back-full-walls', 'house-round-full-walls'], ['a jacal going up', 'house-jacal-wattle', 'house-jacal-walls'],
    ['a man of Béxar (Astra has not drawn one)', 'bexar-man-walk', 'ochre-walk'], ['Mission Concepción (Astra has not drawn it)', 'mission-concepcion', 'church-generic'],
  ],
  'f-land': [
    ['a loblolly in a norther', 'pine-loblolly-large-wind', 'pine-loblolly-large'], ['a mott of live oaks', 'live-oak-mott', ['live-oak-large', 'live-oak-large']],
    ['a shortleaf pine', 'pine-shortleaf-large', 'pine-loblolly-large'], ['a cedar elm', 'cedar-elm-large', 'elm-large'], ['an oak stump', 'stump-oak', 'stump-post-oak'],
    ['the campfire at night', 'campfire-night', 'campfire'], ['an anacua (Astra has not drawn one)', 'anacua-large', 'oak-spreading'],
  ],
};

// The page each build serves the comparison from: its own /art.js, the same drawing for every build.
const HARNESS = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff"><canvas id="c"></canvas>
<script type="module">
import * as art from '/art.js';
const rows = ${JSON.stringify(GROUPS)};
window.draw = async (group, timeMs) => {
  await art.loadArt({ all: true });
  const list = rows[group], cell = 170, c = document.getElementById('c'), ctx = c.getContext('2d');
  c.width = cell * list.length; c.height = cell;
  const kind = name => art.clipInfo(name) ? 'clip' : art.spriteFrame(name) ? 'sprite' : null;
  const tall = name => /ride|mounted|herd|wagon|cart|carreta|house|mission|church|oak|pine|elm|anacua|mott|lancer|dragoon|mule|mustang|seguin/.test(name) ? 118 : /cow|log|firewood|pile|stump|campfire/.test(name) ? 60 : 92;
  const one = (name, x, y, h) => kind(name) === 'clip' ? art.drawClip(ctx, name, x, y, h, { timeMs }) : art.drawSprite(ctx, name, x, y, h);
  const drew = [];
  list.forEach(([label, want, fallback], i) => {
    const x = i * cell + cell / 2, y = cell - 22;
    ctx.fillStyle = '#7f9f58'; ctx.fillRect(i * cell + 2, 0, cell - 4, cell);
    let used;
    if (kind(want) && (kind(want) === 'clip' ? art.clipReady(want) : art.spriteReady(want))) { one(want, x, y, tall(want)); used = want; }
    else {
      const names = Array.isArray(fallback) ? fallback : [fallback];
      names.forEach((name, k) => one(name, x + (k - (names.length - 1) / 2) * 58, y, tall(name) * (names.length > 1 && k ? .7 : 1)));
      used = names.join('+');
    }
    // Whose drawing it is, by the frame's own mark (madeBy "claude" on every Claude frame), not by the name asked for.
    const claude = used.split('+').some(name => { const clip = art.clipInfo(name); return art.spriteFrame(clip ? clip.frames[0].sprite : name)?.madeBy === 'claude'; });
    ctx.fillStyle = claude ? '#b3261e' : '#1d4f91'; ctx.fillRect(i * cell + 2, cell - 16, cell - 4, 16);
    ctx.fillStyle = '#fff'; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText((claude ? 'CLAUDE ' : 'ASTRA ') + used, x, cell - 4);
    drew.push({ label, want, drew: used, claude });
  });
  return drew;
};
</script>`;

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml' };
function serve(root) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/__compare.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(HARNESS); return; }
    const file = normalize(join(root, path));
    if (!file.startsWith(normalize(root)) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

const scratch = mkdtempSync(join(tmpdir(), 'astra-vs-claude-'));
// A tag's public/ checked out into the scratch folder through a throwaway index, so neither this tree's index nor its files move.
const tree = tag => {
  const dir = join(scratch, tag.replace(/[^\w.-]/g, '-')), index = join(scratch, `${tag.replace(/[^\w.-]/g, '-')}.index`);
  execFileSync('git', ['read-tree', `--index-output=${index}`, tag], { cwd: ROOT });
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', tag, 'public'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  execFileSync('git', ['checkout-index', `--prefix=${dir.split('\\').join('/')}/`, '--stdin'], { cwd: ROOT, input: files, env: { ...process.env, GIT_INDEX_FILE: index } });
  return join(dir, 'public');
};
const builds = [['v2026.09.28.1', tree('v2026.09.28.1')], ['v2026.09.29.1 (released)', tree('v2026.09.29.1')],
  ['main 3dd5209d (unreleased, before the fix)', tree('3dd5209d')], ['this tree (fixed)', join(ROOT, 'public')]];
const served = await Promise.all(builds.map(([, root]) => serve(root)));
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const index = {};
try {
  for (const group of Object.keys(GROUPS)) {
    const shots = [];
    for (let b = 0; b < builds.length; b++) {
      const page = await browser.newPage({ viewport: { width: 1800, height: 400 } });
      await page.goto(`http://127.0.0.1:${served[b].port}/__compare.html`);
      await page.waitForFunction(() => typeof window.draw === 'function');
      const drew = await page.evaluate(g => window.draw(g, 300), group);
      (index[group] ??= {})[builds[b][0]] = drew;
      shots.push((await (await page.$('#c')).screenshot()).toString('base64'));
      await page.close();
    }
    const sheet = await browser.newPage({ viewport: { width: 1800, height: 800 } });
    await sheet.setContent(`<body style="margin:0;font:14px system-ui;background:#f4efe3">${builds.map(([name], b) =>
      `<div style="padding:6px 8px;font-weight:600">${name}</div><img style="display:block" src="data:image/png;base64,${shots[b]}">`).join('')}</body>`);
    await sheet.screenshot({ path: join(OUT, `${group}.png`), fullPage: true });
    await sheet.close();
    console.log(group, builds.map(([name], b) => `${name}: ${index[group][name].filter(d => d.claude).length} Claude of ${index[group][name].length}`).join(' | '));
  }
} finally {
  await browser.close();
  served.forEach(({ server }) => server.close());
  rmSync(scratch, { recursive: true, force: true });
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
