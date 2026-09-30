/**
 * The end of the game: steps 4 and 5 of docs/MONEY_AND_GLORY.md.
 *
 * When a class ends the fog lifts (VISION.md §20). Each family sees, for the first time, its own
 * coin and its own glory, what earned each, and the two multiplied - `money × (1 + glory)`, the
 * owner's formula of 2026-09-12, with no coin counted as one real (owner, 2026-09-16) and the part
 * of it that went with each person taken prisoner in the Runaway Scrape taken out (owner, 2026-09-27,
 * `PRISONER_WEIGHT`) - shown as a sum and never as a bare total. The Host sees every
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
import { GLORY_MILES_STEP, GLORY_WEIGHT, distanceMultiplier } from './glory.mjs';
import { automatic } from './neighbours.mjs';
import { householdName } from './family.mjs';
import { dateOf } from './directors.mjs';
import { canContinue, interimStandings, nextPeriodLabel } from './periods.mjs';
import { landPromised } from './winter.mjs';
import { surpriseReveal } from './surprise.mjs';
// The spring said as it was, the war's prisoners named, and a debrief from the class's own story (sim/ending-story.mjs).
import { classHooks, familyQuestions, flightLine, nobodyWentLine, springWords, warPrisoners } from './ending-story.mjs';
// What families did for each other (sim/neighbourly.mjs, owner 2026-09-28: "helping is recorded in the ending").
import { helpWhat, helpedLines, neighbourLines } from './neighbourly.mjs';
// What came after for a Tejano or a free Black family's people (sim/start-story.mjs, owner 2026-09-29): the story's last line.
import { afterWords } from './start-story.mjs';

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
// People taken prisoner in the Runaway Scrape take their part of the coin with them (owner, 2026-09-27, below): `kept` is the
// share of the coin still counted, 1 when nobody was taken.
// The coin counted is rounded to a whole real **before** glory multiplies it (triage 2026-09-29 2.10, design audit S26): a family
// shown "counted as 8.33 reales" could not follow its own sum, and a sum shown in whole reales has to be the sum worked, so the
// final number is that sum. Until then the product was rounded, which moved a family with prisoners by less than half its glory.
// Nothing changes for a family nobody took: its coin is already whole.
export const coinCounted = (money, kept = 1) => Math.max(0, Math.round(countedCoin(money) * kept));
export const finalNumber = (money, glory, land = 0, kept = 1) => coinCounted(money, kept) * (1 + Math.max(0, glory)) + land;

/**
 * People taken prisoner in the Runaway Scrape, weighed against the family (owner, 2026-09-27, by multiple choice over
 * docs/BALANCE.md §6: *"Weigh the prisoners"*). Measured over 210 classes before this, a family inside the burn zone that stayed
 * finished above one that fled (win index 1.06 against 0.83): the road spends coin, the zone burns a farm whether the family
 * stays or goes, and the people the Mexican army took at home counted for nothing at the end. Now each person taken prisoner at
 * home or on the road east takes `PRISONER_WEIGHT` times their part of the family's coin out of the count - their part being
 * one share among the family's living people - so staying is the gamble it was and not the safe choice. The weight was chosen by
 * measurement (docs/BALANCE.md §9): the smallest that leaves a family that stayed in the burn zone below one that fled, on
 * average, in both how often it finishes first and where it finishes.
 *
 * Only the Scrape's prisoners, not the army's: a man taken at San Patricio, Agua Dulce or Goliad is a casualty of the war, and
 * glory neither rewards nor punishes a casualty (`VISION.md` §20, *A casualty never earns extra*). They are told apart by
 * `service.status`, which the war sets to 'captured' for its own (sim/alamo.mjs, sim/houston.mjs) and the Scrape never sets.
 * The words say who was taken and where, and nothing about what it says of anybody. Invented, `FIC-GONZ-710`.
 */
// One and a half since 2026-09-28 (owner, by multiple choice: "Weigh prisoners more"; docs/BALANCE.md §10 and §11): with crops in
// real minutes and a store that fills, coin is scarce, and at one a family that stayed in the burn zone finished above one that
// fled again. One until then.
export const PRISONER_WEIGHT = 1.5;
/** The rule in the words both screens show it in. */
export const PRISONER_RULE = `Each person taken prisoner at home or on the road east in the spring takes ${PRISONER_WEIGHT === 1 ? 'their part' : `${PRISONER_WEIGHT} times their part`} of the family's coin out of the count, a part being one share among the family's living people.`;
/**
 * The formula, written one way (triage 2026-09-29 3.7, design audit M21): VISION.md §20, docs/MONEY_AND_GLORY.md §5 and §7.1
 * and the Host's footer all carry this line, and tests/ending.test.mjs holds the two documents to it - so a change to
 * `PRISONER_WEIGHT` or to `finalNumber` that is not written into them fails there.
 */
export const FORMULA = `final = round(max(coin, 1) × max(0, 1 − ${PRISONER_WEIGHT} × prisoners ÷ living people)) × (1 + max(glory, 0)) + land`;
/** The same formula in the Host's words, under the table. */
export const FORMULA_WORDS = [
  `Final number = coin counted × (1 + glory) + land.`,
  `Coin counted: the coin in the house, a family with none counted as having 1 real, less ${PRISONER_WEIGHT} parts for each person taken prisoner in the spring out of one part for each of the family's living people, rounded to a whole real.`,
  'Glory below nothing counts as nothing.',
  'Land promised for enlisting counts a real for every 20 acres, if the person is alive and served it out or is serving still; being sent for home forfeits it.',
].join(' ');
const GONE_FOR_GOOD = 'dead';
/** The family's people taken prisoner in the Scrape: at home (where they were taken) or on the road east (moved to the column). */
export function scrapePrisoners(world, household) {
  return household.members.map(id => world.entities[id])
    .filter(person => person?.health?.condition === 'captured' && person.service?.status !== 'captured')
    .map(person => ({ personId: person.id, name: person.name, where: person.location?.siteId === household.homeSiteId ? 'home' : 'road' }));
}
/** The share of the coin still counted with `taken` of `living` people prisoners: never below nothing. */
export const keptFor = (taken, living, weight = PRISONER_WEIGHT) => taken ? Math.max(0, 1 - (weight * taken) / Math.max(1, living)) : 1;
/** The family's living people - the prisoners among them - whom a prisoner's part is one share of. */
const livingOf = (world, household) => household.members.filter(id => world.entities[id] && world.entities[id].health?.condition !== GONE_FOR_GOOD).length;
/** The share of the family's coin still counted: its living people less the prisoners' parts, weighed. */
export const keptShare = (world, household) => keptFor(scrapePrisoners(world, household).length, livingOf(world, household));
/**
 * **Nobody left** of the family: every one of it dead or a prisoner (triage 2026-09-29, found while checking 1.4). The same words
 * the rest of the game uses: the order to leave tells nobody when nobody is left (sim/scrape.mjs `GONE`), and a late student is
 * not given such a family (server/app.mjs `livingIn`). Until this the ending alone meant *dead*, so a family whose people were
 * all prisoners could be named the winner - on its land alone, since its prisoners' weight counts no coin. Prisoners are never
 * set free in this game, so a family of prisoners is not one anybody is left to finish.
 *
 * Only who can finish first. A prisoner is still one of the family's living people for the share a prisoner's part is of
 * (`livingOf`, `keptShare`), and the prisoners' weight is unchanged.
 */
export const nobodyLeft = (world, household) => !household.members.some(id => {
  const person = world.entities[id];
  return person && !['dead', 'captured'].includes(person.health?.condition);
});

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
  'houston-camp': 'the camp of Houston\'s army',
  'which-road': 'the fork of the road at Roberts\'',
});
const PART_WORDS = Object.freeze({
  supplied: 'carried supplies for',
  present: 'was there for',
  fought: 'fought in',
  willing: 'said they would go in at',
  enlisted: 'enlisted in',
  voted: 'voted in',
  served: 'did the camp\'s work at',
  forward: 'called for the enemy\'s road at',
  // Help to another family (owner, 2026-09-28, "Any help"; sim/deeds.mjs `HELP_ROLE`): what follows is said by `helpWhat`.
  helped: 'helped',
  sheltered: 'took in the children of',
});
/**
 * Each part as the worth line names it (triage 2026-09-29 2.10): "Fighting counts 3 × 2 (23 road miles from home) = 6 glory."
 * Unknown parts are "Taking part".
 */
const PART_NAMES = Object.freeze({
  supplied: 'Carrying supplies',
  present: 'Being there',
  fought: 'Fighting',
  willing: 'Saying they would go in',
  enlisted: 'Enlisting',
  voted: 'Voting',
  served: 'The camp\'s work',
  forward: 'Calling for the enemy\'s road',
  helped: 'Helping another family',
  sheltered: 'Taking in children',
});
/**
 * One award as a sum a student can follow: the part's weight times the miles' multiplier, and what it came to. An award taken
 * away (a woman sent to fight who did not come through, a man who ran, a family overtaken on the road, a deserter) says so, and
 * its note says why. `times` is the multiplier the award was given with (sim/glory.mjs); an award saved before it is read from
 * the miles.
 */
export function worthLine(award) {
  const weight = GLORY_WEIGHT[award.role];
  if (!weight) return `Counted as ${award.points} glory.`;
  const times = award.times ?? distanceMultiplier(award.miles);
  const earned = weight * times;
  const where = award.miles >= 1 ? `${Math.round(award.miles)} road miles from home` : 'close to home';
  const sum = `${PART_NAMES[award.role] || 'Taking part'} counts ${weight} × ${times} (${where}) = ${earned}`;
  if (award.points === earned) return `${sum} glory.`;
  if (award.points === -2 * earned) return `${sum}, taken away twice over: ${award.points} glory.`;
  if (award.points === -earned) return `${sum}, taken away: ${award.points} glory.`;
  return `${sum}, counted as ${award.points} glory.`;
}
/** How a part is weighed, in one sentence built from the weights themselves, said once above the awards. */
export function gloryRule() {
  const by = new Map();
  for (const [role, weight] of Object.entries(GLORY_WEIGHT)) by.set(weight, [...(by.get(weight) || []), PART_NAMES[role].toLowerCase()]);
  const list = words => words.length > 1 ? `${words.slice(0, -1).join(', ')} or ${words.at(-1)}` : words[0];
  const parts = [...by.entries()].sort((a, b) => b[0] - a[0]).map(([weight, words]) => `${list(words)} ${weight}`).join('; ');
  return `Each part a person took counts: ${parts}. Every ${GLORY_MILES_STEP} road miles the family lived from where it happened counts it once more.`;
}
/** The parts that are help to another family (sim/deeds.mjs `HELP_ROLE`), kept out of who went to the war. */
const HELP_PARTS = Object.freeze(['helped', 'sheltered']);

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

/**
 * Everybody in the family who took part in anything, with each part: the 1835 participation record (Gonzales, the march,
 * Concepción, the Grass Fight, the storming) and every sealed glory award after it (enlisting, the vote, the Alamo, Coleto,
 * San Jacinto), which is where the winter and the spring keep who went. Found by the whole-game browser run (2026-09-16):
 * a man who enlisted and fought at San Jacinto was shown as "nobody" having gone, and his story said the family stayed home.
 */
function partsTaken(world, household) {
  const parts = new Map();
  for (const [event, people] of Object.entries(world.participation || {})) {
    for (const [personId, part] of Object.entries(people)) {
      if (part.householdId !== household.id) continue;
      parts.set(`${event}:${personId}`, { event, personId, name: world.entities[personId]?.name || 'Somebody', role: part.role, minute: part.minute ?? 0 });
    }
  }
  for (const [key, award] of Object.entries(world.glory?.[household.id]?.awards || {})) {
    // Help to another family is not going to Gonzales or to the army: it is said in the family's Neighbours, not as who went.
    if (parts.has(key) || !award.personId || HELP_PARTS.includes(award.role)) continue;
    parts.set(key, { event: award.event, personId: award.personId, name: world.entities[award.personId]?.name || 'Somebody', role: award.role, minute: award.minute ?? 0 });
  }
  return [...parts.values()].sort((a, b) => a.minute - b.minute);
}

/**
 * The final number said a step at a time, in whole numbers a student can check (triage 2026-09-29 2.10): the coin, what the
 * prisoners took from it, glory multiplying it, and the land added.
 */
function sumSentences({ money, glory, final, counted, living, taken, lostParts, land }) {
  const said = [money < COIN_FLOOR ? `The family had no coin, so it is counted as having ${reales(COIN_FLOOR)}.` : `The family had ${reales(money)}.`];
  if (taken) said.push(`${taken === 1 ? 'The one person' : `The ${taken} people`} taken prisoner take${taken === 1 ? 's' : ''} ${lostParts} of the family's ${living} parts, so ${reales(counted)} ${counted === 1 ? 'is' : 'are'} counted.`);
  const product = counted * (1 + Math.max(0, glory));
  said.push(glory > 0
    ? `${glory} glory multiplies it by ${1 + glory} (1 + ${glory}): ${counted} × ${1 + glory} = ${product}.`
    : `${glory < 0 ? 'Glory below nothing counts as nothing' : 'With no glory'}, the coin counts once: ${product}.`);
  if (land.reales) said.push(`The land promised, ${land.acres} acres, adds ${reales(land.reales)}: ${product} + ${land.reales} = ${final}.`);
  return said.join(' ');
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
  // The coin the family's means started it with (sim/means.mjs, owner 2026-09-25: three to ten reales) is the first line of the
  // account, so every real that came into the house is in it. Only the account: how the final number counts it is the owner's
  // open question (docs/MONEY_AND_GLORY.md, the amendment of 2026-09-25), and it is counted as all coin in the house always was.
  const start = household.means?.coin ? [{ minute: 0, date: day(world, 0), coin: household.means.coin, text: `The family came with ${household.means.coin} reales.` }] : [];
  const coin = [...start, ...world.events
    .filter(event => event.householdId === householdId && Number.isInteger(event.coin) && event.coin !== 0)
    .map(event => ({ minute: event.minute, date: day(world, event.minute), coin: event.coin, text: event.text }))];
  const awards = Object.values(ledger?.awards || {})
    .sort((a, b) => a.minute - b.minute)
    .map(award => {
      const name = world.entities[award.personId]?.name || 'Somebody';
      const what = helpWhat(world, award.event) || EVENT_NAMES[award.event] || award.event;
      const far = award.miles >= 1 ? `, ${Math.round(award.miles)} road miles from home` : '';
      return { date: day(world, award.minute), points: award.points, role: award.role, text: `${name} ${PART_WORDS[award.role] || 'took part in'} ${what}${far}.${award.note ? ` ${award.note}` : ''}`, worth: worthLine(award) };
    });
  const miles = milesFromGonzales(world, household);
  const heard = firstWord(world, household);
  const parts = partsTaken(world, household);
  const land = landPromised(world, household);
  const taken = scrapePrisoners(world, household);
  const kept = keptShare(world, household);
  const final = finalNumber(money, glory, land.reales, kept);
  const prisoners = taken.map(one => ({ ...one, text: `${one.name} was taken prisoner ${one.where === 'home' ? 'at home' : 'on the road east'}.` }));
  const story = [
    miles === null ? null : `The family lived ${miles} road miles from Gonzales.`,
    heard ? `Word that soldiers had come for the cannon reached them on ${heard.date}.` : 'Word of the cannon never reached them before the end.',
    parts.length ? null : nobodyWentLine(household),
    flightLine(world, household),
    ...prisoners.map(one => one.text),
    ...warPrisoners(world, household).map(one => one.text),
    afterWords(world, household),
  ].filter(Boolean);
  // The coin as it is counted: the floor of one real, then the prisoners' parts taken out of it, each step said.
  const floored = money < COIN_FLOOR ? `${reales(money)}, counted as ${reales(COIN_FLOOR)}` : reales(money);
  const living = livingOf(world, household);
  // A whole real (triage 2026-09-29 2.10): the coin counted is the coin the sum multiplies (`coinCounted`).
  const counted = coinCounted(money, kept);
  const lostParts = Math.round(PRISONER_WEIGHT * taken.length * 100) / 100;
  const coinWords = taken.length
    ? `${floored}, less ${lostParts} of ${living} parts for the ${taken.length === 1 ? 'one' : taken.length} taken prisoner, counted as ${reales(counted)}`
    : floored;
  return {
    householdId,
    name: householdName(world, household),
    money, glory, final, land: land.reales, acres: land.acres,
    counted, kept, prisoners, ...(prisoners.length && { prisonerRule: PRISONER_RULE }),
    sum: `${coinWords} × (1 + ${glory < 0 ? `${glory} glory, counted as 0` : `${glory} glory`})${land.reales ? ` + ${reales(land.reales)} of land (${land.acres} acres promised)` : ''} = ${final}`,
    // The sum said in sentences, one step each, for a student to follow (triage 2026-09-29 2.10).
    sumSaid: sumSentences({ money, glory, final, counted, living, taken: taken.length, lostParts, land }),
    gloryRule: gloryRule(),
    story, coin, awards,
    // Questions for the family about its own story (S24), shown under it.
    questions: familyQuestions(world, household),
    // What the family did for its neighbours and they for it, in plain words and in the order it happened. Counted in no number:
    // whether helping earns glory is the owner's open question (docs/MONEY_AND_GLORY.md, the support tier).
    neighbours: neighbourLines(world, householdId).map(line => ({ date: day(world, line.minute), kind: line.kind, text: line.text })),
    // The fog lifted on the other side too (owner, 2026-09-26, docs/battle-research/surprise-at-bexar.md): the snow march and
    // why Béxar was caught unprepared, once the class has lived February 23. Absent before, and for a class that never reached it.
    ...(surpriseReveal(world) && { reveal: surpriseReveal(world) }),
  };
}

/**
 * Questions for the class, beside the numbers (§5, *What the Host shows*). The numbers are the way
 * into the conversation, not the end of it, so these ask *why* and never *who was right*.
 *
 * The whole war's, not October's (triage 2026-09-29 2.8, design audit S24): the question about living far from Gonzales is now
 * the spring's choice to flee or stay, and the one about why coin and glory do not match - a question about the scoring, not
 * the history - is gone. They follow the class's own named hooks (sim/ending-story.mjs `classHooks`).
 */
export const DISCUSSION = Object.freeze([
  'Which families heard the news first, and did hearing first change what they did?',
  'Why did some families flee east in the spring and others stay, and what did each choice cost them?',
  'What did a family give up at home when somebody went, and what did staying home cost?',
]);

/** Sickness, never named as a young person's death on the projector: the age below which it is left out of "Who went". */
// The disease rule (docs/DISEASE.md §4 and §9.1 step 7, owner 2026-09-27) names a child; the triage (2026-09-29 2.11) asked for
// anybody under 18 here, wider than the class panel's sixteen (sim/disease.mjs `diedAChild`): the design audit (M23) found it for
// the ten- to seventeen-year-olds a family can send (`SENT_FROM_AGE`, sim/family.mjs), and "Who went" is the war's list.
export const UNNAMED_UNDER = 18;
const unnamedOnProjector = person => person?.health?.condition === 'dead' && Boolean(person.health.disease) && (Number.isFinite(person.age) ? person.age : 30) < UNNAMED_UNDER;

/**
 * The Host's closing view: every family, in household order, with its three numbers and the facts
 * the discussion needs; and the family that finished first.
 *
 * Only a family a student played can finish first (owner, 2026-09-14, docs/COLONIES.md §5.9): an
 * automatic neighbour's numbers are counted and shown, and it is never named or ranked. A tie names
 * every family that shares the highest number.
 *
 * **A family a student played is still theirs when the student is away at the end** (owner, 2026-09-29, by multiple choice:
 * *"Any played family"*; triage 1.4, playthrough audit #6, design audit S23). A Chromebook asleep in the last minutes or a
 * student off sick on the last day hands the family to the director (sim/absence.mjs), and until this it could no longer win
 * and the projector said nobody had played it. Now every family a student played that has somebody left (`nobodyLeft`) can
 * finish first, and one the director was running at the end is marked so (`finishedByDirector`), never "nobody played them".
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
      money: own.money, glory: own.glory, land: own.land, final: own.final, prisoners: own.prisoners.length,
      automatic: automatic(world, household),
      // A family a student played that the director was running at the end: its student was away (sim/absence.mjs).
      ...(automatic(world, household) && household.played && { finishedByDirector: true }),
      // Nobody of the family left, dead or a prisoner (playthrough audit 7, 2026-09-28; `nobodyLeft`): counted and shown, never
      // named the winner.
      ...(nobodyLeft(world, household) && { wiped: true }),
      miles: milesFromGonzales(world, household),
      heard: firstWord(world, household)?.date || null,
      // The spring beside October (triage 2026-09-29 2.8): when the family heard the Alamo had fallen, fled or stayed and where
      // it was at the end, and whether the farm burned. `null` where the class never got that far.
      heardAlamo: heardAlamo(world, household),
      spring: springWords(world, household)?.spring ?? null,
      farm: springWords(world, household)?.farm ?? null,
      went: whoWent(world, parts),
    };
  });
  // A family with nobody living cannot finish first (2026-09-28): a lone father killed at the Alamo was named the class's winner
  // by the Alamo's glory on his coin, and "the family where everybody died wins" is the lesson the ending would teach.
  // Ranked on played and not wiped (owner, 2026-09-29): a family nobody played never, a played one whose student is away still.
  const contenders = families.filter(family => (!family.automatic || family.finishedByDirector) && !family.wiped);
  const best = contenders.length ? Math.max(...contenders.map(family => family.final)) : null;
  const winners = best === null ? [] : contenders.filter(family => family.final === best).map(family => family.householdId);
  const reveal = surpriseReveal(world);
  // Who helped whom across the class, one line a pair, in plain words (sim/neighbourly.mjs `helpedLines`).
  const helped = helpedLines(world).map(line => line.text);
  // The class's own hooks first (S24, sim/ending-story.mjs), then the standing questions.
  return { families, winners, best, discussion: [...classHooks(world), ...DISCUSSION], prisonerRule: PRISONER_RULE, formula: FORMULA, formulaWords: FORMULA_WORDS, helped, ...(reveal && { reveal }) };
}

/**
 * The names under "Who went" on the projector: everybody with a part, but never somebody under `UNNAMED_UNDER` who died of a
 * sickness (triage 2026-09-29 2.11, docs/DISEASE.md §4) - counted instead, as the class panel counts them ("a child of the family").
 */
function whoWent(world, parts) {
  const ids = [...new Set(parts.map(part => part.personId))];
  const named = ids.filter(id => !unnamedOnProjector(world.entities[id]));
  const unnamed = ids.length - named.length;
  const names = [...new Set(named.map(id => parts.find(part => part.personId === id).name))];
  return unnamed ? [...names, unnamed === 1 ? 'a child of the family' : `${unnamed} children of the family`] : names;
}

/** The day the family heard the Alamo had fallen; 'never' once it had fallen and word never came; null before it fell. */
function heardAlamo(world, household) {
  const report = world.knowledge?.households?.[household.id]?.['alamo-fall'];
  if (report) return day(world, report.receivedMinute);
  return world.truth?.['alamo-fall'] ? 'never' : null;
}

/**
 * What `projectWorld` adds for this viewer: nothing at all until the class has ended - not even an
 * empty `ending` - and then the family's own reckoning, or the Host's closing view. This is the
 * one gate; a paused class has not ended.
 */
export function endingProjection(world, householdId, role) {
  if (world.status !== 'ended') return {};
  // The first and second class periods end with interim standings, not a winner (owner, 2026-09-16, docs/COLONIES.md §7e):
  // where the families stand with the war still to finish, and the Host offered the next period. **Without glory**: VISION §20,
  // "Glory is hidden from every student and from the Host until the ending", and the interim is not the ending (design audit
  // 2026-09-28 B4). The owner chose, the same day, **coin and land only** (`interimFamily`, `interimHost`): nothing that is glory
  // or shows it - the glory, the final number it multiplies, the sum, what earned it, who leads by it - goes on the wire until
  // the last period ends.
  const interim = interimStandings(world);
  if (role === 'host') {
    const host = hostEnding(world);
    return { ending: { host: { ...(interim ? interimHost(host) : host), interim, canContinue: canContinue(world), ...(canContinue(world) && { nextLabel: nextPeriodLabel(world) }) } } };
  }
  if (!householdId || !world.households[householdId]) return {};
  const family = familyEnding(world, householdId);
  return { ending: { family: { ...(interim ? interimFamily(family) : family), interim } } };
}

/**
 * The standings between periods: **coin and land only** (owner, 2026-09-28, by multiple choice). The coin a family holds and the
 * land it has been promised, and nothing else - no glory and nothing that shows it or lets it be worked out (the final number,
 * the sum, what earned it, who leads, the question about it), and none of the ending's story, which is the end's to tell.
 */
export const interimFamily = family => ({ householdId: family.householdId, name: family.name, money: family.money, land: family.land, acres: family.acres });
/** The Host's standings so far: every family's coin and land in household order, a family nobody played marked, nobody named. */
export function interimHost(host) {
  return { families: host.families.map(one => ({ householdId: one.householdId, name: one.name, money: one.money, land: one.land, automatic: one.automatic, ...(one.finishedByDirector && { finishedByDirector: true }) })) };
}
