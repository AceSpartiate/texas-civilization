// Only the family-filtered projection enters here. A local call is NOT a rider
// reaching the distant homestead. See docs/MILITARY_EXPERIENCE.md, FIC-GONZ-322.
// ceiling: the card is words over the existing question; no runner walks to the person yet. Replace it only after the
// server-owned local courier encounter (step 1 of that document) exists.
export function militaryNotices(world) {
  if (!world || world.role === 'host') return [];
  const own = (world.entities || []).filter(person => person.householdId === world.householdId);
  const notices = [];
  const meeting = world.encounter;
  if (meeting?.status === 'open' && own.some(person => person.id === meeting.listenerId)) {
    const person = own.find(person => person.id === meeting.listenerId);
    notices.push({ id: `rider:${meeting.id}`, entityId: person.id, kind: 'rider', title: 'A rider has stopped to speak',
      text: `${person.name} has met a messenger. Listen to learn what they carry.`, action: 'Listen to the rider' });
  }
  for (const person of own) {
    if (['dead', 'captured'].includes(person.health?.condition)) continue;
    const service = person.service;
    const at = `${person.name}'s side`;
    if (service?.courier === 'open') {
      notices.push({ id: `courier:${person.id}`, entityId: person.id, kind: 'courier', title: 'A call for riders at the Alamo',
        text: `At ${at}: Travis needs couriers. ${person.name} can offer to carry a letter through the lines, or remain with the garrison. The riders will not wait indefinitely.`, action: `Answer with ${person.given || person.name}` });
    } else if (service?.leave === 'open' || service?.road === 'open'
      || world.army?.ours?.some(one => one.id === person.id && (one.detachment === 'open' || one.questions?.some(question => question.answer === 'open')))) {
      const key = service?.leave === 'open' ? 'leave' : service?.road === 'open' ? 'road'
        : world.army.ours.find(one => one.id === person.id)?.questions?.find(question => question.answer === 'open')?.key || 'detachment';
      notices.push({ id: `orders:${person.id}:${key}`, entityId: person.id, kind: 'orders', title: 'Your family member is being asked',
        text: `At ${at}: a decision is waiting in camp. Go to them to hear the request and choose their answer.`, action: `Go to ${person.given || person.name}` });
    } else if (service?.besieged && service.status === 'serving') {
      notices.push({ id: `siege:${person.id}`, entityId: person.id, kind: 'siege', title: 'Inside the Alamo',
        text: `At ${at}: the garrison is surrounded. You can look in on them. Watch for requests for couriers; offering to ride is a chance to leave, not a promise of being chosen.`, action: `Go to ${person.given || person.name}` });
    }
  }
  // Decisions first, then quiet siege reminders. Stable order keeps the queue calm.
  return notices.sort((a,b) => Number(a.kind === 'siege') - Number(b.kind === 'siege'));
}
