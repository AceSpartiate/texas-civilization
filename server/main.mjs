import { join } from 'node:path';
import { writeFileSync, readFileSync, rmSync } from 'node:fs';
import { createClassroom, PACES } from './app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { resolveDataDir, resolveSavePath, joinCandidates } from './deployment.mjs';

const port = Number(process.env.PORT || 1835);
const { dir: dataDir, origin } = resolveDataDir();
const savePath = resolveSavePath(dataDir);
const joinUrls = joinCandidates(port);
let stopping = false;
async function shutdown(reason) {
  if (stopping) return;
  stopping = true;
  console.log(`Stopping the classroom server (${reason}). The last checkpoint is kept.`);
  try { await app.close(); } catch (error) { console.error('Shutdown problem:', error.message); }
  // Clear the launcher's record of this process, but only when it describes us, so a
  // reopened launcher never has to reason about a server that has already exited.
  const record = join(dataDir, 'launcher-process.json');
  try { if (JSON.parse(readFileSync(record, 'utf8')).processId === process.pid) rmSync(record, { force: true }); } catch { /* not launcher-started */ }
  process.exit(0);
}
const app = createClassroom({
  seed: process.env.SEED || 'gonzales-1835', playerCount: Number(process.env.PLAYERS || 15),
  // A settler walks three miles an hour whatever this is; this decides only how many
  // real minutes a class spends watching that. `PACES.study` makes the walk look like a
  // walk and the slice fill a class period; TICK_MS still overrides it for development.
  tickMs: Number(process.env.TICK_MS || PACES.study), savePath, joinUrls, // MAP=colonies starts classes on the real land of the colonies (docs/COLONIES.md); unset, the invented Gonzales country.
  worldFactory: (seed, playerCount) => createGonzalesWorld(seed, playerCount, { map: process.env.MAP || 'gonzales' }),
  onStopRequested: () => shutdown('Host requested a graceful stop'),
});
await app.listen(port);
const hostUrl = `http://localhost:${port}/host#${app.state.hostKey}`;
writeFileSync(join(dataDir, 'host-url.txt'), hostUrl);
console.log(`Texas Revolution PROTOTYPE. Host: ${hostUrl}\nJoin: ${joinUrls[0]?.url || `http://localhost:${port}/`}\nData (${origin}): ${dataDir}\nSave: ${savePath}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
