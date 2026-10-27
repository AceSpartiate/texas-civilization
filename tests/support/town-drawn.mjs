// What a town of the colonies draws, worked out the way public/town-art.js and public/art.js draw it, in feet of the map
// as the screen shows them (x east, y down the screen), without a browser: each building's drawn box, its keeper's figure
// and name tags. For tests/town-lots.test.mjs, which holds the town lots drawn wider than surveyed (owner, 2026-10-27).
import { readFileSync } from 'node:fs';
import { FEET_PER_MILE, TOWN_LAYOUTS, townDrawnHeight, townPoint, townSpread } from '../../sim/town-layouts.mjs';
import { PERSON_MILES } from '../../sim/house-footprint.mjs';

const atlas = JSON.parse(readFileSync(new URL('../../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8')).frames;
export const frameOf = name => atlas[name];
/** A person as the map draws one, in feet of the map: `PERSON_MILES` high, about four tenths as wide. */
export const PERSON_FEET = PERSON_MILES * FEET_PER_MILE;

/**
 * Every building of a town, as drawn: its id, its point (feet east and south of the town's site point), the sprite drawn
 * (the keeper's trade sprite where a keeper keeps it, as `townDrawables` does), its requested height and its box on the
 * screen in feet. `shops` is `world.map.shops[id]`: { building, trade, sprite }.
 */
export function drawnTown(id, shops = []) {
  const layout = TOWN_LAYOUTS[id], height = townDrawnHeight(layout), spread = townSpread(layout);
  const kept = new Map(shops.filter(shop => shop.building).map(shop => [shop.building, shop]));
  return layout.buildings.map(building => {
    const p = townPoint(layout, building), at = { x: p.x * FEET_PER_MILE, y: p.y * FEET_PER_MILE };
    const shop = kept.get(building.id), sprite = shop?.sprite || building.sprite;
    const frame = atlas[sprite];
    const tall = building.drawWidthFeet ? building.drawWidthFeet * spread * (frame.logicalHeight || frame.h) / frame.w : building.height * height;
    return { id: building.id, sprite, keeper: shop?.trade || null, label: shop?.label || building.label || null, partOf: building.partOf || null, onWater: Boolean(building.onWater), at, tall, box: pictureBox(sprite, at, tall, building.anchor) };
  });
}

/** How much of the smaller of two boxes the other covers, 0 to 1. */
export function covered(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (w <= 0 || h <= 0) return 0;
  const area = box => (box.right - box.left) * (box.bottom - box.top);
  return w * h / Math.min(area(a), area(b));
}

/** The drawn Gonzales (public/gonzales-art.js), read as the browser reads it but without its imports, which are the page's. */
export function gonzalesArt() {
  const source = readFileSync(new URL('../../public/gonzales-art.js', import.meta.url), 'utf8').replace(/^import .*$/mg, '').replace(/^export /mg, '');
  return new Function(`${source}; return { GONZALES_BUILDINGS, GONZALES_PROPS, GONZALES_TALL };`)();
}

/** A picture's box on the screen, in the units its point and height are given in. */
export function pictureBox(sprite, at, tall, anchor) {
  const frame = atlas[sprite], k = tall / (frame.logicalHeight || frame.h), w = frame.w * k, h = frame.h * k;
  const [ax, ay] = anchor || [frame.anchorX, frame.anchorY];
  return { left: at.x - w * ax, right: at.x - w * ax + w, top: at.y - h * ay, bottom: at.y - h * ay + h };
}

/** A person standing at `feet`, as a box `PERSON_FEET` high and four tenths as wide, in feet. */
export const personBox = (feet, tall = PERSON_FEET) => ({ left: feet.x - tall * .2, right: feet.x + tall * .2, top: feet.y - tall, bottom: feet.y });
