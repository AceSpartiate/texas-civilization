// Gonzales before the fight: what the town was doing, day by day, from the soldiers' arrival on the far bank (September 29,
// 1835) to the men's return with the cannon (October 2).
//
// Owner, 2026-09-25: "when i try to watch a battle, or actions that led to a battle, i see npc's just standing around.
// example: there's no one worried at gonzales that the mexicans are coming. there's no group of women making the come and
// take it flag" - and "shouldn't there be talking, orders given, taunting etc? ... players should walk away understanding
// what happened." docs/BATTLES.md §5 step 2.
//
// **Everything here is recomputed from the clock.** A scene is a dated beat: from one minute to another, these people stand
// here doing this, and these words are said. Nothing about it is stored, so a class saved before this existed, or at any
// moment inside it, opens exactly where the town was - no save version moved. The one thing stored is a family's own person
// lending a hand (`entity.townHelp`), which a class saved before simply does not have.
//
// **What it rests on** is docs/battle-research/gonzales-town.md, registered as `HIST-TEX-460` to `-469`; what is invented for
// the game is `FIC-GONZ-410` to `-413`. The rules the research set, kept here:
//   - Nobody named in the record says anything the record does not give them. The one documented line spoken in the town -
//     Clements's refusal, read across the river - is `kind: 'documented'` with its claim; every other line is
//     `kind: 'reconstructed'` and is said by an unnamed townsperson, a volunteer, or one of the invented people of the town
//     (`FIC-GONZ-009`). tests/town-scenes.test.mjs holds every line to this.
//   - "Come and take it" is never said to the soldiers: no 1835 document has anybody say it (`HIST-TEX-469`). It is the
//     words painted on the flag, and the women making the flag say what goes on it.
//   - The flag's makers are unknown (`HIST-TEX-468`): the women making it are unnamed, and the card says who the traditions
//     name and that the wedding dress is a story told later.
//   - The figures are a picture of the town, not a count (`HISTORY.md`: the population of Gonzales in 1835 was NOT FOUND).
//     The eighteen at the crossing are drawn as six; the men who came in as ten. Each card says so.
//
// Who sees it is the rule of the rest of the projection: a family sees the town's scenes only while one of its own people is
// standing in Gonzales (or at the crossing, for what is at the crossing), and the Host sees everything (sim/world.mjs
// `projectWorld`). Only the moment's beat is sent - its people, its props, this tick's words and its card - never the
// schedule, so nothing on the wire says what the town will do next.
import { record } from './events.mjs';
import { canAnswerCalls, tooYoung, sexOf } from './family.mjs';

/**
 * Minutes from dawn on September 28 to midnight on the 29th. The same number as sim/directors.mjs `ARRIVAL_MINUTES`, kept
 * here rather than imported so the town does not reach into the director (tests/town-scenes.test.mjs holds them equal).
 */
export const SCENE_ARRIVAL = 1080;
const DAY = 1440;
/** A moment, in minutes from midnight on September 29, 1835: day 0 is the 29th, 1 the 30th, 2 October 1, 3 October 2. */
export const on = (day, hour, minute = 0) => day * DAY + hour * 60 + minute;
/** This class's clock, as minutes from midnight on September 29 (a class saved before arrivals began there). */
export const sceneClock = world => world.minute - (world.director?.arrival ? SCENE_ARRIVAL : 0);

/**
 * The town's people who are in the scenes and are not entities of the world: a picture of the town, each with a stable id,
 * a way of being described and the figure they are drawn as. Nobody here is a count, and only one has a name - Joseph D.
 * Clements, the regidor, who says only the words his letter gives him.
 *
 * ceiling: they are not entities of the world. Nobody meets them one by one, trades with them, or sees them in the
 * "Also here" list; a student clicks the scene and one of them tells its card. Making them entities (`observedBy`, the Host's
 * overview, a save) is the way out if the owner wants a student to speak to one of the eighteen, and it would need a claim
 * for everything such a person could be asked.
 *
 * Figures: `teal`, `indigo`, `blue-girl` are women; `elder`, `ochre`, `blue` men; `girl`, `boy` children; `volunteer` a man
 * with his rifle; `dragoon` a Mexican dragoon on his horse; `courier` a rider. The rust coat is never used: it is the mark of
 * the student's own person (public/motion.js `PRINCIPAL_VARIANT`).
 */
export const TOWN_CAST = Object.freeze({
  'gz-townsman-1': { label: 'a man of the town', figure: 'elder' },
  'gz-townsman-2': { label: 'a man of the town', figure: 'ochre' },
  'gz-townswoman-1': { label: 'a woman of the town', figure: 'teal' },
  'gz-townswoman-2': { label: 'a woman of the town', figure: 'indigo' },
  'gz-townswoman-3': { label: 'a young woman of the town', figure: 'blue-girl' },
  'gz-townswoman-4': { label: 'a woman of the town', figure: 'teal' },
  'gz-townswoman-5': { label: 'a woman of the town', figure: 'indigo' },
  'gz-townswoman-6': { label: 'a woman of the town', figure: 'teal' },
  // Bringing food to the men on the commons: the town had offered it in writing (`HIST-TEX-464`), and women supplied the men
  // (`HIST-TEX-009`).
  'gz-townswoman-7': { label: 'a woman of the town bringing food', figure: 'indigo' },
  'gz-girl': { label: 'a girl of the town', figure: 'girl', small: .72 },
  'gz-girl-2': { label: 'a girl of the town', figure: 'girl', small: .72 },
  'gz-boy': { label: 'a boy of the town', figure: 'boy', small: .72 },
  // The eighteen who held the crossing (`HIST-TEX-460`), drawn as six. Their names are in the card, not on anybody here.
  // Men of the town, some with their rifles in hand and some not: the talkers are drawn in their own clothes, so they can
  // be seen speaking, listening and looking hard across the river; the rest as men with rifles, standing to the breastwork.
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(n => [`gz-eighteen-${n}`, { label: 'one of the eighteen at the crossing', figure: ['elder', 'ochre', 'volunteer', 'blue', 'volunteer', 'volunteer'][n - 1] }])),
  'gz-clements': { label: 'the regidor', name: 'Joseph D. Clements', figure: 'elder', claimId: 'HIST-TEX-462' },
  'gz-reader-1': { label: 'a man with the regidor', figure: 'ochre' },
  'gz-reader-2': { label: 'a man with the regidor', figure: 'blue' },
  // "a Mr. Smith" (Castañeda); not identified in anything read, and never named here (`HIST-TEX-462`).
  'gz-mr-smith': { label: '"a Mr. Smith", as the officer across the river wrote him down', figure: 'elder' },
  ...Object.fromEntries([1, 2, 3, 4].map(n => [`gz-smith-${n}`, { label: 'a man at the blacksmith shop', figure: ['ochre', 'elder', 'blue', 'ochre'][n - 1] }])),
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => [`gz-volunteer-${n}`, { label: 'one of the men who came in', figure: 'volunteer' }])),
  ...Object.fromEntries([1, 2, 3, 4].map(n => [`gz-mounted-${n}`, { label: 'one of the men riding in', figure: ['elder', 'ochre', 'blue', 'elder'][n - 1], rides: true }])),
  'gz-rider-1': { label: 'a rider carrying a letter', figure: 'courier', rides: true },
  'gz-rider-2': { label: 'a rider carrying a letter', figure: 'courier', rides: true },
  'gz-family-father': { label: 'a father of the town', figure: 'ochre' },
  'gz-family-mother': { label: 'a mother of the town', figure: 'indigo' },
  'gz-family-girl': { label: 'a girl of the town', figure: 'girl', small: .72 },
  'gz-family-boy': { label: 'a boy of the town', figure: 'boy', small: .72 },
  'gz-hiding-mother': { label: 'a mother of the town', figure: 'teal' },
  'gz-hiding-boy': { label: 'a boy of the town', figure: 'boy', small: .72 },
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map(n => [`gz-dragoon-${n}`, { label: 'a dragoon of the detachment from Béxar', figure: 'dragoon' }])),
});

/**
 * Where things are in the town, in miles from the town's own point, on the drawn town of public/gonzales-art.js. Nothing
 * here is a surveyed place (`HIST-GONZ-011`: no street plan is documented); each is the nearest drawn building or open
 * ground to what the record describes. The crossing is worked out from where the map puts the ford (`placeOf`).
 */
const PLACES = Object.freeze({
  street: { x: -0.03, y: 0.035 },
  orchard: { x: -0.22, y: -0.05 },
  // "John Sowell's blacksmith shop" (TSHA; `HIST-TEX-466`) is the open shed at the town's north-west corner. The invented
  // ironworker's yard (Josiah Pike, `FIC-GONZ-009`) is somewhere else on purpose: the gun was not his work.
  shop: { x: -0.30, y: -0.225 },
  // A hewn-log house on the north side of the town, away from the river.
  flagHouse: { x: -0.10, y: -0.212 },
  muster: { x: 0.10, y: 0.012 },
  eastEdge: { x: 0.41, y: -0.066 },
  leavingHouse: { x: 0.13, y: -0.205 },
  bottoms: { x: -0.38, y: 0.24 },
});
/** How far toward the ford the crossing is drawn at most: the edge of the drawn town, on a map whose ford is further off. */
const CROSSING_REACH = 0.3;

/** A place in the town, as miles from the town's point. */
export function placeOf(world, key) {
  if (PLACES[key]) return PLACES[key];
  const town = world.map.sites.gonzales, ford = world.map.sites.ford;
  const dx = ford ? ford.x - town.x : -1, dy = ford ? ford.y - town.y : 0, span = Math.hypot(dx, dy) || 1;
  const reach = Math.min(span, CROSSING_REACH);
  // ceiling: on the invented Gonzales country the ford is two and a half miles from the town, and the crossing is drawn at
  // the town's edge toward it rather than at the ford; on the real map (the one a class plays) the ford is a third of a mile
  // off and the crossing stands on it. A map of the town's own river bank would put it where it was.
  if (key === 'crossing') return { x: dx / span * reach, y: dy / span * reach };
  // Castañeda's camp, "about three hundred yards from the ford" on the far bank (`HIST-TEX-462`), drawn beyond the crossing.
  if (key === 'camp') return { x: dx / span * (reach + 0.13), y: dy / span * (reach + 0.13) };
  // Upriver, where the detachment went on October 1: away from the crossing, off the drawn town.
  if (key === 'upriver') return { x: dx / span * (reach + 0.13) - dy / span * 0.5, y: dy / span * (reach + 0.13) + dx / span * 0.5 };
  throw new Error(`No place ${key} in Gonzales`);
}
/** Which way somebody in the town faces to look at the river. */
export function riverward(world) {
  const at = placeOf(world, 'crossing');
  return Math.abs(at.x) >= Math.abs(at.y) ? (at.x < 0 ? 'w' : 'e') : (at.y < 0 ? 'n' : 's');
}

// ---------------------------------------------------------------------------------------------------------------------------
// The words. Every line is `[speaker, text]` and is reconstructed unless it says otherwise; the third element may carry
// `{ kind: 'documented', claimId }`, a `gloss`, or the claim the reconstruction rests on. Exchanges rotate one a tick.
// ---------------------------------------------------------------------------------------------------------------------------
const said = (claimId, extra = {}) => ({ claimId, ...extra });

/**
 * The town's beats. Each is one scene (by `scene`) between two moments; a scene's cards, people and props are the beat's.
 * `people` entries: `[id, place, dx, dy, pose, face]`, or an object with a `path` for somebody going somewhere. `face` may be
 * 'river' for whichever way the river is. `residents` places the invented townspeople who are world entities (sim/town.mjs
 * `RESIDENTS`) and poses the shopkeepers at their doors, whom the scene never moves. `help` is what the family's own person
 * may do there.
 *
 * Poses the library does not have are stood in by the nearest delivered one, named in `STAND_INS` and listed in
 * docs/ART_REQUESTS.md (request 2026-09-25, Gonzales before the fight).
 */
export const STAND_INS = Object.freeze({
  // stand-in: docs/ART_REQUESTS.md, request 2026-09-25 - Gonzales before the fight. Each pose below is the nearest the library
  // has for what the scene shows.
  paint: 'repair', // hemming and painting the flag: hands working at something on the table
  dig: 'work', // a spade in the orchard: the hoe's swing
  forge: 'repair', // cutting chain and fitting the gun to its wheels
  point: 'search', // looking hard across the river
  haul: 'carry', // carrying bundles to the wagon, cloth to the table
});
const P = STAND_INS;

const STREET_WORRY = [
  [['gz-townswoman-1', 'Soldiers on the far bank. Dragoons, from Béxar.', said('HIST-GONZ-002')], ['gz-townsman-1', "They've come for the cannon."]],
  [['town-crandall', 'That little brass gun? It was lent to us.', said('HIST-GONZ-001')], ['gz-townsman-2', 'Lent in thirty-one, to be given back when they asked for it. Now they have asked - with soldiers.', said('HIST-GONZ-001')]],
  [['gz-girl', 'Are they coming across?'], ['gz-townswoman-2', 'Not while the boats are on our side. Stay near the house.', said('HIST-TEX-461')]],
  [['gz-townsman-1', 'Eighteen men at the crossing. That is all the town has.', said('HIST-TEX-460')], ['gz-townswoman-1', 'Eighteen.']],
  [['town-tavern-gonzales', 'Riders went out days ago, to Bastrop and the Colorado.', said('HIST-TEX-464')], ['gz-townsman-2', 'Then pray they ride hard.']],
  [['gz-townswoman-2', 'Some are loading their wagons for the Colorado.', said('HIST-TEX-467')], ['gz-townswoman-1', 'And leave the house to whoever comes?']],
  [['gz-townsman-2', 'Some say give it back and have peace.', said('HIST-GONZ-006')], ['gz-townsman-1', 'And when they come for the next thing?']],
];
const STREET_NEXT_DAY = [
  [['gz-townsman-1', 'Thirty came in from Bastrop in the night, and Moore with forty or fifty off the Colorado.', said('HIST-TEX-464')], ['gz-townswoman-1', 'Then we are not eighteen any more.']],
  [['town-crandall', 'The officer over there wants the alcalde.', said('HIST-TEX-462')], ['gz-townsman-2', 'And the alcalde is away. So he waits.']],
  [['gz-townswoman-2', 'Is it war, then? With Mexico?'], ['gz-townsman-1', 'It is a cannon. For now it is a cannon.', said('HIST-GONZ-006')]],
  [['town-ibarra', 'Powder and lead - every man that rides in asks me for them.'], ['gz-townswoman-1', 'Give them what you have.']],
  [['gz-boy', 'I saw a soldier on a horse, across the water.'], ['gz-townswoman-2', 'Then you were too near the river.']],
];
const STREET_REFUSED = [
  [['gz-townsman-2', 'They read him our answer from this bank. We will not give it up.', said('HIST-TEX-462')], ['gz-townswoman-1', 'And now?']],
  [['town-crandall', 'Men sitting on the commons with their rifles, and more coming.', said('HIST-TEX-464')], ['gz-townswoman-2', 'I have never seen the town so full.']],
  [['gz-townsman-1', 'Some want to go over and fight them. Some want to wait.', said('HIST-TEX-464')], ['gz-townsman-2', 'They are all captains, and each has his view.', said('HIST-TEX-464')]],
];
const STREET_GONE_UP = [
  [['gz-townsman-1', 'The soldiers have left the mound. Gone up the river.', said('HIST-TEX-465')], ['gz-townswoman-1', 'Going home?']],
  [['gz-townsman-2', 'Seven miles up, to the Williams place, and camped.', said('HIST-GONZ-008')], ['gz-townswoman-2', 'Waiting for more of them, maybe.']],
];
const STREET_SEE_THEM_GO = [
  [['gz-townswoman-1', 'They are going over tonight.', said('HIST-TEX-465')], ['gz-townswoman-2', 'God keep them.']],
  [['gz-girl', 'Is Father going?'], ['gz-townswoman-1', 'Hush now. Watch.']],
  [['town-crandall', 'A hundred and sixty men, and the cannon, and the flag. More than I thought this country had.', said('HIST-TEX-465')], ['gz-townsman-2', 'More than the soldiers thought, too.']],
];
const STREET_WAITING = [
  [['gz-townswoman-1', 'They will be up at the camp by now.'], ['gz-townswoman-2', 'No word yet.']],
  [['town-crandall', 'All that fog on the river this morning. You could not see the far bank.', said('HIST-TEX-465')], ['gz-townswoman-1', 'Nor could they, I hope.']],
  [['gz-townsman-2', 'Their horses are here; most of them went on foot.', said('HIST-TEX-465')], ['gz-girl', 'Will they come back today?']],
];
// The gun heard from up the river: the fight's own fiction (`FIC-GONZ-417`, sim/directors.mjs), written in the family's
// journal as a dull report at first light and again after the parley. The town says only that it heard it.
const STREET_GUN = [
  [['gz-townswoman-1', 'Listen - a gun, far up the river.', said('FIC-GONZ-417')], ['gz-townswoman-2', 'Ours or theirs?']],
  [['gz-townsman-2', 'Nobody can say from here. Wait.', said('FIC-GONZ-417')], ['gz-girl', 'Is that them?']],
  [['town-crandall', 'All we can do is wait for somebody to ride down.'], ['gz-townswoman-1', 'Then we wait.']],
];
const STREET_WORD_CAME = [
  [['gz-townswoman-2', 'Word has come down the river - the soldiers have gone off toward Béxar.', said('HIST-GONZ-004')], ['gz-townswoman-1', 'And ours?']],
  [['gz-townsman-1', 'Coming home, they say. With the gun.', said('HIST-GONZ-004')], ['gz-townswoman-1', 'Thank God.']],
];
const STREET_RETURN = [
  [['gz-townswoman-1', 'Here they come!'], ['gz-girl', 'They have the cannon!']],
  [['gz-volunteer-1', 'They went off toward Béxar. Their baggage is ours.', said('HIST-TEX-465')], ['gz-townswoman-2', 'Anybody hurt?']],
  [['gz-volunteer-2', 'Not a man lost.', said('HIST-TEX-465')], ['gz-townswoman-2', 'Thank God for that.']],
  [['gz-townsman-1', 'It has begun, then.'], ['gz-townsman-2', 'It has.']],
];
const CROSSING_HOLD = [
  [['gz-eighteen-1', 'Keep down behind the logs.', said('HIST-TEX-461')], ['gz-eighteen-2', 'They cannot cross in this water without our boats.', said('HIST-TEX-461')]],
  [['gz-eighteen-3', 'Flatboat and canoes, every one on this side. Keep them so.', said('HIST-TEX-461')], ['gz-eighteen-1', 'Nobody touches a boat.']],
  [['gz-eighteen-2', 'Their officer is calling for the alcalde.', said('HIST-TEX-462')], ['gz-eighteen-4', 'Then he can wait for him.']],
];
const CROSSING_SWIMMER = [
  [['gz-eighteen-2', 'Look there - a man swimming over, with papers held up out of the water.', said('HIST-TEX-462')], ['gz-eighteen-1', 'Let him come. He brings letters, nothing else.']],
  [['gz-eighteen-3', 'It is for the alcalde. Somebody who reads Spanish had better read it.', said('HIST-TEX-462')], ['gz-eighteen-4', 'Fetch him.']],
  [['gz-eighteen-1', 'Call it over to them: the alcalde is away.', said('HIST-TEX-462')], ['gz-eighteen-2', 'The alcalde is away! He will be back!', said('HIST-TEX-462')]],
];
const CROSSING_NIGHT = [
  [['gz-eighteen-1', 'Keep the fire low. They see us as well as we see them.'], ['gz-eighteen-2', 'Their fires are on the mound.', said('HIST-TEX-462')]],
  [['gz-eighteen-3', 'Men coming in on the east road. Ours.', said('HIST-TEX-464')], ['gz-eighteen-4', 'About time.']],
];
const CROSSING_WATCH = [
  [['gz-eighteen-1', 'They made at the ford again. Only feints.', said('HIST-TEX-462')], ['gz-eighteen-2', 'Let them.']],
  [['gz-eighteen-3', 'The regidor says he will talk to them at four.', said('HIST-TEX-462')], ['gz-eighteen-4', 'From this bank, I hope.']],
  [['gz-eighteen-2', 'Keep the boats this side. That is all we need to do.', said('HIST-TEX-461')], ['gz-eighteen-1', 'That, and wait for more men.']],
];
const CROSSING_READING = [
  // The one line in the town the record gives in the speaker's own words (`HIST-TEX-462`): the regidor's letter of September
  // 30, read to the officer across the river. The English version's own wording, as the Sons of DeWitt Colony print it; the
  // Spanish reads "No puedo ni hare la entrega".
  // One exchange, said every tick of the beat, so nobody standing there misses it: the reading, then the men's answer.
  [['gz-clements', 'I cannot now will not deliver to you the cannon', { kind: 'documented', claimId: 'HIST-TEX-462' }], ['gz-eighteen-1', 'That is our answer, then.'],
    ['gz-eighteen-2', 'He will tell them at Béxar they must take it by force.', said('HIST-TEX-462')]],
];
const CROSSING_GONE = [
  [['gz-eighteen-1', 'They are gone off the mound, upriver.', said('HIST-TEX-465')], ['gz-eighteen-2', 'To the Williams place, the scouts say.', said('HIST-GONZ-008')]],
  [['gz-eighteen-3', 'Bring the flatboat back down to the landing.', said('HIST-TEX-461')], ['gz-eighteen-4', 'Somebody means to use it.']],
];
const CROSSING_OVER = [
  [['gz-volunteer-1', 'Over, and quiet about it.', said('HIST-TEX-465')], ['gz-volunteer-2', 'The gun first. Mind the wheels on the boards.', said('HIST-TEX-466')]],
  [['gz-eighteen-1', 'Horses to the ford; men and the gun on the boat.', said('HIST-TEX-465')], ['gz-volunteer-3', 'Easy - easy.']],
];
const ORCHARD_DIG = [
  [['gz-smith-1', 'Here. It is under here - they ploughed it over.', said('HIST-TEX-466')], ['gz-smith-2', 'Easy with the spade.']],
  [['gz-smith-3', 'There it is.', said('HIST-TEX-466')], ['gz-smith-1', 'Get the dirt out of the bore.']],
];
const SHOP_WORK = [
  [['gz-smith-1', 'Cut that chain in lengths. It will do for shot.', said('HIST-TEX-466')], ['gz-smith-2', 'There is no proper ball for it.', said('HIST-TEX-466')]],
  [['gz-smith-3', 'Wheels off a cotton wagon. They will carry it.', said('HIST-TEX-466')], ['gz-smith-1', 'Pin the axle tight.']],
  [['gz-smith-2', 'Any iron you can find. Slugs, scrap, anything.', said('HIST-TEX-466')], ['gz-smith-4', 'Hand me the tongs.']],
];
const FLAG_WORK = [
  [['gz-townswoman-3', 'White cotton, a good long breadth of it.', said('HIST-TEX-468')], ['gz-townswoman-5', 'Six feet, near enough.', said('HIST-TEX-468')]],
  [['gz-townswoman-5', 'The cannon in the middle, painted black.', said('HIST-TEX-468')], ['gz-townswoman-6', 'And the words under it.', said('HIST-TEX-468')]],
  // The words on the flag, said as what is to be painted - never as a thing called to the soldiers (`HIST-TEX-469`).
  [['gz-townswoman-3', 'What words?'], ['gz-townswoman-6', '"Come and take it."', said('HIST-TEX-468')]],
  [['gz-townswoman-4', 'Some want a star over the gun.', said('HIST-TEX-468')], ['gz-townswoman-5', 'Then give them a star.']],
  [['gz-girl-2', 'Is it for the soldiers to see?'], ['gz-townswoman-6', 'It is for our men to go behind.']],
];
const FLAG_DONE = [
  [['gz-townswoman-5', 'Let the paint dry before anybody carries it.'], ['gz-townswoman-3', 'It will be dry by evening.']],
  [['gz-townswoman-6', 'Take it down to the men.'], ['gz-townswoman-4', 'Carry it high.']],
];
const MUSTER_ARRIVING = [
  [['gz-volunteer-1', 'Coleman\'s company, from Bastrop!', said('HIST-TEX-464')], ['gz-reader-1', 'Welcome - you are wanted.']],
  [['gz-volunteer-2', 'Moore\'s men, off the Colorado.', said('HIST-TEX-464')], ['gz-volunteer-3', 'Where do we put the horses?']],
];
const MUSTER_WAITING = [
  [['gz-volunteer-1', 'Yesterday there were eighteen here. Look at it now.', said('HIST-TEX-464')], ['gz-volunteer-2', 'A hundred and fifty, and more on the road.', said('HIST-TEX-464')]],
  [['gz-volunteer-3', 'Who is in command?'], ['gz-volunteer-4', 'Nobody yet. We are all captains here.', said('HIST-TEX-464')]],
  [['gz-volunteer-2', 'I say go over and attack them.', said('HIST-TEX-464')], ['gz-volunteer-5', 'And I say wait until we are more.', said('HIST-TEX-464')]],
  [['gz-townswoman-7', 'There is bread and meat for all of you. The town promised it.', said('HIST-TEX-464')], ['gz-volunteer-6', 'God bless the town.']],
];
const MUSTER_OUT = [
  [['gz-volunteer-1', 'Take it to San Felipe, and on to the Lavaca.', said('HIST-TEX-464')], ['gz-volunteer-2', 'Tell them we are a hundred and fifty, and want more.', said('HIST-TEX-464')]],
];
const MUSTER_DECIDED = [
  [['gz-volunteer-1', 'Moore is colonel, and Wallace under him.', said('HIST-TEX-465')], ['gz-volunteer-2', 'Then we have a head at last.']],
  [['gz-volunteer-3', 'They have moved up the river. We go after them tonight.', said('HIST-TEX-465')], ['gz-volunteer-4', 'With the gun?']],
  [['gz-townswoman-4', 'Bread for the road.', said('HIST-TEX-009')], ['gz-volunteer-5', 'Thank you, ma\'am.']],
];
const MUSTER_MARCH = [
  [['gz-volunteer-1', 'Fall in. Down to the ferry.', said('HIST-TEX-465')], ['gz-volunteer-2', 'Bring the gun.']],
  [['gz-volunteer-3', 'Keep the flag up where we can see it.', said('HIST-TEX-468')], ['gz-volunteer-4', 'Quiet, now.']],
];
const LEAVING = [
  [['gz-family-mother', 'Everything we can carry. The rest stays.', said('HIST-TEX-467')], ['gz-family-father', 'To the Colorado, until this is done.', said('HIST-TEX-467')]],
  [['gz-family-girl', 'Is the house staying?'], ['gz-family-mother', 'The house stays. We go.']],
];
const HIDING = [
  [['gz-hiding-mother', 'Down in the timber by the river. Nobody looks there.', said('HIST-TEX-467')], ['gz-hiding-boy', 'For how long?']],
];

// ---------------------------------------------------------------------------------------------------------------------------
// The cards: what a person there tells a student who clicks the scene, in plain words, with what is known and how well.
// Written for the beat, so a card never says what has not happened yet.
// ---------------------------------------------------------------------------------------------------------------------------
const PICTURE = 'The people drawn here are a picture of the town, not a count of it; what they say is written for the game from what the record says happened. Anything said in a solid box is on record; a dashed box is reconstructed.';
const CARD_STREET = {
  title: 'The soldiers across the river',
  teller: 'Ruth Crandall, who lives on the commons, tells you:',
  said: [
    'Four years ago the Mexican government lent the town a small brass cannon, against the Indians, on the understanding that it would be given back when asked for. Now the commander at Béxar has asked for it, and the town has said no.',
    'So he has sent soldiers - a troop of dragoons under a lieutenant, Castañeda. They are on the far bank of the Guadalupe. The river is high and every boat is on this side, so they cannot come over, and the men of the town are at the crossing to see that they do not.',
    'Riders went out days ago for help. Some families are loading their wagons for the Colorado; some are going down into the river timber to hide.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'The cannon was lent in 1831, to be returned when requested.', claimId: 'HIST-GONZ-001' },
    { label: 'DOCUMENTED', text: 'Castañeda\'s detachment reached the river opposite Gonzales on September 29, 1835, and the town refused to give up the cannon.', claimId: 'HIST-GONZ-002' },
    { label: 'DOCUMENTED', text: 'Families were moving out of the town; some hid in the river bottoms.', claimId: 'HIST-TEX-467' },
    { label: 'DOCUMENTED', text: 'Not everybody agreed. Days earlier, when a corporal brought the first demand, the townspeople met and refused it, with "but three names in favour of giving up the cannon", and held the soldiers who brought it.', claimId: 'HIST-TEX-463' },
  ],
  madeUp: `${PICTURE} Ruth Crandall is invented (FIC-GONZ-009).`,
};
const CARD_STREET_LATER = {
  ...CARD_STREET,
  said: [
    'The town is filling up. Men have ridden in from Bastrop and the Colorado - thirty the first night with Coleman, forty or fifty with Moore - and more every hour. Yesterday there were eighteen men here; now there are more than a hundred.',
    'On the thirtieth the regidor, Joseph Clements, stood on this bank and read the officer our answer: the town will not give up the cannon.',
    'Nobody is in command yet, and the men do not agree whether to attack or wait.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'Coleman came in with thirty men from Bastrop and Moore with forty or fifty on the night of September 29; there were about 150 by the 30th.', claimId: 'HIST-TEX-464' },
    { label: 'DOCUMENTED', text: 'Clements read the refusal across the river on September 30.', claimId: 'HIST-TEX-462' },
    { label: 'DOCUMENTED', text: '"we are all captains and have our views" - R. M. Coleman, in a letter of September 30.', claimId: 'HIST-TEX-464' },
  ],
  madeUp: `${PICTURE} Ruth Crandall is invented (FIC-GONZ-009).`,
};
const CARD_STREET_NIGHT = {
  ...CARD_STREET,
  title: 'The men go over',
  said: [
    'The soldiers left the mound across the river this morning and went seven miles up it, to Ezekiel Williams\'s place. The men here chose John Moore their colonel, and tonight they are going over the river after them, on the flatboat, with the cannon on its wheels.',
    'About a hundred and sixty went. The rest of us wait.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'Moore was elected colonel and Wallace lieutenant colonel; which day is disputed.', claimId: 'HIST-TEX-465' },
    { label: 'DOCUMENTED', text: 'About 7 or 8 in the evening of October 1 the force crossed at the ferry with the cannon: 160 or 168 men.', claimId: 'HIST-TEX-465' },
    { label: 'DOCUMENTED', text: 'Castañeda moved upriver to Williams\'s land on October 1.', claimId: 'HIST-GONZ-008' },
  ],
};
const CARD_STREET_WAIT = {
  ...CARD_STREET,
  title: 'Waiting for word',
  said: [
    'The men went over the river last night and marched up it in the dark, through fog. Nobody here knows yet what has happened up there.',
    'Who stayed in the town that night is not written down anywhere; the women, the children and the old men, most likely, and a guard on the horses the men left behind.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'The force crossed on the night of October 1 and attacked the camp on the morning of October 2.', claimId: 'HIST-GONZ-003' },
    { label: 'NOT RECORDED', text: 'Who stayed in Gonzales that night.', claimId: 'HIST-TEX-465' },
  ],
};
const CARD_STREET_BACK = {
  ...CARD_STREET,
  title: 'The men come back',
  said: [
    'They came back this afternoon with the cannon and the soldiers\' baggage. The soldiers fired and were fired on, and then went off toward Béxar without the gun.',
    'Not one of ours was lost. People are saying the war has begun.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'The Mexican detachment withdrew toward Béxar without the cannon.', claimId: 'HIST-GONZ-004' },
    { label: 'STRONGLY SUPPORTED', text: 'The force was back in Gonzales about two in the afternoon of October 2, with the Mexican baggage, "without losing a man".', claimId: 'HIST-TEX-465' },
    { label: 'DOCUMENTED', text: '"The rubicon is crossed" - William Fisher, writing from Gonzales to Austin on October 3.', claimId: 'HIST-TEX-465' },
  ],
};
const EIGHTEEN = 'Albert Martin (captain), Jacob C. Darst, Winslow Turner, W. W. Arrington, Graves Fulchear, George W. Davis, John Sowell, James Hinds, Thomas Miller, Valentine Bennet, Ezekiel Williams, Simeon Bateman, J. D. Clements, Almeron Dickinson, Benjamin Fuqua, Thomas Jackson, Charles Mason and Almon Cottle';
const CARD_CROSSING = {
  title: 'The eighteen at the crossing',
  teller: 'One of the men behind the breastwork tells you:',
  said: [
    'When the dragoons came down to the far bank at noon there were eighteen of us in the whole town, under Captain Martin. We built a breastwork of logs at the landing and brought every boat to this side - the flatboat and the canoes - so they had nothing to cross on, and the river is too high to swim a horse.',
    'Their officer wants the alcalde. The alcalde is away, and we have told them so.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'Eighteen men held the town on September 29; Castañeda counted "about 20".', claimId: 'HIST-TEX-460' },
    { label: 'STRONGLY SUPPORTED', text: `Their names, as a survivor's account of 1899 gives them: ${EIGHTEEN}.`, claimId: 'HIST-TEX-460' },
    { label: 'DOCUMENTED', text: 'Castañeda saw "a flatboat and canoes with a guard of about 20 men... in their parapet made up of wood".', claimId: 'HIST-TEX-461' },
    { label: 'DOCUMENTED', text: 'At 4 in the afternoon Juan de los Santos Coy swam the officer\'s letters over; a regidor answered that the alcalde was away.', claimId: 'HIST-TEX-462' },
  ],
  madeUp: `${PICTURE} Six figures stand for the eighteen; which of them is which is not shown.`,
};
const CARD_READING = {
  ...CARD_CROSSING,
  title: 'The answer, read across the river',
  teller: 'One of the men at the crossing tells you:',
  said: [
    'At four o\'clock the regidor, Joseph Clements, came down with two others and a Mr. Smith, and read our answer to the officer from this bank. They would not cross over to him.',
    'The letter says the town will not deliver the cannon. The officer will tell Béxar it can only be had by force.',
  ],
  known: [
    { label: 'DOCUMENTED', text: '"I cannot now will not deliver to you the cannon" - Clements\'s letter of September 30, as its English copy has it.', claimId: 'HIST-TEX-462' },
    { label: 'DOCUMENTED', text: '"they read to me from the other side" - Castañeda\'s report.', claimId: 'HIST-TEX-462' },
    { label: 'DISPUTED', text: 'That anybody called "come and take it" across the river. No 1835 document has it; one of the eighteen remembered it in 1874.', claimId: 'HIST-TEX-469' },
  ],
  madeUp: `${PICTURE} Who "Mr. Smith" was is not known, and he is not named.`,
};
const CARD_CROSSING_OVER = {
  ...CARD_CROSSING,
  title: 'Over the river',
  teller: 'One of the men at the landing tells you:',
  said: [
    'The flatboat was hidden up the river in a slough. Now it is back at the landing, and it is taking the men over with the cannon on its wheels; fifty horses go by the ford.',
    'On the other side they gather at Mrs. DeWitt\'s house before they march.',
  ],
  known: [
    { label: 'DOCUMENTED', text: '"the infantry at the ferry, together with the cannon" crossed about seven in the evening of October 1.', claimId: 'HIST-TEX-465' },
    { label: 'STRONGLY SUPPORTED', text: 'The ferry-boat had been hidden in a slough above the town and was brought back to its landing.', claimId: 'HIST-TEX-461' },
  ],
  madeUp: PICTURE,
};
const CARD_CAMP = {
  title: 'The dragoons on the far bank',
  teller: 'One of the men at the crossing tells you:',
  said: [
    'That is the detachment from Béxar - dragoons, under Lieutenant Francisco de Castañeda, sent to bring back the cannon. They are camped on the rise about three hundred yards from the ford.',
    'They have tried the ford and the ferry landing, but only feints. They are waiting for the alcalde, and for an answer.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'Castañeda camped about 300 yards from the ford.', claimId: 'HIST-GONZ-008' },
    { label: 'DOCUMENTED', text: 'The Texian side held the east bank; the dragoons had to wait on the west side.', claimId: 'HIST-GONZ-007' },
  ],
  madeUp: `${PICTURE} Six dragoons stand for the detachment; its size is not stated here.`,
};
const CARD_ORCHARD = {
  title: 'The cannon in the peach orchard',
  teller: 'One of the men with a spade tells you:',
  said: [
    'Before the soldiers came, the gun was buried in George Davis\'s peach orchard and the ground ploughed over, so nobody could find it. Now it is wanted. We are digging it up to put it on wheels.',
  ],
  known: [
    { label: 'STRONGLY SUPPORTED', text: 'The cannon was buried in Davis\'s peach orchard, "the ground being plowed and smoothed over" - from later accounts; no 1835 letter mentions it.', claimId: 'HIST-TEX-466' },
  ],
  madeUp: `${PICTURE} Where the orchard was is not known.`,
};
const CARD_SHOP = {
  title: 'At Sowell\'s blacksmith shop',
  teller: 'One of the men at the shop tells you:',
  said: [
    'The gun had no carriage, so it is going on a pair of cart wheels - the wheels of a cotton wagon. There is no proper shot for it, so the smiths are cutting up chain and forging slugs out of any scrap iron they can find.',
  ],
  known: [
    { label: 'DOCUMENTED', text: 'By October 1 the gun was "tolerably well mounted" on "a pr of cart wheels".', claimId: 'HIST-TEX-466' },
    { label: 'STRONGLY SUPPORTED', text: 'Jacob Darst, John Sowell and Richard Chisholm did the work at Sowell\'s shop; the smiths cut chain and forged iron for shot.', claimId: 'HIST-TEX-466' },
    { label: 'DISPUTED', text: 'Whose wagon the wheels came from: four accounts name four owners.', claimId: 'HIST-TEX-466' },
  ],
  madeUp: `${PICTURE} The men drawn are not named, and which of them is which is not shown.`,
};
const CARD_FLAG = {
  title: 'The flag',
  teller: 'One of the women at the table tells you:',
  said: [
    'The men want a flag to go behind. It is a breadth of white cotton about six feet long, with the cannon painted on it in black and the words under it: "Come and take it." Some want a star over the gun.',
    'The women of the town have given the cloth.',
  ],
  known: [
    { label: 'STRONGLY SUPPORTED', text: 'White cotton, a black cannon and the words "Come and take it" - as two men who saw it remembered it about 1900.', claimId: 'HIST-TEX-468' },
    { label: 'DISPUTED', text: 'When it was made. The Handbook of Texas says a few days before the fight; Noah Smithwick, who saw it, remembered it made for Austin\'s army later in October. No letter of 1835 mentions a flag.', claimId: 'HIST-TEX-468' },
    { label: 'DISPUTED', text: 'Who made it. "History is silent on the subject" (Smithwick). Later accounts name Sarah Seely DeWitt and her daughter Eveline, or Eveline DeWitt with Cynthia Burns, or with Caroline Zumwalt, or a committee of five officers with cloth from the women of the town.', claimId: 'HIST-TEX-468' },
    { label: 'TRADITION', text: 'That it was cut from the silk wedding dress of Naomi DeWitt, who married that August. The Handbook calls the story apocryphal.', claimId: 'HIST-TEX-468' },
    { label: 'DISPUTED', text: 'The star over the gun: some who remembered it drew one, some did not.', claimId: 'HIST-TEX-468' },
  ],
  madeUp: `${PICTURE} The women are not named because nobody knows who they were. The game shows the flag made here on these two days because the Handbook puts it at the fight (FIC-GONZ-411).`,
};
const CARD_MUSTER = {
  title: 'Men coming in',
  teller: 'One of the men on the commons tells you:',
  said: [
    'The town wrote for help on the twenty-fifth, to Bastrop and to Moore on the Colorado. Coleman came in with thirty from Bastrop the first night, and Moore with forty or fifty. Every hour there are more, from the Colorado, the Lavaca and the Brazos.',
    'Letters are still going out, to San Felipe and the Lavaca, for more.',
  ],
  known: [
    { label: 'DOCUMENTED', text: '"Yesterday we were but 18 strong, to day 150" - Martin, Coleman and Moore, September 30.', claimId: 'HIST-TEX-464' },
    { label: 'DOCUMENTED', text: '"You need make no delay about provisions, for we have plenty at your service" - the Gonzales committee, September 25.', claimId: 'HIST-TEX-464' },
  ],
  madeUp: `${PICTURE} Ten figures stand for the men who came in.`,
};
const CARD_MUSTER_DECIDED = {
  ...CARD_MUSTER,
  title: 'The decision',
  said: [
    'This morning the soldiers left the far bank and went up the river. Some took it that they are waiting for more soldiers, or looking for a crossing higher up. So it is decided: the men go over tonight and attack their camp.',
    'They have chosen John Moore colonel and J. W. E. Wallace lieutenant colonel.',
  ],
  known: [
    { label: 'DOCUMENTED', text: '"It is the most important crisis that the people of Texas have ever experienced" - John H. Moore, October 1.', claimId: 'HIST-TEX-465' },
    { label: 'DOCUMENTED', text: 'Moore was elected colonel and Wallace lieutenant colonel.', claimId: 'HIST-TEX-465' },
  ],
};
const CARD_LEAVING = {
  title: 'A family leaving',
  teller: 'The mother, loading the wagon, tells you:',
  said: [
    'We are taking what we can carry across the Colorado until this is over. Others are doing the same, and some are going down into the timber by the river to hide.',
  ],
  known: [
    { label: 'DOCUMENTED', text: '"Several families were talking of moveing. and some have actually prepared thier waggons" (September 26); "The inhabitants of Gonzales are moving their families from the Town" (September 29).', claimId: 'HIST-TEX-467' },
  ],
  madeUp: `${PICTURE} This family is invented; how many families left is not recorded.`,
};
const CARD_HIDING = {
  ...CARD_LEAVING,
  title: 'Into the river timber',
  teller: 'The mother tells you:',
  said: ['We are going down into the timber by the river. Nobody will look for us there.'],
  known: [{ label: 'STRONGLY SUPPORTED', text: '"Some of the families secreted themselves in the timbered bottoms."', claimId: 'HIST-TEX-467' }],
};

/** One of the town's people standing somewhere, as `[id, place, dx, dy, pose, face]`. */
const at = (id, place, dx, dy, pose = 'idle', face = 's') => ({ id, place, dx, dy, pose, face });
/** One of them going somewhere between two moments of the beat, along places. */
const going = (id, from, to, span, { pose = 'idle', face = 's', path = [from, to], stays = false } = {}) => ({ id, going: { path, span }, pose, face, stays });

/**
 * The beats. Ordered by time within each scene; a scene has at most one beat at any moment (a test holds it).
 * The times are the research's (docs/battle-research/gonzales-town.md §3–6) where it gives them; the rest are this game's
 * within the day (`FIC-GONZ-410`).
 */
export const TOWN_BEATS = Object.freeze([
  // --------------------------------------------------------------------------- the street: the town hears and waits
  { id: 'street-alarm', scene: 'street', from: on(0, 12), to: on(0, 20), card: CARD_STREET, talk: STREET_WORRY,
    people: [at('gz-townswoman-1', 'street', -0.012, 0, 'speak', 'river'), at('gz-townsman-1', 'street', 0.012, -0.004, 'listen', 's'), at('gz-townsman-2', 'street', 0.024, 0.01, P.point, 'river'),
      at('gz-townswoman-2', 'street', -0.02, 0.014, 'listen', 's'), at('gz-girl', 'street', -0.03, 0.02, 'idle', 's'), at('gz-boy', 'street', 0.03, 0.022, 'idle', 'n')],
    residents: [at('town-crandall', 'street', 0.002, 0.018, 'speak', 'e'), at('town-tavern-gonzales', null, 0, 0, 'listen', 's')] },
  { id: 'street-evening', scene: 'street', from: on(0, 20), to: on(0, 23), card: CARD_STREET, talk: STREET_WORRY.slice(3),
    people: [at('gz-townsman-1', 'street', 0, 0, 'speak', 'e'), at('gz-townsman-2', 'street', 0.016, 0.002, 'listen', 's')] },
  { id: 'street-second-day', scene: 'street', from: on(1, 7), to: on(1, 16), card: CARD_STREET_LATER, talk: STREET_NEXT_DAY,
    people: [at('gz-townsman-1', 'street', -0.01, 0, 'speak', 'e'), at('gz-townswoman-1', 'street', 0.008, 0.004, 'listen', 's'), at('gz-townswoman-2', 'street', 0.022, 0.012, 'listen', 's'),
      at('gz-townsman-2', 'street', -0.024, 0.012, 'idle', 'river'), at('gz-boy', 'street', 0.03, 0.022, 'speak', 'w')],
    residents: [at('town-crandall', 'street', 0.004, 0.02, 'speak', 'e'), at('town-ibarra', null, 0, 0, 'trade', 'e'), at('town-tavern-gonzales', null, 0, 0, 'speak', 'e')] },
  { id: 'street-refused', scene: 'street', from: on(1, 18), to: on(1, 21), card: CARD_STREET_LATER, talk: STREET_REFUSED,
    people: [at('gz-townsman-2', 'street', -0.01, 0, 'speak', 'e'), at('gz-townswoman-1', 'street', 0.008, 0.004, 'listen', 's'), at('gz-townswoman-2', 'street', 0.02, 0.012, 'listen', 's'), at('gz-townsman-1', 'street', -0.022, 0.012, 'speak', 'e')],
    residents: [at('town-crandall', 'street', 0.004, 0.02, 'speak', 'w')] },
  { id: 'street-gone-up', scene: 'street', from: on(2, 10), to: on(2, 17), card: CARD_STREET_LATER, talk: STREET_GONE_UP,
    people: [at('gz-townsman-1', 'street', -0.01, 0, 'speak', 'e'), at('gz-townswoman-1', 'street', 0.008, 0.004, 'listen', 's'), at('gz-townsman-2', 'street', 0.02, 0.01, P.point, 'river'), at('gz-townswoman-2', 'street', -0.02, 0.012, 'listen', 's')],
    residents: [at('town-crandall', 'street', 0.004, 0.02, 'listen', 's')] },
  // The town watches the men go down to the ferry. Placed toward the crossing, turned to it.
  { id: 'street-see-them-go', scene: 'street', from: on(2, 19), to: on(2, 23), card: CARD_STREET_NIGHT, talk: STREET_SEE_THEM_GO,
    people: [at('gz-townswoman-1', 'street', -0.02, 0.01, 'speak', 'river'), at('gz-townswoman-2', 'street', -0.006, 0.014, 'idle', 'river'), at('gz-girl', 'street', -0.028, 0.022, 'idle', 'river'),
      at('gz-townsman-2', 'street', 0.008, 0.004, 'listen', 's'), at('gz-townswoman-3', 'street', 0.018, 0.016, 'idle', 'river')],
    residents: [at('town-crandall', 'street', 0.004, 0.024, 'speak', 'w')] },
  // The morning of October 2 keeps the fight's clock (sim/battles/gonzales.mjs through sim/directors.mjs `TIMELINE`): the
  // first shots at twenty to six, the cannon again at twenty to nine, and the outcome the director has at twenty to ten.
  { id: 'street-waiting', scene: 'street', from: on(3, 4, 40), to: on(3, 5, 40), card: CARD_STREET_WAIT, talk: STREET_WAITING,
    people: [at('gz-townswoman-1', 'street', -0.012, 0, 'speak', 'e'), at('gz-townswoman-2', 'street', 0.006, 0.004, 'listen', 's'), at('gz-girl', 'street', -0.024, 0.016, 'idle', 's'), at('gz-townsman-2', 'street', 0.02, 0.012, 'speak', 'w')],
    props: [{ kind: 'horse', place: 'muster', dx: 0.0, dy: 0.0 }, { kind: 'horse', place: 'muster', dx: 0.02, dy: 0.008, face: 'w' }],
    residents: [at('town-crandall', 'street', 0.004, 0.02, 'listen', 's')] },
  { id: 'street-gun', scene: 'street', from: on(3, 5, 40), to: on(3, 9, 40), card: CARD_STREET_WAIT, talk: STREET_GUN,
    people: [at('gz-townswoman-1', 'street', -0.012, 0, P.point, 'river'), at('gz-townswoman-2', 'street', 0.006, 0.004, 'listen', 's'), at('gz-girl', 'street', -0.024, 0.016, 'idle', 'river'), at('gz-townsman-2', 'street', 0.02, 0.012, 'speak', 'w')],
    props: [{ kind: 'horse', place: 'muster', dx: 0.0, dy: 0.0 }, { kind: 'horse', place: 'muster', dx: 0.02, dy: 0.008, face: 'w' }],
    residents: [at('town-crandall', 'street', 0.004, 0.02, 'speak', 'e')] },
  { id: 'street-word', scene: 'street', from: on(3, 9, 40), to: on(3, 14), card: CARD_STREET_WAIT, talk: STREET_WORD_CAME,
    people: [at('gz-townswoman-2', 'street', -0.012, 0, 'speak', 'e'), at('gz-townswoman-1', 'street', 0.006, 0.004, 'listen', 's'), at('gz-townsman-1', 'street', 0.02, 0.012, 'speak', 'w'), at('gz-girl', 'street', -0.024, 0.016, 'idle', 's')],
    residents: [at('town-crandall', 'street', 0.004, 0.02, 'listen', 's')] },
  { id: 'street-return', scene: 'street', from: on(3, 14), to: on(3, 20), card: CARD_STREET_BACK, talk: STREET_RETURN,
    people: [at('gz-townswoman-1', 'street', -0.02, 0, 'speak', 'river'), at('gz-girl', 'street', -0.03, 0.014, 'speak', 'river'), at('gz-townswoman-2', 'street', -0.004, 0.01, 'listen', 's'),
      at('gz-townsman-1', 'street', 0.012, 0.004, 'speak', 'e'), at('gz-townsman-2', 'street', 0.026, 0.012, 'listen', 's'), at('gz-boy', 'street', -0.036, 0.024, 'idle', 'river'),
      going('gz-volunteer-1', 'crossing', 'street', [on(3, 14), on(3, 15)], { face: 'e', stays: true, pose: 'speak' }), going('gz-volunteer-2', 'crossing', 'street', [on(3, 14), on(3, 15)], { face: 'e', stays: true, pose: 'speak' }),
      { ...going('gz-volunteer-3', 'crossing', 'street', [on(3, 14), on(3, 15)], { stays: true, face: 'e' }), carries: 'flag' }, going('gz-volunteer-4', 'crossing', 'muster', [on(3, 14), on(3, 16)], { stays: true, face: 'w' })],
    offsets: { 'gz-volunteer-1': [0.03, -0.012], 'gz-volunteer-2': [0.044, -0.004], 'gz-volunteer-3': [0.058, -0.016] },
    props: [{ id: 'gz-cannon', kind: 'cannon', going: { path: ['crossing', 'street'], span: [on(3, 14), on(3, 15)] }, dx: 0.05, dy: 0.004 }],
    residents: [at('town-crandall', 'street', 0.002, 0.022, 'listen', 's'), at('town-tavern-gonzales', null, 0, 0, 'speak', 'e')] },

  // ------------------------------------------------------------------------------ the crossing: the eighteen and the boats
  { id: 'crossing-hold', scene: 'crossing', from: on(0, 12), to: on(0, 16), card: CARD_CROSSING, talk: CROSSING_HOLD, seenFrom: ['gonzales', 'ford'],
    people: eighteenAt('crossing', ['idle', P.point, 'speak', 'idle', 'listen', 'idle']), props: CROSSING_PROPS() },
  { id: 'crossing-swimmer', scene: 'crossing', from: on(0, 16), to: on(0, 18), card: CARD_CROSSING, talk: CROSSING_SWIMMER, seenFrom: ['gonzales', 'ford'],
    people: eighteenAt('crossing', [P.point, 'speak', 'speak', 'listen', 'idle', 'idle']), props: CROSSING_PROPS() },
  { id: 'crossing-night', scene: 'crossing', from: on(0, 18), to: on(1, 7), card: CARD_CROSSING, talk: CROSSING_NIGHT, seenFrom: ['gonzales', 'ford'],
    people: eighteenAt('crossing', ['idle', 'speak', 'listen', 'idle', 'rest', 'rest']), props: [...CROSSING_PROPS(), { kind: 'fire', place: 'crossing', dx: -0.004, dy: 0.02 }] },
  { id: 'crossing-watch', scene: 'crossing', from: on(1, 7), to: on(1, 16), card: CARD_CROSSING, talk: CROSSING_WATCH, seenFrom: ['gonzales', 'ford'],
    people: eighteenAt('crossing', ['idle', 'speak', 'listen', P.point, 'idle', 'idle']), props: CROSSING_PROPS() },
  { id: 'crossing-reading', scene: 'crossing', from: on(1, 16), to: on(1, 18), card: CARD_READING, talk: CROSSING_READING, seenFrom: ['gonzales', 'ford'],
    people: [...eighteenAt('crossing', ['listen', 'idle', 'idle', 'listen', 'idle', 'idle']),
      at('gz-clements', 'crossing', -0.01, -0.006, 'speak', 'river'), at('gz-reader-1', 'crossing', 0.004, -0.004, 'listen', 'river'), at('gz-reader-2', 'crossing', 0.012, 0.004, 'listen', 's'), at('gz-mr-smith', 'crossing', -0.022, 0.002, 'listen', 'river')],
    props: CROSSING_PROPS() },
  { id: 'crossing-after', scene: 'crossing', from: on(1, 18), to: on(2, 10), card: CARD_CROSSING, talk: CROSSING_WATCH, seenFrom: ['gonzales', 'ford'],
    people: eighteenAt('crossing', ['idle', 'listen', 'speak', 'idle', 'rest', 'idle']), props: CROSSING_PROPS() },
  { id: 'crossing-gone', scene: 'crossing', from: on(2, 10), to: on(2, 19), card: CARD_CROSSING, talk: CROSSING_GONE, seenFrom: ['gonzales', 'ford'],
    people: eighteenAt('crossing', [P.point, 'speak', 'speak', 'listen', 'idle', 'idle']), props: [...CROSSING_PROPS(), { kind: 'flatboat', place: 'crossing', dx: 0.03, dy: 0.018 }] },
  // ceiling: the men go over from seven to half past eight, as Macomb and Mason have it (`HIST-TEX-465`), while the director's
  // own crossing moment, when the fight's engine takes them up, is ten o'clock (sim/directors.mjs `crossing`, the fight's
  // `GONZALES_START`); the upriver call opens at six (`upriver-call`). Both are true that night: the force waited at Mrs.
  // DeWitt's house across the river until about one. The fight's research also puts the crossing at about seven.
  { id: 'crossing-over', scene: 'crossing', from: on(2, 19), to: on(2, 22), card: CARD_CROSSING_OVER, talk: CROSSING_OVER, seenFrom: ['gonzales', 'ford'],
    people: [at('gz-eighteen-1', 'crossing', 0.02, 0.004, 'speak', 'river'),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ ...going(`gz-volunteer-${n}`, 'muster', 'crossing', [on(2, 19), on(2, 20, 30)], { face: 'river', stays: true }), ...(n === 1 && { carries: 'flag' }) })),
    ],
    props: [{ kind: 'breastwork', place: 'crossing', dx: -0.01, dy: 0.006 }, { kind: 'flatboat', place: 'crossing', dx: -0.02, dy: 0.02 },
      { id: 'gz-cannon', kind: 'cannon', going: { path: ['muster', 'crossing'], span: [on(2, 19), on(2, 20, 30)] }, dx: 0.012, dy: 0.03 }] },

  // ------------------------------------------------------------------------------- the dragoons on the far bank
  { id: 'camp-mound', scene: 'camp', from: on(0, 12), to: on(2, 10), card: CARD_CAMP, seenFrom: ['gonzales', 'ford'],
    people: [1, 2, 3, 4, 5, 6].map(n => at(`gz-dragoon-${n}`, 'camp', ((n % 3) - 1) * 0.02, Math.floor((n - 1) / 3) * 0.018, 'idle', n % 2 ? 'e' : 's')),
    props: [{ kind: 'tent', place: 'camp', dx: -0.04, dy: -0.02 }, { kind: 'tent', place: 'camp', dx: 0.035, dy: -0.024 }, { kind: 'fire', place: 'camp', dx: 0, dy: 0.04 }] },
  { id: 'camp-leaves', scene: 'camp', from: on(2, 10), to: on(2, 12), card: CARD_CAMP, seenFrom: ['gonzales', 'ford'],
    people: [1, 2, 3, 4, 5, 6].map(n => going(`gz-dragoon-${n}`, 'camp', 'upriver', [on(2, 10), on(2, 11, 30)])) },

  // ------------------------------------------------------------------------------- the cannon: dug up, and put on wheels
  { id: 'orchard-hidden', scene: 'cannon', from: on(0, 12), to: on(1, 8), card: CARD_ORCHARD, props: [{ kind: 'ploughed', place: 'orchard', dx: 0, dy: 0 }] },
  { id: 'orchard-dig', scene: 'cannon', from: on(1, 8), to: on(1, 12), card: CARD_ORCHARD, talk: ORCHARD_DIG,
    people: [at('gz-smith-1', 'orchard', -0.016, 0.002, P.dig, 'e'), at('gz-smith-2', 'orchard', 0.016, 0.004, P.dig, 'w'), at('gz-smith-3', 'orchard', 0, 0.016, 'speak', 'n')],
    props: [{ kind: 'cannon-buried', place: 'orchard', dx: 0, dy: 0.002 }], help: 'cannon' },
  { id: 'shop-mount', scene: 'cannon', from: on(1, 12), to: on(2, 17), card: CARD_SHOP, talk: SHOP_WORK,
    people: [going('gz-smith-1', 'orchard', 'shop', [on(1, 12), on(1, 13)], { pose: P.forge, face: 'e', stays: true }), going('gz-smith-2', 'orchard', 'shop', [on(1, 12), on(1, 13)], { pose: P.forge, face: 'w', stays: true }),
      going('gz-smith-3', 'orchard', 'shop', [on(1, 12), on(1, 13)], { pose: 'speak', face: 'e', stays: true }), at('gz-smith-4', 'shop', 0.03, 0.012, P.forge, 'w')],
    offsets: { 'gz-smith-1': [-0.018, 0.004], 'gz-smith-2': [0.016, 0.006], 'gz-smith-3': [-0.004, 0.02] },
    props: [{ id: 'gz-cannon', kind: 'cannon', going: { path: ['orchard', 'shop'], span: [on(1, 12), on(1, 13)] }, dx: 0, dy: 0.004 }, { kind: 'wheel', place: 'shop', dx: 0.04, dy: -0.004 }], help: 'cannon' },
  { id: 'cannon-to-muster', scene: 'cannon', from: on(2, 17), to: on(2, 19), card: CARD_SHOP, talk: SHOP_WORK.slice(1, 2),
    people: [going('gz-smith-1', 'shop', 'muster', [on(2, 17), on(2, 18)], { stays: true, face: 'e' }), going('gz-smith-3', 'shop', 'muster', [on(2, 17), on(2, 18)], { stays: true, face: 'e' })],
    offsets: { 'gz-smith-1': [-0.03, 0.03], 'gz-smith-3': [-0.02, 0.036] },
    props: [{ id: 'gz-cannon', kind: 'cannon', going: { path: ['shop', 'muster'], span: [on(2, 17), on(2, 18)] }, dx: -0.025, dy: 0.03 }] },

  // ------------------------------------------------------------------------------- the flag
  { id: 'flag-cloth', scene: 'flag', from: on(1, 14), to: on(2, 12), card: CARD_FLAG, talk: FLAG_WORK, help: 'flag',
    people: [going('gz-townswoman-3', 'street', 'flagHouse', [on(1, 14), on(1, 15)], { pose: P.paint, face: 'e', stays: true }),
      going('gz-townswoman-5', 'street', 'flagHouse', [on(1, 16), on(1, 17)], { pose: P.paint, face: 'w', stays: true }),
      at('gz-townswoman-6', 'flagHouse', 0.004, 0.02, 'speak', 'n'), at('gz-townswoman-4', 'flagHouse', -0.03, 0.012, P.haul, 'e'), at('gz-girl-2', 'flagHouse', 0.026, 0.016, 'idle', 'w')],
    offsets: { 'gz-townswoman-3': [-0.018, 0.002], 'gz-townswoman-5': [0.018, 0.002] },
    props: [{ kind: 'table', place: 'flagHouse', dx: 0, dy: 0 }, { kind: 'flag-work', place: 'flagHouse', dx: 0, dy: 0, stage: 'cloth' }] },
  { id: 'flag-painted', scene: 'flag', from: on(2, 12), to: on(2, 17), card: CARD_FLAG, talk: FLAG_DONE, help: 'flag',
    people: [at('gz-townswoman-3', 'flagHouse', -0.018, 0.002, 'idle', 'e'), at('gz-townswoman-5', 'flagHouse', 0.018, 0.002, 'speak', 'w'),
      at('gz-townswoman-6', 'flagHouse', 0.004, 0.02, 'listen', 'n'), at('gz-townswoman-4', 'flagHouse', -0.03, 0.012, 'speak', 'e')],
    props: [{ kind: 'table', place: 'flagHouse', dx: 0, dy: 0 }, { kind: 'flag-work', place: 'flagHouse', dx: 0, dy: 0, stage: 'done' }] },
  { id: 'flag-carried', scene: 'flag', from: on(2, 17), to: on(2, 19), card: CARD_FLAG, talk: FLAG_DONE.slice(1),
    people: [{ ...going('gz-townswoman-4', 'flagHouse', 'muster', [on(2, 17), on(2, 18)], { stays: true, face: 'e' }), carries: 'flag' }],
    offsets: { 'gz-townswoman-4': [0.03, 0.02] } },

  // ------------------------------------------------------------------------------- the men who came in
  { id: 'muster-night', scene: 'muster', from: on(0, 20), to: on(1, 8), card: CARD_MUSTER, talk: MUSTER_ARRIVING,
    people: [1, 2, 3, 4].map(n => going(`gz-mounted-${n}`, 'eastEdge', 'muster', [on(0, 20 + (n - 1)), on(0, 21 + (n - 1))], { face: 'w', stays: true })).concat(
      [1, 2, 3].map(n => going(`gz-volunteer-${n}`, 'eastEdge', 'muster', [on(0, 20), on(0, 22)], { face: 'w', stays: true })), [at('gz-reader-1', 'muster', -0.03, 0.01, 'speak', 'e')]),
    offsets: musterOffsets() },
  { id: 'muster-day', scene: 'muster', from: on(1, 8), to: on(2, 17), card: CARD_MUSTER, talk: MUSTER_WAITING,
    people: [at('gz-townswoman-7', 'muster', -0.05, 0.03, P.haul, 'e'), ...[1, 2, 3].map(n => at(`gz-volunteer-${n}`, 'muster', ...musterOffsets()[`gz-volunteer-${n}`], n === 1 ? 'speak' : 'listen', n === 1 ? 'e' : 's')),
      ...[4, 5, 6, 7, 8, 9, 10].map(n => going(`gz-volunteer-${n}`, 'eastEdge', 'muster', [on(1, 8 + (n - 4) * 2), on(1, 9 + (n - 4) * 2)], { face: n % 2 ? 'e' : 'w', stays: true })),
      ...[1, 2, 3, 4].map(n => at(`gz-mounted-${n}`, 'muster', 0.05 + (n % 2) * 0.03, -0.045 + Math.floor((n - 1) / 2) * 0.03, 'idle', n % 2 ? 'e' : 'w'))],
    offsets: musterOffsets() },
  { id: 'muster-rider-1', scene: 'rider', from: on(1, 12), to: on(1, 14), card: CARD_MUSTER, talk: MUSTER_OUT,
    people: [going('gz-rider-1', 'muster', 'eastEdge', [on(1, 12, 30), on(1, 13, 30)], { face: 'e' })] },
  { id: 'muster-rider-2', scene: 'rider', from: on(2, 12), to: on(2, 14), card: CARD_MUSTER,
    people: [going('gz-rider-2', 'muster', 'eastEdge', [on(2, 12, 30), on(2, 13, 30)], { face: 'e' })] },
  { id: 'muster-decided', scene: 'muster', from: on(2, 17), to: on(2, 19), card: CARD_MUSTER_DECIDED, talk: MUSTER_DECIDED,
    people: [...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => at(`gz-volunteer-${n}`, 'muster', ...musterOffsets()[`gz-volunteer-${n}`], n <= 3 ? 'speak' : 'listen', n % 2 ? 'e' : 's'))],
    residents: [at('town-tavern-gonzales', null, 0, 0, 'listen', 's')] },
  // The men go down to the ferry: the `crossing-over` beat walks them there.
  { id: 'muster-march', scene: 'muster', from: on(2, 19), to: on(2, 20), card: CARD_MUSTER_DECIDED, talk: MUSTER_MARCH, people: [] },

  // ------------------------------------------------------------------------------- families leaving
  { id: 'leaving-load', scene: 'leaving', from: on(0, 13), to: on(0, 17), card: CARD_LEAVING, talk: LEAVING,
    people: [at('gz-family-father', 'leavingHouse', 0.02, 0.012, P.haul, 'e'), at('gz-family-mother', 'leavingHouse', -0.004, 0.016, P.haul, 'e'), at('gz-family-girl', 'leavingHouse', -0.02, 0.02, 'idle', 's'), at('gz-family-boy', 'leavingHouse', 0.004, 0.028, 'idle', 'e')],
    props: [{ kind: 'wagon', place: 'leavingHouse', dx: 0.05, dy: 0.018 }, { kind: 'bundles', place: 'leavingHouse', dx: 0.03, dy: 0.03 }] },
  { id: 'leaving-go', scene: 'leaving', from: on(0, 17), to: on(0, 19), card: CARD_LEAVING, talk: LEAVING.slice(1),
    people: ['gz-family-father', 'gz-family-mother', 'gz-family-girl', 'gz-family-boy'].map((id, n) => going(id, 'leavingHouse', 'eastEdge', [on(0, 17, n * 5), on(0, 18, 20 + n * 5)], { face: 'e' })),
    props: [{ kind: 'wagon', going: { path: ['leavingHouse', 'eastEdge'], span: [on(0, 17), on(0, 18, 20)] }, dx: 0.05, dy: 0.018 }] },
  { id: 'hiding', scene: 'leaving', from: on(1, 9), to: on(1, 12), card: CARD_HIDING, talk: HIDING,
    people: [going('gz-hiding-mother', 'street', 'bottoms', [on(1, 9), on(1, 11)], { pose: P.haul, face: 'w' }), going('gz-hiding-boy', 'street', 'bottoms', [on(1, 9, 5), on(1, 11, 5)], { face: 'w' })] },
]);
function eighteenAt(place, poses) {
  return [1, 2, 3, 4, 5, 6].map(n => at(`gz-eighteen-${n}`, place, ((n - 1) % 3 - 1) * 0.018 + (n > 3 ? 0.009 : 0), (n > 3 ? 0.02 : 0), poses[n - 1], poses[n - 1] === 'rest' ? 's' : 'river'));
}
function CROSSING_PROPS() {
  return [{ kind: 'breastwork', place: 'crossing', dx: -0.01, dy: 0.006 }, { kind: 'skiff', place: 'crossing', dx: 0.03, dy: 0.016 }, { kind: 'skiff', place: 'crossing', dx: 0.04, dy: 0.028 }];
}
function musterOffsets() {
  return Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => [`gz-volunteer-${n}`, [((n - 1) % 5 - 2) * 0.016, Math.floor((n - 1) / 5) * 0.02]])
    .concat([1, 2, 3, 4].map(n => [`gz-mounted-${n}`, [0.05 + (n % 2) * 0.03, -0.045 + Math.floor((n - 1) / 2) * 0.03]])));
}

/**
 * What the family's own person may do in a scene (`FIC-GONZ-412`): lend a hand, if they are standing in Gonzales and are the
 * kind of person the record has doing it. The flag's cloth came from the women of the town (`HIST-TEX-468`) and women
 * supplied and clothed the men (`HIST-TEX-009`); the gun was fitted and its shot forged by men at the blacksmith's
 * (`HIST-TEX-466`), and no woman is recorded there.
 */
export const HELP = Object.freeze({
  flag: {
    label: 'Help with the flag', pose: P.paint, ask: 'The women at the table would take a hand with the cloth.',
    may: entity => sexOf(entity) === 'female' && !tooYoung(entity),
    why: entity => tooYoung(entity) ? `${entity.name} is too young.` : `The women of the town are making the flag; ${entity.name} could help the men at the blacksmith's instead.`,
    spots: [[-0.03, 0.022], [0.03, 0.024], [0.012, 0.03]], place: 'flagHouse',
    done: name => `${name} helped the women of Gonzales with the flag the men would carry.`,
  },
  cannon: {
    label: 'Help with the gun', pose: P.forge, ask: 'The men getting the cannon ready could use another pair of hands.',
    // A grown man or a youth old enough to answer a call. By `sexOf`, which reads a founding parent's sex from the role, as
    // `canFight` (sim/family.mjs) does not.
    may: entity => canAnswerCalls(entity) && sexOf(entity) === 'male',
    why: entity => `The men of the town are getting the gun ready; ${entity.name} could help the women with the flag instead.`,
    spots: [[0.028, 0.02], [-0.03, 0.022], [0.006, 0.03]], place: null,
    done: name => `${name} helped the men of Gonzales dig up the cannon and fit it to its wheels.`,
  },
});

/** Whether the town's scenes are running at all: the first period of a class with a director and a Gonzales. */
const inPlay = world => Boolean(world.director && (world.period ?? 1) === 1 && world.map?.sites?.gonzales);
/** The beats running now (one a scene at most). */
export function activeBeats(world, at = sceneClock(world)) {
  if (!inPlay(world)) return [];
  return TOWN_BEATS.filter(beat => at >= beat.from && at < beat.to);
}

const round = value => Math.round(value * 1e4) / 1e4;
const faceOf = (world, face) => (face === 'river' ? riverward(world) : face);
function pointAt(world, place, dx = 0, dy = 0) {
  const town = world.map.sites.gonzales, p = placeOf(world, place);
  return { x: round(town.x + p.x + dx), y: round(town.y + p.y + dy) };
}
/** Where somebody going somewhere is at `now`, along their path of places between the two moments of their span. */
function alongPath(world, path, span, now, dx, dy) {
  const f = Math.max(0, Math.min(1, (now - span[0]) / Math.max(1, span[1] - span[0])));
  const points = path.map(place => pointAt(world, place, dx, dy));
  const legs = points.slice(1).map((b, i) => Math.hypot(b.x - points[i].x, b.y - points[i].y));
  let left = f * legs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < legs.length; i++) {
    if (left <= legs[i] || i === legs.length - 1) {
      const t = legs[i] ? Math.min(1, left / legs[i]) : 1, a = points[i], b = points[i + 1];
      return { x: round(a.x + (b.x - a.x) * t), y: round(a.y + (b.y - a.y) * t), moving: f > 0 && f < 1 };
    }
    left -= legs[i];
  }
  return { ...points.at(-1), moving: false };
}
/** Every person of a beat where they are at `now`: the scene's own people, drawn by the page. */
function beatPeople(world, beat, now) {
  const people = [];
  (beat.people || []).forEach((one, index) => {
    const cast = TOWN_CAST[one.id];
    if (!cast) return;
    // Somebody going somewhere with no place of their own set is kept a step apart from the others going with them.
    const [ox, oy] = beat.offsets?.[one.id] || (one.going ? [((index % 5) - 2) * 0.014, Math.floor(index / 5) * 0.016] : [one.dx || 0, one.dy || 0]);
    let spot, moving = false, waiting = false;
    if (one.going) {
      if (now < one.going.span[0]) { spot = pointAt(world, one.going.path[0], ox, oy); waiting = true; }
      else if (now >= one.going.span[1] && !one.stays) return;
      else ({ moving, ...spot } = alongPath(world, one.going.path, one.going.span, now, ox, oy));
    } else spot = pointAt(world, one.place, ox, oy);
    // What a person is called (`label`) stays here: the page draws the figure and the card tells the scene, and a line of
    // description for each of forty people was a tenth of the snapshot.
    people.push({ id: one.id, sceneId: beat.scene, ...(cast.name && { name: cast.name }), figure: cast.figure,
      ...(cast.rides && { rides: true }), ...(cast.small && { small: cast.small }), ...(one.carries && { carries: one.carries }),
      x: spot.x, y: spot.y, pose: moving || waiting ? 'idle' : one.pose || 'idle', face: faceOf(world, one.face || 's') });
  });
  return people;
}
function beatProps(world, beat, now) {
  return (beat.props || []).map((prop, index) => {
    const spot = prop.going ? alongPath(world, prop.going.path, prop.going.span, now, prop.dx || 0, prop.dy || 0) : pointAt(world, prop.place, prop.dx || 0, prop.dy || 0);
    return { id: prop.id || `${beat.id}:${index}`, kind: prop.kind, x: spot.x, y: spot.y, ...(prop.stage && { stage: prop.stage }), face: faceOf(world, prop.face || 'river') };
  });
}
/** The town's invented people a beat places (sim/town.mjs `RESIDENTS`): where it puts each, as a world point, or null. */
export function residentSpot(world, id, now = sceneClock(world)) {
  for (const beat of activeBeats(world, now)) {
    const one = (beat.residents || []).find(entry => entry.id === id && entry.place);
    if (one) return pointAt(world, one.place, one.dx, one.dy);
  }
  return null;
}
/** Whoever a household has standing in `siteId`, not on the road. */
const standingIn = (world, household) => new Set(household.members.map(id => world.entities[id]).filter(entity => entity && !entity.travel && entity.location?.siteId).map(entity => entity.location.siteId));

/**
 * What this page may see of the town's scenes now, or null. A student sees a beat only while one of the family is standing
 * where it can be seen from; the Host sees every beat. The words are this tick's exchange of each beat seen, and only
 * those whose speaker is there to say them.
 */
export function townScenesFor(world, householdId, role) {
  const beats = activeBeats(world);
  if (!beats.length) return null;
  const host = role === 'host';
  const household = householdId ? world.households[householdId] : null;
  if (!host && !household) return null;
  const places = host ? null : standingIn(world, household);
  const seen = host ? beats : beats.filter(beat => (beat.seenFrom || ['gonzales']).some(siteId => places.has(siteId)));
  if (!seen.length) return null;
  const now = sceneClock(world);
  const people = seen.flatMap(beat => beatPeople(world, beat, now));
  const drawn = new Set(people.map(person => person.id));
  // The town's own people a beat has doing something, and the family's own people helping: turned and posed where they
  // stand. Only anybody standing in Gonzales now, as `observedBy` would show them.
  const poses = {};
  const inTown = entity => entity && !entity.travel && entity.location?.siteId === 'gonzales' && entity.health?.condition === 'well';
  for (const beat of seen) {
    for (const one of beat.residents || []) {
      if (!inTown(world.entities[one.id])) continue;
      poses[one.id] = { pose: one.pose || 'idle', face: faceOf(world, one.face || 's'), sceneId: beat.scene };
      drawn.add(one.id);
    }
  }
  for (const entity of Object.values(world.entities)) {
    const helping = entity.townHelp && seen.find(beat => beat.id === entity.townHelp.beatId || (beat.scene === entity.townHelp.sceneId && beat.help));
    if (!helping || !inTown(entity)) continue;
    poses[entity.id] = { pose: HELP[helping.help]?.pose || 'idle', face: 'e', sceneId: helping.scene };
  }
  const lines = [];
  for (const beat of seen) {
    const talk = beat.talk || [];
    if (!talk.length) continue;
    // ceiling: one exchange a tick, whatever the tick is worth: at the news scale an hour of the town passes between two
    // exchanges, and on the night of October 1 (the farming scale) twenty minutes. Talk paced by the calendar would want a
    // line's own length in minutes.
    const exchange = talk[world.tick % talk.length];
    exchange.forEach(([speakerId, text, extra = {}], index) => {
      if (!drawn.has(speakerId)) return;
      lines.push({ id: `${beat.id}:${world.tick}:${index}`, sceneId: beat.scene, speakerId, text, kind: extra.kind || 'reconstructed',
        ...(extra.claimId && { claimId: extra.claimId }), ...(extra.gloss && { gloss: extra.gloss }) });
    });
  }
  const scenes = seen.map(beat => {
    const anchor = beatAnchor(world, beat, now);
    return { id: beat.scene, beat: beat.id, title: beat.card?.title || beat.scene, x: anchor.x, y: anchor.y };
  });
  // ceiling: every card seen rides on every snapshot - 5 to 8 KB while a family has somebody in the town, on a snapshot of
  // about 30 - so a click opens one at once with no round trip. A card fetched when it is clicked (a `/api/` route answering
  // from this same function) is the way out if the classroom's network is ever measured short.
  const cards = Object.fromEntries(seen.filter(beat => beat.card).map(beat => [beat.scene, beat.card]));
  const help = host ? {} : helpFor(world, household, seen);
  return { siteId: 'gonzales', scenes, people, props: seen.flatMap(beat => beatProps(world, beat, now)), lines, poses, cards, help };
}
/** Where a scene is, for a click: the middle of its people and props now. */
function beatAnchor(world, beat, now) {
  const points = [...beatPeople(world, beat, now), ...beatProps(world, beat, now)];
  if (!points.length) return pointAt(world, beat.people?.[0]?.place || 'street');
  return { x: round(points.reduce((sum, p) => sum + p.x, 0) / points.length), y: round(points.reduce((sum, p) => sum + p.y, 0) / points.length) };
}
/** The family's people who could lend a hand in each scene seen now, each with whether they may and why not. */
function helpFor(world, household, seen) {
  const out = {};
  for (const beat of seen) {
    const kind = beat.help && HELP[beat.help];
    if (!kind) continue;
    const people = household.members.map(id => world.entities[id]).filter(entity => entity?.kind === 'person' && !entity.travel && entity.location?.siteId === 'gonzales');
    if (!people.length) continue;
    out[beat.scene] = { kind: beat.help, label: kind.label, ask: kind.ask, people: people.map(entity => {
      const refusal = helpRefusal(world, entity, beat);
      return { id: entity.id, name: entity.name, can: !refusal, ...(refusal && { why: refusal }), ...(entity.townHelp?.sceneId === beat.scene && { helping: true }) };
    }) };
  }
  return out;
}
function helpRefusal(world, entity, beat) {
  const kind = HELP[beat.help];
  if (!kind) return 'Nobody is asking for help here.';
  if (['dead', 'captured'].includes(entity.health?.condition)) return `${entity.name} cannot.`;
  if (entity.health?.condition && entity.health.condition !== 'well' && entity.health.condition !== 'tired') return `${entity.name} is not well enough.`;
  if (entity.chore) return `${entity.name} is busy.`;
  if (!kind.may(entity)) return kind.why(entity);
  return null;
}

/**
 * The family's person lends a hand (`FIC-GONZ-412`): goes over to the scene and works there until the work is done, they are
 * sent somewhere or set to something else. It changes nothing of the history - the flag is made and the gun fitted whether
 * anybody helps or not - and what it leaves is the family's own memory of having helped.
 */
// ceiling: the family's panel does not light an icon for somebody helping, because helping is not a chore (sim/chores.mjs);
// the person is drawn at the work and the card says they are helping. Making it a chore is the way out if students lose
// track of who is where.
export function helpTownScene(world, household, entity, sceneId) {
  const beat = activeBeats(world).find(one => one.scene === sceneId && one.help);
  if (!beat) throw new Error('Nobody in Gonzales is asking for help with that now.');
  if (entity.travel || entity.location?.siteId !== 'gonzales') throw new Error(`${entity.name} is not in Gonzales.`);
  const refusal = helpRefusal(world, entity, beat);
  if (refusal) throw new Error(refusal);
  if (entity.townHelp?.sceneId === sceneId) return;
  const kind = HELP[beat.help];
  const helpers = Object.values(world.entities).filter(other => other.townHelp?.sceneId === sceneId).length;
  const [dx, dy] = kind.spots[helpers % kind.spots.length];
  // Where the work is: the flag's table, or wherever the gun is now - the orchard or the shop.
  const place = kind.place || (beat.people?.find(one => one.place)?.place) || beat.people?.[0]?.going?.path.at(-1) || 'shop';
  const spot = pointAt(world, place, dx, dy);
  entity.location = { x: spot.x, y: spot.y, siteId: 'gonzales' };
  entity.townHelp = { sceneId, kind: beat.help, since: world.minute };
  record(world, 'town-help', { householdId: household.id, actorId: entity.id, text: `${entity.name} went to lend a hand.`, claimId: 'FIC-GONZ-412' });
}

/**
 * Each tick: the town's invented people go where the beats put them (sim/town.mjs calls this for its `RESIDENTS`), and
 * anybody helping who has been sent elsewhere, set to other work, or whose work is finished stops - and the family keeps the
 * memory of it.
 */
export function advanceTownScenes(world) {
  for (const entity of Object.values(world.entities)) {
    if (!entity.townHelp) continue;
    const beat = activeBeats(world).find(one => one.scene === entity.townHelp.sceneId && one.help);
    const still = beat && !entity.travel && entity.location?.siteId === 'gonzales' && !entity.chore && ['well', 'tired'].includes(entity.health?.condition || 'well');
    if (still) continue;
    const kind = HELP[entity.townHelp.kind];
    record(world, 'consequence', { householdId: entity.householdId, actorId: entity.id, importance: 2, claimId: 'FIC-GONZ-412', text: kind ? kind.done(entity.name) : `${entity.name} helped in Gonzales.` });
    delete entity.townHelp;
  }
}
