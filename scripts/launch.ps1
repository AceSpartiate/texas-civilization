[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$NoDialog,
    # Solo Mode (docs/DEPLOYMENT.md): the same verified start, for the playtest server in its own
    # folder and on its own loopback port. A running class is neither reused nor disturbed.
    [switch]$Solo,
    [ValidateRange(2, 120)][int]$StartupTimeoutSeconds = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$fallbackDataPath = Join-Path $rootPath 'data'
$dataPath = $fallbackDataPath
$manifestPath = $null
$errorPath = $null
$hostFile = $null
$lockStream = $null
$childProcess = $null
$startedHere = $false
$ready = $false

# The class data folder is resolved by the server, not guessed here, so a read-only
# install directory moves the launcher artifacts to the same place as the save.
function Set-DataPaths([string]$Path) {
    $script:dataPath = $Path
    $script:manifestPath = Join-Path $Path 'launcher-process.json'
    $script:errorPath = Join-Path $Path 'launcher-error.txt'
    $script:hostFile = Join-Path $Path 'host-url.txt'
}
Set-DataPaths $fallbackDataPath

function Resolve-NodePath([string]$Root) {
    $bundled = Join-Path $Root 'runtime\node.exe'
    if (Test-Path -LiteralPath $bundled -PathType Leaf) {
        $recordPath = Join-Path $Root 'runtime\manifest.json'
        if (-not (Test-Path -LiteralPath $recordPath -PathType Leaf)) {
            throw 'The bundled runtime has no runtime\manifest.json recording its version and checksum. Rebuild the package with scripts\bundle-runtime.ps1. Nothing was started.'
        }
        $record = Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json
        if ([string]$record.sha256 -notmatch '^[a-f0-9]{64}$') { throw 'The bundled runtime manifest records no usable SHA256 checksum. Rebuild the package. Nothing was started.' }
        $actual = (Get-FileHash -LiteralPath $bundled -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne ([string]$record.sha256).ToLowerInvariant()) {
            throw 'The bundled Node runtime does not match the checksum recorded for this package. The files may be damaged or altered. Ask IT or the developer for a clean copy. Nothing was started.'
        }
        return $bundled
    }
    $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $command) { throw 'The Node runtime is missing. Ask the developer or IT team for the complete classroom package with runtime\node.exe. Nothing was downloaded or installed.' }
    return $command.Source
}

function Read-LaunchHealth([int]$ListenPort) {
    try {
        return Invoke-RestMethod -Uri "http://127.0.0.1:$ListenPort/health" -Method Get -TimeoutSec 1 -Proxy $null
    } catch { return $null }
}

function Test-LocalPort([int]$ListenPort) {
    $socket = New-Object Net.Sockets.TcpClient
    try {
        $attempt = $socket.BeginConnect('127.0.0.1', $ListenPort, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne(500)) { return $false }
        $socket.EndConnect($attempt)
        return $true
    } catch { return $false }
    finally { $socket.Dispose() }
}

function Get-VerifiedHostUrl($Metadata, $Process) {
    $Process.Refresh()
    if ($Process.HasExited) { throw 'The classroom server stopped during startup. See server.stderr.log in the class data folder for details.' }
    $health = Read-LaunchHealth ([int]$Metadata.port)
    if ($null -eq $health) { return $null }
    # Do not send the private Host credential until the listener identifies our child.
    if ($health.application -ne 'texas-revolution-foundation' -or -not $health.ok -or
        [int]$health.pid -ne [int]$Metadata.processId -or $health.launchId -ne $Metadata.launchId) {
        throw 'This address is being used by a different application or server. Close the other classroom instance, or ask the developer to resolve the port conflict. No browser was opened.'
    }
    if (-not (Test-Path -LiteralPath $hostFile -PathType Leaf)) { return $null }
    $hostText = [IO.File]::ReadAllText($hostFile).Trim()
    $expected = '^http://localhost:' + [regex]::Escape([string]$Metadata.port) + '/host#([a-f0-9]{48})$'
    if ($hostText -notmatch $expected) { return $null }
    $hostKey = $Matches[1]
    if (-not (Test-Path -LiteralPath $Metadata.savePath -PathType Leaf)) { return $null }
    $saved = Get-Content -LiteralPath $Metadata.savePath -Raw | ConvertFrom-Json
    if ($saved.hostKey -ne $hostKey) { return $null }
    $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    # The listener is IPv4. Avoid a localhost-to-IPv6 attempt delaying Windows
    # PowerShell's short readiness probes; both requests use the same cookie origin.
    $origin = "http://127.0.0.1:$($Metadata.port)"
    $null = Invoke-RestMethod -Uri "$origin/api/host" -Method Post -ContentType 'application/json' -Body (@{key = $hostKey} | ConvertTo-Json -Compress) -WebSession $webSession -TimeoutSec 2 -Proxy $null
    $snapshot = Invoke-RestMethod -Uri "$origin/api/state" -Method Get -WebSession $webSession -TimeoutSec 2 -Proxy $null
    if ($snapshot.sessionId -ne $saved.sessionId) { throw 'The saved class does not match the running server. No browser was opened. Keep the class data folder and ask the developer to inspect it.' }
    return $hostText
}

try {
    Set-Location -LiteralPath $rootPath
    $port = 1835
    if ($env:PORT) {
        if (-not [int]::TryParse($env:PORT, [ref]$port) -or $port -lt 1 -or $port -gt 65535) { throw 'The configured server port is invalid. Ask the developer to correct PORT; teachers do not need to configure a port.' }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $rootPath 'server\main.mjs') -PathType Leaf)) { throw 'The server files are missing. Ask for a complete copy of the classroom application.' }
    $nodePath = Resolve-NodePath $rootPath
    $nodeVersion = (& $nodePath --version | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw 'This prototype requires Node 22 or later. Ask the developer for an updated bundled runtime.' }

    $appInfoScript = Join-Path $rootPath 'scripts\appinfo.mjs'
    if (-not (Test-Path -LiteralPath $appInfoScript -PathType Leaf)) { throw 'The application files are incomplete: scripts\appinfo.mjs is missing.' }
    $infoText = $null
    $infoArguments = @($appInfoScript)
    if ($Solo) { $infoArguments += '--solo' }
    try { $infoText = (& $nodePath @infoArguments) -join '' } catch { $infoText = $null }
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($infoText)) { throw 'Could not determine where this installation keeps its class data. Confirm that the application folder or your user profile is writable.' }
    $info = $infoText | ConvertFrom-Json
    Set-DataPaths ([string]$info.dataDir)
    if ($Solo) { $port = [int]$info.port }
    $savePath = [string]$info.savePath
    $null = New-Item -ItemType Directory -Path $dataPath -Force

    try { $lockStream = [IO.File]::Open((Join-Path $dataPath 'launcher.lock'), 'OpenOrCreate', 'ReadWrite', 'None') }
    catch { throw 'The classroom is already opening. Wait a few seconds, then open Launch.vbs again if the Host page has not appeared.' }

    $metadata = $null
    if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
        try {
            $candidate = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
            $candidateProcess = Get-Process -Id ([int]$candidate.processId) -ErrorAction Stop
            if ($candidate.rootPath -eq $rootPath -and [int]$candidate.port -eq $port -and
                $candidate.savePath -eq $savePath -and $candidate.nodePath -eq $nodePath -and
                $candidateProcess.StartTime.ToUniversalTime().Ticks.ToString() -eq $candidate.startTicks -and
                $candidateProcess.Path -eq $nodePath) {
                $metadata = $candidate
                $childProcess = $candidateProcess
            }
        } catch { $metadata = $null }
    }
    if ($null -eq $metadata) {
        if (Test-LocalPort $port) { throw 'The classroom address is already in use by a server that this launcher cannot verify. Close that instance using its original controls, then try again. No unrelated application was opened or stopped.' }
        $launchId = [guid]::NewGuid().ToString('N')
        $previousLaunchId = $env:TEXAS_LAUNCH_ID
        try {
            $env:TEXAS_LAUNCH_ID = $launchId
            $childProcess = Start-Process -FilePath $nodePath -ArgumentList $(if ($Solo) { 'server/main.mjs --solo' } else { 'server/main.mjs' }) -WorkingDirectory $rootPath -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $dataPath 'server.stdout.log') -RedirectStandardError (Join-Path $dataPath 'server.stderr.log')
        } finally { $env:TEXAS_LAUNCH_ID = $previousLaunchId }
        $startedHere = $true
        $metadata = [ordered]@{
            rootPath = $rootPath; nodePath = $nodePath; port = $port; savePath = $savePath; dataPath = $dataPath
            processId = $childProcess.Id; startTicks = $childProcess.StartTime.ToUniversalTime().Ticks.ToString()
            launchId = $launchId; startedAtUtc = [DateTime]::UtcNow.ToString('o')
        }
        $metadata | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding UTF8
    }

    $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
    $verifiedUrl = $null
    while ([DateTime]::UtcNow -lt $deadline) {
        $verifiedUrl = Get-VerifiedHostUrl $metadata $childProcess
        if ($verifiedUrl) { break }
        Start-Sleep -Milliseconds 200
    }
    if (-not $verifiedUrl) { throw 'The server did not become ready in time. Check server.stderr.log in the class data folder and confirm that school policy permits the application. Nothing was changed in the firewall.' }
    $ready = $true
    # This is the teacher's interactive Host; only the helper/server stay hidden.
    if (-not $NoBrowser) { Start-Process -FilePath $verifiedUrl -WindowStyle Normal | Out-Null }
    [IO.File]::WriteAllText($errorPath, "No current startup error. Last successful launch: $([DateTime]::UtcNow.ToString('o')).`r`nClass data folder: $dataPath`r`nStop the server from the Host page, or by opening Stop.vbs.`r`n")
    Write-Output "Host ready on http://localhost:$port/host. The private Host URL is stored in $hostFile."
    exit 0
} catch {
    # On startup failure, only clean up the exact child this invocation created.
    if ($startedHere -and -not $ready -and $null -ne $childProcess) {
        try { $childProcess.Refresh(); if (-not $childProcess.HasExited) { $childProcess.Kill(); $childProcess.WaitForExit(3000) | Out-Null } } catch { }
    }
    $message = "Texas Revolution could not open.`r`n`r`n$($_.Exception.Message)`r`n`r`nClass data folder: $dataPath`r`nDetails: server.stderr.log and server.stdout.log in that folder.`r`nRecorded: $([DateTime]::UtcNow.ToString('o')).`r`n"
    # A solo failure is not the class's failure, so it never overwrites the class's error file.
    $destinations = if ($Solo -and $dataPath -ne $fallbackDataPath) { @($errorPath) } else { @($errorPath, (Join-Path $fallbackDataPath 'launcher-error.txt')) }
    foreach ($destination in $destinations | Select-Object -Unique) {
        try {
            $null = New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force
            [IO.File]::WriteAllText($destination, $message)
        } catch { }
    }
    if (-not $NoDialog) {
        try { $popup = New-Object -ComObject WScript.Shell; $null = $popup.Popup($message, 0, 'Texas Revolution', 16) } catch { }
    }
    [Console]::Error.WriteLine($message)
    exit 1
} finally {
    if ($null -ne $lockStream) { $lockStream.Dispose() }
}
