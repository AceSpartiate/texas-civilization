// The owner may sell this game (docs/ART_PLAN_LOCAL_2026-10-25.md, "The licence"), so every picture the local pipeline
// paints for it must come from a model whose licence allows that: FLUX.2 klein 4B fp8 (Apache-2.0). FLUX.2 klein 9B is
// FLUX Non-Commercial and is never allowed, whatever it painted before (the 2026-10-13 road tiles, repainted in batch 0).
// scripts/local-art/licence_check.py proves each picture's model from the workflow inside its own PNG; this holds the
// registry to the same rule, so a delivery cannot record a ComfyUI picture painted by anything else.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ALLOWED = /FLUX\.2 klein 4B fp8 \(Apache-2\.0\)/;
const REFUSED = /klein[ -]?9B|\.gguf|GGUF|LoRA|HiDream/i;

for (const [file, key] of [['art-provenance.json', 'assetSources'], ['art-prompts.json', 'entries']]) {
  test(`every ComfyUI entry in docs/${file} names klein 4B and nothing non-commercial`, () => {
    const entries = JSON.parse(readFileSync(new URL(`../docs/${file}`, import.meta.url), 'utf8'))[key];
    const local = entries.filter(entry => /ComfyUI/i.test(entry.tool || ''));
    assert.ok(local.length, 'no locally painted entry is registered: the road tiles at least should be');
    for (const entry of local) {
      assert.match(entry.tool, ALLOWED, `${entry.sheet}: ${entry.tool}`);
      assert.doesNotMatch(entry.tool, REFUSED, `${entry.sheet}: ${entry.tool}`);
    }
  });
}
