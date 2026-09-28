// What a WebM file says about itself, read on the server before a flashback is kept (docs/FLASHBACK.md §5).
//
// Only the structure: the EBML header's DocType, the Segment's Info (its timecode scale and duration), its video track's codec
// and size, and its blocks - how many, how many keyframes, and the last one's time, which is the duration of a file whose Info
// has none (the browser's own MediaRecorder writes none). Sizes may be "unknown" (all ones), as MediaRecorder writes a live
// Segment and its Clusters: such an element runs to the end of its parent, and a Cluster to the next element of the Segment's
// own level. Nothing is decoded; a file that is not WebM, or has no video track, is said to be so and never kept.

const SEGMENT = 0x18538067, CLUSTER = 0x1f43b675, INFO = 0x1549a966, TRACKS = 0x1654ae6b, CUES = 0x1c53bb6b, SEEKHEAD = 0x114d9b74, EBML = 0x1a45dfa3;
/** The Segment's own children: meeting one of these inside a Cluster of unknown size ends that Cluster. */
const LEVEL_ONE = new Set([CLUSTER, INFO, TRACKS, CUES, SEEKHEAD, 0x1941a469, 0x1043a770, 0x1254c367]);

function readId(bytes, at) {
  const first = bytes[at];
  if (first === undefined) return null;
  let length = 1;
  while (length <= 4 && !(first & (0x80 >> (length - 1)))) length++;
  if (length > 4 || at + length > bytes.length) return null;
  let id = 0;
  for (let i = 0; i < length; i++) id = id * 256 + bytes[at + i];
  return { id, length };
}
function readSize(bytes, at) {
  const first = bytes[at];
  if (first === undefined) return null;
  let length = 1;
  while (length <= 8 && !(first & (0x80 >> (length - 1)))) length++;
  if (length > 8 || at + length > bytes.length) return null;
  let value = first & (0xff >> length), unknown = value === (0xff >> length);
  for (let i = 1; i < length; i++) { value = value * 256 + bytes[at + i]; if (bytes[at + i] !== 0xff) unknown = false; }
  return { size: unknown ? null : value, length };
}
const uintOf = (bytes, from, to) => { let value = 0; for (let i = from; i < to; i++) value = value * 256 + bytes[i]; return value; };
const textOf = (bytes, from, to) => Buffer.from(bytes.subarray(from, to)).toString('utf8').replace(/\0+$/, '');
function floatOf(bytes, from, to) {
  const view = new DataView(bytes.buffer, bytes.byteOffset + from, to - from);
  return to - from === 8 ? view.getFloat64(0) : to - from === 4 ? view.getFloat32(0) : NaN;
}

/** Each element from `from` to `to`: `{ id, start, end }`, `end` being where its data ends. */
function* children(bytes, from, to, { stopAtLevelOne = false } = {}) {
  let at = from;
  while (at < to) {
    const id = readId(bytes, at);
    if (!id) return;
    if (stopAtLevelOne && at > from && LEVEL_ONE.has(id.id)) return;
    const size = readSize(bytes, at + id.length);
    if (!size) return;
    const start = at + id.length + size.length;
    let end = size.size === null ? to : start + size.size;
    if (end > to) end = to;
    if (size.size === null && id.id === CLUSTER) {
      // A Cluster of unknown size runs to the next element of the Segment's own level.
      let inner = start;
      for (const child of children(bytes, start, to, { stopAtLevelOne: true })) inner = child.next;
      end = inner;
    }
    yield { id: id.id, start, end, next: end };
    at = end;
  }
}

/**
 * The facts of a WebM file: `{ docType, codec, width, height, durationMs, blocks, keyframes, lastBlockMs, declaredDuration }`,
 * or `{ error }` when it is not one. `durationMs` is the Info's duration where there is one, else the last block's time.
 */
export function readWebmFacts(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const facts = { docType: null, codec: null, width: null, height: null, durationMs: null, blocks: 0, keyframes: 0, lastBlockMs: null, declaredDuration: false };
  let scale = 1000000;
  const top = [...children(bytes, 0, bytes.length)];
  const header = top.find(one => one.id === EBML);
  if (!header || top[0]?.id !== EBML) return { error: 'This is not a WebM file.' };
  for (const child of children(bytes, header.start, header.end)) if (child.id === 0x4282) facts.docType = textOf(bytes, child.start, child.end);
  if (facts.docType !== 'webm') return { error: 'This is not a WebM file.' };
  const segment = top.find(one => one.id === SEGMENT);
  if (!segment) return { error: 'The file has no video in it.' };
  let duration = null;
  for (const child of children(bytes, segment.start, segment.end)) {
    if (child.id === INFO) {
      for (const item of children(bytes, child.start, child.end)) {
        if (item.id === 0x2ad7b1) scale = uintOf(bytes, item.start, item.end);
        if (item.id === 0x4489) duration = floatOf(bytes, item.start, item.end);
      }
    } else if (child.id === TRACKS) {
      for (const entry of children(bytes, child.start, child.end)) {
        if (entry.id !== 0xae) continue;
        let type = null, codec = null, width = null, height = null;
        for (const item of children(bytes, entry.start, entry.end)) {
          if (item.id === 0x83) type = uintOf(bytes, item.start, item.end);
          if (item.id === 0x86) codec = textOf(bytes, item.start, item.end);
          if (item.id === 0xe0) for (const video of children(bytes, item.start, item.end)) {
            if (video.id === 0xb0) width = uintOf(bytes, video.start, video.end);
            if (video.id === 0xba) height = uintOf(bytes, video.start, video.end);
          }
        }
        if (type === 1 && !facts.codec) Object.assign(facts, { codec, width, height });
      }
    } else if (child.id === CLUSTER) {
      let clusterTime = 0;
      for (const item of children(bytes, child.start, child.end)) {
        if (item.id === 0xe7) clusterTime = uintOf(bytes, item.start, item.end);
        else if (item.id === 0xa3 && item.end - item.start >= 4) {
          const track = readSize(bytes, item.start);
          const head = item.start + track.length;
          const relative = new DataView(bytes.buffer, bytes.byteOffset + head, 2).getInt16(0);
          facts.blocks++;
          if (bytes[head + 2] & 0x80) facts.keyframes++;
          const time = (clusterTime + relative) * scale / 1e6;
          facts.lastBlockMs = facts.lastBlockMs === null ? time : Math.max(facts.lastBlockMs, time);
        }
      }
    }
  }
  if (!facts.codec) return { error: 'The file has no video in it.' };
  if (Number.isFinite(duration) && duration > 0) { facts.durationMs = Math.round(duration * scale / 1e6); facts.declaredDuration = true; }
  else if (facts.lastBlockMs !== null) facts.durationMs = Math.round(facts.lastBlockMs);
  return facts;
}
