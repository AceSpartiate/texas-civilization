// A rider heard out on the page, as a student does: the "!" on the person he stopped, then Done (owner, 2026-09-29, one rider,
// one visit: docs/COLONIES.md §5.4b). A question the word raises waits until he has gone, so a proof that is after the
// question lets him go first. Whatever came up next by itself (the call's menu) is put away, so the proof goes on from the
// screen it expects.

/** If a rider is talking with this page's family, send him on. Returns whether one was. */
export async function sendRiderOn(page) {
  const listener = await page.evaluate(() => (window.__snapshot?.world?.encounter?.status === 'open' && window.__snapshot.world.encounter.kind !== 'alamo-runner' ? window.__snapshot.world.encounter.listenerId : null));
  if (!listener) return false;
  // The "!" and then Done, pressed as a student presses them; a tip or card another proof is about may stand over the "!", so
  // when the press does not open the conversation it is pressed on the element itself.
  const mark = page.locator(`.panel-row[data-entity-id="${listener}"] .panel-attention`);
  await mark.click({ timeout: 3000 }).catch(() => mark.evaluate(node => node.click()).catch(() => {}));
  const done = page.locator('#encounter .ask-leave:not(.ask-done)');
  if (!(await done.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false))) await mark.evaluate(node => node.click()).catch(() => {});
  if (await done.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false)) await done.click({ timeout: 3000 }).catch(() => done.evaluate(node => node.click()).catch(() => {}));
  await page.waitForFunction(id => window.__snapshot?.world?.encounter?.listenerId !== id || window.__snapshot.world.encounter.status !== 'open', listener, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);
  if (await page.locator('#call-menu').isVisible().catch(() => false)) await page.locator('#call-menu-close').click({ timeout: 3000 }).catch(() => {});
  return true;
}

/** Wait until `ready` holds on the page, sending on any rider who stands in front of it meanwhile. */
export async function untilPastRiders(page, ready, { timeout = 150000, label = 'the page never got past its riders' } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await page.evaluate(ready)) {
      // The question is come to as a student comes to it, by the "!" of the first of the family who may answer it (the father,
      // at the top of the column), which puts that person's card up with the question on it; the call's one menu that also
      // opens is put away. A rider who rode on by himself - early, to leave the question behind him its time (owner,
      // 2026-09-29, "Rider leaves at dawn") - opened nothing, and one sent on may have left somebody else's card up.
      {
        const id = await page.evaluate(() => (window.__familyPanel || []).find(row => row.needs?.includes('call'))?.id).catch(() => null);
        if (id) {
          await page.locator(`.panel-row[data-entity-id="${id}"] .panel-attention`).click({ force: true, timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(400);
          if (await page.locator('#call-menu').isVisible().catch(() => false)) await page.locator('#call-menu-close').click({ timeout: 3000 }).catch(() => {});
        }
      }
      return;
    }
    await sendRiderOn(page);
    await page.waitForTimeout(300);
  }
  const seen = await page.evaluate(() => { const w = window.__snapshot?.world; return { minute: w?.minute, status: w?.status, request: w?.request && { kind: w.request.kind, status: w.request.status }, encounter: w?.encounter && { status: w.encounter.status, topic: w.encounter.topicId, waiting: w.encounter.waiting }, reports: (w?.reports || []).map(one => `${one.topicId}:${one.status}`) }; }).catch(() => null);
  throw new Error(`${label}: ${JSON.stringify(seen)}`);
}
