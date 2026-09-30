// Every fixed sentence the game can show, read out of its own source (owner, 2026-09-30, D15; docs/READ_ALOUD.md §4).
//
// Two things need the list. The package build (scripts/build-voice.mjs) speaks every sentence on it once, on the developer's
// machine, so a class never waits for a tip, a call, an army question or a line of the timeline's news. And the Host's
// voice (server/voice/service.mjs) takes its words from it: a sentence is spoken on the Host only if every word of it is a
// word the game writes, or a name in the class (`vocabulary`), so a page can ask for the game's lines and nothing else.
//
// The list is read, not written by hand, so a tip added tomorrow is on it tomorrow. Every string in the source is taken -
// plain strings whole, and a template's text with each `${...}` as a hole (`HOLE`) - and split into sentences; a sentence
// with a hole in it holds a name or a number and is left for the Host, and one without is fixed. `ceiling:` it is a
// reader of this project's JavaScript, not of every JavaScript: a regular expression is told from a division by what comes
// before it, which this source keeps to. A string it misreads is spoken on the Host instead, which costs time, not a line.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOLE, splitSentences } from './text.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
/** Where the game's words are: the simulation, and the page's own words for tips, the story cards, the ending and the rest. */
export const SOURCES = Object.freeze(['sim', 'public/tips.js', 'public/military-attention.js', 'public/app.js', 'public/ending.js', 'public/family-panel.js', 'public/errand.js', 'public/going.js', 'public/neighbours.js']);

/**
 * Every string literal in a JavaScript source, in order: `{ text, template }`, a template's `${...}` replaced by `HOLE`. A
 * template inside a `${...}` is its own string, listed after the one around it.
 */
export function stringsOf(source) {
  const out = [];
  let i = 0;
  const n = source.length;
  // What came last that was not space or a comment, to tell a regular expression from a division.
  let last = '';
  const regexAfter = ch => !ch || /[(,=:[!&|?{};+\-*%<>~^]/.test(ch);
  function readQuoted(quote) {
    let text = '';
    i++;
    while (i < n && source[i] !== quote) {
      if (source[i] === '\\') { text += unescape(source[i + 1]); i += 2; continue; }
      if (source[i] === '\n') break;
      text += source[i++];
    }
    i++;
    return text;
  }
  function readTemplate() {
    let text = '';
    i++;
    while (i < n && source[i] !== '`') {
      if (source[i] === '\\') { text += unescape(source[i + 1]); i += 2; continue; }
      if (source[i] === '$' && source[i + 1] === '{') {
        i += 2;
        skipExpression();
        text += HOLE;
        continue;
      }
      text += source[i++];
    }
    i++;
    out.push({ text, template: true });
  }
  // Inside `${...}`: code, which may hold strings and templates of its own, until the brace that closes it.
  function skipExpression() {
    let depth = 1;
    let prev = '(';
    while (i < n && depth > 0) {
      const ch = source[i];
      if (ch === '{') { depth++; i++; prev = ch; continue; }
      if (ch === '}') { depth--; i++; prev = ch; continue; }
      if (ch === '"' || ch === "'") { out.push({ text: readQuoted(ch), template: false }); prev = 'a'; continue; }
      if (ch === '`') { readTemplate(); prev = 'a'; continue; }
      if (ch === '/' && source[i + 1] === '/') { while (i < n && source[i] !== '\n') i++; continue; }
      if (ch === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i + 2); i = i < 0 ? n : i + 2; continue; }
      if (ch === '/' && regexAfter(prev)) { skipRegex(); prev = 'a'; continue; }
      if (!/\s/.test(ch)) prev = ch;
      i++;
    }
  }
  function skipRegex() {
    i++;
    let inClass = false;
    while (i < n && source[i] !== '\n') {
      const ch = source[i];
      if (ch === '\\') { i += 2; continue; }
      if (ch === '[') inClass = true;
      else if (ch === ']') inClass = false;
      else if (ch === '/' && !inClass) { i++; break; }
      i++;
    }
    while (i < n && /[a-z]/i.test(source[i])) i++;
  }
  while (i < n) {
    const ch = source[i];
    if (ch === '/' && source[i + 1] === '/') { while (i < n && source[i] !== '\n') i++; continue; }
    if (ch === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i + 2); i = i < 0 ? n : i + 2; continue; }
    if (ch === '"' || ch === "'") { out.push({ text: readQuoted(ch), template: false }); last = 'a'; continue; }
    if (ch === '`') { readTemplate(); last = 'a'; continue; }
    if (ch === '/' && regexAfter(last)) {
      // `return /x/` and friends: a word before the slash is a keyword only for these.
      skipRegex(); last = 'a'; continue;
    }
    if (/[A-Za-z0-9_$]/.test(ch)) {
      let word = '';
      while (i < n && /[A-Za-z0-9_$]/.test(source[i])) word += source[i++];
      last = ['return', 'typeof', 'case', 'in', 'of', 'else', 'void', 'delete', 'throw', 'new', 'yield', 'await'].includes(word) ? '(' : 'a';
      continue;
    }
    if (!/\s/.test(ch)) last = ch;
    i++;
  }
  return out;
}
function unescape(ch) {
  return ch === 'n' ? ' ' : ch === 't' ? ' ' : ch ?? '';
}

/** Whether a sentence is words a student reads, not a key, a selector, a path or a message to a developer. */
export function readable(sentence) {
  if (sentence.includes(HOLE)) return false;
  if (sentence.length < 8 || sentence.length > 600) return false;
  if (/[{}<>=_\\|#@^~]|https?:|\/\/|\.m?js\b|\bundefined\b|\bnull\b|=>/.test(sentence)) return false;
  // A claim's id (HIST-TEX-101) is the project's bookkeeping, never a student's reading.
  if (/\b[A-Z]{2,}-[A-Z]{2,}-\d+/.test(sentence)) return false;
  if (!/^["'“‘(¡¿]?[\p{Lu}\p{N}]/u.test(sentence)) return false;
  if (!/[.!?…]["'”’»)]*$/u.test(sentence)) return false;
  const words = sentence.split(' ');
  return words.length >= 2 && /\p{Ll}/u.test(sentence);
}

function walk(path) {
  if (statSync(path).isFile()) return /\.m?js$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap(name => walk(join(path, name)));
}

/** The fixed sentences of the given source, each once, in the order first met. */
export function fixedSentences(sources = SOURCES, base = root) {
  const seen = new Set();
  for (const file of sources.flatMap(one => walk(join(base, one)))) {
    for (const { text } of stringsOf(readFileSync(file, 'utf8'))) {
      if (!/\s/.test(text) || !/\p{Ll}/u.test(text)) continue;
      for (const sentence of splitSentences(text)) if (readable(sentence)) seen.add(sentence);
    }
  }
  return [...seen];
}

/** The words of a text, as the vocabulary keeps them: lower case, letters and digits only, apostrophes kept inside a word. */
export const wordsOf = text => String(text ?? '').normalize('NFC').toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || [];

let cached = null;
/**
 * Every word the game's source writes, in every string and every template's fixed text (read once, then kept). The Host's
 * voice speaks a sentence whose every word is here or in the class's own names (server/voice/service.mjs `speakable`).
 */
export function sourceVocabulary(sources = SOURCES, base = root) {
  if (cached && sources === SOURCES && base === root) return cached;
  const words = new Set();
  for (const file of sources.flatMap(one => walk(join(base, one)))) {
    for (const { text } of stringsOf(readFileSync(file, 'utf8'))) for (const word of wordsOf(text.replaceAll(HOLE, ' '))) words.add(word);
  }
  if (sources === SOURCES && base === root) cached = words;
  return words;
}
