// Only the family-filtered projection enters here. A local call is NOT a rider
// reaching the distant homestead. See docs/MILITARY_EXPERIENCE.md, FIC-GONZ-322.
// Travis's runner (sim/alamo-runner.mjs, 2026-09-22) is a person who walks to the family's person inside the Alamo: while he
// crosses the plaza the card says he is coming, and once he stands with them it leads to what he says and the two answers.
import { SIGHTED, needsOf } from './family-panel.js';

export function militaryNotices(world) {
  if (!world || world.role === 'host') return [];
  const own = (world.entities || []).filter(person => person.householdId === world.householdId);
  const notices = [];
  const meeting = world.encounter;
  const runnerWith = meeting?.status === 'open' && meeting.kind === 'alamo-runner' ? meeting.listenerId : null;
  if (meeting?.status === 'open' && own.some(person => person.id === meeting.listenerId)) {
    const person = own.find(person => person.id === meeting.listenerId);
    if (runnerWith) {
      notices.push({ id: `runner:${meeting.id}`, entityId: person.id, kind: 'courier', title: 'A call for riders at the Alamo',
        text: `At ${person.name}'s side: ${meeting.carrierName || 'a runner'} has come from Colonel Travis. Travis needs couriers; ${person.name} can offer to carry a letter through the lines, or stay with the garrison. ${meeting.pressing ? 'He cannot wait much longer. ' : ''}${meeting.ifUnanswered || ''}`.trim(),
        action: `Hear the runner with ${person.given || person.name}` });
    } else {
      notices.push({ id: `rider:${meeting.id}`, entityId: person.id, kind: 'rider', title: 'A rider has stopped to speak',
        text: `${person.name} has met a messenger. Listen to learn what they carry.`, action: 'Listen to the rider' });
    }
  }
  for (const person of own) {
    if (['dead', 'captured'].includes(person.health?.condition)) continue;
    const service = person.service;
    const at = `${person.name}'s side`;
    if (service?.courier === 'open' && runnerWith === person.id) continue;
    if (service?.courier === 'coming') {
      notices.push({ id: `runner-coming:${person.id}`, entityId: person.id, kind: 'courier', title: 'A runner is coming from Travis',
        text: `At ${at}: one of the garrison is crossing the plaza from Colonel Travis's quarters toward ${person.name}.`, action: `Go to ${person.given || person.name}` });
    } else if (service?.courier === 'open') {
      notices.push({ id: `courier:${person.id}`, entityId: person.id, kind: 'courier', title: 'A call for riders at the Alamo',
        text: `At ${at}: Travis needs couriers. ${person.name} can offer to carry a letter through the lines, or remain with the garrison. The riders will not wait indefinitely.`, action: `Answer with ${person.given || person.name}` });
    } else if (service?.leave === 'open' || service?.road === 'open'
      || world.army?.ours?.some(one => one.id === person.id && (one.detachment === 'open' || one.questions?.some(question => question.answer === 'open')))) {
      const key = service?.leave === 'open' ? 'leave' : service?.road === 'open' ? 'road'
        : world.army.ours.find(one => one.id === person.id)?.questions?.find(question => question.answer === 'open')?.key || 'detachment';
      notices.push({ id: `orders:${person.id}:${key}`, entityId: person.id, kind: 'orders', title: 'Your family member is being asked',
        text: `At ${at}: a decision is waiting in camp. Go to them to hear the request and choose their answer.${person.pressing ? ' Nobody can wait much longer; if no answer comes, the question lapses and nothing is chosen for them.' : ''}`, action: `Go to ${person.given || person.name}` });
    } else if (service?.besieged && service.status === 'serving' && !service.seenFall) {
      notices.push({ id: `siege:${person.id}`, entityId: person.id, kind: 'siege', title: 'Inside the Alamo',
        text: `At ${at}: the garrison is surrounded. You can look in on them. Watch for requests for couriers; offering to ride is a chance to leave, not a promise of being chosen.`, action: `Go to ${person.given || person.name}` });
    }
  }
  // A fight a family's own person is going to or is in (docs/BATTLES.md §2.7): through that person, before contact, with
  // Watch, which frames the camera on the field. Never put up over a decision that is open - the family's call, a rider
  // standing with one of them, any question above - so it never stacks on something waiting for an answer.
  // The quiet reminder that somebody is inside the Alamo is not a decision: the storming's card goes up over it.
  // And never over the family's own road (docs/audits/2026-09-28-design.md S35): the order to leave, the road's question and
  // the soldiers' ¡Alto! are the family's to answer in time, and a Watch card sprung open over them took the student away.
  const roadAsking = Boolean(world.flight && (world.flight.status === 'ordered' || world.flight.ask));
  // A page watching another family (sim/watching.mjs) answers nothing, so nothing on it is waiting on this student: the watched
  // family's road does not hold back the card through their own man.
  // **The army's request for supplies is not one of them** (owner, 2026-09-30, "Watch goes over it"): the flour the army before
  // Béxar asks for (and the autumn's ask of a family with nobody there) opens at home while the family's own man may be riding
  // into a fight, and held the card back until the fight had passed. The card goes up over it; the request stays among the
  // messages, behind the card (`rank`), to be answered, and its minutes do not run while the fight's card is up
  // (sim/decision-budget.mjs `fightUp`). The call to arms, the rider, the road and ¡Alto! still hold it back.
  const asking = world.request?.status === 'open' && world.request.kind !== 'supply';
  const deciding = !world.watching && (notices.some(notice => notice.kind !== 'siege') || asking || meeting?.status === 'open' || roadAsking);
  // The family's other big moments, in the same card (owner, 2026-09-29: "use that same style as the alert for when a family member
  // is going through a major event"): ¡Alto!, the road's question, the order to leave, the settlement's call to arms and somebody
  // very sick - each the "!" on a row already (public/family-panel.js `needsOf`, whose words and time left they carry), put up here
  // too so the moment cannot be missed. Added after `deciding` is read, so they change nothing about when the Watch card may go up:
  // the road's own questions hold it back as they always did (`roadAsking`), the call as `request` always did, and a sickness,
  // which never did, still does not.
  const seenCall = new Set();
  for (const person of own) {
    for (const need of needsOf(world, person.id)) {
      const moment = MOMENTS[need.kind];
      if (!moment) continue;
      if (need.kind === 'call') { if (seenCall.has(world.request?.id)) continue; seenCall.add(world.request?.id); }
      // Each sighting its own card (its seed): a second deer the same afternoon springs the card open again, as a fresh moment.
      notices.push({ id: `${need.kind}:${need.kind === 'call' ? world.request?.id : need.kind === 'sighting' ? `${person.id}:${person.chore?.ask?.sight?.seed}` : person.id}`, entityId: person.id, kind: need.kind,
        title: moment.title(person, world), text: need.text, action: moment.action(person, world), ...(Number.isFinite(need.leftMs) && { leftMs: need.leftMs }) });
    }
  }
  const alert = world.battleAlert;
  // On a page watching another family (sim/watching.mjs) the card through their own man is marked as theirs by the server
  // (sim/world.mjs `ownWar`): he is not on the watched family's rows.
  if (alert && !deciding && (own.some(person => person.id === alert.entityId) || alert.householdId === world.householdId)) {
    // Watch for a fight; Follow for a march or a muster (Coleto's march out, the prisoners formed on Palm Sunday), which frames
    // the field the same way (docs/battle-research/staging.md §6.7, §7.7).
    notices.push({ id: alert.id, entityId: alert.entityId, kind: 'battle', title: alert.title, text: alert.text, action: alert.action || 'Watch', field: alert.field });
  }
  // Afterwards, the family's own person's account of it, in plain words (§2.8). The journal keeps it.
  const account = world.battleAccount;
  if (account) {
    const person = own.find(one => one.id === account.entityId);
    notices.push({ id: account.id, entityId: account.entityId, kind: 'account', title: account.title, text: account.text, action: `Go to ${person?.given || person?.name || 'them'}` });
  }
  // Decisions first, then the fight, then quiet reminders. Stable order keeps the queue calm. Among the decisions, the ones that will
  // not wait: ¡Alto!, then the road and the order to leave, then the call to arms - as the "!"s are ranked (`byUrgency`); a very sick
  // person after the fight, before its account.
  // The army's request for supplies comes after the fight's card, which goes up over it (owner, 2026-09-30).
  const rank = notice => (notice.kind === 'call' && world.request?.kind === 'supply' ? SUPPLY_ORDER : ORDER[notice.kind]);
  return notices.sort((a, b) => rank(a) - rank(b));
}
/**
 * The settlement's call to arms while it waits on this family, and who can answer it now: the first big decision of the game
 * (triage 2026-09-29, 2.5; design audit S5). It had a card among the messages like the rider's and the army's, but folded with
 * "Keep playing" it was a small "!" again, and a student who pressed "Got it" on the tip by habit let it lapse in its five minutes.
 * So while it is open the page draws it as well as saying it (owner, 2026-10-03: visual cues over explanatory text): a beacon on
 * the ground under each person who can answer (public/app.js `drawTaskMark`), their portraits beckoning on the family's panel, the
 * folded messages still glowing, and once, when it first comes, the edges of the screen warming and fading. Nothing is held,
 * nothing is answered for the family, and nothing new is said: the "!", the card and its words are as they were.
 *
 * Only the call to arms - the settlement's own, or Gonzales's at the gathering (`request.kind === 'call'`): the town's food, the march
 * upriver, the rumour and the army's request for supplies keep their card and their "!" alone. The same people as the "!" (`needsOf`
 * kind `call`), never on a page watching another family or the Host's. Null when there is none.
 */
export function callCue(world) {
  if (!world || world.role === 'host' || world.watching) return null;
  const request = world.request;
  if (request?.status !== 'open' || request.kind !== 'call') return null;
  const ids = (world.entities || []).filter(person => person.householdId === world.householdId && needsOf(world, person.id).some(need => need.kind === 'call')).map(person => person.id);
  return ids.length ? { id: request.id, ids } : null;
}
/**
 * The kinds that ask something of the family with a clock on it - a question that lapses, somebody very sick - as against a
 * fight to watch, its account, or the quiet reminder that somebody is inside the Alamo. While one of these is among the
 * messages nothing the student opens may stand on them: the town's scene and the rooms of the house make way (triage
 * 2026-09-29, 2.2; `clearOfNotice` in public/app.js).
 */
// The sighting on a hunt (owner, 2026-10-02) has the shortest clock of all, fifteen seconds: the rooms and the town's scene make way
// for it, and among the cards it stands after the family's road and the call, before a rider (who waits ninety).
export const URGENT = Object.freeze(new Set(['alto', 'road', 'flight', 'call', 'rider', 'courier', 'orders', 'sick', 'hunger', 'sighting']));
const ORDER = Object.freeze({ alto: -3, road: -2, flight: -2, call: -1, sighting: -0.5, rider: 0, courier: 0, orders: 0, battle: 1, sick: 1.5, hunger: 1.5, account: 2, siege: 3 });
/** Where the army's request for supplies stands among the messages: after the fight's card, before somebody very sick. */
const SUPPLY_ORDER = 1.2;
const first = person => person.given || String(person.name || '').split(' ')[0] || 'them';
/** The family's moments put up as cards, by the kind of their "!": what the card is headed and what its button says. */
export const MOMENTS = Object.freeze({
  alto: { title: () => '¡Alto! Soldiers on the road', action: () => 'Answer now' },
  road: { title: () => 'The road is asking', action: () => 'Answer' },
  flight: { title: () => 'Told to leave for the east', action: () => 'Choose what to do' },
  // The settlement's call to turn out is a call to arms; the food wanted in Gonzales, the march upriver and the rumour are asked too.
  // What the army before Béxar asks of the family at home (sim/supplies.mjs, owner 2026-09-29, D5) is put up the same way.
  call: { title: (person, world) => (world?.request?.kind === 'call' ? 'A call to arms' : world?.request?.kind === 'march' ? 'The march upriver' : world?.request?.kind === 'supply' ? 'The army asks for supplies' : 'Your family is being asked'),
    action: (person, world) => (world?.request?.kind === 'call' ? 'Choose who goes' : world?.request?.kind === 'supply' ? 'Choose what to send' : 'Choose who answers') },
  sick: { title: person => `${first(person)} is very sick`, action: person => `Go to ${first(person)}` },
  // Somebody starving (sim/hunger.mjs, owner 2026-09-30): the story card's alarm, in as few words as the "!".
  hunger: { title: person => `${first(person)} is starving`, action: person => `Go to ${first(person)}` },
  // Something sighted on a hunt (owner, 2026-10-02: "when they see an animal the player should see an alert"; sim/hunt-aim.mjs): the
  // animal, as the hunter sees it, and the button that opens the field to aim across (public/hunt-aim.js).
  sighting: { title: person => { const a = SIGHTED[person?.chore?.ask?.sight?.quarry] || SIGHTED.deer; return `${a.charAt(0).toUpperCase()}${a.slice(1)}!`; }, action: () => 'Take the shot' },
});
/** Each kind's eyebrow, over its title. */
export const EYEBROWS = Object.freeze({ sighting: 'On the hunt', alto: '¡Alto!', road: 'On the road', flight: 'The order to leave', call: 'A call to arms', sick: 'Very sick', hunger: 'No food', rider: 'A rider', courier: 'Riders wanted', orders: 'In camp', battle: 'The fighting', account: 'After the fight', siege: 'Inside the Alamo' });
/** Each kind's icon, from the family panel's own icons (Astra's, and Claude's where hers is missing). */
export const ICONS = Object.freeze({ sighting: 'icon-hunt-land', alto: 'icon-flee-hide', road: 'icon-road-lookout', flight: 'icon-flee-bundle', call: 'icon-enlist-auxiliary', sick: 'icon-nurse-home', hunger: 'icon-sell-food', rider: 'mark-need-rider', courier: 'icon-join-relief', orders: 'icon-camp-drill', battle: 'icon-camp-guard', account: 'icon-travel-home', siege: 'icon-join-garrison' });
