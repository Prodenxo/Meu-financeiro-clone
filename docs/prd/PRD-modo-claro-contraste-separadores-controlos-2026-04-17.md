# PRD — Modo claro: contraste de separadores, caixas, interruptores e botões secundários

**Versão:** 1.0  
**Data:** 2026-04-17  
**Tipo:** Brownfield — melhoria contínua de IU (tokens CSS, classes partilhadas em `index.css`, controlos; foco **tema claro**)  
**Fonte canónica:** `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md`

**Relação com outros documentos**

- **`docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md`** — programa-mãe **VIS-THEME** (Ondas 0–1, FR/NFR **01–04**). O presente PRD **estende** esse programa com requisitos **05–08** e **NFR-VIS-THEME-04**, específicos do **gap do modo claro** descrito no brief; não revoga requisitos já acordados.
- **`docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`** — contexto da primeira revisão (shell, tokens globais); este PRD aprofunda **controlos e superfícies** onde o claro ainda “cola” ao fundo.
- **`docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md`** — após aprovação deste PRD, o PO/UX deve alinhar secções de **par canónico** e checklist se for necessário referenciar **FR-VIS-THEME-05+** (atualização opcional do spec, fora do escopo obrigatório deste ficheiro).
- **`docs/technical/architecture-revisao-visual-temas-claro-escuro-2026-04-17.md`** — continua válida a escolha de **`frontend/src/index.css`** como fonte de verdade; este PRD reforça **consumo de token** vs classes ad hoc no **claro**.

---

## 1. Resumo executivo

No **tema claro**, utilizadores relatam **hierarquia visual fraca**: contornos de **caixas** (cartões, toolbars, tabelas), **linhas separadoras**, **interruptores** em repouso e **botões secundários/outline** ficam **pouco distintos** do fundo (`bg-slate-100`, superfícies `white/80`, gradientes claros). Isso **não altera regras de negócio**, mas reduz **confiança, escaneabilidade e acessibilidade percebida**.

Este PRD formaliza **requisitos de produto**, **critérios de aceite**, **métricas** e **relação com QA** para uma entrega **incremental**, com **regressão cruzada mínima** no tema escuro.

---

## 2. Visão de produto (modo claro)

No tema claro, o utilizador deve **ver sem esforço** onde termina o fundo da página e onde começa cada **bloco funcional** (cartão, linha de tabela, área de ferramentas). **Controlos não primários** (secundário, toggle off) devem ter **limite ou fundo** reconhecível em **estado de repouso**, sem depender de hover. O desenho permanece no **design system leve** (Tailwind + `index.css`), privilegiando **um par canónico** de borda alinhado a `--color-surface-border` e/ou `.ui-border-section`.

**Princípio:** *perceptibilidade de contorno no claro sem peso visual excessivo* — coerente com **NFR-VIS-THEME-02** (bordas não “pesadas”).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Fundo vs superfície** | Cartões “derretem” em `slate-100` | Harmonizar tom de borda (ex. alinhar a **slate-300** do token) nas classes base |
| **Separadores** | `border-slate-200` e variantes com opacidade sobre fundos claros semelhantes | Substituir por padrão canónico reutilizável |
| **Botões secundários** | Contorno fraco em `.planner-button-secondary` | Reforço de **stroke** ou **fundo** no claro apenas |
| **Interruptores** | Trilho/círculo pouco distintos no **off** | Borda ou contraste explícito no claro; foco visível mantido |
| **Fragmentação** | Token `--color-surface-border` vs `slate-200` em utilitários | **FR-VIS-THEME-05**: alinhar fonte de verdade |

---

## 4. Personas e fluxos prioritários para validação

### 4.1 Personas (herdadas)

| Persona | Implicação |
|---------|------------|
| Utilizador em desktop/tablet | Leitura de tabelas admin e formulários com toggles |
| Utilizador MEI | Formulários longos e cartões em fluxos MEI |
| Administrador | Densidade de informação em toolbars e grelhas |

### 4.2 Fluxos prioritários (checklist — tema claro primeiro)

1. **Admin / planner:** página com **cartão**, **toolbar**, **tabela** (ex.: painel admin representativo).  
2. **Formulário com interruptor:** pelo menos um ecrã com **toggle** visível no claro.  
3. **Botão secundário:** `.planner-button-secondary` (ou equivalente) sobre fundo de página e sobre cartão.  
4. **Regressão escuro:** mesmas áreas em **tema escuro** (sanidade).

---

## 5. Escopo

### 5.1 Dentro do escopo

- Ajuste de **tokens** `:root` e/ou consumo de **`--color-surface-border`** nas classes listadas no brief (`.planner-surface`, `.planner-card`, `.planner-card-muted`, `.planner-button-secondary`, `.admin-toolbar`, `.admin-table-shell`, `.admin-table-row`, `.admin-stat-card`, `.admin-empty-state`, e classes afins que partilhem o mesmo problema).
- **Interruptores:** identificar implementação no repositório e reforçar **visibilidade no claro** (estado off + foco).
- **Varredura pontual** em TSX com padrões `border-slate-200/80` (ou equivalentes) em fluxos de alta superfície, alinhada ao par canónico.
- **Evidência de QA:** amostragem de contraste nos pares alterados (**NFR-VIS-THEME-01**), com ênfase em **fundo + borda** e controlos.

### 5.2 Fora do escopo

- Nova paleta de marca ou alteração da cor primária de produto.  
- Redesign completo de componentes ou troca de biblioteca de UI.  
- Auditoria WCAG integral do site (mantém-se **amostragem** como no programa VIS-THEME).  
- Refatoração funcional de fluxos MEI/NFS-e além do necessário para classes visuais.

---

## 6. Fase sugerida

| Fase | Conteúdo | Notas |
|------|-----------|--------|
| **Onda “claro”** (incremental) | Tokens + `index.css` + interruptores + TSX ad hoc prioritário | Pode ser entregue em **um ou mais PRs** respeitando **NFR-VIS-THEME-03** |

---

## 7. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **FR-VIS-THEME-05** | **Alinhar** o uso de bordas no tema claro: as classes utilitárias e componentes partilhados devem **convergir** para o tom definido em `--color-surface-border` **ou** documentar excecão pontual; reduzir uso isolado de `border-slate-200` onde o brief identifica **colagem** ao fundo. | P0 |
| **FR-VIS-THEME-06** | Em **modo claro**, superfícies **`.planner-*`** e **`.admin-*`** listadas no brief devem exibir **contorno ou separação** claramente distinguível do fundo da página (`body`), sem segunda borda desnecessária (**paridade FR-VIS-THEME-04**). | P0 |
| **FR-VIS-THEME-07** | **Botões secundários** (mínimo: `.planner-button-secondary`) devem ter **borda ou fundo** perceptível em repouso no claro sobre `bg-slate-100` e sobre cartão claro típico. | P0 |
| **FR-VIS-THEME-08** | **Interruptores** (`role="switch"` ou componente equivalente): no tema claro, estado **off** deve ter **trilho ou contorno** visível; estado **on** mantém distinção óbvia; **focus-visible** mantém-se acessível. | P0 |

---

## 8. Requisitos não funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| **NFR-VIS-THEME-01** | (Herdado) Amostragem de contraste com ferramenta nos controlos/superfícies alterados. | P0 |
| **NFR-VIS-THEME-02** | (Herdado) Não introduzir bordas **excessivamente pesadas** no claro; preferir **1px** e tom único estável. | P0 |
| **NFR-VIS-THEME-03** | (Herdado) PRs **localizados**; evitar diff massivo não relacionado. | P1 |
| **NFR-VIS-THEME-04** | **Regressão escuro:** alterações focadas no claro devem ser **reverificadas** nas mesmas vistas em tema escuro; **sem regressão grave** de contorno ou legibilidade (checklist curto). | P0 |

---

## 9. Métricas de sucesso

| Métrica | Alvo | Notas |
|---------|------|--------|
| Critérios §10 deste PRD | **100%** satisfeitos antes de fecho | Evidência em QA ou notas de release |
| Pares “fundo + borda” / controlos | Amostragem **registada** nos componentes tocados | Ligação a `docs/qa/` ou processo existente (ex.: Onda VIS-THEME) |
| Regressões críticas pós-release no claro | **0** nos fluxos §4.2 | Triagem suporte/QA |

---

## 10. Critérios de aceite globais (release)

- [ ] **Tema claro:** numa vista representativa (§4.2), **cartão**, **toolbar** e **tabela** mostram **separação visual** clara do fundo da página.  
- [ ] **Tema claro:** **botões secundários** com limite ou fundo **perceptível** em repouso (§7 FR-VIS-THEME-07).  
- [ ] **Tema claro:** **interruptores** em **off** com **contorno ou trilho** visível; **on** distinto (FR-VIS-THEME-08).  
- [ ] **Tema escuro:** checklist **curto** sem regressão grave nas mesmas áreas (**NFR-VIS-THEME-04**).  
- [ ] **Evidência:** nota ou ficheiro de QA com amostragem **NFR-VIS-THEME-01** nos elementos alterados.  
- [ ] **Rastreio:** PRs referenciam este PRD e o **brief**; stories em `docs/stories/` podem ser criadas pelo **@sm** a partir das secções 7–10.

---

## 11. Riscos e dependências

| Risco | Mitigação |
|-------|-----------|
| Subjetividade “borda pesada” | Revisão UX em screenshot; critério **NFR-VIS-THEME-02** |
| `GuidesMei.tsx` ou ficheiros muito grandes | PRs por padrão de classe (**NFR-VIS-THEME-03**) |
| Sobreposição com stories VIS-THEME em curso | Coordenação PO: nova story ou extensão de backlog; **sem** duplicar entregas concluídas |

---

## 12. Epics e delegação (Gate 1)

| Epic sugerido | Descrição | Dono sugerido |
|---------------|-----------|----------------|
| **E-VIS-THEME-4** (ou nome acordado) | **Modo claro:** tokens + classes partilhadas + toggles + QA amostral | Frontend + QA |

**Delegação:** o **PM** mantém este PRD e o alinhamento com o programa **VIS-THEME**; a criação de **user stories** testáveis fica a cargo do **@sm**, com base nas secções 7–10.

---

## 13. Histórico de documento

| Versão | Data | Autor | Notas |
|--------|------|-------|-------|
| 1.0 | 2026-04-17 | Morgan (PM) | Versão inicial a partir de `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md` |

---

## 14. Referências

- `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md`
- `docs/brief/brief-revisao-visual-temas-claro-escuro-2026-04-17.md`
- `docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md`
- `frontend/src/index.css`
- `docs/stories/story-vis-theme-p1-guidesmei-divisorias-bordas.md`, `story-vis-theme-p1-modais-fecho-e-classes-ui.md`, `story-vis-theme-p0-qa-regressao-visual-e-contraste.md`
