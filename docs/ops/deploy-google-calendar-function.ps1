# Deploy da edge function google-calendar (OAuth + Calendar API)
# PowerShell: .\deploy-google-calendar-function.ps1

$ErrorActionPreference = 'Continue'
$ProjectRef = 'iqcupswgotsuncysagmj'

$backendRoot = (Join-Path $PSScriptRoot '..\..\backend' | Resolve-Path).Path
Write-Host "Pasta canonica: $backendRoot" -ForegroundColor Cyan
Set-Location $backendRoot

function Invoke-SupabaseCli {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CliArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $out = & supabase @CliArgs 2>&1 | ForEach-Object { "$_" }
  $code = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 0 }
  $ErrorActionPreference = $prev
  return @{ Output = ($out -join "`n"); ExitCode = $code }
}

Write-Host ""
Write-Host "[1/3] Autenticacao Supabase CLI..." -ForegroundColor Yellow

if ($env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "SUPABASE_ACCESS_TOKEN ja definido - pulando login." -ForegroundColor Green
}
else {
  Write-Host "Sem SUPABASE_ACCESS_TOKEN. Abrindo login no navegador..." -ForegroundColor Yellow
  Write-Host "Se falhar, crie token em: https://supabase.com/dashboard/account/tokens" -ForegroundColor DarkGray
  $login = Invoke-SupabaseCli login
  if ($login.Output) { Write-Host $login.Output }
  if ($login.ExitCode -ne 0) {
    Write-Host ""
    Write-Host "ERRO: login nao concluido." -ForegroundColor Red
    Write-Host "Defina o token e rode de novo:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_ACCESS_TOKEN = "sbp_SEU_TOKEN"' -ForegroundColor White
    Write-Host "  cd `"$backendRoot`"" -ForegroundColor White
    Write-Host "  supabase functions deploy google-calendar --no-verify-jwt --project-ref $ProjectRef" -ForegroundColor White
    exit 1
  }
}

Write-Host ""
Write-Host "[2/3] Vinculando projeto $ProjectRef..." -ForegroundColor Yellow
$link = Invoke-SupabaseCli link --project-ref $ProjectRef
if ($link.Output) { Write-Host $link.Output }
if ($link.ExitCode -ne 0) {
  Write-Host "Aviso: link retornou codigo $($link.ExitCode). Tentando deploy com --project-ref." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Publicando google-calendar..." -ForegroundColor Yellow
$deploy = Invoke-SupabaseCli functions deploy google-calendar --no-verify-jwt --project-ref $ProjectRef
if ($deploy.Output) { Write-Host $deploy.Output }
if ($deploy.ExitCode -ne 0) {
  Write-Host ""
  Write-Host "Deploy falhou (exit $($deploy.ExitCode))." -ForegroundColor Red
  Write-Host 'Defina: $env:SUPABASE_ACCESS_TOKEN = "sbp_..." e rode este script novamente.' -ForegroundColor Yellow
  exit $deploy.ExitCode
}

Write-Host ""
Write-Host "Deploy concluido." -ForegroundColor Green
Write-Host "Teste: https://${ProjectRef}.supabase.co/functions/v1/google-calendar/test-public"
