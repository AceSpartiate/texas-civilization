// Where a fight is framed (docs/BATTLES.md §2.7, §15.3, §17.2): the ground the class view's film, a student's Watch and the Host's
// own frame of a fight are fitted to. Moved here out of public/app.js on 2026-10-27 so it can be held under node
// (tests/battle-frame.test.mjs); it reads only the battle the server sent, never anything of the page.

/** Miles from any of the fighting within which a body standing silent is still framed with it (`fightingPoints`). */
export const FIGHT_REACH = 0.32;
/** Miles from a gun that fires within which the men standing with it are framed with it. */
const GUN_SIDE = 0.12;
/** Minutes since a gun's last shot within which it is still part of the fighting. */
const GUN_RECENT = 15;

/**
 * The ground a fight is framed on: each side and the gun with room round them for their ranks and their smoke, and more
 * above than below, because the top of the page carries the banner and the caption and the figures stand up from their feet.
 */
export const fieldFrame = points => points.frame ? points : points.flatMap(point => [{ x: point.x - 0.13, y: point.y - 0.24 }, { x: point.x + 0.13, y: point.y + 0.1 }]);

// A group more than a mile from the sides' middle is not framed (San Jacinto's Deaf Smith riding for Vince's bridge).
const nearTheSides = (sides, body) => !sides.length || Math.hypot(body.x - sides.reduce((s, one) => s + one.x, 0) / sides.length, body.y - sides.reduce((s, one) => s + one.y, 0) / sides.length) < 1;

/**
 * Where the engagement names the ground it is fought over (Béxar: the houses north of the plaza and the Alamo's guns at the
 * east edge), that ground; otherwise every body of men drawn - each side and each group drawn apart from it (Palm Sunday's
 * three roads, the Mexicans round Coleto's square, Concepción's companies) - and the guns. A body gone from the field is not
 * framed, unless nothing else is left to frame (the Mexicans gone toward Béxar at Concepción). Nor is a group more than a mile
 * from the sides: the camera stays on the fight. A frame the engagement marks tight (`frameTight`, the Alamo's compound, whose
 * frames already hold the room round it) is taken as it is.
 *
 * **Where the fighting is** (2026-10-27, §17.2): while some of it is firing or on the move (a gun that fired in the last quarter
 * hour), the frame is that, what each body fighting is fighting, whatever stands within a third of a mile of the men fighting, the
 * men at a firing gun, and the body a family's own man stands in. A body standing silent further off is left out: at Coleto's dawn
 * the cavalry ringing the square a third of a mile out and more, idle while the Mexican guns fired from the timber, framed the field
 * with every man ten pixels tall on the projector. In a lull, everybody, as before.
 * ceiling: the frame is of bodies' middles; a body spread a third of a mile wide is framed from its middle, as before.
 */
export function fightingPoints(fight) {
  if (fight?.frame?.length) {
    const points = fight.frame.map(point => ({ x: point.x, y: point.y }));
    return fight.frameTight ? Object.assign(points, { frame: true }) : points;
  }
  const sides = fight?.sides || [];
  const bodies = [...sides, ...(fight?.groups || []).filter(group => nearTheSides(sides, group))], here = bodies.filter(body => body.action !== 'gone');
  const guns = [...(fight?.cannon ? [fight.cannon] : []), ...(fight?.guns || [])];
  const recent = gun => (gun.shots || []).some(minute => !Number.isFinite(fight?.minute) || fight.minute - minute <= GUN_RECENT);
  const bodiesActive = here.filter(body => (body.fire && body.fire !== 'none') || body.moving), active = [...bodiesActive, ...guns.filter(recent)];
  if (active.length) {
    // Within reach of the men fighting - or, where only guns are firing, of the guns - and the men standing at a gun that fires.
    // A gun does not reach as far as the men do: Coleto's corner guns stand a tenth of a mile out from the square's middle, and
    // reckoned from them the silent ring came back into the frame.
    const reach = (one, other, miles) => Math.hypot(one.x - other.x, one.y - other.y) < miles;
    const anchors = bodiesActive.length ? bodiesActive : active;
    // And always the body a family's own man stands in, however quiet (the Grass Fight: the Texian main body holding a mile and
    // more from the fight over the pack train, with a family's man in it): Watch is for seeing him (§2.7).
    const units = new Set(Object.values(fight?.memberUnits || {}));
    const loose = (fight?.members || []).some(id => !fight.memberUnits?.[id]);
    const own = one => one.id ? units.has(one.id) : (units.has(one.side) || (loose && one.side === 'texian'));
    // And what each body fighting is fighting: the nearest of the other side's, however far (San Jacinto: the line walking half a
    // mile and more across the prairie on the camp at rest, which stood beyond the reach and was left out of the frame).
    const targets = new Set(bodiesActive.map(body => here.filter(other => other.side && other.side !== body.side)
      .reduce((best, other) => (!best || Math.hypot(other.x - body.x, other.y - body.y) < Math.hypot(best.x - body.x, best.y - body.y) ? other : best), null)).filter(Boolean));
    const near = one => active.includes(one) || own(one) || targets.has(one) || anchors.some(other => reach(one, other, FIGHT_REACH)) || active.some(other => reach(one, other, GUN_SIDE));
    const kept = [...here.filter(near), ...guns.filter(near)];
    if (kept.length) return kept.map(point => ({ x: point.x, y: point.y }));
  }
  return [...(here.length ? here : bodies.length ? bodies : fight?.formations || []), ...guns].map(point => ({ x: point.x, y: point.y }));
}
