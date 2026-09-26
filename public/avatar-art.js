// Family appearance in the established illustrated cast. The chooser, portrait card,
// world and battle all draw the same registered atlas frames and animation clips.
import { drawClip, drawSprite } from './art.js';

export function avatarVariant(appearance, sex = 'male') {
  const head = appearance?.head;
  if (sex === 'female') return head === 'bonnet' || head === 'headscarf' ? 'rust-woman'
    : head === 'pinned hair' ? 'teal' : 'indigo';
  return head === 'bareheaded' || head === 'moustache' ? 'ochre'
    : head === 'beard' ? 'elder' : 'rust';
}

/** Draw a real animation clip, with its ink and texture retained under the palette. */
export function drawAvatar(ctx, x, y, height, appearance, sex = 'male', {
  phase = 0, walking = false, flip = false, working = false, clip = null,
} = {}) {
  if (!appearance || height < 5) return 0;
  const variant = avatarVariant(appearance, sex);
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

export function drawAvatarPortrait(canvas, appearance, sex) {
  const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  backdrop(ctx, width, height);
  if (!appearance) return false;
  const sprite = `${avatarVariant(appearance, sex)}-idle-s`;
  // Ground contact sits below the card, cropping the authored figure to the face.
  return Boolean(drawSprite(ctx, sprite, width * .5, height * 2.13, height * 2.2, { appearance }));
}

export function drawAvatarFigure(canvas, appearance, sex) {
  const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  backdrop(ctx, width, height);
  ctx.fillStyle = '#8e865e'; ctx.fillRect(0, height * .89, width, height * .11);
  ctx.fillStyle = '#7a6c4b55';
  ctx.beginPath(); ctx.ellipse(width / 2, height * .91, width * .28, height * .023, 0, 0, Math.PI * 2); ctx.fill();
  return Boolean(drawSprite(ctx, `${avatarVariant(appearance, sex)}-idle-s`, width / 2, height * .91,
    Math.min(height * .76, width * 1.65), { appearance }));
}
