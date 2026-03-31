# Story — FR-AP-03: Regressão e testes do autopreenchimento do prestador (NFS-e)

**ID:** STORY-FR-AP-03  
**Prioridade:** P1  
**Depende de:** [story-fr-ap-02-frontend-autopreenchimento-prestador-nfse.md](./story-fr-ap-02-frontend-autopreenchimento-prestador-nfse.md)  
**Fonte:** `docs/prd/PRD-autopreenchimento-prestador-user-mei-certificates-2026-03-31.md` (NFR-AP-03, NFR-AP-04, critérios §9)

## User story

**Como** equipa de qualidade,  
**quero** validar de ponta a ponta os cenários com e sem `nfseEmitente` no fluxo NFS-e,  
**para** garantir que o autopreenchimento melhora a UX sem regressões na emissão.

## Contexto técnico

- Cobrir cenários principais:
  1) com snapshot válido (hidrata automaticamente);
  2) sem snapshot (fallback manual);
  3) edição manual após hidratação;
  4) emissão usa valores finais do formulário.
- Validar que o comportamento não quebra fluxo de utilizadores sem cadastro prévio.

## Critérios de aceite

- [ ] Testes automatizados frontend cobrem cenário com `nfseEmitente` e sem `nfseEmitente`.
- [ ] Existe caso de teste garantindo que edição manual pós-hidratação não é perdida.
- [ ] Existe caso de teste garantindo que payload de emissão reflete valores atuais do formulário.
- [ ] Checklist manual QA documentado no `Dev Agent Record` (ou `QA Results`) com evidência de execução.
- [ ] Gates de qualidade passam (`lint`, `typecheck`, `test`) nos módulos alterados.

## Fora de escopo

- Criação de nova infraestrutura de testes E2E fora do stack atual do projeto.  
- Mudanças de produto adicionais além da cobertura e regressão desta feature.

## File list (checklist implementação)

- [ ] `frontend/src/pages/GuidesMei*.test.tsx` (novo ou extensão)
- [ ] `frontend/src/services/*.test.ts` (se necessário para contrato/payload)
- [ ] (Opcional) `docs/qa/` para checklist manual desta feature

## Definition of Done

- `cd frontend && npm run lint`  
- `cd frontend && npm run typecheck`  
- `cd frontend && npm test`

## Qualidade / CodeRabbit

- Priorizar cobertura de regressão nos pontos onde há hidratação inicial + edição local para evitar bugs intermitentes.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- **`GuidesMei.nfse-emitente-regression.test.tsx` (FR-AP-03):** (1) sem `nfseEmitente` + sem `documento` — prestador vazio, painel monta; (2) com snapshot — alteração manual da razão do prestador mantém-se após tick; (3) `emitirNfse` recebe payload com `prestadorRazaoSocial` / CNPJ / tomador / serviço alinhados ao formulário após edição pós-hidratação.
- **Cobertura cruzada:** `nfseEmitenteHydration.test.ts` (merge, segundo merge, replace), `GuidesMei.nfse-emitente-hydration.test.tsx` (hidratação com snapshot).
- **Checklist manual QA** (marcar `[x]` só após execução real em staging/local — **não** substituir por suíte automatizada; ver concerns QA):  
  - [ ] Com certificado + emitente persistido: separador NFS-e mostra prestador preenchido.  
  - [ ] Utilizador novo / sem linha emitente: prestador editável, sem crash.  
  - [ ] Após alterar razão do prestador e preencher tomador/serviço, emitir (sandbox) reflete valores visíveis.  
  - [ ] Após «Atualizar cadastro (sem novo certificado)», aviso + «Aplicar dados guardados…» atualiza o formulário NFS-e só ao clicar.  
- **Pós-QA:** emissão no teste de regressão usa **`fireEvent.click`** no botão Emitir (paridade com utilizador vs `MouseEvent` cru). Âmbito **jsdom + mocks** permanece conforme story (fora de escopo E2E novo); evolução futura: testes contra API real opcional.

### File List (implementação)

- `frontend/src/pages/GuidesMei.nfse-emitente-regression.test.tsx`

### Debug Log References

- `cd frontend && npm run lint` — OK, 0 erros (avisos pré-existentes no repo); pós-QA FR-AP-03  
- `cd frontend && npm run typecheck` — OK (pós-QA)  
- `cd frontend && npm test` — **215 pass** (35 ficheiros), incl. regressão FR-AP-03

### Change Log

| Data | Nota |
|------|------|
| 2026-03-31 | Story criada pelo SM (River) a partir do PRD de autopreenchimento do prestador. |
| 2026-03-31 | Testes regressão FR-AP-03 (`GuidesMei.nfse-emitente-regression.test.tsx`); checklist manual no Dev Agent Record; Ready for Review. |
| 2026-03-31 | Pós-QA: `fireEvent.click` no emitir; nota checklist só com evidência humana; lint/typecheck/test revalidados. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-31  
**Decisão de gate:** **PASS** com **CONCERNS** (baixa severidade)

### Evidência executada

- `cd frontend && npm test` — **215 testes pass** (35 ficheiros), incluindo `GuidesMei.nfse-emitente-regression.test.tsx` (3 cenários).

### Rastreio — critérios de aceite

| Critério | Verificação |
|----------|-------------|
| Testes com e sem `nfseEmitente` | **OK** — `sem nfseEmitente, prestador permanece vazio…`; cenários com snapshot em `com nfseEmitente, edição manual…` e `emitir NFS-e envia payload…`. Hidratação inicial com snapshot continua coberta por `GuidesMei.nfse-emitente-hydration.test.tsx` + utilitário `nfseEmitenteHydration.test.ts`. |
| Edição manual pós-hidratação não perdida | **OK** — teste de UI altera razão do prestador e assegura valor após `act`/tick. |
| Payload de emissão = valores atuais do formulário | **OK** — `emitirNfse` mock verificado: `prestadorRazaoSocial` editada, CNPJ prestador, tomador, `servico` alinhados ao preenchimento. |
| Checklist manual + evidência | **Parcial** — checklist documentado no **Dev Agent Record** com itens ainda `[ ]` (execução humana pendente). Evidência automatizada: suíte frontend acima. |
| Gates lint / typecheck / test | **OK test** (reexecução QA). **Lint/typecheck** não re-corridos nesta sessão; alinhado com registo do Dev (`lint` OK com avisos pré-existentes, `typecheck` OK). |

### Given–When–Then (cenários principais)

1. **Sem snapshot** — *Dado* status sem `nfseEmitente` e sem `documento`; *Quando* abre separador NFS-e; *Então* CNPJ/razão prestador vazios, sem erro de montagem.  
2. **Com snapshot + edição** — *Dado* snapshot completo; *Quando* altera razão; *Então* valor mantém-se na UI.  
3. **Emissão** — *Dado* formulário preenchido após edição do prestador; *Quando* emite; *Então* argumento de `emitirNfse` reflete texto e documentos esperados.

### Concerns (não bloqueantes)

1. **Manual QA:** quatro linhas do checklist no Dev Agent Record **não** estão marcadas como executadas — recomendável correr em ambiente real (MEI + sandbox fiscal) antes de declarar feature “validada em produção”.  
2. **Âmbito dos testes:** regressão é **integração jsdom** com mocks de API; não substitui prova contra backend/Plugnotas real (explícito na story / fora de escopo E2E novo).  
3. **Clique em emitir:** uso de `MouseEvent` em vez de `userEvent.click` — aceitável no stack atual; se o botão passar a depender de mais lógica em `onClick`, preferir `fireEvent.click`/`userEvent` para paridade com utilizador.

### Resumo

Cobertura automatizada **adequada ao P1** da story; rastreio aos quatro cenários de contexto técnico **satisfeito** via combinação FR-AP-03 + FR-AP-02. **PASS** com registo de checklist manual e limites de jsdom/mock.

— Quinn, guardião da qualidade 🛡️
