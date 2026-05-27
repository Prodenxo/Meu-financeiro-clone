# OpenClaw — lembretes de agenda (07:00 e 21:00)

Mensagens automáticas do tipo *"você tem compromissos agendados"* + *"telefone ausente"* vêm do **cron/heartbeat do OpenClaw** no VPS (não do backend Node). Este doc corrige **horário**, **silêncio quando não há eventos** e **telefone no job**.

---

## 0. Só para ti (teste) vs todos os utilizadores da app

| Modo | Como funciona | Quando usar |
|------|----------------|-------------|
| **Chat (resposta)** | Cada pessoa escreve no WhatsApp do Midas → OpenClaw vê o **remetente** → `phone` no `mf-curl` → `n8n_link` → dados **dessa** conta. | **Produção** — já é multi-utilizador. |
| **Cron OpenClaw com 1 telefone fixo** | Um job com `TELEFONE_DESTINO_55` no prompt. | **Só o teu número** (dev / piloto). |
| **Scheduler no backend (recomendado)** | Com `AGENDA_WHATSAPP_REMINDERS_ENABLED=true`, o Node dispara **07:00** e **21:00** (`America/Sao_Paulo`) e envia via **Z-API** — sem cron-job.org nem OpenClaw. | **Produção** |
| **OpenClaw / mf-agenda-cron.sh** | Só se quiseres disparo manual ou versão OpenClaw com cron. | Opcional |
| **cron-job.org → backend** | Retries / “Executar agora” geraram **spam**. | **Desligar** se o scheduler interno estiver activo |
| **Cron OpenClaw com 1 telefone + `list_calendar_events`** | Só lembra **uma** pessoa por job. | Não usar para a base inteira. |

**Importante:** o OpenClaw **não** percorre mil utilizadores sozinho no prompt. Ele só **dispara** o lote no backend (1 exec por horário). Quem envia WhatsApp é o **backend** + Z-API.

Requisitos por utilizador:

- Telefone em `n8n_link`.
- Silêncio se agenda vazia (sem spam).

**Desactiva:**

1. Os 2 jobs **MF agenda manhã/noite** no **cron-job.org**.
2. Jobs OpenClaw antigos que pedem `list_calendar_events` com telefone fixo (duplicam ou erram o horário).

### Backend + Z-API + scheduler interno (recomendado)

| Env (Easypanel → **backend**) | Valor |
|--------------------------------|--------|
| `AGENDA_WHATSAPP_REMINDERS_ENABLED` | `true` |
| `AGENDA_WHATSAPP_SCHEDULER_ENABLED` | omitir ou `true` (`false` = só endpoint HTTP `/api/cron/agenda-lembretes`) |
| `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` + `ZAPI_CLIENT_TOKEN` | envio Z-API |

Após **deploy/restart** do backend, no log deve aparecer:

`[agenda-reminders] Scheduler interno ativo (7h e 21h America/Sao_Paulo)`

| Horário (Brasil) | O quê |
|------------------|--------|
| **07:00** | Lote `manha` (compromissos de hoje) |
| **21:00** | Lote `noite` (compromissos de amanhã) |

Dedup no mesmo dia: memória + `/tmp` — evita reenvio se alguém chamar o endpoint HTTP à parte.

**Desactiva** os jobs no **cron-job.org** (senão os dois sistemas disparam).

### Alternativa: HTTP externo ou OpenClaw

| Horário (Brasil) | OpenClaw (`exec`) ou cron-job.org |
|------------------|-----------------------------------|
| **07:00** | `mf-agenda-cron.sh manha` ou `GET .../agenda-lembretes?slot=manha&sync=1` |
| **21:00** | `mf-agenda-cron.sh noite` ou `...&slot=noite&sync=1` |

Só usar se `AGENDA_WHATSAPP_SCHEDULER_ENABLED=false`.

### Sem `openclaw cron` (versão 2026.4.x)

Se `openclaw cron list` imprimir só a versão / “comando cron não disponível”, o agendador **interno** do OpenClaw não está disponível na CLI. Usa **uma** destas opções:

**Opção 1 — crontab no contentor** (se existir `crontab`):

Colar `Site/docs/ops/scripts/install-mf-agenda-crontab-openclaw.sh` no Console. Agenda 7h/21h **sem disparar agora**.

**Opção 2 — cron-job.org** (2 jobs só, sem “Run now” repetido):

| Job | Horário (painel: America/Sao_Paulo ou UTC+Brasil) | URL |
|-----|---------------------------------------------------|-----|
| MF agenda manhã | 07:00 | `GET https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/cron/agenda-lembretes?slot=manha&sync=1` |
| MF agenda noite | 21:00 | `GET .../api/cron/agenda-lembretes?slot=noite&sync=1` |

Header: `Authorization: Bearer <CRON_SECRET>`  
Desactiva retries agressivos / não cliques “Executar agora” várias vezes. O backend ignora lote duplicado no mesmo dia.

**Opção 3 — actualizar OpenClaw** para build com `openclaw cron add` (futuro).

Comportamento:

- Percorre `n8n_link` (1 WhatsApp por telefone).
- Manhã = compromissos de **hoje**; noite = **amanhã** (São Paulo).
- Sem eventos → não envia.
- **Dedup sem Supabase:** lock em memória + ficheiro em `/tmp` + um lote de cada vez (`?sync=1`).

Teste manual no contentor OpenClaw:

```bash
/home/node/.openclaw/workspace/mf-agenda-cron.sh manha
```

Teste forçado (ignora dedup): `.../agenda-lembretes?slot=manha&sync=1&force=1`

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
