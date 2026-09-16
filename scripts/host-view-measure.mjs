// How big the Host's whole-class snapshot is (sim/overview.mjs), measured on every tick of a played class.
//
// Classes on both maps at the largest size (30 families) and the usual one (15), every family rolled and run by the
// neighbours from the arrival until the class's story is preserved or 600 ticks. Bytes are the JSON of the world projection
// the Host is sent on each snapshot (`includeMap: false`, as the server sends it), not HTTP or SSE framing.
//
// Run: node scripts/host-view-measure.mjs   (writes the `measured` part of docs/evidence/host-view.json)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { projectWorld, rollFamily, stepWorld } from '../sim/world.mjs';

const size = value => JSON.stringify(value).length;
const measured = [];
for (const [map, families] of [['colonies', 30], ['gonzales', 30], ['colonies', 15]]) {
  const world = createGonzalesWorld(`host-view-measure-${map}-${families}`, families, { map, neighbours: true });
  for (const household of Object.values(world.households)) rollFamily(world, household);
  world.status = 'running';
  const bytes = [], perFigure = [];
  let worst = null, projectMs = 0;
  for (let tick = 0; tick < 600 && world.status === 'running' && !world.director?.complete; tick++) {
    const started = performance.now();
    const host = projectWorld(world, undefined, 'host', { includeMap: false });
    projectMs += performance.now() - started;
    const b = size(host);
    bytes.push(b); perFigure.push(b / host.others.length);
    if (!worst || b > worst.bytes) worst = { tick: world.tick, bytes: b, figures: host.others.length, travelling: host.others.filter(e => e.travel).length, landsBytes: size(host.overview.lands) };
    stepWorld(world);
  }
  const students = Object.keys(world.households).map(id => size(projectWorld(world, id, 'student', { includeMap: false })));
  const mean = list => Math.round(list.reduce((sum, value) => sum + value, 0) / list.length);
  measured.push({
    map, families, ticks: bytes.length,
    hostBytes: { mean: mean(bytes), max: Math.max(...bytes), min: Math.min(...bytes), meanPerFigure: mean(perFigure) },
    worst, meanProjectMs: Math.round(projectMs / bytes.length * 100) / 100,
    studentBytesAtEnd: { mean: mean(students), max: Math.max(...students), allStudentsTogether: students.reduce((sum, value) => sum + value, 0) },
  });
  console.log(JSON.stringify(measured.at(-1)));
}
const path = 'docs/evidence/host-view.json';
const record = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
writeFileSync(path, `${JSON.stringify({ ...record, measured: { date: new Date().toISOString().slice(0, 10), command: 'node scripts/host-view-measure.mjs', runs: measured } }, null, 2)}\n`);
