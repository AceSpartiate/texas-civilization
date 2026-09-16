# Graceful stop for the hidden classroom server.
#
# The server is asked to stop through the same authenticated Host control the
# teacher uses, so the class is checkpointed and paused first. This script never
# terminates a process: a forced stop is what leaves a stale save lock behind.
[CmdletBinding()]
param(
    [switch]$NoDialog,
    # Stop the Solo Mode playtest server instead of the class (docs/DEPLOYMENT.md).
    [switch]$Solo,
    [ValidateRange(2, 120)][int]$TimeoutSeconds = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

# A confirmation dismisses itself so a double-clicked helper never leaves an
# invisible modal dialog waiting behind a projected Host window. A failure waits.
function Show-Result([string]$Message, [int]$Icon, [int]$SecondsToClose) {
    Write-Output $Message
    if (-not $NoDialog) {
        try { $popup = New-Object -ComObject WScript.Shell; $null = $popup.Popup($Message, $SecondsToClose, 'Texas Revolution', $Icon) } catch { }
    }
}

try {
    $nodePath = Join-Path $rootPath 'runtime\node.exe'
    if (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) {
        $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -eq $command) { throw 'The Node runtime is missing, so this script cannot find the class data folder.' }
        $nodePath = $command.Source
    }
    $infoArguments = @((Join-Path $rootPath 'scripts\appinfo.mjs'))
    if ($Solo) { $infoArguments += '--solo' }
    $infoText = (& $nodePath @infoArguments) -join ''
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($infoText)) { throw 'Could not read the application data location.' }
    $info = $infoText | ConvertFrom-Json
    $dataPath = [string]$info.dataDir
    $port = [int]$info.port
    $manifestPath = Join-Path $dataPath 'launcher-process.json'
    $hostFile = Join-Path $dataPath 'host-url.txt'

    $health = $null
    try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -Method Get -TimeoutSec 2 -Proxy $null } catch { $health = $null }
    if ($null -eq $health) {
        Remove-Item -LiteralPath $manifestPath -ErrorAction SilentlyContinue
        Show-Result "No classroom server is running on port $port. Nothing to stop." 64 20
        exit 0
    }
    if ($health.application -ne 'texas-revolution-foundation') {
        throw "Port $port is being used by a different application. Nothing was stopped."
    }
    if (-not $health.canStop) { throw 'This server was started in a way that does not support a remote graceful stop. Use Ctrl+C in its own terminal window.' }

    # Ownership is proved by the private Host credential, not by owning the PID.
    if (-not (Test-Path -LiteralPath $hostFile -PathType Leaf)) { throw "The private Host URL file is missing from $dataPath, so this script cannot authenticate. Stop the server from the Host page instead." }
    $hostText = [IO.File]::ReadAllText($hostFile).Trim()
    if ($hostText -notmatch '/host#([a-f0-9]{48})$') { throw 'The stored Host URL is not in the expected form. Stop the server from the Host page instead.' }
    $hostKey = $Matches[1]

    $serverProcess = $null
    if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
        try {
            $metadata = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
            if ([int]$metadata.processId -eq [int]$health.pid) { $serverProcess = Get-Process -Id ([int]$health.pid) -ErrorAction SilentlyContinue }
        } catch { $serverProcess = $null }
    }

    $origin = "http://127.0.0.1:$port"
    $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $null = Invoke-RestMethod -Uri "$origin/api/host" -Method Post -ContentType 'application/json' -Body (@{key = $hostKey} | ConvertTo-Json -Compress) -WebSession $webSession -TimeoutSec 3 -Proxy $null
    $body = @{ id = [guid]::NewGuid().ToString('N'); action = 'stop-server' } | ConvertTo-Json -Compress
    $null = Invoke-RestMethod -Uri "$origin/api/command" -Method Post -ContentType 'application/json' -Body $body -WebSession $webSession -TimeoutSec 5 -Proxy $null

    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
    $stopped = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        Start-Sleep -Milliseconds 250
        if ($null -ne $serverProcess) {
            $serverProcess.Refresh()
            if ($serverProcess.HasExited) { $stopped = $true; break }
        } else {
            try { $null = Invoke-RestMethod -Uri "$origin/health" -Method Get -TimeoutSec 1 -Proxy $null } catch { $stopped = $true; break }
        }
    }
    if (-not $stopped) {
        throw "The class was saved and paused, but the server process has not exited after $TimeoutSeconds seconds. Do not end the process by force; that can leave a save lock. Ask the developer to inspect it."
    }
    Remove-Item -LiteralPath $manifestPath -ErrorAction SilentlyContinue
    Show-Result "The classroom server stopped. The class was saved and paused, and continues where it stopped the next time you open it.`r`nClass data folder: $dataPath" 64 20
    exit 0
} catch {
    Show-Result "The classroom server could not be stopped.`r`n`r`n$($_.Exception.Message)" 16 0
    exit 1
}
