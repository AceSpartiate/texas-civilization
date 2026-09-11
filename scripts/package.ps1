# Build the two teacher packages.
#
# What ships is the game and the things it needs to run: the server, the simulation, the
# page, the art, the launcher, and the two documents a teacher or a curious colleague has
# a real use for - how to play, and which parts of this are history and which are invented.
#
# What does not ship is the project's memory. The handoff, the architecture notes, the
# claim-by-claim evidence records, the roadmap and the instructions written for the models
# that work on this are all how the thing gets built; none of it helps a teacher open a
# classroom, and several megabytes of it in a download is just noise in front of the door.
# All of it stays in the repository, which is where it belongs.
[CmdletBinding()]
param(
  [string]$Stamp = (Get-Date -Format 'yyyy-MM-dd'),
  [string]$Destination = [Environment]::GetFolderPath('Desktop')
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$stage = Join-Path $env:TEMP "tr-package-$Stamp"
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Force $stage | Out-Null
$app = Join-Path $stage 'TexasRevolution'
New-Item -ItemType Directory -Force $app | Out-Null

# Runtime, in the order a class needs it.
$ship = @(
  'server', 'sim', 'public', 'runtime',
  'package.json', 'Launch.vbs', 'Stop.vbs',
  'GAME.md', 'HISTORY.md', 'README.md'
)
foreach ($name in $ship) {
  $source = Join-Path $root $name
  if (-not (Test-Path -LiteralPath $source)) {
    if ($name -eq 'runtime') { continue }   # the NeedsNode build has none
    throw "Missing $name"
  }
  Copy-Item -LiteralPath $source -Destination $app -Recurse -Force
}
# The launcher's own scripts, and only those: the browser proofs, the art pipeline and the
# preflight tooling are development instruments.
New-Item -ItemType Directory -Force (Join-Path $app 'scripts') | Out-Null
foreach ($name in @('launch.ps1', 'stop.ps1')) {
  Copy-Item -LiteralPath (Join-Path $root "scripts\$name") -Destination (Join-Path $app 'scripts') -Force
}
if (-not (Test-Path -LiteralPath (Join-Path $app 'runtime\node.exe'))) { throw 'runtime/node.exe missing' }

# `data` is a class's own save area and must never ship with somebody else's class in it.
foreach ($forbidden in @('data', 'node_modules', 'test-results', '.git', 'tests', 'docs', 'CLAUDE.md', 'HANDOFF.md', 'TECH.md', 'VISION.md')) {
  if (Test-Path -LiteralPath (Join-Path $app $forbidden)) { throw "$forbidden must not ship" }
}

$selfContained = Join-Path $Destination "TexasRevolution-Gonzales-$Stamp.zip"
if (Test-Path -LiteralPath $selfContained) { Remove-Item -LiteralPath $selfContained -Force }
Compress-Archive -Path $app -DestinationPath $selfContained -CompressionLevel Optimal

Remove-Item -LiteralPath (Join-Path $app 'runtime') -Recurse -Force
$needsNode = Join-Path $Destination "TexasRevolution-Gonzales-$Stamp-NeedsNode.zip"
if (Test-Path -LiteralPath $needsNode) { Remove-Item -LiteralPath $needsNode -Force }
Compress-Archive -Path $app -DestinationPath $needsNode -CompressionLevel Optimal

Remove-Item -LiteralPath $stage -Recurse -Force
foreach ($zip in @($selfContained, $needsNode)) {
  '{0}  {1} MB' -f $zip, [math]::Round((Get-Item -LiteralPath $zip).Length / 1MB, 1)
}
