// Birthdays: ages advance with the class's calendar (owner, 2026-09-29, by multiple choice on the triage's D11: "Advance with
// calendar"; docs/audits/2026-09-29-triage.md D11, the design audit's M8; `FIC-GONZ-965`).
//
// Until this, a person's `age` was the age they were rolled at and never moved: a boy who turned sixteen before San Jacinto could
// never go, and a baby was a baby all game. Only eating read the calendar (sim/family.mjs `ageNow`). Now everybody of a family is
// one year older on their birthday, and everything that reads `age` follows at once - who may be sent anywhere at ten
// (`tooYoung`), who may answer a call or go to the fighting at sixteen (`canAnswerCalls`, `canFight`), the oldest child of seven
// stepping up (sim/acting.mjs `STEPS_UP_FROM`), a baby put down to walk at two (sim/babies.mjs `isBaby`), the children's works by
// age (sim/children.mjs), what they eat, how they are drawn (`ageBand`), and the age on their row of the family panel.
//
// **How, and why this way.** The birth date is the truth: `born`, stored on everybody rolled since 2026-09-22, and for anybody
// older, the one sim/family.mjs `bornOf` has always derived - the age they had on the class's first day and a birthday hashed from
// the class's seed and their id, the same every time the class is opened. Each tick counts the birthdays that fell between the
// minute the ages were last brought up to (`world.agesMinute`) and now - a day's tick, or the weeks skipped between two periods -
// and adds them to the stored `age`, writing the derived `born` down first so it is never derived again from an age that has moved.
// Everything that already reads `age` therefore reads the age today, and about 140 places that read it, many with no world to ask
// the calendar, did not have to be taught a second way of asking. Counting the birthdays that pass, rather than setting the age to
// the calendar's, moves only what a birthday moves: an age set some other way is carried on from, never overwritten.
//
// **Old saves.** No save version. A class saved before this has no `agesMinute`; the first tick after it is opened sets it to
// that minute and counts from there, so nobody's age jumps on opening; its birth dates are the ones `bornOf` derives, stable. A
// class saved after this carries `agesMinute` and `born` on everybody whose age has moved.
import { record } from './events.mjs';
import { FIGHTS_FROM_AGE, SENT_FROM_AGE, ageOnDay, bornOf, sexOf } from './family.mjs';
import { dateOf } from './clock.mjs';

const GONE = Object.freeze(['dead', 'captured']);
/** The ages a birthday changes something the family can see, and what it is said as. */
const WORDS = Object.freeze({
  [SENT_FROM_AGE]: person => `${person.name} is ten today, and old enough now to be sent on errands and set to any work of the place.`,
  [FIGHTS_FROM_AGE]: person => (sexOf(person) === 'female'
    ? `${person.name} is sixteen today, and old enough now to answer for the family.`
    : `${person.name} is sixteen today, and old enough now to answer for the family and to go to the fighting if he is sent.`),
});
const first = person => String(person.name || '').split(' ')[0] || person.name;

/** Everybody of a family whose birthday has come since the last tick: their age moved on, and said in the family's record. */
export function advanceAges(world) {
  const from = world.agesMinute, to = world.minute;
  world.agesMinute = to;
  if (!Number.isFinite(from) || !(to > from)) return;
  const then = dateOf(world, from), now = dateOf(world, to);
  for (const person of Object.values(world.entities || {})) {
    if (person?.kind !== 'person' || !person.householdId || !Number.isFinite(person.age)) continue;
    if (GONE.includes(person.health?.condition)) continue;
    const born = bornOf(world, person);
    if (!born) continue;
    const passed = ageOnDay(born, now) - ageOnDay(born, then);
    if (!(passed > 0)) continue;
    if (typeof person.born !== 'string') person.born = born;
    const was = person.age, age = was + passed;
    person.age = age;
    // Out of babyhood: nobody's baby to mind any more, and on their own two feet once set down.
    if (was < 2 && age >= 2 && !person.carriedBy) delete person.baby;
    // Ten: a child's own automation is for children under ten (sim/childhood.mjs); what they are set to from now is anybody's.
    if (was < SENT_FROM_AGE && age >= SENT_FROM_AGE) { delete person.childAuto; delete person.autoNotice; if (person.auto && !person.order) delete person.auto; }
    const crossed = [SENT_FROM_AGE, FIGHTS_FROM_AGE].find(line => was < line && age >= line);
    // A child's birthday is the family's news; a grown person's passes quietly, so the journal is not a list of them.
    if (!crossed && age >= FIGHTS_FROM_AGE) continue;
    const text = crossed ? WORDS[crossed](person) : `It is ${first(person)}'s birthday: ${age === 1 ? 'one year old' : `${age} years old`} today.`;
    record(world, 'condition', { actorId: person.id, householdId: person.householdId, importance: crossed ? 2 : 1, classification: 'FICTIONAL FOR GAMEPLAY', claimId: 'FIC-GONZ-965', text, birthday: age });
  }
}

/** A saved minute the ages were brought up to that cannot be, or null. Absent on every class saved before 2026-09-29. */
export const agesInvalid = world => (world.agesMinute === undefined || Number.isFinite(world.agesMinute) ? null : 'Invalid ages minute');
