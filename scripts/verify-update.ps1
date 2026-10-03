# Proves the launcher's self-update without publishing a release (launcher/UpdateSwap.cs).
#
# Three setup programs are built from this working copy, each carrying a small stand-in game
# stamped v-test-1, v-test-2 and v-test-3. v1 is installed into a scratch folder with a
# "teacher's class" in its data folder. Then the *installed* launcher updates itself to v2
# through `--install-update`, which is the same stage-and-swap the Update button runs, and:
#
#   PASS lines check that the appended setup still installs and an installed launcher still updates
#   from one; that the classic setup (the default, from 2026-10-03 carrying the plain launcher as a
#   second resource, launcher/SetupLayout.cs) installs that plain launcher and not itself; that the
#   running launcher was replaced (by hash), the game and its
#   release stamp moved with it, and the class data was not touched; that the next launch
#   deletes the renamed old launcher; that an update whose swap fails part way (a file held
#   open in server\) leaves every file - launcher, game and stamp - exactly as it was; that
#   a launch finding an interrupted swap puts the old build back; and that an update archive
#   with no launcher in it updates the game and keeps the launcher.
#
# Everything lives under data\update-verification (gitignored). Nothing is registered, no
# shortcut is made, nothing is downloaded, and no process is stopped that this did not start.
[CmdletBinding()]
param(
    # Reuse setup programs built by an earlier run (a folder holding setup-v1..v3).
    [string]$SetupRoot,
    # Write the result here as JSON, for docs/evidence.
    [string]$Evidence
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$launcherDir = Join-Path $repo 'launcher'
$root = Join-Path $repo ('data\update-verification\run-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$null = New-Item -ItemType Directory -Force $root
$results = New-Object System.Collections.Generic.List[string]
function Pass([string]$Text) { $results.Add("PASS: $Text"); "PASS: $Text" }
function Hash([string]$Path) { (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash }
function Text([string]$Path) { [IO.File]::ReadAllText($Path).Trim() }

function New-Game([string]$Version, [string]$Folder) {
    $game = Join-Path $Folder 'TexasRevolution'
    foreach ($sub in @('server', 'public', 'sim')) { $null = New-Item -ItemType Directory -Force (Join-Path $game $sub) }
    [IO.File]::WriteAllText((Join-Path $game 'server\main.mjs'), "// stand-in game $Version")
    [IO.File]::WriteAllText((Join-Path $game 'public\page.txt'), "page $Version")
    [IO.File]::WriteAllText((Join-Path $game "sim\only-in-$Version.txt"), $Version)
    [IO.File]::WriteAllText((Join-Path $game 'release.txt'), $Version)
    $zip = Join-Path $Folder "game-$Version.zip"
    Compress-Archive -Path $game -DestinationPath $zip -Force
    return $zip
}

function Invoke-Launcher([string]$Exe, [string]$Arguments) {
    $info = [Diagnostics.ProcessStartInfo]::new($Exe, $Arguments)
    $info.UseShellExecute = $false
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    $info.CreateNoWindow = $true
    $process = [Diagnostics.Process]::Start($info)
    $out = $process.StandardOutput.ReadToEndAsync()
    $err = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit(600000)) { $process.Kill(); throw "$Exe $Arguments did not finish" }
    return @{ exit = $process.ExitCode; output = ($out.Result + $err.Result).Trim() }
}

. (Join-Path $PSScriptRoot 'release-changes.ps1')
$lock = $null
try {
    $games = Join-Path $root 'games'
    $null = New-Item -ItemType Directory -Force $games
    $setups = @{}
    $appended = @{}
    $launchers = @{}
    $payload = Join-Path $launcherDir 'payload.zip'
    $payloadLauncher = Join-Path $launcherDir 'payload-launcher.exe'
    function Publish([string]$Version, [string]$Out) {
        Push-Location $launcherDir
        try {
            & dotnet publish -c Release -r win-x64 --self-contained true `
                -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true `
                "-p:InformationalVersion=$Version" -o $Out -v quiet | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "The $Version build did not publish." }
        } finally { Pop-Location }
    }
    foreach ($version in @('v-test-1', 'v-test-2', 'v-test-3')) {
        $zip = New-Game $version (Join-Path $games $version)
        $out = if ($SetupRoot) { Join-Path $SetupRoot "setup-$version" } else { Join-Path $root "setup-$version" }
        $launchers[$version] = Join-Path $out 'plain\TexasRevolution.exe'
        $setups[$version] = Join-Path $out 'classic\TexasRevolution.exe'
        $appended[$version] = Join-Path $out 'TexasRevolutionSetup-Appended.exe'
        if ($SetupRoot) { continue }
        # Exactly as scripts/package.ps1 makes them (2026-10-03, "keep supporting both"): the plain
        # launcher, stamped with its version so each one's bytes differ; the classic setup, the same
        # project published again with the game and that plain launcher as resources; and the
        # appended setup, the plain launcher with the game after it.
        Publish $version (Join-Path $out 'plain')
        Copy-Item -LiteralPath $zip -Destination $payload -Force
        Copy-Item -LiteralPath $launchers[$version] -Destination $payloadLauncher -Force
        try { Publish $version (Join-Path $out 'classic') }
        finally { Remove-Item -LiteralPath $payload, $payloadLauncher -Force -ErrorAction SilentlyContinue }
        New-SetupProgram $launchers[$version] $zip $appended[$version]
    }
    if ((Hash $launchers['v-test-1']) -eq (Hash $launchers['v-test-2'])) { throw 'The v1 and v2 launchers are identical; the swap could not be seen.' }

    # ------------------------------------------------------------------ the appended setup, kept working
    $other = Join-Path $root 'Installed From Appended'
    $done = Invoke-Launcher $appended['v-test-1'] "--extract `"$other`""
    if ($done.exit -ne 0) { throw "Installing v1 from the appended setup failed: $($done.output)" }
    if ((Hash (Join-Path $other 'TexasRevolution.exe')) -ne (Hash $launchers['v-test-1']) -or (Text (Join-Path $other 'release.txt')) -ne 'v-test-1') { throw 'The appended setup did not install v1 and its plain launcher' }
    $done = Invoke-Launcher (Join-Path $other 'TexasRevolution.exe') "--install-update `"$($appended['v-test-2'])`" --no-restart"
    if ($done.exit -ne 0) { throw "Updating from the appended v2 setup failed: $($done.output)" }
    if ((Hash (Join-Path $other 'TexasRevolution.exe')) -ne (Hash $launchers['v-test-2']) -or (Text (Join-Path $other 'release.txt')) -ne 'v-test-2') { throw 'An update from the appended setup did not bring v2 and its launcher' }
    Pass "the appended setup still installs (v1 and its plain launcher), and an installed launcher updates from an appended setup (to v2, launcher swapped by hash)."

    # ------------------------------------------------------------------ install v1
    $install = Join-Path $root 'Installed Copy'
    $installed = Invoke-Launcher $setups['v-test-1'] "--extract `"$install`""
    if ($installed.exit -ne 0) { throw "Installing v1 failed: $($installed.output)" }
    $exe = Join-Path $install 'TexasRevolution.exe'
    $null = New-Item -ItemType Directory -Force (Join-Path $install 'data')
    $classFile = Join-Path $install 'data\classroom.json'
    [IO.File]::WriteAllText($classFile, '{"a teacher class":"must survive every update"}')
    $classHash = Hash $classFile
    if ((Text (Join-Path $install 'release.txt')) -ne 'v-test-1') { throw 'v1 did not install as expected' }
    if ((Hash $exe) -ne (Hash $launchers['v-test-1'])) { throw 'The setup did not install the plain launcher it carries' }
    Pass "the classic setup installed the plain launcher it embeds ($((Get-Item -LiteralPath $exe).Length) bytes), not itself ($((Get-Item -LiteralPath $setups['v-test-1']).Length) bytes)."

    # ------------------------------------------------------------------ v1 -> v2
    $update = Invoke-Launcher $exe "--install-update `"$($setups['v-test-2'])`" --no-restart"
    if ($update.exit -ne 0) { throw "The update to v2 failed: $($update.output)" }
    if ((Hash $exe) -ne (Hash $launchers['v-test-2'])) { throw 'The installed launcher was not replaced by the v2 launcher' }
    $old = Join-Path $install 'TexasRevolution.exe.old'
    if (-not (Test-Path -LiteralPath $old) -or (Hash $old) -ne (Hash $launchers['v-test-1'])) { throw 'The running v1 launcher was not renamed aside' }
    Pass 'the running launcher replaced itself: TexasRevolution.exe now hashes as the v2 build, the v1 build renamed to .old while it ran.'
    if ((Text (Join-Path $install 'release.txt')) -ne 'v-test-2') { throw 'release.txt did not move to v2' }
    if ((Text (Join-Path $install 'server\main.mjs')) -ne '// stand-in game v-test-2') { throw 'The game did not move to v2' }
    if (-not (Test-Path -LiteralPath (Join-Path $install 'sim\only-in-v-test-2.txt'))) { throw 'A file new in v2 is missing' }
    if ((Hash $classFile) -ne $classHash) { throw 'The update touched the class data' }
    if (Test-Path -LiteralPath (Join-Path $install '.update-backup')) { throw 'A finished update left its backup behind' }
    Pass 'the game and release.txt moved to v2 with the launcher, and data\classroom.json is byte-for-byte untouched.'

    $status = Invoke-Launcher $exe '--status'
    if (Test-Path -LiteralPath $old) { throw "The next launch did not delete the old launcher: $($status.output)" }
    Pass 'the next launch deletes the renamed old launcher.'

    # ------------------------------------------------------------------ a swap that fails part way
    $v2 = @{ exe = (Hash $exe); release = (Text (Join-Path $install 'release.txt')); page = (Text (Join-Path $install 'public\page.txt')) }
    $lock = [IO.File]::Open((Join-Path $install 'server\main.mjs'), 'Open', 'Read', 'None')
    $failed = Invoke-Launcher $exe "--install-update `"$($setups['v-test-3'])`" --no-restart"
    $lock.Dispose(); $lock = $null
    if ($failed.exit -ne 1 -or $failed.output -notmatch 'previous version kept') { throw "An update with server\ held open did not fail cleanly: exit $($failed.exit) $($failed.output)" }
    if ((Hash $exe) -ne $v2.exe) { throw 'A failed update left a different launcher installed' }
    if (Test-Path -LiteralPath $old) { throw 'A failed update left the old launcher renamed aside' }
    if ((Text (Join-Path $install 'release.txt')) -ne $v2.release) { throw 'A failed update changed release.txt' }
    if ((Text (Join-Path $install 'public\page.txt')) -ne $v2.page) { throw 'A failed update left public\ from v3 (it is swapped before server\)' }
    if (Test-Path -LiteralPath (Join-Path $install 'sim\only-in-v-test-3.txt')) { throw 'A failed update left a v3 file behind' }
    if (-not (Test-Path -LiteralPath (Join-Path $install 'sim\only-in-v-test-2.txt'))) { throw 'A failed update lost a v2 file' }
    if (Test-Path -LiteralPath (Join-Path $install '.update-backup')) { throw 'A failed update left its backup folder' }
    if ((Hash $classFile) -ne $classHash) { throw 'A failed update touched the class data' }
    Pass 'an update that fails part way (server\ held open, after the launcher, public\ and release.txt were already swapped) rolls all of it back: v2 launcher, v2 game, v2 stamp.'

    # ------------------------------------------------------------------ a swap cut off by a power cut
    $backup = Join-Path $install '.update-backup'
    $null = New-Item -ItemType Directory -Force $backup
    [IO.File]::WriteAllText((Join-Path $backup 'swap-in-progress.txt'), 'simulated interruption')
    Move-Item -LiteralPath (Join-Path $install 'public') -Destination (Join-Path $backup 'public')
    [IO.File]::WriteAllLines((Join-Path $backup 'journal.txt'), [string[]]@('moved:public', 'added:half-copied'))
    $null = New-Item -ItemType Directory -Force (Join-Path $install 'public')
    [IO.File]::WriteAllText((Join-Path $install 'public\page.txt'), 'half-written v3')
    $null = New-Item -ItemType Directory -Force (Join-Path $install 'half-copied')
    $null = Invoke-Launcher $exe '--status'
    if ((Text (Join-Path $install 'public\page.txt')) -ne $v2.page -or (Test-Path -LiteralPath (Join-Path $install 'half-copied')) -or (Test-Path -LiteralPath $backup)) { throw 'A launch after an interrupted swap did not put the old build back' }
    Pass 'a launch that finds an interrupted swap puts the previous build back before doing anything else.'

    # ------------------------------------------------------------------ an archive with no launcher
    $archive = Invoke-Launcher $exe "--install-update `"$(Join-Path $games 'v-test-3\game-v-test-3.zip')`" --no-restart"
    if ($archive.exit -ne 0) { throw "Updating from an archive failed: $($archive.output)" }
    if ((Hash $exe) -ne $v2.exe) { throw 'An archive with no launcher in it changed the launcher' }
    if ((Text (Join-Path $install 'release.txt')) -ne 'v-test-3') { throw 'The archive update did not move release.txt' }
    Pass 'an update archive with no launcher in it (every release before this one) updates the game and keeps the launcher.'
} finally {
    if ($null -ne $lock) { $lock.Dispose() }
}
if ($Evidence) {
    [ordered]@{
        recordedAt = [DateTime]::UtcNow.ToString('o'); machine = 'development computer (same-computer simulation)'
        script = 'scripts/verify-update.ps1'; results = $results
        note = 'Stand-in games, local setup programs built from this working copy; nothing downloaded from GitHub. Proves the swap and rollback, not the download or a real release.'
    } | ConvertTo-Json | Set-Content -LiteralPath $Evidence -Encoding UTF8
}
"Scratch folder: $root"
