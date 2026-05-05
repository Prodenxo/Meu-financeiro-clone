# DAS mensal, cron e API de assinatura (planilha) — notas de troubleshooting

**Data:** 2026-04-30  
**Contexto:** job mensal MEI/DAS, erro de rede, servidor cPanel indisponível.

Este ficheiro resume o que foi alinhado no código e na operação. **Não** inclui secrets nem `.env`.

---

## 1. Job DAS mensal (automático)

- **Scheduler:** dia **1** de cada mês, após **8h** (`America/Sao_Paulo`), processa a competência do **mês anterior**.
- **Endpoint manual (igual ao job):** `GET /api/cron/das-mensal`  
  - Header obrigatório: `Authorization: Bearer <CRON_SECRET>` (o valor de `CRON_SECRET` no backend).  
  - Abrir só a URL no browser **não** funciona (falta o header).
- **Teste só para um utilizador:** `GET /api/cron/das-mensal/usuario?userId=<UUID>` (mesmo header Bearer). Opcional: `&competencia=YYYY-MM`. Resposta inclui `whatsappStatus` (`sent`, `skipped_no_phone`, `failed`, etc.).
- **Pré-requisitos:** `SUPABASE_SERVICE_ROLE_KEY`, utilizadores com certificado MEI (CNPJ 14 dígitos) + `role_x_user_x_empresa` ativo; integração SERPRO configurada.
- **WhatsApp automático (opcional):** com `MEI_DAS_AUTO_WHATSAPP_ENABLED=true`, após cada DAS gerado com sucesso no job/cron o backend chama o mesmo `N8N_WHATSAPP_WEBHOOK_URL` que o admin (`source: mei_das_automatico`). É preciso telefone em `user_metadata.phone`; falhas do webhook **não** marcam o DAS como erro. Padrão da variável: desligado.

---

## 2. Erro `fetch failed` / assinatura (procurador)

Fluxo: OAuth Serpro (mTLS) OK → em seguida o backend chama **`SERPRO_AUTENTICA_PROCURADOR_SIGN_URL`** (no ambiente em questão: host **`planilha.cffranquias.com.br`**) para gerar XML assinado.

### Sintomas vistos

1. **Connect timeout (~10s)** com `fetch` (Undici) — limite rígido de ligação TCP.
2. **`curl`: `Could not resolve host`** — **falha de DNS**: o nome `planilha.cffranquias.com.br` **não resolve** a partir da máquina/rede usada (ex.: cPanel / DNS a cair ou domínio não publicado).

Enquanto o hostname **não resolver** publicamente (ou o URL no `.env` estiver errado), o fluxo MEI/DAS que depende dessa assinatura **não** consegue completar.

### O que fazer na operação

- Garantir **registos DNS** (A/CNAME) para o subdomínio correcto no domínio da operação.
- Confirmar com `nslookup <host>` e `curl -v https://<host>/...` a partir do **mesmo** sítio onde corre o Node.
- Se a URL da API de assinatura mudar, actualizar **`SERPRO_AUTENTICA_PROCURADOR_SIGN_URL`** no `.env`.

---

## 3. Alterações feitas no código (referência)

- **`backend/src/services/mei-das.service.js`:** mensagem de erro do job inclui `error.cause` (útil quando o erro original é só `fetch failed`).
- **`backend/src/config/env.js`:** `SERPRO_AUTENTICA_PROCURADOR_SIGN_TIMEOUT_MS` (padrão sugerido no código: 45000 ms).
- **`backend/src/services/gestao/authProcurador.service.js`:** POST para a URL de assinatura passou de `fetch` para **`https.request`**, com timeouts de conexão e de leitura configuráveis, para evitar o connect timeout curto do Undici em hosts lentos.
- **`backend/src/config/env.js` + `mei-das.service.js`:** `MEI_DAS_AUTO_WHATSAPP_ENABLED` e envio opcional pós-DAS via `n8n-whatsapp.service.js`.

Reiniciar o backend após deploy.

---

## 4. Segurança

- **Não** colar `.env` completo em chats nem em tickets públicos. Se isso acontecer, **rodar** `CRON_SECRET`, chaves Supabase e outros segredos expostos.

---

## 5. Histórico do chat no Cursor

O **fio completo** da conversa fica no histórico do Cursor (não é duplicado neste ficheiro). Este documento é um **backup resumido** no repositório para quando o cPanel / DNS voltarem.
