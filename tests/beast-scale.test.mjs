// The family's ox at the size of the people and the cattle round it (scaling pass, 2026-10-27; HANDOFF.md "Scaling pass").
//
// Every beast on the map is drawn a multiple of a person (public/app.js `SIZE`, `drawnHeightOf`). The ox was 1.45 people from the
// first slice: on Astra's frames that stood the yard's ox (`ox-brown`) 1.48 times a grown man to the top of its hump - about 2.6 m
// against a man's 1.75, its back over his head - and 1.27 times the longhorn cows of the family's own herd standing beside it
// (public/herd-view.js `HERD_SIZE`). A working ox stands about 1.5 to 1.7 m at the withers, about a horse's height.
//
// Measured on the very frames the page draws (public/assets/frontier-v1/atlas.json), as public/art.js `drawSprite` lays them down:
// a frame `height` tall is drawn `height * h / logicalHeight`, standing `anchorY` of that above its ground point. The standing
// height read this way is the top of the drawing (an ox's hump or horns, a man's hat), which is within about 1% of the inked pixels
// (measured 2026-10-27). Watched failing at 1.45 before the fix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HERD_SIZE } from '../public/herd-view.js';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8'));
const frames = atlas.frames || atlas;
const app = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
/** How far above its ground point `sprite` reaches when drawn `height` (in people), as `drawSprite` draws it. */
function standing(sprite, height) {
  const f = frames[sprite];
  assert.ok(f, `no frame ${sprite}`);
  return height * f.h * f.anchorY / (f.logicalHeight || f.h);
}
// The page's own number: `ox: n` in public/app.js `SIZE`.
const ox = Number(app.match(/\box: ([\d.]+), horse: [\d.]+, wagon: [\d.]+/)?.[1]);
// A grown man standing, in the cast figures the map draws when a person's own looks are not drawn (one person tall).
const man = ['ochre-idle-e', 'elder-idle-e', 'father-straw-idle-e'].map(name => standing(name, 1)).reduce((a, b) => a + b) / 3;

test('the ox is drawn about a man\'s height to the top of its back, not head and shoulders over him', () => {
  assert.ok(ox > 0.5 && ox < 3, `the ox's drawn height was not read from public/app.js SIZE (${ox})`);
  // Standing in the yard (`ox-brown-idle`, `ox-cream-idle`) and walking (`ox-walk`): never smaller than the family leading it,
  // never more than a fifth taller than a man to the top of the hump and horns.
  for (const sprite of ['ox-brown', 'ox-cream', 'ox-walk-1', 'ox-walk-2']) {
    const ratio = standing(sprite, ox) / man;
    assert.ok(ratio >= 0.95 && ratio <= 1.2, `${sprite} stands ${ratio.toFixed(2)} of a grown man (${(ratio * 1.75).toFixed(2)} m)`);
  }
});

test('the ox stands no taller than the longhorn cows of the family\'s herd beside it, give or take a steer\'s size', () => {
  const cow = standing('cattle-longhorn-red-1', HERD_SIZE.cattle);
  const ratio = standing('ox-brown', ox) / cow;
  assert.ok(ratio <= 1.15, `the yard's ox stands ${ratio.toFixed(2)} times the longhorn cow`);
});
