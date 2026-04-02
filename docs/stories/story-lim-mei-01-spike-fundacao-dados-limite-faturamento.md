# Story — LIM-MEI-01: Spike + fundação — dados e agregado do limite de faturamento MEI

**ID:** STORY-LIM-MEI-01  
**Prioridade:** P0 (Must — PRD onda 1)  
**Tipo:** Spike técnico + fundação de código (sem UI final do bloco canónico)  
**Depende de:** —  
**Fonte:** `docs/prd/PRD-mei-infinito-acompanhar-limite-faturamento-2026-04-02.md` §5.3, §7, §11, §12  
**Especificação UX:** `docs/specs/ux-spec-mei-infinito-limite-faturamento-2026-04-02.md` §8, §12 (NFR-LIM-02, NFR-LIM-05)

## User story

**Como** equipa de produto e engenharia,  
**quero** fechar **onde** se calcula o progresso face ao limite (cliente vs endpoint), **como** se parametrizam teto por ano, vigência e limiares de proximidade, e **garantir** o somatório MVP (NFS-e emitidas no ano civil na conta),  
**para** que **LIM-MEI-02** e **LIM-MEI-03** consumam um contrato de dados estável sem retrabalho.

## Contexto técnico

- **Referência de UI existente:** `frontend/src/pages/GuidesMei.tsx`; persistência de workspace em `frontend/src/pages/guidesMeiWorkspaceStorage.ts`.  
- **MVP (PRD §5.3):** soma de **NFS-e emitidas pela app** no **ano civil** corrente; limite numérico **por ano** com vigência (config: env, Edge Config, constante versionada ou tabela — decisão no artefato técnico).  
- **Saída obrigatória do spike:** um artefato canónico em `docs/technical/` (ADR curto ou apêndice) com decisão **endpoint dedicado** (`GET …/mei/limit-progress` ou equivalente) **vs** cálculo no cliente a partir da lista já carregada — incluir impacto em cache/memoização (**NFR-LIM-02**).  
- **LIM-MEI-02** deve poder importar tipos/funções desta fundação; evitar acoplar cópia de regras em JSX.

## Critérios de aceite

### Spike (documentação)

- [x] Está documentada a decisão **agregação no servidor vs cliente**, com justificativa de performance e ponto único de invalidação (**alinhado a FR-LIM-08** no desenho).  
- [x] Está definido o **modelo de configuração** do limite de referência: valor por ano civil, **vigência** ou etiqueta de atualização (**FR-LIM-03**, **NFR-LIM-05**).  
- [x] Estão definidos **limiares** configuráveis de proximidade (ex.: ≥ 80 % / ≥ 95 % — valores finais fecháveis com PO) e mapeamento para estados *seguro / atenção / crítico* (**FR-LIM-04** preparação).  
- [x] O documento referencia explicitamente **LIM-MEI-02** e **LIM-MEI-03** como consumidores do contrato.

### Fundação (código)

- [x] Existe implementação testável do **somatório MVP** das NFS-e aplicáveis ao ano civil corrente (reutilizando a mesma fonte de dados que a lista NFS-e da página, salvo se o ADR impor endpoint exclusivo).  
- [x] Expostos **tipos** (TypeScript) e/ou função(ns) puras para: total utilizado, limite de referência do ano, percentagem 0–100 (com edge case > 100 % tratado no contrato — ver UX §5.4).  
- [x] `npm run lint`, `npm run typecheck` e `npm test` nos pacotes tocados passam (**NFR-LIM-03**).  
- [x] Testes unitários cobrem pelo menos: ano civil correto, lista vazia, soma simples, limite zero/indéfinido se for caso tratado.

## Fora de escopo

- Renderização do bloco canónico na página (**LIM-MEI-02**).  
- Integração completa em `GuidesMei.tsx` e refresco pós emitir/cancelar (**LIM-MEI-03**).  
- Bloqueio automático de emissão NFS-e (**fora do MVP**, PRD §5.2).  
- Importação CSV / ajuste manual / APIs oficiais Receita (**P1/P2**).

## File list (checklist implementação)

- [x] `docs/technical/` — artefato canónico do spike (nome a definir na implementação, ex.: `mei-limite-faturamento-agregado-2026-04-02.md`)  
- [x] Módulo(s) frontend e/ou backend conforme ADR (ex.: helpers em `frontend/src/`, rota em `backend/src/` se aplicável)  
- [x] Testes associados ao agregado/config

## Definition of Done

- Revisão do artefato técnico com referência a **@architect** / dev conforme PRD §13.  
- Critérios de aceite do spike e da fundação verificados; **LIM-MEI-02** pode assumir o contrato sem ambiguidade.

## Qualidade / CodeRabbit

- Não introduzir secrets; valores de exemplo anonimizados na documentação.  
- Manutenção: alterações futuras ao teto devem ser localizáveis (config única, **NFR-LIM-05**).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor agent (implementação LIM-MEI-01)

### Completion Notes List

- ADR em `docs/technical/mei-limite-faturamento-agregado-2026-04-02.md`: agregação no cliente sobre `NfseRecord[]` (`listarNfse`); endpoint dedicado reservado para evolução.
- Funções puras `frontend/src/utils/meiLimiteFaturamento.ts` + config `meiLimiteFaturamentoConfig.ts`; somatório só para NFS-e com status classificado como concluído (autorizada).
- `npm run lint`, `npm run typecheck`, `npm test` (workspaces) executados com sucesso após alterações.
- **Pós-QA (2026-04-02):** ADR v1.1 — §4 explicita PRD “emitidas” = **autorizada/concluída** para o KPI; §6 PRD §13 (evidência de @architect no MR); §4 tipo `NFSE` apenas. JSDoc alinhado; teste Vitest para exclusão de `document_type: NFE`.
- **CodeRabbit CLI:** tentativa `wsl` falhou (WSL não instalado neste ambiente); revisão automatizada fica para **CI** ou máquina com WSL + `coderabbit`, conforme workflow do projeto.

### File List (implementação)

- `docs/technical/mei-limite-faturamento-agregado-2026-04-02.md`
- `frontend/src/utils/meiLimiteFaturamentoConfig.ts`
- `frontend/src/utils/meiLimiteFaturamento.ts`
- `frontend/src/utils/meiLimiteFaturamento.test.ts`

### Debug Log References

—

### Change Log

| Data | Nota |
|------|------|
| 2026-04-02 | Story criada pelo SM (River) a partir do PRD e da spec UX limite de faturamento. |
| 2026-04-02 | Spike documentado; fundação TS + testes vitest para agregado e limiares. |
| 2026-04-02 | Correções pontuais pós-QA: ADR v1.1, teste NFSE vs NFE, notas Dev Agent (CodeRabbit/WSL). |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-04-02  
**Gate:** **PASS com ressalvas (CONCERNS)**

### Rastreio aos critérios de aceite

| Área | Verificação | Notas |
|------|-------------|--------|
| Spike | Decisão cliente vs servidor, NFR-LIM-02 / invalidação, modelo de config, limiares 80/95 → `seguro` / `atencao` / `critico`, consumidores LIM-MEI-02 e LIM-MEI-03 | Coberto em `docs/technical/mei-limite-faturamento-agregado-2026-04-02.md`. |
| Fundação | Somatório sobre `NfseRecord` + `payload_json.servico[].valor.servico`; tipos `MeiLimiteProgresso`; percentual sem teto + barra limitada; config central `meiLimiteFaturamentoConfig.ts` | Implementação em `frontend/src/utils/meiLimiteFaturamento.ts` alinhada ao ADR e ao payload normalizado no backend. |
| Testes | Ano civil, lista vazia, soma, exclusões, limite 0 / ano sem teto, &gt; 100 %, bandas | `meiLimiteFaturamento.test.ts` cobre os casos mínimos pedidos; uso de `getFullYear()` local consistente com o teste de alinhamento ao `Date` parseado. |
| Segurança / qualidade | Sem secrets; tetos como referência administrativa | Conforme secção “Qualidade / CodeRabbit” da story. |

### Pontos fortes

- Contrato `MeiLimiteProgresso` é estável para LIM-MEI-02 importar sem acoplar JSX.
- Regra de inclusão só para status classificado como **concluído** está documentada no ADR e no código; coerente com faturamento “definitivo”.
- Edge case &gt; 100 % explícito (`percentualUtilizado` vs `percentualUtilizadoParaBarra`).

### Ressalvas (não bloqueantes para merge desta story)

1. **Produto / PO:** O PRD fala em “NFS-e **emitidas** pela app”; a implementação conta apenas notas com status **concluído** (autorizada). Notas ainda em processamento não entram. Faz sentido para KPI de receita reconhecida — convém **confirmar com o PO** que é este o significado pretendido para o MVP (vs. “enviadas ao provedor”).
2. **DoD processual:** O Definition of Done pede revisão do artefato com **@architect** / dev (PRD §13). Não há evidência no repositório; **recomendação:** registo assíncrono (comentário MR, canal ou minuta) antes de promover dependências em LIM-MEI-02.
3. **CodeRabbit:** A story lista verificação CodeRabbit; esta revisão **não** substitui a passagem CLI em WSL se a equipa a exigir no pipeline de release.
4. **Teste opcional (dívida leve):** Não há teste explícito que `document_type !== 'NFSE'` seja ignorado; risco baixo dado `isNfseDocumento`, pode acrescentar-se num refactor futuro.

### Conclusão

Implementação **adequada** ao âmbito da story (spike + fundação, sem UI). **PASS** com as ressalvas acima; LIM-MEI-02 pode assumir o contrato tal como documentado, desde que o PO feche o ponto (1) se necessário.

— Quinn, guardião da qualidade 🛡️
