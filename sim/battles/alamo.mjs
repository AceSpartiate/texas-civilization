// The Alamo: the thirteen days of the siege as a living siege, and the dawn assault of March 6, 1836, on the engine
// (sim/battle-stage.mjs, docs/BATTLES.md §7). Staged from docs/battle-research/staging.md §5 and docs/battle-research/alamo.md;
// the claims are `HIST-TEX-500` to `-506` and `FIC-GONZ-430` to `-434` in HISTORY.md, beside the siege's own `HIST-TEX-054` to
// `-058` and `-430` to `-439`.
//
// Owner, 2026-09-25 (docs/BATTLES.md §2b): "I'm assuming that the alamo is the longest since it's a long siege?" - the siege's
// days are lived (the Mexican guns every day and the defenders' answer, the batteries and the lines creeping closer, the fight
// at the huts, couriers going out, the Gonzales men riding in on March 1), and the assault is the longest held single fight.
// And: a student may watch their own man fall, drawn without gore, the camera on the wall, while the family at home learns
// only when the word reaches them.
//
// The shape (`HIST-TEX-054`, `-500` to `-506`): the Mexican army into Béxar on the afternoon of February 23 and the garrison
// into the Alamo; the red flag, the parley and the 18-pounder's answer; a bombardment every day from about 350 yards, a new
// battery at 300 on the 25th and guns on three sides from the 26th; the huts fought over and burned on the 25th; the relief
// in before dawn on March 1; Bonham on the 3rd and the north battery within musket shot; the guns stopping at ten on the 5th;
// the columns forming in the dark; the assault from about five - the alarm, the canister, the columns reeling and merging at
// the north wall, the climb, the fall back into the long barrack and the church, the rooms, the end about sunrise - and the
// pyres after.
//
// Nothing here depends on who came (`HIST-TEX-058`): no family's person changes a count, a place or a minute.
//
// This file imports nothing, so the engine and the clock can read it without a cycle.

/**
 * Where the compound's plan lies on the map, miles east and south of Béxar's site point, and its feet a foot of the map: the
 * same numbers as sim/alamo-posts.mjs `ALAMO_ORIGIN`, copied so this file imports nothing (tests/battle-alamo.test.mjs holds
 * the two equal).
 */
export const ALAMO_PLAN_ORIGIN = Object.freeze({ x: 0.28673085317694386, y: -0.1601460310951376 });

/**
 * The ground, in the plan's feet (x east, y south, from the north-west corner of the north wall; public/alamo-layout.js).
 * Inside the walls from the plan; outside from the record where it gives distances (`HIST-TEX-505`: guns at 350 yards on
 * the 24th and a battery at 300 on the 25th, the huts at 90-100 yards; `HIST-TEX-437`: the north battery within musket shot
 * on March 3; `HIST-TEX-500`: the columns' directions) and reconstructed where it does not (`FIC-GONZ-430`).
 */
export const ALAMO_FEET = Object.freeze({
  // Inside.
  plaza: [110, 280], 'north-wall': [122, 20], 'north-battery': [116, 24], 'west-wall': [22, 255], 'sw-battery': [24, 514],
  'south-wall': [115, 512], palisade: [244, 470], 'church-platform': [388, 393], 'church-front': [300, 393],
  'long-barrack': [221, 285], 'long-barrack-door': [196, 285], 'travis-quarters': [18, 64], 'north-in': [122, 70],
  'plaza-gun': [150, 330], 'east-wall': [378, 300], 'gate-in': [101, 515], 'gate-out': [104, 560],
  // The town, the Mexican army's road in, and Músquiz's house on the plaza (`HIST-TEX-432`).
  town: [-1514, 846], 'west-road': [-4200, 900], 'town-edge': [-1050, 760], musquiz: [-1440, 830],
  // The four quarters outside, which the walls face.
  'north-out': [122, -700], 'west-out': [-700, 260], 'south-out': [140, 1200], 'east-out': [1100, 330],
  // The batteries, and the north battery brought closer (350 yards is 1050 feet; "within musket shot", about 200 yards).
  'battery-west': [-850, 330], 'battery-south': [150, 1437], 'battery-north-far': [122, -1050], 'battery-north-mid': [122, -800], 'battery-north-close': [122, -600],
  // The Mexican lines round the walls, far and then near.
  'lines-north': [122, -900], 'lines-east': [980, 300], 'lines-south': [140, 1280], 'lines-west': [-760, 250],
  'lines-north-near': [122, -520], 'lines-east-near': [760, 300], 'lines-south-near': [140, 1000], 'lines-west-near': [-560, 250],
  // The huts south-west of the walls, 90-100 yards out, and how far the sortie went.
  huts: [40, 830], sortie: [80, 690],
  // The relief: waiting in the dark short of the lines on the Gonzales road, then in by the east and round to the gate.
  'relief-wait': [3200, 250], 'relief-east': [900, 620],
  // The columns (`HIST-TEX-500`): where each forms up, how near it gets before the alarm, how close under the guns, where it
  // reels back to, and the foot of the north wall where they merged (`HIST-TEX-501`).
  'cos-formup': [-560, -460], 'cos-near': [-320, -260], 'cos-close': [-140, -90], 'cos-reel': [-240, -190],
  'duque-formup': [122, -760], 'duque-near': [122, -420], 'duque-close': [122, -160], 'duque-reel': [122, -270],
  'romero-formup': [980, 200], 'romero-near': [680, 220], 'romero-close': [480, 240], 'romero-reel': [580, 200],
  'morales-formup': [150, 1160], 'morales-near': [100, 860], 'morales-close': [50, 650], 'sw-foot': [10, 575],
  reserve: [122, -960], 'cavalry-east': [1500, 360], 'cavalry-south': [520, 1500], 'cavalry-camp': [900, -900],
  'north-foot': [122, -45], 'north-foot-w': [55, -40], 'north-foot-e': [195, -35], 'east-prairie': [1350, 430], 'mexican-camp': [-900, -300],
  // The pyres, outside the walls to the south-east (`HIST-TEX-501`: the dead stacked and burned).
  pyres: [700, 1100],
  // What the camera takes in: the siege with its batteries; the assault with its columns; the north wall close; the plaza.
  'frame-siege-a': [-950, -1150], 'frame-siege-b': [1150, 1500],
  'frame-assault-a': [-700, -900], 'frame-assault-b': [1100, 1250],
  'frame-north-a': [-450, -520], 'frame-north-b': [650, 420],
  'frame-plaza-a': [-300, -150], 'frame-plaza-b': [700, 700],
  'frame-relief-a': [-200, -300], 'frame-relief-b': [3400, 800],
  'frame-arrival-a': [-4300, -600], 'frame-arrival-b': [700, 1300],
});
/** The ground on this class's map: every point of `ALAMO_FEET` in miles from the map's origin. */
export function alamoGround(world) {
  const site = world.map.sites.bexar;
  const ground = {};
  for (const [name, [x, y]] of Object.entries(ALAMO_FEET)) ground[name] = { x: site.x + ALAMO_PLAN_ORIGIN.x + x / 5280, y: site.y + ALAMO_PLAN_ORIGIN.y + y / 5280 };
  return ground;
}

/**
 * Whether anybody of a family somebody is playing is in it now: in the garrison or inside the walls, or with the Gonzales men
 * going in. The
 * siege's quiet days are watched a quarter-day a tick only then (`watched: 'involved'`, `FIC-GONZ-431`); the assault is
 * held for everybody, as every battle is (docs/BATTLES.md §2.2).
 */
export function alamoInvolved(world) {
  for (const person of Object.values(world.entities || {})) {
    if (!person.householdId || person.kind !== 'person' || ['dead', 'captured'].includes(person.health?.condition)) continue;
    const service = person.service;
    // In the garrison at Béxar before the army comes too, so the clock lands on the afternoon it does and not past it.
    const garrison = service?.kind === 'garrison' && service.status === 'serving';
    if (!service?.besieged && !garrison && !(service?.kind === 'relief' && service.riding)) continue;
    const household = world.households?.[person.householdId];
    if (household?.played && !household.absent) return true;
  }
  return false;
}

const TEX = 'texian', MEX = 'mexican';
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** A day of the siege begins at six in the morning, a night at six in the evening. */
const DAY_LIGHT = 0, NIGHT_LIGHT = 0.72;

/**
 * The garrison on its walls, as parts of the Texian side, each facing out over its own wall (`FIC-GONZ-430`: posts weighted
 * to the north and the west). Drawn one figure for about five men; a family's own people are drawn at their own posts.
 * ceiling: the garrison drawn about one to five, where the staging sheet asked one to one - at the compound's size on the map
 * a hundred and ninety figures along walls a few hundred feet long are one blot; a closer camera for the compound is the way
 * out, and the family's own are always drawn one to one.
 */
function walls(fire, { thin = false, gone = [] } = {}) {
  const part = (id, at, face, drawn, width, extra = {}) => ({ id, at, face, style: 'wall', drawn: thin ? Math.max(1, Math.ceil(drawn / 3)) : drawn, fire, spread: { width, depth: 0.004 }, ...extra });
  return [
    part('north', 'north-wall', 'north-out', 9, 0.034, { name: 'The north wall' }),
    part('west', 'west-wall', 'west-out', 7, 0.068, { name: 'The west wall' }),
    part('southwest', 'sw-battery', 'town', 3, 0.005, { name: 'The 18-pounder' }),
    part('south', 'south-wall', 'south-out', 5, 0.018, { name: 'The low barrack' }),
    part('palisade', 'palisade', 'south-out', 4, 0.016, { name: 'The palisade' }),
    part('church', 'church-platform', 'east-out', 3, 0.006, { name: 'The church' }),
  ].filter(one => !gone.includes(one.id));
}
/** The Mexican lines round the walls: pickets and working parties, far until March 3 and near after. */
function lines(near, fire = 'none') {
  const at = where => near ? `${where}-near` : where;
  return [
    { id: 'lines-north', at: at('lines-north'), face: 'north-wall', style: 'loose', drawn: 7, fire, spread: { width: 0.09, depth: 0.02 } },
    { id: 'lines-east', at: at('lines-east'), face: 'east-wall', style: 'loose', drawn: 5, fire, spread: { width: 0.07, depth: 0.02 } },
    { id: 'lines-south', at: at('lines-south'), face: 'south-wall', style: 'loose', drawn: 6, fire, spread: { width: 0.08, depth: 0.02 } },
    { id: 'lines-west', at: at('lines-west'), face: 'west-wall', style: 'loose', drawn: 6, fire, spread: { width: 0.07, depth: 0.02 } },
  ];
}
/** The guns of a siege day: the batteries all day, the defenders answering (`HIST-TEX-504`, `-505`). */
function bombardment({ north = 'battery-north-far', south = true }) {
  return {
    'battery-north': { at: north, from: 50, to: 660, every: 38 },
    'battery-west': { from: 70, to: 660, every: 44 },
    ...(south && { 'battery-south': { from: 60, to: 660, every: 52 } }),
    eighteen: { from: 110, to: 640, every: 130 },
    'north-gun': { from: 200, to: 640, every: 170 },
  };
}
/** A day of the siege, six to six: the guns, the walls manned, the lines where they are that day. */
function day(id, { title, caption, claimId, north, south = true, near = false, lines: talk = [], minutes = 720, step = 240, extra = {} }) {
  return {
    id, minutes, title, caption, claimId, step, watched: 'involved', light: DAY_LIGHT, frame: ['frame-siege-a', 'frame-siege-b'],
    texian: { style: 'wall', at: 'plaza', fire: 'picket', groups: walls('picket') },
    mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: lines(near, 'picket') },
    guns: bombardment({ north, south }), lines: talk, ...extra,
  };
}
/** A night of the siege, six to six: the walls kept by a few, the lines quiet, the clock not held. */
function night(id, { minutes = 720, near = false, caption, title = 'Night', claimId = 'HIST-TEX-054', extra = {} }) {
  return {
    id, minutes, title, caption, claimId, light: NIGHT_LIGHT, frame: ['frame-siege-a', 'frame-siege-b'],
    texian: { style: 'wall', at: 'plaza', fire: 'none', groups: walls('none', { thin: true }) },
    mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: lines(near) },
    ...extra,
  };
}
/** Night-time captions: what the garrison does between the days of the guns. */
const NIGHT_WORDS = 'Night. The Mexican guns fall quiet for a while; the garrison sleeps by turns, a few men on the walls.';

/** The four columns and the rest (`HIST-TEX-500`), drawn one figure for about thirty men; the cavalry one for about eighty. */
const column = (id, name, drawn, ladders, keys, extra = {}) => ({ id, name, style: 'column', drawn, ladders, keys, face: 'plaza', fire: 'none', action: 'advance', ...extra });
const cavalry = (id, at, extra = {}) => ({ id, name: 'Ramírez y Sesma’s lancers', style: 'mounted', mounted: true, drawn: 6, at, face: 'plaza', fire: 'none', ...extra });

export const ALAMO = Object.freeze({
  id: 'alamo',
  name: 'The Alamo',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): the Mexican army at Béxar, about half past two on
  // February 23 (`HIST-TEX-054`).
  startKey: 'alamo-siege',
  claimId: 'HIST-TEX-058',
  outcome: 'The Alamo is stormed at dawn on March 6 and every man who fought is killed; the women and children and Joe are spared.',
  held: name => `${name} is inside the Alamo with the garrison.`,
  involved: alamoInvolved,
  sides: {
    // 189 on the official list, 182-257 by the estimates (`HIST-TEX-058`); about 156 fit to fight and 14 sick at the start.
    texian: { name: 'The garrison', count: 189, drawn: 31, claimId: 'HIST-TEX-058' },
    // About 1,500 into Béxar on February 23, nearly 2,400 after March 3; about 1,800 in the assault with 500 cavalry.
    mexican: { name: 'Santa Anna’s army', count: 2400, drawn: 60, claimId: 'HIST-TEX-500' },
  },
  // The red flag of no quarter on the tower of San Fernando, from the first afternoon to the end (`HIST-TEX-054`).
  flag: { side: MEX, kind: 'red', at: 'town', claimId: 'HIST-TEX-054', words: 'No quarter' },
  guns: [
    { id: 'battery-north', name: 'The north battery', side: MEX, at: 'battery-north-far', face: 'north-wall', metal: 'bronze', crew: 3, claimId: 'HIST-TEX-505' },
    { id: 'battery-west', name: 'The battery by the river', side: MEX, at: 'battery-west', face: 'west-wall', metal: 'bronze', crew: 3, claimId: 'HIST-TEX-505' },
    { id: 'battery-south', name: 'The south battery', side: MEX, at: 'battery-south', face: 'south-wall', metal: 'bronze', crew: 2, claimId: 'HIST-TEX-505' },
    { id: 'eighteen', name: 'The 18-pounder', side: TEX, at: 'sw-battery', face: 'town', metal: 'iron', crew: 3, claimId: 'HIST-TEX-504' },
    { id: 'north-gun', name: 'The north battery', side: TEX, at: 'north-battery', face: 'north-out', metal: 'iron', crew: 2, claimId: 'HIST-TEX-501' },
    { id: 'church-guns', name: 'The church guns', side: TEX, at: 'church-platform', face: 'east-out', metal: 'iron', crew: 2, claimId: 'HIST-TEX-501' },
    { id: 'turned-gun', name: 'A captured gun', side: MEX, at: 'plaza-gun', face: 'long-barrack', metal: 'iron', crew: 3, claimId: 'HIST-TEX-501' },
  ],
  commands: {
    volley: [
      { text: '¡Preparen las armas!', gloss: 'Make ready!', kind: 'reconstructed' },
      { text: '¡Apunten!', gloss: 'Take aim!', kind: 'reconstructed' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'reconstructed' },
    ],
  },
  phases: [
    // ---------------------------------------------------------------- February 23
    {
      // 14:30-15:30. The bell, the army into the town from the west road, the garrison across the river into the Alamo.
      id: 'arrival', minutes: 60, step: 10, watched: 'involved', title: 'February 23: the Mexican army comes', claimId: 'HIST-TEX-054', frame: ['frame-arrival-a', 'frame-arrival-b'],
      caption: 'About half past two the bell of San Fernando rings: Mexican cavalry is in sight. Santa Anna’s army marches into Béxar, and the garrison - about a hundred and fifty men fit to fight and fourteen sick - goes across the river into the Alamo with cattle and corn, and a few families with it.',
      texian: { style: 'column', keys: [[0, 'town-edge'], [40, 'gate-out'], [60, 'plaza']], action: 'withdraw', fire: 'none', face: 'away' },
      mexican: { style: 'column', keys: [[0, 'west-road'], [60, 'town']], action: 'advance', fire: 'none' },
      lines: [
        say('a-coming', 4, TEX, 'volunteer', 'reconstructed', 'They’re coming! Into the Alamo!'),
        say('a-corn', 16, TEX, 'volunteer', 'reconstructed', 'Bring the corn! Drive the cattle in!'),
        say('a-marchen', 30, MEX, 'officer', 'reconstructed', '¡Marchen!', { gloss: 'March!' }),
        say('a-shut', 52, TEX, 'volunteer', 'reconstructed', 'Shut the gate.'),
      ],
    },
    {
      // 15:30-18:30. The red flag; a bugle for a parley; the 18-pounder's answer (`HIST-TEX-504`).
      id: 'red-flag', minutes: 180, step: 60, watched: 'involved', title: 'February 23: the red flag', claimId: 'HIST-TEX-504', frame: ['frame-siege-a', 'frame-siege-b'],
      caption: 'A blood-red flag goes up on the tower of San Fernando: no quarter. A Mexican bugle sounds for a parley, and Travis answers with the 18-pounder. He wrote the next day: “I have answered the demand with a cannon shot, and our flag still waves proudly from the walls.”',
      texian: { style: 'wall', at: 'plaza', fire: 'none', groups: walls('none') },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [{ id: 'town', name: 'Santa Anna’s army, in Béxar', style: 'ranks', at: 'town-edge', face: 'plaza', drawn: 24, fire: 'none' }] },
      guns: { eighteen: { shots: [40] } },
      lines: [
        say('r-flag', 10, TEX, 'volunteer', 'reconstructed', 'Look at the church tower. A red flag.'),
        say('r-means', 22, TEX, 'volunteer', 'reconstructed', 'It means no quarter.'),
        say('r-answer', 42, TEX, 'volunteer', 'reconstructed', 'That’s the colonel’s answer.'),
      ],
    },
    night('night-23', { minutes: 690, caption: 'The first night inside the walls. The Mexican army settles into Béxar across the river.' }),
    // ---------------------------------------------------------------- February 24 - March 5, the days of the guns
    day('day-24', {
      title: 'February 24: the guns', claimId: 'HIST-TEX-505', south: false,
      caption: 'The Mexican guns open on the Alamo from about three hundred and fifty yards and keep it up all day; the defenders answer with their own. Bowie falls ill, and Travis commands alone. That evening Albert Martin rides out with Travis’s letter “To the People of Texas & All Americans in the World”.',
      lines: [
        say('d24-down', 60, TEX, 'volunteer', 'reconstructed', 'Keep your heads down!'),
        say('d24-fuego', 120, MEX, 'gunner', 'reconstructed', '¡Fuego!', { gloss: 'Fire!' }),
        say('d24-help', 400, TEX, 'volunteer', 'reconstructed', 'Somebody will come. They have to.'),
      ],
    }),
    night('night-24', { caption: NIGHT_WORDS }),
    day('day-25-morning', {
      minutes: 240, title: 'February 25: the guns', claimId: 'HIST-TEX-505',
      caption: 'The bombardment goes on. A new Mexican battery goes up about three hundred yards off.',
      lines: [say('d25-close', 120, TEX, 'volunteer', 'reconstructed', 'They’re putting guns closer.')],
    }),
    {
      // 10:00-12:00. The huts (`HIST-TEX-505`): two or three hundred soldiers in them, fired on and burned out.
      id: 'huts', minutes: 120, step: 20, watched: 'involved', title: 'February 25: the fight at the huts', claimId: 'HIST-TEX-505', frame: ['frame-siege-a', 'frame-siege-b'],
      caption: 'About ten in the morning two or three hundred Mexican soldiers cross the river and get into the huts ninety or a hundred yards from the walls. The defenders fire on them, and men run out and set the huts alight. Travis wrote that six Mexican soldiers were killed and four wounded, and that none of the garrison was.',
      texian: { style: 'wall', at: 'plaza', fire: 'scattered', groups: [...walls('scattered'), { id: 'sortie', name: 'Men with torches', style: 'loose', drawn: 5, keys: [[0, 'gate-out'], [30, 'sortie'], [70, 'sortie'], [100, 'gate-out']], face: 'huts', fire: 'scattered', action: 'advance', spread: { width: 0.02, depth: 0.01 } }] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [...lines(false), { id: 'huts', name: 'Soldiers in the huts', style: 'loose', drawn: 12, keys: [[0, 'huts'], [80, 'huts'], [110, 'lines-south']], face: 'south-wall', fire: 'scattered', action: 'hold', spread: { width: 0.04, depth: 0.02 } }] },
      guns: { eighteen: { shots: [8, 26, 52] }, 'battery-south': { shots: [14, 40, 70] } },
      falls: [
        { side: MEX, group: 'huts', count: 3, at: 24, claimId: 'HIST-TEX-505' },
        { side: MEX, group: 'huts', count: 2, at: 50, claimId: 'HIST-TEX-505', wounded: true, carried: true },
      ],
      plumes: [{ at: 'huts', from: 40 }],
      lines: [
        say('h-huts', 6, TEX, 'volunteer', 'reconstructed', 'They’re in the huts!'),
        say('h-fire', 22, TEX, 'volunteer', 'reconstructed', 'Burn them out!'),
        say('h-atras', 78, MEX, 'officer', 'reconstructed', '¡Atrás! ¡Atrás!', { gloss: 'Back! Back!' }),
        say('h-back', 96, TEX, 'volunteer', 'reconstructed', 'Back inside, quick!'),
      ],
    },
    {
      // 12:00-18:00. Not held: the huts burn, the guns go on, and the clock goes at its own pace to the evening.
      id: 'day-25-afternoon', minutes: 360, title: 'February 25: the huts burn', claimId: 'HIST-TEX-505', light: DAY_LIGHT, frame: ['frame-siege-a', 'frame-siege-b'],
      caption: 'The huts burn. That night Juan Seguín and Antonio Cruz ride out through the Mexican lines to bring help.',
      texian: { style: 'wall', at: 'plaza', fire: 'picket', groups: walls('picket') },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: lines(false, 'picket') },
      guns: bombardment({}), plumes: [{ at: 'huts', from: 0 }],
    },
    night('night-25', { caption: NIGHT_WORDS }),
    day('day-26', {
      title: 'February 26: a norther', claimId: 'HIST-TEX-505',
      caption: 'A norther blows in, bitterly cold. The Mexican guns are on three sides of the Alamo now, and their fire goes on all day.',
      lines: [say('d26-cold', 200, TEX, 'volunteer', 'reconstructed', 'Cold enough to freeze a man to the wall.'), say('d26-wood', 500, TEX, 'volunteer', 'reconstructed', 'We need wood.')],
    }),
    night('night-26', { caption: NIGHT_WORDS }),
    day('day-27', {
      title: 'February 27: the guns', claimId: 'HIST-TEX-505',
      caption: 'The bombardment goes on. Every night the Mexican working parties dig their lines a little closer to the walls.',
      lines: [say('d27-closer', 300, TEX, 'volunteer', 'reconstructed', 'Their lines are closer than yesterday.'), say('d27-fannin', 520, TEX, 'volunteer', 'reconstructed', 'Where’s Fannin?')],
    }),
    night('night-27', { caption: 'Night. The garrison mends by dark what the guns knocked down by day.' }),
    day('day-28', {
      title: 'February 28: the guns', claimId: 'HIST-TEX-505',
      caption: 'Another day of the guns. The walls are knocked about and shored up again with earth and timber.',
      lines: [say('d28-dirt', 250, TEX, 'volunteer', 'reconstructed', 'More dirt against that wall.')],
    }),
    night('night-28', { caption: NIGHT_WORDS }),
    day('day-29', {
      title: 'February 29: the guns', claimId: 'HIST-TEX-505', north: 'battery-north-mid',
      caption: 'The Mexican guns and the defenders’ answering fire go on. The north battery has been brought closer to the wall.',
      lines: [say('d29-north', 300, TEX, 'volunteer', 'reconstructed', 'They’ve moved that gun up again.')],
    }),
    night('night-29', { minutes: 540, caption: 'Night. Out in the dark on the Gonzales road, a company of men is waiting to come in.' }),
    {
      // Mar 1, 03:00-05:00. The Gonzales men come in (`HIST-TEX-057`, `-438`, `-506`): through the lines, a shot from the
      // walls in the dark wounds one of them, then the gate by four, and on to the walls.
      // Held to five, so the men who came in are seen walking from the gate to their posts (sim/alamo-posts.mjs).
      id: 'relief', minutes: 120, step: 10, watched: 'involved', title: 'March 1: the Gonzales men ride in', claimId: 'HIST-TEX-506', light: 0.8, frame: ['frame-relief-a', 'frame-relief-b'],
      caption: 'Before dawn on March 1, thirty-two men of the Gonzales ranging company, guided by John W. Smith, come through the Mexican lines and ride for the walls. In the dark a sentry fires on them, taking them for Mexicans, and one of them is wounded; then they are known and let in - the only help that ever reached the Alamo.',
      texian: { style: 'wall', at: 'plaza', fire: 'none', groups: [...walls('none', { thin: true }), { id: 'relief', name: 'The Gonzales men', style: 'column', figure: 'rider', drawn: 8, keys: [[0, 'relief-wait'], [34, 'relief-east'], [54, 'gate-out'], [60, 'gate-in'], [100, 'plaza']], face: 'plaza', fire: 'none', action: 'advance' }] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: lines(false) },
      falls: [{ side: TEX, group: 'relief', count: 1, at: 50, claimId: 'HIST-TEX-506', wounded: true }],
      lines: [
        say('rl-quien', 44, TEX, 'sentry', 'reconstructed', 'Who’s there?'),
        say('rl-gonzales', 51, TEX, 'rider', 'reconstructed', 'Don’t shoot! Gonzales men!'),
        say('rl-open', 55, TEX, 'volunteer', 'reconstructed', 'Open the gate!'),
      ],
    },
    night('night-relief', { minutes: 60, caption: 'The Gonzales men are inside. There are thirty-two more men on the walls.' }),
    day('day-1', {
      title: 'March 1: the guns', claimId: 'HIST-TEX-505', north: 'battery-north-mid',
      caption: 'The guns go on. Thirty-two more men are on the walls, and the garrison is glad of them.',
      lines: [say('m1-help', 200, TEX, 'volunteer', 'reconstructed', 'If thirty got in, more can.')],
    }),
    night('night-1', { caption: NIGHT_WORDS }),
    day('day-2', {
      title: 'March 2: the guns', claimId: 'HIST-TEX-505', north: 'battery-north-mid',
      caption: 'Another day of the guns and the answering fire.',
      lines: [say('m2-powder', 300, TEX, 'volunteer', 'reconstructed', 'Go easy on the powder.')],
    }),
    night('night-2', { caption: NIGHT_WORDS }),
    day('day-3', {
      title: 'March 3: Bonham, and the north battery', claimId: 'HIST-TEX-506', north: 'battery-north-close', near: true,
      caption: 'About eleven in the morning James Bonham rides in through the gate: Fannin is not coming. More Mexican battalions march into Béxar, and a battery goes up on the north side within musket shot of the wall. That evening John W. Smith rides out with Travis’s last letters.',
      lines: [say('m3-fannin', 330, TEX, 'volunteer', 'reconstructed', 'Fannin’s not coming.'), say('m3-close', 520, TEX, 'volunteer', 'reconstructed', 'That battery’s near enough to hit with a rifle.')],
    }),
    night('night-3', { near: true, caption: 'Night. The Mexican lines are close round the walls now; only a single rider in the dark can get through.' }),
    day('day-4', {
      title: 'March 4: the guns', claimId: 'HIST-TEX-505', north: 'battery-north-close', near: true,
      caption: 'The north battery pounds the north wall. The Mexican lines are close all round.',
      lines: [say('m4-wall', 260, TEX, 'volunteer', 'reconstructed', 'The north wall won’t stand much more of that.')],
    }),
    night('night-4', { near: true, caption: NIGHT_WORDS }),
    day('day-5', {
      title: 'March 5: the guns', claimId: 'HIST-TEX-505', north: 'battery-north-close', near: true,
      caption: 'The guns go on all day. In the evening James Allen, the last courier, rides out through the lines.',
      lines: [say('m5-quiet', 600, TEX, 'volunteer', 'reconstructed', 'Something’s different out there.')],
    }),
    {
      // 18:00-22:00, Mar 5. The guns go on into the evening and stop at ten (`HIST-TEX-437`). Not held.
      id: 'last-evening', minutes: 240, title: 'March 5: the evening', claimId: 'HIST-TEX-437', light: [0.5, NIGHT_LIGHT], frame: ['frame-siege-a', 'frame-siege-b'],
      caption: 'The Mexican guns fire into the evening. At ten o’clock they stop. After twelve days of them, the garrison sleeps.',
      texian: { style: 'wall', at: 'plaza', fire: 'none', groups: walls('none', { thin: true }) },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: lines(true) },
      guns: { 'battery-north': { at: 'battery-north-close', from: 20, to: 230, every: 50 }, 'battery-west': { from: 30, to: 230, every: 60 } },
    },
    {
      // 22:00, Mar 5 - 05:00, Mar 6. The columns form and lie on the cold ground (`HIST-TEX-500`, `-501`). Not held; no card -
      // nobody inside knew the hour (staging.md §5.7).
      id: 'quiet', minutes: 420, title: 'The night of March 5', claimId: 'HIST-TEX-501', light: 0.88, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'The night is quiet. After midnight the Mexican columns form up and move to their places round the Alamo, and lie down on the cold ground to wait. Inside, the garrison sleeps; there are few men on the walls.',
      texian: { style: 'wall', at: 'plaza', fire: 'none', groups: walls('none', { thin: true }) },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        column('cos', 'Cos’s column', 12, 3, [[0, 'mexican-camp'], [240, 'cos-formup']], { action: 'stand' }),
        column('duque', 'Duque’s column', 14, 3, [[0, 'mexican-camp'], [240, 'duque-formup']], { action: 'stand' }),
        column('romero', 'Romero’s column', 12, 2, [[0, 'mexican-camp'], [300, 'romero-formup']], { action: 'stand' }),
        column('morales', 'Morales’s cazadores', 5, 1, [[0, 'mexican-camp'], [300, 'morales-formup']], { action: 'stand' }),
        { id: 'reserve', name: 'The reserve, with Santa Anna', style: 'column', drawn: 8, keys: [[0, 'mexican-camp'], [240, 'reserve']], face: 'plaza', fire: 'none' },
        cavalry('lancers-east', 'cavalry-camp', { keys: [[0, 'cavalry-camp'], [300, 'cavalry-east']] }),
        cavalry('lancers-south', 'cavalry-camp', { keys: [[0, 'cavalry-camp'], [300, 'cavalry-south']] }),
      ] },
    },
    // ---------------------------------------------------------------- March 6, the assault
    {
      // 05:00-05:30. In silence; the sentries outside killed without a shot (`HIST-TEX-501`).
      id: 'advance', minutes: 30, step: 5, title: 'Before dawn, March 6', claimId: 'HIST-TEX-501', light: 0.85, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'About five o’clock the columns get up and move toward the walls in the dark, carrying their ladders, crowbars and axes. Nobody speaks. The sentries outside the walls are killed without a shot.',
      texian: { style: 'wall', at: 'plaza', fire: 'none', groups: walls('none', { thin: true }) },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        column('cos', 'Cos’s column', 12, 3, [[0, 'cos-formup'], [30, 'cos-near']]),
        column('duque', 'Duque’s column', 14, 3, [[0, 'duque-formup'], [30, 'duque-near']]),
        column('romero', 'Romero’s column', 12, 2, [[0, 'romero-formup'], [30, 'romero-near']]),
        column('morales', 'Morales’s cazadores', 5, 1, [[0, 'morales-formup'], [30, 'morales-near']]),
        { id: 'reserve', name: 'The reserve, with Santa Anna', style: 'column', drawn: 8, at: 'reserve', face: 'plaza', fire: 'none' },
        cavalry('lancers-east', 'cavalry-east'), cavalry('lancers-south', 'cavalry-south'),
      ] },
      lines: [say('v-silencio', 8, MEX, 'officer', 'reconstructed', '¡Silencio!', { gloss: 'Silence!' })],
    },
    {
      // 05:30-05:36. "¡Viva Santa Anna!" and the bugles; Travis to the north battery (`HIST-TEX-501`, `-502`). contact: the
      // fighting a family's person is in, at his post.
      id: 'alarm', minutes: 6, step: 2, contact: true, title: 'The alarm', claimId: 'HIST-TEX-501', light: 0.82, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'The silence breaks: shouts of “¡Viva Santa Anna!”, and the bugles sounding the attack. The defenders wake and run to the walls. Travis runs to the north battery.',
      texian: { style: 'wall', at: 'plaza', fire: 'scattered', groups: walls('scattered') },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        column('cos', 'Cos’s column', 12, 3, [[0, 'cos-near'], [6, 'cos-close']], { fire: 'picket' }),
        column('duque', 'Duque’s column', 14, 3, [[0, 'duque-near'], [6, 'duque-close']], { fire: 'picket' }),
        column('romero', 'Romero’s column', 12, 2, [[0, 'romero-near'], [6, 'romero-close']], { fire: 'picket' }),
        column('morales', 'Morales’s cazadores', 5, 1, [[0, 'morales-near'], [6, 'morales-close']], { fire: 'picket' }),
        { id: 'reserve', name: 'The reserve, with Santa Anna', style: 'column', drawn: 8, at: 'reserve', face: 'plaza', fire: 'none' },
        cavalry('lancers-east', 'cavalry-east'), cavalry('lancers-south', 'cavalry-south'),
      ] },
      guns: { 'north-gun': { shots: [4], canister: true }, 'church-guns': { shots: [5], canister: true } },
      people: [{ id: 'travis', name: 'Travis', side: TEX, at: 'north-battery', pose: 'fire', claimId: 'HIST-TEX-502' }],
      lines: [
        say('al-viva', 0, MEX, 'soldier', 'documented', '¡Viva Santa Anna!', { claimId: 'HIST-TEX-501', gloss: 'shouted in the columns, which gave them away' }),
        say('al-travis', 2, TEX, 'officer', 'documented', 'Come on boys, the Mexicans are upon us, and we’ll give them Hell.', { name: 'Travis', claimId: 'HIST-TEX-502', gloss: 'Joe’s account, as W. F. Gray wrote it down on March 20, 1836' }),
        say('al-walls', 4, TEX, 'volunteer', 'reconstructed', 'To the walls! They’re at the walls!'),
      ],
    },
    {
      // 05:36-05:52. Canister; the columns halt, re-form, come on and merge at the north wall; Travis killed (`HIST-TEX-501`, `-502`).
      id: 'repulse', minutes: 16, step: 2, contact: true, title: 'Canister', claimId: 'HIST-TEX-501', light: 0.74, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'The defenders’ cannon fire canister into the columns and the riflemen fire from the walls. The columns halt, re-form and come on again. Cos’s column swings round from the west and Romero’s is driven round from the east, until they are one crowd at the foot of the north wall. Travis is killed at the north battery, among the first.',
      texian: { style: 'wall', at: 'plaza', fire: 'scattered', groups: walls('scattered') },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        column('cos', 'Cos’s column', 12, 3, [[0, 'cos-close'], [3, 'cos-reel'], [7, 'cos-reel'], [16, 'north-foot-w']], { fire: 'scattered' }),
        column('duque', 'Duque’s column', 14, 3, [[0, 'duque-close'], [3, 'duque-reel'], [6, 'duque-reel'], [14, 'north-foot']], { fire: 'scattered' }),
        column('romero', 'Romero’s column', 12, 2, [[0, 'romero-close'], [4, 'romero-reel'], [8, 'romero-reel'], [16, 'north-foot-e']], { fire: 'scattered' }),
        column('morales', 'Morales’s cazadores', 5, 1, [[0, 'morales-close'], [16, 'sw-foot']], { fire: 'scattered' }),
        { id: 'reserve', name: 'The reserve, with Santa Anna', style: 'column', drawn: 8, keys: [[0, 'reserve'], [12, 'reserve'], [16, 'duque-reel']], face: 'plaza', fire: 'none', action: 'advance' },
        cavalry('lancers-east', 'cavalry-east'), cavalry('lancers-south', 'cavalry-south'),
      ] },
      guns: { 'north-gun': { shots: [1, 4, 7, 10], canister: true }, 'church-guns': { shots: [2, 6, 11], canister: true }, eighteen: { shots: [3, 9, 14], canister: true } },
      people: [{ id: 'travis', name: 'Travis', side: TEX, at: 'north-battery', pose: 'fire', falls: 4, claimId: 'HIST-TEX-502' }],
      falls: [
        { side: MEX, group: 'duque', count: 3, at: 2, claimId: 'HIST-TEX-501' },
        { side: MEX, group: 'cos', count: 3, at: 4, claimId: 'HIST-TEX-501' },
        { side: MEX, group: 'romero', count: 2, at: 5, claimId: 'HIST-TEX-501', wounded: true },
        { side: MEX, group: 'duque', count: 2, at: 10, claimId: 'HIST-TEX-501' },
        { side: MEX, group: 'morales', count: 1, at: 12, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'north', count: 2, at: 11, claimId: 'HIST-TEX-501' },
      ],
      lines: [
        say('rp-canister', 1, TEX, 'gunner', 'reconstructed', 'Canister! Load canister!'),
        say('rp-escalas', 5, MEX, 'officer', 'reconstructed', '¡Escalas al frente!', { gloss: 'Ladders forward!' }),
        say('rp-again', 8, TEX, 'volunteer', 'reconstructed', 'They’re coming again!'),
        say('rp-adelante', 11, MEX, 'officer', 'reconstructed', '¡Adelante!', { gloss: 'Forward!' }),
      ],
    },
    {
      // 05:52-06:04. Over the north wall; the south-west battery taken; the walls left (`HIST-TEX-501`).
      id: 'north-wall', minutes: 12, step: 2, contact: true, title: 'Over the north wall', claimId: 'HIST-TEX-501', light: 0.62, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'The Mexican soldiers go up the ladders and the rough face of the north wall and over it. In the south, Morales’s men take the south-west battery. The defenders leave the walls.',
      texian: { style: 'wall', at: 'plaza', fire: 'scattered', groups: [
        { id: 'north', name: 'The north wall', style: 'wall', at: 'north-wall', face: 'north-out', drawn: 7, fire: 'scattered', spread: { width: 0.034, depth: 0.004 } },
        { id: 'west', name: 'The west wall', style: 'wall', at: 'west-wall', face: 'west-out', drawn: 7, fire: 'scattered', spread: { width: 0.068, depth: 0.004 } },
        { id: 'southwest', name: 'The 18-pounder', style: 'wall', at: 'sw-battery', face: 'town', drawn: 3, fire: 'scattered', spread: { width: 0.005, depth: 0.004 } },
        { id: 'south', name: 'The low barrack', style: 'wall', at: 'south-wall', face: 'south-out', drawn: 5, fire: 'scattered', spread: { width: 0.018, depth: 0.004 } },
        { id: 'palisade', name: 'The palisade', style: 'wall', at: 'palisade', face: 'south-out', drawn: 4, fire: 'scattered', spread: { width: 0.016, depth: 0.004 } },
        { id: 'church', name: 'The church', style: 'wall', at: 'church-platform', face: 'east-out', drawn: 3, fire: 'scattered', spread: { width: 0.006, depth: 0.004 } },
      ] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        { id: 'mass', name: 'The columns, merged', style: 'loose', drawn: 30, climbing: true, ladders: 6, keys: [[0, 'north-foot'], [7, 'north-foot'], [12, 'north-in']], face: 'plaza', fire: 'scattered', action: 'advance', spread: { width: 0.05, depth: 0.018 } },
        column('morales', 'Morales’s cazadores', 5, 1, [[0, 'sw-foot'], [8, 'sw-battery']], { fire: 'scattered' }),
        { id: 'reserve', name: 'The reserve, with Santa Anna', style: 'column', drawn: 8, at: 'duque-reel', face: 'plaza', fire: 'none' },
        cavalry('lancers-east', 'cavalry-east'), cavalry('lancers-south', 'cavalry-south'),
      ] },
      guns: { 'church-guns': { shots: [1, 6], canister: true }, eighteen: { shots: [2] } },
      falls: [
        { side: MEX, group: 'mass', count: 4, at: 2, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'north', count: 4, at: 5, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'southwest', count: 2, at: 8, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'west', count: 3, at: 9, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'south', count: 2, at: 10, claimId: 'HIST-TEX-501' },
      ],
      lines: [
        say('nw-arriba', 2, MEX, 'officer', 'reconstructed', '¡Arriba!', { gloss: 'Up!' }),
        say('nw-over', 7, TEX, 'volunteer', 'reconstructed', 'They’re over the north wall!'),
        say('nw-back', 10, TEX, 'volunteer', 'reconstructed', 'Fall back to the barracks!'),
      ],
    },
    {
      // 06:04-06:16. Into the long barrack and the church; the captured guns turned on the doors; the runners and the lancers
      // (`HIST-TEX-501`, `-436`). The runners are seen going and the lancers riding at them; nobody is seen struck.
      id: 'fallback', minutes: 12, step: 2, contact: true, title: 'The long barrack and the church', claimId: 'HIST-TEX-501', light: 0.5, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'The defenders fall back across the plaza into the long barrack and the church. The Mexican soldiers turn the captured guns on the barrack’s doors. Men who go over the east and south walls are ridden down by the lancers waiting outside for them.',
      texian: { style: 'street', at: 'long-barrack', fire: 'scattered', groups: [
        { id: 'barrack', name: 'In the long barrack', style: 'street', drawn: 9, at: 'long-barrack', face: 'plaza', fire: 'scattered', spread: { width: 0.006, depth: 0.03 } },
        { id: 'church', name: 'In the church', style: 'street', drawn: 4, at: 'church-front', face: 'plaza', fire: 'scattered', spread: { width: 0.01, depth: 0.008 } },
        { id: 'runners', name: 'Men going over the east wall', style: 'rout', drawn: 5, keys: [[0, 'east-wall'], [12, 'east-prairie']], face: 'away', fire: 'none', action: 'withdraw', spread: { width: 0.04, depth: 0.04 } },
      ] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        { id: 'plaza', name: 'In the plaza', style: 'loose', drawn: 26, keys: [[0, 'north-in'], [6, 'plaza']], face: 'long-barrack', fire: 'scattered', action: 'advance', spread: { width: 0.03, depth: 0.03 } },
        { id: 'morales', name: 'Morales’s cazadores', style: 'loose', drawn: 5, at: 'sw-battery', face: 'long-barrack', fire: 'scattered', spread: { width: 0.01, depth: 0.01 } },
        cavalry('lancers-east', 'cavalry-east', { keys: [[0, 'cavalry-east'], [12, 'east-prairie']], action: 'advance' }),
        cavalry('lancers-south', 'cavalry-south'),
      ] },
      guns: { 'turned-gun': { shots: [5, 9] }, 'church-guns': { shots: [3, 8] } },
      falls: [{ side: TEX, group: 'barrack', count: 2, at: 7, claimId: 'HIST-TEX-501' }, { side: MEX, group: 'plaza', count: 3, at: 4, claimId: 'HIST-TEX-501' }],
      lines: [
        say('fb-doors', 3, MEX, 'officer', 'reconstructed', '¡El cañón a las puertas!', { gloss: 'The gun on the doors!' }),
        say('fb-hold', 6, TEX, 'volunteer', 'reconstructed', 'Hold the door!'),
      ],
    },
    {
      // 06:16-06:30. Room by room; Bowie in his bed; Joe in a house, firing; the church last (`HIST-TEX-501`, `-502`).
      id: 'rooms', minutes: 14, step: 2, contact: true, title: 'Room by room', claimId: 'HIST-TEX-501', light: 0.32, frame: ['frame-plaza-a', 'frame-plaza-b'],
      caption: 'The long barrack is fought for room by room. Bowie is killed in his bed. Joe, whom Travis held as a slave, has hidden in a house and fires from it. The church is taken last, and its guns fall silent.',
      texian: { style: 'street', at: 'long-barrack', fire: 'scattered', groups: [
        { id: 'barrack', name: 'In the long barrack', style: 'street', drawn: 7, at: 'long-barrack', face: 'plaza', fire: 'scattered', spread: { width: 0.006, depth: 0.03 } },
        { id: 'church', name: 'In the church', style: 'street', drawn: 4, at: 'church-front', face: 'plaza', fire: 'scattered', spread: { width: 0.01, depth: 0.008 } },
      ] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        { id: 'plaza', name: 'In the plaza', style: 'loose', drawn: 20, at: 'plaza', face: 'long-barrack', fire: 'scattered', spread: { width: 0.03, depth: 0.03 } },
        { id: 'doors', name: 'At the barrack doors', style: 'ranks', drawn: 8, at: 'long-barrack-door', face: 'long-barrack', fire: 'volley' },
        { id: 'church-door', name: 'At the church', style: 'loose', drawn: 6, keys: [[0, 'plaza'], [9, 'church-front']], face: 'church-platform', fire: 'scattered', action: 'advance', spread: { width: 0.012, depth: 0.012 } },
        cavalry('lancers-east', 'east-prairie'), cavalry('lancers-south', 'cavalry-south'),
      ] },
      guns: { 'turned-gun': { shots: [1, 4, 7, 10] }, 'church-guns': { shots: [2, 6] } },
      people: [{ id: 'joe', name: 'Joe', side: TEX, at: 'travis-quarters', pose: 'hide', claimId: 'HIST-TEX-502' }],
      falls: [
        { side: TEX, group: 'barrack', count: 3, at: 3, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'barrack', count: 4, at: 8, claimId: 'HIST-TEX-501' },
        { side: TEX, group: 'church', count: 4, at: 12, claimId: 'HIST-TEX-501' },
        { side: MEX, group: 'doors', count: 2, at: 5, claimId: 'HIST-TEX-501' },
      ],
      lines: [
        say('rm-bayoneta', 2, MEX, 'officer', 'reconstructed', '¡A la bayoneta!', { gloss: 'With the bayonet!' }),
        say('rm-church', 9, MEX, 'officer', 'reconstructed', '¡A la iglesia!', { gloss: 'To the church!' }),
      ],
    },
    {
      // 06:30-07:00. The firing stops about sunrise (computed 6:20); the women and children brought out of the sacristy; Joe
      // found and saved (`HIST-TEX-501`, `-502`, `-432`, `-434`). Nobody is drawn being killed after surrender: the executions
      // are told in the account (`HIST-TEX-435`).
      id: 'end', minutes: 30, step: 5, title: 'Sunrise', claimId: 'HIST-TEX-501', light: [0.2, 0], frame: ['frame-plaza-a', 'frame-plaza-b'],
      caption: 'About sunrise the firing stops: it has lasted less than an hour and a half. The women and children are brought out of the church’s sacristy. Mexican officers call out for any Black men, and Joe comes out; two soldiers attack him and a captain saves him. Every man who fought is dead.',
      texian: { style: 'street', at: 'church-front', fire: 'none', groups: [] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [
        { id: 'plaza', name: 'In the plaza', style: 'loose', drawn: 22, at: 'plaza', face: 'church-front', fire: 'none', spread: { width: 0.035, depth: 0.03 } },
        { id: 'church-door', name: 'At the church', style: 'loose', drawn: 6, at: 'church-front', face: 'church-platform', fire: 'none', spread: { width: 0.012, depth: 0.012 } },
      ] },
      people: [{ id: 'joe', name: 'Joe', side: TEX, at: 'travis-quarters', pose: 'emerge', claimId: 'HIST-TEX-502' }],
      lines: [
        say('e-negros', 6, MEX, 'officer', 'reconstructed', 'Are there any Black men here?', { gloss: 'the officers calling out after the fight, as Joe told it (Gray, March 20, 1836); the words in Spanish are not recorded' }),
        say('e-joe', 9, TEX, 'person', 'documented', 'Yes, here is one.', { name: 'Joe', claimId: 'HIST-TEX-502', gloss: 'Joe’s account, as W. F. Gray wrote it down' }),
      ],
    },
    {
      // Mar 6, 07:00-18:00. The pyres, told and seen from a distance; the spared taken to Músquiz's house. Not held.
      id: 'after', minutes: 660, title: 'March 6: afterwards', claimId: 'HIST-TEX-501', light: 0, frame: ['frame-assault-a', 'frame-assault-b'],
      caption: 'The dead defenders are stacked and burned on pyres outside the walls. The Mexican dead are buried. The women and children are taken into Béxar, to Ramón Músquiz’s house, to be questioned by Santa Anna.',
      texian: { style: 'street', at: 'church-front', fire: 'none', groups: [] },
      mexican: { style: 'loose', at: 'plaza', fire: 'none', groups: [{ id: 'guard', name: 'A guard on the Alamo', style: 'loose', drawn: 10, at: 'plaza', face: 'church-front', fire: 'none', spread: { width: 0.03, depth: 0.03 } }] },
      plumes: [{ at: 'pyres', from: 60 }],
    },
  ],
  ground: alamoGround,
});
