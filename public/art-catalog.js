// Independent, local-only asset workshop. This clock belongs to the preview; no world
// is created or queried here. All cards use the same renderer and atlas as the game.
import {
  drawSprite, drawClip, loadArt, hasSprite, sheetInfo, spriteFrame, spriteNames,
  clipNames, clipInfo, sampleClip,
} from '/art.js';

const $ = selector => document.querySelector(selector);
const media = matchMedia('(prefers-reduced-motion: reduce)');
const WIDTH = 288, HEIGHT = 224, RATIO = 2;
let playing = !media.matches, previewTime = 0, lastStamp = null, lastDraw = 0;
let records = [], shown = [], tiles = [], dirty = true;
let sprites = [], clips = [], sheets = {}, missingSheets = [], libraryLoaded = false;
const visible = new Set();
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    const tile = entry.target._artTile;
    if (entry.isIntersecting) { visible.add(tile); tile.dirty = true; }
    else visible.delete(tile);
  }
}, { rootMargin: '120px' });
$('#catalog-reduced').checked = media.matches;

function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text != null) result.textContent = text;
  if (className) result.className = className;
  return result;
}
function humanise(value) { return value.replaceAll('-', ' ').replace(/^./, first => first.toUpperCase()); }
function durationOf(clip) { return (clip.frames || []).reduce((total, frame) => total + frame.duration, 0); }
function playbackState() {
  $('#catalog-play').textContent = playing ? 'Pause' : 'Play';
  $('#catalog-play').setAttribute('aria-pressed', String(playing));
  $('#catalog-time').value = String(Math.round(previewTime));
  $('#catalog-time-value').textContent = `${(previewTime / 1000).toFixed(2)} s`;
  lastStamp = null;
}

$('#catalog-play').addEventListener('click', () => { playing = !playing; playbackState(); });
$('#catalog-time').addEventListener('input', event => {
  playing = false;
  previewTime = Number(event.target.value);
  playbackState(); dirty = true;
});
$('#catalog-speed').addEventListener('input', event => { $('#catalog-speed-value').textContent = `${event.target.value}×`; });
$('#catalog-size').addEventListener('input', event => { $('#catalog-size-value').textContent = `${event.target.value}%`; dirty = true; });
for (const selector of ['#catalog-background', '#catalog-anchors']) $(selector).addEventListener('change', () => { dirty = true; });
$('#catalog-reduced').addEventListener('change', () => {
  if ($('#catalog-reduced').checked) { playing = false; playbackState(); }
  dirty = true;
});
for (const selector of ['#catalog-search', '#catalog-sheet', '#catalog-motion', '#catalog-kind']) {
  $(selector).addEventListener(selector === '#catalog-search' ? 'input' : 'change', filterRecords);
}
document.addEventListener('visibilitychange', () => { lastStamp = null; });
playbackState();

const loaded = await loadArt({ all: true });
sprites = spriteNames(); clips = clipNames(); sheets = sheetInfo(); libraryLoaded = true;
for (const name of Object.keys(sheets)) {
  const option = node('option', humanise(name)); option.value = name; $('#catalog-sheet').append(option);
}
records = [
  ...clips.map(name => {
    const clip = clipInfo(name);
    const frames = (clip.frames || []).map(frame => spriteFrame(frame.sprite)).filter(Boolean);
    return { name, kind: 'clip', clip, frames, sheets: [...new Set(frames.map(frame => frame.sheet))], motion: clip.motion || 'none' };
  }),
  ...sprites.map(name => {
    const frame = spriteFrame(name);
    return { name, kind: 'sprite', frames: [frame], sheets: [frame.sheet], motion: 'none' };
  }),
];
missingSheets = Object.keys(sheets).filter(name => !loaded.images[name]);
window.__catalog = { sprites: sprites.length, clips: clips.length, sheets: Object.keys(sheets).length, missingSheets };
filterRecords();
requestAnimationFrame(animate);

function filterRecords() {
  const search = $('#catalog-search').value.trim().toLowerCase();
  const kind = $('#catalog-kind').value, sheet = $('#catalog-sheet').value, motion = $('#catalog-motion').value;
  shown = records.filter(record =>
    (kind === 'all' || record.kind === kind)
    && (sheet === 'all' || record.sheets.includes(sheet))
    && (motion === 'all' || (motion === 'frames' ? record.kind === 'clip' && record.clip.frames.length > 1 : record.motion === motion))
    && (!search || `${record.name} ${record.sheets.join(' ')} ${record.motion}`.toLowerCase().includes(search)),
  );
  observer.disconnect(); visible.clear(); tiles = [];
  const groups = new Map();
  for (const record of shown) {
    const title = `${humanise(record.sheets[0] || 'Unassigned')} · ${record.kind === 'clip' ? 'animations' : 'sprites'}`;
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(record);
  }
  const content = document.createDocumentFragment();
  for (const [title, members] of groups) {
    const heading = node('h2', title); heading.append(node('span', `${members.length} ${members.length === 1 ? 'asset' : 'assets'}`));
    const grid = node('div', null, 'grid');
    for (const record of members) {
      const tile = makeTile(record);
      tiles.push(tile); grid.append(tile.figure);
    }
    content.append(heading, grid);
  }
  $('#sheets').replaceChildren(content);
  $('#catalog-empty').hidden = shown.length > 0 || records.length === 0;
  for (const tile of tiles) { observer.observe(tile.figure); drawTile(tile); }
  if (!libraryLoaded) {
    $('#status').textContent = 'Loading the local library…';
  } else if (!records.length) {
    $('#status').textContent = 'The library did not load. Check that atlas.json and its local sheets are being served.';
  } else {
    $('#status').textContent = `${shown.length} shown · ${sprites.length} sprites · ${clips.length} animation clips · ${Object.keys(sheets).length} sheets${missingSheets.length ? ` · unavailable sheets: ${missingSheets.join(', ')}` : ' · all sheets loaded'}.`;
  }
  if (window.__catalog) window.__catalog.shown = shown.length;
  dirty = false;
}

function makeTile(record) {
  const figure = node('figure');
  figure.dataset[record.kind === 'sprite' ? 'sprite' : 'clip'] = record.name;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * RATIO; canvas.height = HEIGHT * RATIO;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `${record.name}: ${record.kind === 'clip' ? `${record.clip.frames.length} animation poses` : 'sprite'}, ${record.sheets.join(', ')}`);
  const caption = node('figcaption'), label = node('b', record.name);
  let detail;
  if (record.kind === 'clip') {
    detail = `${record.clip.frames.length} ${record.clip.frames.length === 1 ? 'pose' : 'poses'} · ${(durationOf(record.clip) / 1000).toFixed(2)} s · ${record.clip.loop === false ? 'one-shot' : 'loop'} · ${record.motion}`;
  } else {
    const frame = record.frames[0];
    detail = `${frame.w}×${frame.h} · anchor ${frame.anchorX.toFixed(2)}, ${frame.anchorY.toFixed(2)}${frame.logicalHeight && frame.logicalHeight !== frame.h ? ` · reference ${frame.logicalHeight}px` : ''}`;
  }
  const readout = node('span', '', 'frame-readout');
  caption.append(label, node('span', detail), readout);
  figure.append(canvas, caption);
  const frames = record.frames.length ? record.frames : [{ w: 1, h: 1, anchorX: .5, anchorY: 1 }];
  const bounds = {
    left: Math.max(...frames.map(frame => frame.w / (frame.logicalHeight || frame.h) * frame.anchorX)),
    right: Math.max(...frames.map(frame => frame.w / (frame.logicalHeight || frame.h) * (1 - frame.anchorX))),
    top: Math.max(...frames.map(frame => frame.h / (frame.logicalHeight || frame.h) * frame.anchorY)),
    bottom: Math.max(...frames.map(frame => frame.h / (frame.logicalHeight || frame.h) * (1 - frame.anchorY))),
  };
  const tile = { record, figure, canvas, readout, bounds, dirty: true };
  figure._artTile = tile;
  return tile;
}

function paintGround(ctx) {
  const background = $('#catalog-background').value;
  ctx.fillStyle = { prairie: '#a0aa64', paper: '#f3e6c7', dark: '#343c2f', checker: '#ece6d4' }[background];
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (background === 'checker') {
    ctx.fillStyle = '#f8f3e4';
    for (let y = 0; y < HEIGHT; y += 16) for (let x = 0; x < WIDTH; x += 16) if ((x / 16 + y / 16) % 2 === 0) ctx.fillRect(x, y, 16, 16);
  }
}
function drawTile(tile) {
  const { canvas, record, bounds } = tile, ctx = canvas.getContext('2d');
  ctx.setTransform(RATIO, 0, 0, RATIO, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  paintGround(ctx);
  const requested = 160 * Number($('#catalog-size').value) / 100;
  const height = Math.min(requested, (WIDTH - 36) / (bounds.left + bounds.right), (HEIGHT - 36) / (bounds.top + bounds.bottom));
  const x = (WIDTH - (bounds.left + bounds.right) * height) / 2 + bounds.left * height;
  const y = (HEIGHT - (bounds.top + bounds.bottom) * height) / 2 + bounds.top * height;
  const reducedMotion = $('#catalog-reduced').checked;
  let width = 0, readout = '';
  if (record.kind === 'clip') {
    // A paused preview holds its exact sampled time. The engine's paused option is
    // deliberately unused here, because that option requests a neutral first pose.
    width = drawClip(ctx, record.name, x, y, height, { timeMs: previewTime, reducedMotion });
    const sample = sampleClip(record.clip, previewTime, false, reducedMotion);
    if (sample) readout = `${sample.sprite} · ${sample.frameIndex + 1}/${record.clip.frames.length}${sample.ended ? ' · ended' : ''}`;
  } else {
    width = drawSprite(ctx, record.name, x, y, height);
    readout = hasSprite(record.name) ? record.sheets.join(', ') : 'Sheet unavailable';
  }
  if (!width) {
    ctx.fillStyle = $('#catalog-background').value === 'dark' ? '#f3e6c7' : '#61472e';
    ctx.font = '12px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Art unavailable', WIDTH / 2, HEIGHT / 2);
  }
  if ($('#catalog-anchors').checked) {
    ctx.strokeStyle = '#923f2eaa'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(12, y + .5); ctx.lineTo(WIDTH - 12, y + .5); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
  }
  if (tile.readout.textContent !== readout) tile.readout.textContent = readout;
  tile.dirty = false;
}

function animate(stamp) {
  if (lastStamp == null) lastStamp = stamp;
  const delta = Math.min(100, stamp - lastStamp);
  lastStamp = stamp;
  if (playing && !document.hidden) {
    previewTime = (previewTime + delta * Number($('#catalog-speed').value)) % Number($('#catalog-time').max);
    $('#catalog-time').value = String(Math.round(previewTime));
    $('#catalog-time-value').textContent = `${(previewTime / 1000).toFixed(2)} s`;
  }
  // Frame timing remains milliseconds; repainting visible previews is capped only to
  // reduce catalog work when many cards are present. Offscreen cards don't animate.
  if (!document.hidden && (dirty || stamp - lastDraw >= 32)) {
    for (const tile of visible) if (dirty || tile.dirty || (playing && tile.record.kind === 'clip')) drawTile(tile);
    dirty = false; lastDraw = stamp;
  }
  requestAnimationFrame(animate);
}
