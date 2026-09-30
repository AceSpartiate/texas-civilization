// The flashback: a family's story told back to it at the end of the game, as a video of about a minute (docs/FLASHBACK.md).
//
// Owner, 2026-09-28: "a full family recap and flashback story. it should be a 1 minute video generated from key points and
// decisions they made, recorded and saved on the host computer and played back for the student at the [end] of the game."
// And: "add their trip home as part of the end of game video flashback".
//
// This module is the story, and nothing else: from the ended class it chooses each family's key moments and decisions out of
// the event log and the world (the arrival and the roll, the house, the fields, the calls answered or not, who went to which
// fight and what came of it, the news as it reached them against what was really happening, the flight, the help given and
// taken, and the trip home, sim/homecoming.mjs), and writes each as a beat: a date, a place, a caption in plain words, what
// the picture shows, and - the fog lifted (VISION.md §2 *Revelation*) - what was really happening elsewhere that the family did
// not know yet. The page draws and records it (public/flashback.js); the server keeps the file (server/flashback.mjs).
//
// **Nothing here exists until the class has ended for good** (`flashbackReady`): not at the interim standings of periods 1
// and 2, whose war is not over, and never while a class runs.
//
// The rules the words are held to, each tested (tests/flashback.test.mjs):
// - **No gore** (VISION.md §16): a death is said in one plain sentence - who, where, when - and nothing about how a body was hurt.
// - **No virtue labels** (VISION.md §20): the same words the ending may not use, this may not use.
// - **Glory is not shown at all.** The numbers are the ending's; the flashback is the story beside them (MONEY_AND_GLORY.md
//   "A replacement for the epilogue" is what the numbers must never be), so nothing in it can read as a death rewarded.
// - **A death of sickness is never named** (docs/DISEASE.md §4: "never on the projector as a name"). The family's own record
//   names them; the video, which the Host may play to the class, says who they were to the family instead.
// - **"Meanwhile" is the true world**, never the family's knowledge: each comes from `world.truth` or the dated record, and is
//   something the family did not yet know at that moment - with when, if ever, the word reached them.
import { householdName, bandOf, sexOf, canAnswerCalls } from './family.mjs';
import { appearanceOf } from './appearance.mjs';
import { dateOf } from './clock.mjs';
import { interimStandings } from './periods.mjs';
import { homecomings } from './homecoming.mjs';
import { ENGAGEMENTS, projectBattle, schedule } from './battle-stage.mjs';
import { columnsNow } from './advance.mjs';
import { findWay } from './ways.mjs';
import { thinLine } from './flight-route.mjs';
import { neighbourLines } from './neighbourly.mjs';
// The farm at the end, sold or burned (owner, 2026-09-29, D8): the family's count and its sale are the video's last scenes.
import { farmAtEnd } from './farm-sale.mjs';

/** The video's length, which every family's beats share out. The owner's "1 minute video". */
export const FLASHBACK_MS = 60000;
/** How many beats a family's story is cut to, title and close included: enough to be a story, few enough to read. */
export const MOST_BEATS = 15, FEWEST_BEATS = 10;
export const TITLE_MS = 3500, CLOSING_MS = 5500;
/** A battle is drawn from the engine's own projection at this many moments of the fight, one after another. */
export const BATTLE_FRAMES = 7;
/** Bumped when a script changes shape, so a video made from an older script is made again (server/flashback.mjs). */
// 2 since 2026-09-29: the homecoming's scenes after the story's minute (the owner's D10).
export const SCRIPT_VERSION = 2;
/**
 * The homecoming after the story's minute (owner, 2026-09-29, the triage's D10: "they see their family return home, see what's
 * left, begin to rebuild if necessary, ceremonially bury lost family members, and then the head of household sits down to count
 * up what they have left"), each scene its own length: seeing what is left, the first logs of a new house over a burned one, the
 * family remembering its dead, the head of household counting at the table, and the farm sold (D8) where it stands. A family's
 * video is the story's minute and 20 to 34 seconds of these.
 */
export const EPILOGUE_MS = Object.freeze({ home: 6000, rebuild: 6000, burial: 8000, count: 7000, sale: 7000 });

/**
 * Words a flashback caption may never use. The virtue words are the ending's own list (docs/MONEY_AND_GLORY.md §7.1); the rest
 * are what "no gore" (VISION.md §16) rules out of a sentence about a death.
 */
export const VIRTUE_WORDS = Object.freeze(['good', 'better', 'best', 'brave', 'bravest', 'loyal', 'patriot', 'patriotic', 'hero', 'heroic', 'virtue', 'honour', 'honor', 'worthy', 'courage', 'coward', 'deserve', 'right', 'wrong']);
export const GORE_WORDS = Object.freeze(['blood', 'bloody', 'bleed', 'bled', 'gore', 'corpse', 'body', 'bodies', 'bayonet', 'bayoneted', 'scalp', 'dismember', 'severed', 'mangled', 'guts', 'brains', 'slaughter', 'butcher', 'massacre', 'shot', 'pieces', 'wound', 'wounds', 'burned alive']);

/** The flashback exists once the class has ended for good: not at the interim standings, while the war goes on. */
export const flashbackReady = world => world?.status === 'ended' && !interimStandings(world);

const DAY = 1440;
const day = (world, minute) => dateOf(world, minute).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const shortDay = (world, minute) => dateOf(world, minute).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
/** A minute of this class's clock for a date of 1835–36, at an hour. */
export const minuteOn = (world, year, month, date, hour = 12) => Math.round((Date.UTC(year, month - 1, date, hour) - dateOf(world, 0).getTime()) / 60000);
const round = (value, places = 3) => Math.round(value * 10 ** places) / 10 ** places;
const sentence = text => { const t = String(text || '').trim(); return t ? t[0].toUpperCase() + t.slice(1) : t; };
/** The first sentence of the game's own words, for a caption. */
const firstSentence = text => (String(text || '').match(/^.*?[.!?](\s|$)/)?.[0] || String(text || '')).trim();
const list = names => names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** Somebody's first name: the family's own name is on the title card, and a caption reads better without it each time. */
const firstName = person => String(person?.name || '').split(' ')[0];
/** A sentence that starts with a small number starts with its word: "Six Mexican horsemen", not "6 Mexican horsemen". */
const spellOut = text => sentence(String(text).replace(/^(\d+)\b/, (whole, n) => NUMBER_WORDS[Number(n)] || whole));
const people = (world, household) => household.members.map(id => world.entities[id]).filter(entity => entity?.kind === 'person');
const ROLE_WORD = Object.freeze({ father: 'the father', mother: 'the mother', son: 'a son', daughter: 'a daughter' });
/** Who somebody was to the family, for a death of sickness, which is told without a name. */
export function whoTo(person) {
  const role = person.kin?.role;
  const band = bandOf(person);
  if (role === 'father' || role === 'mother') return ROLE_WORD[role];
  const age = Number.isFinite(person.age) ? `, ${person.age === 0 ? 'not a year old' : `${person.age} year${person.age === 1 ? '' : 's'} old`}` : '';
  if (band === 'infant' || band === 'small' || band === 'child') return `a child of the family${age}`;
  return `${ROLE_WORD[role] || 'one of the family'}${age}`;
}

/** Each engagement a family's person can be in, by the event its glory and participation are kept under. */
/** The news of each fight a family's person can be in (`world.truth`'s topic), so its beat does not also carry it as a "meanwhile". */
const FIGHT_TOPIC = Object.freeze({ gonzales: 'gonzales-outcome', concepcion: 'concepcion-fight', 'grass-fight': 'grass-fight', 'bexar-storming': 'bexar-storming', alamo: 'alamo-fall', 'san-patricio': 'san-patricio', 'agua-dulce': 'agua-dulce', coleto: 'goliad-defeat', goliad: 'goliad-massacre', 'san-jacinto': 'san-jacinto' });
const ENGAGEMENT_OF = Object.freeze({ gonzales: 'gonzales', concepcion: 'concepcion', 'grass-fight': 'grass-fight', 'bexar-storming': 'bexar-storming', alamo: 'alamo', 'san-patricio': 'san-patricio', 'agua-dulce': 'agua-dulce', coleto: 'coleto', goliad: 'goliad-massacre', 'san-jacinto': 'san-jacinto' });
/**
 * What each thing a family's person took part in is called in a caption: by what they did there (`fought`) and by having been
 * there (`at`). A role not listed says "was at".
 */
const EVENT_WORDS = Object.freeze({
  gonzales: { fought: 'fought at Gonzales', at: 'was at the fight at Gonzales' },
  gathering: { at: 'joined the army gathering at Gonzales' },
  concepcion: { fought: 'fought at Concepción', at: 'was with the army at the fight at Concepción' },
  'storm-order': { at: 'was with the army when it was ordered to storm Béxar' },
  'grass-fight': { fought: 'fought in the Grass Fight', at: 'was with the army at the Grass Fight' },
  'bexar-storming': { fought: 'fought in the storming of Béxar', at: 'was with the army at the storming of Béxar' },
  enlistment: { at: 'joined the army of Texas' },
  desertion: { at: 'joined the army of Texas' },
  election: { at: 'voted in the election of February 1, 1836' },
  alamo: { fought: 'fought at the Alamo', at: 'was inside the Alamo' },
  'san-patricio': { fought: 'fought at San Patricio', at: 'was at San Patricio' },
  'agua-dulce': { fought: 'fought at Agua Dulce Creek', at: 'was at Agua Dulce Creek' },
  coleto: { fought: 'fought at Coleto with Fannin', at: 'was with Fannin at Coleto' },
  goliad: { fought: 'was with Fannin at Goliad', at: 'was with Fannin at Goliad' },
  'san-jacinto': { fought: 'fought in the battle of San Jacinto', at: 'was with the army at San Jacinto' },
  'houston-camp': { at: "marched with Houston's army" },
  'which-road': { at: "was with Houston's army at the fork of the road at Roberts'" },
});
const didAt = (event, fought) => (fought && EVENT_WORDS[event]?.fought) || EVENT_WORDS[event]?.at || `was at ${event.replace(/-/g, ' ')}`;
/** A place's name inside a sentence: "the San Felipe ferry", not "The San Felipe ferry". */
const named = name => String(name || '').replace(/^The /, 'the ');
/** The record's present-tense words turned to the past, for a "meanwhile" said after the fact. */
const PAST = Object.freeze([[/\bis burned\b/g, 'was burned'], [/\bhas burned\b/g, 'burned'], [/\bhas taken\b/g, 'took'], [/\bhas come\b/g, 'came'], [/\bhave come\b/g, 'came'],
  [/\bhas left\b/g, 'left'], [/\bhas crossed\b/g, 'crossed'], [/\bhas fallen back\b/g, 'fell back'], [/\bhas plundered\b/g, 'plundered'], [/\bis camped\b/g, 'was camped'],
  [/\bis at\b/g, 'was at'], [/\bare over\b/g, 'were over'], [/\bare coming\b/g, 'were coming'], [/\bis making\b/g, 'was making'], [/\bhold\b/g, 'held']]);
const past = text => PAST.reduce((words, [from, to]) => words.replace(from, to), text);

/**
 * The truth the fog hid, in plain words: what happened, and when it really did (the record's date, which is often days before
 * the class's own word of it). Topics not here are said in the first sentence of their own words, at their own minute.
 */
function knownHappenings(world) {
  const battleAt = id => {
    const battle = world.battles?.[id], def = ENGAGEMENTS[id];
    if (!battle || !def || !Number.isFinite(battle.start)) return null;
    const phases = schedule(def, battle.start);
    return (phases.find(phase => phase.contact) || phases[0]).from;
  };
  return {
    'cannon-request': { minute: minuteOn(world, 1835, 9, 29, 10), text: 'Mexican soldiers came to the Guadalupe to take back the cannon at Gonzales, and the town would not give it up' },
    'gonzales-outcome': { minute: battleAt('gonzales') ?? minuteOn(world, 1835, 10, 2, 7), text: 'the Texians drove the Mexican soldiers off at Gonzales and kept the cannon' },
    'goliad-taken': { minute: minuteOn(world, 1835, 10, 10, 1), text: 'volunteers took the fort at Goliad in the night' },
    'concepcion-fight': { minute: battleAt('concepcion') ?? minuteOn(world, 1835, 10, 28, 8), text: "Bowie's and Fannin's men beat off an attack at Mission Concepción" },
    'grass-fight': { minute: battleAt('grass-fight') ?? minuteOn(world, 1835, 11, 26, 12), text: 'Texians caught a Mexican pack train outside Béxar, and found it carried only grass' },
    'bexar-storming': { minute: battleAt('bexar-storming') ?? minuteOn(world, 1835, 12, 5, 5), text: 'the Texians went into Béxar and took it, house by house, over five days' },
    'alamo-siege': { minute: minuteOn(world, 1836, 2, 23, 14), text: "Santa Anna's army reached Béxar, and the men in the Alamo were shut in" },
    'san-patricio': { minute: battleAt('san-patricio') ?? minuteOn(world, 1836, 2, 27, 3), text: "Mexican cavalry caught Johnson's men at San Patricio" },
    declaration: { minute: minuteOn(world, 1836, 3, 2, 12), text: 'the convention at Washington declared Texas independent' },
    'agua-dulce': { minute: battleAt('agua-dulce') ?? minuteOn(world, 1836, 3, 2, 10), text: "Mexican cavalry caught Grant's men at Agua Dulce Creek" },
    'alamo-fall': { minute: battleAt('alamo') ?? minuteOn(world, 1836, 3, 6, 5), text: 'the Alamo was stormed at dawn and fell' },
    'goliad-defeat': { minute: battleAt('coleto') ?? minuteOn(world, 1836, 3, 19, 13), text: "Fannin's men were caught on the open prairie at Coleto and surrendered" },
    'goliad-massacre': { minute: battleAt('goliad-massacre') ?? minuteOn(world, 1836, 3, 27, 7), text: "most of Fannin's men, prisoners at Goliad, were put to death on Santa Anna's orders" },
    'houston-colorado': { minute: minuteOn(world, 1836, 3, 17, 6), text: "Houston's army fell back over the Colorado" },
    'houston-san-felipe': { minute: minuteOn(world, 1836, 3, 28, 12), text: "Houston's army fell back to the Brazos" },
    'santa-anna-brazos': { minute: minuteOn(world, 1836, 4, 11, 14), text: 'Santa Anna crossed the Brazos and made for Harrisburg' },
    'san-jacinto': { minute: battleAt('san-jacinto') ?? minuteOn(world, 1836, 4, 21, 16), text: "Houston's army beat Santa Anna's at San Jacinto in eighteen minutes" },
  };
}
/** Topics never used as a "meanwhile": the family's own farm has a beat of its own, and a neighbour's is theirs. */
const OWN_TOPICS = /^farm-burned:/;

/**
 * Every "meanwhile" this family could be shown: each true happening, when it really happened, and when - if ever - word of it
 * reached the family. From `world.truth` and the dated record only: what the family believed is not consulted except to say
 * when it heard.
 */
export function happenings(world, householdId) {
  const table = knownHappenings(world);
  const heard = world.knowledge?.households?.[householdId] || {};
  const found = [];
  for (const truth of Object.values(world.truth || {})) {
    if (OWN_TOPICS.test(truth.id) || !Number.isFinite(truth.minute)) continue;
    const known = table[truth.id];
    // The record's dated happenings, and the spring's burned towns and marching columns; not the rumours, the winter's talk or
    // the sickness in the camps, which are the family's news rather than the war's.
    if (!known && !/^(burned|column):/.test(truth.id)) continue;
    const text = known?.text || past(firstSentence(truth.text).replace(/\.$/, ''));
    if (!text || GORE_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text))) continue;
    found.push({ topicId: truth.id, minute: known?.minute ?? truth.minute, text, claimId: truth.claimId || null, heardMinute: heard[truth.id]?.receivedMinute ?? null, major: Boolean(known) });
  }
  return found.sort((a, b) => a.minute - b.minute);
}

/** A person's end, where the record has one: when and how they died or were taken. */
function fateOf(world, person) {
  const mine = world.events.filter(event => event.actorId === person.id && (event.importance ?? 1) >= 3 && event.text);
  if (person.health?.condition === 'dead') {
    const said = [...mine].reverse().find(event => /\b(killed|died|put to death|among the prisoners)\b/i.test(event.text)) || [...world.events].reverse().find(event => event.householdId === person.householdId && event.text?.startsWith(`${person.name} `) && /\b(killed|died)\b/.test(event.text));
    const sickness = said?.sickness === 'died' || /\bdied of\b/.test(said?.text || '');
    return { kind: 'dead', minute: said?.minute ?? null, sickness, disease: person.health.disease || null, text: said?.text || null, war: person.service?.status === 'fell' };
  }
  if (person.health?.condition === 'captured') {
    const said = [...mine].reverse().find(event => /taken prisoner|prisoner/i.test(event.text));
    return { kind: 'captured', minute: said?.minute ?? null, war: person.service?.status === 'captured', text: said?.text || null };
  }
  return null;
}
const DISEASE_WORDS = Object.freeze({ measles: 'the measles', whooping: 'the whooping cough', 'whooping-cough': 'the whooping cough', ague: 'the chills and fever', flux: 'the flux', 'lung-fever': 'a chill on the chest' });

/** A figure the page draws: the person as the page's own figures are drawn (public/app.js `miniPerson`). */
export function figure(world, person) {
  // How they look, as every projection sends it (sim/town.mjs `seenAs`): the parents as chosen, the children after them.
  const looks = appearanceOf(world, person);
  return { id: person.id, name: person.name, kind: 'person', sex: sexOf(person), ...(Number.isFinite(person.age) && { age: person.age }), band: bandOf(person), ...(person.kin?.role && { role: person.kin.role }), ...(looks && { appearance: looks }), ...(person.principal && { principal: true }) };
}

/** Who of the family is with it at a minute: alive, not taken, and not away with an army. */
function withFamilyAt(world, household, minute, fates, away = () => false) {
  return people(world, household).filter(person => {
    const fate = fates[person.id];
    if (fate && Number.isFinite(fate.minute) && fate.minute <= minute) return false;
    if (fate && !Number.isFinite(fate.minute) && minute >= world.minute) return false;
    return !away(person, minute);
  }).map(person => person.id);
}

const place = (world, siteId) => { const site = world.map.sites[siteId]; return site ? { siteId, x: site.x, y: site.y, name: site.name } : null; };

/** The battle drawn for a beat: the engine's own projection at moments through the fight, around the minute that matters. */
function battleFrames(world, id, focusMinute) {
  const battle = world.battles?.[id], def = ENGAGEMENTS[id];
  if (!battle || !def || !Number.isFinite(battle.start)) return null;
  const phases = schedule(def, battle.start);
  const contact = phases.find(phase => phase.contact) || phases[0];
  const last = [...phases].reverse().find(phase => phase.contact) || phases.at(-1);
  // Around the family's moment where there is one (a fate's minute), else through the fighting from its first contact.
  const from = Number.isFinite(focusMinute) ? Math.max(phases[0].from, Math.min(focusMinute - 30, last.to - 60)) : contact.from;
  const to = Math.min(last.to - 1, from + Math.max(60, Math.min(240, last.to - from)));
  const frames = [];
  for (let i = 0; i < BATTLE_FRAMES; i++) {
    const minute = Math.round(from + (to - from) * i / (BATTLE_FRAMES - 1));
    let view;
    try { view = projectBattle({ ...world, minute }, id, {}); } catch { view = null; }
    if (view) frames.push(view);
  }
  if (!frames.length) return null;
  // Framed as the engagement frames itself where it names its ground (`frame`), and otherwise on the two sides as they move.
  const framed = frames.some(view => view.frame?.length);
  const points = frames.flatMap(view => framed ? (view.frame || []) : view.sides.map(side => ({ x: side.x, y: side.y })));
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const box = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  return { id, name: def.name, frames, camera: { cx: round((box.minX + box.maxX) / 2), cy: round((box.minY + box.maxY) / 2), miles: round(Math.max(0.35, (box.maxX - box.minX) * 1.5, (box.maxY - box.minY) * 1.5 * 16 / 9)) } };
}

/** The Mexican columns where they truly were at a minute, near a point: the fog lifted over the map (sim/advance.mjs). */
function columnsNear(world, minute, at, miles = 40) {
  if (!at) return [];
  let found;
  try { found = columnsNow({ ...world, minute }); } catch { return []; }
  return found.filter(({ head }) => Math.hypot(head.x - at.x, head.y - at.y) <= miles)
    .map(({ column, head }) => ({ id: column.id, name: column.name, x: round(head.x), y: round(head.y), strength: head.strength ?? null, moving: Boolean(head.moving), camp: Boolean(head.camp), right: head.right !== false }));
}

/** The road between two places as the family would take it, for drawing a journey. */
function roadBetween(world, from, to, mode = 'foot') {
  if (!from || !to || from === to) return null;
  const way = findWay(world, from, to, mode === 'wagon' ? 'wagon' : 'foot', { ferries: false });
  return way ? thinLine(way.points, 80) : null;
}

/**
 * Every moment of this family's story that could be a beat, each with how much it matters (`weight`, higher first) and the
 * picture it wants. Chronological order and the cut to `MOST_BEATS` are `flashbackScript`'s.
 */
function candidates(world, household, trip) {
  const found = [];
  let homeBeat = null;
  const add = beat => { if (beat && Number.isFinite(beat.minute)) found.push(beat); };
  const events = world.events.filter(event => event.householdId === household.id && event.text);
  const members = people(world, household);
  const fates = Object.fromEntries(members.map(person => [person.id, fateOf(world, person)]).filter(([, fate]) => fate));
  const home = place(world, household.homeSiteId);
  const houseLayout = household.house?.plan || household.house?.layout || null;
  const settlement = world.map.sites[household.settlementId || 'gonzales']?.name || null;
  // Somebody of the family with an army in the spring does not go east with it: what the war record says of them.
  const springArmy = new Set(Object.entries(world.glory?.[household.id]?.awards || {}).filter(([, award]) => ['houston-camp', 'san-jacinto', 'which-road', 'coleto', 'goliad', 'alamo'].includes(award.event)).map(([, award]) => award.personId));
  const away = (person, minute) => springArmy.has(person.id) && minute >= (world.director?.scrapeOpened ?? 240000) && household.flight && minute >= (household.flight.orderedMinute ?? household.flight.early?.minute ?? Infinity);
  const at = minute => withFamilyAt(world, household, minute, fates, away);

  // ---------------------------------------------------------------------------------------------- the arrival and the roll
  const founded = events.find(event => event.type === 'household-founded') || { minute: 0 };
  // Who came: a lone parent's husband or wife, married on the family's land (sim/courtship.mjs), was not on the road in.
  const parents = members.filter(person => ['father', 'mother'].includes(person.kin?.role) && person.id !== household.courtship?.spouse?.id).map(firstName);
  const children = members.filter(person => ['son', 'daughter'].includes(person.kin?.role)).map(firstName);
  const means = household.means?.coin ? ` They had ${household.means.coin} reales in coin.` : '';
  // A big family is counted rather than listed: fifteen names is not a caption anybody can read in four seconds.
  const kids = children.length === 1 ? ` with their child ${children[0]}` : children.length <= 4 ? ` with their children ${list(children)}` : ` with their ${NUMBER_WORDS[children.length] || children.length} children`;
  add({ kind: 'arrival', weight: 96, minute: founded.minute ?? 0, place: home,
    caption: `${parents.length ? list(parents) : 'The family'} came to new land${settlement ? ` near ${settlement}` : ''}${children.length ? kids : ''}.${means}`,
    scene: { type: 'home', house: { shelter: 'camp' }, people: at(founded.minute ?? 0), wagon: true } });

  // ------------------------------------------------------------------------------------------------------- the house
  const built = events.find(event => /^The house is built/.test(event.text)) || events.find(event => /round-log pen is finished|pen is finished|family sleeps under its own roof/.test(event.text));
  if (built) {
    const what = built.text.match(/^The house is built: (.*?)\.?$/)?.[1];
    add({ kind: 'house', weight: 82, minute: built.minute, place: home, caption: `The family raised its own house${what ? `: ${what}` : ''}.`, scene: { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: at(built.minute) } });
  }
  // ------------------------------------------------------------------------------ the lone parent's wedding (sim/courtship.mjs)
  // The day the family went to its neighbours and came home with two parents and a house raised: one of the moments a family
  // that began with one parent will remember first.
  const wed = household.courtship?.stage === 'home' ? events.find(event => event.type === 'courtship' && /married by (bond|the priest)/.test(event.text)) : null;
  if (wed) {
    const lone = members.find(person => person.id === household.courtship.parentId), spouse = members.find(person => person.id === household.courtship.spouse.id);
    add({ kind: 'wedding', weight: 90, minute: wed.minute, place: home,
      caption: `${lone ? firstName(lone) : 'The family'} and ${spouse ? firstName(spouse) : 'a neighbour'} were married ${household.courtship.rite === 'priest' ? 'by the priest from La Bahía' : 'by bond'}, the neighbours their witnesses, beside the house the neighbours raised.`,
      scene: { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: at(wed.minute) } });
  }
  // ------------------------------------------------------------------------------------------------------- the fields
  const orderMinute = household.flight?.orderedMinute ?? household.flight?.early?.minute ?? Infinity;
  const fieldEvents = events.filter(event => /The field is (\d+) acres now/.test(event.text) && event.minute < orderMinute);
  const crops = new Set(events.filter(event => /\b(chose|will|decided alone): plant (corn|cotton)\b|will plant (corn|cotton)/.test(event.text)).map(event => event.text.match(/plant (corn|cotton)/)[1]));
  if (fieldEvents.length) {
    const last = fieldEvents.at(-1), acres = Number(last.text.match(/The field is (\d+) acres now/)[1]);
    add({ kind: 'fields', weight: 62, minute: last.minute, place: home, caption: `They cleared ${acres} acres of field${crops.size ? ` and planted ${list([...crops])}` : ''}.`, scene: { type: 'home', house: { shelter: built && last.minute >= built.minute ? 'house' : 'camp', layout: houseLayout }, people: at(last.minute), field: acres } });
  }
  // ------------------------------------------------------------------------------------ the first call, answered or not
  const call = events.find(event => event.type === 'pressure' && event.claimId === 'FIC-GONZ-031');
  if (call) {
    const answers = events.filter(event => event.claimId === 'FIC-GONZ-031' && event.type === 'choice' && event.minute >= call.minute && event.minute <= call.minute + 3 * DAY);
    const went = answers.filter(event => /will ride for Gonzales/.test(event.text)).map(event => event.text.split(' will ')[0].split(' ')[0]);
    const stayed = answers.filter(event => /will stay home/.test(event.text)).map(event => event.text.split(' will ')[0].split(' ')[0]);
    const able = members.filter(person => canAnswerCalls(person) && !(fates[person.id]?.minute <= call.minute));
    const why = went.length ? `${list(went)} rode for Gonzales with the volunteers.`
      : stayed.length ? `${list(stayed)} stayed home with the family.`
        : able.length ? 'Nobody from the family went. They kept to the farm.' : 'There was nobody grown at home who could go.';
    add({ kind: 'call', weight: went.length ? 78 : 66, minute: call.minute, place: home, caption: `Riders brought word: Mexican soldiers were at Gonzales, and the men were asked to turn out. ${why}`, scene: { type: 'home', house: { shelter: built && call.minute >= built.minute ? 'house' : 'camp', layout: houseLayout }, people: at(call.minute), rider: true } });
  }
  // ------------------------------------------------------------------------------ who went where, and what came of it
  const parts = new Map();
  for (const [event, taking] of Object.entries(world.participation || {})) for (const [personId, part] of Object.entries(taking)) if (part.householdId === household.id) parts.set(`${event}:${personId}`, { event, personId, role: part.role, minute: part.minute ?? 0 });
  for (const [key, award] of Object.entries(world.glory?.[household.id]?.awards || {})) if (!parts.has(key)) parts.set(key, { event: award.event, personId: award.personId, role: award.role, minute: award.minute ?? 0 });
  const byEvent = new Map();
  for (const part of parts.values()) { if (!byEvent.has(part.event)) byEvent.set(part.event, []); byEvent.get(part.event).push(part); }
  for (const [event, taking] of byEvent) {
    const names = taking.map(part => world.entities[part.personId]).filter(Boolean);
    if (!names.length) continue;
    const who = list(names.map(firstName));
    const minute = Math.min(...taking.map(part => part.minute));
    const engagement = ENGAGEMENT_OF[event];
    const fought = taking.some(part => part.role === 'fought');
    // What came of each of them in this fight: the battle's staged fates, and each person's own end where it came here.
    const outcomes = names.map(person => {
      const staged = world.battles?.[engagement]?.fates?.[person.id];
      const fate = fates[person.id];
      const here = fate && Number.isFinite(fate.minute) && fate.minute >= minute - DAY && fate.minute <= minute + 10 * DAY && !fate.sickness;
      if ((staged?.fate === 'killed' || (here && fate.kind === 'dead')) && fate?.kind === 'dead') return { person, said: `${firstName(person)} was killed there.`, death: true };
      if (staged?.fate === 'captured' || (here && fate?.kind === 'captured')) return { person, said: `${firstName(person)} was taken prisoner.`, taken: true };
      if (staged?.fate === 'wounded') return { person, said: `${firstName(person)} was badly hurt, and lived.` };
      if (staged?.fate === 'spared') return { person, said: `${firstName(person)} was spared.` };
      return { person, said: null };
    });
    const said = outcomes.map(one => one.said).filter(Boolean).join(' ');
    const deathHere = outcomes.some(one => one.death), takenHere = outcomes.some(one => one.taken);
    const frames = engagement ? battleFrames(world, engagement, Math.min(...outcomes.map(one => fates[one.person.id]?.minute).filter(Number.isFinite), Infinity)) : null;
    const weight = deathHere ? 94 : takenHere ? 90 : fought ? 86 : engagement ? 72 : event === 'enlistment' ? 64 : event === 'gathering' ? 40 : event === 'houston-camp' ? 56 : 44;
    const siteOf = { gathering: 'gonzales', election: household.settlementId || 'gonzales', enlistment: household.settlementId || 'san-felipe', 'houston-camp': 'columbus-crossing' }[event];
    const spot = frames ? { x: frames.camera.cx, y: frames.camera.cy, name: frames.name } : place(world, siteOf) || home;
    add({ kind: engagement ? 'fight' : 'service', weight, minute: frames?.frames[0]?.minute ?? minute, place: spot, event, people: names.map(person => person.id),
      caption: sentence(`${who} ${didAt(event, fought)}.${said ? ` ${said}` : ''}`),
      scene: frames ? { type: 'battle', battle: frames, people: names.map(person => person.id) } : { type: 'map', miles: 30, people: names.map(person => person.id) },
      ...(deathHere && { death: true }) });
  }
  // --------------------------------------------------------------------------------- deaths and prisoners, anywhere
  for (const person of members) {
    const fate = fates[person.id];
    if (!fate || !Number.isFinite(fate.minute)) continue;
    // Told once: a fight's beat that already says so. A death's record is often the day the family heard (the Alamo's dead were
    // told ten days after the fall), so the fight's minute and the record's are not held to a window (found 2026-09-29, the end
    // sequence's proof: "Nicolás was killed at Travis drew a line in the sand" ten days after his fight's own beat).
    const told = found.some(beat => beat.kind === 'fight' && beat.people?.includes(person.id) && ((fate.kind === 'dead' && beat.death) || (fate.kind === 'captured' && /taken prisoner/.test(beat.caption))));
    if (told) continue;
    const spot = place(world, person.location?.siteId) || home;
    if (fate.kind === 'dead' && fate.sickness) {
      add({ kind: 'loss', weight: 92, minute: fate.minute, place: spot, death: true, sickness: true, caption: sentence(`${whoTo(person)} died of ${DISEASE_WORDS[fate.disease] || 'a sickness'}${person.location?.siteId && person.location.siteId !== household.homeSiteId ? ` at ${world.map.sites[person.location.siteId]?.name}` : ''}.`),
        scene: { type: 'map', miles: 18, people: at(fate.minute + 1) } });
    } else if (fate.kind === 'dead') {
      // Where, from the record's own first sentence only: "killed at Coleto", never a place-like phrase from the history after it.
      const where = fate.text && /\bkilled at (?:the )?([A-Z][\wÀ-ÿ'’]+(?: [A-Z][\wÀ-ÿ'’]+)*)/.exec(firstSentence(fate.text))?.[1];
      add({ kind: 'loss', weight: 93, minute: fate.minute, place: spot, death: true, caption: `${firstName(person)} was killed${where ? ` at ${where}` : ''}.`, scene: { type: 'map', miles: 18, people: at(fate.minute + 1) } });
    } else if (fate.kind === 'captured') {
      const atHomeTaken = fate.text && /at home/.test(fate.text);
      add({ kind: 'taken', weight: 88, minute: fate.minute, place: atHomeTaken ? home : spot, people: [person.id],
        caption: atHomeTaken ? `${firstName(person)} was at home when Mexican soldiers came, and was taken prisoner.` : sentence(`${firstName(person)} was taken prisoner${fate.war ? ' by the Mexican army' : ''}.`),
        scene: atHomeTaken ? { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: [person.id] } : { type: 'map', miles: 18, people: [person.id] } });
    }
  }
  // ---------------------------------------------------------------------------------------------- the winter's choices
  for (const event of events.filter(one => one.claimId === 'HIST-TEX-048' && /put their name to the roll/.test(one.text))) {
    if (found.some(beat => beat.event === 'enlistment')) break;
    add({ kind: 'enlist', weight: 60, minute: event.minute, place: home, caption: firstSentence(event.text).replace('put their name to the roll of', 'signed on with'), scene: { type: 'map', miles: 24, people: at(event.minute) } });
  }
  // ------------------------------------------------------------------------------------------------ the spring: the flight
  const flight = household.flight;
  if (flight) {
    // A family that went before any order, on the word it had heard (owner, 2026-09-29, D9 (b); sim/early-word.mjs), is not shown told.
    if (flight.early && !Number.isFinite(flight.orderedMinute)) {
      add({ kind: 'order', weight: 76, minute: flight.early.minute, place: home, caption: `The family did not wait for an order to leave: on the word it had heard, it made ready and went${flight.early.crop ? `, and left the ${flight.early.crop} standing in the field` : ''}.`,
        scene: { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: at(flight.early.minute), rider: true } });
    } else add({ kind: 'order', weight: 76, minute: flight.orderedMinute ?? 0, place: home, caption: `Word came${settlement ? ` from ${settlement}` : ''}: the Mexican army was coming, and every family had to leave for the east.`,
      scene: { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: at(flight.orderedMinute ?? 0), rider: true } });
    // The day it left home: the first leaving, not a later leg from a stop on its route (which moves `leftMinute` on).
    const left = events.find(event => /^The family loaded .* set out/.test(event.text));
    const leftMinute = left?.minute ?? flight.leftMinute;
    if (Number.isFinite(leftMinute)) {
      const road = roadBetween(world, household.homeSiteId, flight.refuge, flight.mode);
      add({ kind: 'flight', weight: 85, minute: leftMinute, place: home, caption: left ? firstSentence(left.text).replace(/^The family loaded (.*?) and set out/, 'They loaded $1 and set out') : `The family set out east for ${world.map.sites[flight.refuge]?.name || 'safety'}.`,
        scene: { type: 'road', route: road, people: at(leftMinute), wagon: flight.mode === 'wagon', from: 0, to: 0.35 } });
    } else if (flight.stayedMinute !== undefined || flight.status === 'stayed') {
      add({ kind: 'stayed', weight: 80, minute: flight.stayedMinute ?? flight.orderedMinute ?? 0, place: home, caption: 'The family did not leave. It stayed on the farm to take whatever came.', scene: { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: at(flight.stayedMinute ?? flight.orderedMinute ?? 0) } });
    }
    // The road: soldiers behind, the rivers in flood, sickness, help given and taken, and the refuge.
    const chase = events.find(event => event.claimId === 'FIC-GONZ-663');
    if (chase) {
      const held = events.find(event => event.claimId === 'FIC-GONZ-665' && event.minute >= chase.minute);
      const soldiers = spellOut(firstSentence(chase.text)).replace(/about 0 yards off/, 'close by').replace(/, and are coming after it\./, '').replace(/ saw the family /, ' saw the family on the road, ');
      add({ kind: 'chase', weight: 80, minute: chase.minute, place: null, caption: `${soldiers}, and came after it.${held ? ' They held their fire.' : ''}`,
        scene: { type: 'road', route: roadBetween(world, household.homeSiteId, flight.refuge, flight.mode), people: at(chase.minute), wagon: flight.mode === 'wagon', from: 0.3, to: 0.55, soldiers: true } });
    } else {
      const word = events.find(event => event.claimId === 'FIC-GONZ-051');
      if (word) add({ kind: 'danger', weight: 58, minute: word.minute, place: null, caption: firstSentence(word.text.replace(/^Word along the road: /, 'People on the road said ')).replace(/ is (about|less than)/, ' was $1').replace(/ and coming this way, making for /, ', making for '),
        scene: { type: 'road', route: roadBetween(world, household.homeSiteId, flight.refuge, flight.mode), people: at(word.minute), wagon: flight.mode === 'wagon', from: 0.25, to: 0.45 } });
    }
    const flood = events.find(event => /^The river is up at /.test(event.text));
    if (flood) {
      const river = flood.text.match(/^The river is up at (.*?), and/)?.[1];
      add({ kind: 'crossing', weight: 52, minute: flood.minute, place: null, caption: `At ${named(river) || 'the river'} the water was high. The family waited its turn to cross with the other families.`,
        scene: { type: 'road', route: roadBetween(world, household.homeSiteId, flight.refuge, flight.mode), people: at(flood.minute), wagon: flight.mode === 'wagon', from: 0.45, to: 0.5, crowd: true } });
    }
    const sick = events.filter(event => /has fallen sick|has the (measles|flux|whooping cough)|is very sick/.test(event.text) && event.minute >= (leftMinute ?? flight.orderedMinute ?? 0));
    if (sick.length) {
      const names = [...new Set(sick.map(event => event.text.split(' ')[0]))].filter(name => members.some(person => firstName(person) === name));
      const nursed = events.some(event => /\bnursed\b/.test(event.text) && event.minute >= sick[0].minute);
      add({ kind: 'sickness', weight: 54, minute: sick[0].minute, place: null, caption: `On the road, ${list(names.slice(0, 3))} fell sick.${nursed ? ' The family nursed them as it went.' : ''}`,
        scene: { type: 'road', route: roadBetween(world, household.homeSiteId, flight.refuge, flight.mode), people: at(sick[0].minute), wagon: flight.mode === 'wagon', from: 0.5, to: 0.65 } });
    }
    const helped = events.filter(event => event.claimId === 'FIC-GONZ-489' || /came to help raise the walls/.test(event.text) || event.claimId === 'FIC-GONZ-412');
    const gave = helped.find(event => /carried .* food over|helped the ferryman|carried the little ones|helped the (women|men) of Gonzales/.test(event.text));
    const took = helped.find(event => /sent .* food over to yours|came to help raise/.test(event.text));
    if (gave || took) {
      const words = [gave && firstSentence(gave.text).replace(/, and the family's turn will come .*$/, '.'), took && firstSentence(took.text)].filter(Boolean).join(' ');
      add({ kind: 'help', weight: 66, minute: (gave || took).minute, place: null, caption: words, scene: gave?.minute >= (leftMinute ?? Infinity) || took?.minute >= (leftMinute ?? Infinity)
        ? { type: 'road', route: roadBetween(world, household.homeSiteId, flight.refuge, flight.mode), people: at((gave || took).minute), wagon: flight.mode === 'wagon', from: 0.6, to: 0.7, crowd: true }
        : { type: 'home', house: { shelter: built && (gave || took).minute >= built.minute ? 'house' : 'camp', layout: houseLayout }, people: at((gave || took).minute), neighbours: true } });
    }
  }
  // What the family did for its neighbours and they for it (sim/neighbourly.mjs, owner 2026-09-28), where the road gave no help.
  if (!found.some(beat => beat.kind === 'help')) {
    let lines = [];
    try { lines = neighbourLines(world, household.id); } catch { lines = []; }
    if (lines.length) {
      const first = lines[0], second = lines.find(line => line.kind !== first.kind && line.text !== first.text);
      add({ kind: 'help', weight: 66, minute: first.minute, place: home, caption: [first.text, second?.text].filter(Boolean).map(text => sentence(firstSentence(text))).join(' '),
        scene: { type: 'home', house: { shelter: built && first.minute >= built.minute ? 'house' : 'camp', layout: houseLayout }, people: at(first.minute), neighbours: true } });
    }
  }
  if (flight) {
    if (Number.isFinite(flight.arrivedMinute) && flight.refuge) {
      add({ kind: 'refuge', weight: 60, minute: flight.arrivedMinute, place: place(world, flight.refuge), caption: `They reached ${world.map.sites[flight.refuge]?.name} and camped there with the other families from the west.`,
        scene: { type: 'map', miles: 14, people: at(flight.arrivedMinute), crowd: true } });
    }
    // The farm burned: the fog lifted over the family's own land. Sealed from it until word came or it came home.
    if (Number.isFinite(flight.burned)) {
      const by = flight.burnedBy?.hand === 'mexican' ? `Foragers of ${flight.burnedBy.name}` : 'Men of the Texas army';
      const knew = flight.burnKnown?.minute;
      const how = flight.burnKnown?.how;
      const reveal = how === 'there' ? 'The family’s own people saw it.'
        : Number.isFinite(knew) && knew - flight.burned >= 360 ? `The family did not know until ${shortDay(world, knew)}${how === 'home' ? ', when it came home' : ''}.`
          : how === 'sight' ? 'The family saw the smoke from the road.' : !Number.isFinite(knew) ? 'The family did not know it yet.' : null;
      add({ kind: 'burned', weight: 87, minute: flight.burned, place: home, caption: `${by} burned the family’s house, field and fences.${reveal ? ` ${reveal}` : ''}`,
        scene: { type: 'home', house: { shelter: 'ruined', layout: houseLayout }, people: [], smoke: true }, reveal: true });
    }
  }
  // --------------------------------------------------------------------------------------------- the news as it came
  const heardBeats = [];
  for (const one of happenings(world, household.id).filter(item => item.major && Number.isFinite(item.heardMinute))) {
    const late = Math.round((one.heardMinute - one.minute) / DAY);
    if (late < 1) continue;
    heardBeats.push({ kind: 'news', weight: 30 + Math.min(20, late), minute: one.heardMinute, place: home, topicId: one.topicId,
      caption: `Word reached the family: ${one.text}. It had happened ${late === 1 ? 'the day before' : `${late} days before`}, on ${shortDay(world, one.minute)}.`,
      scene: { type: 'home', house: { shelter: 'house', layout: houseLayout }, people: at(one.heardMinute), rider: true } });
  }
  heardBeats.sort((a, b) => b.weight - a.weight).slice(0, 3).forEach(add);
  // --------------------------------------------------------------------------------------------------- the trip home
  if (trip) {
    const names = ids => list(ids.map(id => world.entities[id]?.name).filter(Boolean));
    if (trip.status === 'trip' && trip.route) {
      add({ kind: 'homeward', weight: 90, minute: trip.setOutMinute, place: null, homecoming: true,
        caption: `With the news of San Jacinto, the family started home${trip.fromName ? ` from near ${named(trip.fromName)}` : ''}, ${trip.miles} miles by ${trip.mode === 'wagon' ? 'wagon' : 'foot'}.`,
        scene: { type: 'road', route: trip.route, people: trip.who, wagon: trip.mode === 'wagon', from: 0, to: 0.85, homeward: true } });
    }
    const arrived = trip.status === 'trip' ? trip.arrivedMinute : trip.status === 'home-already' ? flight?.homeMinute : null;
    if (Number.isFinite(arrived) || trip.status === 'stayed') {
      const whenHome = Number.isFinite(arrived) ? arrived : world.minute;
      const house = trip.house === 'burned'
        ? `The house was ashes${trip.burnedBy === 'mexican' ? ', burned by Mexican foragers' : ''}.`
        : trip.house === 'standing' ? 'The house was still standing.' : 'There was no house to come back to.';
      const foundLines = (trip.texts || []).map(line => line.text).filter(text => /brought home what it had hidden|brought home what they had carried|milk cow came home|were found again|Nothing was found of the stock/.test(text));
      const stock = foundLines.find(text => /found again|Nothing was found/.test(text));
      const cache = foundLines.find(text => /hidden there/.test(text));
      const stockWords = stock ? (/Nothing was found/.test(stock) ? ' None of the stock left on the range was found.' : ` They found ${stock.match(/Of the stock left on the range, (.*?) were found again/)?.[1] || 'some of the stock'} again.`) : '';
      const cacheWords = cache ? ' They dug up what they had hidden by the river.' : '';
      // What they carried all the way home of their household goods (owner, 2026-09-29, D9 (a); sim/scrape.mjs `advanceFlight`).
      const carriedWords = (foundLines.find(text => /brought home what they had carried/.test(text)) || '').replace(/^They brought home what they had carried all the way: (.*)\.$/, ' They had carried $1 all the way home.');
      const apart = trip.apart.filter(one => one.arrivedMinute).map(one => { const who = firstName(world.entities[one.personId]), when = shortDay(world, one.arrivedMinute); return one.arrivedMinute > whenHome + DAY / 2 ? `${who} came home later, on ${when}.` : one.arrivedMinute < whenHome - DAY / 2 ? `${who} was already there, home since ${when}.` : `${who} came home with them.`; }).join(" ");
      // Not one of the story's beats: the first scene of the homecoming after its minute (`epilogue`), drawn as a scene in the yard.
      homeBeat = { kind: 'home', minute: whenHome, place: home, homecoming: true,
        caption: `${trip.status === 'stayed' ? 'The family had stayed home.' : 'The family came home.'} ${house}${carriedWords}${cacheWords}${stockWords}${apart ? ` ${apart}` : ''}`,
        scene: { type: 'yard', part: 'home', light: 'morning', house: { shelter: trip.house === 'burned' ? 'ruined' : trip.house === 'standing' ? 'house' : 'camp', layout: houseLayout }, people: withFamilyAt(world, household, world.minute, fates) } };
    }
  }
  return { found, fates, homeBeat };
}

/** The "meanwhile" for a beat: something true and important happening near that moment that the family did not know yet. */
function meanwhileFor(world, beat, pool, used) {
  if (['title', 'closing', 'news'].includes(beat.kind) || beat.scene?.type === 'yard') return null;
  const options = pool.filter(one => !used.has(one.topicId) && one.minute <= beat.minute + DAY / 2 && one.minute >= beat.minute - 12 * DAY && !(Number.isFinite(one.heardMinute) && one.heardMinute <= beat.minute));
  if (!options.length) return null;
  const pick = options.sort((a, b) => (b.major - a.major) || (Math.abs(a.minute - beat.minute) - Math.abs(b.minute - beat.minute)))[0];
  used.add(pick.topicId);
  const heard = Number.isFinite(pick.heardMinute) ? `The family heard on ${shortDay(world, pick.heardMinute)}.` : 'The family never heard.';
  return { topicId: pick.topicId, minute: pick.minute, heardMinute: pick.heardMinute, text: `${sentence(pick.text)}, on ${shortDay(world, pick.minute)}.`, heard, claimId: pick.claimId };
}

/** Who is who at the close: home, still away with the army, prisoners, and those lost, each said plainly. */
function closing(world, household, trip, fates) {
  const members = people(world, household);
  const home = [], homeIds = [], lines = [];
  // Home, or - a family the road home did not bring in (sim/homecoming.mjs `stuck`) - still on the way.
  const gotHome = !trip || trip.status !== 'trip' && trip.status !== 'stuck' || Number.isFinite(trip.arrivedMinute);
  for (const person of members) {
    const fate = fates[person.id];
    const apart = trip?.apart?.find(one => one.personId === person.id);
    if (fate?.kind === 'dead') continue;
    if (fate?.kind === 'captured') { lines.push(`${firstName(person)} was still a prisoner${fate.war ? ' of the Mexican army' : ''}.`); continue; }
    if (apart?.still === 'army') { lines.push(`${firstName(person)} was still with the army.`); continue; }
    home.push(person.name); homeIds.push(person.id);
  }
  const lost = members.filter(person => fates[person.id]?.kind === 'dead');
  const sickLost = lost.filter(person => fates[person.id].sickness), warLost = lost.filter(person => !fates[person.id].sickness);
  if (warLost.length) lines.push(`${list(warLost.map(firstName))} did not come home.`);
  if (sickLost.length) lines.push(`The family lost ${sickLost.length === 1 ? whoTo(sickLost[0]) : `${sickLost.length} of its people`} to sickness.`);
  const where = gotHome ? 'home' : 'on the road home';
  // Named when there are few enough to read; counted when there are more.
  const who = home.length <= 4 ? list(home.map(name => name.split(' ')[0])) : lines.length ? `The other ${NUMBER_WORDS[home.length] || home.length} of the family` : `All ${NUMBER_WORDS[home.length] || home.length} of the family`;
  return { home, homeIds, gotHome, lines, caption: `${home.length ? `${who} ${home.length === 1 ? 'was' : 'were'} ${where} in the spring of 1836.` : `Nobody of the family was ${where} in the spring of 1836.`}${lines.length ? ` ${lines.join(' ')}` : ''}` };
}

/** The head of household among those home: the father, else the mother, else the eldest. */
function headOf(world, ids) {
  const home = ids.map(id => world.entities[id]).filter(Boolean);
  return home.find(person => person.kin?.role === 'father') || home.find(person => person.kin?.role === 'mother')
    || [...home].sort((a, b) => (b.age ?? 0) - (a.age ?? 0))[0] || null;
}
const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const herdWords = herd => [herd?.cattle ? `${NUMBER_WORDS[herd.cattle] || herd.cattle} head of cattle` : null, herd?.hogs ? `${NUMBER_WORDS[herd.hogs] || herd.hogs} hogs` : null].filter(Boolean);
/** A thing sold, as it reads inside a sentence: "the land", "the round-log cabin", "30 acres of cleared field". */
const itemWords = item => item.what.replace(/^The land, .*$/, 'the land').replace(/^The /, 'the ');

/**
 * The homecoming's scenes after the story's minute (owner, 2026-09-29, D10; `EPILOGUE_MS`): drawn as scenes in the family's own
 * yard (public/flashback.js `drawYard`), each its own length - seeing what is left, the first logs of a new house over a burned
 * one, the family remembering its dead, the head of household counting at the table, and the farm sold where it stands (D8).
 * Nothing here is glory or a final number: a burned farm is said to have had nothing left to sell, and what that counts is the
 * ending's to say (docs/FLASHBACK.md §2, *Glory is not in the flashback*). Only a family some of whom came home has them; the rest
 * end on the closing card, as before. The dates of the scenes after the arrival are the season's, since no record dates them.
 */
function epilogue(world, household, trip, fates, homeBeat, close) {
  if (!homeBeat || !close.gotHome || !close.homeIds.length) return [];
  const homeIds = close.homeIds;
  const head = headOf(world, homeIds);
  const layout = homeBeat.scene.house.layout;
  const burned = trip?.house === 'burned';
  const house = { shelter: burned ? 'ruined' : homeBeat.scene.house.shelter, layout };
  const at = homeBeat.minute;
  const later = 'Spring, 1836';
  const beats = [{ ...homeBeat, scene: { ...homeBeat.scene, people: homeIds }, durationMs: EPILOGUE_MS.home }];
  const grown = homeIds.filter(id => !['infant', 'small', 'child'].includes(bandOf(world.entities[id])));
  if (burned) {
    beats.push({ kind: 'rebuild', minute: at, date: later, homecoming: true, place: homeBeat.place, durationMs: EPILOGUE_MS.rebuild,
      caption: trip?.axe === false
        ? 'In the days after, they raked out the ashes and began again. They had no felling axe left to them, and the first logs of a new house went up with one lent by a neighbour.'
        : 'In the days after, they raked out the ashes and began again: the first logs of a new house went up where the old one had stood.',
      scene: { type: 'yard', part: 'rebuild', light: 'noon', house, people: homeIds, working: grown } });
  }
  const lost = people(world, household).filter(person => fates[person.id]?.kind === 'dead');
  if (lost.length) {
    // Somebody who died of a sickness is said by who they were to the family, never by name (docs/DISEASE.md §4).
    const remembered = lost.map(person => fates[person.id].sickness ? whoTo(person) : firstName(person));
    beats.push({ kind: 'burial', minute: at, date: later, homecoming: true, place: homeBeat.place, durationMs: EPILOGUE_MS.burial,
      caption: `The family gathered under the trees by the house to remember ${list(remembered)}, and set up ${lost.length === 1 ? 'a wooden marker' : `${NUMBER_WORDS[lost.length] || lost.length} wooden markers`} in their memory.`,
      scene: { type: 'yard', part: 'burial', light: 'evening', people: homeIds, markers: lost.length, ...(head && { head: head.id }) } });
  }
  if (head) {
    const money = household.resources?.money ?? 0;
    const herd = herdWords(trip?.herd);
    const farm = farmAtEnd(world, household);
    const counted = `${firstName(head)} sat down at the table to count what the family had left: ${reales(money)} in coin${herd.length ? `, and ${list(herd)} on the range` : ''}.`;
    beats.push({ kind: 'count', minute: at, date: later, homecoming: true, place: homeBeat.place, durationMs: EPILOGUE_MS.count,
      caption: burned ? `${counted} The farm was ashes: there was nothing left of it to sell.` : counted,
      scene: { type: 'yard', part: 'count', light: 'evening', house, people: homeIds, head: head.id } });
    if (farm.kind === 'sale') {
      const town = world.map.sites[household.settlementId]?.name;
      beats.push({ kind: 'sale', minute: at, date: later, homecoming: true, place: homeBeat.place, durationMs: EPILOGUE_MS.sale, sale: farm.total,
        caption: `A land agent${town ? ` from ${named(town)}` : ''} came out and bought the farm, ${list(farm.items.map(itemWords))}, for ${reales(farm.total)}. With the coin in the house, the family had ${reales(money + farm.total)}.`,
        scene: { type: 'yard', part: 'sale', light: 'noon', house, people: homeIds, head: head.id, agent: true } });
    }
  }
  return beats;
}

/**
 * One family's flashback: its beats in order, each with its share of the minute, a transcript of the captions for the page, and
 * the family's people as the page draws them. `trips` is `homecomings(world).trips`, worked out once for the whole class.
 */
export function flashbackScript(world, householdId, { trips = null } = {}) {
  const household = world.households?.[householdId];
  if (!household || !flashbackReady(world)) return null;
  const trip = (trips || homecomings(world).trips)[householdId] || null;
  const { found, fates, homeBeat } = candidates(world, household, trip);
  const name = householdName(world, household);
  const title = { kind: 'title', weight: 100, minute: 0, place: place(world, household.homeSiteId), caption: `This is the story of ${name}, from the fall of 1835 to the spring of 1836.`, scene: { type: 'title', people: people(world, household).map(person => person.id) } };
  const close = closing(world, household, trip, fates);
  // The homecoming's scenes after the story's minute (owner, 2026-09-29, D10).
  const tail = epilogue(world, household, trip, fates, homeBeat, close);
  const end = { kind: 'closing', weight: 100, minute: Math.max(world.minute, ...found.map(beat => beat.minute), ...tail.map(beat => beat.minute)), place: place(world, household.homeSiteId), caption: close.caption, scene: { type: 'closing', people: people(world, household).map(person => person.id), home: close.home } };
  // The most that matters, then in the order it happened; one beat of each kind except the fights and the losses.
  const seen = new Set();
  const chosen = [...found].sort((a, b) => b.weight - a.weight || a.minute - b.minute).filter(beat => {
    const key = ['fight', 'service', 'loss', 'taken', 'news'].includes(beat.kind) ? `${beat.kind}:${beat.event || beat.topicId || beat.minute}` : beat.kind;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MOST_BEATS - 2).sort((a, b) => a.minute - b.minute || a.weight - b.weight);
  const pool = happenings(world, householdId);
  // A fight the family's own person was in is its own beat, and is not shown again beside itself as a "meanwhile".
  const used = new Set([...chosen.filter(beat => beat.topicId).map(beat => beat.topicId), ...chosen.filter(beat => beat.kind === 'fight').map(beat => FIGHT_TOPIC[beat.event]).filter(Boolean)]);
  // Somebody who died of sickness is never named in the video (docs/DISEASE.md §4: "never on the projector as a name", and the
  // Host may play any family's to the class): wherever the story would say their name, it says who they were to the family.
  const members = people(world, household);
  const unnamed = new Set(members.filter(person => fates[person.id]?.kind === 'dead' && fates[person.id].sickness).map(person => person.id));
  const firstNames = members.map(firstName);
  const scrub = text => [...unnamed].reduce((said, id) => {
    const person = world.entities[id], first = firstName(person);
    const byName = said.split(person.name).join(whoTo(person));
    return firstNames.filter(name => name === first).length === 1 ? byName.replace(new RegExp(`\\b${first}\\b`, 'g'), whoTo(person)) : byName;
  }, text);
  const beats = [title, ...chosen, ...tail, end].map((beat, index) => {
    const meanwhile = meanwhileFor(world, beat, pool, used);
    const at = beat.place || (beat.scene?.route?.length ? beat.scene.route[Math.floor(beat.scene.route.length * ((beat.scene.from + beat.scene.to) / 2 || 0))] : null) || place(world, household.homeSiteId);
    const columns = beat.minute >= 240000 && ['map', 'road', 'home'].includes(beat.scene.type) ? columnsNear(world, beat.minute, at) : [];
    return { index, kind: beat.kind, minute: beat.minute, date: beat.kind === 'title' ? '1835–1836' : beat.date || day(world, beat.minute), caption: scrub(beat.caption), place: at ? { x: round(at.x), y: round(at.y), ...(at.name && { name: at.name }), ...(at.siteId && { siteId: at.siteId }) } : null,
      scene: { ...beat.scene, ...(columns.length && { columns }) }, ...(meanwhile && { meanwhile }), ...(beat.death && { death: true }), ...(beat.homecoming && { homecoming: true }), ...(beat.reveal && { reveal: true }),
      ...(Number.isFinite(beat.durationMs) && { epilogue: true, durationMs: beat.durationMs }), ...(beat.sale && { sale: beat.sale }),
      // What the class's own video (sim/class-flashback.mjs) reads a beat by: the fight it is of, and whose it is.
      ...(beat.event && { event: beat.event }), ...(beat.people && { people: beat.people }) };
  });
  // The minute shared out: the title and the close their own, the rest evenly, a fight or a loss a little longer to be read. The
  // homecoming's scenes after it each have their own length (`EPILOGUE_MS`), and the close follows them.
  const middle = beats.slice(1, -1).filter(beat => !beat.epilogue);
  const after = beats.filter(beat => beat.epilogue);
  const weights = middle.map(beat => (['fight', 'loss'].includes(beat.kind) || beat.meanwhile ? 1.2 : 1));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const share = FLASHBACK_MS - TITLE_MS - CLOSING_MS;
  let at = 0;
  beats[0].startMs = 0; beats[0].durationMs = TITLE_MS; at = TITLE_MS;
  middle.forEach((beat, i) => { const ms = i === middle.length - 1 ? FLASHBACK_MS - CLOSING_MS - at : Math.round(share * weights[i] / total); beat.startMs = at; beat.durationMs = ms; at += ms; });
  for (const beat of after) { beat.startMs = at; at += beat.durationMs; }
  const durationMs = FLASHBACK_MS + after.reduce((sum, beat) => sum + beat.durationMs, 0);
  beats.at(-1).startMs = at; beats.at(-1).durationMs = durationMs - at;
  const figures = people(world, household).map(person => unnamed.has(person.id) ? { ...figure(world, person), name: whoTo(person), unnamed: true } : figure(world, person));
  const transcript = beats.map(beat => [beat.date, beat.caption, beat.meanwhile ? `Meanwhile: ${beat.meanwhile.text} ${beat.meanwhile.heard}` : null].filter(Boolean).join(' '));
  return { version: SCRIPT_VERSION, householdId, name, played: Boolean(household.played), durationMs, storyMs: FLASHBACK_MS, people: figures, homeSiteId: household.homeSiteId, beats, transcript, ...(trip && { homecoming: { status: trip.status, arrivedMinute: trip.arrivedMinute ?? null, house: trip.house } }) };
}

/** Every family's flashback, the class's homecoming worked out once for all of them. */
export function flashbackScripts(world) {
  if (!flashbackReady(world)) return {};
  const { trips } = homecomings(world);
  return Object.fromEntries(Object.keys(world.households).map(id => [id, flashbackScript(world, id, { trips })]));
}
