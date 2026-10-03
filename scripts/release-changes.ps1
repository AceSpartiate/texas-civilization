# The small update's half of packaging: a release's list of files and its sets of changes.
#
# Dot-sourced by scripts/package.ps1 (and by scripts/verify-delta-update.ps1, which proves it).
# What the launcher does with these is launcher/DeltaUpdate.cs; the two sides share exactly one
# contract, the list:
#
#   {"format": 1, "release": "<tag>", "launcher": "<LauncherId>",
#    "launcherExe": {"size": 91234567, "sha256": "<lower-case hex>"},
#    "files": [{"path": "server/main.mjs", "size": 1234, "sha256": "<lower-case hex>"}, ...]}
#
# `format` is the oldest updater that can read it. `launcher` is the SHA-256 of the launcher's
# sources (Get-LauncherId), which is also stamped into the launcher. `launcherExe` (from
# 2026-10-03) is the release's plain launcher - the launcher with no game in it, which the setup
# program installs - by size and hash; it has no path, because it only ever goes to
# TexasRevolution.exe. Additive, so `format` stays 1: a launcher from before reads past it. The
# list sits in the package as release-manifest.json and on the release as
# TexasRevolution-manifest.json, the same bytes in both places; `files` never lists the list itself
# or the launcher.
#
# A set of changes, TexasRevolution-Changes-From-<tag>.patch, is a zip of the files whose hash
# differs from that earlier release's list, at their relative paths. When the earlier release had
# another launcher, the set also carries the plain launcher as TexasRevolution.exe and is named
# TexasRevolution-Launcher-And-Changes-From-<tag>.patch (owner, 2026-10-03: "Small launcher in
# patch") - a name a launcher from before does not read, since it would refuse the list anyway. No
# name ends in .zip: launchers from before 2026-09-16 take the release's first .zip without
# "NeedsNode" in its name as the whole game.
#
# The setup program (New-SetupProgram) is the plain launcher with the game zip appended and a
# trailer (launcher/SetupLayout.cs): the launcher a set of changes carries is byte for byte the
# head of the setup program.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$script:ManifestAsset = 'TexasRevolution-manifest.json'
$script:ManifestInPackage = 'release-manifest.json'
$script:LauncherExeName = 'TexasRevolution.exe'
$script:SetupMagic = 'TXREV-SETUP-1'
$script:Utf8 = New-Object Text.UTF8Encoding $false

function Get-Sha256Hex([string]$Path) {
  $sha = [Security.Cryptography.SHA256]::Create()
  $stream = [IO.File]::OpenRead($Path)
  try { return ([BitConverter]::ToString($sha.ComputeHash($stream)) -replace '-', '').ToLowerInvariant() }
  finally { $stream.Dispose(); $sha.Dispose() }
}

function ConvertTo-JsonString([string]$Text) {
  $builder = New-Object Text.StringBuilder
  [void]$builder.Append('"')
  foreach ($ch in $Text.ToCharArray()) {
    switch ($ch) {
      '"' { [void]$builder.Append('\"') }
      '\' { [void]$builder.Append('\\') }
      default { if ([int]$ch -lt 32) { [void]$builder.AppendFormat('\u{0:x4}', [int]$ch) } else { [void]$builder.Append($ch) } }
    }
  }
  [void]$builder.Append('"')
  $builder.ToString()
}

# Which launcher the setup program carries: a hash over every source file of launcher/, by path
# and content. The same sources give the same id on any machine with the same line endings.
function Get-LauncherId([string]$LauncherDir) {
  $base = [IO.Path]::GetFullPath($LauncherDir).TrimEnd('\') + '\'
  $lines = New-Object System.Collections.Generic.List[string]
  foreach ($file in Get-ChildItem -LiteralPath $LauncherDir -Recurse -File) {
    $relative = $file.FullName.Substring($base.Length).Replace('\', '/')
    if ($relative -match '^(bin|obj)/' -or $relative -in @('payload.zip', 'payload-launcher.exe')) { continue }
    $lines.Add("$relative`t$(Get-Sha256Hex $file.FullName)")
  }
  $sorted = [string[]]$lines.ToArray()
  [Array]::Sort($sorted, [StringComparer]::Ordinal)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash($script:Utf8.GetBytes(($sorted -join "`n")))) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

# Hash every file in a staged package and write its list into it, with the plain launcher's size
# and hash when one was built. Returns the list as an object (Files: path -> @{ size; sha256 },
# LauncherExe: @{ size; sha256 } or $null) and its bytes.
function Write-ReleaseManifest([string]$App, [string]$Tag, [string]$LauncherId, [string]$LauncherExe) {
  $base = [IO.Path]::GetFullPath($App).TrimEnd('\') + '\'
  $inPackage = Join-Path $App $script:ManifestInPackage
  if (Test-Path -LiteralPath $inPackage) { Remove-Item -LiteralPath $inPackage -Force }
  $entries = @{}
  foreach ($file in Get-ChildItem -LiteralPath $App -Recurse -File) {
    $relative = $file.FullName.Substring($base.Length).Replace('\', '/')
    $entries[$relative] = [pscustomobject]@{ size = $file.Length; sha256 = (Get-Sha256Hex $file.FullName) }
  }
  $paths = [string[]]@($entries.Keys)
  [Array]::Sort($paths, [StringComparer]::Ordinal)
  $lines = foreach ($path in $paths) {
    '    {"path": ' + (ConvertTo-JsonString $path) + ', "size": ' + $entries[$path].size + ', "sha256": "' + $entries[$path].sha256 + '"}'
  }
  $exe = $null
  $exeLine = ''
  if ($LauncherExe) {
    $exe = [pscustomobject]@{ size = (Get-Item -LiteralPath $LauncherExe).Length; sha256 = (Get-Sha256Hex $LauncherExe) }
    $exeLine = "`n  ""launcherExe"": {""size"": $($exe.size), ""sha256"": ""$($exe.sha256)""},"
  }
  $json = "{`n  ""format"": 1,`n  ""release"": $(ConvertTo-JsonString $Tag),`n  ""launcher"": $(ConvertTo-JsonString $LauncherId),$exeLine`n  ""files"": [`n" + ($lines -join ",`n") + "`n  ]`n}`n"
  $bytes = $script:Utf8.GetBytes($json)
  [IO.File]::WriteAllBytes($inPackage, $bytes)
  [pscustomobject]@{ Release = $Tag; Launcher = $LauncherId; LauncherExe = $exe; Files = $entries; Bytes = $bytes }
}

# Read a list written by Write-ReleaseManifest (or downloaded from a release). Null if it is not one.
function Read-ReleaseManifest([string]$Path) {
  try {
    $parsed = [IO.File]::ReadAllText($Path) | ConvertFrom-Json
    if ($parsed.format -ne 1) { return $null }
    $files = @{}
    foreach ($entry in $parsed.files) { $files[[string]$entry.path] = [pscustomobject]@{ size = [long]$entry.size; sha256 = ([string]$entry.sha256).ToLowerInvariant() } }
    # A list from before 2026-10-03 has no launcherExe: its launcher cannot take a new one from a set of changes.
    $exe = $null
    if ($parsed.PSObject.Properties['launcherExe'] -and $null -ne $parsed.launcherExe) { $exe = [pscustomobject]@{ size = [long]$parsed.launcherExe.size; sha256 = ([string]$parsed.launcherExe.sha256).ToLowerInvariant() } }
    [pscustomobject]@{ Release = [string]$parsed.release; Launcher = [string]$parsed.launcher; LauncherExe = $exe; Files = $files }
  } catch { return $null }
}

# The files of $Manifest (staged at $App) that $Base does not already have byte for byte.
function Get-ChangedPaths($Manifest, $Base) {
  $changed = foreach ($path in $Manifest.Files.Keys) {
    $old = $Base.Files[$path]
    if ($null -eq $old -or $old.sha256 -ne $Manifest.Files[$path].sha256 -or $old.size -ne $Manifest.Files[$path].size) { $path }
  }
  $sorted = [string[]]@($changed | Where-Object { $_ })
  [Array]::Sort($sorted, [StringComparer]::Ordinal)
  , $sorted
}

# Zip the changed files at their relative paths, forward slashes - and, given $LauncherExe, the plain
# launcher as TexasRevolution.exe. Returns the paths it holds.
function New-ReleasePatch([string]$App, $Manifest, $Base, [string]$OutFile, [string]$LauncherExe) {
  $paths = Get-ChangedPaths $Manifest $Base
  if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force }
  $zip = [IO.Compression.ZipFile]::Open($OutFile, [IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($path in $paths) {
      [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $App $path.Replace('/', '\')), $path, [IO.Compression.CompressionLevel]::Optimal)
    }
    if ($LauncherExe) {
      # Already a compressed single-file bundle: stored, not squeezed again for nothing.
      [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $LauncherExe, $script:LauncherExeName, [IO.Compression.CompressionLevel]::NoCompression)
      $paths = [string[]]@($paths) + $script:LauncherExeName
    }
  } finally { $zip.Dispose() }
  , $paths
}

# The setup program: the plain launcher, then the game zip, then a 32-byte trailer - "TXREV-SETUP-1"
# padded with zeros to 16 bytes and the two lengths as little-endian int64 (launcher/SetupLayout.cs
# reads it). Windows and .NET run it as the launcher; the bytes after the bundle are never read.
function New-SetupProgram([string]$Launcher, [string]$Payload, [string]$OutFile) {
  $launcherLength = (Get-Item -LiteralPath $Launcher).Length
  $payloadLength = (Get-Item -LiteralPath $Payload).Length
  $trailer = New-Object byte[] 32
  $magic = [Text.Encoding]::ASCII.GetBytes($script:SetupMagic)
  [Array]::Copy($magic, $trailer, $magic.Length)
  [Array]::Copy([BitConverter]::GetBytes([long]$launcherLength), 0, $trailer, 16, 8)
  [Array]::Copy([BitConverter]::GetBytes([long]$payloadLength), 0, $trailer, 24, 8)
  if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force }
  $out = [IO.File]::Open($OutFile, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write)
  try {
    foreach ($part in @($Launcher, $Payload)) {
      $in = [IO.File]::OpenRead($part)
      try { $in.CopyTo($out, 1MB) } finally { $in.Dispose() }
    }
    $out.Write($trailer, 0, $trailer.Length)
  } finally { $out.Dispose() }
  if ((Get-Item -LiteralPath $OutFile).Length -ne $launcherLength + $payloadLength + 32) { throw 'The setup program came out the wrong length.' }
}

# A tag as something that sorts: every run of digits padded, so .10 comes after .9.
function Get-TagOrder([string]$Tag) { [regex]::Replace($Tag, '\d+', { param($m) $m.Value.PadLeft(10, '0') }) }

# The published releases' lists, newest first, downloaded with gh into $Folder\<tag>\. Releases
# from before lists existed simply have none. Nothing is uploaded or changed on GitHub.
function Save-PublishedManifests([string]$Repo, [int]$Limit, [string]$Folder) {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Write-Warning 'gh is not installed, so no sets of changes are made; every launcher will take the whole download.'; return @() }
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $tags = @(& gh release list -R $Repo --limit $Limit --json tagName --jq '.[].tagName' 2>$null)
    if ($LASTEXITCODE -ne 0) { Write-Warning 'gh could not list the published releases, so no sets of changes are made.'; return @() }
    $found = foreach ($tag in $tags) {
      $into = Join-Path $Folder $tag
      & gh release download $tag -R $Repo -p $script:ManifestAsset -D $into --clobber 2>$null | Out-Null
      $file = Join-Path $into $script:ManifestAsset
      if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $file)) { $file }
    }
    return @($found)
  } finally {
    $ErrorActionPreference = $previous
    # A release with no list is the normal case, not a failure of the packaging run.
    $global:LASTEXITCODE = 0
  }
}

# Write the release's list beside the other downloads and one set of changes from each earlier
# release in $BaseFiles, newest first, until the sets together would outweigh the whole-game
# archive. From an earlier release with the same launcher, the changed files; from one with another
# launcher whose own list names its launcher file (so its launcher can take a new one, 2026-10-03),
# the changed files and $LauncherExe; from one with another launcher and no such entry, nothing -
# that launcher refuses the list by its launcher id and takes the whole setup program, so a set
# would be about 90 MB of upload nobody could use.
#
# ceiling: a set that carries the launcher carries all of it, about 90 MB, once per earlier release,
# so a launcher change spends the budget after about six earlier releases and the ones before them
# take the whole setup program. One launcher asset shared by every set would reach all twenty for
# 90 MB of upload; it is worth it if launcher changes are found coming often enough that classrooms
# more than six releases behind keep paying 690 MB.
#
# ceiling: a set of changes goes back only as far as that budget, and at most -PatchBases (20)
# published releases - about three days of releases at this project's pace. Changes accumulate, so older
# bases give bigger sets, and a release that changes a lot of art stops the list early; a launcher
# further behind takes the whole download, as every launcher did before 2026-09-26. Chaining sets
# release to release would reach further for less upload, at the price of several downloads and
# a launcher that walks older releases.
function Write-ReleaseChanges([string]$App, $Manifest, [string[]]$BaseFiles, [string]$OutDir, [long]$Budget, [string]$LauncherExe) {
  if (Test-Path -LiteralPath $OutDir) { Remove-Item -LiteralPath $OutDir -Recurse -Force }
  New-Item -ItemType Directory -Force $OutDir | Out-Null
  [IO.File]::WriteAllBytes((Join-Path $OutDir $script:ManifestAsset), $Manifest.Bytes)
  $bases = @(foreach ($file in $BaseFiles) { $read = Read-ReleaseManifest $file; if ($null -ne $read) { $read } }) |
    Sort-Object -Property @{ Expression = { Get-TagOrder $_.Release } } -Descending
  $spent = 0L
  $made = New-Object System.Collections.Generic.List[object]
  $seen = @{}
  foreach ($base in $bases) {
    if ($seen.ContainsKey($base.Release) -or $base.Release -eq $Manifest.Release) { continue }
    $seen[$base.Release] = $true
    $carry = $null
    $name = "TexasRevolution-Changes-From-$($base.Release).patch"
    if ($base.Launcher -ne $Manifest.Launcher) {
      if ($null -eq $base.LauncherExe) { $made.Add([pscustomobject]@{ From = $base.Release; Skipped = 'a launcher from before 2026-10-03, which cannot take a new launcher from a set of changes: it takes the whole setup program' }); continue }
      if (-not $LauncherExe -or $null -eq $Manifest.LauncherExe) { $made.Add([pscustomobject]@{ From = $base.Release; Skipped = 'a different launcher, and no plain launcher was built to carry (-SkipLauncher): it takes the whole setup program' }); continue }
      $carry = $LauncherExe
      $name = "TexasRevolution-Launcher-And-Changes-From-$($base.Release).patch"
    }
    $out = Join-Path $OutDir $name
    $paths = New-ReleasePatch $App $Manifest $base $out $carry
    $size = (Get-Item -LiteralPath $out).Length
    if ($spent + $size -gt $Budget) {
      Remove-Item -LiteralPath $out -Force
      $made.Add([pscustomobject]@{ From = $base.Release; Skipped = "over the budget ($([math]::Round(($spent + $size) / 1MB, 1)) MB of sets against a $([math]::Round($Budget / 1MB, 1)) MB archive)" })
      break
    }
    $spent += $size
    $made.Add([pscustomobject]@{ From = $base.Release; Files = $paths.Count; Bytes = $size; Asset = (Split-Path -Leaf $out); Launcher = [bool]$carry })
  }
  , $made.ToArray()
}
