export const SHEETS={'land-clearing':["stump-post-oak","stump-hollow-oak","stump-cottonwood","stump-cottonwood-small","survey-stake","survey-blazed-post","survey-stone-corner","survey-tied-stake","clearing-smoulder-1","clearing-smoulder-2","clearing-smoulder-3","clearing-smoulder-4","clearing-brush-green","clearing-brush-dry","clearing-ash","clearing-branches"]};
export const ANIMATION_CLIPS={'clearing-smoulder':{frames:[1,2,3,4].map(n=>({sprite:'clearing-smoulder-'+n,duration:500})),loop:true,authored:true,motion:'none',direction:'stationary'}};
export const promptEntries=[{
  "sheet": "land-clearing",
  "promptId": "frontier-v1/land-clearing",
  "tool": "built-in image_gen.imagegen",
  "mode": "generate and spacing edit",
  "prompt": "Create a production game sprite atlas using the attached nature sheet as STYLE reference only: warm hand-painted outlined miniature frontier objects, earthy browns cream olive, slightly elevated three-quarter view, clear bold silhouettes like its existing stump. EXACTLY four columns by four rows, 16 separate complete sprites on genuinely transparent alpha background, square1254x1254. Generous24px clear margin inside everycell, no object crosses any cell boundary. No text, labels or checkerboard. ROW1 four different low tree stumps: post oak freshly felled broad root flare; weathered post oak hollow; cottonwood pale wood and gray bark; small cottonwood low stump. ROW2 four survey corner objects: plain short sharpened survey stake standing upright; rough taller blazed wooden post with pale axe blaze and no letters; low mound of field stones; another small split stake with a simple cream cloth tie. ROW3 four distinct frames of ONE pile of cut thorny brush smouldering: same pile shape at same scale in everycell, few dim embers and translucent gray smoke curling upward changing clearly in each frame. No tall flames, no landscape ground patch, smoke entirely within cell. ROW4 four static clearing states: freshly cut loose green brush pile; dried brush pile; blackened cold ash-and-twig pile no smoke; stacked cut branches bound with plain rope. Full isolated sprites, shadows only tiny contact shadows; each object sits at consistent baseline per row. Functional reusable assets for Texas frontier1835 field clearing, not ornamental icons. Stumps must be broad low forms, not whole trees.",
  "reference": "public/assets/frontier-v1/atlases/nature.png",
  "correctionPrompts": [
    "Keep all sixteen drawings and their4x4 cell order. Shrink EACH complete sprite uniformly to75% of its present size inside its OWN cell and recenter, giving generous transparent gutters. Keep genuine RGBA transparency, including smoke transparency. Preserve all stump variants, stakes, smoke poses and brush piles. No new images or labels. No checkerboard. All sprites fully contained with at least24pixels margin within each cell."
  ],
  "generatedSourcePath": "C:\\Users\\zachw\\.codex\\generated_images\\01a082eb-77f7-7f73-8400-ebcc7426ac7b\\exec-9092d594-d0f1-498c-9bdd-c8583fc44889.png",
  "runtimeFile": "public/assets/frontier-v1/atlases/land-clearing.png",
  "postProcessing": "None. Generated original copied unchanged.",
  "generationHistory": [
    {
      "generatedSourcePath": "C:\\Users\\zachw\\.codex\\generated_images\\01a082eb-77f7-7f73-8400-ebcc7426ac7b\\exec-4bd2cf77-a32c-4662-8d31-7fa84eefccdf.png",
      "review": "Superseded by spacing correction."
    }
  ],
  "review": "Sixteen isolated clearing and survey pieces. Four authored smoke poses; timber stumps and dry brush are static state art."
}];
export const provenanceEntries=promptEntries.map(({prompt,correctionPrompts,...entry})=>entry);
export const notes=['Smoke is a presentation cycle only, never a fire or clearing outcome. The live field uses dry brush unless a burning state is explicitly projected.'];
