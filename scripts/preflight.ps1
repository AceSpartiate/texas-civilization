# Pre-classroom deployment diagnostic.
#
# READ-ONLY. This script changes no firewall rule, no policy, no registry value and
# no network setting. It records what this computer reports, so an IT conversation
# starts from evidence instead of guesswork.
#
# It CANNOT prove that another device can reach this server. Only an actual second
# physical device on the actual network can do that; see docs/DEPLOYMENT.md.
[CmdletBinding()]
param(
    [string]$Tester = 'not recorded',
    [string]$Network = 'not recorded',
    [switch]$NoWrite
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$rootPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$report = [ordered]@{
    generatedAtUtc = [DateTime]::UtcNow.ToString('o')
    tester         = $Tester
    network        = $Network
    computerName   = $env:COMPUTERNAME
    scope          = 'Read-only local diagnostic. Not proof that a student device can reach this server.'
}

function Try-Get([scriptblock]$Block, $Fallback) {
    $explained = $PSBoundParameters.ContainsKey('Fallback')
    try { $value = & $Block; if ($null -eq $value) { return $(if ($explained) { $Fallback } else { 'unavailable' }) } return $value }
    catch { return $(if ($explained) { $Fallback } else { "unavailable: $($_.Exception.Message)" }) }
}

$report.windows = Try-Get { (Get-CimInstance Win32_OperatingSystem).Caption + ' ' + [Environment]::OSVersion.Version.ToString() }
$report.powerShell = [ordered]@{
    version = $PSVersionTable.PSVersion.ToString()
    edition = Try-Get { $PSVersionTable.PSEdition }
    executionPolicies = Try-Get { (Get-ExecutionPolicy -List | ForEach-Object { "$($_.Scope)=$($_.ExecutionPolicy)" }) -join '; ' }
}
# A double-clicked .vbs needs this association; managed devices sometimes remove it.
$report.vbsAssociation = Try-Get { (Get-ItemProperty -LiteralPath 'Registry::HKEY_CLASSES_ROOT\VBSFile\Shell\Open\Command' -Name '(default)').'(default)' }

$bundledExe = Join-Path $rootPath 'runtime\node.exe'
$runtime = [ordered]@{ bundled = (Test-Path -LiteralPath $bundledExe -PathType Leaf) }
if ($runtime.bundled) {
    $recordPath = Join-Path $rootPath 'runtime\manifest.json'
    $runtime.manifestPresent = Test-Path -LiteralPath $recordPath -PathType Leaf
    if ($runtime.manifestPresent) {
        $record = Try-Get { Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json }
        $runtime.recordedVersion = Try-Get { [string]$record.nodeVersion }
        $runtime.recordedSha256 = Try-Get { [string]$record.sha256 }
        $runtime.actualSha256 = Try-Get { (Get-FileHash -LiteralPath $bundledExe -Algorithm SHA256).Hash.ToLowerInvariant() }
        $runtime.checksumMatches = ($runtime.recordedSha256 -eq $runtime.actualSha256)
        $runtime.licenseIncluded = Test-Path -LiteralPath (Join-Path $rootPath 'runtime\LICENSE') -PathType Leaf
    }
    $nodePath = $bundledExe
} else {
    $installed = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $runtime.installedNode = if ($installed) { $installed.Source } else { 'none on PATH' }
    $nodePath = if ($installed) { $installed.Source } else { $null }
}
if ($nodePath) { $runtime.reportedVersion = Try-Get { (& $nodePath --version | Out-String).Trim() } }
$report.runtime = $runtime

$port = 1835
if ($env:PORT -and [int]::TryParse($env:PORT, [ref]$port)) { } else { $port = 1835 }
if ($nodePath) {
    $info = Try-Get { ((& $nodePath (Join-Path $rootPath 'scripts\appinfo.mjs')) -join '') | ConvertFrom-Json }
    if ($info -isnot [string]) {
        $port = [int]$info.port
        $report.dataDir = [string]$info.dataDir
        $report.dataOrigin = [string]$info.dataOrigin
        $report.savePath = [string]$info.savePath
        $report.saveExists = Test-Path -LiteralPath ([string]$info.savePath) -PathType Leaf
        $report.joinCandidates = @($info.joinUrls | ForEach-Object { [ordered]@{ interface = $_.label; address = $_.address; url = $_.url } })
    } else { $report.dataDir = $info }
}
$report.port = $port

# Firewall state is reported, never modified. An inbound rule may still be required.
$report.firewall = [ordered]@{
    note = 'Reported only. No rule was created, changed or removed.'
    profiles = Try-Get { (Get-NetFirewallProfile | ForEach-Object { "$($_.Name)=$(if ($_.Enabled) {'enabled'} else {'disabled'})" }) -join '; ' }
    matchingInboundRules = Try-Get {
        $matches = Get-NetFirewallPortFilter -ErrorAction Stop | Where-Object { $_.LocalPort -eq [string]$port } |
            ForEach-Object { Get-NetFirewallRule -AssociatedNetFirewallPortFilter $_ -ErrorAction SilentlyContinue } |
            Where-Object { $_.Direction -eq 'Inbound' } |
            ForEach-Object { "$($_.DisplayName) [$($_.Action), enabled=$($_.Enabled), profile=$($_.Profile)]" }
        if ($matches) { $matches -join '; ' } else { 'no inbound rule found for this port' }
    } 'unavailable: reading firewall rules needs an elevated PowerShell session. Ask IT to confirm the inbound rule instead.'
}

$health = $null
try { $health = Invoke-RestMethod -Uri "http://127.0.0.1:$port/health" -Method Get -TimeoutSec 2 -Proxy $null } catch { $health = $null }
$report.localServer = if ($null -eq $health) {
    [ordered]@{ running = $false; note = 'No local listener answered. Start the classroom before checking reachability.' }
} else {
    [ordered]@{
        running = $true; application = [string]$health.application; pid = [int]$health.pid
        stopping = [bool]$health.stopping; gracefulStopSupported = [bool]$health.canStop
        note = 'A local /health response identifies the listener only. It is not evidence of remote reachability, and not a save-health or simulation-progress check.'
    }
}

$report.outstandingGates = @(
    'Independent physical devices on an ordinary LAN: NOT YET TESTED until recorded in docs/GATES.md.',
    'Actual district network and managed student devices: NOT YET TESTED, mandatory before classroom use.'
)
$report.nextStep = 'Start the class, open the preferred join URL above on a second physical device on the same network, and record PASS/FAIL with the observed restriction in docs/DEPLOYMENT.md.'

$json = $report | ConvertTo-Json -Depth 6
Write-Output $json
if (-not $NoWrite) {
    $evidenceDir = Join-Path $rootPath 'docs\evidence'
    $null = New-Item -ItemType Directory -Path $evidenceDir -Force
    $target = Join-Path $evidenceDir ('preflight-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss') + '.json')
    [IO.File]::WriteAllText($target, $json)
    Write-Output ''
    Write-Output "Recorded: $target"
}
