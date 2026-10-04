// Astra's art always wins (owner, 2026-09-29: "a lot of astra art has been replaced with worse versions"). Claude's temporary
// frames (public/assets/claude-standins/) are drawn only for a subject Astra has not drawn - public/art-subjects.js says what
// each frame shows, public/art.js `mergeStandins` leaves out every one whose subject she has drawn. These tests load the
// real manifests through public/art.js, as the page does, and hold what comes out.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { namePrefixes, standinSubject, standinWithheld } from '../public/art-subjects.js';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const read = path => JSON.parse(readFileSync(PUBLIC + path, 'utf8'));
const astra = read('assets/frontier-v1/atlas.json'), astraClips = read('assets/frontier-v1/animation.json').clips;
const claude = read('assets/claude-standins/atlas.json');

// The page's own loader, fed the manifests from disk. No sheet is decoded here (no createImageBitmap, no Image): only the
// names the library will answer to are looked at.
globalThis.fetch = async url => {
  const path = String(url).split('?')[0].replace(/^\//, '');
  try { const text = readFileSync(PUBLIC + path); return { ok: true, json: async () => JSON.parse(text), blob: async () => new Blob([text]) }; }
  catch { return { ok: false }; }
};
const art = await import('../public/art.js');
await art.loadArt({ sheets: [] });
const drawable = new Set(art.spriteNames());
const clips = new Set(art.clipNames());
const claudeDrawable = [...drawable].filter(name => claude.frames[name] && art.spriteFrame(name)?.madeBy === 'claude');

test('every Claude frame says what it shows: a rule of public/art-subjects.js knows it', () => {
  const unknown = Object.keys(claude.frames).filter(name => !standinSubject(name));
  assert.deepEqual(unknown, [], 'a new Claude module must add its subject to public/art-subjects.js');
});

test('no Claude frame of a person, animal, vehicle, house or tree Astra has drawn can be drawn, whatever its name', () => {
  // Her figures, found apart from the rules: every name she has an idle, a walk or a march of (`rust`, `girl`, `infant`,
  // `volunteer`, `castrillon`, `cow`, `horse`, `ox`, `wagon`, `carreta`, `seguin`...). A Claude frame of any of them - Claude's
  // rust chopping, a Claude girl at play, the wagon and ox as one Claude drawing - is her subject in Claude's hand.
  const figures = new Set();
  for (const name of [...Object.keys(astra.frames), ...Object.keys(astraClips)]) {
    const match = /^(.+?)-(idle|walk|march|travel|mounted|ride)(-|$)/.exec(name);
    if (match && !/^(icon|mark)-/.test(name)) figures.add(match[1]); // an icon's picture is its meaning, not a figure
  }
  for (const figure of ['rust', 'rust-woman', 'blue-girl', 'girl', 'boy', 'smallchild', 'infant', 'volunteer', 'regular', 'dragoon', 'castrillon', 'esparza', 'seguin', 'cow', 'horse', 'ox', 'wagon', 'carreta'])
    assert.ok(figures.has(figure), `${figure} is one of Astra's figures (the check itself is sound)`);
  // The one exception, written down in public/art-subjects.js: the wedding's gestures (the coordinator's decision, 2026-09-29).
  const WEDDING = /^(rust|teal|elder|blue|rust-woman|indigo|ochre|blue-girl)-(greet|shy|laugh|vow|fiddle|read-paper)-\d+$/;
  const hers = claudeDrawable.filter(name => !WEDDING.test(name) && [...figures].some(figure => name.startsWith(`${figure}-`)));
  assert.deepEqual(hers, [], 'Claude frames of subjects Astra has drawn are drawable');
  // And that exception is gestures only: nobody at the wedding walks, idles or speaks in Claude's hand.
  const ordinary = claudeDrawable.filter(name => /^(rust|teal|elder|blue|rust-woman|indigo|ochre|blue-girl|girl|boy|smallchild|infant)-/.test(name) && !WEDDING.test(name));
  assert.deepEqual(ordinary, [], 'a Claude drawing of a family figure outside the wedding\'s gestures is drawable');
});

test('the wedding: its farmsteads and table are Astra\'s cabin, jacal and table; the painted yards behind it are Claude\'s', () => {
  for (const name of ['farm-neighbour-porch', 'farm-neighbour-ramada', 'wedding-table'].filter(name => claude.frames[name]))
    assert.ok(!drawable.has(name), `${name}: Claude's version of her building or table is drawable`);
  for (const name of ['courtship-yard-morning'].filter(name => claude.frames[name])) assert.ok(drawable.has(name), `${name} is held back`);
});

test('the subjects the owner saw replaced are Astra\'s again: work, ease, children, the baby, the wagon, riders, soldiers, trees', () => {
  for (const name of ['rust-chop-1', 'teal-split-1', 'rust-whittle-1', 'indigo-hold-baby-1', 'girl-play-run-1', 'girl-play-run-s-1', 'boy-carry-water-n-1',
    'infant-crawl-1', 'rust-sick-rest-e-1', 'girl-ride-e-1', 'indigo-wagon-driver-e-1', 'rust-ride-wagon-e-1', 'wagon-ox-e-1', 'wagon-ox-open-e-1', 'cart-travel-e-1',
    'carreta-loaded-travel-e-1', 'milk-cow-walk-e-1', 'herd-drove-1', 'volunteer-bank-climb-1', 'seguin-ride-e-1', 'rust-fire-reload-1',
    'regular-loophole-fire-1', 'esparza-seated', 'house-round-back-full-walls', 'house-jacal-wattle', 'pine-loblolly-large-wind',
    'pine-shortleaf-large', 'cedar-elm-large', 'stump-oak', 'live-oak-mott', 'wood-pile-3', 'hens-pecking-1']) {
    assert.ok(claude.frames[name], `${name} is a Claude frame (the list is current)`);
    assert.ok(!drawable.has(name), `${name}: Claude's drawing of a subject Astra has drawn is drawable`);
    assert.ok(art.withheldStandins().has(name), `${name} is recorded as held back`);
  }
  for (const clip of ['rust-chop', 'girl-play-run', 'infant-crawl', 'wagon-ox-e', 'milk-cow-walk-e']) {
    assert.ok(claude.clips[clip], `${clip} is a Claude clip`);
    assert.ok(!clips.has(clip) && !art.clipReady(clip), `${clip}: Claude's clip is offered where Astra has drawn the subject`);
  }
});

test('Claude\'s art still fills what Astra has not drawn: people, places, icons and effects she has nothing of', () => {
  for (const name of ['ana-esparza-idle', 'burial-party-walk-e-1', 'bexar-man-walk-1', 'sutherland-ride-e-1', 'mule-packed-grass-walk-e-1', 'mule-idle-1',
    'mule-walk-e-1', 'mule-saddled-walk-e-1',
    'mission-concepcion', 'portrait-rust', 'mark-need', 'icon-child-doll', 'fx-dust-1', 'night-grade', 'anacua-large', 'army-camp-texian'])
    assert.ok(drawable.has(name), `${name}: Claude's stand-in for a subject Astra has not drawn is not drawable`);
});

test('the moment Astra draws a subject, every Claude frame of it steps aside, not only the one of the same name', () => {
  const hers = namePrefixes(Object.keys(astra.frames));
  // Dr. Sutherland: Claude's today (Kimbell was, until Astra's of 2026-10-03).
  assert.equal(standinWithheld('sutherland-ride-e-1', hers), null, 'Sutherland is Claude\'s today');
  const delivered = namePrefixes([...Object.keys(astra.frames), 'sutherland-idle']);
  for (const name of Object.keys(claude.frames).filter(name => name.startsWith('sutherland-')))
    assert.equal(standinWithheld(name, delivered), 'sutherland', `${name} would still be drawn beside her Sutherland`);
  assert.equal(standinWithheld('sutherland-ride-e-1', namePrefixes([...Object.keys(astra.frames), 'sutherlandish-idle'])), null, 'a prefix is a whole name');
});

test('only public/art.js reads Claude\'s library: nothing draws from it around the rule', () => {
  const around = readdirSync(PUBLIC).filter(file => /\.m?js$/.test(file) && file !== 'art.js')
    .filter(file => /claude-standins/.test(readFileSync(PUBLIC + file, 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\/|^\s*\*.*$/gm, '')));
  assert.deepEqual(around, []);
});
