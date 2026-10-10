// The short bar and "More" (owner, 2026-10-09, by multiple choice: **"Short bar + More"** - "Each bar shows the few works that
// matter now (field, house, food, town); butchering, carreta, furniture, range, wash and the like sit behind a 'More' button.").
// docs/FAMILY_PANEL.md, amendment 2026-10-09.
//
// A play-through as a new student (2026-10-09) counted 18 to 26 icons on every grown person's bar. This decides which of the
// icons the bar already draws (`barIcons` in public/family-panel.js: what can be pressed, what is going on, and the goals) stand on
// the bar, and which wait behind one "More" icon that opens the full bar in place. It decides nothing else: every icon behind
// "More" is the same button, sending the same order, refused by the server in the same words.
//
// **The rule.** An icon waits behind "More" only if it is one of the works the owner named or "the like" (`MORE_WORKS`), a field job
// that is not the field's job now (`fieldJob`), a goal greyed for want of a thing that is neither the house nor the field's job, or
// the garden offered only to help (it stays on the bar of the one whose work it is). Everything else stays, so a work the game adds
// later stands on the bar until somebody decides it can wait. And **never behind "More"**, whatever it is:
// - a work the person is doing, or the server marks active (it glows: the student or auto set them to it);
// - a work that glows for another reason - the house's cue (`cue`), a way to food while the food is low (`feeds`), the step the
//   guided start points at;
// - a work a tip, a story card or a refusal names (`named`): the play-through found the house card saying "assign Build house"
//   with no such button on the screen, and "More" must never make that worse.
// When only one icon would wait, nothing waits: a "More" for one icon saves nothing.
//
// It imports nothing, so the rule is tested headlessly (tests/short-bar.test.mjs).

/**
 * The works that wait behind "More" when nothing above keeps them on the bar. The owner's own list - butchering, the carreta,
 * furniture, the range, the wash - and the like: the routine work about the house and yard, the food that is not the hunt (it glows
 * on the bar while the food is low), the tools and the practice at the mark, the second field job (the fence), and of the main
 * person's orders the neighbour's homestead and working about the place (which shows while they are at it). A small child's
 * kinds of play beyond "Play as they please"; the children's own works (the hens, the kindling, the birds, the eggs, the water,
 * minding the little ones, going for help) stay.
 */
export const MORE_WORKS = Object.freeze(new Set([
  'butcher-beef', 'butcher-hog', 'look-to-stock', 'make-carreta', 'make-furniture', 'buy-furniture', 'wash-clothes',
  'milk-cow', 'keep-house', 'fish-the-water', 'gather-oysters', 'cut-bee-tree', 'practise-shooting', 'cut-lane', 'dig-well',
  'fence-yard', 'fence-plot', 'mend-hoe', 'replace-hoe', 'visit', 'work',
  'child-stick-horse', 'child-doll', 'child-cart', 'child-tag', 'child-hide', 'child-hoop', 'child-marbles',
]));

/** The field's jobs, the one that matters first first: a ripe crop, then bare ground, then staked ground, then new ground. */
export const FIELD_JOBS = Object.freeze(['harvest-field', 'plant-field', 'clear-plot', 'survey-plot']);

/**
 * The field's job now: the first of `FIELD_JOBS` the person can be given; with none open, the first greyed only for want of a thing
 * (a goal: planting short of seed); else null. Read from the icons the bar was going to draw, so it is the server's `can`.
 */
export function fieldJob(icons = []) {
  const open = FIELD_JOBS.find(key => icons.some(icon => icon.key === key && icon.can));
  return open || FIELD_JOBS.find(key => icons.some(icon => icon.key === key && icon.goal)) || null;
}

/** The house's work: a goal greyed for want of a thing still stands on the bar, as the house's card names it. */
const HOUSE_WORK = 'build-house';

/**
 * Which icons a set of words names: an icon whose name stands in any of `texts` as whole words, ignoring case ("Plant the field",
 * "“Fell trees”", "Work on the house"). `texts` are what the student is reading now - the tip standing, the refusal line, a story
 * card - and the result is a Set of keys.
 */
export function namedKeys(icons = [], texts = []) {
  const said = texts.filter(Boolean).map(text => String(text).toLowerCase()).join(' \n ');
  if (!said) return new Set();
  const named = new Set();
  for (const icon of icons) {
    const name = String(icon?.name || '').trim().toLowerCase();
    if (!name) continue;
    const at = new RegExp(`(^|[^a-z’'])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`);
    if (at.test(said)) named.add(icon.key);
  }
  return named;
}

/**
 * The bar, split: `shown` stands on the bar, `more` waits behind "More", each in the bar's own order. `icons` are what the bar was
 * going to draw (`barIcons`); `named` the keys something on the screen names (`namedKeys`, and the house card's work);
 * `glows(icon)` whether the page lights it for a reason of its own (the food gauge's `feedsNow`); `pointed` the guided start's key.
 */
export function shortBar(icons = [], { named = new Set(), glows = () => false, pointed = null } = {}) {
  const field = fieldJob(icons);
  const keep = icon => Boolean(icon.active || icon.cue || glows(icon) || named.has(icon.key) || (pointed && icon.key === pointed));
  const waits = icon => {
    if (FIELD_JOBS.includes(icon.key)) return icon.key !== field;
    if (icon.goal && icon.key !== HOUSE_WORK) return true;
    if (icon.key === 'work-garden' && icon.help) return true;
    return MORE_WORKS.has(icon.key);
  };
  const more = icons.filter(icon => !keep(icon) && waits(icon));
  if (more.length < 2) return { shown: [...icons], more: [] };
  return { shown: icons.filter(icon => !more.includes(icon)), more };
}

/** The "More" control's words: what a press does, and how many works wait behind it. */
export function moreLabel(open, count, name = '') {
  if (open) return { word: 'Fewer', label: `Show fewer works${name ? ` for ${name}` : ''}: put the ${count} less used ones back behind More.` };
  return { word: 'More', label: `More works${name ? ` for ${name}` : ''}: show ${count} more on the bar.` };
}

/**
 * Whether "More" is open on a person's bar, remembered per person for the session (owner, 2026-10-09: it remembers its state per
 * person). Kept in this page's memory and in the tab's session storage, so a reload keeps it and a new tab starts closed; a
 * browser that keeps nothing simply forgets it.
 */
export function moreMemory(storage = null) {
  const open = new Map();
  const key = id => `tr_bar_more:${id}`;
  return {
    isOpen(id) {
      if (!open.has(id)) { let kept = false; try { kept = storage?.getItem(key(id)) === '1'; } catch { kept = false; } open.set(id, kept); }
      return open.get(id);
    },
    set(id, value) {
      open.set(id, Boolean(value));
      try { if (value) storage?.setItem(key(id), '1'); else storage?.removeItem(key(id)); } catch { /* a private window may forget */ }
    },
  };
}

/**
 * The "More" control's picture. `icon-more` the moment it is drawn; until then three small tiles fanned, with three dots on the top
 * one - the bar's own tiles, more of them. stand-in: docs/ART_REQUESTS.md, request 2026-10-09 "the More icon on a short bar".
 */
export function drawMoreIcon(canvas, { drawSprite = null, spriteFrame = () => null } = {}) {
  const ctx = canvas.getContext('2d'), size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  const frame = spriteFrame('icon-more');
  if (frame && drawSprite) {
    const fit = Math.min(size * .86 / frame.w, size * .86 / frame.h);
    const x = (size - frame.w * fit) / 2 + frame.w * fit * frame.anchorX, y = (size - frame.h * fit) / 2 + frame.h * fit * frame.anchorY;
    if (drawSprite(ctx, 'icon-more', x, y, fit * (frame.logicalHeight || frame.h))) return true;
  }
  const s = size / 48;
  ctx.save();
  ctx.scale(s, s);
  ctx.lineWidth = 2; ctx.strokeStyle = '#8a6a3d';
  for (const [x, y, turn] of [[10, 12, -0.18], [14, 10, 0], [18, 12, 0.18]]) {
    ctx.save(); ctx.translate(x + 10, y + 13); ctx.rotate(turn);
    ctx.fillStyle = '#efe3c3'; ctx.beginPath(); ctx.roundRect(-10, -13, 20, 26, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#8a6a3d';
  for (const x of [18, 24, 30]) { ctx.beginPath(); ctx.arc(x, 23, 2.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  return false;
}
