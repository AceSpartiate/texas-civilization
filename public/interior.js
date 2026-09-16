// Inside the house: docs/SETTLING_IN.md step 7 (sim/interior.mjs), decided by the owner by multiple choice (2026-09-16).
//
// Opened by clicking the family's own house on the map. The room is its interior picture with its marked spots; the tray
// underneath holds everything the family has that is not set out. Choose a thing, then a free spot, and the server sets it
// there; choose a thing that stands in the room and "Put away" packs it. Two taps rather than a drag, so it works the same
// on a phone. The Host sees any family's rooms, read only.
import { drawSprite, spriteFrame } from '/art.js';
import { INTERIORS, INTERIOR_ART } from '/interior-data.js';

let chosenItem = null;

const el = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };

/**
 * Draw the room. `interior` is `{ kind, placed, items }` from the server; `readOnly` for the Host; `send(item, spot)` asks the
 * server to set a thing in a spot (or put it away with spot null). Returns what was drawn, for the proofs.
 */
export function renderInterior(root, interior, { title, readOnly = false, send, say }) {
  const body = root.querySelector('#interior-body');
  root.querySelector('#interior-title').textContent = title;
  body.replaceChildren();
  if (!interior?.kind) {
    body.append(el('p', 'The family is still camping. There is no house yet to set things in.', 'interior-note'));
    return { open: false };
  }
  const room = INTERIORS[interior.kind];
  const placed = interior.placed || {};
  const where = Object.fromEntries(Object.entries(placed).map(([spot, item]) => [item, spot]));
  if (chosenItem && !interior.items.includes(chosenItem)) chosenItem = null;

  const stage = el('div', null, 'interior-stage');
  const canvas = el('canvas', null, 'interior-canvas');
  const width = Math.min(640, Math.max(280, (root.clientWidth || 640) - 36));
  const wide = interior.kind === 'dog-run';
  // The picture fills the stage's width. It is drawn from its anchor (its feet, off centre), so the anchor is placed where
  // the picture's own box puts it; the spots are fractions of that same box (sim/interior-data.mjs).
  const frame = spriteFrame(room.sprite) || { w: 1, h: wide ? 0.44 : 0.87, anchorX: 0.5, anchorY: 0.93 };
  const pictureWidth = width * 0.98, pictureHeight = pictureWidth * frame.h / frame.w;
  const height = Math.round(pictureHeight * 1.02);
  canvas.width = width; canvas.height = height;
  stage.style.width = `${width}px`; stage.style.height = `${height}px`;
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const box = { left: (width - pictureWidth) / 2, top: (height - pictureHeight) / 2, width: pictureWidth, height: pictureHeight };
  drawSprite(ctx, room.sprite, box.left + frame.anchorX * pictureWidth, box.top + frame.anchorY * pictureHeight, pictureHeight);
  const spotAt = ([, , fx, fy]) => ({ x: box.left + fx * box.width, y: box.top + fy * box.height });
  const itemScale = wide ? pictureHeight * 1.5 : pictureHeight;
  if (!spriteFrame(room.sprite)) ctx.fillText('The rooms are still loading.', 12, 20);
  const drawn = [];
  // Back of the room first, so a thing by the door stands in front of a thing against the back wall.
  for (const spot of [...room.spots].sort((a, b) => a[3] - b[3])) {
    const item = placed[spot[0]];
    if (!item || !INTERIOR_ART[item]) continue;
    const at = spotAt(spot);
    drawSprite(ctx, INTERIOR_ART[item][0], at.x, at.y, INTERIOR_ART[item][1] * itemScale);
    drawn.push({ spot: spot[0], item });
  }
  // The spots, as buttons over the picture: a free spot takes the chosen thing; a filled one chooses what stands there.
  for (const spot of room.spots) {
    const [id, label] = spot, at = spotAt(spot), item = placed[id];
    const button = el('button', item ? '' : '+', `interior-spot${item ? ' filled' : ''}${item && item === chosenItem ? ' chosen' : ''}`);
    button.style.left = `${at.x}px`; button.style.top = `${at.y}px`;
    button.dataset.spot = id;
    button.title = item ? `${INTERIOR_ART[item][2]}, ${label.toLowerCase()}` : label;
    button.setAttribute('aria-label', button.title);
    button.hidden = readOnly || (!item && !chosenItem);
    button.addEventListener('click', async () => {
      if (item) { chosenItem = item === chosenItem ? null : item; renderInterior(root, interior, { title, readOnly, send, say }); return; }
      if (!chosenItem) return;
      const moving = chosenItem; chosenItem = null;
      await send(moving, id);
    });
    stage.append(button);
  }
  body.append(stage);

  if (readOnly) {
    body.append(el('p', drawn.length ? `${drawn.length} thing${drawn.length === 1 ? '' : 's'} set out.` : 'Nothing is set out yet.', 'interior-note'));
    return { open: true, kind: interior.kind, drawn };
  }
  const tray = el('div', null, 'interior-tray');
  tray.append(el('p', chosenItem
    ? (where[chosenItem] ? `Choose a free place for the ${INTERIOR_ART[chosenItem][2].toLowerCase()}, or put it away.` : `Choose a place for the ${INTERIOR_ART[chosenItem][2].toLowerCase()}.`)
    : interior.items.length ? 'Choose something to set out, or something in the room to move it.' : 'The family has nothing yet to set out.', 'interior-note'));
  const shelf = el('div', null, 'interior-items');
  for (const item of interior.items) {
    if (where[item]) continue;
    const button = el('button', INTERIOR_ART[item][2], `interior-item${item === chosenItem ? ' chosen' : ''}`);
    button.dataset.item = item;
    button.addEventListener('click', () => { chosenItem = item === chosenItem ? null : item; renderInterior(root, interior, { title, readOnly, send, say }); });
    shelf.append(button);
  }
  tray.append(shelf);
  if (chosenItem && where[chosenItem]) {
    const away = el('button', 'Put away', 'interior-away');
    away.addEventListener('click', async () => { const moving = chosenItem; chosenItem = null; await send(moving, null); });
    tray.append(away);
  }
  body.append(tray);
  return { open: true, kind: interior.kind, drawn, chosen: chosenItem };
}

export const clearInteriorChoice = () => { chosenItem = null; };
