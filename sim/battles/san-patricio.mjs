// San Patricio, the small hours of February 27, 1836: Urrea's cavalry among Johnson's men asleep in the houses of the Irish
// colony on the Nueces. On the engine (sim/battle-stage.mjs, docs/BATTLES.md §6) since 2026-09-25, staged from
// docs/battle-research/staging.md §4 (`HIST-TEX-510`, `HIST-TEX-513`, `HIST-TEX-514`; the staging is `FIC-GONZ-435`).
//
// The night as the record has it (TSHA *San Patricio, Battle of*; Wikipedia *Battle of San Patricio*, read 2026-09-25): a
// "bitterly cold, wet night"; Urrea's column, about four hundred on a forced march, comes up in the dark; officers in civilian
// dress have gone ahead, and local centralists have shown which houses hold Texians and left lanterns in their own windows.
// About three, thirty men under Pretalia fall on the horse guard at a ranch four miles out (told, not drawn: `ceiling:` below)
// while the rest go in among the houses: Captain Pearson and eight men camped on the square, the others in three houses. One
// house gives up at once; another fires back and a Mexican officer is killed; "within fifteen minutes" it is over. Johnson and
// a few men go out a back door and away for Goliad. The prisoners are gathered on the square.
//
// Neither side stood in rows (staging.md §4.3): men asleep in houses and on the square, and horsemen and foot among them in the
// dark. So the Texians are `camp` and houses (`hidden` parts), and the Mexicans a `column` coming in and then `street` at the
// doors. **DISPUTED** and labelled where shown: the date and hour (3 a.m. on the 27th per TSHA, kept; 3:30 on the 26th per
// Wikipedia), the counts, and the prisoners' fate (Matamoros per TSHA, kept; all dead within 72 hours per Wikipedia) -
// `HIST-TEX-510`.
//
// Nothing here depends on who came: no family's person changes a count, a place or a minute. Imports nothing from the director.
//
// ceiling: the horse guard at the ranch four miles out is told in the caption and never drawn, and no family's person is put in
//   it; a second ground for one engagement is the way out.
// ceiling: the houses are three the library draws, set round the square as this file places them (`FIC-GONZ-435`); where
//   Johnson's men actually slept is not in the record read.

/** The ground, read off the map: San Patricio, the way in from the Nueces crossing, and the road out east. */
export function sanPatricioGround(world) {
  const sites = world.map.sites, town = sites['san-patricio'];
  const unit = (from, to, fallback) => {
    if (!from || !to) return fallback;
    const dx = to.x - from.x, dy = to.y - from.y, span = Math.hypot(dx, dy) || 1;
    return { x: dx / span, y: dy / span };
  };
  // Urrea came up from the Nueces crossing (the road from Matamoros); Johnson's men went out the other way, toward Goliad.
  const fromRiver = unit(town, sites['san-patricio-crossing'], { x: -1, y: 0 });
  const east = { x: -fromRiver.x, y: -fromRiver.y }, side = { x: -east.y, y: east.x };
  const at = (e, n) => ({ x: town.x + east.x * e + side.x * n, y: town.y + east.y * e + side.y * n });
  const ground = {
    square: at(0, 0),
    // The three houses round the square that held Texians, and two with a lantern in the window (`FIC-GONZ-435`).
    'house-a': at(0.045, 0.022), 'house-b': at(-0.034, 0.03), 'house-c': at(0.012, -0.042),
    'lamp-1': at(-0.072, -0.028), 'lamp-2': at(0.03, 0.078),
    // Where the prisoners are gathered: the middle of the square, a little off the fire.
    prisoners: at(-0.012, 0.004),
    // Out of Johnson's house by the back and away along the road east (`HIST-TEX-514`).
    'back-door': at(0.04, -0.07), escape: at(0.9, -0.12), gone: at(2.4, -0.3),
    toward: east,
  };
  // The Mexican column in four bodies, coming up from the river, and each body to the door it is sent to.
  ['square', 'a', 'b', 'c'].forEach((body, i) => {
    const across = (i - 1.5) * 0.035;
    ground[`mx-approach-${body}`] = at(-1.4, across);
    ground[`mx-edge-${body}`] = at(-0.2, across);
  });
  ground['mx-square'] = at(-0.05, -0.012);
  ground['mx-a'] = at(0.07, 0.035); ground['mx-b'] = at(-0.055, 0.052); ground['mx-c'] = at(0.006, -0.068);
  return ground;
}

const TEX = 'texian', MEX = 'mexican';
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
/** The Texians, in the parts they were in all night, each the same number of figures in every phase (§6.13). */
const texians = (square, a, b, c, door, extra = {}) => ({ style: 'camp', fire: 'none', action: 'stand', parts: [
  { id: 'square', drawn: 8, spread: { width: 0.03, depth: 0.018 }, ...square },
  { id: 'house-a', drawn: 9, spread: { width: 0.024, depth: 0.016 }, ...a },
  { id: 'house-b', drawn: 9, spread: { width: 0.024, depth: 0.016 }, ...b },
  { id: 'house-c', drawn: 3, spread: { width: 0.02, depth: 0.012 }, ...c },
  { id: 'back-door', drawn: 5, spread: { width: 0.03, depth: 0.03 }, ...door },
], ...extra });
const mexicans = (square, a, b, c, extra = {}) => ({ style: 'street', fire: 'none', action: 'advance', parts: [
  { id: 'at-square', drawn: 20, spread: { width: 0.07, depth: 0.04 }, ...square },
  { id: 'at-a', drawn: 10, spread: { width: 0.04, depth: 0.025 }, ...a },
  { id: 'at-b', drawn: 10, spread: { width: 0.04, depth: 0.025 }, ...b },
  { id: 'at-c', drawn: 8, spread: { width: 0.035, depth: 0.025 }, ...c },
], ...extra });
const asleep = where => ({ at: where, pose: 'asleep' });
const inside = (where, fire = 'none') => ({ at: where, pose: 'hidden', fire });
const handsUp = (from, to, at = 2) => ({ keys: [[0, from], [at, to]], pose: 'surrender', action: 'stand' });

export const SAN_PATRICIO = Object.freeze({
  id: 'san-patricio',
  name: 'San Patricio',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): one in the morning of February 27, 1836.
  startKey: 'san-patricio-night',
  claimId: 'HIST-TEX-510',
  outcome: 'Johnson\'s men surprised in San Patricio: some killed, most taken prisoner, a few escape to Goliad.',
  held: name => `${name} is with Johnson's men at San Patricio, and nobody can reach them now.`,
  light: 'night',
  sides: {
    // Thirty-four (TSHA; "at least seven of them were Mexicans"), drawn one for one.
    texian: { name: 'Johnson’s men', count: 34, drawn: 34, claimId: 'HIST-TEX-510', spread: { width: 0.12, depth: 0.1 } },
    // About four hundred came up; how many went in among the houses is not in the record - about a hundred here
    // (RECONSTRUCTED, `FIC-GONZ-435`), drawn as forty-eight.
    mexican: { name: 'Urrea’s men', count: 100, drawn: 48, claimId: 'HIST-TEX-510', spread: { width: 0.12, depth: 0.08 } },
  },
  cannon: null,
  flag: null,
  commands: null,
  // The houses the Texians slept in, the two the centralists lit (the lanterns, Wikipedia), and the fire on the square.
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "San Patricio by night" - the library's jacal and small cabin for the
  // colony's houses, and a warm glow drawn on the canvas for a lantern in a window.
  scenery: ground => [
    { id: 'house-a', kind: 'house', sprite: 'house-jacal', ...ground['house-a'] },
    { id: 'house-b', kind: 'house', sprite: 'cabin-small', ...ground['house-b'] },
    { id: 'house-c', kind: 'house', sprite: 'house-jacal', ...ground['house-c'] },
    { id: 'lamp-1', kind: 'house', sprite: 'jacal-poor', ...ground['lamp-1'], lit: true },
    { id: 'lamp-2', kind: 'house', sprite: 'cabin-small', ...ground['lamp-2'], lit: true },
    { id: 'fire', kind: 'campfire', sprite: 'campfire', x: ground.square.x + 0.006, y: ground.square.y + 0.008, lit: ['night', 'surprise', 'houses', 'yield', 'gathered', 'after'] },
  ],
  phases: [
    {
      // 01:00 - 03:00. The column comes up in the cold rain; the town sleeps. Watched at twenty minutes a tick so the class
      // can see it come, and so the clock lands on three exactly.
      id: 'night', minutes: 120, title: 'Before three in the morning', step: 20, claimId: 'HIST-TEX-510',
      caption: 'A bitterly cold, wet night at San Patricio on the Nueces. Johnson’s men are asleep - eight on the square by the fire, the rest in three houses. Urrea’s column, about four hundred men on a forced march, comes up in the dark. Local men who side with the government have shown the soldiers which houses to surround, and left lanterns burning in their own windows.',
      texian: texians(asleep('square'), inside('house-a'), inside('house-b'), inside('house-c'), inside('house-c')),
      mexican: mexicans(
        { keys: [[0, 'mx-approach-square'], [110, 'mx-edge-square']], style: 'column' },
        { keys: [[0, 'mx-approach-a'], [110, 'mx-edge-a']], style: 'column' },
        { keys: [[0, 'mx-approach-b'], [110, 'mx-edge-b']], style: 'column' },
        { keys: [[0, 'mx-approach-c'], [110, 'mx-edge-c']], style: 'column' }),
      lines: [
        say('sp-silencio', 70, MEX, 'officer', 'reconstructed', '¡Silencio!', { gloss: 'Silence!' }),
        say('sp-cold', 95, MEX, 'soldier', 'reconstructed', '¡Qué frío!', { gloss: 'It’s so cold!' }),
      ],
    },
    {
      // 03:00 - 03:05. In among the houses: the square first. contact: the fight a family's person is in.
      id: 'surprise', minutes: 5, title: 'Three in the morning: the soldiers are in the square', step: 1, contact: true, claimId: 'HIST-TEX-510',
      caption: 'About three in the morning Urrea’s men are in the town. They go straight to the square, where Captain Pearson and eight men are asleep by the fire, and to the doors of the three houses. (Some accounts put it half an hour later, on the 26th.)',
      texian: texians({ at: 'square', style: 'loose', fire: 'scattered', pose: 'stand' }, inside('house-a'), inside('house-b', 'scattered'), inside('house-c'), inside('house-c')),
      mexican: mexicans(
        { keys: [[0, 'mx-edge-square'], [2, 'mx-square']], fire: 'scattered' },
        { keys: [[0, 'mx-edge-a'], [2, 'mx-a']] },
        { keys: [[0, 'mx-edge-b'], [2, 'mx-b']], fire: 'scattered' },
        { keys: [[0, 'mx-edge-c'], [3, 'mx-c']], fire: 'picket' }),
      falls: [{ side: TEX, unit: 'square', count: 3, at: 2, claimId: 'HIST-TEX-510' }],
      lines: [
        say('sp-quien', 0, MEX, 'sentry', 'reconstructed', '¿Quién vive?', { gloss: 'Who goes there?' }),
        say('sp-square', 1, TEX, 'volunteer', 'reconstructed', 'They’re in the square!'),
        say('sp-rindanse', 3, MEX, 'officer', 'reconstructed', '¡Ríndanse!', { gloss: 'Surrender!' }),
      ],
    },
    {
      // 03:05 - 03:10. One house gives up at once; another fights, and a Mexican officer is killed at its door; Johnson and a
      // few go out the back of theirs.
      id: 'houses', minutes: 5, title: 'The houses', step: 1, contact: true, claimId: 'HIST-TEX-510',
      caption: 'The men in one house give up at once. From another the Texians fire back, and a Mexican officer is killed at the door. Out of the back of a third, Colonel Johnson and a few others slip away into the dark.',
      texian: texians(handsUp('square', 'prisoners', 2), handsUp('house-a', 'prisoners', 3), inside('house-b', 'scattered'), inside('house-c'),
        { keys: [[0, 'house-c'], [1, 'back-door'], [5, 'escape']], style: 'rout', pose: 'stand', action: 'withdraw', face: 'away' }),
      mexican: mexicans({ at: 'mx-square', fire: 'none', action: 'stand' }, { at: 'mx-a', action: 'stand' }, { at: 'mx-b', fire: 'scattered', action: 'stand' }, { at: 'mx-c', fire: 'picket', action: 'stand' }),
      falls: [
        { side: MEX, unit: 'at-b', count: 1, at: 2, claimId: 'HIST-TEX-510' },
        { side: TEX, unit: 'house-b', count: 3, at: 4, claimId: 'HIST-TEX-510' },
      ],
      lines: [
        say('sp-back', 1, TEX, 'volunteer', 'reconstructed', 'Out the back!'),
        say('sp-fuego', 2, MEX, 'officer', 'reconstructed', '¡Fuego a la puerta!', { gloss: 'Fire at the door!' }),
      ],
    },
    {
      // 03:10 - 03:15. The last house gives up: "within fifteen minutes" it is over (Wikipedia).
      id: 'yield', minutes: 5, title: 'It is over in a quarter of an hour', step: 1, contact: true, claimId: 'HIST-TEX-510',
      caption: 'The last of the houses gives up. Within a quarter of an hour of the first shot it is over. Those who got out the back are away in the dark on the road to Goliad.',
      texian: texians({ at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, handsUp('house-b', 'prisoners', 3), handsUp('house-c', 'prisoners', 3),
        { keys: [[0, 'escape'], [5, 'gone']], style: 'rout', pose: 'stand', action: 'withdraw', face: 'away' }),
      // Firing on at the last house until it gives up, and after the men going out the back (RECONSTRUCTED, `FIC-GONZ-435`).
      mexican: mexicans({ at: 'mx-square', action: 'stand' }, { at: 'mx-a', action: 'stand' }, { at: 'mx-b', action: 'stand', fire: 'scattered' }, { at: 'mx-c', action: 'stand', fire: 'scattered' }),
      falls: [{ side: TEX, unit: 'house-c', count: 1, at: 1, claimId: 'HIST-TEX-510' }, { side: TEX, unit: 'square', count: 1, at: 2, claimId: 'HIST-TEX-510' }],
      lines: [
        say('sp-arriba', 1, MEX, 'soldier', 'reconstructed', '¡Manos arriba!', { gloss: 'Hands up!' }),
        say('sp-done', 4, TEX, 'volunteer', 'reconstructed', 'It’s no use, boys.'),
      ],
    },
    {
      // 03:15 - 03:35. The prisoners gathered into the square under guard, the escaped gone into the dark. Watched at two minutes
      // a tick, so the class sees who is left and where, before the clock goes on.
      id: 'gathered', minutes: 20, title: 'The prisoners are gathered', step: 2, claimId: 'HIST-TEX-510',
      caption: 'The Texians who gave up are gathered on the square under guard, hands up. The men killed lie where they fell. Of those who went out the back, nothing more is seen.',
      texian: texians({ at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, { at: 'gone', action: 'gone' }),
      mexican: mexicans({ keys: [[0, 'mx-square'], [10, 'prisoners']], action: 'advance' }, { at: 'mx-a', action: 'stand' }, { at: 'mx-b', action: 'stand' }, { at: 'mx-c', action: 'stand' }),
      lines: [say('sp-cuantos', 6, MEX, 'officer', 'reconstructed', '¿Cuántos son?', { gloss: 'How many are there?' })],
    },
    {
      // 03:35 - 04:15. The prisoners under guard on the square; the dead where they fell. Not held.
      id: 'after', minutes: 40, title: 'Prisoners on the square', step: 20, claimId: 'HIST-TEX-510',
      caption: 'The prisoners are kept under guard on the square. They will be marched south toward Matamoros. (One account says none of them lived three days; the Handbook of Texas says they were taken to Matamoros.)',
      texian: texians({ at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, { at: 'prisoners', pose: 'surrender' }, { at: 'gone', action: 'gone' }),
      mexican: mexicans({ at: 'prisoners', action: 'stand' }, { at: 'mx-a', action: 'stand' }, { at: 'mx-b', action: 'stand' }, { at: 'mx-c', action: 'stand' }),
      lines: [say('sp-guard', 20, MEX, 'officer', 'reconstructed', '¡Vigílenlos!', { gloss: 'Watch them!' })],
    },
  ],
  ground: sanPatricioGround,
});
