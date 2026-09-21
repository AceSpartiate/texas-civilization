// Choosing whose work is on the screen, for a browser proof (docs/FAMILY_PANEL.md §12, owner 2026-09-21).
//
// Since that day a person's icons are drawn only while they are the family's **main person**, at the bottom middle of the
// screen. A proof that *presses* somebody's icon therefore has to do what a student does first: choose them. Before this,
// every row carried its own strip and a proof could reach into any of them. A proof that only *reads* an icon's words
// does not need this: an attribute is there to be read whether or not the icon is on the screen, and choosing somebody
// starts the camera watching them, which changes what a proof of motion is measuring.
//
// The gate is the same one the chores use (`tooYoung` in sim/family.mjs), so anybody who can be given work can be made
// main; a proof that fails here has found a person the server will not take, which is a fact worth failing on.

/** Make this person the family's main one and wait for the page to say so. Returns at once if they already are. */
export async function asMain(page, id, { timeout = 15000 } = {}) {
  const already = await page.evaluate(one => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === one, id);
  if (already) return;
  await page.locator(`.panel-focus[data-focus="${id}"]`).click();
  await page.waitForFunction(one => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === one, id, { timeout });
}
