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

## Consequências

- Positivo: menos falhas de cadastro por validação de NFC-e inativa.
- Negativo: se no futuro o produto voltar a oferecer NFC-e ativa, será necessário flag ou outro caminho de payload (fora deste ADR).
