# Breaks the launcher's small update one way at a time and checks that the test written for that
# break - and only that test - fails (tests/launcher). A test that passes against broken code is
# not evidence; this is how each of them was seen to fail.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launcher-delta-injections.ps1 [-Evidence docs\evidence\launcher-delta-injections.json]
#
# Every source file is restored after each injection, including when the run is stopped.
[CmdletBinding()]
param([string]$Evidence)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$project = Join-Path $repo 'tests\launcher'

# Name, file, regex, replacement, the test expected to fail. The first names two: with the hash
# check gone, v1's release.txt (the same length as v2's) is kept, which the staged-build test sees too.
$injections = @(
  @('damaged installed file treated as unchanged', 'launcher\DeltaUpdate.cs', 'if \(hash != file\.Sha256\) \{ File\.Delete\(target\); needed\.Add\(file\); \}', 'if (false) { File.Delete(target); needed.Add(file); }', 'diff-needed+stage-identical'),
  @('unchanged files copied with their bytes altered', 'launcher\DeltaUpdate.cs', 'to\.Write\(buffer, 0, count\);', 'to.Write(buffer.Select(b => b == (byte)''x'' ? (byte)''y'' : b).ToArray(), 0, count);', 'stage-identical'),
  @('a changed file is not checked against its hash', 'launcher\DeltaUpdate.cs', 'if \(hash != file\.Sha256\)(\r?\n)', 'if (false)$1', 'hash-tampered'),
  @('a file missing from the set of changes is skipped', 'launcher\DeltaUpdate.cs', 'throw new DeltaUnusable\(\$"the set of changes does not include \{file\.Path\}"\);', 'continue;', 'patch-missing-file'),
  @('a damaged archive escapes as a crash', 'launcher\DeltaUpdate.cs', 'when \(error is InvalidDataException or EndOfStreamException\)', 'when (error is NotSupportedException)', 'patch-damaged'),
  @('a stray staged file is not noticed', 'launcher\DeltaUpdate.cs', 'if \(!listed\.Contains\(relative\)\) throw', 'if (false) throw', 'verify-extra'),
  @('a release without a list is tried anyway', 'launcher\DeltaUpdate.cs', 'if \(release\.ManifestUrl is null\) return', 'if (false) return', 'fallback-no-manifest'),
  @('a release without a set from here is tried anyway', 'launcher\DeltaUpdate.cs', 'if \(release\.Patches is null \|\| !release\.Patches\.ContainsKey\(installedTag\)\)', 'if (release.Patches is null)', 'fallback-no-patch'),
  @('a launcher with no id tries anyway', 'launcher\DeltaUpdate.cs', 'if \(launcherId is null\) return', 'if (false) return', 'fallback-no-launcher-id'),
  @('a list in a newer format is read as this one', 'launcher\DeltaUpdate.cs', 'if \(manifest\.Format > ReleaseManifest\.SupportedFormat\) return', 'if (false) return', 'fallback-format'),
  @('a different launcher is ignored', 'launcher\DeltaUpdate.cs', 'if \(manifest\.Launcher is null \|\| !string\.Equals\(manifest\.Launcher, launcherId, StringComparison\.OrdinalIgnoreCase\)\) return', 'if (manifest.Launcher is null) return', 'fallback-launcher'),
  @('a list for another release is accepted', 'launcher\DeltaUpdate.cs', 'if \(!string\.Equals\(manifest\.Release, expectedTag, StringComparison\.OrdinalIgnoreCase\)\) return', 'if (false) return', 'fallback-release'),
  @('the same launcher is refused (nothing ever takes the changes)', 'launcher\DeltaUpdate.cs', 'if \(manifest\.Launcher is null \|\| !string\.Equals', 'if (manifest.Launcher is not null || !string.Equals', 'accept'),
  @('the list may name the class data', 'launcher\DeltaUpdate.cs', 'return !UpdateSwap\.IsProtected\(parts\[0\]\) &&', 'return true &&', 'unsafe-paths'),
  @('top-level files v2 dropped are kept', 'launcher\DeltaUpdate.cs', 'if \(previous is null\) return Array\.Empty<string>\(\);', 'return Array.Empty<string>();', 'swap-saves-retired'),
  @('a retired file is deleted rather than kept for rollback', 'launcher\UpdateSwap.cs', 'Note\("retired:" \+ name\);', 'Delete(Path.Combine(backup, name));', 'swap-rollback'),
  @('a launch ignores an interrupted swap', 'launcher\UpdateSwap.cs', 'if \(File\.Exists\(Path\.Combine\(backup, Marker\)\)\) \{ Rollback\(target\); rolledBack = true; \}', 'if (false) { Rollback(target); rolledBack = true; }', 'interrupted-swap'),
  @('a set of changes named .zip, which old launchers take for the game', 'launcher\DeltaUpdate.cs', 'PatchSuffix = "\.patch";', 'PatchSuffix = ".zip";', 'assets'),
  @('the check promises the whole size when only the changes come', 'launcher\DeltaUpdate.cs', 'return \(patch\.Size \+ release\.ManifestSize, true\);', 'return (release.SetupSize, true);', 'estimate'),
  @('sizes under a megabyte said in megabytes', 'launcher\DeltaUpdate.cs', 'bytes < 1024 \* 1024 \?', 'bytes < 1024 ?', 'plain-sizes')
)

function Invoke-Tests {
  $output = & dotnet run --project $project -v quiet 2>&1 | Out-String
  $failed = @([regex]::Matches($output, '(?m)^FAIL ([^:]+):') | ForEach-Object { $_.Groups[1].Value })
  $passed = @([regex]::Matches($output, '(?m)^PASS ([^:]+):') | ForEach-Object { $_.Groups[1].Value })
  @{ output = $output; failed = $failed; passed = $passed }
}

$baseline = Invoke-Tests
if ($baseline.failed.Count -gt 0 -or $baseline.passed.Count -eq 0) { throw "The tests do not pass before any injection:`n$($baseline.output)" }
"baseline: $($baseline.passed.Count) pass"

$records = New-Object System.Collections.Generic.List[object]
foreach ($injection in $injections) {
  $name, $file, $pattern, $replacement, $expected = $injection
  $path = Join-Path $repo $file
  $originalBytes = [IO.File]::ReadAllBytes($path)
  $original = [IO.File]::ReadAllText($path)
  $count = [regex]::Matches($original, $pattern).Count
  if ($count -ne 1) { throw "Injection '$name' matches $count places in $file, not one." }
  try {
    [IO.File]::WriteAllText($path, [regex]::Replace($original, $pattern, $replacement), (New-Object Text.UTF8Encoding $false))
    $run = Invoke-Tests
  } finally {
    [IO.File]::WriteAllBytes($path, $originalBytes)
  }
  $want = @($expected -split '\+' | Sort-Object)
  $caught = ((@($run.failed | Sort-Object) -join '|') -eq ($want -join '|'))
  $line = if ($caught) { "caught  $name -> $expected" }
          elseif ($run.failed.Count -eq 0 -and $run.passed.Count -eq 0) { "BROKEN  $name (did not build)`n$($run.output)" }
          else { "MISSED  $name -> expected $expected, failed: $($run.failed -join ', ')" }
  $line
  $records.Add([ordered]@{ injection = $name; file = $file; expected = $expected; failed = $run.failed; caught = $caught })
}
$caughtCount = @($records | Where-Object { $_.caught }).Count
"$caughtCount of $($records.Count) injections caught by exactly the test written for them"
if ($Evidence) {
  [ordered]@{
    recordedAt = [DateTime]::UtcNow.ToString('o'); machine = 'development computer'
    script = 'scripts/launcher-delta-injections.ps1'; tests = 'tests/launcher (dotnet run)'
    baselinePassed = $baseline.passed.Count; caught = $caughtCount; injections = $records
  } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $repo $Evidence) -Encoding UTF8
}
if ($caughtCount -ne $records.Count) { exit 1 }
