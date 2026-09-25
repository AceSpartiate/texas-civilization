// Answering "how will they go?" for a browser proof (owner, 2026-09-24; docs/FAMILY_PANEL.md §15).
//
// Since that day every order that puts somebody on a road opens the chooser (`#going`, public/going.js) before it is sent. A
// proof that presses such an order and is not itself about the way does what a student does most often: sends them the way
// the server marked quickest and chose (or `way`, if given). `window.__goingPending` is set the moment the page asks, so an
// order that does not ask costs no waiting. A call's menu asks each person it sends in turn: every chooser is answered until
// none is pending for `quiet` milliseconds. Returns how many it answered.
export async function sendTheWay(page, { way = null, quiet = 400 } = {}) {
  let answered = 0;
  for (;;) {
    const pending = await page.waitForFunction(() => window.__goingPending, null, { timeout: answered ? quiet : 150 }).then(() => true, () => false);
    if (!pending) return answered;
    // Asked, and the order turned out to make no journey from here: sent as it is, no chooser drawn.
    const drawn = await page.waitForFunction(() => !window.__goingPending || (!document.querySelector('#going')?.hidden && window.__going?.ways), null, { timeout: 15000 }).then(() => page.evaluate(() => Boolean(window.__goingPending)));
    if (!drawn) continue;
    if (way) await page.locator(`#going [data-way="${way}"]`).click();
    await page.waitForFunction(() => window.__going?.can || !window.__goingPending, null, { timeout: 15000 });
    if (!(await page.evaluate(() => window.__goingPending))) continue;
    // Sent when this chooser has closed - and a call's menu may open the next person's at once, so it is counted by asking.
    const asked = await page.evaluate(() => window.__goingAsked);
    await page.locator('#going-send').click();
    await page.waitForFunction(n => !window.__goingPending || window.__goingAsked !== n || window.__going?.why, asked, { timeout: 15000 });
    answered++;
    if (await page.evaluate(n => window.__goingPending && window.__goingAsked === n, asked)) return answered; // refused, in the server's words: left for the proof to read
  }
}
