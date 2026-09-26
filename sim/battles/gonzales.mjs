// The fight on Ezekiel Williams's land, October 1-2, 1835: the reference engagement on the engine (sim/battle-stage.mjs,
// docs/BATTLES.md §6). Staged from docs/battle-research/gonzales.md §13, whose every time, count and word is sourced there;
// the claims are `HIST-TEX-470` to `-479` and `FIC-GONZ-415` to `-419` in HISTORY.md.
//
// The shape of the night and morning (`HIST-TEX-470`-`-478`, fixed at single times by `FIC-GONZ-415`): the men over the
// river gather at Mrs. DeWitt's on the west bank and hear the Reverend Smith; they march up the river in the fog after
// midnight; about three a dog barks and the Mexican outpost fires, and the dragoons mount and take a rise; the Texians wait
// in the timber until dawn, go out firing, are charged by forty dragoons and fall back to the trees, where the cannon is
// fired; in the lull they take Williams's houses and cornfield; the fog lifts, a parley is sounded and the two commanders
// meet between the lines; then the cannon, the advance at the double, and the dragoons wheel and ride off for Béxar. The
// Texians gather what was left and are home by two.
//
// Nothing here depends on who came (`HIST-GONZ-004`): no family's person changes a count, a place or a minute.
//
// This file imports nothing from the director, so the engine and the clock can read it without a cycle.

/** The ground, read off the map rather than written down: Williams's land and the ford below it (`HIST-GONZ-008`). */
export function gonzalesGround(world) {
  const camp = world.map.sites['williams-camp'], ford = world.map.sites.ford;
  const dx = ford.x - camp.x, dy = ford.y - camp.y, span = Math.hypot(dx, dy) || 1;
  // Downriver, toward the ford and the town; its negative is upriver, the road back to Béxar.
  const toward = { x: dx / span, y: dy / span };
  const at = (from, unit, miles) => ({ x: from.x + unit.x * miles, y: from.y + unit.y * miles });
  // Mrs. DeWitt's on the west bank, where the men formed after crossing (`HIST-TEX-470`): a little above the ford. A map
  // too small to hold it keeps it inside the timber's first mile.
  const rendezvous = at(ford, { x: -toward.x, y: -toward.y }, Math.min(0.45, span * 0.1));
  // Distances from the record where it gives them (`HIST-TEX-471`): the lines 350 to 400 yards apart when the fog cleared,
  // and the Texians firing at about that range at dawn. A mile is 1,760 yards, so a fifth of a mile is 352.
  return {
    camp: { x: camp.x, y: camp.y },
    rendezvous,
    // The edge of the river timber the Texians waited in, and the open ground they went out into at dawn.
    timber: at(camp, toward, 0.3),
    open: at(camp, toward, 0.1),
    // Williams's houses and cornfield, the Mexicans' first ground and the Texians' after the lull.
    cornfield: at(camp, toward, 0.06),
    // The rise the dragoons took after the alarm, behind their camp: 390 yards from the cornfield.
    rise: at(camp, toward, -0.16),
    // How far the dawn charge came out toward the Texians in the open, before it turned back to the rise.
    charge: at(camp, toward, 0.0),
    // The advance at the double after the parley (`HIST-TEX-476`).
    closed: at(camp, toward, -0.04),
    // The dragoons wheeling away, and gone out of sight on the Béxar road (`HIST-TEX-478`).
    wheel: at(camp, toward, -0.5),
    gone: at(camp, toward, -2.4),
    ford: { x: ford.x, y: ford.y },
    toward,
  };
}

const TEX = 'texian', MEX = 'mexican';
/** One line. `name` only ever on a documented line (sim/battle-stage.mjs `checkEngagement`). */
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** What the page writes under the taunt, so nobody reads a later memory as a quotation (`HIST-TEX-469`). */
const TAUNT_GLOSS = 'shouted at the dragoons; remembered later, not written down in 1835';

export const GONZALES = Object.freeze({
  id: 'gonzales',
  name: 'The fight at Gonzales',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): the force over the river on the night of October 1.
  startKey: 'crossing',
  claimId: 'HIST-GONZ-003',
  outcome: 'Mexican detachment withdraws; Texians retain the cannon.',
  // Why somebody with the men can be given no other order until they come back with them (sim/battle-stage.mjs `heldByBattle`).
  held: name => `${name} is with the men facing the Mexican camp, and comes back with them when it is over.`,
  sides: {
    // About 150-170, of whom fifty were mounted (`HIST-TEX-476`). Drawn as a sample of fifty-six; the horsemen are not
    // drawn apart. ceiling: the fifty Texian horsemen on the right are drawn on foot with the rest; a mounted volunteer
    // figure with a firing pose, and a detachment of a side drawn apart from it, are the way out.
    texian: { name: 'Texian volunteers', count: 160, drawn: 56, claimId: 'HIST-TEX-476', spread: { width: 0.46, depth: 0.2 } },
    // About a hundred, all mounted, on the rise "in a triangle", never dismounted in any account (`HIST-TEX-476`). Drawn as
    // a sample of forty-eight horsemen in ranks.
    mexican: { name: 'Castañeda’s dragoons', count: 100, drawn: 48, claimId: 'HIST-TEX-476', mounted: true },
  },
  // The Texians are never drawn falling at Gonzales: no Texian was killed (`HIST-TEX-477`, `FIC-GONZ-005`, `FIC-GONZ-418`).
  noFalling: [TEX],
  // The gun on its pair of cart wheels, in the middle of the Texian line (`HIST-TEX-475`, `-476`). Brass.
  cannon: { side: TEX, offset: { along: 0.03, across: 0.01 }, metal: 'bronze', crew: 3, claimId: 'HIST-TEX-475' },
  // The flag over the gun. Whether it flew on October 2 is disputed and no 1835 account puts it on the field
  // (`HIST-TEX-475`); the owner chose to draw it (2026-09-25: "have the flag be drawn"), recorded as `FIC-GONZ-419`. The
  // women in the town paint it on September 30 and October 1 (sim/town-scenes.mjs), and it goes over the river with the men.
  flag: { side: TEX, kind: 'come-and-take-it', offset: { along: -0.02, across: 0.03 }, words: 'COME AND TAKE IT', claimId: 'FIC-GONZ-419' },
  // The three Spanish words of a volley, documented in the militia regulation of 1822 (`HIST-TEX-479`). Nobody fired a volley
  // at Gonzales by default, so these are said only if a phase gives the Mexican side `fire: 'volley'`.
  commands: {
    volley: [
      { text: '¡Preparen las armas!', gloss: 'Make ready!', kind: 'documented', claimId: 'HIST-TEX-479' },
      { text: '¡Apunten!', gloss: 'Take aim!', kind: 'documented', claimId: 'HIST-TEX-479' },
      { text: '¡Fuego!', gloss: 'Fire!', kind: 'documented', claimId: 'HIST-TEX-479' },
    ],
  },
  phases: [
    {
      // 22:00 Oct 1 - 01:00. The men over the river at Mrs. DeWitt's, the council of war and the Reverend Smith's words in a
      // hollow square (`HIST-TEX-470`). Watched at the farming clock's own step, so it costs a class no time it did not spend.
      id: 'rendezvous', minutes: 180, title: 'Over the river, at Mrs. DeWitt’s', step: 20, claimId: 'HIST-TEX-470',
      caption: 'Over the river, the Texian volunteers gather at Mrs. DeWitt’s on the west bank. There is a council of war, and the Reverend W. P. Smith speaks to them.',
      texian: { style: 'loose', at: 'rendezvous', action: 'stand', fire: 'none', spread: { width: 0.22, depth: 0.14 } },
      mexican: { style: 'mounted', at: 'camp', action: 'stand', fire: 'none' },
      lines: [
        say('g-dry', 40, TEX, 'volunteer', 'reconstructed', 'Keep your powder dry.'),
        say('g-smith-1', 90, TEX, 'speaker', 'documented', 'Let us march silently, obey the commands of our superior officers…', { name: 'W. P. Smith', claimId: 'HIST-TEX-470' }),
        say('g-smith-2', 110, TEX, 'speaker', 'documented', 'We must fight, and we will fight!', { name: 'W. P. Smith', claimId: 'HIST-TEX-470' }),
        say('g-talk', 150, TEX, 'volunteer', 'reconstructed', 'No talking in the ranks.'),
      ],
    },
    {
      // 01:00 - 03:00. Up the river in the fog, in silence: horsemen ahead of the gun, two open files, a rear guard.
      id: 'approach', minutes: 120, title: 'The march up the river', step: 10, claimId: 'HIST-TEX-470',
      caption: 'The Texians march up the west bank in the dark, in silence, with the cannon. A fog has come down on the river.',
      texian: { style: 'column', from: 'rendezvous', to: 'timber', action: 'advance', fire: 'none' },
      mexican: { style: 'mounted', at: 'camp', action: 'stand', fire: 'none' },
      lines: [
        say('g-close', 20, TEX, 'volunteer', 'reconstructed', 'Close up.'),
        say('g-quiet', 70, TEX, 'volunteer', 'reconstructed', 'Quiet!'),
      ],
    },
    {
      // 03:00 - 03:20. A dog barks; the outpost fires; one Texian is hurt in the nose and stays on his feet (`HIST-TEX-472`,
      // `FIC-GONZ-418`); the Mexicans mount and take the rise.
      id: 'contact', minutes: 20, title: 'The outpost fires', step: 5, claimId: 'HIST-TEX-472',
      caption: 'About three in the morning a dog barks. The Mexican outpost fires into the fog, and the dragoons mount and ride up onto a rise behind their camp.',
      texian: { style: 'loose', at: 'timber', action: 'hold', fire: 'none' },
      mexican: { style: 'mounted', from: 'camp', to: 'rise', action: 'advance', fire: 'picket' },
      lines: [
        say('g-quien', 2, MEX, 'sentry', 'reconstructed', '¿Quién vive?', { gloss: 'Who goes there?' }),
        say('g-hold', 6, TEX, 'volunteer', 'reconstructed', 'Hold your fire!'),
        say('g-caballo', 9, MEX, 'officer', 'reconstructed', '¡A caballo!', { gloss: 'To horse!' }),
      ],
    },
    {
      // 03:20 - 05:40. The Texians wait in the edge of the timber; the dragoons wait on the rise, unseen.
      id: 'wait', minutes: 140, title: 'Waiting for daylight', step: 20, claimId: 'HIST-TEX-473',
      caption: 'The Texians wait in the edge of the timber for daylight. The dragoons wait mounted on the rise. Neither side can see the other in the fog.',
      texian: { style: 'loose', at: 'timber', action: 'hold', fire: 'none' },
      mexican: { style: 'mounted', at: 'rise', action: 'stand', fire: 'none' },
      lines: [
        say('g-see', 30, TEX, 'volunteer', 'reconstructed', 'Can’t see a thing.'),
        say('g-far', 90, TEX, 'volunteer', 'reconstructed', 'How far are they?'),
      ],
    },
    {
      // 05:40 - 06:40. Out of the timber firing; forty dragoons charge under Lt. Pérez; back to the trees, and the cannon; one
      // Mexican soldier hit by a carbine ball (`HIST-TEX-473`, `-477`). contact: this is the fighting a family's person must
      // be in the line for (docs/BATTLES.md §2.6).
      id: 'dawn-skirmish', minutes: 60, title: 'First light: the skirmish', step: 5, contact: true, claimId: 'HIST-TEX-473',
      caption: 'At first light the Texians go out of the timber and open fire. Forty dragoons charge them; the Texians fall back to the trees and fire the cannon, and the dragoons go back up onto the rise.',
      texian: { style: 'loose', keys: [[0, 'timber'], [10, 'open'], [24, 'open'], [32, 'timber']], action: 'advance', fire: 'scattered' },
      mexican: { style: 'mounted', keys: [[0, 'rise'], [16, 'rise'], [23, 'charge'], [29, 'charge'], [40, 'rise']], action: 'advance', fire: 'scattered' },
      cannon: [31],
      // ceiling: the whole sample charges, where the record has forty of a hundred go and the rest held back; a detachment
      // drawn apart from its side is the way out when a second engagement needs one.
      falls: [{ side: MEX, count: 1, at: 33, claimId: 'HIST-TEX-477', wounded: true, carried: true }],
      lines: [
        say('g-here', 12, TEX, 'volunteer', 'reconstructed', 'Here they come!'),
        say('g-carga', 18, MEX, 'officer', 'reconstructed', '¡Sable en mano! ¡A la carga!', { gloss: 'Swords out! Charge!' }),
        say('g-trees', 25, TEX, 'volunteer', 'reconstructed', 'Back to the trees!'),
        // The owner, 2026-09-25: "have the men say it as a taunt of sorts." Said by nobody named, and shown as `tradition`: no
        // 1835 document has anybody say it; Mason (1874) and a statement endorsed as Rusk's remember it said (`HIST-TEX-469`,
        // `FIC-GONZ-419`).
        say('g-taunt-1', 37, TEX, 'volunteer', 'tradition', 'Come and take it!', { claimId: 'HIST-TEX-469', gloss: TAUNT_GLOSS }),
      ],
    },
    {
      // 06:40 - 08:00. The fire dies down; the Texians take the house, the cornfield, some horses and baggage, and pull down
      // the fence in front of the gun (`HIST-TEX-473`).
      id: 'lull', minutes: 80, title: 'The lull', step: 20, claimId: 'HIST-TEX-473',
      caption: 'The firing dies away. The Texians take Williams’s houses and cornfield, with some horses and baggage, and pull down the fence in front of the cannon. The dragoons wait mounted on the rise.',
      texian: { style: 'loose', keys: [[0, 'timber'], [40, 'cornfield']], action: 'advance', fire: 'none' },
      mexican: { style: 'mounted', at: 'rise', action: 'stand', fire: 'none' },
      lines: [
        say('g-fence', 45, TEX, 'volunteer', 'reconstructed', 'Pull that fence down.'),
        say('g-horses', 65, TEX, 'volunteer', 'reconstructed', 'Whose horses are these?'),
      ],
    },
    {
      // 08:00 - 08:40. The fog lifts; Smither rides in calling not to shoot; a parley is sounded and the commanders meet
      // midway (`HIST-TEX-474`). Named men say only what the record gives them, in its own words or the nearest paraphrase,
      // and each is labelled with where it comes from.
      id: 'parley', minutes: 40, title: 'The parley', step: 5, claimId: 'HIST-TEX-474',
      caption: 'The fog lifts. A parley is sounded, and Lieutenant Castañeda and Colonel Moore meet between the lines, each with a man beside him.',
      texian: { style: 'loose', at: 'cornfield', action: 'hold', fire: 'none' },
      mexican: { style: 'mounted', at: 'rise', action: 'stand', fire: 'none' },
      parley: { part: 0.5, people: [{ side: TEX, name: 'Moore' }, { side: MEX, name: 'Castañeda', mounted: true }] },
      lines: [
        say('g-smither', 3, TEX, 'rider', 'documented', 'Don’t shoot, don’t shoot!', { name: 'Smither', claimId: 'HIST-TEX-474', gloss: 'Launcelot Smither, riding in (Mason; Rusk)' }),
        say('g-que', 8, MEX, 'dragoon', 'reconstructed', '¿Qué dicen?', { gloss: 'What are they saying?' }),
        say('g-why', 13, MEX, 'commander', 'documented', 'Why are you attacking me?', { name: 'Castañeda', claimId: 'HIST-TEX-474', gloss: 'Castañeda’s own report, in translation' }),
        say('g-federal', 16, TEX, 'commander', 'documented', 'Because you are a Centralist, and we are Federalists.', { claimId: 'HIST-TEX-474', gloss: 'what Castañeda reported he was told' }),
        say('g-constitution', 19, TEX, 'commander', 'documented', 'The cannon is for the defence of the Constitution.', { claimId: 'HIST-TEX-474', gloss: 'Macomb’s account, in paraphrase' }),
        say('g-republican', 23, MEX, 'commander', 'documented', 'I am a republican. I am obliged to obey my orders.', { name: 'Castañeda', claimId: 'HIST-TEX-474', gloss: 'Macomb’s account, in paraphrase' }),
        say('g-instantly', 27, TEX, 'commander', 'documented', 'Join us and keep your rank, or fight instantly.', { name: 'Moore', claimId: 'HIST-TEX-474', gloss: 'Macomb’s account, in paraphrase' }),
        say('g-want', 33, TEX, 'volunteer', 'reconstructed', 'What’s he want?'),
      ],
    },
    {
      // 08:40 - 09:00. The gun fires; the Texians advance at the double with a yell; the dragoons wheel and go; the gun again
      // (`HIST-TEX-475`, `-476`, `-478`). No Mexican volley by default: only Creed Taylor has one.
      id: 'fight', minutes: 20, title: 'The cannon and the advance', step: 2, contact: true, claimId: 'HIST-TEX-476',
      caption: 'The parley ends. The Texians fire the cannon and advance at the double, firing, and the dragoons wheel their horses and ride away.',
      texian: { style: 'loose', keys: [[0, 'cornfield'], [12, 'closed']], action: 'advance', fire: 'scattered' },
      mexican: { style: 'mounted', keys: [[0, 'rise'], [9, 'rise'], [20, 'wheel']], action: 'withdraw', face: 'away', fire: 'none' },
      cannon: [2, 13],
      lines: [
        say('g-fire', 1, TEX, 'volunteer', 'documented', 'Fire!', { claimId: 'HIST-TEX-470', gloss: 'passed along the line (Smith)' }),
        say('g-boys', 5, TEX, 'volunteer', 'reconstructed', 'Come on, boys!'),
        say('g-retirada', 9, MEX, 'officer', 'reconstructed', '¡Media vuelta! ¡Retirada!', { gloss: 'About face! Fall back!' }),
        say('g-taunt-2', 14, TEX, 'volunteer', 'tradition', 'Come and take it!', { claimId: 'HIST-TEX-469', gloss: TAUNT_GLOSS }),
        say('g-taunt-3', 17, TEX, 'volunteer', 'tradition', 'Come back and take it!', { claimId: 'HIST-TEX-469', gloss: TAUNT_GLOSS }),
      ],
    },
    {
      // 09:00 - 09:40. Out of sight on the Béxar road, unpursued (`HIST-TEX-478`).
      id: 'withdrawal', minutes: 40, title: 'The dragoons ride away', step: 20, claimId: 'HIST-GONZ-004',
      caption: 'The dragoons ride off up the road toward Béxar until they are out of sight. They were under orders not to force a fight, and they did not. Nobody goes after them.',
      texian: { style: 'loose', at: 'closed', action: 'hold', fire: 'none' },
      mexican: { style: 'column', from: 'wheel', to: 'gone', action: 'withdraw', face: 'away', fire: 'none' },
      lines: [say('g-gone', 22, TEX, 'volunteer', 'reconstructed', 'They’re gone.')],
    },
    {
      // 09:40 - 11:00. The baggage, a few escopetas, blankets and swords gathered up (`HIST-TEX-478`).
      id: 'field', minutes: 80, title: 'The field is theirs', step: 20, claimId: 'HIST-TEX-478',
      caption: 'The Texians gather up what the dragoons left: some baggage, a few escopetas, blankets and swords. The cannon is still theirs.',
      texian: { style: 'loose', at: 'closed', action: 'hold', fire: 'none' },
      mexican: { style: 'column', at: 'gone', action: 'gone', fire: 'none' },
      lines: [say('g-sword', 30, TEX, 'volunteer', 'reconstructed', 'Look here, a sword.')],
    },
    {
      // 11:00 - 14:00. Home with the gun, over the river, and the town feeds them (`HIST-TEX-478`). Not watched: the clock
      // goes at the class's own pace again.
      id: 'home', minutes: 180, title: 'Home with the cannon', claimId: 'HIST-TEX-478',
      caption: 'The Texians march back down the river to Gonzales with the cannon, and are home by two in the afternoon.',
      texian: { style: 'column', from: 'closed', to: 'ford', action: 'withdraw', face: 'away', fire: 'none' },
      mexican: { style: 'column', at: 'gone', action: 'gone', fire: 'none' },
    },
  ],
  ground: gonzalesGround,
});
