# Bundle the tested Node runtime beside the application and record its identity.
#
# Default: copy the Node executable this project was tested with from PATH. Nothing
# is downloaded. Use -DownloadVersion only when a specific runtime must be fetched;
# that path verifies the official SHASUMS256.txt entry before the file is accepted.
#
# The manifest is what makes the bundled runtime auditable. scripts/launch.ps1
# refuses to start a bundled runtime whose checksum no longer matches it.
[CmdletBinding()]
param(
    [string]$Source,
    [string]$DownloadVersion,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimePath = Join-Path $rootPath 'runtime'
$targetExe = Join-Path $runtimePath 'node.exe'
$manifestPath = Join-Path $runtimePath 'manifest.json'
$recordPath = Join-Path $rootPath 'docs\evidence\runtime-manifest.json'

if ($Source -and $DownloadVersion) { throw 'Choose either -Source or -DownloadVersion, not both.' }
if ((Test-Path -LiteralPath $targetExe -PathType Leaf) -and -not $Force) {
    throw "A bundled runtime already exists at $targetExe. Re-run with -Force to replace it."
}
$null = New-Item -ItemType Directory -Path $runtimePath -Force
$staging = Join-Path $runtimePath ('.staging-' + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $staging -Force

try {
    $licenseSource = $null
    if ($DownloadVersion) {
        if ($DownloadVersion -notmatch '^v\d+\.\d+\.\d+$') { throw 'Use a full Node version such as v24.18.1.' }
        $archive = "node-$DownloadVersion-win-x64.zip"
        $base = "https://nodejs.org/dist/$DownloadVersion"
        Write-Output "Downloading $base/$archive"
        $ProgressPreference = 'SilentlyContinue'
        $zipPath = Join-Path $staging $archive
        Invoke-WebRequest -Uri "$base/$archive" -OutFile $zipPath -UseBasicParsing
        $sums = (Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -UseBasicParsing).Content
        $expected = ($sums -split "`n" | Where-Object { $_ -match [regex]::Escape($archive) + '\s*$' } | Select-Object -First 1) -split '\s+' | Select-Object -First 1
        if ([string]::IsNullOrWhiteSpace($expected)) { throw "SHASUMS256.txt has no entry for $archive. The download was not trusted." }
        $actual = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actual -ne $expected.ToLowerInvariant()) { throw "Checksum mismatch for $archive. Expected $expected, got $actual. The download was discarded." }
        Write-Output "Archive checksum verified against the published SHASUMS256.txt."
        Expand-Archive -LiteralPath $zipPath -DestinationPath $staging -Force
        $extracted = Join-Path $staging "node-$DownloadVersion-win-x64"
        $sourceExe = Join-Path $extracted 'node.exe'
        $licenseSource = Join-Path $extracted 'LICENSE'
        $sourceDescription = "$base/$archive (SHA256 $actual)"
    } else {
        if ($Source) { $sourceExe = [IO.Path]::GetFullPath($Source) }
        else {
            $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($null -eq $command) { throw 'No node.exe on PATH. Pass -Source <path to node.exe> or -DownloadVersion vX.Y.Z.' }
            $sourceExe = $command.Source
        }
        if (-not (Test-Path -LiteralPath $sourceExe -PathType Leaf)) { throw "Not a file: $sourceExe" }
        $candidateLicense = Join-Path (Split-Path -Parent $sourceExe) 'LICENSE'
        if (Test-Path -LiteralPath $candidateLicense -PathType Leaf) { $licenseSource = $candidateLicense }
        $sourceDescription = $sourceExe
    }

    $version = (& $sourceExe --version 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.') { throw "Could not read a Node version from $sourceExe." }
    if ([int]$Matches[1] -lt 22) { throw "This project requires Node 22 or later; $sourceExe reports $version." }

    Copy-Item -LiteralPath $sourceExe -Destination $targetExe -Force
    $licenseFile = $null
    if ($licenseSource) { Copy-Item -LiteralPath $licenseSource -Destination (Join-Path $runtimePath 'LICENSE') -Force; $licenseFile = 'LICENSE' }

    $hash = (Get-FileHash -LiteralPath $targetExe -Algorithm SHA256).Hash.ToLowerInvariant()
    $manifest = [ordered]@{
        manifestVersion = 1
        application     = 'texas-revolution-foundation'
        fileName        = 'node.exe'
        nodeVersion     = $version
        sha256          = $hash
        sizeBytes       = (Get-Item -LiteralPath $targetExe).Length
        platform        = 'win32'
        architecture    = $env:PROCESSOR_ARCHITECTURE
        source          = $sourceDescription
        licenseFile     = $licenseFile
        bundledAtUtc    = [DateTime]::UtcNow.ToString('o')
        note            = 'Recheck the runtime version and this checksum during release maintenance. Not a signed installer or a district approval.'
    }
    $json = $manifest | ConvertTo-Json -Depth 4
    [IO.File]::WriteAllText($manifestPath, $json)
    $null = New-Item -ItemType Directory -Path (Split-Path -Parent $recordPath) -Force
    [IO.File]::WriteAllText($recordPath, $json)

    if (-not $licenseFile) { Write-Warning 'No LICENSE file was found beside the source runtime. Add the Node license to runtime/ before distributing.' }
    Write-Output "Bundled $version at $targetExe"
    Write-Output "SHA256 $hash"
    Write-Output "Manifest: $manifestPath (build record copy: $recordPath)"
} finally {
    Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
}
