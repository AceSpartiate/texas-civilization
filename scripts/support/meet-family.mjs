// The two pop-ups a rolled family meets before anything else (owner, 2026-09-17): the "Family Last Name" box, then How We
// Look for each parent. Both are required, so every browser proof whose student has a rolled family answers them the way a
// student does - a last name typed and saved, Done pressed on the dealt looks - before going on with what it proves.
// scripts/looks-browser-proof.mjs proves the pop-ups themselves; this only gets past them.

/**
 * Answer the pop-ups if they come up within `timeout` ms. Returns the last name given, or null when nothing was asked.
 * Safe to call on a page whose family is already named: it waits, sees nothing, and returns.
 */
export async function meetFamily(page, surname = 'Proofwright', { timeout = 8000 } = {}) {
  let asked = null;
  try {
    await page.locator('#surname').waitFor({ state: 'visible', timeout });
    await page.locator('#surname-input').fill(surname);
    await page.locator('#surname-save').click();
    await page.locator('#surname').waitFor({ state: 'hidden', timeout: 15000 });
    asked = surname;
  } catch (error) {
    if (!/Timeout/i.test(error.name + error.message)) throw error;
    if (!(await page.locator('#looks').isVisible())) return null;
  }
  // Each parent in turn; the box closes after the last.
  for (let parent = 0; parent < 4; parent++) {
    try { await page.locator('#looks').waitFor({ state: 'visible', timeout: parent === 0 ? 8000 : 3000 }); } catch { break; }
    const who = await page.locator('#looks').getAttribute('data-entity-id');
    await page.locator('#looks-done').click();
    await page.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 15000 });
  }
  return asked;
}
