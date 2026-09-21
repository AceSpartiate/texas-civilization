// The regressions the guided start's tests guard, injected one at a time (CLAUDE.md: "A new test is not evidence until it
// has failed"). Each injection replaces one exact piece of public/lesson.js with the mistake a test is written against,
// runs the test file, records which tests failed, and puts the file back byte for byte. It stops if a replacement does not
// match exactly once, so a stale injection is never passed off as a proof.
//
// Run: node scripts/lesson-injections.mjs  → writes docs/evidence/lesson-injections.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FILES = ['tests/lesson-screen.test.mjs'];
const FILE = 'public/lesson.js';
const INJECTIONS = [
  // The rule the whole module exists for (the task, 2026-09-21): "never let the page decide that a step is complete".
  {
    name: 'the page remembers the last step it saw, and so can decide a step is finished',
    from: 'export function lessonWords(lesson) {\n  if (!lesson) return null;',
    to: 'export function lessonWords(lesson) {\n  if (!lesson) return null;\n  try { localStorage.setItem(\'seen\', lesson.step); } catch { /* */ }',
  },
  {
    name: 'a lesson that says it is done is drawn anyway, so the strip outlives the lesson',
    from: '  if (!lesson || lesson.done) return null;',
    to: '  if (!lesson) return null;',
  },
  {
    name: 'the teacher is led by the hand through a lesson meant for a student',
    from: "  return world.role === 'host' ? null : lesson;",
    to: '  return lesson;',
  },
  // "allow: every action id the student may take now". An empty list is a step with nothing to do but wait.
  {
    name: 'an empty allow is taken for "no opinion", so the waiting step lets a student walk into a refusal',
    from: 'export const lessonLocks = lesson => Boolean(lesson) && Array.isArray(lesson.allow);',
    to: 'export const lessonLocks = lesson => Boolean(lesson) && Array.isArray(lesson.allow) && lesson.allow.length > 0;',
  },
  {
    name: 'a server that sends no allow at all shuts the student out of everything',
    from: 'export const lessonLocks = lesson => Boolean(lesson) && Array.isArray(lesson.allow);',
    to: 'export const lessonLocks = lesson => Boolean(lesson);',
  },
  {
    name: 'a chore is written as an order, so nothing the contract spells is matched',
    from: "export const actionIdOf = icon => (icon?.kind === 'chore' ? `chore:${icon.key}` : `order:${icon.key}`);",
    to: 'export const actionIdOf = icon => `order:${icon?.key}`;',
  },
  {
    name: 'an allowed id is matched as a piece of a word, so hunt-land opens hunt-timber too',
    from: '  return lesson.allow.some(entry => entry === actionIdOf(icon) || entry === key || entry === `chore:${key}` || entry === `order:${key}`);',
    to: '  return lesson.allow.some(entry => String(entry).includes(key) || key.includes(String(entry).split(\':\').pop()));',
  },
  {
    name: 'the step shuts nothing at all, and every icon on the bar stays open',
    from: '  if (!lessonLocks(lesson) || !icon) return true;',
    to: '  return true;\n  // eslint-disable-next-line no-unreachable\n  if (!lessonLocks(lesson) || !icon) return true;',
  },
  {
    name: 'the ring is put on an icon the server has already refused',
    from: '  return icons.find(icon => icon.can && allowsIcon(lesson, icon))?.key || null;',
    to: '  return icons.find(icon => allowsIcon(lesson, icon))?.key || null;',
  },
  {
    name: 'the ring is put on the first icon of the bar, whatever the step asked for',
    from: '  return icons.find(icon => icon.can && allowsIcon(lesson, icon))?.key || null;',
    to: '  return icons.find(icon => icon.can)?.key || null;',
  },
  {
    name: 'a step with nothing open on this row still rings something',
    from: '  if (!lessonLocks(lesson)) return null;\n  return icons.find(icon => icon.can && allowsIcon(lesson, icon))?.key || null;',
    to: '  return icons.find(icon => icon.can)?.key || null;',
  },
  {
    name: 'the pips are filled to where the student is going rather than where they are',
    from: '    done: at && of ? Math.max(0, at - 1) : 0,',
    to: '    done: at && of ? at : 0,',
  },
  {
    name: 'the count runs past the end of the lesson, so a student reads "step 14 of 10"',
    from: '  const at = Number.isFinite(lesson.index) ? Math.min(of ?? Infinity, Math.max(1, Math.round(lesson.index))) : null;',
    to: '  const at = Number.isFinite(lesson.index) ? lesson.index : null;',
  },
  {
    name: 'a step with no numbers says "step null of null" instead of what to do',
    from: "    eyebrow: at && of ? `STEP ${at} OF ${of}` : 'WHAT TO DO NEXT',",
    to: '    eyebrow: `STEP ${at} OF ${of}`,',
  },
  {
    name: 'a step where nothing has just happened writes the word "null" on the screen',
    from: '    did: String(lesson.did || \'\').trim(),',
    to: '    did: String(lesson.did).trim(),',
  },
  {
    name: 'a shut icon scolds instead of saying the one thing to do',
    from: "  return says ? `Not this yet. ${says}` : 'Not this yet.';",
    to: "  return 'You cannot do that.';",
  },
  {
    name: 'what the strip reads out leaves out the one sentence of what to do',
    from: "  return [words.eyebrow ? `${words.eyebrow}.` : '', words.title ? `${words.title}.` : '', words.says, words.did].filter(Boolean).join(' ');",
    to: "  return [words.eyebrow ? `${words.eyebrow}.` : '', words.title ? `${words.title}.` : ''].filter(Boolean).join(' ');",
  },
];

const failing = output => [...output.matchAll(/^✖ (.+?) \(\d/gm)].map(match => match[1]).filter((name, i, all) => name !== 'failing tests:' && all.indexOf(name) === i);
const run = () => { const result = spawnSync(process.execPath, ['--test', ...FILES], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); return failing(`${result.stdout}${result.stderr}`); };

const clean = run();
if (clean.length) throw new Error(`The tests fail before any injection: ${clean.join('; ')}`);
const record = [];
for (const injection of INJECTIONS) {
  const file = injection.file || FILE;
  const original = readFileSync(file, 'utf8');
  const count = original.split(injection.from).length - 1;
  if (count !== 1) throw new Error(`${injection.name}: the text to replace is in ${file} ${count} times`);
  writeFileSync(file, original.replace(injection.from, injection.to));
  let failed;
  try { failed = run(); } finally { writeFileSync(file, original); }
  record.push({ name: injection.name, file, failed });
  console.log(`${failed.length ? 'caught' : 'MISSED'}: ${injection.name} -> ${failed.join(' | ') || 'nothing failed'}`);
}
if (run().length) throw new Error('The tests fail after every file was put back');
mkdirSync('docs/evidence', { recursive: true });
writeFileSync('docs/evidence/lesson-injections.json', `${JSON.stringify({ record: 'lesson-injections', date: new Date().toISOString().slice(0, 10), files: FILES, injections: record }, null, 2)}\n`);
console.log(`\n${record.filter(r => r.failed.length).length} of ${record.length} caught; wrote docs/evidence/lesson-injections.json`);
