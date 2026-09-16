// Solo Mode from a terminal: `npm run solo` (docs/DEPLOYMENT.md).
//
// Starts the solo playtest server if one is not already answering - in this terminal, so
// Ctrl+C stops it - deals a new solo game, and opens the player's page already joined, with
// the class running. `-- --no-open` prints the address instead of opening a browser.
//
// It asks for the game over HTTP with the Host key the solo server wrote to its own folder,
// which is exactly what the launcher's Play solo button does, so the two cannot drift.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { appRoot, soloPaths } from '../server/deployment.mjs';

const { dir, port } = soloPaths();
const origin = `http://127.0.0.1:${port}`;
const open = !process.argv.includes('--no-open');

async function health() {
  try {
    const response = await fetch(`${origin}/health`, { signal: AbortSignal.timeout(1000) });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}
function hostUrl() {
  try { return readFileSync(join(dir, 'host-url.txt'), 'utf8').trim(); } catch { return null; }
}

// Every way out sets `process.exitCode` and lets the process end by itself. `process.exit()`
// straight after a fetch crashed Node 24 on Windows (0xC0000409) in the browser proof.
async function main() {
  let child = null;
  const running = await health();
  if (running && !(running.application === 'texas-revolution-foundation' && running.solo)) {
    console.error(`Port ${port} is answering, but not as a solo playtest server. Nothing was changed. Set SOLO_PORT to use another port.`);
    return 1;
  }
  if (!running) {
    child = spawn(process.execPath, [join(appRoot(), 'server', 'main.mjs'), '--solo'], { stdio: 'inherit', env: process.env });
    child.on('exit', code => { process.exitCode = code ?? 0; });
    // Ctrl+C reaches the server too, which saves and exits; this process leaves when it does.
    process.on('SIGINT', () => {});
  }

  // Retried rather than read once: a server that has just started may not have written its
  // Host key yet, and a key left by an earlier solo server is refused until it has.
  const deadline = Date.now() + 60000;
  let game = null, lastError = 'the solo server did not answer';
  while (Date.now() < deadline) {
    const url = hostUrl(), key = url?.split('#')[1];
    if (key && (await health())?.solo) {
      try {
        const response = await fetch(`${origin}/api/solo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
        const answer = await response.json();
        if (response.ok) { game = { ...answer, hostUrl: url }; break; }
        lastError = answer.error;
      } catch (error) { lastError = error.message; }
    }
    if (child && child.exitCode !== null) break;
    await delay(250);
  }
  if (!game) {
    console.error(`Could not start a solo game: ${lastError}`);
    child?.kill();
    return 1;
  }
  console.log(`SOLO PLAY: ${game.playUrl}\nSOLO HOST: ${game.hostUrl}\n(The play link works once; run npm run solo again for a new game.)`);
  if (open) {
    const [command, args] = process.platform === 'win32' ? ['explorer.exe', [game.playUrl]]
      : process.platform === 'darwin' ? ['open', [game.playUrl]] : ['xdg-open', [game.playUrl]];
    try { spawn(command, args, { detached: true, stdio: 'ignore' }).unref(); } catch { /* the address is printed above */ }
  }
  // With a server of its own, this stays until the server exits; without, it is done.
  return child ? undefined : 0;
}
const code = await main();
if (code !== undefined) process.exitCode = code;
