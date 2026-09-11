import { record } from './events.mjs';

export function establishTruth(world, { id, text, siteId = null, classification = 'FICTIONAL FOR GAMEPLAY', claimId = null, causes = [] }) {
  if (world.truth[id]) return world.truth[id];
  const eventId = record(world, 'world-event', { text, topicId: id, siteId, classification, claimId, causes, importance: 3 });
  return world.truth[id] = { id, text, siteId, classification, claimId, minute: world.minute, eventId };
}
export const STATUSES = ['rumor', 'unconfirmed', 'confirmed', 'contradicted'];
/**
 * Whether telling this audience this would actually change what they understand.
 *
 * The same news twice is not news, and a fainter version of something a family has
 * already had confirmed is not news either. Anything else is: a rumor firmed up, a report
 * contradicted, a first hearing. `LIVING_INFORMATION.md` asks for exactly this - a
 * repeated report deduplicated "without deleting a genuinely new account or correction" -
 * and it is one rule in one place, so a rider deciding whether to bother telling somebody
 * and `learn` deciding whether to write it down can never drift apart.
 */
// ceiling: a contradiction is the last word. Nothing re-confirms a report once it has
// been contradicted, because no scenario yet produces the sequence and guessing at what
// a family should believe on the third telling is a research question, not a default.
const CONFIDENCE = { rumor: 0, unconfirmed: 1, confirmed: 2, contradicted: 3 };
export function wouldLearn(world, audience, topicId, status = 'confirmed') {
  const knowledge = audience === 'public' ? world.knowledge.public : world.knowledge.households[audience];
  const old = knowledge?.[topicId];
  if (!old) return true;
  // Only a firmer account is news. A family who met the person who saw it does not lose
  // that to the third-hand version arriving an hour later, which is a thing that now
  // genuinely happens: word travels down a chain and a nearer rider often gets there first.
  return CONFIDENCE[status] > CONFIDENCE[old.status];
}
export function learn(world, audience, topicId, { status = 'confirmed', source = 'observation', text, causes = [], hands } = {}) {
  const truth = world.truth[topicId]; if (!truth) throw new Error('Unknown information topic');
  if (!STATUSES.includes(status)) throw new Error('Invalid report status');
  const knowledge = audience === 'public' ? world.knowledge.public : world.knowledge.households[audience];
  if (!knowledge) throw new Error('Unknown information audience');
  const old = knowledge[topicId];
  if (!wouldLearn(world, audience, topicId, status)) return false;
  const eventId = record(world, 'information', { householdId: audience === 'public' ? null : audience, visibility: audience === 'public' ? 'public' : 'private', topicId, text: text || truth.text, source, status, causes: [truth.eventId, ...causes] });
  // `hands` is how many people carried this before the one who said it, and it is only
  // written when somebody actually carried it. A class that predates relays saves and
  // reloads to exactly the world it saved.
  knowledge[topicId] = { topicId, text: text || truth.text, status, source, observedMinute: truth.minute, receivedMinute: world.minute, eventId, ...(hands !== undefined && { hands }) };
  // Anything the family drew out of a rider by asking survives a change of status. The
  // key is only written when there is something in it, so a class that never met a rider
  // saves and reloads to exactly the world it saved.
  if (old?.details) knowledge[topicId].details = old.details;
  return true;
}
export function reportsFor(world, audience) {
  const knowledge = audience === 'public' ? world.knowledge.public : world.knowledge.households[audience];
  return Object.values(knowledge || {}).map(report => ({ ...report, ageMinutes: world.minute - report.receivedMinute, observationAgeMinutes: world.minute - report.observedMinute }));
}
export function deliverReports(world) {
  for (const entity of Object.values(world.entities)) {
    // A report that is carried in person is handed over by being said, in `sim/encounters.mjs`,
    // to somebody who is actually standing there. It is never posted through the door of an
    // empty cabin. An in-flight courier from a class saved before that existed carries no
    // such mark and still delivers the old way, which is why no save version moved.
    if (entity.report?.inPerson) continue;
    if (entity.report && !entity.travel && entity.location.siteId === entity.report.destination) {
      const report = entity.report;
      learn(world, report.audience, report.topicId, { status: report.status, source: `Courier ${entity.name}` });
      record(world, 'report-delivered', { actorId: entity.id, householdId: report.audience, text: `${entity.name} brought a report.`, causes: [world.knowledge.households[report.audience][report.topicId].eventId] });
      delete entity.report;
    }
  }
}
