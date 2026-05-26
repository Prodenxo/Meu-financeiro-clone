# OpenClaw — corrigir erro ao receber áudio (WhatsApp)

O Meu Financeiro **não transcreve áudio** no backend. A transcrição é feita pelo **OpenClaw** (`tools.media.audio` no `openclaw.json`). Se falhar, o Midas diz que não conseguiu ouvir/transcrever.

Documentação oficial: https://docs.openclaw.ai/nodes/audio

---

## Sintomas

- Utilizador manda **nota de voz** no WhatsApp.
- Midas responde que **não conseguiu transcrever** o áudio (ou ignora o pedido).
- Nos logs do gateway pode aparecer falha STT ou corpo da mensagem só com `<media:audio>`.

---

## Causas comuns

1. **`tools.media.audio` não configurado** ou sem API key (OpenAI / Groq / Deepgram).
2. **OpenClaw desatualizado** — bugs antigos em áudio no WhatsApp (atualizar imagem).
3. **Áudio > 20 MB** (`maxBytes` padrão) — tenta áudio mais curto.
4. **Z-API relay só com texto** — se a mensagem passar pelo webhook Z-API sem áudio, o relay envia `text: ""` (ver secção Z-API abaixo).

---

## Correção no VPS (Easypanel → Console OpenClaw)

### 1. Ver versão e doctor

```bash
openclaw --version
openclaw doctor
openclaw doctor --fix
```

Atualiza o serviço OpenClaw no Easypanel se a versão for antiga (2026.4.x recente recomendado).

### 2. Editar `~/.openclaw/openclaw.json`

Garante que existe secção **`tools.media.audio`** (ajusta a chave de API que já usas no agente).

**Opção A — OpenAI** (mesma key do GPT do Midas, se tiveres):

```json
{
  "tools": {
    "media": {
      "audio": {
        "enabled": true,
        "maxBytes": 20971520,
        "scope": { "default": "allow" },
        "models": [
          { "provider": "openai", "model": "gpt-4o-mini-transcribe" }
        ]
      }
    }
  }
}
```

No Easypanel → Environment do OpenClaw: `OPENAI_API_KEY=sk-...` (ou a env que o teu `openclaw.json` já referencia em `models.providers`).

**Opção B — Groq** (Whisper barato/rápido):

```json
{
  "plugins": {
    "entries": {
      "groq": { "enabled": true }
    }
  },
  "tools": {
    "media": {
      "audio": {
        "enabled": true,
        "scope": { "default": "allow" },
        "models": [{ "provider": "groq" }]
      }
    }
  }
}
```

Env: `GROQ_API_KEY=gsk_...`

**Importante:** funde com o JSON existente (não apagues `agents`, `channels.whatsapp`, etc.). Usa `node -e` ou editor no volume persistente.

### 3. Reiniciar gateway

```bash
openclaw gateway restart
```

### 4. Teste

1. Manda um áudio **curto** (5–15 s): *"qual o meu saldo?"* ou *"emite nota de 500 reais"*.
2. Nos logs do contentor, procura `transcri` / `[Audio]` / `gpt-4o-mini-transcribe` ou `groq`.
3. O Midas deve responder ao **conteúdo** do áudio, não pedir para repetir.

---

## Workaround imediato (utilizador)

Enquanto o STT não estiver estável: **escrever por texto** no WhatsApp — o fluxo NFSe/DAS/lançamentos funciona igual.

---

## Se usares Z-API → relay (n8n/OpenClaw HTTP)

O ficheiro `zapi-inbound.service.js` do backend **só extrai `text.message`**. Notas de voz na Z-API **não viram texto** no relay.

Para áudio com Z-API precisas de:

- WhatsApp ligado **directamente** ao OpenClaw (Baileys / canal WhatsApp do gateway), **ou**
- Estender o webhook Z-API para baixar o áudio e transcrever antes do relay (fora do escopo actual).

**Recomendação Meu Financeiro:** um único canal WhatsApp no **OpenClaw** (sem disputar com Z-API no mesmo número).

---

## SOUL

Após alterar `openclaw-midas-SOUL.md` (secção áudio), regenera `SOUL.md.b64.part01`–`part08` e redeploy no workspace.
