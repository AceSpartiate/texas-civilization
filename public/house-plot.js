// The house plot on the family's page: docs/WOODS_AND_BUILDING.md §6.2, build step 5.
//
// A grid of eight-foot cells, the period plans to start from, and the pieces to place. What each piece needs and does,
// what the whole plan would give and still wants, and how far each piece has got all come from the server (the catalogue
// once, the family's land line on the tick); the page only lays them out and sends what the student chooses. The server
// decides where a piece may go.
import { CELL_SHARE, houseFootprint, turned } from '../sim/house-footprint.mjs';
// A house's cells turned on the ground, and the footprint they make, are the server's own (sim/house-footprint.mjs): the
// house drawn here is the house sim/house-placement.mjs checks.
export { houseFootprint, turned };

const PHASES = { site: 'the site laid out', walls: 'walls going up', roofing: 'roof going on', finished: 'standing' };

let selected = null, shown = '', pending = false;

const el = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const partsIn100 = share => Math.round(share * 100);
const logWords = logs => [logs.wall && `${logs.wall} wall`, logs.sill && `${logs.sill} sill`, logs.any && `${logs.any} of any kind`].filter(Boolean).join(', ') || 'no logs';

/**
 * The next stage, what it wants before anybody can start it, and what the family has to start it with (owner, 2026-09-17:
 * "say what the next house stage needs"). Until now the panel said what the whole plan still wanted - "still wants 26 wall
 * logs" - and a student who hauled eleven logs in could not tell why the walls still would not go up. The stage and its
 * want are the server's (`stageWants` in sim/houseplot.mjs); the pile is the family's own land line. A stage already begun
 * wants no more logs: they went onto it when it started.
 */
export function nextLine(house, logs) {
  const wants = house.wants || null;
  if (!wants) return `Next: ${house.stage}.`;
  const asks = wants.logs.wall || wants.logs.sill || wants.logs.any;
  const sound = (logs?.wall || 0) + (logs?.sill || 0), poor = logs?.poor || 0, lying = logs?.lying || 0;
  const have = `${sound} sound${poor ? ` and ${poor} poor` : ''} at the house${lying ? `, ${lying} lying out` : ''}`;
  return `Next: ${house.stage}. It wants ${asks ? `${logWords(wants.logs)} logs and ` : ''}about ${wants.hours} hours\u2019 work; ${have}.`;
}

/** Whether this family plans its house on the plot. */
export const plotted = (world, catalogue) => Boolean(catalogue && world.role !== 'host' && world.land?.plot);

/**
 * Draw the plot panel. `send(command)` posts an order and resolves or throws with the server's sentence; `rerender` asks
 * for the page to be drawn again.
 */
export function renderHousePlot(world, catalogue, { open, send, rerender, drawSprite, spriteFrame, place }) {
  const panel = document.querySelector('#house-plot');
  if (!panel) return;
  panel.hidden = !open;
  if (!open) { shown = ''; return; }
  const land = world.land || {}, house = land.house;
  panel.dataset.additional = String(Boolean(land.canAddHouse));
  const shape = JSON.stringify([house, land.choices, land.planned, land.home, land.logs, selected]);
  // Repaint previews when lazy-loaded art becomes available, even if the plan is unchanged.
  shown = shape;


  const summary = panel.querySelector('#plot-summary');
  const count = (land.completedHouses?.length || 0) + (house ? 1 : 0);
  summary.replaceChildren(el('p', house ? `House ${count}: ${house.stage || 'planned'}.` : 'Pick a house for your family.'));
  if (house?.wants) summary.append(el('p', nextLine(house, land.logs), 'house-line'));
  if (house?.why) summary.append(el('p', house.why, 'house-line'));

  // The period plans, while nothing is begun.
  const plans = panel.querySelector('#plot-plans');
  plans.replaceChildren(...(land.additionalChoices || land.choices || []).map(choice => {
    const plan = catalogue.plans.find(each => each.id === choice.id);
    const button = el('button', undefined, 'house-choice');
    const preview = el('canvas');
    preview.width = 280; preview.height = 130;
    preview.setAttribute('aria-hidden', 'true');
    const finished = (plan?.pieces || []).map(([type, x, y]) => [type, x, y, catalogue.pieces.find(piece => piece.id === type)?.stageCount || 1, 0]);
    if (drawSprite) drawHousePlot(preview.getContext('2d'), 140, 100, 65, { house: { pieces: finished } }, catalogue, drawSprite, spriteFrame);
    button.append(preview, el('strong', plan?.name || choice.id), el('span', land.canAddHouse ? 'Build another' : house?.plan === choice.id ? 'Selected' : 'Choose this house'));

    button.type = 'button'; button.dataset.plan = choice.id; button.disabled = !choice.can || pending;
    button.setAttribute('aria-pressed', String(!land.canAddHouse && house?.plan === choice.id));
    if (!choice.can) button.title = choice.why;
    return button;
  }));
  plans.hidden = !land.choices && !land.additionalChoices;

  // The presets are the complete player-facing choice; construction details stay in the simulation.
  panel.querySelector('#plot-grid').hidden = true;
  panel.querySelector('#plot-palette').hidden = true;
  panel.querySelector('#plot-hint').textContent = 'Choose a finished house below. Then close this panel and assign Build house from your person’s actions.';
  // Wire the controls once; they read `selected` and send through `send`.
  if (!panel.dataset.wired) {
    panel.dataset.wired = 'true';
    panel.addEventListener('click', async event => {
      const note = panel.querySelector('#plot-note');
      const target = event.target.closest('button');
      if (!target || target.disabled) return;
      const act = async command => {
        if (pending) return;
        pending = true; note.textContent = ''; shown = ''; rerender();
        try { await send(command); } catch (error) { note.textContent = error.message; } finally { pending = false; shown = ''; rerender(); }
      };
      if (target.dataset.piece) { selected = selected === target.dataset.piece ? null : target.dataset.piece; shown = ''; rerender(); return; }
      if (target.dataset.plan) { selected = null; if (place) return place({ action: 'plan-house', layout: target.dataset.plan, additional: panel.dataset.additional === 'true' }); return act({ action: 'plan-house', layout: target.dataset.plan, additional: panel.dataset.additional === 'true' }); }
      if (target.dataset.remove !== undefined) return act({ action: 'remove-piece', index: Number(target.dataset.remove) });
      if (target.dataset.x !== undefined && selected) return act({ action: 'place-piece', piece: selected, x: Number(target.dataset.x), y: Number(target.dataset.y) });
    });
  }
}

/** Which of the house pictures a pen is drawn with, and how far up: site, walls, roofing, or finished (no suffix). */
function penPicture(p) {
  const kind = p.type === 'pen-hewn' ? 'hewn-log' : p.type === 'pen-jacal' ? 'jacal' : 'round-log';
  if (p.stage >= p.kind.stageCount) return `house-${kind}`;
  const lastWall = p.type === 'pen-jacal' ? 1 : 10;
  return `house-${kind}-${p.stage < 1 ? 'site' : p.stage <= lastWall ? 'walls' : 'roofing'}`;
}

/**
 * Where a roof goes on its walls, when the walls are drawn standing at (x, y) `height` high: the point to draw it at, the
 * height to draw it and the point of its own frame to put there. The house-modules sheet draws each piece of a pen alone
 * in its cell, and a frame's ground anchor is where it meets the ground - which for a roof is the low front tip of its
 * eaves. Drawn at the walls' ground anchor, the roof came down in front of the walls to the ground (student, 2026-09-23:
 * "the roof doesn't seem to stay where it's supposed to be. It slides forward."). The atlas measures a seat on the full
 * walls and on each roof (`seatX`, `seatY`: the middle of the wall tops, the middle of the eaves; scripts/
 * build-atlas-manifest.mjs `seatOf`), and the roof is drawn with the one on the other, at the walls' own pixel scale.
 * null when either frame has no seat, and then no roof is seated at all.
 */
export function roofSeat(walls, roof, x, y, height, flip = false) {
  if (!Number.isFinite(walls?.seatX) || !Number.isFinite(roof?.seatX)) return null;
  const scale = height / (walls.logicalHeight || walls.h);
  return {
    // Mirrored (a pen at a quarter turn, `drawHousePlot`), the walls' seat is as far the other side of their anchor.
    x: x + (flip ? -1 : 1) * (walls.seatX - walls.anchorX) * walls.w * scale,
    y: y + (walls.seatY - walls.anchorY) * walls.h * scale,
    height: (roof.logicalHeight || roof.h) * scale,
    anchor: [roof.seatX, roof.seatY],
  };
}

/**
 * A round- or hewn-log pen from the modular pieces, at its stage: sills, low walls, full walls, then its roof on them.
 * Every stage is drawn at the full walls' pixel scale, `height` being the height the full walls stand, so the pen does
 * not grow or shrink as it goes up: drawn each to `height`, the sill frame (198 pixels) came out 28% bigger than the walls
 * (253) that replaced it. The roof is clapboard whatever the logs are, so both pens take the sheet's two roofs, which are
 * named for the row they were drawn in: `house-round-roof-partial` once the roof stage is done and the pen is still to be
 * chinked, `house-hewn-roof-finished` when it is. Returns the width drawn, or 0 when the modular art cannot be drawn and
 * seated - no sheet, no frames, no seats - so the caller draws the pen's whole picture instead (`penPicture`). `flip`
 * says the `drawSprite` given mirrors every picture about its foot, so the roof's seat is mirrored with the walls.
 */
function drawLogPen(ctx, p, x, y, height, drawSprite, spriteFrame, flip = false) {
  if (p.type === 'pen-jacal' || !spriteFrame) return 0;
  const material = p.type === 'pen-hewn' ? 'hewn' : 'round';
  const course = Math.max(0, p.stage - 1);
  const base = course === 0 ? `house-${material}-sill` : course <= 4 ? `house-${material}-low-walls` : `house-${material}-full-walls`;
  const walls = spriteFrame(`house-${material}-full-walls`), frame = spriteFrame(base);
  const roofName = p.stage >= p.kind.stageCount ? 'house-hewn-roof-finished' : 'house-round-roof-partial';
  const seat = p.stage >= 12 ? roofSeat(walls, spriteFrame(roofName), x, y, height, flip) : null;
  if (!walls || !frame || (p.stage >= 12 && !seat)) return 0;
  const drawn = drawSprite(ctx, base, x, y, height * (frame.logicalHeight || frame.h) / (walls.logicalHeight || walls.h));
  if (!drawn) return 0;
  if (seat) drawSprite(ctx, roofName, seat.x, seat.y, seat.height, { anchor: seat.anchor });
  return drawn;
}

/** How wide one eight-foot cell of the plot is drawn, for a house drawn `size` high: the one rule both draws below use. */
export const plotCell = size => size * CELL_SHARE;

/**
 * The house plot drawn on the family's own land, piece by piece at its stage, round the house's point. Returns how many
 * pieces were drawn. `spriteFrame(name)` gives a frame's measurements (public/art.js); without it a pen is drawn as its
 * whole picture, since the modular pieces cannot be seated on one another. Delivered modular art covers round/hewn pens,
 * passage, porch, finished shed room, and single chimneys. stand-in: jacal stages, the shed frame, double chimney and
 * independent interior floor/loft layers still use earlier pictures or shapes. Requested in docs/ART_REQUESTS.md
 * 2026-09-15 (the house plot's pieces).
 *
 * `rotation` turns the house on the ground and never its pictures (2026-09-23: a house turned 90 degrees lay on its side,
 * and one at 180 stood on its roof, chimney and all). Everything on the map - tree, person, ox, house - is drawn upright
 * in the one fixed three-quarter view, so a turn moves each piece to its turned cells (`turned`) and draws it upright
 * there, back to front by its turned front edge: a dog-run at 90 degrees runs into the screen, its far chimney and pen
 * behind the passage, its near pen and chimney in front. The sheet draws a pen corner-on, the gable and door on the face
 * to the left and the ridge running back to the right. A quarter turn brings the gable round to the other face and lays
 * the ridge along the other diagonal, which is the picture mirrored; a half turn leaves the silhouette as it was. So at
 * 90 and 270 degrees every piece is mirrored about its own foot, and at 0 and 180 it is not.
 * stand-in: docs/ART_REQUESTS.md, request 2026-09-23 - the house from its other sides. At 0 and 270 degrees the gable
 * that faces the viewer is the door's; at 90 and 180 it is the pen's back gable, which should have no door, and the porch,
 * shed room and passage are their one picture (mirrored at a quarter turn) whichever way they run.
 *
 * `drawn`, when given, collects the screen box of every picture drawn, `{ left, top, right, bottom }`: where a tap on
 * the house lands (public/app.js `houseAt`).
 */
export function drawHousePlot(ctx, x, y, size, land, catalogue, drawSprite, spriteFrame, { rotation = 0, drawn } = {}) {
  for (const [index, house] of (land.completedHouses || []).entries()) {
    drawHousePlot(ctx, x - (index + 1) * size * 2.2, y, size, { house }, catalogue, drawSprite, spriteFrame, { rotation, drawn });
  }
  const pieces = (land.house?.pieces || []).map(([type, px, py, stage, progress]) => ({ type, x: px, y: py, stage, progress, kind: catalogue.pieces.find(each => each.id === type) }))
    .filter(p => p.kind && (p.stage > 0 || p.progress > 0));
  const cell = plotCell(size), flip = Math.round(rotation / 90) % 2 !== 0;
  // Every picture upright - mirrored at a quarter turn - and where it was drawn noted.
  const sprite = (c, name, sx, sy, height, options) => {
    const width = drawSprite(c, name, sx, sy, height, flip ? { ...options, flip } : options);
    const frame = width && drawn && spriteFrame?.(name);
    if (frame) {
      const scale = height / (frame.logicalHeight || frame.h), w = frame.w * scale, h = frame.h * scale;
      const ax = options?.anchor?.[0] ?? frame.anchorX, ay = options?.anchor?.[1] ?? frame.anchorY;
      const left = flip ? sx - w * (1 - ax) : sx - w * ax, top = sy - h * ay;
      drawn.push({ left, top, right: left + w, bottom: top + h });
    }
    return width;
  };
  // Each piece's foot - the middle of its front edge on the ground - in its turned cells, round the plot's middle one cell
  // above (x, y). Unturned, this is where the pieces have always stood.
  const placed = pieces.filter(each => each.kind.place !== 'in').map(p => {
    const [cx, cy] = turned(p.x + p.kind.w / 2 - catalogue.columns / 2, p.y + p.kind.h / 2 - catalogue.rows / 2, rotation);
    const [w, h] = flip ? [p.kind.h, p.kind.w] : [p.kind.w, p.kind.h];
    return { p, w, h, front: cy + h / 2, footX: x + cx * cell, footY: y - cell + (cy + h / 2) * cell };
  });
  // Back to front by the turned front edge, so a piece nearer the viewer is drawn over one further off.
  for (const { p, w, h, footX, footY } of placed.sort((a, b) => a.front - b.front)) {
    if (p.kind.pen) {
      if (!drawLogPen(ctx, p, footX, footY, cell * 2.2, sprite, spriteFrame, flip)) sprite(ctx, penPicture(p), footX, footY, cell * 2.2);
      continue;
    }
    if (p.type === 'shed') {
      const name = p.stage >= p.kind.stageCount ? 'house-shed-room' : 'lean-to';
      if (!sprite(ctx, name, footX, footY, cell * 1.1) && name !== 'lean-to') sprite(ctx, 'lean-to', footX, footY, cell * 1.1);
      continue;
    }
    if (p.type === 'porch') { if (!sprite(ctx, 'house-porch', footX, footY, cell * 0.9)) sprite(ctx, 'shed-open', footX, footY, cell * 0.9); continue; }
    ctx.save();
    if (p.type === 'passage') {
      const floor = sprite(ctx, 'house-passage-floor', footX, footY, cell * .72);
      if (!floor) {
        ctx.fillStyle = '#7b6a52';
        ctx.fillRect(footX - w * cell / 2, footY - (h - .4) * cell, w * cell, cell * .35);
      }
      if (p.stage >= p.kind.stageCount) sprite(ctx, 'house-passage-roof', footX, footY, cell * 1.35);
    } else if (p.type === 'chimney' || p.type === 'chimney-stone') {
      const complete = p.stage >= p.kind.stageCount;
      const name = p.type === 'chimney-stone' ? 'house-chimney-stone' : complete ? 'house-chimney-stick' : 'house-chimney-stick-building';
      if (!sprite(ctx, name, footX, footY, cell * 1.55)) {
        ctx.fillStyle = p.type === 'chimney-stone' ? '#9b968a' : '#9a6b43';
        const wide = cell * .45, tall = cell * (p.kind.h + .9) * Math.min(1, (p.stage + .3) / p.kind.stageCount);
        ctx.fillRect(footX - wide / 2, footY - tall, wide, tall);
      }
    } else {
      // stand-in: the double chimney still needs a two-sided sprite matching its two-cell footprint.
      ctx.fillStyle = p.type === 'chimney-stone' ? '#9b968a' : '#9a6b43';
      const wide = cell * 0.45, tall = cell * (p.kind.h + 0.9) * Math.min(1, (p.stage + 0.3) / p.kind.stageCount);
      ctx.fillRect(footX - wide / 2, footY - tall, wide, tall);
      drawn?.push({ left: footX - wide / 2, top: footY - tall, right: footX + wide / 2, bottom: footY });
    }
    ctx.restore();
  }
  return pieces.length;
}
