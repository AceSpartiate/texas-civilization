/**
 * The end of the game: steps 4 and 5 of docs/MONEY_AND_GLORY.md.
 *
 * When a class ends the fog lifts (VISION.md §20). Each family sees, for the first time, its own
 * coin and its own glory, what earned each, and the two multiplied - `money × (1 + glory)`, the
 * owner's formula of 2026-09-12, with no coin counted as one real (owner, 2026-09-16) - shown as a
 * sum and never as a bare total. The Host sees every
 * family's three numbers in household order and names the family that finished first.
 *
 * **Nothing here exists until the class has ended.** `projectWorld` asks for it only when
 * `world.status` is 'ended' - the slice preserving itself, or the teacher ending the session -
 * and `tests/ending.test.mjs` proves both halves: a planted glory appears on no screen while the
 * class runs, and appears on the family's own screen and the Host's once it has ended.
 *
 * Words are the other half of the rule. The ending names a result, never a virtue: "finished
 * first" is a fact, and good, brave, loyal or patriotic are judgements the constitution still
 * forbids by name (§5, gate *No virtue labels*). The same test searches every string here for them.
 */
import { findPath } from './geography.mjs';
import { automatic } from './neighbours.mjs';
import { householdName } from './family.mjs';
import { dateOf } from './directors.mjs';
import { canContinue, interimStandings, nextPeriodLabel } from './periods.mjs';
import { landPromised } from './winter.mjs';

/**
 * The coin the final number multiplies: what is in the house, and never less than one real.
 *
 * Owner, 2026-09-16: "families with zero coin should be treated as if they have one coin so glory
 * has something to multiply." Before this a family that sent its man to the army and never sold
 * anything finished at nothing whatever its glory, and in a class where nobody sold for coin every
 * family tied at nothing.
 */
export const COIN_FLOOR = 1;
export const countedCoin = money => Math.max(COIN_FLOOR, money);
/** The final number: glory multiplies coin and can never erase it. */
// Glory below nothing counts as nothing: the woman's penalty can take a family's glory away, and the owner's rule that glory
// "multiplies money and cannot erase it" (docs/MONEY_AND_GLORY.md §2) still holds of the coin.
// Land promised for enlisting is added after glory multiplies the coin, never multiplied by it (owner, 2026-09-16,
// docs/COLONIES.md §7e): a family that never fought can still, rarely, finish first by what it sold.
export const finalNumber = (money, glory, land = 0) => countedCoin(money) * (1 + Math.max(0, glory)) + land;

const reales = amount => `${amount} ${amount === 1 ? 'real' : 'reales'}`;
const day = (world, minute) => dateOf(world, minute).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

/** What each event a family can take part in is called in its own story. Unknown events keep their key. */
const EVENT_NAMES = Object.freeze({
  gonzales: 'the stand at Gonzales',
  gathering: 'the army made at Gonzales',
  concepcion: 'the fight at Concepción',
  'storm-order': 'the order to storm Béxar',
  'grass-fight': 'the Grass Fight',
  'bexar-storming': 'the storming of Béxar',
  enlistment: 'the army of Texas, for land',
  desertion: 'the army of Texas, for land,',
  election: 'the election of February 1, 1836',
  alamo: 'the siege of the Alamo',
  'san-patricio': 'the fight at San Patricio',
  'agua-dulce': 'the fight at Agua Dulce Creek',
  coleto: 'the fight at Coleto',
  goliad: 'Goliad, on Palm Sunday',
  'san-jacinto': 'the battle of San Jacinto',
});
const PART_WORDS = Object.freeze({
  supplied: 'carried supplies for',
  present: 'was there for',
  fought: 'fought in',
  willing: 'said they would go in at',
  enlisted: 'enlisted in',
  voted: 'voted in',
});

/** How far a family lived from Gonzales by road, where the news and the army both started. */
function milesFromGonzales(world, household) {
  const miles = findPath(world.map, 'gonzales', household.homeSiteId)?.distance;
  return Number.isFinite(miles) ? Math.round(miles) : null;
}

/** When, and how, the family first heard that the Mexican detachment had come for the cannon. */
function firstWord(world, household) {
  const report = world.knowledge?.households?.[household.id]?.['cannon-request'];
  if (!report) return null;
  return { date: day(world, report.receivedMinute), minute: report.receivedMinute, source: report.source || null };
}

/** Everybody in the family who took part in anything, with each part. */
function partsTaken(world, household) {
  const parts = [];
  for (const [event, people] of Object.entries(world.participation || {})) {
    for (const [personId, part] of Object.entries(people)) {
      if (part.householdId !== household.id) continue;
      parts.push({ event, personId, name: world.entities[personId]?.name || 'Somebody', role: part.role, minute: part.minute ?? 0 });
    }
  }
  return parts.sort((a, b) => a.minute - b.minute);
}

/**
 * One family's reckoning: the numbers, and the story of each.
 *
 * Coin is what is in the house at the end (§3, *What counts as money*): goods, crops and land are
 * not counted. Its story is every sale, payment and trade the family's own record tagged with the
 * coin it moved. Glory's story is the sealed awards, said in words rather than as a ledger.
 */
export function familyEnding(world, householdId) {
  const household = world.households[householdId];
  if (!household) return null;
  const money = household.resources?.money ?? 0;
  const ledger = world.glory?.[householdId];
  const glory = ledger?.total ?? 0;
  const coin = world.events
    .filter(event => event.householdId === householdId && Number.isInteger(event.coin) && event.coin !== 0)
    .map(event => ({ minute: event.minute, date: day(world, event.minute), coin: event.coin, text: event.text }));
  const awards = Object.values(ledger?.awards || {})
    .sort((a, b) => a.minute - b.minute)
    .map(award => {
      const name = world.entities[award.personId]?.name || 'Somebody';
      const what = EVENT_NAMES[award.event] || award.event;
      const far = award.miles >= 1 ? `, ${Math.round(award.miles)} road miles from home` : '';
      return { date: day(world, award.minute), points: award.points, role: award.role, text: `${name} ${PART_WORDS[award.role] || 'took part in'} ${what}${far}.${award.note ? ` ${award.note}` : ''}` };
    });
  const miles = milesFromGonzales(world, household);
  const heard = firstWord(world, household);
  const parts = partsTaken(world, household);
  const land = landPromised(world, household);
  const final = finalNumber(money, glory, land.reales);
  const story = [
    miles === null ? null : `The family lived ${miles} road miles from Gonzales.`,
    heard ? `Word that soldiers had come for the cannon reached them on ${heard.date}.` : 'Word of the cannon never reached them before the end.',
    parts.length ? null : 'Nobody from the family went to Gonzales or to the army. They stayed with the land.',
    household.flight?.status === 'home' ? 'They fled east in the spring, and came home to a burned farm.' : household.flight ? 'They were told to leave in the spring.' : null,
  ].filter(Boolean);
  return {
    householdId,
    name: householdName(world, household),
    money, glory, final, land: land.reales, acres: land.acres,
    counted: countedCoin(money),
    sum: `${money < COIN_FLOOR ? `${reales(money)}, counted as ${reales(COIN_FLOOR)}` : reales(money)} × (1 + ${glory < 0 ? `${glory} glory, counted as 0` : `${glory} glory`})${land.reales ? ` + ${reales(land.reales)} of land (${land.acres} acres promised)` : ''} = ${final}`,
    story, coin, awards,
  };
}

/**
 * Questions for the class, beside the numbers (§5, *What the Host shows*). The numbers are the way
 * into the conversation, not the end of it, so these ask *why* and never *who was right*.
 */
export const DISCUSSION = Object.freeze([
  'Which families heard the news first, and did hearing first change what they did?',
  'How did living far from Gonzales change what a family could do?',
  'What did a family give up at home when somebody went, and what did staying home cost?',
  'Why do the families with the most coin and the families with the most glory not always match?',
]);

/**
 * The Host's closing view: every family, in household order, with its three numbers and the facts
 * the discussion needs; and the family that finished first.
 *
 * Only a family a student played can finish first (owner, 2026-09-14, docs/COLONIES.md §5.9): an
 * automatic neighbour's numbers are counted and shown, and it is never named or ranked. A tie names
 * every family that shares the highest number.
 *
 * ceiling: a class in which nobody earned anything ties every played family at nothing, and names
 * them all. That is the owner's rule applied literally; a class that bare has not really played.
 */
export function hostEnding(world) {
  const families = Object.values(world.households).map(household => {
    const own = familyEnding(world, household.id);
    const parts = partsTaken(world, household);
    return {
      householdId: household.id,
      name: own.name,
      money: own.money, glory: own.glory, land: own.land, final: own.final,
      automatic: automatic(world, household),
      miles: milesFromGonzales(world, household),
      heard: firstWord(world, household)?.date || null,
      went: [...new Set(parts.map(part => part.name))],
    };
  });
  const contenders = families.filter(family => !family.automatic);
  const best = contenders.length ? Math.max(...contenders.map(family => family.final)) : null;
  const winners = best === null ? [] : contenders.filter(family => family.final === best).map(family => family.householdId);
  return { families, winners, best, discussion: DISCUSSION };
}

/**
 * What `projectWorld` adds for this viewer: nothing at all until the class has ended - not even an
 * empty `ending` - and then the family's own reckoning, or the Host's closing view. This is the
 * one gate; a paused class has not ended.
 */
export function endingProjection(world, householdId, role) {
  if (world.status !== 'ended') return {};
  // The first of two class periods ends with interim standings, not a winner (owner, 2026-09-16, docs/COLONIES.md §7e):
  // the same numbers, said as where the families stand with the war still to finish, and the Host offered the winter.
  const interim = interimStandings(world);
  if (role === 'host') return { ending: { host: { ...hostEnding(world), interim, canContinue: canContinue(world), ...(canContinue(world) && { nextLabel: nextPeriodLabel(world) }) } } };
  return householdId && world.households[householdId] ? { ending: { family: { ...familyEnding(world, householdId), interim } } } : {};
}
