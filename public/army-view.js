// The armies on the map (owner, 2026-09-17: "there was no army. they were just off in the middle of no where. no mexican
// army, no texas army. nothing." — and, by the owner's choice, the Mexican columns drawn marching in the spring too).
//
// What is drawn is what the server sends (`armies` in the projection, sim/armies.mjs): where each army stands, its name, how
// many men the simulation holds in it and how many are this family's. Close up it is a camp - tents, a fire and a body of men
// - and far off a marker with its name, so a family can see where the armies are without the map filling with figures.
//
// stand-in: docs/ART_REQUESTS.md, "Claude-drawn stand-ins (replace with Astra's)" - the camp: the tents and the fire are drawn
// here in canvas; the men are the militia and regular figures the battles already use (public/art.js), or `miniPerson`.

/** A camp is drawn from this many pixels a mile up; below it the army is a marker. */
export const CAMP_SCALE = 120;
/** At most this many men are drawn in a camp: a body of men, not a roll of them (the same rule the battles' formations keep). */
export const CAMP_MEN = 18;

const TEXIAN = { cloth: '#d8cdb4', pole: '#6b563a', flag: '#c9b47a', ink: '#3b3221' };
const MEXICAN = { cloth: '#cfc6b2', pole: '#5c4a33', flag: '#9d3f34', ink: '#3b3221' };

/** How many men are drawn for an army of this size: every one up to `CAMP_MEN`, and never more. */
export const menDrawn = strength => Math.max(1, Math.min(CAMP_MEN, Math.round(strength || 0) || 1));

/** One tent, its opening towards the fire. */
function tent(ctx, x, y, size, colours) {
  ctx.fillStyle = colours.cloth;
  ctx.strokeStyle = colours.ink;
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.55, y);
  ctx.lineTo(x, y - size * 0.8);
  ctx.lineTo(x + size * 0.55, y);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(58,44,28,0.75)';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.16, y);
  ctx.lineTo(x, y - size * 0.46);
  ctx.lineTo(x + size * 0.16, y);
  ctx.closePath();
  ctx.fill();
}

/** A fire, with its smoke leaning the way the wind of the day leans it. */
function fire(ctx, x, y, size, time) {
  ctx.strokeStyle = '#6b563a';
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.35, y); ctx.lineTo(x + size * 0.35, y - size * 0.12);
  ctx.moveTo(x - size * 0.3, y - size * 0.12); ctx.lineTo(x + size * 0.32, y);
  ctx.stroke();
  const flicker = 0.8 + 0.2 * Math.sin(time / 180);
  ctx.fillStyle = '#e07b2c';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.2, y - size * 0.05);
  ctx.quadraticCurveTo(x, y - size * (0.75 * flicker), x + size * 0.2, y - size * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(226,222,210,0.35)';
  for (let i = 0; i < 3; i++) {
    const t = ((time / 900) + i / 3) % 1;
    ctx.beginPath();
    ctx.arc(x + t * size * 0.5, y - size * (0.8 + t * 1.6), size * (0.12 + t * 0.22), 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw one army. `at` is its place on the screen, `scale` the pixels a mile, `figure` how tall a person is drawn, and `draw`
 * the page's own person drawing: `draw(clip, x, y, size, key, options)` returns false when the art has not arrived, so the
 * camp falls back to the plain figures the map already uses for anybody.
 */
export function drawArmy(ctx, army, at, { scale, figure, time = 0, draw = null, mini = null }) {
  const colours = army.side === 'mexican' ? MEXICAN : TEXIAN;
  if (scale < CAMP_SCALE) { drawArmyMark(ctx, army, at, colours, Math.max(11, Math.min(20, figure))); return 'mark'; }
  const size = Math.max(10, Math.min(46, figure * 1.1));
  // The tents behind, the fire in the middle, the men in front of it: a camp read at a glance.
  const tents = army.side === 'mexican' ? 2 : 3;
  for (let i = 0; i < tents; i++) tent(ctx, at.x + (i - (tents - 1) / 2) * size * 1.5, at.y - size * 0.55, size, colours);
  fire(ctx, at.x, at.y, size * 0.7, time);
  const men = menDrawn(army.strength ?? CAMP_MEN);
  const role = army.side === 'mexican' ? 'regular' : 'volunteer';
  for (let index = 0; index < men; index++) {
    const column = index % 6, row = Math.floor(index / 6);
    const x = at.x + (column - 2.5) * size * 0.95, y = at.y + size * (0.5 + row * 0.55);
    const flip = army.side === 'mexican';
    const drawn = draw && draw(`${role}-idle-${flip ? 'w' : 'e'}`, x, y, size, `${army.id}:${index}`, { flip });
    if (!drawn && mini) mini(ctx, x, y, size, { side: army.side, flip });
  }
  drawArmyLabel(ctx, army, { x: at.x, y: at.y - size * 1.5 }, colours);
  return 'camp';
}

/** A flag on a pole, for an army too far off to draw as a camp. */
export function drawArmyMark(ctx, army, at, colours, size) {
  ctx.strokeStyle = colours.pole;
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.beginPath(); ctx.moveTo(at.x, at.y); ctx.lineTo(at.x, at.y - size * 1.6); ctx.stroke();
  ctx.fillStyle = colours.flag;
  ctx.beginPath();
  ctx.moveTo(at.x, at.y - size * 1.6);
  ctx.lineTo(at.x + size * 1.05, at.y - size * 1.3);
  ctx.lineTo(at.x, at.y - size);
  ctx.closePath();
  ctx.fill();
  drawArmyLabel(ctx, army, { x: at.x, y: at.y - size * 1.9 }, colours);
}

/** The army's name, and what the family has in it, over the camp or the flag. */
export function drawArmyLabel(ctx, army, at, colours) {
  const words = army.ours > 0 ? `${army.name} · ${army.ours} of yours` : army.name;
  ctx.save();
  ctx.font = '12px Georgia';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f2e6c9';
  ctx.strokeText(words, at.x, at.y);
  ctx.fillStyle = colours.ink;
  ctx.fillText(words, at.x, at.y);
  ctx.restore();
}
