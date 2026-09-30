// Make the WebP copy of every picture the page loads (owner, 2026-09-29, triage D14 "All to WebP"; docs/PERFORMANCE_LOAD.md).
//
// The PNGs stay the masters, where the artists work: Astra's deliveries (public/assets/frontier-v1/atlases/) and Claude's
// build outputs (public/assets/claude-standins/). Nothing is written beside them: each WebP goes to the same path under
// public/assets/webp/ (`frontier-v1/atlases/nature.png` -> `webp/frontier-v1/atlases/nature.webp`), with a record of what
// each was made from (public/assets/webp/record.json). None of it is committed (.gitignore): it is made from the PNGs in a
// few minutes, the repository already carries every PNG and its history, and a committed copy would have to be rebuilt and
// merged by every builder who touches a sheet. scripts/package.ps1 runs this and ships the WebP in place of the PNG.
//
// **How each sheet is encoded.** WebP quality 90, except a sheet with any person frame the page recolours
// (public/person-palette.js `variantOf`): those are lossless, and checked pixel for pixel against their PNG. The recolouring
// finds a figure's skin, hair and clothes by growing regions of like colour between ink lines, one step of at most 22 in a
// channel (`STEP`); lossy WebP keeps colour at half the resolution and adds its own noise, which moves exactly those edges.
// A lossless sheet decodes to the PNG, so the colour keys the classifier reads are the PNG's.
//
// **Who uses it.** The page asks for `/assets/webp/<sheet>.webp?v=<the PNG's hash>` (public/art.js) and
// `url(assets/webp/<name>.webp)` (public/style.css). The server sends the WebP only while this record says it was made from
// the PNG now on disk, and the PNG otherwise (server/delivery.mjs `pictureFor`), so a tree where this has not been run, or a
// sheet delivered since, still shows the right picture - the PNG, larger.
//
// Run: npm run build:webp            make what is missing or out of date (seconds when nothing changed)
//      npm run build:webp -- --check  change nothing; exit 1 naming each picture with no current WebP
// Needs Python with Pillow built with WebP (scripts/webp-encode.py); PYTHON names another interpreter.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { variantOf } from '../public/person-palette.js';

export const ASSETS = fileURLToPath(new URL('../public/assets/', import.meta.url));
/** Where the WebPs go under public/assets/, and their record there. The server reads the same names (server/delivery.mjs). */
export const WEBP_DIR = 'webp/';
export const RECORD = `${WEBP_DIR}record.json`;
export const QUALITY = 90;
const LIBRARIES = [
  { manifest: 'frontier-v1/atlas.json', base: 'frontier-v1/' },
  { manifest: 'claude-standins/atlas.json', base: '' },
];

/** A sheet's image as a path under public/assets/: Astra's are relative to her library, Claude's are absolute URLs. */
export const assetPath = (image, base) => image.startsWith('/assets/') ? image.slice('/assets/'.length) : base + image;
export const webpOf = png => WEBP_DIR + png.replace(/\.png$/, '.webp');

/**
 * Every picture to encode, and how: [{ png, webp, lossless, why }], paths under public/assets/. Pure: the manifests and the
 * stylesheet in, the plan out. A sheet is lossless when any frame on it is one public/person-palette.js recolours.
 */
export function planWebp(manifests, stylesheet = '') {
  const plan = new Map();
  for (const { atlas, base } of manifests) {
    const people = new Map();
    for (const [name, frame] of Object.entries(atlas?.frames || {})) if (variantOf(name)) people.set(frame.sheet, name);
    for (const [sheet, info] of Object.entries(atlas?.sheets || {})) {
      if (typeof info?.image !== 'string' || !info.image.endsWith('.png')) continue;
      const png = assetPath(info.image, base);
      const lossless = people.has(sheet);
      plan.set(png, { png, webp: webpOf(png), lossless, why: lossless ? `recoloured person frames (${people.get(sheet)})` : `quality ${QUALITY}` });
    }
  }
  // The stylesheet's own pictures (the creation screen's landscapes), named there by their WebP: made from the PNG they mirror.
  for (const [, name] of stylesheet.matchAll(/url\(['"]?assets\/webp\/([A-Za-z0-9_./-]+)\.webp['"]?\)/g)) {
    const png = `${name}.png`;
    if (!plan.has(png)) plan.set(png, { png, webp: webpOf(png), lossless: false, why: `quality ${QUALITY}, public/style.css` });
  }
  return [...plan.values()].sort((a, b) => a.png.localeCompare(b.png));
}

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
export function readRecord(assets = ASSETS) {
  try { return JSON.parse(readFileSync(assets + RECORD, 'utf8')); } catch { return { pictures: {} }; }
}
function readPlan(assets) {
  const manifests = LIBRARIES.map(({ manifest, base }) => ({ atlas: JSON.parse(readFileSync(assets + manifest, 'utf8')), base }));
  const stylesheet = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');
  return planWebp(manifests, stylesheet);
}

/** What is not current: [{ ...item, pngSha, problem }]. A picture whose PNG is missing is reported and never encoded. */
export function staleness(plan, record, assets = ASSETS) {
  const out = [];
  for (const item of plan) {
    if (!existsSync(assets + item.png)) { out.push({ ...item, problem: 'its PNG is missing' }); continue; }
    const png = sha256(assets + item.png);
    const kept = record.pictures?.[item.webp];
    if (!kept) out.push({ ...item, pngSha: png, problem: 'never made' });
    else if (kept.png !== png) out.push({ ...item, pngSha: png, problem: 'made from an older PNG' });
    else if (kept.lossless !== item.lossless) out.push({ ...item, pngSha: png, problem: item.lossless ? 'must be lossless' : 'may be lossy' });
    else if (!existsSync(assets + item.webp) || sha256(assets + item.webp) !== kept.webp) out.push({ ...item, pngSha: png, problem: 'the WebP on disk is not the one recorded' });
  }
  return out;
}

function encode(jobs) {
  if (!jobs.length) return [];
  const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  const run = spawnSync(python, [fileURLToPath(new URL('./webp-encode.py', import.meta.url))], {
    input: JSON.stringify(jobs), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'inherit'],
  });
  if (run.error) throw new Error(`could not run ${python} (set PYTHON): ${run.error.message}`);
  const results = run.stdout.split('\n').filter(Boolean).map(line => JSON.parse(line));
  const failed = results.find(result => result.error);
  if (failed || run.status !== 0) throw new Error(`scripts/webp-encode.py failed: ${failed?.error || `exit ${run.status}`}`);
  return results;
}

export function buildWebp({ assets = ASSETS, check = false, log = console.log } = {}) {
  const plan = readPlan(assets);
  const record = readRecord(assets);
  record.pictures ||= {};
  const stale = staleness(plan, record, assets);
  if (check) return { plan, stale, pictures: record.pictures };
  const jobs = stale.filter(item => item.pngSha).map(item => ({ src: assets + item.png, dst: assets + item.webp, lossless: item.lossless, quality: QUALITY }));
  for (const job of jobs) mkdirSync(dirname(job.dst), { recursive: true });
  const started = Date.now();
  const byDst = new Map(encode(jobs).map(result => [result.dst, result]));
  for (const item of stale.filter(entry => entry.pngSha)) {
    const result = byDst.get(assets + item.webp);
    if (!result) throw new Error(`${item.webp}: no result from the encoder`);
    if (item.lossless && result.exact !== true) { rmSync(assets + item.webp, { force: true }); throw new Error(`${item.webp}: the lossless WebP does not decode to its PNG`); }
    record.pictures[item.webp] = {
      png: item.pngSha, webp: sha256(assets + item.webp), lossless: item.lossless,
      pngBytes: readFileSync(assets + item.png).length, webpBytes: result.bytes,
    };
  }
  // A WebP this made for a picture no longer in any manifest goes, and only those: nothing else is touched.
  const planned = new Set(plan.map(item => item.webp));
  for (const webp of Object.keys(record.pictures)) {
    if (planned.has(webp)) continue;
    rmSync(assets + webp, { force: true });
    delete record.pictures[webp];
  }
  const pictures = Object.fromEntries(Object.entries(record.pictures).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(assets + WEBP_DIR, { recursive: true });
  writeFileSync(assets + RECORD, JSON.stringify({
    note: 'Made by scripts/build-webp.mjs from the PNG masters; not committed. png and webp are SHA-256 of the files.',
    quality: QUALITY, pictures,
  }, null, 1) + '\n');
  const missing = stale.filter(item => !item.pngSha);
  log(`${jobs.length} encoded in ${((Date.now() - started) / 1000).toFixed(1)} s, ${plan.length - jobs.length - missing.length} already current`);
  for (const item of missing) log(`  ${item.png}: ${item.problem}`);
  return { plan, stale, pictures };
}

/** The totals the handoff reports: every picture's PNG and WebP bytes, and the lossless ones. */
export function totals(pictures) {
  const values = Object.values(pictures);
  const sum = (list, key) => list.reduce((total, item) => total + item[key], 0);
  const lossless = values.filter(item => item.lossless);
  return { count: values.length, png: sum(values, 'pngBytes'), webp: sum(values, 'webpBytes'), lossless: lossless.length, losslessPng: sum(lossless, 'pngBytes'), losslessWebp: sum(lossless, 'webpBytes') };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check');
  const { plan, stale, pictures } = buildWebp({ check });
  if (check) {
    for (const item of stale) console.log(`${item.webp}: ${item.problem}`);
    console.log(`${plan.length - stale.length} of ${plan.length} pictures have a current WebP`);
    process.exit(stale.length ? 1 : 0);
  }
  const sum = totals(pictures);
  const mb = bytes => (bytes / 1e6).toFixed(1);
  console.log(`${sum.count} pictures: PNG ${mb(sum.png)} MB -> WebP ${mb(sum.webp)} MB; ${sum.lossless} lossless (${mb(sum.losslessPng)} -> ${mb(sum.losslessWebp)} MB)`);
  if (stale.some(item => !item.pngSha)) process.exit(1);
}
