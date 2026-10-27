// Astra's family wagon with its cover drawn back (2026-10-12, `wagon-cover-drawn-back`), wired 2026-10-25 (batch W of
// docs/ART_PLAN_LOCAL_2026-10-25.md): while anybody rides in the wagon's bed (sim/company.mjs `rides`) it is drawn instead of the
// covered wagon, they sit in its open bed behind the cover - before the wagon, so its side boards hide them below the rail - and
// the driver sits on the board ahead of the cover. Until then they were set on top of the closed canvas (public/motion.js
// `bedLayout`, the stand-in of request 2026-09-25). The seat, rail and bed are checked against her own pixels, not the numbers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OPEN_WAGON, bedLayout, openCoverClip, seatLayout } from '../public/motion.js';
import { decodeRgba } from '../scripts/build-atlas-manifest.mjs';

const root = new URL('../public/assets/frontier-v1/', import.meta.url);
const atlas = JSON.parse(readFileSync(new URL('atlas.json', root), 'utf8'));
const clips = JSON.parse(readFileSync(new URL('animation.json', root), 'utf8'));
const SIZES = { horse: 1.5, ox: 1.1, wagon: 1.55 };

test('the open wagon is drawn only while somebody rides in a sound wagon, laden or not', () => {
  assert.equal(openCoverClip({ id: 'w' }, 0), null);
  assert.equal(openCoverClip({ id: 'w', laden: true }, 0), null);
  assert.equal(openCoverClip({ id: 'w', cart: true }, 2), null);
  assert.equal(openCoverClip({ id: 'w', carreta: true }, 2), null);
  assert.equal(openCoverClip({ id: 'w', condition: 'broken' }, 2), null);
  for (const wagon of [{ id: 'w' }, { id: 'w', laden: true }, { id: 'w', condition: 'sound' }]) {
    const clip = openCoverClip(wagon, 1);
    assert.equal(clip?.id, 'wagon-open-cover-w');
    assert.ok((clips.clips || clips)[clip.id], `${clip.id} is one of Astra's clips`);
  }
});

// Her west frame, read off the pixels: in wagon heights (its logical height) up from its ground anchor and forward of it.
const frame = atlas.frames['wagon-open-cover-w-1'];
const sheet = decodeRgba(readFileSync(fileURLToPath(new URL(`atlases/${frame.sheet}.png`, root))));
const tall = frame.logicalHeight || frame.h, footX = frame.x + frame.anchorX * frame.w, footY = frame.y + frame.anchorY * frame.h;
const alpha = (x, y) => sheet.data[(Math.round(y) * sheet.width + Math.round(x)) * 4 + 3];
/** The highest painted pixel in the column `forward` wagon heights ahead of the anchor (west is ahead: she painted it facing west). */
const top = forward => { const x = footX - forward * tall; for (let y = frame.y; y < frame.y + frame.h; y++) if (alpha(x, y) > 40) return (footY - y) / tall; return 0; };

test('her bed behind the cover is open to its rail, so a rider seated there shows head and shoulders over it', () => {
  for (const rows of [[0, 1], [2, 3], [4, 5]]) for (const index of rows) for (const mode of ['rig', true, false]) {
    const part = bedLayout('e', index, SIZES, 1, mode, false, true), box = -0.55 * SIZES.wagon;
    const forward = (part.dx - box) / SIZES.wagon;
    // The column the rider sits over is the bed, not the bunched cover: nothing painted stands above the rail there.
    const rail = top(forward);
    assert.ok(rail > 0.45 && rail < 0.62, `rider ${index} (${mode}) at ${forward.toFixed(2)} sits over her ${rail.toFixed(2)}-high column, not the open bed`);
    const hip = mode === 'rig' ? -part.dy + 0.30 * part.height : mode ? -part.dy + 0.42 * part.height : -part.dy + 0.44 * part.height;
    // Above the hip: half of the rig's seated layer, the rest of her whole seated passenger (hip 0.42 up it), the cut figure's.
    const head = hip + (mode === 'rig' ? 0.5 : mode ? 0.58 : 0.56) * part.height;
    assert.ok(hip / SIZES.wagon < rail, `rider ${index} (${mode}) sits on top of the rail (${(hip / SIZES.wagon).toFixed(2)} over ${rail.toFixed(2)})`);
    assert.ok(head / SIZES.wagon > rail + 0.05, `rider ${index} (${mode}) is hidden under the rail`);
    assert.equal(part.open, true); assert.equal(part.facing, true);
  }
});

test('the driver of the open wagon sits on her board ahead of the cover, ahead of everybody in the bed', () => {
  const driver = seatLayout('wagon', 'e', SIZES, 1, 1, false, true).find(part => part.part === 'rider');
  const box = seatLayout('wagon', 'e', SIZES, 1, 1, false, true).find(part => part.part === 'wagon');
  const forward = (driver.dx - box.dx) / SIZES.wagon, board = top(forward);
  assert.ok(Math.abs(board - OPEN_WAGON.seat.height) < 0.05, `the driver sits ${forward.toFixed(2)} forward, where her wagon is ${board.toFixed(2)} high, not at the board (${OPEN_WAGON.seat.height})`);
  assert.ok(driver.dy < seatLayout('wagon', 'e', SIZES, 1, 1).find(part => part.part === 'rider').dy, 'the driver of the open wagon sits higher than on the covered one');
  for (let index = 0; index < 6; index++) assert.ok(bedLayout('e', index, SIZES, 1, 'rig', false, true).dx < driver.dx, `rider ${index} sits ahead of the driver`);
  // Without riders nothing moves: the covered wagon's layout is as it was.
  assert.deepEqual(seatLayout('wagon', 'e', SIZES, 1, 1, false, false), seatLayout('wagon', 'e', SIZES, 1, 1));
  assert.deepEqual(bedLayout('e', 1, SIZES, 1, 'rig'), bedLayout('e', 1, SIZES, 1, 'rig', false, false));
});

test('the page draws the open wagon while somebody rides, the riders before it, and only once her sheet is here', () => {
  const app = readFileSync(fileURLToPath(new URL('../public/app.js', import.meta.url)), 'utf8');
  assert.match(app, /const coverClip = seat === 'wagon' && !rig \? openCoverClip\(box, aboard\.length\) : null;/);
  assert.match(app, /const cover = coverClip && clipReady\(coverClip\.id\) \? coverClip : null;/);
  assert.match(app, /layout\.splice\(layout\.findIndex\(part => part\.part === 'wagon'\), 0, \.\.\.riders\);/, 'the riders are not drawn before the wagon');
  assert.match(app, /if \(entity\.openCover && animated\(ctx, entity\.openCover, x, y, size, entity\.id, \{ flip: !flip, gait: entity\.gait \}\)\) return;/);
  // The next team behind a wagon with riders in its bed is drawn a whole ox and wagon back, so its ox does not stand over them.
  assert.match(app, /const gap = rigSpan \? \(rigSpan\.ahead \+ rigSpan\.behind \+ 0\.25\) \* 26 : openAhead \? OPEN_TRAIN_GAP : 82;/);
  const gap = Number(new Function('SIZE', `${app.match(/const OPEN_TRAIN_GAP = [^;]+;/)[0]} return OPEN_TRAIN_GAP;`)({ ox: 1.1, wagon: 1.55 }));
  assert.ok(gap > 82 && gap / 26 >= (0.95 + 0.7) * SIZES.ox + (0.55 + 0.6) * SIZES.wagon, `the gap behind an open wagon (${gap}) is shorter than its ox and its wagon`);
});
