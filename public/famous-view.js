// The famous people on the campaign map between their battles (sim/famous.mjs; docs/BATTLES.md §2c: "names on the map, no
// cards"). Each is drawn as themselves where the library has their sheet, as the nearest figure where it has not, with their
// name under them; nothing is tapped. What is drawn, where and when, is the server's: this only picks the pose.
//
// stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the famous people" - the same stand-ins as the battlefield
// (public/battle-view.js `drawPerson`): a volunteer or a regular where a person has no sheet, and the library's iron field gun
// twice for the Twin Sisters. stand-in: docs/ART_REQUESTS.md, request 2026-09-26 "the Esparza family" - Ana Esparza and her
// children at Béxar after the fall are the library's woman, girl, boy and small child (`PERSON_ART` in public/battle-view.js).
// Found 2026-09-26: public/app.js hands this `animated` and `drawSprite` wrappers that take the clip first, while this calls them
// with the canvas first, so on the map every famous person is `miniPerson` today; correcting it costs the first frames' decode
// of the famous sheets (HANDOFF.md, the Esparza section), which is left for the owner.
import { PERSON_ART } from '/battle-view.js';

/** Draws every famous person the page was sent; returns what was drawn, for the proofs (`window.__famousDrawn`). */
export function drawFamous(ctx, list, camera, { animated, drawSprite, miniPerson, time, bounds }) {
  const drawn = [], boxes = [];
  const size = Math.max(12, Math.min(40, camera.figure || 16));
  const font = Math.round(Math.max(11, Math.min(14, size * 0.36)));
  for (const one of list || []) {
    const p = camera.toScreen(one);
    if (bounds && (p.x < -60 || p.y < -60 || p.x > bounds.width + 60 || p.y > bounds.height + 60)) continue;
    const own = PERSON_ART[one.art] || null, kind = one.side === 'mexican' ? 'regular' : 'volunteer';
    const flip = !one.right;
    let how = null;
    if (one.thing) {
      // The Twin Sisters: two guns side by side.
      for (const dx of [-0.45, 0.45]) if (drawSprite(ctx, 'cannon-iron-e', p.x + dx * size, p.y, size * 1.2)) how = 'cannon-iron-e';
    } else if (one.moving && own?.walk) how = animated(ctx, own.walk, p.x, p.y, one.child ? size * 0.6 : size, `famous:${one.id}`, { timeMs: time, flip }) ? own.walk : null;
    else if (one.doing === 'ride' && !own?.ride) how = animated(ctx, kind === 'regular' ? 'dragoon-march' : 'mounted-courier-e', p.x, p.y, size * 1.3, `famous:${one.id}`, { timeMs: time, flip }) ? 'ride' : null;
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
