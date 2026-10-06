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
//
// The drawing itself - the yard, the light, the glow and name over whoever speaks, the figures - is the cutscene's stage
// (public/cutscene.js), which a rider's scene draws with too (owner, 2026-10-05: "redo each of them as a cutscene sort of like
// with the wedding"). What stays here is the wedding's own: where its people stand (`sceneLayout`), their poses, its buildings,
// the fiddle and the steps with Continue.
import { clipReady, drawClip, drawSprite, spriteFrame } from './art.js';
import { BAND_SCALE, GROUND, clamp, clipFor, createStage, figureOf, personHeight, reducedMotion } from './cutscene.js';

export { clipFor, figureOf };

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
/**
 * Where everybody in a scene stands, and which way each faces: the family to the left facing east, the neighbours to the right
 * facing west, children a step in front; at the wedding the couple in the middle facing each other with the officer beside them;
 * afterwards the family together in front of its house, facing the camera. Pure: the proofs and tests read it.
 */
export function sceneLayout(scene, cast, width, height) {
  const h = personHeight(width, height);
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
  const stage = createStage(canvas);
  const ctx = stage.ctx;
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

  function drawBackdrop(width, height, light) {
    const name = BACKDROP[light] || BACKDROP.noon;
    const frameOf = spriteFrame(name);
    if (frameOf && stage.drawCover(name, frameOf, width, height)) return name;
    stage.paintYard(width, height, light);
    return null;
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
    stage.glow(speakerPlace);
    for (const place of places) {
      const person = script.cast[place.id];
      const speaking = place.id === speakerId ? one : null;
      const pose = poseOf(here, place, speaking, step);
      const face = place.face === 's' ? 's' : place.face;
      const clip = pose === 'front' || face === 's' ? { id: `${figureOf(person).figure}-idle-s`, flip: false } : clipFor(person, pose, face);
      // Only the speaker moves; the rest stand and breathe (a paused clip), so the eye goes to whoever is talking.
      const width_ = stage.drawPerson(person, place, clip, { at, speaking: Boolean(speaking) });
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
    if (speakerPlace) stage.nameTag(script.cast[speakerId]?.given || '', speakerPlace.x, speakerPlace.y - speakerPlace.h * 1.04, width);
    return drawnPeople;
  }

  function draw(now) {
    frame = requestAnimationFrame(draw);
    if (!script) return;
    const { width, height } = stage.fit();
    ctx.clearRect(0, 0, width, height);
    const here = current();
    const elapsed = now - since;
    let dark = 0;
    if (mode === 'between') dark = 1;
    else if (mode === 'fade-in') dark = 1 - clamp(elapsed / fadeMs(), 0, 1);
    else if (mode === 'fade-out') dark = clamp(elapsed / fadeMs(), 0, 1);
    if (dark < 1 && here) {
      const backdrop = drawBackdrop(width, height, here.light);
      const h = personHeight(width, height);
      const buildings = drawBuildings(here, width, height, h);
      const people = drawPeople(here, width, height, now);
      // A few motes of light drifting in the warm air of the wedding and after.
      stage.grade(width, height, here.light, now, { motes: here.id === 'wedding' || here.id === 'after' });
      evidence.drawn = people; evidence.backdrop = backdrop; evidence.buildings = buildings;
    }
    stage.darken(dark, width, height);
    evidence.dark = +dark.toFixed(2);
    // The travel, said on the black between one place and the next (the owner: "travel is skipped").
    if (mode === 'between' && here?.between) {
      const t = clamp(elapsed / 500, 0, 1) * clamp((betweenMs() - elapsed) / 500, 0, 1);
      stage.onBlack(here.between, t, width, height);
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
