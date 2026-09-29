// A frame whose SVG embeds pixels of Astra's own painting (a bend, a composition of her trees): the PNG inside it is written
// by zlib, whose bytes may differ between node versions, so a frame whose inputs are unchanged is read back from disk as it
// is. `key` names the inputs (the drawing code, the parameters, a hash of her pixels); the SVG carries it as `data-key`.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { astraFrame, encodePng } from './pixels.mjs';

const lf = text => text.replace(/\r\n/g, '\n');
export const hashOf = (...parts) => createHash('sha256').update(parts.map(p => typeof p === 'string' ? p : JSON.stringify(p)).join('\n')).digest('hex').slice(0, 16);
/** The source of a file of this folder, line endings normalised: part of a key, so a change to the drawing redraws. */
export const codeOf = (...files) => files.map(f => lf(readFileSync(new URL(f, import.meta.url), 'utf8'))).join('\n');

/** The SVG on disk for `name` of `module` if it was drawn from the same inputs, else `build()`'s. */
export function cached(module, name, key, build) {
  const disk = new URL(`../../../public/assets/claude-standins/svg/${module}/claude-${name}.svg`, import.meta.url);
  if (existsSync(disk)) {
    const kept = lf(readFileSync(disk, 'utf8'));
    if (kept.includes(`data-key="${key}"`)) return kept;
  }
  return build().replace('<svg ', `<svg data-key="${key}" `);
}

/**
 * One of Astra's frames as an embeddable image: `{ w, h, ax, gy, sha, href }`, her pixels at 1:1 with rows more than `keepBelow`
 * pixels under her anchor cleared (a grass foot that would otherwise hang below a new ground line).
 */
export function astraImage(name, { keepBelow = Infinity, cutAbove = null } = {}) {
  const f = astraFrame(name), gy = f.anchorY * f.h;
  for (let y = 0; y < f.h; y++) {
    const clear = y > gy + keepBelow || (cutAbove != null && y < cutAbove);
    if (clear) for (let x = 0; x < f.w; x++) f.img.d.fill(0, (y * f.w + x) * 4, (y * f.w + x) * 4 + 4);
  }
  // Her painted trees are almost never quite opaque inside (about 0.93 alpha); the library's sprite rule wants solid paint, so
  // the body is made opaque and the soft edge left as she painted it (as scripts/claude-art/land/bend.mjs does).
  const d = f.img.d;
  for (let o = 0; o < d.length; o += 4) if (d[o + 3] >= 0.86 && d[o + 3] < 1) { const k = 1 / d[o + 3]; d[o] *= k; d[o + 1] *= k; d[o + 2] *= k; d[o + 3] = 1; }
  return { w: f.w, h: f.h, ax: f.anchorX * f.w, gy, sha: f.sha, href: `data:image/png;base64,${encodePng(f.img).toString('base64')}` };
}
