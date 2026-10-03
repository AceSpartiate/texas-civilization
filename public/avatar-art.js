// Family appearance in the established illustrated cast. The chooser, portrait card,
// world and battle all draw the same registered atlas frames and animation clips.
import { drawClip } from './art.js';
import { avatarVariant, avatarBand } from './avatar-identity.js';
export { avatarVariant, avatarBinding, avatarBand } from './avatar-identity.js';

/** Draw a real animation clip, with its ink and texture retained under the palette. */
export function drawAvatar(ctx, x, y, height, appearance, sex = 'male', {
  phase = 0, walking = false, flip = false, working = false, clip = null, person = {},
} = {}) {
  if (!appearance || height < 5) return 0;
  const variant = avatarVariant(appearance, sex, person);
  const animation = clip || `${variant}-${walking ? 'walk' : working ? 'work' : 'idle-s'}`;
  return drawClip(ctx, animation, x, y, height, {
    timeMs: phase * 165, flip, appearance, paused: !walking && !working,
  });
}

function backdrop(ctx, width, height) {
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, '#e5d7b7'); wash.addColorStop(.54, '#d9c7a1'); wash.addColorStop(1, '#ad916b');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#7d6547'; ctx.lineWidth = Math.max(1, width / 100);
  ctx.strokeRect(2, 2, width - 4, height - 4);
}

export function drawAvatarPortrait(canvas, appearance, sex, person = {}) {
  const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  backdrop(ctx, width, height);
  if (!appearance) return false;
  const sprite = `${avatarVariant(appearance, sex, person)}-idle-s`;
  const band = avatarBand(person);
  const share = { infant: 1.05, small: 1.9, child: 2.2, youth: 2.35, adult: 2.2 }[band] || 2.2;
  const feet = band === 'infant' ? height * .96 : height * (.05 + share * .95);
  return Boolean(drawClip(ctx, sprite, width * .5, feet, height * share, { appearance, paused: true, timeMs: 0 }));
}

export function drawAvatarFigure(canvas, appearance, sex, person = {}, { walking = false, direction = 's', time = 0 } = {}) {
  const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  backdrop(ctx, width, height);
  ctx.fillStyle = '#8e865e'; ctx.fillRect(0, height * .89, width, height * .11);
  ctx.fillStyle = '#7a6c4b55';
  ctx.beginPath(); ctx.ellipse(width / 2, height * .91, width * .28, height * .023, 0, 0, Math.PI * 2); ctx.fill();
  const variant = avatarVariant(appearance, sex, person);
  const pose = walking ? direction === 's' || direction === 'n' ? `walk-${direction}` : 'walk' : `idle-${direction === 'w' ? 'e' : direction}`;
  return Boolean(drawClip(ctx, `${variant}-${pose}`, width / 2, height * .91,
    Math.min(height * .79, width * 1.65), { appearance, timeMs: time, flip: direction === 'w', paused: !walking }));
}
