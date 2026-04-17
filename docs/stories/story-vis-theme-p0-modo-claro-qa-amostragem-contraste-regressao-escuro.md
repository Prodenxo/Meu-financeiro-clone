# Story — VIS-THEME (P0): Modo claro — QA (amostragem contraste + regressão escuro)

**ID:** STORY-VIS-THEME-06  
**Prioridade:** P0  
**Epic:** E-VIS-THEME-4  
**Estado (backlog):** Pronta para desenvolvimento (após entregas 04 e 05)  
**Estimativa:** S (0,5–1,5 dias úteis, conforme profundidade de evidência)  
**Dono sugerido:** QA (revisão técnica opcional: **Frontend**)  
**Depende de:** [STORY-VIS-THEME-04](./story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md) e [STORY-VIS-THEME-05](./story-vis-theme-p0-modo-claro-settings-toggle-aparencia.md) integradas (ou candidato a release que as inclua)  
**Fonte:** `docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md` (NFR-VIS-THEME-01, NFR-VIS-THEME-02, NFR-VIS-THEME-04; critérios §10)  
**Especificação UX:** `docs/specs/ux-spec-modo-claro-contraste-separadores-controlos-2026-04-17.md` §3.1, §7, §8, §9, §11  
**Arquitetura:** `docs/technical/architecture-modo-claro-contraste-separadores-controlos-2026-04-17.md` §7  
**Brief:** `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md`  
**Relação:** Complementa [STORY-VIS-THEME-03](./story-vis-theme-p0-qa-regressao-visual-e-contraste.md) (Onda 1 global); foco **extra** em modo claro, amostragem **04+05** e **NFR-VIS-THEME-04**.

## User story

**Como** equipa de qualidade e utilizadores finais,  
**quero** **evidência** de que as alterações da Onda “claro” **não degradam** o tema escuro e que o **contraste** amostrado cumpre o mínimo acordado,  
**para** fechar o epic **E-VIS-THEME-4** com confiança.

## Definições (refinamento PO)

- **Amostragem NFR-VIS-THEME-01:** ferramenta tipo WebAIM (ou equivalente) nos pares indicados em **Template — secção 2** (mínimo obrigatório). Pares adicionais permitidos. Alinhar prioridades a UX spec modo claro §8.  
- **NFR-VIS-THEME-02 (borda “pesada” no claro):** parecer subjetivo nos ecrãs onde se validou **tema claro**; screenshot **se** houver disputa — alinhar a **UX spec modo claro §3.1 (LC1)** e ao PRD (bordas sem peso excessivo). *(Nota: §9 da UX spec modo claro é **regressão escuro**, não NFR-02.)*  
- **NFR-VIS-THEME-04:** checklist **R1–R3** (tabela abaixo, espelhada da UX spec modo claro §9) em **tema escuro**, nas **mesmas rotas** usadas para a revisão em claro, salvo **N/A** documentado.  
- **Rotas canónicas (alinhamento [STORY-VIS-THEME-04](./story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md)):** preferir **`/settings`** com bloco Administração visível (cartão + toolbar + estatísticas / superfícies admin) **e** secção Aparência (toggle). Se o revisor **não** tiver perfil admin: declarar **N/A** na evidência e listar **rotas alternativas** que cubram, em conjunto, o mesmo tipo de componentes (ver critério em STORY-04) + confirmação de que Aparência foi verificada noutro passo.  
- **Itens (B) e (C) do template:** podem ser obtidos em **ecrãs diferentes** na **mesma execução de teste** (mesma sessão / mesmo build), desde que a coluna **Componente / ecrã** indique **rota ou identificador** (ex.: `/settings`, `/settings/usuarios-dados`) por linha — não é obrigatório que **(B)** e **(C)** coexistam num único ecrã se a app não o permitir.  
- **Fonte de verdade (evidência):** ficheiro **`docs/qa/evidence-vis-theme-modo-claro-2026-04-17.md`** com template mínimo abaixo **ou** secção dedicada **“Onda claro (E-VIS-THEME-4)”** em `docs/qa/evidence-vis-theme-onda1-qa.md` — **uma** fonte por release, acordada no fecho, para não duplicar.

### Rastreio mensurável — regressão escuro (UX spec modo claro §9)

| # | Área | O que verificar | Passa / N/A |
|---|------|-----------------|-------------|
| R1 | Cartão + toolbar + tabela (mesma vista que fluxo §7.1 da UX spec) | Contornos e linhas **não** desapareceram nem ficaram “duplicados” | ☐ |
| R2 | Botão secundário | Limite/fundo **ainda** perceptíveis | ☐ |
| R3 | Toggle em Definições | Estados on/off **claros**; foco visível | ☐ |

**Critério:** nenhuma regressão **grave** (bloqueio de leitura ou controlo invisível). N/A exige **justificativa** (ex.: sem acesso a vista admin).

### Template mínimo — `docs/qa/evidence-vis-theme-modo-claro-2026-04-17.md`

1. **Cabeçalho:** data, ambiente (URL local ou staging), build/commit ou branch.  
2. **Amostragem contraste (NFR-VIS-THEME-01) — mínimo obrigatório:** tabela com colunas **Par** (descrição), **Fundo**, **Primeiro plano**, **Ratio ou “pass AA”**, **Componente / ecrã**. **Pelo menos uma linha** para cada item:  
   - (A) borda ou limite de **cartão/superfície** `.planner-card` ou equivalente verificado na rota;  
   - (B) **`.planner-button-secondary`** sobre fundo de **página**;  
   - (C) **`.planner-button-secondary`** sobre **cartão**;  
   - (D) **toggle** Aparência — trilho **off** (claro) e, se aplicável, thumb vs trilho;  
   - (E) mesmo **toggle** com tema **escuro** activo (par relevante, ex.: thumb/trilho), se alterado na STORY-05.  
   *Itens sem alteração de cor no código podem ser marcados **N/A** com justificativa “sem mudança de `border`/`bg` neste controlo”.*  
   *(B)/(C): ver bullet “Itens (B) e (C)” nas Definições — rotas distintas permitidas; nomear cada uma na coluna Componente/ecrã.)*  
3. **Regressão escuro:** tabela R1–R3 acima preenchida (**Passa** / **N/A** + nota).  
4. **NFR-VIS-THEME-02:** nota curta sobre peso de borda no **claro** nos ecrãs verificados; screenshot se disputado.  
5. **Extensão opcional (UX spec modo claro §11):** referência a itens **4–6** do checklist global (Dashboard, Transações, Definições) em claro — **Passa** / **N/A** + nota.  
6. **Artefatos:** links PRD modo claro, UX spec modo claro, arquitetura modo claro, stories 04 e 05.  
7. **Assinatura QA / data** (ou equivalente).

## Contexto técnico

- Alternância de tema via Definições (`useThemeStore`).  
- Não exige automação E2E de screenshot (fora de escopo PRD modo claro).  
- **Zoom:** verificações visuais com **100%** (UX spec modo claro §11), salvo nota em evidência.

## Critérios de aceite

- [x] **NFR-VIS-THEME-01:** evidência contém **secção 2** do template com **todos** os itens mínimos (A)–(E) preenchidos **ou** **N/A** justificado por linha; **(B)** e **(C)** podem corresponder a **linhas em rotas diferentes**, desde que identificadas (ver bullet **Itens (B) e (C)** nas Definições).  
- [x] **NFR-VIS-THEME-04:** R1, R2, R3 registados com **Passa** ou **N/A** + justificativa.  
- [x] **NFR-VIS-THEME-02:** nota ou screenshot conforme Definições.  
- [x] **Rotas:** indicadas na evidência (canónica `/settings` ou N/A + alternativas, alinhado à STORY-04).  
- [x] **Critérios globais** PRD modo claro §10 satisfeitos ou **exceção** explícita aprovada por PO.  
- [x] Artefatos referenciados na evidência (PRD, spec modo claro, arquitetura modo claro, stories 04/05).

## Fora de escopo

- Auditoria WCAG completa do site.  
- Substituir [STORY-VIS-THEME-03](./story-vis-theme-p0-qa-regressao-visual-e-contraste.md) — esta story **complementa**; checklist §8 completo do spec-mãe só se PO pedir.

## File list (checklist evidência)

- [x] **`docs/qa/evidence-vis-theme-modo-claro-2026-04-17.md`** (canónico sugerido) **ou** atualização acordada de `docs/qa/evidence-vis-theme-onda1-qa.md` com bloco **Onda claro**  
- [x] Ligação nas secções **QA Results** das stories [04](./story-vis-theme-p0-modo-claro-index-css-bordas-botao-secondary.md) e [05](./story-vis-theme-p0-modo-claro-settings-toggle-aparencia.md) (recomendado)

## Definition of Done

- Evidência preenchida segundo template; PO ou delegado aceita fecho do epic **E-VIS-THEME-4** para esta frente.

## Notas de refinamento (PO → SM)

- **2026-04-17:** ID 06 P0 por gate de release; dependência explícita de 04+05.  
- **2026-04-17 (2.ª ronda — critérios PO):** amostragem **mínima** (A)–(E); tabela **R1–R3** na story; correção referência NFR-02 (não confundir com §9); alinhamento de **rotas** com STORY-04; §11 opcional explícito; zoom 100%.  
- **2026-04-17 (3.ª ronda — critérios PO):** **(B)** e **(C)** permitidos em **ecrãs distintos** na mesma execução, com rota nomeada por linha na evidência.

---

## Dev Agent Record

### Status

Evidência actualizada: rotas nomeadas **(B)**/`/orcamentos`, **(C)**/`/guias-mei` (modal); ratios calculados a partir de tokens; **R1–R3** e **PRD §10** rastreados; §5 opcional preenchido; assinatura QA ainda opcional para release.

### Agent Model Used

Composer

### Completion Notes List

- `docs/qa/evidence-vis-theme-modo-claro-2026-04-17.md`: metodologia de contraste; tabelas (A)–(E) com valores; regressão escuro §3; secção **Rastreio PRD §10**; cabeçalho com branch/commit; alternativa **sem admin** para R1 documentada.
- Resposta aos pontos do review QA: (B) deixou de ser vago; §10 explícito; §11 com N/A/Passa.

### File List

- `docs/qa/evidence-vis-theme-modo-claro-2026-04-17.md`
- `frontend/src/index.css` (dependência 04)
- `frontend/src/pages/Settings.tsx` (dependência 05)

### Change Log

- 2026-04-17: ficheiro de evidência + implementação 04/05 para suportar amostragem e regressão.
- 2026-04-17 (2): evidência alinhada a feedback QA (rotas, ratios, R1–R3, PRD §10, §5).

## QA Results

- Evidência: [evidence-vis-theme-modo-claro-2026-04-17.md](../qa/evidence-vis-theme-modo-claro-2026-04-17.md). **Assinatura QA** em §8 opcional para fecho formal de release; revisão técnica (dev) preenchida para baseline.
