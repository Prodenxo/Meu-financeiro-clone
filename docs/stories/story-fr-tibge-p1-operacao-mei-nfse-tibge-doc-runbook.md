# Story — FR-TIBGE (P1): `operacao-mei-nfse` — distinção de erros (CID / TIBGE / PREF) e runbook

**ID:** STORY-FR-TIBGE-P1-OPERACAO-DOC-RUNBOOK  
**Prioridade:** P1  
**Depende de:** Opcional em paralelo a [story-fr-tibge-p1-plugnotas-empresa-ibge-tabela-mensagem-hint.md](./story-fr-tibge-p1-plugnotas-empresa-ibge-tabela-mensagem-hint.md) (doc pode referenciar comportamento após merge do hint).  
**Fonte PRD:** [`docs/prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — **FR-TIBGE-DOC-01**, **FR-TIBGE-OPS-01**  
**UX:** [`docs/specs/ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../specs/ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — encadeamento com SOL §5  
**Arquitetura:** [`docs/technical/architecture-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../technical/architecture-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — §4 runbook escalação (PRD §8)

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | Revisão de conteúdo + `npm run lint` se doc for validado por script do repo; caso contrário revisão PO/ops |
| **revisão** | @po ou operações — precisão das distinções; @architect — links e âncoras |

---

## User story

**Como** membro de suporte ou desenvolvedor que consulta a documentação de operação MEI/NFS-e,  
**quero** uma secção que distinga erro de **formato** (CID), erro de **tabela IBGE** no emissor (TIBGE) e erro de **prefeitura/config** (PREF), com runbook de escalação,  
**para** diagnosticar 400/404 sem confundir causas nem abrir tickets incorrectos.

---

## Contexto

- **FR-TIBGE-DOC-01:** `docs/operacao-mei-nfse.md` deve ligar explicitamente aos PRDs **CID**, **TIBGE**, **PREF**/**SOL** conforme tabela mental do PRD §1 e §3.  
- **FR-TIBGE-OPS-01:** Runbook resumido já no PRD §8 — transpor para doc operacional (passos: DevTools `codigoCidade`, consulta IBGE, correção vs ticket Plugnotas, 404 esperado até POST 2xx).  
- Não duplicar páginas inteiras de outros PRDs — bullets + links.

---

## Critérios de aceite

- [ ] **`docs/operacao-mei-nfse.md`** inclui subsecção ou tabela **“400 cadastro empresa: qual erro?”** com três colunas ou bullets: **formato/tipo (CID)**, **tabela IBGE / código inexistente no emissor (TIBGE)**, **prefeitura / nfse.config (PREF)** — com links `../prd/PRD-...` canónicos.  
- [ ] Mesmo documento (ou subsecção ligada) inclui **runbook OPS**: confirmar código no POST → comparar com IBGE oficial → se válido e 400 persistir, ticket Plugnotas + `docs/evidence/`; **GET 404** até POST bem-sucedido.  
- [ ] Âncora HTML estável sugerida (ex.: `#cadastro-empresa-erro-ibge-tabela` ou nome acordado) para suporte copiar link.  
- [ ] Referência cruzada ao encadeamento **SOL** (POST falha → GET 404) se ainda não estiver explícita na mesma área.  
- [ ] Revisão ortográfica PT e ausência de PII de exemplo.

### Fora desta story

- Implementação de código — outras stories TIBGE.  
- Log backend — [story-fr-tibge-p2-plugnotas-empresa-400-ibge-log.md](./story-fr-tibge-p2-plugnotas-empresa-400-ibge-log.md).

---

## Tasks (indicativas)

1. [x] Mapear secções actuais de `operacao-mei-nfse.md` (âncoras existentes) para evitar duplicação.  
2. [x] Redigir bloco CID vs TIBGE vs PREF + links PRD.  
3. [x] Inserir runbook FR-TIBGE-OPS-01 (5 passos PRD §8).  
4. [x] Validar com PO ou checklist interno.

---

## File list (indicativo)

- [x] `docs/operacao-mei-nfse.md`

---

## CodeRabbit Integration

- N/A (markdown); revisão humana de links relativos e nomes de ficheiros PRD.

---

## Dev Agent Record

*(preencher por @dev)*

### Status

Ready for Review

### File list

- `docs/operacao-mei-nfse.md`

### Notes

- Secção nova **400 cadastro empresa: qual erro?** com tabela CID / TIBGE / PREF e âncoras `#cadastro-empresa-400-qual-erro` e `#cadastro-empresa-erro-ibge-tabela` (runbook FR-TIBGE-OPS-01 em subsecção).  
- Encadeamento [POST → GET 404](#cadastro-post-404-get-empresa) actualizado para incluir **400** por cidade IBGE; ponteiro desde `endereco.codigoCidade` e linha **CONS-A / TIBGE** no mapa de triagem.  
- Gates de código: N/A (só markdown); `npm run lint` não aplicável a este ficheiro isoladamente.  
- **Seguimento QA (2026-04-09):** no cabeçalho de `operacao-mei-nfse.md` foi acrescentada nota explícita de que `prd/…` (relativo a `docs/`) é o mesmo destino que `../prd/…` em `docs/stories/` — fecha o ponto sobre convenção de caminhos sem alterar os links já validados. A marcação das checkboxes em **Critérios de aceite** permanece com **@sm / @po** (política de story; secção fora do âmbito de edição @dev).

---

## Change log

| Data | Autor | Nota |
|------|-------|------|
| 2026-04-09 | @sm (River) | Story inicial — documentação e runbook TIBGE. |
| 2026-04-09 | @dev | Entrega: `operacao-mei-nfse.md` — tabela CID/TIBGE/PREF, runbook, âncoras, triagem CONS-A/TIBGE. |
| 2026-04-09 | @dev | Seguimento QA: nota de equivalência `prd/` ↔ `../prd/` no cabeçalho do runbook operacional. |

---

## QA Results

### 2026-04-09 — Quinn (@qa) — revisão documental (FR-TIBGE-DOC-01 / FR-TIBGE-OPS-01)

**Decisão de gate:** **PASS**

**Âmbito:** apenas `docs/operacao-mei-nfse.md` (entrega descrita no Dev Agent Record). Sem alterações de código; testes automatizados não aplicáveis a esta story.

**Rastreio aos critérios de aceite:**

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| Tabela **«400 cadastro empresa: qual erro?»** com **CID**, **TIBGE**, **PREF** e links `prd/PRD-...` | **PASS** | Secção com cabeçalho `#### 400 cadastro empresa: qual erro?` e tabela nas linhas ~96–104 de `operacao-mei-nfse.md`; links para PRDs CID, TIBGE, PREF e SOL conforme esperado. |
| **Runbook OPS** (POST → IBGE oficial → correcção / ticket Plugnotas / `docs/evidence/` → GET 404) | **PASS** | Subsecção `##### Runbook — rejeição cidade IBGE / tabela` com 5 passos alinhados ao PRD §8. |
| Âncoras estáveis `#cadastro-empresa-400-qual-erro` e `#cadastro-empresa-erro-ibge-tabela` | **PASS** | Ambas definidas antes do título da secção consolidada; links internos a partir de encadeamento SOL, CID e triagem CONS. |
| Referência cruzada **SOL** (POST falha → GET 404) | **PASS** | Texto no encadeamento (inclui 400 cidade IBGE); célula PREF/SOL na tabela; passo 5 do runbook aponta para `#cadastro-post-404-get-empresa`. |
| Ortografia PT e ausência de PII | **PASS** | Sem dados fictícios sensíveis nas linhas revistas; vocabulário alinhado ao restante do runbook (ex.: «correcto» / «desactualizados» coerentes com o ficheiro). |

**Notas (não bloqueantes):**

- O critério da story menciona links `../prd/...`; no ficheiro em `docs/` a convenção usada é `prd/...` (relativo a `docs/`), consistente com o cabeçalho do próprio `operacao-mei-nfse.md`.
- **Próximo passo opcional:** @sm / PO marcarem manualmente as checkboxes dos **Critérios de aceite** na story quando quiserem fechar o fluxo administrativo (o QA só acrescenta esta secção).

**Recomendação:** considerar a story **aprovada para merge** do ponto de vista de documentação e suporte.
