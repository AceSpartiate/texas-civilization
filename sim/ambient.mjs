// Ambient life: what the people nobody has given anything to do are doing, and what they say to each other (docs/AMBIENT.md).
//
// Owner, 2026-09-28, verbatim: "introduce "chatter" while you're at it. i don't want to see npc just standing around when they're
// idle. they should participate in various things to make them appear active. they should talk to each other too via chat
// bubbles over their heads, very short, easy to read sentences."
//
// **A picture, never a cause.** Nothing here is stored and nothing here is read by the simulation: every activity, every pair
// of neighbours and every line is recomputed from the class seed, the tick and what the page may see, inside the projection
// (sim/world.mjs `projectWorld`). A class replays the same; a class saved before this opens exactly as it was, with no save
// version moved; and stepping a world gives the same world whether or not anybody ever projected it
// (tests/ambient.test.mjs holds all three). Whittling feeds nobody and a keeper's visit to a neighbour sells nothing.
//
// **Who.** Every person a page can see who would otherwise be drawn standing idle: the towns' keepers and residents, the
// family's own grown people and youths with nothing ordered, other families' people glimpsed where the family is standing,
// soldiers idle in camp (the 1835 force on its halted march, Houston's army, the garrison at Béxar), families halted or
// camped on the road east. Never the student's own person (`principal`: the one a student directs stands ready for an
// order), never a rider or a runner (they carry word), never anybody hurt, sick, taken, in a fight, called aside by a child,
// listening to a rider or posed by one of the towns' dated scenes (sim/town-scenes.mjs, whose own people and words win).
// The family's own small children and babies are sim/childhood.mjs's and sim/babies.mjs's, never this file's.
//
// **Only the idle.** Somebody with work of their own gets nothing here, on any page: they are drawn at the work however the
// page draws work (the coordinator's word of 2026-09-28, for the parallel build that draws people at work), and their work is
// never read to choose anything. An activity is chosen from the seed, the place, the hour and the weather alone.
//
// **Talk.** Two people near each other, or a townsperson who walks over to a neighbour, sometimes say two short lines
// (`EXCHANGES`, `FIC-GONZ-821`): eight words at most, plain words for a middle-school reader, of the place, the season, the
// weather and the hour. War news is said **only** when every one of them could know it: the viewing family must have heard
// it (sim/knowledge.mjs), a speaker of a family must have heard it, and a townsperson or a soldier has it only once word
// could have walked to them (`WORD_MILES_A_DAY`, `FIC-GONZ-822`). Every line is `reconstructed` and every speaker is an
// invented or unnamed person: no named historical person is ever given a line here (docs/BATTLES.md §2.5, §6.5).
import { stirredShare } from './shares.mjs';
import { dateOf } from './clock.mjs';
import { weatherAt } from './weather.mjs';
import { bandOf, sexOf } from './family.mjs';
import { townsfolkSex } from './town.mjs';
import { isSmallChild } from './childhood.mjs';
import { heldByBattle } from './battle-stage.mjs';
import { activeBeats } from './town-scenes.mjs';
import { roadGroups } from './start-story.mjs';

/** The activities are invented for the game; the chatter's words are reconstructed; how far the war's word has walked. */
export const AMBIENT_CLAIM = 'FIC-GONZ-820', CHATTER_CLAIM = 'FIC-GONZ-821', HEARSAY_CLAIM = 'FIC-GONZ-822', CROWD_CLAIM = 'FIC-GONZ-823';
/** Ticks one activity lasts before a person turns to another: about a minute at the Study pace (9.5 s a tick). */
export const SLOT_TICKS = 6;
/** Closer than this, in miles, two people can talk where they stand (a yard's width, or two cabins' doors on one street). */
export const NEAR_MILES = 0.035;
/** A townsperson walks at most this far to a neighbour's door to pass the time. */
export const VISIT_MILES = 0.3;
/** At most this many townspeople of one town are away at a neighbour's door at once, so a street never empties. */
export const VISITS_A_TOWN = 2;
/** The share of possible pairs keeping company in a spell, and the share of those saying something on a tick. */
export const COMPANY_SHARE = 0.55, TALK_SHARE = 0.4;
/**
 * At most this many exchanges are sent to a student's page on a tick, and to the Host's across the whole class (the Host's
 * page draws only what is on its screen, and at most `ON_SCREEN` bubbles of it at once, public/ambient.js).
 */
export const PAGE_EXCHANGES = 2, HOST_EXCHANGES = 12;
/** How short a line is: eight words, and never more than 48 characters (owner: "very short, easy to read sentences"). */
export const LINE_WORDS = 8, LINE_CHARS = 48;
/**
 * How fast word of a thing walks to townspeople and soldiers nobody has told: the same fifteen miles a day word of a sickness
 * goes along the road (sim/disease.mjs `WORD_MILES_A_DAY`), and a quarter of a day before anybody hears it at all.
 * ceiling: word spreads in a circle from where the thing happened, over rivers and roads alike; a rider's actual road
 * (sim/encounters.mjs) is the way out if a class ever sees a townsperson talk of news before the rider who carries it comes.
 */
export const WORD_MILES_A_DAY = 15, WORD_FIRST_MINUTES = 360;
/** Men drawn in a camp at most: public/army-view.js `CAMP_MEN` (tests/ambient.test.mjs holds them equal). */
export const CAMP_MEN = 18;
/** How many people of the crowd camped at a refuge are drawn: a picture of the thousands the record has, not a count. */
export const REFUGE_CROWD = 6;

const DAY = 1440;
const GONE = ['dead', 'captured'];
const SETTINGS = Object.freeze(['home', 'town', 'camp', 'refuge', 'road', 'garrison']);
const ALL = SETTINGS;
const WAKING = Object.freeze(['morning', 'day', 'evening']);

/** The part of the day: night is 9 in the evening to 6 in the morning. */
export function hourBand(world) {
  const hour = dateOf(world, world.minute).getUTCHours();
  return hour < 6 || hour >= 21 ? 'night' : hour < 9 ? 'morning' : hour < 17 ? 'day' : 'evening';
}
/** The season of the class's calendar (September 1835 to spring 1836). */
export function seasonOf(world) {
  const month = dateOf(world, world.minute).getUTCMonth();
  return month >= 8 && month <= 10 ? 'autumn' : month === 11 || month <= 1 ? 'winter' : 'spring';
}

// ---------------------------------------------------------------------------------------------------------------------------
// The activities
// ---------------------------------------------------------------------------------------------------------------------------
/**
 * What a person may be seen doing, drawn in one of the delivered cast poses (docs/ART_MANIFEST.md: `repair` seated working a
 * thing in the hands, `care` kneeling with a cloth, `rest` seated on a stool, `carry` walking with a load, `sow` crouched
 * scattering from a bag, `search` looking hard, `trade` holding out a purse, `work` the hoe's swing, `speak` a gesture).
 *
 * `where` the settings it belongs to, `hours` when, `who` whom (`man`, `woman`, `grown` - the default - or `child`), `dry` not
 * in the rain, `keeper` a townsperson's only, `pace` walked back and forth a few steps (a load carried), `prop` a thing drawn
 * beside them, `social` done by two together. `standIn` names the pose the library lacks.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-28 - ambient life, item 1: until each `standIn` pose lands the nearest delivered
 * pose stands in (public/motion.js `ambientClip`).
 *
 * Never on a family's people: `work` and `sow` without the hens, which read as the field's own work a student orders
 * (`homeSafe`), so an idle man is never taken for somebody already hoeing.
 */
const act = (doing, pose, options = {}) => Object.freeze({ doing, pose, where: ALL, hours: WAKING, who: 'grown', ...options });
export const ACTIVITIES = Object.freeze({
  whittle: act('whittling', 'repair', { standIn: 'whittle' }),
  harness: act('mending harness', 'repair', { where: ['home', 'town', 'refuge', 'road', 'camp'], who: 'man', hours: ['morning', 'day'], standIn: 'harness' }),
  mend: act('mending clothes', 'repair', { where: ['home', 'refuge', 'road', 'camp', 'garrison'], standIn: 'sew' }),
  shell: act('shelling corn', 'repair', { where: ['home', 'refuge', 'road'], standIn: 'shell' }),
  rifle: act('cleaning a rifle', 'repair', { where: ['home', 'camp', 'garrison'], who: 'man', standIn: 'rifle' }),
  wash: act('washing clothes', 'care', { where: ['home', 'refuge', 'road', 'town'], hours: ['morning', 'day'], dry: true, prop: 'bucket', standIn: 'wash' }),
  fire: act('tending the fire', 'care', { hours: ['morning', 'evening', 'night'], where: ['home', 'camp', 'refuge', 'road', 'garrison'], prop: 'fire' }),
  cook: act('cooking', 'care', { hours: ['morning', 'evening'], where: ['home', 'camp', 'refuge', 'road', 'garrison'], prop: 'pot' }),
  water: act('carrying water', 'carry', { where: ['home', 'town', 'refuge', 'camp'], pace: true, standIn: 'water' }),
  wood: act('carrying firewood', 'carry', { where: ['home', 'camp', 'refuge', 'garrison'], pace: true, prop: 'firewood', standIn: 'firewood' }),
  hens: act('feeding the hens', 'sow', { where: ['home', 'town'], hours: ['morning', 'evening'], dry: true, prop: 'hens' }),
  pipe: act('smoking a pipe', 'rest', { standIn: 'pipe' }),
  sit: act('sitting a while', 'rest', { hours: ['day', 'evening'] }),
  watch: act('watching the road', 'search', { where: ['town', 'refuge', 'road', 'camp', 'garrison'] }),
  guard: act('standing guard', 'search', { where: ['camp', 'garrison'], who: 'man', hours: ['morning', 'day', 'evening', 'night'] }),
  sleep: act('asleep by the fire', 'rest', { hours: ['night'] }),
  sweep: act('sweeping the step', 'work', { where: ['town'], keeper: true, dry: true, hours: ['morning', 'day'], standIn: 'sweep' }),
  goods: act('carrying goods in', 'carry', { where: ['town'], keeper: true, hours: ['morning', 'day'], pace: true }),
  count: act('counting the till', 'trade', { where: ['town'], keeper: true, hours: ['day', 'evening'] }),
  // The children of another family, glimpsed: in the poses the children's sheets hold (public/motion.js `CHILD_POSES`), as the
  // family's own children at play are (sim/childhood.mjs).
  marbles: act('playing marbles', 'rest-e', { who: 'child', where: ['home', 'town', 'refuge', 'road'], hours: ['morning', 'day', 'evening'] }),
  sitting: act('sitting in the dirt', 'rest', { who: 'child', where: ['home', 'town', 'refuge', 'road', 'camp'], hours: ['morning', 'day', 'evening', 'night'] }),
  // Two together.
  talk: act('talking', 'speak', { social: true }),
  company: act('sitting and talking', 'rest', { social: true, hours: ['day', 'evening'] }),
  cards: act('playing cards', 'rest', { social: true, where: ['camp', 'garrison', 'town', 'refuge', 'road'], hours: ['day', 'evening'], standIn: 'cards' }),
  dominoes: act('playing dominoes', 'rest', { social: true, where: ['home', 'town'], hours: ['day', 'evening'], standIn: 'cards' }),
  fireside: act('talking by the fire', 'rest', { social: true, hours: ['evening', 'night'], where: ['home', 'camp', 'refuge', 'road', 'garrison'], prop: 'fire' }),
});
/** What a family's person may be seen doing: nothing that reads as the work a student orders (the hoe's swing, `sow` bare). */
const homeSafe = one => one.pose !== 'work' && (one.pose !== 'sow' || one.prop === 'hens');

/**
 * The men of an army's camp that the page draws as a body of men (public/army-view.js): what each is doing, as a figure and
 * a pose of the military or cast sheets. The 1835 volunteers and Houston's men were in their own clothes, so the cast's
 * civilian men stand among the riflemen at the fire, the cards and the wood; Houston drilled his army at Groce's
 * (`HIST-TEX-075`), so his camp drills. A Mexican column's camp is the regulars' own sheet only, and says nothing here.
 * ceiling: the Mexican camps are silent - their talk would be Spanish with an English gloss (docs/BATTLES.md §2.5), and a
 * line of it written for idle soldiers is the owner's to ask for (docs/AMBIENT.md, decisions).
 * The soldiers at rest - a rifle cleaned, a man sitting, a man cooking - name the delivered pose (`p`) the page falls back to;
 * the page draws each activity's own clip where the library holds it (public/ambient.js `SOLDIERS_AT_REST`).
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-28 - ambient life, item 3: cleaning a rifle is the ramrod's stroke, sitting
 * and cooking the standing idle, until `<volunteer|regular>-clean-rifle`, `-camp-sit` and `-camp-cook` are drawn.
 */
const CAMP_TEXIAN = Object.freeze([
  { a: 'rifle', f: 'volunteer', p: 'gun-ram' }, { a: 'guard', f: 'volunteer', p: 'idle' }, { a: 'fire', f: 'cast', p: 'care', prop: 'fire' },
  { a: 'sit', f: 'volunteer', p: 'idle' }, { a: 'cook', f: 'volunteer', p: 'idle' },
  { a: 'cook', f: 'cast', p: 'care', prop: 'pot' }, { a: 'mend', f: 'cast', p: 'repair' }, { a: 'wood', f: 'cast', p: 'carry', pace: true },
  { a: 'sit', f: 'cast', p: 'rest' }, { a: 'pipe', f: 'cast', p: 'rest' }, { a: 'whittle', f: 'cast', p: 'repair' },
]);
const CAMP_DRILL = Object.freeze({ a: 'drill', f: 'volunteer', p: 'march', pace: true });
const CAMP_MEXICAN = Object.freeze([
  { a: 'rifle', f: 'regular', p: 'gun-ram' }, { a: 'guard', f: 'regular', p: 'idle' }, { a: 'drill', f: 'regular', p: 'march', pace: true },
  { a: 'shot', f: 'regular', p: 'gun-shot-carry' }, { a: 'drum', f: 'regular', p: 'drummer-beat' },
  { a: 'sit', f: 'regular', p: 'idle' }, { a: 'cook', f: 'regular', p: 'idle' },
]);
const CAMP_NIGHT = Object.freeze([{ a: 'sleep', f: 'cast', p: 'rest' }, { a: 'sleep', f: 'cast', p: 'rest' }, { a: 'fire', f: 'cast', p: 'care', prop: 'fire' }]);
/** The civilian men of the cast who stand for volunteers in their own clothes (never `rust`, the student's own mark). */
const CAMP_CAST = Object.freeze(['elder', 'ochre', 'blue']);
/** The figures of the crowd at a refuge: the cast's women and men, and two children. */
const CROWD_FIGURES = Object.freeze([
  { f: 'teal', sex: 'female' }, { f: 'ochre', sex: 'male' }, { f: 'indigo', sex: 'female' }, { f: 'elder', sex: 'male' },
  { f: 'blue-girl', sex: 'female' }, { f: 'blue', sex: 'male' }, { f: 'girl', sex: 'female', child: true }, { f: 'boy', sex: 'male', child: true },
]);

// ---------------------------------------------------------------------------------------------------------------------------
// The words
// ---------------------------------------------------------------------------------------------------------------------------
/**
 * Two short lines, the first said by one of a pair and the second by the other (`FIC-GONZ-821`). Each is at most eight
 * plain words; `where`, `hours`, `seasons`, `weather` and `camp` narrow when it may be said. A line with a `topic` is war
 * news: said only when every one at the table could know it (`knownTo`), `hedged` while the word is a rumour or not yet
 * sure and `lines` once it is confirmed. None is anybody's documented words and none is put in a named mouth.
 */
const talk = (id, lines, options = {}) => Object.freeze({ id, lines, where: ALL, hours: WAKING, ...options });
export const EXCHANGES = Object.freeze([
  // Any place.
  talk('morning', ['Morning.', 'Morning. Did you sleep well?'], { hours: ['morning'] }),
  talk('evening', ['Evening.', 'Evening. A long day.'], { hours: ['evening'] }),
  talk('family', ['How is your family?', 'All well, thank God.']),
  talk('letters', ['Any letter from back home?', 'Not a line in months.']),
  talk('born', ['Where were you born?', 'Right here in Texas.']),
  talk('came', ['How long have you been in Texas?', 'Three years this spring.']),
  talk('coffee', ['The coffee is almost gone.', 'Then we drink it weak.']),
  talk('back', ['My back aches today.', 'Sit down and rest it.']),
  talk('dog', ['Your dog ran off again.', 'He comes back for supper.']),
  talk('snake', ['Mind the snakes by the creek.', 'I saw a big one yesterday.']),
  talk('horse', ['That horse of yours looks thin.', 'He needs more corn, is all.']),
  talk('singing', ['Who was singing last night?', 'My girl. She sings all day.']),
  talk('trade', ['Will you trade me some salt?', 'For a little coffee, I will.']),
  talk('help', ['Can you help me tomorrow?', 'Of course. Just say when.']),
  // At home.
  talk('eggs', ['The hens are laying well.', 'Good. Eggs for supper, then.'], { where: ['home'], seasons: ['spring', 'autumn'] }),
  talk('barrel', ['Is the water barrel full?', 'I will fetch more soon.'], { where: ['home'] }),
  talk('woodpile', ['The woodpile is low.', 'I will cut more today.'], { where: ['home'] }),
  talk('fence', ['The cow got out again.', 'I will mend that fence.'], { where: ['home'] }),
  talk('supper', ['Supper is nearly ready.', 'I can smell it from here.'], { where: ['home', 'refuge', 'road', 'camp'], hours: ['evening'] }),
  talk('garden', ['The garden needs weeding.', 'The children can help.'], { where: ['home'], hours: ['morning', 'day'] }),
  talk('neighbors', ['Seen the new neighbors?', 'Good people, I think.'], { where: ['home', 'town'] }),
  talk('quilt', ['That quilt is coming along.', 'One more row, and done.'], { where: ['home'] }),
  // In town.
  talk('slow', ['Slow day for trade.', 'It will pick up.'], { where: ['town'] }),
  talk('mail', ['Any mail come in?', 'Not since last week.'], { where: ['town'] }),
  talk('salt', ['Salt is dear this year.', 'Everything costs more now.'], { where: ['town'] }),
  talk('cloth', ['The store has new cloth.', 'Blue, or only brown again?'], { where: ['town'] }),
  talk('step', ['Mind the step. I just swept it.', 'I will wipe my feet.'], { where: ['town'], hours: ['morning', 'day'] }),
  talk('shoes', ['Busy at the smithy?', 'Horses always need shoes.'], { where: ['town'] }),
  talk('families', ['More families came this week.', 'Texas fills up fast.'], { where: ['town'], seasons: ['autumn', 'winter'] }),
  talk('credit', ['Can you give me credit?', 'Until the cotton is sold.'], { where: ['town'] }),
  // In camp and in the garrison.
  talk('beef', ['Beef again tonight.', 'Better than nothing at all.'], { where: ['camp', 'garrison'] }),
  talk('feet', ['My feet are sore.', 'Mine too. Too much walking.'], { where: ['camp', 'garrison'] }),
  talk('bed', ['I miss my own bed.', 'I miss my wife\'s cooking.'], { where: ['camp', 'garrison'] }),
  talk('powder', ['Keep your powder dry.', 'I always do.'], { where: ['camp', 'garrison'] }),
  talk('blanket', ['Cold night for guard duty.', 'Wrap up in your blanket.'], { where: ['camp', 'garrison'], hours: ['evening', 'night'] }),
  talk('camptalk', ['Heard any news?', 'Only camp talk.'], { where: ['camp', 'garrison'] }),
  talk('officers', ['When do we fight?', 'When the officers decide.'], { where: ['camp'] }),
  talk('corn', ['I wonder how my corn is doing.', 'Your wife has it in hand.'], { where: ['camp', 'garrison'] }),
  talk('drill', ['More drill tomorrow?', 'Every day, it seems.'], { where: ['camp'], camp: 'houston' }),
  talk('into-bexar', ['When do we go into Béxar?', 'When the officers agree.'], { where: ['camp'], camp: 'force', unlessKnown: 'bexar-storming' }),
  talk('short', ['Short of everything here.', 'We make do.'], { where: ['garrison'] }),
  // On the road east and at a refuge.
  talk('river', ['How far to the next river?', 'A day, if the mud allows.'], { where: ['refuge', 'road'] }),
  talk('tired', ['The children are tired.', 'We all are.'], { where: ['refuge', 'road'] }),
  talk('home', ['Will we ever see home again?', 'Pray so.'], { where: ['refuge', 'road'] }),
  talk('bread', ['Is there any bread left?', 'Only a little corn meal.'], { where: ['refuge', 'road'] }),
  talk('ferry', ['The line for the ferry is long.', 'We may wait three days.'], { where: ['refuge', 'road'] }),
  talk('close', ['Stay together on the road.', 'Keep the little ones close.'], { where: ['refuge', 'road'] }),
  talk('behind', ['We left the table behind.', 'We left near all we had.'], { where: ['refuge', 'road'] }),
  talk('share', ['We have a little extra beef.', 'Bless you. The children are hungry.'], { where: ['refuge', 'road'] }),
  // The weather.
  talk('rain', ['This rain will not quit.', 'Mud up to our knees.'], { weather: ['rain', 'storm'] }),
  talk('wet', ['Wet through again.', 'Come and dry off by the fire.'], { weather: ['rain', 'storm'] }),
  talk('thunder', ['Hear that thunder?', 'Stay under cover till it passes.'], { weather: ['storm'] }),
  talk('norther', ['A norther is blowing in.', 'Bring the stock in close.'], { weather: ['norther'] }),
  talk('freeze', ['Cold enough to freeze the water.', 'Put on another shirt.'], { weather: ['norther'] }),
  talk('fog', ['I can hardly see the trees.', 'The fog will lift by noon.'], { weather: ['fog'], hours: ['morning', 'day'] }),
  talk('hot', ['Hot today.', 'Cooler by evening, I hope.'], { weather: ['fair'], seasons: ['autumn'], hours: ['day'] }),
  talk('flowers', ['Flowers are out on the prairie.', 'Spring at last.'], { weather: ['fair'], seasons: ['spring'] }),
  // The season.
  talk('pecans', ['The pecans are falling.', 'We should gather some tomorrow.'], { seasons: ['autumn'] }),
  talk('cotton', ['Time to pick the cotton.', 'My hands are sore from it.'], { seasons: ['autumn'], where: ['home', 'town'] }),
  talk('short-days', ['Short days now.', 'And long, cold nights.'], { seasons: ['winter'] }),
  talk('plant', ['Time to plant the corn.', 'If we are home to plant it.'], { seasons: ['spring'] }),
  talk('geese', ['The geese are flying south.', 'Winter is coming, then.'], { seasons: ['autumn'] }),
  // War news: only as far as everybody here could know it.
  talk('cannon', ['Soldiers came for the Gonzales cannon.', 'The town will not give it up.'], { topic: 'cannon-request', hedged: ['They say soldiers want the Gonzales gun.', 'Over one small cannon?'] }),
  talk('cannon-kept', ['The soldiers left without the cannon.', 'Good. Maybe that ends it.'], { topic: 'gonzales-outcome', hedged: ['I heard the soldiers turned back.', 'I hope it is true.'] }),
  talk('goliad-taken', ['Our men took Goliad.', 'Good news for once.'], { topic: 'goliad-taken', hedged: ['They say Goliad was taken.', 'By our men?'] }),
  talk('concepcion', ['Our men won at Concepción.', 'Thank God for that.'], { topic: 'concepcion-fight', hedged: ['They say there was a fight near Béxar.', 'I hope our men are safe.'] }),
  talk('bexar-taken', ['Béxar is taken. Cos gave up.', 'Then maybe the war is over.'], { topic: 'bexar-storming', hedged: ['They say our men went into Béxar.', 'Then there is hard fighting.'] }),
  talk('land', ['The army will give land to soldiers.', 'Land is worth a lot.'], { topic: 'winter-terms', hedged: ['They say soldiers will get land.', 'How much land?'] }),
  talk('free', ['Texas says it is free now.', 'Now we must win it.'], { topic: 'declaration', hedged: ['They say Texas is free now.', 'We will see about that.'] }),
  talk('siege', ['Travis is shut up in the Alamo.', 'Will anyone go to help?'], { topic: 'alamo-siege', hedged: ['They say the Alamo is surrounded.', 'God help the men inside.'] }),
  talk('alamo', ['The Alamo has fallen.', 'God help their families.'], { topic: 'alamo-fall', hedged: ['They say the Alamo fell.', 'I pray it is not so.'] }),
  talk('fannin', ['Fannin gave up near Goliad.', 'All those men taken.'], { topic: 'goliad-defeat', hedged: ['They say Fannin was caught.', 'Let us hope not.'] }),
  talk('goliad', ['They shot Fannin\'s men at Goliad.', 'Lord have mercy on them.'], { topic: 'goliad-massacre', hedged: ['I heard terrible news from Goliad.', 'Do not tell the children.'] }),
  talk('fall-back', ['Houston\'s army fell back again.', 'Will he ever stand and fight?'], { topic: 'houston-colorado', hedged: ['They say the army is falling back.', 'Then we cannot stay here.'] }),
  talk('san-felipe', ['San Felipe was burned.', 'Nothing left but ashes.'], { topic: 'houston-san-felipe', hedged: ['They say San Felipe burned.', 'Where will those people go?'] }),
  talk('gonzales-burned', ['They burned Gonzales.', 'All those homes gone.'], { topic: 'burned:gonzales', hedged: ['They say Gonzales burned.', 'I cannot believe it.'] }),
  talk('coming', ['The Mexican army is coming this way.', 'Then we cannot stay long.'], { topic: 'column:', hedged: ['They say soldiers are near.', 'Be ready to go.'] }),
  talk('measles', ['There is measles in the camps.', 'Keep the little ones close.'], { topic: 'sickness-', hedged: ['They say sickness is going round.', 'Keep the little ones close.'] }),
  talk('won', ['Houston beat Santa Anna!', 'Then we can go home.'], { topic: 'san-jacinto', hedged: ['They say there was a big battle.', 'Who won? Does anybody know?'] }),
]);

/** How sure a report is, as sim/knowledge.mjs orders it. A contradicted report is never said here. */
const CONFIDENCE = Object.freeze({ rumor: 0, unconfirmed: 1, confirmed: 2 });

/**
 * How sure somebody nobody told could be of a topic, standing at `point`: once word could have walked to them from where it
 * happened, a rumour for two days and then sure (`FIC-GONZ-822`). Never the Host's public reports (sim/knowledge.mjs
 * `public`), which are what the teacher's page is told and not what a storekeeper eighty miles off has heard.
 */
export function hearsayOf(world, topicId, point) {
  const truth = world.truth?.[topicId];
  if (!truth) return null;
  const site = world.map?.sites?.[truth.siteId];
  if (!site || !point) return null;
  const since = world.minute - truth.minute;
  const reach = Math.hypot(site.x - point.x, site.y - point.y) / WORD_MILES_A_DAY * DAY + WORD_FIRST_MINUTES;
  if (since < reach) return null;
  return since < reach + 2 * DAY ? 'rumor' : 'confirmed';
}
/** What one speaker knows of a topic: a family's own knowledge, or what word has reached where they stand. */
function speakerStatus(world, speaker, topicId) {
  if (speaker.householdId) return world.knowledge?.households?.[speaker.householdId]?.[topicId]?.status || null;
  return hearsayOf(world, topicId, speaker.point);
}
/**
 * Whether a line about `topicId` may be said by these speakers on this page, and how: 'sure', 'hedged' or null. The viewing
 * family must have heard it (the Host sees the class and hears what the speakers could say), and every speaker must know it.
 */
export function knownTo(world, topicId, viewer, speakers) {
  const statuses = speakers.map(one => speakerStatus(world, one, topicId));
  if (viewer !== 'host') statuses.push(world.knowledge?.households?.[viewer]?.[topicId]?.status || null);
  if (statuses.some(status => !(status in CONFIDENCE))) return null;
  return statuses.every(status => status === 'confirmed') ? 'sure' : 'hedged';
}
/** The topic a line would speak of: its own, or the first known of a family of topics (`column:`, `sickness-`). */
function topicFor(world, line, viewer, speakers) {
  if (!line.topic.endsWith(':') && !line.topic.endsWith('-')) return { topic: line.topic, how: knownTo(world, line.topic, viewer, speakers) };
  for (const topic of Object.keys(world.truth || {}).filter(id => id.startsWith(line.topic)).sort()) {
    const how = knownTo(world, topic, viewer, speakers);
    if (how) return { topic, how };
  }
  return { topic: null, how: null };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Who is idle, and where
// ---------------------------------------------------------------------------------------------------------------------------
const waiting = (world, travel) => Boolean(travel) && (travel.halted || (Number.isFinite(travel.waitUntil) && world.minute < travel.waitUntil));
/**
 * Whether this person could be drawn at an activity at all: somebody standing about, or halted on a journey (a camp on the
 * road, the 1835 force halted in camp, a family waiting its turn at a crossing). Chores are not asked here: see `busy`.
 */
export function ambientable(world, e, held = heldNow(world)) {
  if (e?.kind !== 'person' || !e.location || e.principal) return false;
  if (e.courier || e.report || e.runner || e.carrier) return false;
  if (!['well', 'tired'].includes(e.health?.condition || 'well')) return false;
  if (e.task === 'rest' || (e.travel && !waiting(world, e.travel))) return false;
  // The 1835 force's men are on its halted journey all the way to Béxar (sim/army.mjs `marchingTravel`): idle only while it
  // stands in a camp (`army.camp`), never while it marches.
  if (e.travel?.purpose === 'march' && !world.army?.camp) return false;
  // Halted in the wagon or on the horse (sim/company.mjs): drawn in their seat, as they are.
  if (e.travel && (e.travel.drives || e.travel.rides || e.travel.saddle || e.travel.carried)) return false;
  if (e.talk || e.aside || e.shelter || e.carriedBy || e.townHelp || held.has(e.id)) return false;
  if (bandOf(e) === 'infant') return false;
  if (heldByBattle(world, e) || e.service?.down || Number.isFinite(e.service?.offMap) || (Number.isFinite(e.service?.fellAt) && e.service.fellAt <= world.minute)) return false;
  return true;
}
/**
 * Everybody something else is drawing now: listening to a rider (sim/encounters.mjs), and the towns' own people a dated scene
 * has at its work (sim/town-scenes.mjs `residents`). Their own poses win.
 */
function heldNow(world) {
  const held = new Set(Object.values(world.encounters || {}).filter(one => one.status === 'open').map(one => one.listenerId));
  for (const beat of activeBeats(world)) for (const one of beat.residents || []) held.add(one.id);
  return held;
}
/** Whether somebody has work of their own: drawn at it, however the page draws work, and never given an activity. */
const busy = e => Boolean(e.chore);
/** A child of the family's own too small for work: the play and talk of sim/childhood.mjs are theirs. */
const littleOne = e => Boolean(e.householdId) && isSmallChild(e);

/** Where somebody idle is: at home, in town, in camp, at a refuge, halted on the road, or in the garrison at Béxar. */
export function settingOf(world, e) {
  if (e.service?.status === 'serving') return e.service.kind === 'garrison' ? 'garrison' : 'camp';
  if (world.army?.members?.includes(e.id)) return 'camp';
  const flight = e.householdId && world.households?.[e.householdId]?.flight;
  if (flight && flight.status === 'refuged' && !e.travel && e.location?.siteId === flight.refuge) return 'refuge';
  if (e.travel) return flight && ['fled', 'refuged'].includes(flight.status) ? 'road' : 'camp';
  const site = world.map?.sites?.[e.location?.siteId];
  if (!site) return 'road';
  if (site.kind === 'homestead' || site.kind === 'farmstead') return 'home';
  if (site.kind === 'town' || site.kind === 'village') return 'town';
  return 'road';
}
/** The group somebody idles among: the people of one place, a family halted on its road, or the 1835 force in camp. */
function groupOf(world, e) {
  if (!e.travel) return `site:${e.location.siteId}`;
  if (world.army?.members?.includes(e.id)) return 'army:force';
  return `road:${e.householdId || e.id}`;
}
/** A man, a woman, a youth or grown, or a child, as a glance tells it. */
function whoOf(e) {
  const band = bandOf(e);
  const sex = sexOf(e) || (e.resident ? townsfolkSex(e.id) : null) || e.sex || null;
  return { sex, child: band === 'child' || band === 'small', grown: !band || band === 'adult' || band === 'youth' };
}
function fits(activity, who, { setting, band, raining, keeper, own }) {
  if (!activity.where.includes(setting) || !activity.hours.includes(band)) return false;
  if (activity.dry && raining) return false;
  if (activity.keeper && !keeper) return false;
  if (own && !homeSafe(activity) && !(activity.pose === 'sow' && activity.prop === 'hens')) return false;
  if (activity.who === 'child') return who.child && Boolean(who.sex);
  if (who.child) return false;
  if (activity.who === 'man') return who.sex === 'male';
  if (activity.who === 'woman') return who.sex === 'female';
  return true;
}
const pick = (list, share) => list[Math.min(list.length - 1, Math.floor(share * list.length))];
const raining = here => Boolean(here) && (here.kind === 'rain' || here.kind === 'storm' || (here.kind === 'norther' && here.wet));
/** A person's facing as sent: only west is said (`f: 'w'`), east being what every sheet faces; a family of twenty is sent it on every tick. */
const west = face => (face === 'w' ? { f: 'w' } : {});
/** East or west, by the seed. */
const sideOf = (world, id, question) => (stirredShare(world, id, question) < 0.5 ? 'e' : 'w');

// ---------------------------------------------------------------------------------------------------------------------------
// The whole class's ambient life for a tick, worked out once and read by every page
// ---------------------------------------------------------------------------------------------------------------------------
const byWorld = new WeakMap();
/**
 * Every idle person's activity and every pair keeping company, for the whole class at this tick. Worked out once a tick and
 * kept beside the world (never in it), so thirty pages cost one computation; a class loaded from its save works it out again
 * and gets the same answer.
 */
export function classAmbient(world) {
  const key = `${world.tick}:${world.minute}`;
  const kept = byWorld.get(world);
  if (kept?.key === key) return kept.state;
  const state = computeAmbient(world);
  byWorld.set(world, { key, state });
  return state;
}

function computeAmbient(world) {
  const held = heldNow(world);
  const band = hourBand(world), slot = Math.floor(world.tick / SLOT_TICKS), inSlot = world.tick % SLOT_TICKS;
  const groups = new Map();
  for (const e of Object.values(world.entities)) {
    if (!ambientable(world, e, held) || busy(e)) continue;
    const key = groupOf(world, e);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const acts = new Map(), pairs = [];
  for (const [groupKey, people] of groups) {
    people.sort((a, b) => a.id.localeCompare(b.id));
    const point = people[0].location;
    const here = weatherAt(world, point);
    const wet = raining(here);
    // Who keeps company this spell: the free grown people of the place, in an order the seed shuffles each spell, each with
    // the nearest one left. Nobody visits or talks at night.
    const free = people.filter(e => whoOf(e).grown && !littleOne(e))
      .map(e => [stirredShare(world, e.id, `pair:${slot}`), e]).sort((a, b) => a[0] - b[0]).map(([, e]) => e);
    const used = new Set();
    let visits = 0;
    if (band !== 'night') {
      for (const a of free) {
        if (used.has(a.id)) continue;
        let best = null;
        for (const b of free) {
          if (b === a || used.has(b.id)) continue;
          const d = Math.hypot(a.location.x - b.location.x, a.location.y - b.location.y);
          if (!best || d < best.d) best = { b, d };
        }
        if (!best) continue;
        const b = best.b;
        const near = best.d <= NEAR_MILES || groupKey.startsWith('road:') || groupKey.startsWith('army:');
        // Somebody walks over only if one of the two is a townsperson (never a family's own person, whom only a student moves).
        // ceiling: the visit is drawn, not lived - the keeper's `location` stays at the door, so a trade or a rider finds them
        // there. Moving them in the world (sim/town.mjs's rounds) is the way out if a visit is ever to matter.
        const visitor = near ? null : (!a.householdId ? a : !b.householdId ? b : null);
        if (!near && (!visitor || best.d > VISIT_MILES || visits >= VISITS_A_TOWN)) continue;
        const pairKey = [a.id, b.id].sort().join('+');
        if (stirredShare(world, pairKey, `with:${slot}`) >= COMPANY_SHARE) continue;
        used.add(a.id); used.add(b.id);
        if (visitor) visits++;
        const setting = settingOf(world, a);
        const social = Object.entries(ACTIVITIES).filter(([, one]) => one.social && one.where.includes(setting) && one.hours.includes(band) && !(one.dry && wet));
        if (!social.length) { used.delete(a.id); used.delete(b.id); continue; }
        // A visitor stands talking at the door they came to; the pair otherwise do something together.
        const [actId, activity] = visitor ? ['talk', ACTIVITIES.talk] : pick(social, stirredShare(world, pairKey, `social:${slot}`));
        const host = visitor === a ? b : a;
        const side = visitor ? (visitor.location.x >= host.location.x ? 1 : -1) : 0;
        const at = visitor ? { x: round(host.location.x + side * 0.011), y: round(host.location.y + 0.003) } : null;
        const [first, second] = stirredShare(world, pairKey, `first:${world.tick}`) < 0.5 ? [a, b] : [b, a];
        const talking = stirredShare(world, pairKey, `talk:${world.tick}`) < TALK_SHARE && (!visitor || inSlot >= 1);
        pairs.push({ key: pairKey, group: groupKey, ids: [first.id, second.id], setting, talking, point: host.location });
        for (const one of [a, b]) {
          const other = one === a ? b : a;
          const face = visitor ? (one === visitor ? (side > 0 ? 'w' : 'e') : (side > 0 ? 'e' : 'w')) : (other.location.x >= one.location.x ? 'e' : 'w');
          acts.set(one.id, { a: actId, p: activity.pose, with: other.id, ...west(face),
            ...(one === visitor && { at }), ...(activity.prop && one === a && { prop: activity.prop }) });
        }
      }
    }
    // Everybody else at something of their own.
    for (const e of people) {
      if (acts.has(e.id)) continue;
      const setting = settingOf(world, e), who = whoOf(e);
      const own = Boolean(e.householdId);
      const mine = Object.entries(ACTIVITIES).filter(([, one]) => !one.social && fits(one, who, { setting, band, raining: wet, keeper: !e.householdId, own })
        // A halted traveller keeps to where the road has them: nothing walked about.
        && !(one.pace && e.travel));
      if (!mine.length) continue;
      const phase = Math.floor(stirredShare(world, e.id, 'ambient-phase') * SLOT_TICKS);
      const [actId, activity] = pick(mine, stirredShare(world, e.id, `act:${Math.floor((world.tick + phase) / SLOT_TICKS)}`));
      acts.set(e.id, { a: actId, p: activity.pose, ...west(sideOf(world, e.id, `face:${slot}`)), ...(activity.pace && { pace: 1 }), ...(activity.prop && { prop: activity.prop }) });
    }
  }
  return { acts, pairs, band };
}
const round = value => Math.round(value * 1e4) / 1e4;

// ---------------------------------------------------------------------------------------------------------------------------
// The camps' men and the refuges' crowds: not entities, drawn by the page as a body of people
// ---------------------------------------------------------------------------------------------------------------------------
/** How many men the page draws in an army's camp: public/army-view.js `menDrawn`. */
export const menDrawn = strength => Math.max(1, Math.min(CAMP_MEN, Math.round(strength || 0) || 1));
/** What each man drawn in a camp is doing, and who of them are sitting together: for an army standing in camp only. */
export function campAmbient(world, army, band = hourBand(world)) {
  if (army.moving) return null;
  const slot = Math.floor(world.tick / SLOT_TICKS);
  const men = menDrawn(army.strength ?? CAMP_MEN);
  const mexican = army.side === 'mexican';
  const acts = [];
  for (let index = 0; index < men; index++) {
    const id = `camp:${army.id}:${index}`;
    const list = band === 'night' ? (index % 5 === 0 ? [{ a: 'guard', f: mexican ? 'regular' : 'volunteer', p: 'idle' }] : mexican ? [{ a: 'sleep', f: 'regular', p: 'idle' }] : CAMP_NIGHT)
      : mexican ? CAMP_MEXICAN : army.id === 'houston' ? [...CAMP_TEXIAN, CAMP_DRILL, CAMP_DRILL] : CAMP_TEXIAN;
    const one = pick(list, stirredShare(world, id, `camp:${slot}`));
    const figure = one.f === 'cast' ? CAMP_CAST[Math.floor(stirredShare(world, id, 'figure') * CAMP_CAST.length)] : one.f;
    acts.push({ a: one.a, f: figure, p: one.p, face: sideOf(world, id, `face:${slot}`), ...(one.pace && { pace: 1 }), ...(one.prop && { prop: one.prop }) });
  }
  // Two men side by side in a row of the camp sit together and talk (six to a row, public/army-view.js).
  const pairs = [];
  if (band !== 'night' && !mexican) {
    for (let index = 0; index + 1 < men; index += 2) {
      if (index % 6 === 5) continue;
      const key = `camp:${army.id}:${index}+${index + 1}`;
      if (stirredShare(world, key, `with:${slot}`) >= COMPANY_SHARE) continue;
      const seated = stirredShare(world, key, `seated:${slot}`) < 0.5;
      for (const [k, other] of [[index, index + 1], [index + 1, index]]) {
        const cast = acts[k].f === 'volunteer' ? CAMP_CAST[(k + index) % CAMP_CAST.length] : acts[k].f;
        acts[k] = { a: seated ? 'cards' : 'talk', f: cast, p: seated ? 'rest' : 'speak', face: other > k ? 'e' : 'w' };
      }
      pairs.push({ key, ids: [`camp:${army.id}:${index}`, `camp:${army.id}:${index + 1}`], talking: stirredShare(world, key, `talk:${world.tick}`) < TALK_SHARE });
    }
  }
  return { acts, pairs };
}
/** The refuges with a family camped at them now: where the crowd of the thousands on the road is drawn. */
function refugesInUse(world) {
  const found = new Set();
  for (const household of Object.values(world.households || {})) if (household.flight?.status === 'refuged' && household.flight.refuge) found.add(household.flight.refuge);
  return [...found].filter(siteId => world.map?.sites?.[siteId]).sort();
}
/**
 * The crowd at a refuge (`FIC-GONZ-823`): a few unnamed people of the families from the west camped round a fire a little off
 * the town, a picture of the thousands the record puts at the crossings (`HIST-TEX-070`) and never a count.
 */
export function crowdAt(world, siteId, band = hourBand(world)) {
  const site = world.map.sites[siteId];
  const slot = Math.floor(world.tick / SLOT_TICKS);
  const here = weatherAt(world, site), wet = raining(here);
  const centre = { x: site.x + 0.02, y: site.y + 0.05 };
  const people = [];
  for (let index = 0; index < REFUGE_CROWD; index++) {
    const id = `crowd:${siteId}:${index}`;
    const figure = CROWD_FIGURES[Math.floor(stirredShare(world, `crowd:${siteId}`, `figure:${index}`) * CROWD_FIGURES.length)];
    const angle = (index / REFUGE_CROWD) * Math.PI * 2 + 0.4;
    const who = { sex: figure.sex, child: Boolean(figure.child), grown: !figure.child };
    const list = Object.entries(ACTIVITIES).filter(([, one]) => !one.social && fits(one, who, { setting: 'refuge', band, raining: wet, keeper: false, own: false }));
    const [a, activity] = pick(list, stirredShare(world, id, `act:${slot}`));
    people.push({ id, figure: figure.f, ...(figure.child && { small: 0.72 }), x: round(centre.x + Math.cos(angle) * 0.022), y: round(centre.y + Math.sin(angle) * 0.014),
      a, p: activity.pose, face: Math.cos(angle) > 0 ? 'w' : 'e', ...(activity.pace && { pace: 1 }), ...(activity.prop && index % 2 === 0 && { prop: activity.prop }) });
  }
  const pairs = [];
  if (band !== 'night') {
    for (let index = 0; index + 1 < REFUGE_CROWD; index += 2) {
      const [a, b] = [people[index], people[index + 1]];
      if (a.small || b.small) continue;
      const key = `${a.id}+${b.id}`;
      if (stirredShare(world, key, `with:${slot}`) >= COMPANY_SHARE) continue;
      for (const [one, other] of [[a, b], [b, a]]) Object.assign(one, { a: 'company', p: 'rest', face: other.x >= one.x ? 'e' : 'w' });
      delete a.pace; delete b.pace;
      pairs.push({ key, ids: [a.id, b.id], talking: stirredShare(world, key, `talk:${world.tick}`) < TALK_SHARE });
    }
  }
  return { siteId, people, fire: { x: round(centre.x), y: round(centre.y) }, pairs };
}

// ---------------------------------------------------------------------------------------------------------------------------
// One page's share of it
// ---------------------------------------------------------------------------------------------------------------------------
/** The exchanges this pair could say here and now, on this page. */
function exchangesFor(world, { setting, point, camp, viewer, speakers, band }) {
  const season = seasonOf(world);
  const kind = weatherAt(world, point)?.kind || 'fair';
  const out = [];
  for (const line of EXCHANGES) {
    if (!line.where.includes(setting) || !line.hours.includes(band)) continue;
    if (line.seasons && !line.seasons.includes(season)) continue;
    if (line.weather && !line.weather.includes(kind)) continue;
    if (line.camp && line.camp !== camp) continue;
    if (line.unlessKnown && world.truth?.[line.unlessKnown]) continue;
    if (line.topic) {
      const { how } = topicFor(world, line, viewer, speakers);
      if (!how) continue;
      out.push({ id: line.id, words: how === 'sure' ? line.lines : line.hedged || line.lines });
    } else out.push({ id: line.id, words: line.lines });
  }
  return out;
}
/** The two lines a talking pair says on this tick, over their two heads, or null when there is nothing they could say. */
function exchangeOf(world, pair, context) {
  const options = exchangesFor(world, context);
  if (!options.length) return null;
  const chosen = pick(options, stirredShare(world, pair.key, `line:${world.tick}`));
  return chosen.words.map((text, order) => ({
    id: `${pair.key}:${world.tick}:${order}`, pair: pair.key, order, speakerId: pair.ids[order], text, kind: 'reconstructed', claimId: CHATTER_CLAIM,
  }));
}
/**
 * The ambient life a page may see, or null: the activity of every idle person it is sent (put on each as `amb`), the camps it
 * is sent and their men, the crowd at a refuge its people are camped at, and this tick's few exchanges. Quiet while the page
 * is watching a fight or a chase, or a rider is talking with one of the family: their own words win.
 */
export function ambientFor(world, householdId, role, view) {
  if (world.status === 'lobby') return null;
  const host = role === 'host';
  const viewer = host ? 'host' : householdId;
  if (!host && !world.households?.[householdId]) return null;
  const state = classAmbient(world);
  const { acts, band } = state;
  // The activity on everybody idle this page is sent: its own family's (never a small child or a baby of its own, whose play is
  // sim/childhood.mjs's), and everybody else's it sees. Never somebody given work since the tick's life was worked out.
  const seen = new Set();
  const give = (projected, own) => {
    const e = world.entities[projected.id];
    const amb = e && acts.get(e.id);
    if (!amb) return;
    if (busy(e) || ((own || host) && littleOne(e))) return;
    projected.amb = { ...amb };
    seen.add(e.id);
  };
  for (const projected of view.entities || []) if (projected.kind === 'person') give(projected, true);
  for (const projected of view.others || []) if (projected.kind === 'person') give(projected, false);
  // The camps this page is sent, standing (not marching), with what each man drawn is doing.
  const camps = {};
  for (const army of view.armies || []) {
    const camp = campAmbient(world, army, band);
    if (camp) camps[army.id] = camp;
  }
  // The crowd at a refuge where one of this family is camped, or at every refuge in use for the Host.
  const mineAt = host ? null : new Set(world.households[householdId].members.map(id => world.entities[id]).filter(one => one && !one.travel && one.location?.siteId).map(one => one.location.siteId));
  const crowds = refugesInUse(world).filter(siteId => host || mineAt.has(siteId)).map(siteId => crowdAt(world, siteId, band));
  // The enslaved people a family meets on the road east and at the crossings, in a class that deals starts (sim/start-story.mjs,
  // owner 2026-09-29): drawn as a group with no fire and no words of their own, seen only where the family is.
  crowds.push(...roadGroups(world, householdId, host));
  // The talk: none while this page watches a fight or a chase, or a rider is talking with one of the family.
  const quiet = Boolean(view.battle?.sides || view.flight?.chase || (!host && view.encounter?.status === 'open') || band === 'night');
  const townSceneSite = view.townScenes?.lines?.length ? view.townScenes.siteId : null;
  const lines = [];
  if (!quiet) {
    const talking = [];
    for (const pair of state.pairs) {
      if (!pair.talking || !pair.ids.every(id => seen.has(id))) continue;
      const site = pair.group.startsWith('site:') ? pair.group.slice(5) : null;
      if (site && site === townSceneSite) continue;
      const speakers = pair.ids.map(id => { const e = world.entities[id]; return { householdId: e.householdId, point: e.location }; });
      const camp = world.army?.members?.includes(pair.ids[0]) ? 'force' : world.entities[pair.ids[0]]?.service?.kind || null;
      talking.push({ pair, context: { setting: pair.setting, point: pair.point, camp, viewer, speakers, band } });
    }
    for (const [armyId, camp] of Object.entries(camps)) {
      const army = view.armies.find(one => one.id === armyId);
      for (const pair of camp.pairs) if (pair.talking) talking.push({ pair, context: { setting: armyId === 'garrison' ? 'garrison' : 'camp', point: army, camp: armyId, viewer, speakers: pair.ids.map(() => ({ point: army })), band } });
    }
    for (const crowd of crowds) {
      const site = world.map.sites[crowd.siteId];
      for (const pair of crowd.pairs) if (pair.talking) talking.push({ pair, context: { setting: 'refuge', point: site, camp: null, viewer, speakers: pair.ids.map(() => ({ point: site })), band } });
    }
    // A few a tick, taken in an order the tick turns, so every pair on the page has its turn over a minute.
    const most = host ? HOST_EXCHANGES : PAGE_EXCHANGES;
    talking.sort((a, b) => stirredShare(world, a.pair.key, `turn:${world.tick}`) - stirredShare(world, b.pair.key, `turn:${world.tick}`));
    const sites = new Set();
    for (const one of talking) {
      if (lines.length / 2 >= most) break;
      // The Host: one exchange a place a tick, so a busy town does not take the whole class's share.
      const place = one.pair.group || one.pair.ids[0].split(':').slice(0, 2).join(':');
      if (host && sites.has(place)) continue;
      const said = exchangeOf(world, one.pair, one.context);
      if (!said) continue;
      sites.add(place);
      lines.push(...said);
    }
  }
  if (!Object.keys(camps).length && !crowds.length && !lines.length) return null;
  return {
    ...(Object.keys(camps).length && { camps }),
    ...(crowds.length && { crowds }),
    ...(lines.length && { lines }),
  };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Checks the tests hold every line to
// ---------------------------------------------------------------------------------------------------------------------------
/** Place names and words a reader of this game meets everywhere, allowed past the syllable bound. */
export const LONG_WORDS_ALLOWED = Object.freeze(['gonzales', 'concepción', 'colorado', 'volunteers', 'surrendered', 'santa', 'anna', 'alamo', 'mexican', 'officers', 'everything', 'anybody', 'terrible', 'already']);
/**
 * Syllables in a word, the plain way: groups of vowels, a silent final e dropped, and the silent e of "-ed" after anything but
 * t or d ("burned" is one, "wanted" two). Good enough to hold short lines to.
 */
export function syllables(word) {
  const w = String(word).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g)?.length || 1;
  const silent = (/[^l]e$/.test(w) || /[^aeioutd]ed$/.test(w)) && groups > 1 ? 1 : 0;
  return Math.max(1, groups - silent);
}
/** Why a line is not short and plain enough to read at a glance, or null. */
export function unreadable(text) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length > LINE_WORDS) return `${words.length} words`;
  if (text.length > LINE_CHARS) return `${text.length} characters`;
  for (const word of words) {
    const bare = word.toLowerCase().replace(/[^a-záéíóúñ']/g, '').replace(/'s$/, '');
    if (syllables(word) > 3 && !LONG_WORDS_ALLOWED.includes(bare)) return `"${word}" is ${syllables(word)} syllables`;
  }
  // The mean of a line of one or two words is the word itself, which the bound above has already held.
  const mean = words.reduce((sum, word) => sum + syllables(word), 0) / words.length;
  if (words.length >= 3 && mean > 1.8) return `${mean.toFixed(2)} syllables a word`;
  return null;
}
