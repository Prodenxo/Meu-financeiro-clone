# Story — FR-GUIA-FISC-14 (P2): D2 — Fluxo guiado para activar NF-e / NFC-e no cadastro Plugnotas *(requer go/no-go PO)*

**ID:** STORY-FR-GUIA-FISC-POST-14-D2-HABILITACAO  
**Prioridade:** P2  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** **Go/no-go PO** para incremento **D2** (PRD classifica D2 como *Could* / opcional até aprovação); **ADR** [`ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md`](../adr/ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md) (opção **B** — PATCH existente + `documentosAtivos`); [`story-fr-guia-fisc-post-11-p0-refetch-capacidade-fiscal.md`](./story-fr-guia-fisc-post-11-p0-refetch-capacidade-fiscal.md) (incremento `capabilityRefetchKey` / refetch sem F5); [`story-fr-guia-fisc-p1-capability-callout-plugnotas.md`](./story-fr-guia-fisc-p1-capability-callout-plugnotas.md) *(superfície do callout / CTA — UX §6.1)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-14**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §6  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §5  
**QA (opcional):** `docs/qa/plugnotas-multitipo-checklist.md` — secção D2 adicionada.

## User story

**Como** utilizador MEI bloqueado para **NF-e** ou **NFC-e** no emissor,  
**quero** um **fluxo guiado** que me ajude a concluir requisitos e **solicitar/reflectir** a activação das modalidades no Plugnotas, com feedback claro de sucesso ou insucesso,  
**para** reduzir dependência de suporte manual (**FR-GUIA-FISC-14**).

## Contexto técnico

- Hoje: [`empresa.service.js`](../../backend/src/services/plugnotas/empresa.service.js) pode forçar blocos `nfe`/`nfce` inactivos (`applyEmpresaPlugnotasApenasNfseForPatch`) — **D2** usa **`documentosAtivos`** no PATCH para montagem canónica (`applyEmpresaPlugnotasDocumentSelectionForPatch`) — ver **ADR D2** e [`plugnotas-empresa-documentos-ativos.js`](../../backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js).  
- Após sucesso no cliente: incrementar **`capabilityRefetchKey`** e garantir refetch da capacidade como em [**FR-GUIA-FISC-11**](./story-fr-guia-fisc-post-11-p0-refetch-capacidade-fiscal.md) / UX §3.  
- Segurança: `requireAuth`, `requireMeiEnabled`; validação *strict* do corpo; rotas existentes §10 da arquitetura pós-brainstorm.

## BDD (aceite)

| Cenário | Dado | Quando | Então |
|--------|------|--------|--------|
| Abrir fluxo D2 | Utilizador com **NF-e** ou **NFC-e** seleccionado e sistema a indicar indisponibilidade; **D2** aprovado pelo PO | Clica no CTA do callout (copy alinhada a UX §6.1) | Abre-se *wizard* ou painel **multi-passo** (UX §6.2): intro → checklist → confirmação → resultado. |
| Solicitar activação | Checklist mínima satisfeita ou confirmada conforme PRD | Confirma **«Solicitar activação»** / **«Guardar e activar»** (UX §6.2.3) | Chamada API documentada é efectuada; erros mapeados para mensagens legíveis; **sem** expor PII técnica na UI principal (**NFR-POST-02**). |
| Sucesso | Resposta de sucesso do fluxo D2 | API confirma e cliente conclui o passo resultado | Capacidade fiscal **refetch** sem F5 (incrementar `capabilityRefetchKey` / paridade **POST-11**); callout reflecte novo estado (UX §6.2.4 + §3). |

**Detalhe (insucesso):** mensagem humana + próximo passo (suporte, corrigir campo) conforme UX §6.2.4.

## Âmbito

| Must | Could | Fora |
|------|-------|------|
| *Wizard* ou painel multi-passo (UX §6.2) ligado ao CTA do callout quando D2 estiver **ligado** por decisão PO | *Feature flag* servidor para rota D2 | Fila assíncrona obrigatória ou worker sem ADR (PRD) |
| Rota ou sub-recurso explícito com schema *strict* (architecture §5.2); alteração a `applyEmpresaPlugnotasApenasNfseForPatch` apenas via ADR fechado | Retry leve cliente após PATCH se *staging* mostrar GET *stale* (architecture riscos §12) | Mudar política D1 honesta sem ADR |
| Refetch capacidade pós-sucesso (**POST-11**) | Métricas de abandono do *wizard* | Paridade admin / rotas não autenticadas |

## Definition of Ready

- [x] **Go/no-go PO** para D2 — **Nota de governação (pós-QA):** a flag `VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED` apenas **expõe** o fluxo no cliente; **não substitui** um registo formal de aprovação PO para activar D2 em produção se o processo do projecto exigir acta/email. Equipa de produto deve confirmar rollout.  
- [x] **ADR** — [`ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md`](../adr/ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md).  
- [x] **Opção B** (PATCH + `documentosAtivos`) documentada no ADR D2.  
- [x] **Copy** CTA e passos alinhados a UX §6 (implementação em `MeiFiscalModalidadesActivationWizard` / callout).  
- [x] Paridade **POST-11** / callout **P1** verificada no código.  
- [ ] **Owner QA** — pendente execução manual (tabela abaixo).

## Critérios de aceite

### (a) UX e fluxo guiado

- [x] Com **D2** aprovado e activo (`VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED=true`), o CTA no callout (UX §6.1) abre *wizard* ou painel multi-passo com estrutura mínima: introdução → checklist → confirmação → resultado (UX §6.2).  
- [x] **A11y:** títulos de passo; foco no `h2` ao mudar de passo; checklist com `aria-describedby` em erro de validação.

### (b) Checklist e API

- [x] Checklist mínima (certificado, dados cadastrais, CSC/token NFC-e quando aplicável).  
- [x] Contrato HTTP: **`PATCH /api/mei-notas/setup/emissao-fiscal/empresa`** com `{ payload: { cpfCnpj, documentosAtivos } }` — ver *Completion Notes*; erros Plugnotas mapeados via `formatPlugnotasIntegrationError`.  
- [x] Payload mínimo no cliente (sem dados desnecessários além de CNPJ + `documentosAtivos` derivado do GET).

### (c) Capacidade após sucesso

- [x] Após conclusão **bem-sucedida** do fluxo D2, `invalidateMeiEmpresaGetCache` + `bumpFiscalCapabilityRefetchIfApplicable` (**POST-11**).

### (d) Qualidade e observabilidade

- [x] Testes: `plugnotasEmpresaDocumentosAtivos.test.ts`, `MeiFiscalCapabilityCallout.test.tsx`, **`MeiFiscalModalidadesActivationWizard.test.tsx`** (RTL com mock de `consultarEmpresaEmissaoNf` / `atualizarEmpresaEmissaoNf` — fluxo feliz, erro na consulta, checklist NFC-e); alinhado a `AGENTS.md`.  
- [x] **NFR-POST-02:** mensagens utilizador sem payload técnico bruto.

## Tasks (implementação)

1. [x] Fechar **ADR** + contrato API (opção **B**).  
2. [x] Backend: **sem rota nova** — reutiliza `PATCH …/empresa` existente.  
3. [x] Frontend: *wizard* + CTA no callout; após sucesso refetch capacidade.  
4. [x] Testes + gates `AGENTS.md`.

## QA manual (obrigatório)

| # | Acção | Resultado esperado |
|---|--------|---------------------|
| 1 | **NF-e:** com tipo seleccionado e capacidade indisponível, abrir fluxo D2 pelo CTA | *Wizard* com passos UX §6.2; sem regressão no callout D1. |
| 1b | **NFC-e:** repetir o cenário de **1** (paridade multitipo) | Mesmo padrão de fluxo e feedback que em **1**; sem regressão específica de NFC-e (ex.: CSC/token quando aplicável à checklist). |
| 2 | Completar fluxo até sucesso (mock ou sandbox) | Refetch da capacidade; emissor reflecte estado **sem** F5. |
| 3 | Forçar erro de API (mock) | Mensagem legível; sem dados sensíveis em *toast* / pilha. |
| 4 | Teclado / leitor de ecrã nos passos | Foco e títulos coerentes (UX §6.3). |

**Multitipo:** cruzar com [`docs/qa/plugnotas-multitipo-checklist.md`](../qa/plugnotas-multitipo-checklist.md) ao validar D2 para **NF-e** e **NFC-e** (quando ambos estiverem no âmbito do release).

*Owner QA:* preencher **uma única vez** em **Dev Agent Record → Owner QA** após executar a tabela.

## File list (checklist implementação)

- [x] `backend/src/services/plugnotas/empresa.service.js` *(sem alteração — fluxo `documentosAtivos` já existente)*  
- [x] `backend/src/controllers/mei-notas.controller.js` / `mei-notas.routes.js` *(sem rota nova)*  
- [x] `frontend/src/pages/GuidesMei.tsx` + `frontend/src/components/mei/MeiFiscalModalidadesActivationWizard.tsx`  
- [x] `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx`  
- [x] `frontend/src/config/meiFiscalFeatureFlags.ts`  
- [x] `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts` — `buildDocumentosAtivosSolicitacaoModalidade`  
- [x] `frontend/src/components/mei/MeiFiscalModalidadesActivationWizard.test.tsx`  
- [x] `docs/adr/ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md`  
- [x] *Hooks* `useMeiPlugnotasFiscalCapability` — integração `capabilityRefetchKey`

## Definition of Done

- [x] Critérios de aceite (a)–(d) cumpridos no código e testes automatizados.  
- [ ] QA manual executado; **Owner QA** preenchido.  
- [x] **ADR** referenciado no repositório e nesta story.  
- [x] Gates `AGENTS.md`; **NFR-POST-02** para fluxo D2.

## Refinamento

| Iteração | Data | Mudanças |
|----------|------|----------|
| 1 | 2026-04-16 | Alinhamento padrão epic (POST-11/13): dependências com links (POST-11, P1 callout, ADR, architecture §6.2), BDD, âmbito, DoR, AC (a)–(d), QA manual, NFR, refinamento PO 7→meta *Ready*. |
| 2 | 2026-04-16 | Feedback PO 9,5/10: QA manual com **1b** NFC-e (paridade multitipo); nota **Multitipo** com link ao checklist `plugnotas-multitipo-checklist.md`. |
| 3 | 2026-04-16 | Implementação D2: ADR opção B, *wizard*, flag `VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED`, refetch POST-11. |
| 4 | 2026-04-16 | Pós-QA: nota governação PO vs flag; RTL `MeiFiscalModalidadesActivationWizard.test.tsx`; Owner QA estruturado. |

## Dev Agent Record

### Agent Model Used

Composer / Dex

### Debug Log References

### Completion Notes List

- **ADR:** [`docs/adr/ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md`](../adr/ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md) — opção **B** (sem rota nova).  
- **API:** `PATCH /api/mei-notas/setup/emissao-fiscal/empresa` com `body.payload = { cpfCnpj: "<14 dígitos>", documentosAtivos: { nfse, nfe, nfce } }`. O cliente envia via `atualizarEmpresaEmissaoNf` em `meiNotasService.ts`.  
- **Derivação `documentosAtivos`:** `GET` empresa → `buildDocumentosAtivosSolicitacaoModalidade(consulta, 'NFE' | 'NFCE')` em `plugnotasEmpresaDocumentosAtivos.ts`.  
- **Flag:** `VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED=true` liga CTA **Configurar emissão de [NF-e|NFC-e]** no callout (modo **blocked**). Omissão/`false` = comportamento anterior (sem CTA D2).  
- **Refetch:** `invalidateMeiEmpresaGetCache(userId, cnpj)` + `bumpFiscalCapabilityRefetchIfApplicable()` após PATCH bem-sucedido.  
- **Testes *wizard* (RTL):** `MeiFiscalModalidadesActivationWizard.test.tsx` — cobre checklist (erro `role=alert`), fluxo NFE (GET→PATCH→`onSuccess`), falha no GET sem PATCH, NFC-e com terceiro checkbox. **UX §6.3** (teclado / leitor de ecrã em todos os passos) permanece validação **manual** recomendada na tabela QA.

### File List (final)

- `frontend/src/components/mei/MeiFiscalModalidadesActivationWizard.tsx`  
- `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx`  
- `frontend/src/config/meiFiscalFeatureFlags.ts`  
- `frontend/src/pages/GuidesMei.tsx`  
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts`  
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.test.ts`  
- `frontend/src/components/mei/MeiFiscalCapabilityCallout.test.tsx`  
- `frontend/src/components/mei/MeiFiscalModalidadesActivationWizard.test.tsx`  
- `frontend/.env.example`  
- `frontend/src/vite-env.d.ts`  
- `docs/adr/ADR-d2-habilitacao-modalidades-plugnotas-guia-mei.md`  
- `docs/qa/plugnotas-multitipo-checklist.md`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1 | D2: wizard, CTA callout, flag VITE, ADR opção B, testes | Dex |
| 2026-04-16 | 2 | Pós-QA: RTL wizard, doc governação PO, nota UX §6.3 manual | Dex |

### Status

Implementado (código + testes). **QA manual** e **Owner QA** pendentes.

### Owner QA

| Campo | Valor |
|--------|--------|
| **Estado** | Pendente — preencher após execução manual da tabela **QA manual** (incl. **4** UX §6.3). |
| **Nome** | *(a preencher)* |
| **Data** | *(AAAA-MM-DD)* |
| **Ambiente** | *(ex.: local / staging)* |
| **Flag D2** | `VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED=true` confirmado para o teste |
| **Notas** | *(opcional — NF-e / NFC-e, bloqueios, evidências)* |
