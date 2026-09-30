// The small setup a teacher can email (TexasRevolutionWebSetup.exe, websetup/, docs/DEPLOYMENT.md "The small setup"),
// built and run against a release served from this computer. Nothing is fetched from GitHub and nothing is installed:
// the "full setup" it downloads is a stand-in that writes down how it was started and closes.
//
//   node scripts/verify-web-setup.mjs [--evidence docs/evidence/web-setup.json] [--shots docs/evidence/web-setup]
//
// One PASS or FAIL line per check; exits non-zero on any FAIL. scripts/web-setup-injections.mjs breaks the small
// setup one way at a time and checks that the check written for that break, and only it, fails.
import http from 'node:http';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = name => { const at = argv.indexOf(name); return at >= 0 ? argv[at + 1] : null; };
const evidencePath = option('--evidence');
const shotsDir = option('--shots');
/** The owner asked for a file small enough to email; well under a megabyte is the promise. */
const LIMIT = 1024 * 1024;

const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tr-websetup-'));
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail: ok ? undefined : detail }); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
/** A picture of one process's window as Windows draws it, cropped to the window's frame. */
const SHOT = String.raw`param([int]$Id, [string]$Path)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class Shot {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr h, int attr, out RECT r, int size);
  public static void Save(IntPtr h, string path) {
    RECT w; GetWindowRect(h, out w);
    RECT f; if (DwmGetWindowAttribute(h, 9, out f, Marshal.SizeOf(typeof(RECT))) != 0) f = w;
    using (var all = new Bitmap(w.Right - w.Left, w.Bottom - w.Top)) {
      using (var g = Graphics.FromImage(all)) { var dc = g.GetHdc(); PrintWindow(h, dc, 2); g.ReleaseHdc(dc); }
      var crop = new Rectangle(f.Left - w.Left, f.Top - w.Top, f.Right - f.Left, f.Bottom - f.Top);
      using (var part = all.Clone(crop, all.PixelFormat)) part.Save(path, ImageFormat.Png);
    }
  }
}
'@
[Shot]::SetProcessDPIAware() | Out-Null
$p = Get-Process -Id $Id
for ($i = 0; $i -lt 50 -and $p.MainWindowHandle -eq 0; $i++) { Start-Sleep -Milliseconds 100; $p.Refresh() }
if ($p.MainWindowHandle -eq 0) { throw 'The window never appeared.' }
[Shot]::Save($p.MainWindowHandle, $Path)
`;
const same = (a, b) =>path.resolve(a).replace(/[\\/]+$/, '').toLowerCase() === path.resolve(b).replace(/[\\/]+$/, '').toLowerCase();

// ------------------------------------------------------------------ build it
const exe = path.join(scratch, 'TexasRevolutionWebSetup.exe');
const built = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts', 'build-web-setup.ps1'), '-Out', exe], { encoding: 'utf8' });
if (built.status !== 0 || !fs.existsSync(exe)) {
  console.log(`BUILD FAILED\n${built.stdout}\n${built.stderr}`);
  process.exit(2);
}
const exeSize = fs.statSync(exe).size;
check('size: the small setup is under 1 MB', exeSize < LIMIT, `${exeSize} bytes`);

// ------------------------------------------------------------------ the stand-in for the full setup
// A real Windows program, so starting it proves the start; padded past a megabyte so a download can be cut part way.
const csc = path.join(process.env.WINDIR, 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
const fakeSource = path.join(scratch, 'FakeSetup.cs');
const fakeExe = path.join(scratch, 'FakeSetup.exe');
fs.writeFileSync(fakeSource, String.raw`
using System; using System.IO; using System.Reflection; using System.Threading; using System.Windows.Forms;
// A window, as the real setup has: the small setup hides when it appears, and must still wait for it to close.
class Stand : Form { protected override bool ShowWithoutActivation { get { return true; } } }
static class FakeSetup {
  static string Q(string s) { return "\"" + s.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\""; }
  static long Now() { return (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds; }
  static int Main(string[] args) {
    var exe = Assembly.GetExecutingAssembly().Location;
    var dir = Path.GetDirectoryName(exe);
    var marker = Environment.GetEnvironmentVariable("TR_FAKE_SETUP_MARKER");
    File.WriteAllText(marker, "{\"path\":" + Q(exe) + ",\"args\":[" + string.Join(",", Array.ConvertAll(args, Q)) + "],\"cwd\":" + Q(Environment.CurrentDirectory)
      + ",\"serverBeside\":" + (Directory.Exists(Path.Combine(dir, "server")) ? "true" : "false") + ",\"startedAt\":" + Now() + "}");
    // Open for longer than the small setup keeps trying to delete a file in use (5 s): it has to wait for this to close.
    var window = new Stand { Text = "Stand-in setup", StartPosition = FormStartPosition.Manual, Left = 0, Top = 0, Width = 320, Height = 120 };
    var timer = new System.Windows.Forms.Timer { Interval = 6500 };
    timer.Tick += delegate { window.Close(); };
    timer.Start();
    Application.Run(window);
    File.WriteAllText(marker + ".end", Now().ToString());
    return 0;
  }
}`);
const compiled = spawnSync(csc, ['/nologo', '/target:winexe', '/r:System.Windows.Forms.dll', `/out:${fakeExe}`, fakeSource], { encoding: 'utf8' });
if (compiled.status !== 0) { console.log(`STAND-IN DID NOT BUILD\n${compiled.stdout}`); process.exit(2); }
const setupBytes = Buffer.concat([fs.readFileSync(fakeExe), randomBytes(1_500_000)]);
const decoyBytes = Buffer.concat([Buffer.from('MZ'), randomBytes(200_000)]);    // the small setup itself, in the release's list
const notAProgram = Buffer.concat([Buffer.from('MZ'), randomBytes(300_000)]);    // looks like one to the checks; Windows will not start it

// ------------------------------------------------------------------ a release, served from this computer
let scenario = {};
let requests = [];
let served = 0;
const server = http.createServer((req, res) => {
  requests.push({ url: req.url, range: req.headers.range ?? null });
  if (req.url === '/api') return scenario.api(req, res);
  if (req.url === '/latest/TexasRevolutionSetup.exe') return scenario.fallback ? scenario.fallback(req, res) : redirect(res, '/blob/setup');
  if (req.url === '/release/TexasRevolutionSetup.exe') return redirect(res, '/blob/setup');
  if (req.url === '/release/TexasRevolutionWebSetup.exe') return redirect(res, '/blob/decoy');
  if (req.url === '/release/not-a-program/TexasRevolutionSetup.exe') return serve(req, res, notAProgram);
  if (req.url === '/blob/setup') return scenario.blob ? scenario.blob(req, res) : serve(req, res, setupBytes);
  if (req.url === '/blob/decoy') return serve(req, res, decoyBytes);
  res.writeHead(404).end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const closedPort = await new Promise(resolve => { const s = net.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });

function redirect(res, where) { res.writeHead(302, { Location: where }); res.end(); }
/** Bytes with Range, as GitHub's download servers answer; `dropAt` cuts the first whole-file answer off part way. */
function serve(req, res, bytes, { dropAt = 0, type = 'application/octet-stream' } = {}) {
  const m = /^bytes=(\d+)-$/.exec(req.headers.range ?? '');
  const start = m ? Number(m[1]) : 0;
  if (m && start >= bytes.length) { res.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` }); return res.end(); }
  const body = bytes.subarray(start);
  res.writeHead(m ? 206 : 200, { 'Content-Type': type, 'Content-Length': body.length, ...(m ? { 'Content-Range': `bytes ${start}-${bytes.length - 1}/${bytes.length}` } : {}) });
  if (dropAt && !m) { served += dropAt; res.write(body.subarray(0, dropAt), () => setTimeout(() => res.socket.destroy(), 50)); return; }
  served += body.length;
  res.end(body);
}
const asset = (name, url, bytes, over = {}) => ({ name, browser_download_url: base + url, size: bytes.length, digest: `sha256:${sha(bytes)}`, ...over });
const release = (...assets) => (req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ tag_name: 'v-test', name: 'test', html_url: `${base}/page`, assets })); };
const broken = (req, res) => { res.writeHead(500).end(); };
const normal = release(asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes), asset('TexasRevolution-Gonzales-test.zip', '/release/zip', Buffer.alloc(10)));
// The small setup is listed first, as GitHub may list it: only the exact name may be taken.
const withSmall = release(asset('TexasRevolutionWebSetup.exe', '/release/TexasRevolutionWebSetup.exe', decoyBytes), asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes),
  asset('TexasRevolution-Gonzales-test.zip', '/release/zip', Buffer.alloc(10)));

// ------------------------------------------------------------------ run it
let run = 0;
function runSetup(next, { extra = [], api = `${base}/api`, fallback = `${base}/latest/TexasRevolutionSetup.exe`, unattended = true, timeout = 120_000 } = {}) {
  scenario = next; requests = []; served = 0;
  const folder = path.join(scratch, `download ${++run}`);   // a space in the path, as a profile may have
  const marker = path.join(scratch, `marker-${run}.json`);
  const args = ['--test-api', api, '--test-fallback', fallback, '--test-folder', folder, ...(unattended ? ['--test-unattended'] : []), ...extra];
  const child = spawn(exe, args, { cwd: scratch, env: { ...process.env, TR_FAKE_SETUP_MARKER: marker }, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  const began = Date.now();
  child.stderr.on('data', chunk => { stderr += chunk; });
  const done = new Promise(resolve => {
    const timer = setTimeout(() => { child.kill(); }, timeout);
    child.on('exit', code => {
      clearTimeout(timer);
      const leftover = fs.existsSync(folder) ? fs.readdirSync(folder) : [];
      const closed = fs.existsSync(`${marker}.end`) ? Number(fs.readFileSync(`${marker}.end`, 'utf8')) : null;
      resolve({ code, ms: Date.now() - began, stderr: stderr.trim(), endedAt: Date.now(), folder, leftover, marker: fs.existsSync(marker) ? JSON.parse(fs.readFileSync(marker, 'utf8')) : null, closed, requests: [...requests], served });
    });
  });
  return { child, done, folder, stderrNow: () => stderr };
}
const said = r => `exit ${r.code} after ${(r.ms / 1000).toFixed(1)} s${r.stderr ? ` (${r.stderr})` : ''}, stand-in ${r.marker ? 'ran' : 'did not run'}, left ${JSON.stringify(r.leftover)}`;

if (!shotsDir) {
  const ok = await runSetup({ api: normal }).done;
  check('launch: it is started as a double-click would: no arguments, in its own folder, with no game beside it',
    ok.marker && ok.marker.args.length === 0 && same(ok.marker.cwd, ok.folder) && same(ok.marker.path, path.join(ok.folder, 'TexasRevolutionSetup.exe')) && ok.marker.serverBeside === false,
    JSON.stringify(ok.marker));
  check('cleanup: once the full setup has closed, and not before, the download is removed',
    ok.code === 0 && ok.closed && ok.endedAt >= ok.closed && ok.leftover.length === 0 && !fs.existsSync(ok.folder),
    `${said(ok)}; the stand-in ${ok.closed ? `closed ${ok.endedAt - ok.closed} ms before` : 'had not closed'}`);

  const picked = await runSetup({ api: withSmall }).done;
  check('api-asset: the release\'s TexasRevolutionSetup.exe is found by its exact name, and the small setup beside it is not taken',
    picked.code === 0 && picked.marker && !picked.requests.some(r => r.url.includes('decoy') || r.url.includes('WebSetup')) && picked.requests.some(r => r.url === '/release/TexasRevolutionSetup.exe'), said(picked));

  const viaFallback = await runSetup({ api: broken }).done;
  check('fallback: with the release\'s list unreachable, the stable latest-release address is downloaded and run',
    viaFallback.code === 0 && viaFallback.marker && viaFallback.requests.some(r => r.url === '/latest/TexasRevolutionSetup.exe'), said(viaFallback));

  const cut = Math.floor(setupBytes.length * 0.4);
  const resumed = await runSetup({ api: normal, blob: (req, res) => serve(req, res, setupBytes, { dropAt: cut }) }).done;
  const ranges = resumed.requests.filter(r => r.url === '/blob/setup').map(r => r.range);
  check('resume: a connection cut off part way is resumed from where it stopped, not begun again',
    resumed.code === 0 && resumed.marker && ranges.some(range => range && Number(/bytes=(\d+)-/.exec(range)?.[1]) > 0) && resumed.served < setupBytes.length * 1.5,
    `${said(resumed)}; ranges ${JSON.stringify(ranges)}; served ${resumed.served} of ${setupBytes.length}`);

  const wrongSize = await runSetup({ api: release(asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes, { size: setupBytes.length + 1 })) }).done;
  check('size-mismatch: a download that is not the size the release gives is refused, not run, and not kept',
    wrongSize.code === 13 && !wrongSize.marker && wrongSize.leftover.length === 0, said(wrongSize));

  const wrongHash = await runSetup({ api: release(asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes, { digest: `sha256:${sha(decoyBytes)}` })) }).done;
  check('digest-mismatch: a download whose SHA-256 is not GitHub\'s record of the setup is refused, not run, and not kept',
    wrongHash.code === 13 && !wrongHash.marker && wrongHash.leftover.length === 0, said(wrongHash));

  const filtered = await runSetup({ api: broken, fallback: (req, res) => serve(req, res, Buffer.from('<html><body>Blocked by your school</body></html>'), { type: 'text/html; charset=utf-8' }) }).done;
  check('filter-page: a network filter\'s page in place of the file is said to be the network, and nothing is run',
    filtered.code === 11 && !filtered.marker, said(filtered));

  const full = await runSetup({ api: release(asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes, { size: 2 ** 50 })) }).done;
  check('disk-full: a download the disk cannot hold is refused before it starts, as not enough room',
    full.code === 12 && !full.requests.some(r => r.url.startsWith('/blob') || r.url.startsWith('/release')), said(full));

  const blocked = await runSetup({ api: release(asset('TexasRevolutionSetup.exe', '/release/not-a-program/TexasRevolutionSetup.exe', notAProgram)) }).done;
  check('blocked: a downloaded setup Windows will not start is reported as that, and kept for IT to allow',
    blocked.code === 14 && !blocked.marker && blocked.leftover.includes('TexasRevolutionSetup.exe'), said(blocked));

  const nowhere = `http://127.0.0.1:${closedPort}`;
  const unreachable = await runSetup({}, { api: `${nowhere}/api`, fallback: `${nowhere}/setup` }).done;
  check('unreachable: on the internet but unable to reach the download is said as that',
    unreachable.code === 11 && !unreachable.marker, said(unreachable));
  const offline = await runSetup({}, { api: `${nowhere}/api`, fallback: `${nowhere}/setup`, extra: ['--test-offline'] }).done;
  check('offline: with Windows saying there is no internet, it says the computer is not connected',
    offline.code === 10 && !offline.marker, said(offline));

  // .invalid never resolves (RFC 2606), so even a broken build sends nothing off this computer.
  const elsewhere = await runSetup({ api: normal }, { api: 'http://example.invalid/api' }).done;
  const stray = await new Promise(resolve => { const c = spawn(exe, ['--anything'], { stdio: 'ignore' }); c.on('exit', resolve); });
  check('test-only: the download address can be changed only for a test, and only to this computer',
    elsewhere.code === 64 && elsewhere.requests.length === 0 && stray === 64, `example.invalid: ${said(elsewhere)}; --anything: exit ${stray}`);
} else {
  await takeShots(shotsDir);
}

server.close();
try { fs.rmSync(scratch, { recursive: true, force: true }); } catch { /* Windows empties TEMP in time */ }
for (const result of results) console.log(result.ok ? `PASS ${result.name}` : `FAIL ${result.name} -- ${result.detail}`);
console.log(`small setup: ${exeSize} bytes (${(exeSize / 1024).toFixed(1)} KB)`);
console.log(`${results.filter(r => r.ok).length} of ${results.length} passed`);
if (evidencePath) {
  fs.writeFileSync(path.join(root, evidencePath), `${JSON.stringify({
    recordedAt: new Date().toISOString(), machine: 'development computer', script: 'scripts/verify-web-setup.mjs',
    smallSetupBytes: exeSize, limitBytes: LIMIT, standInSetupBytes: setupBytes.length,
    checks: results.map(({ name, ok, detail }) => ({ name, ok, ...(detail ? { detail } : {}) })),
  }, null, 2)}\n`);
}
process.exit(results.every(r => r.ok) ? 0 : 1);

// ------------------------------------------------------------------ pictures of the window
/** The window in each state a teacher can see, drawn by Windows itself (PrintWindow), to docs/evidence. */
async function takeShots(dir) {
  const out = path.resolve(root, dir);
  fs.mkdirSync(out, { recursive: true });
  const nowhere = `http://127.0.0.1:${closedPort}`;
  const big = 479_117_312;   // about the size of today's full setup, so the window says what a teacher will see
  // Slowly, about 6 MB a second, for a picture of the window part way through.
  const slowly = (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': big });
    const chunk = Buffer.alloc(600 * 1024);
    const tick = () => { if (!res.destroyed) res.write(chunk, () => setTimeout(tick, 100)); };
    tick();
  };
  const shotScript = path.join(scratch, 'shot.ps1');
  fs.writeFileSync(shotScript, SHOT);
  const states = [
    ['downloading', { api: release({ name: 'TexasRevolutionSetup.exe', browser_download_url: `${base}/blob/setup`, size: big }), blob: slowly }, {}, 7000],
    ['unreachable', {}, { api: `${nowhere}/api`, fallback: `${nowhere}/setup` }],
    ['no-internet', {}, { api: `${nowhere}/api`, fallback: `${nowhere}/setup`, extra: ['--test-offline'] }],
    ['disk-full', { api: release(asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes, { size: 2 ** 50 })) }, {}],
    ['damaged', { api: release(asset('TexasRevolutionSetup.exe', '/release/TexasRevolutionSetup.exe', setupBytes, { size: setupBytes.length + 1 })) }, {}],
    ['blocked', { api: release(asset('TexasRevolutionSetup.exe', '/release/not-a-program/TexasRevolutionSetup.exe', notAProgram)) }, {}],
  ];
  for (const [name, next, where, after] of states) {
    const running = runSetup(next, { ...where, unattended: false });
    const started = Date.now();
    // An error is written to stderr as the window shows it; the download is pictured part way.
    while (Date.now() - started < 60_000 && !(after ? Date.now() - started > after : running.stderrNow().includes(':'))) await new Promise(r => setTimeout(r, 200));
    await new Promise(r => setTimeout(r, 600));
    const file = path.join(out, `web-setup-${name}.png`);
    const shot = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', shotScript, '-Id', String(running.child.pid), '-Path', file], { encoding: 'utf8' });
    check(`shot ${name}`, shot.status === 0 && fs.existsSync(file), shot.stdout + shot.stderr);
    running.child.kill();
    await running.done;
  }
}
