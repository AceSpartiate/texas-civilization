# Proves the small update end to end on this computer, against real packages and a stand-in for
# GitHub (launcher/DeltaUpdate.cs, scripts/release-changes.ps1).
#
# Two consecutive builds are packaged with scripts/package.ps1 exactly as a release is: A is this
# working copy plus one file B no longer ships; B is this working copy with one small change to
# server/main.mjs and one new file. B's sets of changes are made against A's list. The release
# assets are served by scripts/support/release-server.mjs on 127.0.0.1, answering GitHub's
# latest-release endpoint and download URLs. A is installed with its own setup program
# (--extract), a class save is put in its data folder, and the *installed* launcher runs
# `--update --release-api <local>` - the Update button's code without the window. Then:
#
#   changes      only the list and the set of changes are downloaded; the installed tree is byte
#                for byte a fresh install of B (the launcher aside, which the small update keeps);
#                the save is untouched; the file B dropped is gone
#   tampered     a set of changes whose file does not hash as listed -> the whole download
#   cut-off      a set of changes whose connection drops half way -> the whole download
#   no-set       a release with no set of changes from A -> the whole download
#   no-list      a release with no list -> the whole download
#   all-cut      no set of changes and the whole download dropping half way -> the update fails
#                and A is exactly as it was
#   old-launcher (with -OldSetup) the published launcher from before this change takes B through
#                its own path, the setup program, as launchers in the field will
#
# Nothing is published, pushed or fetched from the Internet. Work lives under data\ (gitignored).
[CmdletBinding()]
param(
  [string]$Work,
  [string]$Evidence,
  # runtime\ (node.exe) to package with; the main checkout's when this is a worktree.
  [string]$Runtime,
  # Reuse packages built by an earlier run in the same -Work folder.
  [switch]$Reuse,
  # A setup program from a release before this change, to show old launchers take the new release.
  [string]$OldSetup
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $Work) { $Work = Join-Path $repo 'data\delta-verification' }
$Work = [IO.Path]::GetFullPath($Work)
New-Item -ItemType Directory -Force $Work | Out-Null
$results = New-Object System.Collections.Generic.List[string]
$numbers = [ordered]@{}
function Pass([string]$Text) { $results.Add("PASS: $Text"); "PASS: $Text" }
function Hash([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash }

if (-not $Runtime) {
  $Runtime = Join-Path $repo 'runtime'
  if (-not (Test-Path -LiteralPath (Join-Path $Runtime 'node.exe'))) {
    $common = (& git -C $repo rev-parse --path-format=absolute --git-common-dir).Trim()
    $Runtime = Join-Path (Split-Path -Parent $common) 'runtime'
  }
}
if (-not (Test-Path -LiteralPath (Join-Path $Runtime 'node.exe'))) { throw "No runtime\node.exe at $Runtime; pass -Runtime." }

# ------------------------------------------------------------------ two builds, packaged
function New-Source([string]$Folder) {
  if (Test-Path -LiteralPath $Folder) { Remove-Item -LiteralPath $Folder -Recurse -Force }
  New-Item -ItemType Directory -Force (Join-Path $Folder 'scripts') | Out-Null
  foreach ($name in @('server', 'sim', 'public', 'package.json', 'Launch.vbs', 'Stop.vbs', 'GAME.md', 'HISTORY.md', 'README.md')) {
    Copy-Item -LiteralPath (Join-Path $repo $name) -Destination $Folder -Recurse -Force
  }
  foreach ($name in @('package.ps1', 'release-changes.ps1', 'launch.ps1', 'stop.ps1', 'appinfo.mjs')) {
    Copy-Item -LiteralPath (Join-Path $repo "scripts\$name") -Destination (Join-Path $Folder 'scripts') -Force
  }
  Copy-Item -LiteralPath $Runtime -Destination (Join-Path $Folder 'runtime') -Recurse -Force
  New-Item -ItemType Directory -Force (Join-Path $Folder 'launcher') | Out-Null
  foreach ($item in Get-ChildItem -LiteralPath (Join-Path $repo 'launcher') | Where-Object { $_.Name -notin @('bin', 'obj', 'payload.zip') }) {
    Copy-Item -LiteralPath $item.FullName -Destination (Join-Path $Folder 'launcher') -Recurse -Force
  }
}
function Invoke-Package([string]$Source, [string]$Stamp, [string]$Destination, [string]$Bases) {
  if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Recurse -Force }
  New-Item -ItemType Directory -Force $Destination | Out-Null
  $watch = [Diagnostics.Stopwatch]::StartNew()
  # Continue, so a line on the child's error stream is read as output rather than thrown here.
  $ErrorActionPreference = 'Continue'
  $out = & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Source 'scripts\package.ps1') -Stamp $Stamp -Tag "v-$Stamp" -Destination $Destination -BaseManifests $Bases 2>&1 | Out-String
  $ErrorActionPreference = 'Stop'
  if ($LASTEXITCODE -ne 0) { throw "Packaging $Stamp failed:`n$out" }
  "packaged v-$Stamp in $([math]::Round($watch.Elapsed.TotalMinutes, 1)) min"
  $out.Trim()
}

$relA = Join-Path $Work 'release-A'
$relB = Join-Path $Work 'release-B'
if (-not ($Reuse -and (Test-Path -LiteralPath (Join-Path $relB 'TexasRevolutionSetup.exe')))) {
  $srcA = Join-Path $Work 'source-A'
  $srcB = Join-Path $Work 'source-B'
  New-Source $srcA
  [IO.File]::WriteAllText((Join-Path $srcA 'sim\dropped-in-b.txt'), "A file release A ships and release B does not.`r`n")
  New-Source $srcB
  [IO.File]::AppendAllText((Join-Path $srcB 'server\main.mjs'), "`r`n// The one small change between release A and release B (scripts/verify-delta-update.ps1).`r`n")
  [IO.File]::WriteAllText((Join-Path $srcB 'public\delta-proof.txt'), "New in release B.`r`n")
  $noBases = Join-Path $Work 'no-bases'
  New-Item -ItemType Directory -Force $noBases | Out-Null
  Invoke-Package $srcA 'e2e.1' $relA $noBases
  $basesB = Join-Path $Work 'bases-B'
  if (Test-Path -LiteralPath $basesB) { Remove-Item -LiteralPath $basesB -Recurse -Force }
  New-Item -ItemType Directory -Force $basesB | Out-Null
  Copy-Item -LiteralPath (Join-Path $relA 'changes-e2e.1\TexasRevolution-manifest.json') -Destination (Join-Path $basesB 'v-e2e.1.json')
  Invoke-Package $srcB 'e2e.2' $relB $basesB
  Remove-Item -LiteralPath $srcA, $srcB -Recurse -Force
}
$setupA = Join-Path $relA 'TexasRevolutionSetup.exe'
$setupB = Join-Path $relB 'TexasRevolutionSetup.exe'
$manifestB = Join-Path $relB 'changes-e2e.2\TexasRevolution-manifest.json'
$patchName = 'TexasRevolution-Changes-From-v-e2e.1.patch'
$patchB = Join-Path $relB "changes-e2e.2\$patchName"
foreach ($file in @($setupA, $setupB, $manifestB, $patchB)) { if (-not (Test-Path -LiteralPath $file)) { throw "Missing $file" } }
$numbers.setupBytes = (Get-Item -LiteralPath $setupB).Length
$numbers.updateArchiveBytes = (Get-Item -LiteralPath (Join-Path $relB 'TexasRevolution-Gonzales-e2e.2.zip')).Length
$numbers.manifestBytes = (Get-Item -LiteralPath $manifestB).Length
$numbers.patchBytes = (Get-Item -LiteralPath $patchB).Length
$numbers.listedFiles = @(([IO.File]::ReadAllText($manifestB) | ConvertFrom-Json).files).Count
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::OpenRead($patchB)
try { $numbers.patchFiles = @($zip.Entries | ForEach-Object { $_.FullName }) } finally { $zip.Dispose() }
"release B: setup $($numbers.setupBytes) bytes, list $($numbers.manifestBytes), set of changes from A $($numbers.patchBytes) ($($numbers.patchFiles -join ', '))"

# ------------------------------------------------------------------ the stand-in for GitHub
$config = Join-Path $Work 'release-server.json'
function Set-Release([string[]]$Names, [hashtable]$Files = @{}, [hashtable]$Cut = @{}) {
  $all = @{
    'TexasRevolutionSetup.exe' = $setupB
    'TexasRevolution-Gonzales-e2e.2.zip' = (Join-Path $relB 'TexasRevolution-Gonzales-e2e.2.zip')
    'TexasRevolution-Gonzales-e2e.2-NeedsNode.zip' = (Join-Path $relB 'TexasRevolution-Gonzales-e2e.2-NeedsNode.zip')
    'TexasRevolution-manifest.json' = $manifestB
    $patchName = $patchB
  }
  foreach ($key in $Files.Keys) { $all[$key] = $Files[$key] }
  $assets = @(foreach ($name in $Names) { [ordered]@{ name = $name; file = $all[$name] } })
  [IO.File]::WriteAllText($config, ([ordered]@{ tag = 'v-e2e.2'; assets = $assets; cut = $Cut } | ConvertTo-Json -Depth 4), (New-Object Text.UTF8Encoding $false))
}
$everything = @($patchName, 'TexasRevolution-manifest.json', 'TexasRevolution-Gonzales-e2e.2.zip', 'TexasRevolution-Gonzales-e2e.2-NeedsNode.zip', 'TexasRevolutionSetup.exe')
Set-Release $everything
$serverLog = Join-Path $Work 'release-server.log'
$node = Join-Path $Runtime 'node.exe'
$server = Start-Process -FilePath $node -ArgumentList @("`"$(Join-Path $repo 'scripts\support\release-server.mjs')`"", "`"$config`"") -RedirectStandardOutput $serverLog -RedirectStandardError "$serverLog.err" -PassThru -WindowStyle Hidden
try {
  $port = $null
  for ($i = 0; $i -lt 50 -and -not $port; $i++) {
    Start-Sleep -Milliseconds 200
    if ((Test-Path -LiteralPath $serverLog) -and ((Get-Content -LiteralPath $serverLog -Raw) -match 'listening (\d+)')) { $port = $Matches[1] }
  }
  if (-not $port) { throw 'The local release server did not start.' }
  $base = "http://127.0.0.1:$port"
  $api = "$base/repos/AceSpartiate/texas-civilization/releases/latest"

  function Invoke-Exe([string]$Exe, [string]$Arguments) {
    $info = [Diagnostics.ProcessStartInfo]::new($Exe, $Arguments)
    $info.UseShellExecute = $false; $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true; $info.CreateNoWindow = $true
    $process = [Diagnostics.Process]::Start($info)
    $out = $process.StandardOutput.ReadToEndAsync(); $err = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit(900000)) { $process.Kill(); throw "$Exe $Arguments did not finish" }
    @{ exit = $process.ExitCode; output = ($out.Result + $err.Result).Trim() }
  }
  function Get-Tree([string]$Root) {
    $map = @{}
    $prefix = $Root.TrimEnd('\') + '\'
    foreach ($file in Get-ChildItem -LiteralPath $Root -Recurse -File -Force) {
      $relative = $file.FullName.Substring($prefix.Length)
      if ($relative -like 'data\*') { continue }
      $map[$relative] = Hash $file.FullName
    }
    $map
  }
  function Compare-Tree([hashtable]$Got, [hashtable]$Want, [string[]]$Except = @()) {
    $differences = @()
    foreach ($key in $Want.Keys) { if ($key -in $Except) { continue }; if (-not $Got.ContainsKey($key)) { $differences += "missing $key" } elseif ($Got[$key] -ne $Want[$key]) { $differences += "differs $key" } }
    foreach ($key in $Got.Keys) { if ($key -in $Except) { continue }; if (-not $Want.ContainsKey($key)) { $differences += "extra $key" } }
    , $differences
  }
  function Install-A([string]$Name) {
    $dir = Join-Path $Work "install-$Name"
    if (Test-Path -LiteralPath $dir) { Remove-Item -LiteralPath $dir -Recurse -Force }
    $done = Invoke-Exe $setupA "--extract `"$dir`""
    if ($done.exit -ne 0) { throw "Installing A failed: $($done.output)" }
    New-Item -ItemType Directory -Force (Join-Path $dir 'data') | Out-Null
    [IO.File]::WriteAllText((Join-Path $dir 'data\classroom.json'), '{"a teacher''s class":"must survive every update"}')
    $dir
  }
  function Invoke-Update([string]$Dir) {
    Invoke-RestMethod -Method Post -Uri "$base/reset" | Out-Null
    $watch = [Diagnostics.Stopwatch]::StartNew()
    $run = Invoke-Exe (Join-Path $Dir 'TexasRevolution.exe') "--update --release-api $api --no-restart"
    $seconds = [math]::Round($watch.Elapsed.TotalSeconds, 1)
    $served = @((Invoke-RestMethod -Uri "$base/stats").served)
    $bytes = 0L; foreach ($entry in $served) { $bytes += [long]$entry.bytes }
    @{ exit = $run.exit; output = $run.output; served = $served; bytes = $bytes; seconds = $seconds }
  }
  function Get-Save([string]$Dir) { Hash (Join-Path $Dir 'data\classroom.json') }

  # The reference: B as a fresh install makes it.
  $fresh = Join-Path $Work 'fresh-B'
  if (Test-Path -LiteralPath $fresh) { Remove-Item -LiteralPath $fresh -Recurse -Force }
  $made = Invoke-Exe $setupB "--extract `"$fresh`""
  if ($made.exit -ne 0) { throw "A fresh install of B failed: $($made.output)" }
  $want = Get-Tree $fresh
  $exeA = Hash $setupA
  $exeB = Hash $setupB

  # ---------------------------------------------------------------- changes
  $dir = Install-A 'changes'
  $save = Get-Save $dir
  if (-not (Test-Path -LiteralPath (Join-Path $dir 'sim\dropped-in-b.txt'))) { throw 'A did not install the file B drops' }
  $check = Invoke-Exe (Join-Path $dir 'TexasRevolution.exe') "--check-updates --release-api $api"
  if ($check.output -notmatch 'newer=True' -or $check.output -notmatch 'changesOnly=True') { throw "The check did not offer the changes: $($check.output)" }
  $update = Invoke-Update $dir
  if ($update.exit -ne 0 -or $update.output -notmatch 'mode=changes') { throw "The small update did not happen:`n$($update.output)" }
  $numbers.changes = [ordered]@{ downloadedBytes = $update.bytes; seconds = $update.seconds; requests = @($update.served | ForEach-Object { "$($_.name) $($_.bytes)" }); output = $update.output }
  if (@($update.served | Where-Object { $_.name -like '*.exe' -or $_.name -like '*.zip' }).Count) { throw 'The small update downloaded a whole build' }
  Pass "an installed launcher updated A to B by downloading $($update.bytes) bytes (the list and the set of changes) instead of the $($numbers.setupBytes)-byte setup program - $([math]::Round($numbers.setupBytes / [math]::Max(1, $update.bytes)))x less."
  $got = Get-Tree $dir
  $differences = Compare-Tree $got $want @('TexasRevolution.exe')
  if ($differences.Count) { throw "After the small update the tree differs from a fresh install of B: $($differences -join '; ')" }
  if ($got['TexasRevolution.exe'] -ne $exeA) { throw 'The small update changed the launcher' }
  Pass "the updated tree is byte for byte a fresh install of B ($($want.Count - 1) files besides the launcher, which the small update keeps: B's launcher sources are A's)."
  if ((Get-Save $dir) -ne $save) { throw 'The small update touched the class save' }
  if (Test-Path -LiteralPath (Join-Path $dir 'sim\dropped-in-b.txt')) { throw 'The file B dropped is still there' }
  Pass 'data\classroom.json is byte for byte untouched, and sim\dropped-in-b.txt (in A, not in B) is gone.'
  $status = Invoke-Exe (Join-Path $dir 'TexasRevolution.exe') '--status'
  if ($status.output -notmatch 'release=v-e2e\.2') { throw "The updated copy does not say B: $($status.output)" }
  $again = Invoke-Update $dir
  if ($again.output -notmatch 'up to date' -or $again.bytes -ne 0) { throw "B was offered again after installing it: $($again.output)" }
  Pass 'the updated copy reports release v-e2e.2, and the next check finds it up to date and downloads nothing.'

  # ---------------------------------------------------------------- the ways it falls back
  function Test-Whole([string]$Name, [string]$Because, [string[]]$Names, [hashtable]$Files = @{}, [hashtable]$Cut = @{}, [string]$What) {
    Set-Release $Names $Files $Cut
    $dir = Install-A $Name
    $save = Get-Save $dir
    $update = Invoke-Update $dir
    if ($update.exit -ne 0 -or $update.output -notmatch 'mode=whole') { throw "$Name did not fall back to the whole download:`n$($update.output)" }
    if ($update.output -notmatch [regex]::Escape($Because)) { throw "$Name fell back for another reason:`n$($update.output)" }
    $got = Get-Tree $dir
    $differences = Compare-Tree $got $want @('TexasRevolution.exe.old')
    if ($differences.Count) { throw "$Name left a tree that differs from a fresh install of B: $($differences -join '; ')" }
    if ((Get-Save $dir) -ne $save) { throw "$Name touched the class save" }
    $numbers[$Name] = [ordered]@{ downloadedBytes = $update.bytes; seconds = $update.seconds; requests = @($update.served | ForEach-Object { "$($_.name) $($_.bytes)$(if (-not $_.complete) { ' (cut off)' })" }); because = ([regex]::Match($update.output, 'because="([^"]*)"').Groups[1].Value) }
    Pass "$What -> the whole setup program, launcher included; the tree is byte for byte a fresh install of B and the save is untouched ($($update.bytes) bytes)."
  }

  $tampered = Join-Path $Work 'tampered.patch'
  Copy-Item -LiteralPath $patchB -Destination $tampered -Force
  $zip = [IO.Compression.ZipFile]::Open($tampered, [IO.Compression.ZipArchiveMode]::Update)
  try {
    $entry = $zip.GetEntry('server/main.mjs')
    if ($null -eq $entry) { throw 'The set of changes does not carry server/main.mjs' }
    $reader = New-Object IO.StreamReader($entry.Open()); $text = $reader.ReadToEnd(); $reader.Dispose()
    $entry.Delete()
    $writer = New-Object IO.StreamWriter($zip.CreateEntry('server/main.mjs').Open(), (New-Object Text.UTF8Encoding $false))
    $writer.Write($text.Replace('one small change', 'one SMALL change')); $writer.Dispose()
  } finally { $zip.Dispose() }
  Test-Whole 'tampered' 'did not match the list of files' $everything @{ $patchName = $tampered } @{} 'a set of changes whose server/main.mjs does not hash as listed (same length, three letters changed)'
  Test-Whole 'cut-off' 'downloading the changes failed' $everything @{} @{ $patchName = [int]($numbers.patchBytes / 2) } 'a set of changes whose connection drops half way'
  Test-Whole 'no-set' 'no set of changes from v-e2e.1' @('TexasRevolution-manifest.json', 'TexasRevolution-Gonzales-e2e.2.zip', 'TexasRevolutionSetup.exe') @{} @{} 'a release with no set of changes from the installed one (too far behind)'
  Test-Whole 'no-list' 'no list of its files' @($patchName, 'TexasRevolution-Gonzales-e2e.2.zip', 'TexasRevolutionSetup.exe') @{} @{} 'a release with no list of files (every release before this change)'

  # ---------------------------------------------------------------- nothing downloads
  Set-Release @('TexasRevolution-manifest.json', 'TexasRevolution-Gonzales-e2e.2.zip', 'TexasRevolutionSetup.exe') @{} @{ 'TexasRevolutionSetup.exe' = [int]($numbers.setupBytes / 2) }
  $dir = Install-A 'all-cut'
  $before = Get-Tree $dir
  $save = Get-Save $dir
  $update = Invoke-Update $dir
  if ($update.exit -ne 1 -or $update.output -notmatch 'previous version kept') { throw "An update whose downloads all failed did not fail cleanly:`n$($update.output)" }
  $differences = Compare-Tree (Get-Tree $dir) $before
  if ($differences.Count -or (Get-Save $dir) -ne $save) { throw "A failed update changed the installation: $($differences -join '; ')" }
  $numbers['all-cut'] = [ordered]@{ downloadedBytes = $update.bytes; output = $update.output }
  Pass 'with no set of changes and the whole download cut off half way, the update fails with "previous version kept" and A is byte for byte as it was, save included.'

  # ---------------------------------------------------------------- a launcher from before
  if ($OldSetup) {
    $dir = Join-Path $Work 'install-old-launcher'
    if (Test-Path -LiteralPath $dir) { Remove-Item -LiteralPath $dir -Recurse -Force }
    $done = Invoke-Exe $OldSetup "--extract `"$dir`""
    if ($done.exit -ne 0) { throw "Installing the old release failed: $($done.output)" }
    New-Item -ItemType Directory -Force (Join-Path $dir 'data') | Out-Null
    [IO.File]::WriteAllText((Join-Path $dir 'data\classroom.json'), '{"an old class":"kept"}')
    $save = Get-Save $dir
    $old = (Get-Content -LiteralPath (Join-Path $dir 'release.txt') -Raw).Trim()
    # Its own update path: the setup program, staged with --extract and swapped (it cannot be
    # pointed at a local server, so it is handed the file its check would have downloaded).
    $update = Invoke-Exe (Join-Path $dir 'TexasRevolution.exe') "--install-update `"$setupB`" --no-restart"
    if ($update.exit -ne 0) { throw "The old launcher could not take B: $($update.output)" }
    $differences = Compare-Tree (Get-Tree $dir) $want @('TexasRevolution.exe.old')
    if ($differences.Count) { throw "The old launcher's update differs from a fresh install of B: $($differences -join '; ')" }
    if ((Get-Save $dir) -ne $save) { throw 'The old launcher touched the save' }
    $numbers.oldLauncher = [ordered]@{ from = $old; setup = $OldSetup }
    Pass "a launcher from before this change ($old) takes B through its own path, the whole setup program, and ends byte for byte a fresh install of B, launcher included; its save untouched."
  }
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}

if ($Evidence) {
  [ordered]@{
    recordedAt = [DateTime]::UtcNow.ToString('o'); machine = 'development computer (same-computer simulation)'
    script = 'scripts/verify-delta-update.ps1'; results = $results; numbers = $numbers
    note = 'Two packages built by scripts/package.ps1 from this working copy (A with one extra file, B with one small change to server/main.mjs and one new file), served from 127.0.0.1 by scripts/support/release-server.mjs in the shape of the GitHub release API. Nothing was published or fetched from GitHub. Proves the small update, its fallbacks and the swap on this computer; not a real release, a school network or a filtering proxy.'
  } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $repo $Evidence) -Encoding UTF8
}
"$($results.Count) PASS lines. Work folder: $Work"
