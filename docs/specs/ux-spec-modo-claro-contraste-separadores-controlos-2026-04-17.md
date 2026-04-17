# Especificação de front-end e UX — Modo claro: separadores, caixas, interruptores e botões secundários

**Versão:** 1.0  
**Data:** 2026-04-17  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** `docs/prd/PRD-modo-claro-contraste-separadores-controlos-2026-04-17.md` (FR-VIS-THEME-05 a **08**, NFR-VIS-THEME-01, **02**, **03**, **04**)  
**Brief:** `docs/brief/brief-modo-claro-contraste-separadores-controlos-2026-04-17.md`

**Relação com outros artefatos**

- **`docs/specs/ux-spec-revisao-visual-temas-claro-escuro-2026-04-17.md`** — spec-mãe **VIS-THEME** (Onda 0–1). O presente documento **refina** o modo **claro** para requisitos **05+** e **NFR-VIS-THEME-04**, sem revogar P1–P4 nem o checklist global §8 do spec-mãe. Onde houver tensão entre “priorizar `slate-200`” (spec-mãe §4.3) e **perceptibilidade** sobre `bg-slate-100`, **prevalece esta spec** para a Onda “claro” (alinhar ao token — §3.2).  
- **`docs/prd/PRD-revisao-visual-temas-claro-escuro-2026-04-17.md`** — programa-mãe; FR/NFR **01–04** permanecem válidos (paridade, modais, checklist base).  
- **`docs/technical/architecture-revisao-visual-temas-claro-escuro-2026-04-17.md`** — fonte de verdade técnica: `frontend/src/index.css`.

**Estado:** especificação normativa para implementação e QA; não substitui user stories criadas pelo **@sm**.

---

## 1. Objetivo deste documento

Contrato de **experiência visual e implementação** para:

1. **Perceptibilidade no tema claro** de contornos de **caixas** (cartões, toolbars, tabelas), **separadores** e **botões secundários** face ao fundo da página.  
2. **Interruptores** (toggle): trilho/contorno legível em **repouso** (estado off no claro) e **focus** acessível.  
3. **Alinhamento token vs utilitários** (**FR-VIS-THEME-05**) e **regressão mínima** no escuro (**NFR-VIS-THEME-04**).  
4. Extensão do **checklist de QA** e regras de **amostragem de contraste** para esta entrega.

---

## 2. Mapa PRD → secções desta spec

| PRD | Secção desta spec |
|-----|-------------------|
| FR-VIS-THEME-05 | §3 (token e par canónico), §6 (anti-padrões) |
| FR-VIS-THEME-06 | §3.3, §4 (superfícies planner/admin) |
| FR-VIS-THEME-07 | §5 (botão secundário) |
| FR-VIS-THEME-08 | §5 (interruptor genérico), §7 (implementação conhecida em Definições) |
| NFR-VIS-THEME-01 | §8 (contraste) |
| NFR-VIS-THEME-02 | §3.1 (peso visual) |
| NFR-VIS-THEME-03 | §10 (disciplina de PR) |
| NFR-VIS-THEME-04 | §9 (checklist regressão escuro) |

---

## 3. Princípios e tokens (modo claro)

### 3.1 Peso visual (NFR-VIS-THEME-02)

| ID | Princípio | Implicação |
|----|-----------|------------|
| **LC1** | **Um grau de contraste, não dois** | Preferir **uma** borda `1px` + tom estável; evitar sombra forte **e** borda espessa no mesmo controlo. |
| **LC2** | **Fundos próximos pedem borda mais escura** | Sobre `bg-slate-100` (body), contornos exteriores devem aproximar-se de **`--color-surface-border`** (RGB ~slate-300), não de `slate-200` isolado se a colagem persistir. |
| **LC3** | **Paridade sem segunda borda** | Como no spec-mãe §4.2: não envolver `.planner-card` com wrapper só para somar borda; ajustar a **classe base** ou o **filho** com critério único. |

### 3.2 Token canónico — borda de superfície (claro)

| Fonte | Valor de referência (claro) | Uso |
|-------|-----------------------------|-----|
| `--color-surface-border` em `:root` | `203 213 225` (~Tailwind **slate-300**) | Bordas de **limite** de cartão, shell de tabela, toolbar, quando o fundo da página é `slate-100` e a superfície é branca/semi-opaca. |

**Regra de implementação (FR-VIS-THEME-05):** onde hoje exista `border-slate-200` (ou `/80`–`/90`) em contorno **exterior** de componentes listados no PRD e o contraste for insuficiente no claro, **preferir** `border-[color:rgb(var(--color-surface-border))]` **ou** classe utilitária já mapeada em `index.css` que incorpore o mesmo tom — de forma a **uma única** fonte de verdade por componente.

### 3.3 Superfícies alvo (FR-VIS-THEME-06)

Em **modo claro**, as seguintes classes (mínimo do PRD) devem permitir ver **claramente** o limite do bloco face a `body` (`bg-slate-100`):

- `.planner-surface`, `.planner-card`, `.planner-card-muted`  
- `.planner-button-secondary` (ver §5.1)  
- `.admin-toolbar`, `.admin-table-shell`, `.admin-table-row` (primeira linha / separação), `.admin-stat-card`, `.admin-empty-state`

**Nota:** linhas internas de tabela (`.admin-table-row border-t`) devem manter-se **coerentes** com o contorno do shell; se o shell subir para slate-300, as linhas podem permanecer num tom **igual ou um degrau mais claro** desde que a **primeira** separação header/corpo ou borda exterior continue perceptível.

---

## 4. Matriz visual — superfícies (referência rápida)

| Contexto | Modo claro — alvo perceptivo | Modo escuro |
|----------|------------------------------|-------------|
| Cartão sobre página | Contorno ≥ token ou equivalente sólido; não “derreter” em `slate-100` | Manter legibilidade actual (`slate-700` típico); **NFR-VIS-THEME-04** |
| Toolbar admin | Mesma lógica de limite; fundo `slate-50/70` não anula borda | Sem regressão |
| Shell de tabela | Borda exterior do `rounded-xl` perceptível | Idem |
| Estado vazio (`admin-empty-state`) | `border-dashed` continua legível (ajustar cor, não só opacidade) | Idem |

---

## 5. Controlos: botão secundário e interruptor

### 5.1 Botão secundário (FR-VIS-THEME-07)

**Classe mínima:** `.planner-button-secondary` (e variantes `-compact`).

| Estado | Modo claro | Requisito |
|--------|------------|-----------|
| Repouso | Fundo branco/semi-opaco sobre `slate-100` ou cartão | **Borda** ou **fundo** distinguível do fundo imediato sem hover. |
| Hover / focus | — | Não remover o limite; `focus-visible` visível (alinhar a `.focus-ring` / anel azul em `index.css`). |

**Teste de aceite visual:** o botão deve ser reconhecível como **área clicável** em screenshot estático (sem hover).

### 5.2 Interruptor — especificação genérica (FR-VIS-THEME-08)

Aplica-se a qualquer controlo que **comporte** como interruptor de binário (tema, flags, etc.):

| Elemento | Modo claro — estado **off** | Estado **on** | A11y |
|----------|------------------------------|----------------|------|
| Trilho | Cor de fundo **distinta** do fundo da página **ou** **anel/borda** `1px` em tom ≥ token de borda | Preenchimento primário (ex. azul) claramente distinto | `role="switch"`, `aria-checked`, foco visível |
| Polegar (thumb) | Contraste suficiente face ao trilho | Posição traduz estado | — |

**Proibido para aceite:** trilho “off” apenas `bg-gray-300` sobre `slate-100` **sem** borda ou sombra que delimite o trilho, se a equipa reproduzir o problema de colagem documentado no brief.

### 5.3 Implementação conhecida — Definições › Aparência (prioridade QA)

O ecrã **`frontend/src/pages/Settings.tsx`** (secção “Aparência”) usa um **`<button>`** estilizado como toggle (não exposto como `role="switch"` no código actual). Para cumprir **FR-VIS-THEME-08** e boas práticas:

1. **Semântica:** expor `role="switch"`, `aria-checked={isDarkMode}`, `aria-label` descritivo (ex.: “Modo escuro activo” / alternância clara para leitores de ecrã).  
2. **Claro — off:** trilho com **borda** `1px` (ex. `border border-slate-400/80` ou tom alinhado ao token) **ou** fundo do trilho mais escuro que `gray-300` se mantiver só preenchimento.  
3. **Foco:** `focus-visible:outline-none` + anel coerente com `index.css` (ring azul + offset).  
4. **Área tocável:** manter ou exceder **44×44** px de alvo (o trilho `h-6 w-11` pode ficar dentro de um hit area maior).

---

## 6. Anti-padrões (varredura TSX)

| Anti-padrão | Acção |
|-------------|--------|
| `border-slate-200/80` repetido em contorno exterior sobre fundo `slate-100` | Substituir pelo par §3.2 ou `.ui-border-section` onde for só divisória; contornos de **caixa** alinhar a §3.3. |
| Dupla borda (wrapper + cartão) para “consertar” contraste | Remover wrapper; corrigir classe base (**LC3**). |

---

## 7. Fluxos prioritários para revisão manual

Ordem sugerida (PRD §4.2):

1. **Admin / planner:** vista com `.planner-card`, `.admin-toolbar`, `.admin-table-shell` (ex.: Definições com bloco admin, ou rota admin representativa).  
2. **Botão secundário:** `.planner-button-secondary` sobre página e sobre cartão.  
3. **Interruptor:** Definições › Aparência (toggle de tema).  
4. **Regressão escuro:** mesmos pontos em **tema escuro** (§9).

---

## 8. Acessibilidade e contraste (NFR-VIS-THEME-01)

1. **Quando verificar:** alterações a `border-*`, `bg-*` de trilhos de switch, e `text-*` em controlos tocáveis afectados.  
2. **Pares prioritários:** (fundo da página **vs** borda do cartão); (fundo do trilho **vs** borda do trilho); (thumb **vs** trilho); texto/ícone **vs** fundo do botão secundário.  
3. **Ferramenta:** WebAIM ou equivalente; registar ratio ou “pass AA” / correção.  
4. **Texto de UI** em tamanhos normais: alvo **WCAG 2.2 AA** onde aplicável.

---

## 9. Checklist — regressão tema escuro (NFR-VIS-THEME-04)

Executar **após** alterações focadas no claro; mesmo utilizador, mesmas rotas.

| # | Área | O que verificar | Passa? |
|---|------|-----------------|--------|
| R1 | Cartão + toolbar + tabela (mesma vista que §7.1) | Contornos e linhas **não** desapareceram nem ficaram “duplicados” | ☐ |
| R2 | Botão secundário | Limite/fundo **ainda** perceptíveis | ☐ |
| R3 | Toggle em Definições | Estados on/off **claros**; foco visível | ☐ |

**Critério:** nenhuma regressão **grave** (bloqueio de leitura ou controlo invisível). Disputas: screenshot + parecer UX (NFR-VIS-THEME-02 no spec-mãe).

---

## 10. Disciplina de PR (NFR-VIS-THEME-03)

- PRs **por tema** de ficheiro (ex.: só `index.css` + `Settings.tsx`) ou por **padrão** (só superfícies admin).  
- Evitar misturar refactor funcional com mass update de classes.  
- Documentar no PR o **par de borda** escolhido para o claro quando não for óbvio pelo diff.

---

## 11. Extensão do checklist global VIS-THEME (opcional no QA)

O checklist §8 do **spec-mãe** permanece a fonte da Onda 1. Para esta entrega, acrescentar **verificação explícita** nos itens **4–6** (Dashboard, Transações, Definições) com **zoom 100%** e **tema claro**, focando **bordas de cartão** e **secção Aparência** (toggle).

Sugestão de nota no relatório de QA: *“Onda claro — ux-spec-modo-claro-* (data) *— satisfeito / N/A”*.

---

## 12. Referências rápidas de ficheiros

| Área | Ficheiros |
|------|-----------|
| Tokens e classes | `frontend/src/index.css` |
| Toggle de tema (referência §5.3) | `frontend/src/pages/Settings.tsx` |
| Loja de tema | `frontend/src/store/themeStore.ts` |
| Segmented / bordas semelhantes | `frontend/src/components/mei/MeiFiscalEmissionTypeSegmented.tsx` |
| Acordeão / borda fraca candidata | `frontend/src/components/mei/MeiNfeLikeEmitForm.tsx` (`NfeLikeCollapsible`) |

---

## 13. Histórico

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-17 | Versão inicial derivada do PRD modo claro |
