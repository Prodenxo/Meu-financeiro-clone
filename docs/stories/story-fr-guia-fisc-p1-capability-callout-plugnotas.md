# Story — FR-GUIA-FISC (P1): Guia MEI — *callout* quando NF-e/NFC-e indisponíveis no Plugnotas

**ID:** STORY-FR-GUIA-FISC-P1-CAPABILITY-CALLOUT  
**Prioridade:** P1  
**Depende de:** [story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md)  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-mei-emissao-nfe-nfce-plugnotas-guia-2026-04-06.md` (**FR-GUIA-FISC-07**, §6.2 opção C recomendada primeiro)  
**Arquitetura:** `docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md` §6.2–§6.3  
**UX:** `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` §9

## User story

**Como** MEI que seleccionou **NF-e** ou **NFC-e**,  
**quero** ver claramente quando o emissor **não** está configurado para esse tipo e o que fazer a seguir,  
**para** não submeter emissão que falhará sem explicação (**FR-GUIA-FISC-07**).

## Decisão de produto (fixar na implementação)

- **Opção adoptada nesta story:** **C** (arquitetura §6.2) — **sem** alterar `applyEmpresaPlugnotasApenasNfseForPatch` / POST até PO aprovar **A** ou **B**.  
- A UI **consulta** o cadastro via fluxo existente e mostra *callout* + formulário **desactivado** ou orientação para suporte/certificado.

## Contexto técnico

- **API:** `GET /mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=...` → `consultarEmpresaEmissaoNf` no frontend.  
- **Parsing:** extrair de `raw` (ou estrutura estável devolvida pelo backend) indicadores `nfe.ativo`, `nfce.ativo` — **validar JSON real em staging** e encapsular em util `parsePlugnotasEmpresaCapabilities` (arquitetura §6.3).  
- Se a forma do payload variar, documentar caminho exacto no Completion Notes.

## Critérios de aceite

- [ ] Ao seleccionar **NF-e**, se a capacidade NFE não estiver disponível no emissor, mostrar **callout** (UX §9.2) e **não** permitir *submit* até critério PO adicional (ex.: apenas *disabled* com mensagem).  
- [ ] Idem para **NFC-e** / capacidade NFCe.  
- [ ] Se capacidade **estiver** disponível, formulário comporta-se como na story P0 (sem bloqueio falso-positivo).  
- [ ] Tratar carregamento e erro de consulta (mensagem amigável, sem expor PII técnica — **NFR-GUIA-FISC-06**).  
- [ ] *Copy* utilizador: preferir “emissor fiscal integrado” vs expor “Plugnotas” na mensagem principal (UX §9.3).

## Tasks (implementação)

1. [x] Spike curto: documentar estrutura de `consultarEmpresaEmissaoNf` para CNPJ de teste.  
2. [x] Implementar util/hook `useMeiPlugnotasFiscalCapability` (nome sugerido na arquitetura §7).  
3. [x] Integrar *callout* e estado *disabled* do formulário NFE/NFC-e.  
4. [x] Testes unitários do *parser* com fixtures baseadas no JSON real (mínimo).

## Fora de escopo

- Novo endpoint backend (a menos que consulta actual seja insuficiente — nesse caso spike e story separada).  
- PATCH empresa com NFE/NFC-e activos (**A/B**) — ADR + story dedicada.

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx` ou componentes MEI extraídos  
- [x] `frontend/src/utils/plugnotasEmpresaCapabilities.ts` (ou caminho acordado)  
- [x] Testes em `frontend/src/utils/*.test.ts`

## Definition of Done

- Critérios de aceite verificados com conta *staging* ou mock de resposta.  
- Gates `AGENTS.md`.

## Qualidade / CodeRabbit

- Não assumir campos `ativo` sem confirmar contra resposta real; tratar ausência de chaves como “indisponível” só se PO concordar.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- **Seguimento QA (2026-04-06):** DoD — `npm test` na raiz reexecutado com sucesso após correções. Observação QA §2: testes de integração em `GuidesMei.permissions.test.tsx` para (a) **NFC-e inactiva + NF-e activa** — *callout* “Emissão de NFC-e não disponível”, botão desactivado, `emitirNfce` não chamado; (b) **mesmo mock com NF-e seleccionada** — sem *callout* `blocked`, submit chama `emitirNfe`. Smoke staging e CodeRabbit permanecem recomendações operacionais (fora do diff).
- **Contrato API (após `apiClient.get`):** o corpo útil é o retorno de `consultarEmpresaPlugNotas` no backend (Plugnotas). Forma frequente: `{ message: string, data: { cpfCnpj?, razaoSocial?, nfe?: { ativo: boolean }, nfce?: { ativo: boolean }, nfse?: … } }`. O parser usa `response.data` quando é objecto; caso contrário assume a raiz como corpo da empresa.
- **Heurística:** `ativo === true` → modalidade disponível; `ativo === false` com bloco presente → **bloqueio** NF-e ou NFC-e; bloco ausente ou `ativo` não booleano → `unknown` (**sem** bloqueio, para evitar falso-positivo — alinhado à nota de qualidade da story).
- **UI:** `MeiFiscalCapabilityCallout` (UX §9.2/§9.3 — “emissor fiscal integrado”); `MeiNfeLikeEmitForm` com `fieldset disabled` por secção + textarea; botão Emitir desactivado; `handleEmitNfeLike` retorna cedo se bloqueado; CTA “Rever configuração” → tab `das`.
- **CNPJ da consulta:** preferência `nfeLikeForm.emitenteCnpj` (14 dígitos), senão CNPJ do MEI / prestador NFS-e (`cnpjParaFiscalCapability`).
- **Exemplo JSON anonimizado (fixture de teste):** `{ "message": "OK", "data": { "cpfCnpj": "17422651000172", "razaoSocial": "Empresa Exemplo", "nfe": { "ativo": false, "tipoContrato": 0 }, "nfce": { "ativo": false, "tipoContrato": 0 }, "nfse": { "ativo": true } } }`.

### File List (final)

- `frontend/src/utils/plugnotasEmpresaCapabilities.ts`
- `frontend/src/utils/plugnotasEmpresaCapabilities.test.ts`
- `frontend/src/hooks/useMeiPlugnotasFiscalCapability.ts`
- `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx`
- `frontend/src/components/mei/MeiNfeLikeEmitForm.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.permissions.test.tsx`

---

## QA Results

### Revisão QA — 2026-04-06 (Quinn)

**Decisão de gate:** **PASS com observações**

#### Rastreio — critérios de aceite (story)

| Critério | Veredicto | Evidência / notas |
|----------|-----------|-------------------|
| NF-e indisponível → *callout* UX §9.2 + sem *submit* | **Satisfeito** | `MeiFiscalCapabilityCallout` modo `blocked`; `nfeLikeEmissionLocked` desactiva `MeiNfeLikeEmitForm` (`fieldset` + textarea), botão Emitir e `handleEmitNfeLike` retorna cedo. Teste `FR-GUIA-FISC-07` em `GuidesMei.permissions.test.tsx` com `consultarEmpresaEmissaoNf` mock `nfe.ativo: false`. |
| NFC-e / capacidade NFCe idem | **Satisfeito (código + parser)** | `isNfeLikeEmissionBlockedByCapabilities('NFCE', caps)` espelha NFE; fixtures em `plugnotasEmpresaCapabilities.test.ts` cobrem `nfce` inactivo/activo. **Sem** teste de integração UI dedicado só para NFC-e (paridade lógica com NFE). |
| Capacidade disponível → sem bloqueio falso-positivo | **Satisfeito** | `readModalityState`: só `inactive` com bloco presente e `ativo === false`; `unknown` não bloqueia. Caso `nfe` activo + `nfce` inactivo: NF-e não bloqueia por NFC-e (e vice-versa). |
| Carregamento e erro de consulta | **Satisfeito** | Modos `loading` e `fetch_error` no *callout*; erros via `formatPlugnotasIntegrationError` + código fiscal (`useMeiPlugnotasFiscalCapability`). *Fallback* de copy amigável sem marca do provedor na mensagem principal. |
| Copy “emissor fiscal integrado” (UX §9.3) | **Satisfeito** | Textos principais do *callout* e do *spinner* usam “emissor fiscal integrado”; checklist menciona SEFAZ/CSC de forma utilizador-centrada. |

#### Testes automáticos (executados nesta revisão)

- `npx vitest run` com filtro sobre `plugnotasEmpresaCapabilities.test.ts` e caso `FR-GUIA-FISC-07` em `GuidesMei.permissions.test.tsx`: **OK**.
- **Não** foi reexecutada a suíte completa `npm test` nesta sessão de QA; alinhar com DoD / `AGENTS.md` no pipeline ou antes de merge.

#### Observações (não bloqueantes)

1. **Smoke staging:** DoD pede verificação com conta staging ou mock; mocks e parser estão sólidos — recomenda-se **um** passe manual (ou staging) com empresa real **NFE/NFC-e activos** e **inactivos** para fechar risco de formato JSON divergente do fixture.
2. **Teste UI NFC-e:** Opcional: caso `emitirNfce` não chamado quando só `nfce.inactive` e `nfe.active` (cenário assimétrico), para travar regressão de tipo errado no *gate*.
3. **NFR-GUIA-FISC-06:** Mensagem de erro vem da cadeia fiscal existente; se em algum erro bruto a API devolver identificadores sensíveis, o *sanitizer* já partilhado com resto do Guia MEI aplica-se — sem achado específico nesta revisão estática.
4. **CodeRabbit:** não executado nesta revisão QA.

#### Critérios de aceite no corpo da story

- As checkboxes em **Critérios de aceite** permanecem por marcar no fluxo PO/QA do repositório; esta revisão **não** as altera.

— Quinn, guardião da qualidade 🛡️
