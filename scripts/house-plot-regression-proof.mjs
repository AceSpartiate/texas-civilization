// Isolated loader substitutions: no production file is edited while another agent tests the release.
import {spawnSync} from 'node:child_process';
import {writeFileSync, mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const cases = [
  ['every period plan', 'houseplot.mjs', 'room: 4, rest: 0.85', 'room: 9, rest: 0.85'],
  ['the plot refuses', 'houseplot.mjs', "if (cellsOf(p).some(cell => taken.has(cell)))", 'if (false)'],
  ['a family on the real land plans', 'houses.mjs', "household.house.plan = 'own';", "household.house.plan = 'round-log';"],
  ['the house goes up stage by stage', 'houseplot.mjs', 'takeLogs(household.logs, stage.logs);', '/* regression: free logs */'],
  ['a course above the sixth', 'houses.mjs', "pieced(host) ? 'house' : HOUSES[host.house.layout].name.toLowerCase()", 'HOUSES[host.house.layout].name.toLowerCase()'],
  ['a chimney waits', 'houseplot.mjs', "if (house.plan !== undefined && house.plan !== 'own' && !PLANS[house.plan])", 'if (false)'],
  // Since 2026-09-19 (ced5a9d, docs/BIOME_GAMEPLAY.md §3.2) a family nobody plays with no timber of its own fetches its logs
  // when timber is within a wagon's short haul, and builds a jacal only when none is. The house-plot test now holds the
  // fetching and says the jacal "is held in tests/biome-game.test.mjs", so each mutation is run against the test that holds it.
  ['families nobody plays', 'neighbours.mjs', '&& !fetchesLogs(world, household, homeSite)', '&& true'],
  ['a family nobody plays with no timber of its own', 'neighbours.mjs', "treeless ? 'jacal'", "treeless ? 'round-log'", 'tests/biome-game.test.mjs'],
];
const result=[];
for(const [name,file,from,to,suite='tests/house-plot.test.mjs'] of cases){
  const hook=`import {registerHooks} from 'node:module'; registerHooks({load(url,context,next){const out=next(url,context);if(url.endsWith('/sim/${file}')){const source=String(out.source);if(!source.includes(${JSON.stringify(from)}))throw Error('missing mutation');return {...out,source:source.replace(${JSON.stringify(from)},${JSON.stringify(to)})};}return out;}});`;
  const run=spawnSync(process.execPath,['--import',`data:text/javascript,${encodeURIComponent(hook)}`,'--test',`--test-name-pattern=${name}`,suite],{encoding:'utf8'});
  const output=run.stdout+run.stderr;
  assert.equal(run.status,1,`${name} did not reject regression: ${output}`);
  assert.match(output,/fail 1\b/,output);
  result.push({test:name,file:suite,mutation:from,replacement:to,caught:true});
}
mkdirSync('docs/evidence',{recursive:true});
writeFileSync('docs/evidence/house-plot-regressions.json',JSON.stringify({date:new Date().toISOString(),isolation:'Node load hooks; production files unchanged',result},null,2));
console.log(`PASS: ${result.length} house plot regressions each failed exactly one selected test.`);
