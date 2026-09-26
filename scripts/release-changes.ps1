# The small update's half of packaging: a release's list of files and its sets of changes.
#
# Dot-sourced by scripts/package.ps1 (and by scripts/verify-delta-update.ps1, which proves it).
# What the launcher does with these is launcher/DeltaUpdate.cs; the two sides share exactly one
# contract, the list:
#
#   {"format": 1, "release": "<tag>", "launcher": "<LauncherId>",
#    "files": [{"path": "server/main.mjs", "size": 1234, "sha256": "<lower-case hex>"}, ...]}
#
# `format` is the oldest updater that can read it. `launcher` is the SHA-256 of the launcher's
# sources (Get-LauncherId), which is also stamped into the setup program. The list sits in the
# package as release-manifest.json and on the release as TexasRevolution-manifest.json, the same
# bytes in both places; it never lists itself or the launcher executable.
#
# A set of changes, TexasRevolution-Changes-From-<tag>.patch, is a zip of the files whose hash
# differs from that earlier release's list, at their relative paths. The name deliberately does
# not end in .zip: launchers from before 2026-09-16 take the release's first .zip without
# "NeedsNode" in its name as the whole game.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$script:ManifestAsset = 'TexasRevolution-manifest.json'
$script:ManifestInPackage = 'release-manifest.json'
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
    if ($relative -match '^(bin|obj)/' -or $relative -eq 'payload.zip') { continue }
    $lines.Add("$relative`t$(Get-Sha256Hex $file.FullName)")
  }
  $sorted = [string[]]$lines.ToArray()
  [Array]::Sort($sorted, [StringComparer]::Ordinal)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash($script:Utf8.GetBytes(($sorted -join "`n")))) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

# Hash every file in a staged package and write its list into it. Returns the list as an object
# (Files: path -> @{ size; sha256 }) and its bytes.
function Write-ReleaseManifest([string]$App, [string]$Tag, [string]$LauncherId) {
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
  $json = "{`n  ""format"": 1,`n  ""release"": $(ConvertTo-JsonString $Tag),`n  ""launcher"": $(ConvertTo-JsonString $LauncherId),`n  ""files"": [`n" + ($lines -join ",`n") + "`n  ]`n}`n"
  $bytes = $script:Utf8.GetBytes($json)
  [IO.File]::WriteAllBytes($inPackage, $bytes)
  [pscustomobject]@{ Release = $Tag; Launcher = $LauncherId; Files = $entries; Bytes = $bytes }
}

# Read a list written by Write-ReleaseManifest (or downloaded from a release). Null if it is not one.
function Read-ReleaseManifest([string]$Path) {
  try {
    $parsed = [IO.File]::ReadAllText($Path) | ConvertFrom-Json
    if ($parsed.format -ne 1) { return $null }
    $files = @{}
    foreach ($entry in $parsed.files) { $files[[string]$entry.path] = [pscustomobject]@{ size = [long]$entry.size; sha256 = ([string]$entry.sha256).ToLowerInvariant() } }
    [pscustomobject]@{ Release = [string]$parsed.release; Launcher = [string]$parsed.launcher; Files = $files }
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

# Zip the changed files at their relative paths, forward slashes. Returns the paths it holds.
function New-ReleasePatch([string]$App, $Manifest, $Base, [string]$OutFile) {
  $paths = Get-ChangedPaths $Manifest $Base
  if (Test-Path -LiteralPath $OutFile) { Remove-Item -LiteralPath $OutFile -Force }
  $zip = [IO.Compression.ZipFile]::Open($OutFile, [IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($path in $paths) {
      [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $App $path.Replace('/', '\')), $path, [IO.Compression.CompressionLevel]::Optimal)
    }
  } finally { $zip.Dispose() }
  , $paths
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
# release in $BaseFiles that had the same launcher, newest first, until the sets together would
# outweigh the whole-game archive.
#
# ceiling: a set of changes goes back only as far as that budget, and at most -PatchBases (20)
# published releases - about three days of releases at this project's pace. Changes accumulate, so older
# bases give bigger sets, and a release that changes a lot of art stops the list early; a launcher
# further behind takes the whole download, as every launcher did before 2026-09-26. Chaining sets
# release to release would reach further for less upload, at the price of several downloads and
# a launcher that walks older releases.
function Write-ReleaseChanges([string]$App, $Manifest, [string[]]$BaseFiles, [string]$OutDir, [long]$Budget) {
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
    if ($base.Launcher -ne $Manifest.Launcher) { $made.Add([pscustomobject]@{ From = $base.Release; Skipped = 'a different launcher: those launchers take the whole setup program' }); continue }
    $out = Join-Path $OutDir "TexasRevolution-Changes-From-$($base.Release).patch"
    $paths = New-ReleasePatch $App $Manifest $base $out
    $size = (Get-Item -LiteralPath $out).Length
    if ($spent + $size -gt $Budget) {
      Remove-Item -LiteralPath $out -Force
      $made.Add([pscustomobject]@{ From = $base.Release; Skipped = "over the budget ($([math]::Round(($spent + $size) / 1MB, 1)) MB of sets against a $([math]::Round($Budget / 1MB, 1)) MB archive)" })
      break
    }
    $spent += $size
    $made.Add([pscustomobject]@{ From = $base.Release; Files = $paths.Count; Bytes = $size; Asset = (Split-Path -Leaf $out) })
  }
  , $made.ToArray()
}
