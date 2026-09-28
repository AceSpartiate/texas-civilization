// A WebM file from encoded video frames (docs/FLASHBACK.md §4): the flashback's recorder, with no library.
//
// The Host page draws each flashback frame by frame and hands them to the browser's own VP8 encoder (WebCodecs `VideoEncoder`),
// which gives back encoded chunks with the timestamps it was told - not the wall clock's. This puts them in a WebM file a
// Chromebook plays: an EBML header, and a Segment of its Info (the duration), its one video track, Clusters of SimpleBlocks
// (a new cluster at every keyframe, so a replay or a seek starts clean), the Cues that say where each cluster is, and a SeekHead
// at the front pointing at them. Nothing here reads the page: under node it is what tests/flashback-video.test.mjs checks, and
// server/webm.mjs reads the same structure back on the server before a file is kept.
//
// Matroska's element IDs and the WebM subset are the published specification (matroska.org, webmproject.org); every element
// written here is one the WebM guidelines list as supported.

const ID = Object.freeze({
  EBML: [0x1a, 0x45, 0xdf, 0xa3], EBMLVersion: [0x42, 0x86], EBMLReadVersion: [0x42, 0xf7], EBMLMaxIDLength: [0x42, 0xf2], EBMLMaxSizeLength: [0x42, 0xf3],
  DocType: [0x42, 0x82], DocTypeVersion: [0x42, 0x87], DocTypeReadVersion: [0x42, 0x85],
  Segment: [0x18, 0x53, 0x80, 0x67], SeekHead: [0x11, 0x4d, 0x9b, 0x74], Seek: [0x4d, 0xbb], SeekID: [0x53, 0xab], SeekPosition: [0x53, 0xac],
  Info: [0x15, 0x49, 0xa9, 0x66], TimecodeScale: [0x2a, 0xd7, 0xb1], Duration: [0x44, 0x89], MuxingApp: [0x4d, 0x80], WritingApp: [0x57, 0x41], Title: [0x7b, 0xa9],
  Tracks: [0x16, 0x54, 0xae, 0x6b], TrackEntry: [0xae], TrackNumber: [0xd7], TrackUID: [0x73, 0xc5], FlagLacing: [0x9c], CodecID: [0x86], TrackType: [0x83],
  Video: [0xe0], PixelWidth: [0xb0], PixelHeight: [0xba],
  Cluster: [0x1f, 0x43, 0xb6, 0x75], Timecode: [0xe7], SimpleBlock: [0xa3],
  Cues: [0x1c, 0x53, 0xbb, 0x6b], CuePoint: [0xbb], CueTime: [0xb3], CueTrackPositions: [0xb7], CueTrack: [0xf7], CueClusterPosition: [0xf1],
});
export const WEBM_IDS = ID;

const text = value => new TextEncoder().encode(value);
function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}
/** An EBML size: the shortest variable-length integer that holds it (all ones is reserved for "unknown"). */
export function sizeBytes(size) {
  for (let length = 1; length <= 8; length++) {
    if (size < 2 ** (7 * length) - 1) {
      const out = new Uint8Array(length);
      let value = size;
      for (let i = length - 1; i >= 0; i--) { out[i] = value % 256; value = Math.floor(value / 256); }
      out[0] |= 1 << (8 - length);
      return out;
    }
  }
  throw new Error('An element too large for a WebM file');
}
/** An unsigned integer, big-endian, in as few bytes as it needs, or exactly `width` of them. */
function uint(value, width = 0) {
  const bytes = [];
  let rest = Math.round(value);
  do { bytes.unshift(rest % 256); rest = Math.floor(rest / 256); } while (rest > 0);
  while (bytes.length < width) bytes.unshift(0);
  return Uint8Array.from(bytes);
}
function float64(value) { const out = new Uint8Array(8); new DataView(out.buffer).setFloat64(0, value); return out; }
const element = (id, body) => { const payload = Array.isArray(body) ? concat(body) : body; return concat([Uint8Array.from(id), sizeBytes(payload.length), payload]); };

/**
 * The file, from `frames`: `{ data: Uint8Array, timestampMs, key }` in order, the first a keyframe. `durationMs` is the video's
 * length (the last frame's time plus its own). Returns the bytes.
 */
export function muxWebM({ width, height, codec = 'V_VP8', frames, durationMs, title = null, app = 'Texas Civilization flashback' }) {
  if (!frames?.length) throw new Error('A video needs frames');
  if (!frames[0].key) throw new Error('A video must begin with a keyframe');
  const header = element(ID.EBML, [
    element(ID.EBMLVersion, uint(1)), element(ID.EBMLReadVersion, uint(1)), element(ID.EBMLMaxIDLength, uint(4)), element(ID.EBMLMaxSizeLength, uint(8)),
    element(ID.DocType, text('webm')), element(ID.DocTypeVersion, uint(2)), element(ID.DocTypeReadVersion, uint(2)),
  ]);
  const info = element(ID.Info, [
    element(ID.TimecodeScale, uint(1000000)), element(ID.MuxingApp, text(app)), element(ID.WritingApp, text(app)),
    // A null duration writes none, as a live recorder does (a test's MediaRecorder-shaped file).
    ...(durationMs === null ? [] : [element(ID.Duration, float64(durationMs))]), ...(title ? [element(ID.Title, text(title))] : []),
  ]);
  const tracks = element(ID.Tracks, element(ID.TrackEntry, [
    element(ID.TrackNumber, uint(1)), element(ID.TrackUID, uint(1)), element(ID.FlagLacing, uint(0)), element(ID.CodecID, text(codec)), element(ID.TrackType, uint(1)),
    element(ID.Video, [element(ID.PixelWidth, uint(width)), element(ID.PixelHeight, uint(height))]),
  ]));
  // Clusters: a new one at each keyframe, and before a block's time from its cluster's would pass what sixteen bits hold.
  const clusters = [];
  let current = null;
  for (const frame of frames) {
    const time = Math.max(0, Math.round(frame.timestampMs));
    if (!current || frame.key || time - current.time > 30000) { current = { time, blocks: [] }; clusters.push(current); }
    const relative = time - current.time;
    const head = new Uint8Array(4);
    head[0] = 0x81; // track 1, as a one-byte vint
    new DataView(head.buffer).setInt16(1, relative);
    head[3] = frame.key ? 0x80 : 0x00;
    current.blocks.push(element(ID.SimpleBlock, [head, frame.data]));
  }
  const clusterBytes = clusters.map(cluster => element(ID.Cluster, [element(ID.Timecode, uint(cluster.time)), ...cluster.blocks]));
  // Positions are counted from the start of the Segment's own data. The SeekHead's positions are written eight bytes wide so
  // its size is known before they are.
  const seekEntry = (id, position) => element(ID.Seek, [element(ID.SeekID, Uint8Array.from(id)), element(ID.SeekPosition, uint(position, 8))]);
  const seekSize = element(ID.SeekHead, [seekEntry(ID.Info, 0), seekEntry(ID.Tracks, 0), seekEntry(ID.Cues, 0)]).length;
  const infoAt = seekSize, tracksAt = infoAt + info.length, firstCluster = tracksAt + tracks.length;
  const clusterAt = [];
  let at = firstCluster;
  for (const bytes of clusterBytes) { clusterAt.push(at); at += bytes.length; }
  const cues = element(ID.Cues, clusters.map((cluster, i) => element(ID.CuePoint, [
    element(ID.CueTime, uint(cluster.time)),
    element(ID.CueTrackPositions, [element(ID.CueTrack, uint(1)), element(ID.CueClusterPosition, uint(clusterAt[i]))]),
  ])));
  const seekHead = element(ID.SeekHead, [seekEntry(ID.Info, infoAt), seekEntry(ID.Tracks, tracksAt), seekEntry(ID.Cues, at)]);
  const segment = element(ID.Segment, [seekHead, info, tracks, ...clusterBytes, cues]);
  return concat([header, segment]);
}
