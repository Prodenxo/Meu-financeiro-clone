param(
  [Parameter(Mandatory = $true)]
  [string]$JsonPath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $JsonPath)) {
  Write-Error "Ficheiro nao encontrado: $JsonPath"
  exit 1
}

$url = [Environment]::GetEnvironmentVariable('MEU_FINANCEIRO_API_URL', 'Process')
$secret = [Environment]::GetEnvironmentVariable('MEU_FINANCEIRO_HERMES_SECRET', 'Process')

if ([string]::IsNullOrWhiteSpace($url)) {
  Write-Error 'MEU_FINANCEIRO_API_URL nao definida (mete no .hermes\.env e terminal.env_passthrough).'
  exit 1
}
if ([string]::IsNullOrWhiteSpace($secret)) {
  Write-Error 'MEU_FINANCEIRO_HERMES_SECRET nao definida.'
  exit 1
}

$fullPath = (Resolve-Path -LiteralPath $JsonPath).Path

& curl.exe -s -S -X POST $url `
  -H 'Content-Type: application/json; charset=utf-8' `
  -H "Authorization: Bearer $secret" `
  --data-binary "@$fullPath"

exit $LASTEXITCODE
