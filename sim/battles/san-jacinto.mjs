// San Jacinto, April 20-23, 1836, on the engine (sim/battle-stage.mjs, docs/BATTLES.md §6). Staged from
// docs/battle-research/staging.md §8, with the owner's choices of 2026-09-25 (docs/BATTLES.md §2b): the killing after the
// rout is drawn as the battles are - figures fall and lie still, no gore - and the other questions (J1, J3, J4) take their
// recommended answers. The claims are `HIST-TEX-522` to `-527` and `FIC-GONZ-441` to `-444` in HISTORY.md.
//
// The shape of the three days (`HIST-TEX-522`-`-526`): on the 20th Santa Anna's army comes up and camps on the plain toward
// the San Jacinto, under a mile from Houston's camp in the timber along Buffalo Bayou, and in the afternoon Sherman's
// horsemen skirmish with its infantry; in the night the Mexicans throw up a breastwork of packs, saddles and baggage; at
// nine on the 21st Cos comes in over Vince's bridge with about 540 men, and Houston sends Deaf Smith to destroy the bridge;
// the afternoon is quiet in the Mexican camp; at half past three Houston parades the army, and at four it walks out across
// the prairie in one long line, screened by a rise; the two six-pounders open within two hundred yards of the breastwork;
// the line fires and runs in shouting "Remember the Alamo!" and "Remember Goliad!"; in eighteen minutes the Mexican army
// breaks and runs for the marsh and Peggy's Lake, where the killing goes on toward dark and the officers cannot stop it;
// at dusk the prisoners are gathered; the next day Santa Anna is found hiding in the grass and brought before Houston, who
// lies wounded. The engagement ends when the word of the victory goes out, on the 23rd.
//
// Here the Texians are the formed side and the Mexicans the unformed one (docs/battle-research/staging.md §8.3): the owner's
// instinct for most fights, reversed, as the record has it. Nothing here depends on who came (`HIST-TEX-067`).
//
// This file imports nothing from the director, so the engine and the clock can read it without a cycle.

/**
 * The ground, read off Lynchburg's place on the map. Lynchburg stands at 29.7690, -95.0740 (`HIST-TEX-084`); the points of
 * the field are placed from the battleground's own ground by longitude and latitude, at the map's own scale there (60.26
 * miles a degree east, 68.88 a degree north, measured from the map's Lynchburg and its monument point). Where each point
 * stands is this game's reading of the record's words (`FIC-GONZ-441`): the Texian camp "in the timber" on Buffalo Bayou
 * (Houston), the Mexican camp on the plain toward the San Jacinto with the marsh and Peggy's Lake behind it, under a mile
 * between them, the guns within two hundred yards of the breastwork (`HIST-TEX-522`).
 * A map without Lynchburg (the invented country) has no San Jacinto: null, and the engine is never armed there.
 * ceiling: the points are read from the record's words, not surveyed, and figures stand on whatever the map has there; a
 * battlefield site from the San Jacinto Battleground's survey is the way out if the owner wants the field exact.
 */
const LYNCHBURG = Object.freeze({ lon: -95.0740, lat: 29.7690 });
const MILES_EAST = 60.26, MILES_NORTH = 68.88;
export function sanJacintoGround(world) {
  const lynchburg = world.map?.sites?.lynchburg;
  if (!lynchburg) return null;
  const at = (lon, lat) => ({ x: lynchburg.x + (lon - LYNCHBURG.lon) * MILES_EAST, y: lynchburg.y - (lat - LYNCHBURG.lat) * MILES_NORTH });
  const camp = at(-95.0860, 29.7545), breastwork = at(-95.0770, 29.7468);
  const dx = breastwork.x - camp.x, dy = breastwork.y - camp.y, span = Math.hypot(dx, dy);
  const toward = { x: dx / span, y: dy / span };
  const from = (point, miles, across = 0) => ({ x: point.x + toward.x * miles - toward.y * across, y: point.y + toward.y * miles + toward.x * across });
  return {
    // Houston's camp in the oak timber along the bayou, and the line formed at the timber's edge.
    texianCamp: camp,
    line: from(camp, 0.1),
    // Where the line halted to let the guns go into action: two hundred yards is 0.114 of a mile (`HIST-TEX-522`).
    close: from(breastwork, -0.16),
    gunStation: from(breastwork, -0.114),
    // The two guns side by side on Burleson's right, a few yards apart; the Mexican gun in the breastwork's opening.
    twinSister1: from(breastwork, -0.114, 0.03),
    twinSister2: from(breastwork, -0.114, 0.06),
    // Hockley commanding the guns and McCulloch serving one of them (the Handbook, `HIST-TEX-558`), a few yards behind each.
    hockleyAt: from(breastwork, -0.13, 0.03),
    mccullochAt: from(breastwork, -0.13, 0.068),
    // The breastwork of packs and baggage at the front of the Mexican camp, and the camp behind it.
    breastwork,
    mexicanCamp: from(breastwork, 0.08),
    // A tent area behind the breastwork for the owner's explicitly traditional Emily West vignette; its exact place is invented.
    picnicTent: from(breastwork, 0.06, -0.04),
    // The Twin Sisters on April 20, in front of the camp in the timber, where they answered the Mexican twelve-pounder and
    // repulsed the infantry's probe of the woods (Houston's report; the Handbook's Neill, `HIST-TEX-565`). The spot is the game's.
    twinsCamp1: from(camp, 0.14, 0.03),
    twinsCamp2: from(camp, 0.14, 0.055),
    // Castrillón on an ammunition crate at the breastwork, and where he had walked to when he was shot (Rusk, as the Handbook
    // gives it, `HIST-TEX-561`). The spots are the game's.
    crate: from(breastwork, 0.012, -0.06),
    castrillonWalk: from(breastwork, 0.05, -0.07),
    // Over the breastwork: where the Texian line was when the Mexican line broke.
    overWork: from(breastwork, 0.07),
    // The marsh behind the camp and Peggy's Lake beyond it, south and east (`HIST-TEX-524`).
    marshEdge: at(-95.0745, 29.7440),
    marsh: at(-95.0722, 29.7422),
    lake: at(-95.0690, 29.7398),
    // Where the prisoners were gathered at dusk: the Mexican camp itself.
    prisonerGround: from(breastwork, 0.05, 0.05),
    // The Mexican army coming up on the 20th, from the road west (reconstructed), and Cos's men in from Vince's bridge on the 21st.
    mexApproach: at(-95.0985, 29.7430),
    cosRoad: at(-95.0965, 29.7418),
    // The April 20 skirmish, on the prairie between the camps (`HIST-TEX-523`).
    skirmish: from(camp, 0.45, -0.05),
    // Deaf Smith's party riding west for Vince's bridge, eight miles off (`HIST-TEX-153`): drawn going out of the frame.
    bridgeRoad: at(-95.1150, 29.7520),
    // Lamar's horsemen on the extreme right of the line (`HIST-TEX-522`): the right of a line facing the Mexican camp.
    cavalryLine: from(camp, 0.1, 0.34),
    cavalryClose: from(breastwork, -0.2, 0.36),
    cavalryChase: at(-95.0725, 29.7462),
    toward,
  };
}

const TEX = 'texian', MEX = 'mexican';
/** One line. A named person (`person`, a roster id) speaks only documented or tradition words (sim/battle-stage.mjs `checkEngagement`). */
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** The same documented cry from several men of the line, a moment apart, so it is heard along it and not from one mouth. */
/** The two in the owner's Yellow Rose picnic, whose figures the legend draws (docs/BATTLES.md §2c.6). */
const LEGEND = Object.freeze(['santa-anna', 'emily-west']);
/**
 * Emily West's words at the picnic (owner, 2026-09-26: "maybe in the chat bubbles where emily is flirting with santa anna it says
 * *sarcasticly* or something like that?"). They are the game's words in a named mouth - the one exception the owner made to the
 * rule that a named person speaks only what a source gives them (`FIC-GONZ-458`) - so each is `tradition`, dashed, with a stage
 * direction (`manner`) that shows she is playing a part with her captor, and a gloss that the story was told later and that his
 * army had taken her five days before. Light and never physical: talk, a meal served. Santa Anna is given no words.
 */
const PICNIC_GLOSS = 'a story told later, not the record; his army had taken her at New Washington five days before';
const picnic = (phase, lines) => lines.map(([at, manner, text], i) => say(`sj-emily-${phase}-${i}`, at, TEX, 'person', 'tradition', text, { person: 'emily-west', manner, claimId: 'HIST-TEX-560', gloss: PICNIC_GLOSS }));
/** Houston and his colonels at the heads of their commands in the line (Houston's report, `HIST-TEX-522`; `FIC-GONZ-452`). */
const LINE_OFFICERS = Object.freeze([
  { id: 'houston', with: 'texian', offset: { along: 0.03, across: 0 }, pose: 'ride' },
  { id: 'rusk', with: 'texian', offset: { along: 0.02, across: 0.03 } },
  { id: 'burleson', with: 'texian', offset: { along: 0.015, across: -0.02 }, pose: 'command' },
  { id: 'sherman', with: 'texian', offset: { along: 0.015, across: -0.19 }, pose: 'command' },
  { id: 'seguin', with: 'texian', offset: { along: 0.005, across: -0.23 }, pose: 'command' },
  { id: 'lamar', with: 'lamar', offset: { along: 0.012, across: 0 }, pose: 'ride' },
]);
const cry = (id, at, text, claimId, source) => [0, 1, 2].map(i => say(`${id}-${i}`, at + i, TEX, 'volunteer', 'documented', text, { claimId, ...(i === 0 && { gloss: source }) }));

export const SAN_JACINTO_BATTLE = Object.freeze({
  id: 'san-jacinto',
  name: 'San Jacinto',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): noon on April 20, the armies meeting.
  startKey: 'san-jacinto-field',
  claimId: 'HIST-TEX-067',
  outcome: 'Santa Anna\'s army destroyed in eighteen minutes; Santa Anna taken the next day.',
  held: name => `${name} is with Houston's army facing Santa Anna's camp, and stays with the army until the word of it goes out.`,
  // The ground the camera frames and the engine draws on (sim/battle-stage.mjs `projectBattle`).
  sides: {
    // 910 engaged (`HIST-TEX-067`). Drawn as a sample of sixty: one figure for about fifteen men.
    // ceiling: the regiments walk as one block (Sherman, Burleson, the regulars not drawn apart) with Lamar's horse as a
    // party; parties per regiment are the way out if a class needs the order of battle drawn.
    texian: { name: 'Houston’s army', count: 910, drawn: 60, claimId: 'HIST-TEX-522', spread: { width: 0.5, depth: 0.14 } },
    // About 700 until Cos came, about 1,200 after (`HIST-TEX-067`). Drawn as a sample of sixty.
    mexican: { name: 'Santa Anna’s army', count: 1200, drawn: 60, claimId: 'HIST-TEX-067', spread: { width: 0.5, depth: 0.3 } },
  },
  // The two six-pounders, the Twin Sisters, on Burleson's right (`HIST-TEX-522`), and the Mexican gun in the opening of the
  // breastwork, each on its own ground (`guns`, dated by `phase.guns`). ceiling: the Twin Sisters are drawn from the moment they
  // take their station within two hundred yards; wheeled forward with the line in the advance they are not drawn - a gun that
  // moves with its side is the way out.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "San Jacinto", item 1 - the Twin Sisters are the library's iron field
  // gun served by the carriage-gun crew; how they were brought forward (by hand or by horse) is not verified and not drawn.
  // The Twin Sisters are named on the field as the famous people are (owner, 2026-09-26, docs/BATTLES.md §2c.5; `HIST-TEX-558`):
  // the name is drawn under the first of the pair. On April 20 they stand in front of the camp (`twins-20-*`).
  guns: [
    { id: 'twins-20-1', person: 'twin-sisters', side: TEX, at: 'twinsCamp1', face: 'breastwork', metal: 'iron', crew: 3, claimId: 'HIST-TEX-565' },
    { id: 'twins-20-2', side: TEX, at: 'twinsCamp2', face: 'breastwork', metal: 'iron', crew: 3, claimId: 'HIST-TEX-565' },
    { id: 'twin-sister-1', person: 'twin-sisters', side: TEX, at: 'twinSister1', face: 'breastwork', metal: 'iron', crew: 3, claimId: 'HIST-TEX-522' },
    { id: 'twin-sister-2', side: TEX, at: 'twinSister2', face: 'breastwork', metal: 'iron', crew: 3, claimId: 'HIST-TEX-522' },
    { id: 'mexican-gun', side: MEX, at: 'breastwork', face: 'close', metal: 'bronze', crew: 3, claimId: 'HIST-TEX-522' },
  ],
  // What stands on the ground: the breastwork from the night of the 20th (`HIST-TEX-522`, `-524`), the fires of both camps,
  // and the marsh and the lake behind the Mexican camp.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "San Jacinto", items 2 and 4 - the breastwork is a line of the
  // library's crates, barrels, sacks and packed belongings; the marsh is its cordgrass, reeds and water ripples.
  works: [
    { id: 'breastwork', kind: 'breastwork', at: 'breastwork', width: 0.3, from: 'night', claimId: 'HIST-TEX-522' },
    { id: 'texian-fires', kind: 'fires', at: 'texianCamp', width: 0.3, until: 'parade', claimId: 'FIC-GONZ-441' },
    { id: 'mexican-fires', kind: 'fires', at: 'mexicanCamp', width: 0.35, from: 'camped', until: 'guns', claimId: 'FIC-GONZ-441' },
    { id: 'marsh', kind: 'marsh', at: 'marsh', width: 0.4, claimId: 'HIST-TEX-524' },
    { id: 'lake', kind: 'water', at: 'lake', width: 0.35, claimId: 'HIST-TEX-524' },
  ],
  // The Mexican officers' words of a volley, from the regulation already read for Gonzales (`HIST-TEX-479`); the Texian
  // officers' own, which no source gives, in plain reconstructed English.
  commands: {
    volley: [
      { text: '¡Preparen las armas!', gloss: 'Make ready!', kind: 'documented', claimId: 'HIST-TEX-479' },
      { text: '¡Apunten!', gloss: 'Take aim!', kind: 'documented', claimId: 'HIST-TEX-479' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'documented', claimId: 'HIST-TEX-479' },
    ],
    bySide: {
      texian: { volley: [{ text: 'Make ready!', kind: 'reconstructed' }, { text: 'Aim low!', kind: 'reconstructed' }, { text: 'Fire!', kind: 'reconstructed' }] },
    },
  },
  phases: [
    {
      // Noon to one, April 20. Santa Anna's army comes up the road and makes its camp on the plain (`HIST-TEX-523`). The hour
      // is this game's (`FIC-GONZ-441`): the record has it there on the 20th.
      id: 'arrive', minutes: 60, step: 20, quiet: true, title: 'Santa Anna’s army comes up', claimId: 'HIST-TEX-523',
      caption: 'April 20. Santa Anna’s army comes up and makes its camp on the open plain toward the San Jacinto River, under a mile from Houston’s camp in the timber along Buffalo Bayou.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'column', from: 'mexApproach', to: 'mexicanCamp', action: 'advance', fire: 'none', count: 700 },
      // Houston in his camp; the Twin Sisters with Neill in front of it (`HIST-TEX-558`, `-565`); Santa Anna riding up with his
      // army, and Emily West, whom his army had taken at New Washington, made to go with it (`HIST-TEX-569`).
      guns: { 'twins-20-1': [], 'twins-20-2': [] },
      people: [
        { id: 'houston', with: 'texian', offset: { along: 0.04, across: -0.02 }, pose: 'command' },
        { id: 'neill', at: 'twinsCamp1', face: 'breastwork', pose: 'command' },
        { id: 'santa-anna', with: 'mexican', offset: { along: 0.03, across: 0.02 }, pose: 'ride' },
        { id: 'emily-west', with: 'mexican', offset: { along: -0.05, across: -0.03 } },
      ],
      lines: [
        // Houston's own "stop that firing", as a man who was there remembered it years later (owner, §2c.4: famous words nobody
        // wrote down at the time are spoken as tradition). The men were firing off their damp loads; Houston wanted no alarm
        // given. The oath in it is left out, marked by the ellipsis. Often retold as "Hold your fire!" (`HIST-TEX-564`).
        say('sj-stop-firing', 4, TEX, 'commander', 'tradition', 'Stop that firing, stop that firing… I say, stop the firing.', { person: 'houston', claimId: 'HIST-TEX-564', gloss: 'told later: as Dr. Nicholas Labadie remembered it, when the men fired off their damp guns; often retold as “Hold your fire!”' }),
        say('sj-there', 20, TEX, 'volunteer', 'reconstructed', 'There they are.'),
        say('sj-many', 50, TEX, 'volunteer', 'reconstructed', 'How many of them, you reckon?'),
      ],
    },
    {
      id: 'camped', minutes: 180, title: 'The two camps', claimId: 'HIST-TEX-523',
      caption: 'The two armies are camped in sight of each other across the prairie. Neither moves. The Twin Sisters, two cannon sent by the people of Cincinnati, stand in front of the Texian camp.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'camp', at: 'mexicanCamp', action: 'stand', fire: 'none', pose: 'rest', count: 700 },
      guns: { 'twins-20-1': [], 'twins-20-2': [] },
      people: [
        { id: 'houston', with: 'texian', offset: { along: 0.04, across: -0.02 }, pose: 'command' },
        { id: 'neill', at: 'twinsCamp1', face: 'breastwork', pose: 'command' },
        { id: 'santa-anna', with: 'mexican', offset: { along: -0.02, across: 0.02 }, pose: 'command' },
        { id: 'emily-west', at: 'picnicTent', pose: 'carry' },
      ],
    },
    {
      // 16:00-17:00. The Mexican twelve-pounder opens on the Texian camp and the infantry probe the woods; the Twin Sisters answer
      // "with grape and canister" and drive them back, and Neill, commanding them, is hit in the hip by a fragment of grapeshot
      // (Houston's report; the Handbook's Neill, `HIST-TEX-565`). Then "Sidney Sherman with a small detachment of cavalry engaged
      // the enemy infantry, almost bringing on a general action. In the clash Olwyns J. Trask was mortally wounded, one other
      // Texan was wounded" (TSHA, `HIST-TEX-523`, `-565`; Houston: "two men severely wounded"), and Lamar, a private, rode in to
      // bring out Rusk and Walter Lane. The hour of each is the game's. (Until 2026-09-26 one Texian was hurt here: `HIST-TEX-083`
      // counted the skirmish alone; the audit's error 5, reconciled in `HIST-TEX-565`.)
      id: 'skirmish', minutes: 60, step: 10, quiet: true, title: 'The skirmish of April 20', claimId: 'HIST-TEX-565',
      caption: 'In the afternoon the Mexican twelve-pounder opens on the Texian camp and its infantry comes up toward the woods. The Twin Sisters answer with grape and canister and drive them back; Colonel Neill, commanding the guns, is wounded in the hip. Then Colonel Sherman takes a party of horsemen out onto the prairie and skirmishes with the Mexican infantry and cavalry. Olwyns Trask is mortally wounded and another man hurt; Mirabeau Lamar, a private, rides in and brings out Rusk and Walter Lane when they are cut off. It almost brings on a general battle, and does not.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'ranks', keys: [[0, 'mexicanCamp'], [15, 'breastwork'], [50, 'breastwork'], [60, 'mexicanCamp']], action: 'hold', fire: 'volley', count: 700 },
      groups: [
        { id: 'sherman', side: TEX, name: 'Sherman’s horsemen', drawn: 6, style: 'mounted', mounted: true, keys: [[0, 'texianCamp'], [22, 'texianCamp'], [32, 'skirmish'], [50, 'skirmish'], [60, 'texianCamp']], action: 'advance', fire: 'scattered', claimId: 'HIST-TEX-523' },
      ],
      guns: { 'mexican-gun': [3, 11], 'twins-20-1': [6, 13], 'twins-20-2': [8, 16] },
      people: [
        { id: 'houston', with: 'texian', offset: { along: 0.04, across: -0.02 }, pose: 'command' },
        { id: 'neill', at: 'twinsCamp1', face: 'breastwork', pose: 'command', during: [0, 30] },
        { id: 'sherman', with: 'sherman', offset: { along: 0.012, across: 0 }, pose: 'ride' },
        { id: 'lamar', with: 'sherman', offset: { along: 0.004, across: 0.012 }, pose: 'ride' },
        { id: 'rusk', with: 'sherman', offset: { along: 0.004, across: -0.012 }, pose: 'ride' },
        { id: 'santa-anna', with: 'mexican', offset: { along: -0.03, across: 0.02 }, pose: 'command' },
      ],
      falls: [
        { side: TEX, unit: 'sherman', count: 1, at: 40, claimId: 'HIST-TEX-565', wounded: true, carried: true },
        { side: TEX, unit: 'sherman', count: 1, at: 43, claimId: 'HIST-TEX-565', wounded: true, carried: true },
      ],
      lines: [
        say('sj-grape', 5, TEX, 'gunner', 'reconstructed', 'Grape! Give them grape!'),
        say('sj-colonel', 13, TEX, 'volunteer', 'reconstructed', 'The colonel’s hit!'),
        say('sj-out', 22, TEX, 'volunteer', 'reconstructed', 'Sherman’s taking the horse out!'),
        say('sj-taunt', 33, TEX, 'rider', 'reconstructed', 'Come out and fight!'),
        say('sj-cobardes', 36, MEX, 'soldier', 'reconstructed', '¡Vengan, pues!', { gloss: 'Come on, then!' }),
        say('sj-back', 54, TEX, 'volunteer', 'reconstructed', 'They’re coming back in.'),
      ],
    },
    {
      // 17:00-09:00. "Throughout the night, Mexican troops worked to fortify their camp, creating breastworks out of
      // everything they could find, including saddles and brush" (Wikipedia, `HIST-TEX-524`).
      id: 'night', minutes: 960, title: 'The night of April 20', claimId: 'HIST-TEX-524',
      guns: { 'mexican-gun': [], 'twins-20-1': [], 'twins-20-2': [] },
      caption: 'Night. In the Mexican camp the soldiers work through the dark throwing up a breastwork of packs, saddles and baggage across the front of the camp.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'camp', at: 'mexicanCamp', action: 'stand', fire: 'none', pose: 'rest', count: 700 },
      people: [{ id: 'houston', with: 'texian', offset: { along: 0.04, across: -0.02 }, pose: 'seated' }, { id: 'emily-west', at: 'picnicTent', pose: 'seated' }],
    },
    {
      // 09:00-11:00, April 21. "About nine o'clock they learned that Martín Perfecto de Cos had crossed Vince's bridge with
      // about 540 troops"; "Houston ordered Erastus (Deaf) Smith to destroy the bridge" (TSHA, `HIST-TEX-523`; the bridge,
      // `HIST-TEX-153`). Cos's men "had marched steadily for more than 24 hours with no rest and no food" and were let sleep
      // (`HIST-TEX-524`).
      id: 'morning', minutes: 120, step: 20, quiet: true, title: 'Cos comes in, and the bridge', claimId: 'HIST-TEX-523',
      guns: { 'mexican-gun': [] },
      caption: 'April 21. About nine, General Cos comes in with about 540 more men, who have marched all night; they lie down to sleep. Houston sends Deaf Smith and a few men to destroy Vince’s bridge, eight miles off on the road the reinforcements came by.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'camp', at: 'mexicanCamp', action: 'stand', fire: 'none', pose: 'rest', count: 1200 },
      groups: [
        { id: 'cos', side: MEX, name: 'Cos’s men', count: 540, drawn: 16, style: 'column', keys: [[0, 'cosRoad'], [60, 'mexicanCamp']], face: 'breastwork', action: 'advance', fire: 'none', claimId: 'HIST-TEX-523' },
        { id: 'deaf-smith', side: TEX, name: 'Deaf Smith’s party', drawn: 3, style: 'mounted', mounted: true, keys: [[60, 'texianCamp'], [120, 'bridgeRoad']], face: 'bridgeRoad', action: 'advance', fire: 'none', claimId: 'HIST-TEX-153' },
      ],
      guns: { 'mexican-gun': [], 'twins-20-1': [], 'twins-20-2': [] },
      // Cos at the head of the men he brings in over Vince's bridge (`HIST-TEX-523`, `-557`), on the parole he gave at Béxar; Deaf
      // Smith at the head of his party riding out to destroy the bridge (`HIST-TEX-153`, `-555`).
      people: [
        { id: 'houston', with: 'texian', offset: { along: 0.04, across: -0.02 }, pose: 'command' },
        { id: 'cos', with: 'cos', offset: { along: 0.01, across: 0 }, pose: 'ride' },
        { id: 'deaf-smith', with: 'deaf-smith', offset: { along: 0.008, across: 0 }, pose: 'ride', during: [60, 120] },
        { id: 'santa-anna', with: 'mexican', offset: { along: -0.03, across: 0.02 }, pose: 'command' },
        { id: 'emily-west', at: 'picnicTent', pose: 'carry' },
      ],
      lines: [
        say('sj-more', 20, TEX, 'volunteer', 'reconstructed', 'More of them coming in.'),
        say('sj-bridge', 70, TEX, 'volunteer', 'reconstructed', 'Where’s Smith going?'),
      ],
    },
    {
      // 11:00-15:30. "All was quiet on the Mexican side during the afternoon siesta" (TSHA): the resting camp is well supported;
      // "siesta" is TSHA's word and the popular one, and is said as that (`HIST-TEX-523`, `-524`).
      id: 'waiting', minutes: 270, title: 'The quiet afternoon', claimId: 'HIST-TEX-524',
      guns: { 'mexican-gun': [] },
      caption: 'The afternoon is quiet in the Mexican camp. Cos’s men are asleep; others rest, eat and see to the horses. The Handbook of Texas calls it the afternoon siesta. A later, disputed story places Emily West and Santa Anna at a picnic near his tent; in that telling, their conversation helps keep him there as the attack approaches. Emily had been taken by his army at New Washington. This scene is tradition, not an established cause of the victory. In the Texian camp the men wait for Houston to decide.',
      legendScene: { id: 'emily-west-picnic', kind: 'tradition', at: 'picnicTent', fromMinute: 120, moment: 'converse', claimId: 'HIST-TEX-560', people: LEGEND },
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'camp', at: 'mexicanCamp', action: 'stand', fire: 'none', pose: 'rest', count: 1200 },
      guns: { 'mexican-gun': [], 'twins-20-1': [], 'twins-20-2': [] },
      // Until the picnic the two are about the Mexican camp: Santa Anna at his headquarters, Emily West made to work in it.
      people: [
        { id: 'houston', with: 'texian', offset: { along: 0.04, across: -0.02 }, pose: 'command' },
        { id: 'santa-anna', with: 'mexican', offset: { along: -0.03, across: 0.02 }, pose: 'command', during: [0, 120] },
        { id: 'emily-west', at: 'picnicTent', pose: 'carry', during: [0, 120] },
      ],
      lines: [
        say('sj-wait', 90, TEX, 'volunteer', 'reconstructed', 'Waiting again.'),
        ...picnic('waiting', [[150, 'sarcastically', 'Another plate, General? A great general must keep up his strength.'], [225, 'dryly', 'Such a quiet afternoon for a war, General.']]),
      ],
    },
    {
      // 15:30-16:00. "At half-past three o'clock in the evening, I ordered the officers of the Texan army to parade their
      // respective commands" (Houston's report, `HIST-TEX-522`).
      id: 'parade', minutes: 30, step: 5, title: 'Half past three: the army parades', claimId: 'HIST-TEX-522',
      legendScene: { id: 'emily-west-picnic', kind: 'tradition', at: 'picnicTent', moment: 'converse', claimId: 'HIST-TEX-560', people: LEGEND },
      guns: { 'mexican-gun': [] },
      caption: 'At half past three Houston orders the army to parade. The companies form in the edge of the timber in one long line: Sherman’s regiment on the left with Seguín’s Tejano company, Burleson’s in the centre, the two cannon under Hockley, the regulars, and Lamar’s sixty-one horsemen on the far right. The cannon are the Twin Sisters, sent by the people of Cincinnati; by a family story told later they were named at Brazoria for the twin daughters of Dr. Charles Rice.',
      texian: { style: 'ranks', keys: [[0, 'texianCamp'], [20, 'line']], action: 'advance', fire: 'none' },
      mexican: { style: 'camp', at: 'mexicanCamp', action: 'stand', fire: 'none', pose: 'rest' },
      groups: [
        { id: 'lamar', side: TEX, name: 'Lamar’s horsemen', count: 61, drawn: 6, style: 'mounted', mounted: true, keys: [[0, 'texianCamp'], [20, 'cavalryLine']], action: 'advance', fire: 'none', claimId: 'HIST-TEX-522' },
      ],
      people: [...LINE_OFFICERS, { id: 'hockley', with: 'texian', offset: { along: 0.02, across: 0.05 }, pose: 'command' }, { id: 'mcculloch', with: 'texian', offset: { along: 0.02, across: 0.075 } }],
      lines: [
        say('sj-fall-in', 3, TEX, 'officer', 'reconstructed', 'Fall in! Fall in!'),
        say('sj-finally', 10, TEX, 'volunteer', 'reconstructed', 'Is he finally going to fight?'),
        say('sj-about-time', 16, TEX, 'volunteer', 'reconstructed', 'About time.'),
        ...picnic('parade', [[8, 'with a forced smile', 'Stay a while, General. Your whole camp is resting.']]),
      ],
    },
    {
      // 16:00-16:24. The line walks out across the prairie, "screened by trees and the rising ground" (TSHA, `HIST-TEX-523`).
      // The tune is a tradition told two ways, named in the caption with both and played by nobody (owner's J3, `HIST-TEX-525`).
      id: 'advance', minutes: 24, step: 2, title: 'The advance across the prairie', claimId: 'HIST-TEX-522',
      legendScene: { id: 'emily-west-picnic', kind: 'tradition', at: 'picnicTent', moment: 'converse', claimId: 'HIST-TEX-560', people: LEGEND },
      guns: { 'mexican-gun': [] },
      caption: 'The line walks out across the open prairie, the rise screening it from the Mexican camp, Houston riding in front of it and the Twin Sisters wheeled along with it. A tune is played as it goes, by tradition "Will You Come to the Bower?" - by a fifer and a drummer, the story goes, or by two fiddlers named Davis; the two traditions disagree.',
      texian: { style: 'ranks', from: 'line', to: 'close', action: 'advance', fire: 'none' },
      mexican: { style: 'camp', at: 'mexicanCamp', action: 'stand', fire: 'none', pose: 'rest' },
      groups: [
        { id: 'lamar', side: TEX, name: 'Lamar’s horsemen', count: 61, drawn: 6, style: 'mounted', mounted: true, from: 'cavalryLine', to: 'cavalryClose', action: 'advance', fire: 'none', claimId: 'HIST-TEX-522' },
      ],
      people: [...LINE_OFFICERS, { id: 'hockley', with: 'texian', offset: { along: 0.02, across: 0.05 }, pose: 'command' }, { id: 'mcculloch', with: 'texian', offset: { along: 0.02, across: 0.075 } }],
      lines: [
        say('sj-hold', 4, TEX, 'officer', 'reconstructed', 'Hold your fire. Keep the line.'),
        say('sj-dress', 12, TEX, 'officer', 'reconstructed', 'Dress on the centre!'),
        say('sj-tejanos', 20, MEX, 'sentry', 'reconstructed', '¡Los tejanos! ¡A las armas!', { gloss: 'The Texians! To arms!' }),
        ...picnic('advance', [[8, 'sarcastically', 'Of course, General. Whatever you say, General.']]),
      ],
    },
    {
      // 16:24-16:30. The Twin Sisters "took station within two hundred yards of the enemy's breastwork" (Houston, `HIST-TEX-522`)
      // and open. contact: the fighting a family's person must be in the line for (docs/BATTLES.md §2.6).
      id: 'guns', minutes: 6, step: 2, contact: true, title: 'The Twin Sisters open', claimId: 'HIST-TEX-522',
      legendScene: { id: 'emily-west-picnic', kind: 'tradition', at: 'picnicTent', moment: 'alarm', claimId: 'HIST-TEX-560', people: LEGEND },
      // What the guns fired: John M. Wade, who served them, remembered homemade grape of screw nuts, scraps of iron and cut bar
      // lead (the Handbook's Twin Sisters, `HIST-TEX-558`); the "broken horseshoes" are a later telling (`HIST-TEX-570`).
      caption: 'The two cannon, the Twin Sisters, under Colonel Hockley, take their station within two hundred yards of the breastwork and open on it with grape. John M. Wade, who served them, remembered loading them with homemade grape of screw nuts, scraps of iron and cut bar lead; later tellers say broken horseshoes. In the Mexican camp men run for their arms. On the Mexican side of the breastwork General Castrillón gets up on an ammunition crate to rally his men.',
      texian: { style: 'ranks', at: 'close', action: 'hold', fire: 'none' },
      // Some Mexican units form in haste behind the breastwork: ranks, ragged, firing as they can (staging §8.3).
      mexican: { style: 'ranks', at: 'mexicanCamp', action: 'hold', fire: 'scattered', ragged: true },
      groups: [
        { id: 'lamar', side: TEX, name: 'Lamar’s horsemen', count: 61, drawn: 6, style: 'mounted', mounted: true, at: 'cavalryClose', action: 'hold', fire: 'none', claimId: 'HIST-TEX-522' },
      ],
      guns: { 'twin-sister-1': [0, 3], 'twin-sister-2': [1, 4], 'mexican-gun': [5] },
      people: [
        ...LINE_OFFICERS,
        { id: 'hockley', at: 'hockleyAt', face: 'breastwork', pose: 'gun' },
        { id: 'mcculloch', at: 'mccullochAt', face: 'breastwork', pose: 'gun' },
        { id: 'castrillon', at: 'crate', face: 'close', pose: 'command', during: [3, 6] },
      ],
      lines: [
        say('sj-formar', 1, MEX, 'officer', 'reconstructed', '¡A formar! ¡A formar!', { gloss: 'Form up! Form up!' }),
        say('sj-armas', 3, MEX, 'soldier', 'reconstructed', '¡Mi fusil! ¿Dónde está mi fusil?', { gloss: 'My musket! Where is my musket?' }),
        ...picnic('guns', [[1, 'quietly', 'Those are cannon, General.']]),
      ],
    },
    {
      // 16:30-16:32. The line fires into the breastwork. The battle's moment on the director's clock (`san-jacinto`).
      id: 'volley', minutes: 2, step: 1, contact: true, title: 'The volley', claimId: 'HIST-TEX-522',
      caption: 'Half past four. The Texian line fires into the breastwork.',
      texian: { style: 'ranks', at: 'close', action: 'hold', fire: 'volley' },
      mexican: { style: 'ranks', at: 'mexicanCamp', action: 'hold', fire: 'scattered', ragged: true },
      groups: [
        { id: 'lamar', side: TEX, name: 'Lamar’s horsemen', count: 61, drawn: 6, style: 'mounted', mounted: true, at: 'cavalryClose', action: 'hold', fire: 'scattered', claimId: 'HIST-TEX-522' },
      ],
      guns: { 'twin-sister-1': [1], 'twin-sister-2': [1], 'mexican-gun': [] },
      people: [
        ...LINE_OFFICERS,
        { id: 'hockley', at: 'hockleyAt', face: 'breastwork', pose: 'gun' },
        { id: 'mcculloch', at: 'mccullochAt', face: 'breastwork', pose: 'gun' },
        { id: 'castrillon', at: 'crate', face: 'close', pose: 'command' },
      ],
      falls: [{ side: MEX, count: 3, at: 1, claimId: 'HIST-TEX-067' }],
    },
    {
      // 16:32-16:38. Over the breastwork with the war-cry: "Remember the Alamo" (Houston's report), "Remember the Alamo!"
      // "Remember Goliad!" (TSHA). The Mexican gun fires once. The Texians lost nine killed or mortally wounded and thirty
      // wounded (TSHA; Houston's report has two and twenty-three, `HIST-TEX-527`): drawn as one down and two hurt of sixty.
      id: 'charge', minutes: 6, step: 1, contact: true, title: '"Remember the Alamo!"', claimId: 'HIST-TEX-522',
      caption: 'The line runs at the breastwork shouting "Remember the Alamo! Remember Goliad!" and goes over it. The Mexican gun fires once. Houston’s horse is shot under him and a musket ball shatters his ankle; he rides on. General Castrillón, on his crate, cannot make his men stand; he turns and walks away from the Texians and is shot. The line comes apart as the men go in, each on his own.',
      texian: { style: 'loose', keys: [[0, 'close'], [3, 'breastwork'], [6, 'overWork']], action: 'advance', fire: 'scattered', spread: { width: 0.5, depth: 0.16 } },
      mexican: { style: 'ranks', at: 'mexicanCamp', action: 'hold', fire: 'scattered', ragged: true },
      groups: [
        { id: 'lamar', side: TEX, name: 'Lamar’s horsemen', count: 61, drawn: 6, style: 'mounted', mounted: true, from: 'cavalryClose', to: 'cavalryChase', action: 'advance', fire: 'scattered', claimId: 'HIST-TEX-522' },
      ],
      guns: { 'twin-sister-1': [], 'twin-sister-2': [], 'mexican-gun': [1] },
      // Houston's horse Saracen shot under him and his ankle shattered by a musket ball; he rides on (`HIST-TEX-564`, the
      // roster's fate at the third minute). Castrillón, "after the panicked soldiers failed to respond, he slowly turned and
      // walked away from the oncoming Texans. He was shot" (Rusk, as the Handbook gives it, `HIST-TEX-561`). No words.
      people: [
        ...LINE_OFFICERS,
        { id: 'castrillon', keys: [[0, 'crate'], [2, 'crate'], [5, 'castrillonWalk']], face: 'mexicanCamp', pose: 'command' },
      ],
      falls: [
        { side: MEX, count: 4, at: 2, claimId: 'HIST-TEX-067' },
        { side: TEX, count: 1, at: 2, claimId: 'HIST-TEX-527', carried: true },
        { side: TEX, count: 2, at: 3, claimId: 'HIST-TEX-527', wounded: true, carried: true },
        { side: MEX, count: 4, at: 4, claimId: 'HIST-TEX-067' },
      ],
      lines: [
        ...cry('sj-alamo', 0, 'Remember the Alamo!', 'HIST-TEX-522', 'the war-cry, in Houston’s report'),
        ...cry('sj-goliad', 2, 'Remember Goliad!', 'HIST-TEX-523', 'with the first, in the Handbook of Texas'),
        say('sj-fuego', 1, MEX, 'officer', 'reconstructed', '¡Fuego! ¡Fuego!', { gloss: 'Fire! Fire!' }),
        say('sj-over', 4, TEX, 'volunteer', 'reconstructed', 'Over! Over the top!'),
      ],
    },
    {
      // 16:38-16:48. "The conflict lasted about eighteen minutes from the time of close action until we were in possession of
      // the enemy's encampment" (Houston, `HIST-TEX-522`). The Mexican army breaks for the marsh; many try to surrender.
      id: 'rout', minutes: 10, step: 1, contact: true, title: 'The Mexican line breaks', claimId: 'HIST-TEX-522',
      guns: { 'twin-sister-1': [], 'twin-sister-2': [] },
      caption: 'The Mexican line breaks. The soldiers run east and south toward the marsh and Peggy’s Lake, many trying to surrender. The Texian line is no longer a line: it is a crowd of men chasing them, and the officers cannot hold it. Eighteen minutes after the fighting began, the camp is taken.',
      texian: { style: 'rout', keys: [[0, 'overWork'], [10, 'marshEdge']], action: 'advance', fire: 'scattered', spread: { width: 0.55, depth: 0.3 } },
      mexican: { style: 'rout', keys: [[0, 'mexicanCamp'], [10, 'marsh']], action: 'withdraw', face: 'away', fire: 'none', surrendering: 0.2 },
      groups: [
        { id: 'lamar', side: TEX, name: 'Lamar’s horsemen', count: 61, drawn: 6, style: 'mounted', mounted: true, from: 'cavalryChase', to: 'marshEdge', action: 'advance', fire: 'scattered', claimId: 'HIST-TEX-522' },
      ],
      people: LINE_OFFICERS,
      falls: [
        { side: MEX, count: 4, at: 2, claimId: 'HIST-TEX-524' },
        { side: MEX, count: 4, at: 5, claimId: 'HIST-TEX-524' },
        { side: MEX, count: 3, at: 8, claimId: 'HIST-TEX-524' },
      ],
      lines: [
        say('sj-rindo', 2, MEX, 'soldier', 'reconstructed', '¡Me rindo! ¡Me rindo!', { gloss: 'I surrender!' }),
        say('sj-me-no-alamo', 4, MEX, 'soldier', 'tradition', 'Me no Alamo!', { claimId: 'HIST-TEX-524', gloss: 'as Texian memoirs remember Mexican soldiers crying it (tradition)' }),
        ...cry('sj-alamo-again', 6, 'Remember the Alamo!', 'HIST-TEX-522', 'the war-cry, in Houston’s report'),
      ],
    },
    {
      // 16:48-18:28. The killing in the marsh and at the lake, drawn as the battles are (owner's J2 decision, docs/BATTLES.md
      // §2b.2): figures fall and lie still, no gore. Texian riflemen on the banks "shot at anything that moved"; Houston and
      // Rusk could not stop it (`HIST-TEX-524`; how long it went on is disputed there).
      id: 'killing', minutes: 100, step: 20, title: 'The killing at the marsh', claimId: 'HIST-TEX-524',
      guns: { 'twin-sister-1': [], 'twin-sister-2': [] },
      caption: 'The killing goes on after the fighting is over. Mexican soldiers who ran into the marsh and toward Peggy’s Lake are shot there by Texians on the banks, many of them trying to surrender. Houston, his ankle shattered by a musket ball, and Rusk try to stop it and cannot.',
      texian: { style: 'loose', at: 'marshEdge', action: 'hold', fire: 'scattered', spread: { width: 0.5, depth: 0.12 } },
      mexican: { style: 'rout', keys: [[0, 'marsh'], [100, 'lake']], action: 'withdraw', face: 'away', fire: 'none', surrendering: 0.35 },
      // Houston, wounded, and Rusk trying to stop it (`HIST-TEX-524`), at the bank.
      people: [{ id: 'houston', with: 'texian', offset: { along: -0.02, across: 0.02 }, pose: 'ride' }, { id: 'rusk', with: 'texian', offset: { along: -0.01, across: 0.05 }, pose: 'stop' }],
      falls: [
        { side: MEX, count: 3, at: 10, claimId: 'HIST-TEX-524' },
        { side: MEX, count: 3, at: 30, claimId: 'HIST-TEX-524' },
        { side: MEX, count: 2, at: 50, claimId: 'HIST-TEX-524' },
        { side: MEX, count: 2, at: 70, claimId: 'HIST-TEX-524' },
      ],
      lines: [
        say('sj-stop', 20, TEX, 'officer', 'reconstructed', 'Stop! They’ve surrendered!'),
        say('sj-piedad', 40, MEX, 'soldier', 'reconstructed', '¡Piedad!', { gloss: 'Mercy!' }),
        say('sj-cease', 60, TEX, 'officer', 'reconstructed', 'Cease firing! Cease firing, I said!'),
      ],
    },
    {
      // 18:28-19:28. Dusk: the prisoners gathered, the camp taken. 630 killed and 730 taken (`HIST-TEX-067`).
      id: 'prisoners', minutes: 60, step: 20, quiet: true, title: 'Dusk: the prisoners', claimId: 'HIST-TEX-067',
      guns: { 'twin-sister-1': [], 'twin-sister-2': [] },
      caption: 'Dusk. The firing stops. Colonel Almonte, Santa Anna’s aide, surrenders the men still with him to Burleson. The prisoners are gathered in the taken camp under guard: some 730 were taken, and about 630 Mexican soldiers were killed. Nine Texians were killed or mortally wounded and about thirty wounded; the wounded are carried back to the camp.',
      texian: { style: 'loose', at: 'mexicanCamp', action: 'hold', fire: 'none', spread: { width: 0.4, depth: 0.2 } },
      mexican: { style: 'loose', at: 'prisonerGround', action: 'hold', fire: 'none', surrendering: 1, spread: { width: 0.22, depth: 0.14 }, count: 730 },
      // Almonte surrenders the men still with him to Burleson at dusk (the Handbook's Burleson and Almonte, `HIST-TEX-568`).
      people: [
        { id: 'almonte', with: 'mexican', offset: { along: 0.03, across: 0 }, pose: 'surrender', during: [0, 20] },
        { id: 'burleson', with: 'mexican', offset: { along: 0.055, across: 0.01 }, pose: 'command', face: 'prisonerGround', during: [0, 20] },
        { id: 'almonte', with: 'mexican', offset: { along: 0.03, across: 0 }, pose: 'offer-sword', during: [20, 40] },
        { id: 'burleson', with: 'mexican', offset: { along: 0.055, across: 0.01 }, pose: 'receive-sword', face: 'prisonerGround', during: [20, 40] },
        { id: 'almonte', with: 'mexican', offset: { along: 0.03, across: 0 }, pose: 'prisoner', during: [40, 60] },
        { id: 'burleson', with: 'mexican', offset: { along: 0.055, across: 0.01 }, pose: 'sword-down', face: 'prisonerGround', during: [40, 60] },
        { id: 'houston', with: 'texian', offset: { along: -0.06, across: 0.03 }, pose: 'wounded' },
      ],
      lines: [say('sj-over-now', 20, TEX, 'volunteer', 'reconstructed', 'It’s over.')],
    },
    {
      // 19:28 April 21 - noon April 22. The night, and the search next morning.
      id: 'search', minutes: 992, title: 'The camp taken', claimId: 'HIST-TEX-523',
      caption: 'The night after the battle. The prisoners are under guard in the taken camp. Houston lies under a tree with his ankle bandaged. In the morning parties ride out over the prairie looking for the men who got away, and for Santa Anna.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'loose', at: 'prisonerGround', action: 'hold', fire: 'none', surrendering: 1, spread: { width: 0.22, depth: 0.14 }, count: 730 },
      people: [{ id: 'houston', with: 'texian', offset: { along: 0, across: 0 }, pose: 'wounded' }],
    },
    {
      // Noon-13:00, April 22. Santa Anna "hiding in the grass. He was dirty and wet and was dressed as a common soldier. The
      // search party did not recognize him until he was addressed as 'el presidente' by other Mexican prisoners" (TSHA,
      // `HIST-TEX-523`); "He was brought before Houston, who had been shot in the ankle and badly wounded" (Wikipedia,
      // `HIST-TEX-526`). The hour is the game's. What the two said is a later telling: "Those who were present at the interview
      // relate the following as the substance of the conversation", W. C. Crane printed in 1884 - Santa Anna's "Napoleon of the
      // West" and Houston's answer - spoken here as tradition (owner, docs/BATTLES.md §2c.4; `HIST-TEX-559`). Almonte interprets.
      id: 'taken', minutes: 60, step: 20, quiet: true, title: 'Santa Anna is brought in', claimId: 'HIST-TEX-526',
      caption: 'April 22. A search party brings in a man it found hiding in the grass, dirty and wet, dressed as a common soldier. As he is brought past the prisoners they call him "el presidente": he is Santa Anna. He is brought before Houston, who lies wounded, and Colonel Almonte interprets. What they said was written down long afterward, from those who were there: a story told later, not the record.',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'loose', at: 'prisonerGround', action: 'hold', fire: 'none', surrendering: 1, spread: { width: 0.22, depth: 0.14 }, count: 730 },
      parley: { at: 'texianCamp', people: [{ side: TEX, id: 'houston', pose: 'injured' }, { side: MEX, id: 'santa-anna' }] },
      people: [{ id: 'almonte', with: 'texian', offset: { along: 0.006, across: 0.012 }, pose: 'interpret', during: [20, 60] }],
      lines: [
        say('sj-napoleon', 32, MEX, 'commander', 'tradition', 'That man may consider himself born to no common destiny who has conquered the Napoleon of the West; and it now remains for him to be generous to the vanquished.', { person: 'santa-anna', claimId: 'HIST-TEX-559', gloss: 'told later: as W. C. Crane printed it in 1884, from those who were there' }),
        say('sj-remember', 40, TEX, 'commander', 'tradition', 'You should have remembered that at the Alamo.', { person: 'houston', claimId: 'HIST-TEX-559', gloss: 'told later: Houston’s answer, as Crane printed it in 1884' }),
        say('sj-presidente-1', 10, MEX, 'prisoner', 'documented', '¡El Presidente!', { claimId: 'HIST-TEX-523', gloss: 'The President! - the prisoners, as the Handbook of Texas tells it' }),
        say('sj-presidente-2', 11, MEX, 'prisoner', 'documented', '¡El Presidente!', { claimId: 'HIST-TEX-523', gloss: 'The President!' }),
        say('sj-is-it', 30, TEX, 'volunteer', 'reconstructed', 'That’s him? That’s Santa Anna?'),
      ],
    },
    {
      // 13:00 April 22 - noon April 23: Santa Anna a prisoner; he wrote to Filisola ordering the troops to retreat to Béxar
      // (Wikipedia, `HIST-TEX-526`). The engagement ends when the word of the victory goes out (`victory-word`).
      id: 'held', minutes: 1380, title: 'Santa Anna a prisoner', claimId: 'HIST-TEX-526',
      caption: 'Santa Anna is a prisoner in Houston’s camp. He writes to General Filisola, now the senior Mexican officer in Texas, ordering the Mexican troops to fall back to Béxar. (Of the Twin Sisters, a story told later says that in 1865 men who had fought for the Confederacy buried them near Harrisburg rather than surrender them; they have never been found.)',
      texian: { style: 'camp', at: 'texianCamp', action: 'stand', fire: 'none', pose: 'rest', spread: { width: 0.4, depth: 0.22 } },
      mexican: { style: 'loose', at: 'prisonerGround', action: 'hold', fire: 'none', surrendering: 1, spread: { width: 0.22, depth: 0.14 }, count: 730 },
      people: [
        { id: 'houston', with: 'texian', offset: { along: 0, across: -0.01 }, pose: 'wounded' },
        { id: 'santa-anna', with: 'texian', offset: { along: 0.008, across: 0.01 }, pose: 'prisoner' },
      ],
    },
  ],
  ground: sanJacintoGround,
});
