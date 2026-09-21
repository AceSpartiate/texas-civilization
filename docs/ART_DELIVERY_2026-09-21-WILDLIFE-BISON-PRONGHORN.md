# Bison and pronghorn animation delivery — 2026-09-21

`wildlife-bison-pronghorn.png` supplies sixteen east-facing frames in a strict 4×4 atlas:

- American bison: four calm grazing/idle frames and four alert-to-running frames.
- Pronghorn: four calm grazing/idle frames and four alert-to-bounding frames.

The animals follow the established deer sheet's warm painted miniature style, dark outline, elevated side view, transparent background, and ground registration. The bison has a heavy forequarter, shoulder hump, beard, and short horns. The pronghorn has a slim tan-and-white body, white rump and throat marks, and branched dark horns. These silhouettes keep the two species distinct from the deer at map scale. West-facing display is obtained by mirroring.

The accepted built-in ImageGen PNG was copied unchanged. The delivery records four authored clips: `bison-idle`, `bison-run`, `pronghorn-idle`, and `pronghorn-bound`.

Read-only manifest validation measured a 1254×1254 RGBA image with 62.3484% fully transparent pixels. All sixteen required cells were found. Every frame retained 100% of its visible object pixels, with zero overlap pixels trimmed. The runtime copy is byte-identical to the generated source (`2787d7af8fc5dd1fe46d97cd4866bd0964335276e0450221bee421fa46ac4bd1`).

The art does not choose quarry or resolve a hunt. The simulation remains responsible for species, position, timing, movement and outcome.
