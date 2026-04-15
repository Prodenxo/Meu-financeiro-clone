# Story — FR-CONS (P1): `operacao-mei-nfse` — mapa da **tríade** de erros na consola (suporte + paridade PRD)

**ID:** STORY-FR-CONS-P1-OPERACAO-TRIADE  
**Prioridade:** P1  
**Depende de:** — (pode ser feita em paralelo à P0)  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — **FR-CONS-MAP-01**, **FR-CONS-EVID-01** (rastreio em doc)  
**UX:** [`docs/specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../specs/ux-spec-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — secção 2 (mapa de specs), princípio “consola ≠ UI”  
**Arquitetura:** [`docs/technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — §1.1 tabela integrações, diagrama sequência  
**Brief:** [`docs/brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md`](../brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev ou @pm *(conteúdo técnico leve — preferir @dev com revisão @pm)* |
| **quality_gate** | @qa *(revisão de conteúdo)* |
| **quality_gate_tools** | N/A código; opcional `npm run validate:structure` se o repo validar docs |
| **revisão** | Operação / suporte interno — leitura rápida da secção nova |

---

## User story

**Como** membro de suporte ou desenvolvedor a diagnosticar incidentes,  
**quero** um único sítio no runbook que explique a **tríade** de erros (GET empresa 404, POST empresa 400, POST validate Serpro) com causa provável e ordem de verificação,  
**para** orientar utilizadores sem confundir Plugnotas com Receita Federal e sem tratar o 404 como bug isolado.

---

## Contexto

- **FR-CONS-MAP-01** exige documentação mínima em `docs/operacao-mei-nfse.md` (ou equivalente aprovado pelo PO).  
- Incluir: tabela ou lista **endpoint × sintoma × causa provável × próximo passo**; ligação ao brief e ao PRD CONS; ligação às specs **SOL**, **PREF**, **UX CONS** para copy detalhada.  
- Não duplicar páginas inteiras de outras specs — **ponteiro + resumo operacional**.  
- Após **story-fr-cons-p0** (503 + `errors.code`), actualizar a linha do validate para mencionar **503** e `MEI_GUIDE_SERPRO_UNAVAILABLE` quando aplicável.

---

## Critérios de aceite

- [ ] `docs/operacao-mei-nfse.md` contém secção dedicada (título sugerido: *Triagem: erros na consola do browser (Guia MEI)* ou equivalente) com:  
  - [ ] Explicação de que **404 GET empresa** após **POST** falho é **esperado** até cadastro bem-sucedido.  
  - [ ] Referência ao erro **400** `nfse.config.prefeitura` com link ao PRD PREF / operação existente.  
  - [ ] Referência ao **validate** / Serpro: indisponibilidade vs cadastro Plugnotas; após P0, HTTP **503** e código estável.  
- [ ] Links para: PRD CONS, brief consola, spec UX CONS, architecture CONS.  
- [ ] Revisão informal por alguém de operação (registar “OK” na story ou comentário MR).  
- [ ] **FR-CONS-EVID-01:** story de implementação P0/P1 CONS referenciam esta secção no checklist.

---

## Tasks (indicativas)

1. [x] Redigir secção no runbook (PT-BR, sem PII de exemplo).  
2. [x] Inserir diagrama mermaid **opcional** (copiar/adaptar do brief ou arquitetura).  
3. [x] Após merge da P0 Serpro, segundo passo: ajustar parágrafo validate para **503**/`errors.code`.  
4. [x] **Dev Agent Record** / notas se quem implementar for @pm.

---

## File list (indicativo)

- [x] `docs/operacao-mei-nfse.md`  
- [x] *(opcional)* `docs/brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md` — link bidireccional de uma linha no change log  

---

## CodeRabbit Integration

- N/A (markdown). Revisão humana: links quebrados e termos consistentes (Plugnotas, Serpro, BFF).

---

## Dev Agent Record

*(preencher por executor)*

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md` — nova secção [Triagem: erros na consola do browser](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei) (`#triagem-erros-consola-guia-mei`): tabela tríade CONS-A/B/C, ordem de verificação, mermaid, ponteiros PRD/brief/UX/architecture/SOL; **FR-CONS-EVID-01**; ponteiro adicional em [POST→GET 404](../operacao-mei-nfse.md#cadastro-post-404-get-empresa).
- `docs/brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md` — link ao runbook; **Change log**; alinhamento pós-QA (503 Serpro, mermaid, §3/§5).
- `docs/stories/story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md` — nota **FR-CONS-EVID-01** com URL explícita do runbook.
- `docs/stories/story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md` — idem **FR-CONS-EVID-01**.

### Notes

- **FR-CONS-MAP-01:** runbook único para GET 404 pós-POST, **400** `nfse.config.prefeitura` (ligação PRD PREF + âncora PREF no doc), validate/Serpro com **503** + `MEI_GUIDE_SERPRO_UNAVAILABLE` e nota para legado **400**.
- **FR-CONS-EVID-01:** P0 e P1 Guia MEI referenciam `docs/operacao-mei-nfse.md#triagem-erros-consola-guia-mei` no Dev Record.
- **Follow-up QA (obs. Quinn 2026-04-08):** brief `brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md` — §1 tabela, mermaid §2, §3 ponto 4 e §5 alinhados ao contrato **503** + código estável; linha explícita para sintoma legado **400**.
- **Revisão operação (informal):** usar subsecção **Revisão operações** abaixo ou comentário no MR; a secção **QA Results** pode duplicar a mesma linha quando ops preferir assinar aí *(permissões @qa)*.
- `npm run validate:structure` — executado na raiz após alterações.

### Revisão operações (informal)

*(Critério de aceite — preencher por suporte/ops após leitura da [triagem no runbook](../operacao-mei-nfse.md#triagem-erros-consola-guia-mei).)*

- *(ex.: OK — lido, [equipa], YYYY-MM-DD — ou link ao comentário no MR)*

### Change Log

- 2026-04-08 — Secção de triagem no runbook, brief actualizado, rastreio FR-CONS-EVID-01 nas stories CONS P0/P1.
- 2026-04-08 — Follow-up QA: brief §1/§2/§3/§5 alinhados a 503 Serpro; template de assinatura ops no Dev Record.

---

## QA Results

### 2026-04-08 — Quinn (@qa)

**Decisão de gate:** **PASS**

**Evidência (conteúdo e rastreio)**

| Critério de aceite | Verificação |
| --- | --- |
| Secção dedicada em `docs/operacao-mei-nfse.md` | Presente: **Triagem: erros na consola do browser (Guia MEI)** (**FR-CONS-MAP-01**), âncora `#triagem-erros-consola-guia-mei`. |
| **404 GET empresa** após **POST** falho é **esperado** | Linha **CONS-B** da tabela; causa e próximo passo explícitos; ponteiro a [Encadeamento POST → GET 404](../operacao-mei-nfse.md#cadastro-post-404-get-empresa). |
| **400** `nfse.config.prefeitura` + PRD PREF / operação | Linha **CONS-A / PREF**; link ao [PRD PREF](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) e à [secção PREF](../operacao-mei-nfse.md#nfse-config-prefeitura-cadastro-pref) do runbook. |
| **Validate** / Serpro: indisponibilidade vs Plugnotas; **503** e código | Linha **CONS-C** com `MEI_GUIDE_SERPRO_UNAVAILABLE`, `integration: serpro`, nota de legado **400**; distinção explícita face a cadastro Plugnotas. |
| Links PRD CONS, brief, spec UX CONS, arquitetura CONS | Tabela **Artefactos relacionados** no runbook — caminhos relativos a `docs/` coerentes; ficheiros alvo existem no repositório. |
| **FR-CONS-EVID-01** | [P0 Serpro](./story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md) e [P1 Guia MEI UX](./story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md) referenciam `operacao-mei-nfse.md#triagem-erros-consola-guia-mei` no Dev Agent Record. |
| Diagrama / triagem operacional | Mermaid de cadeia causal; ordem de verificação em lista numerada. |
| Brief bidireccional | [Brief consola](../brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md): link à âncora do runbook + linha no **Change log**. |

**Observações (não bloqueantes)**

1. **Revisão informal de operação:** o critério de aceite pede registo de **OK** por alguém de suporte/ops (nesta story ou no MR). Esta revisão **@qa** cobre qualidade e rastreio técnico do markdown; **não** substitui essa leitura operacional. Recomendação: quando alguém de ops concluir a leitura, acrescentar uma linha breve abaixo (ex.: «OK — lido por [equipa], YYYY-MM-DD») ou referência ao comentário no MR.  
2. **Brief — resumo executivo (§1):** a tabela ainda reflecte sobretudo o sintoma histórico **400** no `validate` com *Internal Server Error*; o **runbook** já documenta o contrato pós-P0 (**503** + `errors.code`). Coexistência aceitável (diagnóstico legado vs actual); alinhamento opcional do brief num follow-up de doc se o PO quiser uma única narrativa temporal.

**Conclusão:** entrega consistente com **FR-CONS-MAP-01** e **FR-CONS-EVID-01**; documentação pronta para merge; evidência de leitura por operações fica como reforço recomendado, não como bloqueio deste gate.

— Quinn, guardião da qualidade 🛡️
