Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repoPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$proofRoot = Join-Path $repoPath 'data\launcher-verification'
$appPath = Join-Path $proofRoot ('App With Spaces ' + [guid]::NewGuid().ToString('N').Substring(0,8))
$null = New-Item -ItemType Directory -Path (Join-Path $appPath 'scripts') -Force
foreach ($file in @('launch.ps1', 'stop.ps1', 'appinfo.mjs')) { Copy-Item -LiteralPath (Join-Path $repoPath "scripts\$file") -Destination (Join-Path $appPath "scripts\$file") -Force }
foreach ($folder in @('server', 'sim', 'public')) { Copy-Item -LiteralPath (Join-Path $repoPath $folder) -Destination $appPath -Recurse -Force }
[IO.File]::AppendAllText((Join-Path $appPath 'server\main.mjs'), [Environment]::NewLine + 'setTimeout(() => console.log(''LATE_LOG_PROOF''), 1500);')
$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
$listener.Start(); $testPort = $listener.LocalEndpoint.Port; $listener.Stop()
$oldPort = $env:PORT
$oldSave = $env:SAVE_PATH
$env:PORT = [string]$testPort
$env:SAVE_PATH = Join-Path $appPath 'data\classroom.json'
$serverPid = $null
$dummy = $null
function Invoke-Script([string]$ArgsText) {
    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = (Get-Command powershell.exe).Source
    $startInfo.Arguments = $argsText
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $normalized = @{}
    foreach ($entry in [Environment]::GetEnvironmentVariables().GetEnumerator()) { $normalized[$entry.Key] = $entry.Value }
    $startInfo.Environment.Clear()
    foreach ($entry in $normalized.GetEnumerator()) { $startInfo.Environment[$entry.Key] = $entry.Value }
    $launchProcess = [Diagnostics.Process]::Start($startInfo)
    if (-not $launchProcess.WaitForExit(40000)) { throw 'Helper script did not exit within 40 seconds' }
    return $launchProcess.ExitCode
}
function Invoke-Launcher([int]$Timeout = 20) {
    $exit = Invoke-Script ('-NoLogo -NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "' + (Join-Path $appPath 'scripts\launch.ps1') + '" -NoBrowser -NoDialog -StartupTimeoutSeconds ' + $Timeout)
    $output = Get-Content -LiteralPath (Join-Path $appPath 'data\launcher-error.txt') -Raw
    return @{exit = $exit; output = $output}
}
function Invoke-Stop {
    return Invoke-Script ('-NoLogo -NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "' + (Join-Path $appPath 'scripts\stop.ps1') + '" -NoDialog -TimeoutSeconds 20')
}
try {
    $first = Invoke-Launcher
    if ($first.exit -ne 0) { throw ('Initial launch failed: ' + $first.output) }
    $metadata = Get-Content -LiteralPath (Join-Path $appPath 'data\launcher-process.json') -Raw | ConvertFrom-Json
    $serverPid = [int]$metadata.processId
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$testPort/health"
    if ($health.pid -ne $serverPid -or $health.launchId -ne $metadata.launchId) { throw 'Health ownership mismatch' }
    Start-Sleep -Seconds 2
    $lateLog = Get-Content -LiteralPath (Join-Path $appPath 'data\server.stdout.log') -Raw
    if ($lateLog -notmatch 'LATE_LOG_PROOF') { throw 'Server output redirection did not survive launcher exit' }
    'PASS: real server starts/authenticates in a path with spaces; logs survive launcher exit.'
    $second = Invoke-Launcher
    if ($second.exit -ne 0) { throw ('Repeat launch failed: ' + $second.output) }
    $again = Get-Content -LiteralPath (Join-Path $appPath 'data\launcher-process.json') -Raw | ConvertFrom-Json
    if ($again.processId -ne $serverPid -or $again.launchId -ne $metadata.launchId) { throw 'Repeat launch duplicated server' }
    'PASS: repeat launch reuses the verified process and session.'

    # Solo Mode beside the running class: its own verified process, folder and loopback port,
    # a game dealt through its Host key, and a graceful stop that leaves the class running.
    $soloListener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $soloListener.Start(); $soloPort = $soloListener.LocalEndpoint.Port; $soloListener.Stop()
    $oldSoloPort = $env:SOLO_PORT
    $env:SOLO_PORT = [string]$soloPort
    try {
        $soloExit = Invoke-Script ('-NoLogo -NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "' + (Join-Path $appPath 'scripts\launch.ps1') + '" -NoBrowser -NoDialog -Solo -StartupTimeoutSeconds 30')
        $soloData = Join-Path $appPath 'data\solo'
        if ($soloExit -ne 0) { throw ('Solo launch failed: ' + (Get-Content -LiteralPath (Join-Path $soloData 'launcher-error.txt') -Raw -ErrorAction SilentlyContinue)) }
        $soloMeta = Get-Content -LiteralPath (Join-Path $soloData 'launcher-process.json') -Raw | ConvertFrom-Json
        $soloHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$soloPort/health"
        if (-not $soloHealth.solo -or [int]$soloHealth.pid -ne [int]$soloMeta.processId -or [int]$soloMeta.processId -eq $serverPid) { throw 'Solo launch did not start its own verified solo server' }
        if (-not (Test-Path -LiteralPath (Join-Path $soloData 'classroom.json.lock'))) { throw 'The solo server holds no lock on its own save' }
        $soloKey = ([IO.File]::ReadAllText((Join-Path $soloData 'host-url.txt')).Trim() -split '#')[1]
        $game = Invoke-RestMethod -Uri "http://127.0.0.1:$soloPort/api/solo" -Method Post -ContentType 'application/json' -Body (@{ key = $soloKey } | ConvertTo-Json -Compress) -TimeoutSec 60
        if ($game.playUrl -notmatch "^http://127\.0\.0\.1:$soloPort/solo/enter\?ticket=") { throw 'The solo server dealt no game' }
        $classHealth = Invoke-RestMethod -Uri "http://127.0.0.1:$testPort/health"
        if ([int]$classHealth.pid -ne $serverPid -or $classHealth.solo) { throw 'Solo launch disturbed the running class' }
        'PASS: solo launch beside a running class starts its own verified server in data\solo on its own port and deals a game; the class keeps running.'
        $soloStop = Invoke-Script ('-NoLogo -NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File "' + (Join-Path $appPath 'scripts\stop.ps1') + '" -NoDialog -Solo -TimeoutSeconds 20')
        if ($soloStop -ne 0) { throw "Solo stop reported failure (exit $soloStop)" }
        if (Get-Process -Id ([int]$soloMeta.processId) -ErrorAction SilentlyContinue) { throw 'Solo server survived its graceful stop' }
        if (Test-Path -LiteralPath (Join-Path $soloData 'classroom.json.lock')) { throw 'Solo stop left a stale lock' }
        if ([int](Invoke-RestMethod -Uri "http://127.0.0.1:$testPort/health").pid -ne $serverPid) { throw 'Stopping solo stopped the class' }
        'PASS: stopping solo stops only the solo server and releases its lock; the class is still running.'
    } finally {
        $env:SOLO_PORT = $oldSoloPort
        # Only the solo server this block started, and only if a failed check left it running.
        $soloRecord = Join-Path $appPath 'data\solo\launcher-process.json'
        if (Test-Path -LiteralPath $soloRecord) { try { Stop-Process -Id ([int](Get-Content -LiteralPath $soloRecord -Raw | ConvertFrom-Json).processId) -ErrorAction SilentlyContinue } catch { } }
    }

    $lockPath = (Join-Path $appPath 'data\classroom.json.lock')
    if (-not (Test-Path -LiteralPath $lockPath -PathType Leaf)) { throw 'The running server held no save lock' }
    $stopExit = Invoke-Stop
    if ($stopExit -ne 0) { throw "Graceful stop reported failure (exit $stopExit)" }
    if (Get-Process -Id $serverPid -ErrorAction SilentlyContinue) { throw 'Server process survived the graceful stop' }
    if (Test-Path -LiteralPath $lockPath -PathType Leaf) { throw 'Graceful stop left a stale save lock' }
    if (Test-Path -LiteralPath (Join-Path $appPath 'data\launcher-process.json') -PathType Leaf) { throw 'Graceful stop left stale launcher process metadata' }
    $saved = Get-Content -LiteralPath (Join-Path $appPath 'data\classroom.json') -Raw | ConvertFrom-Json
    # Read the version the code itself insists on rather than repeating a number here.
    # Pinned to a literal, this check quietly asserted saveVersion 1 long after the save
    # format had moved to 3, so the gate failed on a correct checkpoint and said the
    # checkpoint was unreadable. A gate that has to be hand-edited on every bump is a gate
    # that will be wrong again.
    $storage = Get-Content -LiteralPath (Join-Path $repoPath 'server\storage.mjs') -Raw
    $expected = [regex]::Match($storage, 'save\.saveVersion\s*!==\s*(\d+)')
    if (-not $expected.Success) { throw 'Could not read the supported save version out of server\storage.mjs' }
    if ([int]$saved.saveVersion -ne [int]$expected.Groups[1].Value) { throw ("Graceful stop left a checkpoint at save version {0}; this build reads {1}" -f $saved.saveVersion, $expected.Groups[1].Value) }
    if (-not $saved.world -or -not $saved.world.households) { throw 'Graceful stop left a checkpoint with no households in it' }
    'PASS: graceful stop exits the hidden server, releases the save lock and keeps the checkpoint.'
    $secondStop = Invoke-Stop
    if ($secondStop -ne 0) { throw 'Stopping an already-stopped server should report success, not failure' }
    'PASS: stopping an already-stopped classroom is a safe no-op.'
    $serverPid = $null

    $bundledExe = Join-Path $repoPath 'runtime\node.exe'
    $bundledRecord = Join-Path $repoPath 'runtime\manifest.json'
    if ((Test-Path -LiteralPath $bundledExe -PathType Leaf) -and (Test-Path -LiteralPath $bundledRecord -PathType Leaf)) {
        $appRuntime = Join-Path $appPath 'runtime'
        $null = New-Item -ItemType Directory -Path $appRuntime -Force
        Copy-Item -LiteralPath $bundledExe -Destination (Join-Path $appRuntime 'node.exe') -Force
        Copy-Item -LiteralPath $bundledRecord -Destination (Join-Path $appRuntime 'manifest.json') -Force
        $bundledLaunch = Invoke-Launcher
        if ($bundledLaunch.exit -ne 0) { throw ('Bundled-runtime launch failed: ' + $bundledLaunch.output) }
        $bundledMetadata = Get-Content -LiteralPath (Join-Path $appPath 'data\launcher-process.json') -Raw | ConvertFrom-Json
        if ($bundledMetadata.nodePath -ne (Join-Path $appRuntime 'node.exe')) { throw 'Launcher did not prefer the bundled runtime' }
        $serverPid = [int]$bundledMetadata.processId
        if ((Invoke-Stop) -ne 0) { throw 'Bundled-runtime server did not stop gracefully' }
        $serverPid = $null
        'PASS: a checksum-matching bundled runtime is preferred over installed Node.'

        $tampered = Get-Content -LiteralPath (Join-Path $appRuntime 'manifest.json') -Raw | ConvertFrom-Json
        $tampered.sha256 = '0' * 64
        $tampered | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $appRuntime 'manifest.json') -Encoding UTF8
        $rejected = Invoke-Launcher
        if ($rejected.exit -ne 1 -or $rejected.output -notmatch 'does not match the checksum') { throw ('Tampered runtime was not refused: ' + $rejected.output) }
        if (Test-Path -LiteralPath (Join-Path $appPath 'data\launcher-process.json') -PathType Leaf) { throw 'Refused launch still recorded a server process' }
        'PASS: a runtime that does not match its recorded checksum is refused and nothing is started.'
        Remove-Item -LiteralPath $appRuntime -Recurse -Force
    } else { 'SKIP: no bundled runtime in the repository; run scripts/bundle-runtime.ps1 to cover that path.' }

    $dummyScript = Join-Path $appPath 'unrelated.mjs'
    [IO.File]::WriteAllText($dummyScript, "import http from 'node:http'; http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true}));}).listen(Number(process.env.PORT),'127.0.0.1');")
    $dummy = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList ('"' + $dummyScript + '"') -WindowStyle Hidden -PassThru
    for ($i=0; $i -lt 20; $i++) { try { $null=Invoke-RestMethod -Uri "http://127.0.0.1:$testPort/health" -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 100 } }
    $collision = Invoke-Launcher
    if ($collision.exit -ne 1 -or $collision.output -notmatch 'already in use') { throw ('Collision was not safely rejected: ' + $collision.output) }
    $dummy.Refresh()
    if ($dummy.HasExited) { throw 'Unrelated process was stopped' }
    'PASS: unrelated listener is rejected and left running despite stale metadata.'
    $dummy.Kill(); $dummy.WaitForExit(3000) | Out-Null; $dummy=$null

    [IO.File]::WriteAllText((Join-Path $appPath 'server\main.mjs'), 'setInterval(() => {}, 1000);')
    $timeout = Invoke-Launcher 2
    if ($timeout.exit -ne 1 -or $timeout.output -notmatch 'did not become ready') { throw ('Timeout behavior incorrect: ' + $timeout.output) }
    $timedOut = Get-Content -LiteralPath (Join-Path $appPath 'data\launcher-process.json') -Raw | ConvertFrom-Json
    if (Get-Process -Id ([int]$timedOut.processId) -ErrorAction SilentlyContinue) { throw 'Unready child was orphaned' }
    'PASS: startup timeout leaves an error artifact and stops only the unready child.'
} finally {
    if ($null -ne $serverPid) { Stop-Process -Id $serverPid -ErrorAction SilentlyContinue }
    if ($null -ne $dummy) { $dummy.Refresh(); if (-not $dummy.HasExited) { $dummy.Kill() } }
    $env:PORT = $oldPort
    $env:SAVE_PATH = $oldSave
}
