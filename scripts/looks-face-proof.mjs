// The parents' faces in How We Look, in a real browser (owner, 2026-09-28: "there seems to be a graphical glitch with the
// character creation screens for the mom and dad" - "the dad's hair covers his face in the preview").
//
// The looks pop-up draws each parent in a painted cast figure recoloured to the choice (public/person-palette.js). Until
// 2026-09-28 the recolouring chose skin, hair and clothes by fixed boxes in the frame, and her figures do not keep to boxes:
// the father's hat brim came out in blocks of the chosen hair colour either side of his face, a bareheaded father had a band
// of the old skin across his forehead, the mother's forehead and cheeks took the hair colour. This proves, through the
// page's own drawing code (public/art.js `drawSprite`, the call the preview, each swatch, the family portrait and the map
// all make), for every figure a parent can be drawn in:
//
//   - no hair dye off the hair: the pixels that change when only the hair choice changes are all pixels painted in the
//     figure's hair colours (so none on a face, a hat, a scarf or a shirt), in the standing pose and every frame of the walk;
//   - the face takes the skin choice: the pixels painted in the face's own colour, in the middle of the face, all change
//     when only the skin choice changes.
//
// Then it walks the real pop-up for both parents at the three classroom screens and keeps a screenshot of each, with the
// preview, the figure and every swatch drawn.
//
// Since 2026-09-29 (the owner, v2026.09.29.1: "multiple choices in the character creator screens are just solid colors"):
//   - at 1366x768 every choice of every part is picked in turn, and after each every picture in the pop-up must be a figure,
//     not the plain backdrop a choice shows when its figure was not drawn (`figureless`);
//   - the father's "Moustache" is not drawn as the same man as "Bareheaded" (a painted stand-in moustache);
//   - a page whose first request for the second cast sheet is lost draws every choice once the sheet is asked for again
//     (public/art.js used to keep that failure for the life of the page).
//
// The colours and face boxes below are measured on Astra's frames (2026-09-28), not taken from the code under test.
// Same computer only, headless Chrome. Run: npm run test:looks-face
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createClassroom } from '../server/app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { HEAD } from '../sim/look-vocabulary.mjs';
import { meetFamily } from './support/meet-family.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };
const observed = { figures: {}, walks: {}, screens: [] };
const shots = [];

/**
 * Each figure a parent is drawn in: its face box in the south idle (fractions of the frame), the face's own paint and the
 * hair's own paint. Measured on the art, 2026-09-28, as the averages of its painted regions.
 */
const FIGURES = {
  rust: { face: [.331, .655, .162, .278], skin: [214, 140, 81], hair: [[60, 37, 24]] },
  elder: { face: [.327, .667, .118, .262], skin: [104, 62, 37], hair: [[151, 131, 114], [108, 91, 79], [200, 192, 180]] },
  ochre: { face: [.327, .667, .097, .281], skin: [248, 154, 84], hair: [[69, 43, 26]] },
  'rust-woman': { face: [.350, .675, .108, .293], skin: [233, 130, 62], hair: [[77, 44, 21]] },
  teal: { face: [.301, .667, .067, .280], skin: [173, 92, 45], hair: [[58, 40, 30]] },
  indigo: { face: [.324, .665, .073, .265], skin: [203, 107, 49], hair: [[63, 43, 32]] },
};
/**
 * Her children's figures (2026-09-29, the family's start): dyed to the child's own tone since that day, where until then they were
 * drawn as painted whatever their parents looked like. Measured on the art the same way, as the averages of their painted regions.
 */
const CHILDREN = {
  girl: { face: [.279, .721, .081, .319], skin: [223, 124, 54], hair: [[70, 43, 27], [63, 36, 21], [69, 42, 27], [71, 44, 28], [74, 45, 26], [61, 39, 24]] },
  boy: { face: [.273, .727, .101, .308], skin: [247, 164, 101], hair: [[198, 134, 66], [197, 133, 65]] },
  smallchild: { face: [.243, .75, .11, .358], skin: [225, 127, 57], hair: [[77, 44, 24]] },
};
/** At most this share of a head's pixels may take the hair dye while painted in no hair colour (the release had 3.4-8.4%). */
const STRAY_LIMIT = .005;
/** At most this share of the face's own paint may be left undyed by the skin choice (the release had up to 15%). */
const UNDYED_LIMIT = .01;
const VIEWS = [{ width: 1366, height: 768 }, { width: 1280, height: 800 }, { width: 1024, height: 600 }];

const app = createClassroom({ seed: 'looks-face-proof', playerCount: 5, tickMs: 200, worldFactory: createGonzalesWorld });
const port = await app.listen(0, '127.0.0.1'), url = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE && { executablePath: process.env.BROWSER_EXECUTABLE }) });
const errors = [];

/** In the page: draw a frame at its own size through art.js, as painted and in three looks, and measure it. */
async function measure(page, name, figure, faceBox) {
  return page.evaluate(async ({ name, figure, faceBox }) => {
    const art = await import('/art.js');
    for (let i = 0; i < 100 && !art.spriteReady(name); i++) await new Promise(resolve => setTimeout(resolve, 50));
    const frame = art.spriteFrame(name);
    if (!frame) return { missing: true };
    const w = frame.w, h = frame.h, logical = frame.logicalHeight || h;
    const draw = appearance => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      // Drawn at its own size about its own anchor, so canvas pixel (x, y) is frame pixel (x, y).
      art.drawSprite(ctx, name, frame.anchorX * w, frame.anchorY * h, logical, appearance ? { appearance } : {});
      return ctx.getImageData(0, 0, w, h).data;
    };
    const base = { skin: 'olive', hair: 'black', clothing: 'teal', head: 'hat' };
    const src = draw(null), a = draw(base), hairB = draw({ ...base, hair: 'fair' }), skinB = draw({ ...base, skin: 'deep brown' });
    const d2 = (p, c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
    const bottom = faceBox ? (faceBox[3] + .1) * h : h * .45;
    let head = 0, stray = 0, face = 0, undyed = 0;
    const strayAt = [];
    for (let y = 0; y < bottom; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, px = [src[i], src[i + 1], src[i + 2]], light = .299 * px[0] + .587 * px[1] + .114 * px[2];
      if (src[i + 3] < 32 || light < 38) continue;
      head++;
      const hairDyed = a[i] !== hairB[i] || a[i + 1] !== hairB[i + 1] || a[i + 2] !== hairB[i + 2];
      if (hairDyed && figure.hair.every(c => d2(px, c) > 70 * 70)) { stray++; if (strayAt.length < 6) strayAt.push([x, y, ...px]); }
      if (!faceBox) continue;
      const [x0, x1, y0, y1] = faceBox, fw = x1 - x0, fh = y1 - y0;
      const inFace = x >= (x0 - .05 * fw) * w && x <= (x1 + .05 * fw) * w && y >= (y0 + .12 * fh) * h && y <= y1 * h;
      if (inFace && d2(px, figure.skin) <= 22 * 22) { face++; if (a[i] === skinB[i] && a[i + 1] === skinB[i + 1] && a[i + 2] === skinB[i + 2]) undyed++; }
    }
    return { head, stray, face, undyed, strayAt };
  }, { name, figure, faceBox });
}

/**
 * The pop-up's pictures that are not a figure (2026-09-29; the owner, v2026.09.29.1: "multiple choices in the character
 * creator screens are just solid colors"). A choice whose figure was not drawn is the card's backdrop alone - a tan wash that
 * reads as a colour swatch. Each canvas is compared with the backdrop drawn by itself at its size: a figure changes at
 * least FIGURE_SHARE of it, and brings its own ink and many colours. Returns the ones that fail, with their numbers.
 */
const FIGURE_SHARE = .25, FIGURE_COLOURS = 300, FIGURE_INK = .01;
function figureless(page) {
  return page.evaluate(async ({ share, colours, ink }) => {
    const { drawAvatarPortrait } = await import('/avatar-art.js');
    const backdrops = new Map();
    const out = [];
    for (const canvas of document.querySelectorAll('#looks canvas')) {
      const { width: w, height: h } = canvas;
      if (!backdrops.has(`${w}x${h}`)) {
        const plain = document.createElement('canvas');
        plain.width = w; plain.height = h;
        drawAvatarPortrait(plain, null);
        backdrops.set(`${w}x${h}`, plain.getContext('2d').getImageData(0, 0, w, h).data);
      }
      const plain = backdrops.get(`${w}x${h}`), data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
      const seen = new Set();
      let changed = 0, dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
        if (Math.abs(data[i] - plain[i]) + Math.abs(data[i + 1] - plain[i + 1]) + Math.abs(data[i + 2] - plain[i + 2]) > 36) changed++;
        if (data[i] + data[i + 1] + data[i + 2] < 150) dark++;
      }
      const n = w * h, button = canvas.closest('button[data-part]');
      const tile = { what: button ? `${button.dataset.part}: ${button.dataset.value}` : canvas.id, changed: +(changed / n).toFixed(3), colours: seen.size, ink: +(dark / n).toFixed(3) };
      // The figure beside the preview is a whole small person on a ground strip: less of its card is the figure.
      const least = canvas.id === 'looks-figure' ? share / 2 : share;
      if (tile.changed < least || tile.colours < colours || tile.ink < ink) out.push(tile);
      else for (const key of ['changed', 'colours', 'ink']) if (canvas.id !== 'looks-figure') window.__leastFigure = { ...window.__leastFigure, [key]: Math.min(window.__leastFigure?.[key] ?? Infinity, tile[key]) };
    }
    return out;
  }, { share: FIGURE_SHARE, colours: FIGURE_COLOURS, ink: FIGURE_INK });
}

try {
  mkdirSync('docs/evidence', { recursive: true });
  const context = await browser.newContext({ viewport: VIEWS[0] });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);

  // ---------------------------------------------------------------- every figure a parent is drawn in
  const variants = await page.evaluate(async heads => {
    const { avatarVariant } = await import('/avatar-art.js');
    const out = {};
    for (const sex of ['male', 'female']) for (const head of heads[sex]) (out[avatarVariant({ head }, sex)] ??= []).push(`${sex}: ${head}`);
    return out;
  }, HEAD);
  assert.deepEqual(Object.keys(variants).sort(), Object.keys(FIGURES).sort(),
    `a parent can be drawn in a figure this proof has no measurements for: ${JSON.stringify(variants)}`);
  for (const [variant, heads] of Object.entries(variants)) {
    const figure = FIGURES[variant];
    const standing = await measure(page, `${variant}-idle-s`, figure, figure.face);
    assert.ok(!standing.missing, `${variant}-idle-s is not in the art`);
    observed.figures[variant] = { heads, ...standing };
    const strayShare = standing.stray / standing.head, undyedShare = standing.undyed / standing.face;
    assert.ok(strayShare <= STRAY_LIMIT, `${variant} (${heads.join(', ')}): the hair choice dyes ${standing.stray} of ${standing.head} head pixels that are painted in no hair colour (${(strayShare * 100).toFixed(1)}%), e.g. ${JSON.stringify(standing.strayAt)} - hair drawn over the face or hat`);
    assert.ok(undyedShare <= UNDYED_LIMIT, `${variant} (${heads.join(', ')}): ${standing.undyed} of ${standing.face} pixels of the face's own paint keep the old skin when the skin choice changes (${(undyedShare * 100).toFixed(1)}%)`);
    // The walking figure beside the preview and on the map: every frame of the walk.
    let worst = 0;
    for (const frame of [1, 2, 3, 4]) {
      const walk = await measure(page, `${variant}-walk-${frame}`, figure, null);
      if (walk.missing) continue;
      const share = walk.stray / walk.head;
      worst = Math.max(worst, share);
      assert.ok(share <= STRAY_LIMIT, `${variant}-walk-${frame}: the hair choice dyes ${walk.stray} of ${walk.head} head pixels painted in no hair colour (${(share * 100).toFixed(1)}%), e.g. ${JSON.stringify(walk.strayAt)}`);
    }
    observed.walks[variant] = Number((worst * 100).toFixed(2));
    ok(`${variant} (${heads.join(', ')}): no hair dye off the hair (${(strayShare * 100).toFixed(2)}% standing, ${(worst * 100).toFixed(2)}% at worst walking) and the face takes the skin (${(undyedShare * 100).toFixed(2)}% left)`);
  }
  // ---------------------------------------------------------------- her children, who take after their parents (2026-09-29)
  // A free Black or Tejano family's children were drawn light-skinned beside their parents: the palette did not know her
  // children's figures. Now each takes the skin choice on the face, and the hair choice only on the hair, standing and walking.
  await page.evaluate(async () => { const art = await import('/art.js'); art.loadArt?.({ sheets: ['children'] }); });
  for (const [variant, figure] of Object.entries(CHILDREN)) {
    const standing = await measure(page, `${variant}-idle-s`, figure, figure.face);
    assert.ok(!standing.missing, `${variant}-idle-s is not in the art`);
    observed.figures[variant] = { child: true, ...standing };
    const strayShare = standing.stray / standing.head, undyedShare = standing.undyed / standing.face;
    assert.ok(standing.face > 200, `${variant}: only ${standing.face} pixels of the face's own paint were found`);
    assert.ok(strayShare <= STRAY_LIMIT, `${variant}: the hair choice dyes ${standing.stray} of ${standing.head} head pixels painted in no hair colour (${(strayShare * 100).toFixed(1)}%), e.g. ${JSON.stringify(standing.strayAt)}`);
    assert.ok(undyedShare <= UNDYED_LIMIT, `${variant}: ${standing.undyed} of ${standing.face} pixels of the face's own paint keep the painted skin when the skin choice changes (${(undyedShare * 100).toFixed(1)}%) - the child is not drawn in the family's tone`);
    let worst = 0;
    for (const frame of [1, 2, 3, 4]) {
      const walk = await measure(page, `${variant}-walk-${frame}`, figure, null);
      if (walk.missing) continue;
      worst = Math.max(worst, walk.stray / walk.head);
      assert.ok(walk.stray / walk.head <= STRAY_LIMIT, `${variant}-walk-${frame}: the hair choice dyes ${walk.stray} of ${walk.head} head pixels painted in no hair colour`);
    }
    observed.walks[variant] = Number((worst * 100).toFixed(2));
    ok(`${variant} (a child): takes the family's tone on the face (${(undyedShare * 100).toFixed(2)}% left) and the hair choice only on the hair (${(strayShare * 100).toFixed(2)}% standing, ${(worst * 100).toFixed(2)}% at worst walking)`);
  }
  await context.close();

  // ---------------------------------------------------------------- the pop-up itself, both parents, three screens
  for (const [index, view] of VIEWS.entries()) {
    const screen = await browser.newContext({ viewport: view });
    const student = await screen.newPage();
    student.on('pageerror', error => errors.push(error.message));
    await student.goto(url);
    await student.locator('[name=name]').fill(`Face reader ${index + 1}`);
    await student.locator('[name=code]').fill(app.state.sessionCode);
    await student.getByRole('button', { name: 'Join', exact: true }).click();
    await student.waitForFunction(() => window.__snapshot?.world.householdId);
    // Everything up to the looks, as a student does it; the looks themselves are walked here.
    await student.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
    await student.locator('#creation-begin-button').click();
    await student.locator('#roll-family').waitFor({ state: 'visible', timeout: 15000 });
    await student.locator('#roll-family').click();
    await student.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
    await student.locator('#roll-family').click();
    await student.locator('#surname-input').fill('Facewright');
    await student.locator('#surname-save').click();
    await student.locator('#names').waitFor({ state: 'visible', timeout: 15000 });
    await student.locator('#names-done').click();
    for (let parent = 0; parent < 2; parent++) {
      await student.locator('#looks').waitFor({ state: 'visible', timeout: 15000 });
      const who = await student.locator('#looks').getAttribute('data-entity-id');
      // Every swatch and both big pictures drawn: a canvas with nothing on it but the backdrop would pass anything.
      await student.waitForFunction(() => [...document.querySelectorAll('#looks canvas')].every(canvas => {
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let dark = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i] + data[i + 1] + data[i + 2] < 150) dark++;
        return dark > canvas.width * canvas.height * .01;
      }), null, { timeout: 15000 });
      // Every choice of every part picked in turn, and after each every picture is a figure, not a plain swatch.
      if (index === 0) {
        const options = await student.locator('#looks-parts button[data-part]').evaluateAll(buttons => buttons.map(b => [b.dataset.part, b.dataset.value]));
        let pictures = 0;
        for (const [part, value] of options) {
          await student.locator(`#looks-parts button[data-part="${part}"][data-value="${value}"]`).click();
          const flat = await figureless(student);
          assert.deepEqual(flat, [], `parent ${parent + 1}, ${part} "${value}" picked: these pictures are not a figure (a plain swatch): ${JSON.stringify(flat)}`);
          pictures += await student.locator('#looks canvas').count();
        }
        observed.everyChoice = (observed.everyChoice || 0) + pictures;
        // A father's "Moustache" is painted on the bareheaded man (stand-in, public/person-palette.js): its picture is not
        // the "Bareheaded" one, whichever of the two was drawn first (the recoloured frame is cached by what it shows).
        const tile = value => student.locator(`#looks-parts button[data-part="head"][data-value="${value}"] canvas`);
        if (await tile('moustache').count() && await tile('bareheaded').count()) {
          for (const value of ['moustache', 'bareheaded']) {
            await student.locator(`#looks-parts button[data-part="head"][data-value="${value}"]`).click();
            const [a, b] = [await tile('moustache').evaluate(c => c.toDataURL()), await tile('bareheaded').evaluate(c => c.toDataURL())];
            assert.notEqual(a, b, `with "${value}" picked the Moustache choice is drawn as the same man as Bareheaded`);
          }
          observed.moustache = 'drawn apart from bareheaded';
        }
        observed.leastFigure = await student.evaluate(() => window.__leastFigure);
      }
      // The hair set to the palest choice, so any hair drawn where it is not would stand out in the picture kept.
      const fair = student.locator('#looks-parts button[data-part="hair"][data-value="fair"]');
      await fair.click();
      await student.waitForTimeout(200);
      const title = (await student.locator('#looks-title').innerText()).trim();
      const file = `docs/evidence/looks-face-${view.width}x${view.height}-parent-${parent + 1}.png`;
      await student.screenshot({ path: file });
      shots.push(file);
      observed.screens.push({ view: `${view.width}x${view.height}`, parent: parent + 1, title });
      await student.locator('#looks-done').click();
      await student.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 15000 });
    }
    ok(`at ${view.width}x${view.height} both parents' pop-ups draw the preview, the figure and every swatch (${observed.screens.filter(one => one.view === `${view.width}x${view.height}`).map(one => one.title).join('; ')})`);
    await meetFamily(student, 'Facewright', { timeout: 2000 });
    await screen.close();
  }
  ok(`at 1366x768 every choice of every part was picked for both parents, and after each all ${observed.everyChoice} pictures were figures (at least ${FIGURE_SHARE * 100}% of the card changed from the plain backdrop, ${FIGURE_COLOURS} colours, ${FIGURE_INK * 100}% ink; the least seen ${JSON.stringify(observed.leastFigure)})${observed.moustache ? ', and the father\'s Moustache is drawn apart from Bareheaded' : ''}`);

  // ---------------------------------------------------------------- a sheet whose first request is lost
  // The owner's solid colours (v2026.09.29.1): a page whose one request for the second cast sheet failed drew every choice
  // from it - the bareheaded father, the bonnet, the braid, the loose hair - as the plain backdrop for as long as the page
  // was open. Now the sheet is asked for again, and the pop-up draws the choices when it lands.
  {
    const screen = await browser.newContext({ viewport: VIEWS[0] });
    const student = await screen.newPage();
    student.on('pageerror', error => errors.push(error.message));
    let lost = 0;
    await student.route(/people-cast2-idle\.png/, route => (lost++ ? route.continue() : route.abort('connectionreset')));
    await student.goto(url);
    await student.locator('[name=name]').fill('Lost sheet');
    await student.locator('[name=code]').fill(app.state.sessionCode);
    await student.getByRole('button', { name: 'Join', exact: true }).click();
    await student.locator('#creation-begin-button').waitFor({ state: 'visible', timeout: 30000 });
    await student.locator('#creation-begin-button').click();
    await student.locator('#roll-family').click();
    await student.waitForFunction(() => document.querySelector('#roll-family')?.textContent === 'Meet your family', null, { timeout: 20000 });
    await student.locator('#roll-family').click();
    await student.locator('#surname-input').fill('Lostsheet');
    await student.locator('#surname-save').click();
    await student.locator('#names').waitFor({ state: 'visible', timeout: 15000 });
    await student.locator('#names-done').click();
    const kept = [];
    for (let parent = 0; parent < 2; parent++) {
      await student.locator('#looks').waitFor({ state: 'visible', timeout: 15000 });
      const who = await student.locator('#looks').getAttribute('data-entity-id');
      let flat = await figureless(student);
      for (let i = 0; flat.length && i < 40; i++) { await student.waitForTimeout(500); flat = await figureless(student); }
      const file = `docs/evidence/looks-solid/proof-lost-sheet-parent-${parent + 1}.png`;
      mkdirSync('docs/evidence/looks-solid', { recursive: true });
      await student.locator('#looks').screenshot({ path: file });
      shots.push(file);
      assert.deepEqual(flat, [], `parent ${parent + 1}: the first request for the second cast sheet was lost (${lost} asked) and 20 seconds later these pictures are still plain swatches: ${JSON.stringify(flat)}`);
      kept.push(await student.locator('#looks canvas').count());
      await student.locator('#looks-done').click();
      await student.waitForFunction(id => document.querySelector('#looks').hidden || document.querySelector('#looks').dataset.entityId !== id, who, { timeout: 15000 });
    }
    assert.ok(lost >= 2, `the lost sheet was never asked for again (${lost} request(s))`);
    observed.lostSheet = { requests: lost, pictures: kept };
    ok(`the first request for the second cast sheet lost: it was asked for again (${lost} requests) and both parents' pop-ups drew every picture as a figure (${kept.join(' and ')} pictures)`);
    await screen.close();
  }

  assert.deepEqual(errors, [], `the page threw: ${errors.join(' | ')}`);
  ok('no page errors');
  writeFileSync('docs/evidence/looks-face-browser.json', `${JSON.stringify({
    record: 'The parents\' faces in How We Look: no hair dye off the hair, the face takes the skin (2026-09-28)',
    date: new Date().toISOString().slice(0, 10),
    verdict: 'PASS',
    note: 'Same computer, headless Chrome. Measured through public/art.js drawSprite, the call the preview, the swatches, the family portrait and the map make. Colours and face boxes measured on the art, not read from the code under test. No LAN or district claim.',
    limits: { strayHair: STRAY_LIMIT, undyedFace: UNDYED_LIMIT },
    checks: pass,
    observed,
    screenshots: shots,
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed.`);
} finally {
  await browser.close();
  await app.close();
}
