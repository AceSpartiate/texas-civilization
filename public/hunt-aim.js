// The shot, aimed by the student: a first-person field over the hunter's shoulder (owner, 2026-10-02, verbatim: "when a character
// goes hunting, when they see an animal the player should see an alert. if players click on it in time, then a first person mini
// game starts where they have to aim and hit the moving animal. if they miss, the animal runs away."; docs/WOODS_AND_BUILDING.md
// §5.2, sim/hunt-aim.mjs).
//
// Opened by the sighting's card (*Take the shot*), its "!" on the hunter's row, or *Take the shot* on the hunter's card. The page
// tells the server it has begun (`aim-shot`), draws the animal on the path the server's own module gives (sim/hunt-aim.mjs
// `aimPath`), and sends **only when the trigger was pulled and where the sights were held** (`fire-shot`). Whether it hit is the
// server's answer, read off the hunter's chore in the next snapshot (`chore.shot`) - the smoke of the shot covers the wait. One shot:
// a muzzle-loader fires once and the field is gone in smoke. If the animal crosses out of view with no shot, it was let go.
//
// Every way of aiming: the mouse (the sights follow it; a click fires), touch (touch or drag the sights onto it, then *Fire*), and
// the keyboard (the arrow keys move the sights, Shift slowly; Space or Enter fires; Escape lets it go). With the page asking for less
// motion the animal does not bound, runs slower and stands longer, the sights wander slower, and nothing kicks or flashes (`calm`).
//
// stand-in: docs/ART_REQUESTS.md, request 2026-10-02 "the hunter's first-person field" - the field (sky, timber, brush, prairie) and
// the rifle over the shoulder are drawn here by the page. The animals are Astra's own wildlife clips, at the size of the field.
import { VIEW, LEAD_MS, aimPath, animalAt, swayAt, judgeShot } from '/sim/hunt-aim.mjs';
import { drawClip, loadArt } from '/art.js';
import { SIGHTED } from '/family-panel.js';

/** Where each quarry's clips are, so the sheet is asked for the moment the field opens. */
const SHEETS = Object.freeze({ deer: 'wildlife-deer', turkey: 'wildlife-turkey', bear: 'wildlife-bear-javelina', javelina: 'wildlife-bear-javelina', bison: 'wildlife-bison-pronghorn', pronghorn: 'wildlife-bison-pronghorn', mustang: 'wildlife-mustang', cattle: 'wildlife-geese-cattle', waterfowl: 'wildlife-geese-cattle' });
/** The field's own seconds after a shot before the result is said, while the smoke clears: long enough to see the animal fall or run. */
const SAY_AFTER_MS = 1200;
/** How long the result stands before the field closes by itself. */
const CLOSE_AFTER_MS = 9000;
/** Keyboard aiming, in units a second; Shift for the fine adjustment. */
const KEY_SPEED = 5, KEY_FINE = 1.4;
/** The powder smoke's two tones, the battle's own (public/battle-view.js `drawBank`): white-grey, never black. */
const SMOKE_TONE = '238,236,228', SMOKE_CORE = '214,212,203';

function hash(text) { let h = 2166136261; for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function generator(seed) { let s = hash(seed) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const capital = text => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const theOf = quarry => (SIGHTED[quarry] || SIGHTED.deer).replace(/^an? /, 'the ');
const wereOf = quarry => (quarry === 'waterfowl' ? 'were' : 'was');

/**
 * The season and the sky of the field: the leaves, the grass and the light. December to February the timber is bare and the grass
 * dead; spring and summer green; the fall golden (`HIST-TEX-264`'s lean deer and fat turkeys are the same months).
 */
function palette(sight) {
  const month = Number.isFinite(sight?.month) ? sight.month : 8;
  const season = [11, 0, 1].includes(month) ? 'winter' : [9, 10].includes(month) ? 'fall' : [2, 3, 4].includes(month) ? 'spring' : 'summer';
  const sky = sight?.sky || 'fair';
  const grey = ['rain', 'storm', 'norther'].includes(sky);
  const leaf = { winter: ['#7a6d5c', '#5f5446', '#8b7e6b'], fall: ['#8a7a3a', '#9c6a2c', '#6f6a34'], spring: ['#5f8a3e', '#4d7535', '#77994a'], summer: ['#4f6f33', '#3f5c2b', '#62803f'] }[season];
  const grass = { winter: ['#b39d72', '#9c8660', '#c8b489'], fall: ['#b9a565', '#a08a4c', '#cdb877'], spring: ['#8fae5a', '#7a9a4a', '#a6c26e'], summer: ['#a3a65a', '#8c9049', '#bdbd72'] }[season];
  return {
    season, sky, leaf, grass,
    skyTop: grey ? '#8d9399' : sky === 'fog' ? '#c9cbc6' : '#8fb3cf', skyLow: grey ? '#b9bcbb' : sky === 'fog' ? '#dcddd6' : '#e6e1c8',
    far: grey ? '#7c8582' : '#8f9e98', haze: sky === 'fog' ? 0.55 : grey ? 0.25 : 0.12,
  };
}

/** The field behind the animal, drawn once a size: sky, the far ground, the cover the hunter is waiting in, and the ground. */
function paintField(ctx, W, H, box, sight) {
  const { x: ox, y: oy, s } = box, look = palette(sight), random = generator(`${sight?.seed}:field`), cover = sight?.cover || 'timber';
  const X = u => ox + u * s, Y = v => oy + v * s;
  const horizon = Y(VIEW.horizon);
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, look.skyTop); sky.addColorStop(1, look.skyLow);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 2);
  // The far ground: low hills or the line of distant timber, hazed by the air between.
  ctx.fillStyle = look.far;
  ctx.beginPath(); ctx.moveTo(0, horizon);
  for (let u = -1; u <= VIEW.w + 1; u += 0.5) ctx.lineTo(X(u), horizon - s * (0.25 + 0.2 * Math.sin(u * 0.7 + random() * 0.6)));
  ctx.lineTo(W, horizon); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  // The ground, from the horizon down to the hunter's feet.
  const ground = ctx.createLinearGradient(0, horizon, 0, H);
  ground.addColorStop(0, look.grass[1]); ground.addColorStop(0.5, look.grass[0]); ground.addColorStop(1, look.grass[2]);
  ctx.fillStyle = ground; ctx.fillRect(0, horizon, W, H - horizon);
  // Water where the fowl are: a strip of the creek or the bay under the far bank.
  if (sight?.quarry === 'waterfowl') {
    const water = ctx.createLinearGradient(0, horizon, 0, horizon + s * 0.9);
    water.addColorStop(0, '#9fb5bd'); water.addColorStop(1, '#6f8d97');
    ctx.fillStyle = water; ctx.fillRect(0, horizon + s * 0.05, W, s * 0.85);
  }
  // The far cover along the horizon: the timber's crowns, the brush's low tops, or a few mottes out on the prairie.
  const crown = (x, y, r, tone) => { ctx.fillStyle = tone; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); };
  const tones = look.leaf;
  if (cover === 'timber') {
    // The far side of the clearing: a high wall of crowns, hazed, and the nearer crowns over it.
    for (let u = -1; u < VIEW.w + 1; u += 0.4) crown(X(u + random() * 0.3), horizon - s * (1.3 + random() * 0.9), s * (0.6 + random() * 0.35), look.far);
    ctx.fillStyle = `rgba(235,235,228,${look.haze + 0.15})`; ctx.fillRect(0, 0, W, horizon);
    for (let u = -1; u < VIEW.w + 1; u += 0.32) crown(X(u + random() * 0.2), horizon - s * (0.35 + random() * 0.7), s * (0.42 + random() * 0.32), tones[Math.floor(random() * 3)]);
  } else if (cover === 'brush') {
    for (let u = -1; u < VIEW.w + 1; u += 0.45) crown(X(u + random() * 0.3), horizon - s * (0.12 + random() * 0.15), s * (0.28 + random() * 0.2), tones[Math.floor(random() * 3)]);
  } else {
    for (let i = 0; i < 4; i++) { const u = random() * VIEW.w; for (let k = 0; k < 4; k++) crown(X(u + k * 0.18), horizon - s * (0.2 + random() * 0.2), s * (0.18 + random() * 0.12), tones[k % 3]); }
  }
  // Haze over the distance: the morning's air, a fog thick on it.
  ctx.fillStyle = `rgba(235,235,228,${look.haze})`; ctx.fillRect(0, 0, W, horizon + s * 0.4);
  // The middle ground: trunks well behind the animal's lane in the timber, clumps of brush, or tufts of the tall grass.
  for (let i = 0; i < (cover === 'open' ? 26 : 14); i++) {
    const u = random() * VIEW.w, v = VIEW.horizon + 0.15 + random() * 0.6;
    if (cover === 'timber') {
      ctx.fillStyle = look.season === 'winter' ? '#6b5d4c' : '#4f4234';
      ctx.fillRect(X(u), Y(v) - s * 1.6, s * 0.08, s * 1.6);
      crown(X(u + 0.04), Y(v) - s * 1.7, s * 0.45, tones[i % 3]);
    } else if (cover === 'brush') crown(X(u), Y(v) - s * 0.15, s * (0.3 + random() * 0.25), tones[i % 3]);
    else { ctx.strokeStyle = look.grass[1]; ctx.lineWidth = Math.max(1, s * 0.02); for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(X(u + k * 0.05), Y(v)); ctx.lineTo(X(u + k * 0.05 + 0.08), Y(v) - s * 0.25); ctx.stroke(); } }
  }
}

/** The cover nearest the hunter, drawn over the animal at the edges of the view: a trunk each side in the timber, brush, or grass. */
function paintNear(ctx, W, H, box, sight) {
  const { x: ox, y: oy, s } = box, look = palette(sight), random = generator(`${sight?.seed}:near`), cover = sight?.cover || 'timber';
  const X = u => ox + u * s, Y = v => oy + v * s;
  if (cover === 'timber') {
    for (const [u, w] of [[-0.2, 1.1], [VIEW.w - 0.6, 1.3]]) {
      const bark = ctx.createLinearGradient(X(u), 0, X(u + w), 0);
      bark.addColorStop(0, '#3a2f24'); bark.addColorStop(0.5, '#5a4a39'); bark.addColorStop(1, '#2e251c');
      ctx.fillStyle = bark; ctx.fillRect(X(u), 0, s * w, H);
    }
  }
  // Leaves hanging over the hunter's head, from the trees he is standing under (bare twigs in the winter): the view is out of cover.
  if (cover !== 'open') {
    const tones = look.leaf;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 26; i++) {
        const u = side < 0 ? -0.6 + random() * 4.2 : VIEW.w + 0.6 - random() * 4.2, v = -0.5 + random() * (1.6 - Math.abs(u - (side < 0 ? 0 : VIEW.w)) * 0.32);
        if (look.season === 'winter') { ctx.strokeStyle = '#3c3228'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath(); ctx.moveTo(X(u), Y(v)); ctx.lineTo(X(u - side * 0.5), Y(v + 0.35)); ctx.stroke(); continue; }
        ctx.fillStyle = tones[i % 3]; ctx.beginPath(); ctx.ellipse(X(u), Y(v), s * (0.28 + random() * 0.3), s * (0.16 + random() * 0.14), random() * 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Grass and brush along the bottom, over the animal's feet when it comes close.
  const tones = cover === 'brush' ? look.leaf : look.grass;
  for (let i = 0; i < 70; i++) {
    const u = -0.5 + random() * (VIEW.w + 1), v = VIEW.h - random() * 1.1, tall = s * (0.35 + random() * 0.5);
    ctx.strokeStyle = tones[i % 3]; ctx.lineWidth = Math.max(1.2, s * 0.035);
    ctx.beginPath(); ctx.moveTo(X(u), Y(v) + s); ctx.quadraticCurveTo(X(u + 0.05), Y(v) - tall * 0.5, X(u + (random() - 0.5) * 0.4), Y(v) - tall); ctx.stroke();
  }
  // A vignette: looking out of the cover, the eye on the middle of the field.
  const shade = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
  shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(10,8,5,0.55)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
}

/** An animal drawn plainly if its sheet has not come yet: never nothing where the server says something is. */
function plainAnimal(ctx, x, y, h, dir, quarry) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = quarry === 'bear' ? '#2c2219' : quarry === 'turkey' ? '#3d3026' : '#7b5a3a';
  ctx.beginPath(); ctx.ellipse(0, -h * 0.5, h * 0.42, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-h * 0.3, -h * 0.35, h * 0.07, h * 0.35); ctx.fillRect(h * 0.22, -h * 0.35, h * 0.07, h * 0.35);
  ctx.beginPath(); ctx.ellipse(h * 0.45, -h * 0.72, h * 0.12, h * 0.09, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function mountHuntAim({ send, sound = () => {}, reducedMotion = { matches: false }, onClosed = () => {} }) {
  const root = document.createElement('section');
  root.id = 'hunt-aim';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'hunt-aim-title');
  root.innerHTML = `
    <canvas id="hunt-aim-field" tabindex="0" aria-describedby="hunt-aim-help"></canvas>
    <header id="hunt-aim-head"><span class="eyebrow">On the hunt</span><strong id="hunt-aim-title"></strong><span id="hunt-aim-hand"></span></header>
    <p id="hunt-aim-help">One shot. Put the sights on it and click to fire, or touch it and press Fire. Keys: arrows to aim, Space to fire, Escape to let it go.</p>
    <div id="hunt-aim-buttons"><button type="button" id="hunt-aim-fire">Fire</button><button type="button" id="hunt-aim-hold">Let it go</button></div>
    <div id="hunt-aim-result" hidden><strong id="hunt-aim-verdict"></strong><p id="hunt-aim-words"></p><button type="button" id="hunt-aim-done">Back to the family</button></div>
    <p id="hunt-aim-live" class="sr-only" aria-live="assertive"></p>`;
  document.body.append(root);
  const $ = selector => root.querySelector(selector);
  const canvas = $('#hunt-aim-field'), ctx = canvas.getContext('2d');
  let aim = null, frame = 0, closeTimer = null, layers = null;
  const keys = new Set();
  const evidence = window.__huntAim = { open: false, frames: 0, opened: 0 };

  const say = text => { if ($('#hunt-aim-live').textContent !== text) $('#hunt-aim-live').textContent = text; };
  const now = () => performance.now();
  /** The field's box on the screen: the 16 by 9 units fitted into the window, in CSS pixels. */
  function boxOf() {
    const W = canvas.clientWidth || innerWidth, H = canvas.clientHeight || innerHeight;
    const s = Math.min(W / VIEW.w, H / VIEW.h);
    return { W, H, s, x: (W - VIEW.w * s) / 2, y: (H - VIEW.h * s) / 2 };
  }
  const toField = (box, px, py) => ({ x: (px - box.x) / box.s, y: (py - box.y) / box.s });
  const clampField = point => ({ x: Math.max(0, Math.min(VIEW.w, point.x)), y: Math.max(0, Math.min(VIEW.h, point.y)) });

  /** The cached layers for this size: the field behind, and the cover in front. */
  function layersFor(box) {
    const ratio = Math.min(2, devicePixelRatio || 1), key = `${box.W}x${box.H}@${ratio}:${aim.sight.seed}`;
    if (layers?.key === key) return layers;
    const make = paint => {
      const layer = document.createElement('canvas');
      layer.width = Math.round(box.W * ratio); layer.height = Math.round(box.H * ratio);
      const c = layer.getContext('2d'); c.scale(ratio, ratio); paint(c, box.W, box.H, box, aim.sight);
      return layer;
    };
    layers = { key, back: make(paintField), near: make(paintNear) };
    return layers;
  }

  function open(world, entityId) {
    const entity = (world?.entities || []).find(one => one.id === entityId);
    const ask = entity?.chore?.ask;
    if (!ask || ask.id !== 'shot' || !ask.sight || aim) return false;
    const calm = Boolean(reducedMotion.matches);
    const path = aimPath(ask.sight, { calm });
    aim = { entityId, name: entity.given || String(entity.name || '').split(' ')[0] || 'They', fullName: entity.name, sight: ask.sight, path, calm,
      t0: now(), pointer: { x: VIEW.w / 2, y: Math.min(VIEW.h - 1, path.ground - path.height * 0.5) }, fired: null, result: null, sent: false, phase: 'waiting', lastKey: now() };
    clearTimeout(closeTimer);
    const what = SIGHTED[ask.sight.quarry] || SIGHTED.deer;
    $('#hunt-aim-title').textContent = `${capital(what)}! ${aim.fullName} has the rifle up.`;
    $('#hunt-aim-hand').textContent = ask.sight.hand?.words || '';
    $('#hunt-aim-result').hidden = true;
    $('#hunt-aim-buttons').hidden = false;
    $('#hunt-aim-fire').disabled = false; $('#hunt-aim-hold').disabled = false;
    root.dataset.calm = String(calm);
    root.dataset.cover = ask.sight.cover;
    root.hidden = false;
    layers = null;
    canvas.focus({ preventScroll: true });
    // Ask the animal's sheet now, so it is there before it comes into view (`LEAD_MS`).
    loadArt({ sheets: [SHEETS[path.quarry] || SHEETS.deer] }).catch(() => {});
    say(`${capital(what)}, ${ask.sight.cover === 'open' ? 'out on the open ground' : `in the ${ask.sight.cover}`}. It will come into view from the ${path.dir > 0 ? 'left' : 'right'}.`);
    Object.assign(evidence, { open: true, opened: evidence.opened + 1, entityId, path, t0: aim.t0, calm, sheet: SHEETS[path.quarry], fired: null, result: null, sent: null, refused: null });
    send({ action: 'aim-shot', entityId, calm }).then(() => { if (aim) { aim.sent = true; evidence.sent = 'aim'; } })
      .catch(error => { evidence.refused = error.message; finish({ refused: error.message }); });
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(draw);
    return true;
  }

  /** The trigger: the sights where they are now, the time from the press that opened the field. One shot only. */
  function fire() {
    if (!aim || aim.fired || aim.result) return;
    const t = Math.round(now() - aim.t0);
    const held = clampField(aim.pointer);
    const box = boxOf(), sway = swayAt(aim.path, t);
    const muzzle = { x: box.x + (held.x + sway.dx) * box.s, y: box.y + (held.y + sway.dy) * box.s };
    // The page's own guess, drawn at once (the ball's dust where it went); the verdict is the server's (`update`).
    const guess = judgeShot(aim.path, { t, ...held });
    aim.fired = { t, at: now(), x: held.x, y: held.y, muzzle, guess, animal: animalAt(aim.path, t + aim.path.hangMs) };
    evidence.fired = { t, x: +held.x.toFixed(3), y: +held.y.toFixed(3), guess: guess.hit };
    $('#hunt-aim-fire').disabled = true; $('#hunt-aim-hold').disabled = true;
    // Damp powder hangs fire: the bang a moment after the trigger, as the ball.
    setTimeout(() => sound('musket'), aim.path.hangMs);
    say('Fired.');
    send({ action: 'fire-shot', entityId: aim.entityId, t, x: +held.x.toFixed(3), y: +held.y.toFixed(3) })
      .then(() => { evidence.sent = 'fire'; })
      .catch(error => { evidence.refused = error.message; finish({ refused: error.message }); });
  }
  /** Let it go: no shot, nothing spent, the animal away. Also when it has crossed out of view unfired. */
  function hold(why = 'held') {
    if (!aim || aim.fired || aim.result) return;
    aim.fired = { t: Math.round(now() - aim.t0), at: now(), hold: true };
    $('#hunt-aim-fire').disabled = true; $('#hunt-aim-hold').disabled = true;
    send({ action: 'fire-shot', entityId: aim.entityId, hold: true }).catch(error => { evidence.refused = error.message; });
    finish({ held: true, why });
  }

  /** The result, in words, once it is known: the server's verdict for a shot, or the page's own for a held fire or a refusal. */
  function finish({ hit = false, held = false, refused = null, why = null } = {}) {
    if (!aim || aim.result) return;
    const quarry = aim.path.quarry, the = theOf(quarry), cover = aim.sight.cover === 'open' ? 'the open ground' : `the ${aim.sight.cover}`;
    aim.result = { hit, held, refused, at: now() };
    evidence.result = { hit, held, refused };
    const [verdict, words] = refused ? ['The shot was not taken', refused]
      : held ? ['Gone', `${capital(the)} ${wereOf(quarry)} away into ${cover}${why === 'gone' ? ' before the shot' : ''}. No powder was spent.`]
      : hit ? ['A clean shot!', `${aim.fullName} brought down ${the}. It is dressed out and carried home; the journal says what it came to.`]
      : ['Missed!', `The ball went wide, and ${the} ${wereOf(quarry)} away into ${cover}. One powder spent.`];
    const show = () => {
      if (!aim) return;
      $('#hunt-aim-verdict').textContent = verdict;
      $('#hunt-aim-words').textContent = words;
      root.dataset.result = refused ? 'refused' : held ? 'held' : hit ? 'hit' : 'miss';
      $('#hunt-aim-buttons').hidden = true;
      $('#hunt-aim-result').hidden = false;
      $('#hunt-aim-done').focus({ preventScroll: true });
      say(`${verdict} ${words}`);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, CLOSE_AFTER_MS);
    };
    // A shot is said when the smoke has thinned enough to see what it did; a held fire or a refusal at once.
    if (refused || held) show(); else setTimeout(show, Math.max(0, SAY_AFTER_MS - (now() - (aim.fired?.at ?? now()))));
  }

  /** Every snapshot: the server's verdict on the shot, when it comes (`chore.shot`); the field closed if the hunt is gone. */
  function update(world) {
    if (!aim) return;
    const entity = (world?.entities || []).find(one => one.id === aim.entityId);
    const shot = entity?.chore?.shot;
    if (aim.fired && !aim.fired.hold && !aim.result && shot) {
      evidence.verdict = { ...shot };
      if (shot.held) finish({ held: true, why: 'gone' }); else finish({ hit: Boolean(shot.hit) });
      aim.verdict = shot;
    }
    // Nothing waits on a field whose hunt has ended or whose question was settled some other way (the hunter took it himself).
    if (!aim.fired && !aim.result && entity?.chore?.ask?.id !== 'shot' && aim.sent) finish({ refused: `${aim.fullName} has already taken the shot.` });
  }

  function close() {
    clearTimeout(closeTimer);
    cancelAnimationFrame(frame);
    if (aim && !aim.fired && !aim.result) hold('held');
    aim = null; keys.clear();
    root.hidden = true;
    delete root.dataset.result;
    evidence.open = false;
    onClosed();
  }

  // ------------------------------------------------------------------------------------------------ the drawing, every frame
  function draw() {
    frame = 0;
    if (!aim) return;
    const box = boxOf(), ratio = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== Math.round(box.W * ratio) || canvas.height !== Math.round(box.H * ratio)) { canvas.width = Math.round(box.W * ratio); canvas.height = Math.round(box.H * ratio); layers = null; }
    const t = now() - aim.t0, path = aim.path, calm = aim.calm;
    // The keyboard's sights, moved by the arrows held down.
    const dt = Math.min(0.05, (now() - aim.lastKey) / 1000); aim.lastKey = now();
    if (keys.size && !aim.fired) {
      const speed = (keys.has('Shift') ? KEY_FINE : KEY_SPEED) * dt;
      aim.pointer = clampField({ x: aim.pointer.x + speed * ((keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0)), y: aim.pointer.y + speed * ((keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0)) });
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#1a140d'; ctx.fillRect(0, 0, box.W, box.H);
    const { back, near } = layersFor(box);
    ctx.drawImage(back, 0, 0, box.W, box.H);
    // The animal: on its path until the shot; after it, falling where it was hit, or running on, faster, out of the view.
    let animal = animalAt(path, aim.fired ? Math.min(t, aim.fired.t + path.hangMs) : t);
    // The server's verdict once it has come; until then (the smoke is up) the page's own reading of the same numbers.
    const hit = aim.verdict ? Boolean(aim.verdict.hit) : Boolean(aim.fired?.guess?.hit);
    if (aim.fired && !hit) {
      const since = Math.max(0, t - aim.fired.t - path.hangMs) / 1000, from = aim.fired.animal || animal;
      if (from.phase !== 'gone' && from.phase !== 'waiting') {
        const x = from.x + from.dir * path.speed * (calm ? 1.2 : 1.8) * since;
        animal = { ...from, x, y: path.flies ? from.y - since * 0.6 : path.ground - (calm ? 0 : Math.abs(Math.sin(Math.PI * since * 1000 / path.cycleMs)) * path.hop * path.height), phase: 'running', clip: animalAt(path, path.goAt + 1).clip };
      }
    }
    const phase = aim.fired ? (hit ? 'down' : 'fled') : animal.phase;
    if (phase !== aim.phase) {
      aim.phase = phase;
      if (phase === 'running' && !aim.fired) say(t < path.stopAt ? 'Here it comes.' : 'It is running again.');
      if (phase === 'still') say('It has stopped to look. Steady.');
    }
    evidence.phase = phase; evidence.frames++;
    if (animal.phase !== 'waiting' && animal.phase !== 'gone') {
      const ax = box.x + animal.x * box.s, ay = box.y + animal.y * box.s, h = animal.h * box.s;
      ctx.save();
      if (hit && aim.fired) {
        // Down: its legs go from under it, nose first, and it drops into the grass where it stood (at once, with less motion).
        const fall = calm ? 1 : Math.min(1, Math.max(0, t - aim.fired.t - path.hangMs) / 500);
        const settle = path.flies ? box.s * 1.8 * fall : h * 0.1 * fall;
        ctx.translate(ax, ay + settle); ctx.rotate(animal.dir * 0.28 * fall); ctx.scale(1, 1 - 0.42 * fall); ctx.translate(-ax, -ay);
      }
      const drawn = drawClip(ctx, hit && aim.fired ? animalAt(path, path.stopAt + 1).clip : animal.clip, ax, ay, h, { timeMs: t, flip: animal.dir < 0, reducedMotion: calm });
      if (!drawn) plainAnimal(ctx, ax, ay, h, animal.dir, path.quarry);
      ctx.restore();
      evidence.animal = { x: +animal.x.toFixed(3), y: +animal.y.toFixed(3), phase: animal.phase, drawn: Boolean(drawn), body: animal.body };
      // The body a ball must find, drawn only for a proof that asks to see it (`?aimdebug`).
      if (evidence.debug) { const b = animal.body; ctx.strokeStyle = '#ff0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(box.x + b.cx * box.s, box.y + b.cy * box.s, b.rx * box.s, b.ry * box.s, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.drawImage(near, 0, 0, box.W, box.H);
    // The ball's dust where a miss struck the ground.
    if (aim.fired && !aim.fired.hold && aim.result && !hit && aim.fired.guess && aim.fired.guess.aim.y > VIEW.horizon) {
      const since = now() - aim.fired.at - path.hangMs;
      if (since > 0 && since < 900) {
        const g = aim.fired.guess.aim, r = box.s * (0.1 + since / 900 * 0.35);
        ctx.fillStyle = `rgba(160,140,110,${(1 - since / 900) * 0.6})`; ctx.beginPath(); ctx.arc(box.x + g.x * box.s, box.y + g.y * box.s, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    drawRain(box, t, calm);
    drawRifle(box, t);
    drawSmoke(box, t, calm);
    // Out of view with no shot: it was let go.
    if (!aim.fired && t > path.goneAt + 250) hold('gone');
    frame = requestAnimationFrame(draw);
  }

  /** Rain on the field when the sky is raining: streaks, still with less motion. */
  function drawRain(box, t, calm) {
    if (!['rain', 'storm'].includes(aim.sight.sky)) return;
    const random = generator(`${aim.sight.seed}:rain`), drift = calm ? 0 : t / 1000;
    ctx.strokeStyle = 'rgba(210,220,230,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 90; i++) {
      const x = ((random() * box.W) + drift * 60) % box.W, y = ((random() * box.H) + drift * 700 * (0.8 + random() * 0.4)) % box.H;
      ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14);
    }
    ctx.stroke();
  }

  /** The long rifle seen over the hunter's shoulder, its muzzle on the sights, and the bead where the ball will go. */
  function drawRifle(box, t) {
    const path = aim.path, fired = aim.fired && !aim.fired.hold ? aim.fired : null;
    const tNow = fired ? fired.t : t;
    const sway = swayAt(path, tNow), point = clampField(fired ? { x: fired.x, y: fired.y } : aim.pointer);
    let mx = box.x + (point.x + sway.dx) * box.s, my = box.y + (point.y + sway.dy) * box.s;
    // The kick: up and back, and settling (none with less motion).
    if (fired && !aim.calm) {
      const since = now() - fired.at - path.hangMs;
      if (since > 0) { const kick = since < 60 ? since / 60 : Math.max(0, 1 - (since - 60) / 380); my -= kick * box.s * 0.6; mx += kick * box.s * 0.1; }
    }
    evidence.sights = { x: +((mx - box.x) / box.s).toFixed(3), y: +((my - box.y) / box.s).toFixed(3) };
    const bx = box.W * 0.64, by = box.H + box.s * 0.6, wide = box.s * 0.42, tip = Math.max(3, box.s * 0.06);
    const ang = Math.atan2(my - by, mx - bx), nx = -Math.sin(ang), ny = Math.cos(ang);
    // The stock and the lock, low at the right, in the cherry and iron of a Kentucky rifle.
    ctx.fillStyle = '#5a3420';
    ctx.beginPath(); ctx.moveTo(bx + nx * wide * 1.6, by + ny * wide * 1.6); ctx.lineTo(bx - nx * wide * 1.6, by - ny * wide * 1.6);
    ctx.lineTo(bx - nx * wide * 0.8 + Math.cos(ang) * box.s * 1.6, by - ny * wide * 0.8 + Math.sin(ang) * box.s * 1.6);
    ctx.lineTo(bx + nx * wide * 0.8 + Math.cos(ang) * box.s * 1.6, by + ny * wide * 0.8 + Math.sin(ang) * box.s * 1.6); ctx.closePath(); ctx.fill();
    // The barrel, browned iron, narrowing to the muzzle on the sights.
    const steel = ctx.createLinearGradient(bx - nx * wide, by - ny * wide, bx + nx * wide, by + ny * wide);
    steel.addColorStop(0, '#2b2622'); steel.addColorStop(0.45, '#6d655c'); steel.addColorStop(1, '#231f1b');
    ctx.fillStyle = steel;
    ctx.beginPath(); ctx.moveTo(bx + nx * wide * 0.55, by + ny * wide * 0.55); ctx.lineTo(mx + nx * tip, my + box.s * 0.14 + ny * tip);
    ctx.lineTo(mx - nx * tip, my + box.s * 0.14 - ny * tip); ctx.lineTo(bx - nx * wide * 0.55, by - ny * wide * 0.55); ctx.closePath(); ctx.fill();
    // The front sight: a brass bead on a blade at the muzzle, and a pale ring round where it points so a student can see it on dark timber.
    ctx.fillStyle = '#d8b25a'; ctx.beginPath(); ctx.arc(mx, my, Math.max(3, box.s * 0.055), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2014'; ctx.lineWidth = 1.5; ctx.stroke();
    if (!fired) { ctx.strokeStyle = 'rgba(255,248,220,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, box.s * 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = 'rgba(30,20,10,0.5)'; ctx.beginPath(); ctx.arc(mx, my, box.s * 0.3 + 1.5, 0, Math.PI * 2); ctx.stroke(); }
    if (fired) fired.muzzleNow = { x: mx, y: my + box.s * 0.14 };
  }

  /**
   * The shot: a flash at the muzzle and the white-grey of black powder billowing out toward the field, rolling and thinning as the
   * battle's own smoke does (public/battle-view.js, owner 2026-09-30: "not enough smoke for black powder"). With less motion, a still
   * cloud that thins.
   */
  function drawSmoke(box, t, calm) {
    const fired = aim.fired && !aim.fired.hold ? aim.fired : null;
    if (!fired) return;
    const since = now() - fired.at - aim.path.hangMs;
    if (since < 0) {
      // Hanging fire: the pan flashes and fizzes at the lock, and the shot has not gone yet.
      ctx.fillStyle = 'rgba(255,210,120,0.6)'; ctx.beginPath(); ctx.arc(box.W * 0.62, box.H - box.s * 0.4, box.s * 0.25, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const at = fired.muzzle;
    if (since < 90 && !calm) {
      const flash = ctx.createRadialGradient(at.x, at.y + box.s * 0.14, 0, at.x, at.y + box.s * 0.14, box.s * 0.9);
      flash.addColorStop(0, 'rgba(255,250,220,0.95)'); flash.addColorStop(0.35, 'rgba(255,190,90,0.7)'); flash.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = flash; ctx.beginPath(); ctx.arc(at.x, at.y + box.s * 0.14, box.s * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,248,230,${0.25 * (1 - since / 90)})`; ctx.fillRect(0, 0, box.W, box.H);
    }
    // A black-powder charge: a cloud bigger than the deer, thick for a second, then rolling off on the wind and thinning.
    const life = 3600, age = Math.min(1, since / life);
    if (age >= 1) return;
    const random = generator(`${aim.sight.seed}:smoke`), wind = (random() < 0.5 ? -1 : 1) * box.s * (0.8 + random() * 0.8);
    const grow = calm ? 0.85 : 1 - Math.exp(-since / 420);
    const lobes = 9;
    for (let i = 0; i < lobes; i++) {
      const k = i / (lobes - 1), angle = random() * Math.PI * 2, spread = box.s * (0.4 + random() * 1.1);
      // Thrown out of the muzzle and billowing round it, the lower lobes back along the barrel toward the hunter, all of it rising
      // a little and going off sideways on the wind (still, with less motion).
      const x = at.x + Math.cos(angle) * spread * grow + (box.W * 0.64 - at.x) * k * 0.35 * grow + (calm ? 0 : wind * age * 2.2);
      const y = at.y + box.s * 0.14 + Math.sin(angle) * spread * 0.6 * grow + (box.H - at.y) * k * 0.35 * grow - (calm ? 0 : box.s * 0.7 * age);
      const r = box.s * (0.4 + 1.15 * grow + 0.4 * k + age * 0.9) * (0.8 + random() * 0.4);
      const a = (1 - age) ** 1.3 * (i ? 0.66 : 0.85);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${SMOKE_CORE},${a.toFixed(3)})`); g.addColorStop(0.55, `rgba(${SMOKE_TONE},${(a * 0.66).toFixed(3)})`); g.addColorStop(1, `rgba(${SMOKE_TONE},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    evidence.smoke = true;
  }

  // ------------------------------------------------------------------------------------------------ the hands on the rifle
  canvas.addEventListener('pointermove', event => {
    if (!aim || aim.fired) return;
    // Touch moves the sights only while the finger is down (a drag); a mouse or pen moves them as it goes.
    if (event.pointerType === 'touch' && !(event.buttons & 1)) return;
    aim.pointer = clampField(toField(boxOf(), event.offsetX, event.offsetY));
  });
  canvas.addEventListener('pointerdown', event => {
    if (!aim || aim.fired) return;
    aim.pointer = clampField(toField(boxOf(), event.offsetX, event.offsetY));
    // A click fires where the sights are; a touch only puts them there, and *Fire* fires (a thumb on the screen is not a trigger).
    if (event.pointerType !== 'touch' && event.button === 0) { event.preventDefault(); fire(); }
  });
  canvas.addEventListener('keydown', event => {
    if (!aim) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'].includes(event.key)) { keys.add(event.key); event.preventDefault(); }
    else if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); fire(); }
  });
  canvas.addEventListener('keyup', event => keys.delete(event.key));
  canvas.addEventListener('blur', () => keys.clear());
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); if (aim?.result) close(); else hold('held'); } });
  $('#hunt-aim-fire').addEventListener('click', () => fire());
  $('#hunt-aim-hold').addEventListener('click', () => hold('held'));
  $('#hunt-aim-done').addEventListener('click', () => close());

  return { open, update, close, get isOpen() { return Boolean(aim); } };
}
