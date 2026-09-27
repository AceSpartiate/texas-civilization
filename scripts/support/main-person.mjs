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
  await page.locator(`.panel-focus[data-focus="${id}"]`).click({ timeout }).catch(async error => {
    // Said with where the star is and what hides it, so a failure here reads as the page's state and not a bare timeout.
    const why = await page.evaluate(one => {
      const star = document.querySelector(`.panel-focus[data-focus="${one}"]`);
      const hidden = [];
      for (let node = star; node && node !== document.body; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (node.hidden || style.display === 'none' || style.visibility === 'hidden') hidden.push(`${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${[...node.classList].join('.')}${node.hidden ? '[hidden]' : ''} display:${style.display}`);
      }
      const box = star?.getBoundingClientRect();
      const shown = selector => Boolean(document.querySelector(selector) && !document.querySelector(selector).hidden);
      return { star: Boolean(star), box: box && { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }, hidden,
        folded: document.querySelector('#family-panel')?.dataset.collapsed || null, placing: document.body.dataset.placing || null,
        open: ['#site-choose', '#survey-choose', '#selection', '#going', '#errand', '#encounter', '#wagon'].filter(shown),
        land: window.__snapshot?.world.land && { choosingSite: window.__snapshot.world.land.choosingSite || null, surveying: window.__snapshot.world.land.survey || null },
        person: window.__snapshot?.world.entities.find(entity => entity.id === one) && (e => ({ age: e.age, health: e.health, travel: Boolean(e.travel), chore: e.chore?.id || null }))(window.__snapshot.world.entities.find(entity => entity.id === one)) };
    }, id);
    throw new Error(`${id} could not be made the main person: ${JSON.stringify(why)} (${error.message.split('\n')[0]})`);
  });
  await page.waitForFunction(one => document.querySelector('.panel-row[data-focused=true]')?.dataset.entityId === one, id, { timeout });
}
