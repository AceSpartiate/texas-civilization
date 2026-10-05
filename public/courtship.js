// The lone parent's path, on the page (sim/courtship.mjs; docs/FAMILY_CREATION.md, *The lone parent's path*).
//
// The owner, 2026-09-29: "travel is skipped, and we see the family visit and talk to a family. on the 2nd family they meet a
// family that has a son of eligible marriage age ... light flirting occurs. travel is skipped again and we see the couple with
// the families gathered at our farm for a marriage. a short ceremony is shown and afterwards we find our new family with two
// parents." And later the same day: "use fades to black to smooth transitions. carefully build this ... it should feel special".
//
// Four scenes over the whole screen - the first farm, the second, the wedding at the family's own land, and afterwards - each a
// drawn yard with the family and its neighbours standing in it, the one speaking marked and named, and what they say in a strip
// along the foot of the screen. **Continue** is the only way on: there is no X, the owner's "skippable only by continuing". Every
// change of place is a fade to black and back, slow and unhurried, with the travel said on the black (a quarter of the time where
// the student's computer asks for less motion - shorter, never a cut).
//
// Nothing here decides anything: who is there, what they say, the time of day and the house are the server's
// (`courtship.script`), sent to this family's own page and no other. The page only draws it, keeps its place in the scenes across
// a reload (sessionStorage, a per-viewer convenience), and tells the server when the student has walked them to the end
// (`courtship-watched`), after which the server sends them no more.
import { clipReady, drawClip, drawSprite, spriteFrame } from './art.js';
import { avatarVariant } from './avatar-art.js';

/** How long a fade to or from black takes, and how long the travel is said on the black. The reduced-motion fade is shorter. */
export const FADE_MS = 1100, REDUCED_FADE_MS = 280, BETWEEN_MS = 2200, REDUCED_BETWEEN_MS = 1400;

/**
 * The yard each scene stands in, by the light of its hour (sim/courtship.mjs `partOfDay`). stand-in: docs/ART_REQUESTS.md, request
 * 2026-09-29 - the lone parent's wedding, item 5; until a backdrop is drawn the sky and the ground are painted here (`paintYard`).
 */
export const BACKDROP = Object.freeze({ morning: 'courtship-yard-morning', noon: 'courtship-yard-noon', evening: 'courtship-yard-evening', night: 'courtship-yard-evening' });
/**
 * Each neighbour's farmstead, and the family's own house. stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the lone parent's
 * wedding, item 3; the library's `cabin-wide` and `jacal-ramada` are drawn until the farmsteads are.
 */
export const FARM_ART = Object.freeze({ porch: ['farm-neighbour-porch', 'cabin-wide'], ramada: ['farm-neighbour-ramada', 'jacal-ramada'] });
/**
 * How each picture is sized. Claude's farmsteads and supper table carry a grown person's height as their logical height, so they
 * are drawn at a person's height (`1`); the library's buildings and furniture are drawn at their whole height, a multiple of a person.
 */
const SCALE = Object.freeze({ 'farm-neighbour-porch': 1, 'farm-neighbour-ramada': 1, 'wedding-table': 1, 'cabin-wide': 2.35, 'jacal-ramada': 2.1, 'home-table': 0.68 });
/** The family's own house, finished: the delivered whole-house pictures (a saddlebag, which has none, is drawn as the round-log). */
export const HOUSE_ART = Object.freeze({ 'round-log': 'house-round-log', 'hewn-log': 'house-hewn-log', 'dog-run': 'house-dog-run', jacal: 'house-jacal' });
/** How tall a building is drawn beside a grown person in the scenes, and the supper table. */
const HOUSE_HEIGHT = 2.35;
/** A grown person's drawn height, as a share of the scene's height (and never wider than a share of its width). */
const PERSON_SHARE = 0.27, PERSON_WIDTH_SHARE = 0.15;
/** Where the ground the people stand on is, down the scene. The strip at the foot covers what is below. */
const GROUND = 0.73;
/** How big a child is drawn, by band, as the map draws them (public/motion.js `FIGURE_SCALE`). */
const BAND_SCALE = Object.freeze({ infant: 0.36, small: 0.52, child: 0.7, youth: 0.9, adult: 1 });
/** Poses a grown cast figure has for the scenes (Claude-drawn, request 2026-09-29, item 1), and what stands in for each until then. */
const POSE_STANDIN = Object.freeze({ greet: 'speak', laugh: 'speak', shy: 'idle', vow: 'idle', 'read-paper': 'speak', speak: 'speak' });

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

/** The figure a person of the scenes is drawn as: a child's own, a grown person's cast chosen by their looks, the elder for the officer. */
export function figureOf(person) {
  // The priest who marries a Tejano family (sim/courtship.mjs `rite: 'priest'`) is the elder in the dark clothes the server gives him.
  if (person?.official) return { figure: 'elder', grown: true, appearance: person.priest ? person.appearance || null : null };
  const band = person?.band || 'adult';
  if (band === 'infant') return { figure: 'infant', grown: false, appearance: person.appearance || null };
  if (band === 'small') return { figure: 'smallchild', grown: false, appearance: person.appearance || null };
  if (band === 'child') return { figure: person.sex === 'female' ? 'girl' : 'boy', grown: false, appearance: person.appearance || null };
  // An adolescent is Astra's adolescent figure, a grown person her figure for their head (public/avatar-identity.js, 2026-10-02).
  return { figure: avatarVariant(person?.appearance, person?.sex || 'male', person || {}), grown: true, appearance: person?.appearance || null };
}

/**
 * The clip for somebody in a pose, facing `face` ('e' or 'w'), and whether it is mirrored. `ready` says whether a clip can be
 * drawn now (public/art.js `clipReady`): a pose not drawn yet falls back to the nearest delivered one (`POSE_STANDIN`).
 */
export function clipFor(person, pose, face, ready = clipReady) {
  const { figure, grown } = figureOf(person);
  // Astra's family figures of 2026-10-02 (`father-*`, `mother-*`, `youth-*`) have no west idle: the east one is mirrored.
  const idle = face === 'w' && /^(father|mother|youth)-/.test(figure) ? { id: `${figure}-idle-e`, flip: true } : { id: `${figure}-idle-${face}`, flip: false };
  if (!grown || !pose || pose === 'idle') return idle;
  if (pose === 'front') return { id: `${figure}-idle-s`, flip: false };
  // The officer's reading pose is the elder's own (request item 2); the scene's four poses are every cast figure's (item 1).
  const own = pose === 'read-paper' ? `elder-read-paper` : `${figure}-${pose}`;
  if (ready(own)) return { id: own, flip: face === 'w' };
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the lone parent's wedding, items 1 and 2: the delivered speaking cycle
  // for a greeting, a laugh or the reading, and standing still for a shy glance or the vow, until those poses are drawn.
  const fallback = POSE_STANDIN[pose] || 'idle';
  return fallback === 'speak' ? { id: `${figure}-speak`, flip: face === 'w' } : idle;
}

/**
 * Where everybody in a scene stands, and which way each faces: the family to the left facing east, the neighbours to the right
 * facing west, children a step in front; at the wedding the couple in the middle facing each other with the officer beside them;
 * afterwards the family together in front of its house, facing the camera. Pure: the proofs and tests read it.
 */
export function sceneLayout(scene, cast, width, height) {
  const h = Math.min(height * PERSON_SHARE, width * PERSON_WIDTH_SHARE);
  const ground = height * GROUND;
  const places = [];
  const sizeOf = id => h * (BAND_SCALE[cast[id]?.band] ?? 1);
  const put = (id, x, face, row = 0) => { if (cast[id]) places.push({ id, x, y: ground + row * h * 0.12, h: sizeOf(id), face }); };
  const grownUp = id => (BAND_SCALE[cast[id]?.band] ?? 1) >= 0.9;
  const inScene = (scene.cast || []).filter(id => cast[id]);
  const line = (ids, from, step, face) => {
    let x = from, back = 0;
    for (const id of ids) {
      const grown = grownUp(id);
      put(id, x, face, grown ? 0 : 1);
      x += step * (grown ? 1 : 0.72);
      back += 1;
    }
    return x;
  };
  const centre = width / 2;
  if (scene.id === 'first' || scene.id === 'second') {
    const family = inScene.filter(id => cast[id].family);
    const hosts = inScene.filter(id => !cast[id].family);
    // The family comes in from the left; the hosts stand before their own door on the right.
    line(family, centre - h * 0.55, -h * 0.5, 'e');
    line(hosts, centre + h * 0.55, h * 0.5, 'w');
  } else if (scene.id === 'wedding') {
    const spouse = inScene.find(id => cast[id].spouse);
    const parent = inScene.find(id => cast[id].lone);
    // The couple facing each other, close enough that their hands meet in the vow (request item 1's check).
    put(parent, centre - h * 0.245, 'e');
    put(spouse, centre + h * 0.245, 'w');
    // The officer a step back beside them, reading the bond toward them; the family's children at the parent's side, a step in
    // front, turned to the couple; the two families of neighbours to either side as witnesses.
    put('commissioner', centre + h * 0.92, 'w', -0.35);
    const kids = inScene.filter(id => cast[id].family && !cast[id].lone);
    kids.forEach((id, k) => put(id, centre - h * (0.78 + 0.34 * k), 'e', 0.6));
    // The spouse's own children (sim/courtship.mjs `STEPCHILDREN`) at the spouse's side, a step in front, as the family's are at the
    // parent's; the spouse's family of neighbours beyond them.
    const steps = inScene.filter(id => cast[id].step);
    steps.forEach((id, k) => put(id, centre + h * (0.78 + 0.34 * k), 'w', 0.6));
    const first = inScene.filter(id => cast[id].of && cast[id].of.endsWith('-nb-1'));
    const second = inScene.filter(id => cast[id].of && cast[id].of.endsWith('-nb-2') && !cast[id].step);
    line(first, centre - h * (0.95 + 0.34 * kids.length + 0.25), -h * 0.46, 'e');
    line(second, centre + h * (1.45 + 0.34 * steps.length), h * 0.46, 'w');
  } else {
    // Afterwards: the family of two parents before its house, facing the camera, the children beside them.
    const parents = inScene.filter(id => cast[id].lone || cast[id].spouse);
    const kids = inScene.filter(id => !parents.includes(id));
    parents.forEach((id, k) => put(id, centre + (k - (parents.length - 1) / 2) * h * 0.46, 's'));
    kids.forEach((id, k) => put(id, centre + (k % 2 ? 1 : -1) * h * (0.62 + 0.3 * Math.floor(k / 2)), 's', 1));
  }
  // Nobody off the scene: a crowd too wide for a narrow screen is drawn closer together rather than cut.
  const xs = places.map(place => place.x);
  if (xs.length) {
    const lo = Math.min(...xs) - h * 0.3, hi = Math.max(...xs) + h * 0.3;
    const room = width * 0.96;
    if (hi - lo > room) { const squeeze = room / (hi - lo); for (const place of places) place.x = centre + (place.x - (lo + hi) / 2) * squeeze; }
    else if (lo < width * 0.02) { for (const place of places) place.x += width * 0.02 - lo; }
    else if (hi > width * 0.98) { for (const place of places) place.x -= hi - width * 0.98; }
  }
  // Back to front, so a child in front is drawn over the grown-up behind.
  places.sort((a, b) => a.y - b.y);
  return { places, h, ground };
}

/**
 * The steps of one scene, in order: its caption, each line, the one line of history, and the family's closing words. A step's
 * `type` is which of these it is; a line's own `kind` (documented or reconstructed, public/speech.js) is kept as `source`.
 */
export function stepsOf(scene) {
  return [
    ...(scene.caption ? [{ type: 'caption', text: scene.caption }] : []),
    ...scene.lines.map(line => ({ ...line, type: 'line', source: line.kind })),
    ...(scene.history ? [{ ...scene.history, type: 'history', source: scene.history.kind }] : []),
    ...(scene.closing ? [{ type: 'closing', text: scene.closing }] : []),
  ];
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(key) { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* a private window: the scenes start again */ } },
  drop(key) { try { sessionStorage.removeItem(key); } catch { /* nothing kept */ } },
};

/**
 * The scenes, bound to their part of the page. `send(action)` posts an order to the server; `onMood()` asks the page's sound to
 * look again at what it should play (the wedding has its own tune, public/audio-music.js `bond-at-the-cabin`).
 */
export function createCourtship({ root, send, onMood = () => {} }) {
  const canvas = root.querySelector('#courtship-canvas');
  const ctx = canvas.getContext('2d');
  const strip = root.querySelector('#courtship-strip');
  const where = root.querySelector('#courtship-where');
  const who = root.querySelector('#courtship-who');
  const said = root.querySelector('#courtship-said');
  const next = root.querySelector('#courtship-next');
  const evidence = { open: false, scene: null, step: null, mode: 'closed', fades: 0, drawn: [], shown: [], between: null, watched: false, timeline: [] };
  window.__courtship = evidence;
  let script = null, key = null, scene = 0, step = 0, mode = 'closed', since = 0, frame = 0, finishedLocally = false;

  const fadeMs = () => (reducedMotion() ? REDUCED_FADE_MS : FADE_MS);
  const betweenMs = () => (reducedMotion() ? REDUCED_BETWEEN_MS : BETWEEN_MS);
  const current = () => script?.scenes?.[scene] || null;

  function setMode(to) {
    mode = to; since = performance.now(); evidence.mode = to;
    // When each change came, for the proofs: how long a fade took, with and without less motion asked for.
    evidence.timeline.push({ mode: to, at: Math.round(since), reduced: reducedMotion() });
    if (evidence.timeline.length > 120) evidence.timeline.shift();
    if (to === 'fade-out' || to === 'fade-in') evidence.fades += 1;
    next.disabled = to !== 'scene';
    strip.dataset.mode = to;
  }
  function remember() { if (key) store.set(key, { scene, step }); }
  function wedding(on) {
    const want = on ? 'true' : null;
    if ((document.body.dataset.wedding || null) === want) return;
    if (on) document.body.dataset.wedding = 'true'; else delete document.body.dataset.wedding;
    onMood();
  }

  /** The strip: where and when, who is speaking, what they say - the words a screen reader is given as they change. */
  function showStep() {
    const here = current();
    if (!here) return;
    const steps = stepsOf(here);
    const one = steps[step];
    where.textContent = `${here.place} · ${here.when}`;
    const speaker = one?.speaker ? script.cast[one.speaker] : null;
    who.textContent = one?.type === 'history' ? 'From the record' : speaker ? speaker.name : '';
    who.hidden = !who.textContent;
    said.textContent = one?.text || '';
    strip.dataset.kind = one?.type || '';
    strip.dataset.source = one?.source || '';
    const last = scene === script.scenes.length - 1 && step === steps.length - 1;
    next.textContent = last ? 'Home' : step === steps.length - 1 ? 'Go on' : 'Continue';
    evidence.scene = here.id; evidence.step = step;
    evidence.shown.push({ scene: here.id, step, type: one?.type, source: one?.source || null, speaker: one?.speaker || null, text: one?.text || '' });
    if (evidence.shown.length > 200) evidence.shown.shift();
    // The wedding's tune from the wedding on: the ceremony, the supper and the family by its new house.
    wedding(here.id === 'wedding' || here.id === 'after');
  }

  function open(world) {
    script = world.courtship.script;
    key = `courtship:${world.householdId}`;
    const kept = store.get(key);
    scene = clamp(Number(kept?.scene) || 0, 0, script.scenes.length - 1);
    step = clamp(Number(kept?.step) || 0, 0, stepsOf(script.scenes[scene]).length - 1);
    root.hidden = false;
    document.body.dataset.courtship = 'true';
    evidence.open = true;
    // A scene taken up again after a reload comes up out of black; a first opening says the travel on the black first.
    evidence.between = kept ? null : script.scenes[scene].between;
    setMode(kept ? 'fade-in' : 'between');
    showStep();
    next.focus({ preventScroll: true });
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function close() {
    root.hidden = true;
    delete document.body.dataset.courtship;
    wedding(false);
    evidence.open = false; setMode('closed');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  async function finish() {
    finishedLocally = true;
    store.drop(key);
    close();
    evidence.watched = true;
    try { await send({ action: 'courtship-watched' }); } catch { finishedLocally = false; }
  }

  function advance() {
    if (mode !== 'scene' || !script) return;
    const steps = stepsOf(current());
    if (step < steps.length - 1) { step += 1; remember(); showStep(); return; }
    // The end of the scene: a slow fade to black, the next place said on the black, and up again.
    setMode('fade-out');
  }
  next.addEventListener('click', advance);
  root.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target !== next) { event.preventDefault(); advance(); }
  });

  // ------------------------------------------------------------------ drawing

  function fit() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio)), height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: canvas.clientWidth, height: canvas.clientHeight };
  }

  /** A painted yard: sky, a line of trees, the ground and a worn place before the door. The stand-in until item 5 is drawn. */
  function paintYard(width, height, light) {
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    const tones = { morning: ['#b9d3dc', '#f3e2bd'], noon: ['#a8c8d8', '#e6e3cf'], evening: ['#e7a86e', '#f6d59a'], night: ['#27344f', '#5a5670'] }[light] || ['#b9d3dc', '#efe2c0'];
    sky.addColorStop(0, tones[0]); sky.addColorStop(1, tones[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    // The tree line: rounded crowns in two greens, drawn from a fixed pattern so the scene does not shimmer.
    const treeline = height * 0.47;
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = light === 'night' ? (pass ? '#233126' : '#1b271e') : pass ? '#6f7f45' : '#56683a';
      for (let i = 0; i < 26; i++) {
        const x = (i / 25) * width * 1.1 - width * 0.05 + (pass ? width * 0.02 : 0);
        const r = height * (0.05 + ((i * 37 + pass * 11) % 7) / 90);
        ctx.beginPath(); ctx.ellipse(x, treeline - r * 0.3 + pass * height * 0.02, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    const ground = ctx.createLinearGradient(0, treeline, 0, height);
    ground.addColorStop(0, light === 'night' ? '#39422c' : '#9aa35e'); ground.addColorStop(1, light === 'night' ? '#262b1d' : '#6f7a3e');
    ctx.fillStyle = ground; ctx.fillRect(0, treeline, width, height - treeline);
    ctx.fillStyle = light === 'night' ? 'rgba(70,60,40,.35)' : 'rgba(176,150,98,.55)';
    ctx.beginPath(); ctx.ellipse(width / 2, height * 0.7, width * 0.42, height * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  }

  /** The light of the hour over the whole picture, and a soft edge like an old storybook page. */
  function grade(width, height, light, at) {
    ctx.save();
    if (light === 'morning') { const g = ctx.createLinearGradient(0, 0, width, height); g.addColorStop(0, 'rgba(255,236,190,.22)'); g.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); }
    if (light === 'evening') { ctx.fillStyle = 'rgba(255,146,62,.16)'; ctx.fillRect(0, 0, width, height); }
    if (light === 'night') {
      ctx.fillStyle = 'rgba(16,24,48,.34)'; ctx.fillRect(0, 0, width, height);
      // A lantern's warmth about the people, so the wedding by night is still warm.
      const glow = ctx.createRadialGradient(width / 2, height * 0.62, 0, width / 2, height * 0.62, width * 0.45);
      glow.addColorStop(0, 'rgba(255,196,110,.30)'); glow.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    }
    const edge = ctx.createRadialGradient(width / 2, height * 0.55, Math.min(width, height) * 0.35, width / 2, height * 0.55, Math.max(width, height) * 0.75);
    edge.addColorStop(0, 'rgba(40,24,10,0)'); edge.addColorStop(1, 'rgba(40,24,10,.42)');
    ctx.fillStyle = edge; ctx.fillRect(0, 0, width, height);
    // A few motes of light drifting in the warm air of the wedding and after (not where motion is to be kept still).
    if ((current()?.id === 'wedding' || current()?.id === 'after') && !reducedMotion()) {
      for (let i = 0; i < 18; i++) {
        const t = (at / 9000 + i / 18) % 1;
        const x = width * ((i * 0.618) % 1), y = height * (0.62 - t * 0.5);
        ctx.fillStyle = `rgba(255,226,150,${0.35 * Math.sin(t * Math.PI)})`;
        ctx.beginPath(); ctx.arc(x + Math.sin(at / 1300 + i) * 8, y, 1.6 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawBackdrop(width, height, light) {
    const name = BACKDROP[light] || BACKDROP.noon;
    const frameOf = spriteFrame(name);
    if (frameOf && drawCover(name, frameOf, width, height)) return name;
    paintYard(width, height, light);
    return null;
  }
  /** A backdrop drawn to cover the scene, anchored at its foot so the ground is never cut away. */
  function drawCover(name, frameOf, width, height) {
    const logicalH = frameOf.logicalHeight || frameOf.h;
    const scale = Math.max(width / frameOf.w, height / frameOf.h);
    const drawnH = logicalH * scale;
    const anchorY = frameOf.anchorY ?? 1;
    return drawSprite(ctx, name, width / 2 + (frameOf.anchorX - 0.5) * frameOf.w * scale, height - (1 - anchorY) * frameOf.h * scale, drawnH) > 0;
  }
  /** The first of `names` the library can draw, or the last as the one to ask for. */
  const firstDrawable = names => names.find(name => spriteFrame(name)) || null;

  function drawBuildings(here, width, height, h) {
    const drawn = [];
    const ground = height * GROUND - h * 0.2;
    if (here.farm === 'home') {
      const house = HOUSE_ART[here.house] || HOUSE_ART['round-log'];
      const x = here.id === 'after' ? width / 2 : width * 0.3;
      if (drawSprite(ctx, house, x, ground, h * HOUSE_HEIGHT)) drawn.push(house);
      if (here.id === 'wedding') {
        // The neighbours' supper, laid out of doors. stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the lone parent's
        // wedding, item 4; the home table stands in until the supper table is drawn.
        const table = firstDrawable(['wedding-table', 'home-table']);
        if (table && drawSprite(ctx, table, width * 0.76, ground + h * 0.05, h * SCALE[table])) drawn.push(table);
      }
    } else {
      const art = firstDrawable(FARM_ART[here.farm] || FARM_ART.porch);
      if (art && drawSprite(ctx, art, width * 0.6, ground, h * SCALE[art])) drawn.push(art);
    }
    return drawn;
  }

  function poseOf(here, place, speaking, stepIndex) {
    const person = script.cast[place.id];
    if (speaking) return speaking.pose;
    // The couple hold hands from the reading of the bond to the end of the wedding, and stand shyly at the second farm.
    if (here.id === 'wedding' && (person?.spouse || person?.lone)) {
      const reading = here.lines.findIndex(line => line.pose === 'read-paper');
      const lineAt = stepIndex - (here.caption ? 1 : 0);
      if (reading >= 0 && lineAt >= reading) return 'vow';
    }
    if (here.id === 'second' && person?.spouse) return 'shy';
    if (here.id === 'after') return 'front';
    return 'idle';
  }

  function drawPeople(here, width, height, at) {
    const { places, h } = sceneLayout(here, script.cast, width, height);
    const steps = stepsOf(here);
    const one = steps[step];
    const speakerId = one?.type === 'line' ? one.speaker : null;
    const drawnPeople = [];
    // The speaker's warm ring on the ground first, under everybody.
    const speakerPlace = places.find(place => place.id === speakerId);
    if (speakerPlace) {
      ctx.save();
      const glow = ctx.createRadialGradient(speakerPlace.x, speakerPlace.y, 0, speakerPlace.x, speakerPlace.y, speakerPlace.h * 0.45);
      glow.addColorStop(0, 'rgba(255,214,120,.55)'); glow.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(speakerPlace.x, speakerPlace.y, speakerPlace.h * 0.45, speakerPlace.h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (const place of places) {
      const person = script.cast[place.id];
      const speaking = place.id === speakerId ? one : null;
      const pose = poseOf(here, place, speaking, step);
      const face = place.face === 's' ? 's' : place.face;
      const clip = pose === 'front' || face === 's' ? { id: `${figureOf(person).figure}-idle-s`, flip: false } : clipFor(person, pose, face);
      // Only the speaker moves; the rest stand and breathe (a paused clip), so the eye goes to whoever is talking.
      ctx.save();
      ctx.fillStyle = 'rgba(40,30,15,.22)';
      ctx.beginPath(); ctx.ellipse(place.x, place.y, place.h * 0.2, place.h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const width_ = drawClip(ctx, clip.id, place.x, place.y, place.h, { timeMs: at, seed: place.id, paused: !speaking, reducedMotion: reducedMotion(), flip: clip.flip, appearance: figureOf(person).appearance });
      drawnPeople.push({ id: place.id, clip: clip.id, x: Math.round(place.x), y: Math.round(place.y), h: Math.round(place.h), drawn: width_ > 0 });
    }
    // The fiddle, once somebody has been sent to find it. stand-in: docs/ART_REQUESTS.md, request 2026-09-29 - the lone parent's
    // wedding, item 7: a farmer with a fiddle (Claude-drawn), and the Béxar fandango's fiddler while that sheet has not loaded.
    const fiddled = here.id === 'after' || (here.id === 'wedding' && step >= steps.findIndex(s => /fiddle/.test(s.text || '')) && steps.some(s => /fiddle/.test(s.text || '')));
    if (fiddled) {
      const fiddle = ['rust-fiddle', 'ochre-fiddle'].find(id => clipReady(id)) || 'fiddler-play';
      const x = here.id === 'after' ? width * 0.86 : width * 0.9;
      drawClip(ctx, fiddle, x, height * GROUND - h * 0.08, h * 0.92, { timeMs: at, reducedMotion: reducedMotion(), flip: true });
      drawnPeople.push({ id: 'fiddler', clip: fiddle, x: Math.round(x), y: Math.round(height * GROUND), h: Math.round(h * 0.92), drawn: true });
    }
    if (speakerPlace) nameTag(script.cast[speakerId]?.given || '', speakerPlace.x, speakerPlace.y - speakerPlace.h * 1.04, width);
    return drawnPeople;
  }

  /** The speaker's name over their head, in a small warm tag with its point toward them. */
  function nameTag(text, x, y, width) {
    if (!text) return;
    ctx.save();
    ctx.font = '600 15px Georgia, serif';
    const w = ctx.measureText(text).width + 18, h = 24;
    const left = clamp(x - w / 2, 6, width - w - 6), top = y - h;
    ctx.fillStyle = 'rgba(252,244,224,.95)'; ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(left, top, w, h, 7) : ctx.rect(left, top, w, h);
    ctx.moveTo(clamp(x, left + 8, left + w - 8) - 6, top + h); ctx.lineTo(x, top + h + 8); ctx.lineTo(clamp(x, left + 8, left + w - 8) + 6, top + h);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a2e14'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, left + w / 2, top + h / 2 + 1);
    ctx.restore();
  }

  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (!script) return;
    const { width, height } = fit();
    ctx.clearRect(0, 0, width, height);
    const here = current();
    const elapsed = now - since;
    let dark = 0;
    if (mode === 'between') dark = 1;
    else if (mode === 'fade-in') dark = 1 - clamp(elapsed / fadeMs(), 0, 1);
    else if (mode === 'fade-out') dark = clamp(elapsed / fadeMs(), 0, 1);
    if (dark < 1 && here) {
      const backdrop = drawBackdrop(width, height, here.light);
      const h = Math.min(height * PERSON_SHARE, width * PERSON_WIDTH_SHARE);
      const buildings = drawBuildings(here, width, height, h);
      const people = drawPeople(here, width, height, now);
      grade(width, height, here.light, now);
      evidence.drawn = people; evidence.backdrop = backdrop; evidence.buildings = buildings;
    }
    if (dark > 0) {
      ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, width, height);
    }
    evidence.dark = +dark.toFixed(2);
    // The travel, said on the black between one place and the next (the owner: "travel is skipped").
    if (mode === 'between' && here?.between) {
      const t = clamp(elapsed / 500, 0, 1) * clamp((betweenMs() - elapsed) / 500, 0, 1);
      ctx.save();
      ctx.globalAlpha = t;
      ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `italic ${Math.round(clamp(width / 40, 18, 30))}px Georgia, serif`;
      ctx.fillText(here.between, width / 2, height * 0.42, width * 0.9);
      ctx.restore();
    }
    // The clock of the fades.
    if (mode === 'between' && elapsed >= betweenMs()) { setMode('fade-in'); }
    else if (mode === 'fade-in' && elapsed >= fadeMs()) { setMode('scene'); showStep(); next.focus({ preventScroll: true }); }
    else if (mode === 'fade-out' && elapsed >= fadeMs()) {
      if (scene >= script.scenes.length - 1) { finish(); return; }
      scene += 1; step = 0; remember();
      evidence.between = script.scenes[scene].between;
      setMode('between');
      showStep();
    }
  }

  return {
    /** Every snapshot: open when the server sends the scenes and they are not already open or finished on this page. */
    update(world) {
      const path = world?.courtship;
      if (!path?.script || world.role === 'host') { if (!root.hidden) close(); finishedLocally = false; return; }
      if (finishedLocally) return;
      if (root.hidden) open(world);
      else script = path.script;
    },
    get open() { return !root.hidden; },
  };
}
