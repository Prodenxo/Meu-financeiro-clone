# Checklist — Midas / OpenClaw em produção

Ordem recomendada. Marca cada item antes de considerar “no ar”.

---

## 1. Código no Git

- [ ] Commit + push da pasta `Site/` (backend + docs) para a branch que o **Easypanel backend** faz deploy (ex.: `Master`).
- [ ] Confirma no GitHub que existem:
  - `create_calendar_event` + Meet
  - `openclaw-access-requests` (cadastros)
  - `agenda-reminders.scheduler.js` (lembretes 7h/21h no backend)
  - mensagem aprovação com grupo WhatsApp

---

## 2. Easypanel — Backend (Site)

**Redeploy** do serviço backend após o push.

### Env obrigatórias (produção)

| Variável | Valor |
|----------|--------|
| `OPENCLAW_WEBHOOK_SECRET` | Igual ao OpenClaw (`Authorization: Bearer` no mf-curl) |
| `ACCESS_REQUEST_WHATSAPP_NOTIFY_ENABLED` | `true` |
| `AGENDA_WHATSAPP_REMINDERS_ENABLED` | `true` |
| `ZAPI_INSTANCE_ID` + `ZAPI_TOKEN` + `ZAPI_CLIENT_TOKEN` | Envio WhatsApp (Z-API) |

### Env opcionais

| Variável | Valor |
|----------|--------|
| `ACCESS_REQUEST_WHATSAPP_SUPPORT_GROUP_URL` | Link do grupo suporte (se vazio, usa o padrão no código) |
| `AGENDA_WHATSAPP_SCHEDULER_ENABLED` | omitir ou `true` (7h/21h no próprio backend) |
| `ACCESS_REQUEST_NOTIFY_SUPERADMIN_EXTRA_PHONES` | Telefones extra de superadmin |

### Log após restart

Deve aparecer:

```text
[agenda-reminders] Scheduler interno ativo (7h e 21h America/Sao_Paulo)
[backend] rodando na porta ...
```

---

## 3. Easypanel — OpenClaw (Midas)

- [ ] **SOUL** já atualizado (`apply-soul-patches-all-easypanel.sh` — feito).
- [ ] **Restart** do serviço OpenClaw.
- [ ] Env:

| Variável | Valor |
|----------|--------|
| `MF_API_URL` | `https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action` |
| `OPENCLAW_WEBHOOK_SECRET` | **Mesmo** do backend |
| `CRON_SECRET` | Só se ainda usares cron-job.org (recomendado: **não**) |

- [ ] WhatsApp no gateway: sessão ligada (QR se precisar).
- [ ] Volume persistente em `/home/node/.openclaw` (senão redeploy apaga sessão).

---

## 4. Z-API / n8n (produção — OpenClaw directo)

- [ ] **Desactivar** workflow n8n `financas` (inbound WhatsApp).
- [ ] Z-API **não** aponta “ao receber” para o n8n.
- [ ] OpenClaw: `dmPolicy: open` + `allowFrom: ["*"]` — script `scripts/openclaw-allow-all-dms.sh`
- [ ] Guia completo: [`producao-completa-midas.md`](./producao-completa-midas.md)

---

## 5. Desligar duplicados (agenda)

- [ ] **cron-job.org**: pausar/apagar **MF agenda manhã** e **MF agenda noite**
- [ ] Lembretes passam a ser só o **scheduler do backend** (passo 2)

---

## 6. Testes de fumo (WhatsApp)

Com **superadmin**, depois de `/new` no chat do Midas:

| Teste | Mensagem | Esperado |
|-------|----------|----------|
| Cadastros | `mf pendentes` | Lista de solicitações (sem DAS) |
| Agenda | `Marca teste amanhã às 16h` | Compromisso criado (Google ligado na app) |
| Meet | `Reunião online sexta 10h com Meet` | Link `meet.google.com` na resposta |
| Aprovação | Aprovar um cadastro teste | WhatsApp ao cliente + link do grupo |

Teste API (PowerShell), troca telefone e segredo:

```powershell
curl.exe -s -X POST "https://auto-back-meufinanceiro-site.4tnf3f.easypanel.host/api/bot/openclaw/action" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer SEU_OPENCLAW_WEBHOOK_SECRET" `
  -d "{\"phone\":\"55SEUTELEFONE\",\"action\":\"list_access_requests\"}"
```

---

## 7. Rollback rápido

- Easypanel: redeploy da imagem/commit anterior do **backend**.
- OpenClaw: restaurar `SOUL.md.bak.*` no workspace ou colar SOUL antigo.
- Reativar cron-job.org só se desligares o scheduler interno.
