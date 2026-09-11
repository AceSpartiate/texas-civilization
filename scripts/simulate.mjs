import { runScenario } from '../sim/headless.mjs';
const [seed = 'gonzales-1835', players = '5', strategy = 'mixed'] = process.argv.slice(2);
const { metrics } = runScenario({ seed, playerCount: Number(players), strategy });
console.log(JSON.stringify(metrics, null, 2));
if (!metrics.complete) process.exitCode = 1;
