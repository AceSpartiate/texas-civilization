// A delivery of the local pipeline's paintings (docs/ART_PLAN_LOCAL_2026-10-25.md §0.3), read from the batch's record
// (scripts/local-art/records/<batch>-2026-10-26.json, written by `batches_2026_10_26.py record <batch>`): each row's prompt,
// references, seeds and the seed chosen. A delivery module in scripts/art-deliveries/ calls this with its sheets, so its
// prompts and provenance are the record's, never retyped.
import { readFileSync } from 'node:fs';

export const LOCAL_TOOL = 'local ComfyUI, FLUX.2 klein 4B fp8 (Apache-2.0) with the Qwen3-4B fp8-mixed encoder and the FLUX.2 VAE (4 steps, CFG 1), built by scripts/local-art/tx_workflows.py, through E:/VN-Tools/asset-toolkit/comfy.py';

export function readRecord(batch) {
  return JSON.parse(readFileSync(new URL(`./records/${batch}-2026-10-26.json`, import.meta.url), 'utf8'));
}

/**
 * `sheets`: { sheet: [sprite, ...] } as the atlas build takes them; `made`: sprite -> the row it was cut from when they differ
 * (a frame of a cycle). Returns { SHEETS, promptEntries, provenanceEntries } for scripts/art-deliveries/index.mjs.
 */
export function localDelivery({ batch, sheets, sources, postProcessing, review, made = {} }) {
  const record = readRecord(batch);
  const rowOf = sprite => record.rows.find(row => row.name === (made[sprite] || sprite));
  const promptEntries = Object.entries(sheets).map(([sheet, sprites]) => ({
    sheet,
    promptId: `frontier-v1/${sheet}`,
    tool: LOCAL_TOOL,
    mode: 'generate: reference edits of Astra\'s own frames (style, palette, line) or of a chosen painting of the same batch',
    prompt: sprites.map(sprite => {
      const row = rowOf(sprite);
      if (!row) throw new Error(`${sheet}: no recorded row for ${sprite}`);
      return `${sprite} (seed ${row.chosen} of ${row.seeds.join(', ')}; ${row.size.join('x')}; references: ${row.references.join(', ') || 'none'}): ${row.prompt}`;
    }).join('\n\n'),
    candidates: sprites.map(sprite => ({ sprite, chosen: rowOf(sprite).chosen, seeds: rowOf(sprite).seeds })),
    generatedSourcePath: `${sources}/raw/`,
    runtimeFile: `public/assets/frontier-v1/atlases/${sheet}.png`,
    postProcessing,
    review,
  }));
  const provenanceEntries = promptEntries.map(({ prompt, candidates, ...entry }) => entry);
  return { SHEETS: sheets, promptEntries, provenanceEntries };
}
