#!/bin/bash
# Easypanel → OpenClaw → Console — libera DMs de qualquer número (produção).
set -e
CFG="${OPENCLAW_STATE_DIR:-/home/node/.openclaw}/openclaw.json"
export CFG

node << 'NODE'
const fs = require('fs')
const p = process.env.CFG || '/home/node/.openclaw/openclaw.json'
let c = {}
try {
  c = JSON.parse(fs.readFileSync(p, 'utf8'))
} catch (e) {
  console.error('[erro] Não leio', p, '-', e.message)
  process.exit(1)
}

c.channels = c.channels || {}
c.channels.whatsapp = c.channels.whatsapp || {}
c.channels.whatsapp.dmPolicy = 'open'
c.channels.whatsapp.allowFrom = ['*']

const accounts = c.channels.whatsapp.accounts
if (accounts && typeof accounts === 'object') {
  for (const id of Object.keys(accounts)) {
    const a = accounts[id]
    if (!a || typeof a !== 'object') continue
    a.dmPolicy = 'open'
    a.allowFrom = ['*']
  }
}

fs.writeFileSync(p, JSON.stringify(c, null, 2))
console.log('[ok] dmPolicy=open allowFrom=["*"] em', p)
console.log('Reinicia o serviço OpenClaw no Easypanel (Deploy/Restart).')
NODE
