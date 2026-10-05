# Sobe API (backend/) + site Next (web/) em janelas separadas.
# Só web: npm run dev:web

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$web = Join-Path $root 'web'
$backend = Join-Path $root 'backend'

if (-not (Test-Path (Join-Path $web '.env.local'))) {
  if (-not (Test-Path (Join-Path $web '.env.example'))) {
    Write-Host 'Falta web/.env.local (copie de web/.env.example).' -ForegroundColor Red
    exit 1
  }
  Write-Host 'Aviso: crie web/.env.local a partir de web/.env.example' -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $backend '.env'))) {
  Write-Host 'Aviso: crie backend/.env (copie de backend/.env.example).' -ForegroundColor Yellow
}

Write-Host 'Iniciando API na porta 3333 e Next na 3000...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  '-NoExit', '-NoProfile', '-Command',
  "Set-Location -LiteralPath '$backend'; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
)
Start-Sleep -Seconds 2
Set-Location -LiteralPath $web
if (-not (Test-Path 'node_modules')) {
  npm install
}
npm run dev
