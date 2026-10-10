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
  // Since 2026-10-09 (owner: "Tips are the only guidance; fix their timing and wording") every tip is one or two short sentences, and
  // every button it names is named exactly as the screen shows it (tests/tips.test.mjs holds each quoted name to a real control).
  alto: 'Soldiers shout “¡Alto!”, which means “Halt!”. Press the “!” and answer fast: halting loses the wagon and goods, running risks their shots, and no answer means you halt.',
  road: 'The road is asking your family something. Press the “!” to answer: each answer says what it costs, and with no answer in time nothing is done.',
  flight: 'Your family is told to leave: press the “!”, load the wagon and press “Leave for the east”, or stay. No answer in time, and it leaves in a rush and the house is lost.',
  route: 'On the road east, the road is quicker but soldiers see you from farther off, and across country is slower and harder to see. “Change where we go” changes it.',
  sick: 'Someone is sick, and resting helps them mend. Have another grown-up press “Nurse the sick”: nobody dies while nursed, but a very sick person can die within a day.',
  rest: '“Stop and rest a day”: the sick mend twice as fast, but the family makes no miles and the Mexican army keeps coming.',
  call: 'Your settlement is calling for men: press the “!”, tick who goes and press “Send them”. Each takes the rifle and powder, and with no answer in about 5 minutes the call closes.',
  army: 'The army is asking one of your family something: press the “!” to go to them and choose. No answer in about a minute and a half, and nothing is chosen for them.',
  watch: 'A fight is starting where one of your family is. Press “Watch” to see it: watching changes nothing, and you can close it any time.',
  resume: 'You stopped the guide. For 5 minutes, “Resume tutorial” (top right) brings it back on the same step.',
  cow: 'A child can “Drive the milk cow along”. Milked each day she gives a little food, but the family goes only as fast as she walks.',
  milk: '“Milk the cow” once a day at the halt for a little food. A careless child may let her stray, and soldiers take her if they catch you.',
  baby: 'A baby is crying, and someone stops work to pick it up. A child of seven or more can “Mind the younger ones” so the grown-ups keep working.',
  child: 'A child with nothing to do has come to talk, and the grown-up has stopped work. Tap the child’s picture and give them a job or a game.',
  enlist: 'A grown man can enlist, join a fight or go to vote from the jobs along the bottom. He is gone, with the family’s rifle, until you press “Send for them to come home”.',
  trade: 'Someone from another family is here. Tap their person, or press “Offer a trade” on the “Neighbours” list, to offer a trade; they choose yes or no.',
  store: 'Choose what to buy and sell with + and −, then press “Send”. Coin left in the house at the end counts toward your score, so spend it with care.',
  // The first two a new student meets, since the guided start was switched off (owner, 2026-09-28: "The starting tutorial
  // needs to be removed for now"): with it gone, nothing else says how to give an order.
  arrive: 'Your family is on its way to its own land. When it gets there, choose where the house stands, then choose a house.',
  // The face's idle mark (owner, 2026-09-30, "Reword for the mark"; ringed since 2026-10-09) and the short bar's "More" (2026-10-09).
  order: 'Tap one of your family on the left, then tap a job along the bottom; “More” shows the rest. A faded face with a ringed mark has nothing to do.',
  // The farm's first works, until the tutorial is rebuilt (owner, 2026-09-28: "Yes, add them"). Worded to stay true whichever
  // way the work goes - one wood pile or none, auto or by hand, crops ripening by the calendar or by the minute.
  house: 'Press “Choose a house”, then set people to “Work on the house”: they fell the logs it needs and raise it. Until it stands, the family camps.',
  // Since 2026-09-30 a plot is tapped on the map to choose its crop (owner: "let me click on the fields").
  field: 'Press “Plant the field” or tap a bare plot on the map: corn feeds the family and cotton sells. Planting uses seed, and the crop takes time to ripen.',
  town: '“Go to town to trade” sends someone to the store to buy and sell. They are away from the farm for the trip, and coin spent is gone from your score.',
  // Since 2026-09-29 a face does what the star does (owner: "When clicking on a character portrait it should be treated the same as
  // clicking on the star").
  star: 'The ★ is your main person: big choices, like leaving, come to them, and tapping another face changes who. A “!” means someone needs an answer.',
  // The carreta, met when the family's wagon is busy and it could make one but for what it has not got (owner, 2026-09-30: "i
  // never saw where i could hunt to get leather to make the little carts, and i really wanted one since i was using me wagon").
  cart: 'With the wagon busy, your family can “Make a carreta”, a small ox cart, at home. It takes the felling axe, 3 logs and a hide, and a hunt brings home a hide.',
});

/**
 * Which tip goes first when several are due at once: the ones whose thing will not wait (¡Alto!, the road, the order to leave,
 * sickness, the call, the army) before the ones that will. The same order as the "!"s (public/family-panel.js `NEED_KINDS`).
 */
export const TIP_ORDER = Object.freeze(['alto', 'road', 'flight', 'sick', 'call', 'army', 'watch', 'resume', 'rest', 'route', 'cow', 'milk', 'baby', 'child', 'enlist', 'trade', 'store', 'arrive', 'order', 'house', 'field', 'town', 'star', 'cart']);

/** The winter's joining, enlisting and voting (sim/winter.mjs `WINTER_CHORES`), as the page sees them on a work list. */
const WINTER_WORK = new Set(['enlist-regular', 'enlist-auxiliary', 'join-garrison', 'join-matamoros', 'go-vote', 'join-relief', 'join-houston', 'join-seguin']);
const GONE = ['dead', 'captured'];

/**
 * Which tips' things are on this student's screen now, most urgent first. `errandOpen` is the one thing the projection
 * cannot say - the town errand's list is open on this page (public/errand.js) - and is handed in.
 */
export function tipsPresent(world, { errandOpen = false } = {}) {
  if (!world || world.role === 'host' || !world.householdId || !world.household) return [];
  // Only while the class is being played: not in the lobby before the teacher begins, and not over the ending.
  if (!['running', 'paused'].includes(world.status)) return [];
  const members = new Set(world.household.members || []);
  const own = (world.entities || []).filter(entity => entity.kind === 'person' && members.has(entity.id) && !GONE.includes(entity.health?.condition));
  const offered = id => Object.values(world.work || {}).some(list => (list || []).some(entry => entry.id === id));
  // Offered and open to somebody now: the server's own `can` (a work shown but refused is not yet the family's to do).
  const open = id => Object.values(world.work || {}).some(list => (list || []).some(entry => entry.id === id && entry.can));
  const land = world.land;
  const leading = world.lesson && !world.lesson.done;
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
    // The start of the game: on the road in, and then on the land with the family to set to work. The star comes after
    // (it is everywhere from the start, so it is met when the farm is the student's). None of the three while a guided start
    // is running, should one ever run again.
    // Only the drive in to the family's land, not the camp moved to the house site once it is chosen (which drives the wagon again,
    // sim/homesite.mjs): on the land's own map the drive in is while the site waits to be chosen, elsewhere while no tent stands.
    // ceiling: a family with no tent, on a map with no site to choose, would meet it on a second drive; neither exists in a class.
    arrive: !(world.lesson && !world.lesson.done) && Boolean(world.land?.arriving) && Boolean(world.land.choosingSite || !world.land.tent),
    order: world.status === 'running' && !(world.lesson && !world.lesson.done) && Boolean(world.land) && !world.land.arriving && own.length > 0,
    // The house: the first time the family, on its land with its site chosen and still camped, can plan one or raise one.
    house: !leading && Boolean(land) && !land.arriving && !land.choosingSite && land.shelter === 'camp' && Boolean(land.choices?.length || land.plot || open('build-house')),
    // The field: the first time somebody can clear ground or plant it.
    field: !leading && (open('clear-plot') || open('plant-field')),
    // Going to town: the first time somebody can be sent (the errand's own tip, `store`, stands inside the errand once it opens).
    town: !leading && open('visit-shop'),
    star: world.status === 'running' && !(world.lesson && !world.lesson.done) && !world.land?.arriving && own.length > 1,
    // The carreta: the family could make one but for what it has not got (the server's `wants`, sim/wants.mjs), and no wagon of
    // its own stands free at home - out on the road, in somebody's hands, or none at all.
    cart: !leading && Boolean(world.household.wants?.['make-carreta']) && !(world.entities || []).some(one => one.kind === 'wagon' && one.householdId === world.householdId
      && !one.borrowedBy && !one.travel && one.location?.siteId === world.household.homeSiteId),
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
 * - **Never while a card or dialog is open, nor in the short gap after one is put away** (owner, 2026-10-09; below).
 * - **While the town errand is open, only its own tip.** The popup stands over the map where a tip is drawn, and a tip must
 *   never cover a popup's controls (docs/FAMILY_PANEL.md §12.11): the store's tip, drawn inside the popup, or none. A tip that
 *   stood over the map waits, neither retired nor seen, and stands again when the popup closes if its thing is still there.
 */
/** How long the screen stays clear of tips after one is put away (owner, 2026-10-09: "a short gap after one is put away"). */
export const TIP_GAP_MS = 15000;
export function tipToShow(world, { seen = [], showing = null, errandOpen = false, held = false, now = 0, quietUntil = 0 } = {}) {
  const done = new Set(seen);
  const present = tipsPresent(world, { errandOpen });
  if (errandOpen) return { show: present.includes('store') && !done.has('store') ? 'store' : null, retire: null };
  let next;
  if (showing && !done.has(showing)) {
    if (present.includes(showing)) return held ? { show: null, retire: null, waiting: showing } : { show: showing, retire: null };
    done.add(showing);
    next = { show: present.find(id => !done.has(id)) || null, retire: showing };
  } else next = { show: present.find(id => !done.has(id)) || null, retire: null };
  // Spaced out (owner, 2026-10-09: the play-through met three tips in the thirty seconds after arriving). **None while a card or
  // dialog is open** (`held`: the house site, the house plans, the call's menu, a rider, a person's card...), where it stood under
  // the dialog's dim and its "Got it" pressed the dim and closed the dialog; and **a short gap after one is put away** before the
  // next comes (`quietUntil`, `TIP_GAP_MS`). Either way the tip waits - neither retired nor seen - and comes when the screen is clear.
  // A tip retired this moment (its thing went while it stood) is put away too: the next waits its gap like any other.
  if (next.show && (held || now < quietUntil || next.retire)) return { show: null, retire: next.retire, waiting: next.show };
  return next;
}

/**
 * The tips this student can read again (owner, 2026-09-29, triage D16 "Tips button"): every one the family has put away, the
 * latest first, in its words, from the same `seen` list the page shows tips by (the server's `household.tipsSeen` and what this
 * page has put away since). A reference that gates nothing: reading it shows no tip again, sends nothing and opens nothing.
 *
 * Never the guided start's `resume`: its words send the student to "Resume tutorial", and the tutorial is suspended (owner,
 * 2026-09-28) - the teacher cannot bring it back (2026-09-27), and neither may this list. A tip nobody wrote is left out too.
 */
export const NOT_REREAD = Object.freeze(['resume']);
export function tipsToReread(seen = []) {
  const ids = [...new Set(seen)].filter(id => Object.hasOwn(TIPS, id) && !NOT_REREAD.includes(id));
  return ids.reverse().map(id => ({ id, words: TIPS[id] }));
}
