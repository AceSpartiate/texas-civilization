// The class's own highlights video, played on the Host's screen before each family's own (owner, 2026-09-29, the triage's D10:
// "a flashback video plays from on the classview (unless solo play) showing key highlights from the adventure from the various
// players points of view"). docs/FLASHBACK.md §11.
//
// It is chosen from the same record the families' own videos are (sim/flashback.mjs): the families' scripts, worked out once for
// the class, and the world. From the families a student played (every family, in a class nobody played), the moments the whole
// class shared, each told from the families it happened to, by name:
//
//   the arrival          where the families took up their land (the class's homes on one map);
//   the first call        whose men rode for Gonzales, and how many families kept to their farms;
//   the fights            each fight a family's person was in, drawn from the battle engine's own projection as the family's own
//                         video draws it, with everybody of the class who was there and what came of them;
//   the news, and how late  the widest gap between two families in hearing the Alamo had fallen, and San Jacinto, each home
//                         marked with the day word reached it;
//   the flight east       the order to leave, the families' roads east drawn together, and the families that stayed;
//   burnings              whose farms were burned, and by whom;
//   prisoners             the people the Mexican army took from the families in the spring, counted by family;
//   the wedding           a lone parent's, where there was one;
//   sickness              how many families it came to on the road, counted and never named (docs/DISEASE.md §4);
//   the homecoming        who came home to a house standing and who to ashes;
//
// and a title and a closing card. **Two and a half minutes at most** (`CLASS_MS`): the class watches it together, standing,
// before each student's own minute and a half; a beat is 8.5 s (a fight 10 s), so at most sixteen beats, and a class with less to
// tell has a shorter video. The same rules as a family's video hold (tests/class-flashback.test.mjs): no virtue words, no gore,
// no glory and no final number, and nobody who died of a sickness named.
import { householdName } from './family.mjs';
import { diedQuietly } from './hunger.mjs';
import { dateOf } from './clock.mjs';
import { figure, flashbackReady } from './flashback.mjs';

/** The longest the class's video may be, and the title's and the closing card's and each beat's share of it. */
export const CLASS_MS = 150000;
export const CLASS_TITLE_MS = 6000, CLASS_CLOSING_MS = 8000, CLASS_BEAT_MS = 8500, CLASS_FIGHT_MS = 10000;
/** At most this many beats between the title and the close. */
export const CLASS_MOST_BEATS = 16;
/** The id the class's video is kept and asked for by (server/flashback.mjs), beside the families' `hh-N`. */
export const CLASS_VIDEO_ID = 'class';
/** Bumped when the class script changes shape, so an older video is made again. */
export const CLASS_SCRIPT_VERSION = 1;

const DAY = 1440;
const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const count = n => NUMBER_WORDS[n] || String(n);
const list = names => names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
const cap = text => text ? text[0].toUpperCase() + text.slice(1) : text;
const day = (world, minute) => dateOf(world, minute).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
const dayYear = (world, minute) => dateOf(world, minute).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const round = value => Math.round(value * 1000) / 1000;
const families = (n, word = 'family') => `${count(n)} ${n === 1 ? word : 'families'}`;

/** Somebody named so the class knows whose they are: the whole name, or the first name and the family's. */
function whoOf(world, person) {
  const household = world.households[person.householdId];
  if (String(person.name || '').includes(' ') || !household) return person.name;
  return household.principalId === person.id ? person.name : `${person.name} of ${householdName(world, household)}`;
}
/** A family's name inside a sentence: "the Flashwright family", "Trinidad's family". */
const familyOf = (world, household) => householdName(world, household);

/** A home as the class map marks it. */
const homeOf = (world, household, extra = {}) => {
  const site = world.map.sites[household.homeSiteId];
  return site ? { householdId: household.id, x: round(site.x), y: round(site.y), label: cap(familyOf(world, household)), ...extra } : null;
};

/** Where each played family heard of a topic, and when: `[{ household, minute }]` in the order they heard. */
function hearings(world, households, topicId) {
  return households.map(household => ({ household, minute: world.knowledge?.households?.[household.id]?.[topicId]?.receivedMinute }))
    .filter(one => Number.isFinite(one.minute)).sort((a, b) => a.minute - b.minute);
}

/**
 * The class's highlights: `{ version, householdId: 'class', name, durationMs, people, beats, transcript }`, the shape a family's
 * script has, so the same painter draws it (public/flashback.js). `scripts` are the families' (sim/flashback.mjs
 * `flashbackScripts`), worked out once for the class. Null before the class has ended for good.
 */
export function classFlashbackScript(world, scripts) {
  if (!flashbackReady(world)) return null;
  const all = Object.values(world.households);
  const played = all.filter(household => household.played);
  const shown = played.length ? played : all;
  const ids = new Set(shown.map(household => household.id));
  const own = id => scripts?.[id]?.beats || [];
  const found = [];
  const add = beat => { if (beat && Number.isFinite(beat.minute)) found.push(beat); };
  const peopleUsed = new Set();
  const use = list => { for (const id of list || []) peopleUsed.add(id); return list || []; };

  // ------------------------------------------------------------------------------------------------ the arrival
  const settlements = new Map();
  for (const household of shown) {
    const name = world.map.sites[household.settlementId]?.name;
    if (name) settlements.set(name, (settlements.get(name) || 0) + 1);
  }
  const near = [...settlements.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  add({ kind: 'arrival', weight: 95, minute: Math.min(...shown.map(household => own(household.id).find(beat => beat.kind === 'arrival')?.minute ?? 0)),
    caption: `${cap(families(shown.length))} came to new land in the colonies${near.length ? `, near ${list(near.slice(0, 4))}${near.length > 4 ? ' and other towns' : ''}` : ''}.`,
    scene: { type: 'homes', homes: shown.map(household => homeOf(world, household)).filter(Boolean) } });

  // ------------------------------------------------------------------------------------------------ the first call
  const calls = shown.map(household => ({ household, beat: own(household.id).find(beat => beat.kind === 'call') })).filter(one => one.beat);
  if (calls.length) {
    const went = calls.filter(one => /rode for Gonzales/.test(one.beat.caption));
    const riders = went.flatMap(one => (world.participation?.gonzales ? Object.entries(world.participation.gonzales).filter(([, part]) => part.householdId === one.household.id).map(([id]) => world.entities[id]) : []).filter(Boolean));
    add({ kind: 'call', weight: 80, minute: Math.min(...calls.map(one => one.beat.minute)),
      caption: went.length
        ? `Riders brought word that soldiers had come for the cannon at Gonzales. From ${families(went.length)} men rode to join the volunteers${riders.length && riders.length <= 4 ? `: ${list(riders.map(person => whoOf(world, person)))}` : ''}. ${calls.length - went.length ? `${cap(families(calls.length - went.length))} kept to ${calls.length - went.length === 1 ? 'its farm' : 'their farms'}.` : ''}`.trim()
        : `Riders brought word that soldiers had come for the cannon at Gonzales. No family of the class sent anybody; they kept to their farms.`,
      scene: { type: 'homes', homes: calls.map(one => homeOf(world, one.household, { mark: went.includes(one) ? 'went' : null })).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ the fights
  const byEvent = new Map();
  for (const household of shown) for (const beat of own(household.id)) {
    if (beat.kind !== 'fight' || !beat.event) continue;
    if (!byEvent.has(beat.event)) byEvent.set(beat.event, []);
    byEvent.get(beat.event).push({ household, beat });
  }
  for (const [event, taking] of byEvent) {
    const first = taking.find(one => one.beat.scene?.type === 'battle') || taking[0];
    const people = [...new Set(taking.flatMap(one => one.beat.people || one.beat.scene?.people || []))].map(id => world.entities[id]).filter(Boolean);
    if (!people.length) continue;
    // What came of them, in the families' own words with each first name made whole: "Asa was killed there." becomes "Asa
    // Flashwright was killed there." Their first sentence (who did what) is said once for all of them.
    const outcomes = taking.flatMap(one => {
      const rest = (one.beat.caption.match(/[.!?]\s+(.*)$/)?.[1] || '').split(/(?<=\.)\s+/).filter(Boolean);
      return rest.map(sentence => (one.beat.people || []).map(id => world.entities[id]).filter(Boolean)
        .reduce((said, person) => said.replace(new RegExp(`\\b${String(person.name).split(' ')[0]}\\b`), whoOf(world, person)), sentence));
    });
    const deaths = outcomes.filter(line => /killed/.test(line)).length;
    const name = first.beat.scene?.battle?.name || cap(event.replace(/-/g, ' '));
    add({ kind: 'fight', weight: 70 + Math.min(20, 4 * taking.length) + (deaths ? 10 : 0), minute: first.beat.minute, event,
      caption: `${cap(name)}: ${list(people.map(person => whoOf(world, person)))}${taking.length > 1 ? `, from ${families(taking.length)}` : ''}.${outcomes.length ? ` ${outcomes.join(' ')}` : ''}`,
      scene: { ...first.beat.scene, people: use(people.map(person => person.id)) }, durationMs: first.beat.scene?.type === 'battle' ? CLASS_FIGHT_MS : CLASS_BEAT_MS });
  }

  // ------------------------------------------------------------------------------------------------ the news, and how late
  const NEWS = { 'alamo-fall': 'the Alamo had fallen', 'san-jacinto': "Houston's army had won at San Jacinto" };
  for (const [topicId, what] of Object.entries(NEWS)) {
    const heard = hearings(world, shown, topicId);
    const truth = world.truth?.[topicId];
    if (heard.length < 2 || !truth) continue;
    const firstOne = heard[0], last = heard.at(-1);
    const gap = Math.round((last.minute - firstOne.minute) / DAY);
    if (gap < 1) continue;
    add({ kind: 'news', weight: 60 + Math.min(20, gap * 3), minute: firstOne.minute, topicId,
      caption: `Word that ${what} reached ${familyOf(world, firstOne.household)} on ${day(world, firstOne.minute)}, and ${familyOf(world, last.household)} only on ${day(world, last.minute)}, ${count(gap)} ${gap === 1 ? 'day' : 'days'} later.`,
      scene: { type: 'homes', homes: heard.map(one => homeOf(world, one.household, { note: day(world, one.minute) })).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ the flight east
  const told = shown.filter(household => household.flight);
  if (told.length) {
    const fled = told.filter(household => ['fled', 'refuged', 'returning', 'home'].includes(household.flight.status) || Number.isFinite(household.flight.leftMinute));
    const stayed = told.filter(household => !fled.includes(household));
    const routes = fled.map(household => {
      const beat = own(household.id).find(one => one.kind === 'flight');
      return beat?.scene?.route?.length > 1 ? { householdId: household.id, label: cap(familyOf(world, household)), points: beat.scene.route, wagon: Boolean(beat.scene.wagon) } : null;
    }).filter(Boolean);
    add({ kind: 'flight', weight: 88, minute: Math.min(...told.map(household => household.flight.orderedMinute ?? Infinity)),
      caption: `In March word came that the Mexican army was coming, and every family was told to leave for the east. ${fled.length ? `${cap(families(fled.length))} loaded ${fled.length === 1 ? 'its wagon' : 'their wagons'} and set out` : 'No family left'}${stayed.length ? `; ${families(stayed.length)} stayed on ${stayed.length === 1 ? 'its farm' : 'their farms'}` : ''}.`,
      scene: routes.length ? { type: 'routes', routes } : { type: 'homes', homes: told.map(household => homeOf(world, household)).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ burnings
  const burned = shown.filter(household => Number.isFinite(household.flight?.burned)).sort((a, b) => a.flight.burned - b.flight.burned);
  if (burned.length) {
    const byMexican = burned.filter(household => household.flight.burnedBy?.hand === 'mexican'), byTexian = burned.filter(household => !byMexican.includes(household));
    const said = [byMexican.length && `Mexican foragers burned the farm${byMexican.length > 1 ? 's' : ''} of ${list(byMexican.map(household => familyOf(world, household)))}`,
      byTexian.length && `the Texas army burned the farm${byTexian.length > 1 ? 's' : ''} of ${list(byTexian.map(household => familyOf(world, household)))}, so the Mexican army would find nothing`].filter(Boolean);
    const firstBurned = burned[0];
    // How many learned of it days after: sealed from them until the smoke, the word or the homecoming (sim/advance-word.mjs).
    const late = burned.filter(household => !Number.isFinite(household.flight.burnKnown?.minute) || household.flight.burnKnown.minute - household.flight.burned >= 360).length;
    add({ kind: 'burned', weight: 84, minute: firstBurned.flight.burned,
      caption: `${cap(said.join('; and '))}.${!late ? '' : late === burned.length ? (burned.length === 1 ? ' The family did not know it for days.' : ' None of them knew it for days.') : ` ${cap(families(late))} did not know it for days.`}`,
      scene: { type: 'home', homeSiteId: firstBurned.homeSiteId, house: { shelter: 'ruined', layout: firstBurned.house?.layout || null }, people: [], smoke: true } });
  }

  // ------------------------------------------------------------------------------------------------ prisoners in the spring
  const takenBy = shown.map(household => ({ household, taken: household.members.map(id => world.entities[id]).filter(person => person?.health?.condition === 'captured' && person.service?.status !== 'captured') })).filter(one => one.taken.length);
  if (takenBy.length) {
    const beat = takenBy.map(one => own(one.household.id).find(b => b.kind === 'taken')).find(Boolean);
    add({ kind: 'taken', weight: 78, minute: beat?.minute ?? Math.min(...burned.map(household => household.flight.burned), world.minute),
      caption: `Mexican soldiers took ${list(takenBy.map(one => `${count(one.taken.length)} ${one.taken.length === 1 ? 'person' : 'people'} of ${familyOf(world, one.household)}`))} prisoner in the spring.`,
      scene: beat?.scene ? { ...beat.scene, homeSiteId: takenBy[0].household.homeSiteId, people: use(takenBy.flatMap(one => one.taken.map(person => person.id)).slice(0, 6)) } : { type: 'homes', homes: takenBy.map(one => homeOf(world, one.household)).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ a wedding
  for (const household of shown) {
    const beat = own(household.id).find(one => one.kind === 'wedding');
    if (!beat) continue;
    add({ kind: 'wedding', weight: 76, minute: beat.minute, caption: `${cap(familyOf(world, household))}: ${beat.caption}`,
      scene: { ...beat.scene, homeSiteId: household.homeSiteId, people: use(beat.scene.people) } });
    break;
  }

  // ------------------------------------------------------------------------------------------------ sickness, counted
  const sick = shown.filter(household => own(household.id).some(beat => beat.kind === 'sickness' || (beat.kind === 'loss' && /died of/.test(beat.caption) && !/died of hunger/.test(beat.caption))));
  if (sick.length) {
    const lost = shown.filter(household => household.members.some(id => world.entities[id]?.health?.condition === 'dead' && world.entities[id].health.disease));
    const firstSick = Math.min(...sick.map(household => own(household.id).find(beat => beat.kind === 'sickness' || beat.kind === 'loss')?.minute ?? Infinity));
    add({ kind: 'sickness', weight: 55, minute: firstSick,
      caption: `Sickness came to ${families(sick.length)} on the road and in the camps.${lost.length ? ` ${cap(families(lost.length))} lost somebody to it.` : ''}`,
      scene: { type: 'homes', homes: sick.map(household => homeOf(world, household)).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ hunger, counted
  // Families that lost somebody to hunger (owner, 2026-09-30; sim/hunger.mjs): counted, never named, as the sickness is.
  const hungry = shown.filter(household => household.members.some(id => world.entities[id]?.health?.starved));
  if (hungry.length) {
    const firstLost = Math.min(...hungry.map(household => own(household.id).find(beat => beat.kind === 'loss' && /died of hunger/.test(beat.caption))?.minute ?? Infinity));
    add({ kind: 'hunger', weight: 54, minute: Number.isFinite(firstLost) ? firstLost : world.minute,
      caption: `${cap(families(hungry.length))} ran out of food, and lost somebody to hunger.`,
      scene: { type: 'homes', homes: hungry.map(household => homeOf(world, household)).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ the homecoming
  const home = shown.map(household => ({ household, house: scripts?.[household.id]?.homecoming?.house || null, beat: own(household.id).find(beat => beat.kind === 'home') })).filter(one => one.beat);
  if (home.length) {
    const ashes = home.filter(one => one.house === 'burned'), standing = home.filter(one => one.house === 'standing');
    const lostMen = shown.flatMap(household => household.members.map(id => world.entities[id]).filter(person => person?.health?.condition === 'dead' && !diedQuietly(person)));
    add({ kind: 'home', weight: 92, minute: Math.min(...home.map(one => one.beat.minute)),
      caption: `After San Jacinto the families went home${standing.length ? `: ${families(standing.length)} to ${standing.length === 1 ? 'a house' : 'houses'} still standing` : ''}${ashes.length ? `${standing.length ? ', and' : ':'} ${families(ashes.length)} to ashes` : ''}.${lostMen.length ? ` ${cap(count(lostMen.length))} of the class's people did not come home from the war.` : ''}`,
      scene: { type: 'homes', homes: home.map(one => homeOf(world, one.household, { mark: one.house === 'burned' ? 'burned' : one.house === 'standing' ? 'standing' : null })).filter(Boolean) } });
  }

  // ------------------------------------------------------------------------------------------------ cut, in order, and timed
  const chosen = [...found].sort((a, b) => b.weight - a.weight || a.minute - b.minute).slice(0, CLASS_MOST_BEATS).sort((a, b) => a.minute - b.minute || b.weight - a.weight);
  let middle = chosen.map(beat => ({ ...beat, durationMs: beat.durationMs || CLASS_BEAT_MS }));
  while (middle.length && CLASS_TITLE_MS + CLASS_CLOSING_MS + middle.reduce((sum, beat) => sum + beat.durationMs, 0) > CLASS_MS) {
    const least = middle.reduce((low, beat) => (beat.weight < low.weight ? beat : low), middle[0]);
    middle = middle.filter(beat => beat !== least);
  }
  // The heads of the families on the title card; the homes of the class under the close.
  const heads = shown.map(household => world.entities[household.principalId]).filter(Boolean).slice(0, 10).map(person => person.id);
  use(heads);
  const wentAny = new Set(Object.values(world.participation || {}).flatMap(parts => Object.entries(parts).filter(([, part]) => ids.has(part.householdId)).map(([id]) => id)));
  for (const record of Object.values(world.glory || {})) for (const award of Object.values(record.awards || {})) if (ids.has(world.entities[award.personId]?.householdId) && !['helped', 'sheltered', 'voted'].includes(award.role)) wentAny.add(award.personId);
  const title = { kind: 'title', minute: 0, date: '1835–1836', caption: `The story of this class: ${families(shown.length)} in the colonies of Texas, from the fall of 1835 to the spring of 1836.`, scene: { type: 'title', people: heads }, durationMs: CLASS_TITLE_MS };
  const closing = { kind: 'closing', minute: world.minute, date: 'Spring, 1836', caption: `${cap(count(wentAny.size))} of the class's people went to the war. Every family has its own story, and each of you will now see yours, on your own screen.`, scene: { type: 'closing', people: heads, home: heads.map(id => world.entities[id]?.name) }, durationMs: CLASS_CLOSING_MS };
  const beats = [title, ...middle, closing].map((beat, index) => ({
    index, kind: beat.kind, minute: beat.minute, date: beat.date || dayYear(world, beat.minute), caption: beat.caption,
    place: beat.scene?.homeSiteId && world.map.sites[beat.scene.homeSiteId] ? { x: round(world.map.sites[beat.scene.homeSiteId].x), y: round(world.map.sites[beat.scene.homeSiteId].y), siteId: beat.scene.homeSiteId } : null,
    scene: beat.scene, durationMs: beat.durationMs, ...(beat.event && { event: beat.event }),
  }));
  let at = 0;
  for (const beat of beats) { beat.startMs = at; at += beat.durationMs; }
  // Nobody who died of a sickness is drawn with a name, as in a family's video (docs/DISEASE.md §4): they are left off the cards.
  const figures = [...peopleUsed].map(id => world.entities[id]).filter(person => person && !diedQuietly(person)).map(person => figure(world, person));
  const transcript = beats.map(beat => `${beat.date} ${beat.caption}`);
  return { version: CLASS_SCRIPT_VERSION, householdId: CLASS_VIDEO_ID, name: 'The class', class: true, played: true, durationMs: at, people: figures, homeSiteId: shown[0]?.homeSiteId || null, beats, transcript };
}
