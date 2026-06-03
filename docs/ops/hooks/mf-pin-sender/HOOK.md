---
name: mf-pin-sender
description: "Grava o telefone do remetente WhatsApp antes do agente chamar mf-curl.sh"
metadata: { "openclaw": { "emoji": "📌", "events": ["message:received"] } }
---

# mf-pin-sender

Em cada mensagem recebida, grava dígitos do remetente em
`~/.openclaw/workspace/.mf-inbound-sender`.

O script `mf-curl.sh` usa esse ficheiro **em vez do 1º argumento** quando o modelo
colar o número errado (ex.: Leonardo em chat da Angélica).

Instalação: ver `openclaw-mf-pin-sender-hook.md`.
