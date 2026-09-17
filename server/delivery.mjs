// How the server's bytes travel: compression, validators and cache lifetimes (docs/PERFORMANCE_LOAD.md).
//
// A class opens on thirty school Chromebooks over one Wi-Fi from one teacher laptop, and a Play Solo game opens on that
// same weak laptop. Until 2026-09-17 every script and every JSON answer went uncompressed with `no-store`, so a reload
// fetched half a megabyte of script again, and every atlas request - even one answered 304 - read the whole picture off
// disk and hashed it. This module is the whole of the fix, so the routes in server/app.mjs stay one line each.
//
// Only gzip: Chrome advertises brotli and zstd over HTTPS only, and the classroom server is plain HTTP on the LAN.
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

/** Smaller than this is sent as it is: a gzip header and a CPU slice buy nothing on a one-line answer. */
export const COMPRESS_MIN_BYTES = 1024;
/** A pinned atlas (its URL names its own content hash) never changes, so the browser may keep it for a year. */
export const PINNED_CACHE = 'public, max-age=31536000, immutable';
/** Everything else the browser keeps, it asks about first: a 304 costs a round trip and no body. */
export const REVALIDATE_CACHE = 'public, max-age=0, must-revalidate';
/** How long a pinned URL's version must be: sixteen hex characters of the SHA-256 the atlas manifest records. */
export const PIN_LENGTH = 16;

/** Whether the request accepts gzip (and did not refuse it with q=0). */
export function acceptsGzip(req) {
  const header = String(req?.headers?.['accept-encoding'] || '');
  return header.split(',').some(part => {
    const [coding, ...params] = part.trim().split(';').map(value => value.trim().toLowerCase());
    if (coding !== 'gzip' && coding !== '*') return false;
    const q = params.find(param => param.startsWith('q='));
    return !q || Number(q.slice(2)) > 0;
  });
}

// A file is compressed once and kept, so it gets the smallest gzip. An answer built per request (the map is 350 KB of
// JSON) gets the fastest: on this machine level 1 takes 1.8 ms and 99 KB where level 6 takes 7.8 ms and 82 KB, and the
// server is a school laptop answering thirty students at once.
// ceiling: every student's /api/map is projected, stringified and gzipped afresh; keeping the gzip per map revision
// is the way out if class start shows the server busy.
const gzipOnce = content => gzipSync(content, { level: 9 });
const gzip = content => gzipSync(content, { level: 1 });

/**
 * Send one response body, gzipped when it is worth it and the browser takes it.
 * `zipped` lends an already-compressed copy so a file read once is not compressed for every student.
 */
export function sendBody(req, res, status, headers, content, { compressible = false, zipped } = {}) {
  if (compressible && content.length >= COMPRESS_MIN_BYTES) {
    res.setHeader('Vary', 'Accept-Encoding');
    if (acceptsGzip(req)) {
      const body = zipped ? zipped() : gzip(content);
      res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': body.length });
      return res.end(body);
    }
  }
  res.writeHead(status, { ...headers, 'Content-Length': content.length });
  return res.end(content);
}

// ceiling: a file is recognised by its size and modification time. A file rewritten within the same millisecond at
// exactly the same size keeps its old hash until the server restarts; content hashing on every request is the way out,
// and it is what this cache exists to avoid on a weak laptop.
const known = new Map();
/**
 * What the server knows about a file on disk: its SHA-256 and, for `keep` files (the page's own scripts, styles and
 * JSON), the bytes and their gzip. Pictures are not kept: 70 MB of atlases does not belong in a school laptop's memory.
 */
export function fileFacts(path, { keep = false, info = statSync(path) } = {}) {
  const stamp = `${info.size}:${info.mtimeMs}`;
  let entry = known.get(path);
  if (!entry || entry.stamp !== stamp || (keep && !entry.content)) {
    const content = readFileSync(path);
    entry = { stamp, sha256: createHash('sha256').update(content).digest('hex'), size: content.length };
    if (keep) { entry.content = content; entry.zipped = null; }
    known.set(path, entry);
    return { ...facts(entry), content };
  }
  return facts(entry);
}
function facts(entry) {
  return {
    sha256: entry.sha256, size: entry.size, content: entry.content, etag: `"${entry.sha256}"`,
    zipped: () => { if (!entry.zipped) entry.zipped = gzipOnce(entry.content); return entry.zipped; },
  };
}

/** The validator a response carries: a gzipped body is a different representation, so it gets its own. */
export const etagFor = (req, facts, compressible) => compressible && facts.size >= COMPRESS_MIN_BYTES && acceptsGzip(req)
  ? `${facts.etag.slice(0, -1)}-gz"` : facts.etag;

/** Whether the browser already holds exactly this representation. */
export function notModified(req, etag) {
  const header = req.headers['if-none-match'];
  return Boolean(header) && header.split(',').map(value => value.trim().replace(/^W\//, '')).includes(etag);
}
