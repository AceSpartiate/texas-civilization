// Every art item not yet delivered by Astra, in one table: the source of docs/CLAUDE_ART_PLAN.md (what Claude's builders
// draw, area by area) and of "What Astra still needs to make" in docs/ART_REQUESTS.md (what retires each stand-in). Both are
// written from here by scripts/claude-art/write-plan.mjs, so they cannot drift apart; tests/claude-standins.test.mjs fails if
// either file is stale, if a `stand-in:` comment in the code names nothing on this list, or if a Claude-drawn frame is on no
// item. An item whose Claude stand-in has landed stays on the list - Astra's art still replaces it - marked as such, which the
// writer reads from the Claude manifest (public/assets/claude-standins/atlas.json) by the item's `names`.
//
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// An item:
//   id        stable key (area letter and number)          area      A-F (AREAS)
//   priority  1 (first) to 3                              request   the request's heading in ART_REQUESTS.md, exactly
//   item      which of its numbered items, if any         deliver   the frame and clip names to deliver, in words
//   names     patterns (`*` any run of name characters; `<cast>` the eight grown cast figures; `<child>` girl, boy and
//             smallchild) matched against Claude's frames and clips to say a Claude stand-in is in place
//   frames    frames, directions        size   the contract size        plugs   where it plugs in
//   standIn   what stands in now        kind   'library' (Astra's art reused), 'code' (drawn in canvas or CSS), 'words'
//             (told, not drawn), 'claude' (a Claude-drawn frame), 'none'
//   status    'open', or 'skipped: <why>' (delivered, withdrawn, on hold, or not art)
//   research  what needs historical research first, if anything; famous people are original interpretations, never likenesses
//   phrases   extra words a `stand-in:` comment may use to name this item (most name its request's date)

/** The key each area's modules export as AREA (scripts/claude-art/areas/*.mjs). */
export const AREA_KEYS = Object.freeze({ A: 'work', B: 'children', C: 'battles', D: 'transport', E: 'places', F: 'land' });
export const AREAS = Object.freeze({
  A: { title: 'People at work and ambient poses', scope: 'the eight grown cast figures\' action poses at home and in town, ambient life, the Gonzales town scenes, layered people; the wood pile' },
  B: { title: 'Children, babies and sickness', scope: 'girl, boy, smallchild and infant poses, holding and carrying a baby, the sick lying down, and their icons and marks' },
  C: { title: 'Soldiers, battles and famous people', scope: 'the family\'s people and the armies fighting, at rest and carrying the wounded; battle works and props; the famous people and the Esparza family' },
  D: { title: 'Riders, horses, wagons, carreta, ferry, steamboat', scope: 'everything on a horse, a mule or in a vehicle: mounted cast and children, drivers, riders in the bed, carts and wheels, the milk cow, cavalry, herds' },
  E: { title: 'Buildings, houses, towns, Béxar, the Alamo, interiors', scope: 'house pieces from their other sides, roofs, interiors, civic and researched buildings, places, and Béxar\'s own people and fandango' },
  F: { title: 'Terrain, trees, the norther, fields, icons, marks and effects', scope: 'trees and their gale poses, river banks, fog, marsh, night and dawn grades, smoke, work effects, the family panel\'s marks and portraits, the army camp' },
});

// Contract sizes, in the words of the requests (ART_REQUESTS.md) and Claude's equivalents (scripts/claude-art/kit).
const PEOPLE = 'People contract (request 2026-09-12): the figure\'s own logical height and foot baseline, east-facing and mirrored for west; Claude: `personFrame`, 400×400 cell, logical height 300, ground at y 372';
const BATTLE = 'Battle people: the `volunteer-*`/`regular-*` logical height on the ground anchor, east mirrored for west; Claude: `personFrame` with the volunteer or regular figure';
const MOUNTED = 'Mounted: the courier\'s cell size and ground anchor, drawn at 1.8 of a person (`MOUNTED_HEIGHT`); Claude: `mountedFrame`, 480×560, logical height 540';
const ICON = 'Action icon: 128×128, transparent, one silhouette, thin dark outline, reads at 34–38 CSS px and dimmed to 40%';
const MARK = 'Mark: 96×96, transparent, no text, reads at 22–24 CSS px';
const PROP = 'Prop: transparent, anchored at its base, at the scale of the sprites it stands beside';
const BUILDING = 'Building: the house-modules or town-buildings style, corner-on three-quarter view, anchored at the base centre, seats and ground corners measurable';
const PLACE = 'Map cutout as `public/place-art.js` gives the places past the box';
const GROUND = 'Ground piece: seen from above at the map\'s scale, transparent, tiles or scatters';
const FX = 'Effect: 3 frames on the ground anchor of the work, one played from the strike';
const LAYER = 'A full-view light layer the renderer lays over the ground and figures (not a sprite); must not snap when the pace changes';

const CAST = '`rust`, `teal`, `elder`, `blue`, `rust-woman`, `indigo`, `ochre`, `blue-girl`';
const R = {
  work: 'Request 2026-09-28 — people at work',
  ambient: 'Request 2026-09-28 — ambient life',
  help: 'Request 2026-09-28 — the oldest child going for help',
  troops: 'Request 2026-09-27 — Mexican troops after a family on the road',
  sick: 'Request 2026-09-27 — sickness: the sick badge, the sickness icons, and the sick lying down',
  cow: 'Request 2026-09-27 — the milk cow on the run, and Béxar before the bell',
  esparza: 'Request 2026-09-26 — the Esparza family',
  bell: 'Request 2026-09-26 — the bell at Béxar',
  play: 'Request 2026-09-26 — children at play, babies, and the Runaway Scrape\'s own work',
  advance: 'Request 2026-09-26 — the Mexican advance',
  famous: 'Request 2026-09-26 — the famous people: the roster\'s remaining figures and poses',
  storming: 'Request 2026-09-25 — the storming of Béxar',
  alamo: 'Request 2026-09-25 — the Alamo: ladders, the guns served, the walls manned, night',
  sanjac: 'Request 2026-09-25 — San Jacinto',
  gonzales: 'Request 2026-09-25 — Gonzales before the fight',
  carreta: 'Request 2026-09-25 — the carreta',
  riders: 'Request 2026-09-25 — riders, walkers and the cart',
  roof: 'Request 2026-09-24 — one roof over a two-pen house',
  sides: 'Request 2026-09-23 — the house from its other sides',
  lesson: 'Request 2026-09-21 — the guided start\'s marks',
  norther: 'Request 2026-09-20 — the country in a norther: trees and grass bent by the wind',
  country: 'Request 2026-09-19 — the country of 1836: trees and ground cover',
  fields: 'Request 2026-09-19 — Béxar\'s fields and acequias',
  game: 'Request 2026-09-19 — the game of 1836',
  shops: 'Request 2026-09-16 — the shops of the towns',
  roadIcons: 'Request 2026-09-16 — the road\'s icons',
  campIcons: 'Request 2026-09-16 — the camp\'s icons',
  marks: 'Request 2026-09-16 — the family panel\'s marks',
  portraits: 'Request 2026-09-15 — face portraits for the family panel',
  plot: 'Request 2026-09-15 — the house plot\'s pieces',
  trees: 'Request 2026-09-15 — the trees of the colonies',
  townBuildings: 'Request 2026-09-16 — the buildings the towns\' research found',
  driving: 'Request 2026-09-16 — driving the ox wagon',
  horseback: 'Request 2026-09-14 — family members on horseback',
  civic: 'Request 2026-09-14 — Béxar civic architecture',
  settling: 'Request 2026-09-12 (second) — settling in: houses, interiors, furnishings, and people whose looks can be chosen',
  families: 'Request 2026-09-12 — families that look like who they are, and a rider who gets down',
  coleto: 'Request 2026-09-25 — Coleto and Goliad',
  battles: 'Request 2026-09-25 — battles: the pieces the engine stands in for',
  south: 'Request 2026-09-25 — the south\'s fights: San Patricio by night and Agua Dulce Creek',
  concepcion: 'Request 2026-09-25 — Concepción and the Grass Fight',
  seguin: 'Request 2026-09-27 — Seguín, the ashes, and the later church claim',
  garden: 'Request 2026-09-28 — the garden — WITHDRAWN 2026-09-28',
  armies: 'Claude-drawn stand-ins (replace with Astra\'s)',
};

export const ITEMS = [
  // ---------------------------------------------------------------- A: people at work and ambient poses
  { id: 'A1', area: 'A', priority: 1, request: R.work, item: 'item 1', deliver: '`<cast>-chop` (felling with an axe) for each of the eight: `<figure>-chop-1`..`-4`, clip `<figure>-chop`, the axe landing on frame 3', names: ['<cast>-chop', '<cast>-chop-*'],
    frames: '4 frames each, east', size: PEOPLE, standIn: 'the hoeing cycle (`-work`) with a felling axe drawn over the hoe in canvas, chips on the strike; rust in Claude\'s `rust-chop`', kind: 'code', plugs: '`STROKES.chop` (`drawn`) in `public/work-art.js`, drawn by `drawAtWork` in `public/app.js`', status: 'open', phrases: ['every stroke marked \'stand-in\''] },
  { id: 'A2', area: 'A', priority: 1, request: R.work, item: 'item 16', deliver: '`wood-pile-1`, `wood-pile-2`, `wood-pile-3`, `wood-pile-4` (about 10, 20, 30, 40 logs)', names: ['wood-pile-*'],
    frames: 'one sprite a size', size: 'A pile of wall logs three-quarter on the ground anchor, about as long as `log-fallen`, no taller than a person\'s waist; Claude: 448×320 cell drawn at 1.2 of a person', standIn: 'Claude\'s `wood-pile-1`..`-4`; without the sheet, `log-fallen` laid side by side', kind: 'claude', plugs: 'the wood pile in `drawWorld`, `public/app.js` (`window.__woodPileSprite`)', status: 'open', phrases: ['a pile is `log-fallen`'] },
  { id: 'A3', area: 'A', priority: 1, request: R.work, item: 'item 3', deliver: '`<cast>-notch` (4 frames: notching a wall log\'s end with an axe) and `<cast>-lift` (2 frames: stooped under a log end, the log end at the shoulder; two facing across the frame read as one log lifted)', names: ['<cast>-notch', '<cast>-notch-*', '<cast>-lift', '<cast>-lift-*'],
    frames: '4 and 2 frames, east', size: PEOPLE, standIn: 'the hoeing cycle with a drawn axe', kind: 'code', plugs: '`STROKES.notch` in `public/work-art.js`; `workSlot` stands several along the house front', status: 'open' },
  { id: 'A4', area: 'A', priority: 1, request: R.work, item: 'item 4', deliver: '`<cast>-dig` (spade driven in with the foot, levered, earth thrown behind, back) and `<cast>-dig-well` (the same waist-deep in a square hole with a low bank of earth)', names: ['<cast>-dig', '<cast>-dig-*', '<cast>-dig-well', '<cast>-dig-well-*'],
    frames: '4 frames each, east', size: PEOPLE, standIn: 'the hoeing cycle with dark clods thrown up', kind: 'code', plugs: '`STROKES.dig`, `STROKES.grub` in `public/work-art.js`', status: 'open' },
  { id: 'A5', area: 'A', priority: 1, request: R.ambient, item: 'item 1', deliver: 'for each of the eight: `-whittle`, `-mend-harness`, `-sew`, `-shell-corn`, `-clean-rifle` (seated, 2 frames each), `-wash` (kneeling at a tub, 2), `-pipe`, `-cards` (seated, 2), `-sweep` (a broom, 4), `-carry-water` (a bucket in each hand, walking, 4, east)',
    names: ['<cast>-whittle', '<cast>-mend-harness', '<cast>-sew', '<cast>-shell-corn', '<cast>-clean-rifle', '<cast>-wash', '<cast>-pipe', '<cast>-cards', '<cast>-sweep', '<cast>-carry-water', '<cast>-whittle-*', '<cast>-mend-harness-*', '<cast>-sew-*', '<cast>-shell-corn-*', '<cast>-clean-rifle-*', '<cast>-wash-*', '<cast>-pipe-*', '<cast>-cards-*', '<cast>-sweep-*', '<cast>-carry-water-*'],
    frames: '2-4 frames each, east', size: PEOPLE, standIn: 'the nearest delivered pose: seated `-repair`, kneeling `-care`, seated `-rest`, the hoe\'s `-work`, the harvest `-carry`', kind: 'library', plugs: '`ambientClip` in `public/motion.js`; `ACTIVITIES` in `sim/ambient.mjs`', status: 'open' },
  { id: 'A6', area: 'A', priority: 2, request: R.work, item: 'item 2', deliver: '`<cast>-split` (maul raised, coming down, on the wedge in a log on the ground, back)', names: ['<cast>-split', '<cast>-split-*'],
    frames: '4 frames, east', size: PEOPLE, standIn: 'the hoeing cycle with a drawn maul', kind: 'code', plugs: '`STROKES.split` in `public/work-art.js`', status: 'open' },
  { id: 'A7', area: 'A', priority: 2, request: R.work, item: 'item 5', deliver: '`<cast>-reap` (reaching up to an ear, snapping it, dropping it in a basket or sack, stepping on)', names: ['<cast>-reap', '<cast>-reap-*'],
    frames: '4 frames, east', size: PEOPLE, standIn: 'the hoeing cycle with chaff', kind: 'code', plugs: '`STROKES.reap` in `public/work-art.js`', status: 'open' },
  { id: 'A8', area: 'A', priority: 2, request: R.work, item: 'item 7', deliver: '`<cast>-aim` (1 frame, a long rifle level at the shoulder) and `<cast>-fire` (2 frames: recoil, lowering), in the figure\'s own clothes', names: ['<cast>-aim', '<cast>-fire', '<cast>-fire-*'],
    frames: '1 + 2 frames, east', size: PEOPLE, standIn: 'the side-on idle with a rifle line and a flash drawn in canvas', kind: 'code', plugs: '`STROKES.shoot`, `STROKES.shot` in `public/work-art.js`', status: 'open' },
  { id: 'A9', area: 'A', priority: 2, request: R.work, item: 'item 8', deliver: '`<cast>-fish` (sitting on the bank, cane pole out, the pole twitched)', names: ['<cast>-fish', '<cast>-fish-*'],
    frames: '2 frames, east', size: PEOPLE, standIn: 'the seated rest with a cane pole, line and bobbing float in canvas', kind: 'code', plugs: '`STROKES.fish`, `drawWorkLayer` in `public/work-art.js`', status: 'open' },
  { id: 'A10', area: 'A', priority: 2, request: R.work, item: 'item 9', deliver: '`<cast>-gather` (bent to the ground picking up, then into a basket or apron)', names: ['<cast>-gather', '<cast>-gather-*'],
    frames: '2 frames, east', size: PEOPLE, standIn: 'the sowing crouch bobbing at the ground', kind: 'code', plugs: '`STROKES.gather` in `public/work-art.js`', status: 'open' },
  { id: 'A11', area: 'A', priority: 2, request: R.ambient, item: 'item 2', deliver: '`washtub` (a wooden tub with a board), `woodpile-frontier` (split rails stacked by a cabin), `hens-pecking` (two hens, 2 frames)', names: ['washtub', 'woodpile-frontier', 'hens-pecking', 'hens-pecking-*'],
    frames: '1, 1 and 2 frames', size: PROP, standIn: 'the plain `bucket`, the Alamo\'s `alamo-firewood`, `chicken-idle`', kind: 'library', plugs: '`propItem` in `public/ambient.js`', status: 'open' },
  { id: 'A12', area: 'A', priority: 2, request: R.gonzales, item: 'items 1-4', deliver: 'a seated flag painter for `teal`, `indigo`, `blue-girl` (`<figure>-paint-seated`, 2 frames); `elder`, `ochre`, `blue` `-dig` with a spade (4 frames, shared with A4); `-forge` (a smith at the anvil, 2-4 frames) with `forge-anvil` as a prop; `-point` (arm out across the river, the other shading the eyes, 2 frames, east and south)',
    names: ['teal-paint-seated*', 'indigo-paint-seated*', 'blue-girl-paint-seated*', '<cast>-forge', '<cast>-forge-*', 'forge-anvil', '<cast>-point', '<cast>-point-*'],
    frames: '2-4 frames, east (and south for pointing)', size: PEOPLE, standIn: 'the delivered `repair`, `work`, `search` and `speak` poses', kind: 'library', plugs: '`STAND_INS` in `sim/town-scenes.mjs`; `drawProp` in `public/town-scenes.js`', status: 'open', research: 'the Gonzales scenes of September 29 - October 2, 1835 (docs/battle-research/gonzales-town.md, HIST-TEX-460-469)' },
  { id: 'A13', area: 'A', priority: 3, request: R.work, item: 'item 6', deliver: '`<cast>-carpentry` (at a shaving horse drawing a drawknife, 2 frames, then boring with an auger, 2)', names: ['<cast>-carpentry', '<cast>-carpentry-*'],
    frames: '4 frames, east', size: PEOPLE, standIn: 'the seated mending cycle with shavings', kind: 'code', plugs: '`STROKES.whittle` in `public/work-art.js`', status: 'open' },
  { id: 'A14', area: 'A', priority: 3, request: R.work, item: 'item 10', deliver: '`<cast>-butcher` (at a plank table cutting a joint wrapped in cloth, or salting it down in a barrel; no carcass, no blood)', names: ['<cast>-butcher', '<cast>-butcher-*'],
    frames: '2 frames, east', size: PEOPLE, standIn: 'the kneeling nursing pose, bobbing', kind: 'code', plugs: '`STROKES.butcher` in `public/work-art.js`', status: 'open' },
  { id: 'A15', area: 'A', priority: 3, request: R.work, item: 'item 11', deliver: '`<cast>-drill` (stepping out with a rifle at the shoulder, 4 frames) and `<cast>-guard` (sentry, rifle sloped, turning the head, 2)', names: ['<cast>-drill', '<cast>-drill-*', '<cast>-guard', '<cast>-guard-*'],
    frames: '4 and 2 frames, east', size: PEOPLE, standIn: 'the walk stepped on the spot; the searching pose with a rifle sloped', kind: 'code', plugs: '`STROKES.drill`, `STROKES.guard` in `public/work-art.js`', status: 'open' },
  { id: 'A16', area: 'A', priority: 3, request: R.work, item: 'item 12', deliver: '`<cast>-stake` (a mallet raised over a stake and driving it)', names: ['<cast>-stake', '<cast>-stake-*'],
    frames: '2 frames, east', size: PEOPLE, standIn: 'the walk cycle paced to and fro', kind: 'code', plugs: '`STROKES.pace` in `public/work-art.js`', status: 'open' },
  { id: 'A17', area: 'A', priority: 3, request: R.work, item: 'item 14', deliver: '`<cast>-tend-fire` (kneeling, feeding a stick into a small fire, blowing on it; the fire in the frame)', names: ['<cast>-tend-fire', '<cast>-tend-fire-*'],
    frames: '2 frames, east', size: PEOPLE, standIn: 'the kneeling nursing pose with a small flame and puffs in canvas', kind: 'code', plugs: '`STROKES.fire` in `public/work-art.js`', status: 'open' },
  { id: 'A18', area: 'A', priority: 3, request: R.settling, item: 'layered people', deliver: 'aligned layer PNGs `<sheet>--line`, `--skin`, `--hair`, `--clothes` and the head items (`--hat`, `--beard`, `--moustache`, `--straw-hat`, `--bonnet`, `--pinned`, `--braid`, `--loose`, `--headscarf`) for every people sheet, one figure per sex and age band', names: [],
    frames: 'every frame of every people sheet', size: 'Registered pixel for pixel with the sheet they layer; greyscale value masks; see the request', standIn: 'the painted cast recoloured by a region classifier (`public/person-palette.js`, 2026-09-28), some head styles the nearest cast silhouette', kind: 'library', plugs: '`public/avatar-art.js`, `public/person-palette.js`, `public/appearance.js`', status: 'open', phrases: ['layered people'] },

  // ---------------------------------------------------------------- B: children, babies and sickness
  { id: 'B1', area: 'B', priority: 1, request: R.play, item: 'item 1', deliver: 'for `girl`, `boy`, `smallchild`: `-play-gallop` (stick horse, 4, east), `-play-run` (4, east, and `-n`/`-s`), `-play-hide` (1), `-play-kneel` (2), `-play-sit-doll` (1), `-play-hoop` (4, the hoop in the frame), `-scatter` (throwing corn, 2)',
    names: ['<child>-play-*', '<child>-scatter', '<child>-scatter-*'], frames: '1-4 frames each', size: PEOPLE + '; drawn to fill the cell as an adult does, a child\'s proportions (the renderer shrinks them by age)', standIn: 'the child\'s walk, sitting rest, side-on rest and back-turned idle; the grown sowing cycle at a child\'s size for the hens', kind: 'library', plugs: '`littleClip` and `CHILD_POSES` in `public/motion.js`; `STROKES.scatter`', status: 'open' },
  { id: 'B2', area: 'B', priority: 1, request: R.play, item: 'item 2', deliver: '`infant-crawl` (4, east, and `-w`), `infant-cry` (sitting up, mouth open, 2), `infant-sleep` (curled on a blanket, 1)', names: ['infant-crawl*', 'infant-cry*', 'infant-sleep*'],
    frames: '1-4 frames', size: 'The infant\'s logical height (`infant-idle-*`), ground anchor', standIn: 'the infant\'s standing pose moved over the ground; the front idle with a "(crying)" bubble; `infant-rest`', kind: 'library', plugs: '`littleClip` in `public/motion.js`', status: 'open' },
  { id: 'B3', area: 'B', priority: 1, request: R.play, item: 'item 3', deliver: 'for each cast woman (`rust-woman`, `teal`, `indigo`, `blue-girl`) and, less often, each man: `-hold-baby` (a baby to the shoulder, swaying, 2, south) and `-carry-baby-walk` (a baby on the hip, walking, 4, east, and `-n`/`-s`); also covers the riders request\'s walker carrying an infant (item 3)',
    names: ['<cast>-hold-baby*', '<cast>-carry-baby-walk*'], frames: '2 and 4 frames', size: PEOPLE, standIn: 'the harvest carry with the infant drawn at her side; a carried baby drawn at the carrier\'s hip', kind: 'library', plugs: '`littleClip` (`aside.kind === \'baby\'`) in `public/motion.js`; `carriedAt` in `drawWorld`, `public/app.js`', status: 'open', phrases: ['a woman with a baby on her hip'] },
  { id: 'B4', area: 'B', priority: 1, request: R.sick, item: 'item 1', deliver: '`mark-sick` (a folded blanket and a cup, or a cool cloth, in the panel\'s mark style)', names: ['mark-sick'],
    frames: '1', size: MARK, standIn: 'the road\'s nursing icon `icon-tend-sick` in a cream disc', kind: 'library', plugs: '`.panel-sick-mark` in `panelRow`, `public/app.js`', status: 'open', phrases: ['the sick badge'] },
  { id: 'B5', area: 'B', priority: 1, request: R.sick, item: 'item 2', deliver: '`icon-rest-road` (the wagon stopped, somebody lying under a blanket), `icon-camp-apart` (a camp up a bank away from a crowd of tents), `icon-nurse-home` (somebody by a bed in a cabin with a cup)', names: ['icon-rest-road', 'icon-camp-apart', 'icon-nurse-home'],
    frames: '1 each', size: ICON + ' (the request says 64 px; deliver at 128 as the other icons)', standIn: '`icon-rest`, `icon-tend-sick` and a stroked glyph', kind: 'library', plugs: '`PANEL_ICONS` in `public/family-panel.js`', status: 'open', phrases: ['the sickness icons'] },
  { id: 'B6', area: 'B', priority: 2, request: R.play, item: 'item 4', deliver: '`girl-speak`, `boy-speak`, `smallchild-speak` (2, east) and `-tug` (tugging at a grown person\'s sleeve, 2, east)', names: ['<child>-speak*', '<child>-tug*'],
    frames: '2 frames each, east', size: PEOPLE, standIn: 'the standing idle; the parent in the cast listening pose', kind: 'library', plugs: '`littleClip` (`talk.phase === \'talking\'`) in `public/motion.js`', status: 'open' },
  { id: 'B7', area: 'B', priority: 2, request: R.work, item: 'item 13', deliver: 'for `girl`, `boy`, `smallchild`: `-shoo` (arms flung up waving a cloth, 2), `-gather` (2), `-carry-water` (a small pail in each hand, walking, 4, east, and `-n`/`-s`)', names: ['<child>-shoo*', '<child>-gather*', '<child>-carry-water*'],
    frames: '2-4 frames', size: PEOPLE, standIn: 'the walk paced to and fro; the grown carry at the child\'s size', kind: 'library', plugs: '`STROKES.shoo`, `STROKES.carry` with the child scaling of `entityClip`', status: 'open' },
  { id: 'B8', area: 'B', priority: 2, request: R.sick, item: 'item 3', deliver: 'for each cast figure and the children: `-sick-rest` (lying under a blanket, head on a bundle, 1 frame, `-s` and `-e`), and `infant-sick` (wrapped and lying)', names: ['<cast>-sick-rest*', '<child>-sick-rest*', 'infant-sick'],
    frames: '1 frame, south and east', size: PEOPLE, standIn: 'the delivered `-injured-rest` pose, as the hurt are; a sick baby as it is', kind: 'library', plugs: '`restingSick` and `grownClip` in `public/motion.js`', status: 'open' },
  { id: 'B9', area: 'B', priority: 2, request: R.play, item: 'item 5', deliver: '`icon-child-stick-horse`, `icon-child-doll`, `icon-child-tag`, `icon-child-hide`, `icon-child-cart`, `icon-child-hoop`, `icon-child-marbles`, `icon-child-hens`; the Scrape\'s `icon-flee-hide`, `icon-flee-bundle`, `icon-road-lookout`, `icon-road-sing`, `icon-road-little-ones`, `icon-camp-fire`, `icon-ferry-help`, `icon-share-food`, `icon-ford-carry` (a child reads as a child; nothing holds an edge or a gun)',
    names: ['icon-child-stick-horse', 'icon-child-doll', 'icon-child-tag', 'icon-child-hide', 'icon-child-cart', 'icon-child-hoop', 'icon-child-marbles', 'icon-child-hens', 'icon-flee-hide', 'icon-flee-bundle', 'icon-road-lookout', 'icon-road-sing', 'icon-road-little-ones', 'icon-camp-fire', 'icon-ferry-help', 'icon-share-food', 'icon-ford-carry'],
    frames: '17 icons', size: ICON, standIn: 'stroked glyphs drawn in code', kind: 'code', plugs: '`PANEL_ICONS` and `LITTLE_GLYPHS` in `public/family-panel.js`', status: 'open', phrases: ['children\'s play and the Scrape\'s work'] },
  { id: 'B10', area: 'B', priority: 2, request: R.help, item: 'item 1', deliver: '`icon-child-help` (a child running along a track toward a neighbour\'s cabin, an arm out)', names: ['icon-child-help'],
    frames: '1', size: ICON + ' (the request says 48 px; deliver at 128 as the others)', standIn: 'a stroked glyph: a running figure and a house', kind: 'code', plugs: '`PANEL_ICONS[\'child-help\']` in `public/family-panel.js`', status: 'open' },
  { id: 'B11', area: 'B', priority: 2, request: R.cow, item: 'item 1 (icon)', deliver: '`icon-flee-cow` (a child leading the family\'s milk cow on a rope)', names: ['icon-flee-cow'],
    frames: '1', size: ICON, standIn: 'a stroked glyph', kind: 'code', plugs: '`PANEL_ICONS` in `public/family-panel.js`', status: 'open' },
  { id: 'B12', area: 'B', priority: 3, request: R.families, item: 'priority 1', deliver: 'any later child-specific action pose the game asks a child in (today every child action pose it needs is B1, B6, B7 and B8)', names: [],
    frames: '—', size: PEOPLE, standIn: 'a grown figure drawn smaller (90% at 10-17, 70% at 5-9, 55% at 2-4, 45% an infant); keep the scaling when the art lands', kind: 'library', plugs: '`CHILD_POSES` and `entityClip` in `public/motion.js`', status: 'skipped: covered by B1, B6, B7 and B8; the scaling rule stays', phrases: ['Until there is child art'] },

  // ---------------------------------------------------------------- C: soldiers, battles and famous people
  { id: 'C1', area: 'C', priority: 1, request: R.battles, item: 'item 1', deliver: 'every cast figure (' + CAST + ') in `<cast>-aim`, `<cast>-fire`, `<cast>-load` (kneeling), `<cast>-ramrod`, clip `<cast>-fire-reload`; and each cast\'s `-injured` and `-reclining`', names: ['<cast>-fire-reload', '<cast>-load', '<cast>-ramrod', '<cast>-injured', '<cast>-reclining'],
    frames: '4 frames each, east', size: BATTLE, standIn: 'the volunteer militia\'s firing cycle and fallen poses, not the person\'s own figure', kind: 'library', plugs: '`memberPose` and `poseOf` in `public/battle-view.js`', status: 'open', phrases: ['a family\'s own people firing'] },
  { id: 'C2', area: 'C', priority: 2, request: R.battles, item: 'item 3', deliver: '`bearers-carry-1`..`-4` (two men carrying a third on a blanket, walking east); no blood', names: ['bearers-carry*'],
    frames: '4 frames, east', size: BATTLE, standIn: 'the seated wounded helped back by two walking figures; `*-reclining` with two beside', kind: 'library', plugs: '`drawFallen` in `public/battle-view.js`', status: 'open', phrases: ['the wounded carried'] },
  { id: 'C3', area: 'C', priority: 2, request: R.ambient, item: 'item 3', deliver: '`volunteer-clean-rifle`, `volunteer-camp-sit`, `volunteer-camp-cook` and the same for `regular-` (2 frames each)', names: ['volunteer-clean-rifle*', 'volunteer-camp-sit*', 'volunteer-camp-cook*', 'regular-clean-rifle*', 'regular-camp-sit*', 'regular-camp-cook*'],
    frames: '2 frames each, east', size: BATTLE, standIn: 'the ramrod\'s stroke; the cast\'s civilian men at the fire', kind: 'library', plugs: '`CAMP_TEXIAN`, `CAMP_MEXICAN` in `sim/ambient.mjs`; `figureClip` in `public/ambient.js`', status: 'open', phrases: ['a rifle cleaned is the ramrod'] },
  { id: 'C4', area: 'C', priority: 2, request: R.sanjac, item: 'item 2', deliver: '`regular-rest-sit`, `regular-sleep` (never to be mistaken for `regular-reclining`), `volunteer-rest-sit`, `musket-stack`; `breastwork-packs` in three or four segments about five feet high', names: ['regular-rest-sit*', 'regular-sleep*', 'volunteer-rest-sit*', 'musket-stack', 'breastwork-packs*'],
    frames: '1-2 frames', size: BATTLE + '; the breastwork as a prop', standIn: 'the standing idle and seated wounded; `crate`, `sacks`, `barrel`, `packed-belongings` in a line', kind: 'library', plugs: 'the `camp` branch of `draw` and `drawWorks` in `public/battle-view.js`', status: 'open', research: 'HIST-TEX-522 (Houston: "packs and baggage, leaving an opening in the centre")' },
  { id: 'C5', area: 'C', priority: 2, request: R.storming, item: 'items 1, 3, 4', deliver: '`volunteer-loophole-fire` and `regular-loophole-fire` (the barrel at the wall, the man half hidden, 2-4 frames); `volunteer-crowbar` (4 frames, forcing a door); `volunteer-dig` (a spade in a trench at night); `barricade-street` (ditch, bank, post palisade, gun embrasure); `sandbag-breastwork`',
    names: ['volunteer-loophole-fire*', 'regular-loophole-fire*', 'volunteer-crowbar*', 'volunteer-dig*', 'barricade-street*', 'sandbag-breastwork*'], frames: '2-4 frames; props 1', size: BATTLE + '; props at `palisade` scale', standIn: 'flashes at the town\'s houses; the ramming stroke; `rust-work`/`teal-work`; `palisade` and `sacks`', kind: 'library', plugs: '`draw` (`cover`), `drawBreaches` in `public/battle-view.js`', status: 'open', research: 'Béxar, December 1835 (docs/battle-research/staging.md §3.9, HIST-TEX-490-496)', phrases: ['a street barricade', 'a crowbar at a door', 'a trench across a'] },
  { id: 'C6', area: 'C', priority: 2, request: R.alamo, item: 'item 3', deliver: 'volunteers firing over a parapet, the body from the waist up over a wall top, east, west, north and south, with a loading frame below the parapet (`volunteer-parapet-fire-*`)', names: ['volunteer-parapet-*'],
    frames: '2-4 frames a facing', size: BATTLE, standIn: 'the volunteer firing cycle at the wall\'s line', kind: 'library', plugs: '`layoutSide` and `draw` in `public/battle-view.js`', status: 'open' },
  { id: 'C7', area: 'C', priority: 2, request: R.coleto, item: 'item 1', deliver: '`regular-prone-lie`, `regular-prone-aim`, `regular-prone-fire` (a cazador in the tall grass at night)', names: ['regular-prone-*'],
    frames: '3 frames, east', size: BATTLE, standIn: 'the loose order\'s standing and kneeling poses', kind: 'library', plugs: 'the `ringed` grass parts of `sim/battles/coleto.mjs`, `draw` in `public/battle-view.js`', status: 'open' },
  { id: 'C8', area: 'C', priority: 2, request: R.troops, item: 'item 3', deliver: '`skirmisher-run-e` (4) and `skirmisher-kneel-fire` (aim, fire, load; 4), the line\'s regular', names: ['skirmisher-run*', 'skirmisher-kneel-fire*'],
    frames: '4 frames each, east', size: BATTLE, standIn: '`regular-march`, `regular-fire-reload`', kind: 'library', plugs: '`createChaseView` in `public/chase-view.js`', status: 'open' },
  { id: 'C9', area: 'C', priority: 2, request: R.advance, item: 'item 3', deliver: '`regular-march-column` (six to eight infantry in files of three, a mounted officer at the head, a cart behind; 4 frames, east)', names: ['regular-march-column*'],
    frames: '4 frames, east', size: BATTLE, standIn: '`regular-march` men in files of three with a `dragoon-march` at the head', kind: 'library', plugs: '`drawArmy` (`moving`) in `public/army-view.js`', status: 'open' },
  { id: 'C10', area: 'C', priority: 2, request: R.concepcion, item: 'item 2', deliver: '`volunteer-bank-climb-1`..`-6` (step up the cut, aim and fire over the lip, step down, load under the bank)', names: ['volunteer-bank-climb*'],
    frames: '6 frames, east', size: BATTLE, standIn: '`volunteer-load` a third of a figure lower than the men firing', kind: 'library', plugs: 'the `bank` branch of `draw` in `public/battle-view.js`', status: 'open', phrases: ['the loading figure'] },
  { id: 'C11', area: 'C', priority: 2, request: R.sanjac, item: 'item 4', deliver: '`figure-wading` (a man up to the thighs in water, running, in either side\'s clothes); no blood, nobody shot close', names: ['figure-wading*'],
    frames: '2-4 frames, east', size: BATTLE, standIn: 'nobody drawn wading', kind: 'none', plugs: '`drawWorks` in `public/battle-view.js`', status: 'open' },
  { id: 'C12', area: 'C', priority: 2, request: R.battles, item: 'item 4', deliver: 'three settlers serving the Gonzales cart-wheel gun: `settler-gun-ram`, `settler-gun-carry`, `settler-gun-fire`', names: ['settler-gun-*'],
    frames: '2-4 frames each, east', size: BATTLE, standIn: 'the carriage-gun crew cycles (`volunteer-gun-ram`, `-shot-carry`, `-fire`)', kind: 'library', plugs: '`drawCannon` in `public/battle-view.js`', status: 'open', phrases: ['dedicated Gonzales crew', 'Gonzales cannon'] },
  { id: 'C13', area: 'C', priority: 2, request: R.famous, item: 'items 1 and 3', deliver: 'a 4×4 sheet each for Austin, J. W. Smith, Kimbell, Martin, Johnson, Neill, Hockley, McCulloch, Sherman, Rusk, Lamar, Horton, W. P. Smith, Smither, Deaf Smith, Grant (Texian officers) and Urrea, Condelle, Sánchez Navarro, Barragán (Mexican officers): walk, idle, command, fire, and a still (lying) pose; named `<person>-*` as `PERSON_ART` keys',
    names: ['austin-*', 'jw-smith-*', 'kimbell-*', 'martin-*', 'johnson-*', 'neill-*', 'hockley-*', 'mcculloch-*', 'sherman-*', 'rusk-*', 'lamar-*', 'horton-*', 'wp-smith-*', 'smither-*', 'deaf-smith-*', 'grant-*', 'urrea-*', 'condelle-*', 'sanchez-navarro-*', 'barragan-*'],
    frames: '16 each (4 east, 2 south, 2 north walking, 8 poses)', size: 'The delivered famous sheets\' contract (`scripts/art-deliveries/famous-people.mjs`): the `volunteer-*` logical height', standIn: 'the volunteer or regular, riding as the courier or the dragoon, named under the figure', kind: 'library', plugs: '`PERSON_ART` and `drawPerson` in `public/battle-view.js`, `drawFamous` in `public/famous-view.js`', status: 'open',
    research: 'each person\'s dress, age and rank in 1835-36 (docs/battle-research/famous-people.md); **original interpretations, never a likeness** - no face is claimed, and a Claude stand-in says so in its prompt', phrases: ['the famous people', 'the same stand-ins as the battlefield'] },
  { id: 'C14', area: 'C', priority: 2, request: R.esparza, item: 'items 1-6', deliver: '`ana-esparza-*` (walk, idle, `shelter-with-children`, `carry-toddler`, `hold-blanket`), `maria-de-jesus-*` (walk, idle, seated huddled), `enrique-esparza-*` (walk, idle, seated huddled, `look`), `burial-party-walk-e` (4; two men carrying a body wholly wrapped on a litter, never a body shown), `francisco-esparza-*` (walk, idle, `kneel-at-grave`), `esparza-seated`',
    names: ['ana-esparza-*', 'maria-de-jesus-*', 'enrique-esparza-*', 'esparza-small-child-*', 'burial-party-walk*', 'francisco-esparza-*', 'esparza-seated*'], frames: 'the famous-sheet contract', size: 'Famous sheets: `volunteer-*` height for grown people, the children\'s for the children', standIn: 'the second cast\'s woman, the library\'s girl, boy and small child; two `rust` figures with a canvas bundle', kind: 'library', plugs: '`PERSON_ART` in `public/battle-view.js`; `drawBearers`; `drawFamous`', status: 'open',
    research: 'Tejano dress in Béxar, 1836 (HIST-TEX-605-609); original interpretations, no likeness claimed', phrases: ['Ana Esparza'] },
  { id: 'C15', area: 'C', priority: 3, request: R.famous, item: 'Castrillón and the rest', deliver: 'Castrillón\'s north and south walks and a scale-matched ammunition crate under his command pose; Travis in the officer\'s firing cycle at the north battery (request 2026-09-25 the Alamo, item 8); the remaining Tejano cast', names: ['castrillon-walk-n*', 'castrillon-walk-s*', 'ammunition-crate*', 'travis-fire*'],
    frames: 'as the famous sheets', size: 'Famous sheets', standIn: 'Castrillón\'s east walk mirrored; the crate prop at another scale', kind: 'library', plugs: '`PERSON_ART`', status: 'open', research: 'original interpretations' },
  { id: 'C16', area: 'C', priority: 3, request: R.concepcion, item: 'items 6 and 8', deliver: '`grass-bundle-cut` (a pack slit open, grass spilling); a padre with carts for the dead and wounded after Concepción (told in the caption today)', names: ['grass-bundle-cut*', 'padre-carts*'],
    frames: '1; 2-4', size: PROP, standIn: 'nothing (words)', kind: 'words', plugs: '`draw` in `public/battle-view.js`', status: 'open', research: 'the padre and carts are in the record only in outline (Smithwick); keep them general' },
  { id: 'C17', area: 'C', priority: 3, request: R.gonzales, item: 'item 5', deliver: 'the Come and Take It flag without the star (the star is disputed), and flat on the table half-painted and finished, as more states of `gonzales-flag-work-*`', names: ['flag-come-and-take-it-no-star*', 'gonzales-flag-work-half*'],
    frames: 'still and a four-frame wave for the flag; one each on the table', size: PROP, standIn: 'canvas for the unfinished cloth', kind: 'code', plugs: '`drawFlag`, `drawProp` in `public/town-scenes.js`', status: 'open', research: 'Smithwick\'s description; the star is disputed (FIC-GONZ-419)' },
  { id: 'C18', area: 'C', priority: 3, request: R.armies, item: 'the armies on the map', deliver: 'a camp: three or four wedge tents, a cook fire with a pot, stacked arms and a colour on a pole, `army-camp`, 192×192', names: ['army-camp*'],
    frames: '1', size: '192×192, in the map art\'s own light', standIn: 'tents, the fire and the flag drawn in canvas by `public/army-view.js`', kind: 'code', plugs: '`drawArmy` in `public/army-view.js`', status: 'open', phrases: ['the camp: the tents'] },
  { id: 'C19', area: 'C', priority: 3, request: R.alamo, item: 'item 2', deliver: 'specific art for the Alamo\'s north-wall and church guns (the 18-pounder and the siege battery are delivered)', names: ['cannon-alamo-north*', 'cannon-alamo-church*'],
    frames: 'rest and recoil, both facings', size: PROP + ' (the field guns\' scale)', standIn: 'the reusable field-gun art and existing crews', kind: 'library', plugs: '`drawGun` in `public/battle-view.js`', status: 'open', research: 'which guns stood where (docs/ALAMO_LAYOUT.md); interpretive silhouettes' },

  // ---------------------------------------------------------------- D: riders, horses, wagons, carreta, ferry, steamboat
  { id: 'D1', area: 'D', priority: 1, request: R.cow, item: 'item 1', deliver: '`milk-cow-walk-e` (4), `milk-cow-walk-n`, `milk-cow-walk-s`, `milk-cow-graze` (2): a gentle dairy cow of the 1830s with a rope trailing from her horns', names: ['milk-cow-*'],
    frames: '4 east, 2 each north and south, 2 grazing', size: 'Cattle at the logical height of `cattle-longhorn-*`, ground anchor, east mirrored for west', standIn: 'the range longhorn\'s `cattle-longhorn-red-idle` and `-graze`', kind: 'library', plugs: 'the cow in `drawWorld`, `public/app.js` (`window.__cowDrawn`)', status: 'open' },
  { id: 'D2', area: 'D', priority: 1, request: R.troops, item: 'items 1-2', deliver: '`dragoon-gallop-e` (4), `-n`, `-s` (the escort dragoon riding hard, carbine slung) and `dragoon-carbine-fire` (raise, fire, lower; 3); also `dragoon-fire-1`/`-2` for the battles (request 2026-09-25 battles, item 2)', names: ['dragoon-gallop*', 'dragoon-carbine-fire*', 'dragoon-fire*'],
    frames: '4 + 2 + 2, and 3', size: MOUNTED + ' (the `dragoon-e` height)', standIn: '`dragoon-march` with a flash and a puff at his hands; `dragoon-idle-e`', kind: 'library', plugs: '`createChaseView` in `public/chase-view.js`; the dragoon branch of `draw` in `public/battle-view.js`', status: 'open', phrases: ['a dragoon at the gallop', 'a dragoon firing from the saddle'] },
  { id: 'D3', area: 'D', priority: 2, request: R.horseback, item: 'children', deliver: '`girl`, `boy`, `smallchild` and `infant` mounted on the family\'s chestnut: `<child>-ride-e`, `-s`, `-n` as the eight have', names: ['<child>-ride-*', 'infant-ride-*'],
    frames: '4 frames a heading', size: MOUNTED, standIn: 'the child\'s idle cut below the waist over the walking horse', kind: 'library', plugs: '`seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`; `drawSeated` in `public/app.js`', status: 'open', phrases: ['family members on horseback', 'on horseback'] },
  { id: 'D4', area: 'D', priority: 2, request: R.driving, item: 'second cast and children', deliver: 'seated driver layers `rust-woman-drive-<dir>`, `indigo-drive-<dir>`, `ochre-drive-<dir>`, `blue-girl-drive-<dir>` and the four children, on the four headings as the delivered sixteen', names: ['rust-woman-drive-*', 'indigo-drive-*', 'ochre-drive-*', 'blue-girl-drive-*', '<child>-drive-*'],
    frames: '4 headings each', size: 'As `people-wagon-drivers`: anchored at the rig\'s seat point', standIn: 'the figure\'s idle cut below the waist at the front of the wagon', kind: 'library', plugs: '`wagonDriverId`, `seatOf`, `seatedClip`, `seatLayout` in `public/motion.js`', status: 'open', phrases: ['driving the ox wagon'] },
  { id: 'D5', area: 'D', priority: 2, request: R.riders, item: 'items 1-2', deliver: '`cart-travel-e`, `-n`, `-s` (4 frames, the wheels turning) and `cart-idle` loaded and empty; seated riders for the bed of an open wagon and a cart, both casts and the children, east/north/south, anchored at the hip (`<figure>-ride-wagon-<dir>`), and the wagon\'s tail with its cover drawn back',
    names: ['cart-travel*', 'cart-idle*', '<cast>-ride-wagon-*', '<child>-ride-wagon-*', 'wagon-tail-open*'], frames: '4 frames a heading', size: 'The scale of `wagon-covered` and `ox-walk`', standIn: 'the delivered static `cart-open` views; riders as their idle cut at the waist on the cover', kind: 'library', plugs: '`miniWagon` in `public/app.js`; `bedLayout` in `public/motion.js`', status: 'open', phrases: ['riders in the wagon', 'riders, walkers'] },
  { id: 'D6', area: 'D', priority: 2, request: R.cow, item: 'item 3', deliver: '`tejano-rider-ride-e`, `-n`, `-s` (4): a Tejano horseman in a short jacket and wide hat with a lance or escopeta', names: ['tejano-rider-*'],
    frames: '4 frames a heading', size: MOUNTED, standIn: 'the cast\'s riders', kind: 'library', plugs: '`bx-tejano-*` in `sim/town-scenes.mjs`', status: 'open', research: 'Tejano horsemen of Béxar, 1836 (Seguín\'s company); dress is an interpretation' },
  { id: 'D7', area: 'D', priority: 2, request: R.sanjac, item: 'item 3', deliver: '`volunteer-mounted` walk (east, north, south, 4) and trot and idle, a rifle, and `volunteer-mounted-fire` (2); the same rider serves `volunteer-ride-e`/`-s`/`-n` for the south\'s fights and the Gonzales men riding into the Alamo', names: ['volunteer-mounted*', 'volunteer-ride-*'],
    frames: '4 frames a heading, 2 firing', size: MOUNTED, standIn: 'the mounted courier (`mounted-courier-e`, `-listen`)', kind: 'library', plugs: '`figureOf`, the rider branch of `draw` and `memberPose` in `public/battle-view.js`', status: 'open', phrases: ['a Texian horseman', 'A Texian on horseback'] },
  { id: 'D8', area: 'D', priority: 2, request: R.alamo, item: 'item 7', deliver: '`lancer-march`, `lancer-idle` (lance up, both facings) and `lancer-charge` (at the gallop, lance level; never striking)', names: ['lancer-*'],
    frames: '4 marching, 1 idle, 4 charging', size: MOUNTED, standIn: '`dragoon-march-*` with no lance', kind: 'library', plugs: '`draw` in `public/battle-view.js`', status: 'open', phrases: ['lancers'] },
  { id: 'D9', area: 'D', priority: 2, request: R.advance, item: 'item 1', deliver: '`forager-ride-1`..`-4` (two or three horsemen, one leading a pack mule of corn sacks) and `forager-drive-1`..`-4` (two horsemen driving three or four cattle)', names: ['forager-*'],
    frames: '4 frames each, east', size: MOUNTED, standIn: 'three `dragoon-march` riders', kind: 'library', plugs: 'the parties in `drawWorld`, `public/app.js`', status: 'open', phrases: ['the Mexican advance'] },
  { id: 'D10', area: 'D', priority: 3, request: R.battles, item: 'item 3', deliver: '`dragoon-wounded-led-1`..`-2` (a man slumped in the saddle, another leading the horse)', names: ['dragoon-wounded-led*'],
    frames: '2 frames, east', size: MOUNTED, standIn: 'a dragoon hit in the saddle drawn dismounted', kind: 'library', plugs: '`drawFallen` in `public/battle-view.js`', status: 'open' },
  { id: 'D11', area: 'D', priority: 3, request: R.south, item: 'item 4', deliver: '`herd-drove` (several hundred horses moving as one mass, 4) and `herd-scatter`', names: ['herd-*'],
    frames: '4 and 2-4', size: PROP + ' (mustangs\' scale)', standIn: '`mustang-gallop`, `mustang-graze` up to twenty-four times', kind: 'library', plugs: '`drawHerd` in `public/battle-view.js`', status: 'open' },
  { id: 'D12', area: 'D', priority: 3, request: R.concepcion, item: 'items 6 and 8', deliver: '`mule-packed-grass-walk` (east, north, south, 4) and `limber-mules-walk` (mules at a gun or caisson, men riding them off)', names: ['mule-packed-grass*', 'limber-mules*'],
    frames: '4 frames a heading', size: 'The scale of `horse-walk`', standIn: '`horse-walk`/`horse-graze` with `packed-belongings` on its back', kind: 'library', plugs: 'the `packhorse` figure in `draw`, `public/battle-view.js`', status: 'open', phrases: ['pack mules', 'the Grass Fight\'s pack train'] },
  { id: 'D13', area: 'D', priority: 3, request: R.famous, item: 'mounted', deliver: 'full mounted movement for Seguín (`seguin-ride-*`); Dr. John Sutherland mounted (`sutherland-ride-*`, request 2026-09-26 the bell at Béxar, item 3)', names: ['seguin-ride-*', 'sutherland-*'],
    frames: '4 frames a heading', size: MOUNTED, standIn: 'Seguín\'s two mounted key poses; the roster\'s `rider`', kind: 'library', plugs: '`PERSON_ART`; `sutherland` in `sim/people.mjs`', status: 'open', research: 'original interpretations; no likeness' },
  { id: 'D14', area: 'D', priority: 3, request: R.driving, item: 'item 1', deliver: 'the covered wagon with one ox yoked to its tongue as one rolling rig, `wagon-ox-e`/`-n`/`-s`, 4 frames each, loaded and empty covers', names: ['wagon-ox-*'],
    frames: '4 frames a heading', size: 'The scale of `wagon-covered` and `ox-walk`', standIn: 'the ox and the side-view wagon drawn apart; north and south the wagon stays side-on', kind: 'library', plugs: '`seatLayout(\'wagon\', direction)` in `public/motion.js`', status: 'open' },
  { id: 'D15', area: 'D', priority: 3, request: R.carreta, item: 'loaded', deliver: 'a loaded carreta travel presentation (`carreta-loaded-travel-*`)', names: ['carreta-loaded-travel*'],
    frames: '4 frames a heading', size: 'The delivered `carreta-*` scale', standIn: 'the uncovered body cycle, laden or not', kind: 'library', plugs: '`miniWagon` in `public/app.js`', status: 'open' },
  { id: 'D16', area: 'D', priority: 3, request: R.families, item: 'priority 3', deliver: '— (`courier-dismount` is delivered; binding it needs the encounter to know when a rider has got down)', names: [],
    frames: '—', size: '—', standIn: 'the rider speaks from the saddle', kind: 'library', plugs: '`carrierClip`, `grownClip` in `public/motion.js`', status: 'skipped: delivered 2026-09-14; the remaining work is code, not art', phrases: ['The rider still never gets down'] },

  // ---------------------------------------------------------------- E: buildings, houses, towns, Béxar, the Alamo, interiors
  { id: 'E1', area: 'E', priority: 1, request: R.cow, item: 'item 2', deliver: 'Tejano townspeople of Béxar - a man, a woman in a rebozo, a girl and a boy - each `walk`, `idle-s`, `carry` (loading a cart), `speak`, `listen`, in 1830s Béxar dress (`bexar-man-*`, `bexar-woman-*`, `bexar-girl-*`, `bexar-boy-*`); also the storming\'s townspeople of 1835 walking out of a house (request 2026-09-25 the storming of Béxar, item 6)',
    names: ['bexar-man-*', 'bexar-woman-*', 'bexar-girl-*', 'bexar-boy-*'], frames: 'the people-sheet poses', size: PEOPLE, standIn: 'the colonists\' cast figures (`ochre`, `teal`, `elder`, `indigo`, `blue`, `blue-girl`, `girl`, `boy`); `rust-woman`, `indigo`, `elder`, `smallchild` leaving a house', kind: 'library', plugs: '`BEXAR_CAST` in `sim/town-scenes.mjs` (`figure`); `TOWNSFOLK` in `public/battle-view.js`', status: 'open', research: 'Béxar dress, 1835-36: rebozo, short jacket, sombrero; original interpretations', phrases: ['Béxar\'s families', 'The library has no Tejano townspeople'] },
  { id: 'E2', area: 'E', priority: 2, request: R.sides, item: '', deliver: '`house-round-back-sill`, `-back-low-walls`, `-back-full-walls` and the same for `hewn` (the pen from behind, no door in the gable toward the viewer); `house-passage-floor-end`, `house-passage-roof-end`, `house-porch-end`, `house-shed-room-end`', names: ['house-round-back-*', 'house-hewn-back-*', 'house-*-end'],
    frames: '1 each', size: BUILDING, standIn: 'the one front view, mirrored at a quarter turn; a chimney toward the viewer covers the door', kind: 'library', plugs: '`drawHousePlot`, `drawLogPen` in `public/house-plot.js`', status: 'open', phrases: ['the house from its other sides'] },
  { id: 'E3', area: 'E', priority: 2, request: R.roof, item: '', deliver: '`house-roof-join`, `house-roof-join-partial`, `house-roof-join-chimney`, and the ridge line marked on the roof frames', names: ['house-roof-join*'],
    frames: '1 each', size: BUILDING, standIn: 'the pens\' own roof laid over the passage', kind: 'library', plugs: '`drawHousePlot` (`alongRidge`, `RIDGE`) in `public/house-plot.js`', status: 'open', phrases: ['one roof over a two-pen house'] },
  { id: 'E4', area: 'E', priority: 2, request: R.plot, item: 'remaining pieces', deliver: 'jacal modules (post, wattle, thatch stages: `house-jacal-*`), `house-shed-frame`, `house-chimney-double` (two-sided, its foot marked), `house-floor` and `house-loft` overlays', names: ['house-jacal-*', 'house-shed-frame*', 'house-chimney-double*', 'house-floor*', 'house-loft*'],
    frames: 'a frame a stage', size: BUILDING, standIn: 'whole jacal stage sprites; `lean-to`; the single stick chimney drawn double', kind: 'library', plugs: '`drawHousePlot`, `standChimneys` in `public/house-plot.js`', status: 'open', phrases: ['jacal stages', 'the double chimney'] },
  { id: 'E5', area: 'E', priority: 2, request: R.settling, item: 'a saddlebag interior', deliver: '`interior-saddlebag` (two round-log pens wall to wall round one central stone chimney, a fireplace into each, no passage)', names: ['interior-saddlebag'],
    frames: '1', size: 'The `home-interiors` style, camera and scale exactly as `interior-dog-run`', standIn: 'the dog-run\'s picture, drawn wide', kind: 'library', plugs: '`INTERIORS.saddlebag` in `sim/interior-data.mjs`, `public/interior.js`', status: 'open', phrases: ['saddlebag', 'interiors and furnishings'] },
  { id: 'E6', area: 'E', priority: 2, request: R.civic, item: '', deliver: '`bexar-san-fernando-1836` and `bexar-governors-palace-1836`', names: ['bexar-san-fernando-1836', 'bexar-governors-palace-1836'],
    frames: '1 each', size: 'Matched to `chapel`/`adobe-flat` scale and ground anchors, three-quarter', standIn: 'the generic `chapel` and `adobe-flat`', kind: 'library', plugs: '`public/bexar-layout.js`', status: 'open', research: '**needs research first**: the 1836 appearance of San Fernando and the Governor\'s Palace; reject later additions and preserve uncertainty', phrases: ['Béxar civic architecture'] },
  { id: 'E7', area: 'E', priority: 2, request: R.storming, item: 'item 1', deliver: '`house-loopholed` (a flat-roofed stone house, a parapet about four feet high, loopholes in its walls)', names: ['house-loopholed*'],
    frames: '1', size: 'As `stone-tile-house`', standIn: 'the town\'s own house with flashes at its wall', kind: 'library', plugs: '`draw` (`cover: \'loophole\'`) in `public/battle-view.js`', status: 'open', phrases: ['a flat-roofed stone house with loopholes', 'Béxar\'s houses fought from'] },
  { id: 'E8', area: 'E', priority: 2, request: R.cow, item: 'item 4', deliver: '`dancers-couple` (4), `fiddler-play` (2), `lantern-post` (a lantern on a post, lit)', names: ['dancers-couple*', 'fiddler-play*', 'lantern-post*'],
    frames: '4, 2, 1', size: PEOPLE + '; the lantern as a prop', standIn: 'the cast figures; `fire-flicker` drawn small for the lanterns', kind: 'library', plugs: '`bx-dancer-*`, `bx-fiddler`, the `lights` prop in `public/town-scenes.js`', status: 'open', research: 'the fandango in Béxar before February 23, 1836 (docs/battle-research/surprise-at-bexar.md §6)', phrases: ['the fandango\'s lanterns'] },
  { id: 'E9', area: 'E', priority: 2, request: R.bell, item: 'items 1-2', deliver: '`sentry-bell-ring-1`..`-4` (a man on a flat church roof by a bell arch pulling the rope, then pointing west) and `townsfolk-leave-1`..`-4` (a Tejano family, a man leading a laden carreta, a woman with a child)', names: ['sentry-bell-ring*', 'townsfolk-leave*'],
    frames: '4 each, east', size: BATTLE, standIn: 'one standing volunteer at the church; the engine\'s civilian figures', kind: 'library', plugs: 'the `sentry` and `townsfolk` groups of `arrival` in `sim/battles/alamo.mjs`', status: 'open', phrases: ['the bell at Béxar'] },
  { id: 'E10', area: 'E', priority: 3, request: R.advance, item: 'item 4', deliver: '`plantation-sugar`, `blockhouse-village`, `townsite-bay`, `tavern-house`', names: ['plantation-sugar', 'blockhouse-village', 'townsite-bay', 'tavern-house'],
    frames: '1 each', size: PLACE, standIn: 'the places named on the map and nothing more', kind: 'words', plugs: '`public/place-art.js`', status: 'open', research: 'Stafford\'s, the Old Fort, New Washington and Mrs. Powell\'s (docs/MAP_ACCURACY.md §14)' },
  { id: 'E11', area: 'E', priority: 3, request: R.concepcion, item: 'item 4', deliver: '`mission-concepcion` (the church with twin towers and a dome, seen from about 500 yards)', names: ['mission-concepcion*'],
    frames: '1', size: BUILDING, standIn: '`church-generic`', kind: 'library', plugs: '`concepcionScenery` in `sim/battles/concepcion.mjs`', status: 'open', research: 'the mission as it stood in 1835', phrases: ['Mission Concepción'] },
  { id: 'E12', area: 'E', priority: 3, request: R.townBuildings, item: 'items 8-10', deliver: 'Fort Velasco (a circular log-and-sand fort, gapped and derelict: `fort-velasco`), the Harrisburg steam sawmill (`sawmill-steam`), the two-storey Stone House at Nacogdoches (`stone-house-nacogdoches`)', names: ['fort-velasco*', 'sawmill-steam*', 'stone-house-nacogdoches*'],
    frames: '1 each', size: 'The scale of `house-hewn-log` and `trading-house`, south-facing', standIn: '`palisade` pieces in a ring; `timber-hall` and `storehouse`; `stone-tile-house`', kind: 'library', plugs: 'each building\'s `sprite` in `sim/town-layouts.mjs`', status: 'open', research: 'docs/town-research/ for each', phrases: ['a circular log-and-sand fort', 'the buildings the towns\' research found'] },
  { id: 'E13', area: 'E', priority: 3, request: R.south, item: 'item 2', deliver: 'a lit-window overlay for `adobe-flat` and `house-jacal` (`window-lit-*`)', names: ['window-lit*'],
    frames: '1 each', size: 'Registered to the building it overlays', standIn: 'a warm glow drawn on the canvas', kind: 'code', plugs: '`drawScenery`, `glow` in `public/battle-view.js`', status: 'open', phrases: ['San Patricio by night', 'the south\'s fights'] },
  { id: 'E14', area: 'E', priority: 3, request: R.alamo, item: 'item 5', deliver: 'San Fernando\'s tower as the red flag\'s setting', names: ['san-fernando-tower*'],
    frames: '1', size: BUILDING, standIn: 'the flag at the town point', kind: 'none', plugs: '`drawFlag` in `public/battle-view.js`', status: 'open', research: 'with E6' },
  { id: 'E15', area: 'E', priority: 3, request: R.settling, item: 'the wagon\'s tools', deliver: '`home-hoe`, `home-felling-axe`, `home-broadaxe`, `home-froe`, `home-auger`', names: ['home-hoe', 'home-felling-axe', 'home-broadaxe', 'home-froe', 'home-auger'],
    frames: '1 each', size: 'The `home-furnishings` style and scale, standing or leaning as in a cabin', standIn: 'Claude\'s `claude-home-tools.png`', kind: 'claude', plugs: '`INTERIOR_ART` `tool:*` in `sim/interior-data.mjs`', status: 'open', phrases: ['The wagon\'s five tools'] },
  { id: 'E16', area: 'E', priority: 3, request: R.shops, item: '', deliver: '— (all ten `shop-*` delivered 2026-09-26)', names: [], frames: '—', size: '—', standIn: 'none', kind: 'none', plugs: '`SHOP_SPRITES` in `sim/shops.mjs`', status: 'skipped: delivered 2026-09-26 (the `stand-in:` comment in sim/shops.mjs is stale)' },

  // ---------------------------------------------------------------- F: terrain, trees, the norther, fields, icons, marks and effects
  { id: 'F1', area: 'F', priority: 1, request: R.portraits, item: '', deliver: '`portrait-rust`, `-teal`, `-elder`, `-blue`, `-rust-woman`, `-indigo`, `-ochre`, `-blue-girl`, `-girl`, `-boy`, `-smallchild`, `-infant`', names: ['portrait-*'],
    frames: '12', size: '192×192, head and shoulders facing the viewer, matching the sheet figure', standIn: 'Claude\'s `claude-portraits.png`; without it, the idle clip cropped', kind: 'claude', plugs: '`drawPortrait` in `public/family-panel.js`', status: 'open', phrases: ['The `portrait-*` frames'] },
  { id: 'F2', area: 'F', priority: 2, request: R.marks, item: '', deliver: '`mark-need`, `mark-need-rider`, `mark-main`, `mark-idle`, `mark-auto-off`, `mark-auto-on`', names: ['mark-need', 'mark-need-rider', 'mark-main', 'mark-idle', 'mark-auto-off', 'mark-auto-on'],
    frames: '6', size: MARK, standIn: 'Claude\'s `claude-marks.png`', kind: 'claude', plugs: '`panelMark`/`paintMark` in `public/app.js`, `drawMark` in `public/family-panel.js`', status: 'open', phrases: ['the marks drawn today are Claude-drawn', 'the marks drawn are Claude-drawn'] },
  { id: 'F3', area: 'F', priority: 2, request: R.work, item: 'item 15', deliver: '`fx-wood-chips`, `fx-earth-toss`, `fx-dust`, `fx-shavings`, `fx-ripple` (3 frames each, played from the strike) and `tree-fall` (4 frames: a hardwood leaning, going over, down, a bounce)', names: ['fx-*', 'tree-fall*'],
    frames: '3 each; 4', size: FX, standIn: 'a handful of canvas rectangles and arcs (`EFFECTS` in `public/work-art.js`)', kind: 'code', plugs: '`EFFECTS` and `drawWorkLayer` in `public/work-art.js`', status: 'open' },
  { id: 'F4', area: 'F', priority: 2, request: R.advance, item: 'item 2', deliver: '`farm-smoke-rise` (6-8 frames, a tall dark column leaning with the wind over a low orange glow) and `town-smoke-rise` (broader)', names: ['farm-smoke-rise*', 'town-smoke-rise*'],
    frames: '6-8 frames, looping', size: 'Readable at 30-160 px, anchored at the foot of the column', standIn: 'the library\'s `smoke-rise` drawn three to four figures tall; a painted grey plume', kind: 'library', plugs: 'the `fires` in `drawWorld`, `public/app.js` (`window.__firesDrawn`)', status: 'open', phrases: ['smoke seen from afar'] },
  { id: 'F5', area: 'F', priority: 3, request: R.norther, item: 'remaining trees', deliver: 'a gale silhouette for each remaining tree kind and ground mark - pine, cedar, mesquite, live oak, elm, scrub, reeds, prickly pear, and every sized tree of `trees-colonies-1` and `-2` (`<tree>-wind`)', names: ['pine-*-wind', 'cedar-*wind', 'mesquite-*wind', 'live-oak-*wind', 'elm-*wind', 'scrub-wind', 'reeds-wind', 'prickly-pear-wind'],
    frames: '1 each', size: 'Exactly the scale and anchor of the upright sprite', standIn: 'the upright sprite sheared about its foot', kind: 'library', plugs: '`GALE_POSES` and `windLean` in `public/weather-art.js`', status: 'open', phrases: ['the country in a norther'] },
  { id: 'F6', area: 'F', priority: 3, request: R.country, item: 'remaining species', deliver: 'anacua, Texas ebony, tupelo, cedar elm, willow, shortleaf pine at `-pole`/`-log`/`-large`, and hardwood stumps (hickory, walnut, ash, the oaks)', names: ['anacua-*', 'ebony-*', 'tupelo-*', 'cedar-elm-*', 'willow-*', 'pine-shortleaf-*', 'stump-hickory*', 'stump-walnut*', 'stump-ash*', 'stump-oak*'],
    frames: '3 sizes each', size: 'The style and scale of `pine-loblolly-*` and `live-oak-*`', standIn: '`oak-spreading`, `elm`, `cottonwood`; the loblolly for shortleaf; the post-oak or cottonwood stump', kind: 'library', plugs: '`KINDS` in `sim/woods.mjs`, `drawGroundDetail` in `public/app.js`', status: 'open', research: 'which trees grew where in 1836 (docs/BIOMES.md)', phrases: ['hardwood stumps', 'the country of', 'the trees of the colonies'] },
  { id: 'F7', area: 'F', priority: 3, request: R.alamo, item: 'item 4', deliver: 'a night grade and a dawn grade for ground and figures (the Alamo assault), a moonlit night for Béxar\'s storming, and a moonless rain night for San Patricio under which lit windows and fires read (`night-grade`, `dawn-grade`, `moonlight-grade`)', names: ['night-grade*', 'dawn-grade*', 'moonlight-grade*'],
    frames: 'grades', size: LAYER, standIn: 'a dark blue wash by the phase\'s `light`; no night at Béxar', kind: 'code', plugs: '`draw` and `drawNight` in `public/battle-view.js`', status: 'open', research: 'sunrise 6:20 on March 6, 1836 (computed)', phrases: ['Night at Béxar', 'a darkening, moonlit layer', 'The dark of a night fight'] },
  { id: 'F8', area: 'F', priority: 3, request: R.concepcion, item: 'items 1, 3, 7', deliver: '`riverbank-cut-e`/`-w` (a bank face with steps), `river-bend`, `fog-bank-dense`, `fog-bank-thin`, `creek-bed-dry`, `creek-ford`', names: ['riverbank-cut*', 'river-bend*', 'fog-bank-*', 'creek-bed-dry*', 'creek-ford*'],
    frames: '1 each (fog 2-4 drifting)', size: GROUND, standIn: '`earth-rampart` along the bank with trees and a drawn ribbon of water; a pale radial veil for fog', kind: 'library', plugs: '`concepcionScenery`, `grassScenery`, `drawFog` in `public/battle-view.js`', status: 'open', phrases: ['a cut riverbank', 'a pale veil', 'the dry creek bed', 'a dry creek bed'] },
  { id: 'F9', area: 'F', priority: 3, request: R.sanjac, item: 'item 4', deliver: '`marsh-edge` (tiles of cordgrass and open water, to scatter)', names: ['marsh-edge*'],
    frames: 'a few tiles', size: GROUND, standIn: 'the library\'s cordgrass, reeds and water ripples scattered', kind: 'library', plugs: '`drawWorks` in `public/battle-view.js`', status: 'open' },
  { id: 'F10', area: 'F', priority: 3, request: R.south, item: 'items 2 and 5', deliver: 'a campfire burning at night (`campfire-night`) and a live-oak mott as one sprite with shade under it (`live-oak-mott`)', names: ['campfire-night*', 'live-oak-mott*'],
    frames: '2-4; 1', size: PROP, standIn: 'a warm glow in canvas; `live-oak-large` and `mesquite-large` set close', kind: 'library', plugs: '`drawScenery` in `public/battle-view.js`', status: 'open', phrases: ['the groves at Agua Dulce'] },
  { id: 'F11', area: 'F', priority: 3, request: R.country, item: 'palm groves', deliver: '— (delivered 2026-09-22: palm groves scatter sabal palms)', names: [], frames: '—', size: '—', standIn: 'none', kind: 'none', plugs: '`GROUND_CLASSES` in `public/ground-classes.js`', status: 'skipped: delivered 2026-09-22 (the `stand-in:` comment in public/ground-classes.js is stale)' },
  { id: 'F12', area: 'F', priority: 3, request: R.game, item: '', deliver: '— (all nine wildlife sheets delivered 2026-09-21; binding them to the hunt is code: `DRAWN_GAME` in `sim/hunting.mjs`)', names: [], frames: '—', size: '—', standIn: 'words only for the quarry not yet bound', kind: 'words', plugs: '`DRAWN_GAME`, `quarryAt` in `sim/hunting.mjs`', status: 'skipped: delivered 2026-09-21; the remaining work is code' },
  { id: 'F13', area: 'F', priority: 3, request: R.fields, item: '', deliver: '— (the acequia pieces are delivered; what is missing is the researched layout of the ditches)', names: [], frames: '—', size: '—', standIn: 'the `fields` wash', kind: 'none', plugs: '`public/bexar-layout.js`', status: 'skipped: delivered 2026-09-21; the layout is research and code' },
  { id: 'F14', area: 'F', priority: 3, request: R.lesson, item: '', deliver: '`lesson-point`, `lesson-ring`, `lesson-pip`, `lesson-pip-done`', names: [], frames: '4', size: '96×96', standIn: 'CSS', kind: 'code', plugs: '`.panel-icon[data-pointed=true]`, `.lesson-pip` in `public/style.css`', status: 'skipped: on hold 2026-09-28 - the tutorial is removed for now; do not draw until it returns' },
  { id: 'F15', area: 'F', priority: 3, request: R.garden, item: '', deliver: '`garden-young`, `garden-mature`', names: [], frames: '2', size: 'as `corn-young`', standIn: 'none', kind: 'none', plugs: '`public/field-surface.js`', status: 'skipped: withdrawn 2026-09-28 (crops no longer follow the seasons)' },
  // Requests delivered whole or withdrawn: kept on the list, skipped, so nobody draws them again.
  ...[
    ['B', 'Request 2026-09-21 — the children\'s icons', 'delivered 2026-09-22 (`icons-children.png`)'],
    ['C', 'Request 2026-09-27 — Seguín, the ashes, and the later church claim', 'art and storyboard delivered; the trigger is code'],
    ['D', 'Request 2026-09-19 — the ferry flatboat', 'delivered 2026-09-21 (`ferry-flatboat.png`)'],
    ['D', 'Request 2026-09-18 — the steamboat Yellow Stone', 'delivered 2026-09-21'],
    ['D', 'Request 2026-09-13 — stock and the grant', 'delivered 2026-09-14 (`animal-stock`)'],
    ['E', 'Request 2026-09-19 — the places past the box', 'delivered 2026-09-26'],
    ['E', 'Request 2026-09-18 — the Alamo\'s faces seen from the south', 'delivered 2026-09-21'],
    ['F', 'Request 2026-09-20 — the launcher\'s remaining plates — **Delivered 2026-09-20**', 'delivered 2026-09-20'],
    ['F', 'Request 2026-09-19 — the logs fetched from the timber', 'delivered (`icons-family-service.png`)'],
    ['F', 'Request 2026-09-19 — the traveller\'s marker — WITHDRAWN 2026-09-22', 'withdrawn 2026-09-22: there is no marker any more'],
    ['F', 'Request 2026-09-16 — the road\'s icons', 'delivered (`icons-family-service.png`)'],
    ['F', 'Request 2026-09-16 — the camp\'s icons', 'delivered (`icons-family-service.png`)'],
    ['F', 'Request 2026-09-16 — the winter\'s icons', 'delivered (`icons-family-service.png`)'],
    ['F', 'Request 2026-09-15 — action icons for the family panel', 'delivered 2026-09-21'],
    ['F', 'Request 2026-09-20 — the gathering icons', 'delivered (existing `icons-family-subsistence.png` art wired 2026-09-26)'],
    ['F', 'Request 2026-09-20 — the stock icons', 'delivered (existing `icons-family-subsistence.png` art wired 2026-09-26)'],
    ['F', 'Request 2026-09-14 — game', 'delivered 2026-09-15 (`wildlife-deer`)'],
    ['F', 'Request 2026-09-14 — cleared ground', 'delivered 2026-09-14 (`land-clearing`)'],
    ['F', 'Request, 2026-09-21 — the Play Solo menu\'s trash can', 'delivered 2026-09-22'],
  ].map(([area, request, why], i) => ({ id: `${area}S${i + 1}`, area, priority: 3, request, item: '', deliver: '—', names: [], frames: '—', size: '—', standIn: 'none', kind: 'none', plugs: '—', status: `skipped: ${why}` })),
];

/** Every name an item's patterns match, from `<cast>`/`<child>` shorthands, as regular expressions. */
const CAST_FIGURES = ['rust', 'teal', 'elder', 'blue', 'rust-woman', 'indigo', 'ochre', 'blue-girl'];
const CHILD_FIGURES = ['girl', 'boy', 'smallchild'];
export function patternsOf(item) {
  return item.names.flatMap(name => {
    const expanded = name.includes('<cast>') ? CAST_FIGURES.map(f => name.replace('<cast>', f)) : name.includes('<child>') ? CHILD_FIGURES.map(f => name.replace('<child>', f)) : [name];
    return expanded.map(n => new RegExp(`^${n.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[a-z0-9-]*')}$`));
  });
}
/** The Claude-drawn frames and clips (names) an item's patterns match in a Claude manifest. */
export function claudeFor(item, manifest) {
  const names = [...Object.keys(manifest.clips || {}), ...Object.keys(manifest.frames || {})];
  const patterns = patternsOf(item);
  const matched = names.filter(name => patterns.some(p => p.test(name)));
  // Say a clip rather than each of its frames.
  const clipFrames = new Set(Object.entries(manifest.clips || {}).filter(([clip]) => matched.includes(clip)).flatMap(([, clip]) => clip.frames.map(f => f.sprite)));
  return matched.filter(name => !clipFrames.has(name));
}

/** Every `stand-in:` comment in public/ and sim/, with the two lines after it (a comment often names its request on the next). */
export function standInComments(read = path => readFileSync(path, 'utf8')) {
  const found = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) { if (!['assets', 'node_modules'].includes(entry.name)) walk(path); continue; }
      if (!/\.(m?js)$/.test(entry.name)) continue;
      const lines = read(path).split(/\r?\n/);
      lines.forEach((line, i) => {
        // "Not a stand-in:" says what is not one; `stand-in:` in backticks refers to the practice, not to a stand-in here.
        if (!/stand-in:/.test(line) || /not a stand-in:/i.test(line) || /`stand-in:`/.test(line)) return;
        // The comment's own line, and up to two more lines only while they are still comment lines (never the code after it).
        const window = [line];
        for (let k = i + 1; k < Math.min(lines.length, i + 3) && /^\s*(\/\/|\*|\/\*)/.test(lines[k]); k++) window.push(lines[k].replace(/^\s*(\/\/|\/\*\*?|\*)\s?/, ''));
        found.push({ where: `${path.replace(/^.*?(public|sim)\//, '$1/')}:${i + 1}`, text: window.join(' ') });
      });
    }
  };
  walk(fileURLToPath(new URL('../../public', import.meta.url)).replace(/\\/g, '/'));
  walk(fileURLToPath(new URL('../../sim', import.meta.url)).replace(/\\/g, '/'));
  return found;
}
const norm = text => text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
/** The item a stand-in comment names: by its request's date and title or one of the item's phrases, or the Claude section. */
export function itemNamed(text) {
  const t = norm(text);
  if (t.includes('claude-drawn stand-ins')) return ITEMS.find(item => item.request.startsWith('Claude-drawn'));
  return ITEMS.find(item => {
    if ((item.phrases || []).some(phrase => t.includes(norm(phrase)))) return true;
    const date = item.request.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!date || !t.includes(date)) return false;
    const title = norm(item.request.replace(/^Request,? \d{4}-\d{2}-\d{2}(?: \(second\))? — /, '').replace(/\*\*.*$/, '').replace(/ — (withdrawn|delivered).*$/i, ''));
    // The title as the comment gives it: the whole, or up to its first colon or comma.
    return [title, title.split(/[:,]/)[0]].some(part => part.length > 6 && t.includes(part.trim()));
  });
}
