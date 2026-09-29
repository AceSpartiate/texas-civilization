# Art style

## Astra's brief

Written by Astra, the game's artist, on 2026-09-28, so that Claude could help make the remaining art (owner: *"Astra wrote
this so that you can help make art. make all of the remaining art. yours will be temporary. label yours so astra can replace
as it makes the final versions."*). Kept here verbatim:

> Match the game’s existing **warm, hand-drawn storybook style**. Use a slightly elevated, north-up three-quarter view; thin dark olive-brown outlines; simple flat shading; and a restrained moss-green, rust, cream, and ochre palette. Keep the same camera angle, line weight, proportions, and scale as the shipped `civilians`, `people-walk`, and `people-vertical` atlases. Favor readable silhouettes over fine detail.
>
> For characters, preserve the same face, hair, clothing, and colors across every pose and sheet. Make assets animation-ready: separate, consistently anchored frames with enough poses for walking, turning, working, speaking, riding, or fighting as the scene requires. Deliver transparent PNGs with generous gutters and no text, painted background, or baked-in shadow. Treat famous people’s appearances as **original interpretations**, not verified portraits; research historical clothing and buildings without presenting uncertain details as fact.
>
> Before shipping, register every frame and clip in the art manifest, record its prompt and provenance, and check it beside existing game art at actual play size.

— Astra

## How Claude's temporary art follows it

There is no image model in this environment. Claude draws in SVG - by hand, or generated from a style kit and a person
rig - and rasterises it with the Playwright/Chrome the browser proofs use. Everything Claude draws is **temporary**, kept in
its own library (`public/assets/claude-standins/`, `madeBy: "claude"` on every sheet, frame and clip), and replaced by
Astra's frame or clip of the same name the moment hers is registered. See *Claude-drawn stand-ins* in
[ART_REQUESTS.md](ART_REQUESTS.md) and the plan, [CLAUDE_ART_PLAN.md](CLAUDE_ART_PLAN.md).

Each line of the brief, and what enforces it:

| The brief | In Claude's art |
| --- | --- |
| Same camera, line weight, proportions and scale as `civilians`, `people-walk`, `people-vertical` | Measured, not guessed: `scripts/claude-art/kit/measure-style.mjs` reads her atlases into `kit/measured.json`. A people row is normalised to a logical height of about 300 source px (civilians 300, people-walk 301, people-vertical 297) with the ground at 0.945 of it; Claude's people frames have logical height 300 and the ground at the same fraction (`PEOPLE` in `kit/style.mjs`), so they are drawn the same size on the same foot line. Soldiers have their own longer-legged build, as her military atlases do. |
| Thin dark olive-brown outline | Her outline's body is `#22150c` (civilians; `#23180f` people-vertical), about 4-5 source px at a 300 px figure; Claude's outer line is `LINE.outer` 4.2 px in that ink, inner lines half. |
| Simple flat shading, light from the upper left | `Ink.shape` in `kit/svg.mjs`: each shape is its colour with one flat shade crescent to the lower right and, on round forms, one lift. |
| Moss-green, rust, cream and ochre | `PALETTE` and `CAST` in `kit/style.mjs`, read from her sheets (region samples and colour histograms in `measured.json`) and from `public/person-palette.js`, whose colours the game's appearance recolouring looks for. |
| Same face, hair, clothing and colours across every pose | One parametric figure per identity (`kit/rig.mjs`): the eight grown cast figures, the girl, boy and small child, and four generic figures (a Texian volunteer, a Mexican regular, a cavalryman, a townsman), posed by joint targets with IK, so every pose is drawn from the same description. |
| Animation-ready, consistently anchored | Every frame carries its anchor and logical height; clips are declared as hers are in `animation.json` (frames with durations, loop, motion, direction, and `beat` for the frame a tool lands on). |
| Transparent, generous gutters, no text, background or baked shadow | Fixed cells with room round the figure; `tests/claude-standins.test.mjs` checks transparent corners, real alpha round every frame, and nothing painted well below the ground anchor. |
| Famous people as original interpretations | Stated in every such frame's written intent; no likeness is claimed (docs/BATTLES.md §2c). |
| Register every frame and clip; record prompt and provenance | `npm run build:standins` writes the manifest and [claude-art-provenance.json](claude-art-provenance.json) (made by Claude, the date, the written intent, the source SVG, "temporary"); the test fails on anything missing. |
| Check it beside existing art at play size | `node scripts/claude-art/compare.mjs` draws every Claude frame beside the Astra frames it stands for, with the game's own sprite arithmetic, on the map's grass at a person 40, 77 and 150 px (docs/evidence/claude-art/compare-*.png); `npm run test:work` shows it in a real class. |

**Where it falls short, honestly.** At play size (a person about 40 px) the rig's figures read as the same people as hers -
the principal's rust shirt and brim hat, the elder's grey beard and olive waistcoat, a woman's apron and skirt - and they stand
the same height on the same ground. From a close zoom they are plainly another, simpler hand: rounder limbs of even width,
one flat shade where she paints form and texture, stiffer poses with less weight in them, and smaller, simpler faces. That is
why every Claude frame stays on Astra's list after it lands.
