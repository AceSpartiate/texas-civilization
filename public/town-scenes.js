// Gonzales before the fight, drawn (docs/BATTLES.md §5 step 2; sim/town-scenes.mjs).
//
// The server decides everything here: who is in the town's scenes, where each stands, what each is doing, what is said and
// which scenes this page may see at all (sim/town-scenes.mjs `townScenesFor`). This file only draws it - the townspeople and
// their props, the words over their heads (public/speech.js), and the small card a student opens by clicking a scene - and
// walks anybody whose place changed to the new place at a person's pace, so nobody in the town slides or jumps.
import { clipInfo, drawClip, drawSprite } from '/art.js';
import { clipGait, fadeToward, MOUNTED_HEIGHT, STRIDE } from '/motion.js';
import { drawSpeech, speechAlpha } from '/speech.js';

/** Heights a second a townsperson is drawn walking: a natural walk, under the ceiling every other walker is held to. */
export const TOWN_WALK = 0.9;
/** Closer than this, in drawn heights, and a walker has arrived. */
const ARRIVED = 0.06;

/**
 * Everybody in the town whose place changes is walked there (owner, 2026-09-25: residents "slide between spots without
 * walking"). Kept per person on this page: where they are drawn, which way they last went, how far their feet have gone and
 * how much of them is drawn. Display state only; the server's place is the truth and the walker always ends on it.
 * ceiling: one entry per person ever drawn in the town, never pruned - a class has a few dozen.
 */
export class TownWalker {
  constructor() { this.people = new Map(); }
  /**
   * Where `id` is drawn now, walking toward `target` (world miles) at `milesPerSecond`. A person seen for the first time, or
   * put more than `jumpMiles` away (a reload, a class jumped by the Host), is set down there rather than sent on a long walk.
   */
  step(id, target, now, milesPerSecond, { jumpMiles = 0.6, present = true } = {}) {
    let one = this.people.get(id);
    if (!one || !Number.isFinite(one.at?.x) || Math.hypot(target.x - one.at.x, target.y - one.at.y) > jumpMiles) {
      one = { at: { ...target }, dir: one?.dir || 's', walked: 0, alpha: one ? one.alpha : 0, last: now, moving: false };
      this.people.set(id, one);
    }
    const elapsed = Math.max(0, Math.min(250, now - one.last));
    one.last = now;
    const dx = target.x - one.at.x, dy = target.y - one.at.y, far = Math.hypot(dx, dy);
    const stride = milesPerSecond * elapsed / 1000;
    // A drawn height, in miles, is the pace over `TOWN_WALK`; within a sliver of one the walker has arrived.
    const near = ARRIVED * milesPerSecond / TOWN_WALK;
    one.moving = far > near && milesPerSecond > 0;
    if (one.moving) {
      const go = Math.min(far, stride);
      one.at = { x: one.at.x + dx / far * go, y: one.at.y + dy / far * go };
      one.walked += go;
      one.dir = Math.abs(dx) >= Math.abs(dy) * 0.8 ? (dx < 0 ? 'w' : 'e') : (dy < 0 ? 'n' : 's');
    } else if (milesPerSecond > 0) one.at = { ...target };
    one.alpha = fadeToward(one.alpha, present ? 1 : 0, elapsed);
    return one;
  }
  seen(id) { return this.people.get(id) || null; }
}

const GROWN = new Set(['teal', 'indigo', 'elder', 'ochre', 'blue', 'blue-girl']);
const CHILD_POSES = new Set(['idle-s', 'idle-e', 'idle-w', 'idle-n', 'walk', 'walk-s', 'walk-n', 'rest']);
/**
 * The clip for one of the scene's people doing `pose`, facing `face`, or walking `dir` when `moving`. Returns
 * `{ id, flip, mounted }`. The poses are the delivered ones; where a scene needs a pose the library does not have, the server
 * names the nearest one and the stand-in is recorded there (sim/town-scenes.mjs `STAND_INS`).
 */
export function sceneClip(person, { moving = false, dir = 's' } = {}) {
  const figure = person.figure;
  if (person.rides) {
    const heading = moving ? dir : person.face || 'e';
    if (figure === 'courier') return heading === 'n' || heading === 's' ? { id: `mounted-courier-${heading}`, flip: false, mounted: true } : { id: moving ? 'mounted-courier-e' : 'mounted-courier-graze', flip: heading === 'w', mounted: true };
    return heading === 'n' || heading === 's' ? { id: `${figure}-ride-${heading}`, flip: false, mounted: true } : { id: `${figure}-ride-e`, flip: heading === 'w', mounted: true };
  }
  // A man with his rifle, and a dragoon on his horse: the military sheets, which have standing and marching and no more. Any
  // other pose asked of them - speaking, listening - is their standing pose, and the words go over it.
  if (figure === 'volunteer' || figure === 'dragoon') {
    const mounted = figure === 'dragoon';
    if (moving) return dir === 'n' || dir === 's' ? { id: `${figure}-march-${dir}`, flip: false, mounted } : { id: `${figure}-march`, flip: dir === 'w', mounted };
    return { id: `${figure}-idle-${person.face || 'e'}`, flip: false, mounted };
  }
  if (moving) return dir === 'n' || dir === 's' ? { id: `${figure}-walk-${dir}`, flip: false } : { id: `${figure}-walk`, flip: dir === 'w' };
  const face = person.face || 's', pose = person.pose || 'idle';
  const child = !GROWN.has(figure);
  if (pose === 'idle' || (child && !CHILD_POSES.has(pose))) return { id: `${figure}-idle-${face}`, flip: false };
  if (pose === 'listen') return { id: `${figure}-listen-${face === 'n' ? 'n' : 's'}`, flip: false };
  // Every other delivered pose is drawn facing east and mirrored for west.
  return { id: `${figure}-${pose}`, flip: face === 'w' };
}

/** The walk cycle's own time for how far the feet have gone, so the feet keep to the ground (public/motion.js `gaitStep`). */
const gaitCache = new Map();
function stepTime(clip, walkedMiles, bodyMiles, strideBodies) {
  if (!gaitCache.has(clip)) gaitCache.set(clip, clipGait(clipInfo(clip), strideBodies));
  const gait = gaitCache.get(clip);
  if (!gait || !(bodyMiles > 0)) return undefined;
  return walkedMiles / bodyMiles / gait.strideBodies * gait.cycleMs;
}
function fallbackPerson(ctx, x, y, size, tone) {
  ctx.fillStyle = 'rgba(52,45,30,.2)';
  ctx.beginPath(); ctx.ellipse(x, y, size * .22, size * .07, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = tone; ctx.strokeStyle = '#392e20'; ctx.lineWidth = Math.max(.8, size * .045);
  ctx.beginPath(); ctx.moveTo(x - size * .18, y - size * .05); ctx.lineTo(x + size * .18, y - size * .05); ctx.lineTo(x + size * .14, y - size * .66); ctx.lineTo(x - size * .14, y - size * .66); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8b08a'; ctx.beginPath(); ctx.arc(x, y - size * .78, size * .12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

/**
 * The flag as the record gives it (sim/town-scenes.mjs `FLAG`): a white field, a black cannon, a star over it and the words
 * under it.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - Gonzales before the fight, item 5. Drawn in canvas strokes until
 * the painted flag lands; `waving` shakes the fly end as cloth in a breeze.
 */
export function drawFlag(ctx, x, y, height, { time = 0, stage = 'done', pole = true, flat = false } = {}) {
  const w = height * .62, h = height * .38;
  ctx.save();
  if (pole && !flat) {
    ctx.strokeStyle = '#5a4630'; ctx.lineWidth = Math.max(1, height * .03);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - height); ctx.stroke();
  }
  const top = flat ? y - h : y - height, left = flat ? x - w / 2 : x;
  const wave = flat ? 0 : Math.sin(time / 380) * h * .07;
  ctx.fillStyle = '#f4efe2'; ctx.strokeStyle = '#6e6250'; ctx.lineWidth = Math.max(.6, height * .012);
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.quadraticCurveTo(left + w * .5, top + wave, left + w, top - wave * .5);
  ctx.lineTo(left + w, top + h - wave * .5);
  ctx.quadraticCurveTo(left + w * .5, top + h + wave, left, top + h);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  if (stage === 'cloth') { ctx.restore(); return; }
  const cx = left + w * .5, cy = top + h * .5;
  ctx.fillStyle = '#1e1b17';
  // The star, over the cannon.
  const star = (sx, sy, r) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  star(cx, top + h * .2, h * .1);
  // The cannon: a barrel on a carriage wheel.
  ctx.fillRect(cx - w * .2, cy - h * .06, w * .36, h * .1);
  ctx.beginPath(); ctx.arc(cx - w * .08, cy + h * .08, h * .09, 0, Math.PI * 2); ctx.fill();
  if (stage === 'done' && height > 26) {
    ctx.font = `bold ${Math.max(5, Math.round(h * .13))}px Georgia`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('COME AND TAKE IT', cx, top + h * .82, w * .92);
  } else if (stage === 'done') ctx.fillRect(cx - w * .34, top + h * .78, w * .68, h * .07);
  ctx.restore();
}

/**
 * The scene's props: the gun in the ground and on its wheels, the boats drawn up behind the breastwork, the table the flag is
 * made on, the dragoons' tents across the river, a family's wagon.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - Gonzales before the fight. The breastwork of logs is the library's
 * `earth-rampart`; the canoes are its `skiff`; the gun on its cart wheels is its bronze field gun; the gun in the ground is a
 * mound drawn in canvas over the same gun; the peach orchard's ploughed ground is canvas furrows; the flag is canvas.
 */
function drawProp(ctx, prop, p, figure, time) {
  const flip = prop.face === 'w';
  switch (prop.kind) {
    case 'ploughed': {
      ctx.save(); ctx.strokeStyle = 'rgba(96,72,44,.55)'; ctx.lineWidth = Math.max(1, figure * .05);
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(p.x - figure * .9, p.y + i * figure * .09); ctx.lineTo(p.x + figure * .9, p.y + i * figure * .09 - figure * .05); ctx.stroke(); }
      ctx.restore(); return;
    }
    case 'cannon-buried': {
      ctx.save();
      drawSprite(ctx, 'cannon-bronze-e', p.x, p.y + figure * .16, figure * .55, { flip });
      ctx.fillStyle = '#7b5d3c'; ctx.strokeStyle = '#4c3824'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + figure * .04, figure * .55, figure * .15, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8f6f49';
      ctx.beginPath(); ctx.ellipse(p.x + figure * .62, p.y - figure * .02, figure * .24, figure * .1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return;
    }
    case 'cannon': drawSprite(ctx, 'cannon-bronze-e', p.x, p.y, figure * .62, { flip }); return;
    case 'wheel': drawSprite(ctx, 'wagon-wheel', p.x, p.y, figure * .5); return;
    case 'skiff': drawSprite(ctx, 'skiff', p.x, p.y, figure * .42, { flip }); return;
    case 'flatboat': drawSprite(ctx, 'ferry-flatboat', p.x, p.y, figure * .6, { flip }); return;
    case 'breastwork': drawSprite(ctx, 'earth-rampart', p.x, p.y, figure * .55, { flip }); return;
    case 'tent': drawSprite(ctx, 'tent', p.x, p.y, figure * 1.05); return;
    case 'fire': drawClip(ctx, 'fire-flicker', p.x, p.y, figure * .45, { timeMs: time, seed: prop.id }) || drawSprite(ctx, 'campfire', p.x, p.y, figure * .4); return;
    case 'horse': drawClip(ctx, 'horse-chestnut-idle', p.x, p.y, figure * 1.1, { timeMs: time, seed: prop.id, flip }); return;
    case 'wagon': drawSprite(ctx, 'wagon-loaded', p.x, p.y, figure * 1.1, { flip: !flip }); return;
    case 'bundles': drawSprite(ctx, 'packed-belongings', p.x, p.y, figure * .45); return;
    case 'table': drawSprite(ctx, 'home-table', p.x, p.y, figure * .5); return;
    case 'flag-work': drawFlag(ctx, p.x, p.y - figure * .42, figure * .9, { stage: prop.stage || 'cloth', flat: true }); return;
    case 'flag': drawFlag(ctx, p.x, p.y, figure * 1.7, { time, stage: 'done' }); return;
    default:
  }
}

/**
 * Everything the scenes put in the town this frame, as standing items the map depth-sorts with its own people and buildings.
 * `scenes` is the server's projection; `toScreen` the camera's; `figure` a grown person's drawn height. Returns the items and
 * fills `drawn` (id -> head point) so the words can be put over the right heads.
 */
export function townSceneDrawables(ctx, scenes, { toScreen, figure, scale, now, clock = now, walker, reducedMotion = false, frozen = false, drawn = new Map(), evidence = null }) {
  const items = [];
  if (!scenes) return items;
  // The page's animation clock, which stands still while the class is paused; the walker goes by real time.
  const time = reducedMotion ? 0 : clock;
  for (const prop of scenes.props || []) {
    // A thing the scene moves - the gun, from the orchard to the shop, to the ferry and home again - is walked there with
    // the men moving it, like a person, never slid; anything else stands where the server put it.
    const at = prop.id?.startsWith('gz-') ? walker.step(`prop:${prop.id}`, prop, now, reducedMotion || frozen ? 1e3 : TOWN_WALK * figure / Math.max(1, scale)).at : prop;
    const p = toScreen(at);
    items.push({ y: p.y, draw: () => drawProp(ctx, prop, p, figure, time) });
  }
  const present = new Set((scenes.people || []).map(person => person.id));
  // Whoever has just left the scene is walked on out of it and faded, never dropped from the frame.
  for (const [id, one] of walker.people) {
    if (present.has(id) || !one.person || one.alpha <= 0.01 || id.startsWith('prop:')) continue;
    const stepped = walker.step(id, one.at, now, 0, { present: false });
    if (stepped.alpha > 0.01) items.push(personItem(ctx, one.person, stepped, { toScreen, figure, scale, time, drawn }));
  }
  for (const person of scenes.people || []) {
    const pace = TOWN_WALK * heightOf(person, figure) / Math.max(1, scale);
    const stepped = walker.step(person.id, person, now, reducedMotion || frozen ? 1e3 : pace);
    stepped.person = person;
    items.push(personItem(ctx, person, stepped, { toScreen, figure, scale, time, drawn }));
    const box = drawn.get(person.id)?.box;
    evidence?.push({ id: person.id, sceneId: person.sceneId, pose: person.pose, moving: stepped.moving, clip: sceneClip(person, stepped).id, x: stepped.at.x, y: stepped.at.y,
      ...(box && { sx: Math.round(box.x + box.w / 2), sy: Math.round(box.y + box.h / 2) }) });
  }
  return items;
}
/** A person's drawn height: a rider and a dragoon with the horse under them, a child smaller. */
const heightOf = (person, figure) => figure * (person.rides || person.figure === 'dragoon' ? MOUNTED_HEIGHT : 1) * (person.small || 1);
function personItem(ctx, person, stepped, { toScreen, figure, scale, time, drawn }) {
  const p = toScreen(stepped.at);
  const height = heightOf(person, figure);
  const clip = sceneClip(person, stepped);
  drawn.set(person.id, { x: p.x, y: p.y - height, size: height, box: { x: p.x - height * .3, y: p.y - height, w: height * .6, h: height } });
  return { y: p.y, draw: () => {
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * Math.max(0, Math.min(1, stepped.alpha));
    // Feet (and hooves) keep to the ground they cross: the cycle is played by how far they have gone.
    const own = stepped.moving ? stepTime(clip.id, stepped.walked, height / Math.max(1, scale), clip.mounted ? STRIDE.hoof : STRIDE.foot) : undefined;
    // A rider standing still sits a horse standing still: the riding cycle held on its first frame.
    const width = drawClip(ctx, clip.id, p.x, p.y, height, { timeMs: own ?? time, seed: person.id, flip: clip.flip, paused: person.rides && !stepped.moving });
    if (!width) fallbackPerson(ctx, p.x, p.y, height, person.figure === 'volunteer' ? '#7d5f45' : '#6d5a68');
    if (person.carries === 'flag') drawFlag(ctx, p.x + height * .18 * (clip.flip ? -1 : 1), p.y - height * .2, height * 1.5, { time });
    ctx.globalAlpha = was;
  } };
}

/**
 * The words said this tick, each over its speaker, one after another within the tick (the server sends them in order). A
 * line whose speaker is not drawn on this page is not drawn either: words are never put in the air over nobody.
 */
const firstSeen = new Map();
export function drawTownSpeech(ctx, scenes, pointOf, { now, tickMs = 9500, bounds, scale = 1, evidence = null } = {}) {
  if (!scenes?.lines?.length) return [];
  const boxes = [], shown = [];
  const byScene = new Map();
  for (const line of scenes.lines) { if (!byScene.has(line.sceneId)) byScene.set(line.sceneId, []); byScene.get(line.sceneId).push(line); }
  let sceneIndex = 0;
  for (const lines of byScene.values()) {
    const slot = Math.max(2200, Math.min(4600, (tickMs * .92) / Math.max(1, lines.length)));
    lines.forEach((line, index) => {
      if (!firstSeen.has(line.id)) firstSeen.set(line.id, now);
      const age = now - firstSeen.get(line.id) - index * slot - sceneIndex * 600;
      const alpha = speechAlpha(age, slot - 500);
      if (alpha <= 0) return;
      const at = pointOf(line.speakerId);
      if (!at) return;
      const box = drawSpeech(ctx, line, at.x, at.y, { alpha, bounds, scale });
      if (box) { boxes.push(box); shown.push({ id: line.id, speakerId: line.speakerId, kind: line.kind, text: line.text }); }
    });
    sceneIndex++;
  }
  if (firstSeen.size > 400) for (const key of [...firstSeen.keys()].slice(0, 200)) firstSeen.delete(key);
  evidence?.push(...shown);
  return shown;
}

/**
 * The scene under a click: one of a scene's people drawn under the point, or else the nearest scene whose middle, as drawn
 * this frame (`spots`, id -> screen point), is within reach of it. Null for a click on nothing of the scenes.
 */
export function townSceneAt(scenes, spots, point, figure, drawn) {
  if (!scenes?.scenes?.length) return null;
  let best = null;
  for (const scene of scenes.scenes) {
    for (const person of scenes.people || []) {
      if (person.sceneId !== scene.id) continue;
      const box = drawn.get(person.id)?.box;
      if (box && point.x >= box.x - 4 && point.x <= box.x + box.w + 4 && point.y >= box.y - 4 && point.y <= box.y + box.h + 4) return scene.id;
    }
    const c = spots.get(scene.id);
    if (!c) continue;
    const reach = Math.max(figure * 1.6, 22), d = Math.hypot(point.x - c.x, point.y - (c.y - figure * .4));
    if (d <= reach && (!best || d < best.d)) best = { id: scene.id, d };
  }
  return best?.id || null;
}

/**
 * The card a click on a scene opens: the plain-words account, told by a person who is there, what of it is known and how
 * well, what is made up for the game, and - where the server offers it - a way for the family's own person to lend a hand.
 */
export function renderSceneCard(root, scenes, sceneId, { onHelp, onClose, date = '' } = {}) {
  const card = scenes?.cards?.[sceneId];
  if (!card) { root.hidden = true; root.dataset.scene = ''; return false; }
  root.hidden = false; root.dataset.scene = sceneId;
  root.replaceChildren();
  const head = document.createElement('header');
  const titles = document.createElement('div');
  const eyebrow = document.createElement('span'); eyebrow.className = 'eyebrow'; eyebrow.textContent = `GONZALES${date ? `, ${date}` : ''}`;
  const title = document.createElement('h2'); title.id = 'town-scene-title'; title.textContent = card.title;
  titles.append(eyebrow, title);
  const close = document.createElement('button'); close.className = 'town-scene-close'; close.setAttribute('aria-label', 'Close'); close.textContent = '×';
  close.addEventListener('click', () => { root.hidden = true; root.dataset.scene = ''; onClose?.(); });
  head.append(titles, close);
  root.append(head);
  if (card.teller) { const who = document.createElement('p'); who.className = 'town-scene-teller'; who.textContent = card.teller; root.append(who); }
  for (const text of card.said || []) { const p = document.createElement('p'); p.className = 'town-scene-said'; p.textContent = text; root.append(p); }
  if (card.known?.length) {
    const list = document.createElement('ul'); list.className = 'town-scene-known';
    for (const item of card.known) {
      const li = document.createElement('li');
      const label = document.createElement('span'); label.className = 'town-scene-label'; label.dataset.kind = item.label; label.textContent = item.label;
      li.append(label, ` ${item.text}`);
      if (item.claimId) { const id = document.createElement('span'); id.className = 'town-scene-claim'; id.textContent = ` ${item.claimId}`; li.append(id); }
      list.append(li);
    }
    root.append(list);
  }
  if (card.madeUp) { const note = document.createElement('p'); note.className = 'town-scene-note'; note.textContent = card.madeUp; root.append(note); }
  const help = scenes.help?.[sceneId];
  if (help?.people?.length) {
    const box = document.createElement('div'); box.className = 'town-scene-help';
    const ask = document.createElement('p'); ask.textContent = help.ask; box.append(ask);
    for (const person of help.people) {
      const button = document.createElement('button');
      // Not `data-action`: the page sends any button carrying one as an order by itself (public/app.js), without the scene.
      button.dataset.townHelp = person.id;
      button.textContent = person.helping ? `${person.name} is helping` : `${person.name}: ${help.label}`;
      button.disabled = !person.can || person.helping;
      if (!person.can && person.why) button.title = person.why;
      button.addEventListener('click', () => onHelp?.(person.id, sceneId));
      box.append(button);
      if (!person.can && person.why) { const why = document.createElement('small'); why.textContent = person.why; box.append(why); }
    }
    root.append(box);
  }
  return true;
}
