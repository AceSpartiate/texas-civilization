# Build what a teacher downloads.
#
# Three things come out of this, and a release attaches all three:
#
#   TexasRevolutionSetup.exe   the whole thing - a setup program that carries the game and
#                              becomes the launcher once it has installed it
#   ...-Gonzales-<stamp>.zip   the game with its runtime and no launcher: what an installed
#                              launcher downloads when it updates
#   ...-NeedsNode.zip          the game alone, for a machine that already has Node 22+ and
#                              somebody who would rather unzip a folder
#
# What ships is the game and the things it needs to run: the server, the simulation, the
# page, the art, the launcher scripts, and the three documents a teacher or a curious
# colleague has a real use for - where to start, how to play, and which parts of this are
# history and which are invented.
#
# What does not ship is the project's memory. The handoff, the architecture notes, the
# claim-by-claim evidence records, the roadmap and the instructions written for the models
# that work on this are all how the thing gets built; none of it helps a teacher open a
# classroom. All of it stays in the repository, which is where it belongs.
[CmdletBinding()]
param(
  [string]$Stamp = (Get-Date -Format 'yyyy-MM-dd'),
  [string]$Destination = [Environment]::GetFolderPath('Desktop'),
  # Stamped into the package so the launcher can tell whether a newer release exists.
  # Tag against tag, not version arithmetic: releases here are dated, and "is this the one
  # I installed" is the honest question, which no change of tag format can confuse.
  [string]$Tag = "v$(Get-Date -Format 'yyyy-MM-dd')",
  [switch]$SkipLauncher
)
$ErrorActionPreference = 'Stop'
if ($Stamp -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'Stamp must be a plain release identifier, not a path.' }
$root = Split-Path -Parent $PSScriptRoot
$launcherDir = Join-Path $root 'launcher'
$tempRoot = [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\')
$stage = [IO.Path]::GetFullPath((Join-Path $tempRoot "tr-package-$Stamp"))
if (-not $stage.StartsWith($tempRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Package staging escaped the temporary directory.' }
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Force $stage | Out-Null
$app = Join-Path $stage 'TexasRevolution'
New-Item -ItemType Directory -Force $app | Out-Null

# ---------------------------------------------------------------- the game itself
$ship = @(
  'server', 'sim', 'public', 'runtime',
  'package.json', 'Launch.vbs', 'Stop.vbs',
  'GAME.md', 'HISTORY.md', 'README.md'
)
foreach ($name in $ship) {
  $source = Join-Path $root $name
  if (-not (Test-Path -LiteralPath $source)) { throw "Missing $name" }
  Copy-Item -LiteralPath $source -Destination $app -Recurse -Force
}
# The launcher's own scripts, and only those: the browser proofs, the art pipeline and the
# preflight tooling are development instruments. appinfo.mjs is not optional - stop.ps1 and
# the launcher both ask it where this machine put the class data rather than guessing.
New-Item -ItemType Directory -Force (Join-Path $app 'scripts') | Out-Null
foreach ($name in @('launch.ps1', 'stop.ps1', 'appinfo.mjs')) {
  Copy-Item -LiteralPath (Join-Path $root "scripts\$name") -Destination (Join-Path $app 'scripts') -Force
}
if (-not (Test-Path -LiteralPath (Join-Path $app 'runtime\node.exe'))) { throw 'runtime/node.exe missing' }
Set-Content -LiteralPath (Join-Path $app 'release.txt') -Value $Tag -Encoding utf8 -NoNewline

# `data` is a class's own save area and must never ship with somebody else's class in it.
foreach ($forbidden in @('data', 'node_modules', 'test-results', '.git', 'tests', 'docs', 'CLAUDE.md', 'HANDOFF.md', 'TECH.md', 'VISION.md')) {
  if (Test-Path -LiteralPath (Join-Path $app $forbidden)) { throw "$forbidden must not ship" }
}

# ---------------------------------------------------------------- the update archive
# What an installed launcher downloads when it updates (launcher/Updater.cs): the game with
# its runtime, one TexasRevolution folder, no launcher. The launcher picks it out as the
# release's .zip whose name does not contain NeedsNode, so both halves of that name matter.
# The installer commit stopped producing it, and the release of 2026-09-11 went out without
# one - which left every installed copy unable to update. Attach it to every release.
$update = Join-Path $Destination "TexasRevolution-Gonzales-$Stamp.zip"
if (Test-Path -LiteralPath $update) { Remove-Item -LiteralPath $update -Force }
Compress-Archive -Path $app -DestinationPath $update -CompressionLevel Optimal

# ---------------------------------------------------------------- the setup program
# The payload is the game and never the launcher: the setup copies itself into place once
# it has unpacked, so .NET is downloaded once rather than twice. It is the update archive.
$payload = Join-Path $launcherDir 'payload.zip'
$setup = Join-Path $Destination 'TexasRevolutionSetup.exe'
if (-not $SkipLauncher) {
  if (Test-Path -LiteralPath $payload) { Remove-Item -LiteralPath $payload -Force }
  Copy-Item -LiteralPath $update -Destination $payload -Force
  Push-Location $launcherDir
  try {
    & dotnet publish -c Release -r win-x64 --self-contained true `
      -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true `
      "-p:InformationalVersion=$Tag" `
      -o bin\package -v quiet | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'The setup program did not build.' }
  } finally {
    Pop-Location
    # Removed straight away: an ordinary `dotnet build` afterwards should produce the plain
    # launcher for a working copy, not one carrying a stale game inside it.
    if (Test-Path -LiteralPath $payload) { Remove-Item -LiteralPath $payload -Force }
  }
  $built = Join-Path $launcherDir 'bin\package\TexasRevolution.exe'
  if (-not (Test-Path -LiteralPath $built)) { throw 'The setup program built but produced no exe.' }
  Copy-Item -LiteralPath $built -Destination $setup -Force
}

# ---------------------------------------------------------------- the smaller package
# No runtime and no launcher: for a machine that already has Node, using Launch.vbs as it
# always has.
Remove-Item -LiteralPath (Join-Path $app 'runtime') -Recurse -Force
$needsNode = Join-Path $Destination "TexasRevolution-Gonzales-$Stamp-NeedsNode.zip"
if (Test-Path -LiteralPath $needsNode) { Remove-Item -LiteralPath $needsNode -Force }
Compress-Archive -Path $app -DestinationPath $needsNode -CompressionLevel Optimal

Remove-Item -LiteralPath $stage -Recurse -Force
foreach ($file in @($setup, $update, $needsNode)) {
  if (Test-Path -LiteralPath $file) { '{0}  {1} MB' -f $file, [math]::Round((Get-Item -LiteralPath $file).Length / 1MB, 1) }
}
