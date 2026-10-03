// The famous people drawn from Claude's temporary sheets (public/assets/claude-standins/; docs/CLAUDE_ART_PLAN.md C13 and C14):
// each person's poses by name, as `PERSON_ART` in public/battle-view.js gives Astra's. Her `PERSON_ART` entry for the same key
// always wins (`personArt`), so her delivery replaces a line here without touching anything else; then delete the line.
//
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - area C's famous sheets and the Esparza
// family (request 2026-09-26 "the famous people", items 1 and 3; request 2026-09-26 "the Esparza family"). `fallback` is the
// library figure drawn while a Claude sheet has not loaded (a woman is never drawn as a soldier).
// No likeness is claimed for anybody (docs/BATTLES.md §2c).
const famous = (id, { fires, falls, rides, mx, extra = {} } = {}) => ({
  stand: `${id}-idle`, speak: `${id}-speak`, command: `${id}-command`, point: `${id}-point`, walk: `${id}-walk-e`, walkSouth: `${id}-walk-s`, walkNorth: `${id}-walk-n`,
  ...(fires && { fire: [`${id}-aim`, `${id}-fire`, `${id}-aim`] }),
  ...(falls && { fall: `${id}-fall`, still: `${id}-still` }),
  ...(rides && { ride: `clip:${id}-mounted-walk-e`, rideIdle: `${id}-mounted-idle-e` }),
  ...(mx && { listen: `${id}-listen` }),
  ...extra,
});

// Gregorio Esparza's burial party (`burial-party-walk-e`, drawn by `drawBearers`) is the noon of March 6, reached by a jump of the
// clock, and Francisco, who carries him, is on the field in no phase before it. So its sheet is named on Gregorio and his family too:
// the page asks for every sheet of the people of a fight with each snapshot (public/app.js `render`), and asks for this one while
// any of them is on the field, the siege and the assault, so it is here before the first frame of the burial.
const BURIAL = Object.freeze({ burial: 'burial-party-walk-e' });
export const CLAUDE_PERSON_ART = Object.freeze({
  'ana-esparza': { stand: 'ana-esparza-idle', seated: 'ana-esparza-seated', sick: 'ana-esparza-seated', shelter: 'ana-esparza-shelter-with-children', carry: 'clip:ana-esparza-carry-toddler', blanket: 'ana-esparza-hold-blanket', walk: 'ana-esparza-walk-e', fallback: 'woman', ...BURIAL },
  'maria-de-jesus': { stand: 'maria-de-jesus-idle', seated: 'maria-de-jesus-seated-huddled', sick: 'maria-de-jesus-seated-huddled', walk: 'maria-de-jesus-walk-e', fallback: 'girl', ...BURIAL },
  'enrique-esparza': { stand: 'enrique-esparza-idle', seated: 'enrique-esparza-seated-huddled', sick: 'enrique-esparza-seated-huddled', look: 'enrique-esparza-look', walk: 'enrique-esparza-walk-e', fallback: 'boy', ...BURIAL },
  // A pose Astra's delivered sheet lacks: Gregorio asleep sitting (night of March 5). Held back (owner, 2026-09-29,
  // public/art-subjects.js): she has drawn him, so this Claude frame is never in the library and her own figure is drawn in its
  // nearest pose, as before Claude's art. Kept so her own pose of the name is taken when it lands. (Kimbell, Martin, J. W. Smith,
  // Horton, W. P. Smith, Smither, Sánchez Navarro, Barragán and Castrillón's north and south walks are hers since 2026-10-03; their
  // Claude lines were deleted when her delivery was merged.)
  esparza: { seated: 'esparza-seated', ...BURIAL },
  'francisco-esparza': { stand: 'francisco-esparza-idle', kneel: 'francisco-esparza-kneel-at-grave', walk: 'francisco-esparza-walk-e', carry: 'clip:burial-party-walk-e', bearers: 'burial-party-walk-e', fallback: 'townsman' },
});
