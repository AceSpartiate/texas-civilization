// Render the Claude-drawn stand-in art and write its manifests.
//
// Everything registered here was drawn by Claude, not by Astra, to fill an open request in docs/ART_REQUESTS.md
// ("Claude-drawn stand-ins (replace with Astra's)"). It is temporary and lives apart from her library on purpose: its own
// folder (public/assets/claude-standins/), its own sheets (every file prefixed `claude-`), its own atlas.json (every sheet,
// frame and clip `madeBy: "claude"`), and the loader in public/art.js lets any frame or clip of the same name in her
// library win. When Astra delivers, say, `rust-chop`, registering it through `npm run build:art` replaces this one without
// touching a line of the page; then delete its entry in the area module and rerun this script.
//
// **Per-area modules.** The sheets are declared in scripts/claude-art/areas/<module>.mjs, discovered by reading that folder,
// so parallel builders each add their own module (and their own SVG folder, svg/<module>/) and never edit a shared list.
// A module exports:
//   AREA      the plan area it belongs to (docs/CLAUDE_ART_PLAN.md: work, children, battles, transport, places, land)
//   DATE      the day it was drawn (provenance)
//   SHEETS    { 'claude-<sheet>': { request, replaceWith, cell: { w, h } | n, columns?, frames: [frame...] } }
//             frame: { name, prompt, draw?: () => { svg, anchorX?, anchorY?, logicalHeight? }, anchorX?, anchorY?, logicalHeight? }
//             A frame with `draw` is generated (its SVG is written to svg/<module>/claude-<name>.svg by this script); one
//             without is a hand-written SVG at that path, and is simply not built until the file exists.
//   CLIPS     { '<clip>': { frames: [{ sprite, duration }], loop, motion, direction, prompt, beat? } } - the same shape as
//             Astra's animation.json clips, so an animated stand-in plugs into the clip name the game already asks for.
//
// **Outputs.** Per module, public/assets/claude-standins/areas/<module>.json (its sheets, frames, clips and provenance) and
// its PNG sheets; then atlas.json and docs/claude-art-provenance.json are merged from every module's JSON. Merging needs no
// browser: after a git merge brings two builders' modules together, `npm run build:standins -- --merge` rewrites the two
// merged files (take either side of a conflict in them first). `--only <module>` renders one module and merges.
//
// Sources are SVG, rasterised by inlining each sheet's frames in one page and screenshotting it with a transparent
// background, in the Playwright/Chrome the browser proofs use (scripts/claude-art/kit/browser.mjs): no rasteriser dependency.
//
// Run: npm run build:standins [-- --only <module> | --merge]
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../public/assets/claude-standins/', import.meta.url));
export const WEB_ROOT = '/assets/claude-standins/';
export const AREAS_DIR = fileURLToPath(new URL('./claude-art/areas/', import.meta.url));
export const PROVENANCE_FILE = fileURLToPath(new URL('../docs/claude-art-provenance.json', import.meta.url));
const TEMPORARY = name => `temporary: replace with Astra's ${name}`;

export const sourceOf = (module, name) => `svg/${module}/claude-${name}.svg`;
const cellOf = spec => typeof spec.cell === 'number' ? { w: spec.cell, h: spec.cell } : spec.cell;

/** Every area module, in name order: { module, AREA, DATE, SHEETS, CLIPS }. */
export async function loadModules() {
  const out = [];
  for (const file of readdirSync(AREAS_DIR).filter(name => name.endsWith('.mjs')).sort()) {
    const module = file.replace(/\.mjs$/, '');
    const m = await import(new URL(`./claude-art/areas/${file}`, import.meta.url));
    if (!m.AREA || !m.DATE) throw new Error(`${file}: an area module exports AREA and DATE`);
    out.push({ module, AREA: m.AREA, DATE: m.DATE, SHEETS: m.SHEETS || {}, CLIPS: m.CLIPS || {} });
  }
  const seen = new Map();
  for (const m of out) {
    for (const [sheet, spec] of Object.entries(m.SHEETS)) {
      if (!/^claude-[a-z0-9-]+$/.test(sheet)) throw new Error(`${m.module}: sheet ${sheet} must be named claude-*`);
      for (const key of [`sheet:${sheet}`, ...spec.frames.map(f => `frame:${f.name}`)]) {
        if (seen.has(key)) throw new Error(`${key} is declared by both ${seen.get(key)} and ${m.module}`);
        seen.set(key, m.module);
      }
    }
    for (const clip of Object.keys(m.CLIPS)) {
      if (seen.has(`clip:${clip}`)) throw new Error(`clip ${clip} is declared by both ${seen.get(`clip:${clip}`)} and ${m.module}`);
      seen.set(`clip:${clip}`, m.module);
    }
  }
  return out;
}

/** A frame's SVG and numbers: drawn now if generated, read from disk if hand-written (null if not on disk yet). */
export function frameSource(module, spec, frame) {
  const cell = cellOf(spec), path = root + sourceOf(module, frame.name);
  if (frame.draw) {
    const drawn = frame.draw();
    return { svg: drawn.svg, anchorX: drawn.anchorX ?? frame.anchorX ?? 0.5, anchorY: drawn.anchorY ?? frame.anchorY ?? 1, logicalHeight: drawn.logicalHeight ?? frame.logicalHeight, generated: true, cell };
  }
  if (!existsSync(path)) return null;
  return { svg: readFileSync(path, 'utf8'), anchorX: frame.anchorX ?? 0.5, anchorY: frame.anchorY ?? 1, logicalHeight: frame.logicalHeight, generated: false, cell };
}

/** The sheets of one module that have something to draw, with each frame's source resolved. */
export function plannedSheets(m) {
  const planned = {};
  for (const [sheet, spec] of Object.entries(m.SHEETS)) {
    const frames = spec.frames.map(frame => ({ frame, source: frameSource(m.module, spec, frame) })).filter(entry => entry.source);
    if (frames.length) planned[sheet] = { ...spec, cell: cellOf(spec), frames };
  }
  return planned;
}

const shared = () => readFileSync(root + 'svg/_shared-defs.svg', 'utf8');

/** One sheet's page: every frame inlined at its cell, in rows of `columns` (default the square root), transparent ground. */
export function sheetPage(sheet, spec) {
  // `scale` rasterises the cell smaller than it was drawn (a sheet of many people frames would otherwise decode to tens of
  // megabytes on a Chromebook); the frame's size and logical height scale with it, its anchors are fractions and do not.
  const { w, h } = spec.cell, count = spec.frames.length, k = spec.scale || 1, W = Math.round(w * k), Hh = Math.round(h * k);
  const columns = spec.columns || Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / columns);
  const ids = new Map();
  const pieces = spec.frames.map(({ frame, source }, index) => {
    const svg = source.svg;
    // Every SVG is inlined into one document, so an id must belong to one piece only.
    for (const id of svg.matchAll(/\bid="([^"]+)"/g)) {
      if (ids.has(id[1])) throw new Error(`${sheet}: id "${id[1]}" is in both ${ids.get(id[1])} and ${frame.name}; prefix ids with the piece's name`);
      ids.set(id[1], frame.name);
    }
    if (!new RegExp(`viewBox="0 0 ${w} ${h}"`).test(svg)) throw new Error(`${frame.name}: viewBox must be 0 0 ${w} ${h}`);
    const x = (index % columns) * W, y = Math.floor(index / columns) * Hh;
    return { frame, source, x, y, html: `<div style="position:absolute;left:${x}px;top:${y}px;width:${W}px;height:${Hh}px">${svg.replace(/<svg /, `<svg style="width:${W}px;height:${Hh}px;display:block" `)}</div>` };
  });
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style><svg width="0" height="0" style="position:absolute">${shared()}</svg>${pieces.map(piece => piece.html).join('')}`;
  return { html, width: columns * W, height: rows * Hh, columns, rows, pieces, cellPx: { w: W, h: Hh } };
}

/** The clips of a module whose every frame is drawn. */
function readyClips(m, frames) {
  const clips = {};
  for (const [name, clip] of Object.entries(m.CLIPS)) {
    if (!clip.frames.every(f => frames[f.sprite])) continue;
    const { prompt, ...rest } = clip;
    clips[name] = { ...rest, loop: clip.loop !== false, authored: new Set(clip.frames.map(f => f.sprite)).size > 1, motion: clip.motion || 'none',
      direction: clip.direction || 'east; west by mirroring', madeBy: 'claude', module: m.module };
  }
  return clips;
}

/** Render one module: its SVG sources and PNG sheets, and its area JSON. */
export async function renderModule(page, m) {
  const sheets = {}, frames = {}, provenance = {};
  for (const [sheet, spec] of Object.entries(plannedSheets(m))) {
    const { html, width, height, columns, rows, pieces, cellPx } = sheetPage(sheet, spec);
    for (const { frame, source } of pieces) if (source.generated) {
      mkdirSync(root + `svg/${m.module}`, { recursive: true });
      writeFileSync(root + sourceOf(m.module, frame.name), source.svg);
    }
    await page.setViewportSize({ width, height });
    await page.setContent(html);
    await page.waitForTimeout(50);
    const file = `${sheet}.png`;
    let png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height }, type: 'png' });
    // Chrome's PNG bytes differ from one screenshot to the next even when every pixel is the same, which would make each
    // rebuild a change (and two builders' merges a conflict) for nothing: keep the sheet on disk when its pixels are equal.
    if (existsSync(root + file)) {
      const old = readFileSync(root + file);
      const { decodeRgba } = await import('./build-atlas-manifest.mjs');
      const a = decodeRgba(old), b = decodeRgba(png);
      if (a.width === b.width && a.height === b.height && a.data.equals(b.data)) png = old;
    }
    writeFileSync(root + file, png);
    sheets[sheet] = { image: WEB_ROOT + file, width, height, bytes: png.length, sha256: createHash('sha256').update(png).digest('hex'),
      madeBy: 'claude', module: m.module, request: spec.request, layout: { rows, columns, cell: cellPx, ...(spec.scale && { drawnCell: spec.cell, scale: spec.scale }), method: 'Fixed cells; each frame is one whole cell of the SVG it was drawn in.' } };
    for (const { frame, source, x, y } of pieces) {
      frames[frame.name] = { sheet, x, y, w: cellPx.w, h: cellPx.h, anchorX: source.anchorX, anchorY: source.anchorY,
        ...(source.logicalHeight && { logicalHeight: +(source.logicalHeight * (spec.scale || 1)).toFixed(2) }),
        madeBy: 'claude', module: m.module, request: spec.request, replaceWith: `${frame.name}: ${spec.replaceWith}`, source: sourceOf(m.module, frame.name),
        label: frame.name.replaceAll('-', ' '), kind: sheet };
      provenance[frame.name] = { kind: 'frame', madeBy: 'claude', date: frame.date || m.DATE, module: m.module, area: m.AREA, sheet, request: spec.request,
        prompt: frame.prompt, source: `public/assets/claude-standins/${sourceOf(m.module, frame.name)}`, method: source.generated ? 'generated SVG (scripts/claude-art/)' : 'hand-written SVG',
        rasterised: 'Playwright/Chrome screenshot of the inlined SVG, transparent ground (scripts/build-claude-standins.mjs)', status: TEMPORARY(frame.name) };
    }
  }
  const clips = readyClips(m, frames);
  for (const [name, clip] of Object.entries(clips)) {
    provenance[name] = { kind: 'clip', madeBy: 'claude', date: m.CLIPS[name].date || m.DATE, module: m.module, area: m.AREA, request: frames[clip.frames[0].sprite].request,
      prompt: m.CLIPS[name].prompt, frames: clip.frames.map(f => f.sprite), status: TEMPORARY(name) };
  }
  const area = { module: m.module, area: m.AREA, date: m.DATE, sheets, frames, clips, provenance };
  mkdirSync(root + 'areas', { recursive: true });
  writeFileSync(root + `areas/${m.module}.json`, JSON.stringify(area, null, 2) + '\n');
  return area;
}

/** Every module's area JSON on disk, in name order. */
export function readAreas() {
  const dir = root + 'areas/';
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(name => name.endsWith('.json')).sort().map(name => JSON.parse(readFileSync(dir + name, 'utf8')));
}

export const NOTE = 'Claude-drawn stand-ins for open requests in docs/ART_REQUESTS.md, generated by scripts/build-claude-standins.mjs from the area modules in scripts/claude-art/areas/ and the SVGs in svg/<module>/. Temporary: not Astra’s art. A frame or clip of the same name in frontier-v1 wins over one listed here, so registering her delivery replaces the stand-in; then delete its entry in the area module and rerun the script. x/y/w/h are pixels in the named sheet; anchorX/anchorY the ground contact; logicalHeight, where present, the height a frame is scaled to (public/art.js), as in her people sheets.';

/** The merged manifest the page loads, and the merged provenance record: pure functions of the area JSONs. */
export function merge(areas) {
  const manifest = { library: 'claude-standins', madeBy: 'claude', note: NOTE, sheets: {}, frames: {}, clips: {} };
  const provenance = { library: 'claude-standins', madeBy: 'claude',
    note: "Claude's equivalent of docs/art-prompts.json and docs/art-provenance.json, kept apart so it can never be mistaken for Astra's records. One entry per Claude-drawn frame and clip: who made it (Claude), when, the written intent it was drawn to (Claude has no image model: the 'prompt' is the description the SVG was drawn from), its source SVG, and that it is temporary. Generated by scripts/build-claude-standins.mjs from scripts/claude-art/areas/; do not hand-edit.",
    entries: {} };
  for (const area of areas) {
    Object.assign(manifest.sheets, area.sheets);
    Object.assign(manifest.frames, area.frames);
    Object.assign(manifest.clips, area.clips);
    Object.assign(provenance.entries, area.provenance);
  }
  return { manifest, provenance };
}
export function writeMerged() {
  const { manifest, provenance } = merge(readAreas());
  writeFileSync(root + 'atlas.json', JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(PROVENANCE_FILE, JSON.stringify(provenance, null, 2) + '\n');
  return { manifest, provenance };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (!args.includes('--merge')) {
    const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
    const modules = (await loadModules()).filter(m => !only || m.module === only);
    if (only && !modules.length) throw new Error(`no area module named ${only} in ${AREAS_DIR}`);
    // A module deleted since the last build leaves its JSON behind: drop the JSON of any module that no longer exists.
    const { withBrowser } = await import('./claude-art/kit/browser.mjs');
    await withBrowser(async page => { for (const m of modules) { const area = await renderModule(page, m); console.log(`${m.module}: ${Object.keys(area.sheets).length} sheets, ${Object.keys(area.frames).length} frames, ${Object.keys(area.clips).length} clips`); } });
  }
  const names = new Set((await loadModules()).map(m => m.module));
  const { unlinkSync } = await import('node:fs');
  for (const name of existsSync(root + 'areas') ? readdirSync(root + 'areas') : []) if (!names.has(name.replace(/\.json$/, ''))) unlinkSync(root + 'areas/' + name);
  const { manifest } = writeMerged();
  console.log(`atlas.json: ${Object.keys(manifest.sheets).length} sheets, ${Object.keys(manifest.frames).length} frames, ${Object.keys(manifest.clips).length} clips; docs/claude-art-provenance.json`);
}
