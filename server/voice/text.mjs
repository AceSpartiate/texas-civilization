// The read-aloud's words (owner, 2026-09-30, D15; docs/READ_ALOUD.md): how a line the game shows becomes the sentences the
// voice speaks, which voice speaks them, and the name each spoken sentence is kept under. One module for the three places
// that must agree exactly - the package build (scripts/build-voice.mjs), the Host's voice (server/voice/service.mjs) and
// its tests - so a sentence spoken at package time is the one the Host looks up in class.
//
// **Sentences, never splices.** A line is split into sentences, and each is spoken and kept whole. A template's sentences
// with no name or number in them are the same in every family's copy, so they are spoken once at package time; only the
// sentence with the name in it is spoken on the Host. Nothing is ever cut inside a sentence: the phrasing breaks audibly.
import { createHash } from 'node:crypto';
import { respell } from './pronunciation.mjs';

/** The model every sentence is spoken with, part of every key: a new model or build makes every line again. */
export const MODEL = 'kokoro-82m-v1.0-fp32';

/**
 * The voices (owner, 2026-09-30: "Man and woman"; docs/READ_ALOUD.md §2). A page asks for a role, never a Kokoro voice, so
 * the cast is the server's to change. `sid` is the speaker's number in Kokoro v1.0's voices.bin (sherpa-onnx's order).
 *
 * Chosen by one rule, from the two proxies there are (nobody listened; docs/evidence/read-aloud/cast.json): the voice's author
 * graded it C+ or better by ear, **and** UTMOS22 predicts 4.3 or better on the game's own lines. American voices, as the
 * settlers of 1835 mostly were.
 * - `narrator`: tips, the record, story cards, news without a speaker. af_heart: the author's only A, and the highest UTMOS
 *   measured (4.46).
 * - `woman`: a line a woman or a girl of the game speaks. af_kore: C+, UTMOS 4.45 - the next best woman on both, and not the
 *   narrator, so a mother's words are never taken for the narrator's. (af_bella is graded A- but scored 3.98: the owner's ear
 *   decides between them, one line here and a build.)
 * - `man`: a line a man or a boy of the game speaks. am_puck: C+, UTMOS 4.34.
 * - `rider`: a rider or a runner, the voice from outside the family a conversation has. am_fenrir: C+, UTMOS 4.37, the
 *   research's man, and a different man from am_puck, so a family's man and the rider at his gate are never one voice.
 */
export const VOICES = Object.freeze({
  narrator: Object.freeze({ id: 'af_heart', sid: 3, who: 'American woman' }),
  woman: Object.freeze({ id: 'af_kore', sid: 5, who: 'American woman' }),
  man: Object.freeze({ id: 'am_puck', sid: 18, who: 'American man' }),
  rider: Object.freeze({ id: 'am_fenrir', sid: 14, who: 'American man' }),
});
export const ROLES = Object.freeze(Object.keys(VOICES));

/** Who speaks for a person of the game: the page's own rule (public/read-aloud.js), so a line begun here is the line it asks for. */
export { voiceOfPerson } from '../../public/read-aloud.js';

// A full stop after one of these, or after a single capital (J. W. Smith), does not end a sentence.
const ABBREVIATIONS = new Set(['Mr', 'Mrs', 'Ms', 'Dr', 'Col', 'Capt', 'Gen', 'Lt', 'Maj', 'Sgt', 'St', 'Jr', 'Sr', 'Rev', 'No', 'vs', 'etc', 'Mt', 'Ft']);
/** A stand-in for a template's `${...}` while its source is read (server/voice/inventory.mjs); never in a real line. */
export const HOLE = '';
const BOUNDARY = /[.!?…]+["'”’»)]*(?=\s+["'“‘«(¡¿]?[\p{Lu}\p{N}]|\s*)/gu;
/** The longest sentence given to the voice at once; longer ones are cut at a semicolon, a dash or a comma. */
export const LONGEST = 320;

/**
 * A line as its sentences, in order: whitespace run together, trimmed, and split where a sentence ends and the next begins
 * with a capital, a number or an opening quote. `ceiling:` a sentence that begins with a small letter after a full stop is
 * read as part of the one before it; the game's own writing never does that.
 */
export function splitSentences(text) {
  const line = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!line) return [];
  const out = [];
  let start = 0;
  for (const match of line.matchAll(BOUNDARY)) {
    const end = match.index + match[0].length;
    if (match[0][0] === '.' && match[0].length === 1) {
      const word = line.slice(start, match.index).split(' ').at(-1).replace(/^["'“‘(]+/, '');
      if (ABBREVIATIONS.has(word) || /^\p{Lu}$/u.test(word)) continue;
    }
    out.push(line.slice(start, end).trim());
    start = end;
  }
  const rest = line.slice(start).trim();
  if (rest) out.push(rest);
  return out.flatMap(cutLong).filter(sentence => /[\p{L}\p{N}]/u.test(sentence));
}
function cutLong(sentence) {
  if (sentence.length <= LONGEST) return [sentence];
  // ceiling: a sentence over LONGEST characters is spoken in pieces cut after a semicolon, a dash or a comma nearest its
  // middle; the game writes few, and Kokoro loses the end of a much longer one.
  const middle = sentence.length / 2;
  const cuts = [...sentence.matchAll(/(; | - | — |, )/g)].map(m => m.index + m[0].length - 1);
  if (!cuts.length) return [sentence];
  const at = cuts.reduce((best, cut) => (Math.abs(cut - middle) < Math.abs(best - middle) ? cut : best));
  return [...cutLong(sentence.slice(0, at).trim()), ...cutLong(sentence.slice(at).trim())];
}

/**
 * What the voice is given for a sentence, and so what it is kept under: respelled (server/voice/pronunciation.mjs), then in
 * plain ASCII. The voice's program reads its command line in the Windows code page, where a curly quote, a dash or an é arrives
 * broken ("Non UTF8 encoded string is received", 2026-09-30): quotes are made straight, a dash a pause, and a letter's accent
 * dropped - which is why every accented name the game deals is respelled first.
 */
export const spoken = sentence => plain(respell(sentence));
export function plain(text) {
  return String(text)
    .replace(/[‘’ʼ`]/g, "'").replace(/[“”«»]/g, '"').replace(/\s*[—–]\s*/g, ', ').replace(/…/g, '...').replace(/[¡¿]/g, '')
    .normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ').replace(/ ,/g, ',').replace(/,+/g, ',').trim();
}

/** The name a sentence in a voice is kept under, in the package and in the Host's cache: 32 hex characters. */
export function keyOf(role, sentence) {
  const voice = VOICES[role];
  if (!voice) throw new Error(`No voice ${role}`);
  return createHash('sha256').update(`${MODEL}|${voice.id}|${spoken(sentence)}`).digest('hex').slice(0, 32);
}
export const KEY = /^[0-9a-f]{32}$/;
