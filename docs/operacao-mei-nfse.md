# Operacao MEI/NFSe

**Caminhos relativos:** links para `stories/`, `prd/`, `adr/`, `brief/`, `qa/` neste ficheiro são relativos à pasta **`docs/`** (o próprio ficheiro está em `docs/operacao-mei-nfse.md`). URLs `https://...` são absolutas.

<a id="guia-mei-escopo-apenas-nfse"></a>

## Escopo da Guia MEI no produto (apenas NFS-e na interface)

- **Limitação D-01 (épico):** o fluxo **Guia MEI** (`GuidesMei`) é voltado a **MEI prestador de serviços**; na **interface** o usuário **só emite e opera NFS-e** (não há escolha de NF-e nem NFC-e na tela).
- **Inscrição estadual (IE):** o formulário da Guia MEI **não pede** IE da empresa. O backend envia ao Plugnotas o valor definido na política MEI quando a IE não vem do usuário — hoje **`ISENTO`** (ver `plugnotas-mei-empresa-policy` / ADR de payload apenas NFS-e). A **inscrição municipal** continua obrigatória no bloco de dados mínimos onde aplicável (exigência do cadastro no provedor).
- **Backend e API:** endpoints de NF-e/NFC-e podem existir para outros contextos ou contratos do emissor; na Guia MEI a experiência exposta ao usuário é **só NFS-e**. Decisão de produto documentada no PRD: [`epic-guia-mei-apenas-nfse-prd.md`](stories/epic-guia-mei-apenas-nfse-prd.md).
- **Erros que citam NFC-e ou `nfce` no JSON:** podem aparecer no **cadastro/atualização da empresa** no Plugnotas (payload enviado pelo app após o certificado), mesmo com a UI de emissão só NFS-e — ver [Cadastro da empresa e NFC-e (QR e SEFAZ)](#cadastro-empresa-nfce-qrcode-sefaz).

<a id="plugnotas-nfse-nacional-spike-nat01"></a>

### NFS-e Nacional no cadastro Plugnotas (NAT-01 / NAT-02 / US-MEI-NAT-03)

#### Default do produto

- O aplicativo envia ao Plugnotas, no cadastro da empresa, o bloco **`nfse`** com **`nacional: true`** por padrão no **`POST /empresa`** (criação), alinhado ao comportamento esperado do painel (*Ativar emissão de NFS-e Nacional*).
- No **`PATCH /empresa/:cnpj`**, o backend **só** inclui ou completa `nfse.nacional` quando o cliente já envia o objeto **`nfse`** no corpo; atualizações que **não** trazem `nfse` **não** alteram a configuração remota desse toggle (evita sobrescrever ajuste feito manualmente no painel). Detalhes: [`ADR-plugnotas-nfse-nacional-empresa-spike.md`](adr/ADR-plugnotas-nfse-nacional-empresa-spike.md).

#### Contrato em código e risco de API (**NFR-N04**)

- O **nome da propriedade** (`nfse.nacional`, boolean) foi **adotado** a partir da primeira hipótese do spike; **não** há, neste repositório, trecho público estável da documentação Plugnotas que prove o mesmo nome em todos os ambientes.
- Se o provedor **rejeitar** o JSON (HTTP **400** com validação de empresa) ou **ignorar** o campo, tratar como possível divergência de contrato: conferir mensagem de erro, abrir ticket com Plugnotas/TecnoSpeed e atualizar o ADR quando houver resposta oficial.

#### Documentação e painel Plugnotas

- **Documentação geral da API:** [docs.plugnotas.com.br](https://docs.plugnotas.com.br/) (acesso pode depender de rede/autenticação; na prática o time costuma cruzar com o painel).
- **Painel web:** [app2.plugnotas.com.br](https://app2.plugnotas.com.br) — após cadastro pelo app, verificar na ficha da empresa se a opção de **NFS-e Nacional** reflete o esperado (homologação/produção conforme a conta).

#### Município, credenciamento e rejeições

- A **NFS-e Nacional** depende de **adesão municipal/prestador** e regras do provedor. Mesmo com `nacional: true` no payload, podem ocorrer:
  - **400** ou mensagens de validação no cadastro ou na emissão;
  - comportamento em que o painel **não** exibe nacional ativa (município ainda só no modelo antigo, CNPJ sem credenciamento adequado, etc.).
- **Não** concluir automaticamente que o app “não enviou o campo” antes de comparar o **corpo da requisição** (logs redigidos de cadastro empresa, com opt-in `PLUGNOTAS_DEBUG` em produção) com a resposta do Plugnotas.

#### Sandbox vs produção (**NFR-N04**)

- **`PLUGNOTAS_API_BASE_URL`** e **`PLUGNOTAS_API_KEY`** devem ser da **mesma conta** e do **mesmo ambiente** (sandbox **ou** produção). Cadastrar em sandbox e inspecionar em produção (ou o inverso) gera inconsistência e falso diagnóstico sobre `nfse.nacional`.
- O comportamento do campo pode variar entre ambientes; qualquer evidência formal (aceite/rejeição) deve registrar **qual URL base** e **qual conta** foram usadas.

#### Checklist manual pós-cadastro (evidência operacional — **FR-N02**)

Use em **homologação/sandbox** (recomendado) antes de repetir em produção:

1. Configurar backend com `PLUGNOTAS_API_BASE_URL` / `PLUGNOTAS_API_KEY` de **sandbox**.
2. Na Guia MEI, concluir fluxo **certificado A1** + **cadastro da empresa** com CNPJ e dados válidos para o ambiente.
3. No painel Plugnotas (mesma conta), localizar a empresa pelo CNPJ e verificar o estado do controle **NFS-e Nacional** (ligado / disponível conforme UI do provedor).
4. Se houver **400** no cadastro, copiar a mensagem exibida ao usuário e, se possível, o trecho relevante do log redigido do servidor (`PLUGNOTAS_DEBUG` se necessário) para suporte interno — **sem** colar `x-api-key` nem PII completa em tickets públicos.

5. **Após executar** o checklist em sandbox (ou homologação), **registar** data, `PLUGNOTAS_API_BASE_URL` usada (sem expor API key) e resultado (ex.: nacional refletida no painel / 400 com mensagem X) nas **QA Results** da story **US-MEI-NAT-03** no épico ou em ticket interno — fecha o ciclo **FR-N02** além do artefato estático.

PRD de produto: [`PRD-nfse-nacional-default-cadastro-plugnotas.md`](prd/PRD-nfse-nacional-default-cadastro-plugnotas.md). Épico: [`epic-nfse-nacional-plugnotas-prd.md`](stories/epic-nfse-nacional-plugnotas-prd.md) (**US-MEI-NAT-03**).

<a id="plugnotas-nfse-nacional-erros-mensagens"></a>

### Mensagens Plugnotas → dica na Guia MEI (**US-MEI-NAT-04**, **FR-N05**)

O frontend não reparseia JSON do emissor: usa a **string de erro** já consolidada pelo backend (`message` / `details`). Quando a heurística abaixo casa, a UI exibe texto de ajuda curto e um link para [NFS-e Nacional no cadastro Plugnotas](#plugnotas-nfse-nacional-spike-nat01) (ou `frontend/public/guia-mei-nfse-nacional.html` se `VITE_MEI_OPERACAO_NFSE_DOC_URL` não estiver definido).

| Disparo (texto normalizado: minúsculas, sem acento) | Comportamento na UI |
| --- | --- |
| Substring `nfse.nacional` | Dica + link |
| `nfs-e nacional`, `nfse nacional` ou `nfs e nacional` | Dica + link |
| `emissao nacional` | Dica + link |
| `ambiente nacional` | Dica + link |
| `nota nacional` **e** (`nfse` ou `servico` / nota de serviço) | Dica + link |
| `nacional` **e** (`municipio`, `prefeitura`, `credenci`, `aderiu`, `adesao`) | Dica + link |
| `nacional` **e** (`indispon`, `nao dispon`, `nao suport`) | Dica + link |
| `plugnotas` **e** `nacional` **e** (`nfse` ou `nfs`) | Dica + link |

**Implementação:** `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` (manter esta tabela e o ficheiro alinhados). **Onde aparece:** `GuiaMeiEmpresaCadastroErrorPanel`, `EmissaoFiscalErrorAlert`, `EmissaoFiscalErrorAlertModal` (link com tom `rose` no modal) e `PlugnotasIntegrationErrorAlert` em `FiscalIntegrationErrorAlert.tsx`.

Épico: [`epic-nfse-nacional-plugnotas-prd.md`](stories/epic-nfse-nacional-plugnotas-prd.md) (**US-MEI-NAT-04**).

## Objetivo
Registrar pre-condicoes, variaveis de ambiente e orientacoes basicas para operacao do fluxo MEI/NFSe.

**Smoke E2E NF-e / NFC-e (sandbox):** runbook reproduzível em [`runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md`](runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md) (PRD POSQA **FR-POSQA-01** / **FR-POSQA-02**).

**Erro comum na emissão:** se a UI ou o backend mostrarem mensagem no sentido de *falha na validacao do JSON* vinda do emissor, consulte a seção [Mensagem: Falha na validacao do JSON](#mensagem-falha-na-validacao-do-json) (troubleshooting por tipo de nota e checklist).

## Pre-condicoes
1. Backend configurado com Supabase e credenciais da integracao externa.
2. Usuario autenticado para acessar endpoints protegidos de NFSe.
3. Frontend apontando para backend correto via `VITE_API_URL`.

## Antes de atribuir erro ao Plugnotas (conectividade local)

<a id="guia-mei-conectividade-local"></a>

Se a Guia MEI mostrar **Failed to fetch**, **`TypeError: Failed to fetch`** ou **`net::ERR_CONNECTION_REFUSED`** no DevTools **antes** de aparecer um **status HTTP** (200, 400, 401, etc.) na requisição, a causa provável é **falta de conexão com o backend deste aplicativo**, não uma rejeição do **provedor Plugnotas**. O fluxo de **certificado A1** na guia chama o seu servidor em **`POST /api/mei-guide/certificate`** (multipart); sem backend no ar, essa chamada falha na origem.

**Checklist mínimo (desenvolvimento local)**

1. **Subir o backend** na porta esperada pelo proxy do frontend (padrão do repositório: **`3333`**, ver `PORT` em `backend/.env` e `frontend/vite.config.ts` → `server.proxy['/api'].target`).
2. **Subir o frontend** (Vite; porta padrão **`3000`**, ver `frontend/vite.config.ts` → `server.port`).
3. **Validar saúde do backend** com requisição direta à **raiz do servidor**, **fora** do prefixo montado em `/api`:
   - `GET http://localhost:3333/health` → corpo esperado `{"status":"ok"}` (definido em `backend/src/server.js`).
   - **Nota:** o proxy do Vite encaminha apenas caminhos que começam com **`/api`**. O **`/health`** de smoke test deve ir à **porta do Express** (ex.: `3333`), não à origem do Vite (`3000`), salvo configuração explícita diferente.
4. **Só então** enviar o certificado na Guia MEI. Em DEV, o browser costuma chamar `http://localhost:3000/api/...`; o Vite **repassa** `/api` para `http://localhost:3333`.

Se o backend estiver parado, o sintoma típico é falha de rede no envio do certificado — **não** conclua que o Plugnotas recusou o cadastro até existir **resposta HTTP** do seu backend com mensagem do emissor.

**Referências**

- Brief (análise do caso): [`docs/brief/brief-failed-to-fetch-guia-mei-certificado.md`](brief/brief-failed-to-fetch-guia-mei-certificado.md)
- PRD: [`docs/prd/PRD-guia-mei-conectividade-backend-failed-to-fetch.md`](prd/PRD-guia-mei-conectividade-backend-failed-to-fetch.md)

## Variaveis de Ambiente Criticas (Backend)
- `PLUGNOTAS_API_BASE_URL`
- `PLUGNOTAS_API_PATH_PREFIX` (opcional; ex.: `/api` se a API oficial exigir segmento antes de `/empresa`, `/nfse`, etc.)
- `PLUGNOTAS_API_KEY`
- `PLUGNOTAS_DEBUG` (opcional; valores **truthy** interpretados como `true` **sem diferenciar maiúsculas** / `True` / `TRUE`). **Opt-in explícito** em **produção** para logs extras do Plugnotas (ex.: `[plugnotas] …`, `[plugnotas empresa cadastro] POST|PATCH … 400 request payload (redacted):` com JSON **redigido** em **400** de `POST /empresa` e `PATCH /empresa/:cnpj`). **Sem** flag em produção esse payload **não** é impresso. Fora de produção (`NODE_ENV !== 'production'`), o log de cadastro empresa pode aparecer **sem** a flag. Redação: `redactPayload` + máscara leve de PII cadastral (razão social, endereço, email, CEP, inscrições) em `plugnotas-empresa-cadastro-debug.js`; **nunca** headers nem `x-api-key`.)
- `PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL` (opcional; **padrão `warn`** em `backend/src/config/env.js`). Controla o destino (`console.error`/`warn`/`info`/`debug`) das mensagens `[plugnotas] certificado 409 resolve` emitidas em **`resolverCertificadoIdAposConflito409`** quando o POST `/certificado` retorna **409** e a resolução do ID percorre GETs (`empresa`, `certificado?cpfCnpj=`, listagem). Cada registro inclui **etapa estável** (`empresa_get`, `certificado_filtro`, `certificado_lista`, `parse_listagem`), `outcome`, **CNPJ mascarado** e opcionalmente `httpStatus` / `listItemCount` — **sem** querystring completa, senha de `.pfx`, nem corpo de listagem. Use `off` se o volume incomodar em ambientes com muitos 409.
- `PLUGNOTAS_EMIT_400_LOG_LEVEL` (opcional; `error` padrão ou `warn` — nível do log de diagnóstico em HTTP 400 nas chamadas ao Plugnotas, ex.: `[emissao-fiscal NFe] 400 response:`)
- `PLUGNOTAS_TIMEOUT_MS`
- `PLUGNOTAS_WEBHOOK_TOKEN`
- `PLUGNOTAS_WEBHOOK_REQUIRE_TOKEN`
- `PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN`
- `PLUGNOTAS_NFSE_CANCEL_PATH`
- `PLUGNOTAS_NFE_CANCEL_PATH`
- `PLUGNOTAS_NFCE_CANCEL_PATH`
- `MEI_API_BASE_URL`
- `MEI_API_TOKEN`
- `MEI_API_TIMEOUT_MS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

<a id="plugnotas-empresa-payload-apenas-nfse"></a>

## Plugnotas: cadastro de empresa (modo apenas NFS-e)

O backend normaliza o JSON enviado ao Plugnotas em `POST /empresa` e `PATCH /empresa/:cnpj`: **`nfe` e `nfce` inativos** (`ativo: false`, `tipoContrato: 0`) **sem** objeto `config`, e **`inscricaoEstadual`** vazia no cadastro vira o valor definido em `plugnotas-mei-empresa-policy.js` (hoje **`ISENTO`**). O **`POST`** também garante o bloco **`nfse`** com **`nacional: true`** por padrão (**US-MEI-NAT-02**); ver [NFS-e Nacional no cadastro Plugnotas](#plugnotas-nfse-nacional-spike-nat01). Em `PATCH` sem as chaves `nfe`/`nfce`, esses blocos **não** são enviados (evita reativar NFC-e legada). Detalhes apenas NFS-e: [`ADR-plugnotas-empresa-payload-apenas-nfse.md`](adr/ADR-plugnotas-empresa-payload-apenas-nfse.md).

**Documentos ativos (P0):** o corpo pode incluir **`documentosAtivos: { nfse, nfe, nfce }`** (booleanos). O servidor monta os três blocos conforme a selecção, valida pelo menos um tipo activo e **não** reenvia `documentosAtivos` ao Plugnotas. Se **`documentosAtivos` estiver ausente** no `POST`, o default continua **só NFS-e activo** (equivalente ao comportamento anterior). No **`PATCH`**, se **`documentosAtivos` estiver ausente**, mantém-se a semântica acima (omitir `nfe`/`nfce` quando o cliente não os envia).

## Endpoints Relevantes

### Emissao e Gestao NFSe
- `POST /api/mei-notas/emitir`
- `POST /api/mei-notas/setup/emissao-fiscal/certificado` — upload do certificado A1 (multipart) para o provedor de emissão
- `POST /api/mei-notas/setup/emissao-fiscal/empresa` — cadastro inicial da empresa (payload deve incluir `certificado`, id retornado no passo anterior)
- `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=` — consulta cadastro da empresa no provedor pelo CNPJ (somente dígitos na query)
- `PATCH /api/mei-notas/setup/emissao-fiscal/empresa` — atualiza dados cadastrais **sem** reenviar certificado (útil quando empresa e A1 já existem no provedor; corpo alinhado ao cadastro, sem campo `certificado`)
- Alias legado (mesmos handlers): `POST|GET|PATCH /api/mei-notas/setup/plugnotas/*` (equivalente aos paths `emissao-fiscal` acima)
- `GET /api/mei-notas`
- `GET /api/mei-notas/:id`
- `GET /api/mei-notas/:id/pdf`
- `GET /api/mei-notas/:id/xml`
- `POST /api/mei-notas/webhook`
- `GET /api/mei-notas/relatorio/nfe`

## Certificado Plugnotas: não foi possível obter o ID automaticamente

<a id="certificado-plugnotas-409-sem-id"></a>

Quando a Guia MEI mostra que o certificado **já está cadastrado** no Plugnotas porém **não foi possível obter o ID automaticamente**, o backend pode ter emitido o código de negócio **`certificado_409_sem_id`** na resposta JSON de erro (`errors.plugnotasCode`). Isso indica que o **POST** de certificado recebeu **409** (duplicado) e as tentativas de **GET** para recuperar o ID existente não devolveram um ID utilizável — não é o mesmo caso de falha de rede antes de qualquer HTTP.

**Checklist de diagnóstico (resumo)**

1. **CNPJ no formulário** — 14 dígitos, alinhado ao certificado e ao cadastro no Plugnotas.
2. **Conta Plugnotas** — Em [app2.plugnotas.com.br](https://app2.plugnotas.com.br), usar a **mesma conta** associada à **API key** configurada no servidor; confirmar que o certificado aparece para o CNPJ.
3. **`PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY`** — Mesmo **ambiente** (sandbox/produção); evitar misturar credenciais de contas ou ambientes diferentes.
4. **Empresa no provedor** — Se não houver empresa cadastrada para o CNPJ na conta, o fluxo de resolução pode depender só da listagem de certificados; pode ser necessário completar o cadastro no painel conforme o provedor.

Brief detalhado: [`docs/brief/brief-plugnotas-certificado-409-sem-id.md`](brief/brief-plugnotas-certificado-409-sem-id.md).

### Catálogo de clientes e produtos (após emissão)

Após uma emissão bem-sucedida via provedor externo, o backend grava o registro da nota em `mei_nfse` e em seguida tenta **upsert** no catálogo local (Supabase), para atalhos no formulário da Guia MEI (`GuidesMei.tsx`):

| Tipo (`documentType`) | Cliente (origem no payload) | Itens (origem) |
| --- | --- | --- |
| **NFSE** | `tomador` | `servico[]` |
| **NFE** / **NFCE** | `destinatario` | `itens[]` |

- **Tabelas:** `mei_nfse_clientes`, `mei_nfse_produtos`.
- **Chave de deduplicação:** `user_id`, `document_type`, `dedupe_key` (ver `upsertClienteCatalogo` / `upsertProdutosCatalogo` em `backend/src/services/mei-notas.service.js`).
- **Ordem:** o catálogo só é atualizado depois da resposta do provedor e do `insert` em `mei_nfse`; se a emissão falhar antes, o catálogo não é gravado por esse fluxo.
- **Falha no catálogo:** o upsert está em `try/catch`; erro no Supabase gera apenas `console.warn` e **não** reverte a nota já persistida.
- **Leitura:** `GET /api/mei-notas/catalogo/clientes` e `GET /api/mei-notas/catalogo/produtos` (parâmetro opcional `documentType` para filtrar por NFSE, NFE ou NFCE).

### Fluxo Guia MEI
- `POST /api/mei-guide`
- `GET /api/mei-guide/:periodo/download`
- `POST /api/mei-guide/validate`
- `POST /api/mei-guide/certificate` — upload do certificado A1 (multipart) para o backend; pré-requisito de conectividade com o servidor (ver [Antes de atribuir erro ao Plugnotas](#guia-mei-conectividade-local))
- `DELETE /api/mei-guide/certificate`
- `GET /api/mei-guide/certificate/status`

### DAS Mensal (Admin)
- `GET /api/admin/das/status`
- `GET /api/admin/das/pending`
- `POST /api/admin/das/reprocess`

## Cadastro da empresa e NFC-e (QR e SEFAZ)

<a id="cadastro-empresa-nfce-qrcode-sefaz"></a>

Use esta seção quando a interface ou o backend exibirem erro de **validação do JSON** no cadastro/atualização de empresa, ou texto que cite `nfce`, `versaoQrCode` ou `nfce.config.sefaz`.

**Referência de produto (épico NFC-e cadastro):** [PRD — cadastro empresa Plugnotas (NFC-e / QR Code e SEFAZ)](prd/PRD-cadastro-empresa-plugnotas-nfce-qrcode-sefaz.md) — decisão de `versaoQrCode` / `nfce.config`. Para mensagens genéricas de validação na emissão: [PRD — emissão MEI e erros de validação Plugnotas](prd/PRD-emissao-mei-plugnotas-erros-validacao.md).

### Fluxo operacional na Guia MEI (certificado → empresa)

Ordem esperada no app (endpoints já listados em **Endpoints relevantes**):

1. **`POST /api/mei-notas/setup/emissao-fiscal/certificado`** — envio do certificado A1 (multipart). A resposta deve trazer identificador usado no passo seguinte (`certificado` / id conforme contrato do backend).
2. **`POST /api/mei-notas/setup/emissao-fiscal/empresa`** — cadastro inicial no Plugnotas. O corpo inclui os dados da empresa e referência ao certificado obtido no passo 1. Sem certificado válido no provedor, o cadastro de empresa costuma falhar antes ou durante `POST /empresa` no Plugnotas.
3. **`PATCH /api/mei-notas/setup/emissao-fiscal/empresa`** — quando a empresa **já existe** no mesmo ambiente/token: atualização **sem** reenviar o `.pfx` (ver troubleshooting **2b.1** se aparecer “não localizamos… empresa”).

Se o erro ocorrer só no passo 2 ou 3, isole a requisição correspondente no DevTools (abaixo).

### `versaoQrCode` (v1) e `nfce.config.sefaz` (v2)

- **Estratégia adotada no produto:** NFC-e com **QR versão 1** (`nfce.config.versaoQrCode: 1`), alinhada ao ADR-06 e ao PRD do épico. Isso **reduz** a necessidade do bloco **`nfce.config.sefaz`** típico da **versão 2** do QR na API Plugnotas.
- **Regra resumida (conforme documentação Plugnotas):** ao usar **QR versão 2**, o schema costuma exigir dados de **`sefaz`** (credenciamento SEFAZ / parâmetros da UF). **Não preencha `sefaz`** “no chute”: copie apenas campos previstos no schema e exemplos oficiais.
- Se o erro da API citar **`sefaz`**, **`versaoQrCode`** ou combinação inválida: confira no [portal Plugnotas](https://docs.plugnotas.com.br/) o contrato de `POST /empresa` → `nfce` / `nfce.config` e compare com o **payload enviado** (passos seguintes).

### Inspecionar payload e resposta (DevTools → Network)

1. Abra as ferramentas de desenvolvedor do navegador → aba **Network**.
2. Dispare de novo o fluxo (enviar certificado / cadastrar ou atualizar empresa).
3. Localize a chamada do **frontend ao seu backend**, por exemplo:
   - `POST …/api/mei-notas/setup/emissao-fiscal/certificado` ou
   - `POST …/api/mei-notas/setup/emissao-fiscal/empresa` / `PATCH …/api/mei-notas/setup/emissao-fiscal/empresa`.
4. Aba **Payload** / **Request**: confira o JSON enviado (estrutura `nfce`, `nfce.config`, `versaoQrCode`). **Não** copie em tickets públicos dados pessoais completos nem tokens; use trechos fictícios ou apenas nomes de campos.
5. Aba **Response**: leia `message` e, se existir, `errors`, `details` ou estruturas aninhadas — o app costuma refletir essas informações na Guia MEI.
6. Compare o corpo relevante com o **contrato** do `POST /empresa` na documentação Plugnotas (campos obrigatórios, tipos e bloco NFC-e).

### Diagnóstico no servidor (payload Plugnotas redigido — US-NFCE-EMP-04)

Em **HTTP 400** nas rotas Plugnotas `POST /empresa` e `PATCH /empresa/:cnpj`, o backend pode registrar no log do servidor uma linha `[plugnotas empresa cadastro] … 400 request payload (redacted):` com JSON **redigido e com máscara leve de PII**, quando `NODE_ENV !== 'production'` **ou** quando `PLUGNOTAS_DEBUG` está habilitado (case-insensitive; ver **Variáveis de ambiente críticas** no topo deste documento). Útil para comparar o que de fato foi enviado ao provedor sem abrir o código.

**Produção:** sem `PLUGNOTAS_DEBUG`, esse dump de corpo **não** deve aparecer; mantém opt-in explícito para evitar vazamento operacional.

## Troubleshooting rápido

### 1) Webhook nao autorizado
- Verificar se `PLUGNOTAS_WEBHOOK_TOKEN` esta configurado no backend.
- Confirmar envio de token no header `x-webhook-token` (ou `x-api-key`).
- Se usar query `token`, habilitar explicitamente `PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN=true`.

### 2c) Logs `[emissao-fiscal NFSe]`, `[emissao-fiscal NFe]` ou `[emissao-fiscal NFCe]` com `400 response`
- Indica que o **Plugnotas** respondeu HTTP 400; o backend registra o corpo da resposta e, em **POST de emissão**, o JSON enviado **redigido** (mascaramento de `cpfCnpj` em objetos aninhados). **Headers não são logados** (evita vazar `x-api-key`).
- Pode aparecer também em falhas de **download** (GET PDF/XML) quando a API retorna 400.
- Para tratar como aviso em agregadores de log, use `PLUGNOTAS_EMIT_400_LOG_LEVEL=warn`.

### 2) Erro na emissao de NFSe
- Validar CNPJ do prestador (14 digitos).
- Confirmar campos obrigatorios do servico (codigo, cnae, discriminacao, valor). MEI no Simples Nacional: **nao** informar aliquota ISS no payload (o app e o backend seguem essa regra).
- Verificar disponibilidade e credenciais do provedor de emissão (variáveis `PLUGNOTAS_*` no backend).

### 2b) Mensagem "Esta rota não existe no serviço" (ou similar) vinda do Plugnotas
- Não é rota faltando no Express: o backend já respondeu (ex.: HTTP 400) e repassou a mensagem do **provedor Plugnotas**.
- No DevTools → Network → aba **Response**, confira `message` e, se existir, `errors.plugnotasRequest` (método e path usados na API externa, ex.: `POST /nfse`).
- Alinhar **`PLUGNOTAS_API_BASE_URL`** com o ambiente da conta: produção (`https://api.plugnotas.com.br`) ou sandbox (`https://api.sandbox.plugnotas.com.br`), e usar o **`PLUGNOTAS_API_KEY`** correspondente ao mesmo ambiente.
- Conferir a documentação oficial em [docs.plugnotas.com.br](https://docs.plugnotas.com.br/) se a URL base ou os paths mudaram.
- No servidor, com `PLUGNOTAS_DEBUG=true` ou fora de produção, o backend pode registrar no log `[plugnotas] METHOD /path status mensagem` para diagnóstico.
- Em falhas de **atualização** (`PATCH .../setup/emissao-fiscal/empresa`), a resposta JSON pode incluir `errors.plugnotasUpdateAttempts`: tentativa **PATCH** em `/empresa/:cnpj` (a API pública não expõe `PUT` nesse recurso; chamadas antigas `PUT` retornavam 404 com a mesma mensagem genérica).

### 2b.1) HTTP 404 e mensagem "Não localizamos qualquer Empresa…" (PATCH /empresa/:cnpj)

- Significa que **não existe cadastro desse CNPJ no Plugnotas para o `PLUGNOTAS_API_KEY` atual** (ou o ambiente base não coincide com onde a empresa foi criada).
- **PATCH** só altera empresa **já existente**; o **primeiro cadastro** é **`POST /empresa`** com certificado, conforme o fluxo da guia MEI ("Enviar certificado").
- Checklist rápido:
  1. No [app Plugnotas](https://app2.plugnotas.com.br/), confirmar se o CNPJ está na **mesma conta** do token usado no backend.
  2. **`PLUGNOTAS_API_BASE_URL`** e **`PLUGNOTAS_API_KEY`** no **mesmo** ambiente (sandbox vs produção).
  3. Usar **"Consultar cadastro no emissor"** (`GET /empresa/:cnpj`); se também falhar, cadastrar pela guia com **.pfx** antes de **"Atualizar cadastro (sem novo certificado)"**.

### 2b.2) HTTP 409 em POST /certificado ("Já existe um Certificado…")

- Significa que o **mesmo certificado (.pfx) já foi enviado** antes para aquela conta Plugnotas (não é falha de rede).
- O backend tenta **obter o ID do certificado** automaticamente: `GET /empresa/:cnpj` (se o CNPJ for enviado no formulário) e, se necessário, `GET /certificado` para localizar o item pelo CNPJ.
- **Recomendação:** manter o CNPJ preenchido na guia ao clicar em **"Enviar certificado"**, para o fluxo seguir para `POST /empresa` com o `certificado` correto.
- Se ainda assim não houver ID (token/ambiente divergente ou formato de resposta diferente), confira o certificado no [app Plugnotas](https://app2.plugnotas.com.br/) e as variáveis `PLUGNOTAS_*`.

### 2b.3) POST /empresa — validação do JSON (endereço)

- O Plugnotas valida o corpo de **cadastro de empresa**; campos de **endereço** devem estar coerentes com o [schema da API](https://docs.plugnotas.com.br/). Em especial, **logradouro** deve conter o **nome completo da via** (ex.: "Av. Brasil", "Rua das Flores"), não só abreviação de tipo (ex.: "Av"). A guia MEI valida o mínimo antes do envio; ao falhar, a mensagem de erro pode incluir **detalhes por campo** quando a API devolve `errors` no JSON.
- **Tipo de logradouro** (`tipoLogradouro`) e **nome da via** (`logradouro`) são campos separados: não repita só o tipo no campo logradouro.

### 2b.4) POST /empresa — inscrições e NFC-e (validação Plugnotas)

- A API Plugnotas pode exigir **`inscricaoMunicipal`** e **`inscricaoEstadual`** no JSON de empresa. Na **Guia MEI**, o usuário preenche **inscrição municipal** nos dados mínimos; a **IE não é digitada** — o app envia a política MEI (**`ISENTO`** quando vazia no fluxo suportado). A municipal depende das regras do município e do cadastro.
- O bloco **`nfce`** no payload de empresa é mantido **inativo** no modo apenas NFS-e (ver [Plugnotas: cadastro de empresa](#plugnotas-empresa-payload-apenas-nfse)). Se a **resposta de erro** ainda citar **`nfce`**, **`versaoQrCode`** ou **`sefaz`**, trate como validação do **cadastro** no provedor, não como emissão de NFC-e pela tela da Guia MEI.
- Se a validação reclamar de **`nfce.config.sefaz`** quando **`versaoQrCode`** for 2, o app tende a enviar **`versaoQrCode: 1`** em `nfce.config` para alinhar ao schema sem exigir `sefaz` nesse cenário. Ajustes finos: documentação Plugnotas e credenciamento SEFAZ.

### 2c) Checklist: par URL + token (local e Vercel)
- `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY` devem ser do **mesmo** ambiente (sandbox ou produção). Não use URL de produção com chave de sandbox, nem o contrário.
- **Local:** valores em `backend/.env`; reinicie o processo do backend após alterar.
- **Vercel:** no projeto do backend, em Settings → Environment Variables, confira Production e Preview; redeploy após mudanças. Se `PLUGNOTAS_API_KEY` estiver só em **Production**, deploys de **Preview** não recebem a chave (comportamento diferente do 404 local; pode falhar antes com token ausente). Para testar em preview, replique a chave no escopo de Preview ou use **All Environments** (com o mesmo par base+chave coerente).
- Em **desenvolvimento** (`NODE_ENV` diferente de `production`), falhas ao Plugnotas já aparecem no log com a **URL completa** ao final da linha `[plugnotas]`. Em **produção**, use `PLUGNOTAS_DEBUG=true` no backend para o mesmo efeito (sem expor a chave).

### 2c.1) Produção (API oficial Plugnotas) — checklist

Para **cadastro de empresa** e **emissão** contra a API real (prefeitura/SEFAZ), use o par abaixo no **backend** (`backend/.env` e variáveis do deploy). Referência: [documentação da API](https://docs.plugnotas.com.br/) e artigo [Primeiros Passos com o Plugnotas](https://atendimento.tecnospeed.com.br/hc/pt-br/articles/23715383551767-Primeiros-Passos-com-o-Plugnotas) (exemplos com `https://api.plugnotas.com.br/empresa`, `/certificado`, etc.).

| Variável | Valor típico (produção API oficial) |
|----------|----------------------------------------|
| `PLUGNOTAS_API_BASE_URL` | `https://api.plugnotas.com.br` (sem barra final) |
| `PLUGNOTAS_API_PATH_PREFIX` | Vazio, salvo orientação contrária da TecnoSpeed para a sua conta |
| `PLUGNOTAS_API_KEY` | Token no Plugnotas (avatar → exibir token), **não** o token genérico só do TecnoAccount |
| `PLUGNOTAS_TIMEOUT_MS` | Ex.: `15000` |
| `PLUGNOTAS_WEBHOOK_TOKEN` | Segredo definido por você; obrigatório em produção no backend |
| `CORS_ORIGIN` / `FRONTEND_URL` | Origem HTTPS do site (para o browser chamar o backend) |

**Homologação:** na API oficial, **mesmo host** (`https://api.plugnotas.com.br`) e **mesmo token**; a diferença é o JSON (ex.: `config.producao` em dados da nota/empresa), não a variável `PLUGNOTAS_API_BASE_URL`.

**Frontend:** em produção, `VITE_API_URL` no build do frontend deve ser a URL **HTTPS absoluta** do backend (ver `frontend/.env.example`).

### 2d) Smoke test direto no Plugnotas (GET empresa)
Valida credenciais e host antes de depurar o app. Substitua `BASE`, `TOKEN` e o CNPJ (14 dígitos):

```bash
curl -sS -H "Accept: application/json" -H "x-api-key: TOKEN" "BASE/empresa/CNPJ14DIGITOS"
```

Exemplos de `BASE`: `https://api.plugnotas.com.br` (produção) ou `https://api.sandbox.plugnotas.com.br` (sandbox). Se usar prefixo no backend (`PLUGNOTAS_API_PATH_PREFIX=/api`), o smoke test deve usar a URL completa até o segmento antes de `/empresa`, por exemplo `https://api.plugnotas.com.br/api`. Se este GET retornar erro de rota inexistente ou 401, corrija `PLUGNOTAS_*` no backend antes de retestar a Guia MEI.

### 2e) HTTP 404 em todas as tentativas em `/empresa` (banner com `Tentativas Plugnotas: ... → HTTP 404`)
- **Referência da doc:** produção típica `https://api.plugnotas.com.br`, sandbox `https://api.sandbox.plugnotas.com.br` (sem barra final), conforme [docs.plugnotas.com.br](https://docs.plugnotas.com.br/). Os endpoints REST de empresa costumam ser `/empresa` e `/empresa/:cnpj` **na raiz desse host** — não há na documentação pública um prefixo `/api` obrigatório para esses paths; 404 em **todas** as tentativas costuma indicar host errado, URL base copiada incorretamente ou mistura sandbox/produção.
- Significa que o host alcançado **não expõe** esses paths na raiz configurada: host errado, ou falta de segmento na URL (ex.: `/api`) se a sua conta ou versão da API exigir.
- Confirme na [documentação oficial](https://docs.plugnotas.com.br/) se a URL base deve incluir um prefixo antes de `/empresa`.
- Opcional no backend: defina `PLUGNOTAS_API_PATH_PREFIX` (ex.: `/api`) em `backend/.env` e no deploy; o backend monta todas as chamadas ao Plugnotas como `PLUGNOTAS_API_BASE_URL` + prefixo + path (ex.: `/empresa/...`). Reinicie o backend após alterar.
- Alternativa: incluir o prefixo diretamente em `PLUGNOTAS_API_BASE_URL` (ex.: `https://api.plugnotas.com.br/api`) e deixar `PLUGNOTAS_API_PATH_PREFIX` vazio — evite duplicar o segmento.

### 3) PDF/XML indisponivel
- Confirmar se a nota ja foi concluida/autorizada.
- Atualizar status da nota via sincronizacao antes de novo download.

### 4) Falha de CORS/autenticacao
- Revisar `CORS_ORIGIN` no backend.
- Confirmar token de sessao no frontend e autorizacao nas chamadas API.

### 5) Job mensal DAS nao executou
- Verificar se `MEI_DAS_SCHEDULER_ENABLED` nao esta `false`.
- Confirmar horario local esperado: dia 1, a partir das 08:00 (`America/Sao_Paulo`).
- Verificar logs do backend com prefixo `[mei-das]`.

### 6) Cliente ficou com status erro no DAS
- Validar se o usuario possui `cert_document` com CNPJ valido (14 digitos).
- Validar disponibilidade da integracao Serpro no momento do processamento.
- Executar reprocessamento manual via `POST /api/admin/das/reprocess`.

<a id="mensagem-falha-na-validacao-do-json"></a>

## Mensagem: Falha na validacao do JSON

O link a partir de **Objetivo** usa a âncora `#mensagem-falha-na-validacao-do-json`, definida explicitamente no HTML acima para compatibilidade entre visualizadores (GitHub, VS Code, etc.).

Texto típico (ou muito parecido) devolvido pelo **Plugnotas** quando o corpo JSON enviado **não atende ao schema ou às regras** da API de emissão (NFSe, NF-e ou NFC-e). O backend repassa ou compõe a mensagem para o cliente; **não** indica “bug de JSON” do Express em condições normais — a requisição chegou e o **provedor recusou o payload**.

### O que fazer primeiro

1. **Confirmar origem:** a mensagem veio na resposta da API após `POST /api/mei-notas/emitir` (ou em cadastro/atualização de empresa no emissor). Em caso de dúvida, use os logs do servidor com prefixo `[emissao-fiscal NFSe]`, `[emissao-fiscal NFe]` ou `[emissao-fiscal NFCe]` e `400 response` (ver **Troubleshooting rápido** → item **2c)** neste documento).
2. **Inspecionar no navegador (DevTools → Network):**
   - Localize a requisição **`POST .../api/mei-notas/emitir`** (ou rota de setup fiscal, se o erro for no cadastro).
   - Aba **Payload** / **Request**: confira o JSON que o frontend enviou (sem copiar tokens; o header `Authorization` é da sessão do app, não é chave Plugnotas).
   - Aba **Response**: leia `message` e, se existir, estruturas de `errors` ou detalhes por campo — o backend costuma concatenar isso na string de erro exibida na Guia MEI.
3. **Revisar o payload** frente ao contrato do tipo de documento (`documentType`: `NFSE`, `NFE`, `NFCE`) e à [documentação oficial da API Plugnotas](https://docs.plugnotas.com.br). Não use exemplos com **chave real** (`x-api-key`); em curl ou Postman use sempre placeholders como `SUA_CHAVE_API` ou `TOKEN`.

### Campos que mais costumam gerar rejeição (por tipo)

| Tipo | Onde olhar primeiro |
| --- | --- |
| **NFSe** | **Prestador:** CNPJ (14 dígitos), endereço mínimo coerente com o cadastro no Plugnotas. **Tomador:** CPF/CNPJ válido, razão social. **Serviço:** `codigo`, `cnae`, `discriminacao`, `valorServico` (obrigatoriedade). **MEI / Simples Nacional:** nao informar `iss.aliquota` — a Guia MEI e o admin nao coletam aliquota ISS. |
| **NF-e / NFC-e** | Aplicável a **outros canais** ou contratos com o emissor; **não** há formulário NF-e/NFC-e na **Guia MEI** (escopo só NFS-e na UI — ver [Escopo da Guia MEI](#guia-mei-escopo-apenas-nfse)). Para referência de schema: emitente/destinatário, itens (`ncm`, `cfop`, etc.) e tributação conforme API Plugnotas. |

### NFSe: codigo do servico curto (`servico[0].codigo` / tamanho minimo)

**Sintoma:** resposta **400** com mensagem do Plugnotas ou do app no sentido de *Falha na validacao do JSON de NFSe* citando `servico[0].codigo` e **tamanho minimo (sem mascara)** (tipicamente **6** caracteres alfanumericos apos remover pontos, tracos e similares).

**Causa provavel:** codigo municipal / lista de servicos informado com poucos caracteres uteis apos a mascara; ou codigo inventado muito curto.

**Acao:** informe o **codigo oficial** do servico conforme a prefeitura ou o cadastro no Plugnotas. A **Guia MEI** e o **admin** validam o mesmo criterio antes do envio. Consulte a [Documentacao API Plugnotas](https://docs.plugnotas.com.br) e o checklist interno [`docs/qa/plugnotas-multitipo-checklist.md`](qa/plugnotas-multitipo-checklist.md) quando aplicavel.

### Alinhamento com QA interno

Checklist operacional multi-tipo (sandbox/produção, tipos de nota, webhook, downloads): [`docs/qa/plugnotas-multitipo-checklist.md`](qa/plugnotas-multitipo-checklist.md).

### Erros de extensão do navegador (não são do app)

Mensagens como **`No tab with id`** ou falhas ao abrir o painel Network causadas por **extensões** (bloqueadores, tradutores, ferramentas de privacidade) **não** são geradas pelo Meu Financeiro. Se o diagnóstico travar no DevTools, teste em **janela anônima** sem extensões ou em outro navegador.

### Referência externa

- [Documentação API Plugnotas](https://docs.plugnotas.com.br) — schemas, exemplos e regras por endpoint (empresa, certificado, NFSe, NF-e, NFC-e).

## Fluxo Operacional Recomendado
1. Validar CNPJ e dados basicos do prestador.
2. Emitir NFSe.
3. Sincronizar status ate conclusao.
4. Baixar PDF/XML quando disponivel.
5. Em caso de erro recorrente, coletar logs e payload resumido para diagnostico.

## Checklist operacional do provedor de emissão (multi-tipo)
URL base de produção típica (conforme `PLUGNOTAS_API_BASE_URL`): ver documentação do provedor configurado no servidor.

1. Confirmar ambiente de emissao (sandbox vs produção) conforme URL em `PLUGNOTAS_API_BASE_URL`.
2. Confirmar token correto do ambiente (`x-api-key`): em sandbox use sempre a chave de API do sandbox (PLUGNOTAS_API_KEY); nao misturar sandbox e producao.
3. Confirmar cadastro de empresa/certificado A1 (`.pfx/.p12`) no ambiente usado.
4. Confirmar `config.producao` no cadastro da empresa:
   - `false` para homologacao.
   - `true` para producao.
5. Confirmar webhook ativo e endpoint acessivel externamente:
   - Rota local do projeto: `POST /api/mei-notas/webhook`.
   - Backend deve retornar `2xx` apenas quando processar com sucesso.
6. Validar emissao por tipo conforme o **canal** em uso:
   - **Guia MEI (usuário final):** fluxo de emissão exposto é **NFSE** apenas.
   - **API / testes / histórico:** podem existir registros ou chamadas com `NFE` / `NFCE` — validar conforme escopo do cliente.
7. Validar ciclo completo:
   - emissao assíncrona;
   - consulta/sync;
   - webhook de status final;
   - download PDF/XML.
8. Se houver rejeicao de schema/tributacao (especialmente NF-e/NFC-e), validar XML em validador oficial e revisar campos da Reforma Tributaria (IBS/CBS/IS).

## Checklist Postman
1. Importar collections oficiais da TecnoSpeed para sandbox e producao.
2. Definir variáveis de ambiente no Postman:
   - `baseUrl`
   - `x-api-key`
3. Executar smoke mínimo:
   - emissao;
   - consulta resumo;
   - cancelamento;
   - download PDF/XML;
   - (NFe) relatorio.
4. Registrar evidencias (request/response) para QA.

## Operacao DAS Mensal (Runbook Curto)
1. No dia 1, monitorar resumo de execucao do job DAS no backend.
2. Validar `total`, `ok` e `erro` do lote e competencia processada.
3. Em caso de falha parcial, usar `POST /api/admin/das/reprocess` por usuario/competencia.
4. Conferir painel admin em `/dados-dos-usuarios` na secao de pendencias DAS.
5. Se necessario, abrir incidente com logs de `[mei-das]` e contexto de usuario/competencia.

## Estado Atual da API NFSe (2026-03-12)

### Mapa funcional confirmado
- Base oficial: `GET/POST/PATCH /api/mei-notas` (alias legado: `/api/notas`).
- Endpoints de NFSe implementados:
  - `POST /api/mei-notas/emitir`
  - `POST /api/mei-notas/setup/emissao-fiscal/certificado` (alias: `.../setup/plugnotas/certificado`)
  - `POST /api/mei-notas/setup/emissao-fiscal/empresa` (alias: `.../plugnotas/empresa`)
  - `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=` (alias: `.../plugnotas/empresa`)
  - `PATCH /api/mei-notas/setup/emissao-fiscal/empresa` (alias: `.../plugnotas/empresa`)
  - `GET /api/mei-notas`
  - `GET /api/mei-notas/:id` (com `?sync=true` para sincronizar status)
  - `PATCH /api/mei-notas/:id`
  - `POST /api/mei-notas/:id/cancelar`
  - `POST /api/mei-notas/:id/arquivar`
  - `GET /api/mei-notas/:id/pdf`
  - `GET /api/mei-notas/:id/xml`
  - `GET /api/mei-notas/catalogo/clientes`
  - `GET /api/mei-notas/catalogo/produtos`
  - `POST /api/mei-notas/webhook`
- Seguranca de acesso:
  - Rotas de negocio protegidas por `requireAuth` e `requireMeiEnabled`.
  - Webhook com validacao por token (`x-webhook-token`, `x-api-key` ou query `token`).
- Integracao externa:
  - Adaptador HTTP no backend em `backend/src/services/plugnotas/` (NFSe, NFe, NFCe, empresa).
  - Operacoes cobertas: emissao, consulta por ID/protocolo/integracao, cancelamento e download PDF/XML.

### Validacao operacional local
- `GET http://localhost:3333/health` retornou `200`.
- `GET http://localhost:3333/api/mei-notas` sem token retornou `401` (`Token ausente`).
- `GET http://localhost:3333/api/notas` sem token retornou `401` (`Token ausente`).
- `POST http://localhost:3333/api/mei-notas/webhook` com `{}` retornou `400` (`Webhook sem identificadores da NFSe`).
- Logs locais do backend mostram chamadas recentes de NFSe em execucao (`/api/mei-notas` e catalogos), sem erro estrutural de rota.

### Cobertura automatizada atual
- Backend (alvo NFSe + regressao atual do backend): `44 passed`
  - Comando executado: `npm test --workspace backend -- tests/mei-notas-core.test.js tests/mei-notas-routes.test.js tests/plugnotas-nfse.test.js`
- Frontend (service NFSe): `9 passed`
  - Comando executado: `npm test --workspace frontend -- src/services/meiNotasService.test.ts`
- Conclusao: API NFSe esta funcional e com cobertura basica ativa, mas ainda com espaco para ampliar cenarios criticos ponta a ponta.

### Riscos observados
1. Webhook ainda depende de token compartilhado (sem assinatura de payload e sem anti-replay).
2. Cobertura de testes foca mais em validacoes/contrato do que em cenarios E2E de emissao-sync-download.
3. Story de regressao ampla (`docs/stories/3.3-p1-cobertura-regressao-fluxos-criticos.md`) ainda nao esta concluida.

### Priorizacao recomendada (curto prazo)
1. Fechar Story 3.3 com foco em emissao happy-path backend, webhook por `plugnotas_id` e `id_integracao`, sync (`?sync=true`) e download PDF/XML disponivel/indisponivel.
2. Endurecer webhook (token obrigatorio em ambientes de integracao e estrategia de assinatura do payload).
3. Revalidar quality gates apos ampliacao de cobertura e anexar evidencia de execucao para QA.
