// Making a family before the world is seen (owner, 2026-09-17, public/creation.js): the title screen, the die, the family's
// last name, everybody's first names, and each parent's looks. Every browser proof whose student has a family walks it the
// way a student does before going on with what it proves; scripts/creation-browser-proof.mjs proves the walk itself.

/**
 * Walk the steps that are on the screen, within `timeout` ms of each. Returns the last name given, or null when nothing was
 * asked. Safe on a page whose family is already made: it waits, sees nothing, and returns.
 */
export async function meetFamily(page, surname = 'Proofwright', { timeout = 8000 } = {}) {
  const shown = async (selector, wait) => {
    try { await page.locator(selector).waitFor({ state: 'visible', timeout: wait }); return true; } catch (error) {
      if (!/Timeout/i.test(error.name + error.message)) throw error;
      return false;
    }
  };
  // The title screen: Begin, or in a class the join form, which the proof itself fills in.
  if (await shown('#creation-begin', timeout)) await page.locator('#creation-begin-button').click();
  // The die, and the family met.
  if (await shown('#roll-family', 4000)) {
    if ((await page.locator('#roll-family').textContent()) === 'Roll the die') {
      await page.locator('#roll-family').click();
      await page.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
    }
    await page.locator('#roll-family').click();
  }
  let asked = null;
  if (await shown('#surname', 10000)) {
    await page.locator('#surname-input').fill(surname);
    await page.locator('#surname-save').click();
    await page.locator('#surname').waitFor({ state: 'hidden', timeout: 15000 });
    asked = surname;
  }
  // Everybody's first names, kept as the game dealt them.
  if (await shown('#names', 10000)) {
    await page.locator('#names-done').click();
    await page.locator('#names').waitFor({ state: 'hidden', timeout: 15000 });
  }
  // Each parent's looks, kept as they were dealt; the box closes after the last. Every parent is waited for in turn, and a
  // page slow to fetch the book again must not be taken for a family that is finished: an unchosen parent brings the whole
  // curtain back over the world later (found by the family-commands proof, 2026-09-17).
  for (let parent = 0; parent < 6; parent++) {
    if (await page.locator('#creation').isHidden()) break;
    if (!(await shown('#looks', 10000))) break;
    const who = await page.locator('#looks').getAttribute('data-entity-id');
    await page.locator('#looks-done').click();
    await page.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 15000 });
  }
  // Nothing of the world is drawn until the curtain is down (public/app.js).
  try { await page.locator('#creation').waitFor({ state: 'hidden', timeout: 15000 }); } catch { /* a page that was never asked */ }
  return asked;
}
