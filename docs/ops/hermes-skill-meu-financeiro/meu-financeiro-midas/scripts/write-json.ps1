param(
  [Parameter(Mandatory = $true)]
  [string]$OutPath,
  [Parameter(Mandatory = $true)]
  [string]$JsonText
)

$ErrorActionPreference = 'Stop'
$enc = New-Object System.Text.UTF8Encoding $false
$dir = Split-Path -Parent $OutPath
if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -LiteralPath $dir)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
[System.IO.File]::WriteAllText($OutPath, $JsonText, $enc)
Write-Output "OK: $OutPath"
