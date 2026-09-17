// The Host's live page, in words (docs/HOST_PAGE.md; served as /live-page.js because a path beginning /host is the Host page's):
// built from the Host's projection (`world.live`, sim/host.mjs) and the server's presence. Nothing here decides anything
// and nothing is remembered; public/app.js draws what these return. Tested headlessly in tests/host-page.test.mjs.

/** How a family's student is here, in one word for the row: from the server's presence and the world's absence. */
export function presenceWord(family, presence) {
  if (!family.played) return 'nobody';
  const state = presence?.households?.[family.id];
  if (family.absent) return 'absent';
  return state || 'gone';
}
export const PRESENCE_LABELS = Object.freeze({
  here: 'here', away: 'away a moment', absent: 'playing itself', gone: 'gone', nobody: 'nobody playing',
});

/** The class panel's rows: settlement by settlement, families in household order, each person in words. */
export function familyRows(live, presence) {
  return (live?.families || []).map(family => ({
    id: family.id,
    name: family.name,
    settlement: family.settlement || '',
    presence: presenceWord(family, presence),
    waiting: family.waiting || 0,
    people: family.people.map(person => ({ name: person.name, role: person.role, where: person.where })),
  }));
}

const STATUS_WORDS = Object.freeze({ rumor: 'a rumour', unconfirmed: 'unconfirmed', confirmed: 'confirmed', contradicted: 'contradicted' });

/**
 * The Rumor Mill's pieces, newest first: a heading with the day, how firm the word is and how far it has travelled, the
 * report as the public heard it, and the earlier tellings of the same thing under it, so a story that changed reads as
 * having changed. Some are true and some are not; the mill says how sure the public was, never which.
 */
export function rumourLines(rumours) {
  return (rumours || []).map(piece => ({
    topicId: piece.topicId,
    key: `${piece.topicId}:${piece.status}:${piece.minute}:${piece.heardBy}`,
    head: `${piece.date} · ${STATUS_WORDS[piece.status] || piece.status} · heard by ${piece.heardBy} of ${piece.families} families`,
    text: piece.text,
    earlier: (piece.earlier || []).map(telling => ({ head: `${telling.date} · ${STATUS_WORDS[telling.status] || telling.status}`, text: telling.text })),
  }));
}

/** The banner over the map while a spotlight stands: the day and the words. */
export function spotlightBanner(spotlight) {
  if (!spotlight) return null;
  return { key: `${spotlight.key}:${spotlight.minute}`, date: spotlight.date, text: spotlight.text, x: spotlight.x, y: spotlight.y };
}
