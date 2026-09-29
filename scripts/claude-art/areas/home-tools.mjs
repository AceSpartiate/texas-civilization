// The wagon's five tools set out in a cabin (request 2026-09-12 (second), interiors and furnishings), hand-written SVGs in
// public/assets/claude-standins/svg/home-tools/. Drawn 2026-09-16; moved into this module 2026-09-28.
export const AREA = 'places';
export const DATE = '2026-09-16';
const request = 'Request 2026-09-12 (second) — interiors and furnishings: the wagon’s tools';
const replaceWith = 'in the home-furnishings style and scale, standing or leaning as in a cabin';
export const SHEETS = {
  'claude-home-tools': { cell: 160, request, replaceWith, frames: [
    { name: 'home-hoe', prompt: 'A broad-bladed grubbing hoe standing on its blade, the handle leaning back a little, as it would against a cabin wall.' },
    { name: 'home-felling-axe', prompt: 'A long-handled felling axe standing head-down on the floor, the handle leaning back; a poll at the back, the bit curving out.' },
    { name: 'home-broadaxe', prompt: 'The wide, short-handled hewing axe: its great flat blade standing on the floor, the short bent handle up, the bevel on the far side.' },
    { name: 'home-froe', prompt: 'The L-shaped riving blade, its handle standing up from one end, with the round club that drives it lying beside.' },
    { name: 'home-auger', prompt: 'A T-handled auger standing on its point, the twisted bit below a round wooden crossbar.' },
  ] },
};
