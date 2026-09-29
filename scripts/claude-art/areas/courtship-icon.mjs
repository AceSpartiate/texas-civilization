// The lone parent's special ability (request 2026-09-29 — the lone parent's wedding, item 6): `icon-ask-neighbours`, the
// action icon on the special button (`#ask-neighbours` in public/app.js). Action icon contract: 128 by 128, transparent, one
// silhouette with a thin dark outline, reading at 34-38 CSS px and dimmed to 40%.
//
// A parent and a child walking hand in hand up a worn track toward a neighbour's cabin a way off, smoke rising from its
// chimney: going visiting to ask for help, not running for it (the oldest child's `icon-child-help` runs, alone, an arm
// flung out). The two are the rig's own rust and girl, so they are the family's people. Claude-drawn and temporary.
import { frameOf, drawPerson } from '../kit/rig.mjs';
import { POSES } from '../kit/poses.mjs';
import { figureIn } from '../kit/little.mjs';
import { iconFrame, cabin, tone, LINE, ellipse, blob, curve, poly } from '../kit/icon-bits.mjs';

export const AREA = 'land';
export const DATE = '2026-09-29';
const REQUEST = 'Request 2026-09-29 — the lone parent\'s wedding';
const STYLE = 'One silhouette on a transparent ground, a thin dark olive-brown outline, flat shade with the light from the upper left, the warm moss, rust, cream and ochre palette of the family panel\'s icons; no text. Reads at 34-38 CSS px and dimmed to 40%.';
const PROMPT = 'Asking the neighbours: a father and his little girl walking side on, hand in hand, up a worn tan track toward a neighbour\'s small log cabin a way off on a rise of grass, a pale thread of smoke curling up from its stick-and-mud chimney - somebody is at home.';

const PARENT = { base: [32, 123], s: 0.95 }, CHILD = { base: [62, 124], s: 0.67 };
/** Where the joined hands are, in the icon's pixels, and in each figure's own rig units (y up from its ground). */
const HANDS = [49, 84];
const rigAt = ({ base, s }) => [(HANDS[0] - base[0]) / s, (base[1] - HANDS[1]) / s];

function askNeighbours(ink) {
  // A rise of grass the cabin stands on, and the track up to it.
  ink.shape(blob([[60, 60], [78, 40], [112, 33], [127, 42], [126, 64], [86, 68]], 0.8), '#7f9a52', { off: 1.2 });
  ink.shape(poly([[6, 127], [86, 127], [104, 54], [98, 52]]), '#c8a878', { off: 0.8 });
  ink.line(curve([[48, 127], [80, 90], [101, 54]]), { width: LINE.fine, colour: '#9a7a4e', opacity: 0.7 });
  // The chimney at the cabin's near end, then the cabin, then the smoke.
  const cx = 90, cy = 50, w = 24, h = 13;
  ink.shape(poly([[cx - 6, cy], [cx + 1, cy], [cx + 0.5, cy - h - 12], [cx - 5.5, cy - h - 12]]), '#a0784c', { off: 0.8 });
  for (let y = cy - 4; y > cy - h - 10; y -= 4) ink.line(`M ${cx - 5.6} ${y} L ${cx + 0.6} ${y}`, { width: LINE.fine, colour: tone('#a0784c', -0.4), opacity: 0.7 });
  cabin(ink, [cx, cy], w, h);
  const puffs = [[cx - 2, cy - h - 16, 3.6, 3], [cx + 3, cy - h - 23, 4.6, 3.6], [cx + 10, cy - h - 29, 5.6, 4.2]];
  for (const [x, y, rx, ry] of puffs) ink.shape(ellipse([x, y], rx, ry), '#e6e0d2', { off: 0.8, outline: LINE.inner, lift: true });
  // The father, then the girl nearer to us, her far hand in his near one between them.
  const Fp = frameOf('rust'), Fc = frameOf('girl');
  const p = POSES.walk(Fp)[0], c = POSES.walk(Fc)[2];
  figureIn(ink, 'parent', PARENT.base, PARENT.s, inner => drawPerson(inner, 'rust', { ...p, hands: { ...p.hands, near: rigAt(PARENT) } }));
  figureIn(ink, 'child', CHILD.base, CHILD.s, inner => drawPerson(inner, 'girl', { ...c, hands: { ...c.hands, far: rigAt(CHILD) } }));
}

export const SHEETS = {
  'claude-courtship-icon': { cell: 128, columns: 1, request: REQUEST,
    replaceWith: 'item 6: one frame in the family icon atlas, 128 by 128, a single silhouette with a thin dark outline, reading at 34-38 CSS px and dimmed to 40%',
    frames: [{ name: 'icon-ask-neighbours', height: 0.5, compare: [['icon-build-house', 0.5], ['icon-child-help', 0.5]], prompt: `${PROMPT} ${STYLE} (${REQUEST}.)`,
      draw: () => iconFrame('icon-ask-neighbours', PROMPT, askNeighbours) }] },
};
export const CLIPS = {};
