// How many class days a game takes at each pace, and where a class is in it (owner, 2026-09-28, by multiple choice on class
// length: "Plan for several class days"). The one figure a teacher was given said a class took about 54 minutes; a whole
// game with students playing is four to six and a half hours at Study (docs/audits/2026-09-28-playthrough.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { momentOf } from '../sim/directors.mjs';
import { createClassroom, PACES } from '../server/app.mjs';
import { classSchedule, PERIOD_TICKS, PLAY_MINUTES_A_DAY } from '../server/class-days.mjs';
import { DISCUSSION } from '../sim/ending.mjs';

test('the whole game is several class days at Study, fewer at Brisk, and the measured ticks say so', () => {
  const world = createGonzalesWorld('days', 5, { map: 'colonies', neighbours: true });
  const schedule = classSchedule(world, PACES);
  assert.equal(schedule.period, 1);
  assert.equal(schedule.periods, 3);
  assert.equal(schedule.share, 0);
  // The playthrough audit's measured classes, at 9.5 s a tick: 230 to 389 minutes of play, plus a first-day lobby.
  const ticks = [1, 2, 3].reduce((sum, period) => [sum[0] + PERIOD_TICKS[period][0], sum[1] + PERIOD_TICKS[period][1]], [0, 0]);
  assert.deepEqual(ticks, [1531, 2484]);
  assert.deepEqual(schedule.whole.study.minutes, [Math.round(1531 * 9500 / 60000 + 15), Math.round(2484 * 9500 / 60000 + 15)]);
  assert.deepEqual(schedule.whole.study.days, [6, 11], 'Study: six to eleven class days, not one afternoon');
  assert.deepEqual(schedule.whole.brisk.days, [3, 5]);
  assert.deepEqual(schedule.whole.quick.days, [1, 2]);
  assert.equal(PLAY_MINUTES_A_DAY, 40);
  // Before Start, what is left is the whole game.
  assert.deepEqual(schedule.left.study, schedule.whole.study);
});

test('where the class is: halfway through the autumn leaves half the first period and both others', () => {
  const world = createGonzalesWorld('days-mid', 5, { map: 'colonies', neighbours: true });
  world.status = 'running';
  world.minute = Math.round(momentOf(world, 'bexar-end') / 2);
  const schedule = classSchedule(world, PACES);
  assert.equal(schedule.season, 'the autumn of 1835');
  assert.ok(Math.abs(schedule.share - 0.5) <= 0.01, `share ${schedule.share}`);
  const leftTicks = [0, 1].map(end => PERIOD_TICKS[1][end] * (1 - schedule.share) + PERIOD_TICKS[2][end] + PERIOD_TICKS[3][end]);
  assert.deepEqual(schedule.left.study.minutes, leftTicks.map(value => Math.round(value * 9500 / 60000)));
  // The first period over, waiting for the teacher's Continue: nothing of it is left.
  world.status = 'ended'; world.minute = momentOf(world, 'bexar-end');
  world.director.milestones['bexar-end'] = true;
  assert.equal(classSchedule(world, PACES).share, 1);
  // The spring's ending: nothing left at all.
  world.period = 3; world.minute = momentOf(world, 'scrape-end');
  assert.deepEqual(classSchedule(world, PACES).left.study.days, [0, 0]);
  // The invented Gonzales country is one afternoon with no periods, and says nothing.
  assert.equal(classSchedule(createGonzalesWorld('days-slice', 5), PACES), null);
});

test('the Host is sent the schedule before Start and after, and a student is not', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'texas-days-'));
  const app = createClassroom({ seed: 'days-host', savePath: join(dir, 'class.json'), tickMs: 10000, playerCount: 5, worldFactory: (seed, count) => createGonzalesWorld(seed, count, { map: 'colonies', neighbours: true }) });
  try {
    const host = app.snapshot({ role: 'host' });
    assert.deepEqual(host.schedule.whole.study.days, [6, 11]);
    assert.equal(host.classSize, 5);
    const student = app.snapshot({ role: 'student', householdId: 'hh-1' });
    assert.equal(student.schedule, undefined);
    assert.equal(student.seats, undefined, 'nor who else could be given a family');
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('the teacher\'s README no longer says a class is one afternoon of 54 minutes', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.doesNotMatch(readme, /54 minutes|prototype of one afternoon/);
  assert.match(readme, /class days/);
});

test('the teacher\'s guide ships, and its class days are the Host page\'s (design audit S3)', () => {
  const guide = readFileSync(new URL('../TEACHER.md', import.meta.url), 'utf8');
  const schedule = classSchedule(createGonzalesWorld('days-guide', 5, { map: 'colonies', neighbours: true }), PACES);
  // Each pace's row of the table: the whole game's days, as the Host page shows them.
  for (const pace of ['study', 'brisk', 'quick']) {
    const row = guide.split(/\r?\n/).find(line => line.toLowerCase().startsWith(`| **${pace}**`));
    assert.ok(row, `TEACHER.md has no row for ${pace}`);
    const [low, high] = schedule.whole[pace].days;
    assert.match(row, new RegExp(`\\| ${low} to ${high}( class days)? \\|`), `TEACHER.md says something else than ${low} to ${high} days at ${pace}: ${row}`);
  }
  // The words on the Host's own buttons, and the debrief's standing questions, as the game has them.
  for (const words of ['Stop for today', 'End Game', 'Pause', 'Resume', 'Continue this class', 'Recover a student', 'I was already in this class', 'For the class']) assert.ok(guide.includes(words), `TEACHER.md does not say "${words}"`);
  for (const question of DISCUSSION) assert.ok(guide.includes(question), `TEACHER.md is missing the debrief question "${question}"`);
  // In the package, beside the README (scripts/package.ps1), and in the delta proof's copy of it.
  for (const script of ['package.ps1', 'verify-delta-update.ps1']) assert.match(readFileSync(new URL(`../scripts/${script}`, import.meta.url), 'utf8'), /'README\.md', 'TEACHER\.md'/, `${script} does not ship TEACHER.md`);
});
