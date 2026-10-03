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
  kimbell: famous('kimbell', { fires: true, falls: true, rides: true }),
  martin: famous('martin', { fires: true, falls: true, rides: true }),
  'jw-smith': famous('jw-smith', { fires: true, rides: true }),
  horton: famous('horton', { fires: true, rides: true }),
  'wp-smith': famous('wp-smith', { extra: { command: 'wp-smith-address', address: 'wp-smith-address', listen: 'wp-smith-listen' } }),
  smither: famous('smither', { rides: true, extra: { call: 'smither-call' } }),
  'sanchez-navarro': famous('sanchez-navarro', { mx: true, extra: { parley: 'sanchez-navarro-parley' } }),
  barragan: famous('barragan', { mx: true, extra: { protect: 'barragan-protect' } }),
  'ana-esparza': { stand: 'ana-esparza-idle', seated: 'ana-esparza-seated', sick: 'ana-esparza-seated', shelter: 'ana-esparza-shelter-with-children', carry: 'clip:ana-esparza-carry-toddler', blanket: 'ana-esparza-hold-blanket', walk: 'ana-esparza-walk-e', fallback: 'woman', ...BURIAL },
  'maria-de-jesus': { stand: 'maria-de-jesus-idle', seated: 'maria-de-jesus-seated-huddled', sick: 'maria-de-jesus-seated-huddled', walk: 'maria-de-jesus-walk-e', fallback: 'girl', ...BURIAL },
  'enrique-esparza': { stand: 'enrique-esparza-idle', seated: 'enrique-esparza-seated-huddled', sick: 'enrique-esparza-seated-huddled', look: 'enrique-esparza-look', walk: 'enrique-esparza-walk-e', fallback: 'boy', ...BURIAL },
  // Poses Astra's delivered sheets lack: Gregorio asleep sitting (night of March 5), Castrillón walking north and south. Held
  // back (owner, 2026-09-29, public/art-subjects.js): she has drawn both men, so these Claude frames are never in the library and
  // her own figure is drawn in its nearest pose, as before Claude's art. Kept so her own pose of the name is taken when it lands.
  esparza: { seated: 'esparza-seated', ...BURIAL },
  castrillon: { walkSouth: 'castrillon-walk-s', walkNorth: 'castrillon-walk-n' },
  'francisco-esparza': { stand: 'francisco-esparza-idle', kneel: 'francisco-esparza-kneel-at-grave', walk: 'francisco-esparza-walk-e', carry: 'clip:burial-party-walk-e', bearers: 'burial-party-walk-e', fallback: 'townsman' },
});
