// The family's real herd on its land (owner, 2026-10-03: "when players bring cattle and hogs, why don't we see their real herds?";
// docs/STOCK.md §10). Until this the page drew one longhorn and one hog beside any house whose family had chosen stock in the lobby,
// whatever the herd had become. Now the herd the server counts (`world.household.herd`, sim/stock.mjs) is what is drawn: a figure a
// head while the herd is small, the young dropped lately smaller beside the rest, and for a big herd a few head with one group
// standing for the rest and saying how many on the hover. Cattle graze out on the land, hogs root nearer the timber, both come in
// near the house at night, and when somebody of the family is out after the stock (`look-to-stock`) the herd draws in about them.
//
// Presentation only, as the wildlife is: the counts are the server's and nothing here decides one. Where each beast stands is
// hashed from the family and the beast's number and moved slowly with the clock, so a herd stands still between frames and the same
// on every reload. Pure and DOM-free: tests/herds.test.mjs asks it directly.
//
// stand-in: docs/ART_REQUESTS.md, request 2026-10-03 - the herd (a calf, a sucking pig, a herd's group sheet, the herder on horseback
// working cattle). Until they come a calf is the range longhorn and a pig the rooting hog, drawn at `YOUNG_SIZE` of them, and a
// group is one longhorn or hog with its count on the hover.

/** The most figures one herd is drawn as, near; and fewer as the camera pulls back (`drawnMost`). Kept low for Chromebooks. */
export const HERD_DRAWN_MOST = 24;
/** Pixels to the mile under which a herd is drawn as a group a kind, and between that and `NEAR_SCALE` as a few head. */
export const FAR_SCALE = 600, NEAR_SCALE = 1500;
/** How big each is drawn, against a person's figure: the longhorn as the milk cow is drawn, the hog about half, the young smaller. */
export const HERD_SIZE = Object.freeze({ cattle: 1.15, hogs: 0.62 });
export const YOUNG_SIZE = 0.6;
/** How far out from the house each kind grazes by day, in miles, and how loosely it stands. */
const OUT = Object.freeze({ cattle: 0.32, hogs: 0.2 });
const LOOSE = Object.freeze({ cattle: 0.07, hogs: 0.045 });
/** Near the house at night: in by dark, out at sunrise. */
const NIGHT_OUT = 0.05;
const COATS = Object.freeze(['red', 'pied', 'dun']);

/** A number in [0, 1) the same every time for this family, this beast and this question: FNV-1a, as sim/shares.mjs. */
function hashed(...parts) {
  let hash = 0x811c9dc5;
  for (const char of parts.join(':')) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 0x01000193) >>> 0; }
  return hash / 0x100000000;
}
/** How many figures a herd may be drawn as at this zoom. */
export const drawnMost = scale => (scale >= NEAR_SCALE ? HERD_DRAWN_MOST : scale >= FAR_SCALE ? 8 : 2);
/** Whether this hour of the day is night, for the herd (in by eight in the evening, out at six). */
export const herdNight = hour => hour < 6 || hour >= 20;

/**
 * The figures a herd is drawn as: `{ kind, young, count, x, y, size, clip, flip, moving }`, in world miles, sorted by nothing (the page
 * sorts them with everything standing). Every head is counted exactly once: the counts of the figures add up to the herd.
 *
 * `herd` is `{ cattle, hogs, young? }`; `home` the house; `bounds` the family's land (a figure is kept inside it); `hour` the hour of
 * the day; `seed` the family; `time` seconds, for the slow wander; `scale` pixels to the mile; `herder` where somebody out after the
 * stock is drawn; `timber(x, y)` whether timber stands there, when the page knows, for the hogs.
 */
export function herdFigures({ herd, home, bounds = null, hour = 12, seed = '', time = 0, scale = NEAR_SCALE, herder = null, timber = null }) {
  if (!herd || !home) return [];
  const total = { cattle: Math.max(0, herd.cattle | 0), hogs: Math.max(0, herd.hogs | 0) };
  if (!total.cattle && !total.hogs) return [];
  const most = drawnMost(scale);
  // The figures shared between the kinds by their counts, each kind at least one if it has any.
  const kinds = ['cattle', 'hogs'].filter(kind => total[kind] > 0);
  const room = {};
  if (kinds.length === 1) room[kinds[0]] = most;
  else {
    const cattle = Math.max(1, Math.min(most - 1, Math.round(most * total.cattle / (total.cattle + total.hogs))));
    room.cattle = cattle; room.hogs = most - cattle;
  }
  const night = herdNight(hour);
  const figures = [];
  for (const kind of kinds) {
    const young = Math.min(total[kind], Math.max(0, herd.young?.[kind] | 0));
    const grown = total[kind] - young;
    // A figure a head while there is room; else a few head and one group for the rest, the young given up to a third of the room.
    let youngFigures = 0, grownFigures = 0, groups = [];
    if (total[kind] <= room[kind]) { youngFigures = young; grownFigures = grown; }
    else {
      const slots = room[kind];
      // One slot: the whole kind is one group. Else the young up to a third, a grown figure or more, and one group for the rest.
      youngFigures = slots >= 3 && young ? Math.min(young, Math.floor(slots / 3)) : 0;
      grownFigures = slots >= 2 ? Math.min(grown, slots - youngFigures - 1) : 0;
      // Whatever is not drawn a head is one group of the grown kind, carrying the rest of both.
      groups = [{ young: false, count: total[kind] - youngFigures - grownFigures }];
    }
    const centre = centreOf(kind, { home, night, seed, herder, timber, time });
    const list = [
      ...Array.from({ length: grownFigures }, () => ({ young: false, count: 1 })),
      ...Array.from({ length: youngFigures }, () => ({ young: true, count: 1 })),
      ...groups,
    ];
    // The young that are not drawn a head are inside the group's count; the group's count is what makes the sum come right.
    list.forEach((one, n) => {
      const angle = hashed(seed, kind, n, 'angle') * Math.PI * 2;
      const reach = Math.sqrt(hashed(seed, kind, n, 'reach')) * LOOSE[kind] * (night ? 0.5 : 1) * (one.count > 1 ? 0.4 : 1);
      // Their own slow drift: a grazing beast walks a few steps every little while.
      const phase = hashed(seed, kind, n, 'phase') * Math.PI * 2, period = 40 + hashed(seed, kind, n, 'period') * 50;
      const drift = LOOSE[kind] * 0.25;
      let x = centre.x + Math.cos(angle) * reach + Math.sin(time / period + phase) * drift;
      let y = centre.y + Math.sin(angle) * reach * 0.6 + Math.cos(time / (period * 1.3) + phase) * drift * 0.5;
      // A young one keeps to its mother: beside one of the grown figures drawn, when there is one.
      if (one.young && grownFigures) {
        const mother = figures.filter(other => other.kind === kind && !other.young)[n % grownFigures];
        if (mother) { x = mother.x + (hashed(seed, kind, n, 'side') < 0.5 ? -1 : 1) * LOOSE[kind] * 0.18; y = mother.y + LOOSE[kind] * 0.08; }
      }
      if (bounds) { x = Math.min(bounds.maxX, Math.max(bounds.minX, x)); y = Math.min(bounds.maxY, Math.max(bounds.minY, y)); }
      // Moving when the drift is carrying them along, or when they are being driven; grazing and standing otherwise.
      const moving = Boolean(centre.driven) || Math.abs(Math.cos(time / period + phase)) > 0.92;
      const flip = Math.cos(time / period + phase) < 0;
      const coat = COATS[Math.floor(hashed(seed, kind, n, 'coat') * COATS.length)];
      const clip = kind === 'cattle'
        ? (moving ? 'cow-walk' : `cattle-longhorn-${coat}-${hashed(seed, kind, n, 'graze') < 0.7 ? 'graze' : 'idle'}`)
        : (moving ? 'pig-walk' : hashed(seed, kind, n, 'root') < 0.7 ? 'hog-root' : 'hog-idle');
      figures.push({ kind, young: one.young, count: one.count, x, y, size: HERD_SIZE[kind] * (one.young ? YOUNG_SIZE : 1), clip, flip, moving, coat });
    });
  }
  return figures;
}

/**
 * Where a kind stands: about the herder while somebody is out after the stock; near the house at night; else out on its own ground
 * - the cattle further out on the open land, the hogs nearer, and in the timber when the page can say where timber is.
 */
function centreOf(kind, { home, night, seed, herder, timber, time }) {
  if (herder) return { x: herder.x + (kind === 'cattle' ? 0.03 : -0.03), y: herder.y + 0.015, driven: true };
  const angle = hashed(seed, kind, 'ground') * Math.PI * 2 + (kind === 'hogs' ? Math.PI * 0.7 : 0);
  const out = night ? NIGHT_OUT : OUT[kind];
  let centre = { x: home.x + Math.cos(angle) * out, y: home.y + Math.sin(angle) * out * 0.6 };
  if (!night && kind === 'hogs' && timber) {
    // The nearest of a few places round the house where timber stands: the hogs root in it.
    for (let turn = 0; turn < 8; turn++) {
      const a = angle + turn * Math.PI / 4, at = { x: home.x + Math.cos(a) * out, y: home.y + Math.sin(a) * out * 0.6 };
      if (timber(at.x, at.y)) { centre = at; break; }
    }
  }
  // The whole herd works slowly across its ground through the day.
  const wander = night ? 0 : OUT[kind] * 0.15;
  return { x: centre.x + Math.sin(time / 300 + angle) * wander, y: centre.y + Math.cos(time / 380 + angle) * wander * 0.6 };
}

const HAND = Object.freeze({ 1: 'new to stock', 2: 'a good hand with stock', 3: 'the best hand with stock' });
/**
 * What the herd's hover says, from what the server sent (`world.household.herd`, `world.household.ranch`): the counts, the flesh of
 * each kind, the young, the strays still out, and who minded it last - "6 cattle, fat · 12 hogs, fair · 3 calves · 2 strayed ·
 * minded today by Asa, the best hand with stock".
 */
export function herdHover(herd, ranch = null) {
  if (!herd) return '';
  const parts = [];
  const kind = (n, one, many, flesh) => n > 0 && `${n} ${n === 1 ? one : many}${flesh ? `, ${flesh}` : ''}`;
  parts.push(kind(herd.cattle, 'cow', 'cattle', ranch?.condition?.cattle), kind(herd.hogs, 'hog', 'hogs', ranch?.condition?.hogs));
  const young = ranch?.young || herd.young;
  if (young?.cattle) parts.push(`${young.cattle} ${young.cattle === 1 ? 'calf' : 'calves'}`);
  if (young?.hogs) parts.push(`${young.hogs} ${young.hogs === 1 ? 'pig' : 'pigs'}`);
  const strayed = (ranch?.strayed?.cattle || 0) + (ranch?.strayed?.hogs || 0);
  if (strayed) parts.push(`${strayed} strayed`);
  const keeper = ranch?.keeper;
  if (keeper) parts.push(`minded ${keeper.days === 0 ? 'today' : keeper.days === 1 ? 'yesterday' : `${keeper.days} days ago`} by ${keeper.name}, ${HAND[keeper.hand] || HAND[1]}`);
  else if (herd.cattle || herd.hogs) parts.push('nobody minding them');
  return parts.filter(Boolean).join(' · ');
}
