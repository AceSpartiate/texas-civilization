import { join } from 'node:path';
import { writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { createClassroom, PACES } from './app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { resolveDataDir, resolveSavePath, joinCandidates, soloPaths } from './deployment.mjs';

// `--solo` is Solo Mode (docs/DEPLOYMENT.md): the owner's playtest server. Its own folder, save
// and port, bound to this computer only, and no join addresses because nobody else joins.
const solo = process.argv.includes('--solo');
const paths = solo ? soloPaths() : null;
const port = solo ? paths.port : Number(process.env.PORT || 1835);
const { dir: dataDir, origin } = solo ? { dir: paths.dir, origin: 'solo' } : resolveDataDir();
const savePath = solo ? paths.savePath : resolveSavePath(dataDir);
const joinUrls = solo ? [] : joinCandidates(port);
// A solo save is a scratch pad: every Play solo deals a new game, so the last one is not
// reopened - which also means a solo save left by an older build can never refuse to start.
// Only when no lock says a solo server still owns it; that one refuses to start below.
if (solo && !existsSync(`${savePath}.lock`)) rmSync(savePath, { force: true });
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
  tickMs: Number(process.env.TICK_MS || PACES.study), savePath, joinUrls, solo,
  // Every new class has automatic neighbours for the families nobody joins (owner, 2026-09-14; docs/COLONIES.md §5.9), and
  // starts on the real land of the colonies (docs/COLONIES.md), where the whole game lives: the winter and the spring only
  // continue there, and until 2026-09-16 the launcher's Solo Mode and a class started from it dealt the invented Gonzales
  // country and could never reach either. MAP=gonzales still starts the invented country.
  worldFactory: (seed, playerCount) => createGonzalesWorld(seed, playerCount, { map: process.env.MAP || 'colonies', neighbours: true }),
  onStopRequested: () => shutdown('Host requested a graceful stop'),
});
await app.listen(port, solo ? '127.0.0.1' : '0.0.0.0');
const hostUrl = `http://localhost:${port}/host#${app.state.hostKey}`;
writeFileSync(join(dataDir, 'host-url.txt'), hostUrl);
console.log(solo
  ? `Texas Revolution SOLO PLAYTEST (this computer only). Host: ${hostUrl}\nNew solo game: npm run solo\nData: ${dataDir}\nSave: ${savePath}`
  : `Texas Revolution PROTOTYPE. Host: ${hostUrl}\nJoin: ${joinUrls[0]?.url || `http://localhost:${port}/`}\nData (${origin}): ${dataDir}\nSave: ${savePath}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
