// The family panel's marks (request 2026-09-16), hand-written SVGs in public/assets/claude-standins/svg/marks/. Drawn
// 2026-09-16; moved into this module 2026-09-28 when the build became per-area.
export const AREA = 'land';
export const DATE = '2026-09-16';
const request = 'Request 2026-09-16 — the family panel’s marks';
const replaceWith = '96 by 96, transparent, no text';
export const SHEETS = {
  'claude-marks': { cell: 96, request, replaceWith, frames: [
    { name: 'mark-need', prompt: 'An exclamation point on a round orange token in the map\'s own mark colour (#c2582c): a stamped coin with a darker rim below, lit rim upper left, a cream tapered bar and dot. Reads at 24 CSS px on the panel.' },
    { name: 'mark-need-rider', prompt: 'The same token as mark-need in slate (#41556b), for a rider waiting to speak.' },
    { name: 'mark-main', prompt: 'A brass star badge marking the student\'s main person: five faceted points lit on the upper-left faces and dark on the lower-right, a small pin in the middle.' },
    { name: 'mark-idle', prompt: 'A tan broad-brim hat hung on a wooden wall peg, seen a little from above: the resting sign laid on a portrait\'s corner.' },
    { name: 'mark-auto-off', prompt: 'A clockwork winding key in the panel\'s dim brown - the person runs by themself, switched off: a chunky butterfly bow, thick shaft, square socket foot.' },
    { name: 'mark-auto-on', prompt: 'The same winding key in the panel\'s green (#4f7a3a): switched on.' },
  ] },
};
