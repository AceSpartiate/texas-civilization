// playtexas.github.io - the logic only (owner, 2026-10-03; docs/HOST_PAGE.md §2.17). No styling and no art here: the look is
// style.css, and the hooks this sets are listed at the top of index.html. It reads the words with join-words.js (the game's own
// module), says in plain words what is wrong, and sends the browser to the teacher's laptop - a top-level navigation, never a fetch,
// so nothing here is a request from this page to the classroom network. It stores nothing: a student who comes Back from a class
// that would not open is recognised by the page's own history entry (`history.replaceState`).
import { decodeJoin, joinTokens, wordIndex, wordsStartingWith, DEFAULT_PORT } from './join-words.js';

const $ = selector => document.querySelector(selector);
const box = $('#words');
const say = (text, kind = '') => { $('#say').textContent = text; $('#say').className = kind ? `is-${kind}` : ''; };
const state = name => { document.body.dataset.state = name; };

// What a student has typed, word by word: numbered, the ones not on the list marked; and words for the one being typed.
function showTyping() {
  const tokens = joinTokens(box.value), finished = /[^a-z]$/i.test(box.value);
  $('#read').replaceChildren(...tokens.map((token, place) => {
    const item = document.createElement('li');
    item.textContent = token;
    item.dataset.place = String(place + 1);
    if (wordIndex(token) < 0 && (place < tokens.length - 1 || finished)) item.className = 'unknown';
    return item;
  }));
  const typing = !finished && tokens.length ? tokens[tokens.length - 1] : '';
  const offered = typing && wordIndex(typing) < 0 ? wordsStartingWith(typing) : [];
  $('#suggest').replaceChildren(...offered.map(word => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = word;
    button.addEventListener('click', () => { box.value = `${box.value.replace(/[a-z]+$/i, '')}${word} `; box.focus(); showTyping(); });
    return button;
  }));
}

function explain(result) {
  if (result.reason === 'empty') return 'Type the words on your teacher\'s screen.';
  if (result.reason === 'unknown') return `Word ${result.place}, "${result.word}", is not one of the words.${result.suggestions.length ? ` Did you mean ${result.suggestions.map(word => `"${word}"`).join(' or ')}?` : ''} Check it on the screen.`;
  if (result.reason === 'short' || result.reason === 'count') return `There are three words, and that is ${result.count}. Check the screen.`;
  if (result.reason === 'long') return `That is ${result.count} words, more than there are. There are three: check the screen.`;
  return 'Those words do not quite match. Check each word, and their order, against the screen.';
}

function noteAddress(result) {
  $('#help-address').textContent = `: ${result.address}:${result.port}`;
  $('#help-tell').textContent = `"My Chromebook can't reach your computer at ${result.address}, port ${result.port}."`;
}

// Going to the class. The page's history entry is marked first, so a student who comes Back from a page that would not open sees
// the help rather than being sent again.
function go(result, { now = false } = {}) {
  const where = `${result.address}${result.port === DEFAULT_PORT ? '' : ` (port ${result.port})`}`;
  $('#going-to').textContent = `Going to your teacher's computer at ${where}…`;
  $('#going-link').href = result.url;
  $('#going').hidden = false;
  state('going');
  say('');
  noteAddress(result);
  history.replaceState({ tried: result.url }, '', `#${result.words.join('-')}`);
  setTimeout(() => location.assign(result.url), now ? 0 : 700);
}

// Back again after trying: the help, open, and the way to try again.
function cameBack(result) {
  $('#going').hidden = true;
  state('came-back');
  if (result?.ok) { box.value = result.words.join(' '); noteAddress(result); showTyping(); }
  say('It did not open. Look at "Didn\'t work?" below, or press Go to try again.', 'error');
  $('#help').open = true;
}

$('#join').addEventListener('submit', event => {
  event.preventDefault();
  const result = decodeJoin(box.value);
  if (!result.ok) { say(explain(result), 'error'); box.focus(); return; }
  go(result);
});
box.addEventListener('input', () => { showTyping(); state('typing'); if ($('#say').className === 'is-error') say(''); });

// A link with the words after # goes on at once - unless this is the student coming Back to it.
const linked = location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : '';
const fromLink = linked ? decodeJoin(linked) : null;
if (history.state?.tried) cameBack(fromLink);
else if (fromLink?.ok) { box.value = fromLink.words.join(' '); showTyping(); go(fromLink, { now: true }); }
else if (fromLink) { box.value = joinTokens(linked).join(' '); showTyping(); say(explain(fromLink), 'error'); }
// Restored from the browser's back-forward cache as it was left, "Going to…" and all.
addEventListener('pageshow', event => { if (event.persisted && history.state?.tried) cameBack(decodeJoin(box.value)); });
box.focus();
