// Read Aloud's auto voice: who is likely speaking each part of a text, a woman or a man, so the page can read it
// in a woman's or a man's voice. Used by the page (read-aloud/index.html) and by tests/read-aloud-gender.test.mjs.
//
// It only looks for words that say who is talking, and otherwise says nothing:
// - a speaker's label at the start of a line ("Mom: Dinner is ready.", "Mr. Lee: Sit down.");
// - who said a quotation ("Come here," said Father. / "I'm tired," she whispered. / Sarah asked, "Why?");
// - a reader saying who they are ("I am a girl", "as your dad", "My name is Maria", a "Love, Grandma" signature),
//   which then holds for the whole text wherever no other speaker is named.
// Anything else - narration, a sentence with no speaker, a name it doesn't know - is null, and the page reads it in
// the voice the teacher chose.
// ceiling: a word list and a few patterns, not a language model. A name it doesn't list, or a speaker named three
// sentences before their words, falls back to the chosen voice; a model would be justified only if teachers find
// the fallback reads the wrong person often enough to matter.

const FEMALE_WORDS = ['she', 'mom', 'mommy', 'mama', 'mother', 'ma', 'grandma', 'grandmother', 'granny', 'nana',
  'aunt', 'auntie', 'sister', 'daughter', 'girl', 'woman', 'lady', 'wife', 'queen', 'princess', 'mrs', 'ms', 'miss',
  'madam', 'maam', "ma'am", 'senora', 'senorita', 'dona', 'niece', 'stepmother', 'stepmom', 'godmother', 'mistress',
  'sis', 'gal', 'heroine', 'actress', 'witch', 'duchess', 'empress'];
const MALE_WORDS = ['he', 'dad', 'daddy', 'papa', 'pa', 'father', 'grandpa', 'grandfather', 'granddad', 'uncle',
  'brother', 'son', 'boy', 'man', 'gentleman', 'husband', 'king', 'prince', 'mr', 'sir', 'senor', 'don', 'nephew',
  'stepfather', 'stepdad', 'godfather', 'master', 'bro', 'guy', 'hero', 'actor', 'wizard', 'duke', 'emperor', 'lord',
  'captain', 'colonel', 'general', 'sergeant'];
const FEMALE_NAMES = ['mary', 'maria', 'sarah', 'emma', 'olivia', 'ava', 'sophia', 'isabella', 'mia', 'emily', 'abigail',
  'madison', 'elizabeth', 'charlotte', 'amelia', 'harper', 'evelyn', 'ella', 'grace', 'chloe', 'lily', 'hannah', 'anna',
  'jessica', 'ashley', 'jennifer', 'linda', 'patricia', 'susan', 'karen', 'nancy', 'lisa', 'margaret', 'betty', 'sandra',
  'dorothy', 'helen', 'ruth', 'rachel', 'rebecca', 'laura', 'amy', 'kate', 'katie', 'kathryn', 'catherine', 'julia',
  'alice', 'jane', 'lucy', 'zoe', 'nora', 'ellie', 'aria', 'layla', 'riley', 'victoria', 'natalie', 'samantha', 'leah',
  'stella', 'hazel', 'violet', 'aurora', 'savannah', 'brooklyn', 'paisley', 'camila', 'valentina', 'sofia', 'lucia',
  'gabriela', 'daniela', 'ana', 'rosa', 'carmen', 'juana', 'josefa', 'guadalupe', 'ximena', 'jasmine', 'aaliyah',
  'destiny', 'diamond', 'imani', 'keisha', 'tiffany', 'brittany', 'megan', 'lauren', 'nicole', 'stephanie', 'heather',
  'michelle', 'kimberly', 'melissa', 'amanda', 'angela', 'emily', 'wendy', 'anne', 'annie', 'molly', 'polly', 'susanna',
  'eliza', 'martha', 'abby', 'becky', 'peggy', 'sally', 'dolly', 'clara', 'esther', 'naomi', 'ruby', 'pearl', 'ivy',
  'rose', 'daisy', 'fern', 'wilma', 'hermione', 'ramona', 'matilda', 'judy', 'dora', 'elsa', 'anna', 'moana', 'belle'];
const MALE_NAMES = ['john', 'james', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth',
  'kevin', 'brian', 'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas',
  'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'frank', 'gregory',
  'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'henry', 'adam', 'peter', 'nathan',
  'zachary', 'kyle', 'noah', 'liam', 'oliver', 'elijah', 'lucas', 'mason', 'logan', 'ethan', 'aiden', 'jackson',
  'sebastian', 'mateo', 'leo', 'owen', 'wyatt', 'luke', 'gabriel', 'carter', 'jayden', 'dylan', 'grayson', 'levi',
  'isaac', 'caleb', 'josiah', 'hunter', 'connor', 'eli', 'max', 'sam', 'tom', 'tim', 'bob', 'bill', 'joe', 'jim',
  'jose', 'juan', 'carlos', 'luis', 'miguel', 'jesus', 'antonio', 'francisco', 'pedro', 'diego', 'santiago', 'manuel',
  'rafael', 'fernando', 'ricardo', 'alejandro', 'javier', 'jamal', 'darnell', 'malik', 'tyrone', 'deshawn', 'andre',
  'travis', 'sam', 'stephen', 'davy', 'jim', 'sam', 'harry', 'ron', 'charlie', 'arthur', 'fred', 'frederick', 'albert',
  'abraham', 'moses', 'martin', 'hank', 'huck', 'tom', 'peter', 'mario', 'bowie', 'crockett', 'houston', 'austin'];

const FEMALE = new Set([...FEMALE_WORDS, ...FEMALE_NAMES]);
const MALE = new Set([...MALE_WORDS, ...MALE_NAMES]);
const SAY = '(?:said|says|asked|asks|replied|replies|answered|answers|shouted|shouts|yelled|yells|whispered|whispers|'
  + 'called|calls|cried|cries|told|tells|added|adds|exclaimed|exclaims|explained|explains|laughed|sighed|began|continued|'
  + 'muttered|mumbled|screamed|sang|sings|wondered|insisted|declared|announced|warned|begged|pleaded|answered)';

const plain = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.’]/g, '');

/** The gender a person's word or name points to: 'female', 'male' or null. "Mrs. Lopez", "Grandma", "Sarah", "she". */
export function genderOfWords(words) {
  const tokens = plain(String(words)).replace(/'s\b/g, ' ').replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
  // The last word it knows decides: a title before a surname it doesn't ("Mrs. Lopez", "Uncle Ray"), the noun after
  // a possessive ("Mary's brother", "her son").
  for (const t of tokens.reverse()) {
    if (FEMALE.has(t) && !MALE.has(t)) return 'female';
    if (MALE.has(t) && !FEMALE.has(t)) return 'male';
  }
  return null;
}

const QUOTES = /["“”]/g;
const quoteCount = s => (s.match(QUOTES) || []).length;
// A speaker: a pronoun, or up to three words that start with a capital or are a kin word ("the old man", "Mr. Lee").
const WHO = "((?:the |my |our |his |her |their |your |a |an )?(?:[a-z]+ )?(?:[A-Za-zÀ-ſ][\\w'.À-ſ-]*)(?: [A-Z][\\w'.À-ſ-]*){0,2})";

/** Who said a sentence or quotation, from its own words: { gender, why } or null. */
export function speakerOf(text) {
  const s = String(text).trim();
  // "Mom: Dinner is ready." A label at the start of a line, before any quotation.
  const label = s.match(/^([A-ZÀ-ſ][\w'.À-ſ -]{0,30}?)\s*:\s/);
  if (label) { const g = genderOfWords(label[1]); if (g) return { gender: g, why: `label "${label[1]}"` }; }
  if (quoteCount(s)) {
    // After the quotation: ..." she said. / ..." said Mrs. Lopez. / ...," Father answered.
    const after = s.match(new RegExp(`["”]\\s*,?\\s*(?:${SAY}\\s+${WHO}|${WHO}\\s+(?:\\w+ly\\s+)?${SAY})`, 'i'));
    // Before the quotation: Sarah asked, "... / She said: "...
    const before = s.match(new RegExp(`${WHO}\\s+(?:\\w+ly\\s+)?${SAY}\\s*[,:]?\\s*["“]`, 'i'));
    for (const m of [after, before]) {
      const who = m && (m[1] || m[2]);
      const g = who && genderOfWords(who);
      if (g) return { gender: g, why: `said by "${who.trim()}"` };
    }
  }
  return null;
}

/** A reader saying who they are, anywhere in the text: { gender, why } or null. */
export function readerOf(text) {
  const s = String(text);
  const self = s.match(/\b(?:I(?:'m|’m| am)|as)\s+(?:(?:a|an|the|your|his|her|their|our|just|only|still)\s+)*(?:(?:little|big|young|old|proud|new|older|younger)\s+)?([A-Za-z]+)\b/gi) || [];
  for (const m of self) {
    const word = m.split(/\s+/).pop();
    const g = [...FEMALE_WORDS, ...MALE_WORDS].includes(plain(word)) && genderOfWords(word);
    if (g && !['he', 'she'].includes(plain(word))) return { gender: g, why: `"${m.trim()}"` };
  }
  const named = s.match(/\b(?:my name is|my name's|I'm called|call me)\s+([A-Z][a-z]+)/i);
  if (named) { const g = genderOfWords(named[1]); if (g) return { gender: g, why: `"${named[0]}"` }; }
  // A signature on the last line: "Love, Grandma" / "- Mr. Lee" / "Sincerely, Maria".
  const sig = s.trim().match(/(?:^|\n|[.!?]\s+)(?:love|sincerely|from|yours|your friend|thanks|best|cheers)?,?\s*[-—–]?\s*((?:mr|mrs|ms|miss|sir)?\.?\s*[A-Z][a-z]+)\s*[.!]?$/i);
  if (sig && /(?:love|sincerely|from|yours|friend|thanks|best|cheers),|[-—–]\s*\S+\s*$/i.test(s.trim().split('\n').pop())) {
    const g = genderOfWords(sig[1]);
    if (g) return { gender: g, why: `signed "${sig[1].trim()}"` };
  }
  return null;
}

/** Split a text into sentences, keeping a quotation that runs over several sentences together. */
export function utterances(text) {
  // "Mrs. Brown" is not the end of a sentence.
  const held = String(text).replace(/\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Capt|Col|Gen|Lt|Sgt|Prof|Rev)\./g, '$1\u0001');
  const sentences = (held.match(/[^.!?\n]+(?:[.!?]+["”')\]]*|$)|\n/g) || []).map(s => s.replace(/\u0001/g, '.'));
  const out = [];
  let open = null;
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) { open = null; continue; }
    // "Run!" said Mom. - the words after a quotation that ends in ! or ? still say who said it.
    const prev = out[out.length - 1];
    if (!open && prev && /["”]$/.test(prev[prev.length - 1]) && /^[a-z]/.test(s)) { prev.push(s); continue; }
    if (open) { open.push(s); if (quoteCount(s) % 2) { out.push(open); open = null; } continue; }
    if (quoteCount(s) % 2) open = [s];
    else out.push([s]);
  }
  if (open) out.push(open);
  return out;
}

/**
 * Who reads each sentence: [{ text, gender, why }]. A sentence (or a quotation spanning several) takes its own
 * speaker; one with none takes the reader's, if the text says who that is; otherwise gender is null.
 */
export function assignSpeakers(text) {
  const reader = readerOf(text);
  const parts = [];
  for (const group of utterances(text)) {
    const own = speakerOf(group.join(' ')) || speakerOf(group[group.length - 1]);
    const who = own || reader;
    for (const s of group) parts.push({ text: s, gender: who?.gender ?? null, why: who?.why ?? null });
  }
  return parts;
}
