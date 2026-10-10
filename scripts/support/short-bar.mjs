// The short bar and "More" (owner, 2026-10-09; public/short-bar.js): a proof that presses a work behind "More" opens "More" first, as a
// student does. One press on the row's own "More" tile, through the page's own handler; it is remembered for that person for the tab.

/**
 * Open "More" on a person's bar (the chosen person's when `entityId` is null) if it is there and closed, and wait until the full bar is
 * drawn. Returns 'opened', 'open' (it already was) or 'none' (the bar is short enough to have no "More").
 */
export async function openMore(page, entityId = null) {
  const state = await page.evaluate(id => {
    const row = id ? document.querySelector(`.panel-row[data-entity-id="${id}"]`) : document.querySelector('.panel-row[data-focused=true]');
    const more = row?.querySelector('.panel-icons .panel-more');
    if (!more) return 'none';
    if (more.getAttribute('aria-expanded') === 'true') return 'open';
    more.click();
    return 'opened';
  }, entityId);
  if (state === 'opened') {
    await page.waitForFunction(id => {
      const row = id ? document.querySelector(`.panel-row[data-entity-id="${id}"]`) : document.querySelector('.panel-row[data-focused=true]');
      return row?.querySelector('.panel-icons .panel-more')?.getAttribute('aria-expanded') === 'true';
    }, entityId, { timeout: 10000 });
  }
  return state;
}

/** Open "More" on every row of the family, so a proof that reads or presses any work on any row finds it as before. */
export async function openMoreEverywhere(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll('.panel-row')].map(row => row.dataset.entityId));
  for (const id of ids) await openMore(page, id);
  return ids.length;
}

/**
 * For a proof written before the short bar, about works that may now wait behind "More": open "More" on each person's bar the moment it
 * appears, once per person, as a student who always wants the whole bar would - and on every page this tab loads after. The person's
 * "More" then stays open for the tab (public/short-bar.js `moreMemory`), so the proof reads and presses the full bar as it did.
 */
export async function keepMoreOpen(page) {
  const install = () => {
    if (window.__keepMoreOpen) return;
    const opened = new Set();
    window.__keepMoreOpen = setInterval(() => {
      for (const more of document.querySelectorAll('.panel-row .panel-icons .panel-more[aria-expanded="false"]')) {
        const id = more.dataset.moreFor;
        if (opened.has(id)) continue;
        opened.add(id);
        more.click();
      }
    }, 150);
  };
  await page.addInitScript(install);
  await page.evaluate(install);
}
