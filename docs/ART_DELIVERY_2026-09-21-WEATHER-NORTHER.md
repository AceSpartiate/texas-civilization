# Norther weather art delivery — 2026-09-21

`weather-norther.png` supplies five painted weather silhouettes requested for the frontier map: three distinct trees driven to the right by a hard north wind, a flattened grass tuft, and low streaming smoke.

The 1536 × 1024 source uses the registry's sparse 4 × 2 layout: three trees and one empty cell on the first row; grass, smoke, and two empty cells on the second. Early drafts preserved the requested silhouettes but used a 3 × 2 grid and let leaves cross a logical boundary. Built-in spacing and layout edits corrected both defects. The accepted edit is copied unchanged, has 79.7% clear alpha, zero overlap trimming, and retains every visible object pixel.

The static one-frame clips allow the renderer to choose the authored gale pose while continuing to derive local wind strength and residual motion from simulation state. No gameplay state is encoded in the art.
