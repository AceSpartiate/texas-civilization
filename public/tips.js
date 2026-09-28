// Tips at first meeting (owner, 2026-09-28, by multiple choice on how the systems after the guided start are taught: "Short
// tips at first meeting" - the first time each new thing appears, a one-line tip shows what to do and what it costs; nothing
// blocks play; each tip shown once). docs/LESSON.md §9.
//
// **What a tip is.** One or two short sentences at a middle-school reading level, drawn over the map above the action bar:
// what the thing is, what to do about it, and what it costs. It opens nothing, shuts nothing and answers nothing - every
// control it names is where it always was, and the student may ignore it. It is shown **once per family**: when the student
// puts it away ("Got it", or Escape) or the thing it was about goes away while it stood, the page tells the server
// (`seen-tip`, sim/tips.mjs), and the server keeps the list, so a reload, another Chromebook or a rejoin never shows it again.
//
// **When a thing has "appeared"** is read here, from the family's own projection - the same fields the screen draws that
// thing from - so a tip can only be about something the student can see. It is never the Host's: the Host has no family and
// is never sent one, and the projector shows none.
//
// It imports only other modules that import nothing, so every rule it holds is tested headlessly (tests/tips.test.mjs).
import { needsOf, requestFor } from './family-panel.js';
import { militaryNotices } from './military-attention.js';

/**
 * Every tip, by id. `TIP_IDS` in sim/tips.mjs names exactly these (tests/tips.test.mjs). Each says what to do and what it
 * costs, in words a twelve-year-old reads without help; where a cost was only in a hover popup before (design audit S6,
 * "touch has no hover") - resting a day on the road, the main person's star, the "!" - it is said here.
 */
export const TIPS = Object.freeze({
  alto: 'Soldiers shout “¡Alto!”, which means “Halt!”. Answer fast on your ★ person’s card: halting loses the wagon and goods, and running risks their shots. No answer means you halt.',
  road: 'The road is asking your family something. Answer on your ★ person’s card - each answer says what it costs. No answer in time, and nothing is done.',
  flight: 'Your family is told to leave. On your ★ person’s card, choose what to load and press “Leave for the east”, or choose to stay. No answer in a day, and the family packs and goes.',
  route: 'On the road east: by the road is quicker, but soldiers see you from farther off. Across country is slower and harder to see. “Change where we go” changes it.',
  sick: 'Someone is sick, and resting helps them mend. Have another grown-up choose “Nurse the sick”: nobody dies while being nursed. A very sick person can die within a day.',
  rest: '“Stop and rest a day”: the sick mend twice as fast, but the family makes no miles and the Mexican army keeps coming.',
  call: 'Your settlement is calling for men: press the “!” and tick who goes. Each one leaves the farm with powder and the rifle. No answer in about 5 minutes, and the call closes.',
  army: 'The army is asking one of your family something: press the “!” to go to them and choose. No answer in about a minute and a half, and nothing is chosen for them.',
  watch: 'A fight is starting where one of your family is. Press “Watch” to see it. Watching changes nothing, and you can close it any time.',
  resume: 'You stopped the guide. For 5 minutes, “Resume tutorial” (top right) brings it back on the same step.',
  cow: 'A child can drive the milk cow along. She gives a little food each day, but a family on foot goes only as fast as she walks.',
  milk: 'The milk cow gives a little food each night. A careless child may let her stray and lose that day’s milk, and soldiers take her if they catch you.',
  baby: 'A baby is crying, and someone stops work to pick it up. A child of seven or more can “Mind the younger ones” so the grown-ups keep working.',
  child: 'A child with nothing to do has come to talk, and the grown-up has stopped work. Tap the child’s picture and give them a job or a game.',
  enlist: 'A grown man can enlist, join a fight or go vote from his actions. He is gone from the farm until you “Send for” him, and a soldier takes the family’s rifle.',
  trade: 'Someone from another family is here. Tap their person to offer a trade from one of yours. They choose yes or no.',
  store: 'Choose what to buy and sell before they go. Tap a line to read what it does. Coin in the house at the end counts toward your score, so spend it with care.',
  star: 'The ★ is your main person: the family’s big choices, like leaving, come to them. Tap ☆ on another row to change who. A “!” means someone needs an answer.',
});

/**
 * Which tip goes first when several are due at once: the ones whose thing will not wait (¡Alto!, the road, the order to leave,
 * sickness, the call, the army) before the ones that will. The same order as the "!"s (public/family-panel.js `NEED_KINDS`).
 */
export const TIP_ORDER = Object.freeze(['alto', 'road', 'flight', 'sick', 'call', 'army', 'watch', 'resume', 'rest', 'route', 'cow', 'milk', 'baby', 'child', 'enlist', 'trade', 'store', 'star']);

/** The winter's joining, enlisting and voting (sim/winter.mjs `WINTER_CHORES`), as the page sees them on a work list. */
const WINTER_WORK = new Set(['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'go-vote', 'join-relief', 'join-houston']);
const GONE = ['dead', 'captured'];

/**
 * Which tips' things are on this student's screen now, most urgent first. `errandOpen` is the one thing the projection
 * cannot say - the town errand's list is open on this page (public/errand.js) - and is handed in.
 */
export function tipsPresent(world, { errandOpen = false } = {}) {
  if (!world || world.role === 'host' || !world.householdId || !world.household) return [];
  const members = new Set(world.household.members || []);
  const own = (world.entities || []).filter(entity => entity.kind === 'person' && members.has(entity.id) && !GONE.includes(entity.health?.condition));
  const offered = id => Object.values(world.work || {}).some(list => (list || []).some(entry => entry.id === id));
  const flight = world.flight;
  const onRoad = ['fled', 'refuged'].includes(flight?.status);
  const here = new Set(own.filter(one => !one.travel && one.location?.siteId).map(one => one.location.siteId));
  const present = {
    alto: flight?.ask?.id === 'alto',
    road: Boolean(flight?.ask) && flight.ask.id !== 'alto',
    flight: flight?.status === 'ordered',
    route: flight?.status === 'fled',
    sick: own.some(one => one.sickness),
    rest: offered('rest-road'),
    call: world.request?.status === 'open' && world.request.kind === 'call' && own.some(one => requestFor(world, one)?.options?.length),
    army: own.some(one => needsOf(world, one.id).some(need => ['army', 'camp', 'courier'].includes(need.kind))),
    watch: militaryNotices(world).some(notice => notice.kind === 'battle'),
    resume: Number(world.lessonResume?.ms) > 0,
    cow: offered('flee-cow'),
    milk: Boolean(flight?.cow) && onRoad,
    baby: own.some(one => one.baby?.state === 'cry'),
    child: own.some(one => one.talk || one.aside?.kind === 'talk'),
    enlist: own.some(one => one.service?.status === 'serving') || Object.values(world.work || {}).some(list => (list || []).some(entry => WINTER_WORK.has(entry.id))),
    trade: (world.offers || []).some(offer => offer.direction === 'received')
      || (world.others || []).some(other => other.kind === 'person' && other.householdId && other.householdId !== world.householdId && !other.resident && !other.carrier && !other.travel && here.has(other.location?.siteId)),
    store: Boolean(errandOpen),
    // The star is everywhere from the start, so it is met when the farm is the student's: the guided start over or stopped.
    star: world.status === 'running' && !(world.lesson && !world.lesson.done) && !world.land?.arriving && own.length > 1,
  };
  return TIP_ORDER.filter(id => present[id]);
}

/**
 * The tip to stand on the screen now, and the one to tell the server is seen, from what is present and what the student has
 * already seen (`seen`: the server's `household.tipsSeen` and whatever this page has put away since) and the tip standing now.
 *
 * - The tip standing stays while its thing is still there, even if something more urgent has come: one tip is replaced only
 *   by being put away, so a student reading it does not have it pulled from under them.
 * - A tip whose thing has gone while it stood is **retired**: the student had it in front of them, and the thing it was about
 *   is not coming back as a first meeting. Returned as `retire`, for the page to send `seen-tip`.
 * - Otherwise the most urgent present tip not yet seen, or none.
 */
export function tipToShow(world, { seen = [], showing = null, errandOpen = false } = {}) {
  const done = new Set(seen);
  const present = tipsPresent(world, { errandOpen });
  if (showing && !done.has(showing)) {
    if (present.includes(showing)) return { show: showing, retire: null };
    done.add(showing);
    return { show: present.find(id => !done.has(id)) || null, retire: showing };
  }
  return { show: present.find(id => !done.has(id)) || null, retire: null };
}
