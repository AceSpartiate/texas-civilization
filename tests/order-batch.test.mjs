// Thirty orders pressed together (triage 1.6, 2026-09-29; docs/PERFORMANCE_SERVER.md). Late in a class of 30 every order was a
// commit that checked and serialised the whole 12 MB class and then projected all 31 pages inside itself, so the last of thirty
// orders pressed in the same second was answered after 12 s. Orders arriving together are now made in one commit (`queueOrder`
// in server/app.mjs) and shown by a timer that leaves the server at least half its time (`broadcastWait`).
//
// What must not change is what an order does. So thirty orders, two of them refused and one sent twice, are given to two classes
// dealt from the same seed: pressed all at once in one, and one at a time - each answered before the next is sent, a commit each,
// exactly as before - in the other. Every answer, word for word, and the whole world after must be the same. In the lobby, where
// no tick moves anything under them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { broadcastWait, createClassroom } from '../server/app.mjs';

const FAMILIES = 30;
async function lobby(records) {
  const dir = mkdtempSync(join(tmpdir(), 'texas-order-batch-'));
  const app = createClassroom({ seed: 'order-batch', playerCount: FAMILIES, tickMs: 10000, savePath: join(dir, 'classroom.json'), timings: record => records?.push(record) });
  const port = await app.listen(0, '127.0.0.1');
  const call = async (path, body, cookie) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };
  const cookies = [];
  for (let i = 1; i <= FAMILIES; i++) cookies.push((await call('/api/join', { name: `Student ${i}`, code: app.state.sessionCode })).cookie);
  // Pages open, as in a class: what they are sent is counted by the commit that sends it (`timings`).
  const open = count => Promise.all(cookies.slice(0, count).map(cookie => new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${port}/api/events`, { headers: { Cookie: cookie }, agent: false }, response => { response.resume(); resolve(request); });
    request.on('error', reject);
  })));
  let streams = [];
  return { app, call, cookies, openPages: async count => { streams = await open(count); }, close: async () => { for (const stream of streams) stream.destroy(); await app.close(); rmSync(dir, { recursive: true, force: true }); } };
}
/** The thirty orders: each family's first person put on auto, but a stranger's person, an action that is not one, and one sent twice. */
function ordersFor(app, cookies) {
  const principal = i => app.state.world.households[`hh-${i + 1}`].principalId;
  const orders = cookies.map((cookie, i) => ({ cookie, body: { id: `batch-order-${String(i).padStart(3, '0')}`, action: 'set-auto', entityId: principal(i), auto: true } }));
  orders[7].body.entityId = principal(19); // hh-20's first person, whom nobody else orders: its own order (19) is not one
  orders[19].body = { id: 'batch-order-019', action: 'no-such-order' };
  orders[25] = { cookie: cookies[24], body: { ...orders[24].body } };
  return orders;
}
const worldOf = app => JSON.stringify(app.state.world);
/** The world with its record as a set: each line without its number, in a fixed order. */
const worldAfter = app => {
  const world = app.state.world;
  world.events = world.events.map(({ id, ...line }) => JSON.stringify(line)).sort();
  return JSON.stringify(world);
};

test('thirty orders pressed together are answered and made exactly as one at a time would be, refusals and all, in fewer commits', async () => {
  const records = [];
  const together = await lobby(records), apart = await lobby();
  try {
    // The same pages open in both (a page opening is itself something the world may note).
    await together.openPages(5); await apart.openPages(5);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(worldOf(together.app), worldOf(apart.app), 'the two classes begin the same');
    const at = records.length;
    const pressed = ordersFor(together.app, together.cookies);
    const answersTogether = await Promise.all(pressed.map(order => together.call('/api/command', order.body, order.cookie)));
    const answersApart = [];
    for (const order of ordersFor(apart.app, apart.cookies)) answersApart.push(await apart.call('/api/command', order.body, order.cookie));
    const shape = answers => answers.map(answer => ({ status: answer.status, body: answer.body }));
    assert.deepEqual(shape(answersTogether), shape(answersApart), 'every answer the same, word for word');
    assert.equal(answersTogether[7].status, 400, 'a stranger\'s person is refused');
    assert.equal(answersTogether[19].status, 400, 'an order that is not one is refused');
    assert.equal(answersTogether.filter(answer => answer.status === 200).length, FAMILIES - 2);
    assert.ok(answersTogether[24].body.duplicate || answersTogether[25].body.duplicate, 'the order sent twice is made once');
    // Pressed together, the orders reach the server in whatever order the network brings them, and are made in that order; so
    // the record of them is compared as a set - the same lines, each once - and everything else exactly.
    assert.equal(worldAfter(together.app), worldAfter(apart.app), 'and the world after is the same');
    const commits = records.slice(at).filter(record => record.when === 'order');
    assert.ok(commits.length < pressed.length - 2, `gathered: ${commits.length} commits for ${pressed.length} orders (${commits.map(record => record.orders).join(', ')})`);
    assert.ok(commits.some(record => record.orders > 1), 'at least one commit made several orders');
    assert.ok(commits.every(record => !record.project), 'no order projected a page inside its own commit');
    await new Promise(resolve => setTimeout(resolve, 400));
    const shown = records.slice(at).filter(record => record.when === 'broadcast');
    assert.ok(shown.length >= 1 && shown.some(record => record.project > 0), 'the orders were shown to the open pages, by the timer');
  } finally { await together.close(); await apart.close(); }
});

test('an order refused in the middle of a batch leaves no trace, and the orders round it stand', async () => {
  const records = [];
  const room = await lobby(records);
  try {
    const orders = ordersFor(room.app, room.cookies);
    const before = worldOf(room.app);
    const answers = await Promise.all(orders.map(order => room.call('/api/command', order.body, order.cookie)));
    const world = room.app.state.world;
    const client = cookie => Object.values(room.app.state.clients).find(entry => entry.householdId === `hh-${room.cookies.indexOf(cookie) + 1}`);
    assert.ok(!client(orders[7].cookie).commands.includes(orders[7].body.id), 'the refused order is not in its family\'s ledger');
    assert.ok(!client(orders[19].cookie).commands.includes(orders[19].body.id));
    assert.notEqual(world.entities[orders[7].body.entityId].auto, true, 'the stranger\'s person was not put on auto by it');
    for (const [index, order] of orders.entries()) {
      if (answers[index].status !== 200 || answers[index].body.duplicate) continue;
      assert.equal(world.entities[order.body.entityId].auto, true, `order ${index} stands`);
    }
    assert.notEqual(worldOf(room.app), before);
  } finally { await room.close(); }
});

test('orders are shown by a timer that leaves the server half its time: never inside the order, and never sooner than the last took', () => {
  assert.equal(broadcastWait(0, 0, 10_000, 200), 0, 'long after the last: at once, from a timer');
  assert.equal(broadcastWait(10_000, 50, 10_050, 200), 150, 'a quick broadcast: 200 ms after it ended');
  assert.equal(broadcastWait(10_000, 450, 10_050, 200), 400, 'a broadcast that took 450 ms: 450 ms after it ended, not 200 after it began');
  assert.equal(broadcastWait(10_000, 450, 11_000, 200), 0);
});
