// The town lots drawn wider than surveyed (owner, 2026-10-27; sim/town-layouts.mjs `TOWN_SPREAD`, public/gonzales-art.js
// `GONZALES_TALL`). A town's building was drawn about as tall as the people in it - a log house 0.85 of a person to its ridge
// in San Felipe - and raising its height alone piled the street's lots one on another. These hold the decision: a one-storey
// log house about as tall against a person as the family's own house is at home, and every picture of every town - its
// buildings, the keepers at their doors, the names under them - clear of the others and of the water, in every town drawn.
// Worked out as public/town-art.js and public/art.js draw, without a browser (tests/support/town-drawn.mjs); the browser
// proof is `npm run test:towns`, and the pictures are docs/evidence/town-lots-*.png.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { RESIDENTS } from '../sim/town.mjs';
import { GONZALES_PLACES, keepersToTheirDoors } from '../sim/shops.mjs';
import { DRAWN_HEIGHT, FEET_PER_MILE, TOWN_LAYOUTS, TOWN_SPREAD, townDrawnHeight, townPoint, townSpread } from '../sim/town-layouts.mjs';
import { CABIN_PEOPLE, PERSON_MILES } from '../sim/house-footprint.mjs';
import { coloniesMap } from '../sim/colonies-map.mjs';
import { covered, drawnTown, gonzalesArt, personBox, pictureBox, PERSON_FEET } from './support/town-drawn.mjs';

const world = createGonzalesWorld('town-lots', 30, { map: 'colonies' });
const shopsOf = id => world.map.shops?.[id] || [];
/** The closest a student's camera comes (public/app.js `CLOSEST_FIGURE` 90 px a person), where a town's names are all drawn. */
const CLOSEST = 90 / PERSON_MILES;
/** How much of a picture another may cover: a roof's corner over a neighbour's back, not one building on another. */
const SHARED = 0.15;
/** How much of a person a building drawn in front of them may hide before they are lost behind it. */
const HIDDEN = 0.3;
const DOOR = 0.012 * FEET_PER_MILE, STEP_OUT = 0.008 * FEET_PER_MILE;

test('a town of the colonies is drawn three times its survey, and its log house about as tall against a person as the family\'s own', () => {
  assert.equal(TOWN_SPREAD, 3);
  assert.equal(DRAWN_HEIGHT, 4, 'Béxar and the Alamo are drawn at DRAWN_HEIGHT; it does not move with the towns');
  for (const [id, layout] of Object.entries(TOWN_LAYOUTS)) {
    // Goliad is battle ground, as Béxar is: the massacre is staged in its presidio in true miles (sim/battles/goliad-massacre.mjs).
    assert.equal(townSpread(layout), id === 'goliad' ? 1 : TOWN_SPREAD, `${id} is drawn ${townSpread(layout)} times its survey`);
    assert.equal(townDrawnHeight(layout), DRAWN_HEIGHT * townSpread(layout), `${id}'s buildings are not drawn at the height its ground is spread`);
  }
  // A one-storey log house of the research's twenty-two feet, to its ridge, in people: the family's own house is CABIN_PEOPLE.
  const people = feet => feet * townDrawnHeight(TOWN_LAYOUTS['san-felipe']) / PERSON_FEET;
  assert.ok(people(22) >= 2.5 && people(22) <= CABIN_PEOPLE, `a 22-foot log house is drawn ${people(22).toFixed(2)} people tall`);
  for (const id of ['sf-whiteside-hotel', 'sf-smithy']) {
    const building = TOWN_LAYOUTS['san-felipe'].buildings.find(b => b.id === id);
    assert.ok(people(building.height) >= 2 && people(building.height) <= 3.5, `${id} is drawn ${people(building.height).toFixed(2)} people tall`);
  }
  // Gonzales's houses, drawn by their own art, as tall as a 22-foot log house of the colonies' towns.
  const { GONZALES_BUILDINGS, GONZALES_TALL } = gonzalesArt();
  const house = GONZALES_BUILDINGS.find(b => b.sprite === 'house-round-log');
  const gonzales = house.height * GONZALES_TALL / PERSON_MILES;
  assert.ok(Math.abs(gonzales - people(22)) / people(22) < 0.05, `a Gonzales log house is ${gonzales.toFixed(2)} people tall, San Felipe's ${people(22).toFixed(2)}`);
});

test('the lots spread round the town\'s heart: the heart stays on its point, and everything else is three times as far from it', () => {
  const layout = TOWN_LAYOUTS['san-felipe'], heart = layout.spreadFrom || layout.anchor;
  assert.deepEqual(townPoint(layout, heart), { x: 0, y: 0 }, 'San Felipe\'s heart is not on its point');
  for (const building of layout.buildings.slice(0, 8)) {
    const drawn = townPoint(layout, building), surveyed = townPoint({ ...layout, spread: 1 }, building);
    assert.ok(Math.abs(drawn.x - 3 * surveyed.x) < 2e-4 && Math.abs(drawn.y - 3 * surveyed.y) < 2e-4, `${building.id} is not three times as far from the heart`);
  }
  // A point marked `inPlace` keeps its surveyed place; one `heldAt` a place is spread round that place instead.
  const salt = TOWN_LAYOUTS.matagorda.buildings.find(b => b.id === 'mat-saltworks');
  assert.deepEqual(townPoint(TOWN_LAYOUTS.matagorda, salt), townPoint({ ...TOWN_LAYOUTS.matagorda, spread: 1 }, salt));
  const fort = TOWN_LAYOUTS.anahuac.buildings.find(b => b.id === 'anh-fort');
  assert.deepEqual(townPoint(TOWN_LAYOUTS.anahuac, fort), townPoint({ ...TOWN_LAYOUTS.anahuac, spread: 1 }, fort), 'Fort Anahuac moved off its bluff');
});

test('no two pictures of a town stand one on another, but for the pieces of one work', () => {
  const faults = [];
  for (const id of Object.keys(TOWN_LAYOUTS)) {
    const town = drawnTown(id, shopsOf(id));
    for (let i = 0; i < town.length; i++) for (let j = i + 1; j < town.length; j++) {
      const a = town[i], b = town[j];
      if (a.partOf === b.id || b.partOf === a.id || (a.partOf && a.partOf === b.partOf)) continue;
      const share = covered(a.box, b.box);
      if (share > SHARED) faults.push(`${id}: ${a.id} and ${b.id} share ${Math.round(share * 100)}% of the smaller`);
    }
  }
  assert.deepEqual(faults, []);
});

test('every keeper of a drawn town is seen at the door, and stepping out of it, never behind a building in front', () => {
  let keepers = 0;
  const faults = [];
  for (const id of Object.keys(TOWN_LAYOUTS)) {
    const town = drawnTown(id, shopsOf(id));
    for (const own of town.filter(b => b.keeper)) {
      keepers++;
      const keeper = world.entities[shopsOf(id).find(shop => shop.building === own.id).keeperId];
      // The server's door (sim/shops.mjs), which must be the drawn building's.
      assert.ok(Math.abs(keeper.shopSpot.x * FEET_PER_MILE - own.at.x) < 6 && Math.abs(keeper.shopSpot.y * FEET_PER_MILE - own.at.y - DOOR) < 6, `${id}'s ${own.keeper} keeper is not at the door the town draws`);
      for (const out of [0, STEP_OUT]) {
        const me = personBox({ x: own.at.x + out, y: own.at.y + DOOR });
        for (const b of town) if (b.at.y > own.at.y + DOOR && covered(me, b.box) > HIDDEN) faults.push(`${id}: ${keeper.name} ${out ? 'stepping out' : 'at the door'} is behind ${b.id}`);
      }
    }
  }
  assert.ok(keepers >= 30, `only ${keepers} keepers were looked at`);
  assert.deepEqual(faults, []);
});

test('the names of a town\'s buildings are clear of each other and of the keepers, at every zoom a town is drawn at', () => {
  // public/town-art.js `queueTownLabel`: written over the town after everything standing in it (so no roof in front covers
  // one), 12px Georgia, a box 16 px high from 4 px under the building's foot; a keeper's trade, shown from 1,000 px a mile,
  // ends a quarter of a person west of the door the keeper stands at; a building's own name shows from 2,600. The zooms: the
  // Host's framing of a town on a 1366-wide screen (1,097 px a mile), each press of + from it, and the closest.
  const faults = [];
  for (const scale of [1097, 1536, 2150, 3010, 4214, CLOSEST]) {
    const foot = FEET_PER_MILE / scale, person = Math.max(7, Math.min(150, scale * PERSON_MILES)) * foot;
    for (const id of Object.keys(TOWN_LAYOUTS)) {
      const town = drawnTown(id, shopsOf(id));
      const tags = town.filter(b => b.label && scale > (b.keeper ? 1000 : 2600)).map(b => {
        const w = (b.label.length * 6.4 + 6) * foot, right = b.keeper ? b.at.x - person * .25 : b.at.x + w / 2;
        return { b, box: { left: right - w, right, top: b.at.y + 4 * foot, bottom: b.at.y + 20 * foot } };
      });
      for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) if (covered(tags[i].box, tags[j].box) > 0.2) faults.push(`${scale}: ${id}: ${tags[i].b.label} over ${tags[j].b.label}`);
      for (const tag of tags) for (const keeper of town.filter(b => b.keeper)) for (const out of [0, STEP_OUT]) {
        if (covered(personBox({ x: keeper.at.x + out, y: keeper.at.y + DOOR }, person), tag.box) > 0.1) faults.push(`${scale}: ${id}: ${tag.b.label} over the ${keeper.keeper}${out ? ' stepping out' : ''}`);
      }
    }
  }
  assert.deepEqual(faults, []);
});

test('no building of a spread town is drawn over the water the map draws', () => {
  // A river is drawn a twentieth of a mile wide and a creek 0.012 (public/map-base.js `WATER`). A ferry, a skiff or a store
  // built out over the river stands on it on purpose (`onWater`); a tree's crown may hang over the bank, its foot held clear
  // by tests/towns.test.mjs.
  const map = coloniesMap(), faults = [];
  const ps = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1e-12; const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)); return Math.hypot(p.x - a.x - k * dx, p.y - a.y - k * dy); };
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const meet = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0 ? 0 : Math.min(ps(a, c, d), ps(b, c, d), ps(c, a, b), ps(d, a, b));
  const reach = (box, a, b) => {
    if ([a, b].some(p => p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom)) return 0;
    const c = [{ x: box.left, y: box.top }, { x: box.right, y: box.top }, { x: box.right, y: box.bottom }, { x: box.left, y: box.bottom }];
    return Math.min(...c.map((p, i) => meet(a, b, p, c[(i + 1) % 4])));
  };
  for (const id of Object.keys(TOWN_LAYOUTS)) {
    const site = map.places[id], local = p => ({ x: (p.x - site.x) * FEET_PER_MILE, y: (p.y - site.y) * FEET_PER_MILE });
    const water = map.watercourses.filter(c => c.points.some(p => Math.hypot(p.x - site.x, p.y - site.y) < 5))
      .flatMap(c => c.points.slice(1).map((q, i) => ({ name: c.name, a: local(c.points[i]), b: local(q), half: (c.kind === 'river' ? 0.05 : 0.012) * FEET_PER_MILE / 2 })));
    for (const b of drawnTown(id, shopsOf(id))) {
      if (b.onWater || /pecan|oak/.test(b.sprite)) continue;
      const wet = water.find(w => reach(b.box, w.a, w.b) < w.half);
      if (wet) faults.push(`${id}: ${b.id} is drawn over ${wet.name}`);
    }
  }
  assert.deepEqual(faults, []);
});

test('Gonzales\'s taller houses stand clear of each other and of its people: keepers, residents\' rounds and the scenes\' places', () => {
  const { GONZALES_BUILDINGS, GONZALES_PROPS, GONZALES_TALL } = gonzalesArt();
  // In miles; a barrel, sacks, a crate or firewood at a door is drawn at a person's size and may stand before the building.
  const pictures = [
    ...GONZALES_BUILDINGS.map(b => ({ id: b.id, y: b.y, box: pictureBox(b.sprite, b, b.height * GONZALES_TALL) })),
    ...GONZALES_PROPS.filter(([, , sprite]) => !/barrel|sacks|crate|firewood/.test(sprite)).map(([x, y, sprite, height], i) => ({ id: `${sprite} ${i}`, y, box: pictureBox(sprite, { x, y }, height) })),
  ];
  const faults = [];
  for (let i = 0; i < pictures.length; i++) for (let j = i + 1; j < pictures.length; j++) if (covered(pictures[i].box, pictures[j].box) > SHARED) faults.push(`${pictures[i].id} and ${pictures[j].id}`);
  // sim/town-scenes.mjs `PLACES` (not exported): where its scenes stand the town's people.
  const places = { street: { x: -0.03, y: 0.035 }, orchard: { x: -0.22, y: -0.05 }, shop: { x: -0.30, y: -0.225 }, flagHouse: { x: -0.10, y: -0.212 }, muster: { x: 0.10, y: 0.012 }, leavingHouse: { x: 0.13, y: -0.205 } };
  const people = [
    ...RESIDENTS.flatMap(r => r.round.map((p, i) => [`${r.name}'s round ${i}`, p])),
    ...Object.entries(GONZALES_PLACES).flatMap(([trade, p]) => [[`the ${trade} at the door`, { x: p.x, y: p.y + 0.012 }], [`the ${trade} stepping out`, { x: p.x + 0.008, y: p.y + 0.012 }]]),
    ...Object.entries(places).map(([name, p]) => [`the scene at ${name}`, p]),
  ];
  for (const [who, feet] of people) {
    const me = personBox(feet, PERSON_MILES);
    for (const picture of pictures) if (picture.y > feet.y && covered(me, picture.box) > HIDDEN) faults.push(`${who} is behind ${picture.id}`);
  }
  assert.deepEqual(faults, []);
});

test('a class saved before the lots were spread opens with its keepers at the doors the town now draws', () => {
  const old = createGonzalesWorld('town-lots-save', 30, { map: 'colonies' });
  const shops = old.map.shops['san-felipe'], layout = TOWN_LAYOUTS['san-felipe'];
  // The keepers where the surveyed town had them, as a save written before 2026-10-27 holds them.
  for (const shop of shops) {
    const surveyed = townPoint({ ...layout, spread: 1 }, layout.buildings.find(b => b.id === shop.building));
    Object.assign(shop, surveyed);
    old.entities[shop.keeperId].shopSpot = { x: surveyed.x, y: +(surveyed.y + 0.012).toFixed(3) };
  }
  keepersToTheirDoors(old);
  for (const shop of shops) {
    const now = townPoint(layout, layout.buildings.find(b => b.id === shop.building)), keeper = old.entities[shop.keeperId];
    assert.deepEqual([shop.x, shop.y], [now.x, now.y], `the ${shop.trade}'s shop is drawn where the surveyed town had it`);
    assert.ok(Math.abs(keeper.shopSpot.x - now.x) < 1e-9 && Math.abs(keeper.shopSpot.y - (now.y + 0.012)) < 1e-3, `${keeper.name} keeps the surveyed door`);
  }
});
