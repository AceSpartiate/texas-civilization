// Agua Dulce Creek, the morning of March 2, 1836: Grant's party, driving horses north toward San Patricio, ridden down by
// dragoons who broke out of two groves of trees. On the engine (sim/battle-stage.mjs, docs/BATTLES.md §6) since 2026-09-25,
// staged from docs/battle-research/staging.md §4 (`HIST-TEX-511`, `HIST-TEX-512`, `HIST-TEX-514`; staging `FIC-GONZ-435`).
//
// As the record has it (TSHA *Agua Dulce Creek, Battle of*; Wikipedia *Battle of Agua Dulce*, read 2026-09-25): Grant's
// twenty-six - twenty-three Americans and three Mexicans (TSHA; Wikipedia says about fifty-three) - were coming north with
// several hundred horses; between ten and eleven in the morning dragoons who had taken cover in two groves charged them; the
// men scattered and were ridden down; the Mexicans called that anybody who gave up would be spared; Grant was killed; Reuben
// Brown was lassoed and taken; Plácido Benavides got away to warn Fannin. Six were taken to Matamoros and six escaped, five of
// whom died with Fannin's men at Goliad on March 27 (TSHA). The hour moved from six to half past ten on 2026-09-25 (staging
// S2 note, docs/battle-research/staging.md §11).
//
// No rows on either side (staging.md §4.3): riders strung out behind a loose herd, then a rout; dragoons in the trees, then a
// charge and a chase. The Texians ride (`mounted`); the dragoons are `mounted` in two parts, one to each grove.
//
// Nothing here depends on who came. Imports nothing from the director.
//
// Where: where the road south from San Patricio crosses the map's Agua Dulce Creek, about sixteen road miles out - the owner's
// choice of 2026-09-26, "At the creek crossing, 16 mi" (`HIST-TEX-512`). The Handbook of Texas gives "twenty-six miles below San
// Patricio" (the ground stood there for a day, on the owner's earlier choice) and Wikipedia's point is near Banquete, about ten
// miles out (where the south's build first put it); the account and the charge's caption say all three. The ground is eleven
// and a half miles short of the end of the walked road, where Grant's men wait with the horses, so the party sets out north at
// ten to seven (half past eight while the ground stood at twenty-six miles, half past five near Banquete) and the charge stays
// at half past ten.
//
// ceiling: the drive north from the end of the walked road to the ground is drawn in a straight line between the two, not
//   along the road's own course; the road is within a mile of the line the whole way.
// ceiling: the groves stand where this file puts them, either side of the road short of the ground (`FIC-GONZ-435`); the record
//   says two groves and not where.

/** The ground, read off the map: the Agua Dulce ground on the road, and the end of the walked road south, whence the party came. */
export function aguaDulceGround(world) {
  const sites = world.map.sites, ground = sites['agua-dulce'];
  const camp = sites['matamoros-road'] || { x: ground.x + 1, y: ground.y + 15 };
  const dx = camp.x - ground.x, dy = camp.y - ground.y, span = Math.hypot(dx, dy) || 1;
  // South, down the road toward Matamoros; its negative is north, the way the party was driving.
  const south = { x: dx / span, y: dy / span }, side = { x: -south.y, y: south.x };
  const at = (s, n) => ({ x: ground.x + south.x * s + side.x * n, y: ground.y + south.y * s + side.y * n });
  // How far south of the ground the party is at half past nine: three and a fifth miles where the camp is far enough off (the
  // ground at the creek crossing, or near Banquete in a class that fought there), three quarters of the way out from it where
  // the camp is close (the ground at twenty-six miles, in a class that fought there on 2026-09-26).
  const lead = Math.min(3.2, span * 0.75);
  return {
    camp: { x: camp.x, y: camp.y },
    // Where the party is at half past nine, and where the herd is caught at half past ten.
    'herd-start': at(lead, 0.02), ground: at(0.15, 0),
    // The herd a little ahead of the riders, north.
    'herd-ahead-start': at(lead - 0.18, 0), 'herd-ahead': at(-0.02, 0), 'herd-scatter': at(-0.5, 0.35),
    // The two groves, either side of the road just short of the creek (`FIC-GONZ-435`).
    'grove-east': at(-0.08, 0.32), 'grove-west': at(-0.14, -0.3),
    // Where each body of dragoons comes out to, and where the chase runs.
    'charge-east': at(0.1, 0.08), 'charge-west': at(0.12, -0.07),
    'chase-east': at(0.55, 0.25), 'chase-west': at(0.5, -0.3),
    // The men who got away, north-east for Goliad; those cut down; those who gave up, and where they are held.
    'break-out': at(-0.6, 0.55), 'away': at(-2.2, 1.4),
    'cut': at(0.35, 0.05), 'taken': at(0.05, -0.06),
    toward: { x: -south.x, y: -south.y },
  };
}

const TEX = 'texian', MEX = 'mexican';
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** Grant's men in three strings behind the herd, each the same figures every phase (§6.13): front, middle and the drag. */
const party = (lead, middle, drag, extra = {}) => ({ style: 'loose', fire: 'none', action: 'advance', mounted: true, parts: [
  { id: 'lead', drawn: 6, spread: { width: 0.1, depth: 0.06 }, ...lead },
  { id: 'middle', drawn: 14, spread: { width: 0.16, depth: 0.1 }, ...middle },
  { id: 'drag', drawn: 6, spread: { width: 0.1, depth: 0.06 }, ...drag },
], ...extra });
const dragoons = (east, west, extra = {}) => ({ style: 'mounted', fire: 'none', action: 'stand', parts: [
  { id: 'east-grove', drawn: 24, spread: { width: 0.12, depth: 0.06 }, ...east },
  { id: 'west-grove', drawn: 24, spread: { width: 0.12, depth: 0.06 }, ...west },
], ...extra });

export const AGUA_DULCE = Object.freeze({
  id: 'agua-dulce',
  name: 'Agua Dulce Creek',
  startKey: 'agua-dulce-drive',
  claimId: 'HIST-TEX-511',
  outcome: 'Grant\'s party ridden down by Urrea\'s dragoons: most killed, six taken, six escape.',
  held: name => `${name} is with Grant's party south of the Nueces, and nobody can reach them now.`,
  sides: {
    // Twenty-six (TSHA); Wikipedia's company of about fifty-three is recorded as the dispute (`HIST-TEX-511`). One for one.
    texian: { name: 'Grant’s party', count: 26, drawn: 26, claimId: 'HIST-TEX-511', mounted: true, spread: { width: 0.2, depth: 0.14 } },
    // About eighty dragoons of some hundred and fifty (Wikipedia, medium trust), drawn as forty-eight.
    mexican: { name: 'Urrea’s dragoons', count: 80, drawn: 48, claimId: 'HIST-TEX-511', mounted: true },
  },
  cannon: null,
  flag: null,
  commands: null,
  // The two groves the dragoons hid in. stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "the groves at Agua Dulce" - the
  // library's live oaks and mesquite, a few trees to a grove.
  scenery: ground => [
    { id: 'grove-east', kind: 'grove', ...ground['grove-east'], trees: 7, spread: 0.1 },
    { id: 'grove-west', kind: 'grove', ...ground['grove-west'], trees: 6, spread: 0.09 },
  ],
  phases: [
    {
      // 06:50 - 09:30. North from the end of the walked road with the horses, gathered and set moving: eight and a half miles at
      // the herd's three miles an hour. Watched at twenty minutes a tick while a played family has a man with Grant (§2b.11).
      // (05:30 - 09:30 with the ground near Banquete; 08:30 - 09:30 while it stood at the Handbook's twenty-six miles.)
      id: 'drive', minutes: 160, title: 'Driving the horses north', step: 20, quiet: true, claimId: 'HIST-TEX-511',
      caption: 'South of the Nueces, Dr. James Grant’s party - about two dozen men - is driving several hundred horses north toward San Patricio. They do not know that Urrea has taken San Patricio three days before.',
      texian: party({ keys: [[0, 'camp'], [160, 'herd-start']] }, { keys: [[0, 'camp'], [160, 'herd-start']] }, { keys: [[0, 'camp'], [160, 'herd-start']] }),
      mexican: dragoons({ at: 'grove-east' }, { at: 'grove-west' }),
      herd: { keys: [[0, 'camp'], [160, 'herd-ahead-start']], count: 300 },
      lines: [
        say('ad-keep', 20, TEX, 'volunteer', 'reconstructed', 'Keep them bunched!'),
        say('ad-sp', 120, TEX, 'volunteer', 'reconstructed', 'San Patricio by tonight.'),
      ],
    },
    {
      // 09:30 - 10:30. The last hour, the herd and the strings of riders coming up to the creek; the dragoons in the trees.
      id: 'herd', minutes: 60, title: 'Coming up to Agua Dulce Creek', step: 5, quiet: true, claimId: 'HIST-TEX-511',
      caption: 'The party comes up the road toward Agua Dulce Creek, strung out behind the herd. In two groves of trees ahead, Urrea’s dragoons are waiting, mounted and hidden.',
      texian: party({ keys: [[0, 'herd-start'], [60, 'ground']] }, { keys: [[0, 'herd-start'], [60, 'ground']] }, { keys: [[0, 'herd-start'], [60, 'ground']] }),
      mexican: dragoons({ at: 'grove-east' }, { at: 'grove-west' }),
      herd: { keys: [[0, 'herd-ahead-start'], [60, 'herd-ahead']], count: 300 },
      lines: [
        say('ad-callado', 40, MEX, 'officer', 'reconstructed', '¡Quietos! Todavía no.', { gloss: 'Still! Not yet.' }),
        say('ad-water', 50, TEX, 'volunteer', 'reconstructed', 'Water them at the creek.'),
      ],
    },
    {
      // 10:30 - 10:50. The charge from both groves; the men scatter; the chase. contact.
      id: 'ambush', minutes: 20, title: 'The dragoons come out of the trees', step: 1, contact: true, claimId: 'HIST-TEX-511',
      caption: 'Between ten and eleven the dragoons charge out of both groves. The horses scatter; Grant’s men scatter too, and are ridden down one by one as they run. The Mexicans call that any who give up will be spared. (This telling puts the fight where the road south crosses Agua Dulce Creek, about sixteen miles below San Patricio. The Handbook of Texas says twenty-six miles below San Patricio; another account puts it near Banquete, about ten miles out.)',
      texian: party(
        { keys: [[0, 'ground'], [4, 'break-out'], [20, 'away']], style: 'rout', action: 'withdraw', face: 'away' },
        { keys: [[0, 'ground'], [8, 'cut']], style: 'rout', action: 'withdraw', face: 'away' },
        { keys: [[0, 'ground'], [6, 'taken']], style: 'rout', action: 'withdraw', face: 'away' },
        { style: 'rout', fire: 'picket' }),
      mexican: dragoons(
        { keys: [[0, 'grove-east'], [3, 'charge-east'], [12, 'chase-east']] },
        { keys: [[0, 'grove-west'], [3, 'charge-west'], [12, 'chase-west']] },
        // Carbines and pistols as they ride the men down (RECONSTRUCTED; the lances are held, never shown striking).
        { action: 'advance', fire: 'scattered' }),
      herd: { keys: [[0, 'herd-ahead'], [6, 'herd-scatter']], count: 300, scatter: true },
      falls: [
        { side: TEX, unit: 'middle', count: 3, at: 3, claimId: 'HIST-TEX-511' },
        { side: TEX, unit: 'middle', count: 4, at: 7, claimId: 'HIST-TEX-511' },
        { side: TEX, unit: 'middle', count: 4, at: 11, claimId: 'HIST-TEX-511' },
        { side: TEX, unit: 'middle', count: 3, at: 16, claimId: 'HIST-TEX-511' },
      ],
      lines: [
        say('ad-trees', 0, TEX, 'rider', 'reconstructed', 'Horsemen in the trees!'),
        say('ad-carga', 1, MEX, 'officer', 'reconstructed', '¡A la carga!', { gloss: 'Charge!' }),
        say('ad-ride', 3, TEX, 'volunteer', 'reconstructed', 'Leave the horses - ride!'),
        say('ad-rindanse', 10, MEX, 'officer', 'reconstructed', '¡Ríndanse y se les perdona la vida!', { gloss: 'Surrender, and your lives will be spared! (as they called, in Wikipedia’s account)', claimId: 'HIST-TEX-511' }),
      ],
    },
    {
      // 10:50 - 11:50. Six prisoners held; the dead where they fell; the dragoons gathering the horses. Not held.
      id: 'after', minutes: 60, title: 'Six prisoners', step: 20, quiet: true, claimId: 'HIST-TEX-511',
      caption: 'It is over. Grant is dead, cut down after he was surrounded. Reuben Brown was lassoed from his horse and taken. Six men are prisoners and will be sent to Matamoros; six got away and are riding for Fannin at Goliad. The dragoons gather up the horses.',
      texian: party({ at: 'away', action: 'gone' }, { at: 'cut', action: 'stand' }, { at: 'taken', pose: 'surrender', action: 'stand' }, { style: 'loose', action: 'stand' }),
      mexican: dragoons({ keys: [[0, 'chase-east'], [40, 'herd-scatter']] }, { at: 'taken' }, { action: 'stand' }),
      herd: { at: 'herd-scatter', count: 300 },
      lines: [say('ad-caballos', 20, MEX, 'officer', 'reconstructed', '¡Junten los caballos!', { gloss: 'Round up the horses!' })],
    },
  ],
  ground: aguaDulceGround,
});
