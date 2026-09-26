// The Goliad massacre, Palm Sunday, March 27, 1836. On the engine (sim/battle-stage.mjs, docs/BATTLES.md §6), staged from
// docs/battle-research/staging.md §7. Claims: `HIST-TEX-517` (how the prisoners were killed), `-518` (who lived), `-519`
// (Fannin's last requests, tradition, told and not shown), `-520` ("Remember Goliad!"), `FIC-GONZ-438` (as staged).
//
// **This is not a battle.** It is the killing of about 342 prisoners who had surrendered, and of Fannin and about forty
// wounded inside the presidio. The owner decided (docs/BATTLES.md §2b.2, 2026-09-25) that the worst killing is shown as the
// battles are: figures fall and lie still - no blood, no gore, no graphic bodies - and the escapes, those spared and the facts
// are told plainly afterwards. So the prisoners are seen formed in the parade ground at sunrise and marched out on three
// roads, the guards' fire is seen and the prisoners fall, men break for the river timber and a few get away, and inside the
// walls the wounded fall; the burning of the bodies is told, never drawn.
//
// Restraint, chosen here (`FIC-GONZ-438`): nothing is said at the killing - no order is put in anybody's mouth and no volley
// has its words - and the captions say what happened in plain words a middle-school class can read. The camera frames the
// presidio and its three roads, never closer than the battles are framed.
//
// This file imports nothing from the director, so the engine and the clock can read it without a cycle.
import { coloniesMap } from '../colonies-map.mjs';

/** The San Antonio River nearest a point, from the colonies map's drawn water; kept per point, since it never moves. */
const riverKept = new Map();
function riverNear(point) {
  const key = `${point.x},${point.y}`;
  if (riverKept.has(key)) return riverKept.get(key);
  let best = null;
  try {
    for (const course of coloniesMap().watercourses) {
      if (course.name !== 'San Antonio River') continue;
      for (const p of course.points) { const d = Math.hypot(p.x - point.x, p.y - point.y); if (!best || d < best.d) best = { d, x: p.x, y: p.y }; }
    }
  } catch { /* no colonies map on this machine: the fallback below */ }
  // ceiling: a map with no San Antonio River near Goliad puts it a fifth of a mile north of the presidio, where it runs.
  const found = best && best.d < 2 ? { x: best.x, y: best.y } : { x: point.x, y: point.y - 0.2 };
  riverKept.set(key, found);
  return found;
}

/**
 * The presidio La Bahía (the map's `goliad`), its gate, and the three roads the prisoners were marched out on: the Béxar road
 * by the upper ford, the Victoria road by the lower ford, and the San Patricio road (`HIST-TEX-517`). Each halted "from half
 * to three-fourths of a mile from the presidio"; here, six-tenths.
 */
export function massacreGround(world) {
  const sites = world.map.sites, P = { x: sites.goliad.x, y: sites.goliad.y };
  const unit = (to, fallback) => { if (!to) return fallback; const dx = to.x - P.x, dy = to.y - P.y, span = Math.hypot(dx, dy) || 1; return { x: dx / span, y: dy / span }; };
  // ceiling: the three roads leave in the direction of the places they go to; their first half-mile's own courses are not known.
  const roads = {
    bexar: unit(sites.bexar, { x: -0.78, y: -0.62 }),
    victoria: unit(sites.coleto || sites.victoria, { x: 0.96, y: -0.29 }),
    patricio: unit(sites['san-patricio'], { x: -0.6, y: 0.8 }),
  };
  const at = (from, dir, miles, side = 0) => ({ x: from.x + dir.x * miles - dir.y * side, y: from.y + dir.y * miles + dir.x * side });
  const ground = {
    presidio: P,
    // Inside the walls: the parade ground where they were formed, the chapel where the spared were kept, the rooms of the wounded.
    parade: at(P, { x: 1, y: 0 }, 0.0, 0.02), chapel: at(P, { x: 1, y: 0 }, -0.06, 0.04), wounded: at(P, { x: 1, y: 0 }, 0.05, -0.03),
    // Francita Alavez brings men out by a side door into a house of the town the evening before (`HIST-TEX-518`).
    'side-door': at(P, { x: 1, y: 0 }, 0.07, 0.07), house: at(P, { x: 1, y: 0 }, 0.26, 0.16),
    // The Mexican guard, formed at the gate.
    gate: at(P, { x: 0, y: 1 }, 0.1),
    toward: roads.victoria,
  };
  for (const [id, dir] of Object.entries(roads)) {
    ground[`out-${id}`] = at(P, dir, 0.12);
    ground[`halt-${id}`] = at(P, dir, 0.6);
    // On along the road beyond the halt: the way a column faces as it marches.
    ground[`far-${id}`] = at(P, dir, 1.5);
    // The guard in files either side of each column (`HIST-TEX-517`).
    ground[`guard-out-${id}`] = at(P, dir, 0.12, 0.05);
    ground[`guard-${id}`] = at(P, dir, 0.6, 0.07);
    // Where the few who got away from each column ran: the river timber nearest its halting place.
    ground[`river-${id}`] = riverNear(ground[`halt-${id}`]);
    ground[`chase-${id}`] = at(ground[`halt-${id}`], { x: (ground[`river-${id}`].x - ground[`halt-${id}`].x), y: (ground[`river-${id}`].y - ground[`halt-${id}`].y) }, 0.45);
  }
  return ground;
}

const TEX = 'texian', MEX = 'mexican';
const say = (id, at, side, role, kind, text, extra = {}) => ({ id, at, side, role, kind, text, ...extra });
const ROADS = ['bexar', 'victoria', 'patricio'];
/** The prisoners in the parade ground, before the columns are formed. */
const INSIDE = { style: 'loose', at: 'parade', action: 'stand', fire: 'none', spread: { width: 0.16, depth: 0.1 } };
/**
 * The prisoners in three columns, those kept back in the chapel and the wounded in their rooms, by where each column stands in
 * the phase; and, once the firing starts, the few who ran. The kept, the wounded and the runners are the same share of the
 * sample in every phase, so the three columns are laid out alike from the muster to the end.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "Coleto and Goliad", item 2 - the prisoners, who had no arms, are drawn
 * in the militia's walk and stand, which carry muskets, until an unarmed prisoner's walk and stand are drawn.
 */
const columns = (place, { action = 'stand', runners = null } = {}) => {
  const rest = (1 - 0.06 - 0.07 - 0.06) / 3;
  return {
    style: 'column', action, fire: 'none',
    parts: [
      ...ROADS.map(id => ({ id, style: 'column', ...place(id), share: rest, face: `far-${id}` })),
      { id: 'kept', style: 'loose', at: 'chapel', action: 'stand', share: 0.06, spread: { width: 0.05, depth: 0.03 } },
      { id: 'wounded', style: 'loose', at: 'wounded', action: 'stand', share: 0.07, spread: { width: 0.06, depth: 0.03 } },
      { id: 'runners', style: 'rout', ...(runners || { at: 'out-victoria', action: 'gone' }), share: 0.06, spread: { width: 0.1, depth: 0.06 } },
    ],
  };
};
/** The guard: a file beside each column, facing along the road on the march and turned on the column at the halt. */
const guards = (place, { fire = 'none', action = 'stand', face = 'far', riders = null } = {}) => {
  const rest = (1 - 0.04 - 0.06) / 3;
  return {
    style: 'column', action, fire,
    parts: [
      ...ROADS.map(id => ({ id, style: fire === 'none' ? 'column' : 'ranks', ...place(id), share: rest, face: `${face}-${id}` })),
      { id: 'gate', style: 'ranks', at: 'gate', action: action === 'gone' ? 'gone' : 'stand', fire: 'none', share: 0.04 },
      { id: 'riders', style: 'mounted', mounted: true, fire: 'none', ...(riders || { at: 'gate', action: 'gone' }), share: 0.06 },
    ],
  };
};

export const GOLIAD_MASSACRE = Object.freeze({
  id: 'goliad-massacre',
  name: 'Goliad, Palm Sunday',
  // The director's moment this starts at (sim/directors.mjs `TIMELINE`): six in the evening of March 26, 1836.
  startKey: 'goliad-eve',
  claimId: 'HIST-TEX-517',
  outcome: 'About 342 prisoners shot on the three roads and Fannin and about forty wounded killed in the presidio; 28 escape; about 20 are spared.',
  held: name => `${name} is a prisoner in the presidio at Goliad.`,
  sides: {
    // About 430 prisoners (`HIST-TEX-064`), drawn as a sample of sixty.
    texian: { name: 'The prisoners', count: 430, drawn: 60, claimId: 'HIST-TEX-064', spread: { width: 0.16, depth: 0.1 } },
    // The guard: the record gives no count, and none is shown (`uncounted`).
    mexican: { name: 'The guard', count: 1, uncounted: true, drawn: 40, claimId: 'HIST-TEX-517' },
  },
  flag: null,
  // Nothing is said at the killing (`FIC-GONZ-438`): no volley here has its words.
  commands: {},
  phases: [
    {
      // 18:00-19:00, March 26. The song over the walls; Francita Alavez brings some of the men out and hides them.
      id: 'eve', minutes: 60, step: 20, light: 'dusk', title: 'The evening before', claimId: 'HIST-TEX-517',
      caption: 'Evening, March 26, at the presidio of Goliad. Colonel Portilla, commanding here, has received Santa Anna’s order about the prisoners. The prisoners have been told they will be sent to New Orleans. Francita Alavez, the wife of a Mexican officer, goes into the fort, brings some of the men out, and hides them.',
      texian: { style: 'loose', action: 'stand', fire: 'none', parts: [
        { id: 'prisoners', style: 'loose', at: 'parade', share: 0.95, spread: { width: 0.16, depth: 0.1 } },
        { id: 'hidden', style: 'loose', keys: [[0, 'side-door'], [15, 'side-door'], [45, 'house']], share: 0.05, spread: { width: 0.04, depth: 0.02 } },
      ] },
      mexican: { style: 'ranks', action: 'stand', fire: 'none', parts: [
        { id: 'gate', style: 'ranks', at: 'gate', share: 0.97 },
        // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 "Coleto and Goliad", item 3 - Francita Alavez is drawn as the
        // first cast's woman (`rust-woman-walk`, `-idle`), until a figure of a Mexican officer's wife of 1836 is drawn.
        { id: 'alavez', style: 'loose', keys: [[0, 'side-door'], [15, 'side-door'], [45, 'house']], share: 0.03, figure: 'rust-woman', name: 'Francita Alavez', spread: { width: 0.02, depth: 0.02 } },
      ] },
      lines: [
        say('m-song', 20, TEX, 'prisoners', 'documented', '(singing “Home, Sweet Home”)', { claimId: 'HIST-TEX-517', gloss: 'The prisoners are singing “Home, Sweet Home.”' }),
        say('m-orleans', 40, TEX, 'prisoner', 'reconstructed', 'New Orleans, and then home.'),
      ],
    },
    {
      id: 'night', minutes: 480, step: 240, light: 'night', title: 'The night before Palm Sunday', claimId: 'HIST-TEX-517',
      caption: 'The night before Palm Sunday. The prisoners are shut in the presidio.',
      texian: { ...INSIDE }, mexican: { style: 'ranks', at: 'gate', action: 'stand', fire: 'none' },
    },
    {
      id: 'before-dawn', minutes: 180, step: 60, light: 'dawn', title: 'Before sunrise', claimId: 'HIST-TEX-517',
      caption: 'Before sunrise the guard is turned out.',
      texian: { ...INSIDE }, mexican: { style: 'ranks', at: 'gate', action: 'stand', fire: 'none' },
    },
    {
      // 06:00-06:30. The muster: three groups formed; the doctors and the men to be spared kept back (`HIST-TEX-517`, `-518`).
      id: 'muster', minutes: 30, step: 5, title: 'The muster, Palm Sunday', claimId: 'HIST-TEX-517',
      caption: 'Sunrise, Palm Sunday, March 27. The prisoners who can walk are formed into three groups in the parade ground. They are told different things: that they will gather wood, drive cattle, or march to the ships at Copano. The doctors and some men with useful trades are kept back.',
      texian: columns(id => ({ at: `out-${id}` })),
      mexican: guards(id => ({ at: `guard-out-${id}` })),
      lines: [
        say('m-copano', 8, TEX, 'prisoner', 'reconstructed', 'They say we’re going to Copano for the ships.'),
        say('m-wood', 16, TEX, 'prisoner', 'reconstructed', 'Wood-cutting, they told us.'),
      ],
    },
    {
      // 06:30-07:00. Out of the gate on three roads, under guard.
      id: 'marched', minutes: 30, step: 5, title: 'Marched out on three roads', claimId: 'HIST-TEX-517',
      caption: 'The three groups are marched out of the presidio under guard, each on a different road: the road to Béxar, the road to Victoria, and the road to San Patricio.',
      texian: columns(id => ({ from: `out-${id}`, to: `halt-${id}` }), { action: 'advance' }),
      mexican: guards(id => ({ from: `guard-out-${id}`, to: `guard-${id}` }), { action: 'follow' }),
      lines: [say('m-where', 20, TEX, 'prisoner', 'reconstructed', 'This isn’t the way to Copano.')],
    },
    {
      // 07:00-07:20. At the halting places the guards fire (`HIST-TEX-517`); men break for the river timber (`HIST-TEX-518`).
      // contact: what a family's man with the prisoners is there for (docs/BATTLES.md §2.6). Nothing is said.
      id: 'volleys', minutes: 20, step: 2, contact: true, title: 'The killing on the roads', claimId: 'HIST-TEX-517',
      caption: 'Half a mile or more from the presidio, each group is halted, and the guards open fire on the prisoners at close range. Most of the men are killed. A few break away and run for the trees along the river.',
      texian: columns(id => ({ at: `halt-${id}` }), { action: 'stand', runners: { keys: [[0, 'halt-victoria'], [4, 'halt-victoria'], [20, 'chase-victoria']] } }),
      mexican: guards(id => ({ at: `guard-${id}` }), { fire: 'volley', face: 'halt', riders: { keys: [[0, 'gate'], [8, 'gate'], [20, 'halt-victoria']] } }),
      falls: [
        ...ROADS.flatMap(id => [
          { side: TEX, part: id, count: 9, at: 1, claimId: 'HIST-TEX-517' },
          { side: TEX, part: id, count: 5, at: 3, claimId: 'HIST-TEX-517' },
          { side: TEX, part: id, count: 3, at: 7, claimId: 'HIST-TEX-517' },
        ]),
      ],
    },
    {
      // 07:20-07:40. Twenty-eight get away; riders go after them a little way and turn back (`HIST-TEX-518`).
      id: 'escapes', minutes: 20, step: 5, title: 'Into the river timber', claimId: 'HIST-TEX-518',
      caption: 'Some of the men who ran reach the trees along the San Antonio River. Riders go after them, and turn back. Twenty-eight men escape that morning, some by lying still among the dead until they could run.',
      texian: columns(id => ({ at: `halt-${id}` }), { runners: { from: 'chase-victoria', to: 'river-victoria' } }),
      mexican: guards(id => ({ at: `guard-${id}` }), { face: 'halt', riders: { keys: [[0, 'halt-victoria'], [8, 'chase-victoria'], [20, 'gate']] } }),
    },
    {
      // 07:40-08:00. Inside the presidio Fannin and the wounded are killed under Capt. Carolino Huerta (`HIST-TEX-517`).
      id: 'inside', minutes: 20, step: 5, title: 'Inside the presidio', claimId: 'HIST-TEX-517',
      caption: 'Inside the presidio, the wounded who could not march are killed, under the orders of Captain Carolino Huerta. Colonel Fannin, wounded at Coleto, is shot in the courtyard. The doctors and the men kept back are spared.',
      texian: columns(id => ({ at: `halt-${id}` }), { runners: { at: 'river-victoria', action: 'gone' } }),
      mexican: guards(id => ({ at: `guard-${id}` }), { face: 'halt' }),
      falls: [{ side: TEX, part: 'wounded', count: 60, at: 6, claimId: 'HIST-TEX-517' }],
    },
    {
      // 08:00-09:00. What was done with the dead is told, not drawn (`HIST-TEX-517`).
      id: 'after', minutes: 60, step: 20, title: 'Afterward', claimId: 'HIST-TEX-517',
      caption: 'About 340 men were killed at Goliad that morning. Their bodies were burned and left in the open until June 3, when General Rusk’s men gathered the remains and buried them with military honors. The killing turned grief into anger: at San Jacinto the Texians would shout “Remember Goliad!”',
      texian: columns(id => ({ at: `halt-${id}` }), { runners: { at: 'river-victoria', action: 'gone' } }),
      mexican: guards(() => ({ at: 'gate' }), { action: 'gone' }),
    },
  ],
  ground: massacreGround,
});

/**
 * The shares a family's man with the prisoners meets on Palm Sunday, from the record (`HIST-TEX-064`, `-518`): of about 430,
 * some 342 shot on the roads and about 40 wounded killed inside (89 in 100), 28 escaped (6.5 in 100, kept at 7 as the game
 * always has), about 20 spared (the rest, 4 in 100). One place for the numbers (staging.md §7.6).
 */
export const MASSACRE_SHARES = Object.freeze({ executed: 0.89, escaped: 0.07 });
/**
 * Where a family's man stands and what he meets, from the one seeded roll (sim/houston.mjs `goliadMassacre` keeps it):
 * `fate` executed, escaped or spared; a man still wounded from Coleto cannot run (owner's G2, `FIC-GONZ-438`): he is killed
 * inside with the wounded, or spared at the spared share. Which road he is marched on is his own seeded share.
 */
export function massacrePlace(fate, { wounded, road }) {
  if (fate === 'spared') return { part: 'kept' };
  if (wounded) return { part: 'wounded' };
  if (fate === 'escaped') return { part: 'victoria', runs: true };
  return { part: ROADS[Math.min(2, Math.floor(road * 3))] };
}
