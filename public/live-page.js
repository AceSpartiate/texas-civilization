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
    // The student playing the family, by their own name, and in the lobby whether the family is rolled, named and packed (owner,
    // 2026-09-29: "Show name + ready"). The name is the server's presence, sent to the Host alone; ready is the world's.
    student: presence?.students?.[family.id] || '',
    ready: Boolean(family.ready),
    waiting: family.waiting || 0,
    // "stopped the guided start at step 4", "resumed the guided start: on step 4 of 10" (sim/lesson.mjs `lessonHostWords`):
    // said quietly under the family's name, and empty for every family whose student did neither.
    guided: family.guided || '',
    people: family.people.map(person => ({ name: person.name, role: person.role, where: person.where })),
    // A child who died of a sickness is counted and never named (sim/host.mjs, the owner 2026-09-27).
    ...(family.lost && { lost: family.lost }),
  }));
}

/**
 * The class's sickness in words, for the class panel (sim/disease.mjs `classSickness`): how many of each, never who. Empty when
 * nobody is sick and nobody has died of it.
 */
export function sicknessView(live) {
  const sickness = live?.sickness;
  if (!sickness) return '';
  const died = sickness.died ? `${sickness.died} ${sickness.died === 1 ? 'has' : 'have'} died of sickness.` : '';
  return [...(sickness.lines || []), died].filter(Boolean).join(' ');
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

/**
 * Why the class is paused, when it paused itself with no student in it (owner, 2026-09-29: "Pause after 3 min"; server/app.mjs
 * `pauseIfEmpty`): said plainly on the Host's page until the teacher's Resume. Empty when the class did not pause itself.
 * `clock` says the moment in the teacher's own time; given here so the words can be tested without a browser.
 */
export function emptyPauseWords(emptyPaused, clock = at => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) {
  if (!emptyPaused) return '';
  const ms = emptyPaused.ms, span = ms >= 60000 ? `${Math.round(ms / 60000)} minute${Math.round(ms / 60000) === 1 ? '' : 's'}` : `${Math.round(ms / 1000)} seconds`;
  return `The class paused itself at ${clock(emptyPaused.at)}: no student had the game open for ${span}, so nothing went on without them. Press Resume when the class is back.`;
}
