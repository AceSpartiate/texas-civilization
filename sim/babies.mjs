// The family's babies (owner, 2026-09-26; docs/CHILDREN.md §6). This supersedes the owner's rule of 2026-09-21 that an infant
// under two has nothing: an infant is still given no work, but is no longer a still figure in the yard.
//
// "babies can crawl around and cry for attention too. if they cry, then the nearest female character that's of age will stop
// their task and hold the baby for a while. they'll comfort the baby and sing to it. then they'll put the baby down for a nap.
// then they return to their previous task and state. if there's only one female of age, then they won't obey an order to leave
// the baby and travel without the baby. be creative in how you handle the various situations that can arise from this. it isn't
// meant to be annoying or a time sink. it's meant to make the family feel more alive." And the same day: "of age means old
// enough to do work on the farm for our purposes" - which is `SENT_FROM_AGE`, ten, read as `tooYoung` (sim/family.mjs).
//
// **The day of a baby at home** (`advanceBabies`), every tick of the waking day:
//   - **Awake**, it crawls about the place it was set down, a few yards this way and that (`CRAWL_REACH`). Rabb's baby crawled
//     two hundred yards to the cow pen and was found with the dog licking his head (`HIST-TEX-616`); this game keeps them closer.
//   - Now and then it **cries** (`CRY_PER_TICK`, twice as often when sick): a tick of crying, seen and heard, and then somebody comes.
//   - **Who comes**, in this order: a child set to mind the little ones, who has it already and stops nobody; a woman already
//     holding another baby, who takes this one too (twins); the nearest woman of age (ten or more) at home; with none, the nearest
//     of the family of age, a father or an elder brother; with nobody, it cries a while and settles by itself. Nobody is taken
//     past `COMFORT_CAP_TICKS` of a day for a well baby, so a family is never short of a morning's work for it.
//   - **What she does**: stops her work where it stands (sim/aside.mjs), goes to it, holds it and sings to it (`COMFORT_TICKS`),
//     puts it down for a nap (`NAP_TICKS`), and goes back to **exactly** what she was at - the chore at its own step, where she
//     stood, working or resting as she was, her automation as it was. A child who was talking with her is let go, and comes again
//     later: the two never hold each other up.
//   - At night the baby sleeps, and nobody is woken in the game's hours of dark (`WAKING_HOURS`, sim/childhood.mjs).
//
// **Leaving the baby** (`takeBabyAlong`, from sim/world.mjs `beginTravel`): the woman of age who is the last at home with a baby
// does not leave it - she takes it with her on her hip, and says so; with another woman of age at home she leaves it with her and
// says that. The owner's rule is hers; the game carries it on to the last grown person of all, so a lone father sent to town does
// not leave a baby in the yard either. A carried baby goes where she goes and is set down when she is home.
//
// **On the road east** the family carries its babies already (sim/company.mjs `seatPlan`): nothing stops, and a baby that cries
// is sung to in the wagon or in her arms as they go. At the camp at the refuge a baby crawls and cries as at home. Where the class's
// calendar runs faster than an hour a tick (sim/clock.mjs), a tick is too long a stretch to stop anybody for: the baby still naps
// and crawls, and a cry is a line of the day, answered as they go.
//
// Every number is the game's own (`FIC-GONZ-482` to `-486`); every word said is RECONSTRUCTED, and the lullabies are named, never
// sung (`HIST-TEX-617`, `-618`). Nothing is stored that an old save lacks a correct empty value for: a baby with no `baby` is awake,
// a person with no `aside` is at their work, and nobody is carried - so **no save version moved**.
import { record } from './events.mjs';
import { sexOf, tooYoung } from './family.mjs';
import { BABY_UNDER } from './furniture.mjs';
import { calendarMinutes } from './clock.mjs';
import { stirredShare } from './shares.mjs';
import { awake, endTalk } from './childhood.mjs';
import { CHORES } from './chores.mjs';

const GONE = Object.freeze(['dead', 'captured']);
const DAY = 1440;
const r4 = value => Math.round(value * 10000) / 10000;

/** The chance a baby awake at home cries on a tick of the farming day: about one cry in a morning. Doubled for a sick baby. */
export const CRY_PER_TICK = 0.03;
/** How long she holds it, in ticks: the tick she picks it up and the tick she lays it down. A sick baby is held a tick longer. */
export const COMFORT_TICKS = 2, SICK_COMFORT_TICKS = 3;
/** The most of one person's ticks a day that a well baby's crying takes: two comfortings, forty minutes of a working day. */
export const COMFORT_CAP_TICKS = 4;
/** How long a baby put down sleeps, in ticks: two hours of the farming day. */
export const NAP_TICKS = 6;
/** How far a baby crawls from where it was set down, in miles: about nine yards. */
export const CRAWL_REACH = 0.005;
/** The slowest calendar a baby's crying stops anybody on: an hour a tick. Past it a cry is the day's line (`FIC-GONZ-485`). */
export const COMFORT_SCALE = 60;
/** On the road, or on a calendar too fast to stop for, the chance a baby's day has a line of crying in it. */
export const ROAD_CRY_A_DAY = 0.5;

export const isBaby = entity => entity?.kind === 'person' && Number.isFinite(entity.age) && entity.age < BABY_UNDER;
/** Of age, for holding a baby and for not leaving one (owner, 2026-09-26): old enough for the family's farm work. */
export const ofAge = entity => entity?.kind === 'person' && !tooYoung(entity);
export const womanOfAge = entity => ofAge(entity) && sexOf(entity) === 'female';
const pronoun = baby => (sexOf(baby) === 'female' ? 'her' : sexOf(baby) === 'male' ? 'him' : 'them');
/** Where the family lives now: its own land, or its camp at the refuge on the road east. */
export const placeOf = household => (household.flight?.status === 'refuged' ? household.flight.refuge : household.homeSiteId);
const at = (person, place) => person && !GONE.includes(person.health?.condition) && !person.travel && person.location?.siteId === place && person.service?.status !== 'serving';
const tell = (world, household, entity, text, claimId = 'FIC-GONZ-483', importance = 1) => record(world, 'consequence', {
  actorId: entity.id, householdId: household.id, importance, classification: 'FICTIONAL FOR GAMEPLAY', claimId, text,
});
const workOf = person => (person.chore ? (CHORES[person.chore.id]?.name || 'the work').toLowerCase() : person.task === 'work' ? 'the work about the place' : 'resting');
const dayOf = world => Math.floor(world.minute / DAY);
/** How much of today this person has spent holding babies, in ticks. */
const takenToday = (world, person) => (person.comforted?.day === dayOf(world) ? person.comforted.ticks : 0);

/** A person called away from holding the babies - a journey, the army, a death: they are set down awake, and nobody is restored. */
function letGo(world, person) {
  for (const id of person.aside?.babyIds || []) {
    const baby = world.entities[id];
    if (baby?.baby?.state === 'held') baby.baby = { state: 'awake', ...(baby.baby.spot && { spot: baby.baby.spot }) };
  }
  delete person.aside;
}

/**
 * Whoever is set to leave by a journey is let go of what the family's little ones had them at (sim/world.mjs `beginTravel`): a
 * child talking with them is left with nothing to do, a baby they held is set down.
 */
export function leaveAside(world, entity) {
  if (entity.aside?.kind === 'baby') letGo(world, entity);
  if (entity.aside?.kind === 'talk') for (const id of [...entity.aside.childIds]) { const child = world.entities[id]; if (child) { endTalk(world, child); child.idleSince = world.tick; } }
}

/** She (or the last grown person at home) picks the baby up and takes it: the owner's "won't ... travel without the baby". */
export function takeBabyAlong(world, entity) {
  const household = world.households[entity.householdId];
  if (!household || entity.kind !== 'person' || !entity.travel) return;
  leaveAside(world, entity);
  if (!ofAge(entity)) return;
  const place = entity.travel.from;
  if (place !== placeOf(household)) return;
  const people = household.members.map(id => world.entities[id]).filter(Boolean);
  const babies = people.filter(person => isBaby(person) && at(person, place) && !person.carriedBy);
  if (!babies.length) return;
  const stays = people.filter(person => person.id !== entity.id && at(person, place));
  const woman = stays.find(womanOfAge);
  const names = babies.map(baby => baby.name).join(' and ');
  if (woman) {
    // With another woman of age at home, the baby stays with her - said when it is the mother who goes.
    if (babies.some(baby => (baby.kin?.parents || []).includes(entity.id))) tell(world, household, entity, `${entity.name} left ${names} with ${woman.name}.`, 'FIC-GONZ-484');
    return;
  }
  // The only woman of age there, or with none, the last grown person of the family there: the baby goes with them.
  if (!womanOfAge(entity) && stays.some(ofAge)) return;
  for (const baby of babies) {
    baby.carriedBy = entity.id;
    baby.baby = { state: 'carried' };
    ride(baby, entity);
  }
  tell(world, household, entity, `${entity.name} took ${names} with ${womanOfAge(entity) ? 'her' : 'them'} on ${womanOfAge(entity) ? 'her' : 'their'} hip: there is nobody ${womanOfAge(entity) ? 'else of age' : 'grown'} at home to leave ${babies.length > 1 ? 'them' : pronoun(babies[0])} with.`, 'FIC-GONZ-484', 2);
}

/** Every tick, after everybody has moved: a carried baby is where its carrier is, and set down when they are home. */
export function carryBabies(world) {
  for (const baby of Object.values(world.entities)) {
    if (!baby.carriedBy) continue;
    const carrier = world.entities[baby.carriedBy], household = world.households[baby.householdId];
    if (!carrier || GONE.includes(carrier.health?.condition) || !household) {
      // ceiling: a baby whose carrier is killed or taken on an errand is set down where they were and stays there; nothing of
      // the record read has it, and bringing it home would want a journey nobody is making. The way out is a neighbour who carries it.
      delete baby.carriedBy; baby.baby = { state: 'awake' };
      const siteId = carrier?.location?.siteId ?? baby.travel?.from ?? household?.homeSiteId;
      baby.travel = null;
      baby.location = { x: baby.location.x, y: baby.location.y, siteId };
      continue;
    }
    if (!carrier.travel && carrier.location?.siteId === placeOf(household)) {
      delete baby.carriedBy;
      baby.travel = null;
      baby.location = { x: r4(carrier.location.x + 0.003), y: r4(carrier.location.y + 0.002), siteId: carrier.location.siteId };
      baby.baby = { state: 'nap', until: world.tick + NAP_TICKS, spot: { x: baby.location.x, y: baby.location.y } };
      continue;
    }
    ride(baby, carrier);
  }
}

/**
 * A carried baby goes where its carrier goes, by the same road at the same moment: on the road it has the carrier's journey as
 * its own (`purpose: 'carried'`, silent, costing it nothing - `carried` on the record), and wherever the carrier stands, it stands.
 * Written again every tick from the carrier's, so the two can never part.
 */
function ride(baby, carrier) {
  if (carrier.travel) {
    const { fords, loggedProgress, progressEventId, ...journey } = carrier.travel;
    baby.travel = { ...journey, purpose: 'carried', carried: carrier.id, silent: true };
    baby.location = { x: carrier.location.x, y: carrier.location.y, siteId: null };
  } else {
    baby.travel = null;
    baby.location = { x: carrier.location.x, y: carrier.location.y, siteId: carrier.location.siteId };
  }
  baby.task = 'rest';
}

/** Who comes to a crying baby at this place: see the rule at the top. Returns { minder } or { holder } or { carer } or {}. */
export function whoComes(world, household, baby, place) {
  const people = household.members.map(id => world.entities[id]).filter(person => person && person.id !== baby.id);
  const minder = people.find(person => person.chore?.id === 'child-mind' && at(person, place));
  if (minder) return { minder };
  const holder = people.find(person => person.aside?.kind === 'baby' && at(person, place));
  if (holder) return { holder };
  const sick = baby.health?.condition === 'sick';
  const free = people.filter(person => ofAge(person) && at(person, place) && (sick || takenToday(world, person) < COMFORT_CAP_TICKS));
  const far = person => Math.hypot(person.location.x - baby.location.x, person.location.y - baby.location.y);
  const nearest = list => [...list].sort((a, b) => far(a) - far(b) || a.id.localeCompare(b.id))[0] || null;
  const carer = nearest(free.filter(womanOfAge)) || nearest(free);
  return carer ? { carer } : {};
}

/** Somebody comes to the crying baby: stops where they are, goes to it and picks it up. */
function comfort(world, household, baby, place) {
  const spot = baby.baby?.spot || { x: baby.location.x, y: baby.location.y };
  const { minder, holder, carer } = whoComes(world, household, baby, place);
  if (minder) {
    baby.baby = { state: 'awake', spot };
    tell(world, household, minder, `${baby.name} cried, and ${minder.name}, who has the little ones, jogged ${pronoun(baby)} on a hip until ${pronoun(baby) === 'them' ? 'they' : pronoun(baby) === 'her' ? 'she' : 'he'} settled.`);
    return;
  }
  if (holder) {
    holder.aside.babyIds = [...new Set([...holder.aside.babyIds, baby.id])];
    baby.baby = { state: 'held', by: holder.id, spot };
    tell(world, household, holder, `${baby.name} cried as well, and ${holder.name} took ${pronoun(baby)} up too.`);
    return;
  }
  if (!carer) {
    baby.baby = { state: 'awake', spot };
    tell(world, household, baby, `${baby.name} cried a while with nobody near, and settled by ${pronoun(baby) === 'them' ? 'themself' : `${pronoun(baby)}self`}.`);
    return;
  }
  // A child talking with her is let go first: the baby comes before a child with nothing to do, and the two never hold each other up.
  // Every child talking with her or on the way to her, so none is left walking over to somebody holding a baby.
  for (const id of household.members) {
    const child = world.entities[id];
    if (child?.talk?.withId !== carer.id) continue;
    endTalk(world, child, child.talk.phase === 'talking' ? `${carer.name} went to the baby, and ${child.name} is left with nothing to do.` : null);
    child.idleSince = world.tick;
  }
  const ticks = baby.health?.condition === 'sick' ? SICK_COMFORT_TICKS : COMFORT_TICKS;
  carer.aside = { kind: 'baby', babyIds: [baby.id], until: world.tick + ticks, was: { x: carer.location.x, y: carer.location.y, siteId: carer.location.siteId, task: carer.task } };
  if (baby.health?.condition !== 'sick') carer.comforted = { day: dayOf(world), ticks: takenToday(world, carer) + ticks };
  carer.location = { x: r4(spot.x - 0.003), y: r4(spot.y), siteId: place };
  baby.baby = { state: 'held', by: carer.id, spot };
  hold(baby, carer);
  tell(world, household, carer, carer.chore || carer.task === 'work'
    ? `${baby.name} cried, and ${carer.name} left ${workOf(carer)} to pick ${pronoun(baby)} up.`
    : `${baby.name} cried, and ${carer.name} got up to pick ${pronoun(baby)} up.`);
}

/** A held baby is on the holder's hip. */
const hold = (baby, carer) => { baby.location = { x: r4(carer.location.x + 0.0012), y: r4(carer.location.y - 0.0004), siteId: carer.location.siteId }; };

/** Every tick for everybody holding babies: go on holding, or lay them down and go back to exactly what they were at. */
function holding(world, household, person) {
  const aside = person.aside;
  const place = placeOf(household);
  if (!at(person, place)) { letGo(world, person); return; }
  const babies = aside.babyIds.map(id => world.entities[id]).filter(baby => baby?.baby?.state === 'held' && baby.baby.by === person.id);
  if (world.tick < aside.until && babies.length) { for (const baby of babies) hold(baby, person); return; }
  for (const baby of babies) {
    const spot = baby.baby.spot || { x: baby.location.x, y: baby.location.y };
    baby.location = { x: spot.x, y: spot.y, siteId: place };
    baby.baby = { state: 'nap', until: world.tick + NAP_TICKS, spot };
  }
  const { was } = aside;
  delete person.aside;
  person.location = { x: was.x, y: was.y, siteId: was.siteId };
  if (was.task) person.task = was.task;
  const names = babies.map(baby => baby.name).join(' and ');
  if (names) tell(world, household, person, `${person.name} sang ${names} to sleep and put ${babies.length > 1 ? 'them' : pronoun(babies[0])} down for a nap${person.chore || person.task === 'work' ? `, and went back to ${workOf(person)}` : ''}.`);
}

/** A cry on the road, or on a calendar too fast to stop for: the day's line, answered as they go. */
function crySaid(world, household, baby) {
  const day = dayOf(world);
  if (baby.baby?.saidDay === day) return;
  baby.baby = { ...(baby.baby || { state: 'awake' }), saidDay: day };
  if (stirredShare(world, baby.id, `cry-day:${day}`) >= ROAD_CRY_A_DAY * (baby.health?.condition === 'sick' ? 2 : 1)) return;
  const by = world.entities[baby.carriedBy || baby.travel?.carried] || household.members.map(id => world.entities[id]).find(person => womanOfAge(person) && !GONE.includes(person.health?.condition));
  const who = by?.name || 'somebody';
  const sick = baby.health?.condition === 'sick';
  const text = baby.travel?.purpose === 'flee' || baby.travel?.purpose === 'return'
    ? (sick ? `${baby.name} is sick and cried most of the day; ${who} held ${pronoun(baby)} the whole way.` : `${baby.name} cried on the road, and ${who} sang to ${pronoun(baby)} as they went.`)
    : baby.carriedBy ? `${baby.name} fussed on ${who}'s hip, and ${who} hummed to ${pronoun(baby)} as ${by && womanOfAge(by) ? 'she' : 'they'} went.`
    : `${baby.name} cried half the night, and ${who} walked ${pronoun(baby)} up and down until ${pronoun(baby) === 'them' ? 'they' : pronoun(baby) === 'her' ? 'she' : 'he'} slept.`;
  tell(world, household, baby, text, 'FIC-GONZ-485');
}

/**
 * Every tick, after the children: every baby of every family crawls, naps and sleeps; in a family somebody plays, a baby cries
 * and is held, and whoever held it goes back to what they were at. A family nobody plays is not stopped by its babies: the
 * director runs its day, and a pause nobody can see is a cost nobody chose.
 */
export function advanceBabies(world) {
  const slow = calendarMinutes(world) <= COMFORT_SCALE;
  const day = awake(world);
  for (const household of Object.values(world.households)) {
    const people = household.members.map(id => world.entities[id]).filter(Boolean);
    for (const person of people) if (person.aside?.kind === 'baby') holding(world, household, person);
    const place = placeOf(household);
    // Only a family somebody is playing: its babies are the ones a student is there to see, and the neighbours' stand as they did.
    const played = household.played && !household.absent && world.status === 'running';
    if (!played) continue;
    for (const baby of people) {
      if (!isBaby(baby) || GONE.includes(baby.health?.condition)) continue;
      if (baby.carriedBy || baby.travel) { if (played && day) crySaid(world, household, baby); continue; }
      if (baby.location?.siteId !== place) continue;
      const state = baby.baby?.state || 'awake';
      if (state === 'held') continue;
      const spot = baby.baby?.spot || { x: baby.location.x, y: baby.location.y };
      if (!day) { if (state !== 'night') baby.baby = { state: 'night', spot }; continue; }
      if (state === 'nap' && world.tick < baby.baby.until) continue;
      if (state === 'cry') { if (slow && played) comfort(world, household, baby, place); else baby.baby = { state: 'awake', spot }; continue; }
      if (state !== 'awake' || !baby.baby) baby.baby = { state: 'awake', spot };
      // Crawling: a few yards this way and that from where it was set down, drawn from one place to the next over the tick.
      const turn = stirredShare(world, baby.id, `crawl:${world.tick}`) * Math.PI * 2, far = CRAWL_REACH * stirredShare(world, baby.id, `crawl-far:${world.tick}`);
      baby.location = { x: r4(spot.x + Math.cos(turn) * far), y: r4(spot.y + Math.sin(turn) * far), siteId: place };
      if (!played) continue;
      if (!slow) { crySaid(world, household, baby); continue; }
      const chance = CRY_PER_TICK * (baby.health?.condition === 'sick' ? 2 : 1);
      if (stirredShare(world, baby.id, `cry:${world.tick}`) < chance) baby.baby = { ...baby.baby, state: 'cry', cried: world.tick };
    }
  }
}

/** The lullabies a woman of the colonies might sing, named and never sung (`HIST-TEX-617`, `-618`): the page shows "(humming)". */
export const LULLABIES = Object.freeze(['“A Cradle Hymn”', '“Hush-a-bye, Baby”', '“Bye, Baby Bunting”', '“Señora Santa Ana”']);
const HUSH = Object.freeze(['Hush now. Hush.', 'There, there. I have you.', 'Shh, little one. Shh.', 'Ya, ya. Ya pasó.', 'Who is that crying? Who is it?']);

/** The words over the family's babies and whoever holds them, for its own page: a cry, a hush, a lullaby hummed. */
export function babyLines(world, household) {
  const lines = [];
  for (const id of household.members) {
    const baby = world.entities[id];
    if (!isBaby(baby)) continue;
    if (baby.baby?.state === 'cry') lines.push({ id: `${baby.id}:cry:${world.tick}`, sceneId: `baby:${baby.id}`, speakerId: baby.id, text: '(crying)', kind: 'reconstructed', claimId: 'FIC-GONZ-483' });
    if (baby.baby?.state === 'held') {
      const carer = world.entities[baby.baby.by];
      if (!carer || carer.aside?.babyIds?.[0] !== baby.id) continue;
      const first = world.tick < carer.aside.until - 1;
      const lullaby = LULLABIES[Math.floor(stirredShare(world, carer.id, 'lullaby') * LULLABIES.length) % LULLABIES.length];
      lines.push(first
        ? { id: `${carer.id}:hush:${world.tick}`, sceneId: `baby:${baby.id}`, speakerId: carer.id, text: HUSH[Math.floor(stirredShare(world, carer.id, `hush:${world.tick}`) * HUSH.length) % HUSH.length], kind: 'reconstructed', claimId: 'FIC-GONZ-483' }
        : { id: `${carer.id}:sing:${world.tick}`, sceneId: `baby:${baby.id}`, speakerId: carer.id, text: '(humming)', manner: `singing ${lullaby}`, kind: 'reconstructed', claimId: 'HIST-TEX-617' });
    }
  }
  return lines;
}

/** What a baby's row says, and a grown-up's while they hold one, in the server's words; or null. */
export function babyLine(world, household, entity) {
  const nameOf = id => world.entities[id]?.given || world.entities[id]?.name || 'somebody';
  if (entity.aside?.kind === 'baby') return `Seeing to ${entity.aside.babyIds.map(nameOf).join(' and ')}: holding and singing, then back to ${workOf(entity)}.`;
  if (!isBaby(entity) || GONE.includes(entity.health?.condition)) return null;
  // A family nobody plays keeps its babies still (`advanceBabies`), and a line saying one crawls would be untrue.
  if (!household?.played || household.absent) return null;
  const sick = entity.health?.condition === 'sick' ? 'Sick. ' : '';
  if (entity.carriedBy) return `${sick}Carried by ${nameOf(entity.carriedBy)}.`;
  if (entity.travel?.carried) return `${sick}In ${nameOf(entity.travel.carried)}'s arms on the road.`;
  const state = entity.baby?.state || 'awake';
  if (state === 'held') return `${sick}Held by ${nameOf(entity.baby.by)}, who is singing to ${pronoun(entity)}.`;
  if (state === 'cry') return `${sick}Crying for somebody.`;
  if (state === 'nap') return `${sick}Napping.`;
  if (state === 'night') return `${sick}Asleep for the night.`;
  return `${sick}Crawling about the ${household?.flight?.status === 'refuged' ? 'camp' : 'yard'}.`;
}

/** A saved baby's state that cannot be, or null. */
export function babiesInvalid(world) {
  const STATES = ['awake', 'cry', 'held', 'nap', 'night', 'carried'];
  for (const entity of Object.values(world.entities)) {
    if (entity.kind !== 'person') continue;
    if (entity.baby !== undefined && (!entity.baby || !STATES.includes(entity.baby.state))) return 'Invalid baby';
    if (entity.baby?.state === 'held' && world.entities[entity.baby.by]?.aside?.kind !== 'baby') return 'A baby held by nobody';
    if (entity.carriedBy !== undefined && !world.entities[entity.carriedBy]) return 'A baby carried by nobody';
    if (entity.aside?.kind === 'baby' && (!Array.isArray(entity.aside.babyIds) || !Number.isInteger(entity.aside.until) || !Number.isFinite(entity.aside.was?.x))) return 'Invalid baby aside';
    if (entity.aside !== undefined && !['baby', 'talk'].includes(entity.aside?.kind)) return 'Invalid aside';
    if (entity.comforted !== undefined && (!Number.isInteger(entity.comforted?.day) || !Number.isInteger(entity.comforted?.ticks))) return 'Invalid comforting';
  }
  return null;
}
