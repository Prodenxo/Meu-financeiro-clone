# Runbook — Smoke E2E **NF-e** e **NFC-e** (Plugnotas sandbox / homologação)

**Versão:** 1.4  
**Data:** 2026-04-07  
**Changelog:** 1.4 — FR-POSQA-07: critérios HTTP do smoke + troubleshooting (seguimento QA POSQA-5). 1.3 — **FR-POSQA-07** (POSQA-5): script + workflow opcional. 1.2 — Secção **Política empresa Plugnotas** (FR-POSQA-03 / POSQA-4, decisão D1). 1.1 — Rotas PDF/XML explícitas no texto (feedback QA POSQA-1).  
**Requisitos:** [`docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`](../prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md) (**FR-POSQA-01**, **FR-POSQA-02**, **FR-POSQA-07** opcional)  
**Arquitetura:** [`docs/technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md`](../technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md) §6

Este runbook descreve um procedimento **reproduzível** para validar emissão **real** via integrador Plugnotas (além dos testes unitários com `fetch` mock). **Não** substitui assessoria fiscal nem garante comportamento idêntico em todas as UFs em produção.

---

## Limitações (NFR e ambiente)

| Tema | Nota |
|------|------|
| **Sandbox ≠ produção** | Mensagens SEFAZ, tempos e estados (`processando` / `concluido`) podem diferir. |
| **UF / regras locais** | Comportamento em produção depende de credenciamento e regras estaduais; o sandbox pode aceitar payloads que a SEFAZ estadual rejeitaria. |
| **Conta Plugnotas** | `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY` devem ser da **mesma conta** e do **mesmo ambiente** (sandbox ou produção). |
| **Política MEI “apenas NFS-e”** | O cadastro automático da empresa pode enviar `nfe`/`nfce` **inactivos**; para smoke “sucesso fim-a-fim” de NF-e/NFC-e pode ser necessário activar modalidades no painel Plugnotas ou fluxo dedicado — ver [Cenário B](#cenário-b--empresa-sem-nfe-nfce-activos) e [Política empresa Plugnotas](#política-empresa-plugnotas-fr-posqa-03). |

---

## Política empresa Plugnotas (**FR-POSQA-03**)

**Decisão de produto (2026-04-07):** **D1 — Documentação + bloqueio honesto** — ver PRD [`PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`](../prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md) §8.1 e ADR [`adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`](../technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md).

| Pergunta | Orientação |
|----------|--------------|
| O utilizador não consegue emitir NF-e/NFC-e porque `nfe`/`nfce` estão inactivos no Plugnotas? | Tratar como **configuração no emissor / política da conta**, não como bug da app. A UI deve mostrar bloqueio ou callout (`MeiFiscalCapabilityCallout`) com base em `GET` empresa. |
| Como pedir activação? | **Painel / suporte Plugnotas** da conta do integrador (contrato e política do provedor). Não documentar aqui credenciais nem passos que violem NFR-POSQA-01. |
| E se precisarmos de PATCH/POST automático ou feature flag? | **D2** / **D3** permanecem backlog; eventual story filha com `empresa.service.js` / env — fora do âmbito da decisão D1. |

---

## Segurança (**NFR-POSQA-01**)

- **Não** colar neste repositório: API keys, passwords, certificados (`.pfx`/`.p12`) nem conteúdo de `Authorization` ou `x-api-key`.  
- Usar **cofre** da equipa ou variáveis de ambiente locais (`backend/.env` no `.gitignore`).  
- Evidências em tickets: **não** anexar `response_json` completo com dados fiscais reais de terceiros; basta campos listados em [Template de evidência](#template-de-evidência-fr-posqa-02).

---

## Pré-condições

| # | Pré-condição | Como verificar |
|---|----------------|------------------|
| P1 | Backend com `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY` válidos | Arranque do servidor sem erro de config; emissão não devolve imediatamente “Serviço de emissão fiscal não configurado”. |
| P2 | Supabase (`SUPABASE_URL`, service role) para persistir `mei_nfse` | Operações `emitir` gravam registo (erro de DB seria distinto de erro Plugnotas). |
| P3 | Utilizador de teste com sessão válida e **MEI habilitado** (`requireMeiEnabled`) | Token/cookie de auth igual ao uso normal da app. |
| P4 | Certificado A1 associado à conta / CNPJ de teste no Plugnotas | Fluxo Guia MEI certificado concluído ou equivalente para o CNPJ usado. |
| P5 | Para **sucesso** NF-e/NFC-e: empresa no Plugnotas com modalidades **nfe** / **nfce** activas | `GET` empresa (passo 2) — ver estrutura `data.nfe.ativo` / `data.nfce.ativo` conforme payload do provedor. |
| P6 | Payload mínimo passa em `validateNfeLikePayload` | Estrutura alinhada a `backend/tests/mei-notas-core.test.js` (modelo **55** para NFE, **65** para NFCE). |

**Variáveis de ambiente relevantes (backend):** ver também [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — secção “Variaveis de Ambiente Criticas”.

---

## Base URL e rotas

- **Prefixo API:** `{BACKEND}/api` (ex.: `http://localhost:3333/api` em desenvolvimento — confirmar `PORT` em `backend/.env`).  
- **Emitir:** `POST /api/mei-notas/emitir`  
- **Listar:** `GET /api/mei-notas?documentType=NFE` ou `NFCE` (e `limit` se necessário)  
- **Empresa (setup):** `GET /api/mei-notas/setup/emissao-fiscal/empresa` (alias: `GET /api/mei-notas/setup/plugnotas/empresa`) — query `cpfCnpj` do emitente conforme `mei-notas.controller.js`  
- **PDF/XML (opcional):** `GET /api/mei-notas/:id/pdf` e `GET /api/mei-notas/:id/xml` — `:id` é o **UUID interno** da nota na app (registo `mei_nfse`); mesmos cabeçalhos de autenticação; usar quando existir `plugnotas_id` ou após sync/webhook. Implementação: `mei-notas.routes.js`.

**Cabeçalhos:** incluir autenticação já usada pelo frontend (`Authorization` Bearer / cookie conforme app).

---

## Payload mínimo de referência (dados fictícios)

Os CNPJs/CPFs abaixo são **exemplos** de teste (mesmo padrão que `mei-notas-core.test.js`); substitua por dados válidos para **a sua** conta sandbox, sem usar dados reais de terceiros em tickets públicos.

**NF-e (`documentType: NFE`):** modelo implícito ou explícito **55**.

```json
{
  "documentType": "NFE",
  "payload": {
    "emitente": { "cpfCnpj": "12345678000199", "razaoSocial": "Emitente teste sandbox" },
    "destinatario": { "cpfCnpj": "12345678901", "razaoSocial": "Destinatario teste sandbox" },
    "itens": [
      {
        "codigo": "A1",
        "descricao": "Produto teste smoke",
        "ncm": "12345678",
        "cfop": "5102",
        "unidade": "UN",
        "quantidade": 1,
        "valorUnitario": 10,
        "tributos": {
          "icms": { "cst": "00" },
          "pis": { "cst": "01" },
          "cofins": { "cst": "01" }
        }
      }
    ]
  }
}
```

**NFC-e (`documentType: NFCE`):** modelo **65** (normalizado no servidor se omitido).

```json
{
  "documentType": "NFCE",
  "payload": {
    "emitente": { "cpfCnpj": "12345678000199", "razaoSocial": "Emitente teste sandbox" },
    "destinatario": { "cpfCnpj": "12345678901", "razaoSocial": "Consumidor teste sandbox" },
    "itens": [
      {
        "codigo": "A1",
        "descricao": "Produto teste smoke",
        "ncm": "12345678",
        "cfop": "5102",
        "unidade": "UN",
        "quantidade": 1,
        "valorUnitario": 10,
        "tributos": {
          "icms": { "cst": "00" },
          "pis": { "cst": "01" },
          "cofins": { "cst": "01" }
        }
      }
    ]
  }
}
```

**Referência de código:** `backend/tests/mei-notas-core.test.js` (validação de modelo e campos). Ajuste NCM/CFOP/tributos se o sandbox Plugnotas exigir cenário específico.

**UI (alternativa):** Guia MEI — workspace **Emissão fiscal**, selector **NF-e** / **NFC-e**, formulário `MeiNfeLikeEmitForm`; o browser chamará o mesmo endpoint com o payload montado pelo cliente.

---

## Procedimento ordenado

### Cenário A — Fluxo completo (API ou UI)

1. **Autenticar** como utilizador de teste (MEI activo).  
2. **(Opcional recomendado)** `GET` empresa emissão fiscal — confirmar cadastro e estado `nfe`/`nfce`.  
3. **`POST /api/mei-notas/emitir`** com corpo **NFE** (payload acima, dados da conta).  
4. Anotar `id` interno da nota na resposta / listagem e `status` inicial.  
5. Repetir **3–4** para **NFCE** com o segundo JSON.  
6. **`GET /api/mei-notas?documentType=NFE`** e **`...documentType=NFCE`** — confirmar linhas com `document_type` coerente.  
7. **(Opcional)** Com o UUID interno da nota (resposta de emissão ou listagem): `GET /api/mei-notas/{id}/pdf` e/ou `GET /api/mei-notas/{id}/xml` quando `plugnotas_id` existir ou o fluxo de sync tiver concluído; validar cabeçalhos iguais aos dos passos anteriores.

### Cenário B — Empresa sem NF-e/NFC-e activos

1. Executar passo 2; se `nfe`/`nfce` estiverem inactivos, esperar **bloqueio** ou erro de emissão coerente com a política (`MeiFiscalCapabilityCallout` na UI).  
2. Registar como evidência “bloqueio configurado” (sem classificar como bug da app).  
3. Seguir [Política empresa Plugnotas](#política-empresa-plugnotas-fr-posqa-03) (decisão **D1** registada em **POSQA-4**); activação via painel/suporte Plugnotas até eventual **D2**.

---

## Resultado esperado (**FR-POSQA-02**)

| Resultado | Descrição |
|-----------|-----------|
| **Aceitável sandbox** | HTTP 200 na emissão, registo em `mei_nfse` com `document_type` **NFE** ou **NFCE**, `status` inicial tipicamente `processando` ou equivalente até sync/webhook. |
| **Erro de validação Plugnotas** | HTTP 4xx com mensagem agregada (campos); não indica falha de rota interna se o backend devolve mensagem do emissor. |
| **Indisponibilidade modalidade** | Bloqueio claro antes ou erro de negócio explicável — alinhar com runbook de empresa / POSQA-4. |

---

## Template de evidência (**FR-POSQA-02**)

Registar no ticket interno / QA (mínimo):

| Campo | Exemplo (sem PII real) |
|-------|-------------------------|
| Data/hora execução | 2026-04-07T14:00Z |
| Ambiente | Sandbox Plugnotas / URL base (sem query secret) |
| Utilizador | ID interno ou pseudónimo |
| Tipo | NFE ou NFCE |
| ID nota interna (app) | UUID da linha `mei_nfse` |
| `document_type` | NFE / NFCE |
| `status` após emissão | processando / concluido / … |
| Resultado | Pass / Falha + código HTTP se aplicável |

**Não** colar: `response_json` completo, certificados, `PLUGNOTAS_API_KEY`, corpos com CPF/CNPJ de terceiros reais.

---

## Automação opcional CI / script (**FR-POSQA-07**, POSQA-5)

Complementa o smoke **manual** (API da app + autenticação + Supabase): não substitui o runbook; valida **conectividade HTTP** ao integrador com credenciais reais.

| Artefacto | Descrição |
|-----------|-----------|
| **Script** | [`scripts/smoke-nfe-nfce-plugnotas.mjs`](../../scripts/smoke-nfe-nfce-plugnotas.mjs) — `POST` a `/nfe` e `/nfce` com payload **inválido**; espera resposta **4xx** (validação / negócio), provando rota + API key **sem** emitir nota. |
| **NPM (raiz)** | `npm run smoke:plugnotas:nfe-nfce` — carrega `backend/.env` (ou `.env` na raiz). Sem credenciais: **SKIP** (exit 0); com `--strict`: falha se env ausente. |
| **GitHub Actions** | [`.github/workflows/posqa-5-plugnotas-smoke-optional.yml`](../../.github/workflows/posqa-5-plugnotas-smoke-optional.yml) — corre **só** se os secrets `PLUGNOTAS_API_BASE_URL` e `PLUGNOTAS_API_KEY` estiverem definidos no repositório; PRs sem secrets **não** falham por ausência deste job. `workflow_dispatch` para execução manual. Opcional: `PLUGNOTAS_API_PATH_PREFIX`. |

**Segurança (NFR-POSQA-01):** não activar logging verboso de corpos de resposta em artefactos públicos; o script trunca e mascara dígitos longos.

**Critérios HTTP esperados pelo script (contrato de smoke):** para o payload **inválido** usado, o integrador deve responder com **4xx** (validação, regra de negócio ou recurso inexistente — ex. 404 empresa). **401/403** indicam problema de credenciais ou permissão (o smoke falha). **5xx** ou falha de rede: falha do smoke (indisponibilidade ou regressão). **2xx** com este payload seria inesperado e o smoke falha de propósito (possível mudança de API).

**Se o smoke falhar sem alteração no repositório:** confirmar secrets e ambiente (sandbox vs produção); repetir mais tarde se **5xx** (indisponibilidade); se o comportamento HTTP do Plugnotas mudar de forma estável, actualizar o script ou o payload de teste em coordenação com DevOps e rever esta secção (feedback QA: risco residual de contrato).

---

## Manutenção (**NFR-POSQA-04**)

| Item | Detalhe |
|------|---------|
| **Owner** | Equipa que mantém `backend/src/services/mei-notas.service.js` e `plugnotas/nfe.service.js` / `nfce.service.js`. |
| **Rever quando** | Alteração de rotas `mei-notas`, paths Plugnotas, ou quebra nos testes `plugnotas-nfe.test.js` / `plugnotas-nfce.test.js` / `mei-notas-core.test.js`. |
| **Próxima revisão sugerida** | Após upgrade de dependência Plugnotas ou mudança de contrato documentado pelo provedor. |

---

## Referências cruzadas

- PRD POSQA: [`docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`](../prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md)  
- Arquitetura emissão NF-e/NFC-e (Guia): [`docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md`](../technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md)  
- Operação geral MEI/NFS-e (env, conectividade): [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)
