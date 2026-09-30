// A Tejano family's men and Juan Seguín's company (owner, 2026-09-29: the Tejano family start, "Seguín's company is a choice for its
// men in the autumn and winter"; docs/FAMILY_CREATION.md, *The family's start*). A family's start is sim/starts.mjs.
//
// **The record** (`HIST-TEX-782`). Austin gave Juan N. Seguín a captain's commission in October 1835 and he raised a company of
// thirty-seven Tejanos, who joined the army on Salado Creek; more came from the ranchos on the San Antonio River. Through the siege of
// Béxar they scouted and brought in supplies, and they fought in the storming. Afterwards most were given leave to go home and guard
// their families. The company was formed again at Gonzales in the first week of March 1836, served as the rear guard of Houston's
// army, and was the only Tejano company at San Jacinto, twenty-two men on the day; one of its officers remembered their putting white
// pasteboard on their hats and chests so that they would not be taken for Santa Anna's men. De León's colony's own rancheros rode
// under Plácido Benavides in the autumn, took Goliad and fought at Béxar; Benavides would not support independence, and in the spring
// Seguín's was the Tejano company in the field.
//
// **What a Tejano family's man can do** (`FIC-GONZ-983`), on top of everything any family's man can:
//   - **In the autumn** his settlement's call is to ride for Gonzales **to join the Tejano volunteers under Seguín** (sim/calls.mjs):
//     the same journey, powder, rifle and army as any volunteer, and his company marked `entity.company = 'seguin'`. When the army
//     is on the Salado (the `detachment` milestone, October 21) he is with Seguín's company from then on, and is told what it did.
//     `ceiling:` the army is one body (sim/army.mjs); the company is a name on the man and a line in his family's story, not a unit
//     that moves apart. In the storming he goes in with whichever division the engine deals (sim/bexar-fight.mjs `goIn`).
//   - **After Béxar** he is sent home with the rest; his family is told that Seguín's men were given leave to guard their families.
//     `ceiling:` the winter's garrison at Béxar is not offered as Seguín's: about fifteen of his men entered the Alamo on February 23
//     and most left after he rode out on the 25th, when is disputed, and the game would have to take a man out of the siege.
//   - **In the spring** a Tejano man may **join Seguín's company** in Houston's army (`join-seguin`, beside `join-houston`): the same
//     road to the army's camp, the same service (`kind: 'houston'`), marked as Seguín's. At San Jacinto his family's account says
//     he fought with the one Tejano company and how its men were marked.
// Nothing here reads a hidden stat or changes a fate: a Seguín's man is rolled in every battle as any man is.
import { record } from './events.mjs';
import { registerChores } from './chores.mjs';
import { joinEstimateWords } from './houston.mjs';

/** The company, as `entity.company` stores it. */
export const SEGUIN = 'seguin';
export const COMPANIES = Object.freeze([SEGUIN]);
export const CLAIMS = Object.freeze({ record: 'HIST-TEX-782', game: 'FIC-GONZ-983' });

/** Whether this family's men ride with Seguín: a Tejano family, in a class that deals starts. */
export const seguinFamily = (world, household) => Boolean(world?.starts) && household?.heritage === 'tejano';

/** The settlement's call, as a Tejano family's man is asked it (sim/calls.mjs `callOptions`). */
export const SEGUIN_CALL = Object.freeze({
  label: place => `Go: ride for ${place}, to join the Tejano volunteers (Seguín's company)`,
  note: name => `${name} rides with the Tejano volunteers Juan Seguín is raising for the army.`,
  choice: (name, place) => `${name} will ride for ${place}, to join the Tejano volunteers under Juan Seguín.`,
});

/** The lines a Seguín's man's family is told, each once (`world.startsTold`). */
const LINES = Object.freeze({
  salado: name => `On the Salado, Juan Seguín's company of Tejano volunteers, thirty-seven men from the ranchos of the San Antonio River, joined the army. ${name} rides with them now: they scout round Béxar and bring in beef and corn for the army.`,
  leave: name => `After Béxar most of Seguín's men were given leave to go home and guard their families, and ${name} is among them.`,
  spring: name => `${name} joined Juan Seguín's company, the Tejano company of Houston's army, formed again at Gonzales in March. It marches as the army's rear guard.`,
});
/** Said under a Seguín's man's part in the San Jacinto account (sim/san-jacinto.mjs `sanJacintoAccount`). */
export const seguinAtSanJacinto = person => (person?.company === SEGUIN
  ? ` ${person.name} was with Seguín's company, the one Tejano company in the battle. Its men wore white pasteboard on their hats and chests, so that no Texian would take them for Santa Anna's soldiers.`
  : '');

/** Marks a man as Seguín's: the autumn's call, or the spring's `join-seguin`. */
export function joinSeguin(entity) {
  entity.company = SEGUIN;
}

const GONE = ['dead', 'captured'];
const toldOf = (world, householdId) => (world.startsTold?.[householdId] || []);
function tell(world, household, person, key, text) {
  const mark = `${key}:${person.id}`;
  if (toldOf(world, household.id).includes(mark)) return;
  world.startsTold ??= {};
  world.startsTold[household.id] = [...toldOf(world, household.id), mark];
  record(world, 'army', { actorId: person.id, householdId: household.id, importance: 2, classification: 'DOCUMENTED', claimId: CLAIMS.record, text });
}

/** Every tick, in a class that deals starts: what each Seguín's man's family is told, at the moment the record has it. */
export function advanceSeguin(world) {
  if (!world.starts) return;
  const milestones = world.director?.milestones || {};
  for (const household of Object.values(world.households)) {
    if (!seguinFamily(world, household)) continue;
    for (const id of household.members) {
      const person = world.entities[id];
      if (person?.company !== SEGUIN || GONE.includes(person.health?.condition)) continue;
      if (milestones.detachment && !milestones['bexar-end'] && world.army?.members?.includes(id)) tell(world, household, person, 'salado', LINES.salado(person.name));
      if (milestones['bexar-end'] && toldOf(world, household.id).includes(`salado:${id}`) && person.service?.kind !== 'houston') tell(world, household, person, 'leave', LINES.leave(person.name));
      if (person.service?.kind === 'houston' && person.service.status === 'serving') tell(world, household, person, 'spring', LINES.spring(person.name));
    }
  }
}

/** A company or a told line that could not have been, or null (sim/world.mjs `validateWorld`). */
export function tejanoInvalid(world) {
  for (const entity of Object.values(world.entities || {})) {
    if (entity.company === undefined) continue;
    if (!COMPANIES.includes(entity.company) || entity.kind !== 'person' || !seguinFamily(world, world.households[entity.householdId])) return 'Invalid company';
  }
  return null;
}

// The spring's choice (`FIC-GONZ-983`): Houston's army, as Seguín's. Offered only to a Tejano family's men, beside `join-houston`,
// and only while Houston's army can be joined (sim/winter.mjs `WINTER_CHORES`, `houstonOpen`). The steps are `join-houston`'s: to the
// army's camp, reporting, joined; turned home if the battle is fought first.
registerChores({
  'join-seguin': {
    war: "gone to join Seguín's company",
    name: "Go and join Seguín's company in Houston's army", skill: 'hands', where: 'home', winter: true, fromFlight: true,
    offered: (world, household) => seguinFamily(world, household),
    refusal: (world, household) => (seguinFamily(world, household) ? null : "Seguín's company is the Tejano company; your family's men can join Houston's army."),
    describe: "Go to the camp of Houston's army and join Juan Seguín's company of Tejanos, formed again at Gonzales in March, which marches as the army's rear guard. They can be sent for to help the family. From the road or the refuge the family goes on without them.",
    estimate: (world, household, entity) => joinEstimateWords(world, entity),
    begin: (world, household, entity) => {
      if (entity.travel?.purpose !== 'flee') return;
      // Off the family's road where he stands, as `join-houston` does.
      const here = entity.location;
      const near = Object.values(world.map.sites).reduce((best, site) => !best || Math.hypot(site.x - here.x, site.y - here.y) < Math.hypot(best.x - here.x, best.y - here.y) ? site : best, null);
      entity.travel = null;
      entity.location = { x: here.x, y: here.y, siteId: near.id };
      record(world, 'departure', { actorId: entity.id, householdId: household.id, importance: 2, text: `${entity.name} left the family on the road east near ${near.name} to go and join Seguín's company. The family goes on without them.` });
    },
    steps: [
      { travel: 'houston-camp', doing: 'on the road to the army' },
      { work: 1, doing: "reporting to Seguín's company" },
      { run: (world, household, entity) => { joinSeguin(entity); } },
      { winter: 'houston' },
      { when: ['shut-out'], travel: 'home', doing: 'turning back for home' },
    ],
  },
});
