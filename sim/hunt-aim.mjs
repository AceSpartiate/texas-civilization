// The shot, aimed by the student (owner, 2026-10-02, verbatim: "when a character goes hunting, when they see an animal the player
// should see an alert. if players click on it in time, then a first person mini game starts where they have to aim and hit the
// moving animal. if they miss, the animal runs away."; docs/WOODS_AND_BUILDING.md §5.2, `FIC-GONZ-1080`).
//
// One module, read by the server and by the page alike (it imports nothing): the page draws the animal where this says it is,
// and the server judges the shot by the same numbers. **The server decides everything that matters** (sim/chores.mjs `beginAim`,
// `fireShot`): that something was sighted at all (the hunt's own `shot` question, with the quarry the place holds), when the
// student began to aim (its own clock), whether the shot was in time, and whether it hit. The page sends only **when it fired and
// where the sights were** - never "I hit it" - and the server works the rest out from the path below, which is a pure function
// of the sighting it made. So a page cannot bring home a kill without a sighting, cannot fire twice at one animal, and cannot
// fire after the animal has gone; what it can do is aim, which is the game.
//
// The view is a fixed box of 16 by 9 units, whatever the screen: the page fits it to the window (letterboxed), so a Chromebook
// at 1366x768 and one at 1024x600 see the same field and the same animal, only smaller. Every number is in those units.
//
// **No die** (`FIC-GONZ-008`, sim/chores.mjs): where the animal runs, where it stops, how the sights wander, are fixed by the
// sighting's seed and the hunter's own hand, and shown; a student who aims well hits, whoever the hunter is. The hunter's hand is
// what the old rule read (sim/chores.mjs `steadyHand`): a hand without the knack, or a tired one, makes the sights wander more,
// and a rifle the gunsmith has put in order makes them wander less. Damp powder **hangs fire** - the ball goes a moment after the
// trigger - which is what wet powder in a flintlock does, said before the shot.

/** The fixed field, in units: the page fits it to the screen; the horizon is where the far ground meets the sky. */
export const VIEW = Object.freeze({ w: 16, h: 9, horizon: 4.6 });

/**
 * Each quarry as it crosses the field: the clips it is drawn with (all Astra's, already in the library), how tall it is drawn
 * (units, at middle distance), how fast it runs (units a second), its gait, how long it stops to look, and the body a ball must
 * find - an ellipse round the trunk, as fractions of its drawn height, from its ground anchor (`dx` toward where it faces).
 *
 * Tuned for middle schoolers (2026-10-02, the proof's numbers): a deer bounds in, **stops and looks back for about a second and a
 * half** - the moment a careful student takes - and bounds on; a bear lumbers, big and slow, the easiest; a turkey runs low and
 * small; an antelope and a mustang are the fastest. Flying fowl never stop, and are a whole flock to hit. Invented, like every
 * number here (`FIC-GONZ-1080`).
 */
export const AIM_GAME = Object.freeze({
  deer: Object.freeze({ run: 'deer-bound', still: 'deer-alert', height: 1.6, speed: 3.2, gait: 'bound', hop: 0.2, cycleMs: 720, pauseMs: 1600, body: Object.freeze({ dx: 0.1, dy: 0.5, rx: 0.42, ry: 0.25 }) }),
  turkey: Object.freeze({ run: 'turkey-bound', still: 'turkey-alert', height: 1.05, speed: 2.6, gait: 'run', hop: 0.03, cycleMs: 600, pauseMs: 1400, body: Object.freeze({ dx: 0.02, dy: 0.45, rx: 0.36, ry: 0.28 }) }),
  bear: Object.freeze({ run: 'bear-alert-bound', still: 'bear-forage', height: 1.7, speed: 1.8, gait: 'lumber', hop: 0.04, cycleMs: 920, pauseMs: 1500, body: Object.freeze({ dx: 0.06, dy: 0.45, rx: 0.5, ry: 0.3 }) }),
  bison: Object.freeze({ run: 'bison-run', still: 'bison-idle', height: 2, speed: 2.4, gait: 'run', hop: 0.05, cycleMs: 720, pauseMs: 1400, body: Object.freeze({ dx: 0.06, dy: 0.5, rx: 0.5, ry: 0.3 }) }),
  pronghorn: Object.freeze({ run: 'pronghorn-bound', still: 'pronghorn-idle', height: 1.4, speed: 3.9, gait: 'bound', hop: 0.22, cycleMs: 660, pauseMs: 1200, body: Object.freeze({ dx: 0.1, dy: 0.52, rx: 0.42, ry: 0.23 }) }),
  mustang: Object.freeze({ run: 'mustang-gallop', still: 'mustang-alert', height: 1.9, speed: 3.7, gait: 'run', hop: 0.06, cycleMs: 1080, pauseMs: 1200, body: Object.freeze({ dx: 0.06, dy: 0.55, rx: 0.46, ry: 0.25 }) }),
  cattle: Object.freeze({ run: 'wild-cattle-run', still: 'wild-cattle-graze', height: 1.8, speed: 2.6, gait: 'run', hop: 0.05, cycleMs: 760, pauseMs: 1400, body: Object.freeze({ dx: 0.06, dy: 0.5, rx: 0.46, ry: 0.28 }) }),
  javelina: Object.freeze({ run: 'javelina-alert-run', still: 'javelina-forage', height: 1, speed: 2.9, gait: 'run', hop: 0.04, cycleMs: 680, pauseMs: 1300, body: Object.freeze({ dx: 0.06, dy: 0.45, rx: 0.42, ry: 0.3 }) }),
  waterfowl: Object.freeze({ run: 'geese-flight', still: 'geese-flight', height: 1.2, speed: 2.5, gait: 'fly', hop: 0, cycleMs: 720, pauseMs: 0, flies: true, body: Object.freeze({ dx: 0, dy: 0.5, rx: 0.52, ry: 0.34 }) }),
});
export const aimGame = quarry => AIM_GAME[quarry] || AIM_GAME.deer;

/** Before the animal comes into the view: the moment to settle the rifle. */
export const LEAD_MS = 800;
/** Where it starts and ends, off either edge of the field. */
const OFF = 1.8;

/**
 * The hunter's hand on the rifle, from what the old rule read (sim/chores.mjs `steadyHand`, `unsteadyBecause`; sim/shops.mjs
 * `rifleTrue`; sim/hunting.mjs `powderDamp`): how far the sights wander (units), and how long damp powder hangs fire (ms).
 *   skill 3 - "the best shot on this land": the sights barely move.
 *   skill 2 - "a steady shot".
 *   skill 1 - never had the knack: they wander about a deer's body-width.
 *   tired   - a fifth of a unit more, whoever it is.
 *   rifle put in order by the gunsmith - a third less.
 */
export const SWAY = Object.freeze({ 1: 0.5, 2: 0.3, 3: 0.16 });
export const TIRED_SWAY = 0.2;
export const TRUE_RIFLE = 0.65;
export const HANG_FIRE_MS = 320;
export function handOf({ name = 'They', skill = 1, tired = false, rifleTrue = false, damp = false } = {}) {
  const level = Math.max(1, Math.min(3, Math.round(skill) || 1));
  const sway = Math.round((SWAY[level] + (tired ? TIRED_SWAY : 0)) * (rifleTrue ? TRUE_RIFLE : 1) * 1000) / 1000;
  const words = [
    tired ? `${name} is tired, and the sights wander.` : level >= 3 ? `${name} is the best shot on the land: the sights hold steady.` : level === 2 ? `${name} is a steady shot.` : `${name} has never had the knack: the sights wander. Wait for them to swing across.`,
    rifleTrue ? 'The rifle the gunsmith put in order holds truer.' : '',
    damp ? 'The rain is on the powder: the rifle will hang fire a moment after the trigger, so lead it.' : '',
  ].filter(Boolean).join(' ');
  return { skill: level, tired: Boolean(tired), rifleTrue: Boolean(rifleTrue), damp: Boolean(damp), sway, hangMs: damp ? HANG_FIRE_MS : 0, words };
}

/** A number in [0, 1) from a string, and a small generator from it: the same sighting always runs the same way. */
function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function generator(seed) {
  let state = hash(seed) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r3 = value => Math.round(value * 1000) / 1000;

/**
 * The path of one sighting: everything the field needs, fixed by the sighting (`sight`: its seed, quarry, cover, hand) and by
 * whether the page asked for less motion (`calm`: no bounding, a slower run, a longer stop and the sights wandering slower - the
 * reduced-motion variant; it only ever makes the shot easier, and the server believes it, which is the one thing the page says
 * that it does). Times are milliseconds from when the student began to aim.
 */
export function aimPath(sight, { calm = false } = {}) {
  const spec = aimGame(sight?.quarry);
  const random = generator(`${sight?.seed ?? 'sight'}:${sight?.quarry ?? 'deer'}`);
  const dir = random() < 0.5 ? 1 : -1;
  const depth = random();
  const scale = 0.78 + depth * 0.38;
  const height = r3(spec.height * scale);
  const ground = spec.flies ? r3(VIEW.horizon - 1.1 - depth * 1.2) : r3(VIEW.horizon + 1.05 + depth * 1.75);
  const stopX = r3(5.4 + random() * 5.2);
  const speed = r3(spec.speed * (0.92 + random() * 0.16) * (calm ? 0.7 : 1));
  const pauseMs = Math.round(spec.pauseMs * (calm ? 1.5 : 1));
  const startX = dir > 0 ? -OFF : VIEW.w + OFF, endX = dir > 0 ? VIEW.w + OFF : -OFF;
  const inMs = Math.round(Math.abs(stopX - startX) / speed * 1000), outMs = Math.round(Math.abs(endX - stopX) / speed * 1000);
  const stopAt = LEAD_MS + inMs, goAt = stopAt + pauseMs, goneAt = goAt + outMs;
  const hand = sight?.hand || handOf();
  return {
    quarry: sight?.quarry || 'deer', cover: sight?.cover || 'timber', dir, ground, height, startX, stopX, endX, speed,
    stopAt, goAt, goneAt, calm: Boolean(calm),
    hop: calm ? 0 : spec.hop, cycleMs: spec.cycleMs, flies: Boolean(spec.flies),
    sway: r3(hand.sway * (calm ? 0.8 : 1)), swayPeriods: calm ? [3400, 2600] : [2300, 1650], swayPhase: [r3(random() * Math.PI * 2), r3(random() * Math.PI * 2)],
    hangMs: hand.hangMs || 0,
  };
}

/** How far into its stride the animal is: the up of a bound, 0 on the ground. */
const bound = (path, ms) => (path.hop ? Math.abs(Math.sin(Math.PI * ms / path.cycleMs)) : 0);

/**
 * Where the animal is at `t` ms: its ground anchor (`x`, `y`), drawn height, which way it faces, which phase it is in
 * (`waiting` - not yet in view, `running`, `still`, `gone`), and the body a ball must find. A flying flock rises and falls a
 * little instead of bounding.
 */
export function animalAt(path, t) {
  const spec = aimGame(path.quarry);
  let x, phase, lift = 0;
  if (t < LEAD_MS) { x = path.startX; phase = 'waiting'; }
  else if (t < path.stopAt) { x = path.startX + path.dir * path.speed * (t - LEAD_MS) / 1000; phase = 'running'; lift = bound(path, t - LEAD_MS); }
  else if (t < path.goAt) { x = path.stopX; phase = 'still'; }
  else if (t < path.goneAt) { x = path.stopX + path.dir * path.speed * (t - path.goAt) / 1000; phase = 'running'; lift = bound(path, t - path.goAt); }
  else { x = path.endX; phase = 'gone'; }
  const h = path.height;
  const y = path.flies ? path.ground + Math.sin(t / 900) * 0.18 : path.ground - lift * path.hop * h;
  const body = { cx: x + path.dir * spec.body.dx * h, cy: y - spec.body.dy * h, rx: spec.body.rx * h, ry: spec.body.ry * h };
  return { x, y, h, dir: path.dir, phase, body, clip: phase === 'still' ? spec.still : spec.run };
}

/** How far the sights have wandered from where the student holds them at `t` ms: a slow figure of eight, the hunter's own hand. */
export function swayAt(path, t) {
  const [px, py] = path.swayPeriods, [ax, ay] = path.swayPhase;
  return { dx: path.sway * Math.sin(2 * Math.PI * t / px + ax), dy: path.sway * 0.7 * Math.sin(2 * Math.PI * t / py + ay) };
}

/**
 * The shot judged: the student held the sights at (`x`, `y`) and pressed the trigger at `t` ms. Where the ball went is where the
 * sights were then - held point plus the hand's wander - and it finds the animal where the animal is when the powder goes off,
 * `hangMs` later in the rain. A hit is inside the body's ellipse. Nothing in view (not yet come, or gone) is never a hit.
 */
export function judgeShot(path, { t, x, y }) {
  const sway = swayAt(path, t);
  const aim = { x: r3(x + sway.dx), y: r3(y + sway.dy) };
  const at = t + path.hangMs;
  const animal = animalAt(path, at);
  const inView = animal.phase === 'running' || animal.phase === 'still';
  const { cx, cy, rx, ry } = animal.body;
  const reach = ((aim.x - cx) / rx) ** 2 + ((aim.y - cy) / ry) ** 2;
  return { hit: inView && reach <= 1, aim, at, phase: animal.phase, body: { cx: r3(cx), cy: r3(cy), rx: r3(rx), ry: r3(ry) }, reach: r3(reach) };
}

/**
 * The page's clock and the server's are not the same clock: the page starts counting the moment the student presses, and the
 * server the moment the press reaches it. A shot is taken at the page's `t`, bounded by what the server itself has seen pass:
 * never more than `AHEAD_MS` past it (a page cannot fire in the future), nor more than `BEHIND_MS` short of it (a slow school
 * network is forgiven; a page cannot fire "earlier" at leisure). `ceiling:` a page that lies about `t` inside that window can
 * choose its moment, and a page can always compute where the animal is - the path is the page's to draw. What it gains is one
 * animal it was already shown; a server that streamed the path a frame at a time would be the way out, if a class ever cheats.
 */
export const AHEAD_MS = 1500;
export const BEHIND_MS = 4000;
export const boundedT = (t, elapsed) => Math.max(0, Math.max(elapsed - BEHIND_MS, Math.min(Number(t), elapsed + AHEAD_MS)));
