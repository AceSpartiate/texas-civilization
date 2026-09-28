// Every sound the game plays and every audio file it ships has a licence that lets the owner sell the game
// (owner, 2026-09-28: "everything has to be free, and shouldn't prevent me from selling the game in the future";
// docs/AUDIO_LICENSES.md). The manifest is public/assets/audio/licenses.json.
//
// Proven by injection on 2026-09-28 (docs/AUDIO.md §7): an unlisted .ogg dropped into public/assets/audio, an entry's
// licence changed to CC-BY-NC-4.0, a new sound added to SOUNDS with no entry, a tune marked as a copyrighted
// composition, and a CC-BY entry with no attribution - each failed only its own test here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEDS, SOUNDS } from '../public/audio-mix.js';
import { TUNES } from '../public/audio-music.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const audioRoot = join(root, 'public', 'assets', 'audio');
const manifest = JSON.parse(readFileSync(join(audioRoot, 'licenses.json'), 'utf8'));
const AUDIO = /\.(ogg|oga|opus|mp3|wav|flac|m4a|aac|webm|weba|mid|midi)$/i;
// Refused outright, whatever the manifest's own `allowed` says: nothing non-commercial, no-derivatives, share-alike,
// personal-use or unstated may be bundled.
const REFUSED = /(^|[-\s])(NC|ND|SA)([-\s.]|$)|non-?commercial|no-?deriv|share-?alike|personal|unknown|unclear|proprietary|all rights reserved/i;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path)); else out.push(path);
  }
  return out;
}

test('the manifest allows only licences a sold game can carry', () => {
  for (const licence of manifest.allowed) assert.doesNotMatch(licence, REFUSED, `allowed list names a refused licence: ${licence}`);
  for (const entry of manifest.entries) {
    assert.ok(manifest.allowed.includes(entry.licence), `${entry.id}: licence ${entry.licence} is not allowed`);
    assert.doesNotMatch(entry.licence, REFUSED, `${entry.id}: licence ${entry.licence} is refused`);
    for (const field of ['id', 'kind', 'author', 'source', 'licence', 'checked']) assert.ok(entry[field], `${entry.id}: no ${field}`);
    assert.match(entry.checked, /^\d{4}-\d{2}-\d{2}$/, `${entry.id}: checked is not a date`);
    if ((manifest.needsAttribution || []).includes(entry.licence)) assert.ok(entry.attribution, `${entry.id}: ${entry.licence} needs its attribution recorded`);
    // Anything not made here came from somewhere that can be looked up again.
    if (entry.licence !== 'project-owned') assert.match(entry.source, /^https:\/\//, `${entry.id}: a downloaded sound needs its source URL`);
  }
});

test('every audio file shipped under public/ is in the manifest', () => {
  const shipped = walk(join(root, 'public')).filter(path => AUDIO.test(path)).map(path => relative(join(root, 'public'), path).split('\\').join('/'));
  const listed = new Set(manifest.entries.map(entry => entry.file).filter(Boolean));
  const missing = shipped.filter(file => !listed.has(file));
  assert.deepEqual(missing, [], `audio files with no licence entry: ${missing.join(', ')}`);
  for (const file of listed) assert.ok(shipped.includes(file), `the manifest lists ${file}, which is not shipped`);
});

test('every sound, bed and piece of music the game plays is in the manifest, and nothing else is', () => {
  const byKind = kind => new Set(manifest.entries.filter(entry => entry.kind === kind && !entry.file).map(entry => entry.id));
  assert.deepEqual([...byKind('effect')].sort(), Object.keys(SOUNDS).sort(), 'effects in public/audio-mix.js SOUNDS and the manifest differ');
  assert.deepEqual([...byKind('bed')].sort(), Object.keys(BEDS).sort(), 'beds in public/audio-mix.js BEDS and the manifest differ');
  assert.deepEqual([...byKind('music')].sort(), Object.keys(TUNES).sort(), 'tunes in public/audio-music.js TUNES and the manifest differ');
});

test('every tune is a public-domain composition or the project\'s own, and says which', () => {
  for (const [id, tune] of Object.entries(TUNES)) {
    const entry = manifest.entries.find(one => one.kind === 'music' && one.id === id);
    assert.ok(['public-domain', 'project-owned'].includes(entry.compositionStatus), `${id}: composition is ${entry.compositionStatus}`);
    assert.equal(entry.compositionStatus === 'project-owned', tune.source.kind === 'original', `${id}: the manifest and the tune disagree about whose composition it is`);
    assert.ok(entry.compositionEvidence, `${id}: no evidence for the composition's status`);
  }
});

test('audio files are binary to git, so a CRLF checkout cannot corrupt them', () => {
  const attributes = readFileSync(join(root, '.gitattributes'), 'utf8');
  for (const ext of ['ogg', 'opus', 'mp3', 'wav']) assert.match(attributes, new RegExp(`^\\*\\.${ext}\\s+binary\\s*$`, 'm'), `.gitattributes does not mark *.${ext} binary`);
});
