/**
 * How many of each tool a family owns (owner, 2026-09-24: "players should be able to send someone to buy more rifles, hoes,
 * tools in general"; docs/TOWNS.md §4c).
 *
 * The stored shape grew rather than changed, so every class saved before opens as it was, one of each tool it owned:
 *
 *   household.tools[tool]    - unchanged: the family has at least one; the number is the wear of the one in hand (only the hoe
 *                              wears, `TOOL_LIFE` jobs and then it wants mending).
 *   household.spares[tool]   - new, absent on every class saved before: the wear of each copy beyond the first.
 *   household.rifles         - new, absent on every class saved before: how many rifles. Absent is one - every family has
 *                              always had its rifle, which was never written down because there was only ever the one.
 *
 * The hoe in hand is always the soundest (`soundestFirst`): a sound spare is taken up the moment the one in use wears out, and a
 * new hoe bought beside a worn one goes into use while the worn one waits to be mended. So every reader that has always asked
 * `household.tools.hoe` - planting, harvest, the plot's tools - asks the right hoe without knowing there are two.
 *
 * No save version moved: the new fields are counted from nothing, and no old field is read another way.
 *
 * This file imports nothing, so sim/keeping.mjs, sim/chores.mjs and sim/shops.mjs can all ask it.
 */

/** A hoe gives this many field jobs, then wants mending. The one number: sim/chores.mjs and sim/survey.mjs read it from here. */
export const TOOL_LIFE = 5;
/** Every tool a family can own and a shop can sell, in the words a sentence uses: one, and more than one. */
export const TOOL_WORDS = Object.freeze({
  rifle: ['rifle', 'rifles'], hoe: ['hoe', 'hoes'], axe: ['felling axe', 'felling axes'],
  broadaxe: ['broadaxe', 'broadaxes'], froe: ['froe', 'froes'], auger: ['auger', 'augers'],
});
export const TOOLS = Object.freeze(Object.keys(TOOL_WORDS));
const worn = wear => wear >= TOOL_LIFE;

/** How many of this tool the family owns. */
export function toolCount(household, tool) {
  if (!household) return 0;
  if (tool === 'rifle') return Number.isInteger(household.rifles) ? household.rifles : 1;
  return (household.tools?.[tool] === undefined ? 0 : 1) + (household.spares?.[tool]?.length ?? 0);
}
/** Every copy's wear, the one in hand first. */
export const wearsOf = (household, tool) => household.tools?.[tool] === undefined ? [] : [household.tools[tool], ...(household.spares?.[tool] || [])];

/** A new one, sound, into the house: the first of its kind in hand, any more beside it; the soundest is then the one in hand. */
export function addTool(household, tool) {
  if (tool === 'rifle') { household.rifles = toolCount(household, 'rifle') + 1; return; }
  if (household.tools?.[tool] === undefined) household.tools = { ...household.tools, [tool]: 0 };
  else household.spares = { ...household.spares, [tool]: [...(household.spares?.[tool] || []), 0] };
  soundestFirst(household, tool);
}
/** One gone from the house for good: the rifle lost with the man who carried it to the war. */
export function loseTool(household, tool) {
  if (tool === 'rifle') { household.rifles = Math.max(0, toolCount(household, 'rifle') - 1); return; }
  const spares = household.spares?.[tool] || [];
  if (spares.length) { household.spares = { ...household.spares, [tool]: spares.slice(1) }; tidy(household, tool); return; }
  if (household.tools?.[tool] !== undefined) { const { [tool]: gone, ...rest } = household.tools; household.tools = rest; }
}
/** The soundest copy in hand, the others spare. Called after every change of wear. */
export function soundestFirst(household, tool) {
  const wears = wearsOf(household, tool);
  if (wears.length < 2) return;
  const sorted = [...wears].sort((a, b) => a - b);
  household.tools[tool] = sorted[0];
  household.spares = { ...household.spares, [tool]: sorted.slice(1) };
}
/** Whether any copy of this tool is worn out, and so something to mend. */
export const anyWorn = (household, tool) => wearsOf(household, tool).some(worn);
/** Whether every copy is worn out: the work that wants the tool waits for a mending or a new one. */
export const allWorn = (household, tool) => { const wears = wearsOf(household, tool); return wears.length > 0 && wears.every(worn); };
/** Mend the most worn copy (sim/chores.mjs `mend-hoe`): the one in hand if it is the one, else a spare waiting to be mended. */
export function mendWorst(household, tool) {
  const spares = household.spares?.[tool] || [];
  const worst = Math.max(...wearsOf(household, tool));
  if (household.tools[tool] === worst || !spares.length) household.tools[tool] = 0;
  else { const at = spares.indexOf(worst); household.spares = { ...household.spares, [tool]: spares.map((wear, i) => (i === at ? 0 : wear)) }; }
  soundestFirst(household, tool);
}
/** No empty list of spares left behind: the field is absent when there are none, as on every class saved before. */
function tidy(household, tool) {
  if (!household.spares || household.spares[tool]?.length) return;
  const { [tool]: gone, ...rest } = household.spares;
  if (Object.keys(rest).length) household.spares = rest; else delete household.spares;
}

/** "a rifle", "2 hoes (1 worn)": the family's tools as the popup's stock line says them. */
export function toolWords(household) {
  const parts = [];
  for (const tool of TOOLS) {
    const n = toolCount(household, tool);
    if (!n) continue;
    const [one, many] = TOOL_WORDS[tool];
    const worns = tool === 'hoe' ? wearsOf(household, tool).filter(worn).length : 0;
    parts.push(`${n === 1 ? `a ${one}` : `${n} ${many}`}${worns ? ` (${worns === n ? (n === 1 ? 'worn' : 'all worn') : `${worns} worn`})` : ''}`);
  }
  return parts;
}

/** Stored counts that could not have been bought or brought (sim/world.mjs `validateWorld`). */
export function toolsInvalid(world) {
  for (const household of Object.values(world.households || {})) {
    if (household.rifles !== undefined && (!Number.isInteger(household.rifles) || household.rifles < 0)) return 'Invalid rifle count';
    if (household.spares === undefined) continue;
    if (!household.spares || typeof household.spares !== 'object') return 'Invalid spare tools';
    for (const [tool, wears] of Object.entries(household.spares)) {
      if (!TOOLS.includes(tool) || tool === 'rifle' || household.tools?.[tool] === undefined) return 'Invalid spare tools';
      if (!Array.isArray(wears) || !wears.length || wears.some(wear => !Number.isInteger(wear) || wear < 0)) return 'Invalid spare tools';
    }
  }
  return null;
}
