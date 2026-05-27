# OpenClaw — corrigir erro ao receber áudio (WhatsApp)

Com **Z-API → relay** (`OPENCLAW_ZAPI_RELAY_URL`), o backend **transcreve notas de voz** antes de enviar texto ao OpenClaw (`whatsapp-audio-transcription.service.js`). Requer `OPENAI_API_KEY` ou `GROQ_API_KEY` no serviço **backend**.

Se o WhatsApp estiver **directamente** no OpenClaw (sem Z-API), a transcrição continua a ser do **OpenClaw** (`tools.media.audio` no `openclaw.json`).

Documentação oficial: https://docs.openclaw.ai/nodes/audio

---

## Sintomas

- Utilizador manda **nota de voz** no WhatsApp.
- Midas responde que **não conseguiu transcrever** o áudio (ou ignora o pedido).
- Midas pergunta *"O que gostaria que eu fizesse com o áudio?"* — **comportamento errado** (SOUL proíbe; causa: STT não correu e o modelo vê só `media:audio`).
- Nos logs do gateway pode aparecer falha STT ou corpo da mensagem só com `<media:audio>`.

**Comportamento desejado:** transcrever **antes** do agente (OpenClaw `tools.media.audio` ou backend Z-API); o Midas **responde como em chat de texto** — conversa, dúvidas, conselhos **ou** acções na app (nota, DAS, lançamento) quando o pedido pedir — sem menu de opções nem “não tenho ferramenta de transcrição” quando a transcrição já veio no `[Audio]`.

---

## Causas comuns

1. **`tools.media.audio` não configurado** ou sem API key (OpenAI / Groq / Deepgram).
2. **OpenClaw desatualizado** — bugs antigos em áudio no WhatsApp (atualizar imagem).
3. **Áudio > 20 MB** (`maxBytes` padrão) — tenta áudio mais curto.
4. **Z-API sem chave STT** — nota de voz chega ao webhook mas `OPENAI_API_KEY` / `GROQ_API_KEY` não estão no **backend** → relay não é feito (`audio_transcription_failed`). Ver secção Z-API abaixo.

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
2. Nos logs do contentor (`openclaw gateway` com `--verbose`), procura linhas de **transcription** / substituição do body por `[Audio]`.
3. No painel OpenClaw, a mensagem do utilizador deve mostrar **`[Audio]` com texto**, não só `media:audio` cru.
4. O Midas deve **agir** (responder, `exec` mf-curl, preview NFSe, etc.) — **nunca** perguntar se queres transcrever ou interpretar.

### 5. SOUL (obrigatório no workspace)

Actualiza `SOUL.md` a partir de `openclaw-midas-SOUL.md` (secção áudio) e redeploy (`SOUL.md.b64.part01`–`part08`). Sem isto, mesmo com STT activo o modelo pode perguntar em vez de executar.

---

## Workaround imediato (utilizador)

Enquanto o STT não estiver estável: **escrever por texto** no WhatsApp — o fluxo NFSe/DAS/lançamentos funciona igual.

---

## Z-API → relay OpenClaw (Meu Financeiro)

Fluxo: WhatsApp → Z-API → `POST /api/webhooks/zapi/inbound` → STT no backend → `OPENCLAW_ZAPI_RELAY_URL`.

### Variáveis no **backend** (Easypanel / `.env`)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `OPENCLAW_ZAPI_RELAY_URL` | Sim | URL HTTP do OpenClaw que recebe `{ phone, text }` |
| `OPENAI_API_KEY` **ou** `GROQ_API_KEY` | Sim (áudio) | Whisper / gpt-4o-mini-transcribe |
| `WHATSAPP_AUDIO_TRANSCRIPTION_ENABLED` | Não | Default `true`; `false` desliga STT |
| `WHATSAPP_TRANSCRIPTION_OPENAI_API_KEY` | Não | Chave só para STT (se diferente da do agente) |

### Diagnóstico

```bash
curl -s https://SEU_BACKEND/api/webhooks/zapi/monitor
```

Resposta esperada: `audioTranscription.enabled: true`, `provider: "openai"` ou `"groq"`, `configured: true`.

### Deploy

Após alterar `.env`, **reinicia o backend**. Envia uma nota de voz curta; nos logs: `[ZAPI] transcrição` só aparece em falha.

**Recomendação:** um único número WhatsApp — ou Z-API+relay **ou** OpenClaw directo, para não duplicar respostas.

**Comandos com `/`:** mensagens que começam com `/` (ex. `/pendentes`, `/aprovar email@x.com`) **não** são reencaminhadas ao OpenClaw — ficam no backend (aprovação de cadastros). Ver `access-request-audit.md`.

---

## SOUL

Após alterar `openclaw-midas-SOUL.md` (secção áudio), regenera `SOUL.md.b64.part01`–`part08` e redeploy no workspace.
