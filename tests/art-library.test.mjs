import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildManifest, decodeRgba, root, SHEETS } from '../scripts/build-atlas-manifest.mjs';
import { pending } from '../scripts/art-deliveries/index.mjs';
import { GROUND_CLASSES } from '../public/ground-classes.js';
import { GALE_POSES } from '../public/weather-art.js';
import { KINDS, SIZES } from '../sim/woods.mjs';
import { TOWN_LAYOUTS } from '../sim/town-layouts.mjs';
import { ALAMO_FACES } from '../public/alamo-faces.js';

const manifest = JSON.parse(readFileSync(root + 'atlas.json', 'utf8'));
const expected = Object.values(SHEETS).flat().filter(Boolean);

// A shipped manifest whose rectangles no longer match the shipped art is the worst
// failure this library can have, because nothing throws: every sprite simply draws a
// slice of the wrong picture, or half of the right one. Re-measuring the atlases and
// comparing is the only check that catches it.
test('atlas.json still describes the art that is actually shipped', () => {
  // A picture from a batch still waiting for the rest of its delivery (its provenance, say) sits on disk unregistered and unused.
  const waiting = new Set(pending.map(entry => `${entry.sheet}.png`));
  assert.deepEqual(readdirSync(root + 'atlases').filter(name => /\.png$/i.test(name) && !waiting.has(name)).sort(), Object.values(manifest.sheets).map(sheet => sheet.image.split('/').at(-1)).sort(), 'every runtime PNG must be inventoried');
  assert.deepEqual(buildManifest(), manifest, 'atlas.json is stale - rerun node scripts/build-atlas-manifest.mjs');
  assert.deepEqual(Object.keys(manifest.frames), expected, 'frame names and reading order must match the generation prompts');
});

test('every frame is a usable sprite: inside its sheet, non-empty, and standing on its own anchor', () => {
  const images = {};
  for (const [name, sheet] of Object.entries(manifest.sheets)) {
    images[name] = decodeRgba(readFileSync(root + sheet.image));
    assert.equal(images[name].width, sheet.width, `${name} width`);
    assert.equal(images[name].height, sheet.height, `${name} height`);
  }
  const boxes = [];
  for (const [name, frame] of Object.entries(manifest.frames)) {
    const image = images[frame.sheet];
    assert.ok(image, `${name} names a sheet that exists`);
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.w <= image.width && frame.y + frame.h <= image.height, `${name} lies inside its sheet`);
    // An anchor outside the frame would place the sprite beside the ground it stands on.
    assert.ok(frame.anchorX >= 0 && frame.anchorX <= 1 && frame.anchorY >= 0 && frame.anchorY <= 1, `${name} anchor is inside its frame`);
    // Feet, not head or middle: everything in this library stands on its base.
    assert.ok(frame.anchorY > 0.6, `${name} anchor is near the base, not up the body (got ${frame.anchorY})`);
    let visible = 0;
    for (let y = frame.y; y < frame.y + frame.h; y++) {
      for (let x = frame.x; x < frame.x + frame.w; x++) if (image.data[(y * image.width + x) * 4 + 3] > 24) visible++;
    }
    assert.ok(visible > 1200, `${name} is a real sprite and not empty transparency (${visible} visible pixels)`);
    // The anchor row must have something on it, or the sprite floats above its shadow.
    const anchorRow = frame.y + Math.round(frame.anchorY * (frame.h - 1));
    let onAnchor = 0;
    for (let x = frame.x; x < frame.x + frame.w; x++) if (image.data[(anchorRow * image.width + x) * 4 + 3] > 40) onAnchor++;
    assert.ok(onAnchor > 0, `${name} has art on its ground line`);
    boxes.push({ name, frame });
  }
  // Overlapping frames would draw a neighbour's canopy into this sprite's corner.
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.frame.sheet !== b.frame.sheet) continue;
    const apart = a.frame.x + a.frame.w <= b.frame.x || b.frame.x + b.frame.w <= a.frame.x
      || a.frame.y + a.frame.h <= b.frame.y || b.frame.y + b.frame.h <= a.frame.y;
    assert.ok(apart, `${a.name} and ${b.name} overlap in ${a.frame.sheet}`);
  }
});

/**
 * Every name the data hands the renderer has to be a frame the library really has.
 *
 * A delivery is wired by changing a name in a table - a tree's `picture`, a mark's `sprite`, a town building's `sprite` -
 * and a name that is a letter out draws nothing at all, silently, with the fallback shape standing in its place. Nothing
 * else in the project would notice. Written when Astra's trees-colonies-2, town-buildings-researched and
 * biome-ground-bexar sheets were wired in on 2026-09-21, which moved about forty of these names at once.
 */
test('every sprite the simulation names is a frame the library actually has', () => {
  const names = new Set(Object.keys(manifest.frames));
  const missing = [];
  // The trees of the woods: each kind's picture, at its three sizes where its art is `sized`, and its stump.
  for (const [id, kind] of Object.entries(KINDS)) {
    for (const want of kind.sized ? SIZES.map(size => `${kind.picture}-${size}`) : [kind.picture]) if (!names.has(want)) missing.push(`tree ${id} -> ${want}`);
    if (kind.stump && !names.has(kind.stump)) missing.push(`tree ${id} stump -> ${kind.stump}`);
  }
  // The scattered marks of every class of ground.
  for (const [id, klass] of Object.entries(GROUND_CLASSES)) for (const mark of klass.marks) if (mark.sprite && !names.has(mark.sprite)) missing.push(`ground ${id} -> ${mark.sprite}`);
  // Every building and wall piece of every town drawn from its research.
  for (const [id, layout] of Object.entries(TOWN_LAYOUTS)) {
    for (const building of layout.buildings) if (!names.has(building.sprite)) missing.push(`${id} -> ${building.sprite}`);
    for (const wall of layout.walls || []) for (const piece of [wall.sprite, wall.breach]) if (piece && !names.has(piece)) missing.push(`${id} wall -> ${piece}`);
  }
  // Each country wears its own plants (`biome-ground-bexar`, 2026-09-21). Checked class by class, because a class quietly
  // put back on a stand-in would leave the frame in use somewhere else and nothing else here would notice.
  const WEARS = {
    'tallgrass-prairie': 'grass-tall', longleaf: 'grass-tall', canebrake: 'cane-1', thicket: 'palmetto',
    'cypress-swamp': 'cypress-knees', marsh: 'marsh-cordgrass', 'salt-prairie': 'marsh-cordgrass', sand: 'dune-grass',
    chaparral: 'thicket-thorn-1', brush: 'yucca', 'mesquite-savanna': 'thicket-thorn-2', 'thorn-riparian': 'thicket-thorn-1',
  };
  for (const [id, sprite] of Object.entries(WEARS)) {
    if (!GROUND_CLASSES[id].marks.some(mark => mark.sprite === sprite)) missing.push(`ground ${id} no longer wears ${sprite}`);
  }
  // Every surface the Alamo's compound is drawn with (public/alamo-faces.js). tests/alamo-faces.test.mjs holds which one
  // goes on what; this holds that each is a frame the library really has, because a name a letter out draws nothing at
  // all, silently, with a flat wash standing in its place.
  for (const sprite of Object.values(ALAMO_FACES)) if (!names.has(sprite)) missing.push(`alamo face -> ${sprite}`);
  // The norther's painted gale poses stand for sprites the ground really scatters, and are frames themselves.
  const scattered = new Set([...Object.values(GROUND_CLASSES).flatMap(klass => klass.marks.map(mark => mark.sprite)), 'oak-broad', 'oak-spreading', 'pecan']);
  for (const [upright, pose] of Object.entries(GALE_POSES)) {
    if (!names.has(pose)) missing.push(`gale ${upright} -> ${pose}`);
    if (!scattered.has(upright)) missing.push(`gale pose for ${upright}, which nothing draws`);
  }
  assert.deepEqual(missing, []);
});

/**
 * A delivered sheet that nothing draws is the failure this test exists to stop.
 *
 * On 2026-09-21 Astra delivered nine batches at once. Eight of them were registered in `atlas.json`, measured, validated,
 * written up in delivery notes - and drawn by nothing at all, for a day, with no test anywhere the poorer for it. The
 * library cannot tell the difference between art in the game and art in a folder, so this does: every frame of a sheet
 * whose binding is a literal sprite or clip name must be named somewhere in `sim/` or `public/` outside a comment, or be
 * listed here as knowingly not drawn with the reason why.
 *
 * The two `people-cast2-*` sheets are not listed: their frames are reached through `${variant}-${pose}` templates that no
 * text search can see, and tests/motion-binding.test.mjs holds them instead by asking `castVariant` for every figure a
 * rolled family can produce and requiring each pose's clip to exist.
 */
const NOT_DRAWN = Object.freeze({
  // The hunt has two projected states for a quarry - standing, and alert while the family is asked about the shot - so
  // the two cycles that would need a third and a fourth are registered and wait for one. The bound (running) frames want
  // a missed-shot state the simulation does not project; the wing display wants a spring gobbler's strut it has no
  // season for.
  'turkey-bound-1': 'no missed-shot state is projected', 'turkey-bound-2': 'no missed-shot state is projected',
  'turkey-bound-3': 'no missed-shot state is projected', 'turkey-bound-4': 'no missed-shot state is projected',
  'turkey-display-1': 'no strutting state is projected', 'turkey-display-2': 'no strutting state is projected',
  'turkey-display-3': 'no strutting state is projected', 'turkey-display-4': 'no strutting state is projected',
  // Victoria has one Round Top House and Liberty one court room; the second view of each is for a layout that wants it
  // turned, and Mina's gate is drawn open because nothing in the game ever shuts it.
  'round-top-house-weathered': 'Victoria has one Round Top House',
  'liberty-court-room-side': 'Liberty has one court room, drawn front on',
  'mina-stockade': 'the gate is drawn open; nothing in the game shuts it',
  // The map says where a ferry is, never who is on the water at this moment.
  'ferry-flatboat-laden': 'nothing says a wagon is aboard',
  // The Yellow Stone has two projected states and no more (sim/houston.mjs `yellowStone`): `cotton`, lying at Groce's
  // landing for Captain Ross, and `crossing`, which the server places in the middle of the water between the two banks
  // with the army aboard - `steamboat-laden`, under way. So the still-water beats and the plank-out beat have no moment
  // to be drawn in. `steamboat-moored-3` was drawn for `crossing` until 2026-09-21, at a point that is not a bank.
  'steamboat-moored-1': 'she is never simply lying at anchor', 'steamboat-moored-2': 'she is never simply lying at anchor',
  'steamboat-moored-3': 'the crossing is projected in the middle of the water, not at a bank with the plank out',
  'steamboat-steam-1': 'nothing projects her steaming light', 'steamboat-steam-2': 'nothing projects her steaming light',
  'steamboat-steam-3': 'nothing projects her steaming light', 'steamboat-steam-4': 'nothing projects her steaming light',
  // The hunt projects a quarry standing, and alert while the family is asked about the shot. Nothing says it broke and
  // ran: there is no missed-shot state, which is the same reason the turkey's bound frames are up there.
  'mustang-gallop-1': 'no fleeing or missed-shot state is projected', 'mustang-gallop-2': 'no fleeing or missed-shot state is projected',
  'mustang-gallop-3': 'no fleeing or missed-shot state is projected', 'mustang-gallop-4': 'no fleeing or missed-shot state is projected',
  'mustang-gallop-5': 'no fleeing or missed-shot state is projected', 'mustang-gallop-6': 'no fleeing or missed-shot state is projected',
  'mustang-gallop-7': 'no fleeing or missed-shot state is projected', 'mustang-gallop-8': 'no fleeing or missed-shot state is projected',
  // The pieces exist; the courses do not. Where each ditch ran is a researched line and a claim ID, not a sprite
  // (docs/ART_REQUESTS.md, request 2026-09-19 - Bexar's fields and acequias).
  'acequia-straight': 'no acequia courses are laid yet', 'acequia-bend': 'no acequia courses are laid yet',
  'acequia-crossing': 'no acequia courses are laid yet', 'fence-brush': 'no acequia courses are laid yet',
});
test('every frame of a delivered sheet is drawn somewhere, or is written down here as knowingly not drawn', async () => {
  const clips = JSON.parse(readFileSync(root + 'animation.json', 'utf8')).clips;
  const here = fileURLToPath(new URL('../', import.meta.url));
  const files = ['sim', 'public'].flatMap(dir => readdirSync(here + dir).filter(name => /\.m?js$/.test(name)).map(name => `${here}${dir}/${name}`));
  // Comments do not count. A sprite named only in a note about why it is not used yet is exactly the case this catches.
  const strip = text => text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const source = files.map(file => strip(readFileSync(file, 'utf8'))).join('\n');
  // Whole names only: `mina-stockade-house` is an id in a layout and is not a use of the frame `mina-stockade`.
  const named = name => new RegExp(`${name}(?![-\\w])`).test(source);
  const clipsWith = name => Object.entries(clips).filter(([, clip]) => clip.frames.some(frame => frame.sprite === name)).map(([id]) => id);
  /**
   * The clips a seat really asks for, got by asking `seatedClip` itself.
   *
   * `${figure}-ride-${direction}` and `${figure}-wagon-driver-${direction}` are built out of pieces, and no text search can
   * see a name that is never written down. Rather than excuse those four sheets from this test, the enumeration below runs
   * the real function over every figure a rolled family can produce and every heading, and a clip it never returns stays
   * unbound. It proves the *choice*, not the drawing: that public/app.js `drawSeated` then puts it on the screen is what
   * scripts/riding-browser-proof.mjs photographs.
   */
  const { seatedClip, seatFigure } = await import('../public/motion.js');
  const asked = new Set();
  for (const sex of ['male', 'female', undefined]) for (const band of ['adult', 'youth', 'child', 'small', 'infant']) for (const principal of [false, true]) {
    for (let n = 0; n < 40; n++) for (const seat of ['horse', 'wagon', null]) for (const direction of ['e', 'w', 'n', 's']) {
      asked.add(seatedClip({ id: `hh-${n}-x`, kind: 'person', health: { condition: 'well' }, sex, band, principal }, direction, seat).id);
    }
  }
  void seatFigure;
  const bound = name => {
    if (named(name)) return true;
    const inClips = clipsWith(name);
    if (inClips.some(named)) return true;
    if (inClips.some(id => asked.has(id))) return true;
    // A tree's three sizes are drawn as `${picture}-${size}`, so its picture being named is the binding.
    const sized = /^(.*)-(pole|log|large)$/.exec(name);
    return Boolean(sized && named(sized[1]));
  };
  const SHEETS = ['weather-norther', 'wildlife-turkey', 'trees-colonies-2', 'town-buildings-researched',
    'ferry-flatboat', 'steamboat-moored', 'biome-ground-bexar',
    // Astra's deliveries of 2026-09-21, wired the same day: the mounted family, the seated wagon drivers, the mustang,
    // the Yellow Stone under way, and the Alamo's south-facing elevations.
    'people-mounted-cast1-e', 'people-mounted-cast1-s', 'people-mounted-cast1-n',
    'people-mounted-cast2-e', 'people-mounted-cast2-s', 'people-mounted-cast2-n',
    'people-wagon-drivers', 'wildlife-mustang', 'steamboat-steam', 'steamboat-laden', 'alamo-face-strips'];
  const unbound = [], stale = [];
  for (const sheet of SHEETS) {
    for (const [name, frame] of Object.entries(manifest.frames)) {
      if (frame.sheet !== sheet) continue;
      if (bound(name)) { if (NOT_DRAWN[name]) stale.push(`${name} is drawn after all: take it off the list`); continue; }
      if (!NOT_DRAWN[name]) unbound.push(`${sheet}: ${name} is registered and drawn by nothing`);
    }
  }
  assert.deepEqual(unbound, []);
  assert.deepEqual(stale, []);
});

// The library is an enhancement, never a dependency. If the sheets fail to arrive the
// map must still draw, so nothing in the renderer may assume a sprite is there.
test('the renderer treats every sprite as optional', () => {
  const app = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  const art = readFileSync(fileURLToPath(new URL('../public/art.js', import.meta.url)), 'utf8');
  assert.match(art, /return 0;/, 'drawSprite reports when it could not draw');
  assert.match(art, /image\.onerror/, 'a sheet that fails to load is survivable, not an exception');
  // Every drawSprite call is either guarded by its return value or is decoration whose
  // absence costs nothing. These four carry the farm, so each must have a fallback.
  // The ground's scattered marks come from the classes of ground (public/ground-classes.js): every mark that names a sprite
  // names the shape drawn without it, and the renderer draws that shape when the sprite does not draw.
  assert.match(app, /if \(mark\.sprite && drawSprite\(ctx, mark\.sprite[^\n]*\)\) return;/, 'a mark falls through to its shape when its sprite does not draw');
  for (const shape of ['rock', 'bush', 'tuft']) assert.ok(app.includes(`mark.fallback === '${shape}'`), `the renderer draws the ${shape} shape`);
  for (const [id, kind] of Object.entries(GROUND_CLASSES)) {
    for (const mark of kind.marks) if (mark.sprite) assert.ok(['rock', 'bush', 'tuft'].includes(mark.fallback), `${id}'s ${mark.sprite} has a drawn fallback`);
  }
  for (const guarded of ['grass-tuft', 'rocks']) assert.ok(GROUND_CLASSES.prairie.marks.some(mark => mark.sprite === guarded && mark.fallback), `${guarded} has a drawn fallback`);
  for (const guarded of ['oak-broad']) {
    assert.match(app, new RegExp(`!drawSprite\\(ctx, ('|\\w+ \\? ')?${guarded}|hasSprite\\('${guarded}'\\)`), `${guarded} has a drawn fallback`);
  }
  assert.match(app, /if \(drawSprite\(ctx, pickSprite\(HOMESTEAD_CABINS/, 'a homestead falls back to the drawn cabin');
  assert.match(app, /loadArt\(\)/, 'the page asks for the library');
  assert.doesNotMatch(app, /await loadArt/, 'nothing waits on the art before drawing the world');
});
