// The regressions the small setup's checks guard (scripts/verify-web-setup.mjs; websetup/), injected one at a time
// (CLAUDE.md: "A new test is not evidence until it has failed"). Each replaces one exact piece of the small setup with the
// mistake a check is written against, rebuilds and reruns every check, records which failed, and puts the file back
// byte for byte.
//
// Run: node scripts/web-setup-injections.mjs  → writes docs/evidence/web-setup-injections.json
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INJECTIONS = [
  {
    name: 'the small setup carries a picture it has no need of, and is no longer small',
    file: 'scripts/build-web-setup.ps1',
    from: '/r:System.Web.Extensions.dll `',
    to: '/r:System.Web.Extensions.dll "/resource:$(Join-Path $root \'launcher\\art\\background.png\')" `',
    guards: ['size'],
  },
  {
    name: 'any .exe in the release is taken for the whole setup - including the small installer listed first',
    file: 'websetup/Download.cs',
    from: 'if (!string.Equals(Text(entry, "name"), SetupName, StringComparison.OrdinalIgnoreCase)) continue;',
    to: 'if (!(Text(entry, "name") ?? "").EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) continue;',
    guards: ['api-asset'],
  },
  {
    name: 'the setup is started in whatever folder the small one was started from, not its own',
    file: 'websetup/Download.cs',
    from: '                WorkingDirectory = _options.Folder,\n',
    to: '',
    guards: ['launch'],
  },
  {
    name: 'the download is left behind after the setup has closed',
    file: 'websetup/SetupWindow.cs',
    from: '                _download.Remove();\n',
    to: '',
    guards: ['cleanup'],
  },
  {
    name: 'the small setup does not wait for the setup to close before tidying up and ending',
    file: 'websetup/SetupWindow.cs',
    from: '                    setup.WaitForExit();\n',
    to: '',
    guards: ['cleanup'],
  },
  {
    name: 'a release list that cannot be had is the end, with no stable address to fall back on',
    file: 'websetup/Download.cs',
    from: 'catch (Exception) { ThrowIfCancelled(); }',
    to: 'catch (Exception) { ThrowIfCancelled(); throw; }',
    guards: ['fallback'],
  },
  {
    name: 'a connection cut off part way begins again from nothing',
    file: 'websetup/Download.cs',
    from: 'if (have > 0) request.AddRange(have);',
    to: '/* no resume */',
    guards: ['resume'],
  },
  {
    name: 'a download of another size than the release gives is taken',
    file: 'websetup/Download.cs',
    from: 'if (total > 0 && announced != total)',
    to: 'if (total > 0 && announced < 0)',
    guards: ['size-mismatch'],
  },
  {
    name: 'GitHub\'s SHA-256 of the setup is not compared',
    file: 'websetup/Download.cs',
    from: 'if (hash != asset.Sha256) Refuse(',
    to: 'if (hash == null) Refuse(',
    guards: ['digest-mismatch'],
  },
  {
    name: 'a network filter\'s page is taken for the download, and called damaged rather than the network',
    file: 'websetup/Download.cs',
    from: 'if (type.StartsWith("text/", StringComparison.OrdinalIgnoreCase))',
    to: 'if (type == null)',
    guards: ['filter-page'],
  },
  {
    name: 'free space is not looked at before the download',
    file: 'websetup/Download.cs',
    from: 'if (free < bytes - partial + 64L * 1024 * 1024)',
    to: 'if (bytes < 0)',
    guards: ['disk-full'],
  },
  {
    name: 'Windows refusing to start the setup is reported as a general failure',
    file: 'websetup/Download.cs',
    from: 'throw new SetupProblem(Problem.Blocked, error.Message + " (" + error.NativeErrorCode + ")");',
    to: 'throw new SetupProblem(Problem.Failed, error.Message);',
    guards: ['blocked'],
  },
  {
    name: 'every network failure is called no internet',
    file: 'websetup/Download.cs',
    from: '                return new SetupProblem(Problem.Unreachable, error.Message);\n            }',
    to: '                return new SetupProblem(Problem.NoInternet, error.Message);\n            }',
    guards: ['unreachable'],
  },
  {
    name: 'no internet is never said, only that the download could not be reached',
    file: 'websetup/Download.cs',
    from: 'if (_options.Offline || !NetworkInterface.GetIsNetworkAvailable() || (noName && !WindowsSaysOnline()))',
    to: 'if (error == null)',
    guards: ['offline'],
  },
  {
    name: 'a test address may be anywhere, so a shortcut could point a copy at another download',
    file: 'websetup/Program.cs',
    from: '&& uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback;',
    to: ';',
    guards: ['test-only'],
  },
];

function runChecks() {
  const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'verify-web-setup.mjs')], { cwd: root, encoding: 'utf8', timeout: 15 * 60_000 });
  const output = `${run.stdout}${run.stderr}`;
  const names = kind => [...output.matchAll(new RegExp(`^${kind} ([a-z-]+):`, 'gm'))].map(m => m[1]);
  return { output, failed: names('FAIL'), passed: names('PASS'), built: !/BUILD FAILED/.test(output) };
}

const baseline = runChecks();
if (baseline.failed.length || !baseline.passed.length) { console.log(baseline.output); throw new Error('The checks do not pass before any injection.'); }
console.log(`baseline: ${baseline.passed.length} pass`);

const records = [];
for (const injection of INJECTIONS) {
  const file = path.join(root, injection.file);
  const original = readFileSync(file);
  const text = original.toString('utf8');
  const count = text.split(injection.from).length - 1;
  if (count !== 1) throw new Error(`Injection "${injection.name}" matches ${count} places in ${injection.file}, not one.`);
  let run;
  try {
    writeFileSync(file, text.replace(injection.from, injection.to));
    run = runChecks();
  } finally {
    writeFileSync(file, original);
  }
  const caught = run.built && [...run.failed].sort().join('|') === [...injection.guards].sort().join('|');
  console.log(caught ? `caught  ${injection.name} -> ${injection.guards.join('+')}`
    : !run.built ? `BROKEN  ${injection.name} (did not build)` : `MISSED  ${injection.name} -> expected ${injection.guards.join('+')}, failed: ${run.failed.join(', ') || '(none)'}`);
  records.push({ injection: injection.name, file: injection.file, expected: injection.guards, failed: run.failed, caught });
}
const caughtCount = records.filter(r => r.caught).length;
console.log(`${caughtCount} of ${records.length} injections caught by exactly the check written for them`);
writeFileSync(path.join(root, 'docs', 'evidence', 'web-setup-injections.json'), `${JSON.stringify({
  recordedAt: new Date().toISOString(), machine: 'development computer', script: 'scripts/web-setup-injections.mjs', checks: 'scripts/verify-web-setup.mjs',
  baselinePassed: baseline.passed.length, caught: caughtCount, injections: records,
}, null, 2)}\n`);
process.exit(caughtCount === records.length ? 0 : 1);
