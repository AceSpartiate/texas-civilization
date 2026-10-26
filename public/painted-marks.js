// The panel's small marks painted with the local pipeline (2026-10-26, batch 4 of docs/ART_PLAN_LOCAL_2026-10-25.md,
// docs/ART_DELIVERY_2026-10-26-LOCAL-ICONS.md): the hunger bowl and the food sack (request 2026-09-30, B13), the hands of help
// (request 2026-10-04, item 1, F37), the house's two cues (item 2, F38) and in out of the weather under a roof or a tent (request
// 2026-10-02, item 3, F31).
//
// They were drawn in the style sheet as masks on pseudo-elements, which a sprite cannot be drawn into. So each mark, once its sheet
// has come, is drawn once into a small canvas and handed to the style sheet as a picture (`--mark-<name>`), and its name is added to
// the root's `data-painted-marks`; public/style.css then shows the picture in place of the mask (each `:root[data-painted-marks~=…]`
// rule). Until then, and wherever the library is not there, the masks are drawn as before.

/** The marks the style sheet takes as pictures, by name, with the CSS custom property each is handed as. */
export const PAINTED_MARKS = Object.freeze(['mark-hunger', 'mark-food', 'mark-help', 'mark-shelter-house', 'mark-shelter-tent']);
/** The house's work whose cue is a painted mark of its own, drawn straight into the cue's canvas (`cueMark` in public/app.js). */
export const CUE_MARKS = Object.freeze({ 'keep-house': 'mark-cue-house', 'wash-clothes': 'mark-cue-wash' });

/**
 * Hand every painted mark whose sheet has come to the style sheet. `art`: { drawSprite, spriteFrame, spriteReady } (public/art.js);
 * `drawMark` (public/family-panel.js). Returns the names now painted. Cheap to call again: a mark already handed over is skipped.
 */
export function paintMarks(art, drawMark, { root = globalThis.document?.documentElement, size = 64, make = () => globalThis.document.createElement('canvas') } = {}) {
  if (!root) return new Set();
  const done = new Set(String(root.dataset.paintedMarks || '').split(' ').filter(Boolean));
  for (const name of PAINTED_MARKS) {
    if (done.has(name) || !art.spriteReady(name)) continue;
    const canvas = make();
    canvas.width = canvas.height = size;
    if (!drawMark(canvas, name, art)) continue;
    root.style.setProperty(`--${name}`, `url("${canvas.toDataURL('image/png')}")`);
    done.add(name);
  }
  const value = [...done].join(' ');
  if (root.dataset.paintedMarks !== value) root.dataset.paintedMarks = value;
  return done;
}
