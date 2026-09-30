# Builds the small setup a teacher can email: TexasRevolutionInstaller.exe (websetup/, docs/DEPLOYMENT.md).
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-web-setup.ps1 -Out <path\TexasRevolutionInstaller.exe> [-Tag v...]
#
# Compiled by the C# compiler that ships inside Windows' own .NET Framework 4.8, so it needs no SDK,
# no NuGet and nothing downloaded, and what it builds needs nothing a Windows 10 or 11 computer does
# not already have. That is why the program is written in C# 5.
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Out,
  [string]$Tag = 'unreleased'
)
$ErrorActionPreference = 'Stop'
if ($Tag -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*$') { throw 'Tag must be a plain release identifier.' }
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'websetup'
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path -LiteralPath $csc)) { throw 'The .NET Framework 4.8 C# compiler is not on this computer.' }

# The release it was published with, readable in the file's Properties > Details. It downloads the
# latest release whatever this says.
$stamp = Join-Path ([IO.Path]::GetTempPath()) ("tr-websetup-stamp-{0}.cs" -f [guid]::NewGuid().ToString('N'))
Set-Content -LiteralPath $stamp -Encoding UTF8 -Value "[assembly: System.Reflection.AssemblyInformationalVersion(`"$Tag`")]"
$Out = [IO.Path]::GetFullPath($Out)
New-Item -ItemType Directory -Force (Split-Path -Parent $Out) | Out-Null
try {
  $sources = @(Get-ChildItem -LiteralPath $source -Filter '*.cs' | Sort-Object Name | ForEach-Object { $_.FullName }) + $stamp
  $output = & $csc /nologo /target:winexe /optimize+ /platform:anycpu /utf8output /warnaserror+ `
    "/win32icon:$(Join-Path $root 'launcher\TexasRevolutionSetup.ico')" "/win32manifest:$(Join-Path $source 'app.manifest')" `
    /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll /r:System.Web.Extensions.dll `
    "/out:$Out" @sources 2>&1
  if ($LASTEXITCODE -ne 0) { throw "The small setup did not build:`n$($output -join "`n")" }
} finally {
  Remove-Item -LiteralPath $stamp -Force -ErrorAction SilentlyContinue
}
$Out
