# Story — FR-ERR-P0-A: Fase A — Inventário de erros, copy canónica e decisão backend

**ID:** STORY-FR-ERR-P0-A  
**Prioridade:** P0  
**Depende de:** — (primeira story da iniciativa)  
**Fonte:** `docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md` (**FR-ERR-A01**, **FR-ERR-A02**, **FR-ERR-A05**, **FR-ERR-A04** documental)  
**UX:** `docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md` (§6 copy, §11 remissões)  
**Arquitetura:** `docs/technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md` (decisões **D2**, inventário, §12)

## User story

**Como** equipa de produto/engineering,  
**quero** inventário versionado de *call sites* de erro, tabela de copy canónica por categoria e decisão explícita sobre extensão opcional do JSON de erro no backend,  
**para** guiar implementação sem ambiguidade e cumprir a Fase A do PRD antes do código do núcleo (**STORY-FR-ERR-P0-B**).

## Contexto técnico

- **FR-ERR-A01:** matriz em `docs/` com colunas: *superfície/rota*, *componente*, *origem actual da string*, *categoria taxonómica* (spec §3), *copy proposta*, *recoverable*, *CTAs*, *surfaceId* (opcional para analytics futuro).
- **FR-ERR-A02:** tabela de copy alinhada à spec §6 (título, descrição, CTAs) — versão 1.0; aprovação PO pode ser minuta ou comentário no PR.
- **FR-ERR-A05:** listar todos os pontos onde `buildApiErrorMessage` ou `Error.message` chegam à UI; documentar estratégia **D1** (só cliente) vs **D2** (campo `userFacing` no JSON) com recomendação fundamentada no inventário.
- **FR-ERR-A04:** adicionar **um parágrafo de remissão** em `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` e `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` apontando para `ux-spec-mensagens-erro-usuario-final-2026-04-07.md` (conforme spec §11).
- **Sem código de produção** nesta story (só documentação).

## Critérios de aceite

- [ ] Existe `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` (ou nome coerente) com matriz **A01** cobrindo pelo menos as superfícies P0 do PRD §10 (Guia MEI, catálogos MEI, transações, `FetchErrorBanner` / equivalentes, toasts ligados a `buildApiErrorMessage`).
- [ ] Existe tabela **A02** no mesmo ficheiro ou em `docs/ux-audit/copy-canónica-erros-categoria-2026-04-07.md`, alinhada à spec UX §6.
- [ ] Secção **A05** com decisão **D2** sim/não e, se sim, esboço de contrato (referência arquitetura §6) + próxima story backend opcional.
- [ ] Remissões **A04** aplicadas nas duas specs MEI indicadas.
- [ ] Ligações cruzadas no cabeçalho dos novos docs ao PRD, spec UX e arquitetura.

## Fora de escopo

- Implementação de `UserFacingErrorBlock`, mapeadores ou alteração de `apiClient`.  
- Testes automatizados de código.

## File list (checklist implementação)

- [ ] `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` (ou equivalente)
- [ ] `docs/ux-audit/copy-canónica-erros-categoria-2026-04-07.md` (opcional se integrado no inventário)
- [ ] `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` (parágrafo remissão)
- [ ] `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` (parágrafo remissão)

## Definition of Done

- PO/produto confirma leitura da copy canónica v1.0 ou regista alterações pedidas em comentário/minuta.  
- Inventário revisto por alguém que conheça `GuidesMei` e `apiClient` (paridade com grep real).

## Qualidade / CodeRabbit

- Sem PII nem exemplos de tokens reais nos documentos.  
- IDs estáveis na matriz (`ERR-INV-###`) para rastreio em PRs seguintes.

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor Agent

### Completion Notes List

- Entregue `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` com matriz **ERR-INV-001–030** (P0 PRD §10 coberto; P1/adjacentes incluídos para A05), §2 copy canónica **A02**, §3 decisão **D2 = Não** (v1 cliente-only) com critério de reabertura.
- Remissões **FR-ERR-A04**: parágrafos em `ux-spec-mei-nfse-workspace-2026-04-01.md` (após §7) e `ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` (§3.3).
- Minuta PO vazia para DoD: `docs/ux-audit/po-copy-erros-utilizador-2026-04-07.md`.
- Sem código de produção (conforme story).
- **Pós-QA (2026-04-07):** correcções aos pontos da revisão Quinn — §7 spec NFS-e com `FiscalIntegrationErrorAlert.tsx` + exports; inventário **§6** (tabela de resposta QA); minuta PO com **Revisão desenvolvimento** (sign-off parcial DoD código). Critérios de aceite na story: marcar por **SM/PO** quando formalmente aceites (nota QA).

### File List (implementação)

- `docs/ux-audit/inventario-erros-utilizador-final-2026-04-07.md` (incl. §6 pós-QA)
- `docs/ux-audit/po-copy-erros-utilizador-2026-04-07.md` (incl. Revisão desenvolvimento)
- `docs/specs/ux-spec-mei-nfse-workspace-2026-04-01.md` (nomenclatura fiscal §7)
- `docs/specs/ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md`

### Debug Log References

—

### Change Log

- **2026-04-07** — Story criada (SM) a partir do PRD, spec UX e arquitetura mensagens de erro.
- **2026-04-07** — Implementação Fase A (Dex): inventário, copy A02 integrada, A05/D2, remissões specs MEI, minuta PO.
- **2026-04-07** — Correcções pós-QA: spec NFS-e (ficheiro vs export), inventário §6, minuta PO revisão dev.

---

## QA Results

### Revisão — 2026-04-07 (Quinn)

**Decisão de gate:** **PASS com ressalvas** (critérios documentais da story satisfeitos; **Definition of Done** de produto depende de PO.)

#### Rastreio aos critérios de aceite

| Critério | Evidência | Veredicto |
|----------|-----------|-----------|
| Matriz **A01** em `docs/ux-audit/...` cobrindo P0 PRD §10 | `inventario-erros-utilizador-final-2026-04-07.md` §1 — ERR-INV-001–011 (Guia MEI + catálogos), 012–016 (transações, banner, store), 025–026 (`apiClient` / `buildApiErrorMessage`), 028 (alertas fiscais). Nota explícita nas linhas 52–53. | **Satisfeito** |
| Tabela **A02** alinhada à spec UX §6 | Mesmo ficheiro §2 — oito categorias com título, descrição, CTAs; alinhamento declarado com spec §6. | **Satisfeito** |
| Secção **A05** + decisão **D2** | §3.1–3.3 — cadeia técnica, entradas `Error.message`, **D2 = Não** para v1 com critério de reabertura; esboço “D2 — Sim” aponta para arquitetura §6 (adequado quando a decisão for *não* na v1). | **Satisfeito** |
| Remissões **A04** nas duas specs MEI | `ux-spec-mei-nfse-workspace-2026-04-01.md` (parágrafo após §7) e `ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` (§3.3) — ligação relativa correcta ao ficheiro `ux-spec-mensagens-erro-usuario-final-2026-04-07.md`. | **Satisfeito** |
| Ligações cruzadas no cabeçalho do inventário | Links para PRD, spec UX, arquitetura, story (linhas 7–9). | **Satisfeito** |

#### NFR / qualidade documental

| ID | Veredicto | Nota |
|----|-----------|------|
| Sem PII / tokens (Qualidade story) | **OK** | Texto só referencia ficheiros e padrões; sem dados reais. |
| IDs estáveis `ERR-INV-###` | **OK** | ERR-INV-001 … ERR-INV-030 contíguos. |
| Paridade “grep real” (DoD) | **OK com ressalva** | Inventário coerente com `GuidesMei`, `apiClient`, `FetchErrorBanner`, catálogos MEI e `transactionStore` conhecidos no repo; não foi feita auditoria linha-a-linha de **todos** os `toast.error` nesta sessão — aceitável para Fase A; **ERR-P0-B** pode validar omissões. |

#### Definition of Done (story)

| Requisito | Estado |
|-----------|--------|
| PO confirma copy v1.0 ou regista alterações | **Pendente** — `docs/ux-audit/po-copy-erros-utilizador-2026-04-07.md` existe mas checkboxes/assinatura por preencher. |
| Inventário revisto por quem conhece código | **Parcial** — revisão QA estática; recomenda-se *sign-off* explícito de dev/PO no PR. |

#### Observações menores (não bloqueantes)

1. **Nome de componente** no parágrafo A04 da spec NFS-e: referência a `PlugnotasIntegrationErrorAlert` — no código o módulo é `FiscalIntegrationErrorAlert.tsx` com export `PlugnotasIntegrationErrorAlert`; semanticamente OK; se houver confusão na equipa, alinhar nomenclatura numa passagem futura de docs.  
2. **Critérios de aceite** na story (checkboxes `[ ]`) permanecem por marcar por SM/PO após aceitação formal — fora do âmbito de edição QA.

**Recomendação:** considerar a story **aprovada para merge** do ponto de vista QA técnico-documental; fechar **DoD** quando PO preencher a minuta ou equivalente.

— Quinn, guardião da qualidade 🛡️
