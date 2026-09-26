// The Rumor Mill as one running story (owner, 2026-09-18, docs/HOST_PAGE.md §2.2).
//
// The owner asked for "a short, easy to read story" that "will adapt and change as new rumors flow in. Some are true, some
// aren't." Until now the mill was a list of the public's reports, each a paragraph long, and everything the war told family
// by family - the Alamo, Goliad, San Jacinto - never reached it. Chosen by multiple choice: the story replaces the list; word
// that changed keeps its turn ("first word had it that..."); and the story draws on everything any family has heard.
//
// A piece of news is a topic of the game's knowledge (sim/knowledge.mjs). Each one the game can tell has a line here, in the
// past tense, taken from the report's own words and nothing else: no new history is written, and the truth is never read.
// What the story says is what the families heard - the words of their tellings, how firm the word was, how far it went.
// A topic with no line here is told in the words of its report (`firstSentence`), so a new topic is never silent; the tests
// fail until it has a line (tests/rumour-story.test.mjs).
import { dateOf } from './directors.mjs';

/**
 * Every piece of news the game tells, as a clause the story can put after "In December," or "it was said that". `told` is
 * the word as it last stood; `first` is what the first word had, for news whose telling changed.
 */
export const STORY_LINES = Object.freeze({
  'cannon-request': { told: 'a Mexican detachment came to the Guadalupe opposite Gonzales for the town\'s cannon, and the settlers would not give it up' },
  'upriver-call': { told: 'the men at Gonzales gathered at the ferry at dusk to cross the Guadalupe with the cannon and go up the river after the Mexican camp' },
  'force-crossing': { told: 'the Texians crossed the Guadalupe in the night and went upriver after the Mexican camp' },
  'gonzales-outcome': { told: 'the Mexican detachment withdrew, and the Texians kept the cannon' },
  'goliad-taken': { told: 'the volunteers took the presidio at Goliad in the night, with its stores and arms' },
  'concepcion-fight': { told: 'about ninety men under Bowie and Fannin beat back the Mexicans in the fog at Mission Concepción, and Richard Andrews of Mina was killed' },
  'silver-train': { first: 'a Mexican pack train was coming in to Béxar with silver to pay the garrison', told: 'the pack train carried only grass for the horses' },
  'grass-fight': { first: 'there had been a fight near Béxar, with ten of the enemy dead and no loss on our side', told: 'Bowie\'s horsemen caught a pack train west of Béxar and drove the Mexican troops back into the town, and no man of ours was killed' },
  'bexar-storming': { first: 'the volunteers had gone into Béxar at daylight on the 6th and taken the town', told: 'Béxar fell after four days of fighting from house to house; Ben Milam was killed, and Cos gave up the town and went south on his word' },
  'winter-terms': { told: 'General Houston called for volunteers, with land promised to every man who enlisted' },
  'winter-bexar': { told: 'Colonel Neill held Béxar with fewer than a hundred men, after most of the men and supplies went south for an attack on Matamoros' },
  'winter-council': { told: 'the government at San Felipe fell out with itself, and the council put out Governor Smith' },
  'winter-travis': { told: 'William Barret Travis came to Béxar with about thirty horsemen' },
  'winter-crockett': { told: 'David Crockett of Tennessee reached Béxar with a few volunteers' },
  'winter-santa-anna': { told: 'Santa Anna himself had crossed the Rio Grande with a great army and was marching on Béxar' },
  'alamo-siege': { told: 'Travis wrote from the Alamo that Santa Anna had him under siege, and called on every man to come to his aid' },
  'fannin-back': { told: 'Fannin set out from Goliad to relieve the Alamo, and turned back' },
  'san-patricio': { told: 'Urrea\'s cavalry fell on Johnson\'s men at San Patricio before dawn' },
  declaration: { told: 'the convention at Washington declared Texas independent and named Sam Houston commander of its forces' },
  'agua-dulce': { told: 'Grant and his party were cut to pieces by Mexican cavalry at Agua Dulce Creek' },
  'alamo-fall': { first: 'two Mexican riders said the Alamo had fallen, though General Houston thought them spies', told: 'the Alamo fell at dawn on March 6 and every man in it was killed; Mrs. Dickinson, her child and Travis\'s servant Joe came in to Gonzales' },
  'houston-colorado': { told: 'General Houston fell back over the Colorado and camped near Beeson\'s crossing' },
  'goliad-defeat': { told: 'Fannin was caught on the open prairie near Goliad and surrendered his whole command to Urrea' },
  'houston-san-felipe': { told: 'the army fell back to the Brazos, and San Felipe was burned' },
  'goliad-massacre': { told: 'the prisoners taken with Fannin were marched out of Goliad and shot' },
  'santa-anna-brazos': { told: 'Santa Anna crossed the Brazos at Fort Bend and made for Harrisburg' },
  'san-jacinto': { told: 'General Houston destroyed Santa Anna\'s army at San Jacinto and took Santa Anna prisoner, and the war was won' },
});

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** How firm a telling is: a family that has it confirmed outweighs one that has it as a rumour. */
const FIRMNESS = Object.freeze({ rumor: 0, unconfirmed: 1, confirmed: 2, contradicted: 2 });
const capital = text => text.charAt(0).toUpperCase() + text.slice(1);
/** A report's first sentence, as heard: what the story falls back on, and what "the latest" quotes. */
export const firstSentence = text => { const match = String(text || '').match(/^.*?[.!?](?=\s|$)/); return (match ? match[0] : String(text || '')).trim(); };

/** The word as it stands, framed by how firm it is. */
function framed(status, clause) {
  if (status === 'rumor') return `it was said that ${clause}`;
  if (status === 'unconfirmed') return `word not yet sure said that ${clause}`;
  return clause;
}

/** Each topic any family has heard (or the public), with its tellings in order, how firm it stands and how far it went. */
function heardTopics(world) {
  const families = Object.values(world.households);
  const tellings = {};
  for (const event of world.events) {
    if (event.type !== 'information' || !event.topicId) continue;
    (tellings[event.topicId] ??= []).push({ minute: event.minute, status: event.status, text: event.text });
  }
  const known = new Set(Object.keys(world.knowledge?.public || {}));
  for (const family of families) for (const topicId of Object.keys(world.knowledge?.households?.[family.id] || {})) known.add(topicId);
  return [...known].filter(topicId => tellings[topicId]?.length).map(topicId => {
    const told = tellings[topicId];
    // When the word last changed: new words, or firmer than it stood. A far family hearing old news late - the rumour of a
    // thing already confirmed nearer home - is not new news, and does not undo the firmer word.
    let changed = told[0], firmest = FIRMNESS[told[0].status];
    for (const telling of told.slice(1)) {
      const firmer = FIRMNESS[telling.status] > firmest, newer = telling.text !== changed.text && FIRMNESS[telling.status] >= FIRMNESS[changed.status];
      if (firmer || newer) { changed = telling; firmest = Math.max(firmest, FIRMNESS[telling.status]); }
    }
    const status = changed.status;
    return {
      topicId, first: told[0], changed, status, turned: told[0].text !== changed.text,
      heardBy: families.filter(family => world.knowledge?.households?.[family.id]?.[topicId]).length, families: families.length,
    };
  }).sort((a, b) => a.first.minute - b.first.minute || a.topicId.localeCompare(b.topicId));
}

/** One piece of news as a sentence of the story: its turn if the word changed, how firm it is, how far it went. */
function sentenceOf(topic) {
  const line = STORY_LINES[topic.topicId];
  const told = line?.told ?? `word came that "${firstSentence(topic.changed.text).replace(/[.!?]$/, '')}"`;
  let sentence;
  if (topic.turned) {
    const first = line?.first ?? `"${firstSentence(topic.first.text).replace(/[.!?]$/, '')}"`;
    sentence = topic.status === 'contradicted'
      ? `first word had it that ${first}, but it was not so: ${told}`
      : `first word had it that ${first}. ${topic.status === 'confirmed' ? 'Fuller word said' : 'Later word said'} ${told}`;
  } else sentence = framed(topic.status, told);
  const reach = topic.heardBy < topic.families ? ` (heard by ${topic.heardBy} of ${topic.families} families)` : '';
  return `${sentence}${reach}.`;
}

/**
 * The Rumor Mill as one running story: a paragraph a month, in the order the news first reached the colonies, and the
 * latest word as it was heard. `key` changes only when the story does, so the page rewrites it only then.
 */
export function rumourStory(world) {
  const topics = heardTopics(world);
  const paragraphs = [];
  let year = null;
  for (const topic of topics) {
    const at = dateOf(world, topic.first.minute), month = `${MONTHS[at.getUTCMonth()]}${at.getUTCFullYear() !== year && year !== null ? ` ${at.getUTCFullYear()}` : ''}`;
    year = at.getUTCFullYear();
    const sentence = sentenceOf(topic);
    const last = paragraphs.at(-1);
    if (last?.month === MONTHS[at.getUTCMonth()] || last?.label === month) last.sentences.push({ topicId: topic.topicId, text: capital(sentence) });
    else paragraphs.push({ month: MONTHS[at.getUTCMonth()], label: month, sentences: [{ topicId: topic.topicId, text: `In ${month}, ${sentence}` }] });
  }
  const newest = topics.reduce((best, topic) => !best || topic.changed.minute > best.changed.minute ? topic : best, null);
  const latestAt = newest && dateOf(world, newest.changed.minute);
  const latest = newest ? { topicId: newest.topicId, date: `${MONTHS[latestAt.getUTCMonth()]} ${latestAt.getUTCDate()}`, status: newest.changed.status, text: firstSentence(newest.changed.text) } : null;
  const text = paragraphs.map(paragraph => paragraph.sentences.map(sentence => sentence.text).join(' '));
  return { paragraphs: text, topics: topics.map(topic => topic.topicId), latest, key: JSON.stringify([text, latest]) };
}
