// The Grass Fight, November 26, 1835, on the engine (sim/battle-stage.mjs, docs/BATTLES.md §6). Staged from
// docs/battle-research/staging.md §2 and docs/battle-research/grass-fight.md; the claims are `HIST-TEX-031`, `-032` and `-483`,
// and `FIC-GONZ-421` to `-424`, in HISTORY.md.
//
// The shape of it (`HIST-TEX-483`): Deaf Smith rides into the camp at the mill with word of a pack train and cavalry coming in
// from the west, and the camp cries "Ugartechea!" and says it carries silver. Bowie takes the horsemen, about forty; Jack takes
// about a hundred on foot drawn from many companies, at a trot and then at the double, in double file, over a cold creek.
// About a mile west of the town Bowie charges the train and its guard takes to a dry creek bed; both sides fight on foot.
// Jack's column is fired on from a ditch hidden in the mesquite at forty to sixty yards, splits right and left and charges
// it and clears it. A sortie from the town with a gun comes on the other flank; the gun fires three rounds of grape and
// canister and the sortie goes back under the town's batteries; the Texians follow until the town's guns fire on them and
// are called back. The packs are cut open: grass, cut for the horses in Béxar. Nobody on the Texian side is killed.
//
// The hour is disputed (mid-morning per Barr, about two per Yoakum): the alarm at ten and the fight between eleven and half
// past twelve, the owner's staging decision (docs/BATTLES.md §2b, staging.md Grass G1 (a), `FIC-GONZ-421`).
//
// Nothing here depends on who came (`HIST-TEX-032`): no family's person changes a count, a place or a minute.
//
// This file imports nothing from the director or the army, so the engine and the clock can read it without a cycle.

/** The mill camp, a mile north of the plaza: the same as sim/army.mjs `SIEGE_CAMPS.mill` (tests hold the two equal). */
export const GRASS_MILL = Object.freeze({ dx: 0, dy: -1 });
/** The Texas Historical Commission's marker, about a mile west of the town (grass-fight.md §4.2), from the plaza in miles. */
export const GRASS_MARKER = Object.freeze({ dx: -1.22, dy: 0.1 });

/**
 * The ground, read off the map's Béxar. ceiling: the map carries neither the Alazán nor the dry creek beds and ravines in the
 * mesquite, so the creek bed, the ditch and the creek Jack forded are placed on the straight line from the mill to the
 * marker and drawn as this engagement's scenery; the map's own water, if it ever traces the Alazán, is the way out.
 */
export function grassGround(world) {
  const bexar = world.map.sites.bexar;
  const at = (dx, dy) => ({ x: bexar.x + dx, y: bexar.y + dy });
  return {
    mill: at(GRASS_MILL.dx, GRASS_MILL.dy),
    // Where each party forms at the camp before it goes: the horsemen by the horse lines, the foot a little way off.
    millHorse: at(-0.05, -1.02),
    millFoot: at(0.04, -0.96),
    // The creek Jack's men forded, "cold wide and deep", between the camp and the fight.
    ford: at(-0.62, -0.5),
    marker: at(GRASS_MARKER.dx, GRASS_MARKER.dy),
    // The train on the Presidio road coming in from the west, and the dry creek bed its guard took to.
    trainFar: at(-2.3, 0.42),
    trainNear: at(-1.62, 0.24),
    creekBed: at(-1.3, 0.17),
    packs: at(-1.36, 0.2),
    // Bowie's riders on the ravine edge, about two hundred yards from the creek bed, and their horses held behind.
    bowieRide: at(-0.95, -0.2),
    bowieLine: at(-1.18, 0.07),
    bowieTurn: at(-1.08, 0.1),
    // Jack's column's road, where the ditch fired into it at forty to sixty yards, and the ditch itself.
    jackOut: at(-0.8, -0.34),
    jackApproach: at(-0.98, -0.22),
    ditch: at(-1.01, -0.19),
    jackBeyond: at(-1.06, -0.12),
    // The town's west edge, where the sortie came out with its gun, and how far it came.
    townEdge: at(-0.32, 0.04),
    sortieLine: at(-0.72, 0.09),
    // Swisher's men and Rusk's fifteen coming up from the camp.
    swisherOut: at(-0.55, -0.55),
    swisherIn: at(-0.9, -0.05),
    // How far the Texians followed before the town's guns were fired on them.
    follow: at(-0.55, 0.05),
    back: at(-1.0, 0.0),
    toward: { x: -1, y: 0 },
  };
}

/**
 * What the map does not draw: the dry creek bed and the ditch in thick mesquite, and the creek Jack forded. stand-in:
 * docs/ART_REQUESTS.md, 2026-09-25 "a dry creek bed or ditch in thick mesquite" (`earth-rampart` laid low, screened with
 * `mesquite-large-wind`) and "a wide creek forded on foot" (a drawn ribbon of water).
 */
function grassScenery(ground) {
  const { creekBed, ditch, ford } = ground;
  const items = [{ water: [{ x: ford.x - 0.08, y: ford.y - 0.14 }, { x: ford.x + 0.01, y: ford.y }, { x: ford.x + 0.06, y: ford.y + 0.16 }], width: 0.03 }];
  for (let i = 0; i < 6; i++) items.push({ sprite: 'earth-rampart', x: creekBed.x - 0.06 + i * 0.024, y: creekBed.y - 0.02 + i * 0.006, size: 1.0 });
  for (let i = 0; i < 4; i++) items.push({ sprite: 'earth-rampart', x: ditch.x - 0.03 + i * 0.02, y: ditch.y + 0.01 - i * 0.012, size: 0.9 });
  const brush = [[-0.05, -0.04], [0.04, -0.035], [-0.02, 0.05], [0.06, 0.03], [-0.08, 0.01], [0.09, -0.01]];
  for (const [dx, dy] of brush) items.push({ clip: 'mesquite-large-wind', x: ditch.x + dx, y: ditch.y + dy, size: 2.6 });
  for (const [dx, dy] of brush) items.push({ clip: 'mesquite-large-wind', x: creekBed.x + dx * 1.4, y: creekBed.y + dy * 1.4 + 0.02, size: 2.6 });
  return items;
}

const TEX = 'texian', MEX = 'mexican';
/** One line. `name` only ever on a documented line (sim/battle-stage.mjs `checkEngagement`). */
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** Jack's infantry, about a hundred from many companies: a sample of sixty. */
const jack = (style, at, extra = {}) => ({ key: 'jack', side: TEX, name: 'Jack’s infantry', count: 100, drawn: 40, style, ...at, ...extra });
/** The pack animals. stand-in: docs/ART_REQUESTS.md, 2026-09-25 "pack mules under bundles of cut grass" (a horse and a pack). */
const train = at => ({ key: 'train', side: MEX, name: 'The pack train', count: 40, drawn: 16, style: 'column', figure: 'packhorse', fire: 'none', ...at });

export const GRASS_FIGHT = Object.freeze({
  id: 'grass-fight',
  name: 'The Grass Fight',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): Deaf Smith riding into the camp at ten.
  startKey: 'grass-alarm',
  claimId: 'HIST-TEX-031',
  outcome: 'The pack train is taken and the sortie driven back into Béxar; it carried grass; no Texian killed.',
  held: name => `${name} is out with the men after the pack train, and comes back to the camp with them.`,
  sides: {
    // Bowie's horsemen, about forty (`HIST-TEX-483`), drawn one to one.
    texian: { name: 'Bowie’s horsemen', count: 40, drawn: 24, claimId: 'HIST-TEX-483', spread: { width: 0.24, depth: 0.1 } },
    // The train's guard, fifty to two hundred (DISPUTED): a sample of sixty. It fought from a creek bed, not in rows.
    mexican: { name: 'The pack train’s guard', count: 100, drawn: 30, claimId: 'HIST-TEX-483' },
  },
  // No Texian lies still at the Grass Fight: nobody was killed (`HIST-TEX-032`). Their hurt are drawn sitting, helped back.
  noFalling: [],
  // The sortie's gun (`HIST-TEX-483`: "three discharges... with grape and canister"). Its metal is not recorded; drawn iron.
  cannon: { side: MEX, group: 'sortie', offset: { along: 0.03, across: -0.02 }, metal: 'iron', crew: 3, claimId: 'HIST-TEX-483' },
  flag: null,
  commands: {
    volley: [
      { text: '¡Preparen las armas!', gloss: 'Make ready!', kind: 'reconstructed', claimId: 'HIST-TEX-482' },
      { text: '¡Apunten!', gloss: 'Aim!', kind: 'reconstructed', claimId: 'HIST-TEX-482' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'reconstructed', claimId: 'HIST-TEX-482' },
    ],
  },
  phases: [
    {
      // 10:00 - 10:30. Deaf Smith rides in; "Ugartechea!"; the silver rumour; Burleson sends Bowie with the horsemen and Jack
      // with about a hundred on foot; men run for horses and rifles (`HIST-TEX-031`, `-483`). A family is asked here.
      id: 'alarm', minutes: 30, title: 'Deaf Smith rides in', step: 2, claimId: 'HIST-TEX-483',
      caption: 'Deaf Smith gallops into the camp at the mill: a Mexican pack train with cavalry is coming in from the west. The camp is sure it carries silver to pay the soldiers in Béxar. Bowie is to take the horsemen and William Jack about a hundred men on foot.',
      texian: { style: 'loose', at: 'millHorse', action: 'hold', fire: 'none', spread: { width: 0.2, depth: 0.1 } },
      mexican: { style: 'mounted', from: 'trainFar', to: 'trainNear', action: 'advance', fire: 'none' },
      groups: [jack('column', { at: 'millFoot', action: 'hold', faceTo: 'ford' }), train({ from: 'trainFar', to: 'trainNear', action: 'advance', faceTo: 'creekBed' })],
      gun: false,
      lines: [
        say('g-ugartechea', 3, TEX, 'volunteer', 'documented', 'Ugartechea!', { claimId: 'HIST-TEX-031', gloss: 'the camp’s cry (Yoakum)' }),
        say('g-silver', 8, TEX, 'volunteer', 'reconstructed', 'It’s the silver — the soldiers’ pay!'),
        say('g-horse', 14, TEX, 'volunteer', 'reconstructed', 'Get your horse!'),
        say('g-foot', 22, TEX, 'volunteer', 'reconstructed', 'Men on foot, fall in with Jack!', { group: 'jack' }),
      ],
    },
    {
      // 10:30 - 11:00. Bowie's riders at a canter; Jack's men "at a brisk trot", over the creek, then "double quick time for
      // about half an hour... in tolerably good order and in double file" (`HIST-TEX-483`). Ordered, not chaotic.
      id: 'ride-out', minutes: 30, title: 'After the pack train', step: 5, claimId: 'HIST-TEX-483',
      caption: 'Bowie’s horsemen ride out west at a canter. Jack’s infantry follows at a trot, fords a cold creek, and keeps on at the double in good order, two by two.',
      texian: { style: 'mounted', from: 'millHorse', to: 'bowieRide', action: 'advance', fire: 'none' },
      mexican: { style: 'mounted', from: 'trainNear', to: 'creekBed', action: 'advance', fire: 'none' },
      groups: [jack('column', { keys: [[0, 'millFoot'], [18, 'ford'], [30, 'jackOut']], action: 'advance', faceTo: 'marker' }), train({ from: 'trainNear', to: 'packs', action: 'advance', faceTo: 'creekBed' })],
      gun: false,
      lines: [
        say('g-double', 6, TEX, 'officer', 'reconstructed', 'Double quick!', { group: 'jack' }),
        say('g-file', 19, TEX, 'officer', 'reconstructed', 'Keep your file!', { group: 'jack' }),
        say('g-cold', 24, TEX, 'volunteer', 'reconstructed', 'That water’s cold!', { group: 'jack' }),
      ],
    },
    {
      // 11:00 - 11:20. About a mile from town Bowie charges the train; its guard takes to a dry creek bed; both sides dismount
      // and fight on foot from ravines (`HIST-TEX-483`). Not rows on either side. contact from here.
      id: 'bowie', minutes: 20, title: 'Bowie charges the train', step: 2, contact: true, claimId: 'HIST-TEX-483',
      caption: 'About a mile west of the town Bowie’s horsemen charge the train. Its guard jumps down into a dry creek bed, and both sides get off their horses and fight on foot from the ravines.',
      texian: { style: 'loose', keys: [[0, 'bowieRide'], [5, 'bowieLine']], action: 'advance', fire: 'scattered' },
      mexican: { style: 'bank', at: 'creekBed', action: 'hold', fire: 'scattered', spread: { width: 0.3, depth: 0.07 } },
      groups: [jack('column', { from: 'jackOut', to: 'jackApproach', action: 'advance', faceTo: 'marker' }), train({ at: 'packs', action: 'stand' })],
      gun: false,
      falls: [{ side: MEX, count: 2, at: 12, claimId: 'HIST-TEX-032', wounded: true, carried: true }],
      lines: [
        say('g-pie', 3, MEX, 'officer', 'reconstructed', '¡Pie a tierra!', { gloss: 'Dismount!' }),
        say('g-fuego', 5, MEX, 'officer', 'reconstructed', '¡Fuego!', { gloss: 'Fire!' }),
        say('g-ravine', 9, TEX, 'volunteer', 'reconstructed', 'Get down in the ravine and shoot from there!'),
        say('g-cover', 15, TEX, 'volunteer', 'reconstructed', 'They’re in the creek bed — keep your heads down!'),
      ],
    },
    {
      // 11:20 - 11:30. The ditch fires into Jack's column at forty to sixty yards, "a tremendous discharge of musketry along our
      // whole line", then a second and a third; the column splits right and left; the charge on Sublett's order; the ditch
      // "cleared... in a few moments" (`HIST-TEX-483`). A family's person with Jack is hurt, or runs, at the first volley.
      id: 'ambush', minutes: 10, title: 'The ditch', step: 2, contact: true, claimId: 'HIST-TEX-483',
      caption: 'Jack’s column is fired on from a ditch hidden in the mesquite, forty to sixty yards off. The men split right and left, charge the ditch, and clear it in a few moments.',
      texian: { style: 'loose', at: 'bowieLine', action: 'hold', fire: 'scattered' },
      mexican: { style: 'bank', at: 'creekBed', action: 'hold', fire: 'scattered', spread: { width: 0.3, depth: 0.07 } },
      groups: [
        jack('loose', { keys: [[0, 'jackApproach'], [4, 'jackApproach'], [8, 'jackBeyond']], action: 'advance', fire: 'scattered', spread: { width: 0.3, depth: 0.14 } }),
        { key: 'ditch', side: MEX, name: 'The men in the ditch', count: 30, drawn: 12, style: 'bank', keys: [[0, 'ditch'], [6, 'ditch'], [10, 'creekBed']], action: 'hold', fire: 'volley', spread: { width: 0.14, depth: 0.05 }, faceTo: 'jackApproach' },
        train({ at: 'packs', action: 'stand' }),
      ],
      gun: false,
      falls: [
        { side: TEX, group: 'jack', count: 2, at: 2, claimId: 'HIST-TEX-032', wounded: true },
        { side: MEX, group: 'ditch', count: 2, at: 7, claimId: 'HIST-TEX-032', wounded: true, carried: true },
      ],
      lines: [
        say('g-down', 1, TEX, 'volunteer', 'reconstructed', 'Down! They’re in the ditch!', { group: 'jack' }),
        say('g-flank', 3, TEX, 'volunteer', 'reconstructed', 'Right and left — flank them!', { group: 'jack' }),
        say('g-charge', 5, TEX, 'officer', 'reconstructed', 'Charge!', { group: 'jack', gloss: 'Sublett gave the order; his words are not recorded' }),
        say('g-cleared', 9, TEX, 'volunteer', 'reconstructed', 'They’re out of it — running for the creek!', { group: 'jack' }),
      ],
    },
    {
      // 11:30 - 11:50. The sortie from the town, about fifty with one gun, comes on the other flank; Bowie turns on it; Swisher's
      // men and Rusk's fifteen come up; the gun fires three rounds of grape and canister; the sortie goes back "under the
      // protection of their batteries in town" (`HIST-TEX-483`; the sortie's size DISPUTED).
      id: 'sortie', minutes: 20, title: 'The sortie from the town', step: 5, contact: true, claimId: 'HIST-TEX-483',
      caption: 'Soldiers come out of Béxar with a cannon against the other flank. Bowie’s men turn to meet them and more men come up from the camp. The cannon fires grapeshot three times, and the soldiers fall back toward the town.',
      texian: { style: 'loose', keys: [[0, 'bowieLine'], [8, 'bowieTurn']], action: 'advance', fire: 'scattered', faceTo: 'sortieLine' },
      mexican: { style: 'bank', at: 'creekBed', action: 'hold', fire: 'picket', spread: { width: 0.3, depth: 0.07 } },
      groups: [
        jack('loose', { at: 'jackBeyond', action: 'hold', fire: 'scattered', spread: { width: 0.3, depth: 0.14 } }),
        { key: 'sortie', side: MEX, name: 'The sortie from Béxar', count: 50, drawn: 30, style: 'ranks', keys: [[0, 'townEdge'], [8, 'sortieLine'], [16, 'sortieLine'], [20, 'townEdge']], action: 'advance', fire: 'volley', faceTo: 'bowieTurn' },
        { key: 'swisher', side: TEX, name: 'Swisher’s men', count: 30, drawn: 12, style: 'loose', from: 'swisherOut', to: 'swisherIn', action: 'advance', fire: 'scattered', spread: { width: 0.18, depth: 0.1 }, faceTo: 'sortieLine' },
        train({ at: 'packs', action: 'stand' }),
      ],
      cannon: [6, 10, 14],
      falls: [{ side: MEX, group: 'sortie', count: 2, at: 11, claimId: 'HIST-TEX-032', wounded: true, carried: true }],
      lines: [
        say('g-other', 2, TEX, 'volunteer', 'reconstructed', 'More of them — out of the town, with a cannon!'),
        say('g-turn', 5, TEX, 'volunteer', 'reconstructed', 'Turn and face them, boys!'),
        say('g-grape', 12, TEX, 'volunteer', 'reconstructed', 'Grapeshot — get down!'),
      ],
    },
    {
      // 11:50 - 12:05. The Texians follow until the town's guns fire on them and they are ordered back (*Telegraph*, Dec 2).
      id: 'follow', minutes: 15, title: 'Under the town’s guns', step: 5, contact: true, claimId: 'HIST-TEX-483',
      caption: 'The Texians follow the soldiers toward the town until the big guns in Béxar fire on them, and they are ordered back.',
      texian: { style: 'loose', keys: [[0, 'bowieTurn'], [7, 'follow'], [15, 'back']], action: 'advance', fire: 'scattered', faceTo: 'townEdge' },
      mexican: { style: 'bank', at: 'creekBed', action: 'gone', fire: 'none' },
      groups: [
        jack('loose', { at: 'jackBeyond', action: 'hold', spread: { width: 0.3, depth: 0.14 } }),
        { key: 'sortie', side: MEX, name: 'The sortie from Béxar', count: 50, drawn: 30, style: 'column', from: 'sortieLine', to: 'townEdge', action: 'withdraw', face: 'away', fire: 'none', faceTo: 'bowieTurn' },
        train({ at: 'packs', action: 'stand' }),
      ],
      lines: [
        say('g-back', 9, TEX, 'officer', 'reconstructed', 'Back! Back — they have the range from the town!'),
      ],
    },
    {
      // 12:05 - 12:35. The packs are cut open: grass, cut for the horses in Béxar; forty or so animals driven off (`HIST-TEX-031`).
      id: 'grass', minutes: 30, title: 'Grass', step: 10, claimId: 'HIST-TEX-031',
      caption: 'The men cut open the packs. They hold grass - cut to feed the horses in Béxar - not silver. The animals are driven back to the camp.',
      texian: { style: 'loose', at: 'packs', action: 'hold', fire: 'none' },
      mexican: { style: 'bank', at: 'creekBed', action: 'gone', fire: 'none' },
      groups: [jack('loose', { at: 'jackBeyond', action: 'hold', spread: { width: 0.3, depth: 0.14 } }), train({ at: 'packs', action: 'stand' })],
      gun: false,
      lines: [
        say('g-grass', 6, TEX, 'volunteer', 'reconstructed', 'Grass! All this for grass.'),
        say('g-horses', 18, TEX, 'volunteer', 'reconstructed', 'Well, our horses can eat it.'),
      ],
    },
    {
      // 12:35 - 13:35. Back to the mill with the animals. Watched lightly; the family's person walks with them.
      id: 'back', minutes: 60, title: 'Back to the camp', step: 20, claimId: 'HIST-TEX-031',
      caption: 'The men go back to the camp at the mill with the pack animals and the grass. Nobody on the Texian side was killed.',
      texian: { style: 'column', from: 'packs', to: 'millHorse', action: 'withdraw', fire: 'none', faceTo: 'mill' },
      mexican: { style: 'bank', at: 'creekBed', action: 'gone', fire: 'none' },
      groups: [jack('column', { from: 'jackBeyond', to: 'millFoot', action: 'withdraw', faceTo: 'mill' }), train({ from: 'packs', to: 'mill', action: 'advance', faceTo: 'mill' })],
      gun: false,
    },
  ],
  ground: grassGround,
  scenery: grassScenery,
});
