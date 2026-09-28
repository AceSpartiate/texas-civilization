// The regressions the sound's tests guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it has
// failed"). Each injection changes one exact piece of a file (or adds one), runs the one test file that guards it, records
// which tests failed, and puts everything back byte for byte. It stops if a replacement does not match exactly once, so a
// stale injection is never passed off as a proof. It passes only if, for every injection, exactly the named test failed.
//
// Run: node scripts/audio-injections.mjs  → writes docs/evidence/audio-injections.json
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const swap = (from, to) => text => {
  const count = text.split(from).length - 1;
  if (count !== 1) throw new Error(`injection matched ${count} times: ${from}`);
  return text.replace(from, () => to);
};
const json = change => text => { const data = JSON.parse(text); change(data); return `${JSON.stringify(data, null, 2)}\n`; };

const LICENCES = 'tests/audio-licenses.test.mjs', MIX = 'tests/audio-mix.test.mjs', MUSIC = 'tests/audio-music.test.mjs', CUES = 'tests/audio-cues.test.mjs';
const MANIFEST = 'public/assets/audio/licenses.json';
const INJECTIONS = [
  // --- the licences
  { name: 'a recording dropped into the game with no licence entry', test: LICENCES, expect: 'every audio file shipped under public/ is in the manifest',
    create: { path: 'public/assets/audio/crow.ogg', content: 'OggS not really' } },
  { name: 'a sound entered as non-commercial', test: LICENCES, expect: 'the manifest allows only licences a sold game can carry',
    file: MANIFEST, apply: json(data => { data.entries[0].licence = 'CC-BY-NC-4.0'; }) },
  { name: 'a CC-BY sound with its attribution not recorded', test: LICENCES, expect: 'the manifest allows only licences a sold game can carry',
    file: MANIFEST, apply: json(data => { Object.assign(data.entries[0], { licence: 'CC-BY-4.0', source: 'https://example.org/musket', attribution: null }); }) },
  { name: 'a new sound added to the game and not to the manifest', test: LICENCES, expect: 'every sound, bed and piece of music the game plays is in the manifest, and nothing else is',
    file: 'public/audio-mix.js', apply: swap("  musket: { bus: 'fx', priority: 4, max: 4, gapMs: 45, gain: 0.7 },", "  musket: { bus: 'fx', priority: 4, max: 4, gapMs: 45, gain: 0.7 },\n  owl: { bus: 'fx', priority: 1, max: 1, gapMs: 9000, gain: 0.2 },") },
  { name: 'a tune whose composition is still in copyright', test: LICENCES, expect: 'every tune is a public-domain composition or the project\'s own, and says which',
    file: MANIFEST, apply: json(data => { data.entries.find(one => one.kind === 'music').compositionStatus = 'copyrighted'; }) },
  { name: 'audio no longer binary to git', test: LICENCES, expect: 'audio files are binary to git, so a CRLF checkout cannot corrupt them',
    file: '.gitattributes', apply: swap('*.ogg binary\n', '') },
  // --- the mixer and a page's starting levels
  { name: 'a student page starts muted (the old default, before the owner\'s AU1)', test: MIX, expect: 'a student in a class starts with everything on, quiet; the Host and a solo player start on at full level (owner, AU1)',
    file: 'public/audio-mix.js', apply: swap("  student: Object.freeze({ master: STUDENT_MASTER, music: 0.5, fx: 0.7, ui: 0.5, muted: false }),", "  student: Object.freeze({ master: STUDENT_MASTER, music: 0.5, fx: 0.7, ui: 0.5, muted: true }),") },
  { name: 'a student page starts as loud as the Host\'s', test: MIX, expect: 'a student in a class starts with everything on, quiet; the Host and a solo player start on at full level (owner, AU1)',
    file: 'public/audio-mix.js', apply: swap('export const STUDENT_MASTER = 0.3;', 'export const STUDENT_MASTER = 0.8;') },
  { name: 'the music is let above the effects', test: MIX, expect: 'music is never louder than the effects, at any slider setting',
    file: 'public/audio-mix.js', apply: swap('export const MUSIC_CEILING = 0.45;', 'export const MUSIC_CEILING = 1.5;') },
  { name: 'a blocked store throws out of the page', test: MIX, expect: 'settings are remembered per device and per kind of page, and a broken store falls back',
    file: 'public/audio-mix.js', apply: swap("  } catch { return settingsFor(role, null); }\n}\nexport function saveSettings", "  } finally { /* nothing */ }\n}\nexport function saveSettings") },
  { name: 'a sound is as loud across the country as under the camera', test: MIX, expect: 'a sound is quieter and duller the farther it is from the middle of the screen, and silent past a screen and a half',
    file: 'public/audio-mix.js', apply: swap('  const near = d <= 0.35 ? 1 : 1 / (1 + 2.4 * (d - 0.35));', '  const near = 1;') },
  { name: 'every shot of a rank is its own sound', test: MIX, expect: 'a rank firing together is one volley, scattered shots stay single, and a gun is a gun',
    file: 'public/audio-mix.js', apply: swap('  if (muskets.length >= 5) {', '  if (muskets.length >= 500) {') },
  { name: 'a sound\'s own limit is not kept', test: MIX, expect: 'the mixer never plays more than its voices, lets the important in over the trivial, and keeps a sound\'s own limit',
    file: 'public/audio-mix.js', apply: swap('    if (live.filter(voice => voice.id === id).length >= sound.max) { this.dropped++; return null; }', '') },
  { name: 'the loudness budget is not kept', test: MIX, expect: 'the loudness budget turns a new sound down rather than letting the page get louder',
    file: 'public/audio-mix.js', apply: swap("    const played = sound.bus === 'ui' ? level : Math.min(level, Math.max(room, level * 0.25));", '    const played = level;') },
  // --- the music
  { name: 'a piece a note short, so it stumbles every time it loops', test: MUSIC, expect: 'every piece fills its bars exactly, so it loops without a stumble',
    file: 'public/audio-music.js', apply: swap("'E5:.5 D5:.5 B4:.5 G4:.5 C5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 A4:.5 B4:.5 D#4:.5 E4:1.5 r:.5'", "'E5:.5 D5:.5 B4:.5 G4:.5 C5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 A4:.5 B4:.5 D#4:.5 E4:1.5'") },
  { name: 'the war news has no music', test: MUSIC, expect: 'every mood of the game has music, and every piece is played by some mood',
    file: 'public/audio-music.js', apply: swap("war: ['muster'], ", '') },
  { name: 'the degüello played as fact', test: MUSIC, expect: 'nothing played claims to be what history disputes: no degüello, no Bower',
    file: 'public/audio-music.js', apply: swap("    title: 'Before the Guns',", "    title: 'El Degüello',") },
  { name: 'a page that slept plays everything it missed at once', test: MUSIC, expect: 'the player plays ahead of the clock, once per note, and a page that slept does not play everything it missed',
    file: 'public/audio-music.js', apply: swap('      if (at >= now - 0.05) { playNote(', '      if (true) { playNote(') },
  // --- which event makes which sound
  { name: 'a page opened mid-class plays everything already there', test: CUES, expect: 'a page opened in the middle of a class hears nothing of what was already there',
    file: 'public/audio-cues.js', apply: swap('  const add = cue => { if (!quiet) cues.push(cue); };', '  const add = cue => { cues.push(cue); };') },
  { name: 'the bell rung for a family a rider told', test: CUES, expect: 'the bell rings for a family whose own person heard it at Béxar, once; a family a rider told hears news',
    file: 'public/audio-cues.js', apply: swap("    if (report.topicId === 'bexar-arrival' && /at B[ée]xar/i.test(report.source || '')) {", "    if (report.topicId === 'bexar-arrival') {") },
  { name: 'every bugle call is the attack', test: CUES, expect: 'a bugler\'s line is a bugle - the parley\'s own call for a parley - and a drum only where a line names one',
    file: 'public/audio-cues.js', apply: swap("const bugleCall = text => /parley/i.test(text) ? 'parley' : /retreat/i.test(text) ? 'assembly' : 'attack';", "const bugleCall = text => 'attack';") },
  { name: 'the lapse warning repeats every snapshot while it is pressing', test: CUES, expect: 'questions, ¡Alto!, a question turning pressing, and a lapse said once',
    file: 'public/audio-cues.js', apply: swap('  if ([...pressingNow].some(key => !state.pressing.has(key))) add({ id: \'lapse\' });', "  if (pressingNow.size) add({ id: 'lapse' });") },
  { name: 'the baby cries unheard', test: CUES, expect: 'the family\'s own: a baby crying, a shot at the hunt, a tree going over',
    file: 'public/audio-cues.js', apply: swap("    if (person.baby?.state === 'cry') { crying.add(person.id); add({ id: 'baby', entity: person.id }); }", "    if (person.baby?.state === 'cry') crying.add(person.id);") },
  { name: 'the chase\'s ¡Alto! is drawn but not heard', test: CUES, expect: 'a frame\'s shots are heard where they were drawn: a rank\'s volley, a gun, a chase\'s shot and its ¡Alto!',
    file: 'public/audio-cues.js', apply: swap("  for (const said of chase?.spoken || []) if (said.id === 'alto') cues.push({ id: 'alto', ...placeSound(said, size, figure) });", '') },
  { name: 'a rhythm plays every frame, not on its beat', test: CUES, expect: 'work and travel near the camera keep their rhythm: the axe, the hammer, hoofs and the wagon',
    file: 'public/audio-cues.js', apply: swap('  state.next.set(key, now + every * (0.8 + 0.4 * state.random()));', '  state.next.set(key, now);') },
  { name: 'thunder in any rain', test: CUES, expect: 'the weather at the middle of the view: rain and a storm\'s thunder, a norther\'s wind, and fair weather silent',
    file: 'public/audio-cues.js', apply: swap('  if (storm > 0.25) {', '  if (storm > 0.25 || rain > 0.25) {') },
  { name: 'the river is never heard', test: CUES, expect: 'the river is heard near a crossing, and fire near a burning town or the family\'s camp',
    file: 'public/audio-cues.js', apply: swap('  return best === Infinity ? 0 : Math.max(0, 1 - best / reach);', '  return 0;') },
  { name: 'the Scrape plays the farm\'s music', test: CUES, expect: 'the music follows the game: title, farm, war, battle, the Scrape, the ending',
    file: 'public/audio-cues.js', apply: swap("  if (world.flight && ['fled', 'refuged'].includes(world.flight.status)) return 'scrape';", '') },
  { name: 'a sound\'s recipe that starts nothing', test: CUES, expect: 'every sound and bed builds from its recipe, starts its sources and says how long it lasts',
    file: 'public/audio-synth.js', apply: swap('  click(ctx, out, t) { tone(ctx, out, t, { from: 1700, to: 1400, glide: 0.01, peak: 0.5, decay: 0.03 }); return 0.05; },', '  click(ctx, out, t) { return 0.05; },') },
];

function run(test) {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', test], { encoding: 'utf8' });
  const failed = [...result.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map(match => match[1].trim());
  const passed = [...result.stdout.matchAll(/^ok \d+ - (.+)$/gm)].map(match => match[1].trim());
  return { failed, passed };
}

const results = [];
let good = true;
for (const one of INJECTIONS) {
  const baseline = run(one.test);
  if (baseline.failed.length) throw new Error(`${one.test} fails before any injection: ${baseline.failed.join('; ')}`);
  const original = one.file ? readFileSync(one.file) : null;
  try {
    if (one.create) { if (existsSync(one.create.path)) throw new Error(`${one.create.path} already exists`); writeFileSync(one.create.path, one.create.content); }
    else {
      // A CRLF checkout (core.autocrlf) is matched as LF and written back as it was.
      const text = original.toString('utf8'), crlf = text.includes('\r\n');
      const changed = one.apply(crlf ? text.replace(/\r\n/g, '\n') : text);
      writeFileSync(one.file, crlf ? changed.replace(/\n/g, '\r\n') : changed);
    }
    const { failed } = run(one.test);
    const exact = failed.length === 1 && failed[0] === one.expect;
    good &&= exact;
    results.push({ injection: one.name, file: one.file || one.create.path, test: one.test, expected: one.expect, failed, verdict: exact ? 'only the named test failed' : 'WRONG' });
    console.log(exact ? 'OK  ' : 'BAD ', one.name, exact ? '' : `-> ${JSON.stringify(failed)}`);
  } finally {
    if (one.create) rmSync(one.create.path, { force: true }); else writeFileSync(one.file, original);
  }
}
for (const test of [...new Set(INJECTIONS.map(one => one.test))]) {
  const after = run(test);
  if (after.failed.length) { good = false; console.log('BAD  after restoring,', test, 'fails:', after.failed); }
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/audio-injections.json', `${JSON.stringify({ record: 'audio-injections', date: new Date().toISOString().slice(0, 10), verdict: good ? 'PASS' : 'FAIL', injections: results }, null, 2)}\n`);
console.log(good ? `\nAll ${results.length} injections failed exactly their own test.` : '\nSome injection did not fail exactly its own test.');
process.exit(good ? 0 : 1);
