# Sobe o site Next.js (web/) na porta 3000.
# API + Expo: repo irmao Meu-financeiro-app -> npm run dev

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$web = Join-Path $root 'web'

if (-not (Test-Path (Join-Path $web '.env.local'))) {
  if (-not (Test-Path (Join-Path $web '.env.example'))) {
    Write-Host 'Falta web/.env.local (copie de web/.env.example).' -ForegroundColor Red
    exit 1
  }
  Write-Host 'Aviso: crie web/.env.local a partir de web/.env.example' -ForegroundColor Yellow
}

Set-Location -LiteralPath $web
if (-not (Test-Path 'node_modules')) {
  Write-Host 'Instalando dependencias do web...' -ForegroundColor Yellow
  npm install
}
npm run dev
