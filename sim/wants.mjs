// What a family is short of for the things it is working towards, counted once on the household for its page (owner,
// 2026-09-30, after playing the release: "i never saw where i could hunt to get leather to make the little carts, and i really
// wanted one since i was using me wagon for something else"; docs/WOODS_AND_BUILDING.md §6.6, docs/FAMILY_PANEL.md §23).
//
// The bar draws only what can be pressed (docs/FAMILY_PANEL.md, the rule of 2026-09-22). A carreta refused for want of a hide, or
// a hunt refused because the rifle went to the war, was therefore never on it at all, and nothing anywhere said that a hunt brings
// the hide a carreta is lashed with. Now such a refusal is kept on the bar greyed (`short` on the refused entry, sim/chores.mjs
// `choresFor`), and what the family has of each thing it wants, against what it wants, rides here once a tick - only while it is
// short of something, so a family that has everything sends nothing new (the per-tick channel is budgeted, tests/chores.test.mjs).
//
//   carreta  { axe: [have, 1], logs: [have, 3], hide: [have, 1] }   while a carreta could be made but for these (sim/carreta.mjs)
//   hunt     { rifle: [free, 1], powder: [have, 1] }                 while the rifle is out of the house or the powder is gone
//
// The page draws each as a strip on the icon and a list in its popup, and points the first thing missing at the work that brings
// it (public/family-panel.js `WANT_FROM`): a hide at the hunt, logs at felling, an axe, a rifle or powder at town. It decides
// nothing; the server refuses the work in its own words as it always did. Invented presentation: no historical claim.
import { carretaWants } from './carreta.mjs';
import { toolCount } from './tools.mjs';
import { userOf } from './keeping.mjs';
import { SHOT_COST } from './chores.mjs';

/** The hunt's wants, or null when the rifle is in the house and there is a shot's powder. */
export function huntWants(world, household) {
  const rifle = toolCount(household, 'rifle') > 0 && !userOf(world, household, 'rifle') ? 1 : 0;
  const powder = Math.max(0, Math.floor(household.resources?.powder ?? 0));
  if (rifle && powder >= SHOT_COST) return null;
  return { rifle: [rifle, 1], powder: [Math.min(powder, SHOT_COST), SHOT_COST] };
}

/** `{ wants }` for the household's projection, or null when it is short of nothing (and in the lobby, where nothing is made). */
export function wantsShown(world, household) {
  if (!household?.played || world.status === 'lobby') return null;
  const wants = {};
  const carreta = carretaWants(world, household);
  if (carreta) wants.carreta = carreta;
  const hunt = huntWants(world, household);
  if (hunt) wants.hunt = hunt;
  return Object.keys(wants).length ? { wants } : null;
}
