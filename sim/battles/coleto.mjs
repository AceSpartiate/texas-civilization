// Coleto, March 19-20, 1836: Fannin's column caught on the open prairie, the square, and the surrender. On the engine
// (sim/battle-stage.mjs, docs/BATTLES.md §6), staged from docs/battle-research/staging.md §6, whose times, counts and words
// are sourced there. Claims: `HIST-TEX-515` (how it was fought), `-516` (where), `-521` (after), `FIC-GONZ-437` (as staged).
//
// The shape of it (`HIST-TEX-515`): Fannin marches out of Goliad about nine in a heavy fog, with nine brass guns, carts and
// overloaded, hungry oxen; a cart breaks down and the largest gun goes into the San Antonio River; about a mile past
// Manahuilla Creek he halts an hour to graze the oxen. Urrea's cavalry catches the column on the open prairie 400-500 yards
// short of the Coleto timber, and the Texians form a hollow square three ranks deep with guns at the corners and the carts
// inside. Three assaults - riflemen on the left, grenadiers and San Luis on the right, the Jiménez battalion in front,
// cavalry at the rear - are beaten off until sunset, when Urrea stops for want of ammunition. All night his marksmen fire
// from the tall grass on men with little water and no fires, who dig in behind their carts and dead animals. In the night his
// reinforcements and guns come up; at a quarter past six his artillery opens, and Fannin surrenders.
//
// **Here the Texians are the ones in rows** (the owner's instinct reversed, as the research says), and at night the Mexicans
// are the loose ones.
//
// Nothing here depends on who came (docs/BATTLES.md §2.6): no family's person changes a count, a place or a minute.
// This file imports nothing from the director, so the engine and the clock can read it without a cycle.

/**
 * Where the fight stands, read off the map: the presidio at Goliad and the Coleto ground (the Fannin Battleground marker,
 * `HIST-TEX-516`). A map saved before Coleto was a place (2026-09-25) has no `coleto` site; it is put where the marker is,
 * 8.98 miles east and 2.68 north of the presidio on every colonies map, which is the correct place and moves nothing else.
 */
export function coletoGround(world) {
  const goliad = world.map.sites.goliad;
  const coleto = world.map.sites.coleto || { x: goliad.x + 8.98, y: goliad.y - 2.68 };
  const dx = coleto.x - goliad.x, dy = coleto.y - goliad.y, span = Math.hypot(dx, dy) || 1;
  // The line of march, Goliad to Coleto and on toward Victoria, and its left hand (north, as the column marches east).
  const toward = { x: dx / span, y: dy / span }, left = { x: toward.y, y: -toward.x };
  const at = (from, along, across = 0) => ({ x: from.x + toward.x * along + left.x * across, y: from.y + toward.y * along + left.y * across });
  const C = { x: coleto.x, y: coleto.y }, G = { x: goliad.x, y: goliad.y };
  return {
    goliad: G, coleto: C,
    // Out of the presidio's gate onto the road, and how far the column had come in its first hour in the fog.
    gate: at(G, 0.15), out: at(G, 1.4),
    // Horton's horsemen, ahead of the column.
    'gate-ahead': at(G, 0.45, 0.04), 'out-ahead': at(G, 2.1, 0.06), 'halt-ahead': at(G, 6.6, 0.08),
    // "About a mile past Manahuilla Creek" (`HIST-TEX-515`): the halt to graze the oxen. ceiling: the creek's own crossing is
    // not placed; the halt is set two-thirds of the way.
    halt: at(G, 6.1),
    // Where the column was when the cavalry came up behind it: short of the square's ground, on the open prairie.
    short: at(C, -0.45),
    // The square's ground, and the Coleto timber 400-500 yards on (`HIST-TEX-515`): a quarter of a mile is 440 yards.
    square: C, timber: at(C, 0.26),
    // Horton's men, cut off in the timber and gone on toward Victoria.
    'horton-gone': at(C, 1.3, 0.1),
    // Urrea behind the column, and his cavalry coming up the road from Goliad.
    urrea: at(G, -1.2), 'rear-road': at(C, -1.6),
    // The four sides the assaults came from: riflemen on the left, grenadiers and San Luis on the right, the Jiménez battalion
    // in front, the cavalry at the rear (`HIST-TEX-515`). Far is where each formed and fell back to, near the closest it came.
    'left-far': at(C, 0.02, 0.36), 'left-near': at(C, 0.02, 0.13),
    'right-far': at(C, -0.02, -0.36), 'right-near': at(C, -0.02, -0.14),
    'front-far': at(C, 0.34), 'front-near': at(C, 0.14),
    'rear-far': at(C, -0.42), 'rear-near': at(C, -0.17),
    // The marksmen lay closer, in the grass, all night.
    'left-grass': at(C, 0, 0.16), 'right-grass': at(C, 0, -0.16), 'front-grass': at(C, 0.17), 'rear-grass': at(C, -0.18),
    // The guns at the square's corners, and the Mexican battery that came up in the night, in front by the timber.
    'corner-fl': at(C, 0.11, 0.11), 'corner-fr': at(C, 0.11, -0.11), 'corner-bl': at(C, -0.11, 0.11), 'corner-br': at(C, -0.11, -0.11),
    'battery-1': at(C, 0.3, 0.04), 'battery-2': at(C, 0.3, -0.05),
    // The guard on either side of the prisoners marched back to Goliad.
    'back-left': at(C, 0, 0.08), 'back-right': at(C, 0, -0.08), 'gate-left': at(G, 0.15, 0.08), 'gate-right': at(G, 0.15, -0.08),
    toward, left,
  };
}

const TEX = 'texian', MEX = 'mexican';
/** One line. `name` only ever on a documented line (sim/battle-stage.mjs `checkEngagement`). */
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** The square: four faces of three ranks facing out, its front toward the timber (`HIST-TEX-515`). */
const SQUARE = { style: 'square', at: 'square', face: 'timber', action: 'hold' };
/** The four Mexican sides of an assault, each on its keyframes out from its far point to its near one and back. */
const assault = ({ left, right, front, rear }) => ({
  style: 'ranks', action: 'advance', fire: 'volley',
  parts: [
    { id: 'left', style: 'loose', fire: 'scattered', share: 0.24, spread: { width: 0.26, depth: 0.08 }, keys: left.map(([m, p]) => [m, `left-${p}`]) },
    { id: 'right', style: 'column', fire: 'scattered', share: 0.24, keys: right.map(([m, p]) => [m, `right-${p}`]) },
    { id: 'front', style: 'ranks', fire: 'volley', share: 0.32, keys: front.map(([m, p]) => [m, `front-${p}`]) },
    { id: 'rear', style: 'mounted', fire: 'picket', mounted: true, share: 0.2, keys: rear.map(([m, p]) => [m, `rear-${p}`]) },
  ],
});
/**
 * The Mexicans between assaults and at night: formed back out of range, or lying in the grass.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "Coleto and Goliad", item 1 - the marksmen in the grass are drawn in the
 * loose order's standing and kneeling poses, firing, until a man lying in the grass firing is drawn.
 */
const ringed = ({ fire = 'picket', grass = false, style = 'ranks' } = {}) => ({
  style, action: 'hold', fire,
  parts: grass
    ? ['left', 'right', 'front', 'rear'].map(id => ({ id, style: id === 'rear' ? 'mounted' : 'loose', ...(id === 'rear' && { mounted: true }), fire: id === 'rear' ? 'none' : fire, share: 0.25, spread: { width: 0.3, depth: 0.05 }, at: id === 'rear' ? 'rear-far' : `${id}-grass` }))
    : ['left', 'right', 'front', 'rear'].map(id => ({ id, style: id === 'rear' ? 'mounted' : style, ...(id === 'rear' && { mounted: true }), fire: id === 'front' ? fire : 'none', share: 0.25, at: `${id}-far` })),
});
const GUNS = ['corner-fl', 'corner-fr', 'corner-bl', 'corner-br'];

export const COLETO = Object.freeze({
  id: 'coleto',
  name: 'Coleto',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): nine in the morning of March 19, 1836.
  startKey: 'fannin-marches',
  claimId: 'HIST-TEX-515',
  outcome: 'Fannin surrenders his command on the morning of March 20; the prisoners are marched back to Goliad.',
  held: name => `${name} is with Fannin's men on the prairie, and cannot be sent anywhere until it is over.`,
  sides: {
    // About 300-330 in the square (`HIST-TEX-063`), and about thirty with Horton; drawn as a sample of sixty.
    texian: { name: 'Fannin’s command', count: 330, drawn: 60, claimId: 'HIST-TEX-063', spread: { width: 0.2, depth: 0.12 } },
    // About 280 with a gun at first; more than 1,400 by the morning (`HIST-TEX-515`). The phases give each count.
    mexican: { name: 'Urrea’s division', count: 280, drawn: 56, claimId: 'HIST-TEX-515' },
  },
  // Four of the nine brass guns, at the square's corners; the Mexican battery that came up in the night.
  // ceiling: four guns are drawn for nine; the other five stood in the square's faces and are not drawn apart.
  cannons: [
    ...GUNS.map(at => ({ id: at, side: TEX, at, metal: 'bronze', crew: 3, claimId: 'HIST-TEX-515', from: 'square', until: 'march-back' })),
    { id: 'battery-1', side: MEX, at: 'battery-1', metal: 'iron', crew: 3, claimId: 'HIST-TEX-515', from: 'before-dawn' },
    { id: 'battery-2', side: MEX, at: 'battery-2', metal: 'iron', crew: 3, claimId: 'HIST-TEX-515', from: 'before-dawn' },
  ],
  flag: null,
  // The Spanish words of a volley (`HIST-TEX-479`, reconstructed for Mexico in 1836: staging.md §0), and the Texian square's
  // own, which no source gives (reconstructed, `FIC-GONZ-437`).
  commands: {
    volley: [
      { text: '¡Preparen las armas!', gloss: 'Make ready!', kind: 'reconstructed' },
      { text: '¡Apunten!', gloss: 'Take aim!', kind: 'reconstructed' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'reconstructed' },
    ],
    texian: { volley: [
      { text: 'Front rank, make ready!', kind: 'reconstructed' },
      { text: 'Present!', kind: 'reconstructed' },
      { text: 'Fire! Rear rank, make ready!', kind: 'reconstructed' },
    ] },
  },
  phases: [
    {
      // 09:00-10:00. Out of the presidio in the fog, the column with its carts and guns; Horton's horsemen ahead.
      id: 'march-out', minutes: 60, step: 20, light: 'fog', title: 'Out of Goliad, in the fog', claimId: 'HIST-TEX-515',
      caption: 'About nine in the morning of March 19, Colonel Fannin at last marches his men out of Goliad for Victoria, in a heavy fog, with nine brass cannon, carts and slow, hungry oxen. Crossing the San Antonio River, the largest gun falls into the water and is left.',
      texian: { style: 'column', action: 'advance', fire: 'none', parts: [
        { id: 'column', style: 'column', from: 'gate', to: 'out', share: 0.92, face: 'square' },
        { id: 'horton', style: 'loose', from: 'gate-ahead', to: 'out-ahead', share: 0.08, spread: { width: 0.08, depth: 0.05 }, face: 'square' },
      ] },
      mexican: { style: 'column', at: 'urrea', action: 'gone', fire: 'none' },
      lines: [
        say('k-carts', 10, TEX, 'volunteer', 'reconstructed', 'Keep those carts closed up!'),
        say('k-fog', 30, TEX, 'volunteer', 'reconstructed', 'Can’t see the road in this fog.'),
        say('k-oxen', 50, TEX, 'volunteer', 'reconstructed', 'These oxen haven’t had a decent feed in days.'),
      ],
    },
    {
      // 10:00-13:00. On the Victoria road; a cart breaks down; the halt past Manahuilla Creek to graze the oxen.
      id: 'road', minutes: 180, step: 60, title: 'The halt on the prairie', claimId: 'HIST-TEX-515',
      caption: 'The fog lifts. A cart breaks down and the overloaded oxen go slowly. About a mile past Manahuilla Creek, Fannin halts for an hour to rest the men and let the hungry oxen graze. Horton’s horsemen ride on ahead toward the Coleto timber.',
      texian: { style: 'column', action: 'advance', fire: 'none', parts: [
        { id: 'column', style: 'column', keys: [[0, 'out'], [90, 'halt'], [150, 'halt'], [180, 'short']], share: 0.92, face: 'square' },
        { id: 'horton', style: 'loose', keys: [[0, 'out-ahead'], [90, 'halt-ahead'], [150, 'halt-ahead'], [180, 'timber']], share: 0.08, spread: { width: 0.08, depth: 0.05 }, face: 'square' },
      ] },
      mexican: { style: 'column', at: 'urrea', action: 'gone', fire: 'none' },
      lines: [
        say('k-graze', 95, TEX, 'volunteer', 'reconstructed', 'Let the oxen graze a spell.'),
        say('k-slow', 160, TEX, 'volunteer', 'reconstructed', 'We’re going too slow. They could come up on us out here.'),
      ],
    },
    {
      // 13:00-13:10. The cavalry come up from the rear; the column tries for the timber and is cut off (contact: the fighting
      // a family's man must be with the men for, docs/BATTLES.md §2.6).
      id: 'caught', minutes: 10, step: 2, contact: true, title: 'Caught on the open prairie', claimId: 'HIST-TEX-515',
      caption: 'Mexican cavalry come up fast from behind. The column hurries for the Coleto timber a quarter of a mile ahead, but the horsemen cut it off on the open prairie. Horton’s men, ahead in the timber, are cut off from it.',
      texian: { style: 'column', action: 'advance', fire: 'none', parts: [
        { id: 'column', style: 'column', keys: [[0, 'short'], [10, 'square']], share: 0.92, face: 'timber' },
        { id: 'horton', style: 'loose', from: 'timber', to: 'horton-gone', share: 0.08, spread: { width: 0.08, depth: 0.05 }, face: 'horton-gone' },
      ] },
      mexican: { style: 'mounted', count: 100, drawn: 24, action: 'advance', fire: 'picket', parts: [
        { id: 'rear', style: 'mounted', mounted: true, keys: [[0, 'rear-road'], [9, 'rear-far']], share: 0.6 },
        { id: 'left', style: 'mounted', mounted: true, keys: [[0, 'rear-road'], [10, 'left-far']], share: 0.4 },
      ] },
      lines: [
        say('k-behind', 1, TEX, 'volunteer', 'reconstructed', 'Horsemen behind us!'),
        say('k-timber', 4, TEX, 'volunteer', 'reconstructed', 'The timber! We’ll never make the timber.'),
        say('k-caballo', 6, MEX, 'officer', 'reconstructed', '¡A galope! ¡Córtenles el paso!', { gloss: 'At the gallop! Cut them off!' }),
      ],
    },
    {
      // 13:10-13:30. The square forms: three ranks deep, a gun at each corner, the carts inside; Urrea's infantry come up.
      id: 'square', minutes: 20, step: 5, contact: true, title: 'The square', claimId: 'HIST-TEX-515',
      caption: 'The Texians form a hollow square three ranks deep, with cannon at the corners and the carts inside: the San Antonio Greys and the Red Rovers in front, Duval’s Mustangs and the Refugio men at the rear. Urrea’s infantry come up and form on three sides.',
      texian: { ...SQUARE, fire: 'none' },
      mexican: { ...ringed({ fire: 'none' }), count: 280, drawn: 56, action: 'advance' },
      lines: [
        say('k-form', 1, TEX, 'officer', 'reconstructed', 'Form square! Guns to the corners!'),
        say('k-carts-in', 6, TEX, 'volunteer', 'reconstructed', 'Get the carts inside!'),
        say('k-formar', 12, MEX, 'officer', 'reconstructed', '¡En columna! ¡Armen la bayoneta!', { gloss: 'In column! Fix bayonets!' }),
      ],
    },
    {
      // 13:30-14:20. The first assault, from every side at once: the hardest of the day.
      id: 'assault-1', minutes: 50, step: 5, contact: true, title: 'The first assault', claimId: 'HIST-TEX-515',
      caption: 'Urrea attacks from every side at once: riflemen on the left, grenadiers on the right, the Jiménez battalion in front, and cavalry at the rear. The square fires by ranks and the guns fire canister, and the attack is beaten back. Men fall inside the square.',
      texian: { ...SQUARE, fire: 'volley' },
      mexican: { ...assault({
        left: [[0, 'far'], [18, 'near'], [38, 'near'], [50, 'far']], right: [[0, 'far'], [20, 'near'], [34, 'near'], [50, 'far']],
        front: [[0, 'far'], [16, 'near'], [40, 'near'], [50, 'far']], rear: [[0, 'far'], [24, 'near'], [30, 'near'], [42, 'far']],
      }), count: 280, drawn: 56 },
      cannon: [{ gun: 'corner-fl', at: 17 }, { gun: 'corner-fr', at: 19 }, { gun: 'corner-bl', at: 24 }, { gun: 'corner-br', at: 26 }, { gun: 'corner-fl', at: 31 }, { gun: 'corner-br', at: 36 }],
      falls: [
        { side: TEX, count: 1, at: 22, claimId: 'HIST-TEX-063' },
        { side: TEX, count: 1, at: 19, claimId: 'HIST-TEX-063', wounded: true },
        { side: TEX, count: 2, at: 27, claimId: 'HIST-TEX-063', wounded: true },
        { side: TEX, count: 1, at: 34, claimId: 'HIST-TEX-063', wounded: true },
        { side: MEX, part: 'front', count: 2, at: 21, claimId: 'HIST-TEX-515' },
        { side: MEX, part: 'rear', count: 1, at: 26, claimId: 'HIST-TEX-515', wounded: true, carried: true },
        { side: MEX, part: 'right', count: 1, at: 29, claimId: 'HIST-TEX-515', wounded: true, carried: true },
        { side: MEX, part: 'left', count: 1, at: 33, claimId: 'HIST-TEX-515' },
      ],
      lines: [
        say('k-here', 8, TEX, 'volunteer', 'reconstructed', 'Here they come, all round!'),
        say('k-carga', 22, MEX, 'officer', 'reconstructed', '¡A la carga!', { gloss: 'Charge!' }),
        say('k-steady', 25, TEX, 'officer', 'reconstructed', 'Steady! Wait for them!'),
        say('k-down', 30, TEX, 'volunteer', 'reconstructed', 'He’s hit! Get him inside!'),
        say('k-back', 44, TEX, 'volunteer', 'reconstructed', 'They’re going back!'),
      ],
    },
    {
      // 14:20-15:40. They fall back out of range and form again.
      id: 'lull-1', minutes: 80, step: 20, title: 'Between the attacks', claimId: 'HIST-TEX-515',
      caption: 'The Mexicans fall back out of range and form again. Inside the square the wounded lie among the carts. There is little water.',
      texian: { ...SQUARE, fire: 'picket' },
      mexican: { ...ringed({ fire: 'picket' }), count: 280, drawn: 56 },
      lines: [
        say('k-many', 20, TEX, 'volunteer', 'reconstructed', 'How many of them are there?'),
        say('k-reform', 50, MEX, 'officer', 'reconstructed', '¡A formar!', { gloss: 'Fall in!' }),
      ],
    },
    {
      // 15:40-16:30. The second assault.
      id: 'assault-2', minutes: 50, step: 5, contact: true, title: 'The second assault', claimId: 'HIST-TEX-515',
      caption: 'The second assault comes on from the sides and the rear. The square holds, firing by ranks, and the guns at the corners fire canister into the attackers.',
      texian: { ...SQUARE, fire: 'volley' },
      mexican: { ...assault({
        left: [[0, 'far'], [18, 'near'], [34, 'near'], [50, 'far']], right: [[0, 'far'], [16, 'near'], [36, 'near'], [50, 'far']],
        front: [[0, 'far'], [26, 'far'], [50, 'far']], rear: [[0, 'far'], [20, 'near'], [27, 'near'], [40, 'far']],
      }), count: 280, drawn: 56 },
      cannon: [{ gun: 'corner-bl', at: 17 }, { gun: 'corner-br', at: 21 }, { gun: 'corner-fl', at: 25 }, { gun: 'corner-fr', at: 32 }],
      falls: [
        { side: TEX, count: 1, at: 20, claimId: 'HIST-TEX-063' },
        { side: TEX, count: 2, at: 24, claimId: 'HIST-TEX-063', wounded: true },
        { side: MEX, part: 'left', count: 1, at: 22, claimId: 'HIST-TEX-515' },
        { side: MEX, part: 'rear', count: 1, at: 24, claimId: 'HIST-TEX-515', wounded: true, carried: true },
        { side: MEX, part: 'right', count: 1, at: 30, claimId: 'HIST-TEX-515', wounded: true, carried: true },
      ],
      lines: [
        say('k-again', 6, TEX, 'volunteer', 'reconstructed', 'They’re coming again!'),
        say('k-cav', 20, MEX, 'officer', 'reconstructed', '¡Caballería, a la carga!', { gloss: 'Cavalry, charge!' }),
        say('k-hold', 24, TEX, 'officer', 'reconstructed', 'Hold the rear! Hold!'),
      ],
    },
    {
      id: 'lull-2', minutes: 50, step: 10, title: 'Between the attacks', claimId: 'HIST-TEX-515',
      caption: 'Another pause. The Mexicans re-form out of range. The Texians load, and pass round what water is left.',
      texian: { ...SQUARE, fire: 'picket' },
      mexican: { ...ringed({ fire: 'picket' }), count: 280, drawn: 56 },
      lines: [say('k-water', 20, TEX, 'volunteer', 'reconstructed', 'Save the water for the wounded.')],
    },
    {
      // 17:20-18:15. The third assault, toward sunset (about 6:10, COMPUTED).
      id: 'assault-3', minutes: 55, step: 5, contact: true, title: 'The third assault', claimId: 'HIST-TEX-515',
      caption: 'Toward sunset Urrea attacks a third time, and is beaten off again. His men are running short of ammunition.',
      texian: { ...SQUARE, fire: 'volley' },
      mexican: { ...assault({
        left: [[0, 'far'], [20, 'near'], [38, 'near'], [55, 'far']], right: [[0, 'far'], [22, 'near'], [36, 'near'], [55, 'far']],
        front: [[0, 'far'], [18, 'near'], [40, 'near'], [55, 'far']], rear: [[0, 'far'], [30, 'far'], [55, 'far']],
      }), count: 280, drawn: 56 },
      cannon: [{ gun: 'corner-fr', at: 19 }, { gun: 'corner-fl', at: 22 }, { gun: 'corner-br', at: 30 }],
      falls: [
        { side: TEX, count: 1, at: 26, claimId: 'HIST-TEX-063', wounded: true },
        { side: MEX, part: 'front', count: 1, at: 24, claimId: 'HIST-TEX-515' },
        { side: MEX, part: 'left', count: 1, at: 28, claimId: 'HIST-TEX-515', wounded: true, carried: true },
      ],
      lines: [
        say('k-third', 8, TEX, 'volunteer', 'reconstructed', 'Again! Load!'),
        say('k-balas', 40, MEX, 'soldier', 'reconstructed', '¡No hay más cartuchos!', { gloss: 'No more cartridges!' }),
      ],
    },
    {
      // 18:15-19:15. Urrea stops the attacks; his marksmen go into the grass round the square.
      id: 'dusk', minutes: 60, step: 20, light: 'dusk', title: 'Dark on the prairie', claimId: 'HIST-TEX-515',
      caption: 'At sunset Urrea stops the attacks for want of ammunition. His marksmen creep into the tall grass around the square and fire at anything that moves. The Texians have little water and dare light no fires.',
      texian: { ...SQUARE, fire: 'picket' },
      mexican: { ...ringed({ fire: 'scattered', grass: true }), style: 'loose', count: 280, drawn: 56 },
      lines: [
        say('k-alerta', 25, MEX, 'sentry', 'reconstructed', '¡Centinela, alerta!', { gloss: 'Sentry, look sharp!' }),
        say('k-drink', 45, TEX, 'volunteer', 'reconstructed', 'Water. Is there any water?'),
      ],
    },
    {
      // 19:15-03:15. The night: sniping from the grass, the Mexican reinforcements coming up. Watched at four hours a tick.
      id: 'night', minutes: 480, step: 240, light: 'night', title: 'The night', claimId: 'HIST-TEX-515',
      caption: 'All night the marksmen fire from the grass. Inside the square the wounded cannot be treated. More Mexican soldiers and cannon come up in the dark.',
      texian: { ...SQUARE, fire: 'picket' },
      mexican: { ...ringed({ fire: 'scattered', grass: true }), style: 'loose', count: 700, drawn: 56 },
      lines: [say('k-alerta-2', 240, MEX, 'sentry', 'reconstructed', '¡Centinela, alerta!', { gloss: 'Sentry, look sharp!' })],
    },
    {
      // 03:15-04:15. The Texians dig and barricade with carts and dead animals.
      id: 'small-hours', minutes: 60, step: 20, light: 'night', title: 'Digging in', claimId: 'HIST-TEX-515',
      caption: 'In the small hours the Texians dig trenches and pile up their carts and the bodies of dead oxen and horses as a barricade.',
      texian: { ...SQUARE, fire: 'picket' },
      mexican: { ...ringed({ fire: 'scattered', grass: true }), style: 'loose', count: 1000, drawn: 56 },
      falls: [{ side: TEX, count: 1, at: 30, claimId: 'HIST-TEX-063', wounded: true }],
      lines: [
        say('k-dig', 10, TEX, 'volunteer', 'reconstructed', 'Dig, boys. Throw the dirt up in front.'),
        say('k-morning', 40, TEX, 'volunteer', 'reconstructed', 'What happens in the morning?'),
      ],
    },
    {
      // 04:15-06:15. First light: the Mexicans are more than 1,400, formed round the square, with their guns in front.
      id: 'before-dawn', minutes: 120, step: 60, light: 'dawn', title: 'First light', claimId: 'HIST-TEX-515',
      caption: 'At first light the Texians see what came up in the night: more than a thousand Mexican soldiers formed around them, and cannon in front, by the timber.',
      texian: { ...SQUARE, fire: 'none' },
      mexican: { ...ringed({ fire: 'none' }), count: 1400, drawn: 60 },
      lines: [say('k-cannon', 70, TEX, 'volunteer', 'reconstructed', 'They’ve got cannon up.')],
    },
    {
      // 06:15-07:00. The Mexican artillery opens on the square (`HIST-TEX-515`: 6:15).
      id: 'guns', minutes: 45, step: 5, contact: true, title: 'The Mexican guns', claimId: 'HIST-TEX-515',
      caption: 'At a quarter past six the Mexican cannon open on the square. With little water, many wounded, and surrounded, Fannin and his officers decide they cannot fight another day.',
      texian: { ...SQUARE, fire: 'picket' },
      mexican: { ...ringed({ fire: 'none' }), count: 1400, drawn: 60 },
      cannon: [{ gun: 'battery-1', at: 0 }, { gun: 'battery-2', at: 4 }, { gun: 'battery-1', at: 11 }, { gun: 'battery-2', at: 16 }, { gun: 'battery-1', at: 24 }, { gun: 'battery-2', at: 31 }, { gun: 'corner-fl', at: 8 }, { gun: 'corner-fr', at: 20 }],
      falls: [{ side: TEX, count: 1, at: 16, claimId: 'HIST-TEX-063', wounded: true }],
      lines: [
        say('k-fuego', 2, MEX, 'officer', 'reconstructed', '¡Fuego!', { gloss: 'Fire!' }),
        say('k-another', 20, TEX, 'volunteer', 'reconstructed', 'We can’t stand another day of this.'),
        say('k-officers', 34, TEX, 'volunteer', 'reconstructed', 'The officers are talking it over.'),
      ],
    },
    {
      // 07:00-09:00. A white flag; the terms (DISPUTED: `HIST-TEX-515`); the arms laid down.
      id: 'surrender', minutes: 120, step: 20, title: 'The surrender', claimId: 'HIST-TEX-515',
      caption: 'A white flag goes up. Fannin’s officers write terms asking that the wounded be cared for and the men held as prisoners of war. Urrea cannot promise that Santa Anna will keep them. The Texians lay down their arms.',
      texian: { ...SQUARE, action: 'surrender', fire: 'none' },
      mexican: { ...ringed({ fire: 'none' }), count: 1400, drawn: 60 },
      flag: { side: TEX, kind: 'white', at: 'corner-fl', claimId: 'HIST-TEX-515' },
      lines: [
        say('k-alto', 4, MEX, 'officer', 'reconstructed', '¡Alto el fuego!', { gloss: 'Cease fire!' }),
        say('k-orleans', 50, TEX, 'volunteer', 'reconstructed', 'They’ll send us to New Orleans. That’s what the terms say.'),
        say('k-arms', 90, MEX, 'officer', 'reconstructed', '¡Dejen las armas!', { gloss: 'Lay down your arms!' }),
      ],
    },
    {
      // 09:00-14:00. The unwounded marched back to Goliad under guard (`HIST-TEX-521`). It ends at two, on the spring's four-hour
      // clock (the period's ticks fall at 2, 6, 10...), so the ticks after the fight fall where they always did: a fight that
      // ended off it moved every later tick of the class, and the army's dated marches in April with them (tests/camp.test.mjs).
      id: 'march-back', minutes: 300, step: 60, title: 'Back to Goliad, prisoners', claimId: 'HIST-TEX-521',
      caption: 'The prisoners are marched back to Goliad under guard and shut in the presidio. The wounded are brought in after them.',
      texian: { style: 'column', from: 'square', to: 'gate', action: 'advance', fire: 'none', face: 'goliad', drawn: 52 },
      mexican: { style: 'column', action: 'follow', fire: 'none', count: 1400, drawn: 24, parts: [
        { id: 'left', style: 'column', from: 'back-left', to: 'gate-left', share: 0.5, face: 'goliad' },
        { id: 'right', style: 'mounted', mounted: true, from: 'back-right', to: 'gate-right', share: 0.5, face: 'goliad' },
      ] },
      lines: [say('k-orleans-2', 60, TEX, 'volunteer', 'reconstructed', 'They say it’s the ships at Copano, and then home.')],
    },
  ],
  ground: coletoGround,
});

/**
 * Where a family's man with Fannin stands in each phase: which part of the force, and his place in it. Kept here beside the
 * data so the director and the renderer agree. Returns `{ part, along, across }` in miles from that part's middle, in the frame
 * whose `along` runs the way the part faces; for the square, `face` is the side of it he stands in.
 */
export function coletoSlot(personId, index, { horton, phase }) {
  let hash = 2166136261;
  for (const character of String(personId)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const a = ((hash >>> 0) % 1000) / 1000, b = ((Math.imul(hash, 2654435761) >>> 0) % 1000) / 1000;
  if (['march-out', 'road', 'caught'].includes(phase)) {
    if (horton) return { part: 'horton', along: -0.02 * a, across: (b - 0.5) * 0.06 };
    // In the column's files, somewhere along it.
    return { part: 'column', along: -0.04 - 0.3 * a, across: ((index % 4) - 1.5) * 0.022 };
  }
  if (phase === 'march-back') return { part: null, along: -0.04 - 0.3 * a, across: ((index % 4) - 1.5) * 0.022 };
  // In the square: a face by who he is, in its front rank, somewhere along it (the renderer's square: sim/../public/battle-view.js).
  const face = ['front', 'left', 'right', 'rear'][Math.floor(a * 4) % 4];
  const t = (b - 0.5) * 0.08, out = 0.09;
  return { part: null, face, ...(face === 'front' ? { along: out, across: t } : face === 'rear' ? { along: -out, across: t } : face === 'left' ? { along: t, across: out } : { along: t, across: -out }) };
}
