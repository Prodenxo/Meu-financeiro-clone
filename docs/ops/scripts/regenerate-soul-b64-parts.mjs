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

console.log('')
console.log('Total base64:', b64.length, 'chars |', parts.length, 'partes')
console.log('Pasta:', outDir)
console.log('')
console.log('No OpenClaw: P01..P08, wc final ~', b64.length, '| decode SOUL ~', soul.length, 'bytes')
