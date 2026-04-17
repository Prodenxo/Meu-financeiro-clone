# Story — FR-GUIA-FISC-11 (P0): Refetch da capacidade fiscal após cadastro (Guia MEI)

**ID:** STORY-FR-GUIA-FISC-POST-11-REFETCH-CAPACIDADE  
**Prioridade:** P0  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** — *(baseline Guia MEI com `useMeiPlugnotasFiscalCapability` já integrado)*  
**Bloqueia:** UX honesta pós-save sem F5 para **FR-GUIA-FISC-07** / D1  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-11**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §3  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §2  
**QA (referência):** `docs/qa/plugnotas-multitipo-checklist.md` — actualizar quando este incremento fechar, se aplicável.  
**Refinamento:** PO + SM — âmbito Must/Could, casos limite, QA manual, NFR clarificado; **iteração 2** — BDD, DoR, critério mensurável, §12 (riscos); **iteração 3** — fusão AC redundantes, campo owner QA; **iteração 4** — (a)/(b) no primeiro Must para legibilidade (feedback PO 9,5→10 doc).

## User story

**Como** utilizador MEI no Guia MEI,  
**quero** que o aviso de capacidade **NF-e** / **NFC-e** se **actualize automaticamente** depois de guardar dados de empresa no fluxo fiscal,  
**para** não precisar de recarregar a página para ver se a emissão ficou disponível (**FR-GUIA-FISC-11**).

## Cenário principal (BDD)

| | |
|--|--|
| **Dado** | O utilizador está no Guia MEI com tipo **NF-e** ou **NFC-e**, CNPJ emitente com 14 dígitos, e o painel de capacidade já efectuou (ou vai efectuar) a primeira leitura. |
| **Quando** | O utilizador **guarda com sucesso** os dados de empresa no emissor (fluxo Must desta story). |
| **Então** | É efectuada **pelo menos uma** nova chamada a `consultarEmpresaEmissaoNf` após esse sucesso, e o callout reflecte loading → resultado (ou erro com **Tentar de novo**) **sem** recarregar a página. |

## Âmbito

| Classificação | Conteúdo |
|---------------|----------|
| **Must (v1 desta story)** | Após **sucesso** ao **guardar / actualizar dados da empresa** no emissor (fluxo existente no Guia MEI que persiste empresa Plugnotas), incrementar o *refetch* da capacidade fiscal quando o tipo de emissão seleccionado for **NF-e** ou **NFC-e** e o CNPJ emitente tiver 14 dígitos. |
| **Could / follow-up** | Disparar o mesmo *refetch* após **upload/conclusão de certificado A1** noutro bloco do Guia MEI — **só** se couber na mesma sprint; caso contrário, registar *follow-up* no backlog (**story filha** com ID próprio referenciando `STORY-FR-GUIA-FISC-POST-11-REFETCH-CAPACIDADE`). |
| **Fora de âmbito** | Novo endpoint backend; alteração da política **D1**; fila assíncrona. |

## Definition of Ready (checklist PO/SM)

*(Marcar no arranque do sprint ou no *refinement* imediatamente antes do commit da equipa.)*

- [ ] PRD/UX/arquitetura referenciados e estáveis para este *increment*.  
- [ ] Âmbito **Must** fechado (empresa apenas na v1).  
- [ ] Não há dependência de **D2** nem de novo PATCH de modalidades.  
- [ ] Equipa sabe onde fica o save de empresa em `GuidesMei.tsx` (*refinement* técnico de 15 min se necessário).  
- [ ] **Owner QA** atribuído (ver secção *QA manual* abaixo) ou delegação explícita com data.  

## Contexto técnico

- Hook actual: `frontend/src/hooks/useMeiPlugnotasFiscalCapability.ts` — dependências `cnpjDigits`, `emissionDocumentType`, `fetchEnabled`.  
- **Direcção arquitectural:** parâmetro **`capabilityRefetchKey`** (ou equivalente) incrementado pelo pai quando a mutação **Must** termina com sucesso (`architecture…§2.2 opção A`).  
- API: `consultarEmpresaEmissaoNf` / `GET …/mei-notas/setup/emissao-fiscal/empresa` — **sem** novo endpoint obrigatório.  
- UI: `MeiFiscalCapabilityCallout` + `GuidesMei.tsx` — ligar *handlers* `onSuccess` (ou equivalente) **nos pontos de save de empresa** identificados no ficheiro.

## Critérios de aceite

### Funcional (Must)

- [x] **Refetch + prova automática (mesmo requisito — duas facetas verificáveis):**  
  - **(a) Comportamento (runtime):** após **guardar com sucesso** os dados de empresa no fluxo **Must**, com tipo **NF-e** ou **NFC-e** e CNPJ com 14 dígitos, o hook **reexecuta** `consultarEmpresaEmissaoNf`.  
  - **(b) Prova automática (teste):** com mock ou *spy*, após simular **um** save bem-sucedido nas mesmas condições, verifica-se **pelo menos uma** invocação **adicional** a `consultarEmpresaEmissaoNf` face ao período imediatamente anterior ao save.  
- [x] Estados **loading** / **erro** / **retry** conforme UX spec §3 (`aria-busy` no contentor adequado, mensagem *"A verificar…"*, botão **Tentar de novo** em falha de rede — localização alinhada ao callout ou região definida na implementação, sem contradizer a spec).  
- [x] **Sem** regressão: comportamento para **NFS-e** inalterado; para **NF-e/NFC-e**, não dispara consulta redundante quando `fetchEnabled` é falso ou CNPJ incompleto (regras actuais do hook mantidas).

### Casos limite

- [x] **Troca de tipo durante o fetch:** se o utilizador alterar o tipo de documento (ex.: NF-e → NFS-e ou NF-e → NFC-e) enquanto a consulta está em curso, o estado final do callout corresponde ao tipo **actual** e **não** aplica resultado de um pedido cancelado (validar `cleanup` / *cancelled* no `useEffect` do hook).  
- [x] **Múltiplos saves em sequência:** vários incrementos consecutivos do `capabilityRefetchKey` não produzem UI incoerente (ex.: resultado antigo a sobrepor um mais recente); último resultado válido prevalece.  
- [ ] *(Opcional — só se observado em *staging*)* Se o primeiro `GET` empresa vier **desactualizado** imediatamente após `PATCH`, um **segundo** pedido controlado (retry único ou *delay* breve) pode ser aplicado conforme mitigação em `architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` **§12** (*Riscos técnicos — GET empresa stale*) — documentar na *Completion Notes* se implementado.

### Testes automáticos

- [x] Teste unitário do hook com **mock** de `consultarEmpresaEmissaoNf`: incremento da chave dispara **nova** chamada; primeira resposta cancelada não corrompe estado.  
- [x] Teste RTL **mínimo** (opcional mas recomendado): simula save de empresa → incremento da chave → segunda chamada visível no mock.

### QA manual (checklist)

**Owner QA (sprint):** *(a preencher em planning — nome ou equipa)*  

1. Guia MEI → tipo **NF-e** ou **NFC-e** → CNPJ válido → confirmar callout ou estado de capacidade.  
2. Abrir fluxo de **dados de empresa** → **guardar com sucesso** (dados válidos).  
3. **Sem F5:** verificar que o callout / capacidade **actualiza** (loading → resultado) ou mensagem de erro com **Tentar de novo** em falha simulada.  
4. Repetir com **NFS-e** seleccionado: **sem** regressão visual nem chamadas desnecessárias à consulta NFE/NFC-e.  
5. Registar evidência no *Dev Agent Record* ou comentário de QA (data, ambiente).  
6. *(Opcional)* Rever `docs/qa/plugnotas-multitipo-checklist.md` e marcar itens afectados por este incremento.

## Tasks (implementação)

1. [x] Adicionar `capabilityRefetchKey` (ou nome fechado) ao hook e ao `useEffect`.  
2. [x] Em `GuidesMei.tsx`, incrementar a chave no(s) *callback(s)* de **sucesso** após save de **empresa** (identificar pontos exactos no ficheiro).  
3. [ ] (Opcional na mesma PR) ligar certificado — senão, criar *follow-up* no *Completion Notes* com sugestão de ID de story filha.  
4. [x] Ajustar `MeiFiscalCapabilityCallout` se necessário para estados de loading da spec.  
5. [x] Testes + gates `AGENTS.md`.

## File list (checklist implementação)

- [x] `frontend/src/hooks/useMeiPlugnotasFiscalCapability.ts`  
- [x] `frontend/src/pages/GuidesMei.tsx`  
- [x] `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx` *(se aplicável)*  
- [x] Testes associados (`*.test.ts` / `*.test.tsx`)  
- [x] `docs/qa/plugnotas-multitipo-checklist.md` *(secção Guia MEI — capacidade NF-e / NFC-e)*

## Definition of Done

- Todos os critérios de aceite **Must** e **Casos limite** verificados (opcional documentado se não aplicável).  
- QA manual executado ou explicitamente delegado com data.  
- `npm run lint`, `npm run typecheck`, `npm test` (`AGENTS.md`).  
- **NFR-POST-02:** esta story é sobretudo **frontend** — não introduzir `console.log` de resposta completa da API nem PII; se tocar em **backend**, manter alinhamento a **NFR-POST-02** (sem payload completo em log `info`).

## Dev Agent Record

### Status

Implementado (frontend)

### Owner QA

*(opcional — duplicar de *QA manual* quando fechado)*  

- **Delegação (DoD):** execução do § *QA manual* acima obrigatória **antes de homologação**; responsável a atribuir no *planning* (equipa QA/produto ou owner do release).
- Nome / data execução manual / ambiente: *(preencher na execução — evidência: nota ou anexo no PR)*

### Completion Notes List

- `capabilityRefetchKey` no hook + `bumpFiscalCapabilityRefetchIfApplicable` no `GuidesMei` (só com NF-e/NFC-e, CNPJ 14 dígitos e `fetchEnabled` como antes).
- Incremento após sucesso em `finalizePlugnotasEmpresaCadastroSuccess` (upload cert + cadastro empresa e retry municipal) e após `atualizarEmpresaEmissaoNf` em `handleAtualizarCadastroSemNovoCertificado`.
- Callout: `aria-busy` em loading; modo `fetch_error` com **Tentar de novo** (`onTentarNovamente`) para novo GET sem F5.
- **Follow-up (Could):** refetch após upload/conclusão de certificado A1 — não incluído nesta PR; sugerir story filha referenciando `STORY-FR-GUIA-FISC-POST-11-REFETCH-CAPACIDADE`.
- **§12 arquitectura (GET empresa stale):** não foi necessário segundo GET com *delay* neste incremento; monitorizar em *staging* se o primeiro GET após PATCH vier desactualizado.
- **Correcções pós-revisão QA:** `docs/qa/plugnotas-multitipo-checklist.md` com secção FR-GUIA-FISC-11; teste RTL `useMeiPlugnotasFiscalCapability.rtl.test.tsx` (save simulado → 2.ª chamada); testes `MeiFiscalCapabilityCallout.test.tsx` (`aria-busy`, «Tentar de novo»); teste unitário de sequência de *bumps* (último resultado prevalece).

### File List (final)

- `frontend/src/hooks/useMeiPlugnotasFiscalCapability.ts`
- `frontend/src/hooks/useMeiPlugnotasFiscalCapability.test.ts`
- `frontend/src/hooks/useMeiPlugnotasFiscalCapability.rtl.test.tsx`
- `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx`
- `frontend/src/components/mei/MeiFiscalCapabilityCallout.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `docs/qa/plugnotas-multitipo-checklist.md`
