# Brief: correção — **400** `fields.nfse.config.prefeitura` (Preenchimento obrigatório) e **404** no `GET` empresa

**Data:** 2026-04-09  
**Âmbito:** cadastro de empresa no emissor Plugnotas (Guia MEI → `POST /api/mei-notas/setup/emissao-fiscal/empresa`).

**Ver também (runbook de equipa):** [`docs/operacao-mei-nfse.md` — Trilho B / env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`](../operacao-mei-nfse.md#prefb-trilho-b-env-derive-ibge).

---

## 1. Sintoma e mensagem típica

| Pedido | Resultado |
|--------|-----------|
| `POST /api/mei-notas/setup/emissao-fiscal/empresa` | **400** — `message`: `Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório` |
| `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=…` (a seguir ao fluxo) | **404** — empresa ainda não existe no Plugnotas para aquele CNPJ |

**Cadeia no frontend (referência):** `apiClient` → `meiNotasService.cadastrarEmpresaEmissaoNf` / `consultarEmpresaEmissaoNf` → `plugnotasEmitenteSetup.submitPlugnotasEmitenteSetup` → `GuidesMei.tsx` (`handleCertificateUpload`).

---

## 2. Causa raiz

1. **Validação Plugnotas:** o contrato aceite pelo emissor exige o bloco **`nfse.config.prefeitura`** (configuração municipal no NFS-e).
2. **Payload enviado pela app:** `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload` define `nfse.config` apenas com `{ producao: true }`, **sem** `prefeitura`, e envia `endereco.codigoCidade` já normalizado (IBGE, 7 dígitos quando válido).
3. **Preenchimento automático no backend (trilho B, P0):** só corre se **`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`** no ambiente do API. Nesse caso, `backend/src/services/plugnotas/nfsePrefeituraPayload.js` — `applyNfseConfigPrefeituraDeriveIbge` adiciona `nfse.config.prefeitura: { codigoIbge: "<7 dígitos>" }` a partir de **`endereco.codigoCidade`**. Se a flag **não** estiver activa, o JSON segue sem `prefeitura` → **400** determinístico.

**Conclusão:** a “correção” operacional imediata é **activar a derivação** + **garantir IBGE de 7 dígitos** no endereço; o **404** deixa de ser relevante depois de um **POST** bem-sucedido.

---

## 3. Passos de correção (checklist)

1. No **`.env` do backend** (não só `.env.example`), definir:
   - `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`
2. **Reiniciar** o processo Node do backend para carregar a variável.
3. No **Guia MEI**, confirmar que o **código IBGE da cidade** está **correcto e com 7 dígitos** (o formulário já exige o campo; a derivação falha silenciosamente se não houver 7 dígitos após normalização).
4. Repetir o fluxo: upload de certificado → **POST** empresa. Esperado: **2xx** no POST; em seguida o **GET** por CNPJ deixa de ser **404** para esse registo.

**Nota:** em **produção**, confirmar com operação / NFR-PREF-EV-01 antes de activar a flag em massa (o repositório documenta o trilho B como opt-in).

---

## 4. Se o 400 persistir após o trilho B

- Verificar logs do BFF (opcional: `PLUGNOTAS_DEBUG=true` em não-prod) para confirmar que o payload upstream inclui `nfse.config.prefeitura`.
- Alguns municípios podem exigir **credenciais** (`login` / `senha` ou campos adicionais) em `nfse.config.prefeitura`, além de `codigoIbge` — aí o encaminhamento é **contrato Plugnotas + operação** (trilhos C/D no brief P0 abaixo), não só env.

---

## 5. Documentos e código relacionados

| Tipo | Referência |
|------|------------|
| Runbook operacional (trilho B, env, POST→GET 404) | [`operacao-mei-nfse.md`](../operacao-mei-nfse.md#prefb-trilho-b-env-derive-ibge) |
| Brief P0 (trilhos A–D, risco se não fechar contrato) | [`brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md`](./brief-acao-p0-cadastro-empresa-prefeitura-400-e-get-404-2026-04-08.md) |
| Cadeia 400/404 (contexto UX) | [`brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](./brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md) |
| Payload / política apenas NFS-e | `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` |
| Env exemplo | `backend/.env.example` — `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` |
| Derivação IBGE | `backend/src/services/plugnotas/nfsePrefeituraPayload.js`, `backend/src/services/plugnotas/empresa.service.js` (`applyNfsePrefeituraIbgeIfEnabled`) |
| Montagem payload cliente | `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload` |
| Testes de contrato | `backend/tests/plugnotas-empresa.test.js` (POST com flag), `backend/tests/nfsePrefeituraPayload.test.js` |

---

## 6. Change log

| Data | Nota |
|------|------|
| 2026-04-09 | Brief de **correção** consolidando causa (prefeitura obrigatória), trilho B (`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE` + IBGE 7 dígitos), e relação com 404 no GET. |
| 2026-04-09 | Link reverso para runbook [`operacao-mei-nfse.md`](../operacao-mei-nfse.md#prefb-trilho-b-env-derive-ibge) (paridade FR-PREFB / observação QA opcional). |
