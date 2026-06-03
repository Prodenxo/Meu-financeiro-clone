#!/usr/bin/env node
/**
 * Gera instruções para instalar mf-pin + mf-curl no console OpenClaw (sem repo no contentor).
 *
 * Uso:
 *   node print-mf-pin-install-console.mjs
 *   node print-mf-pin-install-console.mjs --url="https://raw.githubusercontent.com/contabhub/Meu-financeiro/Master/docs/ops/easypanel-console-install-mf-pin-and-curl.sh"
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const installPath = path.join(__dirname, '..', 'easypanel-console-install-mf-pin-and-curl.sh')
const urlArg = process.argv.find((a) => a.startsWith('--url='))
const rawUrl = (urlArg ? urlArg.slice('--url='.length) : process.env.OPENCLAW_MF_PIN_INSTALL_RAW_URL || '').trim()

if (!fs.existsSync(installPath)) {
  console.error('ERRO: não encontrado', installPath)
  process.exit(1)
}

const bytes = fs.statSync(installPath).size
console.log('')
console.log('Instalador local:', installPath, `(${bytes} bytes)`)
console.log('')
console.log('='.repeat(72))
console.log('404 no curl? O ficheiro precisa estar no GitHub em:')
console.log('  docs/ops/easypanel-console-install-mf-pin-and-curl.sh  (branch Master)')
console.log('Copia de Site/docs/ops/... para o repo Meu-financeiro e faz push.')
console.log('='.repeat(72))
console.log('')

if (rawUrl) {
  console.log('--- Método 1: curl (1 colagem no Easypanel OpenClaw → Bash) ---')
  console.log('')
  console.log(`curl -fsSL "${rawUrl}" -o /tmp/install-mf-pin.sh`)
  console.log('bash /tmp/install-mf-pin.sh')
  console.log('')
} else {
  console.log('--- Método 1: curl do GitHub ---')
  console.log('')
  console.log('1. Push do ficheiro para docs/ops/ no repo contabhub/Meu-financeiro')
  console.log('2. Raw → copia URL')
  console.log('3. Rode:')
  console.log('   node print-mf-pin-install-console.mjs --url="https://raw.githubusercontent.com/..."')
  console.log('')
}

console.log('--- Método 2 (recomendado agora): colar o script inteiro ---')
console.log('')
console.log('No PC: abra e copie TUDO de:')
console.log('  Site/docs/ops/easypanel-console-install-mf-pin-and-curl.sh')
console.log('Cole no Easypanel → OpenClaw → Console → Bash → Enter')
console.log('')

const b64 = fs.readFileSync(installPath).toString('base64')
console.log('--- Método 3: uma colagem (base64 → /tmp/install-mf-pin.sh) ---')
console.log('')
console.log(`echo '${b64}' | base64 -d > /tmp/install-mf-pin.sh && bash /tmp/install-mf-pin.sh`)
console.log('')

console.log('Requer MF_API_URL e OPENCLAW_WEBHOOK_SECRET no Environment do OpenClaw.')
console.log('Depois: Restart contentor + WhatsApp /new')
console.log('')
console.log('GitHub 404: copie o .sh para docs/ops/ no repo Meu-financeiro e push.')
console.log('')
