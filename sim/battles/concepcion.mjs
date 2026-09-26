// The fight at Mission Concepción, October 27-28, 1835, on the engine (sim/battle-stage.mjs, docs/BATTLES.md §6). Staged from
// docs/battle-research/staging.md §1, whose every time, count and word is sourced there and in
// docs/battle-research/concepcion.md; the claims are `HIST-TEX-480` to `-482` and `-484`, and `FIC-GONZ-420` to `-424`, in
// HISTORY.md.
//
// The shape of it (`HIST-TEX-480`, `-481`): Bowie and Fannin's division, about ninety-two, marches up the river from Espada on
// the afternoon of the 27th and camps in a bend of the San Antonio River near Mission Concepción, under a bank five or six
// feet high, the river at its back - Fannin's company on the south side of the bend, Bowie with Coleman's, Goheen's and
// Bennet's on the north. Guns fire from the town at sundown; the men sleep on their arms. In the fog after sunrise Mexican
// cavalry rides onto the picket, and for an hour the camp is ringed and fired on at long range to no effect, while the men
// cut steps in the bank, climb to fire and drop back to load. About eight the fog lifts: infantry in line two hundred yards
// off, a brass gun at eighty, and the charge is sounded. Three charges are beaten back; the gunners are shot down three times;
// Coleman's men are moved across to Fannin's side, and Richard Andrews is hit crossing the open. The retreat is sounded, the
// Texians take the gun and turn it, and the Mexicans go back over the river toward Béxar. The main army comes up from Espada
// an hour later; a padre comes out with carts for the Mexican dead and wounded; Andrews dies in the afternoon and is buried
// under a pecan.
//
// Nothing here depends on who came (`HIST-TEX-021`): no family's person changes a count, a place or a minute.
//
// This file imports nothing from the director or the army, so the engine and the clock can read it without a cycle.

/**
 * The missions, in miles east and south of Béxar's plaza: the same numbers as sim/army.mjs `MISSIONS` (tests hold the two
 * equal), repeated here so this file needs nothing from the army.
 */
export const CONCEPCION_PLACES = Object.freeze({ espada: { dx: 1.24, dy: 7.35 }, mission: { dx: 0.06, dy: 2.32 } });
/** Where the bend is from the mission: about a quarter of a mile to the north-west (`FIC-GONZ-420`). */
const BEND_FROM_MISSION = Object.freeze({ dx: -0.2, dy: -0.2 });

/**
 * The ground, read off the map's Béxar. ceiling: the map draws no San Antonio River below the town, so the bend is placed by
 * its distance from the mission (a quarter mile north-west, within the sources' 500 yards) rather than on the river's own
 * line, and the river, the bank and the timber are drawn as this engagement's scenery; a river traced from the map's own
 * water would be the way out. East is the plain; the men face it with the river at their backs.
 */
export function concepcionGround(world) {
  const bexar = world.map.sites.bexar;
  const at = (dx, dy) => ({ x: bexar.x + dx, y: bexar.y + dy });
  const mission = at(CONCEPCION_PLACES.mission.dx, CONCEPCION_PLACES.mission.dy), espada = at(CONCEPCION_PLACES.espada.dx, CONCEPCION_PLACES.espada.dy);
  const bend = { x: mission.x + BEND_FROM_MISSION.dx, y: mission.y + BEND_FROM_MISSION.dy };
  const off = (dx, dy) => ({ x: bend.x + dx, y: bend.y + dy });
  const between = (a, b, part) => ({ x: a.x + (b.x - a.x) * part, y: a.y + (b.y - a.y) * part });
  return {
    bend,
    mission,
    espada,
    // The march up the river: out of Espada, and the column's tail a little behind its head.
    espadaTail: { x: espada.x + 0.04, y: espada.y + 0.06 },
    // The two arms of the bend, about a hundred yards apart (`HIST-TEX-480`): Fannin south, Bowie north, under the bank.
    fannin: off(0, 0.1),
    bowie: off(0, -0.1),
    // Coleman's men cutting across the open to Fannin's side, and where they come in behind him (`HIST-TEX-481`).
    open: off(0.04, 0),
    fanninRear: off(-0.015, 0.08),
    // The horses tied in the bottom, out of range.
    horses: off(-0.045, 0),
    // The Mexican infantry's line on the plain, about 200 yards off the Texians' right, and how far each charge came: the gun
    // in front of it about eighty yards from the bank.
    line: off(0.105, 0.13),
    charge: off(0.07, 0.095),
    gunSpot: off(0.052, 0.077),
    // The cavalry: first seen coming out of the fog, then across the front at long range, then on the flanks.
    fogEdge: off(0.34, -0.06),
    ring: off(0.17, -0.02),
    flank: off(0.19, -0.1),
    // The infantry goes back over the river toward Béxar, and out of sight.
    ford: off(0.1, -0.42),
    away: off(0.06, -0.95),
    // Where the Texians go up onto the plain to the gun.
    upTheBank: off(0.035, 0.06),
    // The main army on the road up from Espada: where it is when the firing stops, and where it camps.
    armyRoad: between(espada, mission, 50 / 90),
    armyCamp: off(0.14, 0.18),
    // Facing east: the plain the men look out over.
    toward: { x: 1, y: 0 },
  };
}

/**
 * What stands there that the map does not draw: the river behind the men, the cut bank in front of them, the pecans and
 * cottonwoods of the bottom, and the mission's towers. stand-in: docs/ART_REQUESTS.md, 2026-09-25 "a cut riverbank with steps
 * in it" (`earth-rampart` laid along the bank), "Mission Concepción" (`church-generic`), and the river as a drawn ribbon.
 */
function concepcionScenery(ground) {
  const { bend, mission } = ground;
  const p = (dx, dy) => ({ x: bend.x + dx, y: bend.y + dy });
  const items = [
    { water: [p(-0.02, -0.16), p(-0.075, -0.1), p(-0.085, 0), p(-0.075, 0.1), p(-0.02, 0.17)], width: 0.028 },
  ];
  for (let i = 0; i <= 8; i++) items.push({ sprite: 'earth-rampart', ...p(0.022, -0.085 + i * 0.021), size: 1.3 });
  const trees = [[-0.05, -0.08], [-0.058, -0.03], [-0.06, 0.02], [-0.052, 0.075], [-0.035, 0.11], [-0.03, -0.12], [-0.065, 0.05]];
  trees.forEach(([dx, dy], i) => items.push({ clip: i % 3 === 1 ? 'mesquite-large-wind' : 'pecan-large-wind', ...p(dx, dy), size: 3.2 }));
  items.push({ sprite: 'church-generic', x: mission.x, y: mission.y, size: 4.5 });
  return items;
}

const TEX = 'texian', MEX = 'mexican';
/** One line. `name` only ever on a documented line (sim/battle-stage.mjs `checkEngagement`). */
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** Bowie's companies on the north arm of the bend, in every phase they are there. */
const bowie = (style, at, extra = {}) => ({ key: 'bowie', side: TEX, name: 'Bowie with Coleman’s, Goheen’s and Bennet’s', count: 41, drawn: 20, style, spread: { width: 0.2, depth: 0.06 }, ...at, ...extra });
/** Ugartechea's cavalry, a sample of fifty. */
const cavalry = (style, at, extra = {}) => ({ key: 'cavalry', side: MEX, name: 'Mexican cavalry', count: 200, drawn: 40, style, mounted: true, ...at, ...extra });

export const CONCEPCION = Object.freeze({
  id: 'concepcion',
  name: 'The fight at Concepción',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): the division leaving Espada at two on the 27th.
  startKey: 'detachment-out',
  claimId: 'HIST-TEX-020',
  outcome: 'The Mexican attack is beaten back and its gun taken; one Texian killed.',
  held: name => `${name} is with Bowie and Fannin's division at Concepción, and comes back to the army with them.`,
  sides: {
    // About ninety-two in all (`HIST-TEX-480`): Fannin's company by subtraction about fifty-one, drawn one to one.
    texian: { name: 'Fannin’s company', count: 51, drawn: 26, claimId: 'HIST-TEX-480', spread: { width: 0.22, depth: 0.06 } },
    // Infantry about a hundred (Austin; disputed with Barr's 275 all told): a sample of sixty in line.
    mexican: { name: 'Mexican infantry', count: 100, drawn: 50, claimId: 'HIST-TEX-480' },
  },
  // Andrews fell, and a family's person may: nobody's side is forbidden a fall here.
  noFalling: [],
  // The brass gun in front of the infantry, served by six (`HIST-TEX-480`). ceiling: the second, heavier gun that fired three
  // times at long range near the close is told in the caption and not drawn; a second gun on the engine is the way out.
  cannon: { side: MEX, offset: { along: 0.028, across: 0.004 }, metal: 'bronze', crew: 6, claimId: 'HIST-TEX-480' },
  // No flag and no drum on the Texian side ("we fought at Conception without a flag", Creed Taylor, `HIST-TEX-480`).
  flag: null,
  // The regulation's three words of a volley (`HIST-TEX-482`): documented in the Spanish regulation of 1808, reconstructed
  // for the Mexican army of 1835, so said as reconstructed with the claim that says so.
  commands: {
    volley: [
      { text: '¡Preparen las armas!', gloss: 'Make ready!', kind: 'reconstructed', claimId: 'HIST-TEX-482' },
      { text: '¡Apunten!', gloss: 'Aim!', kind: 'reconstructed', claimId: 'HIST-TEX-482' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'reconstructed', claimId: 'HIST-TEX-482' },
    ],
  },
  phases: [
    {
      // Oct 27, 14:00 - 16:00. Up the river from Espada, past San Juan and San José (`HIST-TEX-019`; the hour `FIC-GONZ-420`).
      id: 'march', minutes: 120, title: 'Up the river from Espada', step: 20, claimId: 'HIST-TEX-019',
      caption: 'Bowie and Fannin take about ninety men up the San Antonio River from Mission Espada, past San Juan and San José, to find a camp nearer Béxar. The rest of the army stays at Espada.',
      texian: { style: 'column', from: 'espada', to: 'fannin', action: 'advance', fire: 'none', faceTo: 'bend' },
      mexican: { style: 'ranks', at: 'line', action: 'gone', fire: 'none' },
      groups: [bowie('column', { from: 'espadaTail', to: 'bowie', action: 'advance', faceTo: 'bend' })],
      gun: false,
      lines: [
        say('c-close', 10, TEX, 'volunteer', 'reconstructed', 'Close up, and keep to the river.'),
        say('c-sanjose', 60, TEX, 'volunteer', 'reconstructed', 'That’s San José over there.'),
        say('c-here', 108, TEX, 'volunteer', 'reconstructed', 'Here — the bend. Camp under the bank.'),
      ],
    },
    {
      // 16:00 - 05:40. The camp in the bottom: guns from the town at sundown, men asleep on their arms, pickets out, lookouts
      // in the mission's cupola (`HIST-TEX-480`). Not watched: the clock goes at the class's own pace, and lands on first light.
      id: 'camp', minutes: 820, title: 'Camp in the river bend', claimId: 'HIST-TEX-480',
      caption: 'The men camp in the river bottom under a high bank, the river behind them, horses tied below. At sundown guns fire from Béxar and hit nobody. The men sleep on their arms, with pickets out and lookouts in the mission tower. The night passes quietly.',
      texian: { style: 'bank', at: 'fannin', action: 'hold', fire: 'none' },
      mexican: { style: 'ranks', at: 'line', action: 'gone', fire: 'none' },
      groups: [bowie('bank', { at: 'bowie', action: 'hold' })],
      gun: false,
      lines: [
        say('c-guns', 110, TEX, 'volunteer', 'reconstructed', 'Guns from the town.'),
        say('c-arms', 160, TEX, 'volunteer', 'reconstructed', 'Sleep with your rifle tonight.'),
      ],
    },
    {
      // 05:40 - 06:50. Breakfast, horses saddled for a scout, and the fog comes down thick (Creed Taylor).
      id: 'breakfast', minutes: 70, title: 'Fog at daybreak', step: 10, claimId: 'HIST-TEX-480', fog: [0.3, 0.9],
      caption: 'At daybreak the men eat jerked beef and cornbread and saddle horses to scout toward the town. A thick fog comes down on the river.',
      texian: { style: 'bank', at: 'fannin', action: 'hold', fire: 'none' },
      mexican: { style: 'ranks', at: 'line', action: 'gone', fire: 'none' },
      groups: [bowie('bank', { at: 'bowie', action: 'hold' })],
      gun: false,
      lines: [
        say('c-fog', 20, TEX, 'volunteer', 'reconstructed', 'Can’t see across the river for the fog.'),
        say('c-scout', 50, TEX, 'volunteer', 'reconstructed', 'Saddle up for the scout.'),
      ],
    },
    {
      // 06:50 - 07:00. The cavalry's advance guard comes out of the fog and fires on the sentinel just relieved, Henry Karnes;
      // his powder horn is shot away. The camp is called to arms (`HIST-TEX-480`). contact from here.
      id: 'alarm', minutes: 10, title: 'Horsemen in the fog', step: 2, contact: true, claimId: 'HIST-TEX-480', fog: [0.95, 1],
      caption: 'About half an hour after sunrise, Mexican horsemen ride out of the fog and fire on the picket. The camp runs to its rifles and gets down under the bank.',
      texian: { style: 'bank', at: 'fannin', action: 'hold', fire: 'none' },
      mexican: { style: 'ranks', at: 'line', action: 'gone', fire: 'none' },
      groups: [bowie('bank', { at: 'bowie', action: 'hold' }), cavalry('mounted', { from: 'fogEdge', to: 'ring', action: 'advance', fire: 'picket' })],
      gun: false,
      lines: [
        say('c-karnes', 1, TEX, 'picket', 'reconstructed', 'Horsemen in the fog! They’ve fired on Karnes!'),
        say('c-alli', 2, MEX, 'dragoon', 'reconstructed', '¡Allí están! ¡Fuego!', { group: 'cavalry', gloss: 'There they are! Fire!' }),
        say('c-tobank', 4, TEX, 'volunteer', 'reconstructed', 'Get your rifles! Down under the bank!'),
      ],
    },
    {
      // 07:00 - 08:00. Ringed and fired on at long range "with no other effect than a waste of ammunition"; steps cut in the
      // bank with knives; climb, fire, drop back to load; a ball breaks the knife in a man's waistband (`HIST-TEX-480`). The
      // length is disputed (the report under an hour, Barr about two); an hour here (`FIC-GONZ-420`).
      id: 'ringed', minutes: 60, title: 'Ringed in the fog', step: 10, contact: true, claimId: 'HIST-TEX-480', fog: [1, 0.75],
      caption: 'The cavalry surrounds the camp in the fog and fires from a distance, doing no harm. The Texians cut steps in the bank with their knives, climb up to fire, and drop back under the bank to load.',
      texian: { style: 'bank', at: 'fannin', action: 'hold', fire: 'scattered' },
      mexican: { style: 'column', at: 'line', action: 'gone', fire: 'none' },
      groups: [bowie('bank', { at: 'bowie', action: 'hold', fire: 'scattered' }), cavalry('mounted', { at: 'ring', action: 'stand', fire: 'scattered' })],
      gun: false,
      lines: [
        say('c-under', 5, TEX, 'volunteer', 'reconstructed', 'Keep under the bank!'),
        say('c-steps', 15, TEX, 'volunteer', 'reconstructed', 'Cut steps — here, with your knife.'),
        say('c-waste', 25, TEX, 'volunteer', 'reconstructed', 'Don’t waste powder on the fog.'),
        say('c-many', 35, TEX, 'volunteer', 'reconstructed', 'How many are out there?'),
        say('c-ten', 44, TEX, 'volunteer', 'reconstructed', 'Can’t see ten yards.'),
        say('c-knife', 52, TEX, 'volunteer', 'reconstructed', 'I’m hit — no. The knife took it.'),
      ],
    },
    {
      // 08:00 - 08:10. The fog lifts: infantry in line about two hundred yards off, cavalry across the front and flanks, the
      // gun ahead of the line. "The engagement was immediately general" (`HIST-TEX-480`). The director's `concepcion`.
      id: 'fog-lifts', minutes: 10, title: 'The fog lifts', step: 5, contact: true, claimId: 'HIST-TEX-480', fog: [0.6, 0],
      caption: 'About eight o’clock the fog lifts. Mexican infantry stands in line on the plain about two hundred yards off, with a brass cannon in front of it and cavalry across the front and flanks. The firing becomes general.',
      texian: { style: 'bank', at: 'fannin', action: 'hold', fire: 'scattered' },
      mexican: { style: 'ranks', at: 'line', action: 'stand', fire: 'volley' },
      groups: [bowie('bank', { at: 'bowie', action: 'hold', fire: 'scattered' }), cavalry('mounted', { from: 'ring', to: 'flank', action: 'stand', fire: 'picket' })],
      lines: [
        say('c-lifts', 1, TEX, 'volunteer', 'reconstructed', 'The fog’s lifting!'),
        say('c-gun', 3, TEX, 'volunteer', 'reconstructed', 'Infantry — a whole line of them, and a cannon!'),
      ],
    },
    {
      // 08:10 - 08:30. The gun opens with grape and canister at about eighty yards and the charge is sounded; three charges,
      // five discharges, the crew shot down three times; the canister goes high and brings down pecans; Coleman's men are
      // moved across to Fannin's side, and Andrews is hit crossing the open (`HIST-TEX-480`, `-481`). The order within is the
      // game's (`FIC-GONZ-420`). A family's person hit here is hit at one of the gun's discharges (`FIC-GONZ-422`).
      id: 'charges', minutes: 20, title: 'Three charges', step: 2, contact: true, claimId: 'HIST-TEX-480',
      caption: 'The Mexican cannon fires grapeshot at about eighty yards and the bugle sounds the charge. Three times the infantry comes on behind the gun, and three times the riflemen shoot down the gunners and drive it back. Bowie moves men across the open to help Fannin’s side.',
      texian: { style: 'bank', at: 'fannin', action: 'hold', fire: 'scattered' },
      mexican: { style: 'ranks', keys: [[0, 'line'], [3, 'charge'], [5, 'line'], [8, 'charge'], [10, 'line'], [13, 'charge'], [16, 'line']], action: 'advance', fire: 'volley' },
      groups: [
        bowie('bank', { at: 'bowie', action: 'hold', fire: 'scattered' }, { count: 31, drawn: 15 }),
        { key: 'coleman', side: TEX, name: 'Coleman’s men', count: 10, drawn: 5, style: 'loose', spread: { width: 0.09, depth: 0.05 }, keys: [[0, 'bowie'], [4, 'bowie'], [10, 'open'], [16, 'fanninRear']], action: 'advance', fire: 'scattered' },
        cavalry('mounted', { at: 'flank', action: 'stand', fire: 'picket' }),
      ],
      cannon: [2, 5, 8, 11, 14],
      falls: [
        { side: MEX, count: 3, at: 3, claimId: 'HIST-TEX-480' }, { side: MEX, count: 3, at: 6, claimId: 'HIST-TEX-480' },
        { side: MEX, count: 3, at: 9, claimId: 'HIST-TEX-480' }, { side: MEX, count: 3, at: 12, claimId: 'HIST-TEX-480' },
        { side: MEX, count: 3, at: 15, claimId: 'HIST-TEX-480' },
        // Richard Andrews, crossing the open with Coleman's men (`HIST-TEX-481`); never named on the field.
        { side: TEX, group: 'coleman', count: 1, at: 11, claimId: 'HIST-TEX-481', carried: true },
      ],
      lines: [
        say('c-bugle-1', 1, MEX, 'bugler', 'documented', '[The bugle sounds the charge]', { claimId: 'HIST-TEX-480', gloss: '“a charge is sounded” (Bowie and Fannin’s report)' }),
        say('c-bayoneta', 2, MEX, 'officer', 'reconstructed', '¡Armen la bayoneta!', { gloss: 'Fix bayonets!' }),
        say('c-marchen', 3, MEX, 'officer', 'reconstructed', '¡Marchen!', { gloss: 'March!' }),
        say('c-gunners', 4, TEX, 'volunteer', 'reconstructed', 'The gunners! Pick off the gunners!'),
        say('c-wait', 7, TEX, 'volunteer', 'reconstructed', 'Load, and wait for them!'),
        say('c-bugle-2', 8, MEX, 'bugler', 'documented', '[The charge is sounded again]', { claimId: 'HIST-TEX-480' }),
        say('c-pecans', 9, TEX, 'volunteer', 'reconstructed', 'That’s pecans, not grape!', { gloss: 'the canister went high into the trees (Smithwick)' }),
        say('c-comeon', 12, TEX, 'volunteer', 'reconstructed', 'Come on, then!'),
        say('c-bugle-3', 13, MEX, 'bugler', 'documented', '[A third time the charge is sounded]', { claimId: 'HIST-TEX-480' }),
        say('c-down', 16, TEX, 'volunteer', 'reconstructed', 'Down! Load under the bank!'),
      ],
    },
    {
      // 08:30 - 08:50. "Retreat is sounded." The Texians go up the bank, take the gun and turn it on the retreating troops; the
      // second gun fires three times at long range and is got off by mules; the infantry wades back toward Béxar; the cavalry
      // withdraws in order (`HIST-TEX-480`).
      id: 'retreat', minutes: 20, title: 'The gun taken', step: 5, contact: true, claimId: 'HIST-TEX-480',
      caption: 'The bugle sounds the retreat. The Texians climb the bank, take the cannon and turn it on the retreating soldiers. The Mexican infantry wades back across the river toward Béxar; the cavalry rides off.',
      texian: { style: 'loose', keys: [[0, 'fannin'], [6, 'upTheBank']], action: 'advance', fire: 'scattered', spread: { width: 0.24, depth: 0.12 } },
      mexican: { style: 'rout', keys: [[0, 'line'], [12, 'ford'], [20, 'away']], action: 'withdraw', face: 'away', fire: 'none', spread: { width: 0.36, depth: 0.26 } },
      groups: [bowie('loose', { keys: [[0, 'bowie'], [8, 'open']], action: 'advance', fire: 'scattered' }), cavalry('mounted', { from: 'flank', to: 'away', action: 'withdraw', face: 'away', fire: 'none' })],
      gun: { side: TEX, at: 'gunSpot' },
      cannon: [7, 12],
      lines: [
        say('c-bugle-4', 1, MEX, 'bugler', 'documented', '[The bugle sounds the retreat]', { claimId: 'HIST-TEX-480', gloss: '“Retreat is sounded” (the report)' }),
        say('c-take', 3, TEX, 'volunteer', 'reconstructed', 'The gun! Take the gun!'),
        say('c-retirada', 4, MEX, 'officer', 'reconstructed', '¡Retirada!', { gloss: 'Fall back!' }),
        say('c-turn', 6, TEX, 'volunteer', 'reconstructed', 'Turn it on them!'),
      ],
    },
    {
      // 08:50 - 09:30. Quiet. Men give water to the Mexican wounded left on the field (Creed Taylor; Smithwick). The main army
      // is on the road up from Espada.
      id: 'aftermath', minutes: 40, title: 'After the fight', step: 20, claimId: 'HIST-TEX-481',
      caption: 'It is quiet. Some of the Texians carry water to the Mexican wounded left on the field. The rest of the army is hurrying up the river road from Espada.',
      texian: { style: 'loose', at: 'upTheBank', action: 'hold', fire: 'none', spread: { width: 0.24, depth: 0.12 } },
      mexican: { style: 'rout', at: 'away', action: 'gone', fire: 'none' },
      groups: [bowie('loose', { at: 'open', action: 'hold' }), { key: 'army', side: TEX, name: 'The main army', count: 300, drawn: 30, style: 'column', from: 'armyRoad', to: 'mission', action: 'advance', fire: 'none', faceTo: 'bend' }],
      gun: { side: TEX, at: 'gunSpot' },
      lines: [
        say('c-water', 8, TEX, 'volunteer', 'reconstructed', 'Give him water.'),
        say('c-carry', 22, TEX, 'volunteer', 'reconstructed', 'Carry him down under the bank, gently.'),
      ],
    },
    {
      // 09:30 - 10:00. The main army comes up, loud at having missed it; a padre comes out from the town with carts and, after
      // speaking with Austin, takes the Mexican dead and wounded (`HIST-TEX-481`).
      id: 'main-army', minutes: 30, title: 'The army comes up', step: 10, claimId: 'HIST-TEX-481',
      caption: 'The main army arrives from Espada, too late for the fight. A priest comes out from Béxar with carts and, after speaking with Austin, takes the Mexican dead and wounded back into the town.',
      texian: { style: 'loose', at: 'upTheBank', action: 'hold', fire: 'none', spread: { width: 0.24, depth: 0.12 } },
      mexican: { style: 'rout', at: 'away', action: 'gone', fire: 'none' },
      groups: [bowie('loose', { at: 'open', action: 'hold' }), { key: 'army', side: TEX, name: 'The main army', count: 300, drawn: 30, style: 'loose', from: 'mission', to: 'armyCamp', action: 'advance', fire: 'none', faceTo: 'bend', spread: { width: 0.34, depth: 0.16 } }],
      gun: { side: TEX, at: 'gunSpot' },
      lines: [
        say('c-army', 6, TEX, 'volunteer', 'reconstructed', 'Here’s the rest of the army.'),
        say('c-missed', 16, TEX, 'volunteer', 'reconstructed', 'All over? We came as fast as we could.', { group: 'army' }),
      ],
    },
    {
      // 10:00 - 14:00. The army camps at Concepción. Andrews dies after several hours, "long enough to know that the fight was
      // won", and is buried under a pecan (`HIST-TEX-481`). Not watched.
      id: 'burial', minutes: 240, title: 'The army at Concepción', claimId: 'HIST-TEX-481',
      caption: 'The army camps at Concepción. Richard Andrews, shot crossing the open ground, lives several hours - long enough to know the fight was won - and is buried under a pecan tree by the river.',
      texian: { style: 'loose', at: 'upTheBank', action: 'hold', fire: 'none', spread: { width: 0.24, depth: 0.12 } },
      mexican: { style: 'rout', at: 'away', action: 'gone', fire: 'none' },
      gun: { side: TEX, at: 'gunSpot' },
    },
  ],
  ground: concepcionGround,
  scenery: concepcionScenery,
});
