// The one battle renderer (docs/BATTLES.md §3, §6). It replaced `drawFormations` in public/app.js on 2026-09-25.
//
// Owner, 2026-09-25: "when i try to watch a battle ... i see npc's just standing around ... the battle itself never actually
// takes place. there's no smoke from the gunfire." And: "wouldn't the mexican army be in rows, but the texians in
// unorganized chaos? shouldn't there be talking, orders given, taunting etc?"
//
// Everything drawn here is presentation of what the server sent (sim/battle-stage.mjs `projectBattle`): each side's count,
// style, place and fire in the phase it is in, the lines said so far, the cannon's shots so far, who has fallen. It never
// decides anything, and nothing here reaches the simulation. What it adds is only what a picture needs between two ticks:
//   - each drawn figure is a sample of a count (`FIC-GONZ-006`), laid out by the side's style with a stable seed, so the
//     same fight is always drawn the same way;
//   - each figure is on its own looping cycle - a Texian at his own pace, with his own wait between loads; a Mexican rank on
//     its officer's word - so the line is never frozen on the ramrod as the old one-shot clip left it;
//   - every shot leaves smoke that accumulates, lingers and drifts with the day's wind, and thins once firing stops;
//   - a side moves smoothly from where the last tick had it to where this one has it, never jumping;
//   - words are drawn over whoever says them (public/speech.js), each at the moment of the tick the server dated it.
// A family's own person in the force is a real entity drawn by public/app.js at the place the server gave them; this only
// tells app.js which pose they are in (`memberPose`) so they fire and load with the men around them.
// Relative, so the same module loads in the page (as /speech.js) and under node for tests/battle-view.test.mjs.
import { drawSpeech, speechAlpha } from './speech.js';
import { CLAUDE_PERSON_ART } from './claude-person-art.js';
// Astra's marsh-wading infantry at San Jacinto (2026-10-08): presentation only.
import { marshWadingClip } from './wading-art.js';
// San Fernando's place in the town the map draws, for the red flag on its tower (`drawFlag`).
import { BEXAR_LAYOUT, bexarToSite } from './bexar-layout.js';
const NIGHT_BUILDING_CLIPS = Object.freeze({ 'adobe-flat': 'adobe-night-lit', 'house-jacal': 'jacal-night-lit', 'jacal-poor': 'jacal-night-lit', 'cabin-small': 'cabin-night-lit' });

/** Miles between figures, by style. A person is drawn 0.019 miles tall (sim/house-footprint.mjs `PERSON_MILES`). */
const LAYOUT = Object.freeze({
  ranks: { across: 0.021, rank: 0.03 },
  mounted: { across: 0.03, rank: 0.048 },
  column: { across: 0.022, rank: 0.026 },
  wall: { across: 0.018, rank: 0.02 },
  loose: { width: 0.44, depth: 0.22, gap: 0.02 },
  bank: { width: 0.5, depth: 0.08, gap: 0.018 },
  // Men inside a house or its yard stand close: a few yards apart, not the open field's twenty.
  street: { width: 0.3, depth: 0.3, gap: 0.007 },
  rout: { width: 0.6, depth: 0.5, gap: 0.03 },
  // A force at rest (docs/battle-research/staging.md §9, San Jacinto): scattered about its fires, some standing, some sitting.
  camp: { width: 0.45, depth: 0.3, gap: 0.024 },
});
/**
 * The hollow square (Coleto, 2026-09-25; sim/battles/coleto.mjs `coletoSlot` stands a family's man in its front rank at
 * `outer`). Its innermost rank stands further out than its faces run, so no two faces' men meet at a corner.
 */
const SQUARE = Object.freeze({ outer: 0.09, rank: 0.018, across: 0.021 });
/** The wash over the field for the light of the hour (`phase.light`); a night's own is `drawNight`'s. */
const DIM = Object.freeze({ dusk: 'rgba(48,30,60,.24)', fog: 'rgba(222,226,228,.22)' });
/** One load of a musket in the library's cycle: aim 700, fire 120, load 750, ramrod 900 (public/assets/frontier-v1/animation.json). */
const FIRE_CLIP_MS = 2470, AIM_MS = 700;
/**
 * **A musket loaded and fired at the speed a man does it** (owner, 2026-09-30, at Study: "it was too fast" ... "i think you're
 * correct about speed"; docs/BATTLES.md §16.1, `FIC-GONZ-1053`). The library's cycle is drawn in 2.47 s (aim 700, fire 120, load
 * 750, ramrod 900 ms): a man aimed, fired and had his next ball rammed home in under three seconds, then stood. Now each part is
 * shown at a man's own pace - the aim held a second and a half, the shot, the cartridge bitten and poured over four seconds, the
 * ball rammed over five and a half - by holding each of the clip's frames longer (`musketClip`), whatever the class's pace: the
 * cycle is real time, never the calendar. Then his own wait. About three shots a minute from a man in the open, as a practised hand
 * fired; the record's volunteers were slower if anything. Every number is the game's.
 */
const MUSKET = Object.freeze({ aim: 1500, fire: 200, load: 4200, ramrod: 5600 });
const MUSKET_MS = MUSKET.aim + MUSKET.fire + MUSKET.load + MUSKET.ramrod, SHOT_AT = MUSKET.aim;
/** Where in the library's 2.47 s clip a man is, `t` real milliseconds after he brought his piece up (`aim` how long he held it). */
export function musketClip(t, aim = MUSKET.aim) {
  if (t < aim) return 700 * Math.max(0, t) / aim;
  t -= aim;
  if (t < MUSKET.fire) return 700 + 120 * t / MUSKET.fire;
  t -= MUSKET.fire;
  if (t < MUSKET.load) return 820 + 750 * t / MUSKET.load;
  t -= MUSKET.load;
  return Math.min(FIRE_CLIP_MS - 1, 1570 + 900 * t / MUSKET.ramrod);
}
/**
 * Where in Astra's `volunteer-bank-climb` (2026-10-04: step up, aim, the shot, step down, kneel to the lock, the ramrod; 450, 500,
 * 200, 450, 650 and 700 ms) a man under a bank is, `t` real milliseconds after he brought his piece up: the step up in the half
 * second before, the shot frame on the shot, stepping down and the lock through the load, the ramrod through the ramming. Her
 * clip loops at its own pace (a preview of the sequence); here it follows the firing clock, as she asked.
 */
export function bankClip(t, aim = MUSKET.aim) {
  if (t < 0) return 450 * Math.max(0, t + 500) / 500;
  if (t < aim) return 450 + 500 * t / aim;
  t -= aim;
  if (t < MUSKET.fire) return 950 + 200 * t / MUSKET.fire;
  t -= MUSKET.fire;
  if (t < MUSKET.load) return 1150 + 1100 * t / MUSKET.load;
  t -= MUSKET.load;
  return Math.min(2949, 2250 + 700 * t / MUSKET.ramrod);
}
/** How long a Texian waits, at his own pace, between loads: seconds, not a drill-book rate. `FIC-GONZ-446`. */
const WAIT_MIN_MS = 2000, WAIT_SPAN_MS = 7000;
/**
 * A rank's volley on the officer's word: the whole cycle, and when in it each word is said.
 * ceiling: the volley's rhythm is each page's own and is not dated by the server, as no musket's shot is; a volley that
 * matters to the history (a first volley at a dated minute) would be a server-dated shot, as the cannon's are.
 */
// Since 2026-09-30 (§16.1) the officer's three words a breath apart, the rank holding its aim from the second to the third, and a
// rank's turn coming round every twenty seconds: "¡Preparen!" ... "¡Apunten!" ... "¡Fuego!", each long enough to read.
/**
 * A man falling (§16.1): struck and staggering (`struck`), going down (to `down`), then lying still; the men of one fall each a
 * moment apart within `spread`. Real milliseconds, the game's; no blood, no gore (VISION.md §16).
 */
const FALL = Object.freeze({ struck: 900, down: 2200, spread: 2400 });
/**
 * A gun's shot (§16.1): the crew stood ready, the gunner at the vent, for `ready` before a shot the page knows is coming (a shot
 * dated later in the tick it arrived in); the recoil over `recoil`, not the clip's own 0.9 s; the flash seen `flash`. Real ms.
 */
const GUN = Object.freeze({ ready: 1800, recoil: 1700, flash: 340 });
const VOLLEY_MS = 20000, VOLLEY_WORDS_AT = [0, 2600, 4800], VOLLEY_AIM_MS = VOLLEY_WORDS_AT[2] - VOLLEY_WORDS_AT[1];
// ceiling: at most 170 puffs on the field at once, the oldest let go first, so a Chromebook's frame stays under a few
// milliseconds (measured by scripts/battle-gonzales-browser-proof.mjs); a battle with far more men firing than Gonzales -
// San Jacinto's eighteen minutes - may want the puffs merged into banks rather than a higher cap.
const SMOKE_CAP = 160, SMOKE_LIFE_MS = 15000, CANNON_SMOKE_LIFE_MS = 30000;
/**
 * **Black powder** (owner, 2026-09-30, after watching Gonzales in a real class: "i don't think there was enough smoke for black
 * powder weapons"; docs/BATTLES.md §15.2, `FIC-GONZ-1051`). A puff above is the billow out of one muzzle, seen for its first
 * quarter minute; every shot also feeds the **bank** lying on the field where it was fired (`view.banks`, `feedBank`). A bank
 * thickens with every shot into it, so a line that keeps firing stands in a cloud of its own making and is hidden by it; it drifts
 * on the day's wind, spreads, and thins slowly once the firing stops - a minute and more for a gun's (`CANNON_BANK_FADE_MS`), most
 * of a minute for a musket line's. Banks merge (`BANK_MERGE_MILES`), so the cost is the number of banks, never the number of
 * shots. Drawn over the figures, at a third of the screen's resolution and laid on in one stroke (`smokeLayer`), procedurally:
 * the white-grey of powder smoke, never black. Times are real milliseconds, the game's.
 * ceiling: at most `BANK_CAP` banks on the field; a shot beyond it thickens the nearest. A battle wanting more separate clouds
 * than that (none of the ten does) would want a coarser merge, not a higher cap.
 */
const BANK_CAP = 96, BANK_MERGE_MILES = 0.03, BANK_FADE_MS = 15000, CANNON_BANK_FADE_MS = 24000, BANK_MAX = 9, BANK_GONE = 0.035;
/** How thick a bank looks: 0 none to most of the way opaque (a line inside its own smoke is all but hidden). */
const bankAlpha = density => Math.min(0.88, 1 - Math.exp(-0.7 * density));

const hash = key => {
  let h = 2166136261;
  for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};
const clamp01 = value => Math.max(0, Math.min(1, value));
/**
 * The famous people's own art (scripts/art-deliveries/famous-people.mjs, famous-alamo-survivors.mjs, famous-bexar-goliad.mjs;
 * the Joe sheet): for each pose the sprite, a `clip:` for an animated clip, or a list of sprites cycled (aim, fire, reload).
 * `walk` is the east-walking clip, mirrored for the west. A pose missing here is drawn from the library's volunteer or
 * regular (public/battle-view.js `drawPerson`; stand-ins listed in docs/ART_REQUESTS.md, request 2026-09-26).
 */
export const PERSON_ART = Object.freeze({
  ...Object.fromEntries(['jw-smith', 'horton', 'kimbell', 'martin'].map(id => [id, {
    stand: `${id}-idle`, command: `${id}-parley`, point: `${id}-point`, speak: `${id}-parley`, listen: `${id}-listen`, write: `${id}-read`, seated: `${id}-rest`, walk: `${id}-walk-e`, ride: `clip:${id}-mounted-walk-e`, rideIdle: `${id}-mounted-idle-e`, rideNorth: `clip:${id}-mounted-walk-n`, rideSouth: `clip:${id}-mounted-walk-s`,
  }])),
  smither: { stand: 'smither-idle', command: 'smither-stop', point: 'smither-dispatch', speak: 'smither-speak', listen: 'smither-listen', write: 'smither-read', seated: 'smither-rest', walk: 'smither-walk-e', ride: 'clip:smither-mounted-walk-e', rideIdle: 'smither-mounted-idle-e', rideNorth: 'clip:smither-mounted-walk-n', rideSouth: 'clip:smither-mounted-walk-s' },
  'wp-smith': { stand: 'wp-smith-idle', command: 'clip:wp-smith-address', point: 'wp-smith-point', speak: 'wp-smith-exhort', listen: 'wp-smith-listen', write: 'wp-smith-read', seated: 'wp-smith-rest', walk: 'wp-smith-walk-e' },
  barragan: { stand: 'barragan-idle', command: 'clip:barragan-intervene', point: 'barragan-point', speak: 'barragan-speak', listen: 'barragan-listen', seated: 'barragan-rest', walk: 'barragan-walk-e' },
  'sanchez-navarro': { stand: 'sanchez-navarro-idle', command: 'sanchez-navarro-point', point: 'sanchez-navarro-point', write: 'sanchez-navarro-read', speak: 'sanchez-navarro-parley', listen: 'sanchez-navarro-listen', seated: 'sanchez-navarro-rest', walk: 'sanchez-navarro-walk-e' },
  condelle: { stand: 'condelle-idle', command: 'clip:condelle-command', point: 'condelle-point', write: 'condelle-read-map', speak: 'condelle-speak', listen: 'condelle-listen', seated: 'condelle-rest', walk: 'condelle-walk-e' },
  travis: { speak: 'clip:travis-conversation-cycle', stand: 'travis-idle', command: 'clip:travis-command-cycle', write: 'travis-write', point: 'travis-command', fire: ['travis-aim', 'travis-fire', 'travis-ready'], wounded: 'travis-wounded-kneel', still: 'travis-still-ramp', walk: 'travis-walk-e', walkNorth: 'travis-foot-walk-n-v2', walkSouth: 'travis-foot-walk-s-v2' },
  bowie: { stand: 'bowie-idle', command: 'clip:bowie-story-command', sick: 'clip:bowie-story-sick', 'still-bed': 'bowie-still-bed', seated: 'bowie-sick-seated', walk: 'bowie-walk-e', walkNorth: 'bowie-foot-walk-n-v2', walkSouth: 'bowie-foot-walk-s-v2' },
  crockett: { stand: 'crockett-idle', command: 'clip:crockett-story-command', fire: ['crockett-aim', 'crockett-fire', 'crockett-reload'], seated: 'clip:crockett-story-rest', captive: 'clip:crockett-captive', still: 'crockett-still-side', walk: 'crockett-walk-e', walkNorth: 'crockett-foot-walk-n-v2', walkSouth: 'crockett-foot-walk-s-v2' },
  joe: { stand: 'clip:joe-idle', hide: 'clip:joe-hide', fireHidden: 'joe-fire-door', emerge: 'clip:joe-emerge', seated: 'clip:joe-rest', wounded: 'joe-hurt-e', walk: 'joe-walk' },
  seguin: { stand: 'seguin-idle', command: 'seguin-command', ride: 'clip:seguin-mounted-walk-e', rideNorth: 'clip:seguin-mounted-walk-n', rideSouth: 'clip:seguin-mounted-walk-s', rideIdle: 'seguin-mounted-e', walk: 'seguin-walk-e' },
  'susanna-dickinson': { stand: 'clip:susanna-child-hold', carry: 'susanna-dickinson-carry-angelina', sick: 'susanna-dickinson-shelter-with-angelina', seated: 'susanna-dickinson-rest-with-angelina', walk: 'susanna-child-walk-e', walkNorth: 'susanna-child-walk-n', walkSouth: 'susanna-child-walk-s' },
  'angelina-dickinson': { stand: 'angelina-dickinson-sit', seated: 'angelina-dickinson-sleep' },
  ben: { stand: 'ben-idle', seated: 'ben-rest', carry: 'clip:ben-story-pot-walk', speak: 'clip:ben-story-conversation', walk: 'ben-walk-e', walkNorth: 'ben-foot-walk-n-v2', walkSouth: 'ben-foot-walk-s-v2' },
  milam: { stand: 'milam-idle', command: 'clip:milam-story-rally', point: 'clip:milam-story-point', fire: ['milam-cover', 'milam-advance', 'milam-cover'], still: 'milam-still', walk: 'milam-walk-e', walkNorth: 'milam-foot-walk-n-v2', walkSouth: 'milam-foot-walk-s-v2' },
  fannin: { stand: 'fannin-idle', command: 'clip:fannin-story-command', wounded: 'fannin-injured-seated', surrender: 'clip:fannin-story-surrender', prisoner: 'fannin-prisoner-seated', walk: 'fannin-walk-e', walkNorth: 'fannin-foot-walk-n-v2', walkSouth: 'fannin-foot-walk-s-v2' },
  bonham: { stand: 'bonham-idle', command: 'bonham-point', point: 'bonham-point', gun: 'bonham-serve-gun', fire: ['bonham-aim', 'bonham-fire', 'bonham-reload'], still: 'bonham-still', walk: 'bonham-walk-e' },
  'almeron-dickinson': { stand: 'almeron-dickinson-idle', command: 'almeron-dickinson-command', gun: 'clip:almeron-dickinson-story-ram', carry: 'clip:almeron-dickinson-story-shot-carry', fire: ['almeron-dickinson-ram', 'almeron-dickinson-fire', 'almeron-dickinson-ram'], still: 'almeron-dickinson-still', walk: 'almeron-dickinson-walk-e' },
  esparza: { stand: 'esparza-idle', command: 'esparza-point', point: 'esparza-point', gun: 'clip:esparza-story-ram', carry: 'clip:esparza-story-shot-carry', fire: ['esparza-aim', 'esparza-fire', 'esparza-aim'], still: 'esparza-still', walk: 'esparza-walk-e' },
  houston: { speak: 'clip:houston-conversation-cycle', stand: 'houston-idle', command: 'clip:houston-command-cycle', wounded: 'houston-injured-seated', ride: 'clip:houston-mounted-walk-e', rideIdle: 'houston-mounted-idle-e', rideNorth: 'clip:houston-mounted-walk-n', rideSouth: 'clip:houston-mounted-walk-s', walk: 'houston-walk-e' },
  'santa-anna': { speak: 'clip:santa-anna-conversation-cycle', stand: 'santa-anna-idle', command: 'clip:santa-anna-command-cycle', prisoner: 'santa-anna-disguised-seated', ride: 'clip:santa-anna-mounted-walk-e', rideIdle: 'santa-anna-mounted-idle-e', rideNorth: 'clip:santa-anna-mounted-walk-n', rideSouth: 'clip:santa-anna-mounted-walk-s', walk: 'santa-anna-walk-e' },
  'emily-west': { stand: 'emily-west-idle', carry: 'emily-west-carry-bundle', seated: 'emily-west-sit-converse', walk: 'emily-west-walk-e' },
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the Esparza family" - Ana Esparza is the library's second-cast woman
  // (`indigo`), María de Jesús its girl, Enrique its boy (fair-haired: the request asks for a Tejano boy of eight), Manuel and
  // Francisco its small child, and Gregorio's brother Francisco the settler in the rust shirt (`rust`), who carries with a second
  // of the same (`drawBearers`). The children are drawn at the roster's child size, as Angelina is.
  woman: { stand: 'clip:indigo-idle-e', seated: 'clip:indigo-rest', sick: 'clip:indigo-rest', walk: 'indigo-walk' },
  girl: { stand: 'clip:girl-idle-e', seated: 'clip:girl-rest', sick: 'clip:girl-rest', walk: 'girl-walk' },
  boy: { stand: 'clip:boy-idle-e', seated: 'clip:boy-rest', sick: 'clip:boy-rest', walk: 'boy-walk' },
  'small-child': { stand: 'clip:smallchild-idle-e', seated: 'clip:smallchild-rest', sick: 'clip:smallchild-rest', walk: 'smallchild-walk' },
  townsman: { stand: 'clip:rust-idle-e', walk: 'rust-walk', carry: 'clip:rust-walk' },
  castrillon: { stand: 'castrillon-idle', command: 'castrillon-command', 'crate-command': 'clip:castrillon-crate-command', walk: 'castrillon-walk-e', walkNorth: 'castrillon-walk-n', walkSouth: 'castrillon-walk-s', fall: 'castrillon-fall', still: 'castrillon-still' },
  almonte: { speak: 'clip:almonte-conversation-cycle', stand: 'almonte-idle', command: 'clip:almonte-command-cycle', surrender: 'almonte-surrender', 'offer-sword': 'almonte-offer-sword', prisoner: 'almonte-prisoner', interpret: 'almonte-interpret', write: 'almonte-journal', walk: 'almonte-walk-e' },
  burleson: { speak: 'clip:burleson-conversation-cycle', stand: 'burleson-idle', command: 'clip:burleson-command-cycle', point: 'burleson-point', listen: 'burleson-listen', 'receive-sword': 'burleson-receive-sword', 'sword-down': 'burleson-sword-down', seated: 'burleson-rest', ride: 'clip:burleson-mounted-walk-e', rideIdle: 'burleson-mounted-idle-e', rideNorth: 'clip:burleson-mounted-walk-n', rideSouth: 'clip:burleson-mounted-walk-s', walk: 'burleson-walk-e' },
  cos: { speak: 'clip:cos-conversation-cycle', stand: 'cos-idle', command: 'clip:cos-command-cycle', point: 'cos-point', write: 'cos-sign-terms', surrender: 'cos-sword-down', prisoner: 'cos-prisoner', ride: 'clip:cos-mounted-walk-e', rideIdle: 'cos-mounted-idle-e', rideNorth: 'clip:cos-mounted-walk-n', rideSouth: 'clip:cos-mounted-walk-s', walk: 'cos-walk-e' },
  castaneda: { stand: 'castaneda-idle', command: 'clip:castaneda-command-cycle', speak: 'clip:castaneda-conversation-cycle', listen: 'castaneda-listen', point: 'castaneda-withdraw', ride: 'clip:castaneda-mounted-walk-e', rideIdle: 'castaneda-mounted-idle-e', rideNorth: 'clip:castaneda-mounted-walk-n', rideSouth: 'clip:castaneda-mounted-walk-s', walk: 'castaneda-walk-e' },
  moore: { stand: 'moore-idle', command: 'clip:moore-command-cycle', point: 'moore-point', speak: 'clip:moore-conversation-cycle', listen: 'moore-listen', walk: 'moore-walk-e' },
  austin: { stand: 'austin-idle', command: 'clip:austin-command-cycle', point: 'austin-point', speak: 'clip:austin-conversation-cycle', write: 'austin-write', walk: 'austin-walk-e' },
  urrea: { stand: 'urrea-idle', command: 'clip:urrea-command-cycle', point: 'urrea-point', speak: 'clip:urrea-conversation-cycle', ride: 'clip:urrea-mounted-walk-e', rideIdle: 'urrea-mounted-idle-e', rideNorth: 'clip:urrea-mounted-walk-n', rideSouth: 'clip:urrea-mounted-walk-s', walk: 'urrea-walk-e' },
  'deaf-smith': { stand: 'deaf-smith-idle', report: 'deaf-smith-report', point: 'deaf-smith-point', wounded: 'deaf-smith-wounded-seated', ride: 'clip:deaf-smith-mounted-walk-e', rideIdle: 'deaf-smith-mounted-idle-e', rideNorth: 'clip:deaf-smith-mounted-walk-n', rideSouth: 'clip:deaf-smith-mounted-walk-s', walk: 'deaf-smith-walk-e' },
  karnes: { stand: 'karnes-idle', speak: 'clip:karnes-field-conversation', command: 'clip:karnes-field-command', point: 'karnes-command', listen: 'karnes-listen', work: 'clip:karnes-crowbar-work', fire: ['karnes-aim', 'karnes-fire', 'karnes-aim'], ride: 'clip:karnes-mounted-walk-e', rideIdle: 'karnes-mounted-idle-e', rideNorth: 'clip:karnes-mounted-walk-n', rideSouth: 'clip:karnes-mounted-walk-s', walk: 'karnes-walk-e' },
  neill: { stand: 'neill-idle', speak: 'clip:neill-field-conversation', command: 'clip:neill-field-command', point: 'neill-command', gun: 'clip:neill-gun-service', wounded: 'neill-wounded-seated', walk: 'neill-walk-e' },
  lamar: { stand: 'lamar-idle', speak: 'clip:lamar-field-conversation', command: 'clip:lamar-field-command', point: 'lamar-command', salute: 'lamar-salute', ride: 'clip:lamar-mounted-walk-e', rideIdle: 'lamar-mounted-idle-e', rideNorth: 'clip:lamar-mounted-walk-n', rideSouth: 'clip:lamar-mounted-walk-s', rideRescue: 'lamar-mounted-rescue-e', walk: 'lamar-walk-e' },
  sherman: { stand: 'sherman-idle', speak: 'clip:sherman-field-conversation', command: 'clip:sherman-field-command', point: 'sherman-point', rally: 'sherman-rally', ride: 'clip:sherman-mounted-walk-e', rideIdle: 'sherman-mounted-idle-e', rideNorth: 'clip:sherman-mounted-walk-n', rideSouth: 'clip:sherman-mounted-walk-s', rideRally: 'sherman-mounted-rally-e', walk: 'sherman-walk-e' },
  rusk: { stand: 'rusk-idle', speak: 'clip:rusk-field-conversation', command: 'clip:rusk-field-command', point: 'rusk-command', stop: 'clip:rusk-stop', write: 'rusk-write', ride: 'clip:rusk-mounted-walk-e', rideIdle: 'rusk-mounted-idle-e', rideNorth: 'clip:rusk-mounted-walk-n', rideSouth: 'clip:rusk-mounted-walk-s', walk: 'rusk-walk-e' },
  hockley: { stand: 'hockley-idle', speak: 'clip:hockley-field-conversation', command: 'clip:hockley-field-command', point: 'hockley-point', gun: 'clip:hockley-battery-command', walk: 'hockley-walk-e' },
  mcculloch: { stand: 'mcculloch-idle', gun: 'clip:mcculloch-gun-service', listen: 'mcculloch-listen', walk: 'mcculloch-walk-e' },
  johnson: { stand: 'johnson-idle', command: 'clip:johnson-command', point: 'johnson-point', escape: 'clip:johnson-escape-e', walk: 'johnson-walk-e' },
  grant: { stand: 'grant-idle', point: 'grant-point-herd', write: 'grant-read-map', wounded: 'grant-bandaged-seated', ride: 'clip:grant-mounted-walk-e', rideIdle: 'grant-mounted-idle-e', rideNorth: 'clip:grant-mounted-walk-n', rideSouth: 'clip:grant-mounted-walk-s', rideGallop: 'grant-mounted-gallop-e', walk: 'grant-walk-e' },
});
/**
 * A person's poses: Astra's `PERSON_ART` entry, with any pose it lacks filled from Claude's temporary sheets
 * (public/claude-person-art.js); her pose of the same name always wins, so her delivery replaces Claude's with no change here.
 */
export function personArt(key) {
  const hers = PERSON_ART[key], claude = CLAUDE_PERSON_ART[key];
  return hers && claude ? { ...claude, ...hers } : hers || claude || null;
}
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Where each figure of a side stands, in miles relative to the side's centre: `along` toward the enemy, `across` to his
 * left. Worked out once per side, style and count; a stable seed means a camera move never reshuffles a line.
 * ceiling: laid out on open ground whatever is under it - a man may stand in the timber's trees or, at a battle fought on a
 * bank, in the water. The ground's own classes (public/ground-classes.js) are the way out once an engagement is fought
 * where it matters (Concepción's riverbank).
 */
export function layoutSide(side) {
  // A part of a side (§6.13) that is not formed is laid out once, scattered, whatever its style this phase: asleep, running or
  // giving up, the same men stand in the same places.
  const style = side.part && !FORMED.includes(side.style) ? 'loose' : side.style === 'camp' ? 'loose' : side.style;
  const n = Math.max(0, Math.min(60, side.drawn | 0)), seed = side.part ? `${side.key}:${n}` : `${side.side}:${style}:${n}`;
  const out = [];
  // A wall of a given length (the Alamo's garrison along its walls, docs/BATTLES.md §9): its men spread evenly along it.
  if (style === 'wall' && side.spread?.width) {
    for (let i = 0; i < n; i++) out.push({ along: (hash(`${seed}:${side.key || ''}:${i}:j`) - 0.5) * 0.002, across: n > 1 ? (i / (n - 1) - 0.5) * side.spread.width : 0, rank: 0, index: i, wait: WAIT_MIN_MS + hash(`${seed}:${i}:w`) * WAIT_SPAN_MS, phase: hash(`${seed}:${i}:p`) });
    return out;
  }
  // A hollow square (Coleto, 2026-09-25): four faces of three ranks, each facing outward, the front rank outermost. `out` is the
  // way the man faces in the side's frame, so each face fires outward on its own.
  if (style === 'square') {
    const per = Math.max(1, Math.ceil(n / 12));
    for (let i = 0; i < n; i++) {
      const face = i % 4, rank = Math.floor(i / 4) % 3, file = Math.floor(i / 12);
      const reach = SQUARE.outer - rank * SQUARE.rank, t = (file - (per - 1) / 2) * SQUARE.across + (hash(`${seed}:${i}:j`) - 0.5) * 0.003;
      const out1 = [{ along: 1, across: 0 }, { along: 0, across: 1 }, { along: 0, across: -1 }, { along: -1, across: 0 }][face];
      out.push({ along: out1.along ? out1.along * reach : t, across: out1.across ? out1.across * reach : t, rank, index: i, out: out1, face });
    }
    return out;
  }
  if (['ranks', 'mounted', 'column', 'wall'].includes(style)) {
    const spec = LAYOUT[style];
    const ranks = style === 'column' ? Math.ceil(n / 4) : style === 'wall' ? 1 : n > 30 ? 3 : 2;
    const perRank = Math.ceil(n / ranks);
    for (let i = 0; i < n; i++) {
      const rank = style === 'column' ? i % 4 : Math.floor(i / perRank), file = style === 'column' ? Math.floor(i / 4) : i % perRank;
      // A side forming in haste (`ragged`) stands in uneven ranks: San Jacinto's Mexican units behind the breastwork.
      const jitter = (hash(`${seed}:${i}:j`) - 0.5) * (side.ragged ? 0.016 : 0.003);
      // A column runs along the line of march; a rank runs across it.
      out.push(style === 'column'
        ? { along: -file * spec.rank + jitter, across: (rank - 1.5) * spec.across, rank: 0, index: i }
        : { along: -rank * spec.rank + jitter, across: (file - (perRank - 1) / 2) * spec.across + jitter, rank, index: i });
    }
    return out;
  }
  // Loose, bank, street and rout: scattered through an area with a minimum gap, no two figures on one spot, no rows.
  const spec = LAYOUT[style] || LAYOUT.loose;
  const width = side.spread?.width ?? spec.width, depth = side.spread?.depth ?? spec.depth;
  // A part huddled in a small place - eight men round a fire, a house's men at its door - keeps its men apart by what the
  // place allows, so every one of them is drawn; so does a small party given its own ground (the Alamo's plaza after the wall
  // fell). Everything else keeps the style's own gap, as it always has.
  const gap = side.part ? Math.min(spec.gap, 0.6 * Math.sqrt(width * depth * 0.6 / Math.max(1, n)))
    : side.spread ? Math.min(spec.gap, 0.6 * Math.sqrt(width * depth / Math.max(1, n))) : spec.gap;
  for (let i = 0, tries = 0; out.length < n && tries < n * 40; tries++) {
    const a = hash(`${seed}:${tries}:a`), b = hash(`${seed}:${tries}:b`);
    // Thicker toward the middle and the front, thinner at the ends: men bunch behind the best cover, not in a grid.
    const across = (a - 0.5) * width * (0.7 + 0.6 * b), along = -Math.pow(b, 1.4) * depth;
    if (out.some(o => Math.hypot(o.along - along, o.across - across) < gap)) continue;
    out.push({ along, across, rank: 0, index: i++, kneel: hash(`${seed}:${tries}:k`) < (style === 'bank' ? 0.6 : 0.3), wait: WAIT_MIN_MS + hash(`${seed}:${tries}:w`) * WAIT_SPAN_MS, phase: hash(`${seed}:${tries}:p`),
      ...(side.style === 'camp' && { rest: hash(`${seed}:${tries}:r`) < 0.35 ? 'sit' : 'stand' }) });
  }
  return out;
}
/** One layout per side, style, count and ground: a force gathered close at night is not laid out as the line at dawn. */
const layoutKey = side => side.part
  ? `${side.key}:${FORMED.includes(side.style) ? side.style : 'scatter'}:${side.drawn}:${side.spread?.width ?? ''}:${side.spread?.depth ?? ''}`
  : `${side.key && side.key !== side.side ? `${side.key}:` : ''}${side.side}:${side.style}:${side.drawn}:${side.spread?.width ?? ''}:${side.spread?.depth ?? ''}${side.ragged ? ':r' : ''}`;
/** The styles laid out in files and ranks; every other is scattered. */
const FORMED = Object.freeze(['ranks', 'mounted', 'column', 'wall']);
/**
 * Every body the page draws: each side, and each group drawn apart from its side (sim/battle-stage.mjs `phase.groups`: Béxar's
 * divisions in their houses, men on a roof, a file under the loopholes, the townspeople let out of a breached house). A
 * side's key is its side; a group's is `g:` and its id.
 */
const bodiesOf = battle => [
  // A side drawn in parts (§6.13: Johnson's men on the square and in three houses, the dragoons in two groves) is drawn as its
  // parts, each a body keyed as a group is, so a member's unit, a fall's unit and the layout all find it the same way.
  ...battle.sides.flatMap(side => side.parts?.length
    ? side.parts.map(part => ({ ...part, side: side.side, name: side.name, mounted: side.mounted, dismounted: side.dismounted, part: true, key: `g:${part.id}` }))
    : [{ ...side, key: side.side }]),
  ...(battle.groups || []).map(group => ({ ...group, key: `g:${group.id}` })),
];
/**
 * Who the townspeople are drawn as, in turn: Béxar's own women, children and men (never soldiers), each [figure, size, the
 * library figure drawn while that sheet has not loaded, its size].
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the storming of Béxar", item 6, and request 2026-09-27 (Béxar before
 * the bell), item 2 - Claude-drawn stand-ins `bexar-woman`, `bexar-boy`, `bexar-man`, `bexar-girl`; the settlers' sheets behind them.
 */
const TOWNSFOLK = [['bexar-woman', 0.95, 'rust-woman', 0.95], ['bexar-boy', 0.68, 'smallchild', 0.62], ['bexar-man', 0.95, 'elder', 0.95], ['bexar-girl', 0.68, 'indigo', 0.95]];
/** A figure's place on the ground from its slot: the side's centre, turned to face the way the side faces. */
const onGround = (centre, facing, slot) => ({
  x: centre.x + facing.x * slot.along - facing.y * slot.across,
  y: centre.y + facing.y * slot.along + facing.x * slot.across,
});
/** How hollow a set of points stands: the nearest to their middle over the mean distance from it (0 solid, 1 a ring). */
export function hollowness(points) {
  if (points.length < 4) return null;
  const c = points.reduce((s, p) => ({ x: s.x + p.x / points.length, y: s.y + p.y / points.length }), { x: 0, y: 0 });
  const d = points.map(p => Math.hypot(p.x - c.x, p.y - c.y)), mean = d.reduce((s, v) => s + v, 0) / d.length;
  return mean ? Math.min(...d) / mean : null;
}
/** How regular a set of screen points is: the spread of each one's distance to its nearest neighbour over the mean. */
export function regularity(points) {
  if (points.length < 3) return null;
  const nearest = points.map((p, i) => Math.min(...points.filter((_, j) => j !== i).map(q => Math.hypot(p.x - q.x, p.y - q.y))));
  const mean = nearest.reduce((s, d) => s + d, 0) / nearest.length;
  const sd = Math.sqrt(nearest.reduce((s, d) => s + (d - mean) ** 2, 0) / nearest.length);
  return mean ? sd / mean : null;
}

/**
 * The renderer. `art` is what app.js already draws with: `animated(ctx, clip, x, y, size, seed, options)` (returns 0 when a
 * clip is not loaded), `drawSprite`, `miniPerson` for the fallback figure, and `clipReady` (public/art.js) - whether a
 * Claude-drawn clip can be drawn now, the one test public/app.js `drawnClipOf` also makes - where a figure has a `fallback`.
 */
export function createBattleView(art) {
  const view = {
    key: null, minute: null, tickAt: 0, tickMs: 1000, sides: new Map(), layouts: new Map(),
    smoke: [], banks: [], smokeLayer: null, flashes: [], thumps: [], shotsSeen: new Set(), linesSeen: new Map(), commandsAt: 0, fallenAt: new Map(),
    members: new Map(), memberSpots: new Map(), bubbles: [], cannonFiredAt: [], frameMs: [], evidence: null,
    // Each gun's shots as the page first saw them, a breach's moment of opening, a member's fall: all in the page's time.
    gunFiredAt: new Map(), breachAt: new Map(), memberFallAt: new Map(), skew: 0,
    // Where a man who fell or put his hands up stands (San Jacinto): pinned to the ground where it happened, so the dead do not
    // slide along with a side that runs on past them.
    pins: new Map(),
    // Where each sampled man fell, and whose he was, so he lies there after his side has moved on or gone (Concepción).
    fallenSide: new Map(), fallenFigure: new Map(),
    // Presentation evidence across frames, read by scripts/battle-gonzales-browser-proof.mjs and by nothing in the page.
    shotsTotal: 0, shotsBy: {}, linesShown: new Set(), memberClips: new Set(),
    loopholeShots: 0, gunShotsTotal: 0, gunShotsBy: {}, peopleFellAt: new Map(), peopleSpots: {}, peopleShown: new Set(), peopleFirst: new Map(), civiliansSeen: 0, breachesSeen: new Set(), namedFalls: new Set(), unitsSeen: new Set(),
    // §6.13: where each fallen figure went down (he lies there while his part moves on), and the herd.
    fallenSpots: new Map(), herd: null,
    // Joe's shots from the house he took cover in, each fired once (a flash and a puff at its door).
    hiddenShots: new Set(),
    cartTipStartedAt: null,
  };
  // Texian mounted units use volunteer riding art; named riders keep their own sheets.
  // A company given the figure `rider` (the Alamo's Gonzales men riding in) is drawn the same.
  const figureOf = (side, slot) => side.figure === 'rider' ? 'rider' : side.side === 'mexican'
    ? (side.style === 'mounted' && !(slot.rank < (side.dismounted || 0)) ? 'dragoon' : 'regular')
    : side.mounted && side.pose !== 'surrender' && side.style !== 'camp' ? 'rider' : 'volunteer';

    /** Whether a point of the field is in a marsh or open water the battle lays down (`works`, drawn by `drawWorks` in the same ellipse). */
  const inWater = (battle, point) => (battle.works || []).some(work => {
    if (work.kind !== 'marsh' && work.kind !== 'water') return false;
    const across = work.across || { x: 1, y: 0 }, toward = { x: across.y, y: -across.x }, dx = point.x - work.x, dy = point.y - work.y;
    const t = (dx * across.x + dy * across.y) / (work.width * 0.5), d = (dx * toward.x + dy * toward.y) / (work.width * 0.275);
    return t * t + d * d <= 1;
  });

  /** A new tick of the battle: remember where each side was drawn, so it walks from there to the new place. */
  function accept(battle, now, tickMs) {
    const key = `${battle.id}`;
    if (view.key !== key) {
      view.key = key; view.sides.clear(); view.smoke = []; view.banks = []; view.flashes = []; view.thumps = []; view.shotsSeen.clear(); view.linesSeen.clear(); view.fallenAt.clear(); view.cannonFiredAt = [];
      view.gunFiredAt.clear(); view.breachAt.clear(); view.memberFallAt.clear(); view.peopleFellAt.clear(); view.fallenSpots.clear(); view.fallenSide.clear(); view.fallenFigure.clear(); view.herd = null; view.pins.clear();
      view.cartTipStartedAt = null;
      view.minute = null;
    }
    if (battle.minute === view.minute) return;
    const previousMinute = view.minute;
    view.tickMs = Math.max(200, tickMs || 1000);
    for (const side of bodiesOf(battle)) {
      const was = view.sides.get(side.key);
      const drawnAt = was ? placeAt(was, now) : { x: side.x, y: side.y };
      view.sides.set(side.key, { ...side, from: drawnAt, to: { x: side.x, y: side.y }, at: now, duration: previousMinute === null ? 0 : view.tickMs });
    }
    // A side drawn in parts is still a side: its own place kept too, for its facing, its officer's words and the gun.
    for (const side of battle.sides.filter(one => one.parts?.length)) {
      const was = view.sides.get(side.side);
      const drawnAt = was ? placeAt(was, now) : { x: side.x, y: side.y };
      view.sides.set(side.side, { ...side, key: side.side, from: drawnAt, to: { x: side.x, y: side.y }, at: now, duration: previousMinute === null ? 0 : view.tickMs });
    }
    if (battle.herd) {
      const herdAt = view.herd ? placeAt(view.herd, now) : { x: battle.herd.x, y: battle.herd.y };
      view.herd = { ...battle.herd, from: herdAt, to: { x: battle.herd.x, y: battle.herd.y }, at: now, duration: previousMinute === null ? 0 : view.tickMs };
    } else view.herd = null;
    // Words and shots dated inside the tick that just ended are given the real moment of the tick they fell in, so a line
    // said at the fourth minute of a five-minute tick is drawn four fifths of the way through it.
    const span = previousMinute === null ? 0 : Math.max(1, battle.minute - previousMinute);
    const when = minute => previousMinute === null ? now : now + clamp01((minute - previousMinute) / span) * view.tickMs * 0.9;
    for (const line of battle.lines || []) {
      if (view.linesSeen.has(line.id)) continue;
      // A page opened in the middle of a fight hears the latest line, not a speech of everything already said.
      if (previousMinute === null && line !== battle.lines.at(-1)) { view.linesSeen.set(line.id, { at: -Infinity, line }); continue; }
      view.linesSeen.set(line.id, { at: when(line.minute), line });
    }
    for (const shot of battle.cannon?.shots || []) {
      if (view.shotsSeen.has(shot)) continue;
      view.shotsSeen.add(shot);
      if (previousMinute !== null || shot === battle.minute) view.cannonFiredAt.push(when(shot));
    }
    for (const fall of battle.fallen || []) {
      const id = `${fall.unit || fall.side}:${fall.minute}`;
      if (!view.fallenAt.has(id)) view.fallenAt.set(id, { ...fall, at: previousMinute === null ? now - 60000 : when(fall.minute) });
    }
    // Each gun's shots, and each breach and each member's fall, at the real moment of the tick they were dated in.
    for (const gun of battle.guns || []) {
      const fired = view.gunFiredAt.get(gun.id) || [];
      for (const shot of gun.shots || []) {
        const seen = `gun:${gun.id}:${shot}`;
        if (view.shotsSeen.has(seen)) continue;
        view.shotsSeen.add(seen);
        if (previousMinute !== null || shot === battle.minute) fired.push(when(shot));
      }
      view.gunFiredAt.set(gun.id, fired.slice(-10));
    }
    for (const breach of battle.breaches || []) {
      const id = `${breach.x.toFixed(5)}:${breach.y.toFixed(5)}:${breach.at}`;
      if (!view.breachAt.has(id)) view.breachAt.set(id, { ...breach, openAt: previousMinute === null && breach.open ? now - 60000 : when(breach.at) });
    }
    for (const person of battle.people || []) if (Number.isFinite(person.fell) && !view.peopleFellAt.has(person.id)) view.peopleFellAt.set(person.id, previousMinute === null ? now - 60000 : when(person.fell));
    for (const [id, fate] of Object.entries(battle.memberFates || {})) {
      if (!view.memberFallAt.has(id)) view.memberFallAt.set(id, { ...fate, at: previousMinute === null ? now - 60000 : when(fate.minute) });
    }
    view.minute = battle.minute;
  }
  function placeAt(side, now) {
    const t = side.duration ? clamp01((now - side.at) / side.duration) : 1;
    return { x: lerp(side.from.x, side.to.x, t), y: lerp(side.from.y, side.to.y, t) };
  }

  /**
   * Smoke from one discharge, in miles on the ground so it stays put when the camera moves and drifts with the wind. Since
   * 2026-09-30 (owner: "more and more dramatic smoke plumes for weapons fire"; §16.3) a **plume**: thrown out of the muzzle the way
   * the piece points (`dir`) in a jet that slows as it billows, rising, bigger than the man who fired it; a gun's far bigger.
   */
  function puff(x, y, now, { big = false, wind, dir = 0, wall = false, plume = false } = {}) {
    const w = wind || { x: 0, y: 0 };
    view.smoke.push({
      x, y, born: now, life: big ? CANNON_SMOKE_LIFE_MS : SMOKE_LIFE_MS * (0.75 + 0.5 * Math.random()),
      // Miles a real millisecond: the wind's screen vector (public/weather-art.js `windVector`, y down the page as the
      // ground's y is), and the hot smoke rising up the page. A still fog morning barely moves it; a norther carries it off.
      vx: w.x * 2.2e-6 + (Math.random() - 0.5) * 2e-7, vy: w.y * 2.2e-6 - (big ? 3.2e-7 : 2.2e-7) - Math.random() * 1e-7,
      // The jet: how far out of the muzzle the plume is thrown (miles), spent in its first second.
      jet: dir * (big ? 0.05 : 0.024) * (0.8 + 0.4 * Math.random()), jetUp: (big ? 0.012 : 0.006) * (0.6 + 0.8 * Math.random()),
      size0: big ? 2.6 : 1.1, size1: big ? 11 : 5 + Math.random() * 2.4, alpha: big ? 0.62 : 0.64, scale: view.smokeScale ?? 1,
      seed: Math.random(),
    });
    if (view.smoke.length > SMOKE_CAP) view.smoke.splice(0, view.smoke.length - SMOKE_CAP);
    // A gun's discharge is four big puffs into one bank: a whole bank of smoke a shot. A volley's men's into a wall along the rank.
    feedBank(x + dir * (big ? 0.03 : 0.014), y, big ? 1.3 : wall ? 1.0 : 0.85, now, w, big, wall);
  }
  /**
   * Feed the bank of smoke lying where a shot was fired: the nearest bank within reach thickens (its middle drawn a little toward
   * the new shot), or a new one begins there. Ground miles, so it stays put when the camera moves.
   */
  function feedBank(x, y, amount, now, w, big, wall = false) {
    settleBanks(now);
    const reach = BANK_MERGE_MILES * (view.smokeScale ?? 1) * (big ? 1.6 : 1);
    let near = null, best = Infinity;
    for (const bank of view.banks) { const d = Math.hypot(bank.x - x, bank.y - y); if (d < reach && d < best) { best = d; near = bank; } }
    if (!near && view.banks.length >= BANK_CAP) for (const bank of view.banks) { const d = Math.hypot(bank.x - x, bank.y - y); if (d < best) { best = d; near = bank; } }
    if (near) {
      const share = amount / (near.d + amount);
      near.x += (x - near.x) * share * 0.5; near.y += (y - near.y) * share * 0.5;
      near.d = Math.min(BANK_MAX, near.d + amount); near.fed = now; near.shots++; near.big ||= big; near.wall ||= wall;
      return;
    }
    view.banks.push({
      x, y, d: amount, born: now, fed: now, at: now, shots: 1, big, wall, seed: Math.random(), scale: view.smokeScale ?? 1,
      // Heavier than a fresh puff and hugging the ground: carried by the wind a little slower, hardly rising.
      vx: w.x * 1.7e-6 + (Math.random() - 0.5) * 1.2e-7, vy: w.y * 1.7e-6 - 0.5e-7,
    });
  }
  /** Every bank drifts on the wind and thins by the time since it was last settled; one too thin to see is gone. */
  function settleBanks(now) {
    for (const bank of view.banks) {
      const dt = now - bank.at;
      if (!(dt > 0)) continue;
      bank.at = now; bank.x += bank.vx * dt; bank.y += bank.vy * dt;
      bank.d *= Math.exp(-dt / (bank.big ? CANNON_BANK_FADE_MS : BANK_FADE_MS));
    }
    if (view.banks.some(bank => bank.d <= BANK_GONE)) view.banks = view.banks.filter(bank => bank.d > BANK_GONE);
  }
  function flash(x, y, facingRight, now, size) { view.flashes.push({ x, y, right: facingRight, born: now, size }); }

  /**
   * The pose a family's person in the force is drawn in this frame, or null for anybody not in it: the same own-pace cycle
   * as the Texians round them. app.js asks this before it draws the person, and draws them in it.
   * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "a family's own people firing" - a family's person in the force is
   * drawn in the volunteer militia's firing cycle, not in their own cast figure, until each cast has an aim/fire/load set.
   */
  function memberPose(entity, time) {
    const member = view.members.get(entity.id);
    if (!member) return null;
    const pose = poseOf(member, time);
    view.memberClips.add(pose.clip || pose.sprite);
    return pose;
  }
  function poseOf(member, time) {
    const side = view.sides.get(member.unit || 'texian') || view.sides.get('texian');
    // In a square each man faces out of his own face of it (`member.right`); elsewhere the way his body of men faces.
    const right = member.right ?? ((side?.facing?.x ?? 1) >= 0);
    // A family's own person hit at the moment the server staged (docs/BATTLES.md §2.6): down and lying still if killed, sitting
    // hurt and carried off if wounded, a slight wound up again after a while. No blood, no gore (VISION.md §16).
    const fell = view.memberFallAt.get(member.id), since = fell ? time + view.skew - fell.at : -1;
    // Taken (San Patricio, Agua Dulce): hands up from that moment. Got away: as the men round him are.
    if (fell && since >= 0 && fell.fate === 'captured') return { clip: 'volunteer-surrender', timeMs: time };
    // Ran from the field (the Grass Fight): going the other way, away from the enemy.
    if (fell && since >= 0 && fell.fate === 'ran') return { clip: 'volunteer-march', flip: right, timeMs: time };
    // `cast`: the same pose in the person's own cast figure (Claude's `<cast>-fire-reload`, `-load`, `-injured`, `-reclining`),
    // which public/app.js draws for a person with an appearance where it exists.
    if (fell && since >= 0 && fell.fate !== 'escaped') {
      // Struck and staggering for two seconds before he goes down (§16.1: a man falls over seconds, not a frame).
      if (fell.fate === 'killed') return { sprite: since < FALL.down ? 'volunteer-injured' : 'volunteer-reclining', cast: since < FALL.down ? 'injured' : 'reclining', flip: !right, still: true, fallen: true };
      if (fell.grade !== 'slight' || since < 20000) return { sprite: 'volunteer-injured', cast: 'injured', flip: !right, still: true, fallen: true };
    }
    // His part's own pose (§6.13): asleep by the fire, hands up, or riding with Grant's party.
    if (member.pose === 'asleep') return { sprite: 'volunteer-reclining', still: true };
    if (member.pose === 'surrender') return { clip: 'volunteer-surrender', timeMs: time };
    if (member.mounted) return { clip: 'volunteer-ride-e', flip: !right, timeMs: time, scale: 1.35 };
    if (!member.firing) return { clip: member.moving ? 'volunteer-march' : right ? 'volunteer-idle-e' : 'volunteer-idle-w', flip: member.moving ? !right : false, timeMs: time };
    const cycle = MUSKET_MS + member.wait, t = (time + member.offset) % cycle;
    if (t < member.wait) return { sprite: member.kneel ? 'volunteer-load' : right ? 'volunteer-e' : 'volunteer-w', ...(member.kneel && { cast: 'load' }), flip: member.kneel ? !right : false, still: true };
    return { clip: 'volunteer-fire-reload', cast: 'fire-reload', flip: !right, timeMs: musketClip(t - member.wait) };
  }
  /**
   * Where a man of a body stands: where the layout puts him, or - once he has put his hands up - where he was then, pinned to
   * the ground while his body keeps its layout (San Jacinto: men giving up stand where they gave up while their side runs on).
   * A man who falls after giving up falls there. The fallen themselves are held where they fell by `fallenSpots`, one rule for
   * every body since the merge of 2026-09-26 (two rules for the same thing hid each other's regressions).
   */
  function pinnedAt(key, place, hands, layout, down) {
    const pin = view.pins.get(key);
    if (hands) {
      if (pin && pin.layout === layout) return pin;
      view.pins.set(key, { x: place.x, y: place.y, layout });
      return place;
    }
    if (pin && down) return pin;
    if (pin) view.pins.delete(key);
    return place;
  }
  /** Where app.js drew a member this frame, on the ground: the next shot's smoke comes from there. */
  function memberDrawn(id, ground, sizePx) { view.memberSpots.set(id, { ...ground, sizePx }); }

  /**
   * Draw one frame of the battle. `camera` is `{ toScreen, figure, scale }`; `time` the page's animation clock; `now` the
   * frame's performance.now(); `wind` the day's wind vector where the fight is (public/weather-art.js `weatherMix`).
   */
  function draw(ctx, battle, { camera, time, now, tickMs, wind = null, reducedMotion = false, paused = false, bounds = null, named = false, clear = null }) {
    const started = performance.now();
    // Held still: nothing new is fired and no cycle moves, for somebody who asked for less motion or a class the Host paused.
    const still = reducedMotion || paused;
    // The same, under a name the figure loop below does not shadow with its own `still` (a figure held in one frame): until
    // 2026-09-30 the loop's shots read the figure's and a man fired, flash and smoke, on a page that had asked for less motion.
    const holding = still;
    if (!battle) {
      view.key = null; view.members.clear(); view.evidence = null;
      // The fight over and gone from the map, its smoke is not: it lies on the empty field and thins away (§16.3), so the class
      // view's film holds on the smoke clearing. Nothing else of the fight is drawn.
      if ((view.banks.length || view.smoke.length) && camera) drawSmoke(ctx, camera, Math.max(7, Math.min(60, camera.figure * 0.95)), now, reducedMotion, bounds, null, []);
      return null;
    }
    accept(battle, now, tickMs);
    if (battle.id === 'coleto' && battle.phase === 'small-hours') view.cartTipStartedAt ??= now;
    else view.cartTipStartedAt = null;
    // How big smoke is drawn against a figure (`battle.smokeScale`): a fight in a small place, seen close, keeps its smoke to
    // the size of the ground it is on rather than to the figures, which are drawn larger than life (PERSON_MILES).
    view.smokeScale = battle.smokeScale ?? 1;
    // The page's animation clock and the frame's own clock differ; a member's fall is kept in the frame's.
    view.skew = now - time;
    const figurePx = Math.max(7, Math.min(60, camera.figure * 0.95));
    const drawn = { texian: [], mexican: [] }, drawnBy = {};
    let flashes = 0, shots = 0;
    const fallenSlots = fallenBySide(battle, now);
    const bodies = bodiesOf(battle), bodyOf = unit => bodies.find(body => body.key === (unit === 'texian' || unit === 'mexican' ? unit : `g:${unit}`));
    // Members first, so the sampled figures give them room: nothing sampled is drawn on a family's person.
    view.members.clear();
    const texianSide = battle.sides.find(side => side.side === 'texian');
    for (const id of battle.members || []) {
      // The unit the member stands in (Béxar's division, the Greys' file), or the Texian side: posed by its fire.
      const unit = battle.memberUnits?.[id], body = unit ? bodyOf(unit) : null;
      const force = body || texianSide;
      const pose = force?.pose && force.pose !== 'stand' ? force.pose : force?.style === 'camp' ? 'asleep' : 'stand';
      view.members.set(id, {
        id, unit: body?.key || null, pose, mounted: Boolean(texianSide?.mounted) && pose !== 'surrender' && pose !== 'asleep',
        firing: ['scattered', 'volley', 'picket'].includes(force?.fire) && force.action !== 'gone' && !['asleep', 'surrender'].includes(pose),
        moving: body ? Boolean(body.moving) : ['advance', 'withdraw', 'follow'].includes(texianSide?.action),
        wait: WAIT_MIN_MS + hash(`${id}:w`) * WAIT_SPAN_MS, offset: hash(`${id}:o`) * 20000, kneel: hash(`${id}:k`) < 0.3,
        // In a square, out of his own face: east of its middle faces east (where app.js drew him last frame).
        ...(force?.style === 'square' && view.memberSpots.get(id) && view.sides.get(body?.key || 'texian') && { right: view.memberSpots.get(id).x >= placeAt(view.sides.get(body?.key || 'texian'), now).x }),
      });
    }
    // Members fire on their own cycle; their shot is spawned from where app.js drew them. A member who has fallen does not.
    for (const [id, member] of view.members) {
      const spot = view.memberSpots.get(id);
      const fell = view.memberFallAt.get(id);
      if (fell && now >= fell.at && fell.fate !== 'ran' && (fell.fate === 'killed' || fell.grade !== 'slight' || now - fell.at < 20000)) {
        // Two comrades carry a wounded man back, as the record's fallen are carried (stand-in, as `drawFallen`'s).
        if (spot && fell.fate === 'wounded' && !still) { const p = camera.toScreen(spot); for (const off of [-0.5, 0.5]) art.animated(ctx, 'volunteer-march', p.x + off * figurePx, p.y + 2, figurePx, `${id}:carry:${off}`, { timeMs: time }); }
        continue;
      }
      if (!spot || !member.firing || still) continue;
      const cycle = MUSKET_MS + member.wait, t = (time + member.offset) % cycle, shotAt = member.wait + SHOT_AT;
      const key = `${id}:${Math.floor((time + member.offset) / cycle)}`;
      if (t >= shotAt && t < shotAt + 400 && !view.shotsSeen.has(key)) {
        view.shotsSeen.add(key);
        const right = member.right ?? (((member.unit ? view.sides.get(member.unit) : texianSide)?.facing?.x ?? 1) >= 0);
        puff(spot.x + (right ? 1 : -1) * 0.012, spot.y - 0.006, now, { wind, dir: right ? 1 : -1 });
        flash(spot.x + (right ? 1 : -1) * 0.012, spot.y, right, now, 1); shots++;
      }
    }
    const memberPoints = [...view.memberSpots.entries()].filter(([id]) => view.members.has(id)).map(([, spot]) => spot);

    // What stands on the ground, under the men: the breastwork, the camps' fires, the marsh and the lake.
    const worksDrawn = drawWorks(ctx, battle, camera, figurePx, still ? 0 : time, bounds);
    const figures = [];
    let civilians = 0, surrendering = 0;
    // The houses, the fire and the groves the fight is among, behind everybody, and the herd (§6.13).
    const sceneryDrawn = drawScenery(ctx, battle, camera, figurePx, time);
    const herdDrawn = drawHerd(ctx, camera, figurePx, time, now);
    const poses = { asleep: 0, hidden: 0, surrender: 0, rider: 0 };
    const offScreen = point => bounds && (point.x < -90 || point.y < -90 || point.x > bounds.width + 90 || point.y > bounds.height + 140);
    for (const side of bodies) {
      const shown = view.sides.get(side.key);
      if (side.ladders && side.action !== 'gone' && shown) drawLadders(ctx, side, placeAt(shown, now), side.facing, camera, figurePx, time);
      const centre = placeAt(shown, now);
      const key = layoutKey(side);
      if (!view.layouts.has(key)) view.layouts.set(key, layoutSide(side));
      const slots = view.layouts.get(key);
      const facing = side.facing, sideRight = facing.x >= 0;
      const volley = side.fire === 'volley';
      drawnBy[side.key] = [];
      if (side.key !== side.side) view.unitsSeen.add(side.key);
      // The rank whose turn it is, and where in the officer's cycle the rank stands.
      const cycleAt = (time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS) % VOLLEY_MS, cycleNo = Math.floor((time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS) / VOLLEY_MS);
      const ranks = Math.max(1, ...slots.map(slot => slot.rank + 1));
      const firingRank = cycleNo % Math.min(ranks, side.dismounted ? Math.max(1, side.dismounted) : ranks);
      // A square fires by faces in turn, a quarter of the cycle apart, each face by its ranks: a rolling fire all round it, not
      // one rank of the whole square at a time.
      const faceCycle = slot => {
        const shifted = time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS + slot.face * VOLLEY_MS / 4, no = Math.floor(shifted / VOLLEY_MS);
        return { at: shifted % VOLLEY_MS, no, rank: no % ranks };
      };
      // The carts inside Coleto's square (`HIST-TEX-515`): tipped into the barricade during the small hours.
      if (side.style === 'square' && side.action !== 'gone') {
        const tipping = battle.id === 'coleto' && battle.phase === 'small-hours';
        const tipped = battle.id === 'coleto' && ['before-dawn', 'guns', 'surrender'].includes(battle.phase);
        for (const [along, across, flipCart] of [[0.012, -0.018, false], [-0.02, 0.014, true], [0.024, 0.026, false]]) {
          const cart = camera.toScreen(onGround(centre, facing, { along, across }));
          if (!offScreen(cart)) figures.push({ y: cart.y, kind: 'cover', point: cart, sprite: tipped ? 'cart-tipped' : 'cart-baggage',
            clip: tipping ? 'cart-baggage-tip' : null, timeMs: tipping ? now - view.cartTipStartedAt : 0, size: figurePx * 1.25, flip: flipCart });
        }
      }
      const fallen = fallenSlots.get(side.key) || new Map();
      // Behind a street's palisade or a breastwork of sandbags: the cover drawn in front of the men.
      // Astra's `barricade-street-embrasure` (ditch, bank, posts, a gun's embrasure) and `sandbag-breastwork` (2026-10-03), at
      // the existing cover positions; the library's palisade and sacks only while her sheet loads.
      if (['barricade', 'sandbags'].includes(side.cover) && side.action !== 'gone') {
        const front = camera.toScreen({ x: centre.x + facing.x * 0.012, y: centre.y + facing.y * 0.012 });
        const barricade = side.cover === 'barricade';
        if (!offScreen(front)) figures.push({ y: front.y + 1, kind: 'cover', point: front, sprite: barricade ? 'barricade-street-embrasure' : 'sandbag-breastwork', size: figurePx * (barricade ? 0.9 : 0.7),
          fallback: { sprite: barricade ? 'palisade' : 'sacks', size: figurePx * (barricade ? 2.2 : 1.5) }, flip: !sideRight });
      }
      const pose = side.pose && side.pose !== 'stand' ? side.pose : side.style === 'camp' ? 'asleep' : 'stand';
      for (const slot of slots) {
        const seedKey = `${side.key}:${slot.index}`;
        const down = fallen.get(slot.index);
        // Hands up: a share of a broken side stands where it gave up (`surrendering`), and stays there while the side runs on.
        const hands = !down && side.surrendering > 0 && hash(`${side.key}:${slot.index}:s`) < side.surrendering;
        // A body's surrendering stay where they gave up while it runs on (San Jacinto, §8)...
        const at = pinnedAt(seedKey, onGround(centre, facing, slot), !side.part && hands, key, down);
        // ...and a man who fell lies where he fell, whatever his side or part does after, and after it has left the field
        // (§6.13, §8, Concepción's Coleman's men crossed over): the spot is kept, and whose he was, for when his body is gone.
        if (down && !view.fallenSpots.has(seedKey)) view.fallenSpots.set(seedKey, at);
        const ground = down ? view.fallenSpots.get(seedKey) : at;
        if (down) view.fallenSide.set(side.key, side.side);
        // A family's person stands in for the sampled man nearest them: on a wall of a given length (the Alamo's), where men
        // stand a few yards apart, only the one they are standing in is given up.
        if (!down && memberPoints.some(m => Math.hypot(m.x - ground.x, m.y - ground.y) < (side.style === 'wall' && side.spread?.width ? 0.004 : 0.014))) continue;
        const kind = figureOf(side, slot);
        if (down) view.fallenFigure.set(seedKey, kind);
        const point = camera.toScreen(ground);
        if (offScreen(point)) continue;
        // On a flat roof behind its parapet: drawn standing up on the house, not in the street below it.
        if (side.cover === 'roof') point.y -= figurePx * 0.5;
        // Lying in the grass: Coleto's marksmen at night (Astra's prone marksman, 2026-10-03), and any part the battle puts in
        // the tall grass (`cover: 'grass'`).
        const prone = kind === 'regular' && (side.cover === 'grass' || (battle.id === 'coleto' && ['dusk', 'night', 'small-hours'].includes(battle.phase) && side.side === 'mexican' && side.style === 'loose'));
        let size = prone ? figurePx * 0.35 : kind === 'dragoon' || kind === 'rider' ? figurePx * 1.35 : figurePx;
        const seed = seedKey;
        // Which way this man faces: out of his face of a square, or the way his body of men faces.
        const right = slot.out ? (facing.x * slot.out.along - facing.y * slot.out.across) >= 0 : sideRight;
        let clip = null, sprite = null, timeMs = time, flip = !right, still = false, dy = 0, prefer = null;
        if (down) {
          // A wounded man went with his side when it left the field.
          if (down.wounded && side.action === 'gone') continue;
          // Falling, then lying still: no blood, no gore (VISION.md §16), and carried off once the fighting is over.
          // Hurt inside a square, he is helped in among the carts, not back from a line that faces every way.
          figures.push({ y: point.y, kind: 'fallen', figure: kind, side: side.side, point, size: figurePx, down, slot, ground, facingRight: right, ...(side.style === 'square' && { inward: camera.toScreen(centre) }) });
          continue;
        }
        if (side.action === 'gone') continue;
        const moving = Boolean(side.moving);
        // Shut in a house (§6.13): nobody drawn; each man's shot a flash and a puff at the door or a window, on his own reload,
        // counted apart (`houses`) so a proof can tell the house's own fire from the men in the open.
        if (pose === 'hidden') {
          poses.hidden++;
          if (holding || side.fire === 'none') continue;
          const wait = WAIT_MIN_MS + hash(`${seed}:hw`) * WAIT_SPAN_MS, round = MUSKET_MS + wait, shifted = time + hash(`${seed}:hp`) * 20000;
          const inRound = shifted % round, houseKey = `${seed}:h${Math.floor(shifted / round)}`;
          if (inRound >= wait + SHOT_AT && inRound < wait + SHOT_AT + 400 && !view.shotsSeen.has(houseKey)) {
            view.shotsSeen.add(houseKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1; view.shotsBy.houses = (view.shotsBy.houses || 0) + 1;
            const door = { x: centre.x + facing.x * 0.012 + (slot.across || 0) * 0.35, y: centre.y + facing.y * 0.012 + (slot.along || 0) * 0.2 };
            puff(door.x + (right ? 1 : -1) * 0.004, door.y - 0.008, now, { wind, dir: right ? 1 : -1 }); flash(door.x, door.y - 0.004, right, now, 0.8);
          }
          continue;
        }
        if (pose === 'asleep') {
          // Asleep on the ground by the fire, his head on his pack. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "San
          // Jacinto", item 2 - Claude's `*-sleep` (never to be mistaken for a man killed); the library's rolled-in-a-blanket
          // `volunteer-reclining` while it loads.
          poses.asleep++;
          // At the soldier's own size: Astra's sleeping men (`military-camp-life`) are measured against the man standing
          // (scripts/build-atlas-manifest.mjs FIGURE_HEIGHTS, 2026-10-04), so a man lying down draws 0.40 of him (0.35 a
          // regular in his shako). Until then the sheet was measured from its seated men, and x0.7 here guessed it back.
          figures.push({ y: point.y, kind, side: side.side, point, size: figurePx, clip: `${side.side === 'mexican' ? 'regular' : 'volunteer'}-sleep`, sprite: null, fallback: { sprite: 'volunteer-reclining', size: figurePx }, timeMs, flip: slot.index % 2 === 0, still: true, seed });
          drawnBy[side.key].push(point); if (side.key === side.side || side.part) drawn[side.side].push(point);
          continue;
        }
        if (pose === 'surrender') {
          poses.surrender++;
          figures.push({ y: point.y, kind, side: side.side, point, size: figurePx, clip: `${side.side === 'mexican' ? 'regular' : 'volunteer'}-surrender`, sprite: null, timeMs: time + slot.index * 137, flip: false, still: false, seed });
          drawnBy[side.key].push(point); if (side.key === side.side || side.part) drawn[side.side].push(point);
          continue;
        }
        if (kind === 'rider') {
          // A man on horseback: riding, and his shot from where his hands are, as a dragoon's is.
          poses.rider++;
          // A Texian horseman (Sherman's party, Lamar's sixty-one, Deaf Smith's companions, Grant's party) is Astra's mounted
          // volunteer (2026-10-03): riding or standing by the heading, and her east/west firing transition at the shot; anyone
          // else on horseback, and a Texian while her sheet loads, the library's mounted courier.
          const volunteer = side.side === 'texian';
          const dir = Math.abs(facing.y) > Math.abs(facing.x) * 1.2 ? (facing.y >= 0 ? 's' : 'n') : 'e';
          const rider = { y: point.y, kind, side: side.side, point, size,
            clip: volunteer ? moving ? `volunteer-ride-${dir}` : null : 'mounted-courier-e',
            sprite: volunteer && !moving ? `volunteer-mounted-idle-${dir}` : null,
            timeMs: time, flip: volunteer ? dir === 'e' && !right : !right, still: false, seed,
            ...(volunteer && { fallback: { clip: 'mounted-courier-e', flip: !right } }) };
          figures.push(rider);
          if (!holding && (side.fire === 'scattered' || (side.fire === 'picket' && slot.index % 4 === 0))) {
            const wait = 7000 + hash(`${seed}:rw`) * 12000, shifted = time + hash(`${seed}:rp`) * 25000, t = shifted % wait;
            const shotKey = `${seed}:r${Math.floor(shifted / wait)}`;
            if (t < 400 && !view.shotsSeen.has(shotKey)) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.014, y: ground.y - 0.012 };
              puff(muzzle.x, muzzle.y, now, { wind, dir: right ? 1 : -1 }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
            // Astra's east/west firing transition (idle 300ms, fire 400ms, idle 300ms): raised the moment before the shot, the
            // discharge frame for the 400ms the flash is drawn, then lowered.
            if (volunteer && (t < 700 || wait - t < 300)) Object.assign(rider, { clip: 'volunteer-mounted-fire-cycle', sprite: null, timeMs: t < 700 ? t + 300 : 300 - (wait - t), flip: !right });
          }
          drawnBy[side.key].push(point); if (side.key === side.side || side.part) drawn[side.side].push(point);
          continue;
        }
        // The people of the town, let out of a house the men broke into: women, children and old men walking away unhurt. They
        // never fire and are never drawn falling (sim/battle-stage.mjs `checkEngagement`; `HIST-TEX-043`).
        // The Grass Fight's existing pack-train projection now uses grass-laden mules.
        if (side.figure === 'packhorse') {
          const mule = battle.id === 'grass-fight';
          const dir = Math.abs(facing.y) > Math.abs(facing.x) * 1.2 ? (facing.y >= 0 ? 's' : 'n') : 'e';
          figures.push({ y: point.y, kind: 'packhorse', side: side.side, point, size: figurePx * 1.3,
            clip: mule ? moving ? `mule-packed-grass-walk-${dir}` : null : moving ? 'horse-walk' : 'horse-graze',
            sprite: mule && !moving ? `mule-packed-grass-idle-${dir}` : null,
            mule, grassOpened: mule && battle.phase === 'grass' && slot.index % 5 === 0,
            flip: mule ? dir === 'e' && !right : !right, seed });
          drawnBy[side.key].push(point);
          continue;
        }
        if (side.figure === 'prisoner') {
          const vertical = Math.abs(facing.y) > Math.abs(facing.x) * 1.2;
          const dir = vertical ? (facing.y >= 0 ? 's' : 'n') : 'e';
          figures.push({ y: point.y, kind: 'prisoner', side: side.side, point, size: figurePx, clip: moving ? `prisoner-walk-${dir}` : null,
            sprite: moving ? null : dir === 'n' ? 'prisoner-walk-n-1' : `prisoner-idle-${dir}`, timeMs: time, flip: dir === 'e' && !right, seed });
          drawnBy[side.key].push(point); if (side.key === side.side || side.part) drawn[side.side].push(point);
          continue;
        }
        if (side.figure === 'alavez') {
          figures.push({ y: point.y, kind: 'townsfolk', side: side.side, point, size: figurePx * 0.95, clip: moving ? 'alavez-walk-e' : 'alavez-story-beckon', sprite: null, timeMs: time, flip: !right, seed });
          drawnBy[side.key].push(point); civilians++;
          continue;
        }
        // The sentry on San Fernando's roof ringing the bell (`HIST-TEX-613`): the church's wall, its bell arch and the man on
        // it are one drawing, set on the ground; his words come from up on the roof. stand-in: docs/ART_REQUESTS.md, request
        // 2026-09-26 "the bell at Béxar", item 1 - Claude-drawn stand-ins `sentry-bell-ring`; a standing volunteer while not loaded.
        if (side.figure === 'sentry-bell') {
          const roof = { x: point.x, y: point.y - figurePx * 1.2 };
          figures.push({ y: point.y, kind: 'sentry', side: side.side, point, size: figurePx, clip: 'sentry-bell-ring', timeMs: time, flip: !right, seed,
            fallback: { sprite: `volunteer-${right ? 'e' : 'w'}`, flip: false } });
          drawnBy[side.key].push(roof); if (side.key === side.side || side.part) drawn[side.side].push(roof);
          continue;
        }
        if (side.civilians) {
          const [who, whoSize, old, oldSize] = TOWNSFOLK[slot.index % TOWNSFOLK.length];
          // The first of a leaving family (`figure: 'townsfolk-leave'`): the man at the ox's head, the laden carreta, the woman
          // and a child after it, as one drawing. stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the bell at Béxar",
          // item 2 - Claude-drawn stand-ins `townsfolk-leave`; the townspeople one by one while it has not loaded.
          const cart = side.figure === 'townsfolk-leave' && slot.index === 0;
          figures.push({ y: point.y, kind: 'townsfolk', side: side.side, point, size: figurePx * (cart ? 0.95 : whoSize),
            clip: cart ? (moving ? 'townsfolk-leave' : null) : moving ? `${who}-walk` : `${who}-idle-s`, sprite: cart && !moving ? 'townsfolk-leave-1' : null, timeMs: time, flip: !right, seed,
            fallback: { clip: moving ? `${old}-walk` : `${old}-idle-s`, size: figurePx * oldSize, flip: !right } });
          drawnBy[side.key].push(point); civilians++;
          continue;
        }
        // Inside a stone house, firing through the holes cut in its wall ("a pigeon nursery", Lopez): only a man or two is seen
        // in the doorway or the yard; the rest are a flash and a puff at the wall, each on his own reload.
        // Astra's generic limestone `house-loopholed` (2026-10-03, closed state): the house the group holds, stood once behind
        // its men, its wall where the flashes come; while it has not loaded, the town's houses as drawn, with the flashes and the
        // smoke there. Nobody is drawn inside it (her house needs occlusion masks and rooms before actors go in).
        if (side.cover === 'loophole' && slot.index === 1) {
          const wall = camera.toScreen({ x: centre.x - facing.x * 0.004, y: centre.y - facing.y * 0.004 - 0.002 });
          figures.push({ y: wall.y - 1, kind: 'cover', side: side.side, point: wall, size: figurePx * 2.4, sprite: 'house-loopholed', clip: null, flip: !right });
        }
        if (side.cover === 'loophole' && slot.index % 4 !== 0) {
          if (holding || side.fire === 'none') continue;
          const pause = WAIT_MIN_MS + hash(`${seed}:lw`) * WAIT_SPAN_MS * 1.4, round = MUSKET_MS + pause;
          const shifted = time + hash(`${seed}:lp`) * 24000, inRound = shifted % round;
          const loopKey = `${seed}:l${Math.floor(shifted / round)}`;
          if (inRound >= pause + SHOT_AT && inRound < pause + SHOT_AT + 400 && !view.shotsSeen.has(loopKey)) {
            view.shotsSeen.add(loopKey); shots++; view.loopholeShots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
            const hole = { x: ground.x + facing.x * 0.01, y: ground.y + facing.y * 0.01 - 0.006 };
            puff(hole.x, hole.y, now, { wind, dir: right ? 1 : -1 }); flash(hole.x, hole.y, right, now, 0.8);
          }
          continue;
        }
        let fallback = null;
        if (hands) {
          // Surrendering, hands raised (`*-surrender`): drawn, never counted (docs/battle-research/staging.md §8.5).
          clip = `${kind === 'volunteer' ? 'volunteer' : 'regular'}-surrender`; flip = !right; surrendering++;
        } else if ((kind === 'regular' || kind === 'volunteer') && marshWadingClip(battle, side, ground)) {
          clip = marshWadingClip(battle, side, ground); flip = !right;
        } else if (kind === 'dragoon' || kind === 'rider') {
          // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the Alamo", item 7 - lancers (Ramírez y Sesma's, outside the
          // Alamo's walls) walking or standing are drawn as the library's dragoons, without lances, until a lancer's walk and idle
          // exist; charging, Astra's `lancer-charge` (2026-10-03).
          clip = kind === 'rider' ? (moving ? 'mounted-courier-e' : 'mounted-courier-listen') : moving ? 'dragoon-march' : right ? 'dragoon-idle-e' : 'dragoon-idle-w';
          flip = kind === 'rider' ? !right : moving ? !right : false;
          // A Texian horseman is drawn above (`kind === 'rider'`, Astra's mounted volunteer) and never reaches here. Ramírez y
          // Sesma's lancers charge in Astra's `lancer-charge`, and a dragoon firing from the saddle is her `dragoon-fire`
          // (2026-10-03); their walk and idle are asked for by name and drawn as the dragoon until hers land.
          const lancers = kind === 'dragoon' && /lancer/i.test(`${side.name || ''} ${side.id || ''} ${side.key || ''}`);
          if (lancers) prefer = { clip: side.action === 'charge' ? 'lancer-charge' : moving ? 'lancer-march' : 'lancer-idle', flip: !right };
          // A dragoon firing his carbine from the saddle: Astra's `dragoon-fire` (2026-10-03), shoulder, recoil and lower on the
          // shot's own clock, with the flash and the smoke from where his hands are, on his own long wait between shots.
          if (!holding && (side.fire === 'scattered' || (side.fire === 'picket' && slot.index % 6 === 0))) {
            const wait = 9000 + hash(`${seed}:dw`) * 16000, shifted = time + hash(`${seed}:dp`) * 25000, t = shifted % wait;
            const shotKey = `${seed}:d${Math.floor(shifted / wait)}`;
            if (kind === 'dragoon' && (t < 640 || t >= wait - 360)) {
              clip = 'dragoon-fire'; timeMs = t >= wait - 360 ? t - (wait - 360) : t + 360; flip = !right;
            }
            if (t < 400 && !view.shotsSeen.has(shotKey)) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.014, y: ground.y - 0.012 };
              puff(muzzle.x, muzzle.y, now, { wind, dir: right ? 1 : -1 }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
            // The carbine at the shoulder as the shot goes, then the recoil (the clip's beat is its second frame).
            if (!moving && !lancers && (t < 500 || wait - t < 700)) prefer = { clip: 'dragoon-fire', timeMs: t < 500 ? t + 700 : 700 - (wait - t), flip: !right };
          }
        } else if (side.fire === 'scattered' || (side.fire === 'picket' && slot.along > -0.03 && slot.index % 5 === 0)) {
          const wait = slot.wait ?? (WAIT_MIN_MS + hash(`${seed}:w`) * WAIT_SPAN_MS), cycle = MUSKET_MS + wait;
          const t = (time + (slot.phase ?? hash(`${seed}:p`)) * 20000) % cycle;
          // Under a bank (Concepción's riverbank, the Grass Fight's creek beds): up the cut to fire over the lip, down to load.
          // Astra's `volunteer-bank-climb` (2026-10-04) on the firing clock (`bankClip`), the same seed for every man so her looping
          // clip is not set off at a random point of itself; while it loads, the loading figure drawn lower, kneeling.
          const climbing = side.style === 'bank' && kind === 'volunteer';
          // At a stone house's loophole (Béxar): the one man seen of its garrison fires through the wall - a volunteer in Astra's
          // crouched `volunteer-loophole-*` (2026-10-03). stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "a flat-roofed stone
          // house with loopholes" - a regular is Claude's `regular-loophole-fire`.
          const loophole = side.cover === 'loophole' && (kind === 'volunteer' || kind === 'regular');
          // Lying in the tall grass (Coleto's cazadores at night): Astra's prone marksman (2026-10-03); `prone` above.
          if (climbing && t >= wait - 500) { clip = 'volunteer-bank-climb'; timeMs = bankClip(t - wait); flip = !right; fallback = { clip: `${kind}-fire-reload`, timeMs: musketClip(t - wait) }; }
          else if (t < wait) {
            sprite = slot.kneel ? `${kind}-load` : `${kind}-${right ? 'e' : 'w'}`; still = true; flip = slot.kneel ? !right : false;
            if (side.style === 'bank') { sprite = `${kind}-load`; flip = !right; dy = figurePx * 0.32; }
            if (climbing) { sprite = 'volunteer-bank-climb-5'; dy = 0; fallback = { sprite: `${kind}-load`, dy: figurePx * 0.32 }; }
            if (loophole) {
              sprite = kind === 'volunteer' ? 'volunteer-loophole-load' : `${kind}-loophole-fire-3`; flip = !right; fallback = { sprite: `${kind}-${right ? 'e' : 'w'}`, flip: false, size: figurePx };
            }
            if (prone) { sprite = 'regular-prone-lie'; flip = !right; fallback = { sprite: slot.kneel ? 'regular-load' : `regular-${right ? 'e' : 'w'}`, flip: slot.kneel ? !right : false }; }
          }
          else if (loophole) {
            // A volunteer is Astra's crouched loophole cycle (2026-10-03); a regular, Claude's. Both at the soldier's own size:
            // her kneeling man is measured against the man standing (scripts/build-atlas-manifest.mjs FIGURE_HEIGHTS,
            // 2026-10-04) and draws 0.67-0.68 of him aiming and loading; x0.65 here guessed that until then.
            clip = kind === 'volunteer' ? 'volunteer-loophole-fire-reload' : `${kind}-loophole-fire`; timeMs = musketClip(t - wait); flip = !right; fallback = { clip: `${kind}-fire-reload`, size: figurePx };
          }
          // Astra's prone marksman (2026-10-03): lying in the grass to load, the rifle up to fire.
          else if (prone) { clip = 'regular-prone-fire-reload'; timeMs = musketClip(t - wait); flip = !right; fallback = { clip: 'regular-fire-reload' }; }
          if (t >= wait) {
            if (!climbing && !loophole && !prone) { clip = `${kind}-fire-reload`; timeMs = musketClip(t - wait); }
            const shotKey = `${seed}:${Math.floor((time + (slot.phase ?? 0) * 20000) / cycle)}`;
            if (t - wait >= SHOT_AT && t - wait < SHOT_AT + 400 && !view.shotsSeen.has(shotKey) && !holding) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.012, y: ground.y - 0.004 };
              puff(muzzle.x, muzzle.y, now, { wind, dir: right ? 1 : -1 }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
          }
        } else if (volley && (slot.face === undefined ? slot.rank === firingRank : slot.rank === faceCycle(slot).rank) && (kind !== 'dragoon')) {
          const into = (slot.face === undefined ? cycleAt : faceCycle(slot).at) - VOLLEY_WORDS_AT[1];
          if (into < 0 || into > VOLLEY_AIM_MS + MUSKET_MS - MUSKET.aim) { sprite = `${kind}-${right ? 'e' : 'w'}`; still = true; flip = false; }
          else {
            clip = `${kind}-fire-reload`; timeMs = musketClip(into, VOLLEY_AIM_MS);
            const shotKey = `${seed}:v${slot.face === undefined ? cycleNo : faceCycle(slot).no}`;
            if (into >= VOLLEY_AIM_MS && into < VOLLEY_AIM_MS + 400 && !view.shotsSeen.has(shotKey) && !holding) {
              view.shotsSeen.add(shotKey); shots++; view.shotsBy[side.side] = (view.shotsBy[side.side] || 0) + 1;
              const muzzle = { x: ground.x + (right ? 1 : -1) * 0.012, y: ground.y - 0.004 };
              puff(muzzle.x, muzzle.y, now, { wind, dir: right ? 1 : -1, wall: true }); flash(muzzle.x, muzzle.y, right, now, 1);
            }
          }
        } else if (side.action === 'work') {
          // Digging a trench or filling sandbags at night: each army's own authored cycle, Astra's `volunteer-dig` (2026-10-03) and
          // `regular-dig` (2026-10-04); the library's settler at work, or the regular standing, only while her sheets load.
          clip = side.side === 'mexican' ? 'regular-dig' : 'volunteer-dig'; flip = !right;
          fallback = side.side === 'mexican' ? { clip: 'regular-idle-s' } : { clip: slot.index % 2 ? 'rust-work' : 'teal-work' };
        } else if (moving) {
          clip = `${kind}-march`; flip = !right;
          // Into the marsh or the water anywhere else a fight is given them: wading to the thighs in Astra's `volunteer-wade` and
          // `regular-wade` (2026-10-08; San Jacinto's rout and killing take them above, `marshWadingClip`), marching over the water
          // while her sheet loads.
          if ((kind === 'volunteer' || kind === 'regular') && inWater(battle, ground)) { clip = `${kind}-wade`; fallback = { clip: `${kind}-march` }; }
        }
        else if (side.style === 'camp') {
          // At rest in camp: standing about, or sitting at ease - Astra's healthy `*-rest-sit` (2026-10-03), distinct from injury
          // and death; the library's seated wounded soldier only while her sheet loads. At the soldier's own size: her seated
          // men are measured against the man standing (scripts/build-atlas-manifest.mjs FIGURE_HEIGHTS, 2026-10-04) and
          // draw 0.63-0.64 of him; x0.7 here guessed it while the sheet was measured from its seated men.
          if (slot.rest === 'sit') { clip = `${kind}-rest-sit`; fallback = { clip: `${kind}-injured-rest`, size: figurePx }; } else clip = `${kind}-idle-${right ? 'e' : 'w'}`;
          flip = slot.rest === 'sit' ? !right : false;
        } else { sprite = `${kind}-${right ? 'e' : 'w'}`; still = true; flip = false; }
        // A Claude-drawn clip this figure is drawn in (`prefer`), with the library's figure it stands in for as its `fallback`
        // until `clipReady` says it can be drawn.
        const placedAt = dy ? { x: point.x, y: point.y + dy } : point;
        if (prefer) figures.push({ y: point.y, kind, side: side.side, point: placedAt, size, clip: prefer.clip, timeMs: prefer.timeMs ?? timeMs, flip: prefer.flip ?? flip, still, seed, fallback: clip ? { clip, flip } : { sprite, flip } });
        else figures.push({ y: point.y, kind, side: side.side, point: placedAt, size, clip, sprite, timeMs, flip, still, seed: clip === 'volunteer-bank-climb' ? 0 : seed, ...(fallback && { fallback }) });
        if (side.key === side.side || side.part) drawn[side.side].push(point);
        drawnBy[side.key].push(point);
      }
    }
    // A fall the record puts at a place, on a named man (Milam in the Veramendi yard, `HIST-TEX-039`): drawn there, falling
    // and lying still, his name under him, and carried off after. Never a family's person: those are `memberFates`.
    for (const fall of view.fallenAt.values()) {
      if (!Number.isFinite(fall.x) || fall.at > now || !(battle.fallen || []).some(one => one.minute === fall.minute && one.x === fall.x)) continue;
      const point = camera.toScreen(fall);
      if (offScreen(point)) continue;
      figures.push({ y: point.y, kind: 'fallen', side: fall.side, point, size: figurePx, down: { at: fall.at, carried: fall.carried || battle.over, wounded: fall.wounded }, slot: { index: `named:${fall.minute}` }, ground: fall, facingRight: true, name: fall.name });
      if (fall.name) view.namedFalls.add(fall.name);
    }
    for (const [key, map] of fallenSlots) {
      if (bodies.some(body => body.key === key)) continue;
      for (const [index, down] of map) {
        const ground = view.fallenSpots.get(`${key}:${index}`);
        if (!ground) continue;
        const point = camera.toScreen(ground);
        figures.push({ y: point.y, kind: 'fallen', figure: view.fallenFigure.get(`${key}:${index}`), side: view.fallenSide.get(key) || 'texian', point, size: figurePx, down, slot: { index }, ground, facingRight: true });
      }
    }
    // Back to front, so a man nearer the camera stands in front of the one behind him.
    figures.sort((a, b) => a.y - b.y);
    for (const f of figures) {
      if (f.kind === 'fallen') { drawFallen(ctx, f, now); continue; }
      if (f.kind === 'packhorse') {
        if (f.mule) {
          if (f.clip) art.animated(ctx, f.clip, f.point.x, f.point.y, f.size, f.seed, { timeMs: time, flip: f.flip, paused: reducedMotion });
          else art.drawSprite(ctx, f.sprite, f.point.x, f.point.y, f.size, { flip: f.flip });
          if (f.grassOpened) art.drawSprite(ctx, 'grass-bundle-cut', f.point.x + f.size * 0.65, f.point.y + f.size * 0.08, f.size * 0.3);
          continue;
        }
        if (!art.animated(ctx, f.clip, f.point.x, f.point.y, f.size, f.seed, { timeMs: time, flip: f.flip, paused: reducedMotion })) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(f.point.x - f.size * 0.35, f.point.y - f.size * 0.45, f.size * 0.7, f.size * 0.25); }
        if (!art.drawSprite(ctx, 'packed-belongings', f.point.x, f.point.y - f.size * 0.42, f.size * 0.45)) { ctx.fillStyle = '#b9a46a'; ctx.fillRect(f.point.x - f.size * 0.2, f.point.y - f.size * 0.62, f.size * 0.4, f.size * 0.18); }
        continue;
      }
      if (f.kind === 'cover') {
        if (!f.clip || !art.animated(ctx, f.clip, f.point.x, f.point.y, f.size, `cover:${f.point.x}:${f.point.y}`, { timeMs: f.timeMs, flip: f.flip, paused: still }))
          art.drawSprite(ctx, f.sprite, f.point.x, f.point.y, f.size, { flip: f.flip }) || (f.fallback && art.drawSprite(ctx, f.fallback.sprite, f.point.x, f.point.y, f.fallback.size, { flip: f.flip }));
        continue;
      }
      let ok = 0;
      // A Claude-drawn figure with a `fallback` is drawn as that fallback until its clip can be drawn (`clipReady`). Held
      // still (less motion asked for, or the class paused) no cycle moves (Astra, 2026-10-08).
      const own = !(f.fallback && f.clip && art.clipReady && !art.clipReady(f.clip));
      if (!own) ok = 0;
      else if (f.clip) ok = art.animated(ctx, f.clip, f.point.x, f.point.y, f.size, f.seed, { timeMs: f.timeMs, flip: f.flip, paused: still });
      else if (f.sprite) ok = art.drawSprite(ctx, f.sprite, f.point.x, f.point.y, f.size, { flip: f.flip });
      // A Claude-drawn figure whose sheet has not loaded: the library's own figure it stood in for.
      // A fallback may stand lower than its figure (`dy`: the old loading figure under a bank) and keep its own clock (`timeMs`).
      if (!ok && f.fallback) {
        const fb = f.fallback, at = { x: f.point.x, y: f.point.y + (fb.dy || 0) }, flip = fb.flip ?? f.flip;
        ok = fb.clip ? art.animated(ctx, fb.clip, at.x, at.y, fb.size || f.size, f.seed, { timeMs: fb.timeMs ?? f.timeMs, flip, paused: still })
          : art.drawSprite(ctx, fb.sprite, at.x, at.y, fb.size || f.size, { flip });
      }
      if (!ok) art.miniPerson(ctx, f.point.x, f.point.y, f.size, { side: f.side, flip: f.flip });
    }
    // The cannon and the men serving it.
    let cannonShown = null;
    if (battle.cannon) cannonShown = drawCannon(ctx, battle, camera, figurePx, time, now, wind, still);
    const flagShown = battle.flag ? drawFlag(ctx, battle.flag, camera, figurePx, time, wind) : null;
    view.parleySpots = {}; view.legendSpots = {};
    const legendShown = battle.legendScene ? drawLegendScene(ctx, battle.legendScene, camera, figurePx, time, reducedMotion) : null;
    if (battle.parley) drawParley(ctx, battle, camera, figurePx, time);
    // Guns standing on the ground (Béxar's: the plaza's, the Alamo's, Neill's), each firing the shots the server dated.
    const gunsShown = (battle.guns || []).map(gun => drawGun(ctx, gun, camera, figurePx, time, now, wind, still, bounds)).filter(Boolean);
    // Walls and doors broken with a crowbar: a man at the bar until it gives, then the hole.
    const breachesShown = drawBreaches(ctx, camera, figurePx, time, now, still, battle);
    for (const flag of battle.flags || []) drawWhiteFlag(ctx, flag, camera, figurePx, time, wind);
    // Named people where the record puts them (the Alamo's Travis and Joe), and smoke going up far off.
    const peopleShown = drawPeople(ctx, battle, camera, figurePx, time, now, bounds);
    for (const plume of battle.plumes || []) drawPlume(ctx, plume, camera, figurePx, time, reducedMotion);
    // Night (§6.13): the field dark but for lit windows, the fire and the flashes, which are drawn over it.
    const night = battle.light === 'night' || battle.light === 'dawn' ? drawNight(ctx, battle, camera, figurePx, now, bounds) : null;
    // A darkness given as a number (the Alamo's nights, and the dawn coming up through the assault, 0 to 1), over the ground and
    // the men but under the flashes and the words. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the Alamo", item 4 -
    // Claude's `night-grade`, with `dawn-grade` warming it as the light comes (*Claude-drawn stand-ins*, area F), each at a
    // strength that follows the number, so a change of pace changes only the strength; a darkening wash without them.
    if (typeof battle.light === 'number' && battle.light > 0) {
      const dark = Math.min(1, battle.light);
      if (drawGrade(ctx, 'night-grade', dark * 0.9, bounds)) drawGrade(ctx, 'dawn-grade', Math.sin(Math.PI * dark) * 0.45, bounds);
      else { ctx.save(); ctx.fillStyle = `rgba(14,20,44,${(0.62 * battle.light).toFixed(3)})`; ctx.fillRect(0, 0, ctx.canvas?.width || bounds?.width || 0, ctx.canvas?.height || bounds?.height || 0); ctx.restore(); }
    }
    // Dusk and fog (Coleto, 2026-09-25): a lighter wash over the field, under the flashes. ceiling: the light is drawn only while a
    // fight is shown; the country itself has no night yet.
    if (DIM[battle.light] && bounds) { ctx.save(); ctx.fillStyle = DIM[battle.light]; ctx.fillRect(0, 0, bounds.width, bounds.height); ctx.restore(); }
    // Flashes: a tenth of a second each, over the figures.
    view.flashes = view.flashes.filter(f => now - f.born < (f.size >= 2 ? GUN.flash : 150));
    // Each flash once, where it was drawn, for the page's sound (public/audio.js): a size of 2 or more is a gun.
    const heard = [];
    for (const f of view.flashes) {
      const p = camera.toScreen(f), s = figurePx * 0.34 * f.size;
      if (!f.heard) { f.heard = true; heard.push({ x: Math.round(p.x), y: Math.round(p.y), size: f.size }); }
      if (night) glow(ctx, p.x, p.y - figurePx * 0.55, figurePx * 1.6, 'rgba(255,200,120,.45)');
      if (!art.drawSprite(ctx, f.right ? 'muzzle-flash-e' : 'muzzle-flash-w', p.x, p.y - figurePx * 0.55, s)) {
        ctx.fillStyle = 'rgba(255,214,120,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y - figurePx * 0.55, s * 0.35, 0, Math.PI * 2); ctx.fill();
      }
      flashes++;
    }
    // Fog lying over the field (the phase's `fog`, 0 to 1): Concepción's morning, thinning as it lifts about eight.
    const fogShown = battle.fog > 0 ? drawFog(ctx, battle, camera, bounds, time, reducedMotion) : 0;
    const smokeDrawn = drawSmoke(ctx, camera, figurePx, now, reducedMotion, bounds, battle, clear);
    const bubbles = drawLines(ctx, battle, camera, figurePx, now, time, bounds, drawn, drawnBy);
    view.civiliansSeen = Math.max(view.civiliansSeen, civilians);
    view.shotsTotal += shots;
    for (const bubble of bubbles) view.linesShown.add(bubble.id);
    if (named) labelSides(ctx, battle, camera, figurePx, drawn, drawnBy);
    const ms = performance.now() - started;
    view.frameMs.push(ms); if (view.frameMs.length > 240) view.frameMs.shift();
    const sorted = [...view.frameMs].sort((a, b) => a - b);
    view.evidence = {
      id: battle.id, phase: battle.phase, minute: battle.minute, figures: { texian: drawn.texian.length, mexican: drawn.mexican.length },
      regularity: { texian: regularity(drawn.texian), mexican: regularity(drawn.mexican) },
      flashes, heard, shots, shotsTotal: view.shotsTotal, shotsBy: { ...view.shotsBy }, smoke: smokeDrawn.alive, smokeInView: smokeDrawn.inView, smokeCentre: smokeDrawn.centre, bankCentre: smokeDrawn.bankCentre, bubbles, linesShown: [...view.linesShown],
      // The banks (§15.2): how many, how thick in all and at the thickest (`cover`, how much of what is behind the thickest hides),
      // how long the stalest has lain since a shot last fed it (`lingerMs`), and the still haze drawn instead for less motion.
      banks: smokeDrawn.banks, banksInView: smokeDrawn.banksInView, bankDensity: smokeDrawn.density, cover: smokeDrawn.cover, lingerMs: smokeDrawn.lingerMs, haze: smokeDrawn.haze,
      // §16.3: a gun's banks going up as plumes, a volley's lying as walls, and the clearings thinned round the class's own men.
      smokePlumes: smokeDrawn.plumes, smokeWalls: smokeDrawn.walls, clearings: smokeDrawn.clearings,
      // A gun's shot, the moments the page drew it (the class view's film gives the camera a jolt for it: public/battle-cinema.js).
      thumps: view.thumps.filter(t => now - t < 1000),
      members: [...view.members.keys()], memberClips: [...view.memberClips],
      memberPoses: [...view.members.keys()].map(id => ({ id, drawn: view.memberSpots.has(id) })),
      cannon: cannonShown, flag: flagShown, cannonShots: view.cannonFiredAt.length, fallen: [...fallenSlots.values()].reduce((s, m) => s + m.size, 0),
      // Béxar's street fighting (docs/battle-research/staging.md §3): each group drawn, the shots through loopholes, the guns'
      // shots, the breaches open, the townspeople seen, the named falls, and each member's fall once it came.
      groups: Object.fromEntries(Object.entries(drawnBy).filter(([key]) => key.startsWith('g:')).map(([key, points]) => [key.slice(2), points.length])),
      unitsSeen: [...view.unitsSeen].map(key => key.slice(2)), loopholeShots: view.loopholeShots, gunShots: view.gunShotsTotal, guns: gunsShown,
      breaches: breachesShown, breachesOpened: view.breachesSeen.size, civilians, civiliansSeen: view.civiliansSeen, namedFalls: [...view.namedFalls], whiteFlag: (battle.flags || []).length ? view.whiteFlag || null : null,
      // San Jacinto: who is down by body, how many have their hands up, what stands on the ground, each side's style.
      fallenBy: Object.fromEntries([...fallenSlots.entries()].map(([key, m]) => [key, m.size])), surrendering, works: worksDrawn,
      legendScene: legendShown,
      styles: Object.fromEntries(battle.sides.map(side => [side.side, side.style])),
      // How hollow each side stands: the nearest man to its middle over the mean distance of all of them (a square's is about
      // three quarters; men scattered over the ground, a tenth or so).
      hollow: Object.fromEntries(Object.entries(drawn).map(([name, points]) => [name, hollowness(points)])),
      memberFalls: [...view.memberFallAt.entries()].filter(([, fall]) => fall.at <= now).map(([id, fall]) => ({ id, fate: fall.fate })),
      // §6.13: the parts each side is drawn in, what their men were doing, the houses and groves, the herd, the night.
      parts: Object.fromEntries(battle.sides.map(side => [side.side, (side.parts || []).length])), poses, scenery: sceneryDrawn, herd: herdDrawn,
      night: Boolean(night), lit: night?.lit || 0,
      memberFates: Object.fromEntries([...view.memberFallAt.entries()].filter(([id, fall]) => fall.at <= now && view.members.has(id)).map(([id, fall]) => [id, fall.fate])),
      // The Alamo (docs/BATTLES.md §9): each gun's shots, the named people, the dark, the plumes, and each group's own order
      // (a column's files against a wall's line against a crowd: nearest-neighbour spread over the mean).
      gunShotsBy: { ...view.gunShotsBy }, people: peopleShown, light: typeof battle.light === 'number' ? battle.light : battle.light || 'day', plumes: (battle.plumes || []).length, fogBanks: battle.fog > 0 ? view.fogBanks || 0 : 0,
      groupStyles: Object.fromEntries((battle.groups || []).map(group => [group.id, group.style])),
      groupRegularity: Object.fromEntries(Object.entries(drawnBy).filter(([key]) => key.startsWith('g:')).map(([key, points]) => [key.slice(2), regularity(points)])),
      // Concepción and the Grass Fight: how regularly each body stands, the fog, the scenery drawn.
      regularityBy: Object.fromEntries(Object.entries(drawnBy).map(([key, points]) => [key.replace(/^g:/, ''), regularity(points)])),
      fog: fogShown,
      frameMs: { last: +ms.toFixed(2), median: +sorted[Math.floor(sorted.length / 2)].toFixed(2), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2) },
    };
    view.memberSpots.clear();
    return view.evidence;
  }

  /** Which sampled figures are down, by side: the fall's count taken from the middle of the front, stable for the fight. */
  function fallenBySide(battle, now) {
    const bySide = new Map();
    const bodies = bodiesOf(battle);
    for (const fall of [...view.fallenAt.values()].sort((a, b) => a.minute - b.minute)) {
      // A fall at a named place is drawn there, on its own; one the server no longer sends has been carried off the ground.
      if (fall.at > now || Number.isFinite(fall.x) || (battle.fallen && !battle.fallen.some(one => one.minute === fall.minute && one.side === fall.side))) continue;
      const bodyKey = fall.unit ? `g:${fall.unit}` : fall.side;
      const side = bodies.find(one => one.key === bodyKey);
      if (battle.noFalling?.includes(fall.side)) continue;
      const map = bySide.get(bodyKey) || new Map();
      // Which of its men, chosen once and kept: a body that has since left the field (Coleman's men, crossed over at
      // Concepción) still has its fallen lying where they fell (`fallenSpots`).
      if (!fall.slots) {
        if (!side) continue;
        const slots = view.layouts.get(layoutKey(side)) || layoutSide(side);
        // In a loophole group only the men who can be seen can be seen to fall.
        const seen = side.cover === 'loophole' ? slots.filter(slot => slot.index % 4 === 0) : slots;
        // Each fall takes men still up, in the order they fell: a count of falls is a count of men down (San Jacinto's many), and
        // a part's fallen lie where they fell (§6.13); nobody is carried off it.
        const order = [...seen].filter(slot => !map.has(slot.index)).sort((a, b) => hash(`${fall.minute}:${a.index}`) - hash(`${fall.minute}:${b.index}`));
        fall.slots = order.slice(0, fall.count).map(slot => slot.index); fall.part = Boolean(side.part);
      }
      for (const index of fall.slots) if (!map.has(index)) map.set(index, { at: fall.at, carried: fall.carried || (battle.over && !fall.part), wounded: fall.wounded });
      bySide.set(bodyKey, map);
    }
    return bySide;
  }
  /** The houses, the fire and the groves, where the engagement's data puts them (§6.13). */
  function drawScenery(ctx, battle, camera, figurePx, time) {
    let count = 0;
    for (const item of battle.scenery || []) {
      const p = camera.toScreen(item);
      // A river or creek the map does not draw, as a ribbon of water (Concepción's river behind the bank, the creek Jack forded).
      if (item.water) {
        const points = item.water.map(point => camera.toScreen(point));
        const a = camera.toScreen(item.water[0]), b = camera.toScreen({ x: item.water[0].x + (item.width || 0.02), y: item.water[0].y });
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(86,122,138,.78)'; ctx.lineWidth = Math.max(3, Math.hypot(b.x - a.x, b.y - a.y));
        ctx.beginPath(); points.forEach((q, k) => (k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
        ctx.strokeStyle = 'rgba(190,214,220,.35)'; ctx.lineWidth = Math.max(1, ctx.lineWidth * 0.25); ctx.stroke();
        ctx.restore(); count++;
        continue;
      }
      // A tree in the wind, or any clip, at its own size in figure heights (Concepción's pecans, the Grass Fight's mesquite).
      if (item.clip) { art.animated(ctx, item.clip, p.x, p.y, figurePx * (item.size || 3), `scenery:${item.x}:${item.y}`, { timeMs: time, flip: item.flip }); count++; continue; }
      // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the south's fights" items 2 and 5 - the library's jacal and cabin for
      // San Patricio's houses and its live oaks and mesquite for the groves at Agua Dulce.
      if (item.kind === 'grove') {
        // Cohesive oak mott art for the two existing Agua Dulce groves. The
        // geographic spread still controls scale; this is scenery, not cover logic.
        if (battle.id === 'agua-dulce' && art.animated(ctx,
          `live-oak-mott-${item.id === 'grove-west' ? 'open' : 'dense'}-wind`,
          p.x, p.y, Math.max(figurePx * 3.2, (item.spread || 0.08) * camera.scale),
          item.id, { timeMs: time })) { count++; continue; }
        // Elsewhere, and without her grove's sheet, each tree on its own. (Claude's `live-oak-mott` stood here until her groves
        // landed, 2026-10-03: live oaks are her subject, so it is held back and no longer asked for.)
        for (let i = 0; i < (item.trees || 5); i++) {
          const a = hash(`${item.id}:${i}:a`) * Math.PI * 2, r = Math.sqrt(hash(`${item.id}:${i}:r`)) * (item.spread || 0.08);
          const q = camera.toScreen({ x: item.x + Math.cos(a) * r, y: item.y + Math.sin(a) * r * 0.7 });
          if (!art.drawSprite(ctx, i % 3 === 2 ? 'mesquite-large' : 'live-oak-large', q.x, q.y, figurePx * 3.2)) { ctx.fillStyle = '#5d7148'; ctx.beginPath(); ctx.arc(q.x, q.y - figurePx, figurePx * 1.1, 0, Math.PI * 2); ctx.fill(); }
        }
      } else if (item.kind === 'campfire') {
        // At night the fire burning in the dark (Astra's `campfire-night`, 2026-10-03, drawn again over the night's wash by
        // `drawNight`); without it, the library's day campfire.
        // Only a fire the battle says is lit burns (Astra, 2026-10-03: `item.lit`); a cold hearth is the day's campfire.
        const dark = battle.light === 'night' || battle.light === 'dawn' || (typeof battle.light === 'number' && battle.light > 0.35);
        if (!(item.lit && dark && art.animated(ctx, 'campfire-night', p.x, p.y, figurePx * 0.9, item.id, { timeMs: time })) && !art.animated(ctx, 'campfire', p.x, p.y, figurePx * 0.9, item.id, { timeMs: time })) art.drawSprite(ctx, 'campfire', p.x, p.y, figurePx * 0.9);
      } else if (item.lit && ['night', 'dawn'].includes(battle.light) &&
        NIGHT_BUILDING_CLIPS[item.sprite] &&
        art.animated(ctx, NIGHT_BUILDING_CLIPS[item.sprite], p.x, p.y, figurePx * (item.size || 2.4), item.id, { timeMs: time, flip: item.flip })) {
        // Astra's night-lit house (2026-10-03): only projected lamplight gets a night-lit replacement; actors remain in front.
      } else if (!art.drawSprite(ctx, item.sprite || 'cabin-small', p.x, p.y, figurePx * (item.size || 2.4), { flip: item.flip })
        // A piece with a `fallback` (Claude's ground pieces, sim/battles/concepcion.mjs and grass-fight.mjs) is drawn as the
        // library art it stood in for while its own sheet is missing; `fallback: 'none'` is simply left out.
        && !(item.fallback && (item.fallback === 'none' || art.drawSprite(ctx, item.fallback, p.x, p.y, figurePx * (item.fallbackSize || item.size || 2.4), { flip: item.flip })))) {
        ctx.fillStyle = '#8a7658'; ctx.fillRect(p.x - figurePx, p.y - figurePx * 1.2, figurePx * 2, figurePx * 1.2);
      }
      count++;
    }
    return count;
  }
  /**
   * Several hundred horses as a loose drove a couple of dozen strong, moving with the drive and scattering in a charge.
   * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the south's fights" item 4 - the library's mustang, repeated.
   */
  function drawHerd(ctx, camera, figurePx, time, now) {
    const herd = view.herd;
    if (!herd) return 0;
    const at = placeAt(herd, now), right = herd.to.x >= herd.from.x;
    const n = Math.min(24, Math.max(6, Math.round((herd.count || 60) / 12)));
    const width = herd.scatter ? 0.7 : 0.26, depth = herd.scatter ? 0.5 : 0.16;
    // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - where Claude's herd is loaded, the drove
    // (`herd-drove`) or its scattering (`herd-scatter`) drawn as a few masses of a dozen horses each, one mass for every six of
    // the mustangs that would stand in for them; the mustangs otherwise.
    if ((herd.moving || herd.scatter) && art.clipReady?.(herd.scatter ? 'herd-scatter' : 'herd-drove')) {
      const masses = Math.max(1, Math.round(n / 6));
      let drawn = 0;
      for (let i = 0; i < masses; i++) {
        const q = camera.toScreen({ x: at.x + (hash(`herd:m${i}:x`) - 0.5) * width * 0.6, y: at.y + (i - (masses - 1) / 2) * depth / masses });
        if (art.animated(ctx, herd.scatter ? 'herd-scatter' : 'herd-drove', q.x, q.y, figurePx * 1.15, `herd:m${i}`, { timeMs: time + i * 157, flip: !right })) drawn++;
      }
      if (drawn) return drawn * 12;
    }
    // A mustang's drawing height is its height standing alert, head up (the sheet's logical height since 2026-10-04,
    // scripts/build-atlas-manifest.mjs FIGURE_HEIGHTS): 1.45 of a man, the hunt's own mustang (public/app.js QUARRY_SIZE).
    // Galloping it draws 0.73-0.82 of that, about the 1.15 of a man it was drawn at here when every frame filled the height.
    for (let i = 0; i < n; i++) {
      const q = camera.toScreen({ x: at.x + (hash(`herd:${i}:x`) - 0.5) * width, y: at.y + (hash(`herd:${i}:y`) - 0.5) * depth });
      if (!art.animated(ctx, herd.moving || herd.scatter ? 'mustang-gallop' : 'mustang-graze', q.x, q.y, figurePx * 1.45, `herd:${i}`, { timeMs: time + i * 211, flip: !right })) {
        ctx.fillStyle = '#7a5b3c'; ctx.fillRect(q.x - figurePx * 0.4, q.y - figurePx * 0.5, figurePx * 0.8, figurePx * 0.35);
      }
    }
    return n;
  }
  /**
   * A grade of light (`night-grade`, `moonlight-grade`, `dawn-grade`: a layer, not a sprite) stretched over the whole view and
   * multiplied into it at `strength` (0 to 1). Its frame carries a clear gutter of a sixteenth each side (the library's sprite
   * rule); the inside is what covers the view. Returns false when the grade is not in the library, for the caller's wash.
   */
  const GRADE_GUTTER = 16 / 256;
  function drawGrade(ctx, name, strength, bounds) {
    const W = bounds?.width ?? ctx.canvas?.width ?? 0, H = bounds?.height ?? ctx.canvas?.height ?? 0;
    if (!(strength > 0.001) || !(W > 0) || !(H > 0)) return strength <= 0.001;
    const h = H / (1 - 2 * GRADE_GUTTER);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.scale(W / H, 1);
    const drawn = art.drawSprite(ctx, name, -GRADE_GUTTER * h, H + GRADE_GUTTER * h, h, { anchor: [0, 1], alpha: Math.min(1, strength) });
    ctx.restore();
    return Boolean(drawn);
  }
  /** A warm light on the ground: a lantern, the fire, a musket's flash in the dark. */
  function glow(ctx, x, y, r, colour) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, colour); g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  /**
   * The dark of a night fight over the whole view, with the lit windows and the fire through it. stand-in: docs/ART_REQUESTS.md,
   * request 2026-09-25 "the south's fights" item 1 - a wash and a drawn glow, until a night layer exists.
   */
  function drawNight(ctx, battle, camera, figurePx, now, bounds) {
    const width = bounds?.width ?? ctx.canvas?.width ?? 0, height = bounds?.height ?? ctx.canvas?.height ?? 0;
    // Claude's grades (a moonless night; moonlight at Béxar's storming; first light), the wash without them.
    const grade = battle.light === 'dawn' ? 'dawn-grade' : battle.id === 'bexar-storming' ? 'moonlight-grade' : 'night-grade';
    if (!drawGrade(ctx, grade, battle.light === 'dawn' ? 0.75 : 1, bounds)) {
      ctx.save(); ctx.fillStyle = battle.light === 'dawn' ? 'rgba(20,26,48,.3)' : 'rgba(8,12,30,.7)'; ctx.fillRect(0, 0, width, height); ctx.restore();
    }
    let lit = 0;
    for (const item of battle.scenery || []) {
      if (!item.lit) continue;
      const p = camera.toScreen(item);
      glow(ctx, p.x, p.y - figurePx * (item.kind === 'campfire' ? 0.2 : 0.6), figurePx * (item.kind === 'campfire' ? 2.6 : 1.8), 'rgba(255,184,96,.55)');
      // A fire gives its own light: drawn again over the dark, so it burns bright in it rather than under it (Astra's).
      if (item.kind === 'campfire') art.animated(ctx, 'campfire-night', p.x, p.y, figurePx * 0.9, item.id, { timeMs: now });
      // The lamp in the house's window, laid over the house after the dark so it shines: an overlay registered to the house's
      // own picture. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the south's fights" item 2 - Claude-drawn stand-ins
      // `window-lit-*` (see *Claude-drawn stand-ins*); the glow alone while they have not loaded.
      // Not over a house Astra has painted lit (`NIGHT_BUILDING_CLIPS`): her lamplight is in its own picture.
      if (item.kind !== 'campfire' && item.sprite && !NIGHT_BUILDING_CLIPS[item.sprite]) art.drawSprite(ctx, `window-lit-${item.sprite}`, p.x, p.y, figurePx * (item.size || 2.4), { flip: item.flip });
      lit++;
    }
    return { lit };
  }
  function drawFallen(ctx, f, now) {
    // Each man of a fall his own moment within it (`FALL.spread`), so five men hit at one minute do not drop as one.
    const lag = f.down.wounded || typeof f.slot.index !== 'number' ? 0 : hash(`${f.slot.index}:${f.down.at}:lag`) * FALL.spread;
    const since = now - f.down.at - lag, kind = f.side === 'mexican' ? 'regular' : 'volunteer';
    const x = f.point.x, y = f.point.y;
    if (view.key === 'goliad-massacre' && f.side === 'texian') {
      const pose = f.down.wounded || since < FALL.down ? 'prisoner-injured' : 'prisoner-still';
      if (!art.drawSprite(ctx, pose, x, y, f.size)) art.miniPerson(ctx, x, y, f.size, { side: f.side });
      return;
    }
    if (f.down.wounded && f.inward) {
      // In a square he is brought in toward the carts in the middle, and sits there: nobody could carry him anywhere else.
      const part = Math.min(1, since / 25000) * 0.6, ix = x + (f.inward.x - x) * part, iy = y + (f.inward.y - y) * part;
      if (!art.drawSprite(ctx, `${kind}-injured`, ix, iy, f.size)) art.miniPerson(ctx, ix, iy, f.size, { side: f.side });
      return;
    }
    if (f.down.wounded) {
      // Hit, and helped back from the line, sitting up: a wound, not a death (the record's own word where it is disputed).
      // Living patients use authored blanket bearers or a led wounded dragoon.
      // Away from the enemy: the side faces right when the enemy is to its right, so the rear is to its left.
      const back = -Math.min(1, since / 25000) * f.size * 2.4 * (f.facingRight ? 1 : -1);
      // Astra's living-wounded transport (2026-10-03): a dragoon hit in the saddle led back slumped on his horse, a man on foot
      // carried in a blanket by two of his own side's bearers. Only the living: the dead are never drawn in these (below).
      const transport = f.figure === 'dragoon' ? 'dragoon-wounded-led' : f.side === 'mexican' ? 'regular-bearers-carry' : 'bearers-carry';
      if (art.animated(ctx, transport, x + back, y, f.size * (f.figure === 'dragoon' ? 1.35 : 1), `wounded:${f.slot.index}`, { timeMs: since, flip: f.facingRight, paused: since >= 25000 })) return;
      if (!art.drawSprite(ctx, `${kind}-injured`, x + back, y, f.size)) art.miniPerson(ctx, x + back, y, f.size, { side: f.side });
      for (const off of [-0.45, 0.45]) art.animated(ctx, `${kind}-march`, x + back + off * f.size, y + 2, f.size, `${f.slot.index}:${off}`, { flip: f.facingRight });
      return;
    }
    // Not yet: a man of a fall of several goes down after the first, a moment apart (§16.1), standing until then.
    if (since < 0) { if (!art.drawSprite(ctx, `${kind}-${f.side === 'mexican' ? 'w' : 'e'}`, x, y, f.size)) art.miniPerson(ctx, x, y, f.size, { side: f.side }); return; }
    // Struck: he staggers, hurt, for most of a second before he falls.
    if (since < FALL.struck) { if (!art.drawSprite(ctx, `${kind}-injured`, x, y, f.size)) art.miniPerson(ctx, x, y, f.size, { side: f.side }); return; }
    if (since < FALL.down) {
      // Going down: the standing figure tips over about its feet, slowly, then all at once.
      const tip = (since - FALL.struck) / (FALL.down - FALL.struck);
      ctx.save(); ctx.translate(x, y); ctx.rotate((f.side === 'mexican' ? 1 : -1) * tip * tip * 1.2);
      if (!art.drawSprite(ctx, `${kind}-${f.side === 'mexican' ? 'w' : 'e'}`, 0, 0, f.size)) art.miniPerson(ctx, 0, 0, f.size, { side: f.side });
      ctx.restore();
      return;
    }
    // Lying still. Carried: two comrades walk him back from the line (VISION.md §16 names both). The carried dead nobody names
    // are Astra's covered, still bundle (`fallen-carry`, 2026-10-04); living wounded have their own art above.
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the wounded carried" - a Texian carried while he is being carried is
    // Claude's `bearers-carry` (two men and a blanket); otherwise, and while it loads, two walking figures beside the lying one.
    const carry = f.down.carried ? Math.min(1, (since - FALL.down) / 20000) : 0;
    const dx = carry * f.size * 3 * (f.side === 'mexican' ? 1 : -1);
    const transported = f.down.carried && !f.name && art.animated(ctx, `${kind}-fallen-carry`, x + dx, y, f.size, `fallen:${f.slot.index}`, { timeMs: Math.max(0, since - FALL.down), flip: f.side !== 'mexican', paused: carry >= 1 });
    if (!transported && carry > 0 && carry < 1 && f.side !== 'mexican' && art.animated(ctx, 'bearers-carry', x + dx, y, f.size, `${f.slot.index}:carry`, { flip: true })) return;
    if (!transported) {
      if (!art.drawSprite(ctx, `${kind}-reclining`, x + dx, y, f.size)) { ctx.fillStyle = '#6b6153'; ctx.fillRect(x + dx - f.size * 0.4, y - f.size * 0.12, f.size * 0.8, f.size * 0.12); }
      if (f.down.carried) for (const off of [-0.45, 0.45]) art.animated(ctx, `${kind}-march`, x + dx + off * f.size, y + 2, f.size, `${f.slot.index}:${off}`, { flip: f.side !== 'mexican' });
    }
    // A man the record names where he fell (Milam), and only him: the sampled figures are nobody.
    if (f.name && f.size >= 14) {
      ctx.font = `${Math.round(Math.max(11, Math.min(15, f.size * 0.3)))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(f.name, x + dx, y + 14); ctx.fillStyle = '#26382e'; ctx.fillText(f.name, x + dx, y + 14);
    }
  }

  function drawCannon(ctx, battle, camera, figurePx, time, now, wind, reducedMotion) {
    const gun = battle.cannon, side = battle.sides.find(one => one.side === gun.side);
    const right = (side?.facing?.x ?? 1) >= 0;
    const shown = view.sides.get(gun.side), live = shown ? placeAt(shown, now) : side;
    // The gun moves with its side: its offset from the side's centre, carried smoothly with it.
    const at = { x: gun.x + (live.x - side.x), y: gun.y + (live.y - side.y) };
    const p = camera.toScreen(at), size = figurePx * 1.4;
    const last = view.cannonFiredAt.filter(t => t <= now).at(-1);
    const since = last === undefined ? Infinity : now - last;
    const coming = view.cannonFiredAt.find(t => t > now), ready = coming !== undefined && coming - now < GUN.ready;
    const metal = gun.metal === 'bronze' ? 'bronze' : 'iron';
    const cartwheels = gun.claimId === 'HIST-TEX-475' && metal === 'bronze';
    const name = cartwheels ? `cannon-cartwheels-${right ? 'e' : 'w'}` : `cannon-${metal}-${right ? 'e' : 'w'}`;
    const firing = since < GUN.recoil;
    if (firing) art.animated(ctx, cartwheels ? `cannon-cartwheels-${right ? 'e' : 'w'}-recoil` : `${name}-recoil`, p.x, p.y, size, 0, { timeMs: since * 900 / GUN.recoil });
    else art.drawSprite(ctx, name, p.x, p.y, size) || (ctx.fillStyle = '#3b3a36', ctx.fillRect(p.x - size * 0.4, p.y - size * 0.3, size * 0.8, size * 0.22));
    // The crew: one ramming between shots, one bringing the charge, one at the touch-hole who pulls and covers his ears.
    // The Gonzales cart-wheel gun has a civilian rammer, charge carrier and igniter - Astra's (2026-10-03), which retired Claude's
    // `settler-gun-*` stand-ins of the same names; other guns keep their crews.
    const back = right ? -1 : 1;
    // A carriage gun's crew stands ready (`ready`, the shot the page knows is coming) and the recoil is drawn over the gun's own
    // recoil time (`GUN.recoil`); Astra's settlers keep their own clips' timing.
    const recoilT = cartwheels ? since : since * 900 / GUN.recoil, standT = firing ? recoilT : ready && !cartwheels ? 0 : time;
    // Every man at the soldier's own size: the rammer crouching with his hands over his ears is measured against him standing
    // (scripts/build-atlas-manifest.mjs FIGURE_HEIGHTS, 2026-10-04) and draws 0.69-0.72 of him; x0.65 here guessed it.
    const crew = [
      { clip: cartwheels ? (firing ? 'settler-gun-rammer-cover' : 'settler-gun-ram') : (firing || ready ? 'volunteer-gun-fire' : 'volunteer-gun-ram'), dx: back * 0.75, t: standT },
      { clip: cartwheels ? 'settler-gun-carry' : 'volunteer-gun-shot-carry', dx: back * 1.35, t: time },
      { clip: cartwheels ? (firing ? 'settler-gun-fire' : 'settler-gun-ready') : (firing || ready ? 'volunteer-gun-fire' : 'volunteer-idle-e'), dx: back * 0.2, dy: 0.35, t: standT },
    ].slice(0, gun.crew || 3);
    for (const man of crew) art.animated(ctx, man.clip, p.x + man.dx * figurePx, p.y + (man.dy || 0) * figurePx, figurePx, `crew:${man.clip}:${man.dx}`, { timeMs: man.t, flip: !right, paused: reducedMotion });
    // Each shot, once: the flash, and a bank of smoke that lies on the field long after.
    const pending = view.cannonFiredAt.filter(t => t <= now && !view.shotsSeen.has(`cannon:${t}`));
    for (const t of pending) {
      view.shotsSeen.add(`cannon:${t}`);
      if (reducedMotion) continue;
      view.shotsTotal++;
      const muzzle = { x: at.x + (right ? 1 : -1) * 0.02, y: at.y - 0.004 };
      flash(muzzle.x, muzzle.y, right, now, 2.4); view.thumps.push(now);
      for (let i = 0; i < 4; i++) puff(muzzle.x + (right ? 1 : -1) * i * 0.008, muzzle.y + (Math.random() - 0.5) * 0.01, now, { big: true, wind, dir: right ? 1 : -1 });
    }
    return { x: Math.round(p.x), y: Math.round(p.y), firing, ready, shots: view.cannonFiredAt.filter(t => t <= now).length };
  }

  /**
   * What stands on the ground (sim/battles/<id>.mjs `works`), laid across the line between the two camps: a breastwork with the
   * opening its gun stood in, a camp's fires, a marsh, open water. Stable: every piece is placed by its work's id.
   * The baggage breastwork uses authored pack/saddle sections. The marsh uses authored shoreline ripple loops and open-water ripples;
   * moving non-firing infantry use authored wading poses within the wet works.
   * ceiling: the pieces are drawn over the map's own ground, whatever the map has there.
   */
  function drawWorks(ctx, battle, camera, figurePx, time, bounds) {
    let count = 0;
    const seen = p => !bounds || (p.x > -80 && p.y > -80 && p.x < bounds.width + 80 && p.y < bounds.height + 80);
    for (const work of battle.works || []) {
      const across = work.across || { x: 1, y: 0 }, toward = { x: across.y, y: -across.x };
      const at = (t, d = 0) => ({ x: work.x + across.x * t + toward.x * d, y: work.y + across.y * t + toward.y * d });
      const put = (point, draw) => { const p = camera.toScreen(point); if (!seen(p)) return; draw(p); count++; };
      // Astra's baggage breastwork (2026-10-03): her packs-and-saddles sections, the gap left in the middle; the library's crates,
      // sacks and barrels in a line only while her sheet loads.
      if (work.kind === 'breastwork') {
        const pieces = ['breastwork-packs-left', 'breastwork-packs-right'];
        const loading = ['crate', 'sacks', 'barrel', 'packed-belongings', 'sacks', 'crate'];
        const n = Math.max(8, Math.round(work.width / 0.01));
        for (let i = 0; i < n; i++) {
          const t = (i / (n - 1) - 0.5) * work.width;
          // "leaving an opening in the centre of the breastwork, in which their artillery was placed" (`HIST-TEX-522`).
          if (Math.abs(t) < 0.02) continue;
          const size = figurePx * (0.8 + 0.1 * hash(`${work.id}:${i}`));
          put(at(t, (hash(`${work.id}:${i}:d`) - 0.5) * 0.006), p => {
            if (!art.drawSprite(ctx, pieces[i % pieces.length], p.x, p.y, size) && !art.drawSprite(ctx, loading[i % loading.length], p.x, p.y, size * 0.75)) { ctx.fillStyle = '#7a6548'; ctx.fillRect(p.x - size * 0.45, p.y - size * 0.45, size * 0.9, size * 0.45); }
          });
        }
      } else if (work.kind === 'fires') {
        for (let i = 0; i < 5; i++) {
          const point = at((hash(`${work.id}:${i}:a`) - 0.5) * work.width, (hash(`${work.id}:${i}:b`) - 0.5) * work.width * 0.5);
          put(point, p => { if (!art.animated(ctx, 'fire-flicker', p.x, p.y, figurePx * 0.6, `${work.id}:${i}`, { timeMs: time })) art.drawSprite(ctx, 'campfire', p.x, p.y, figurePx * 0.6); });
          // Arms stacked by the fire (Astra's `musket-stack-small` and `-large`, 2026-10-03): men at rest have laid their muskets by.
          if (i % 2 === 0) put(at((hash(`${work.id}:${i}:a`) - 0.5) * work.width + 0.004, (hash(`${work.id}:${i}:b`) - 0.5) * work.width * 0.5 - 0.003), p => art.drawSprite(ctx, i % 4 === 0 ? 'musket-stack-large' : 'musket-stack-small', p.x, p.y, figurePx * 0.7));
        }
      } else {
        const marsh = work.kind === 'marsh', n = marsh ? 36 : 22;
        // The marsh is Astra's shoreline (2026-10-08): her dense and sparse `marsh-edge-*` patches of cordgrass and ripple where
        // the reeds stood, each on its own loop; the reeds' sway and the plain clumps only while her sheet loads. (Claude's
        // `marsh-edge-1`..`-3` tiles, drawn under the reeds until then, were retired with her delivery.)
        for (let i = 0; i < n; i++) {
          const a = hash(`${work.id}:${i}:a`), b = hash(`${work.id}:${i}:b`), r = Math.sqrt(hash(`${work.id}:${i}:r`)) * 0.5;
          const point = at(Math.cos(a * Math.PI * 2) * r * work.width, Math.sin(a * Math.PI * 2) * r * work.width * 0.55);
          const size = figurePx * (0.6 + 0.5 * b);
          put(point, p => {
            if (marsh && b < 0.7) {
              const clip = b < 0.35 ? 'marsh-edge-dense' : 'marsh-edge-sparse';
              if (!art.animated(ctx, clip, p.x, p.y, size, `${work.id}:${i}`, { timeMs: time }) &&
                  !art.animated(ctx, 'reeds-wind', p.x, p.y, size, `${work.id}:${i}`, { timeMs: time }))
                art.drawSprite(ctx, b < 0.35 ? 'marsh-cordgrass' : 'reeds', p.x, p.y, size);
            }
            else if (!art.animated(ctx, 'water-motion', p.x, p.y, size, `${work.id}:${i}`, { timeMs: time })) art.drawSprite(ctx, 'water-ripple', p.x, p.y, size);
          });
        }
      }
    }
    return count;
  }

  /**
   * A gun standing where the record puts it (sim/battles/<id>.mjs `guns`): its crew, each of its dated shots once - the
   * flash, the recoil and a bank of smoke - and nothing else moving it. A Mexican gun is served by regulars.
   */
  function drawGun(ctx, gun, camera, figurePx, time, now, wind, reducedMotion, bounds) {
    const heavy = gun.id === 'eighteen';
    const siegeBattery = gun.side === 'mexican' && gun.metal === 'bronze' && /^battery-(north-(far|mid|close)|west|south)$/.test(gun.id);
    const p = camera.toScreen(gun), size = figurePx * (heavy ? 2.2 : siegeBattery ? 1.9 : 1.4);
    const right = (gun.facing?.x ?? 1) >= 0;
    const fired = (view.gunFiredAt.get(gun.id) || []).filter(t => t <= now);
    const last = fired.at(-1), since = last === undefined ? Infinity : now - last;
    const coming = (view.gunFiredAt.get(gun.id) || []).find(t => t > now), ready = coming !== undefined && coming - now < GUN.ready;
    const pending = fired.filter(t => !view.shotsSeen.has(`gunshot:${gun.id}:${t}`));
    for (const t of pending) {
      view.shotsSeen.add(`gunshot:${gun.id}:${t}`);
      if (reducedMotion) continue;
      view.shotsTotal++; view.gunShotsTotal++;
      const reach = 0.02 * (view.smokeScale ?? 1), fx = gun.facing?.x ?? (right ? 1 : -1), fy = gun.facing?.y ?? 0;
      const muzzle = { x: gun.x + fx * reach, y: gun.y + fy * reach - 0.004 * (view.smokeScale ?? 1) };
      flash(muzzle.x, muzzle.y, right, now, 2.4); view.thumps.push(now);
      for (let i = 0; i < 4; i++) puff(muzzle.x + fx * i * reach * 0.4, muzzle.y + fy * i * reach * 0.4 + (Math.random() - 0.5) * reach * 0.5, now, { big: true, wind, dir: fx >= 0 ? 1 : -1 });
      // A few live puffs keep the shot legible while the authored canister cloud loads.
      if (gun.canister) for (let i = 0; i < 5; i++) { const spread = (i - 2) * 0.12, d = reach * (1 + i * 0.3); puff(muzzle.x + (fx - fy * spread) * d, muzzle.y + (fy + fx * spread) * d, now, { wind }); }
      view.gunShotsBy[gun.id] = (view.gunShotsBy[gun.id] || 0) + 1;
    }
    if (bounds && (p.x < -90 || p.y < -90 || p.x > bounds.width + 90 || p.y > bounds.height + 140)) return { id: gun.id, shots: fired.length, onScreen: false };
    const metal = gun.metal === 'bronze' ? 'bronze' : 'iron';
    const twin = gun.id === 'twin-sister-1' || gun.id === 'twin-sister-2';
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the Alamo", item 2 - the north wall's gun and the church's are
    // Claude's `cannon-alamo-north-*` and `cannon-alamo-church-*`; the library's iron field gun while they load.
    const alamo = gun.id === 'north-gun' ? 'north' : gun.id === 'church-guns' ? 'church' : null;
    const name = heavy ? `cannon-18pdr-${right ? 'e' : 'w'}`
      : siegeBattery ? `cannon-siege-battery-${right ? 'e' : 'w'}`
      : alamo ? `cannon-alamo-${alamo}-${right ? 'e' : 'w'}`
      : twin ? `twin-sister-painted-${right ? 'e' : 'w'}` : `cannon-${metal}-${right ? 'e' : 'w'}`;
    const firing = since < GUN.recoil, recoilMs = since * 900 / GUN.recoil;
    if (firing) art.animated(ctx, `${name}-recoil`, p.x, p.y, size, 0, { timeMs: recoilMs }) || art.animated(ctx, `cannon-${metal}-${right ? 'e' : 'w'}-recoil`, p.x, p.y, size, 0, { timeMs: recoilMs });
    else art.drawSprite(ctx, name, p.x, p.y, size) || art.drawSprite(ctx, `cannon-${metal}-${right ? 'e' : 'w'}`, p.x, p.y, size) || (ctx.fillStyle = '#3b3a36', ctx.fillRect(p.x - size * 0.4, p.y - size * 0.3, size * 0.8, size * 0.22));
    if (gun.canister && since >= 0 && since < 820 && !reducedMotion) {
      const reach = 0.02 * (view.smokeScale ?? 1), fx = gun.facing?.x ?? (right ? 1 : -1), fy = gun.facing?.y ?? 0;
      const muzzle = camera.toScreen({ x: gun.x + fx * reach, y: gun.y + fy * reach - 0.004 * (view.smokeScale ?? 1) });
      art.animated(ctx, 'canister-burst', muzzle.x + (right ? 1 : -1) * figurePx * 0.7, muzzle.y, figurePx * 2.2,
        `canister:${gun.id}:${last}`, { timeMs: since, flip: !right });
    }
    const who = gun.side === 'mexican' ? 'regular' : 'volunteer', back = right ? -1 : 1;
    const service = twin ? 'twin-crew' : who;
    const crew = [
      { clip: firing || ready ? `${service}-gun-fire` : `${service}-gun-ram`, dx: back * 0.75, t: firing ? recoilMs : ready ? 0 : time },
      { clip: `${service}-gun-shot-carry`, dx: back * 1.35, t: time },
      { clip: firing || ready ? `${service}-gun-fire` : twin ? 'twin-crew-gun-ready' : `${who}-idle-e`, dx: back * 0.2, dy: 0.35, t: firing ? recoilMs : ready ? 0 : time },
    ].slice(0, gun.crew ?? 3);
    for (const man of crew) art.animated(ctx, man.clip, p.x + man.dx * figurePx, p.y + (man.dy || 0) * figurePx, figurePx, `crew:${gun.id}:${man.dx}`, { timeMs: man.t, flip: !right, paused: reducedMotion });
    // A famous gun is named on the field as a famous person is (owner, 2026-09-26: "Treat the Twin Sisters in a similar
    // fashion"; docs/BATTLES.md §2c.5).
    if (gun.named && gun.name) {
      ctx.save();
      const font = Math.round(Math.max(11, Math.min(15, figurePx * 0.3)));
      ctx.font = `${font}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(gun.name, p.x, p.y + font + 6); ctx.fillStyle = '#26382e'; ctx.fillText(gun.name, p.x, p.y + font + 6);
      ctx.restore();
    }
    return { id: gun.id, x: Math.round(p.x), y: Math.round(p.y), firing, ready, shots: fired.length, onScreen: true, ...(gun.named && { name: gun.name }) };
  }

  /**
   * A wall or a door broken in (Karnes's crowbar, `HIST-TEX-038`): a man at it with the bar until the minute it gives, then the
   * hole. Generic workers use authored crowbar cycles; optional breach.facing selects north/south views.
   * Named Karnes retains his own action; the gun-ram cycle remains a missing-library fallback.
   */
  function drawBreaches(ctx, camera, figurePx, time, now, reducedMotion, battle) {
    let shown = 0;
    for (const [id, breach] of view.breachAt) {
      if (!(battle.breaches || []).some(one => `${one.x.toFixed(5)}:${one.y.toFixed(5)}:${one.at}` === id)) continue;
      const p = camera.toScreen(breach);
      if (now >= breach.openAt) {
        if (!art.drawSprite(ctx, 'wall-breach', p.x, p.y, figurePx * 1.3)) { ctx.fillStyle = '#2d2620'; ctx.fillRect(p.x - figurePx * 0.25, p.y - figurePx * 0.6, figurePx * 0.5, figurePx * 0.6); }
        view.breachesSeen.add(id); shown++;
      } else if (!(battle.id === 'bexar-storming' && battle.phase === 'karnes' && (battle.people || []).some(person => person.id === 'karnes' && person.pose === 'work'))) {
        const who = breach.side === 'mexican' ? 'regular' : 'volunteer';
        art.drawSprite(ctx, 'tools', p.x + figurePx * 0.5, p.y, figurePx * 0.6);
        const direction = ['n', 's'].includes(breach.facing) ? breach.facing : 'e';
        const clip = `${who}-crowbar${direction === 'e' ? '' : `-${direction}`}`;
        const options = { timeMs: time, paused: reducedMotion };
        if (!art.animated(ctx, clip, p.x - figurePx * 0.35, p.y, figurePx, `bar:${id}`, options) &&
            !(direction !== 'e' && art.animated(ctx, `${who}-crowbar`, p.x - figurePx * 0.35, p.y, figurePx, `bar:${id}`, options)))
          art.animated(ctx, `${who}-gun-ram`, p.x - figurePx * 0.35, p.y, figurePx, `bar:${id}`, options);
      }
    }
    return shown;
  }

  /**
   * A white flag of truce where the record puts it (`HIST-TEX-491`: Sánchez Navarro used a white flag "because the Texians did
   * not understand the bugle"), carried by a soldier of the correct side.
   */
  function drawWhiteFlag(ctx, flag, camera, figurePx, time, wind) {
    const p = camera.toScreen(flag), pole = figurePx * 1.8, w = figurePx * 0.9, h = figurePx * 0.6;
    const bearer = flag.side === 'mexican' ? 'regular' : 'volunteer';
    const own = `white-flag-${bearer}`;
    const painted = flag.moving
      ? art.animated(ctx, `${own}-walk-e`, p.x, p.y, pole, `white-flag:${flag.side}`, { timeMs: time })
      : art.drawSprite(ctx, `${own}-idle-e`, p.x, p.y, pole);
    if (painted) { view.whiteFlag = { x: Math.round(p.x), y: Math.round(p.y) }; return; }
    if (!art.animated(ctx, 'regular-idle-s', p.x - figurePx * 0.25, p.y, figurePx, 'flag-bearer', { timeMs: time })) art.miniPerson(ctx, p.x - figurePx * 0.25, p.y, figurePx, { side: flag.side });
    const wave = Math.sin(time / 380) * 0.1 + (wind?.x || 0) * 0.3;
    ctx.save();
    ctx.strokeStyle = '#4a3a26'; ctx.lineWidth = Math.max(1.2, figurePx * 0.05);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - pole); ctx.stroke();
    ctx.translate(p.x, p.y - pole); ctx.transform(1, wave * 0.5, 0, 1, 0, 0);
    ctx.fillStyle = '#fbfaf5'; ctx.strokeStyle = '#8b8575'; ctx.lineWidth = 1;
    ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
    ctx.restore();
    view.whiteFlag = { x: Math.round(p.x), y: Math.round(p.y) };
  }

  /**
   * The flag, where the record puts it (sim/battles/<id>.mjs `flag`).
   * The completed flag uses the delivered cloth cycle. Canvas is a fallback if art fails to load.
   */
  /**
   * The named people the record puts there (`battle.people`): drawn where it puts them, named, and speaking only what a
   * source gives them. Travis at the north battery, firing, and falling where Joe said he fell; Joe hidden in a house and
   * coming out when the officers call - his own account, never a mechanic (docs/MILITARY_EXPERIENCE.md "Survivors and Joe").
   * Travis is drawn from his own sheet since 2026-09-26 (the Alamo request's item 8 delivered); see `drawPerson` for the rest.
   */
  function drawPeople(ctx, battle, camera, figurePx, time, now, bounds) {
    view.peopleSpots = {};
    const shown = [], labels = [];
    const phaseMinute = battle.phaseMinute ?? battle.minute;
    for (const person of battle.people || []) {
      const p = camera.toScreen(person), fellAt = view.peopleFellAt.get(person.id);
      const fell = Number.isFinite(fellAt) && fellAt <= now;
      const hurt = Number.isFinite(person.hurt) && person.hurt <= battle.minute;
      const completedKarnesBreach = battle.id === 'bexar-storming' && battle.phase === 'karnes' && person.id === 'karnes' && (battle.breaches || []).some(breach => breach.open && Math.hypot(breach.x - person.x, breach.y - person.y) < 0.003);
      const lamarRescue = battle.id === 'san-jacinto' && battle.phase === 'skirmish' && person.id === 'lamar' && phaseMinute >= 44 && phaseMinute < 50;
      const shermanRally = battle.id === 'san-jacinto' && battle.phase === 'skirmish' && person.id === 'sherman' && phaseMinute >= 22 && phaseMinute < 25;
      const johnsonCommand = battle.id === 'bexar-storming' && battle.phase === 'night-7' && person.id === 'johnson' && phaseMinute >= 180;
      const grantGallop = battle.id === 'agua-dulce' && battle.phase === 'ambush' && person.id === 'grant' && person.pose === 'ride';
      const shownPerson = completedKarnesBreach ? { ...person, pose: 'stand' } : lamarRescue ? { ...person, rescue: true } : shermanRally ? { ...person, rally: true } : johnsonCommand ? { ...person, pose: 'command', moving: false } : grantGallop ? { ...person, gallop: true } : person;
      const how = drawPerson(ctx, shownPerson, p, figurePx, time, { fell, fellAgo: fell ? now - fellAt : 0, hurt, now });
      view.peopleSpots[person.id] = view.peopleSpots[person.name] = { x: p.x, y: p.y - figurePx * (person.pose === 'ride' && !fell ? 1.35 : 1) };
      view.peopleShown.add(person.id);
      // How each was drawn the first frame they were on the field (the burial party before its sheet arrived, or not).
      if (!view.peopleFirst.has(person.id)) view.peopleFirst.set(person.id, how);
      labels.push({ person, x: p.x, y: p.y });
      shown.push({ id: person.id, name: person.name, fell, hurt, pose: fell ? person.still || 'still' : hurt ? 'wounded' : person.moving ? 'walk' : shownPerson.pose, drawnAs: how, first: view.peopleFirst.get(person.id), ...(person.bears && { bears: person.bears }), x: Math.round(p.x), y: Math.round(p.y), labelled: false, onScreen: !bounds || (p.x >= 0 && p.y >= 0 && p.x <= bounds.width && p.y <= bounds.height) });
    }
    // Every famous person's name under them (owner, docs/BATTLES.md §2c.2: "names on the map, no cards"), stepped down out of
    // each other's way where several stand together (the church guns at the Alamo; the sacristy, where Mrs. Dickinson and the
    // five Esparzas make six names at one spot, so up to ten steps), and a dashed tag under a name where the
    // record is one account among others (Crockett: "One account (de la Peña) · disputed").
    const boxes = [];
    const font = Math.round(Math.max(11, Math.min(15, figurePx * 0.3)));
    ctx.save();
    ctx.font = `${font}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const { person, x, y } of labels) {
      const text = person.name, w = ctx.measureText(text).width + 6;
      let top = y + 3;
      for (let i = 0; i < 10 && boxes.some(b => x - w / 2 < b.x + b.w && b.x < x + w / 2 && top < b.y + b.h && b.y < top + font + 3); i++) top += font + 3;
      boxes.push({ x: x - w / 2, y: top, w, h: font + 3 });
      const said = shown.find(one => one.id === person.id);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(text, x, top + font); ctx.fillStyle = '#26382e'; ctx.fillText(text, x, top + font); said.labelled = true;
      if (person.tag) {
        const tagFont = Math.max(10, font - 2);
        ctx.font = `italic ${tagFont}px system-ui`;
        const tw = ctx.measureText(person.tag).width + 10, ty = top + font + 4;
        ctx.fillStyle = 'rgba(252,249,238,.94)'; ctx.fillRect(x - tw / 2, ty, tw, tagFont + 6);
        ctx.setLineDash([4, 3]); ctx.strokeStyle = '#6e6044'; ctx.lineWidth = 1.2; ctx.strokeRect(x - tw / 2, ty, tw, tagFont + 6); ctx.setLineDash([]);
        ctx.fillStyle = '#3b392f'; ctx.fillText(person.tag, x, ty + tagFont + 2); said.tag = person.tag;
        boxes.push({ x: x - tw / 2, y: ty, w: tw, h: tagFont + 6 });
        ctx.font = `${font}px system-ui`;
      }
    }
    ctx.restore();
    return shown;
  }

  /**
   * One famous person, as themselves where the library has their sheet (scripts/art-deliveries/famous-*.mjs) and as the
   * nearest figure it has where it has not. stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the famous people" - every
   * `officer`, `frontiersman`, `general` and `rider` in sim/people.mjs is a volunteer, a regular, a dragoon or the mounted
   * courier; Crockett taken, and the famous fallen who have no still pose of their own, are the volunteer's surrender and
   * reclining frames; nobody but Houston and Santa Anna has a horse of their own. Returns what it drew, for the evidence.
   */
  function drawPerson(ctx, person, p, figurePx, time, state) {
    const how = drawPersonAs(ctx, person, p, figurePx, time, state, personArt(person.art));
    // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - a pose drawn from a Claude sheet that
    // has not loaded yet is drawn meanwhile as before: from Astra's own entry where the person has one, else as the library
    // figure they stood in as (`fallback`: the woman, the girl, the boy, the townsman), else as their side's figure.
    if (how || !CLAUDE_PERSON_ART[person.art]) return how;
    const before = PERSON_ART[person.art] ? person : { ...person, art: CLAUDE_PERSON_ART[person.art].fallback || null };
    return drawPersonAs(ctx, before, p, figurePx, time, state, PERSON_ART[before.art] || null);
  }
  function drawPersonAs(ctx, person, p, figurePx, time, { fell, fellAgo, hurt, now }, own) {
    if (person.thing) return null;
    const mexican = person.side === 'mexican';
    const kind = mexican ? 'regular' : 'volunteer';
    const size = person.child ? figurePx * 0.6 : figurePx;
    const flip = !person.right;
    const key = `person:${person.id}`;
    const sprite = name => art.drawSprite(ctx, name, p.x, p.y, size, { flip }) ? name : null;
    const clip = (name, timeMs = time, extra = {}) => art.animated(ctx, name, p.x, p.y, extra.size || size, key, { timeMs, flip, ...extra }) ? name : null;
    // The fallen: a moment hurt, then lying still, no blood (`VISION.md` §16). A man killed on his cot simply lies still.
    if (fell) {
      if (person.still && own?.[person.still]) return sprite(own[person.still]);
      if (fellAgo < 700 && own?.fall) return clip(own.fall, fellAgo);
      if (own?.still) return sprite(own.still);
      if (fellAgo < 700 && !person.still) return sprite(`${kind}-injured`);
      return sprite(`${kind}-reclining`);
    }
    if (person.bears) return drawBearers(ctx, person, p, size, time, flip, key);
    const pose = hurt ? 'wounded' : person.moving && !['ride', 'escape'].includes(person.pose) ? 'walk' : person.pose || 'stand';
    const named = own?.[pose];
    // At his own size: the crate's sheet is measured from Castrillón standing on the ground beside it (scripts/build-atlas-manifest.mjs
    // FAMOUS_STANDING, 2026-10-04), so on the crate he draws 1.17 of himself; x1.18 here guessed that until then.
    if (pose === 'crate-command' && own?.['crate-command']) return clip(own['crate-command'].slice(5), time);
    if (pose === 'walk') {
      const directedWalk = person.heading === 'north' ? own?.walkNorth : person.heading === 'south' ? own?.walkSouth : null;
      if (directedWalk) return clip(directedWalk, time, { flip: false });
      if (own?.walk) return clip(own.walk) || clip(`${kind}-march`);
      return clip(`${kind}-march`);
    }
    if (pose === 'ride') {
      // Astra's own mounted art first: Grant's gallop, Lamar's rescue, Sherman's rally, and a mounted walk by its heading.
      if (person.gallop && own?.rideGallop) return clip(own.rideGallop, time, { size: figurePx * 1.35 });
      if (person.rescue && own?.rideRescue) return sprite(own.rideRescue);
      if (person.rally && own?.rideRally) return sprite(own.rideRally);
      const directed = (person.heading === 'north' ? own?.rideNorth : person.heading === 'south' ? own?.rideSouth : null) || named;
      if (typeof directed === 'string' && directed.startsWith('clip:')) return clip(directed.slice(5), time, { size: figurePx * 1.35, flip: person.heading ? person.heading === 'west' : !person.right });
      // stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - full mounted movement for Dr. Sutherland
      // (`sutherland-ride-e`; request 2026-09-26 "the famous people") where it is loaded. Seguín's is Astra's now (above); Claude's
      // `seguin-ride-e` is held back (public/art-subjects.js).
      const moving = person.moving && art.clipReady?.(`${person.id}-ride-e`) && clip(`${person.id}-ride-e`, time, { size: figurePx * 1.35 });
      if (moving) return moving;
      if (named) return sprite(named);
      return clip(mexican ? 'dragoon-march' : 'mounted-courier-e', time, { size: figurePx * 1.35 });
    }
    if (pose === 'fire') {
      if (Array.isArray(named)) { const t = (time + hash(key) * 12000) % 12000; return sprite(named[t < 1500 ? 0 : t < 1800 ? 1 : 2]); }
      if (named) return clip(named, musketClip(time % MUSKET_MS));
      return clip(`${kind}-fire-reload`, musketClip((time + hash(key) * MUSKET_MS) % MUSKET_MS));
    }
    // Joe, firing from the house he took cover in (his own account): hidden, with the flash and the smoke at its door.
    if (pose === 'fire-hidden') {
      const t = (time + hash(key) * 6000) % 5200;
      if (t < 120 && !view.hiddenShots.has(`${person.id}:${Math.floor((time + hash(key) * 6000) / 5200)}`)) {
        view.hiddenShots.add(`${person.id}:${Math.floor((time + hash(key) * 6000) / 5200)}`);
        flash(person.x, person.y, person.right, now, 0.8);
        puff(person.x + (person.right ? 0.002 : -0.002), person.y, now, { wind: null });
      }
      const firing = own?.fireHidden || 'joe-hide';
      return art.animated(ctx, firing, p.x, p.y, size, 0, { timeMs: t, flip }) ? firing : clip(own?.hide ? own.hide.slice(5) : `${kind}-idle-e`);
    }
    if (named) return typeof named === 'string' && named.startsWith('clip:') ? clip(named.slice(5)) : sprite(named);
    // Stand-ins for poses without art of their own.
    if (pose === 'captive' || pose === 'surrender') return clip(`${kind}-surrender`);
    if (pose === 'wounded') return clip(`${kind}-injured-rest`);
    if (pose === 'sick' || pose === 'seated') return clip(`${kind}-injured-rest`);
    if (pose === 'prisoner') return clip(`${kind}-surrender`);
    return clip(`${kind}-idle-${person.right ? 'e' : 'w'}`, time, { flip: false }) || null;
  }

  /**
   * A body carried away for burial (Gregorio Esparza's, by his brother Francisco and one of their brothers, `HIST-TEX-608`): the
   * named man in front, a second walking behind him, and between their hands a long pale bundle tied at three places - no body,
   * no face, no wound (`VISION.md` §16). stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the Esparza family", item 4 - the
   * bundle is drawn on the canvas and the bearers are the settler's walk until a burial party's own frames exist.
   */
  function drawBearers(ctx, person, p, size, time, flip, key) {
    // The burial party's own frames where they are drawn (Claude's `burial-party-walk-e`): both men and the wrapped body in one.
    const party = personArt(person.art)?.bearers;
    if (party && art.animated(ctx, party, p.x, p.y, size, key, { timeMs: time, flip })) return party;
    const walker = personArt(person.art)?.walk || 'volunteer-march';
    const back = (person.right ? -1 : 1) * size * 1.2;
    const behind = art.animated(ctx, walker, p.x + back, p.y, size, `${key}:bearer`, { timeMs: time + 260, flip });
    const cx = p.x + back * 0.5, cy = p.y - size * 0.4, half = Math.abs(back) * 0.52, thick = size * 0.1;
    ctx.save();
    ctx.fillStyle = '#e8dfc8'; ctx.strokeStyle = '#6e6044'; ctx.lineWidth = Math.max(1, size * 0.03);
    ctx.beginPath(); ctx.ellipse(cx, cy, half, thick, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    for (const at of [-0.55, 0, 0.55]) { ctx.moveTo(cx + at * half, cy - thick); ctx.lineTo(cx + at * half, cy + thick); }
    ctx.stroke();
    ctx.restore();
    const front = art.animated(ctx, walker, p.x, p.y, size, key, { timeMs: time, flip });
    return behind && front ? `${walker}+shroud` : null;
  }

  /**
   * Smoke going up from a place a long way off - huts burning - and never what is burning (VISION.md §16). stand-in:
   * docs/ART_REQUESTS.md, request 2026-09-25 "the Alamo", item 9 - the library's rising smoke, drawn large. The Alamo's
   * pyres on the afternoon of March 6 are the delivered non-graphic lamo-funeral-pyre sheet at their three separate
   * reconstructed sites (sim/battles/alamo.mjs urial), unlit from about three and burning from about five.
   */
  function drawPlume(ctx, plume, camera, figurePx, time, reducedMotion) {
    const p = camera.toScreen(plume), size = figurePx * 3.2;
    if (plume.kind === 'alamo-pyre') {
      const pyreSize = figurePx * 6.2;
      if (!plume.lit) art.drawSprite(ctx, 'alamo-pyre-unlit', p.x, p.y, pyreSize);
      else art.animated(ctx, 'alamo-pyre-burning', p.x, p.y, pyreSize, `pyre:${plume.x}:${plume.y}`, { timeMs: time, paused: reducedMotion });
      return;
    }
    if (art.animated(ctx, 'smoke-column-far-rise', p.x, p.y, size, `plume:${plume.x}`, { timeMs: time, paused: reducedMotion })
      || art.animated(ctx, 'smoke-rise', p.x, p.y, size, `plume:${plume.x}`, { timeMs: time, paused: reducedMotion })) return;
    const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y - size * 1.6);
    g.addColorStop(0, 'rgba(90,86,80,.55)'); g.addColorStop(1, 'rgba(160,156,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y - size * 0.8, size * 0.28, size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
  }

  /**
   * Scaling ladders: carried at the head of a column, and against the wall where it climbs, with a man going up each.
   * The authored carrier, set-ladder and climber sheets follow the existing assault positions and timing.
   */
  function drawLadders(ctx, side, centre, facing, camera, figurePx, time) {
    const n = Math.max(1, Math.min(8, side.ladders | 0));
    ctx.save();
    ctx.strokeStyle = '#6b4f2e'; ctx.lineWidth = Math.max(1, figurePx * 0.05);
    for (let i = 0; i < n; i++) {
      const across = (n > 1 ? i / (n - 1) - 0.5 : 0) * (side.spread?.width || 0.02) * 0.8;
      const base = camera.toScreen({ x: centre.x + facing.x * 0.004 - facing.y * across, y: centre.y + facing.y * 0.004 + facing.x * across });
      const tall = figurePx * 1.4;
      // Carried: level at shoulder height. Climbing: standing up against the wall ahead, leaning toward it.
      const top = side.climbing ? { x: base.x + facing.x * figurePx * 0.35, y: base.y - tall } : { x: base.x + facing.x * tall * 0.9, y: base.y - figurePx * 0.6 + facing.y * tall * 0.2 };
      const bottom = side.climbing ? base : { x: base.x, y: base.y - figurePx * 0.6 };
      const painted = side.climbing
        ? art.drawSprite(ctx, facing.x < 0 ? 'ladder-set-w' : 'ladder-set-e', base.x, base.y, tall)
        : art.animated(ctx, 'ladder-carried-e', base.x, base.y, figurePx, `ladder:${side.id}:${i}`, { timeMs: time, flip: facing.x < 0 });
      if (!painted) {
        const nx = -(top.y - bottom.y), ny = top.x - bottom.x, len = Math.hypot(nx, ny) || 1, w = figurePx * 0.08;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bottom.x + nx / len * w * s, bottom.y + ny / len * w * s); ctx.lineTo(top.x + nx / len * w * s, top.y + ny / len * w * s); ctx.stroke(); }
        for (let r = 1; r < 6; r++) { const t = r / 6, x = bottom.x + (top.x - bottom.x) * t, y = bottom.y + (top.y - bottom.y) * t; ctx.beginPath(); ctx.moveTo(x - nx / len * w, y - ny / len * w); ctx.lineTo(x + nx / len * w, y + ny / len * w); ctx.stroke(); }
      }
      if (side.climbing) {
        const up = ((time + i * 900) % 3200) / 3200;
        const x = bottom.x + (top.x - bottom.x) * up, y = bottom.y + (top.y - bottom.y) * up;
        art.animated(ctx, 'regular-climb', x, y, figurePx * 0.8, `climb:${i}`, { timeMs: time })
          || art.animated(ctx, 'regular-march-n', x, y, figurePx, `climb:${i}`, { timeMs: time });
      }
    }
    ctx.restore();
  }

  function drawFlag(ctx, flag, camera, figurePx, time, wind) {
    const texian = flag.fixed ? null : view.sides.get(flag.side), side = texian ? placeAt(texian, performance.now()) : null;
    const base = side ? { x: flag.x + (side.x - texian.to.x), y: flag.y + (side.y - texian.to.y) } : flag;
    let p = camera.toScreen(base), pole = figurePx * 1.9;
    const w = figurePx * 1.15, h = figurePx * 0.72;
    // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the Alamo", item 5 - the red flag on San Fernando's tower. Claude's
    // `san-fernando-tower-1836` ("Claude-drawn stand-ins") is the church's own south-east corner and tower, laid over the church
    // the map draws (public/bexar-layout.js `san-fernando`, at the town's scale, so it never stands beside it as a second
    // tower), and the pole stands on its lantern. The numbers are scripts/claude-art/areas/civic.mjs `towerOnChurch()`: where
    // the tower frame's anchor lies from the church frame's (source pixels right and up), both logical heights, and the
    // lantern as shares of the tower's drawn height. Without the sheet, the flag at the town's point as before.
    // ceiling: registered to Claude's church frame; when Astra's `bexar-san-fernando-1836` lands with her own tower, deliver
    // the tower frame with it (or read the numbers from her frame) - the way out is a `flagFoot` in the manifest.
    if (flag.kind === 'red') {
      const TOWER = { name: 'san-fernando-tower-1836', offset: [158.9, 10.5], churchLogical: 204, towerLogical: 480, foot: [0.1093, 0.9236] };
      const church = BEXAR_LAYOUT.buildings.find(b => b.id === 'san-fernando'), o = church && bexarToSite(church);
      if (o) {
        const at = camera.toScreen({ x: base.x + o.x, y: base.y + o.y }), mile = camera.toScreen({ x: base.x + o.x + 1, y: base.y + o.y });
        const k = church.heightFeet * Math.hypot(mile.x - at.x, mile.y - at.y) / 5280 / TOWER.churchLogical, tall = TOWER.towerLogical * k;
        const anchor = { x: at.x + TOWER.offset[0] * k, y: at.y - TOWER.offset[1] * k };
        if (art.drawSprite(ctx, TOWER.name, anchor.x, anchor.y, tall)) { p = { x: anchor.x + tall * TOWER.foot[0], y: anchor.y - tall * TOWER.foot[1] }; pole = figurePx * 1.3; }
      }
    }
    // The delivered cloth is the Come and Take It flag: only that flag is drawn with it, never the Alamo's red one.
    if (flag.kind !== 'red' && art.animated(ctx, 'flag-come-and-take-it-wind', p.x, p.y, pole, 'gonzales-flag', { timeMs: time })) {
      return { x: Math.round(p.x), y: Math.round(p.y - pole), w: Math.round(w), h: Math.round(h), words: figurePx >= 22 };
    }
    if (flag.kind === 'red' && art.animated(ctx, 'flag-red-wind', p.x, p.y, pole, 'alamo-red-flag', { timeMs: time })) {
      return { x: Math.round(p.x), y: Math.round(p.y - pole), w: Math.round(w), h: Math.round(h), words: false };
    }
    const wave = Math.sin(time / 420) * 0.08 + (wind?.x || 0) * 0.3;
    ctx.save();
    ctx.strokeStyle = '#4a3a26'; ctx.lineWidth = Math.max(1.2, figurePx * 0.05);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - pole); ctx.stroke();
    ctx.translate(p.x, p.y - pole);
    ctx.transform(1, wave * 0.5, 0, 1, 0, 0);
    // Load fallback for the red flag of no quarter (`HIST-TEX-054`); the authored sheet above is the usual path.
    if (flag.kind === 'red') {
      ctx.fillStyle = '#a3241c'; ctx.strokeStyle = '#5e140f'; ctx.lineWidth = 1;
      ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
      ctx.restore();
      return { x: Math.round(p.x), y: Math.round(p.y - pole), w: Math.round(w), h: Math.round(h), words: false };
    }
    ctx.fillStyle = '#f3efe4'; ctx.strokeStyle = '#6d6250'; ctx.lineWidth = 1;
    ctx.fillRect(0, 0, w, h); ctx.strokeRect(0, 0, w, h);
    ctx.fillStyle = '#1f1d1a';
    // The star over the gun.
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? h * 0.05 : h * 0.12, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(w * 0.5 + Math.cos(a) * r, h * 0.2 + Math.sin(a) * r); }
    ctx.fill();
    // The gun: a barrel on a wheel.
    ctx.fillRect(w * 0.28, h * 0.38, w * 0.46, h * 0.12);
    ctx.beginPath(); ctx.arc(w * 0.42, h * 0.56, h * 0.08, 0, Math.PI * 2); ctx.fill();
    if (figurePx >= 22) {
      ctx.font = `bold ${Math.max(6, Math.round(h * 0.16))}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(flag.words || 'COME AND TAKE IT', w * 0.5, h * 0.82, w * 0.92);
    }
    ctx.restore();
    // Where it was drawn, for the proof that it is on the screen and not only in the data.
    return { x: Math.round(p.x), y: Math.round(p.y - pole), w: Math.round(w), h: Math.round(h), words: figurePx >= 22 };
  }

  function drawParley(ctx, battle, camera, figurePx, time) {
    const p = camera.toScreen(battle.parley);
    const people = battle.parley.people || [];
    const texRight = (battle.sides.find(s => s.side === 'texian')?.facing?.x ?? 1) >= 0;
    // The two commanders a few yards apart between the lines; each is drawn as his side is, and named, because the record
    // names them. Neither says anything here that is not a documented line (sim/battle-stage.mjs `checkEngagement`).
    const spots = [{ side: 'texian', dx: texRight ? -1.2 : 1.2 }, { side: 'mexican', dx: texRight ? 1.2 : -1.2 }];
    view.parleySpots = {};
    for (const spot of spots) {
      const who = people.find(one => one.side === spot.side);
      const x = p.x + spot.dx * figurePx, size = spot.side === 'mexican' && who?.mounted ? figurePx * 1.35 : figurePx;
      const faceRight = spot.dx < 0;
      // A man lying hurt (`pose: 'injured'`): Houston, his ankle shattered, when Santa Anna is brought before him (`HIST-TEX-526`).
      const kind = spot.side === 'mexican' ? 'regular' : 'volunteer';
      const clip = who?.pose === 'injured' ? `${kind}-injured-rest` : spot.side === 'mexican' ? (who?.mounted ? `dragoon-idle-${faceRight ? 'e' : 'w'}` : `regular-idle-${faceRight ? 'e' : 'w'}`) : `volunteer-idle-${faceRight ? 'e' : 'w'}`;
      // Named parley participants use their own sheet when delivered. Santa Anna is in the plain soldier's
      // clothes he wore when found, while Houston sits with his bandaged ankle.
      const namedSprite = who?.name === 'Houston' && who.pose === 'injured' ? 'houston-injured-seated'
        : who?.name === 'Santa Anna' && !who.mounted ? 'santa-anna-disguised-idle'
          : who?.mounted ? personArt(who.id)?.rideIdle : personArt(who.id)?.stand;
      const namedDrawn = namedSprite?.startsWith('clip:')
        ? art.animated(ctx, namedSprite.slice(5), x, p.y, size, `parley:${who.id}`, { timeMs: time, flip: !faceRight })
        : namedSprite && art.drawSprite(ctx, namedSprite, x, p.y, size, { flip: !faceRight });
      if (!namedDrawn
        && !art.animated(ctx, clip, x, p.y, size, `parley:${spot.side}`, { timeMs: time, ...(who?.pose === 'injured' && { flip: !faceRight }) })) {
        art.miniPerson(ctx, x, p.y, size, { side: spot.side });
      }
      view.parleySpots[spot.side] = { x, y: p.y - size };
      if (who?.id) view.parleySpots[who.id] = view.parleySpots[spot.side];
      if (who?.name && figurePx >= 14) {
        ctx.font = `${Math.round(Math.max(11, Math.min(15, figurePx * 0.3)))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(who.name, x, p.y + 14); ctx.fillStyle = '#26382e'; ctx.fillText(who.name, x, p.y + 14);
      }
    }
  }

  /** A pale veil of fog over the field, thickest at its middle, at the phase's density (0 to 1). Returns the density drawn. */
  function drawFog(ctx, battle, camera, bounds, time, paused) {
    const shown = [...battle.sides, ...(battle.groups || [])].filter(side => side.action !== 'gone');
    if (!shown.length) return 0;
    const centre = { x: shown.reduce((s, side) => s + side.x, 0) / shown.length, y: shown.reduce((s, side) => s + side.y, 0) / shown.length };
    const c = camera.toScreen(centre), edge = camera.toScreen({ x: centre.x + 0.9, y: centre.y });
    const radius = Math.max(80, Math.hypot(edge.x - c.x, edge.y - c.y));
    const density = Math.max(0, Math.min(1, battle.fog));
    let banks = 0;
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const x = c.x + (i - 1) * radius * 0.42, y = c.y + (i - 1) * radius * 0.13;
      for (const [variant, alpha] of [['dense', density * density * 0.45], ['thin', density * (1 - density) * 0.45]]) {
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        if (art.animated(ctx, `fog-bank-${variant}`, x, y, Math.min(radius * 0.34, 260), `fog:${i}`, { timeMs: time + i * 1300, paused })) banks++;
      }
    }
    ctx.restore();
    view.fogBanks = banks;
    // Her banks are the fog; the veil only where they are not drawn.
    if (banks) return battle.fog;
    const veil = 1;
    const g = ctx.createRadialGradient(c.x, c.y, radius * 0.1, c.x, c.y, radius);
    g.addColorStop(0, `rgba(226,229,226,${0.78 * battle.fog * veil})`); g.addColorStop(0.6, `rgba(226,229,226,${0.6 * battle.fog * veil})`); g.addColorStop(1, 'rgba(226,229,226,0)');
    ctx.save(); ctx.fillStyle = g;
    ctx.fillRect(Math.max(0, c.x - radius), Math.max(0, c.y - radius), Math.min(bounds?.width ?? radius * 2, radius * 2), Math.min(bounds?.height ?? radius * 2, radius * 2));
    ctx.restore();
    return battle.fog;
  }

  /** The owner's Yellow Rose vignette. It is sent only to a page entitled to this phase of the battle. */
  function drawLegendScene(ctx, scene, camera, figurePx, time, reducedMotion) {
    if (scene.id !== 'emily-west-picnic' || scene.kind !== 'tradition') return null;
    const p = camera.toScreen(scene);
    // A slightly enlarged, dashed-edge vignette at normal battle zoom lets the class read the faces without implying
    // that this late legend is one more surveyed fact on the field.
    const scenePx = Math.max(figurePx, 46);
    art.drawSprite(ctx, 'picnic-command-tent', p.x, p.y - scenePx * 0.65, scenePx * 3.7);
    art.drawSprite(ctx, 'picnic-blanket', p.x, p.y + scenePx * 0.45, scenePx * 2.3);
    art.drawSprite(ctx, 'picnic-basket', p.x - scenePx * 1.05, p.y + scenePx * 0.8, scenePx * 0.9);
    art.drawSprite(ctx, 'picnic-jug-cups', p.x + scenePx * 1.05, p.y + scenePx * 0.82, scenePx * 0.65);
    const left = p.x - scenePx * 0.95, right = p.x + scenePx * 0.9, level = p.y + scenePx * 0.45;
    // Where each of the two is, so what the legend has her say comes out of her own figure (`FIC-GONZ-458`).
    view.legendSpots = { 'santa-anna': { x: left, y: level - scenePx * 1.1 }, 'emily-west': { x: right, y: level - scenePx * 1.1 } };
    if (scene.moment === 'alarm') {
      art.animated(ctx, 'santa-anna-picnic-alarm', left, level, scenePx * 1.25, 'santa-anna:picnic-alarm', { timeMs: time, paused: reducedMotion });
      art.drawSprite(ctx, 'emily-west-picnic-alarm', right, level, scenePx * 1.25);
    } else {
      art.animated(ctx, 'santa-anna-picnic-converse', left, level, scenePx * 1.25, 'santa-anna:picnic', { timeMs: time, paused: reducedMotion });
      art.animated(ctx, 'emily-west-picnic-converse', right, level, scenePx * 1.25, 'emily-west:picnic', { timeMs: time + 700, paused: reducedMotion });
    }
    // A dashed label stays with the figures even when the main battle caption changes phase.
    ctx.save();
    ctx.font = `${Math.round(Math.max(11, figurePx * 0.32))}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = 'LATER STORY · Emily West / Santa Anna';
    const width = Math.max(190, ctx.measureText(label).width + 20), top = p.y - scenePx * 3.4;
    ctx.fillStyle = 'rgba(252,249,238,.94)'; ctx.strokeStyle = '#6e6044'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]); ctx.fillRect(p.x - width / 2, top, width, 21); ctx.strokeRect(p.x - width / 2, top, width, 21);
    ctx.setLineDash([]); ctx.fillStyle = '#3b392f'; ctx.fillText(label, p.x, top + 11);
    ctx.restore();
    return { id: scene.id, kind: scene.kind, claimId: scene.claimId, moment: scene.moment, x: Math.round(p.x), y: Math.round(p.y) };
  }

  /**
   * A bank's smoke this frame, in the colour of powder smoke, thicker at the core. Into the low-resolution layer when there is one
   * (`ratio` under 1), straight onto the map when there is not (the tests' canvas). Its shape (§16.3): a heap of three soft lobes;
   * a volley's `wall`, five strung out along the line; a gun's `plume`, a column going up and spreading as it climbs (`rise` 0 to 1).
   */
  function drawBank(target, at, radius, alpha, seed, ratio, dark, shape = 'heap', rise = 0) {
    const tone = dark ? '150,150,158' : '238,236,228', core = dark ? '118,118,126' : '214,212,203';
    const lobes = shape === 'wall' ? [[-1.25, 0, 0.62], [-0.62, -0.08, 0.7], [0, 0, 0.78], [0.62, -0.06, 0.7], [1.25, 0, 0.62]]
      : shape === 'plume' ? [[0, 0, 0.8], [0.1, -0.9 * rise, 0.85 + 0.2 * rise], [-0.15, -1.8 * rise, 0.9 + 0.45 * rise], [0.2, -2.6 * rise, 0.95 + 0.7 * rise]]
      : [[0, 0, 0.9], [Math.cos(seed * 6.283) * 0.48, Math.sin(seed * 6.283) * 0.22, 0.72], [Math.cos(seed * 6.283 + 2.1) * 0.48, Math.sin(seed * 6.283 + 2.1) * 0.22, 0.72], [Math.cos(seed * 6.283 + 4.2) * 0.48, Math.sin(seed * 6.283 + 4.2) * 0.22, 0.72]];
    lobes.forEach(([dx, dy, size], i) => {
      const wobble = (hash(`${seed}:${i}`) - 0.5) * 0.18;
      const x = (at.x + (dx + wobble) * radius) * ratio, y = (at.y - radius * 0.35 + dy * radius) * ratio, r = radius * size * ratio;
      const a = alpha * (i ? 0.78 : 0.95);
      const g = target.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${core},${a.toFixed(3)})`);
      g.addColorStop(0.55, `rgba(${tone},${(a * 0.66).toFixed(3)})`);
      g.addColorStop(1, `rgba(${tone},0)`);
      target.fillStyle = g; target.beginPath(); target.arc(x, y, r, 0, Math.PI * 2); target.fill();
    });
  }
  /** The layer the banks are drawn into, a third of the map's resolution, laid over it in one stroke; null under node. */
  function smokeLayer(bounds) {
    if (!bounds || typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
    const width = Math.max(1, Math.ceil(bounds.width / 3)), height = Math.max(1, Math.ceil(bounds.height / 3));
    const layer = view.smokeLayer ||= document.createElement('canvas');
    if (layer.width !== width || layer.height !== height) { layer.width = width; layer.height = height; }
    const lctx = layer.getContext('2d');
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, width, height);
    return { layer, lctx, ratio: width / bounds.width };
  }
  /**
   * The class's own men in the fight, where the smoke is thinned round them so they are still seen in it (owner, 2026-09-30: the
   * smoke bigger, "keep the figures and name tags readable through it"; §16.3): each a soft clearing a figure and a half across.
   */
  function clearings(camera, figurePx) {
    const out = [];
    for (const id of view.members.keys()) { const spot = view.memberSpots.get(id); if (spot) { const p = camera.toScreen(spot); out.push({ x: p.x, y: p.y - figurePx * 0.5 }); } }
    return out;
  }
  function drawSmoke(ctx, camera, figurePx, now, reducedMotion, bounds, battle = null, clearAt = null) {
    view.smoke = view.smoke.filter(s => now - s.born < s.life);
    settleBanks(now);
    const dark = Boolean(battle && (battle.light === 'night' || battle.light === 'dawn' || (typeof battle.light === 'number' && battle.light > 0.5)));
    const inside = at => !bounds || (at.x >= -60 && at.y >= -60 && at.x <= bounds.width + 60 && at.y <= bounds.height + 60);
    const density = +view.banks.reduce((sum, bank) => sum + bank.d, 0).toFixed(3);
    const lingerMs = view.banks.length ? Math.round(Math.max(...view.banks.map(bank => now - bank.fed))) : 0;
    let cover = 0, banksInView = 0, haze = 0, plumes = 0, walls = 0;
    const layer = smokeLayer(bounds), target = layer ? layer.lctx : ctx, ratio = layer ? layer.ratio : 1;
    // Where the page drew the class's men this frame (screen, their middles), or where this view last had them on the ground.
    const clear = clearAt || clearings(camera, figurePx);
    // Thin the layer round each of the class's men before it is laid over the map (only where there is a layer to thin).
    const thin = () => {
      if (!layer || !clear.length) return;
      target.globalCompositeOperation = 'destination-out';
      for (const at of clear) {
        const r = figurePx * 1.5 * ratio, g = target.createRadialGradient(at.x * ratio, at.y * ratio, 0, at.x * ratio, at.y * ratio, r);
        g.addColorStop(0, 'rgba(0,0,0,0.72)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        target.fillStyle = g; target.beginPath(); target.arc(at.x * ratio, at.y * ratio, r, 0, Math.PI * 2); target.fill();
      }
      target.globalCompositeOperation = 'source-over';
    };
    if (reducedMotion) {
      // Less motion: no puff grows and nothing drifts. A still haze stands over each body that is firing - a wall of it along a
      // line firing volleys - and a still column before each gun that has fired: the field reads as a fight in its smoke with
      // nothing on it moving.
      for (const body of battle ? bodiesOf(battle) : []) {
        if (!body.fire || body.fire === 'none' || body.action === 'gone' || body.civilians) continue;
        const shown = view.sides.get(body.key), centre = shown ? placeAt(shown, now) : body, facing = body.facing || { x: 1, y: 0 };
        const at = camera.toScreen({ x: centre.x + facing.x * 0.02, y: centre.y + facing.y * 0.02 });
        if (!inside(at)) continue;
        const alpha = bankAlpha(body.fire === 'picket' ? 1 : 3) * 0.85;
        drawBank(target, at, figurePx * 4.6 * (view.smokeScale ?? 1), alpha, hash(body.key), ratio, dark, body.fire === 'volley' ? 'wall' : 'heap');
        haze++; cover = Math.max(cover, alpha);
      }
      for (const gun of [...(battle?.guns || []), ...(battle?.cannon ? [battle.cannon] : [])]) {
        if (!(gun.shots || []).length) continue;
        const fx = gun.facing?.x ?? 1, fy = gun.facing?.y ?? 0, at = camera.toScreen({ x: gun.x + fx * 0.03, y: gun.y + fy * 0.03 });
        if (!inside(at)) continue;
        drawBank(target, at, figurePx * 5.5 * (view.smokeScale ?? 1), bankAlpha(4) * 0.85, hash(`gun:${gun.x}:${gun.y}`), ratio, dark, 'plume', 0.7);
        haze++;
      }
      thin();
      if (layer && haze) ctx.drawImage(layer.layer, 0, 0, bounds.width, bounds.height);
      return { alive: view.smoke.length + view.banks.length, inView: haze, banks: view.banks.length, banksInView: 0, density, cover: +cover.toFixed(3), lingerMs, haze, plumes: 0, walls: 0, clearings: layer ? clear.length : 0 };
    }
    // The banks first, under the fresh plumes: each grows as it ages and as it thickens, lying where the wind has taken it; a gun's
    // goes up in a column for its first half minute, a volley's lies along the line.
    for (const bank of view.banks) {
      const at = camera.toScreen(bank);
      if (!inside(at)) continue;
      banksInView++;
      const age = now - bank.born, alpha = bankAlpha(bank.d);
      const radius = figurePx * (bank.scale ?? 1) * ((bank.big ? 4.4 : 3) + 1.1 * Math.sqrt(bank.d) + 4 * (1 - Math.exp(-age / 25000)));
      const shape = bank.big && age < 40000 ? 'plume' : bank.wall ? 'wall' : 'heap';
      if (shape === 'plume') plumes++; if (shape === 'wall') walls++;
      drawBank(target, at, radius, alpha, bank.seed, ratio, dark, shape, shape === 'plume' ? 1 - Math.exp(-age / 7000) : 0);
      cover = Math.max(cover, alpha);
    }
    thin();
    if (layer && banksInView) ctx.drawImage(layer.layer, 0, 0, bounds.width, bounds.height);
    let inView = banksInView;
    for (const s of view.smoke) {
      const age = now - s.born, t = age / s.life;
      // Thrown out of the muzzle and up in its first second, then carried by the wind with the rest.
      const thrown = 1 - Math.exp(-age / 450), lifted = 1 - Math.exp(-age / 900);
      const at = camera.toScreen({ x: s.x + (s.jet || 0) * thrown + s.vx * age, y: s.y - (s.jetUp || 0) * lifted + s.vy * age });
      if (bounds && at.x >= 0 && at.y >= 0 && at.x <= bounds.width && at.y <= bounds.height) inView++;
      const size = figurePx * lerp(s.size0, s.size1, Math.sqrt(t)) * (s.scale ?? 1);
      let alpha = s.alpha * (t < 0.04 ? t / 0.04 : Math.pow(1 - t, 1.3));
      // Thinner over one of the class's own men, so he is seen through it.
      if (clear.some(c => Math.abs(c.x - at.x) < figurePx * 1.6 && Math.abs(c.y - (at.y - size * 0.4)) < figurePx * 1.8)) alpha *= 0.4;
      // The fresh billow white out of the muzzle, then grey and breaking up into the bank (since 2026-09-30 never the library's
      // dark-outlined `smoke-dense`, which read as a thundercloud over a line of muskets, not powder smoke).
      const sprite = t < 0.22 ? 'smoke-growing' : 'smoke-dispersing';
      if (!art.drawSprite(ctx, sprite, at.x, at.y - figurePx * 0.4, size, { alpha, flip: (s.jet || 0) < 0 || (!s.jet && s.seed > 0.7) })) {
        const g = ctx.createRadialGradient(at.x, at.y - size * 0.4, 0, at.x, at.y - size * 0.4, size * 0.5);
        g.addColorStop(0, `rgba(226,224,216,${alpha})`); g.addColorStop(1, 'rgba(226,224,216,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(at.x, at.y - size * 0.4, size * 0.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Where the smoke lies now, on the ground: the middle of every puff and bank where the wind has taken it (evidence only).
    const all = [...view.smoke.map(s => ({ x: s.x + s.vx * (now - s.born), y: s.y + s.vy * (now - s.born) })), ...view.banks];
    const centre = all.length ? all.reduce((sum, s) => ({ x: sum.x + s.x, y: sum.y + s.y }), { x: 0, y: 0 }) : null;
    // And the banks alone, each by how thick it is: where the lying smoke has drifted (evidence only).
    const weight = view.banks.reduce((sum, bank) => sum + bank.d, 0);
    const bankCentre = weight ? { x: view.banks.reduce((sum, bank) => sum + bank.x * bank.d, 0) / weight, y: view.banks.reduce((sum, bank) => sum + bank.y * bank.d, 0) / weight } : null;
    return { alive: view.smoke.length + view.banks.length, inView, centre: centre && { x: centre.x / all.length, y: centre.y / all.length }, bankCentre, banks: view.banks.length, banksInView, density, cover: +cover.toFixed(3), lingerMs, haze, plumes, walls, clearings: layer ? clear.length : 0 };
  }

  /** Every line said this tick or lately, over whoever said it; the Mexican officer's words as each volley comes. */
  function drawLines(ctx, battle, camera, figurePx, now, time, bounds, drawn, drawnBy = {}) {
    const shown = [];
    const boxes = [];
    const scale = Math.max(0.85, Math.min(1.15, figurePx / 30));
    const speakerAt = line => {
      // A named line comes out of that person's own figure, wherever it is drawn: on the field, at a parley, in the legend
      // (`FIC-GONZ-457`). The server never sends one whose speaker is not drawn in its phase (sim/battle-stage.mjs).
      if (line.person) return view.peopleSpots?.[line.person] || view.parleySpots?.[line.person] || view.legendSpots?.[line.person] || null;
      if (line.name && view.peopleSpots?.[line.name]) return view.peopleSpots[line.name];
      if (line.role === 'bugler') {
        const side = view.sides.get(line.side);
        if (side && side.action !== 'gone') { const c = camera.toScreen(placeAt(side, now)); return { x: c.x + figurePx * 0.8, y: c.y - figurePx * 1.02 }; }
      }
      // A line said in a group (a company at a door, the men on a roof): over one of its men, or over the group's house if
      // every man in it is inside the walls.
      if (line.unit) {
        const unitKey = ['texian', 'mexican'].includes(line.unit) ? line.unit : `g:${line.unit}`;
        const points = drawnBy[unitKey], body = view.sides.get(unitKey);
        if (points?.length) { const pick = points[Math.floor(hash(line.id) * points.length)]; return { x: pick.x, y: pick.y - figurePx * 1.02 }; }
        if (body) { const c = camera.toScreen(placeAt(body, now)); return { x: c.x, y: c.y - figurePx * 1.2 }; }
      }
      // A side drawn only in its groups (the Alamo's columns, its walls): over any man of that side's groups.
      const points = drawn[line.side]?.length ? drawn[line.side]
        : (battle.groups || []).filter(group => group.side === line.side).flatMap(group => drawnBy[`g:${group.id}`] || []);
      if (!points?.length) return null;
      if (line.role === 'officer' || line.role === 'commander') {
        // The officer rides or stands at the front of the middle of his men.
        const side = view.sides.get(line.side);
        if (side && side.action !== 'gone') { const c = camera.toScreen(placeAt(side, now)); return { x: c.x, y: c.y - figurePx * (line.side === 'mexican' ? 1.4 : 1.05) }; }
      }
      const pick = points[Math.floor(hash(line.id) * points.length)];
      return { x: pick.x, y: pick.y - figurePx * 1.02 };
    };
    const put = (line, at, alpha) => {
      if (!at) return;
      let y = at.y;
      // Two bubbles never on top of each other: a later one steps up over the one already drawn.
      for (let i = 0; i < 4; i++) {
        const probe = { x: at.x - 110 * scale, y: y - 70 * scale, w: 220 * scale, h: 60 * scale };
        if (!boxes.some(b => probe.x < b.x + b.w && b.x < probe.x + probe.w && probe.y < b.y + b.h && b.y < probe.y + probe.h)) break;
        y -= 48 * scale;
      }
      const box = drawSpeech(ctx, line, at.x, y, { alpha, bounds, scale });
      if (box) { boxes.push(box); shown.push({ id: line.id, text: line.text, gloss: line.gloss || null, kind: line.kind, side: line.side, claimId: line.claimId || null, ...(line.person && { person: line.person, name: line.name, at: { x: Math.round(at.x), y: Math.round(at.y) }, named: Boolean(box.named) }), ...(box.manner && { manner: box.manner }) }); }
    };
    for (const { at, line } of view.linesSeen.values()) {
      const hold = Math.max(3800, 70 * line.text.length);
      const alpha = speechAlpha(now - at, hold);
      if (alpha > 0) {
        const speaker = speakerAt(line);
        if (line.role === 'bugler' && speaker) art.animated(ctx, 'regular-bugler-call', speaker.x, speaker.y + figurePx * 1.02, figurePx, `bugler:${line.id}`, { timeMs: now - at });
        put(line, speaker, alpha);
      }
    }
    // The officer's words, each volley, from the record's reconstructed drill (never a named man's).
    // A side's own words where the engagement gives them (the Texian square at Coleto, `commands.texian`); none where it gives none.
    for (const side of battle.sides) {
      // A side's own words where the engagement gives them (`commands.bySide`: San Jacinto's Texian officers, in English;
      // `commands.texian`: the Texian square at Coleto).
      const words = battle.commands?.bySide?.[side.side]?.volley || battle.commands?.[side.side]?.volley || battle.commands?.volley;
      if (side.fire !== 'volley' || !words) continue;
      const cycleAt = (time + hash(`${battle.id}:${side.side}`) * VOLLEY_MS) % VOLLEY_MS;
      words.forEach((word, i) => {
        const since = cycleAt - VOLLEY_WORDS_AT[i];
        if (since < 0 || since > 2200) return;
        put({ ...word, id: side.side === 'mexican' ? `command:${i}` : `command:${side.side}:${i}`, side: side.side, role: 'officer', kind: word.kind || 'reconstructed' }, speakerAt({ side: side.side, role: 'officer', id: 'officer' }), speechAlpha(since, 1700));
      });
    }
    return shown;
  }

  function labelSides(ctx, battle, camera, figurePx, drawn, drawnBy = {}) {
    ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const label = (text, points) => {
      const x = points.reduce((s, p) => s + p.x, 0) / points.length, y = Math.max(...points.map(p => p.y)) + 16;
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(text, x, y); ctx.fillStyle = '#26382e'; ctx.fillText(text, x, y);
    };
    for (const side of battle.sides) {
      const points = drawn[side.side];
      if (!points.length) continue;
      label(`${side.name}${side.count ? ` · about ${side.count}` : ''}`, points);
    }
    // A group of people the record names (`named`: Francita Alavez at Goliad) is named where she is.
    for (const group of battle.groups || []) {
      const points = drawnBy[`g:${group.id}`];
      if (group.named && group.name && points?.length) label(group.name, points);
    }
  }

  /**
   * Whether a family's person is drawn hit, taken or down now - only from the moment the page drew the fate the server sent at its
   * minute (`memberFallAt`), so nothing that reads it can know sooner than the picture shows. The film (public/battle-cinema.js)
   * does not follow him, and his name is dimmed.
   */
  const memberDown = (id, now = performance.now()) => { const fell = view.memberFallAt.get(id); return Boolean(fell && now >= fell.at && !['escaped', 'ran'].includes(fell.fate)); };
  /** Whether this person is drawn in the fight now (a family's person who fell is drawn only while it is). */
  const isMember = id => view.members.has(id);
  return { draw, memberPose, memberDrawn, isMember, memberSpot: id => view.memberSpots.get(id) || null, memberDown,  get evidence() { return view.evidence; }, get smoke() { return view.smoke.length + view.banks.length; } };
}
