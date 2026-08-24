import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('support.routes expõe ticket-form e tickets com auth e multer', () => {
  const source = readFileSync(join(root, 'src/routes/support.routes.js'), 'utf8')
  assert.match(source, /router\.get\('\/ticket-form',\s*requireAuth/)
  assert.match(source, /router\.post\(\s*'\/tickets'/)
  assert.match(source, /requireAuth/)
  assert.match(source, /upload\.array\('anexos',\s*10\)/)
})

test('routes/index monta /support', () => {
  const source = readFileSync(join(root, 'src/routes/index.js'), 'utf8')
  assert.match(source, /router\.use\('\/support',\s*supportRoutes\)/)
})
