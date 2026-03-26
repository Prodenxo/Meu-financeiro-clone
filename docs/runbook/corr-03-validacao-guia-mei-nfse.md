# CORR-03 — Roteiro de validação: Guia MEI / emitente NFS-e (pós-schema)

**Objetivo:** confirmar que, após CORR-01 (DDL aplicado) e CORR-02 (processo), o fluxo **atualizar emitente sem novo `.pfx`** persiste e relê dados sem erro de coluna (`tipo_logradouro` / schema cache).

**Referências:** `docs/stories/story-prd-correcao-supabase-schema-tipo-logradouro.md`, `docs/runbook/supabase-ambientes-e-deploy.md`

---

## 0. Pré-requisitos

- [ ] Migrações aplicadas e `npm run db:verify:nfse-emitente-schema` com **sucesso** no projeto Supabase ligado ao `backend/.env` (ou equivalente).
- [ ] Se ainda aparecer erro de *schema cache* no PostgREST: **Reload schema** no painel Supabase (API).
- [ ] Backend e frontend a correr (`npm run dev:backend`, `npm run dev` ou equivalente); utilizador de teste com **MEI habilitado** e certificado já associado (cenário típico de «atualizar sem novo certificado»).

---

## 1. Verificação automática (repo)

Cobre **encadeamento** da rota `PATCH .../emitente-nfse` com middlewares `requireAuth` + `requireMeiEnabled` (não substitui teste contra Supabase real):

```text
npm run qa:corr03-smoke-backend
```

(Executa apenas `backend/tests/mei-guide-routes-emitente.test.js` a partir da pasta `backend`.)

**CI (GitHub Actions):** em PRs que alterem ficheiros `mei-guide*`, `mei-certificate-store*`, migrações `*user_mei*` ou o teste acima, o workflow `.github/workflows/corr03-smoke-backend.yml` corre o mesmo comando automaticamente.

Ou a suíte completa do backend:

```text
npm run test -w backend
```

---

## 2. Verificação API (manual)

Com sessão autenticada (cookie/token conforme o vosso cliente), enviar **PATCH** para o backend (ajustar host e prefixo de API):

- **Rota:** `PATCH /api/mei-guide/certificate/emitente-nfse`
- **Corpo:** JSON com campos do emitente (ex.: `razaoSocial`, `tipoLogradouro`, `logradouro`, `cidade`, `uf`, … — alinhado ao contrato em `mei-guide` / frontend).

**Critério de sucesso:** resposta **2xx** e corpo sem mensagem de erro PostgREST do tipo *Could not find the 'tipo_logradouro' column … in the schema cache*.

**Seguinte:** `GET /api/mei-guide/certificate/status` e confirmar que `nfseEmitente` (ou equivalente no payload) reflete os valores gravados.

> **Nota:** falha **502** no Plugnotas durante «consultar emissor» é independente da persistência local; não invalida sozinha o CORR-03 se o PATCH local for 2xx.

---

## 3. Verificação UI (Guia MEI)

1. Abrir o ecrã **Guia MEI** com dados mínimos NFS-e visíveis.
2. Clicar em **Atualizar cadastro (sem novo certificado)** (ou fluxo equivalente que dispara PATCH).
3. Confirmar mensagem de sucesso **sem** erro de schema Supabase.
4. **Recarregar a página** (F5) ou sair e voltar ao ecrã.
5. Confirmar que os campos do formulário estão preenchidos com os dados persistidos (`nfseEmitente` / status).

---

## 4. Evidência para ticket / release

Copiar para o ticket ou anexo de release:

| Item | Evidência |
|------|-----------|
| Schema | Output de `npm run db:verify:nfse-emitente-schema` (sucesso) ou query SQL do PRD |
| API | Status HTTP do PATCH + excerto da resposta (sem tokens) |
| UI | Notas passo a passo ou screenshot do formulário após refresh |

**Data / ambiente / responsável:** _preencher_

---

**Última atualização:** 2026-03-26 — CORR-03; pós-QA: workflow CI `corr03-smoke-backend.yml`.
