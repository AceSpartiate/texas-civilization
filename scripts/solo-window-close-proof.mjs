// Closing Play Solo's real window (owner, 2026-09-27: "i should be able to just X off the window and it'll automatically
// save, pause, and shut down").
//
// scripts/solo-browser-proof.mjs closes the player's page in headless Chrome. The owner plays in the launcher's own window -
// launcher/TeacherWindow.cs, a WinForms form holding a WebView2 - and whether *that* ends the page's event stream when its X is
// pressed is a fact about WebView2, not about Chrome. So this compiles the launcher's TeacherWindow.cs and Branding.cs,
// unchanged, into a small host of its own (scripts/support/solo-window-harness.cs: the window opened exactly as
// LauncherForm.PlaySoloAsync opens it, under an application that stays running after it closes, as the launcher's main window
// does), and drives three ways out against the real `server/main.mjs --solo`:
//
// - x-button: WM_SYSCOMMAND/SC_CLOSE posted to the window - what its title bar's X sends - with the application left running;
// - process-killed: the whole process ended by `taskkill /F`, as a crash or Task Manager would;
// - application-exit: the application ending with the window still open, as closing the launcher does (told to on stdin).
//
// Each: the game paused on the disk within the server's wait, the server stopping itself (exit 0, lock released), and Play
// Solo's list offering the game again, paused. Not LauncherForm itself: running that from a scratch folder rewrites the real
// installation's Start menu shortcut and install stamp (launcher/Shortcuts.cs), so it is not driven here.
//
// Same computer only; needs the .NET SDK and the WebView2 runtime. Run: npm run test:solo-window
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve('.');
const pass = [];
const ok = label => { pass.push(label); console.log('PASS', label); };

// ------------------------------------------------------------------ the launcher's window, compiled unchanged
const build = mkdtempSync(join(tmpdir(), 'texas-solo-window-'));
writeFileSync(join(build, 'SoloWindowHarness.csproj'), `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType><TargetFramework>net7.0-windows</TargetFramework><UseWindowsForms>true</UseWindowsForms>
    <Nullable>enable</Nullable><ImplicitUsings>enable</ImplicitUsings><RootNamespace>TexasRevolution.Launcher</RootNamespace>
    <AssemblyName>SoloWindowHarness</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2210.55" />
    <Compile Include="${join(root, 'launcher', 'TeacherWindow.cs')}" Link="TeacherWindow.cs" />
    <Compile Include="${join(root, 'launcher', 'Branding.cs')}" Link="Branding.cs" />
    <Compile Include="${join(root, 'scripts', 'support', 'solo-window-harness.cs')}" Link="Harness.cs" />
  </ItemGroup>
</Project>
`);
execFileSync('dotnet', ['build', join(build, 'SoloWindowHarness.csproj'), '-c', 'Debug', '-o', join(build, 'out'), '-nologo', '-v', 'q'], { stdio: 'inherit' });
const harness = join(build, 'out', 'SoloWindowHarness.exe');
assert.ok(existsSync(harness), 'the window harness did not build');
ok('launcher/TeacherWindow.cs and launcher/Branding.cs compile unchanged into the window harness');

// ------------------------------------------------------------------ the real solo server
const freePort = () => new Promise(done => { const probe = createServer().listen(0, '127.0.0.1', () => { const { port } = probe.address(); probe.close(() => done(port)); }); });
const dataDir = mkdtempSync(join(tmpdir(), 'texas-solo-window-data-'));
const port = await freePort();
const leaveMs = 3000;
const env = { ...process.env, TEXAS_DATA_DIR: dataDir, SOLO_PORT: String(port), PLAYERS: '5', SOLO_LEAVE_MS: String(leaveMs), TICK_MS: '400' };
delete env.SAVE_PATH; delete env.PORT;
const origin = `http://127.0.0.1:${port}`;
const live = join(dataDir, 'solo', 'classroom.json');
const onDisk = () => JSON.parse(readFileSync(live, 'utf8'));
async function call(path, body, cookie) {
  const response = await fetch(`${origin}${path}`, { method: body ? 'POST' : 'GET', redirect: 'manual', headers: { ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) }, ...(body && { body: JSON.stringify(body) }) });
  const text = await response.text();
  let json = null; try { json = JSON.parse(text); } catch { /* a redirect */ }
  return { status: response.status, body: json, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
/** Start the solo server and ask it for its games, as the launcher's Play Solo does. */
async function startServer() {
  const child = spawn(process.execPath, ['server/main.mjs', '--solo'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = ''; child.stdout.on('data', chunk => { out += chunk; }); child.stderr.on('data', chunk => { out += chunk; });
  child.output = () => out;
  for (const end = Date.now() + 60000; Date.now() < end && child.exitCode === null;) {
    await delay(250);
    try {
      const key = readFileSync(join(dataDir, 'solo', 'host-url.txt'), 'utf8').trim().split('#')[1];
      const listed = await call('/api/solo/games', { key });
      if (listed.status === 200) return { child, key, games: listed.body.games };
    } catch { /* not up yet */ }
  }
  throw new Error(`server/main.mjs --solo did not start:\n${out}`);
}
const exited = async (child, ms) => { for (const end = Date.now() + ms; Date.now() < end && child.exitCode === null;) await delay(100); return child.exitCode; };
const hostCookie = async key => (await call('/api/host', { key })).cookie;
const here = async host => (await call('/api/state', null, host)).body?.presence?.here;

const results = [];
let server = null, window = null;
try {
  // A game to play: dealt, entered from here and begun, so it is running.
  server = await startServer();
  const dealt = await call('/api/solo', { key: server.key });
  const entered = await call(`/solo/enter?ticket=${new URL(dealt.body.playUrl).searchParams.get('ticket')}`);
  assert.equal((await call('/api/command', { id: 'begin-window', action: 'begin-solo' }, entered.cookie)).status, 200);
  const gameId = onDisk().sessionId;

  // The kill last: a WebView2 whose host was killed can leave the shared browser profile slow to open for the next window.
  for (const scenario of ['x-button', 'application-exit', 'process-killed']) {
    // Continue, as Play Solo's dialog does, and open it in the launcher's window.
    const answer = await call('/api/solo', { key: server.key, continue: gameId });
    assert.equal(answer.status, 200, JSON.stringify(answer.body));
    window = spawn(harness, [answer.body.playUrl, scenario === 'application-exit' ? 'exit-on-stdin' : 'stay'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let said = '', windowErr = ''; window.stdout.on('data', chunk => { said += chunk; }); window.stderr.on('data', chunk => { windowErr += chunk; });
    const host = await hostCookie(server.key);
    for (const end = Date.now() + 60000; Date.now() < end && await here(host) !== 1;) await delay(250);
    assert.equal(await here(host), 1, `${scenario}: the window never opened the player's page (window exit ${window.exitCode}): ${said}${windowErr}`);
    const opened = onDisk().world.status;
    assert.equal(opened, 'paused', `${scenario}: a continued game opened running`);
    // The player's Resume, pressed for them by the Host here; the page's own button is proved in scripts/solo-browser-proof.mjs.
    await call('/api/command', { id: `resume-${scenario}`, action: 'resume' }, host);
    const status = async () => (await call('/api/state', null, host)).body?.world?.status;
    for (const end = Date.now() + 5000; Date.now() < end && await status() !== 'running';) await delay(100);
    assert.equal(await status(), 'running', `${scenario}: the game did not run`);
    await delay(2000);
    assert.equal(server.child.exitCode, null, `${scenario}: the server stopped while the window was open`);

    let closedAt;
    if (scenario === 'x-button') {
      // What the X on the title bar sends: WM_SYSCOMMAND with SC_CLOSE, posted to the window.
      execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `
        Add-Type -Namespace SoloProof -Name User32 -MemberDefinition '[DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);'
        $handle = (Get-Process -Id ${window.pid}).MainWindowHandle
        if ($handle -eq [IntPtr]::Zero) { throw 'the window was not found' }
        if (-not [SoloProof.User32]::PostMessage($handle, 0x0112, [IntPtr]0xF060, [IntPtr]::Zero)) { throw 'the close was not posted' }`]);
      for (const end = Date.now() + 10000; Date.now() < end && !/window closed/.test(said);) await delay(50);
      closedAt = Date.parse(said.match(/window closed (\S+)/)?.[1]);
    } else if (scenario === 'process-killed') {
      execFileSync('taskkill', ['/F', '/PID', String(window.pid)]);
      closedAt = Date.now();
    } else {
      window.stdin.write('exit\n');
      assert.notEqual(await exited(window, 30000), null, 'the application did not exit');
      closedAt = Date.parse(said.match(/window closed (\S+)/)?.[1]);
    }
    assert.ok(Number.isFinite(closedAt), `${scenario}: no time for the window closing:\n${said}`);
    // When the game was written paused: the server says so, with the time, once the write has succeeded. Read from its output
    // rather than by polling the save, because a file held open for reading is exactly what makes Windows refuse the rename
    // that replaces it (seen here: EPERM, the pause then written only by the stop).
    const savedLine = () => [...server.child.output().matchAll(/the game is saved \((\w+), revision (\d+)\) at (\S+)\./g)].at(-1);
    for (const end = Date.now() + 15000; Date.now() < end && !savedLine();) await delay(100);
    const saved = savedLine();
    const pausedWritten = saved && saved[1] === 'paused' ? Date.parse(saved[3]) : null;
    const launcherStillRunning = window.exitCode === null;
    const code = await exited(server.child, leaveMs + 20000);
    const stoppedAt = Date.now();
    assert.ok(!saved || onDisk().revision >= Number(saved[2]), `${scenario}: the save on the disk is older than the one the server said it wrote`);
    const result = {
      scenario, openedStatus: opened, windowClosedAt: new Date(closedAt).toISOString(),
      pausedWrittenAfterMs: pausedWritten === null ? null : Math.round(pausedWritten - closedAt),
      serverExit: code, serverGoneWithinMs: stoppedAt - closedAt, leaveMs,
      applicationStillRunning: scenario === 'x-button' ? launcherStillRunning : undefined,
      lockLeft: existsSync(`${live}.lock`), statusOnDisk: onDisk().world.status, tickOnDisk: onDisk().world.tick,
    };
    assert.ok(result.pausedWrittenAfterMs !== null && result.pausedWrittenAfterMs < leaveMs, `${scenario}: the game was not written paused within the wait: ${JSON.stringify(result)}\n${server.child.output()}`);
    assert.equal(code, 0, `${scenario}: the solo server did not stop itself: ${JSON.stringify(result)}\n${server.child.output()}`);
    assert.equal(result.lockLeft, false, `${scenario}: the save lock was left`);
    if (scenario === 'x-button') assert.equal(launcherStillRunning, true, 'the window\'s host ended with the window, so this is not the X alone');
    if (window.exitCode === null) { try { execFileSync('taskkill', ['/F', '/PID', String(window.pid)]); } catch { /* gone */ } }
    window = null;

    // Play Solo again: the game is offered, paused, where it was.
    server = await startServer();
    const listed = server.games.find(game => game.id === gameId);
    assert.equal(listed?.status, 'paused', `${scenario}: the game is not offered again, paused`);
    result.listedAgain = listed;
    results.push(result);
    ok(`${scenario}: written paused ${result.pausedWrittenAfterMs} ms after the window closed, server gone within ${(result.serverGoneWithinMs / 1000).toFixed(1)} s (wait ${leaveMs / 1000} s), exit 0, lock released${scenario === 'x-button' ? ', the application still running' : ''}; offered again paused (${listed.date})`);
  }

  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync('docs/evidence/solo-window-close.json', `${JSON.stringify({
    record: 'solo-window-close', date: new Date().toISOString().slice(0, 10), command: 'npm run test:solo-window',
    environment: 'Same computer: launcher/TeacherWindow.cs compiled unchanged into scripts/support/solo-window-harness.cs, the installed WebView2 runtime, and server/main.mjs --solo with SOLO_LEAVE_MS=3000 in a scratch data folder.',
    checks: pass, results,
    notProved: [
      'LauncherForm itself: its Play Solo button and dialog were not pressed, because a launcher run from a scratch folder rewrites the real installation\'s shortcuts and install stamp.',
      'Windows logging off or shutting down: not driven. When the window goes first the game is written paused within the times above; when the server process is ended first it can lose up to SAVE_WITHIN_MS of play, and its save may say running - a continued game opens paused either way.',
    ],
  }, null, 2)}\n`);
  console.log(`\n${pass.length} checks passed; wrote docs/evidence/solo-window-close.json`);
} finally {
  if (window && window.exitCode === null) { try { execFileSync('taskkill', ['/F', '/PID', String(window.pid)]); } catch { /* gone */ } }
  if (server && server.child.exitCode === null) server.child.kill();
  await delay(500);
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(build, { recursive: true, force: true });
}
