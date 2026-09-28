// More hands, faster: the one rule for how much a second, third and fourth person add to work at home (owner, 2026-09-28,
// docs/FAMILY_PANEL.md §21: "If I add another person to the task it should speed the task up").
//
// Every work at home that many can share goes faster by the same curve. Two kinds of sharing use it:
//
//   - **Work into one thing** - the house, a clearing, the lane, the felling for the pile - where each person puts their own
//     spells into the same thing: each of `n` hands works at `handShare(n)` of their own pace, so together they do
//     `crewPace(n)` of one person's work.
//   - **One job done together** - planting, the harvest, the well, a fence, the carreta, a piece of furniture, mending the hoe,
//     riding the range - where the first person given it leads and whoever is given it after works alongside them: the lead's
//     work goes at `crewPace(n)` of their own pace, and the job is done once, not once for each (sim/chores.mjs `joins`).
//
// Each hand after the first adds a little less than the one before, and past `MOST_HANDS` a family's people get in each other's
// way: a fifth of the family is refused the work, in the words the row shows (`crowdedWhy`). Neighbours helping raise the walls
// are counted among the hands on a house but never refused by it (sim/houses.mjs `handsOn`): a raising is theirs to join.
//
// Every number is invented (`FIC-GONZ-901`).
// ceiling: one curve for every work - four hands at a fence and four at a house go the same share faster, and a helper's own knack
// and strength do not count, only the lead's. Per-work curves, or each hand's own pace summed, are the way out if a class shows
// one work plainly wrong (a well four people cannot all dig at once, a raising that wanted a dozen).

/** What each hand adds, in order: a whole hand, then four fifths of one, three fifths, two fifths. */
export const HAND_SHARES = Object.freeze([1, 0.8, 0.6, 0.4]);
/** The most of a family who can usefully work at one thing at once. */
export const MOST_HANDS = HAND_SHARES.length;

const round = value => Math.round(value * 10000) / 10000;

/** How much work `hands` people do together, in one person's work: 1, 1.8, 2.4, 2.8, and no more past four. */
export function crewPace(hands) {
  const n = Math.max(1, Math.min(MOST_HANDS, Math.floor(hands) || 1));
  return round(HAND_SHARES.slice(0, n).reduce((sum, share) => sum + share, 0));
}

/** Each hand's own share of their pace when `hands` work into one thing: 1 alone, 0.9 of two, 0.8 of three, 0.7 of four. */
export const handShare = hands => (hands <= 1 ? 1 : round(crewPace(hands) / hands));

/** Why a fifth of the family is refused a work four are already at, naming them. */
export function crowdedWhy(names) {
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
  return `${list} are at it already. More than ${MOST_HANDS} of the family at one work only get in each other's way.`;
}
