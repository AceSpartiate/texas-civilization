// What the class view may know while it films a fight (owner, 2026-09-30: "players should see their family members fighting and
// wonder if they'll survive"; docs/BATTLES.md §15.3, docs/HOST_PAGE.md §2.15).
//
// The film names every man of the class in the fight on the projector (public/app.js `drawCinema`, public/battle-cinema.js). It may
// name him only because the server already sends the Host every family's people in the force (`battle.members`), and it may show
// him hit only because the server sends his fate at its minute and not before. So, on the Host's whole payload, tick by tick
// through Concepción with a family's man staged to be killed crossing the open: before his minute nothing anywhere on the wire
// says it - not the battle's fates, not his health, not his words on the class panel, not his family's record - while he is named
// in the force; from his minute the battle says it, and the class panel says no more than the battle does.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction } from '../sim/world.mjs';
import { battleState } from '../sim/battle-stage.mjs';
import { concepcionFate } from '../sim/army.mjs';
import { armyClass, untilMinute, view } from './support/campaign.mjs';
import { stepWorld } from '../sim/world.mjs';

const phaseOf = world => battleState(world, 'concepcion')?.phase?.id;
const from = (world, id) => battleState(world, 'concepcion').phases.find(phase => phase.id === id).from;

test('the Host is shown a family\'s man in the fight from the start and his fate only from its minute: nothing on its wire says it sooner', () => {
  const { world, sent } = armyClass('host-knowledge');
  const [a] = sent;
  applyAction(world, a.householdId, { action: 'detachment-go', entityId: a.personId });
  for (let n = 0; n < 5000; n++) { world.seed = `host-knowledge-${n}`; if (concepcionFate(world, a.personId) === 'killed') break; }
  assert.equal(concepcionFate(world, a.personId), 'killed');
  const name = world.entities[a.personId].name;
  untilMinute(world, from(world, 'alarm'));
  let named = 0, before = 0, after = 0, staged = null;
  while (['alarm', 'ringed', 'fog-lifts', 'charges', 'retreat'].includes(phaseOf(world))) {
    const host = view(world, undefined, 'host');
    const text = JSON.stringify(host);
    const fate = world.battles.concepcion.fates?.[a.personId];
    if (fate && staged === null) staged = fate.minute;
    if (host.host?.focus === 'battle') {
      assert.ok(host.battle.members.includes(a.personId), `the Host's film could not name ${name}: he is not in the force it was sent at ${world.minute}`);
      named++;
    }
    const due = fate && fate.minute <= world.minute;
    const row = host.live?.families?.find(family => family.id === a.householdId);
    const words = row?.people?.find(person => person.name === name)?.where || '';
    const entity = [...(host.entities || []), ...(host.others || [])].find(one => one.id === a.personId);
    if (!due) {
      before++;
      assert.ok(!host.battle?.memberFates?.[a.personId], `the Host was sent ${name}'s fate before its minute (${world.minute} < ${fate?.minute})`);
      assert.ok(!/"memberFates"/.test(text) || !text.includes(`"${a.personId}":{"fate"`), 'a fate for him is on the Host\'s wire early');
      assert.notEqual(entity?.health?.condition, 'dead', 'his health said it before the battle showed it');
      assert.doesNotMatch(words, /dead|killed|wounded|fell/i, `the class panel said it first: "${words}"`);
      assert.ok(!(host.events || []).some(event => event.actorId === a.personId && /killed|died|fell/i.test(event.text || '')), 'a record said it first');
    } else {
      after++;
      assert.equal(host.battle.memberFates?.[a.personId]?.fate, 'killed', `the battle did not show it once its minute came (${world.minute})`);
    }
    stepWorld(world);
  }
  assert.ok(staged !== null, 'no fate was staged for him');
  assert.ok(named >= 10 && before >= 5 && after >= 1, `too little of the fight was looked at: named ${named}, before ${before}, after ${after}`);
});
