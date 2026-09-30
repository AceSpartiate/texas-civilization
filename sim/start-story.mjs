// What a family's start adds to its story as the class runs (owner, 2026-09-29; sim/starts.mjs; docs/FAMILY_CREATION.md, *The
// family's start*): the law as it stood for a free Black family, Seguín's company for a Tejano family's men (sim/tejano.mjs), the
// people nobody plays on the road east - the enslaved, taken east by those who held them or slipping away toward the Mexican army -
// and a line for the ending about what came after for the family's people.
//
// Every line is a journal line, said once, at the moment the record has it and not before (`world.startsTold`). Nothing here is a
// mechanic: no refusal, no price, no fate changes. The people on the road are **never** something a family can use, trade with,
// command or be rewarded for (VISION.md §15: enslaved people are never "resource icons, bonuses, purchasable units, or inventory");
// they are drawn and they are named in words, and that is all.
import { record } from './events.mjs';
import { dateOf } from './clock.mjs';
import { advanceSeguin } from './tejano.mjs';
import { establishTruth, learn } from './knowledge.mjs';
import { ALAMO_WORD } from './alamo.mjs';
import { momentOf } from './directors.mjs';

export const CLAIMS = Object.freeze({
  law: 'HIST-TEX-784', ashworths: 'HIST-TEX-783', tejanoAfter: 'HIST-TEX-780',
  enslaved: 'HIST-TEX-787', escapes: 'HIST-TEX-788', game: 'FIC-GONZ-985', freeBlackGame: 'FIC-GONZ-986',
});

/** The calendar minute of a day of 1835-36 in this class (sim/clock.mjs `dateOf`, read backwards). */
export const minuteOn = (world, iso) => Math.round((Date.parse(`${iso}T00:00:00Z`) - dateOf(world, 0).getTime()) / 60000);

const toldOf = (world, householdId) => (world.startsTold?.[householdId] || []);
const told = (world, householdId, key) => toldOf(world, householdId).includes(key);
function mark(world, householdId, key) {
  world.startsTold ??= {};
  world.startsTold[householdId] = [...toldOf(world, householdId), key];
}

// ------------------------------------------------------------------------------------------------ a free Black family and the law

/**
 * The law as it changed for a free Black family, each line on the day word of it could have reached the family (`HIST-TEX-784`).
 * `ceiling:` the days are the law's, and five days more for a rider to Liberty; the word is not carried by the expresses
 * (sim/expresses.mjs `carryWord` is the way to carry it).
 */
export const FREE_BLACK_WORD = Object.freeze([
  Object.freeze({ key: 'ordinance', on: '1836-01-10',
    text: 'Word from San Felipe: the council of the new provisional government has ordered that no more free Black people may come into Texas. Families like yours who are here already may stay.' }),
  Object.freeze({ key: 'constitution', on: '1836-03-22',
    text: 'Word from the convention at Washington: the constitution of the new Republic says that no free person of African descent may live in Texas for good without the consent of its Congress, and it makes no Black person a citizen. Under Mexico, your family were citizens.' }),
]);

function tellTheLaw(world) {
  for (const household of Object.values(world.households)) {
    if (household.heritage !== 'free-black') continue;
    for (const word of FREE_BLACK_WORD) {
      if (told(world, household.id, word.key) || world.minute < minuteOn(world, word.on)) continue;
      mark(world, household.id, word.key);
      record(world, 'news', { householdId: household.id, importance: 3, classification: 'DOCUMENTED', claimId: CLAIMS.law, text: word.text });
    }
  }
}

// ------------------------------------------------------------------------------------------------ the people on the road east

/**
 * What a family on the road east is told of the enslaved people it met there, once each (`HIST-TEX-787`, `-788`; the wording is the
 * game's, `FIC-GONZ-985`). The first on the road, where a planter's wagons have halted and the people he held in slavery rest beside
 * them (drawn, `roadGroups`); the second at the first crossing the family waits at, among the families waiting their turn.
 */
export const ROAD_WORDS = Object.freeze({
  road: 'On the road the family passed a planter’s wagons halted to rest, and beside them the people he held in slavery: men, women and children, taken east with everything else he owned. They had no say in where they went.',
  crossing: name => `Waiting at ${name}, the family heard that some enslaved people had slipped away in the confusion and gone toward the Mexican army, hoping to be free.`,
});
/** How long into its flight a family passes the halted wagons: half a day on the road (`FIC-GONZ-985`). */
export const ROAD_AFTER_MINUTES = 12 * 60;
/** How long the halted wagons stay where the family passed them, and how near it is seen from (`FIC-GONZ-985`). */
export const ROAD_STAY_MINUTES = 8 * 60;
export const ROAD_SEEN_MILES = 2;
/** The people in a group on the road or at a crossing: never a count of anybody, a picture of many (`FIC-GONZ-985`). */
export const GROUP_SIZE = 5;

const leaderOf = (world, household) => household.members.map(id => world.entities[id]).find(person => person?.kind === 'person' && person.travel?.purpose === 'flee');

function tellTheRoad(world) {
  for (const household of Object.values(world.households)) {
    const flight = household.flight;
    if (!flight || flight.status !== 'fled' || household.takenIn) continue;
    const leader = leaderOf(world, household);
    if (!leader) continue;
    // Half a day on the road, moving, not waiting at a river: the halted wagons, where the family is now, a little off the road.
    if (!told(world, household.id, 'road') && !flight.crossing && world.minute - (flight.leftMinute ?? world.minute) >= ROAD_AFTER_MINUTES) {
      mark(world, household.id, 'road');
      world.roadPassed ??= {};
      world.roadPassed[household.id] = { x: +(leader.location.x + 0.03).toFixed(4), y: +(leader.location.y + 0.025).toFixed(4), minute: world.minute };
      record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'DOCUMENTED', claimId: CLAIMS.enslaved, text: ROAD_WORDS.road });
    }
    // The first river it waits at.
    if (!told(world, household.id, 'crossing') && flight.crossing) {
      mark(world, household.id, 'crossing');
      record(world, 'consequence', { householdId: household.id, importance: 2, classification: 'STRONGLY SUPPORTED', claimId: CLAIMS.escapes, text: ROAD_WORDS.crossing(world.map.sites[flight.crossing.siteId]?.name || 'the crossing') });
    }
  }
}

/**
 * The looks of the people in a group (`FIC-GONZ-985`): the cast's figures, recoloured by the palette as every family's are, in the
 * darker tones of the free Black range and plain homespun colours. stand-in: docs/ART_REQUESTS.md, request 2026-09-29 "the people of
 * the road east" - figures of enslaved men, women and children on the road, in their own clothes, with bundles; until then the cast.
 */
const GROUP = Object.freeze([
  Object.freeze({ f: 'ochre', sex: 'male', look: { skin: 'dark brown', hair: 'black', clothing: 'cream', head: 'straw hat' } }),
  Object.freeze({ f: 'rust-woman', sex: 'female', look: { skin: 'deep brown', hair: 'black', clothing: 'butternut', head: 'headscarf' } }),
  Object.freeze({ f: 'elder', sex: 'male', look: { skin: 'brown', hair: 'grey', clothing: 'grey', head: 'hat' } }),
  Object.freeze({ f: 'teal', sex: 'female', look: { skin: 'dark brown', hair: 'black', clothing: 'clay', head: 'headscarf' } }),
  Object.freeze({ f: 'boy', sex: 'male', child: true, look: { skin: 'deep brown', hair: 'black', clothing: 'cream' } }),
]);
function groupAt(id, centre, pose) {
  const people = GROUP.slice(0, GROUP_SIZE).map((one, index) => {
    const angle = (index / GROUP_SIZE) * Math.PI * 2 + 0.3;
    return { id: `${id}:${index}`, figure: one.f, ...(one.child && { small: 0.72 }), x: +(centre.x + Math.cos(angle) * 0.018).toFixed(4), y: +(centre.y + Math.sin(angle) * 0.011).toFixed(4),
      a: pose, p: pose, face: Math.cos(angle) > 0 ? 'w' : 'e', look: { ...one.look } };
  });
  return { id, kind: 'enslaved', people, pairs: [] };
}

/**
 * The groups a page may see (sim/ambient.mjs `ambientFor`): at every crossing where a family of the class is waiting its turn, and
 * the halted wagons a family passed on its road, for as long as they stay. A family's page sees a crossing's group while one of it is
 * waiting there, and the wagons it passed while it is within `ROAD_SEEN_MILES` of them; the Host sees every one.
 */
export function roadGroups(world, householdId, host = false) {
  if (!world.starts) return [];
  const groups = [];
  const waiting = new Map();
  for (const household of Object.values(world.households)) {
    const siteId = household.flight?.status === 'fled' ? household.flight.crossing?.siteId : null;
    if (siteId && world.map.sites[siteId]) waiting.set(siteId, [...(waiting.get(siteId) || []), household.id]);
  }
  for (const [siteId, families] of [...waiting].sort(([a], [b]) => a.localeCompare(b))) {
    if (!host && !families.includes(householdId)) continue;
    const site = world.map.sites[siteId];
    groups.push({ ...groupAt(`enslaved:${siteId}`, { x: site.x - 0.03, y: site.y + 0.035 }, 'idle'), siteId });
  }
  for (const [id, passed] of Object.entries(world.roadPassed || {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (world.minute - passed.minute > ROAD_STAY_MINUTES) continue;
    if (!host) {
      if (id !== householdId) continue;
      const leader = leaderOf(world, world.households[id]);
      if (!leader || Math.hypot(leader.location.x - passed.x, leader.location.y - passed.y) > ROAD_SEEN_MILES) continue;
    }
    groups.push(groupAt(`enslaved:road:${id}`, passed, 'rest'));
  }
  return groups;
}

// ------------------------------------------------------------------------------------------------ afterwards, for the ending

/**
 * What came after for the family's people, the last line of its story in the ending (sim/ending.mjs `familyEnding`), said as the
 * record has it (`HIST-TEX-780`, `-783`, `-784`): after the class's own time, so it is never in the journal. Null for an
 * Anglo-American family and for a class that deals no starts.
 */
export function afterWords(world, household) {
  if (!world?.starts) return null;
  if (household?.heritage === 'free-black') return 'After the war the Republic let free Black families who had lived in Texas before independence stay, but not vote. When a law of 1840 ordered free Black people out of Texas, the Ashworths’ white neighbours asked Congress to let them stay, and the Ashworth Act let them and every free Black family here before independence remain.';
  if (household?.heritage === 'tejano' && household.settlementId === 'bexar') return BEXAR_AFTER;
  if (household?.heritage === 'tejano') return 'After the war many Tejano families of De León’s colony, the De Leóns among them, were forced from their land and their cattle taken. Some came back years later to find their land in others’ hands.';
  return null;
}

// ------------------------------------------------------------------------------------------------ a rancho near Béxar

/**
 * What a family on a rancho near Béxar lives through (owner, 2026-09-29: "Béxar at 20+"; sim/starts.mjs `BEXAR_AT`): the war
 * comes to its door, and it is told what it hears and sees, each once, at the director's moment (`at`, a milestone) or on a day of
 * the calendar (`on`), `after` minutes later. The events are the record's (`HIST-TEX-790`, `-791`); that the family hears the guns
 * or sees the smoke from its land a few miles off, and the hour it hears, are the game's (`FIC-GONZ-988`). Nothing here costs the
 * family anything: the foragers of both armies are said, not taken from the family's own stores (`ceiling:`, a loss would want a
 * record of what was taken from whom).
 */
export const BEXAR_WORD = Object.freeze([
  Object.freeze({ key: 'bexar-concepcion', at: 'concepcion', after: 0, claimId: 'HIST-TEX-790',
    text: 'Early this morning the family heard guns up the river toward Mission Concepción, a long while firing, and then quiet. By evening a neighbour had the word: soldiers from the town had attacked the colonists\' camp at the mission and been driven back.' }),
  Object.freeze({ key: 'bexar-grass', on: '1835-11-14', after: 12 * 60, claimId: 'HIST-TEX-791',
    text: 'Salvador Flores and his riders came by, burning the grass across the country toward the Medina so the Mexican cavalry\'s horses will have nothing to eat. The family watched the smoke all day.' }),
  Object.freeze({ key: 'bexar-storming', at: 'assault', after: 3 * 60, claimId: 'HIST-TEX-790',
    text: 'Before dawn cannon began to fire in Béxar, and it went on all day and into the night: the colonists have gone into the town, fighting from house to house.' }),
  Object.freeze({ key: 'bexar-capitulation', at: 'capitulation', after: 6 * 60, claimId: 'HIST-TEX-791',
    text: 'Word from Béxar: General Cos has surrendered the town. The terms say the people of Béxar shall be protected in their persons and their property, and nobody troubled for the side he took.' }),
  Object.freeze({ key: 'bexar-foragers', at: 'alamo-siege', after: 3 * 1440, claimId: 'HIST-TEX-791',
    text: 'Mexican soldiers are riding out to the ranchos along the river for corn and cattle for Santa Anna\'s army. The families who stood with the Texians keep out of their way.' }),
  Object.freeze({ key: 'bexar-assault', at: 'alamo-assault', after: 8 * 60, claimId: 'HIST-TEX-060', fall: true,
    text: 'Before dawn the family heard heavy firing from the Alamo, and then it stopped. By afternoon word came down the river: the Mexican army has stormed the Alamo, and the men who fought in it were killed.' }),
]);
/** What came after for a family of the ranchos near Béxar, the last line of its ending (`HIST-TEX-791`). */
export const BEXAR_AFTER = 'After San Jacinto, Juan Seguín took back Béxar for Texas on June 4, 1836. The families of the ranchos who came home found them wasted by both armies, and in the years after many Tejano families of Béxar lost their land to newcomers.';

function tellBexar(world) {
  const milestones = world.director?.milestones || {};
  for (const household of Object.values(world.households)) {
    if (household.settlementId !== 'bexar' || household.flight) continue;
    for (const word of BEXAR_WORD) {
      if (told(world, household.id, word.key)) continue;
      const from = word.at ? (milestones[word.at] ? momentOf(world, word.at) : null) : minuteOn(world, word.on);
      if (from === null || world.minute < from + word.after) continue;
      mark(world, household.id, word.key);
      // The fall of the Alamo, known here the day it happened: the family's knowledge, so the word of its own is told when it
      // should be (sim/directors.mjs `tellWhenHeard`), and not days later by an express from Gonzales.
      if (word.fall) {
        if (!world.truth['alamo-fall']) establishTruth(world, { id: 'alamo-fall', text: ALAMO_WORD.fall, siteId: 'bexar', classification: 'DOCUMENTED', claimId: 'HIST-TEX-060' });
        learn(world, household.id, 'alamo-fall', { status: 'unconfirmed', source: 'Neighbours down the river', text: word.text });
        continue;
      }
      record(world, 'news', { householdId: household.id, importance: 3, classification: 'DOCUMENTED', claimId: word.claimId, text: word.text });
    }
  }
}

/** Every tick, in a class that deals starts: the lines above, and Seguín's company's (sim/tejano.mjs). */
export function advanceStarts(world) {
  if (!world.starts || world.status !== 'running') return;
  tellTheLaw(world);
  tellTheRoad(world);
  tellBexar(world);
  advanceSeguin(world);
}

/** What was told and where the wagons were passed, if it could not have been (sim/world.mjs `validateWorld`). */
export function startStoryInvalid(world) {
  if (world.startsTold !== undefined) {
    if (!world.starts || !world.startsTold || typeof world.startsTold !== 'object') return 'Invalid start story';
    for (const [id, keys] of Object.entries(world.startsTold)) if (!world.households[id] || !Array.isArray(keys) || keys.some(key => typeof key !== 'string')) return 'Invalid start story';
  }
  if (world.roadPassed !== undefined) {
    if (!world.starts || !world.roadPassed || typeof world.roadPassed !== 'object') return 'Invalid road passed';
    for (const [id, one] of Object.entries(world.roadPassed)) if (!world.households[id] || !Number.isFinite(one?.x) || !Number.isFinite(one?.y) || !Number.isFinite(one?.minute)) return 'Invalid road passed';
  }
  return null;
}
