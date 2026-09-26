// The storming of Béxar, December 4-14, 1835, on the engine (sim/battle-stage.mjs, docs/BATTLES.md §6). Staged from
// docs/battle-research/staging.md §3, whose every time, count and word is sourced in docs/battle-research/bexar-storming.md;
// the claims are `HIST-TEX-036` to `-045` (registered 2026-09-16) and `HIST-TEX-490` to `-496`, `FIC-GONZ-425` to `-429`.
//
// The owner's decision (docs/BATTLES.md §2b.3): four held episodes - the entry at 3 a.m. on December 5, the fighting where
// Milam died, the Priest's House, and the white flag - about twelve real minutes in all at the Study pace, with the town
// fighting at a slower background pace between them. So: Milam's call at the mill on the evening of the 4th; the roll at two;
// the divisions out of the mill at three and across the cornfield in the dark; Neill's gun on the Alamo at five; the two
// columns down Acequia and Soledad streets into the de la Garza and Veramendi houses; the cannonade at seven from the town
// and the Alamo; three days and nights pinned in the houses (loopholes, trenches, sandbags, crowbars through walls); Karnes's
// door about noon on the 7th and Milam shot in the Veramendi yard at half past three; the Navarro house that night and
// Zambrano Row on the 8th, the companies from the camp coming in and Ugartechea's column going into the Alamo; Cooke's Greys
// and Patton's company under the loopholes into the Priest's House at half past ten, and the heaviest cannonade of the siege;
// in the dark Cos draws into the Alamo and the presidial cavalry rides away south; at half past six on the 9th a bugle sounds
// a parley the Texians do not know, and a white flag comes to the plaza. Then the terms, and on the 14th Cos's paroled army
// marches out.
//
// Neither side is in rows once the fighting starts (staging.md §3.3): both fight from inside stone houses and from behind
// parapets, and the fight moves by breaking walls. The only rows are the Texians' own muster at the mill on the 4th.
//
// Nothing here depends on who came (`HIST-TEX-038`): no family's person changes a count, a place or a minute. The illustrated
// town is not a survey (docs/BEXAR_ASSEMBLY.md): the houses are staged on the assembly's houses nearest the research's
// offsets and are never labelled with the Garza, Veramendi or Navarro names; the account names them in words.
//
// This file imports nothing, so the engine, the clock and the army can all read it without a cycle.

/**
 * The mill camp above the town, in miles east and south of Béxar's plaza (`FIC-GONZ-428`, amending `FIC-GONZ-040`'s mile):
 * "within one-half a mile" (Field), "some six hundred yards above the town" (W. T. Austin). sim/army.mjs `SIEGE_CAMPS.mill`
 * reads it from here, so the camp the army stands at and the ground the fight is drawn on are one point.
 */
export const MILL_OFFSET = Object.freeze({ dx: 0, dy: -0.45 });

/**
 * The ground, in miles east (`x`) and south (`y`) of Béxar's site point, which is the centre of the Plaza de las Islas
 * (public/bexar-layout.js `BEXAR_FRAME`). The houses are the assembly's (tests/battle-bexar.test.mjs holds each within a few
 * yards of one): the research's de la Garza house at +0.02, -0.15 and the Veramendi on the river side of Soledad Street are
 * staged on the two houses of the north neighbourhood nearest them; the Priest's House and Zambrano Row on the plaza's north
 * frontage; the Alamo's guns at the compound's west wall as the map lays it (sim/alamo-runner.mjs `ALAMO_ORIGIN`).
 */
export const BEXAR_OFFSETS = Object.freeze({
  mill: { x: MILL_OFFSET.dx, y: MILL_OFFSET.dy },
  millGun: { x: 0.03, y: -0.43 },
  // "Across the cornfield" from the mill, over a brush fence; blankets and coats dropped about two hundred yards out.
  cornfield: { x: 0.012, y: -0.34 },
  fence: { x: 0.015, y: -0.25 },
  // The heads of the two streets the columns came down (Acequia and Soledad), before they broke into the houses.
  acequia: { x: 0.0, y: -0.165 },
  soledad: { x: 0.056, y: -0.16 },
  // Milam's first division's house (the research's de la Garza), and Johnson's second (the Veramendi), on the assembly.
  garza: { x: 0.0213, y: -0.1105 },
  garzaGun: { x: 0.03, y: -0.118 },
  veramendi: { x: 0.054, y: -0.0979 },
  veramendiRoof: { x: 0.056, y: -0.106 },
  // The Veramendi yard, where Milam fell (`HIST-TEX-039`).
  yard: { x: 0.064, y: -0.088 },
  // The trench the men dug across the street between the two houses the first night (`HIST-TEX-038`).
  trench: { x: 0.038, y: -0.103 },
  // The house "to the right and in advance of the first division" that McDonald's men took on the 6th.
  mcdonald: { x: 0.0097, y: -0.0805 },
  // The house in front that Karnes forced with a crowbar about noon on the 7th.
  karnes: { x: 0.0424, y: -0.0679 },
  // The Navarro house, "close to the square", taken at ten on the night of the 7th.
  navarro: { x: 0.028, y: -0.058 },
  // Zambrano Row, "leading to the square", taken room by room on the 8th, and the plaza's edge in front of it.
  row: { x: 0.0149, y: -0.044 },
  rowFront: { x: 0.012, y: -0.03 },
  // The line of loopholes Cooke's men passed "within a few feet of ... for seventy or seventy five yards", and its end.
  loopholes: { x: 0.03, y: -0.076 },
  loopholesEnd: { x: 0.0, y: -0.063 },
  // The Priest's House on the plaza, and the gun by the cemetery "two or three yards" from its door.
  priests: { x: -0.0116, y: -0.0542 },
  cemeteryGun: { x: -0.02, y: -0.047 },
  // The palisade and gun across the street's entrance to the plaza, the plaza itself, the roofs round it and the church.
  barricade: { x: 0.004, y: -0.024 },
  plaza: { x: 0.0, y: 0.004 },
  plazaRoofs: { x: 0.03, y: -0.036 },
  church: { x: -0.048, y: -0.0175 },
  // The Alamo, east over the river: its west wall where its guns fired on the town "from the left".
  alamoWest: { x: 0.29, y: -0.11 },
  // Neill's gun, across the river on the Alamo's north side, and the fifty of the sortie against the camp on the 8th.
  neill: { x: 0.32, y: -0.245 },
  sortieOut: { x: 0.17, y: -0.3 },
  // The house the wounded were carried to (Levy and Pollard's "hospital"), behind the Texian houses.
  hospital: { x: -0.0114, y: -0.1231 },
  // Where the townspeople let out of a breached house went: "back to the houses which lay between our present quarters and
  // the camp" (Ehrenberg).
  townsfolkGone: { x: -0.05, y: -0.21 },
  // The road south out of the town, and on toward Mission San José and the Rio Grande.
  southRoad: { x: -0.07, y: 0.18 },
  sanJose: { x: -0.1, y: 0.42 },
});

/** The ground read off the map: Béxar's own point and the offsets above. A class with no Béxar has no storming. */
export function bexarGround(world) {
  const bexar = world.map.sites.bexar;
  return Object.fromEntries(Object.entries(BEXAR_OFFSETS).map(([name, o]) => [name, { x: bexar.x + o.x, y: bexar.y + o.y }]));
}

const TEX = 'texian', MEX = 'mexican';
/** One line. `name` only on a documented line or a `tradition` one (sim/battle-stage.mjs `checkEngagement`). */
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
const fall = (side, count, at, claimId, extra = {}) => ({ side, count, at, claimId, ...extra });

// The frames a page is framed on (docs/BATTLES.md §2.1): the mill and the ground to the town while the men are there; the
// north side of the plaza and Soledad Street with the Alamo's guns at the east edge while the town is fought over.
const AT_THE_MILL = ['mill', 'fence', 'garza'];
const IN_THE_TOWN = ['garza', 'plaza', 'alamoWest'];

// The groups each phase repeats. Johnson's second division beside Milam's first (the Texian side); the reserve at the mill;
// the Alamo's garrison on its walls; the musketeers on the roofs round the plaza; the loopholes round the plaza.
const johnson = (spec = {}) => ({ id: 'johnson', side: TEX, name: 'Johnson’s division', count: 110, drawn: 24, style: 'street', at: 'veramendi', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.05, depth: 0.04 }, ...spec });
const reserve = (spec = {}) => ({ id: 'reserve', side: TEX, name: 'Burleson’s reserve at the mill', count: 450, drawn: 16, style: 'loose', at: 'mill', fire: 'none', action: 'stand', spread: { width: 0.12, depth: 0.08 }, ...spec });
const alamo = (spec = {}) => ({ id: 'alamo', side: MEX, name: 'On the Alamo’s walls', count: 100, drawn: 8, style: 'street', at: 'alamoWest', face: 'veramendi', fire: 'scattered', action: 'hold', cover: 'roof', spread: { width: 0.05, depth: 0.02 }, ...spec });
const roofs = (spec = {}) => ({ id: 'roofs', side: MEX, name: 'Musketeers on the roofs', count: 80, drawn: 10, style: 'street', spread: { width: 0.07, depth: 0.015 }, at: 'plazaRoofs', face: 'garza', fire: 'scattered', action: 'hold', cover: 'roof', ...spec });
const loops = (spec = {}) => ({ id: 'loops', side: MEX, name: 'Loopholes round the plaza', count: 60, drawn: 10, style: 'street', at: 'church', face: 'garza', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.06, depth: 0.03 }, ...spec });
const reinforcement = (spec = {}) => ({ id: 'reinforce', side: TEX, name: 'The companies from the camp', count: 100, drawn: 14, style: 'street', at: 'veramendi', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.05, depth: 0.04 }, ...spec });
// The divisions in their houses, firing through the loopholes they cut: most of them out of sight inside the walls.
const inTheHouse = (spec = {}) => ({ style: 'street', at: 'garza', action: 'hold', fire: 'scattered', cover: 'loophole', spread: { width: 0.05, depth: 0.04 }, ...spec });
const atTheBarricade = (spec = {}) => ({ style: 'street', at: 'barricade', action: 'hold', fire: 'scattered', cover: 'barricade', spread: { width: 0.07, depth: 0.05 }, ...spec });

export const BEXAR_STORMING = Object.freeze({
  id: 'bexar-storming',
  name: 'The storming of Béxar',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): Milam's call at the mill, six in the evening of the
  // 4th. Every later moment of the storming the director keeps is dated from these phases.
  startKey: 'milam',
  claimId: 'HIST-TEX-038',
  outcome: 'Cos capitulates; his army leaves Béxar on parole; the volunteers hold the town.',
  held: name => `${name} is in the fighting in San Antonio with Milam's men, and cannot be sent anywhere else until it is over.`,
  sides: {
    // About 210 to 300 went in (`HIST-TEX-036`), "equally divided into two divisions" (W. T. Austin): Milam's first is the
    // Texian side, Johnson's second a group beside it. About one figure for three or four men.
    texian: { name: 'Milam’s division', count: 110, drawn: 30, claimId: 'HIST-TEX-037', spread: { width: 0.05, depth: 0.04 } },
    // About 570 in the town before Ugartechea (`HIST-TEX-040`), most inside the houses and on the roofs round the plaza: the
    // plaza's defenders are the side, the roofs, the loopholes and the Alamo are groups. On screen it reads as many small
    // fires, not two lines (staging.md §3.3).
    mexican: { name: 'Cos’s garrison', count: 570, drawn: 26, claimId: 'HIST-TEX-040' },
  },
  // Days of fighting: a man who fell is carried off the ground within the four hours after.
  fallsLinger: 240,
  frame: IN_THE_TOWN,
  // The guns (`HIST-TEX-037`, `-038`, `-040`): Neill's on the Alamo, the long twelve-pounder with the first division, the plaza's
  // gun at its palisade, the gun by the cemetery the Greys spiked, the Alamo's on the town, and the six-pounder at the camp.
  guns: [
    { id: 'neill', side: TEX, at: 'neill', face: 'alamoWest', metal: 'iron', crew: 3, claimId: 'HIST-TEX-037' },
    { id: 'twelve', side: TEX, at: 'garzaGun', face: 'church', metal: 'iron', crew: 3, claimId: 'HIST-TEX-494' },
    { id: 'plaza', side: MEX, at: 'barricade', face: 'garza', metal: 'bronze', crew: 3, claimId: 'HIST-TEX-038' },
    { id: 'cemetery', side: MEX, at: 'cemeteryGun', face: 'priests', metal: 'iron', crew: 2, claimId: 'HIST-TEX-495' },
    { id: 'alamo', side: MEX, at: 'alamoWest', face: 'veramendi', metal: 'iron', crew: 3, claimId: 'HIST-TEX-494' },
    { id: 'six', side: TEX, at: 'millGun', face: 'sortieOut', metal: 'iron', crew: 3, claimId: 'HIST-TEX-040' },
  ],
  // The words of a volley. The Spanish regulation of 1808 has them; whether the Mexican army of 1835 drilled by it is not
  // known (staging.md §0), so they are reconstructed here, with the English under them (`FIC-GONZ-426`).
  commands: {
    volley: [
      { text: '¡Preparen!', gloss: 'Make ready!', kind: 'reconstructed' },
      { text: '¡Apunten!', gloss: 'Take aim!', kind: 'reconstructed' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'reconstructed' },
    ],
  },
  phases: [
    {
      // Dec 4, 18:00-20:00. The army ordered into winter quarters that morning; a deserter says the town is weak; Milam calls
      // for men, and they "fall into ranks to see if we are strong enough" (Maverick). The one time the Texians stand in rows.
      id: 'call', minutes: 120, step: 20, title: 'Milam’s call', claimId: 'HIST-TEX-036', frame: AT_THE_MILL,
      caption: 'December 4, evening, at the old mill above Béxar. Half the army is packing up for home. A Mexican officer has come over and says the town is weak, and Ben Milam is calling for men to go in with him. Men step forward into ranks to see if they are enough.',
      texian: { style: 'ranks', at: 'mill', action: 'stand', fire: 'none' },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'barricade', action: 'stand', fire: 'none' },
      groups: [reserve({ at: 'millGun' })],
      lines: [
        // Owner question B2 (a): Milam says it, drawn as tradition, with the claim row explaining how we know it.
        say('b-milam', 10, TEX, 'commander', 'tradition', 'Who will go with old Ben Milam into San Antonio?', { name: 'Milam', claimId: 'HIST-TEX-492', gloss: 'As told years later (TSHA; F. W. Johnson) - no letter of 1835 gives his words' }),
        say('b-go', 22, TEX, 'volunteer', 'reconstructed', 'I’ll go.'),
        say('b-put', 38, TEX, 'volunteer', 'reconstructed', 'Put me down.'),
        say('b-walled', 58, TEX, 'volunteer', 'reconstructed', 'Two hundred men against a walled town?'),
        say('b-companies', 90, TEX, 'volunteer', 'reconstructed', 'Fall in by companies.'),
      ],
    },
    {
      // Dec 4, 20:00 - Dec 5, 02:00. The two divisions formed at the mill after dark. Not held: nothing moves.
      id: 'night-4', minutes: 360, title: 'Night at the mill', claimId: 'HIST-TEX-037', frame: AT_THE_MILL,
      caption: 'Night at the mill. The volunteers have elected Milam to lead them and are formed in two divisions, his own and F. W. Johnson’s. Burleson will hold the camp with the rest.',
      texian: { style: 'column', at: 'mill', action: 'stand', fire: 'none' },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'barricade', action: 'stand', fire: 'none' },
      groups: [reserve({ at: 'millGun' })],
    },
    {
      // Dec 5, 02:00-03:00. The roll: 230 signed, 210 answered (Ehrenberg).
      id: 'roll', minutes: 60, step: 20, title: 'The roll at two in the morning', claimId: 'HIST-TEX-036', frame: AT_THE_MILL,
      caption: 'Two in the morning. The roll is called. Some who put their names down do not answer; about two hundred and ten do.',
      texian: { style: 'column', at: 'mill', action: 'stand', fire: 'none' },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'barricade', action: 'stand', fire: 'none' },
      groups: [reserve({ at: 'millGun' }), johnson({ style: 'column', at: 'millGun', fire: 'none', action: 'stand', cover: undefined })],
      lines: [
        say('b-names', 4, TEX, 'volunteer', 'reconstructed', 'Answer to your names.'),
        say('b-here', 12, TEX, 'volunteer', 'reconstructed', 'Here.'),
      ],
    },
    {
      // Dec 5, 03:00-05:00. "At three O'clock we hurried noiselessly" (Ehrenberg): out of the mill, over the cornfield in the
      // dark, and down to the brush fence; Neill with a gun and Roberts's company across the river for the Alamo.
      id: 'out', minutes: 120, step: 20, title: 'Out of the mill in the dark', claimId: 'HIST-TEX-494', frame: AT_THE_MILL,
      caption: 'Three in the morning, cold, with a norther blowing. The two divisions leave the mill in silence and cross the cornfield toward the town. Colonel Neill takes a cannon across the river toward the Alamo.',
      texian: { style: 'column', from: 'mill', to: 'fence', action: 'advance', fire: 'none' },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'barricade', action: 'stand', fire: 'none' },
      groups: [
        reserve(), johnson({ style: 'column', from: 'millGun', to: 'soledad', fire: 'none', action: 'advance', cover: undefined }),
        { id: 'neill', side: TEX, name: 'Neill’s gun and Roberts’s company', count: 25, drawn: 8, style: 'column', from: 'mill', to: 'neill', fire: 'none', action: 'advance' },
        { id: 'sentinel', side: MEX, name: 'A sentinel', count: 1, drawn: 1, style: 'street', at: 'acequia', face: 'fence', fire: 'none', action: 'stand' },
      ],
      guns: { neill: [] },
      lines: [
        say('b-sound', 8, TEX, 'volunteer', 'reconstructed', 'Not a sound from here on.'),
        say('b-closed', 60, TEX, 'volunteer', 'reconstructed', 'Keep closed up.'),
        say('b-cold', 95, TEX, 'volunteer', 'reconstructed', 'Cold enough to freeze the powder.'),
      ],
    },
    {
      // Dec 5, 05:00-05:30. Neill's gun on the Alamo from the north (Burleson, Dec 14); blankets dropped about two hundred
      // yards out; over the brush fence; a sentinel challenges and is shot - Deaf Smith fired (`HIST-TEX-494`).
      id: 'feint', minutes: 30, step: 5, contact: true, title: 'Neill’s gun, and the fence', claimId: 'HIST-TEX-494',
      caption: 'Five o’clock. Neill’s gun opens on the Alamo from the north to draw the Mexicans’ eyes. The volunteers drop their blankets and coats, climb a brush fence, and a sentinel calls out and is shot.',
      texian: { style: 'column', keys: [[0, 'fence'], [16, 'fence'], [30, 'acequia']], action: 'advance', fire: 'none' },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'barricade', action: 'hold', fire: 'picket' },
      groups: [
        reserve(), johnson({ style: 'column', keys: [[0, 'soledad'], [30, 'veramendi']], fire: 'none', action: 'advance', cover: undefined }),
        { id: 'neill', side: TEX, name: 'Neill’s gun and Roberts’s company', count: 25, drawn: 8, style: 'street', at: 'neill', face: 'alamoWest', fire: 'scattered', action: 'hold', spread: { width: 0.05, depth: 0.03 } },
        { id: 'sentinel', side: MEX, name: 'A sentinel', count: 1, drawn: 1, style: 'street', at: 'acequia', face: 'fence', fire: 'picket', action: 'hold' },
        alamo({ face: 'neill' }),
      ],
      guns: { neill: { every: 3, from: 0 }, alamo: [7, 14, 21, 27] },
      falls: [fall(MEX, 1, 21, 'HIST-TEX-494', { unit: 'sentinel' })],
      lines: [
        say('b-neill', 1, TEX, 'volunteer', 'reconstructed', 'That’s Neill’s gun.'),
        say('b-blankets', 7, TEX, 'volunteer', 'reconstructed', 'Drop your blankets here.'),
        say('b-quien', 18, MEX, 'sentry', 'reconstructed', '¿Quién vive?', { gloss: 'Who goes there?', unit: 'sentinel' }),
        say('b-armas', 23, MEX, 'officer', 'reconstructed', '¡A las armas!', { gloss: 'To arms!' }),
      ],
    },
    {
      // Dec 5, 05:30-07:00. Down Acequia and Soledad; into the de la Garza and Veramendi houses; the second division "exposed
      // for a short time to a very heavy fire of grape and musketry"; Greys on the Veramendi roof driven down, cutting their way
      // back in with knives; one private killed on the day, and more than half of all the wounded (`HIST-TEX-490`, `-494`).
      id: 'entry', minutes: 90, step: 10, contact: true, title: 'Into the houses', claimId: 'HIST-TEX-494',
      caption: 'Down the two streets in the half-dark, keeping to the walls. Milam’s men break into a stone house on the west side of the street and Johnson’s into one on the river side. Grape and musket fire sweep the street from the plaza. Men who climb onto a roof are driven off it.',
      texian: { style: 'street', keys: [[0, 'acequia'], [20, 'garza']], action: 'advance', fire: 'scattered', spread: { width: 0.05, depth: 0.05 } },
      mexican: { ...atTheBarricade({ fire: 'volley' }) },
      groups: [
        reserve(), johnson({ style: 'street', keys: [[0, 'veramendi'], [12, 'veramendi']], cover: undefined, action: 'advance' }),
        { id: 'roof-greys', side: TEX, name: 'On the Veramendi roof', count: 20, drawn: 7, style: 'street', spread: { width: 0.025, depth: 0.012 }, keys: [[0, 'veramendi'], [25, 'veramendiRoof'], [52, 'veramendiRoof'], [60, 'veramendi']], fire: 'scattered', action: 'hold', cover: 'roof' },
        { id: 'neill', side: TEX, name: 'Neill’s gun and Roberts’s company', count: 25, drawn: 8, style: 'street', at: 'neill', face: 'alamoWest', fire: 'scattered', action: 'hold', spread: { width: 0.05, depth: 0.03 } },
        roofs(), loops(), alamo(),
      ],
      guns: { neill: [2, 8, 14], plaza: [8, 20, 31, 42, 53, 64, 76, 86], alamo: [15, 35, 55, 80], twelve: [26, 34] },
      falls: [
        fall(TEX, 1, 28, 'HIST-TEX-490', { unit: 'johnson', wounded: true, carried: true }),
        fall(TEX, 2, 50, 'HIST-TEX-490', { unit: 'roof-greys', wounded: true, carried: true }),
        fall(TEX, 1, 72, 'HIST-TEX-490', { carried: true }),
        fall(MEX, 1, 62, 'HIST-TEX-042', { wounded: true, carried: true }),
      ],
      lines: [
        say('b-wall', 4, TEX, 'volunteer', 'reconstructed', 'Keep to the wall!'),
        say('b-door', 16, TEX, 'volunteer', 'reconstructed', 'The door - break it in!', { unit: 'johnson' }),
        say('b-azoteas', 24, MEX, 'officer', 'reconstructed', '¡A las azoteas!', { gloss: 'To the rooftops!' }),
        say('b-roof', 46, TEX, 'volunteer', 'reconstructed', 'Off the roof!', { unit: 'roof-greys' }),
        say('b-knives', 55, TEX, 'volunteer', 'reconstructed', 'Cut a hole in it - get back inside!', { unit: 'johnson' }),
        say('b-fuego', 66, MEX, 'officer', 'reconstructed', '¡Fuego!', { gloss: 'Fire!' }),
      ],
    },
    {
      // Dec 5, 07:00-08:00. "At seven o'clock, a heavy cannonading from the town was seconded by a well directed fire from the
      // Alamo"; the twelve-pounder dismounted; "a close and well directed fire from our rifles" (Johnson, `HIST-TEX-494`).
      id: 'cannonade', minutes: 60, step: 20, contact: true, title: 'The cannonade at seven', claimId: 'HIST-TEX-494',
      caption: 'Seven o’clock. The guns in the town open on the two houses, and the Alamo’s guns fire on them from the east. The Texians’ big gun is knocked off its carriage. From inside the houses the riflemen fire back through holes cut in the walls.',
      texian: inTheHouse(),
      mexican: atTheBarricade({ fire: 'volley' }),
      groups: [reserve(), johnson(), roofs(), loops(), alamo()],
      guns: { plaza: { every: 4, from: 1 }, alamo: { every: 5, from: 2 }, twelve: [] },
      falls: [fall(TEX, 1, 25, 'HIST-TEX-490', { wounded: true, carried: true }), fall(MEX, 1, 41, 'HIST-TEX-042', { unit: 'roofs' })],
      lines: [
        say('b-alamo', 4, TEX, 'volunteer', 'reconstructed', 'They’re firing from the Alamo too!', { unit: 'johnson' }),
        say('b-middle', 30, TEX, 'volunteer', 'reconstructed', 'Stay out of the middle of the street.'),
      ],
    },
    {
      // Dec 5, 08:00 - Dec 6, 06:00. Pinned in the houses; that night trenches and "a safe communication", "the want of proper
      // tools" (Johnson). Background: the town fighting at the ordinary military cap (`FIC-GONZ-429`).
      id: 'pinned-5', minutes: 1320, background: 120, contact: true, title: 'Pinned in the houses', claimId: 'HIST-TEX-038',
      caption: 'The first day and night in the houses. The riflemen fire through loopholes they have cut in the stone; cannon fire rakes the middle of the streets. The people of Béxar lie shut in their own houses all around. After dark the men dig a trench across the street between the two houses.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [
        reserve(), johnson(), roofs(), loops(), alamo(),
        { id: 'trench', side: TEX, name: 'Digging across the street', count: 20, drawn: 6, style: 'street', at: 'trench', fire: 'none', action: 'work', cover: 'sandbags', spread: { width: 0.025, depth: 0.01 } },
      ],
      guns: { plaza: { every: 45 }, alamo: { every: 60 } },
      falls: [fall(TEX, 1, 200, 'HIST-TEX-490', { wounded: true, carried: true }), fall(MEX, 1, 430, 'HIST-TEX-042', { unit: 'roofs' })],
      lines: [
        say('b-loophole', 50, TEX, 'volunteer', 'reconstructed', 'Loophole here.'),
        say('b-vengan', 330, MEX, 'soldier', 'reconstructed', '¡Vengan, tejanos!', { gloss: 'Come on, Texians!', unit: 'roofs' }),
        say('b-getus', 338, TEX, 'volunteer', 'reconstructed', 'Come and get us!', { unit: 'johnson' }),
        say('b-bar', 560, TEX, 'volunteer', 'reconstructed', 'Pass the bar.'),
        say('b-trench', 800, TEX, 'volunteer', 'reconstructed', 'Dig - we want a trench across by morning.', { unit: 'trench' }),
      ],
    },
    {
      // Dec 6, 06:00 - Dec 7, 06:00. The housetops held by the Mexicans "through loop-holes"; McDonald's detachment of Crane's
      // company takes "the house to the right, and in advance of the first division"; the long twelve-pounder loopholed into a
      // wall; mesquite burning between the lines until eight; that night, sandbags (`HIST-TEX-038`, `-490`). Townspeople found
      // in a house broken into are let go (`HIST-TEX-043`): drawn unhurt, walking out.
      id: 'pinned-6', minutes: 1440, background: 120, contact: true, title: 'The second day', claimId: 'HIST-TEX-038',
      caption: 'December 6. McDonald’s men take a house ahead of Milam’s, beating in the door; the family shut inside comes out unhurt and is let go toward the camp. The big gun is set in a hole in a wall and fires on the church. At night the men fill sandbags.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [
        reserve(), johnson(), roofs(), loops(), alamo(),
        { id: 'mcdonald', side: TEX, name: 'McDonald’s men of Crane’s company', count: 25, drawn: 8, style: 'street', keys: [[0, 'garza'], [240, 'garza'], [275, 'mcdonald']], fire: 'scattered', action: 'advance', spread: { width: 0.03, depth: 0.03 } },
        { id: 'townsfolk', side: TEX, name: 'People of the town', count: 6, drawn: 5, style: 'street', keys: [[0, 'mcdonald'], [285, 'mcdonald'], [420, 'townsfolkGone']], fire: 'none', action: 'withdraw', civilians: true, spread: { width: 0.03, depth: 0.025 } },
        { id: 'trench', side: TEX, name: 'Sandbags at the trench', count: 20, drawn: 6, style: 'street', at: 'trench', fire: 'none', action: 'work', cover: 'sandbags', spread: { width: 0.025, depth: 0.01 } },
      ],
      breaches: [{ point: 'mcdonald', side: TEX, from: 262, at: 270, claimId: 'HIST-TEX-038' }],
      guns: { plaza: { every: 50 }, alamo: { every: 70 }, twelve: { every: 90, from: 150 } },
      falls: [fall(TEX, 1, 360, 'HIST-TEX-490', { wounded: true, carried: true }), fall(TEX, 1, 700, 'HIST-TEX-490', { unit: 'johnson', wounded: true, carried: true })],
      lines: [
        say('b-letout', 288, TEX, 'volunteer', 'reconstructed', 'Let them out - they’re townspeople.', { unit: 'mcdonald' }),
        say('b-water', 470, TEX, 'volunteer', 'reconstructed', 'Is there any water left?'),
        say('b-sandbags', 780, TEX, 'volunteer', 'reconstructed', 'Sandbags - fill them tonight.', { unit: 'trench' }),
      ],
    },
    {
      // Dec 7, 06:00-12:00. At daylight a Mexican trench found on the Alamo side; firing until eleven, "when they were silenced".
      id: 'pinned-7', minutes: 360, background: 120, contact: true, title: 'The third morning', claimId: 'HIST-TEX-038',
      caption: 'December 7. At daylight the Mexicans have dug a trench toward the Alamo and strengthened their battery on the street leading there. Their guns fire until about eleven, and then fall quiet.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [reserve(), johnson(), roofs(), loops(), alamo(), { id: 'mcdonald', side: TEX, name: 'McDonald’s men of Crane’s company', count: 25, drawn: 8, style: 'street', at: 'mcdonald', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.03, depth: 0.03 } }],
      guns: { plaza: { every: 40, to: 300 }, alamo: { every: 50, to: 300 } },
      lines: [say('b-silenced', 305, TEX, 'volunteer', 'reconstructed', 'Their guns have stopped.')],
    },
    {
      // Dec 7, 12:00-12:40. "About noon Henry W. Karnes ... with a crowbar forced an entrance" to a house in front of the first
      // division, "into which the whole of the company immediately followed him" (Johnson, `HIST-TEX-038`). The crowbar is
      // the act; the words are not his.
      id: 'karnes', minutes: 40, step: 5, contact: true, title: 'Karnes and the crowbar', claimId: 'HIST-TEX-038',
      caption: 'About noon. Henry Karnes of York’s company runs to the door of a house ahead with a crowbar, forces it, and the whole company follows him in. The family inside is let go.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [
        reserve(), johnson(), roofs(), loops(), alamo(),
        { id: 'york', side: TEX, name: 'York’s company', count: 40, drawn: 12, style: 'street', keys: [[0, 'garza'], [5, 'garza'], [11, 'karnes']], fire: 'scattered', action: 'advance', spread: { width: 0.03, depth: 0.03 } },
        { id: 'townsfolk', side: TEX, name: 'People of the town', count: 4, drawn: 4, style: 'street', keys: [[0, 'karnes'], [14, 'karnes'], [38, 'townsfolkGone']], fire: 'none', action: 'withdraw', civilians: true, spread: { width: 0.03, depth: 0.025 } },
      ],
      breaches: [{ point: 'karnes', side: TEX, from: 1, at: 5, claimId: 'HIST-TEX-038' }],
      guns: { plaza: [12, 26], alamo: [31] },
      falls: [fall(MEX, 1, 13, 'HIST-TEX-042', { carried: true }), fall(TEX, 1, 22, 'HIST-TEX-490', { unit: 'york', wounded: true, carried: true })],
      lines: [
        say('b-karnes', 1, TEX, 'volunteer', 'reconstructed', 'Follow Karnes!', { unit: 'york' }),
        say('b-vienen', 6, MEX, 'soldier', 'reconstructed', '¡Ahí vienen!', { gloss: 'Here they come!', unit: 'loops' }),
        say('b-family', 13, TEX, 'volunteer', 'reconstructed', 'Easy - there’s a family in here.', { unit: 'york' }),
        say('b-holdit', 30, TEX, 'volunteer', 'reconstructed', 'Hold this house.', { unit: 'york' }),
      ],
    },
    {
      // Dec 7, 12:40-14:40. "In the evening, heavy fire" (Johnson). Background.
      id: 'afternoon', minutes: 120, background: 120, contact: true, title: 'The afternoon of the 7th', claimId: 'HIST-TEX-038',
      caption: 'The afternoon of December 7. York’s company holds the house Karnes broke into. The firing grows heavy again.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [reserve(), johnson(), roofs(), loops(), alamo(), { id: 'york', side: TEX, name: 'York’s company', count: 40, drawn: 12, style: 'street', at: 'karnes', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.03, depth: 0.03 } }],
      guns: { plaza: { every: 30 }, alamo: { every: 40 } },
      falls: [fall(TEX, 1, 60, 'HIST-TEX-490', { wounded: true, carried: true })],
      lines: [say('b-pouring', 50, TEX, 'volunteer', 'reconstructed', 'They’re pouring it on now.')],
    },
    {
      // Dec 7, 14:40-15:30. The yards between the houses, under fire.
      id: 'yard', minutes: 50, step: 10, contact: true, title: 'The Veramendi yard', claimId: 'HIST-TEX-039',
      caption: 'Mid-afternoon. Men cross the walled yards between the houses under fire from the roofs round the plaza.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [reserve(), johnson({ keys: [[0, 'veramendi'], [30, 'yard'], [50, 'veramendi']], action: 'advance', cover: undefined }), roofs(), loops(), alamo(), { id: 'york', side: TEX, name: 'York’s company', count: 40, drawn: 12, style: 'street', at: 'karnes', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.03, depth: 0.03 } }],
      guns: { plaza: [10, 30], alamo: [20, 45] },
      lines: [say('b-down', 22, TEX, 'volunteer', 'reconstructed', 'Keep down crossing the yard.', { unit: 'johnson' })],
    },
    {
      // Dec 7, 15:30-16:00. "At half-past three o'clock, as our gallant commander, Colonel Milam, was passing into the yard of
      // my position, he received a rifle shot in the head, which caused his instant death" (Johnson, `HIST-TEX-039`). No words:
      // the men round him stop firing, and the yard falls quiet (staging.md §3.4). Milam says nothing here.
      id: 'milam', minutes: 30, step: 5, contact: true, title: 'Milam falls', claimId: 'HIST-TEX-039',
      caption: 'Half past three. Ben Milam is shot in the head as he passes into the yard of the Veramendi house, and dies at once. The men nearest him stop firing.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [reserve(), johnson({ at: 'veramendi', fire: 'none', cover: undefined }), roofs(), loops(), alamo(), { id: 'york', side: TEX, name: 'York’s company', count: 40, drawn: 12, style: 'street', at: 'karnes', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.03, depth: 0.03 } }],
      guns: { plaza: [15] },
      falls: [fall(TEX, 1, 0, 'HIST-TEX-039', { point: 'yard', name: 'Milam', carried: true })],
    },
    {
      // Dec 7, 16:00 - Dec 8, 06:00. At seven the officers give the command to Johnson; at ten Llewellyn's, English's, Crane's
      // and Landrum's companies take the Navarro house, "close to the square"; "exceedingly cold and wet" (`HIST-TEX-038`, -039).
      id: 'night-7', minutes: 840, background: 120, contact: true, title: 'The night of the 7th', claimId: 'HIST-TEX-038',
      caption: 'The night of December 7, cold and wet. Milam is buried quietly in the dark. At seven the officers give the command to F. W. Johnson. At ten four companies take the Navarro house, close to the square.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [
        reserve(), johnson(), roofs(), loops(), alamo({ fire: 'none' }),
        { id: 'navarro', side: TEX, name: 'Llewellyn’s, English’s, Crane’s and Landrum’s companies', count: 90, drawn: 12, style: 'street', keys: [[0, 'garza'], [355, 'garza'], [375, 'navarro']], fire: 'scattered', action: 'advance', spread: { width: 0.03, depth: 0.03 } },
      ],
      guns: { plaza: { every: 90 }, alamo: { every: 120 } },
      lines: [
        say('b-johnson', 185, TEX, 'volunteer', 'reconstructed', 'The officers have put Johnson in command.'),
        say('b-navarro', 380, TEX, 'volunteer', 'reconstructed', 'That house is ours.', { unit: 'navarro' }),
        say('b-wet', 520, TEX, 'volunteer', 'reconstructed', 'Cold and wet, and nothing to eat.'),
      ],
    },
    {
      // Dec 8, 06:00-22:00. "Cold and wet, with but little firing"; from seven the companies from the camp come in (Cheshire's,
      // Sutherland's, Lewis's); at nine the same four companies with a detachment of the Greys take Zambrano Row, the enemy
      // "forced to retire from room to room"; at seven in the evening four more companies into the Row; Ugartechea's column
      // reaches the Alamo, and about fifty from the Alamo fire on the camp and are driven off by a six-pounder (`HIST-TEX-038`,
      // `-040`).
      id: 'row', minutes: 960, background: 120, contact: true, title: 'Zambrano Row', claimId: 'HIST-TEX-038',
      caption: 'December 8. Companies come in from the camp. At nine the Texians take a row of houses leading to the square, room by room, breaking through the walls between. In the evening a column of about six hundred Mexican reinforcements, most of them untrained, marches into the Alamo.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [
        reserve(), johnson(), alamo(),
        roofs({ keys: [[0, 'plazaRoofs'], [180, 'plazaRoofs'], [240, 'church']] }),
        reinforcement({ style: 'column', keys: [[0, 'mill'], [60, 'mill'], [100, 'fence'], [150, 'veramendi']], action: 'advance', fire: 'none', cover: undefined }),
        { id: 'navarro', side: TEX, name: 'Four companies, with a detachment of the Greys', count: 90, drawn: 12, style: 'street', keys: [[0, 'navarro'], [180, 'navarro'], [240, 'row']], fire: 'scattered', action: 'advance', spread: { width: 0.035, depth: 0.02 } },
        { id: 'ugartechea', side: MEX, name: 'Ugartechea’s reinforcement', count: 600, drawn: 20, style: 'column', keys: [[0, 'sanJose'], [690, 'sanJose'], [760, 'southRoad'], [850, 'alamoWest']], fire: 'none', action: 'advance', face: 'alamoWest' },
        { id: 'sortie', side: MEX, name: 'A sortie from the Alamo', count: 50, drawn: 8, style: 'street', keys: [[0, 'alamoWest'], [770, 'alamoWest'], [795, 'sortieOut'], [815, 'sortieOut'], [845, 'alamoWest']], face: 'mill', fire: 'scattered', action: 'advance', spread: { width: 0.05, depth: 0.03 } },
      ],
      breaches: [{ point: 'row', side: TEX, from: 190, at: 205, claimId: 'HIST-TEX-038' }],
      guns: { plaza: { every: 120 }, alamo: { every: 120 }, six: [798, 806, 814] },
      falls: [fall(TEX, 1, 215, 'HIST-TEX-490', { unit: 'navarro', wounded: true, carried: true }), fall(TEX, 1, 640, 'HIST-TEX-490', { wounded: true, carried: true })],
      lines: [
        say('b-companies-in', 95, TEX, 'volunteer', 'reconstructed', 'Companies from the camp, coming in.', { unit: 'reinforce' }),
        say('b-rooms', 200, TEX, 'volunteer', 'reconstructed', 'Room to room - through the wall!', { unit: 'navarro' }),
        say('b-hole', 262, TEX, 'volunteer', 'reconstructed', 'Talk through the hole - who’s in there?', { unit: 'navarro' }),
        say('b-column', 770, TEX, 'volunteer', 'reconstructed', 'More of them - a big column, going into the Alamo.'),
        say('b-six', 800, TEX, 'volunteer', 'reconstructed', 'The six-pounder’s on them at the camp.', { unit: 'reserve' }),
      ],
    },
    {
      // Dec 8, 22:00-23:20. Cooke's Greys and Patton's company, about forty-nine, leave the Veramendi house, pass "within a few
      // feet of a line of loop holes for seventy or seventy five yards" under a bright moon, climb a barricaded doorway into the
      // Priest's House, spike a gun "two or three yards" from the door - Belden hit "in the act of spiking a cannon" - and
      // barricade with "blankets, shirts, the library of the priest"; then "the enemy opened a furious cannonade from all
      // their batteries" (Johnson; Cooke 1844; `HIST-TEX-495`).
      id: 'priests-house', minutes: 80, step: 5, contact: true, title: 'The Priest’s House', claimId: 'HIST-TEX-495',
      caption: 'Half past ten at night, under a bright moon. About fifty of the New Orleans Greys and Patton’s company creep along the walls past a line of loopholes, climb into the priest’s house on the plaza, and spike a cannon two or three yards from its door. Then every Mexican gun opens on them.',
      texian: inTheHouse(),
      mexican: atTheBarricade(),
      groups: [
        reserve(), johnson(), alamo(), roofs({ at: 'church' }), reinforcement(),
        { id: 'navarro', side: TEX, name: 'In Zambrano Row', count: 180, drawn: 12, style: 'street', at: 'row', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.035, depth: 0.02 } },
        { id: 'greys', side: TEX, name: 'Cooke’s Greys and Patton’s company', count: 49, drawn: 14, style: 'column', keys: [[0, 'veramendi'], [30, 'veramendi'], [52, 'loopholesEnd'], [58, 'priests']], fire: 'none', action: 'advance' },
        { id: 'loopline', side: MEX, name: 'The line of loopholes', count: 40, drawn: 10, style: 'street', at: 'loopholes', face: 'loopholesEnd', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.04, depth: 0.01 } },
      ],
      guns: { cemetery: [55, 58], plaza: [66, 68, 70, 72, 74, 76, 78], alamo: [67, 71, 75, 79] },
      falls: [fall(MEX, 1, 59, 'HIST-TEX-495', { carried: true }), fall(TEX, 1, 61, 'HIST-TEX-495', { unit: 'greys', wounded: true, carried: true })],
      lines: [
        say('b-whisper', 28, TEX, 'volunteer', 'reconstructed', 'Close to the wall. Not a sound.', { unit: 'greys' }),
        say('b-spike', 59, TEX, 'volunteer', 'reconstructed', 'Spike it!', { unit: 'greys' }),
        say('b-block', 64, TEX, 'volunteer', 'reconstructed', 'Blankets, books, anything - block that door!', { unit: 'greys' }),
        say('b-fuego2', 66, MEX, 'officer', 'reconstructed', '¡Fuego! ¡Fuego!', { gloss: 'Fire! Fire!' }),
      ],
    },
    {
      // Dec 8, 23:20 - Dec 9, 06:20. The cannonade "unceasingly until half-past six". In the dark Cos concentrates in the
      // Alamo; about one the cavalry is ordered to saddle; about four several presidial companies ride away south (about 175,
      // DISPUTED); Condelle withdraws the plaza guns and will not surrender (`HIST-TEX-040`, `-491`).
      id: 'night-8', minutes: 420, background: 120, contact: true, title: 'The last night', claimId: 'HIST-TEX-040',
      caption: 'The last night. The Mexican guns fire without stopping. In the dark General Cos draws his men back into the Alamo, and some of his cavalry companies ride away south. From the houses the Texians see only the firing slacken and men moving toward the Alamo.',
      texian: inTheHouse(),
      mexican: { style: 'column', keys: [[0, 'barricade'], [150, 'barricade'], [400, 'alamoWest']], action: 'withdraw', fire: 'none', face: 'away' },
      groups: [
        reserve(), johnson(), alamo(), reinforcement(),
        { id: 'navarro', side: TEX, name: 'In Zambrano Row', count: 180, drawn: 12, style: 'street', at: 'row', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.035, depth: 0.02 } },
        { id: 'greys', side: TEX, name: 'In the Priest’s House', count: 49, drawn: 14, style: 'street', at: 'priests', fire: 'scattered', action: 'hold', cover: 'loophole', spread: { width: 0.02, depth: 0.02 } },
        { id: 'morelos', side: MEX, name: 'Condelle’s Morelos battalion at the plaza guns', count: 70, drawn: 10, style: 'street', spread: { width: 0.05, depth: 0.03 }, keys: [[0, 'barricade'], [330, 'barricade'], [410, 'alamoWest']], fire: 'scattered', action: 'hold', cover: 'barricade' },
        { id: 'presidiales', side: MEX, name: 'Presidial cavalry', count: 175, drawn: 14, style: 'mounted', mounted: true, keys: [[0, 'plaza'], [270, 'plaza'], [320, 'southRoad'], [400, 'sanJose']], fire: 'none', action: 'withdraw', away: true },
      ],
      guns: { plaza: { every: 6, to: 380 }, alamo: { every: 8 } },
      lines: [
        say('b-caballo', 102, MEX, 'officer', 'reconstructed', '¡A caballo!', { gloss: 'To horse!', unit: 'presidiales' }),
        say('b-going', 285, TEX, 'volunteer', 'reconstructed', 'Horses - a lot of them - going south.', { unit: 'greys' }),
        // Reported speech: Sánchez Navarro reports Condelle's refusal in these terms (`HIST-TEX-491`).
        say('b-condelle', 300, MEX, 'officer', 'documented', 'El Batallón Morelos no se ha rendido nunca.', { name: 'Condelle', claimId: 'HIST-TEX-491', unit: 'morelos', gloss: 'The Morelos battalion has never surrendered - his words as Sánchez Navarro reported them' }),
      ],
    },
    {
      // Dec 9, 06:20-07:00. The cannonade stops; "at half-past six o'clock" a flag of truce (Johnson); Sánchez Navarro used a
      // white flag "because the Texians did not understand the bugle" (`HIST-TEX-041`, `-491`).
      id: 'flag', minutes: 40, step: 5, contact: true, title: 'The white flag', claimId: 'HIST-TEX-491',
      caption: 'Half past six in the morning, December 9. The guns stop. A Mexican bugle sounds a call the Texians do not know, and then a white flag comes out to the plaza. The Texians come out onto the roofs and into the street to see.',
      texian: { style: 'street', keys: [[0, 'garza'], [18, 'garza'], [40, 'rowFront']], action: 'advance', fire: 'none', spread: { width: 0.05, depth: 0.04 } },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'plaza', action: 'stand', fire: 'none' },
      groups: [reserve(), johnson({ fire: 'none', cover: undefined }), reinforcement({ fire: 'none', cover: undefined }), { id: 'greys', side: TEX, name: 'In the Priest’s House', count: 49, drawn: 14, style: 'street', at: 'priests', fire: 'none', action: 'hold', spread: { width: 0.02, depth: 0.02 } }, alamo({ fire: 'none' })],
      guns: { plaza: [2, 6], alamo: [4, 8] },
      flags: [{ side: MEX, kind: 'white', keys: [[14, 'plaza'], [30, 'barricade']], from: 14, claimId: 'HIST-TEX-491' }],
      lines: [
        say('b-bugle', 10, MEX, 'bugler', 'documented', '(a bugle sounds for a parley)', { claimId: 'HIST-TEX-491', gloss: 'The Texians did not know the call (Sánchez Navarro)' }),
        say('b-call', 12, TEX, 'volunteer', 'reconstructed', 'What’s that call?'),
        say('b-white', 16, TEX, 'volunteer', 'reconstructed', 'A white flag! Hold your fire!'),
      ],
    },
    {
      // Dec 9, 07:00-07:20. Sánchez Navarro comes to the town offices; colonists led by "a certain Smith" (J. W. Smith) meet the
      // flag, and Padre Refugio de la Garza joins them (`HIST-TEX-041`). Nobody says a documented word here, so nobody speaks.
      id: 'truce', minutes: 20, step: 5, contact: true, title: 'The flag of truce', claimId: 'HIST-TEX-041',
      caption: 'Seven o’clock. The Mexican officer with the flag is met by John W. Smith, who knows the town, and the parish priest, Padre Refugio de la Garza. They go to find the Texian commander.',
      texian: { style: 'street', at: 'rowFront', action: 'stand', fire: 'none', spread: { width: 0.05, depth: 0.04 } },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'plaza', action: 'stand', fire: 'none' },
      groups: [reserve(), johnson({ fire: 'none', cover: undefined }), reinforcement({ fire: 'none', cover: undefined }), alamo({ fire: 'none' })],
      flags: [{ side: MEX, kind: 'white', at: 'barricade', from: 0, claimId: 'HIST-TEX-491' }],
      parley: { part: 0.5, people: [{ side: TEX, name: 'J. W. Smith' }, { side: MEX, name: 'Sánchez Navarro' }] },
    },
    {
      // Dec 9, 07:20-09:20. "On the morning of the 9th ... I proceeded to town" (Burleson): at nine he rides in.
      id: 'parley', minutes: 120, title: 'The talks begin', claimId: 'HIST-TEX-041',
      caption: 'The morning of December 9. General Burleson rides in from the camp at nine. Cos’s officers have come without written authority, and go back to the Alamo for it.',
      texian: { style: 'street', at: 'rowFront', action: 'stand', fire: 'none', spread: { width: 0.05, depth: 0.04 } },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'plaza', action: 'stand', fire: 'none' },
      groups: [reserve(), johnson({ fire: 'none', cover: undefined }), reinforcement({ fire: 'none', cover: undefined }), alamo({ fire: 'none' })],
      flags: [{ side: MEX, kind: 'white', at: 'barricade', from: 0, claimId: 'HIST-TEX-491' }],
      parley: { part: 0.5, people: [{ side: TEX, name: 'J. W. Smith' }, { side: MEX, name: 'Sánchez Navarro' }] },
    },
    {
      // Dec 9, 09:20 - Dec 14, 09:00. Terms agreed "by two o'clock a. m. of the 10th"; the capitulation dated the 11th; the army
      // paraded and voted company by company, "a small majority for it" (Dance) - a vote a family's man took part in; Cos in the
      // Alamo "for the present" and Burleson in the town (`HIST-TEX-041`).
      id: 'terms', minutes: 7180, title: 'The capitulation', claimId: 'HIST-TEX-041',
      caption: 'Terms are agreed in the small hours of December 10 and written out on the 11th. Cos and his officers are to go into the interior on their word not to oppose the Constitution of 1824; his men keep their muskets and ten rounds. Cos holds the Alamo until he leaves; the volunteers hold the town. The army votes on the terms, company by company.',
      texian: { style: 'street', at: 'rowFront', action: 'stand', fire: 'none', spread: { width: 0.08, depth: 0.05 } },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'alamoWest', action: 'stand', fire: 'none' },
      groups: [reserve()],
      lines: [say('b-vote', 2920, TEX, 'volunteer', 'reconstructed', 'Aye - let them go.')],
    },
    {
      // Dec 14, 09:00-11:00. "General Cos left this morning for the mission of San José, and, to-morrow, commences his march
      // to the Rio Grande" (Burleson): the paroled army marching out with its muskets, how many DISPUTED (`HIST-TEX-496`).
      id: 'marching-out', minutes: 120, step: 20, title: 'Cos marches out', claimId: 'HIST-TEX-496',
      caption: 'December 14. General Cos’s army marches out of Béxar for Mission San José and the Rio Grande, the men carrying their muskets. The reports disagree about how many went: from about five hundred to about eleven hundred.',
      texian: { style: 'street', at: 'rowFront', action: 'stand', fire: 'none', spread: { width: 0.08, depth: 0.05 } },
      mexican: { style: 'street', spread: { width: 0.07, depth: 0.05 }, at: 'alamoWest', action: 'gone', fire: 'none' },
      frame: ['garza', 'alamoWest', 'southRoad'],
      groups: [{ id: 'cos-army', side: MEX, name: 'Cos’s army, on parole', count: 800, drawn: 36, style: 'column', keys: [[0, 'alamoWest'], [50, 'plaza'], [120, 'sanJose']], face: 'sanJose', fire: 'none', action: 'withdraw' }],
      lines: [
        say('b-marchen', 3, MEX, 'officer', 'reconstructed', '¡Marchen!', { gloss: 'March!', unit: 'cos-army' }),
        say('b-there', 40, TEX, 'volunteer', 'reconstructed', 'There they go.'),
      ],
    },
  ],
  ground: bexarGround,
});
