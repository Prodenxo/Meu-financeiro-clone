# ADR: Payload de empresa Plugnotas no modo “apenas NFS-e”

**Status:** Aceito  
**Rastreabilidade FR-A01:** Registro técnico vinculado ao épico [`docs/stories/epic-guia-mei-apenas-nfse-prd.md`](../stories/epic-guia-mei-apenas-nfse-prd.md) (US-MEI-NFS-01); gate de QA documentado na mesma story. Aprovação formal de arquitetura (@architect) é controle de processo complementar ao conteúdo deste ADR.  
**Contexto:** O produto Guia MEI neste escopo usa somente **NFS-e**. Enviar blocos **NF-e** / **NFC-e** com `config` (ex.: `versaoQrCode`, SEFAZ) pode gerar erros de validação no Plugnotas sem benefício operacional.

## Decisão

1. **`nfe` e `nfce`** no `POST /empresa` e, quando presentes no corpo, no `PATCH /empresa/:cnpj`:
   - Valores fixos mínimos: `{ ativo: false, tipoContrato: 0 }`.
   - **Não** enviar `config` aninhado nesses blocos (evita validação de QR/SEFAZ).

2. **`inscricaoEstadual`**
   - Se ausente ou apenas espaços em branco **no cadastro (POST)** → preencher com **`ISENTO`**.
   - No **PATCH**, normalizar para `ISENTO` **somente** quando a chave `inscricaoEstadual` existir no corpo e o valor for vazio — assim atualizações parciais sem IE não sobrescrevem o cadastro remoto.

3. **`PATCH` parcial** sem chaves `nfe` / `nfce` → **não** incluir esses objetos no JSON (NFR-04: não reativar NFC-e legada ao atualizar só dados cadastrais).

## Implementação

- `backend/src/services/plugnotas/empresa.service.js` — `applyEmpresaPlugnotasApenasNfseForPost` / `applyEmpresaPlugnotasApenasNfseForPatch`.
- `backend/src/services/plugnotas/plugnotas-mei-empresa-policy.js` — constante `PLUGNOTAS_MEI_INSCRICAO_ESTADUAL_QUANDO_VAZIA` (alinhada ao frontend `nfEmissionCompany.ts`).
- `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload` com `nfe`/`nfce` inativos sem `config` e IE vazia → mesma constante simbólica.

## Rollout (D-05)

Comportamento **apenas NFS-e** no cadastro de empresa está **ativo por padrão** no código; não há variável de ambiente dedicada até decisão de PO sobre feature flag (D-05). Eventual flag futura deve encapsular a normalização em `empresa.service.js` e o payload em `buildNfEmissionEmpresaPayload`.

## Complemento (2026-04-07) — modo multi-documento (`documentosAtivos`)

Quando o cliente envia **`documentosAtivos: { nfse, nfe, nfce }`** (booleanos), o backend monta os blocos `nfse` / `nfe` / `nfce` de forma **canónica** em `applyEmpresaPlugnotasDocumentSelectionForPost` / `ForPatch` (`backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`), **remove** `documentosAtivos` antes do `fetch` ao Plugnotas e valida **pelo menos um** tipo activo (mensagem 400 alinhada ao PRD §6.3).

- **Inactivos:** continuam **sem** `config` (`{ ativo: false, tipoContrato: 0 }`).
- **Activos:** `tipoContrato: 0` e `config` mínimo acordado (NF-e / NFC-e — valores documentados no módulo; revisão com doc oficial / sandbox).
- **PATCH:** se **`documentosAtivos` ausente**, mantém-se o comportamento deste ADR (omitir `nfe`/`nfce` quando não enviados; não reactivar NFC-e legada por engano). Se **`documentosAtivos` presente**, aplica-se a mesma montagem que no POST para expressar intenção explícita.

Story: [`story-fr-cad-doc-p0-backend-documentos-ativos-plugnotas.md`](../stories/story-fr-cad-doc-p0-backend-documentos-ativos-plugnotas.md).

## Complemento (2026-04-08) — trilho B opt-in `nfse.config.prefeitura.codigoIbge`

Quando `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`, o BFF preenche `nfse.config.prefeitura.codigoIbge` com `endereco.codigoCidade` normalizado (7 dígitos) **apenas** se `nfse` está activo e o ramo `prefeitura` ainda não define `codigoIbge` — preserva `login` / `senha` enviados pelo cliente.

A documentação pública Plugnotas (exemplo TecnoSpeed) usa com frequência `prefeitura.login` / `prefeitura.senha` para NFS-e municipal; o ramo **IBGE** serve ambientes em que o validador aceita (ou exige em conjunto) identificação por código IBGE. Confirmar conta/ambiente com **NFR-PREF-EV-01**. **Desligado por defeito** (**NFR-P0-REG-01**).

Implementação: `backend/src/services/plugnotas/nfsePrefeituraPayload.js` + `empresa.service.js` após `normalizePayloadEnderecoCodigoCidade` em `POST` e `PATCH` empresa.

Story: [`story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md`](../stories/story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md).

**FR-P0-SPIKE-01 / FR-P0-DOC-01:** fecho documental do spike e decisão trilho **B** — [`docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`](../evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md); story [`docs/stories/story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md`](../stories/story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md). Runbook: [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) âncora `#p0-prefeitura-spike-trilho-b`.

<a id="adr-plugnotas-politica-local-credenciais"></a>
## Complemento (2026-04-09) — DP-PLOGIN-01: credenciais do portal municipal (`nfse.config.prefeitura.login` / `senha`)

- **Opt-in:** `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED=true` no backend (defeito `false` até decisão PO / rollout). O frontend espelha com `VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED=true` para mostrar os campos no Guia MEI.
- **Validação BFF:** *trim*, comprimento máximo (login 128, senha 256 caracteres), par **login+senha** obrigatório em conjunto quando qualquer um é enviado; com flag **desligada**, qualquer envio de credenciais → **400** (`prefeitura_portal_credenciais_disabled`).
- **Merge:** preserva `codigoIbge` e derivação trilho B — ordem em `empresa.service.js`: `normalizePayloadEnderecoCodigoCidade` → `applyPrefeituraPortalCredentialsPolicy` → `applyNfsePrefeituraIbgeIfEnabled`.
- **NFR:** logs de debug de cadastro empresa mascaram `login` / `senha` (`plugnotas-empresa-cadastro-debug.js`).
- **Exemplo redigido (NFR-PLOGIN-01)** — valores **fictícios**; não usar em produção nem copiar para tickets com dados reais:

```json
{
  "nfse": {
    "ativo": true,
    "tipoContrato": 0,
    "config": {
      "prefeitura": {
        "codigoIbge": "3550308",
        "login": "usuario-portal-exemplo-ficticio",
        "senha": "senha-exemplo-ficticia"
      }
    }
  }
}
```

- Implementação: `backend/src/services/plugnotas/prefeituraPortalCredentials.js`; UI: `frontend/src/utils/nfEmissionCompany.ts`, `prefeituraPortalCredentialsUi.ts`.
- Story: [`docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md`](../stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md).

## Complemento (2026-04-09) — DP-PLOGIN-02: bloqueio de `prefeitura` só com `codigoIbge` (lista IBGE)

- **Opt-in:** `PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_ENABLED=true` e `PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_CODES` (códigos de 7 dígitos, vírgula). **Defeito desligado;** lista **vazia** ⇒ nenhum bloqueio (evita falsos positivos em municípios onde só IBGE basta — trilho B).
- **Quando bloquear:** após derivação IBGE, se `nfse.config.prefeitura` fica **apenas** com `codigoIbge` (sem `login`/`senha` não vazios) **e** o IBGE está na lista **e** a flag está ligada → **400** BFF **antes** do Plugnotas, `errors.plugnotasCode`: **`prefeitura_ibge_apenas_insuficiente_dp02`**.
- **Quando não bloquear:** credenciais DP01 presentes (par preenchido); ou IBGE não está na lista; ou flag desligada; ou `nfse.ativo === false`.
- **Ordem em `empresa.service.js`:** `…` → `applyNfsePrefeituraIbgeIfEnabled` → `applyPrefeituraIbgeOnlyBlockPolicy`.
- Implementação: `backend/src/services/plugnotas/prefeituraIbgeOnlyBlock.js`.
- Story: [`docs/stories/story-fr-plogin-backlog-dp02-bloqueio-prefeitura-incompleta-servidor.md`](../stories/story-fr-plogin-backlog-dp02-bloqueio-prefeitura-incompleta-servidor.md).

## Complemento (2026-04-16) — FR-RPS: bloco `rps` na criação de empresa (**NFR-RPS-DOC-01**)

Para além da normalização **apenas NFS-e** e de **`documentosAtivos`** já descritas neste ADR, o BFF aplica política ao bloco **`rps`** (numeração inicial de RPS no emissor Plugnotas). No **`POST /empresa`**, o servidor garante valores **canónicos** (`lote: 1`, `numeracao` com `numero: 1` e `serie: "1"`), **substituindo** qualquer `rps` divergente enviado pelo cliente (**fonte de verdade no BFF**). No **`PATCH /empresa/:cnpj`**, o **`rps` não é enviado** nesta entrega — decisão intencional para não repor numeração já consumida no provedor, **incluindo** o fallback **POST → PATCH** quando o POST sinaliza empresa já existente.

Documentação de requisitos e desenho: PRD [`PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md`](../prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md); arquitetura [`architecture-plugnotas-empresa-rps-inicial-2026-04-16.md`](../technical/architecture-plugnotas-empresa-rps-inicial-2026-04-16.md). Código: `backend/src/services/plugnotas/plugnotas-empresa-rps-inicial.js` e `empresa.service.js`. Story de implementação: [`story-fr-rps-p0-backend-empresa-rps-inicial-plugnotas.md`](../stories/story-fr-rps-p0-backend-empresa-rps-inicial-plugnotas.md).

## Consequências

- Positivo: menos falhas de cadastro por validação de NFC-e inativa.
- Negativo: se no futuro o produto voltar a oferecer NFC-e ativa, será necessário flag ou outro caminho de payload (fora deste ADR).
