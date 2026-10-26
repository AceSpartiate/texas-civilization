// The local pipeline's paintings (2026-10-26, docs/ART_PLAN_LOCAL_2026-10-25.md) count as finished art (owner, 2026-10-25): each
// closes its request and retires the stand-in. Every sprite a local delivery names is in the library, and no Claude-drawn frame of
// the same name is left beside it (scripts/claude-art/kit/retire.mjs), so the page can only draw the painting.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const frontier = JSON.parse(readFileSync(new URL('../public/assets/frontier-v1/atlas.json', import.meta.url), 'utf8')).frames;
const claude = JSON.parse(readFileSync(new URL('../public/assets/claude-standins/atlas.json', import.meta.url), 'utf8')).frames;
const deliveries = readdirSync(new URL('../scripts/art-deliveries/', import.meta.url)).filter(name => /^local-.*\.mjs$/.test(name));

test('every sprite the local pipeline delivered is in the library, and Claude\'s of its name is retired', async () => {
  assert.ok(deliveries.length >= 6, `only ${deliveries.length} local deliveries`);
  let sprites = 0;
  for (const name of deliveries) {
    const { SHEETS } = await import(new URL(`../scripts/art-deliveries/${name}`, import.meta.url));
    for (const sprite of Object.values(SHEETS).flat()) {
      sprites++;
      assert.ok(frontier[sprite], `${name}: ${sprite} is not in the library`);
      assert.ok(!claude[sprite], `${name}: Claude's ${sprite} is still beside the painting`);
    }
  }
  assert.ok(sprites > 80, `only ${sprites} sprites`);
});
