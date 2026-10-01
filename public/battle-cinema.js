// The class view watching a battle like a film (owner, 2026-09-30, after watching the Battle of Gonzales in a real class: "when
// battles happ3n, we should have the classview cinematically zoom in and watch the battle. players should see their family
// members fighting and wonder if they'll survive." docs/BATTLES.md §15.3, docs/HOST_PAGE.md §2.15, `FIC-GONZ-1052`).
//
// Presentation only. It decides where the Host's camera looks while the server says a fight is being fought (`host.focus ===
// 'battle'`), and nothing else: what is drawn there is what the server sent the Host (sim/battle-stage.mjs `projectBattle`), a
// family's man is shown hit only from the minute the server sends his fate, and nothing here reaches the simulation.
//
//   off -> opening (fade to black) -> establish (the field from far off, a title, pushing in) -> follow (the field, then one of
//   the class's own people in it, then the field, then the next...) -> closing (held on the field while the smoke clears, then a
//   fade to black) -> the camera put back where it was, fading up -> off.
//
// The teacher takes the camera back at any moment (`release`: Esc, the button, a drag, a zoom, any of the map's buttons), and
// it stays theirs for the rest of that fight unless `resume` gives it back to the film. A student's page never starts this by itself:
// its Watch card (public/military-attention.js) may start the same follow, without fades or a title, framed on the family's own.
// The end of the game, or a fight the teacher has taken the camera from, never has the camera put back.
//
// Pure: given what the page knows and the time, it says where to look. tests/battle-cinema.test.mjs runs it with no page.

/** Real milliseconds, the game's: fades the owner likes, a push-in long enough to read the title, shots long enough to look. */
export const CINEMA = Object.freeze({
  fadeOutMs: 700, fadeInMs: 900,
  establishMs: 7500, titleMs: 6500,
  fieldMs: 9000, closeMs: 8000,
  // How long the camera stays on the field after the fighting, the smoke clearing, before the fade; and how long the server may
  // stop saying "battle" before that counts as the fighting being over (a tick between two of its phases).
  holdMs: 6000, graceMs: 2500,
  // While the fight is still going on - the lull before the parley, a night of the siege, the hours between Béxar's episodes -
  // the film waits on the field this long for the camera to be called back before it ends; a night of the Alamo's siege at Study
  // is shorter, so a class watching the siege watches it through.
  lullMs: 30000,
  // How quickly the camera glides to a new shot (a time constant: two thirds of the way in this long).
  glideMs: 1300,
  // How far out the establishing shot begins, and how close a shot of one person is, against the field's own frame.
  wideOut: 2.8, closeIn: 2.3,
});

const easeInOut = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
/** A view between two views: the centre straight, the scale by its logarithm, so a zoom feels even all the way in. */
const between = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), t)) });

/**
 * `mode`: 'host' (starts by itself when the server says a fight is being fought, with fades, a title, and the camera put back
 * after) or 'student' (started only by the Watch card, cut straight in, nothing put back).
 */
export function createCinema({ mode = 'host' } = {}) {
  const c = {
    state: 'off', since: 0, battleId: null, returnView: null, restore: null, cam: null, lastNow: null,
    shots: [], shot: 0, shotSince: 0, followed: null, cutFrom: null, offSince: null, released: false, reduced: false, field: null,
    endedForGame: false, log: [],
  };
  const go = (state, now) => { c.state = state; c.since = now; c.log.push({ state, at: Math.round(now) }); if (c.log.length > 60) c.log.shift(); };
  /** The shots of one pass: the field, then each of the class's own people in turn with the field between. */
  function shotList(members) {
    const living = members.filter(one => !one.fallen);
    const list = ['field'];
    for (const one of living) list.push(one.id, 'field');
    return list;
  }
  function begin(input, now) {
    c.battleId = input.battleId; c.released = false; c.endedForGame = false;
    c.cam = input.current ? { ...input.current } : { ...input.field };
    if (mode === 'host' && c.returnView === null) c.returnView = { view: input.home ?? null };
    if (input.reduced || mode === 'student') { c.shots = shotList(input.members || []); c.shot = 0; c.shotSince = now; go(mode === 'student' ? 'follow' : 'establish', now); if (mode === 'student') c.cam = { ...input.field }; return; }
    go('opening', now);
  }
  /** Where the current shot wants the camera. */
  function target(input) {
    const field = input.field;
    const id = c.shots[c.shot];
    if (!id || id === 'field' || c.state === 'closing') { c.followed = null; return field; }
    const one = (input.members || []).find(member => member.id === id);
    if (!one || one.fallen || !Number.isFinite(one.x)) { c.followed = null; return field; }
    c.followed = id;
    const scale = field.scale * CINEMA.closeIn;
    return { cx: one.x, cy: one.y + (input.liftPx || 0) / scale, scale };
  }
  function nextShot(input, now) {
    c.shot++;
    if (c.shot >= c.shots.length) { c.shots = shotList(input.members || []); c.shot = 0; }
    c.shotSince = now;
  }
  return {
    get state() { return c.state; },
    get followed() { return c.state === 'follow' ? c.followed : null; },
    get battleId() { return c.battleId; },
    /** The view that frames the whole fight now (what a shot of one man is close against). */
    get field() { return c.field; },
    get log() { return c.log; },
    /** Whether the film holds the camera now (the page draws `view` rather than its own). */
    get driving() { return ['opening', 'establish', 'follow', 'closing', 'recut'].includes(c.state); },
    /** Whether the fight is on and the teacher has the camera (the button offers it back). */
    get released() { return c.state === 'released'; },
    /**
     * Once a frame. `input`: `focus` (the server says a fight is being fought, or Watch is on for a student), `battleId`, `field`
     * (the view that frames the fight now), `members` ([{ id, x, y, fallen }] in ground miles: the class's own in the fight, as
     * drawn), `liftPx` (screen pixels a close shot is framed above the middle, as `field` already is), `live` (the fight is still
     * going on, whether or not the camera is called to it now), `running` (the class is not paused), `ended` (the game's end has begun), `reduced` (less motion), `current` (where
     * the camera is), `home` (what to put back after: the teacher's own view, or null for the whole class).
     */
    update(input, now) {
      const dt = c.lastNow === null ? 0 : Math.max(0, Math.min(250, now - c.lastNow));
      c.lastNow = now; c.reduced = Boolean(input.reduced);
      if (input.field) c.field = input.field;
      // The end of the game takes the screen: the film stops at once, and nothing is put back (the end sequence has the camera).
      if (input.ended) { if (c.state !== 'off') { c.endedForGame = true; c.returnView = null; c.restore = null; go('off', now); } return; }
      // A paused class holds the shot where it is.
      if (!input.running) c.shotSince += dt;
      if (input.focus) c.offSince = null; else if (c.state !== 'off' && c.offSince === null) c.offSince = now;
      const over = c.offSince !== null && now - c.offSince >= (input.live ? CINEMA.lullMs : CINEMA.graceMs);
      switch (c.state) {
        case 'off':
          if (input.focus && input.field && mode === 'host') begin(input, now);
          break;
        case 'released':
          if (over || !input.field) { c.returnView = null; go('off', now); }
          break;
        case 'opening':
          if (now - c.since >= CINEMA.fadeOutMs) { c.cam = between(input.field, input.field, 0); go('establish', now); c.shots = shotList(input.members || []); c.shot = 0; }
          break;
        case 'recut':
          if (now - c.since >= CINEMA.fadeOutMs) { c.battleId = input.battleId; go('establish', now); c.shots = shotList(input.members || []); c.shot = 0; }
          break;
        case 'establish':
          // Another fight sent in its place while the title is up: this establishing shot is already the new one's.
          if (input.battleId && input.battleId !== c.battleId) c.battleId = input.battleId;
          if (now - c.since >= (c.reduced ? 0 : CINEMA.establishMs)) { go('follow', now); c.shotSince = now; c.cam = { ...input.field }; }
          break;
        case 'follow': {
          if (input.battleId && input.battleId !== c.battleId && mode === 'host') { if (c.reduced) { c.battleId = input.battleId; go('establish', now); } else go('recut', now); break; }
          if (mode === 'student' && (!input.field || !input.focus)) { go('off', now); break; }
          // The fight no longer sent at all (over, and gone from the Host's map): the same ending, on the field as last framed.
          if (!input.field) { go('closing', now); break; }
          if (over) { go('closing', now); break; }
          // Never kept on somebody who has fallen (docs/BATTLES.md §2b.1: the camera stays on the wall, not on him).
          const id = c.shots[c.shot];
          const one = id && id !== 'field' ? (input.members || []).find(member => member.id === id) : null;
          if (id && id !== 'field' && (!one || one.fallen)) { nextShot(input, now); break; }
          // While the server has stopped saying "battle" the camera waits on the field for the smoke to clear.
          if (c.offSince !== null && id !== 'field') { nextShot(input, now); break; }
          if (now - c.shotSince >= (id === 'field' ? CINEMA.fieldMs : CINEMA.closeMs) && c.offSince === null) nextShot(input, now);
          break;
        }
        case 'closing':
          if (input.focus) { go('follow', now); c.shotSince = now; break; }
          if (now - c.since >= CINEMA.holdMs + (c.reduced ? 0 : CINEMA.fadeOutMs)) { c.restore = c.returnView; c.returnView = null; go('reveal', now); }
          break;
        case 'reveal':
          if (now - c.since >= (c.reduced ? 0 : CINEMA.fadeInMs)) go('off', now);
          break;
        default: break;
      }
      // The glide toward the shot: two thirds of the way in `glideMs`, cut at once for less motion.
      if (c.cam && input.field && ['follow', 'closing'].includes(c.state)) {
        const want = target(input), k = c.reduced ? 1 : 1 - Math.exp(-dt / CINEMA.glideMs);
        c.cam = between(c.cam, want, k);
      }
    },
    /** The view the film puts the camera on now, or null when the page's own camera is the one drawn. */
    view(now) {
      if (!c.field) return null;
      if (c.state === 'opening' || c.state === 'recut') return c.cam || c.field;
      if (c.state === 'establish') {
        if (c.reduced) return c.field;
        const wide = { ...c.field, scale: c.field.scale / CINEMA.wideOut };
        return between(wide, c.field, easeInOut((now - c.since) / CINEMA.establishMs));
      }
      if (c.state === 'follow' || c.state === 'closing') return c.cam || c.field;
      return null;
    },
    /** How black the screen is drawn over the map now, 0 to 1: the fades the owner likes between the class and the fight. */
    fade(now) {
      if (c.reduced) return 0;
      const t = now - c.since;
      if (c.state === 'opening' || c.state === 'recut') return Math.min(1, t / CINEMA.fadeOutMs);
      if (c.state === 'establish') return Math.max(0, 1 - t / CINEMA.fadeInMs);
      if (c.state === 'closing') return Math.max(0, Math.min(1, (t - CINEMA.holdMs) / CINEMA.fadeOutMs));
      if (c.state === 'reveal') return Math.max(0, 1 - t / CINEMA.fadeInMs);
      return 0;
    },
    /** The title over the establishing shot: how strongly it is drawn, 0 to 1, or 0 when there is none. */
    title(now) {
      if (c.state !== 'establish' || mode !== 'host') return 0;
      const t = now - c.since;
      if (c.reduced) return 1;
      return t < 500 ? Math.max(0, t / 500) : t > CINEMA.titleMs ? Math.max(0, 1 - (t - CINEMA.titleMs) / 600) : 1;
    },
    /** How far the letterbox bars are drawn in, 0 to 1, while the film has the camera. */
    bars(now) {
      if (mode !== 'host') return 0;
      if (['opening', 'recut'].includes(c.state)) return 1;
      if (['establish', 'follow'].includes(c.state)) return 1;
      if (c.state === 'closing') return 1;
      if (c.state === 'reveal') return c.reduced ? 0 : Math.max(0, 1 - (now - c.since) / CINEMA.fadeInMs);
      return 0;
    },
    /** The view to put back, once, after the fight: `{ view }` (null for the whole class) - or null when nothing is put back. */
    takeRestore() { const r = c.restore; c.restore = null; return r; },
    /**
     * The teacher takes the camera: it stays where the film left it. If the teacher still has it when the fight is over, nothing
     * is put back; given back to the film (`resume`), the film puts back the view from before the fight, as if never taken.
     */
    release(now) {
      if (!['opening', 'establish', 'follow', 'closing', 'recut'].includes(c.state)) return null;
      const at = this.view(now);
      c.restore = null; if (mode !== 'host') c.returnView = null;
      go(mode === 'host' ? 'released' : 'off', now);
      return at;
    },
    /** Give the camera back to the film, straight into following the fight (no title again). */
    resume(input, now) {
      if (c.state !== 'released' && !(mode === 'student' && c.state === 'off')) return false;
      c.battleId = input.battleId; c.cam = input.current ? { ...input.current } : { ...input.field }; c.field = input.field;
      c.shots = shotList(input.members || []); c.shot = 0; c.shotSince = now; c.offSince = null;
      go('follow', now);
      return true;
    },
  };
}

/**
 * The colour a family is marked with on the class view and the class panel: one of twelve, by the family's number (hh-1 the
 * first), so the same family is the same colour on every page and every day. Chosen to be told apart on a projector.
 */
export const FAMILY_COLOURS = Object.freeze(['#d64545', '#2f6fd6', '#e2a400', '#2e9e4f', '#8e44c9', '#e3701b', '#119aa5', '#c2367e', '#7a5531', '#4f6db0', '#7fae1a', '#a46ad4']);
export function familyColour(householdId) {
  const n = Number(String(householdId || '').replace(/^\D+/, ''));
  return FAMILY_COLOURS[(Number.isFinite(n) && n > 0 ? n - 1 : 0) % FAMILY_COLOURS.length];
}
