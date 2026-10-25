// Mexican troops after a fleeing family on the Scrape, drawn where the server says they are (sim/pursuit.mjs
// `chaseProjection`; docs/SCRAPE.md §13). The owner, 2026-09-27: "the chase with shots and smoke".
//
// Everything here is presentation of what the server sent: each soldier's distance behind the family along the way the
// soldiers came (`dir`), what was called and when, and each shot - its minute, the man who fired it and whether it hit. Nothing
// is decided here and nothing reaches the simulation. What it adds is only what a picture needs between two ticks: the soldiers
// walking or riding smoothly from last tick's distance to this one's, each shot's flash and smoke at the real moment of the
// tick it was fired in, a little dust kicked up where a ball fell short, and the orders over the lead man's head in Spanish
// with the English under them (public/speech.js). No blood and no one drawn falling (VISION.md §16): a hit is told in words
// on the family's card.
//
// A dragoon firing from the saddle is Astra's `dragoon-fire` (2026-10-03; north and south her `dragoon-mounted-fire-*`, 2026-10-12),
// wired 2026-10-25 on the shot's own moment (`FIRE_LEAD_MS`); her frames carry no flash or smoke, so those are still drawn here.
// stand-in: docs/ART_REQUESTS.md, request 2026-09-27 "Mexican troops after a family on the road" - a dragoon at the gallop is the
// library's `dragoon-march`, and an infantryman stopped to load is the line's `regular-fire-reload`, until a dragoon at the
// gallop and a skirmisher running and kneeling to fire are drawn.
import { drawSpeech } from './speech.js';
import { mountedHeading, mountedActionClip } from './southern-battle-art.js';

const YARDS = 1760;
const SMOKE_CAP = 40, SMOKE_LIFE_MS = 16000, DUST_LIFE_MS = 1200, FLASH_MS = 160, LINE_MS = 12000;
/** Her carbine clip (1000 ms): shouldered for 360 ms before the shot, the recoil on it, lowered and settled in the 640 after -
 * the clock public/battle-view.js fires it on. A shot is dated inside its tick (`accept`), so the shoulder can come first. */
export const FIRE_LEAD_MS = 360, FIRE_AFTER_MS = 640;
/** Where her shouldered carbine's muzzle is (`dragoon-fire-2`), from his ground point in his drawn heights: ahead and up.
 * ceiling: read by eye off her frame on a tenth-of-a-height grid; end-on it is put ahead along the way he faces, as side-on. */
export const CARBINE_MUZZLE = Object.freeze({ ahead: 0.4, up: 0.78 });
/** A figure stands for a man but is drawn larger than one (sim/house-footprint.mjs `PERSON_MILES`): a soldier among the family is drawn this far behind it. */
const DRAWN_CLOSEST_YARDS = 30;
const clamp01 = value => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Which of her carbine clips soldier `i` of a cavalry chase is in at `now`, and how far into it: from `FIRE_LEAD_MS` before one of
 * his shots to `FIRE_AFTER_MS` after it; null otherwise (and for a shot seen only after its tick had passed, dated long ago).
 */
export function fireClip(view, i, now) {
  const shot = [...view.shots.values()].find(one => one.man === i && now >= one.at - FIRE_LEAD_MS && now - one.at < FIRE_AFTER_MS);
  if (!shot) return null;
  const heading = mountedHeading({ x: -view.dir.x, y: -view.dir.y });
  return { clip: mountedActionClip('dragoon', heading), timeMs: now - shot.at + FIRE_LEAD_MS, upright: heading === 'n' || heading === 's' };
}

/** The renderer. `art` is what app.js draws with: `animated(ctx, clip, x, y, size, seed, options)` and `miniPerson`. */
export function createChaseView(art) {
  const views = new Map();
  const evidence = { drawn: [], shotsSeen: 0, flashes: 0, dust: 0, lines: [], fireClips: new Set() };

  /** A new tick of one chase: where each soldier was drawn, so he goes on from there; the shots and words dated into it. */
  function accept(chase, now, tickMs) {
    let view = views.get(chase.id);
    if (!view) { view = { id: chase.id, minute: null, soldiers: [], family: null, at: now, span: tickMs, shots: new Map(), smoke: [], dust: [], lines: new Map() }; views.set(chase.id, view); }
    if (view.minute === chase.minute) return view;
    const t = view.minute === null ? 1 : clamp01((now - view.at) / view.span);
    const drawnFamily = view.family ? { x: lerp(view.family.from.x, view.family.to.x, t), y: lerp(view.family.from.y, view.family.to.y, t) } : { x: chase.x, y: chase.y };
    const previous = view.minute;
    view.family = { from: drawnFamily, to: { x: chase.x, y: chase.y } };
    view.soldiers = chase.soldiers.map((soldier, i) => {
      const was = view.soldiers[i];
      const from = was ? lerp(was.from, was.to, t) : soldier.g;
      return { from, to: soldier.g, loading: soldier.loading };
    });
    view.span = Math.max(200, tickMs || 1000); view.at = now;
    // Shots and words dated inside the tick that just ended, at the real moment of the tick they fell in.
    const span = previous === null ? 0 : Math.max(1e-6, chase.minute - previous);
    const when = minute => (previous === null ? now - 60000 : now + clamp01((minute - previous) / span) * view.span * 0.9);
    for (const shot of chase.shots || []) if (!view.shots.has(shot.n)) view.shots.set(shot.n, { ...shot, at: when(shot.minute), fired: false });
    for (const line of chase.lines || []) if (!view.lines.has(line.id)) view.lines.set(line.id, { ...line, at: previous === null && line !== chase.lines.at(-1) ? -Infinity : when(line.minute) });
    view.minute = chase.minute;
    view.dir = chase.dir; view.kind = chase.kind; view.phase = chase.phase;
    return view;
  }

  /** Where soldier `i` stands on the ground now: behind the family along the way they came, a few yards apart abreast. */
  function soldierAt(view, i, now) {
    const t = clamp01((now - view.at) / view.span);
    const family = { x: lerp(view.family.from.x, view.family.to.x, t), y: lerp(view.family.from.y, view.family.to.y, t) };
    const soldier = view.soldiers[i];
    // Never drawn on top of the family: a man at the family is drawn a step behind it, the men abreast wider than the file.
    const g = Math.max(DRAWN_CLOSEST_YARDS, lerp(soldier.from, soldier.to, t)) / YARDS;
    const n = view.soldiers.length, across = (i - (n - 1) / 2) * (view.kind === 'cavalry' ? 0.012 : 0.008);
    return { x: family.x + view.dir.x * g - view.dir.y * across, y: family.y + view.dir.y * g + view.dir.x * across, family };
  }

  /**
   * Draws every chase this page is sent, over the map and under nothing: the soldiers, the smoke and flashes of their shots,
   * a puff of dust where a ball struck the ground, and the latest order over the lead man. Returns what it drew, for proofs.
   */
  function draw(ctx, chases, { camera, now, time, tickMs, bounds = null, reducedMotion = false, paused = false }) {
    evidence.drawn = [];
    // What the page's sound hears this frame (public/audio.js): each shot where its muzzle was drawn, each order when it is
    // first shown.
    const heard = [], spoken = [];
    const live = new Set();
    for (const chase of chases || []) {
      if (!Number.isFinite(chase.x) || !chase.dir) continue;
      live.add(chase.id);
      const view = accept(chase, now, tickMs);
      const still = reducedMotion || paused;
      const figurePx = Math.max(7, Math.min(60, camera.figure * 0.95));
      const toward = view.dir.x <= 0; // the soldiers face the family, which lies the other way along `dir`
      const drawnSoldiers = [];
      view.soldiers.forEach((soldier, i) => {
        const ground = soldierAt(view, i, now), p = camera.toScreen(ground);
        if (bounds && (p.x < -80 || p.y < -80 || p.x > bounds.width + 80 || p.y > bounds.height + 120)) return;
        const moving = !still && Math.abs(soldier.to - soldier.from) > 0.5;
        const size = view.kind === 'cavalry' ? figurePx * 1.35 : figurePx;
        const clip = view.kind === 'cavalry' ? (moving ? 'dragoon-march' : toward ? 'dragoon-idle-e' : 'dragoon-idle-w')
          : soldier.loading ? 'regular-fire-reload' : moving ? 'regular-march' : toward ? 'regular-idle-e' : 'regular-idle-w';
        // A dragoon's shot: Astra's carbine fired from the saddle (`fireClip`), moving or not, facing the family; east mirrored
        // for west, north and south her own. Her horse stands planted for it, which a dragoon fires once in a chase.
        let ok = 0;
        const firing = view.kind === 'cavalry' && fireClip(view, i, now);
        if (firing && (!art.clipReady || art.clipReady(firing.clip))) {
          ok = art.animated(ctx, firing.clip, p.x, p.y, size, `${chase.id}:${i}:fire`, { timeMs: firing.timeMs, flip: firing.upright ? false : !toward });
          if (ok) evidence.fireClips.add(firing.clip);
        }
        // Claude's skirmisher (running, kneeling to fire; request 2026-09-27 item 3) the same way; the line's regular while it loads.
        const foot = view.kind === 'cavalry' ? null : soldier.loading ? 'skirmisher-kneel-fire' : moving ? 'skirmisher-run-e' : null;
        const options = { timeMs: still ? 0 : time + i * 173, flip: moving || soldier.loading ? !toward : false };
        if (!ok && foot && (!art.clipReady || art.clipReady(foot))) ok = art.animated(ctx, foot, p.x, p.y, size, `${chase.id}:${i}`, options);
        if (!ok) ok = art.animated(ctx, clip, p.x, p.y, size, `${chase.id}:${i}`, options);
        if (!ok) art.miniPerson(ctx, p.x, p.y, size, { side: 'mexican' });
        drawnSoldiers.push({ i, x: Math.round(p.x), y: Math.round(p.y), size: Math.round(size) });
      });
      // Each shot at its moment: a flash at the muzzle and a puff of smoke that drifts and thins; a miss kicks up dust near the
      // family. Drawn once each (`fired`), and nothing new is fired while the page is held still.
      for (const shot of view.shots.values()) {
        if (shot.fired || now < shot.at || still) continue;
        shot.fired = true; evidence.shotsSeen++;
        const from = soldierAt(view, Math.min(shot.man, view.soldiers.length - 1), now);
        // A dragoon's at the muzzle of her carbine, shouldered (`CARBINE_MUZZLE`, in his drawn heights); a foot soldier's at his hands.
        const drawn = figurePx * 1.35 / camera.scale, ahead = view.kind === 'cavalry' ? CARBINE_MUZZLE.ahead * drawn : 0.01;
        const muzzle = { x: from.x - view.dir.x * ahead, y: from.y - view.dir.y * ahead - (view.kind === 'cavalry' ? CARBINE_MUZZLE.up * drawn : 0.008) };
        shot.flash = { ...muzzle, until: now + FLASH_MS };
        const at = camera.toScreen(muzzle); heard.push({ x: Math.round(at.x), y: Math.round(at.y), size: 1 });
        view.smoke.push({ x: muzzle.x, y: muzzle.y, born: now, seed: (shot.n * 7919) % 97 / 97 });
        if (view.smoke.length > SMOKE_CAP) view.smoke.splice(0, view.smoke.length - SMOKE_CAP);
        if (!shot.hit) { const k = (shot.n * 131) % 17 / 17 - 0.5; view.dust.push({ x: from.family.x + view.dir.x * 0.012 + k * 0.02, y: from.family.y + view.dir.y * 0.012 + 0.004, born: now + 250 }); evidence.dust++; }
      }
      // The smoke: grey puffs growing and fading where each shot was fired, drifting up the page.
      for (const puff of view.smoke) {
        const age = now - puff.born;
        if (age > SMOKE_LIFE_MS) continue;
        const f = age / SMOKE_LIFE_MS, p = camera.toScreen({ x: puff.x + f * 0.004, y: puff.y - f * 0.012 });
        const r = figurePx * (0.35 + f * 1.3);
        ctx.save(); ctx.globalAlpha = 0.7 * (1 - f);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, 'rgba(236,233,226,.95)'); g.addColorStop(1, 'rgba(210,206,198,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      view.smoke = view.smoke.filter(puff => now - puff.born <= SMOKE_LIFE_MS);
      for (const shot of view.shots.values()) {
        if (!shot.flash || now > shot.flash.until) continue;
        const p = camera.toScreen(shot.flash);
        ctx.save(); ctx.fillStyle = 'rgba(255,214,120,.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(2.5, figurePx * 0.16), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        evidence.flashes++;
      }
      for (const kick of view.dust) {
        const age = now - kick.born;
        if (age < 0 || age > DUST_LIFE_MS) continue;
        const f = age / DUST_LIFE_MS, p = camera.toScreen(kick);
        ctx.save(); ctx.globalAlpha = 0.6 * (1 - f); ctx.fillStyle = '#b39a72';
        ctx.beginPath(); ctx.ellipse(p.x, p.y - f * figurePx * 0.3, figurePx * (0.12 + f * 0.25), figurePx * (0.06 + f * 0.12), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      view.dust = view.dust.filter(kick => now - kick.born <= DUST_LIFE_MS);
      // The latest order, over the lead man, for a while after it is called.
      const said = [...view.lines.values()].filter(line => now >= line.at && now - line.at < LINE_MS).at(-1);
      if (said && drawnSoldiers.length && figurePx >= 9) {
        const lead = drawnSoldiers.reduce((best, one) => (view.soldiers[one.i].to < view.soldiers[best.i].to ? one : best), drawnSoldiers[0]);
        drawSpeech(ctx, { ...said, speaker: { side: 'mexican' } }, lead.x, lead.y - lead.size * 1.05, { bounds, alpha: clamp01((LINE_MS - (now - said.at)) / 1500) });
        if (!evidence.lines.includes(said.id)) { evidence.lines.push(said.id); spoken.push({ id: said.id, x: lead.x, y: lead.y }); }
      }
      evidence.drawn.push({ id: chase.id, kind: view.kind, phase: view.phase, soldiers: drawnSoldiers.length, smoke: view.smoke.length, shotsSent: (chase.shots || []).length });
    }
    for (const id of views.keys()) if (!live.has(id)) views.delete(id);
    return { drawn: evidence.drawn, shotsSeen: evidence.shotsSeen, flashes: evidence.flashes, dust: evidence.dust, lines: [...evidence.lines], fireClips: [...evidence.fireClips], heard, spoken };
  }
  return { draw };
}
