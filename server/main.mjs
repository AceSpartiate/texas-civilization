import { dirname, join } from 'node:path';
import { writeFileSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { readSave, writeSave } from './storage.mjs';
import { createClassroom, EMPTY_PAUSE_MS, PACES } from './app.mjs';
import { createGonzalesWorld } from '../sim/gonzales.mjs';
import { resolveDataDir, resolveSavePath, joinCandidates, soloPaths } from './deployment.mjs';
import { createVoice } from './voice/service.mjs';
import { encodeJoin, JOIN_SITE } from '../public/join-words.js';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';

// `--solo` is Solo Mode (docs/DEPLOYMENT.md): the owner's playtest server. Its own folder, save
// and port, bound to this computer only, and no join addresses because nobody else joins.
const solo = process.argv.includes('--solo');
const paths = solo ? soloPaths() : null;
const port = solo ? paths.port : Number(process.env.PORT || 1835);
const { dir: dataDir, origin } = solo ? { dir: paths.dir, origin: 'solo' } : resolveDataDir();
const savePath = solo ? paths.savePath : resolveSavePath(dataDir);
const joinUrls = solo ? [] : joinCandidates(port);
// The live solo save is kept among the saved solo games (`data/solo/games`, server/app.mjs `soloGames`) and the server
// starts clean, so Play Solo asks whether to continue it or deal a new one - and a solo save left by an older build it
// cannot read can never refuse to start. Only when no lock says a solo server still owns it; that one refuses below.
if (solo && !existsSync(`${savePath}.lock`) && existsSync(savePath)) {
  try {
    const left = readSave(savePath);
    if (left && Object.keys(left.clients || {}).length && /^[\w-]{6,40}$/.test(left.sessionId)) writeSave(join(dirname(savePath), 'games', `${left.sessionId}.json`), { ...left, soloSavedAt: statSync(savePath).mtime.toISOString() });
  } catch (error) { console.error(`The last solo game could not be kept: ${error.message}`); }
  rmSync(savePath, { force: true });
}
// Read-aloud (owner, 2026-09-30, D15; docs/READ_ALOUD.md): the package's own sentences (public/voice/), and the voice in
// runtime/voice/ for the ones with a family's names in them, kept in the class data folder. A copy with neither reads nothing
// aloud and says so; one with only the package's reads the fixed lines.
const root = fileURLToPath(new URL('..', import.meta.url));
const voice = createVoice({
  runtimeDir: join(root, 'runtime', 'voice'), packageDir: join(root, 'public', 'voice'), cacheDir: join(dataDir, 'voice-cache'),
  // Threads for Kokoro on this computer: two, or one on a machine with four cores or fewer (docs/READ_ALOUD.md §6).
  threads: Number(process.env.VOICE_THREADS) > 0 ? Number(process.env.VOICE_THREADS) : cpus().length > 4 ? 2 : 1,
});
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
  seed: process.env.SEED || 'gonzales-1835',
  // A new class has thirty families, the class this game is built and measured for (2026-09-28, the classroom audit's B1):
  // the families no student joins are the neighbours' director's, and they are the spare families a late student joins into.
  // The teacher changes it on the Host's page in the lobby and chooses it for every New Class; PLAYERS is a developer's.
  // Play Solo keeps the fifteen it has always dealt.
  playerCount: Number(process.env.PLAYERS || (solo ? 15 : 30)),
  // A settler walks three miles an hour whatever this is; this decides only how many
  // real minutes a class spends watching that. `PACES.study` makes the walk look like a
  // walk and the slice fill a class period; TICK_MS still overrides it for development.
  tickMs: Number(process.env.TICK_MS || PACES.study), savePath, joinUrls, solo,
  // Every new class has automatic neighbours for the families nobody joins (owner, 2026-09-14; docs/COLONIES.md §5.9), and
  // starts on the real land of the colonies (docs/COLONIES.md), where the whole game lives: the winter and the spring only
  // continue there, and until 2026-09-16 the launcher's Solo Mode and a class started from it dealt the invented Gonzales
  // country and could never reach either. MAP=gonzales still starts the invented country.
  // And deals each family's start as well as its land (owner, 2026-09-29; sim/starts.mjs): Anglo-American families across the
  // colonies, a Tejano family at Victoria, and in a class of ten or more a free Black family near Liberty. STARTS=0 deals none.
  worldFactory: (seed, playerCount) => createGonzalesWorld(seed, playerCount, { map: process.env.MAP || 'colonies', neighbours: true, starts: process.env.STARTS !== '0' }),
  onStopRequested: () => shutdown('Host requested a graceful stop'),
  // A fight's fighting is never watched faster than its real-time floor, whatever the pace (owner, 2026-09-30, after the Battle of
  // Gonzales in a real class: "it happened too fast"; docs/BATTLES.md §15.1, sim/battle-stage.mjs `WATCH_SECONDS`). BATTLE_FLOORS=0
  // turns it off for a developer; nobody else needs it.
  battleFloors: process.env.BATTLE_FLOORS !== '0',
  voice,
  // Play Solo saves, pauses and stops itself when its player's page has gone (server/app.mjs `SOLO_WATCH`, owner 2026-09-27).
  // SOLO_LEAVE_MS shortens the wait after the page closes, for a browser proof; nobody else needs it.
  ...(solo && { soloWatch: Number(process.env.SOLO_LEAVE_MS) > 0 ? { leaveMs: Number(process.env.SOLO_LEAVE_MS) } : {} }),
  // A class pauses itself once no student's page has been open for three minutes (server/app.mjs `EMPTY_PAUSE_MS`, owner
  // 2026-09-29: "Pause after 3 min"). EMPTY_PAUSE_MS shortens it for a browser proof; nobody else needs it.
  ...(!solo && { emptyPauseMs: Number(process.env.EMPTY_PAUSE_MS) > 0 ? Number(process.env.EMPTY_PAUSE_MS) : EMPTY_PAUSE_MS }),
  // Real milliseconds an unanswered military question may stay open (sim/decision-budget.mjs, 90 000 by default).
  ...(Number(process.env.DECISION_BUDGET_MS) > 0 && { decisionBudgetMs: Number(process.env.DECISION_BUDGET_MS) }),
  // Real milliseconds a played family's settlement call stays open (sim/decision-budget.mjs, 300 000 by default).
  ...(Number(process.env.CALL_BUDGET_MS) > 0 && { callBudgetMs: Number(process.env.CALL_BUDGET_MS) }),
  // The real-time limits of a student's questions (sim/decision-budget.mjs `QUESTION_BUDGETS`: a rider 90 s, the order to leave
  // 3 min, ¡Alto! 30 s, the road's and work's 90 s), as JSON, e.g. QUESTION_BUDGETS_MS='{"rider":5000}', for a browser proof.
  ...(() => { try { const budgets = JSON.parse(process.env.QUESTION_BUDGETS_MS || 'null'); return budgets && typeof budgets === 'object' ? { questionBudgets: budgets } : {}; } catch { return {}; } })(),
});
await app.listen(port, solo ? '127.0.0.1' : '0.0.0.0');
// A class whose last server did not stop cleanly opened anyway, because that server had certainly gone (server/storage.mjs).
if (app.recoveredLock) console.log(`The last server on this class did not stop cleanly (${app.recoveredLock.reason}). The class was backed up${app.recoveredLock.backup ? ` to ${app.recoveredLock.backup}` : ''} and opened.`);
const hostUrl = `http://localhost:${port}/host#${app.state.hostKey}`;
writeFileSync(join(dataDir, 'host-url.txt'), hostUrl);
console.log(solo
  ? `Texas Revolution PLAY SOLO (this computer only). Host: ${hostUrl}\nNew solo game: npm run solo\nClosing the player's page saves and pauses the game, and stops this server if it does not come back.\nData: ${dataDir}\nSave: ${savePath}`
  // The join address with the class code in it (owner, 2026-09-30); a New Class deals another code, and the Host page shows it.
  // And the join words for the page at playtexas.github.io (owner, 2026-10-03; docs/HOST_PAGE.md §2.17), when the address is private.
  : `Texas Revolution PROTOTYPE. Host: ${hostUrl}\nJoin: ${(joinUrls[0]?.url || `http://localhost:${port}/`).replace(/\/$/, '')}/${app.state.sessionCode}${joinWordsLine()}\nData (${origin}): ${dataDir}\nSave: ${savePath}`);
function joinWordsLine() {
  const words = joinUrls[0] && encodeJoin({ address: joinUrls[0].address, port });
  return words ? `\nOr at ${JOIN_SITE} type: ${words.join(' ')}, then the class code ${app.state.sessionCode}` : '';
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => shutdown(signal));
