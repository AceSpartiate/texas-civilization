# Build what a teacher downloads.
#
# These come out of this, and a release attaches all of them:
#
#   TexasRevolutionSetup.exe   the whole thing - the plain launcher with the game appended
#                              (launcher/SetupLayout.cs), which installs the game and the plain
#                              launcher; what an installed launcher downloads when the small update
#                              cannot be used - so this name always means the whole setup
#   TexasRevolutionInstaller.exe  the small setup (websetup/), about 170 KB, to email to a colleague:
#                              it downloads the latest TexasRevolutionSetup.exe and runs it
#   ...-Gonzales-<stamp>.zip   the game with its runtime and no launcher: what launchers from
#                              before 2026-09-16 download when they update
#   ...-NeedsNode.zip          the game alone, for a machine that already has Node 22+ and
#                              somebody who would rather unzip a folder
#   changes-<stamp>\           the small update (scripts/release-changes.ps1, launcher/DeltaUpdate.cs):
#     TexasRevolution-manifest.json                 every shipped file's path, size and SHA-256
#     TexasRevolution-Changes-From-<tag>.patch      the files changed since each recent release
#                                                   that had the same launcher
#     TexasRevolution-Launcher-And-Changes-From-<tag>.patch   the same plus the plain launcher (about
#                                                   90 MB), from each recent release with another
#                                                   launcher that can take one (from 2026-10-03)
#   TexasRevolution-Launcher-<stamp>.exe   the plain launcher on its own, the head of the setup and
#                              what those sets carry. Kept here to look at; not attached to a release.
#
# The sets of changes are made against the published releases' lists, fetched with gh (read
# only), or against the lists in -BaseManifests. Without either, the release still ships and
# every launcher takes the whole download, as before.
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
  [switch]$SkipLauncher,
  # Earlier releases' lists to make sets of changes from (any *.json under this folder). When
  # absent, the latest -PatchBases published releases' lists are fetched with gh.
  [string]$BaseManifests,
  [int]$PatchBases = 20,
  [string]$Repo = 'AceSpartiate/texas-civilization'
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'release-changes.ps1')
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

# ---------------------------------------------------------------- the art as WebP
# Owner, 2026-09-29 (triage D14, "All to WebP"): the page loads WebP made from the PNG masters, which a class of thirty
# Chromebooks downloads at a fraction of the PNG's size. Made here (scripts/build-webp.mjs, Python with Pillow) where they
# are missing or out of date - they are not committed - and checked: a package never ships a sheet whose WebP is not the
# one made from its PNG.
$node = Join-Path $root 'runtime\node.exe'
if (-not (Test-Path -LiteralPath $node)) { $node = 'node' }
& $node (Join-Path $root 'scripts\build-webp.mjs')
if ($LASTEXITCODE -ne 0) { throw 'The WebP copies of the art could not be made (npm run build:webp).' }
& $node (Join-Path $root 'scripts\build-webp.mjs') --check | Select-Object -Last 1
if ($LASTEXITCODE -ne 0) { throw 'A picture has no current WebP (npm run build:webp -- --check).' }

# ---------------------------------------------------------------- the voice that reads aloud
# Owner, 2026-09-30 (D15, docs/READ_ALOUD.md): natural voices, never the stock one. Two halves, both checked here:
#   runtime\voice\  Kokoro-82M and the programs that run it (scripts/bundle-voice.mjs, like node.exe: fetched, not in git),
#                   which the Host uses for the sentences with a family's names in them;
#   public\voice\   every fixed sentence of the game spoken once, here, at package time (scripts/build-voice.mjs; made, not
#                   in git, like the WebP art), so a class never waits for a tip, a call or the timeline's news.
# A package never ships a voice that does not match its record, or text the voice has not spoken.
& $node (Join-Path $root 'scripts\bundle-voice.mjs') --check
if ($LASTEXITCODE -ne 0) { throw 'The read-aloud voice is missing or altered in runtime\voice (node scripts/bundle-voice.mjs).' }
& $node (Join-Path $root 'scripts\build-voice.mjs')
if ($LASTEXITCODE -ne 0) { throw 'The fixed sentences could not all be spoken (npm run build:voice).' }
& $node (Join-Path $root 'scripts\build-voice.mjs') --check
if ($LASTEXITCODE -ne 0) { throw 'A fixed sentence has no current speech (npm run build:voice -- --check).' }

# ---------------------------------------------------------------- the game itself
$ship = @(
  'server', 'sim', 'public', 'runtime',
  'package.json', 'Launch.vbs', 'Stop.vbs',
  'GAME.md', 'HISTORY.md', 'README.md', 'TEACHER.md'
)
foreach ($name in $ship) {
  $source = Join-Path $root $name
  if (-not (Test-Path -LiteralPath $source)) { throw "Missing $name" }
  Copy-Item -LiteralPath $source -Destination $app -Recurse -Force
}
# The SVG sources of Claude's temporary art (public/assets/claude-standins/svg/, tens of megabytes) are what
# `npm run build:standins` rasterises into the PNG sheets the page loads; nothing at run time reads them, so they stay home.
$claudeSources = Join-Path $app 'public\assets\claude-standins\svg'
if (Test-Path -LiteralPath $claudeSources) { Remove-Item -LiteralPath $claudeSources -Recurse -Force }
if (@(Get-ChildItem -LiteralPath (Join-Path $app 'public') -Recurse -Force -Filter '*.svg' | Where-Object { $_.FullName -like '*claude-standins*' }).Count -ne 0) { throw 'Claude art SVG sources must not ship' }
# The PNG of every picture that has its WebP stays home (triage D14): the page asks only for the WebP, and the server answers a
# stray request for the PNG with it (server/delivery.mjs `pictureFor`). The record ships, since the server reads it.
$assetsInPackage = Join-Path $app 'public\assets'
$webpRecord = Get-Content -LiteralPath (Join-Path $assetsInPackage 'webp\record.json') -Raw | ConvertFrom-Json
$pngsLeft = 0
foreach ($made in $webpRecord.pictures.PSObject.Properties) {
  if (-not (Test-Path -LiteralPath (Join-Path $assetsInPackage $made.Name))) { throw "$($made.Name) is recorded but not in the package" }
  $png = Join-Path $assetsInPackage ($made.Name.Substring('webp/'.Length) -replace '\.webp$', '.png')
  if (Test-Path -LiteralPath $png) { Remove-Item -LiteralPath $png -Force; $pngsLeft++ }
}
"$pngsLeft PNG masters left home for their WebP"
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
# One development document does ship, and only one (2026-09-28, docs/audits/2026-09-28-classroom.md B5): recovery. The
# launcher's message for a class that will not start names docs/RECOVERY.md, and README.md sends a teacher there, so it has
# to be in the installed copy. Copied after the check above, which still refuses the rest of `docs`.
New-Item -ItemType Directory -Force (Join-Path $app 'docs') | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'docs\RECOVERY.md') -Destination (Join-Path $app 'docs') -Force
if (@(Get-ChildItem -LiteralPath (Join-Path $app 'docs') -Recurse -Force).Count -ne 1) { throw 'Only docs\RECOVERY.md ships from docs' }

# ---------------------------------------------------------------- the plain launcher
# The launcher with no game in it (owner, 2026-10-03: "Small launcher in patch"): about 90 MB,
# mostly .NET. It is what the setup program installs, the head of the setup program itself, and
# what a set of changes carries when the launcher changes - so a launcher change costs about 90 MB
# instead of the whole setup program. Built before the list, which records its size and hash.
$launcherId = Get-LauncherId $launcherDir
$plainLauncher = $null
if (-not $SkipLauncher) {
  # A payload.zip left by a packaging run from before 2026-10-03 is no longer read by the project;
  # removed anyway, so nothing that looks like a game sits beside the sources.
  $stalePayload = Join-Path $launcherDir 'payload.zip'
  if (Test-Path -LiteralPath $stalePayload) { Remove-Item -LiteralPath $stalePayload -Force }
  $published = Join-Path $launcherDir 'bin\package'
  if (Test-Path -LiteralPath $published) { Remove-Item -LiteralPath $published -Recurse -Force }
  Push-Location $launcherDir
  try {
    & dotnet publish -c Release -r win-x64 --self-contained true `
      -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true `
      "-p:InformationalVersion=$Tag" "-p:LauncherId=$launcherId" `
      -o bin\package -v quiet | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'The launcher did not build.' }
  } finally { Pop-Location }
  $built = Join-Path $published 'TexasRevolution.exe'
  if (-not (Test-Path -LiteralPath $built)) { throw 'The launcher built but produced no exe.' }
  $plainLauncher = Join-Path $stage 'TexasRevolution.exe'
  Copy-Item -LiteralPath $built -Destination $plainLauncher -Force
  # It must carry no game: a launcher with a trailer would install as a setup program.
  $probe = [IO.File]::OpenRead($plainLauncher)
  try { $tail = New-Object byte[] 13; [void]$probe.Seek(-32, 'End'); [void]$probe.Read($tail, 0, 13) } finally { $probe.Dispose() }
  if ([Text.Encoding]::ASCII.GetString($tail) -eq $script:SetupMagic) { throw 'The plain launcher carries a game.' }
}

# ---------------------------------------------------------------- the list of files
# Last thing written into the package, so it lists everything else in it. The launcher's id and
# the plain launcher's size and hash go into it: a set of changes between releases with the same
# launcher keeps the running one, and between releases with different launchers carries this one.
$manifest = Write-ReleaseManifest $app $Tag $launcherId $plainLauncher

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
# The plain launcher with the game appended (launcher/SetupLayout.cs, 2026-10-03): .NET is in the
# download once, and the setup installs the plain launcher - never itself, game and all, as it did
# until 2026-10-03. The game it carries is the update archive.
$setup = Join-Path $Destination 'TexasRevolutionSetup.exe'
$plainCopy = Join-Path $Destination "TexasRevolution-Launcher-$Stamp.exe"
if (-not $SkipLauncher) {
  New-SetupProgram $plainLauncher $update $setup
  Copy-Item -LiteralPath $plainLauncher -Destination $plainCopy -Force
}

# ---------------------------------------------------------------- the small setup
# TexasRevolutionInstaller.exe (websetup/, owner 2026-09-30): about 170 KB, the file a teacher emails to a colleague. It
# downloads the latest release's TexasRevolutionSetup.exe and runs it. Built with the C# compiler inside Windows'
# own .NET Framework, so it needs no SDK - and it is built even with -SkipLauncher, because it carries no game.
# Attached to every release, so releases/latest/download/TexasRevolutionInstaller.exe always answers.
$installer = Join-Path $Destination 'TexasRevolutionInstaller.exe'
& (Join-Path $PSScriptRoot 'build-web-setup.ps1') -Out $installer -Tag $Tag | Out-Null
if ((Get-Item -LiteralPath $installer).Length -ge 1MB) { throw 'The small setup is a megabyte or more; it is meant to be emailed.' }

# ---------------------------------------------------------------- the small update
# The list, and a set of changes from each recent release with the same launcher. Before the
# smaller package below, because that one drops the runtime the list names.
$changes = Join-Path $Destination "changes-$Stamp"
$bases = @()
if ($BaseManifests) {
  $bases = @(Get-ChildItem -LiteralPath $BaseManifests -Recurse -File -Filter '*.json' | ForEach-Object { $_.FullName })
} else {
  $fetched = Join-Path $stage 'published-lists'
  New-Item -ItemType Directory -Force $fetched | Out-Null
  $bases = @(Save-PublishedManifests $Repo $PatchBases $fetched)
}
$made = Write-ReleaseChanges $app $manifest $bases $changes (Get-Item -LiteralPath $update).Length $plainLauncher

# ---------------------------------------------------------------- the smaller package
# No Node runtime and no launcher: for a machine that already has Node, using Launch.vbs as it
# always has. No list either - it would name a runtime that is not there, and nothing reads it.
# The read-aloud voice stays (runtime\voice): it is not Node, and without it the names in a line are never read.
foreach ($item in @(Get-ChildItem -LiteralPath (Join-Path $app 'runtime') -Force | Where-Object { $_.Name -ne 'voice' })) { Remove-Item -LiteralPath $item.FullName -Recurse -Force }
Remove-Item -LiteralPath (Join-Path $app $script:ManifestInPackage) -Force
$needsNode = Join-Path $Destination "TexasRevolution-Gonzales-$Stamp-NeedsNode.zip"
if (Test-Path -LiteralPath $needsNode) { Remove-Item -LiteralPath $needsNode -Force }
Compress-Archive -Path $app -DestinationPath $needsNode -CompressionLevel Optimal

Remove-Item -LiteralPath $stage -Recurse -Force
foreach ($file in @($setup, $plainCopy, $update, $needsNode)) {
  if (Test-Path -LiteralPath $file) { '{0}  {1} MB' -f $file, [math]::Round((Get-Item -LiteralPath $file).Length / 1MB, 1) }
}
'{0}  {1} KB' -f $installer, [math]::Ceiling((Get-Item -LiteralPath $installer).Length / 1KB)
"launcher id $launcherId; $($manifest.Files.Count) files listed"
foreach ($entry in $made) {
  if ($entry.PSObject.Properties['Skipped']) { "  no set of changes from $($entry.From): $($entry.Skipped)" }
  else { '  {0}  {1} files{3}, {2} KB' -f $entry.Asset, $entry.Files, [math]::Ceiling($entry.Bytes / 1KB), $(if ($entry.Launcher) { ' (the launcher among them)' } else { '' }) }
}
if (-not @($made | Where-Object { -not $_.PSObject.Properties['Skipped'] }).Count) { '  no sets of changes: every launcher takes the whole download for this release' }
# The exact command, so nothing the small update needs is left off the release.
"Publish from $Destination with:"
"  `$assets = @('TexasRevolutionSetup.exe', 'TexasRevolutionInstaller.exe', 'TexasRevolution-Gonzales-$Stamp.zip', 'TexasRevolution-Gonzales-$Stamp-NeedsNode.zip') + @(Get-ChildItem 'changes-$Stamp' -File | ForEach-Object FullName)"
"  gh release create $Tag @assets -R $Repo --target main --title ""..."" --notes-file notes.md --latest"
