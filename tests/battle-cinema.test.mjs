// The class view watching a fight like a film (owner, 2026-09-30: "when battles happ3n, we should have the classview cinematically
// zoom in and watch the battle. players should see their family members fighting and wonder if they'll survive."; docs/BATTLES.md
// §15.3, docs/HOST_PAGE.md §2.15, public/battle-cinema.js).
//
// The film on its own, with no page: given what the page knows and the time, where the camera looks. These hold that it starts by
// itself on the Host when the server says a fight is being fought, fades to black and back, opens far out with a title and pushes
// in; follows the field and each of the class's own people in turn, never one shown hit; holds on the field while the smoke
// clears; puts the teacher's own view back with a fade; lets the teacher take the camera at any moment and keep it; stops at once
// for the end of the game; cuts for less motion; and that a student's page never starts it by itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CINEMA, createCinema, familyColour, FAMILY_COLOURS } from '../public/battle-cinema.js';

const field = { cx: 10, cy: 5, scale: 2000 };
const teacher = { cx: 2, cy: 2, scale: 300 };
const members = [{ id: 'p1', x: 10.05, y: 5.01, fallen: false }, { id: 'p2', x: 9.95, y: 4.99, fallen: false }];
const input = (over = {}) => ({ focus: true, battleId: 'gonzales', field, members, running: true, ended: false, reduced: false, current: teacher, home: teacher, ...over });
/** Run the film a frame every 50 ms from `from` to `to`, `make(t)` giving the input. Returns the views seen. */
function play(film, from, to, make) {
  const seen = [];
  for (let t = from; t <= to; t += 50) { film.update(make(t), t); seen.push({ t, state: film.state, view: film.view(t), fade: film.fade(t), title: film.title(t), followed: film.followed }); }
  return seen;
}

test('on the Host it starts by itself: a fade to black, the field from far off with a title, pushing in, and the fade up', () => {
  const film = createCinema({ mode: 'host' });
  film.update(input({ focus: false }), 0);
  assert.equal(film.state, 'off', 'it started before the fight');
  const seen = play(film, 100, 100 + CINEMA.fadeOutMs + CINEMA.establishMs + 500, () => input());
  const opening = seen.filter(one => one.state === 'opening'), establish = seen.filter(one => one.state === 'establish');
  assert.ok(opening.length && opening.at(-1).fade > 0.9, 'it did not fade to black first');
  assert.deepEqual(opening[0].view, teacher, 'the fade did not begin from where the teacher was looking');
  assert.ok(establish[0].fade > 0.8 && establish.at(-1).fade === 0, 'it did not fade up on the establishing shot');
  assert.ok(establish[0].view.scale < field.scale / 2, `the establishing shot is not from far off: ${establish[0].view.scale}`);
  assert.ok(Math.abs(establish.at(-1).view.scale - field.scale) < field.scale * 0.05, 'it did not push in to the field');
  for (let i = 1; i < establish.length; i++) assert.ok(establish[i].view.scale >= establish[i - 1].view.scale - 1e-6, 'the push-in went back out');
  assert.ok(establish.some(one => one.title === 1), 'no title over the establishing shot');
  assert.equal(seen.at(-1).state, 'follow');
});

test('it follows the field and each of the class\'s own people in turn, gliding, and holds a moment on one shown hit, then never follows him again', () => {
  const film = createCinema({ mode: 'host' });
  let fallen = false;
  const make = t => input({ members: members.map(one => one.id === 'p1' ? { ...one, fallen } : one) });
  play(film, 0, CINEMA.fadeOutMs + CINEMA.establishMs + 100, make);
  const start = CINEMA.fadeOutMs + CINEMA.establishMs + 150;
  const seen = play(film, start, start + 3 * (CINEMA.fieldMs + CINEMA.closeMs), make);
  const followed = [...new Set(seen.map(one => one.followed).filter(Boolean))];
  assert.deepEqual(followed.sort(), ['p1', 'p2'], `not every one of the class's people was followed: ${followed}`);
  const close = seen.find(one => one.followed === 'p1' && one.t - seen.find(s => s.followed === 'p1').t > CINEMA.glideMs * 3);
  assert.ok(close.view.scale > field.scale * 1.8 && Math.hypot(close.view.cx - 10.05, close.view.cy - 5.01) < 0.01, 'a shot of one man is not close on him');
  // A glide, never a jump: between two frames the camera moves a little.
  for (let i = 1; i < seen.length; i++) assert.ok(Math.abs(Math.log(seen[i].view.scale / seen[i - 1].view.scale)) < 0.1, `the camera jumped at ${seen[i].t}`);
  // p1 is shown hit while the camera is on him: it holds on him a moment, still and without words (owner, 2026-09-30: "Hold a
  // moment"), then moves on, and he is not followed again.
  const t0 = seen.at(-1).t;
  let on = t0;
  for (; film.followed !== 'p1'; on += 50) film.update(make(on), on);
  for (let i = 0; i < 60; i++, on += 50) film.update(make(on), on); // the camera has closed on him
  const onHim = film.view(on);
  fallen = true;
  const held = play(film, on + 50, on + 50 + CINEMA.holdHitMs + 1500, make);
  const holding = held.filter(one => one.t < on + 50 + CINEMA.holdHitMs - 100);
  assert.ok(holding.every(one => film && one.followed === null), 'the man hit was still marked followed - words on the screen');
  assert.ok(holding.every(one => Math.hypot(one.view.cx - onHim.cx, one.view.cy - onHim.cy) < 1e-6 && Math.abs(one.view.scale - onHim.scale) < 1e-6), 'the camera did not hold still on the man hit');
  const leaving = held.at(-1);
  assert.ok(Math.abs(leaving.view.scale - onHim.scale) > 1 || Math.hypot(leaving.view.cx - onHim.cx, leaving.view.cy - onHim.cy) > 1e-4, 'the camera stayed on him after the moment');
  const after = play(film, on + CINEMA.holdHitMs + 1600, on + CINEMA.holdHitMs + 1600 + 3 * (CINEMA.fieldMs + CINEMA.closeMs), make);
  assert.ok(!after.some(one => one.followed === 'p1'), 'a man shown hit was followed again');
});

test('when the fighting is over it holds on the field while the smoke clears, fades, and puts the teacher\'s view back', () => {
  const film = createCinema({ mode: 'host' });
  play(film, 0, CINEMA.fadeOutMs + CINEMA.establishMs + 2000, () => input());
  const end = CINEMA.fadeOutMs + CINEMA.establishMs + 2050;
  // One tick between two phases with no "battle" is not the end.
  play(film, end, end + CINEMA.graceMs - 500, () => input({ focus: false }));
  play(film, end + CINEMA.graceMs - 450, end + CINEMA.graceMs, () => input());
  assert.equal(film.state, 'follow', 'a moment without "battle" ended the film');
  // A lull while the fight is still going on (the hour before the parley, a night of the siege) keeps the camera on the field.
  play(film, end + 2100, end + 2100 + CINEMA.lullMs - 1000, () => input({ focus: false, live: true }));
  assert.equal(film.state, 'follow', 'a lull in a fight still going on ended the film');
  const resumed = end + 2100 + CINEMA.lullMs - 950;
  play(film, resumed, resumed + 2000, () => input());
  const done = play(film, resumed + 2050, resumed + 2050 + CINEMA.graceMs + CINEMA.holdMs + CINEMA.fadeOutMs + CINEMA.fadeInMs + 400, () => input({ focus: false, home: null }));
  const closing = done.filter(one => one.state === 'closing');
  assert.ok(closing.length * 50 >= CINEMA.holdMs, 'it did not hold on the field while the smoke cleared');
  assert.ok(closing.slice(0, 10).every(one => one.fade === 0 && one.followed === null), 'it faded or followed a man while it should have held on the field');
  assert.ok(closing.at(-1).fade > 0.9, 'it did not fade to black at the end');
  const back = done.find(one => one.state === 'reveal');
  assert.ok(back && back.view === null && back.fade > 0.8, 'the teacher\'s view did not come back under a fade');
  assert.equal(done.at(-1).state, 'off');
  // What is put back is the teacher's view from before the fight, not the one at its end.
  const film2 = createCinema({ mode: 'host' });
  play(film2, 0, 9000, () => input());
  let restore = null;
  for (let t = 9050; t < 30000 && !restore; t += 50) { film2.update(input({ focus: false, home: null }), t); restore = film2.takeRestore(); }
  assert.deepEqual(restore, { view: teacher }, 'the camera was not put back where the teacher had it');
  // A fight gone from the Host's map at once (over during a lull) ends the same way, on the field as it was last framed.
  const gone = createCinema({ mode: 'host' });
  play(gone, 0, 9000, () => input());
  const ending = play(gone, 9050, 9050 + CINEMA.holdMs + CINEMA.fadeOutMs + CINEMA.fadeInMs + 400, () => input({ focus: false, field: null, battleId: null, home: null }));
  assert.ok(ending.some(one => one.state === 'closing' && one.view) && ending.some(one => one.fade > 0.9), 'a fight gone from the map cut off the film with no hold and no fade');
  assert.deepEqual(gone.takeRestore(), { view: teacher }, 'a fight gone from the map did not put the teacher\'s view back');
  assert.equal(film2.takeRestore(), null, 'the view was put back twice');
});

test('the teacher takes the camera at any moment, keeps it for that fight, and can give it back; nothing is put back after', () => {
  const film = createCinema({ mode: 'host' });
  play(film, 0, 3000, () => input());
  const at = film.release(3000);
  assert.ok(at && film.state === 'released' && film.view(3000) === null, 'the camera was not given to the teacher');
  play(film, 3050, 20000, () => input());
  assert.equal(film.state, 'released', 'the film took the camera back by itself');
  assert.ok(film.resume(input(), 20000) && film.state === 'follow', 'the film could not be given the camera back');
  // Given back, the film puts back the view from before the fight at the end, as if never taken.
  const given = createCinema({ mode: 'host' });
  play(given, 0, 3000, () => input());
  given.release(3000); given.resume(input(), 4000);
  let put = null;
  for (let t = 4050; t < 30000 && !put; t += 50) { given.update(input({ focus: t < 6000, home: null }), t); put = given.takeRestore(); }
  assert.deepEqual(put, { view: teacher }, 'the camera handed back to the film was not put back where the teacher had it before the fight');
  film.release(21000);
  let restore = null;
  for (let t = 21050; t < 40000; t += 50) { film.update(input({ focus: false }), t); restore ||= film.takeRestore(); }
  assert.equal(restore, null, 'the camera was put back after the teacher had taken it');
  assert.equal(film.state, 'off');
  // The next fight starts it again.
  play(film, 40000, 40500, () => input({ battleId: 'concepcion' }));
  assert.equal(film.state, 'opening');
});

test('the end of the game stops it at once; another fight sent in its place is cut to through black; less motion cuts', () => {
  const film = createCinema({ mode: 'host' });
  play(film, 0, 12000, () => input());
  film.update(input({ ended: true }), 12050);
  assert.equal(film.state, 'off'); assert.equal(film.takeRestore(), null, 'the end of the game was given a camera put back');
  const recut = createCinema({ mode: 'host' });
  play(recut, 0, 12000, () => input());
  const seen = play(recut, 12050, 12050 + CINEMA.fadeOutMs + 400, () => input({ battleId: 'san-patricio' }));
  assert.ok(seen.some(one => one.state === 'recut' && one.fade > 0.9) && recut.state === 'establish' && recut.battleId === 'san-patricio', 'the new fight was not cut to through black');
  const still = createCinema({ mode: 'host' });
  const cut = play(still, 0, 400, () => input({ reduced: true }));
  assert.ok(cut.every(one => one.fade === 0), 'a fade was drawn for less motion');
  assert.deepEqual(cut.find(one => one.view)?.view, field, 'for less motion the camera did not cut straight to the field');
});

test('a student\'s page never starts it by itself; Watch starts the follow on the family\'s own, with no fade and no title', () => {
  const film = createCinema({ mode: 'student' });
  play(film, 0, 20000, () => input());
  assert.equal(film.state, 'off', 'a student\'s camera was taken without Watch');
  assert.ok(film.resume(input({ members: [members[0]] }), 20000));
  const seen = play(film, 20050, 20050 + CINEMA.fieldMs + CINEMA.closeMs, () => input({ members: [members[0]] }));
  assert.ok(seen.every(one => one.fade === 0 && one.title === 0), 'a student\'s film faded or put up a title');
  assert.ok(seen.some(one => one.followed === 'p1'), 'the family\'s own man was not followed');
  play(film, seen.at(-1).t + 50, seen.at(-1).t + 200, () => input({ focus: false, members: [members[0]] }));
  assert.equal(film.state, 'off', 'the film went on after the student moved the camera');
});

test('each family keeps one colour, told apart from the next', () => {
  assert.equal(familyColour('hh-1'), FAMILY_COLOURS[0]);
  assert.equal(familyColour('hh-13'), FAMILY_COLOURS[0]);
  assert.equal(familyColour('hh-2'), familyColour('hh-2'));
  for (let n = 1; n < 12; n++) assert.notEqual(familyColour(`hh-${n}`), familyColour(`hh-${n + 1}`));
});

test("a gun's shot jolts the film's camera a few pixels for half a second; never for less motion, never when the teacher has it", () => {
  const film = createCinema({ mode: 'host' });
  play(film, 0, 9000, () => input());
  film.thump(9000);
  const jolt = film.shake(9100), after = film.shake(9000 + CINEMA.shakeMs + 10);
  assert.ok(Math.hypot(jolt.x, jolt.y) > 1 && Math.hypot(jolt.x, jolt.y) <= CINEMA.shakePx, `the jolt was ${JSON.stringify(jolt)}`);
  assert.deepEqual(after, { x: 0, y: 0 });
  film.release(9200); film.thump(9300);
  assert.deepEqual(film.shake(9350), { x: 0, y: 0 }, "the teacher's camera was jolted");
  const still = createCinema({ mode: 'host' });
  play(still, 0, 1000, () => input({ reduced: true }));
  still.thump(1000);
  assert.deepEqual(still.shake(1050), { x: 0, y: 0 }, 'jolted for less motion');
});

// Found by test:mexican-advance on the release candidate (2026-10-01): the executions at Goliad, filmed since 2026-09-30, were
// over and gone from the Host's map before the establishing shot was done, and the camera the film then handed the page had no
// centre and no scale - the class view threw on every frame (the sound's levels, the smoke's gradients, the film's own evidence)
// until the next fight. The field as last framed is held instead, and the film ends as for any fight gone from the map.
test('a fight gone from the map during the fade or the establishing shot: the camera stays on the field as last framed, and the film ends', () => {
  const gone = input({ focus: false, battleId: null, field: null, members: [], live: false });
  for (const leaves of [CINEMA.fadeOutMs / 2, CINEMA.fadeOutMs + CINEMA.establishMs / 2]) {
    const film = createCinema({ mode: 'host' });
    const seen = play(film, 0, leaves, () => input());
    seen.push(...play(film, leaves + 50, leaves + 50 + CINEMA.establishMs + CINEMA.holdMs + CINEMA.fadeOutMs + CINEMA.fadeInMs + CINEMA.graceMs + 2000, () => gone));
    for (const one of seen) {
      if (!one.view) continue;
      assert.ok([one.view.cx, one.view.cy, one.view.scale].every(Number.isFinite), `gone at ${leaves} ms: at ${one.t} (${one.state}) the film's camera is ${JSON.stringify(one.view)}`);
    }
    assert.ok(seen.some(one => one.state === 'establish' && one.view), `gone at ${leaves} ms: no establishing shot`);
    assert.equal(seen.at(-1).state, 'off', `gone at ${leaves} ms: the film never ended (${seen.at(-1).state})`);
  }
});
