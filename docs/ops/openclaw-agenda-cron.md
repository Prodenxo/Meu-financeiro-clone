# OpenClaw — lembretes de agenda (07:00 e 21:00)

Mensagens automáticas do tipo *"você tem compromissos agendados"* + *"telefone ausente"* vêm do **cron/heartbeat do OpenClaw** no VPS (não do backend Node). Este doc corrige **horário**, **silêncio quando não há eventos** e **telefone no job**.

---

## 0. Só para ti (teste) vs todos os utilizadores da app

| Modo | Como funciona | Quando usar |
|------|----------------|-------------|
| **Chat (resposta)** | Cada pessoa escreve no WhatsApp do Midas → OpenClaw vê o **remetente** → `phone` no `mf-curl` → `n8n_link` → dados **dessa** conta. | **Produção** — já é multi-utilizador. |
| **Cron OpenClaw com 1 telefone fixo** | Um job com `TELEFONE_DESTINO_55` no prompt. | **Só o teu número** (dev / piloto). |
| **Cron no backend (produção)** | `GET /api/cron/agenda-lembretes?slot=manha\|noite` — percorre `n8n_link`, consulta agenda de cada `user_id`, envia WhatsApp **só** quem tiver eventos. | **Produção** — lembretes 07:00 e 21:00. |

**Importante:** configurar o robô “para ti” no cron **não escala** para mil utilizadores. Para todos:

1. **Conversas:** um gateway OpenClaw + um número WhatsApp; `SOUL.md` + `mf-curl` com o telefone **do remetente** (já está assim).
2. **Lembretes automáticos:** não duplicar um cron OpenClaw por cliente — usar **job no backend** que itera utilizadores, igual ao DAS automático (`MEI_DAS_AUTO_WHATSAPP` + Z-API ou n8n).

Requisitos por utilizador em produção:

- Telefone guardado no perfil → linha em `n8n_link`.
- Opt-in explícito para lembretes WhatsApp (recomendado: flag no perfil antes de implementar o cron global).
- Silêncio se agenda vazia (sem spam).

**Desactiva** os jobs de agenda no **OpenClaw** (evita mensagens genéricas às 4h/18h). Usa só o cron do backend abaixo.

### Backend implementado (`agenda-reminders.service.js`)

| Env | Valor |
|-----|--------|
| `AGENDA_WHATSAPP_REMINDERS_ENABLED` | `true` |
| `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` + `ZAPI_CLIENT_TOKEN` | envio directo (ver `zapi-whatsapp-backend.md`) |
| `N8N_WHATSAPP_WEBHOOK_URL` | opcional (legado; só se ainda não migrou) |
| `CRON_SECRET` | Bearer no agendador |

| Horário (Brasil) | Chamada |
|------------------|---------|
| **07:00** | `GET /api/cron/agenda-lembretes?slot=manha` + `Authorization: Bearer <CRON_SECRET>` |
| **21:00** | `GET /api/cron/agenda-lembretes?slot=noite` + mesmo header |

Comportamento em código:

- Percorre todos os `n8n_link` com telefone.
- `list_calendar_events` para o dia alvo (fuso `America/Sao_Paulo`): **manhã = hoje**, **noite = amanhã**.
- **`events.length === 0` → não envia nada** (sem mensagem de agenda vazia).
- **Com eventos →** uma mensagem com lista (Bom dia + compromissos de **hoje**; Boa noite + compromissos de **amanhã**).

Teste manual:

```bash
curl -s "http://127.0.0.1:3333/api/cron/agenda-lembretes?slot=manha" \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

**cron-job.org:** o timeout máximo de espera é **30s**. O endpoint responde **202 Accepted** de imediato e processa em background (WhatsApp continua a ser enviado). Para ver o JSON completo no terminal, use `?sync=1` (pode demorar vários segundos).

---

## 1. Horário errado (4h e 18h em vez de 7h e 21h)

Se o cron estiver em **UTC** sem fuso:

| Cron (UTC) | Hora em Brasília (≈) |
|------------|----------------------|
| `0 7 * * *` | **04:00** |
| `0 21 * * *` | **18:00** |

**Correção:** usar fuso **`America/Sao_Paulo`** no job ou ajustar expressões.

### Opção A — timezone no OpenClaw (recomendado)

No `openclaw.json` (Easypanel → consola → `~/.openclaw/openclaw.json`), cada job de agenda deve ter `tz`:

```json
{
  "cron": {
    "jobs": [
      {
        "name": "agenda-manha",
        "schedule": "0 7 * * *",
        "tz": "America/Sao_Paulo",
        "enabled": true,
        "message": "… ver secção 2 …"
      },
      {
        "name": "agenda-noite",
        "schedule": "0 21 * * *",
        "tz": "America/Sao_Paulo",
        "enabled": true,
        "message": "… ver secção 2 …"
      }
    ]
  }
}
```

(A estrutura exacta pode variar conforme a versão do OpenClaw — no dashboard: **Cron** / **Scheduled tasks**, confirma que o fuso é **America/Sao_Paulo** e os minutos são **7** e **21**.)

### Opção B — só UTC no servidor

| Desejado (BRT) | Cron em UTC |
|----------------|-------------|
| 07:00 | `0 10 * * *` |
| 21:00 | `0 0 * * *` (meia-noite UTC = 21h do dia anterior em BRT; validar no painel) |

Preferir **Opção A**.

---

## 2. Prompt do job (colar no `message` / instrução do cron)

Substitui o texto genérico actual. Troca `TELEFONE_DESTINO_55` pelo número **só dígitos** com DDI 55 (o mesmo do WhatsApp ligado à app / `n8n_link`).

```text
Lembrete automático de agenda — Meu Financeiro.

Telefone deste job (usar SEMPRE no JSON do mf-curl): TELEFONE_DESTINO_55

1) Data de hoje em America/Sao_Paulo no formato YYYY-MM-DD.
2) exec: /home/node/.openclaw/workspace/mf-curl.sh '{"phone":"TELEFONE_DESTINO_55","action":"list_calendar_events","payload":{"data":"AAAA-MM-DD"}}'
3) Se a resposta tiver data.events com pelo menos 1 item: envia UMA mensagem curta em português listando cada compromisso (título e horário se existir).
4) Se data.empty for true, ou events for [], ou count 0: NÃO envies mensagem nenhuma ao utilizador (resposta completamente vazia / NO_REPLY).
5) Se ok for false, telefone inválido, ou utilizador não encontrado: NÃO envies mensagem (nem peça para atualizar telefone — isso é só em conversa manual).
6) PROIBIDO dizer "você tem compromissos" sem ter listado eventos na API.
7) PROIBIDO dizer que não há compromissos ou que a agenda está vazia.
```

Reinicia o gateway após alterar: `openclaw gateway restart` (ou redeploy do serviço Easypanel).

---

## 3. Telefone no perfil da app

O cron **não** tem “remetente do chat”. Por isso o job precisa do número fixo acima **e** esse número tem de existir em `n8n_link` (telefone guardado no perfil Meu Financeiro).

Teste na consola do contentor:

```bash
/home/node/.openclaw/workspace/mf-curl.sh '{"phone":"TELEFONE_DESTINO_55","action":"resolve_user"}'
```

Deve devolver `ok: true` e `userId`. Se falhar, corrige o telefone no **perfil da app** antes de esperar lembretes.

---

## 4. O que o backend devolve (`list_calendar_events`)

- **Com eventos:** `message` tipo *"N compromisso(s) em DD/MM/YYYY"*, `data.events[]`.
- **Sem eventos:** HTTP 200, `data.empty: true`, `events: []` — o agente deve **ficar em silêncio**.
- **Telefone inválido:** erro na API — o agente deve **ficar em silêncio** no cron (não spammar pedido de telefone).

Implementação: `Site/backend/src/services/calendar-events.service.js`.

---

## 5. Checklist rápido

- [ ] Cron só às **07:00** e **21:00** (`America/Sao_Paulo`)
- [ ] Job com **TELEFONE_DESTINO_55** correcto
- [ ] `resolve_user` OK no contentor
- [ ] Prompt do cron com regras de **silêncio** se vazio ou erro
- [ ] `SOUL.md` no workspace inclui secção **Lembretes automáticos de agenda** (ver `openclaw-midas-SOUL.md`)

---

## 6. Sincronizar SOUL no VPS

Copia o bloco actualizado de `Site/docs/ops/openclaw-midas-SOUL.md` para `~/.openclaw/workspace/SOUL.md` ou corre:

```bash
sh Site/docs/ops/openclaw-restore-midas.sh TELEFONE_DESTINO_55
```
