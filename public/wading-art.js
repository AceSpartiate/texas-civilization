/** Authored wading is presentation only: never changes movement, visibility or battle outcomes. */
export function marshWadingClip(battle, side, ground) {
  if (battle?.id !== 'san-jacinto' || !['rout', 'killing'].includes(battle.phase) ||
      !side.moving || side.mounted || side.fire !== 'none' || !['texian', 'mexican'].includes(side.side)) return null;
  const wet = (battle.works || []).some(work => {
    if (!['marsh', 'water'].includes(work.kind) || !(work.width > 0)) return false;
    const across = work.across || {x: 1, y: 0}, dx = ground.x - work.x, dy = ground.y - work.y;
    const along = dx * across.x + dy * across.y, depth = dx * across.y - dy * across.x;
    return (along / (work.width * .5)) ** 2 + (depth / (work.width * .275)) ** 2 <= 1;
  });
  return wet ? `${side.side === 'mexican' ? 'regular' : 'volunteer'}-wade` : null;
}
