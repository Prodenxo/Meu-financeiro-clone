# Base de conhecimento — Midas · Meu Financeiro (OpenClaw)

Ficheiro alinhado ao **código actual** do backend (`openclaw-bot.service.js`, `transactions.service.js`, `categories.service.js`, `mei-guide-das-base64.service.js`). Cola no workspace do OpenClaw (ex.: `midas-kb.md` ao lado do `SOUL.md`) ou referencia no `SOUL.md`. **Atualiza** se mudares regras na BD ou no endpoint.

---

## O que é o Meu Financeiro (neste contexto)

- Utilizadores registam **lançamentos** (entradas e saídas) na tabela **`lancamentos_id`**.
- Cada utilizador tem **categorias** na tabela **`categorias_id`** (nome + tipo). Quem se regista recebe cópia das categorias **globais** (`user_id` null na origem); podem existir nomes diferentes por conta.
- O campo **`classificacao`** no lançamento é **texto** — o ideal é coincidir com o **nome da categoria** que o utilizador vê na app (senão o insert pode falhar ou ficar inconsistente com relatórios, conforme regras da app).

---

## Como o bot sabe “quem é quem”

- Tabela **`n8n_link`**: liga **`user_number`** (telefone) ao **`user_id`** (Supabase).
- O utilizador **tem de ter o telefone guardado na app** (perfil) para existir essa linha.
- O backend **normaliza** o telefone: tira `@s.whatsapp.net` e deixa só dígitos; tenta **com e sem prefixo 55**.

### Cargos e empresas (`actorContext`)

Em **todas** as respostas com `phone` válido (excepto `ping`), o JSON inclui **`data.actorContext`**:

- **`hasActiveMembership`:** `true` se existir pelo menos uma linha activa em `role_x_user_x_empresa` (`status = true`) para esse `user_id`.
- **`profileRole`:** papel em `profiles` (ex.: **superadmin**) quando preenchido — alinhado ao fallback da app quando o vínculo não diz tudo.
- **`hasSuperadminCapability`:** `true` se `profileRole === 'superadmin'` ou alguma `memberships[].role` for `superadmin`.
- **`memberships`:** lista de vínculos; cada item tem `role` (ex.: `admin`, `usuario`, `superadmin`, `outsider`), `empresaId`, `empresaNome`, `mei`, `linkId`.

Isto vem das **mesmas** tabelas que a app usa para RBAC. O agente deve **consultar** isto antes de prometer algo que só admin/superadmin faz na web; ver `openclaw-midas-SOUL.md` (fluxo número + cargo → pedido → permite ou recusa).

**DAS e admin da empresa:** conforme `SOUL`, um **Administrador** pode usar `get_das_current` com **`phone`** = telefone (**n8n_link**) de um **colaborador**, **desde que** `resolve_user` no remetente mostre papel **admin**, um segundo `resolve_user` no colaborador mostre **pelo menos um `membership.empresaId`** igual ao do admin (mesmo tenant); sem essa igualdade → **recusar** a consulta. O backend **ainda não aplica RBAC servidor** nesta rota Bot — por isso esta **disciplina do agente** é obrigatória por segurança.

---

## Chamada HTTP (única porta de entrada do robô)

- **Método:** `POST`
- **Caminho:** `/api/bot/openclaw/action` (URL completa = variável **`MF_API_URL`** no contentor OpenClaw, já com path).
- **Header:** `Authorization: Bearer <OPENCLAW_WEBHOOK_SECRET>` (mesmo valor no **backend** Easypanel e nas **env** do serviço OpenClaw que faz o `curl`).
- **Header:** `Content-Type: application/json; charset=utf-8`
- **Corpo:** JSON com `action`; `phone` obrigatório exceto em `ping`.

Não passes chaves **Supabase** ao modelo: só este endpoint com Bearer.

### API REST (app / integrações com JWT)

Com sessão Supabase (`Authorization: Bearer <access_token>`):

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/api/auth/roles` | Catálogo de cargos + permissões; opcionalmente linhas da tabela `roles`. |
| `GET` | `/api/auth/permissions` | Sem query: permissões **efectivas** do utilizador logado. Com `?role=admin`: catálogo desse cargo. |
| `GET` | `/api/auth/permissions/check?permission=bot.own_das` | Verifica se o utilizador logado tem a permissão. |

---

## Ações suportadas (MVP)

| `action` | Precisa `phone`? | O que faz |
|----------|------------------|-----------|
| `ping` | Não | Teste de vida; não toca na BD de utilizador. |
| `resolve_user` | Sim | Confirma se o telefone está ligado a um `user_id`; devolve também **`actorContext`** (cargos / empresas). |
| `list_roles` | **Opcional** | **OpenClaw autorizado** — catálogo de cargos/permissões. Sem `phone` = só catálogo. Com `phone` = + `actorContext` do utilizador. **`payload.includeDatabase: true`** → tabela `roles`. |
| `get_permissions` | Sim | Sem `payload.role`: permissões **efectivas** do utilizador do `phone`. Com **`payload.role`**: permissões desse cargo (catálogo). |
| `check_permission` | Sim | **`payload.permission`** (ex.: `bot.das_colaborador_same_company`) → `{ allowed, primaryRole, reason }`. |
| `list_categories` | Sim | Lista categorias do utilizador (`categorias_id`). Opcional no `payload`: **`minimal`** (`true`) → só `id` e `nome`; **`tipo`** ou **`type`** → filtra `entrada` / `saida`. |
| `list_contas` | Sim | Carteiras/contas activas com **`saldoAtual`** e **`totalSaldo`**; indica qual é a padrão (`Meu Financeiro` quando existir). |
| `get_saldo` | Sim | Igual a `list_contas` com foco em saldos; opcional **`carteira`** / **`conta_id`** para uma só carteira. |
| `create_conta` | Sim | Cria carteira em `contas_financeiras` (`nome`/`carteira`, `tipo`, `saldo_inicial` opcional). |
| `update_conta` | Sim | Actualiza carteira por `conta_id` ou nome (`carteira`/`conta`); campos: `nome`, `tipo`, `saldo_inicial`, `ativo`. |
| `delete_conta` | Sim | Desactiva carteira (`ativo=false`); não apaga lançamentos históricos. |
| `list_transactions` | Sim | Devolve até **40** lançamentos mais recentes (`criado_em` desc). |
| `create_transaction` | Sim | Insere uma linha em `lancamentos_id` para esse utilizador. Sem `carteira` → conta padrão. |
| `update_transaction` | Sim | Altera lançamento por `id`/`transactionId`; campos parciais: `tipo`, `valor`, `classificacao`, `data`, `status`, `obs`, `carteira`. |
| `delete_transaction` | Sim | Apaga por `id` ou `transactionId` (UUID), só se for **dono** do lançamento. |
| `get_das_current` | Sim | Lê **`DAS_mei`** por `user_id` + competência; devolve o PDF em **base64** (não envia WhatsApp). |
| `list_calendar_events` | Sim | Compromissos numa data (`payload.data` / `payload.date`); ver secção Agenda abaixo. |
| `get_nfse_setup_status` | Sim | Verifica certificado, Plugnotas e dados fiscais do prestador. |
| `list_nfse_clientes` | Sim | Catálogo de **tomadores/clientes** (`payload.q` opcional). |
| `register_nfse_cliente` | Sim | Cadastra tomador (CPF/CNPJ, nome, e-mail). |
| `list_nfse_produtos` | Sim | Catálogo de **serviços/produtos** (`payload.q` opcional). **Não** confundir com clientes. |
| `register_nfse_produto` | Sim | Cadastra serviço: `discriminacao`, `codigo`, `cnae`; opcional `aliquota`. |
| `preview_nfse` | Sim | Pré-visualização sem emitir. |
| `emit_nfse` | Sim | Emite NFSe (Plugnotas); exige `payload.confirm: true` após confirmação do utilizador. |
| `list_nfse_notas` | Sim | Últimas notas NFSe (`payload.limit` opcional, máx. 40). |
| `consult_nfse` | Sim | Status de uma nota (`payload.id`); `payload.sync: false` para não consultar Plugnotas. |
| `get_nfse_pdf` | Sim | PDF em base64 (`includeBase64: true`) ou só metadados + `execCommand`. |
| `send_nfse_whatsapp` | Sim | Envia PDF via Z-API/n8n se configurado; senão use `mf-nfse-send.sh`. |
| `list_catalog_servicos` | Sim | Lista só **serviços NFS-e** (alias de `list_nfse_produtos` com tipo serviço). |
| `list_nfe_produtos` | Sim | Lista só **produtos NF-e** (mercadorias com NCM/CFOP). |
| `register_nfe_cliente` | Sim | Cadastra cliente para NF-e **com endereço** (CEP, logradouro, etc.). CNPJ pode preencher via BrasilAPI. |
| `register_nfe_produto` | Sim | Cadastra produto: `discriminacao`, `codigo`, `ncm` (8 dígitos), opcional `valor`, `cfop`. |
| `preview_nfe` | Sim | Pré-visualização NF-e de produto sem emitir. |
| `emit_nfe` | Sim | Emite NF-e; exige `payload.confirm: true` e NF-e liberada pelo admin. |

---

## NFSe pelo WhatsApp (`emit_nfse`)

**Pré-requisitos na app:** certificado A1, empresa no Plugnotas, endereço fiscal do prestador. Opcional: serviço padrão no catálogo (código + CNAE).

**Fluxo recomendado**

1. `get_nfse_setup_status`
2. Tomador: se o utilizador disser **nome** → `list_nfse_clientes` com `payload.q` ou `preview_nfse` com `tomadorNome` (não pedir CPF/CNPJ se já está no catálogo). Só pedir documento se cliente não existir ou houver homónimos.
3. Serviço: `list_catalog_servicos` se houver vários itens; utilizador escolhe pelo número da lista → `servicoIndice` no payload. **`descricao` inventada não conta** com catálogo > 1. **Não** chamar `register_nfse_produto` na emissão se já houver itens — só quando pedirem cadastrar novo ou catálogo vazio.
4. Recolher **valor** (e serviço via `servicoIndice` se houver vários no catálogo)
5. `preview_nfse` ou `emit_nfse` **sem** `confirm` → mostrar resumo
6. Utilizador confirma no chat
7. `emit_nfse` com `"confirm": true`
8. Quando `consult_nfse` → `pdfReady: true` (status concluido), enviar PDF:

```bash
/home/node/.openclaw/workspace/mf-nfse-send.sh 5521996185328 UUID_DA_NOTA
```

**Payload `emit_nfse` / `preview_nfse`**

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `tomadorCpfCnpj` | Condicional* | 11 ou 14 dígitos; omitir se usar `tomadorNome` |
| `tomadorNome` | Condicional* | Nome no catálogo (ex.: "Rafael Reis") — backend resolve o documento |
| `tomadorRazaoSocial` | Condicional | Alias de `tomadorNome`; só obrigatório em `register_nfse_cliente` sem catálogo |
| `valor` | Sim | Número ou texto (`1200`, `1.200,00`) |
| `servicoIndice` | Condicional* | Número da lista após `list_catalog_servicos` (1, 2, 3…) — **obrigatório** se catálogo > 1 |
| `descricao` / `produtoNome` | Condicional | Só com **um** serviço no catálogo; com vários, usar `servicoIndice` |
| `codigoServico` | Condicional | Mín. 6 caracteres; alternativa a `servicoIndice` |
| `cnae` | Condicional | 7 dígitos; omitir se serviço está no catálogo |
| `confirm` | Só em `emit_nfse` | `true` para emitir de facto |

**Exemplo — José, R$ 1.200, consultoria**

```json
{
  "phone": "5521996185328",
  "action": "emit_nfse",
  "payload": {
    "tomadorCpfCnpj": "17422651000172",
    "tomadorRazaoSocial": "Jose Servicos Ltda",
    "valor": 1200,
    "servicoIndice": 1,
    "confirm": true
  }
}
```

**Erros comuns:** `NFSE_EMITENTE_MISSING`, `NFSE_CODIGO_SERVICO_MISSING`, `NFSE_TOMADOR_NOME_MISSING` — seguir `botHint` na resposta; orientar app MEI → Notas.

Implementação: `openclaw-nfse.service.js` + `mei-notas.service.js` (`emitirNota`).

---

## NF-e de produto pelo WhatsApp (`emit_nfe`)

**Pré-requisitos:** NF-e liberada pelo admin, certificado A1, empresa com NF-e ativa no Plugnotas, produtos no catálogo (NCM + CFOP + tributos).

**Fluxo recomendado**

1. **Antes de emitir**, listar o catálogo certo:
   - Serviço (NFS-e) → `list_catalog_servicos` ou `list_nfse_produtos` com `payload.tipo: "servico"`
   - Produto (NF-e) → `list_nfe_produtos` ou `list_nfse_produtos` com `payload.tipo: "produto"`
2. Cliente: `list_nfse_clientes` ou `register_nfe_cliente` (endereço obrigatório para NF-e)
3. Produto: `register_nfe_produto` se não existir (NCM 8 dígitos, SKU, descrição, valor)
4. `preview_nfe` com `destinatarioNome`, `produtoNome`, `valor`
5. Utilizador confirma → `emit_nfe` com `"confirm": true`

**Payload `emit_nfe` / `preview_nfe`**

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `destinatarioNome` / `tomadorNome` | Condicional | Nome no catálogo |
| `destinatarioCpfCnpj` / `tomadorCpfCnpj` | Condicional | Se não usar nome |
| `produtoNome` / `descricao` | Sim* | Nome do produto no catálogo NF-e |
| `produtoId` | Alternativa | UUID do item em `list_nfe_produtos` |
| `valor` | Sim | Valor unitário ou total (qtd padrão 1) |
| `quantidade` | Opcional | Padrão `1` |
| `confirm` | Só em `emit_nfe` | `true` para emitir |

Implementação: `openclaw-nfe.service.js`.

---

## Agenda (`list_calendar_events`)

- **`payload.data`** ou **`payload.date`:** `YYYY-MM-DD` ou `DD/MM/YYYY`; omitir = hoje (`America/Sao_Paulo`).
- Agrega: **lançamentos** do dia, **Google Calendar** (se o utilizador autorizou na app), **vencimento certificado** MEI.
- **Lista vazia:** resposta **200** com `empty: true` e mensagem clara (não usar 404).
- **Google desligado:** `googleCalendarNote` na resposta; lançamentos do dia continuam visíveis.

```json
{
  "phone": "5548999999999",
  "action": "list_calendar_events",
  "payload": { "date": "16/05/2026" }
}
```

Implementação: `calendar-events.service.js`.

---

## Listar categorias (`list_categories`)

- **Mesmo** `POST /api/bot/openclaw/action` e **mesmo** Bearer que as outras ações — **não** uses `GET /api/categories` no bot (evita 401 com ferramentas HTTP separadas).
- **`payload` opcional:**
  - **`minimal`:** `true` / `"true"` / `1` → `data.categories` com apenas `{ id, nome }`.
  - **`tipo`** ou **`type`:** `entrada` ou `saida` / `saída` para filtrar.

```json
{
  "phone": "5548999999999",
  "action": "list_categories",
  "payload": { "minimal": true }
}
```

---

## DAS MEI (`get_das_current`)

- Tabela **`DAS_mei`**, campo **`DAS`** (base64 do PDF), filtro por **`user_id`** e **`periodo_apuracao`** (mesmo formato usado ao gravar: ver `mei-guide-das-base64.service.js`).
- **`payload.mes`:** opcional, string **`MM/YYYY`** (ex.: `05/2026`). Se omitir, usa o **mês corrente em UTC**.
- **Sucesso:** `data.fileName`, `data.mimeType` (`application/pdf`), `data.base64`, `data.mes`.
- **Não encontrado:** HTTP **404**, `success: false`, mensagem do tipo *Nenhum DAS encontrado para a competência MM/YYYY.*

---

## Carteiras / saldo (`list_contas`, `get_saldo`, `create_conta`, `update_conta`, `delete_conta`)

- **Padrão:** se existir carteira **Meu Financeiro**, é a default para `create_transaction` sem `carteira`.
- **`list_contas`:** devolve `contas[]` com `id`, `nome`, `tipo`, `saldoInicial`, `saldoAtual`, `isDefault` e `totalSaldo` (soma de todas as carteiras activas).
- **`get_saldo`:** mesmo cálculo; com `payload.carteira` ou `payload.conta_id` filtra uma carteira e `totalSaldo` passa a ser só dessa carteira.
- **Saldo:** `saldo_inicial` + entradas **realizadas** (`recebido`) − saídas **realizadas** (`pago`). Pendências (`a_receber` / `a_pagar`) não entram.
- **`create_conta`:** `nome` ou `carteira` (default `Meu Financeiro` se omitir); `tipo` (`dinheiro`, `corrente`, `poupanca`, `cartao_credito`, `outro`); `saldo_inicial` opcional.
- **`update_conta` / `delete_conta`:** identificar por `conta_id` (UUID) ou nome exacto (`carteira` / `conta`). Apagar = desactivar, não remove histórico.

```json
{
  "phone": "5548999999999",
  "action": "get_saldo",
  "payload": { "carteira": "Meu Financeiro" }
}
```

---

## Criar lançamento (`create_transaction`)

**Regra:** uma mensagem do utilizador → **um** `create_transaction`, exceto se pedir vários lançamentos de forma explícita.

**Carteira:** opcional `carteira`, `conta`, `conta_id` ou `conta_nome`. Se omitir, usa a conta padrão do utilizador.

**Valores em português (um número só no `valor`):**

| Frase do utilizador | `valor` no JSON |
|---------------------|-----------------|
| 1 milhão e 200 mil / um milhão e duzentos mil | `1200000` |
| 2 milhões | `2000000` |
| 350 mil | `350000` |

**Erro comum:** “1 milhão e 200 mil de salário” **não** é 1.000.000 + 200.000 em dois POST — é **um** lançamento de **1.200.000**.

**Campos obrigatórios no `payload`:** `tipo`, `valor`, `classificacao`, `data`, `status`.

| Campo | Notas |
|-------|--------|
| `tipo` | `entrada` ou `saida`. O backend aceita também `saída` (com acento) e normaliza para `saida`. |
| `valor` | Número (ex.: `25.5` ou `3400`). |
| `classificacao` | Texto. Preferir o **mesmo nome** que a categoria na app (ex.: `Salário`, `Alimentação`). |
| `data` | String **ISO** `YYYY-MM-DD` (ex.: `2026-05-12`). |
| `status` | Texto livre na BD; na migração antiga o default é **`pago`**. Usa o que a app usa (ex.: `pago`, `pendente`). |
| `obs` | Opcional; pode ser `null`. |

**Exemplo — saída**

```json
{
  "phone": "5548999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "saida",
    "valor": 15.9,
    "classificacao": "Alimentação",
    "data": "2026-05-12",
    "status": "pago",
    "obs": "WhatsApp Midas"
  }
}
```

**Exemplo — entrada**

```json
{
  "phone": "5548999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "entrada",
    "valor": 3400,
    "classificacao": "Salário",
    "data": "2026-05-12",
    "status": "pago",
    "obs": "via OpenClaw"
  }
}
```

**Exemplo — “1 milhão e 200 mil de salário” (um lançamento)**

```json
{
  "phone": "5548999999999",
  "action": "create_transaction",
  "payload": {
    "tipo": "entrada",
    "valor": 1200000,
    "classificacao": "Salário",
    "data": "2026-05-26",
    "status": "recebido",
    "obs": "via OpenClaw"
  }
}
```

---

## Listar, editar e apagar

- **`list_categories`:** `data.categories`; formato completo inclui `id`, `nome`, `tipo`, `user_id`; com `minimal: true` só `id` e `nome`.
- **`list_contas` / `get_saldo`:** saldos por carteira e total; use antes de responder “quanto tenho”.
- **`list_transactions`:** resposta inclui objetos com pelo menos `id`, `tipo`, `valor`, `classificacao`, `data`, `status`, etc.
- **`update_transaction`:** `id` obrigatório + campos a alterar (`valor`, `classificacao`, `data`, `status`, `carteira`, …). Para corrigir valor ou mover para outra carteira.
- **`delete_transaction`:** `payload` com `{ "id": "<uuid>" }` ou `{ "transactionId": "<uuid>" }`. O utilizador **não sabe** o UUID — o fluxo seguro é: listar → identificar linha pela conversa → **pedir confirmação explícita** → só depois apagar.

---

## Comportamento que convém ao agente

1. Se faltar **valor**, **data**, **tipo** ou categoria ambígua, **pergunta** antes de chamar `create_transaction`.
2. Para **apagar**, nunca apagues sem o utilizador **confirmar**.
3. Se o backend responder que **não há utilizador** para aquele telefone, diz para a pessoa **abrir a app e guardar o telefone no perfil** (`n8n_link`).
4. **Moeda:** assume o que a app já usa.

---

## Onde está no código (dev)

- Rota: `backend/src/routes/openclaw.routes.js` → `POST /openclaw/action` sob `/api` + `/bot`.
- Lógica: `backend/src/services/openclaw-bot.service.js`, `transactions.service.js`, `contas-financeiras.service.js`, `categories.service.js`.
- Guia operacional: `docs/ops/meu-financeiro-openclaw.md`, `docs/ops/whatsapp-n8n-openclaw-backend.md`.

---

## Como chamar a API a partir do OpenClaw (sem plugin)

No contentor, usa **`exec`** com **`curl`**, variáveis **`MF_API_URL`** e **`OPENCLAW_WEBHOOK_SECRET`** (env do Easypanel). O JSON do `-d` tem de ser **uma linha** válida ou escapado correctamente no shell.
ENDKB