// The house plot on the family's page: docs/WOODS_AND_BUILDING.md §6.2, build step 5.
//
// A grid of eight-foot cells, the period plans to start from, and the pieces to place. What each piece needs and does,
// what the whole plan would give and still wants, and how far each piece has got all come from the server (the catalogue
// once, the family's land line on the tick); the page only lays them out and sends what the student chooses. The server
// decides where a piece may go.
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
export function renderHousePlot(world, catalogue, { open, send, rerender }) {
  const panel = document.querySelector('#house-plot');
  if (!panel) return;
  panel.hidden = !open;
  if (!open) { shown = ''; return; }
  const land = world.land || {}, house = land.house;
  const shape = JSON.stringify([house, land.choices, land.planned, land.home, land.logs, selected]);
  if (shape === shown) return;
  shown = shape;
  const pieces = (house?.pieces || []).map(([type, x, y, stage, progress], index) => ({ type, x, y, stage, progress, index, kind: catalogue.pieces.find(each => each.id === type) }));

  // What the plan does and wants, and what the family has to build it with.
  const summary = panel.querySelector('#plot-summary');
  const lines = [];
  if (land.planned?.room) lines.push(`Planned: holds ${land.planned.room}; rest mends ${partsIn100(land.planned.restShare)} in 100; ${land.planned.spoilagePerDay ? `${Math.round(land.planned.spoilagePerDay * 1000) / 10} in 100 of the food spoil a day` : 'the food keeps'}.`);
  if (land.planned) lines.push(`Still wants ${logWords(land.planned.logs)} logs and about ${land.planned.hours} hours of one person's work${land.planned.tools?.length ? `, with ${land.planned.tools.join(' and ')}` : ''}.`);
  lines.push(land.logs ? `The log pile: ${land.logs.wall} wall, ${land.logs.sill} sill, ${land.logs.poor} poor${land.logs.lying ? `; ${land.logs.lying} more lying where they were felled` : ''}.` : 'No logs at the house yet: fell trees and haul them in.');
  if (house?.stage && house.stage !== 'finished') lines.push(nextLine(house, land.logs));
  if (house?.why) lines.push(house.why);
  if (land.home) lines.push(`Living in it now: rest mends ${partsIn100(land.home.restShare)} in 100${land.home.crowded ? ', crowded' : ''}.`);
  summary.replaceChildren(...lines.map(line => el('p', line, 'house-line')));

  // The period plans, while nothing is begun.
  const plans = panel.querySelector('#plot-plans');
  plans.replaceChildren(...(land.choices || []).map(choice => {
    const plan = catalogue.plans.find(each => each.id === choice.id);
    const button = el('button', plan?.name || choice.id);
    button.type = 'button'; button.dataset.plan = choice.id; button.disabled = !choice.can || pending;
    button.setAttribute('aria-pressed', String(house?.plan === choice.id));
    if (!choice.can) button.title = choice.why;
    return button;
  }));
  plans.hidden = !land.choices;

  // The grid, and the pieces on it.
  const grid = panel.querySelector('#plot-grid');
  grid.style.setProperty('--columns', catalogue.columns);
  grid.style.setProperty('--rows', catalogue.rows);
  const cells = [];
  for (let y = 0; y < catalogue.rows; y++) for (let x = 0; x < catalogue.columns; x++) {
    const cell = el('button', '', 'plot-cell');
    cell.type = 'button'; cell.dataset.x = x; cell.dataset.y = y;
    cell.style.gridColumn = `${x + 1}`; cell.style.gridRow = `${y + 1}`;
    cell.setAttribute('aria-label', selected ? `Place the ${catalogue.pieces.find(each => each.id === selected)?.name.toLowerCase()} here` : `Cell ${x + 1}, ${y + 1}`);
    cell.disabled = !selected || pending;
    cells.push(cell);
  }
  const placed = pieces.filter(p => p.kind.place !== 'in').map(p => {
    const inside = pieces.filter(each => each.kind.place === 'in' && each.x === p.x && each.y === p.y);
    const node = el('div', '', `plot-piece plot-${p.kind.pen ? 'pen' : p.type}`);
    node.style.gridColumn = `${p.x + 1} / span ${p.kind.w}`; node.style.gridRow = `${p.y + 1} / span ${p.kind.h}`;
    node.dataset.index = p.index;
    node.dataset.x = p.x; node.dataset.y = p.y;
    if (selected && catalogue.pieces.find(each => each.id === selected)?.place === 'in' && p.kind.pen) {
      const add = el('button', `Add ${catalogue.pieces.find(each => each.id === selected).name.toLowerCase()} here`, 'plot-remove');
      add.type = 'button'; add.dataset.x = p.x; add.dataset.y = p.y; add.disabled = pending;
      node.append(add);
    }
    node.append(el('span', p.kind.name, 'plot-piece-name'));
    const stages = p.kind.stageCount;
    node.append(el('span', p.stage >= stages ? 'built' : p.stage === 0 && p.progress === 0 ? 'planned' : `stage ${p.stage + 1} of ${stages}`, 'plot-piece-stage'));
    for (const extra of inside) node.append(el('span', `+ ${extra.kind.name.toLowerCase()}${extra.stage >= catalogue.pieces.find(each => each.id === extra.type).stageCount ? ' (built)' : ''}`, 'plot-piece-stage'));
    const removable = [p, ...inside].filter(each => each.stage === 0 && each.progress === 0);
    for (const each of removable.reverse()) {
      const remove = el('button', `Take away ${each.kind.name.toLowerCase()}`, 'plot-remove');
      remove.type = 'button'; remove.dataset.remove = each.index; remove.disabled = pending;
      node.append(remove);
    }
    return node;
  });
  grid.replaceChildren(...cells, ...placed);

  // The pieces to place, each with what it needs and does.
  const palette = panel.querySelector('#plot-palette');
  palette.replaceChildren(...catalogue.pieces.map(kind => {
    const li = el('li', '');
    const button = el('button', kind.name);
    button.type = 'button'; button.dataset.piece = kind.id;
    button.setAttribute('aria-pressed', String(selected === kind.id));
    button.disabled = pending;
    li.append(button, el('p', kind.describe, 'house-line'), el('p', kind.does, 'house-line house-good'), el('p', `Wants ${logWords(kind.logs)} logs, about ${kind.hours} hours${kind.needs.length ? `, and ${kind.needs.join(' and ')}` : ''}.`, 'house-line'));
    return li;
  }));
  panel.querySelector('#plot-hint').textContent = selected ? `Tap the cell for the top-left corner of the ${catalogue.pieces.find(each => each.id === selected).name.toLowerCase()}.` : 'Start from a plan, or choose a piece and place it on the plot.';
  if (house?.phase) panel.querySelector('#plot-hint').textContent += ` The house: ${PHASES[house.phase] || house.phase}.`;
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
      if (target.dataset.plan) { selected = null; return act({ action: 'plan-house', layout: target.dataset.plan }); }
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

function drawLogPen(ctx, p, x, y, height, drawSprite) {
  if (p.type === 'pen-jacal') return 0;
  const material = p.type === 'pen-hewn' ? 'hewn' : 'round';
  const course = Math.max(0, p.stage - 1);
  const base = course === 0 ? `house-${material}-sill` : course <= 4 ? `house-${material}-low-walls` : `house-${material}-full-walls`;
  const drawn = drawSprite(ctx, base, x, y, height);
  if (!drawn) return 0;
  if (p.stage >= 12) drawSprite(ctx, p.stage >= p.kind.stageCount ? 'house-hewn-roof-finished' : 'house-round-roof-partial', x, y, height);
  return drawn;
}

/**
 * The house plot drawn on the family's own land, piece by piece at its stage, round the house's point. Returns how many
 * pieces were drawn. Delivered modular art covers round/hewn pens, passage, porch, finished shed room, and single
 * chimneys. stand-in: jacal stages, the shed frame, double chimney and independent interior floor/loft layers still use
 * earlier pictures or shapes. Requested in docs/ART_REQUESTS.md 2026-09-15 (the house plot's pieces).
 */
export function drawHousePlot(ctx, x, y, size, land, catalogue, drawSprite) {
  const pieces = (land.house?.pieces || []).map(([type, px, py, stage, progress]) => ({ type, x: px, y: py, stage, progress, kind: catalogue.pieces.find(each => each.id === type) }))
    .filter(p => p.kind && (p.stage > 0 || p.progress > 0));
  const cell = size * 0.45;
  const left = x - (catalogue.columns / 2) * cell, top = y - (catalogue.rows / 2 + 1) * cell;
  // Back to front, so a porch stands in front of its pen and a shed room behind it.
  for (const p of pieces.filter(each => each.kind.place !== 'in').sort((a, b) => (a.y + a.kind.h) - (b.y + b.kind.h))) {
    const footX = left + (p.x + p.kind.w / 2) * cell, footY = top + (p.y + p.kind.h) * cell;
    if (p.kind.pen) {
      if (!drawLogPen(ctx, p, footX, footY, cell * 2.2, drawSprite)) drawSprite(ctx, penPicture(p), footX, footY, cell * 2.2);
      continue;
    }
    if (p.type === 'shed') {
      const sprite = p.stage >= p.kind.stageCount ? 'house-shed-room' : 'lean-to';
      if (!drawSprite(ctx, sprite, footX, footY, cell * 1.1) && sprite !== 'lean-to') drawSprite(ctx, 'lean-to', footX, footY, cell * 1.1);
      continue;
    }
    if (p.type === 'porch') { if (!drawSprite(ctx, 'house-porch', footX, footY, cell * 0.9)) drawSprite(ctx, 'shed-open', footX, footY, cell * 0.9); continue; }
    ctx.save();
    if (p.type === 'passage') {
      const floor = drawSprite(ctx, 'house-passage-floor', footX, footY, cell * .72);
      if (!floor) {
        ctx.fillStyle = '#7b6a52';
        ctx.fillRect(left + p.x * cell, top + (p.y + .4) * cell, cell, cell * .35);
      }
      if (p.stage >= p.kind.stageCount) drawSprite(ctx, 'house-passage-roof', footX, footY, cell * 1.35);
    } else if (p.type === 'chimney' || p.type === 'chimney-stone') {
      const complete = p.stage >= p.kind.stageCount;
      const sprite = p.type === 'chimney-stone' ? 'house-chimney-stone' : complete ? 'house-chimney-stick' : 'house-chimney-stick-building';
      if (!drawSprite(ctx, sprite, footX, footY, cell * 1.55)) {
        ctx.fillStyle = p.type === 'chimney-stone' ? '#9b968a' : '#9a6b43';
        const wide = cell * .45, tall = cell * (p.kind.h + .9) * Math.min(1, (p.stage + .3) / p.kind.stageCount);
        ctx.fillRect(footX - wide / 2, footY - tall, wide, tall);
      }
    } else {
      // stand-in: the double chimney still needs a two-sided sprite matching its two-cell footprint.
      ctx.fillStyle = p.type === 'chimney-stone' ? '#9b968a' : '#9a6b43';
      const wide = cell * 0.45, tall = cell * (p.kind.h + 0.9) * Math.min(1, (p.stage + 0.3) / p.kind.stageCount);
      ctx.fillRect(footX - wide / 2, footY - tall, wide, tall);
    }
    ctx.restore();
  }
  return pieces.length;
}
