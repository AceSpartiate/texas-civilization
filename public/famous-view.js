// The famous people on the campaign map between their battles (sim/famous.mjs; docs/BATTLES.md §2c: "names on the map, no
// cards"). Each is drawn as themselves where the library has their sheet, as the nearest figure where it has not, with their
// name under them; nothing is tapped. What is drawn, where and when, is the server's: this only picks the pose.
//
// stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the famous people" - the same stand-ins as the battlefield
// (public/battle-view.js `drawPerson`): a volunteer or a regular where a person has no sheet, and the library's iron field gun
// twice for the Twin Sisters when their paired road sheet is unavailable. stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the Esparza family" - Ana Esparza and her
// children at Béxar after the fall are the library's woman, girl, boy and small child (`PERSON_ART` in public/battle-view.js).
// `animated` and `drawSprite` are the page's own, called with the canvas first (public/app.js passes them as it passes them to
// the battle view). Until 2026-09-27 app.js handed this wrappers that took the clip first, so on the map every famous person
// was `miniPerson` (owner, 2026-09-27: "Fix it and re-measure"; tests/famous-map-art.test.mjs fails on the swapped order).
// Imported relatively so a test can load this file; in the page it is the same module as app.js's '/battle-view.js'.
import { personArt } from './battle-view.js';

/**
 * The sprites and clips a famous person may be drawn with on the map, in the order `drawFamous` tries them: the page asks for
 * their sheets when the person is sent (public/app.js), so the sheet is on its way before the first frame that draws them.
 */
export function famousArt(one) {
  const own = personArt(one?.art), kind = one?.side === 'mexican' ? 'regular' : 'volunteer';
  const sprites = new Set(), clips = new Set();
  const add = name => { if (typeof name !== 'string') return; if (name.startsWith('clip:')) clips.add(name.slice(5)); else sprites.add(name); };
  // The Twin Sisters' own paired road sheet (Astra, 2026-09-27), with the library's iron gun as its fallback.
  if (one?.thing) { clips.add('twin-sisters-limbered'); sprites.add('twin-sisters-halt'); sprites.add('cannon-iron-e'); }
  else if (one?.doing === 'ride') { add(own?.rideIdle); add(own?.ride); clips.add(kind === 'regular' ? 'dragoon-march' : 'mounted-courier-e'); }
  else {
    // A walk is drawn as a clip (`animated`), whatever its name looks like.
    if (own?.walk) clips.add(own.walk);
    add(own?.[one?.doing]); add(own?.stand);
    clips.add(`${kind}-march`); clips.add(`${kind}-idle-e`); clips.add(`${kind}-idle-w`);
  }
  return { sprites: [...sprites], clips: [...clips] };
}

/** Draws every famous person the page was sent; returns what was drawn, for the proofs (`window.__famousDrawn`). */
export function drawFamous(ctx, list, camera, { animated, drawSprite, miniPerson, time, bounds }) {
  const drawn = [], boxes = [];
  const size = Math.max(12, Math.min(40, camera.figure || 16));
  const font = Math.round(Math.max(11, Math.min(14, size * 0.36)));
  for (const one of list || []) {
    const p = camera.toScreen(one);
    if (bounds && (p.x < -60 || p.y < -60 || p.x > bounds.width + 60 || p.y > bounds.height + 60)) continue;
    const own = personArt(one.art), kind = one.side === 'mexican' ? 'regular' : 'volunteer';
    const flip = !one.right;
    let how = null;
    if (one.thing) {
      // Both Twin Sisters travel together as one named map entity.
      if (one.moving) how = animated(ctx, 'twin-sisters-limbered', p.x, p.y, size * 2, `famous:${one.id}`, { timeMs: time, flip }) ? 'twin-sisters-limbered' : null;
      else how = drawSprite(ctx, 'twin-sisters-halt', p.x, p.y, size * 2, { flip }) ? 'twin-sisters-halt' : null;
      if (!how) for (const dx of [-0.45, 0.45]) if (drawSprite(ctx, 'cannon-iron-e', p.x + dx * size, p.y, size * 1.2)) how = 'cannon-iron-e';
    } else if (one.doing === 'ride') {
      const riding = own?.ride?.startsWith('clip:') ? own.ride.slice(5) : null;
      if (!one.moving && own?.rideIdle) how = drawSprite(ctx, own.rideIdle, p.x, p.y, size * 1.3, { flip }) ? own.rideIdle : null;
      if (!how && riding) how = animated(ctx, riding, p.x, p.y, size * 1.3, `famous:${one.id}`, { timeMs: time, flip }) ? riding : null;
      if (!how) how = animated(ctx, kind === 'regular' ? 'dragoon-march' : 'mounted-courier-e', p.x, p.y, size * 1.3, `famous:${one.id}`, { timeMs: time, flip }) ? 'ride' : null;
    } else if (one.moving && own?.walk) how = animated(ctx, own.walk, p.x, p.y, one.child ? size * 0.6 : size, `famous:${one.id}`, { timeMs: time, flip }) ? own.walk : null;
    else {
      const named = own?.[one.doing] || own?.stand;
      // A child is drawn at a child's size, sheet or clip (the Esparza children, stand-ins; Angelina).
      if (typeof named === 'string' && named.startsWith('clip:')) how = animated(ctx, named.slice(5), p.x, p.y, one.child ? size * 0.6 : size, `famous:${one.id}`, { timeMs: time, flip }) ? named : null;
      else if (typeof named === 'string') how = drawSprite(ctx, named, p.x, p.y, one.child ? size * 0.6 : size, { flip }) ? named : null;
      if (!how) how = animated(ctx, one.moving ? `${kind}-march` : `${kind}-idle-${one.right ? 'e' : 'w'}`, p.x, p.y, size, `famous:${one.id}`, { timeMs: time, flip: one.moving && flip }) ? `${kind}-stand-in` : null;
    }
    if (!how) { miniPerson(ctx, p.x, p.y, size, { side: one.side }); how = 'mini'; }
    // The name under them, stepped out of the way of another name already drawn.
    ctx.save();
    ctx.font = `${font}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(one.name).width + 6;
    let top = p.y + 3;
    for (let i = 0; i < 10 && boxes.some(b => p.x - w / 2 < b.x + b.w && b.x < p.x + w / 2 && top < b.y + b.h && b.y < top + font + 3); i++) top += font + 3;
    boxes.push({ x: p.x - w / 2, y: top, w, h: font + 3 });
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(252,249,238,.92)'; ctx.strokeText(one.name, p.x, top + font);
    ctx.fillStyle = '#26382e'; ctx.fillText(one.name, p.x, top + font);
    ctx.restore();
    drawn.push({ id: one.id, name: one.name, x: Math.round(p.x), y: Math.round(p.y), how });
  }
  return drawn;
}
