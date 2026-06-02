#!/usr/bin/env node
/**
 * Gera UM comando para colar no console OpenClaw (Easypanel) — sem partes b64.
 *
 * Uso:
 *   node print-soul-deploy-one-liner.mjs
 *   node print-soul-deploy-one-liner.mjs --url "https://raw.githubusercontent.com/ORG/REPO/main/Site/docs/ops/openclaw-midas-SOUL.md"
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const soulPath = path.join(__dirname, '..', 'openclaw-midas-SOUL.md')
const workspaceSoul = '/home/node/.openclaw/workspace/SOUL.md'

const urlArg = process.argv.find((a) => a.startsWith('--url='))
const rawUrl = (urlArg
  ? urlArg.slice('--url='.length)
  : process.env.OPENCLAW_SOUL_RAW_URL || ''
).trim()

if (!fs.existsSync(soulPath)) {
  console.error('ERRO: não encontrado', soulPath)
  process.exit(1)
}

const soul = fs.readFileSync(soulPath, 'utf8')
const bytes = Buffer.byteLength(soul, 'utf8')

console.log('')
console.log('SOUL local:', soulPath)
console.log('Tamanho:', bytes, 'bytes (~', Math.ceil(bytes / 1024), 'KB)')
console.log('')
console.log('='.repeat(72))
console.log('IMPORTANTE — comandos /pendentes, /aprovar, etc.')
console.log('Não precisam de SOUL: o backend Z-API bloqueia o relay ao OpenClaw.')
console.log('Só faça deploy do backend. SOUL só para regras do bot (DAS, NFSe, áudio…).')
console.log('='.repeat(72))
console.log('')

if (rawUrl) {
  console.log('--- Método 1 (recomendado): curl do Git — 1 colagem no Easypanel ---')
  console.log('')
  console.log('cp', workspaceSoul + '.bak 2>/dev/null || true')
  console.log(`curl -fsSL "${rawUrl}" -o "${workspaceSoul}"`)
  console.log(`wc -c "${workspaceSoul}"`)
  console.log(
    `grep -E "Prioridade 1|list_categories|finanças SIM" "${workspaceSoul}" | head -n 3 || true`,
  )
  console.log('# Esperado wc -c: ~31264 (se der ~30817 o curl falhou — confira URL sem espaço no fim)')
  console.log('openclaw gateway restart')
  console.log('')
  console.log('Depois no WhatsApp: /new')
  console.log('')
} else {
  console.log('--- Método 1: curl do Git (configure a URL uma vez) ---')
  console.log('')
  console.log('1. Commit + push do openclaw-midas-SOUL.md no GitHub')
  console.log('2. Copie a URL "Raw" do ficheiro (raw.githubusercontent.com/...)')
  console.log('3. Rode de novo:')
  console.log('   node print-soul-deploy-one-liner.mjs --url="https://raw.githubusercontent.com/..."')
  console.log('')
  console.log('Opcional no Easypanel (env do OpenClaw): OPENCLAW_SOUL_RAW_URL=<mesma URL>')
  console.log('')
}

console.log('--- Método 2: docker cp (SSH no VPS — 1 comando no host, sem colar SOUL) ---')
console.log('')
console.log('# No PC (ajusta caminhos e nome do contentor):')
console.log('# docker cp "Site/docs/ops/openclaw-midas-SOUL.md" NOME_CONTAINER:' + workspaceSoul)
console.log('# docker exec NOME_CONTAINER openclaw gateway restart')
console.log('')
console.log('# Nome do contentor: docker ps | grep -i openclaw')
console.log('')

console.log('--- Método 3 (legado): partes b64 — só se curl e docker cp não derem ---')
console.log('   node regenerate-soul-b64-parts.mjs')
console.log('   Ver: docs/ops/easypanel-console-deploy-soul.md')
console.log('')
