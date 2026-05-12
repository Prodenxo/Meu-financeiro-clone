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

---

## Fluxo principal (WhatsApp — frase em português)

Isto é o que o utilizador final espera: **escreve em linguagem natural** e o lançamento vai para **a conta ligada ao número dele** na base (`n8n_link`).

### 1) Quem é a pessoa (`phone`)

- O backend descobre o `user_id` pelo campo **`phone`** no JSON (só dígitos; com ou sem `55` o servidor tenta as variantes).
- **Obrigatório:** usar o **telefone WhatsApp do remetente** desta conversa — o que o Hermes / canal de mensagens expõe como identidade do contacto (metadados da sessão, JID, ou texto de sistema com o número). **Nunca** inventes um número.
- Se estiveres em **self-chat / mensagens contigo**, o “remetente” és tu: usa o número WhatsApp real dessa sessão (o mesmo que o utilizador guardou no perfil da app).

### 2) Ler a mensagem e mapear para `create_transaction`

Exemplos (Portugal/Brasil, valor numérico):

| Mensagem (exemplo) | `tipo` | `valor` | `classificacao` (sugestão) |
|--------------------|--------|---------|----------------------------|
| recebi 4599 de salário | entrada | 4599 | Salário |
| recebi 4599,50 de salário | entrada | 4599.5 | Salário |
| salário 3400 | entrada | 3400 | Salário |
| ganhei 200 de extra | entrada | 200 | Outros rendimentos (ou pergunta) |
| gastei 50 no uber | saida | 50 | Transporte (ou pergunta) |
| -15,90 padaria | saida | 15.9 | Alimentação |

Regras:

- **Data:** se a mensagem **não** disser data, usa **a data de hoje** (calendário local do utilizador; se não souberes fuso, assume o dia corrente em ISO `YYYY-MM-DD` que o sistema te der ou pergunta “é hoje?”).
- **`status`:** usa `pago` por defeito para despesas/rendas já recebidas, salvo o utilizador dizer “pendente” / “a pagar”.
- **`classificacao`:** texto livre na BD; **preferir o nome exacto** de uma categoria que o utilizador já usa na app. Se disser só “salário”, usa **`Salário`**. Se for ambíguo (“gastei 30”), pergunta a categoria **antes** de criar.
- **Valores BR:** aceita `4.599,99` → normaliza para número decimal `4599.99`; remove `R$`, espaços, pontos de milhar.

### 3) Ordem de trabalho

1. Interpretar a frase → extrair `tipo`, `valor`, `classificacao` (e `data`/`status` se aplicável).
2. Se faltar algo essencial (valor ou não sabes se é entrada/saída), **pergunta numa frase**.
3. Opcional: `resolve_user` com o `phone` do remetente; se falhar, explica que tem de guardar o telefone no perfil da app Meu Financeiro.
4. Montar JSON e chamar `invoke-mf-action.ps1` (ou a tool HTTP equivalente) com `action`: `create_transaction` e o `payload`.
5. Responder em humano: *“Registrei entrada de R$ 4599 em Salário (pago).”*

---

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
