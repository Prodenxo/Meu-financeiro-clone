# Sobe API (:3333) num terminal novo e Expo neste.
# Uso (na raiz): npm run dev   ou   .\scripts\dev.ps1

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

function Test-EnvFile($path) {
  if (-not (Test-Path $path)) {
    Write-Host "Falta $path - copie do .env.example da mesma pasta e preencha." -ForegroundColor Red
    return $false
  }
  return $true
}

if (-not (Test-EnvFile (Join-Path $backend '.env'))) { exit 1 }
if (-not (Test-EnvFile (Join-Path $frontend '.env'))) { exit 1 }

Write-Host ''
Write-Host 'Abrindo API em outro terminal (porta 3333)...' -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location -LiteralPath '$backend'; npm run dev"
)

Write-Host 'Expo neste terminal (web: tecla w -> http://localhost:8081)' -ForegroundColor Green
Write-Host ''

Set-Location -LiteralPath $frontend
if (-not (Test-Path 'node_modules')) {
  Write-Host 'Instalando dependencias do frontend...' -ForegroundColor Yellow
  npm install
}
npm start
