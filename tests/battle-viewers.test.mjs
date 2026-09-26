// Who watches the fight, and what each is sent (docs/BATTLES.md §2.1, §2.7, §2.8).
//
// The Host watches it live, framed on the field. A family watches it live while one of its own people is with the men,
// and is shown only its own people in the force. The town seven miles off does not see it; somebody in town hears the
// gun, in words. Nobody else is sent anything - not the battle, not an alert, not a count, not a name - and a reconnect is
// sent exactly the same. Before contact the family whose person is going is alerted through that person, once; afterwards
// it is given the account through that person, and the journal keeps it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, projectWorld, stepWorld } from '../sim/world.mjs';
import { battleState } from '../sim/battle-stage.mjs';
import { gonzalesClass, principalOf, stepUntil, TIMELINE } from './support/battle.mjs';

const view = (world, householdId, role = 'student') => projectWorld(world, householdId, role, { includeMap: false });

/** hh-1 and hh-4 send their men up the river; hh-2's man stays in Gonzales; hh-3 stays home. */
function fightingClass(seed) {
  const world = gonzalesClass(seed, { fighters: ['hh-1', 'hh-4'], townsfolk: ['hh-2'], stayers: ['hh-3'] });
  const answered = new Set();
  stepUntil(world, () => {
    for (const id of ['hh-1', 'hh-4', 'hh-2']) {
      if (answered.has(id) || world.marches[id]?.status !== 'open') continue;
      applyAction(world, id, { action: id === 'hh-2' ? 'stay-in-town' : 'go-upriver', entityId: world.marches[id].actorId, mode: 'foot' });
      answered.add(id);
    }
    return answered.size === 3;
  });
  return world;
}

test('the Host and the families with somebody there watch it live; the town, the farm, a spectator and a reconnect are sent nothing', () => {
  const world = fightingClass('viewers-leak');
  const fighter = principalOf(world, 'hh-1').id, other = principalOf(world, 'hh-4').id;
  const battleKeys = /"legacyPhase"|"formations"|"noFalling"|"participants"|"alerted"|"battleAlert"|"battleAccount"/;
  let sampled = 0;
  while (world.minute < TIMELINE.resolved) {
    stepWorld(world);
    const state = battleState(world, 'gonzales');
    if (!state?.live) continue;
    sampled++;
    // The Host: live, every family's person in the force named for the drawing, the camera on the field while it is fought.
    const host = view(world, undefined, 'host');
    assert.ok(host.battle && host.battle.reconstruction === false, `the Host was not sent the fight at ${world.minute}`);
    assert.deepEqual([...host.battle.members].sort(), [fighter, other].filter(id => world.entities[id].location.siteId === 'williams-camp' && !world.entities[id].travel).sort());
    if (world.minute >= TIMELINE.approach && world.minute < TIMELINE.resolved) assert.equal(host.host.focus, 'battle', `the Host's camera was not on the field at ${world.minute}`);
    // A family with somebody there: live, with the families' men in the force named for the drawing - its own, and any other
    // family's it is standing beside and already sees there (`others`), and nobody it does not.
    const own = view(world, 'hh-1');
    if (world.entities[fighter].location.siteId === 'williams-camp' && !world.entities[fighter].travel) {
      assert.ok(own.battle, `hh-1 was not sent the fight its man is in at ${world.minute}`);
      assert.ok(own.battle.members.includes(fighter));
      const seen = new Set([...own.entities, ...own.others].map(entity => entity.id));
      assert.ok(own.battle.members.every(id => seen.has(id)), `hh-1 was told of a man in the force it cannot see: ${own.battle.members}`);
    }
    // The town, the farm, a spectator, and each of them again as a reconnect would ask: nothing.
    for (const [who, householdId] of [['the town', 'hh-2'], ['the farm', 'hh-3'], ['a spectator', undefined]]) {
      for (const pass of ['first', 'reconnect']) {
        const seen = view(world, householdId);
        const text = JSON.stringify(seen);
        assert.equal(seen.battle, null, `${who} (${pass}) was sent the battle at ${world.minute}`);
        assert.ok(!battleKeys.test(text), `${who} (${pass}) was sent part of the battle: ${battleKeys.exec(text)?.[0]}`);
        assert.ok(!text.includes(fighter) && !text.includes(other), `${who} (${pass}) was sent the name of a man in the force`);
      }
    }
  }
  assert.ok(sampled >= 40, `only ${sampled} ticks of the fight were sampled`);
});

test('the family whose man is going is alerted through him before contact, once; nobody else is', () => {
  const world = fightingClass('viewers-alert');
  const fighter = principalOf(world, 'hh-1');
  stepUntil(world, () => view(world, 'hh-1').battleAlert);
  const alert = view(world, 'hh-1').battleAlert;
  assert.ok(alert, 'no alert came');
  assert.ok(world.minute < TIMELINE.approach, `the alert came at ${world.minute}, after contact at ${TIMELINE.approach}`);
  assert.equal(alert.entityId, fighter.id);
  assert.match(alert.text, new RegExp(`^At ${fighter.name}'s side`));
  assert.ok(Number.isFinite(alert.field.x) && Number.isFinite(alert.field.y));
  const camp = world.map.sites['williams-camp'];
  assert.ok(Math.hypot(alert.field.x - camp.x, alert.field.y - camp.y) < 1, 'Watch would frame somewhere other than the field');
  for (const id of ['hh-2', 'hh-3']) assert.equal(view(world, id).battleAlert, undefined, `${id} was alerted with nobody there`);
  stepUntil(world, () => world.minute >= TIMELINE.resolved);
  const notices = world.events.filter(event => event.type === 'notice' && event.householdId === 'hh-1' && event.claimId === 'FIC-GONZ-448');
  assert.equal(notices.length, 1, 'the alert was put more than once');
  assert.equal(view(world, 'hh-1').battleAlert, undefined, 'the alert outlived the fight');
});

test('the town hears the gun - twice, in words - and never the fight; the farm hears nothing', () => {
  const world = fightingClass('viewers-heard');
  stepUntil(world, () => world.minute >= TIMELINE.resolved);
  const heard = id => world.events.filter(event => event.householdId === id && event.claimId === 'FIC-GONZ-417');
  assert.equal(heard('hh-2').length, 2, heard('hh-2').map(event => event.text).join(' | '));
  assert.match(heard('hh-2')[0].text, /heavy gun/);
  assert.doesNotMatch(heard('hh-2').map(event => event.text).join(' '), /rifle|musket|dragoon|Castañeda/, 'the town was told more than a gun can say');
  assert.equal(heard('hh-3').length, 0, 'the farm, miles off, heard the gun');
  assert.equal(heard('hh-1').length, 0, 'the man at the field was told he heard it from town');
});

test('afterwards the family is told through its man what happened, what he did and why it ended so, and the journal keeps it', () => {
  const world = fightingClass('viewers-account');
  const fighter = principalOf(world, 'hh-1');
  stepUntil(world, () => view(world, 'hh-1').battleAccount);
  assert.equal(battleState(world, 'gonzales').phase.id, 'home', 'the account came before the men left the field');
  const account = view(world, 'hh-1').battleAccount;
  assert.equal(account.entityId, fighter.id);
  for (const part of ['What happened:', `What ${fighter.name} did:`, 'Why it ended so:']) assert.ok(account.text.includes(part), `the account has no "${part}"`);
  assert.match(account.text, /Castañeda/); assert.match(account.text, /withdrew|rode away/); assert.match(account.text, /No Texian was killed/);
  assert.match(account.text, /fired with them/, 'the account does not say what he did');
  assert.ok(world.events.some(event => event.householdId === 'hh-1' && event.text === account.text), 'the journal does not keep it');
  for (const id of ['hh-2', 'hh-3']) assert.equal(view(world, id).battleAccount, undefined, `${id} was given an account of a fight it had nobody at`);
  // A day later the card is gone; the journal still has it.
  stepUntil(world, () => !view(world, 'hh-1').battleAccount, 400);
  assert.ok(world.events.some(event => event.text === account.text));
});
