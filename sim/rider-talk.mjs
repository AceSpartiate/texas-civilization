// What is said in a rider's scene besides the rider's own word: who of the people standing there asks each question, what they
// say among themselves when they hear it, and what an express rider who comes by can tell a family.
//
// The owner, 2026-10-05: "The conversation is boring. Let's redo each of them as a cutscene ... family or townsfolk ask the
// questions." (docs/COLONIES.md §5.4e.) So a question the student chooses is asked by somebody in the scene - a child asks one,
// the mother another, a townsman a third - and the people about the rider react: worry, a child's question, the mother asking
// after the father who is away, two townsmen arguing. Every word is invented (`FIC-GONZ-1197`, `-1198`) and is spoken in the
// world: kept on the encounter (`talk`), sent to the family's page only once said, never a line of the rider's answers before
// they are given. Nothing here is a fact the family learns: what it learns is the rider's word, in sim/encounters.mjs.
//
// The express conversations (`expressScript`) give every word carried by express - the autumn's letters, the winter's news and
// the spring's (sim/directors.mjs `sendWord`, `carryWord`) - an opening and questions of its own (`FIC-GONZ-1196`). The opening
// is the word as the family's journal has it, which the director already registers (each word's own `HIST-TEX-` claim); the
// answers add nothing to it but where it came in, how old it is and how sure, which is the provenance the express carries.
import { ageNow } from './family.mjs';

/** How a word lands with the people who hear it, for what they say: a call, relief, worry, alarm, grief or plain news. */
export const TOPIC_MOOD = Object.freeze({
  'cannon-request': 'call', 'gonzales-outcome': 'relief', 'goliad-taken': 'relief', 'silver-train': 'news', 'grass-fight': 'relief',
  'bexar-storming': 'relief', 'winter-terms': 'call', 'winter-bexar': 'worry', 'winter-council': 'quarrel', 'winter-travis': 'news',
  'winter-crockett': 'news', 'winter-grass': 'worry', 'bexar-arrival': 'alarm', 'alamo-siege': 'alarm', 'fannin-back': 'worry',
  'san-patricio': 'grief', declaration: 'news', 'agua-dulce': 'grief', 'alamo-fall': 'grief', 'houston-colorado': 'worry',
  'goliad-defeat': 'grief', 'houston-san-felipe': 'alarm', 'goliad-massacre': 'grief', 'santa-anna-brazos': 'alarm', 'san-jacinto': 'relief',
  'alamo-couriers': 'alarm',
});
export const moodOf = topicId => TOPIC_MOOD[topicId] || 'news';

const hash = text => { let h = 2166136261; for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const capital = text => text ? text[0].toUpperCase() + text.slice(1) : text;

// ------------------------------------------------------------------------------------------------ the express's word

/** The word as the rider says it: the journal's text without its own "Word has come that" or "Word from Béxar:", which he says. */
export function wordAsSaid(text) {
  return capital(String(text || '').replace(/^Word has come that\s+/i, '').replace(/^Word from [^:]{1,40}:\s+/i, '').replace(/^An express from the army says\s+/i, 'The army says ').trim());
}
/** "Word from the army" as part of a sentence: "word from the army"; a name keeps its capital ("Travis's letter"). */
const sourcePhrase = source => {
  const words = String(source || 'word by express');
  return /^(Word|A|An|Men|Talk|Riders|Two)\b/.test(words) ? words[0].toLowerCase() + words.slice(1) : words;
};
const SURE = Object.freeze({
  rumor: 'No. It is only what is being said. Nobody I spoke to had it from anybody who saw it.',
  unconfirmed: 'It came by letter, and nobody has said otherwise yet. That is as sure as I can make it.',
  confirmed: 'There is no doubt of it where I had it. Every letter says the same.',
  contradicted: 'That is the correction, and it came down the same road as the first word did.',
});

/**
 * One more question a word raises, written for it: asked by somebody of the scene (`by`), answered from the word itself and
 * nothing beyond it. Each answer restates the journal's own text or says what the rider does not know.
 */
const EXTRA = Object.freeze({
  'goliad-taken': { ask: 'Was there much fighting?', by: ['father', 'town', 'grown'], answer: () => 'The letter does not say what it cost, and I will not guess. The volunteers hold the presidio now, and its stores.' },
  'silver-train': { ask: 'Silver? Truly?', by: ['child', 'town', 'grown'], answer: ({ status }) => status === 'contradicted' ? 'Grass, cut for their horses. That is the end of the silver.' : 'That is the talk in the camp. Nobody I spoke to has seen any of it.' },
  'grass-fight': { ask: 'Was it silver they took?', by: ['child', 'town', 'grown'], answer: ({ status }) => status === 'rumor' ? 'Some say so. I would not count on it till the men come back and tell it.' : 'Grass, cut for the horses in Béxar. Not silver.' },
  'bexar-storming': { ask: 'Is Béxar taken, then?', by: ['father', 'town', 'child'], answer: ({ status }) => status === 'rumor' ? 'That is what the express says. I would wait for a letter before I rang any bells.' : 'The volunteers hold the town. Cos and his officers are to go into the interior on their word, the letter says.' },
  'winter-terms': { ask: 'Is there land in it for a man?', by: ['father', 'grown', 'town'], answer: () => 'Eight hundred acres and twenty-four dollars to a man who enlists in the regulars for two years or the war. Six hundred and forty acres to a volunteer for the war. Men are to enlist at San Felipe.' },
  'winter-bexar': { ask: 'Who is holding Béxar?', by: ['grown', 'town', 'child'], answer: () => 'Colonel Neill, with fewer than a hundred men, the letter says - and short of money, horses and clothes.' },
  'winter-council': { ask: 'Who is in charge, then?', by: ['town', 'father', 'grown'], answer: () => 'The council says one thing and Governor Smith another. I would not like to say which of them is right.' },
  'winter-travis': { ask: 'Who is this Travis?', by: ['child', 'grown', 'town'], answer: () => 'He came to Béxar with about thirty horsemen, the letter says. That is all I know of him.' },
  'winter-crockett': { ask: 'Crockett? Who is he?', by: ['child', 'grown', 'town'], answer: () => 'A Tennessee man, the letter says, come with a few volunteers. That is all I know of him.' },
  'winter-grass': { ask: 'When do they look for the Mexican army?', by: ['mother', 'grown', 'town'], answer: () => 'Not before the middle of March, Colonel Travis thinks, when the grass is up for their horses. That is what the letter says.' },
  'bexar-arrival': { ask: 'Will they come this way?', by: ['mother', 'child', 'grown'], answer: () => 'Nobody on this road can tell you that. The letter asks for men and provisions, and it says no more than that.' },
  'alamo-siege': { ask: 'Will they come this way?', by: ['mother', 'child', 'grown'], answer: () => 'Nobody on this road can tell you that. Travis asks for every man who can bear arms, and says no more than that.' },
  'fannin-back': { ask: 'Why did he turn back?', by: ['father', 'grown', 'town'], answer: () => 'His wagons broke down and his oxen strayed, the letter says. More than that I could not tell you.' },
  'san-patricio': { ask: 'Who were they?', by: ['grown', 'town', 'child'], answer: () => 'Men who went south with Johnson for Matamoros. I have no names, and I will not guess at any.' },
  'agua-dulce': { ask: 'Who were they?', by: ['grown', 'town', 'child'], answer: () => 'Men who went south with Grant for Matamoros. I have no names, and I will not guess at any.' },
  declaration: { ask: 'What does that mean, independent?', by: ['child', 'grown', 'town'], answer: () => 'That Texas is to be a country of its own, and no longer a part of Mexico. That is what the convention says it has done.' },
  'alamo-fall': { ask: 'Was anybody spared?', by: ['mother', 'grown', 'town'], answer: () => 'Mrs. Dickinson and her child, and Joe, who fought beside Travis. They have come in to Gonzales. Of anybody else, I could not tell you.' },
  'houston-colorado': { ask: 'Why does the army keep falling back?', by: ['father', 'town', 'grown'], answer: () => 'I could not tell you what the General means to do. Nobody on this road knows it.' },
  'houston-san-felipe': { ask: 'Why does the army keep falling back?', by: ['father', 'town', 'grown'], answer: () => 'I could not tell you what the General means to do. Nobody on this road knows it.' },
  'goliad-defeat': { ask: 'What became of the men?', by: ['mother', 'grown', 'town'], answer: () => 'The letter says he surrendered his whole command. What has been done with them since, it does not say.' },
  'goliad-massacre': { ask: 'Did any of them get away?', by: ['mother', 'grown', 'town'], answer: () => 'A few, it says. It gives no names, and I will not guess at any.' },
  'santa-anna-brazos': { ask: 'Where is he making for?', by: ['father', 'mother', 'town'], answer: () => 'Harrisburg, the letter says, and the government there. Beyond that nobody knows.' },
  'san-jacinto': { ask: 'Can we go home?', by: ['child', 'mother', 'grown'], answer: ({ stop }) => `That is what they are saying at ${stop}: the war is won, and the families can go home.` },
});

/**
 * What an express rider can say of a word (`FIC-GONZ-1196`): the word itself, where it came in and how he came by it, how old it
 * is, how sure, and one question the word raises (`EXTRA`). He is a rider of the settlement it came in to and never claims to
 * have seen any of it: `firsthand` is never true of an express.
 */
export function expressScript(topicId) {
  const extra = EXTRA[topicId];
  return {
    opening: ({ word, stop, from }) => `${stop === from ? `Word has come in to ${from}, and I was sent out with it.` : `Word came in to ${stop} by express from ${from}, and I was sent out with it.`} ${wordAsSaid(word.text)}`,
    lines: [
      { id: 'when-left', ask: 'When did this happen?', by: ['grown', 'town', 'mother'], answer: ({ departedAgo, observedAgo, stop }) => `I set out from ${stop} with it ${departedAgo === 'less than an hour' ? 'less than an hour' : departedAgo} ago, and what it tells of was already ${observedAgo} old by then. Reckon on it being older still.` },
      { id: 'who-says', ask: 'Who says so?', by: ['town', 'father', 'grown'], answer: ({ word, stop }) => `It came in as ${sourcePhrase(word.source)}, and was read out at ${stop}. I saw none of it myself.` },
      { id: 'sure', ask: 'Is it certain?', by: ['mother', 'child', 'grown'], answer: ({ word }) => SURE[word.status] || SURE.unconfirmed, react: ({ word }) => word.status === 'rumor' ? { by: ['grown', 'town'], text: 'Then it may not be so at all.' } : word.status === 'confirmed' ? { by: ['grown', 'town'], text: 'Then it is so.' } : null },
      ...(extra ? [{ id: 'extra', ask: extra.ask, by: extra.by, answer: account => extra.answer({ ...account, status: account.word.status }) }] : []),
    ],
  };
}

/**
 * A word with nothing written for it (`FIC-GONZ-1196`): a report of a class saved before every rider was a scene, or anything a
 * later change sends by a rider without words of its own. The word, when, and who says so - never a fact beyond the word.
 */
export function plainScript() {
  return {
    opening: ({ word }) => `I have word for your family. ${wordAsSaid(word.text)}`,
    lines: [
      { id: 'when-left', ask: 'When did this happen?', by: ['grown', 'town'], answer: ({ observedAgo, departedAgo }) => `I have been ${departedAgo} on the road, and it was ${observedAgo} old when I set out.` },
      { id: 'who-says', ask: 'Who says so?', by: ['town', 'grown'], answer: ({ word }) => `It came to me as ${sourcePhrase(word.source || 'word on the road')}. I saw none of it myself.` },
    ],
  };
}

// ------------------------------------------------------------------------------------------------ the family member who is away

/**
 * Somebody of the family away with the volunteers or the army when a rider comes: the mother, or a child, asks after them
 * (`FIC-GONZ-1199`). A rider carries no names - nobody in the chain gives a count of the dead or names a wound (HISTORY.md's
 * exclusions) - so the answer is always that he cannot say, which is also why the question is honest to ask.
 */
export function awayOf(world, household, inScene) {
  for (const id of household?.members || []) {
    const person = world.entities[id];
    if (!person || inScene.has(id) || ['dead', 'captured'].includes(person.health?.condition)) continue;
    if (person.service?.status === 'serving' || person.travel?.purpose === 'march') return person;
  }
  return null;
}
export const kinLine = away => ({
  id: 'kin', ask: `Have you any word of ${away.given}? ${away.he === 'she' ? 'She' : 'He'} is with the volunteers.`, by: ['spouse', 'own', 'grown'], kin: true,
  answer: ({ firsthand, express }) => firsthand && !express
    ? 'I did not know every man there by name. I saw no list of anybody hurt, and I will not guess at one for you.'
    : 'I carry no names, and none came with the word. I will not guess at one for you.',
  react: () => ({ by: ['spouse', 'grown'], text: 'Then no news is good news, I suppose.' }),
});

// ------------------------------------------------------------------------------------------------ who is standing there

/** The people of a scene who can say something, with what they are to the family: father, mother, a child, a townsman. */
export function speakersOf(world, encounter) {
  const cast = encounter.scene?.cast || [{ id: encounter.listenerId, role: 'listener' }];
  const listener = world.entities[encounter.listenerId];
  const awayId = encounter.kin?.id;
  return cast.map(({ id, role }) => {
    const person = world.entities[id];
    if (!person || ['dead', 'captured'].includes(person.health?.condition)) return null;
    const years = ageNow(world, person) ?? person.age;
    const age = Number.isFinite(years) ? years : ['son', 'daughter'].includes(person.kin?.role) ? 14 : 30;
    const family = role === 'listener' || role === 'family';
    const sex = person.sex || (['father', 'son'].includes(person.kin?.role) ? 'male' : ['mother', 'daughter'].includes(person.kin?.role) ? 'female' : null);
    return {
      id, role, family, sex, given: String(person.name || '').split(' ')[0], age,
      adult: age >= 18, child: family && age >= 5 && age < 18, little: family && age >= 3 && age < 5,
      listener: id === listener?.id, spouseOfAway: Boolean(awayId) && (person.kin?.spouse === awayId),
      childOfAway: Boolean(awayId) && (person.kin?.parents || []).includes(awayId),
    };
  }).filter(Boolean).filter(one => one.age >= 3);
}
const IS = Object.freeze({
  father: one => one.family && one.adult && one.sex === 'male',
  mother: one => one.family && one.adult && one.sex === 'female',
  grown: one => one.family && one.adult,
  child: one => one.child,
  little: one => one.little,
  town: one => !one.family && one.adult,
  // The one away is asked after by their own: their husband or wife, then their child (`kinLine`'s hints).
  spouse: one => one.spouseOfAway,
  own: one => one.spouseOfAway || one.childOfAway,
  any: one => one.family ? one.age >= 5 : one.adult,
});
const fits = (one, hint) => (IS[hint] || IS.any)(one);

/**
 * Who of the scene asks this question: the first of the line's own hints (`by`) somebody standing there fits and who has not
 * asked yet, then anybody who has not, then whoever asked least lately; the person the rider stopped for when nobody else is
 * there. Deterministic, so the page names the asker on the button before it is pressed and the same person asks it.
 */
export function askerFor(world, encounter, line) {
  const people = speakersOf(world, encounter).filter(one => IS.any(one));
  if (!people.length) return encounter.listenerId;
  const asked = encounter.said.filter(said => said.speaker === 'listener').map(said => said.speakerId || encounter.listenerId);
  const fresh = people.filter(one => !asked.includes(one.id));
  const hints = [...(line.by || []), 'grown', 'child', 'town'];
  // The one away is asked after by their own, whether or not they have asked something already.
  if (line.kin) for (const hint of ['spouse', 'own']) { const one = people.find(person => fits(person, hint)); if (one) return one.id; }
  for (const hint of hints) { const one = fresh.find(person => fits(person, hint)); if (one) return one.id; }
  if (fresh.length) return fresh[0].id;
  for (const hint of hints) { const one = people.find(person => fits(person, hint)); if (one) return one.id; }
  return people[0].id;
}

// ------------------------------------------------------------------------------------------------ what they say among themselves

// Lines a person of the scene says, by how the word lands (`TOPIC_MOOD`): when the rider has said it, and when he has gone. `by`
// names who may say it; `{Pa}` and `{Ma}` are what a child calls the parent standing there; `{away}` the one with the volunteers.
const OPENING = Object.freeze({
  call: [
    { by: 'mother', text: 'Soldiers, across the river. Lord keep us.' },
    { by: 'child', text: 'Will they come here, {parent}?' },
    { by: 'father', text: 'Then they will want every man with a rifle.' },
    { by: 'grown', text: 'I knew that cannon would bring trouble.' },
    { by: 'little', text: 'Is that a soldier, {parent}?' },
  ],
  relief: [
    { by: 'child', text: 'We beat them!' },
    { by: 'mother', text: 'Thank God for it.' },
    { by: 'father', text: 'Good news, for once.' },
    { by: 'grown', text: 'Well. That is a weight off.' },
  ],
  worry: [
    { by: 'father', text: 'I do not like the sound of that.' },
    { by: 'mother', text: 'That is not good news, whichever way you turn it.' },
    { by: 'child', text: 'Is that bad, {parent}?' },
    { by: 'grown', text: 'Hm. That is thin.' },
  ],
  alarm: [
    { by: 'mother', text: 'God help us.' },
    { by: 'little', text: '{parent}, are the soldiers coming?' },
    { by: 'child', text: 'Are they coming here, {parent}?' },
    { by: 'father', text: 'Then they will be wanting men.' },
    { by: 'grown', text: 'So it has come.' },
  ],
  grief: [
    { by: 'mother', text: 'Oh, those poor souls.' },
    { by: 'father', text: 'God rest them.' },
    { by: 'child', text: '{parent}, what does it mean?' },
    { by: 'grown', text: 'Every one of them somebody’s son.' },
  ],
  news: [
    { by: 'father', text: 'Well. That is something to chew on.' },
    { by: 'child', text: 'Who is that, {parent}?' },
    { by: 'mother', text: 'That will be all the talk at the store.' },
    { by: 'grown', text: 'Well, well.' },
  ],
  quarrel: [
    { by: 'grown', text: 'They are quarrelling in San Felipe, and we are the ones with the corn to get in.' },
    { by: 'mother', text: 'Grown men, squabbling like children.' },
  ],
});
/** Two of the town's people, or two volunteers, who do not agree: one says it, the other answers. */
const ARGUMENT = Object.freeze({
  call: ['I said this would come of keeping that cannon.', 'And what would you have done - handed it over?'],
  relief: ['There will be no living with the boys now.', 'Let them crow. They earned it.'],
  worry: ['Mark me, there is worse coming.', 'You have said that every week since spring.'],
  alarm: ['Load the wagons, I say.', 'And leave everything we have? Not on a letter.'],
  grief: ['They should never have been sent so far.', 'Hush. Not now.'],
  news: ['It will all come to nothing, you see.', 'You said that about the cannon.'],
  quarrel: ['The council will sort it out.', 'That council could not sort a sack of meal.'],
});
const CLOSING = Object.freeze({
  call: [
    { by: 'mother', text: 'Back to work, all of you. Worry never hoed a row.' },
    { by: 'father', text: 'We will talk of it at supper.' },
    { by: 'child', text: 'I would have liked to see the soldiers.' },
  ],
  relief: [
    { by: 'child', text: 'Can I go and tell the others?' },
    { by: 'mother', text: 'Well, the cow still wants milking.' },
    { by: 'grown', text: 'I will believe it is over when the men come home.' },
  ],
  worry: [
    { by: 'grown', text: 'We will keep our eyes open, that is all.' },
    { by: 'mother', text: 'Nothing to be done about it tonight.' },
    { by: 'child', text: 'I will look after the little ones, {parent}.' },
  ],
  alarm: [
    { by: 'father', text: 'Have the wagon looked over. Just in case.' },
    { by: 'mother', text: 'Keep the little ones close tonight.' },
    { by: 'child', text: 'I am not scared.' },
    { by: 'grown', text: 'We had best be ready to go, if it comes to it.' },
  ],
  grief: [
    { by: 'mother', text: 'We will say a prayer for them tonight.' },
    { by: 'father', text: 'Not a word of it in front of the little ones.' },
    { by: 'child', text: 'Will it be us next?' },
    { by: 'grown', text: 'God keep them.' },
  ],
  news: [
    { by: 'grown', text: 'Well. Back to it.' },
    { by: 'child', text: 'Wait till I tell the others.' },
    { by: 'mother', text: 'I will write it down for the family book.' },
  ],
  quarrel: [
    { by: 'grown', text: 'Well. Back to it.' },
  ],
});
const FAREWELL = Object.freeze([
  { text: 'Thank you for stopping.', reply: 'Good day to you.' },
  { text: 'God keep you on the road.', reply: 'And you.' },
  { text: 'Ride safe.', reply: 'I mean to.' },
  { text: 'Water your horse at the creek before you go on.', reply: 'I will, and thank you.' },
]);

/** What a child calls the parent standing there, for a line said to them. */
const parentWord = people => people.find(one => IS.mother(one)) ? 'Ma' : people.find(one => IS.father(one)) ? 'Pa' : 'Mama';
const fill = (text, ctx) => text.replace('{parent}', ctx.parent).replace('{away}', ctx.away || '');

/** One thing said by somebody of the scene, kept on the encounter where it falls in the conversation. */
function utter(world, encounter, speakerId, text, extra = {}) {
  (encounter.talk ||= []).push({ after: encounter.said.length, speakerId, text, minute: world.minute, ...extra });
}
/** The first of these lines somebody standing there can say, beginning at a place picked by the encounter, and who says it. */
function choose(lines, people, seed, { not = [] } = {}) {
  const start = hash(seed) % Math.max(1, lines.length);
  for (let k = 0; k < lines.length; k++) {
    const line = lines[(start + k) % lines.length];
    const who = people.find(one => !not.includes(one.id) && fits(one, line.by));
    if (who) return { line, who };
  }
  return null;
}

/**
 * The people of the scene react (`FIC-GONZ-1198`): `opening` when the rider has said his word - one of the family, a second
 * where there are three or more to speak, and two of the town's people or volunteers arguing it where there are two of them;
 * `answer` after an answer that has a reaction written for it; `closing` when he goes - the farewell to him and his reply, the
 * mother sending word to the one away if there is one, and a last line among themselves. Never a reaction to an answer not yet
 * given, so nothing here can carry what the rider has not said.
 */
export function react(world, encounter, stage, line = null) {
  const people = speakersOf(world, encounter);
  if (!people.length) return;
  const mood = moodOf(encounter.topicId);
  const ctx = { parent: parentWord(people), away: encounter.kin?.given || null };
  const seed = `${encounter.id}:${stage}:${line?.id || ''}`;
  if (stage === 'opening') {
    const first = choose(OPENING[mood] || OPENING.news, people, seed, { not: people.length > 1 ? [encounter.listenerId] : [] }) || choose(OPENING[mood] || OPENING.news, people, seed);
    if (first) utter(world, encounter, first.who.id, fill(first.line.text, ctx));
    const town = people.filter(one => !one.family && one.adult);
    if (town.length >= 2) {
      const [a, b] = ARGUMENT[mood] || ARGUMENT.news;
      utter(world, encounter, town[0].id, a); utter(world, encounter, town[1].id, b);
    } else if (people.length >= 3 && first) {
      const second = choose((OPENING[mood] || OPENING.news).filter(one => one !== first.line), people, `${seed}:2`, { not: [first.who.id] });
      if (second) utter(world, encounter, second.who.id, fill(second.line.text, ctx));
    }
    return;
  }
  if (stage === 'answer' && line?.react) {
    const said = typeof line.react === 'function' ? line.react(line.account || {}) : line.react;
    if (!said) return;
    const asker = encounter.said.at(-2)?.speakerId;
    const who = [said.by].flat().map(hint => people.find(one => one.id !== asker && fits(one, hint)) || people.find(one => fits(one, hint))).find(Boolean);
    if (who) utter(world, encounter, who.id, fill(said.text, ctx));
    return;
  }
  if (stage === 'closing') {
    const listener = people.find(one => one.listener) || people[0];
    const spouse = encounter.kin && people.find(one => one.spouseOfAway);
    if (spouse) {
      utter(world, encounter, spouse.id, `If you see ${encounter.kin.given} with the volunteers, tell ${encounter.kin.he === 'she' ? 'her' : 'him'} we are all well.`, { farewell: true });
      utter(world, encounter, 'rider', `I will, if I see ${encounter.kin.he === 'she' ? 'her' : 'him'}.`, { farewell: true });
    } else {
      const bye = FAREWELL[hash(seed) % FAREWELL.length];
      utter(world, encounter, listener.id, bye.text, { farewell: true });
      utter(world, encounter, 'rider', bye.reply, { farewell: true });
    }
    const last = choose(CLOSING[mood] || CLOSING.news, people, `${seed}:after`, { not: people.length > 1 ? [listener.id] : [] }) || choose(CLOSING[mood] || CLOSING.news, people, `${seed}:after`);
    if (last) utter(world, encounter, last.who.id, fill(last.line.text, ctx), { closing: true });
  }
}
