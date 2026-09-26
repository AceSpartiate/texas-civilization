// Only the family-filtered projection enters here. A local call is NOT a rider
// reaching the distant homestead. See docs/MILITARY_EXPERIENCE.md, FIC-GONZ-322.
// Travis's runner (sim/alamo-runner.mjs, 2026-09-22) is a person who walks to the family's person inside the Alamo: while he
// crosses the plaza the card says he is coming, and once he stands with them it leads to what he says and the two answers.
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
        text: `At ${at}: a decision is waiting in camp. Go to them to hear the request and choose their answer.${person.pressing ? ' Nobody can wait much longer; if no answer comes, it will be decided for them.' : ''}`, action: `Go to ${person.given || person.name}` });
    } else if (service?.besieged && service.status === 'serving') {
      notices.push({ id: `siege:${person.id}`, entityId: person.id, kind: 'siege', title: 'Inside the Alamo',
        text: `At ${at}: the garrison is surrounded. You can look in on them. Watch for requests for couriers; offering to ride is a chance to leave, not a promise of being chosen.`, action: `Go to ${person.given || person.name}` });
    }
  }
  // A fight a family's own person is going to or is in (docs/BATTLES.md §2.7): through that person, before contact, with
  // Watch, which frames the camera on the field. Never put up over a decision that is open - the family's call, a rider
  // standing with one of them, any question above - so it never stacks on something waiting for an answer.
  const deciding = notices.length || world.request?.status === 'open' || meeting?.status === 'open';
  const alert = world.battleAlert;
  if (alert && !deciding && own.some(person => person.id === alert.entityId)) {
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
  // Decisions first, then the fight, then quiet reminders. Stable order keeps the queue calm.
  const order = kind => (kind === 'siege' ? 3 : kind === 'account' ? 2 : kind === 'battle' ? 1 : 0);
  return notices.sort((a, b) => order(a.kind) - order(b.kind));
}
