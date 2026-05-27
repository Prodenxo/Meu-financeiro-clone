#!/usr/bin/env node
/**
 * Regenera SOUL.md.b64.txt e SOUL.md.b64.part01..08.txt a partir de openclaw-midas-SOUL.md
 * Uso (no PC):
 *   cd Site/docs/ops/scripts
 *   node regenerate-soul-b64-parts.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const opsDir = path.join(__dirname, '..')
const soulPath = path.join(opsDir, 'openclaw-midas-SOUL.md')
const outDir = __dirname
const chunkSize = 3000

if (!fs.existsSync(soulPath)) {
  console.error('ERRO: nao encontrado', soulPath)
  process.exit(1)
}

const soul = fs.readFileSync(soulPath)
const b64 = soul.toString('base64')
const fullPath = path.join(outDir, 'SOUL.md.b64.txt')
fs.writeFileSync(fullPath, b64)

const parts = []
for (let i = 0; i < b64.length; i += chunkSize) {
  parts.push(b64.slice(i, i + chunkSize))
}

parts.forEach((chunk, idx) => {
  const n = String(idx + 1).padStart(2, '0')
  const partPath = path.join(outDir, `SOUL.md.b64.part${n}.txt`)
  fs.writeFileSync(partPath, chunk)
  console.log('OK', partPath, chunk.length)
})

const ws = '/home/node/.openclaw/workspace'
const dest = 'SOUL.md'

console.log('')
console.log('Total base64:', b64.length, 'chars |', parts.length, 'partes')
console.log('SOUL.md decodificado:', soul.length, 'bytes')
console.log('Pasta:', outDir)
console.log('')
console.log('========== DEPLOY no Easypanel (Bash OpenClaw) ==========')
console.log(`cp ${ws}/${dest} ${ws}/${dest}.bak 2>/dev/null || true`)
console.log(`rm -f /tmp/${dest}.b64`)
console.log('')

parts.forEach((chunk, idx) => {
  const n = idx + 1
  const tag = `P${String(n).padStart(2, '0')}`
  const partFile = `SOUL.md.b64.part${String(n).padStart(2, '0')}.txt`
  const op = n === 1 ? '>' : '>>'
  const expected = parts.slice(0, n).reduce((s, c) => s + c.length, 0)
  console.log(`--- Parte ${n}/${parts.length} ---`)
  console.log(`cat ${op} /tmp/${dest}.b64 << '${tag}'`)
  console.log(`  Cole: ${partFile} (Ctrl+A, Ctrl+C, colar, Enter)`)
  console.log(tag)
  console.log(`wc -c /tmp/${dest}.b64   # esperado ~${expected} (total ${b64.length})`)
  console.log('')
})

console.log('--- Decodificar (cole o bloco inteiro) ---')
console.log(`tr -d '\\n' < /tmp/${dest}.b64 > /tmp/${dest}.b64.clean`)
console.log(`wc -c /tmp/${dest}.b64.clean   # DEVE ser ${b64.length}`)
console.log(
  `node -e "require('fs').writeFileSync('${ws}/${dest}', Buffer.from(require('fs').readFileSync('/tmp/${dest}.b64.clean','utf8'), 'base64'))"`,
)
console.log(`wc -c ${ws}/${dest}`)
console.log(`grep -E "conversa normal|Áudio" ${ws}/${dest} | head -n 3`)
console.log('openclaw gateway restart')
console.log('WhatsApp: /new')
