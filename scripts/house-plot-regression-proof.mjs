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
  ['families nobody plays', 'neighbours.mjs', "treeless ? 'jacal'", "treeless ? 'round-log'"],
];
const result=[];
for(const [name,file,from,to] of cases){
  const hook=`import {registerHooks} from 'node:module'; registerHooks({load(url,context,next){const out=next(url,context);if(url.endsWith('/sim/${file}')){const source=String(out.source);if(!source.includes(${JSON.stringify(from)}))throw Error('missing mutation');return {...out,source:source.replace(${JSON.stringify(from)},${JSON.stringify(to)})};}return out;}});`;
  const run=spawnSync(process.execPath,['--import',`data:text/javascript,${encodeURIComponent(hook)}`,'--test',`--test-name-pattern=${name}`,'tests/house-plot.test.mjs'],{encoding:'utf8'});
  const output=run.stdout+run.stderr;
  assert.equal(run.status,1,`${name} did not reject regression: ${output}`);
  assert.match(output,/fail 1\b/,output);
  result.push({test:name,mutation:from,replacement:to,caught:true});
}
mkdirSync('docs/evidence',{recursive:true});
writeFileSync('docs/evidence/house-plot-regressions.json',JSON.stringify({date:new Date().toISOString(),isolation:'Node load hooks; production files unchanged',result},null,2));
console.log(`PASS: ${result.length} house plot regressions each failed exactly one selected test.`);
