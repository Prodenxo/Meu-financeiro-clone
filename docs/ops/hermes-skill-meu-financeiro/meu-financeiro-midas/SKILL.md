---
name: meu-financeiro-midas
description: Lançamentos e consultas no Meu Financeiro via API Hermes (POST /api/bot/hermes/action).
version: 1.0.0
platforms: [windows]
metadata:
  hermes:
    tags: [financeiro, meu-financeiro, whatsapp]
required_environment_variables:
  - name: MEU_FINANCEIRO_API_URL
    prompt: URL completa do endpoint (ex. https://.../api/bot/hermes/action)
    help: Mesmo host do backend Easypanel + path /api/bot/hermes/action
    required_for: chamadas HTTP
  - name: MEU_FINANCEIRO_HERMES_SECRET
    prompt: Bearer segredo (igual a HERMES_WEBHOOK_SECRET no servidor)
    help: Authorization Bearer para o backend
    required_for: autenticação
---

# Meu Financeiro — Midas (API Hermes)

## Quando usar

Quando o utilizador quiser **registar entrada/saída**, **listar movimentos**, **testar ligação** ou **apagar** um lançamento no sistema Meu Financeiro (não inventar dados — chama o backend).

## Como chamar o backend (Windows)

1. Escreve o corpo do pedido num ficheiro JSON **UTF-8 sem BOM** (usa o script `write-json.ps1` ou o bloco PowerShell abaixo).
2. Corre o script `invoke-mf-action.ps1` com o caminho desse ficheiro.

O número `phone` no JSON deve ser o **telefone WhatsApp do remetente** (só dígitos, com DDI 55 se for o caso), igual ao que está em `n8n_link`.

### Ping (sem phone)

Cria `C:\Users\Usuário\AppData\Local\Temp\mf-ping.json` com conteúdo exatamente:

```json
{"action":"ping"}
```

Depois no terminal (PowerShell), a partir de qualquer pasta:

```powershell
& "${HERMES_SKILL_DIR}\scripts\invoke-mf-action.ps1" -JsonPath "C:\Users\Usuário\AppData\Local\Temp\mf-ping.json"
```

(Substitui `${HERMES_SKILL_DIR}` pelo caminho real da skill se o Hermes não substituir o token.)

### Criar despesa (exemplo)

Corpo JSON (ajusta phone, valores, categoria conforme o utilizador):

```json
{
  "phone": "5521999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "saida",
    "valor": 15.5,
    "classificacao": "Alimentação",
    "data": "2026-05-12",
    "status": "pago",
    "obs": "via WhatsApp Midas"
  }
}
```

### Listar

```json
{
  "phone": "5521999999999",
  "action": "list_transactions"
}
```

### Apagar

Só após **confirmação explícita** do utilizador. `payload.id` é o UUID vindo de `list_transactions`.

```json
{
  "phone": "5521999999999",
  "action": "delete_transaction",
  "payload": { "id": "UUID-AQUI" }
}
```

## Regras

- Se faltar **valor**, **data**, **tipo** ou **categoria**, pergunta antes de criar.
- **Nunca** apagues sem o utilizador confirmar qual movimento (valor + data ou o ID).
- Se o JSON de resposta disser que não há utilizador para o telefone, pede para guardar o telefone no perfil na app.

## Script

- `scripts/invoke-mf-action.ps1` — envia o ficheiro JSON com `curl.exe` e os headers certos.
- `scripts/write-json.ps1` — grava texto JSON em UTF-8 sem BOM (evita erro de parse no servidor).
