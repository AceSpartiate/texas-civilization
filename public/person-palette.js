// Recolour the *authored* character frames. This changes pigments while retaining their
// original ink, brush texture, silhouettes and every frame of their motion sheets.
import { SKIN_COLOURS, HAIR_COLOURS, CLOTHING_COLOURS } from './looks-art.js';

const sources = {
  rust: { skin: [218, 157, 96], hair: [64, 45, 32], clothing: [151, 76, 48] },
  teal: { skin: [185, 112, 61], hair: [64, 47, 37], clothing: [78, 126, 123] },
  elder: { skin: [113, 75, 50], hair: [181, 177, 160], clothing: [83, 89, 62] },
  blue: { skin: [224, 155, 98], hair: [67, 45, 32], clothing: [73, 106, 135] },
  'rust-woman': { skin: [211, 133, 77], hair: [61, 44, 35], clothing: [156, 75, 51] },
  indigo: { skin: [210, 137, 81], hair: [65, 47, 39], clothing: [71, 102, 132] },
  ochre: { skin: [224, 151, 90], hair: [73, 51, 36], clothing: [124, 89, 52] },
  'blue-girl': { skin: [222, 151, 96], hair: [67, 46, 35], clothing: [70, 103, 134] },
};
const rgb = hex => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
const light = (r, g, b) => .299 * r + .587 * g + .114 * b;
const clamp = n => Math.max(0, Math.min(255, Math.round(n)));

/** A pure pixel transform, shared by idle, walk, work, care and battle frames. */
export function recolourPersonFrame(imageData, frameName, appearance) {
  const variant = Object.keys(sources).sort((a, b) => b.length - a.length).find(name => frameName.startsWith(name + '-'));
  if (!variant || !appearance) return imageData;
  const source = sources[variant], target = {
    skin: rgb(SKIN_COLOURS[appearance.skin] || SKIN_COLOURS.olive),
    hair: rgb(HAIR_COLOURS[appearance.hair] || HAIR_COLOURS.brown),
    clothing: rgb(CLOTHING_COLOURS[appearance.clothing] || CLOTHING_COLOURS.rust),
  };
  const { data, width, height } = imageData;
  const isWoman = ['teal', 'rust-woman', 'indigo', 'blue-girl'].includes(variant);
  const hatted = ['rust', 'elder', 'rust-woman'].includes(variant);
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 32) continue;
    const r = data[index], g = data[index + 1], b = data[index + 2];
    const brightness = light(r, g, b);
    // Ink, edge antialiasing, bright apron and white shirt stay painted as authored.
    if (brightness < 38 || Math.min(r, g, b) > 174 && Math.max(r, g, b) - Math.min(r, g, b) < 38) continue;
    const x = (index / 4 % width) / width, y = Math.floor(index / 4 / width) / height;
    const face = y > (hatted ? .205 : .12) && y < .385 && x > .29 && x < .72;
    const hands = y > .36 && y < .77 && (x < .31 || x > .69);
    const warmPigment = r > g * 1.08 && g > b * 1.13 && brightness > 54;
    let part = null;
    if ((face || hands) && warmPigment) part = 'skin';
    else if (y < .385 && y > (hatted ? .18 : .015) && x > .17 && x < .83
      && brightness < (variant === 'elder' ? 207 : 118)
      && (!hatted || y > .245 || x < .34 || x > .66)) {
      // Leave eyes, black outline and hat bands intact. The source sheet supplies the
      // actual hairstyle; this palette pass only dyes its interior strands.
      if (variant === 'elder' ? Math.max(r, g, b) - Math.min(r, g, b) < 45 : r >= g && g >= b * .8) part = 'hair';
    } else if (y > .245 && y < .88 && x > .07 && x < .93) {
      const nearWhite = Math.min(r, g, b) > 115 && Math.max(r, g, b) - Math.min(r, g, b) < 39;
      const skinLikely = warmPigment && hands && x < .25 || warmPigment && hands && x > .75;
      if (!nearWhite && !skinLikely && brightness > 42) part = 'clothing';
    }
    if (!part) continue;
    const original = source[part], desired = target[part];
    // Preserve the painted light/dark value and a little of each original brush mark.
    const ratio = Math.max(.28, Math.min(1.9, brightness / light(...original)));
    const strength = part === 'clothing' && isWoman ? .82 : .86;
    for (let c = 0; c < 3; c++) data[index + c] = clamp((1 - strength) * data[index + c] + strength * desired[c] * ratio);
  }
  return imageData;
}
