#!/bin/sh
# Funde tools.media.audio no openclaw.json (transcrição automática de notas de voz).
# Onde correr: consola do contentor OpenClaw no Easypanel (utilizador node).
#
# Pré-requisito: OPENAI_API_KEY ou GROQ_API_KEY nas env do serviço OpenClaw.
# Depois: openclaw gateway restart  (ou reiniciar o serviço no Easypanel)

set -e

node << 'NODE'
const fs = require('fs')
const p = (process.env.HOME || '/home/node') + '/.openclaw/openclaw.json'

const audioBlock = {
  enabled: true,
  maxBytes: 20971520,
  scope: { default: 'allow' },
  echoTranscript: false,
  models: [{ provider: 'openai', model: 'gpt-4o-mini-transcribe' }],
}

let cfg = {}
if (fs.existsSync(p)) {
  try {
    cfg = JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    console.error('ERRO: openclaw.json inválido:', e.message)
    process.exit(1)
  }
} else {
  console.warn('AVISO:', p, 'não existia — será criado')
}

cfg.tools = cfg.tools || {}
cfg.tools.media = cfg.tools.media || {}
cfg.tools.media.audio = { ...cfg.tools.media.audio, ...audioBlock }

fs.mkdirSync(require('path').dirname(p), { recursive: true })
fs.writeFileSync(p, JSON.stringify(cfg, null, 2))
console.log('OK: tools.media.audio gravado em', p)
console.log(JSON.stringify(cfg.tools.media.audio, null, 2))
NODE

echo ''
echo 'Próximo: reinicia o gateway (openclaw gateway restart) ou o serviço no Easypanel.'
