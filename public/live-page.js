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
    // "stopped the guided start at step 4", "resumed the guided start: on step 4 of 10" (sim/lesson.mjs `lessonHostWords`):
    // said quietly under the family's name, and empty for every family whose student did neither.
    guided: family.guided || '',
    people: family.people.map(person => ({ name: person.name, role: person.role, where: person.where })),
  }));
}

const STATUS_WORDS = Object.freeze({ rumor: 'a rumour', unconfirmed: 'not yet sure', confirmed: 'confirmed', contradicted: 'contradicted' });

/**
 * The Rumor Mill as the page shows it (owner, 2026-09-18): the running story, a paragraph a month, and the latest word as
 * it was heard, with its day and how firm it was. Nothing to show says so, rather than leaving an empty panel.
 */
export function storyView(story) {
  const paragraphs = story?.paragraphs || [];
  if (!paragraphs.length) return { key: 'quiet', paragraphs: ['No word has reached the colonies yet.'], latest: null };
  const latest = story.latest ? `The latest, ${story.latest.date} (${STATUS_WORDS[story.latest.status] || story.latest.status}): ${story.latest.text}` : null;
  return { key: story.key, paragraphs, latest };
}

/** The banner over the map while a spotlight stands: the day and the words. */
export function spotlightBanner(spotlight) {
  if (!spotlight) return null;
  return { key: `${spotlight.key}:${spotlight.minute}`, date: spotlight.date, text: spotlight.text, x: spotlight.x, y: spotlight.y };
}
