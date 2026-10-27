// A delivery of the local pipeline's paintings (docs/ART_PLAN_LOCAL_2026-10-25.md §0.3), read from the batch's record
// (scripts/local-art/records/<batch>-2026-10-26.json, written by `batches_2026_10_26.py record <batch>`): each row's prompt,
// references, seeds and the seed chosen. A delivery module in scripts/art-deliveries/ calls this with its sheets, so its
// prompts and provenance are the record's, never retyped.
import { readFileSync } from 'node:fs';

export const LOCAL_TOOL = 'local ComfyUI, FLUX.2 klein 4B fp8 (Apache-2.0) with the Qwen3-4B fp8-mixed encoder and the FLUX.2 VAE (4 steps, CFG 1), built by scripts/local-art/tx_workflows.py, through E:/VN-Tools/asset-toolkit/comfy.py';

export function readRecord(batch, date = '2026-10-26') {
  return JSON.parse(readFileSync(new URL(`./records/${batch}-${date}.json`, import.meta.url), 'utf8'));
}

/** The flagged sprites repainted from drawn guides on 2026-10-27 (scripts/local-art/fixes_2026_10_27.py): their rows are there. */
export const REDONE = Object.freeze({ record: ['fix', '2026-10-27'], sources: 'docs/art-sources/fixes-local-2026-10-27' });

/**
 * `sheets`: { sheet: [sprite, ...] } as the atlas build takes them; `made`: sprite -> the row it was cut from when they differ
 * (a frame of a cycle). Returns { SHEETS, promptEntries, provenanceEntries } for scripts/art-deliveries/index.mjs.
 */
export function localDelivery({ batch, sheets, sources, postProcessing, review, made = {}, redone = [] }) {
  const record = readRecord(batch);
  const fixes = redone.length ? readRecord(...REDONE.record) : null;
  const rowOf = sprite => (redone.includes(sprite) ? fixes : record).rows.find(row => row.name === (redone.includes(sprite) ? sprite : made[sprite] || sprite));
  const promptEntries = Object.entries(sheets).map(([sheet, sprites]) => ({
    sheet,
    promptId: `frontier-v1/${sheet}`,
    tool: LOCAL_TOOL,
    mode: 'generate: reference edits of Astra\'s own frames (style, palette, line) or of a chosen painting of the same batch',
    prompt: sprites.map(sprite => {
      const row = rowOf(sprite);
      if (!row) throw new Error(`${sheet}: no recorded row for ${sprite}`);
      if (redone.includes(sprite)) return `${sprite} (repainted 2026-10-27 from a drawn guide, ${REDONE.sources}; seed ${row.chosen} of ${row.seeds.join(', ')}; ${row.size.join('x')}; references: ${row.references.join(', ')}): ${row.prompt}`;
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
