# Especificação de front-end e UX — Catálogo MEI: **Código interno** (combobox `codigosservicos`)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Autoria:** Uma (UX / design system — fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md)  
**Brief de apoio:** [`docs/brief/brief-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../brief/brief-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md)  

**Implementação de referência (padrões existentes):**

- `frontend/src/components/MeiCatalogoProdutoModal.tsx` — modal alvo; campo atual `mei-cat-prod-cod`.  
- `frontend/src/components/admin/AdminMeiCatalogProdutoCombobox.tsx` — **padrão de combobox** já usado no produto (debounce, lista, teclado, tema); a nova peça deve **alinhar comportamento e densidade visual**, adaptando dados para `{ codigo, descricao }` da referência nacional.  

**Relação com outras specs:** complementa [`ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md`](ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md) na secção de modal criar/editar serviço/produto; não duplica navegação nem listagens de página.

---

## 1. Objetivo deste documento

Contrato de **experiência, estados de UI, interação, acessibilidade, *copy* e ligação aos requisitos FR-CAT-COD-*** para substituir o input de texto **Código interno (opcional)** por um **combobox pesquisável** no `MeiCatalogoProdutoModal`. Não substitui stories em `docs/stories/`; serve de base para critérios de aceite, *file list* e QA.

**Fora desta spec:** contrato HTTP final, nome da rota e política RLS (ver `@architect`). Aqui assume-se apenas **entrada `q` + `limit`** e **lista `{ codigo, descricao }[]`**, como no PRD.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Orientação por descrição** | O utilizador pode encontrar o código escrevendo palavras da **descrição** ou o próprio **código** (FR-CAT-COD-02). |
| **Dupla leitura** | Cada opção mostra **código** e **descrição** de forma legível; descrições longas podem truncar com acesso ao texto completo (FR-CAT-COD-03). |
| **Opcionalidade explícita** | O campo continua opcional: deve ser óbvio como **deixar vazio** (limpar seleção) (FR-CAT-COD-05). |
| **Paridade com o modal** | Mesmas classes base (`planner-card`, `planner-input-compact`), hierarquia de labels e erros já usada nos campos vizinhos. |
| **Sem surpresas na gravação** | O valor enviado ao guardar continua a ser o **`codigo`** selecionado ou vazio (FR-CAT-COD-04, FR-CAT-COD-10). |

---

## 3. Contexto de ecrã

| Elemento | Valor |
|----------|--------|
| **Contentor** | Modal “Novo serviço ou produto” / “Editar serviço ou produto” (`role="dialog"`, `aria-labelledby` já definidos). |
| **Posição do campo** | Após **Discriminação**; antes de **CNAE** (ordem atual em `MeiCatalogoProdutoModal.tsx`). |
| **Largura** | Largura útil `max-w-md` do cartão; o painel do combobox não deve ultrapassar a largura do modal (lista alinhada ao gatilho). |

---

## 4. Wireframe lógico (baixa fidelidade)

### 4.1 Estado — fechado, sem seleção

```text
┌ Código interno (opcional) ─────────────────────────────────────┐
│ [ Pesquisar código ou descrição…                    ] [ ⌄ ]   │
└────────────────────────────────────────────────────────────────┘
   (placeholder neutro; ícone ⌄ ou chevron alinhado à direita)
```

### 4.2 Estado — lista aberta com resultados

```text
┌ Código interno (opcional) ─────────────────────────────────────┐
│ consultoria█                                                  │
├────────────────────────────────────────────────────────────────┤
│ ┌ 01.01 · Consultoria em tecnologia da informação… (trunc.)  │  ← highlight
│ │ 01.02 · Outra descrição…                                      │
│ │ … (scroll se > N linhas)                                       │
│ └──────────────────────────────────────────────────────────────│
└────────────────────────────────────────────────────────────────┘
```

**Layout sugerido por linha:** primário **código** (estilo `tabular-nums` ou mono suave) + separador tipográfico (` · ` ou ` — `) + **descrição** em peso normal; uma linha; truncagem com reticências + `title` com texto completo (FR-CAT-COD-03).

### 4.3 Estado — seleção confirmada (campo fechado)

```text
┌ Código interno (opcional) ─────────────────────────────────────┐
│ 01.01 · Consultoria em tecnologia da informação…    [ ✕ limpar ]│
└────────────────────────────────────────────────────────────────┘
```

- **Limpar:** botão `type="button"` ou ícone com `aria-label="Limpar código interno"`; não confundir com “fechar modal”.

### 4.4 Estado — edição com código legado (não existe em `codigosservicos`)

```text
┌ Código interno (opcional) ─────────────────────────────────────┐
│ 99.99 · (código não encontrado na lista atual)      [ ✕ limpar ]  │
└────────────────────────────────────────────────────────────────┘
```

**Copy obrigatória (subtexto opcional abaixo do campo, uma linha):**  
*“Este código não consta na lista de referência. Podes substituir pesquisando ou limpar.”*  
(Implementação pode usar só o texto entre parênteses na linha principal se o espaço for curto; FR-CAT-COD-06.)

---

## 5. Comportamento detalhado

### 5.1 Abrir lista

- **Ao focar** no gatilho: abrir lista e disparar pedido com `q` vazio ou mínimo conforme decisão técnica (FR-CAT-COD-01).  
- **Alternativa aceitável:** primeiro foco só posiciona cursor; lista abre ao primeiro carácter ou ao clique no chevron — desde que o PRD “interagir (foco e/ou digitação)” seja cumprido em revisão conjunta com QA.

### 5.2 Pesquisa e debounce

- **Debounce:** 300 ms alinhado a `AdminMeiCatalogProdutoCombobox` e à spec do catálogo (intervalo PRD: 200–400 ms); ajustar só com evidência de performance (FR-CAT-COD-07).  
- Cada alteração do texto de filtro após debounce dispara novo pedido com `q` atual.

### 5.3 Resultados e limite

- **Limite** exibido: até ao máximo devolvido pelo servidor (faixa indicativa PRD 20–50); lista com **scroll vertical** dentro de altura máxima (ex.: `max-h-48` a `max-h-60`, a validar visualmente no modal).  
- Se o backend devolver menos que o limite e ainda assim houver muitos itens, o scroll resolve (FR-CAT-COD-09).

### 5.4 Seleção

- **Clique** numa linha: fecha lista, preenche estado com `codigo` selecionado, mostra rótulo resumido (código + descrição truncada).  
- **Enter** na linha destacada: idem.  
- **Escape:** fecha lista sem alterar seleção já confirmada; se lista aberta sem seleção prévia, comportamento igual (não limpar seleção anterior por acidente).

### 5.5 Limpar

- Remove seleção; valor persistido no formulário equivalente a **código vazio** (FR-CAT-COD-05).  
- Foco permanece no controlo ou passa para o campo seguinte conforme implementação, sem fechar o modal.

### 5.6 Carregamento

- Enquanto `loading`: indicador **inline** no campo ou na lista (spinner pequeno / texto “A carregar…” na primeira linha da lista). **Não** bloquear discriminação nem outros campos (FR-CAT-COD-08).  
- **Lista vazia** após resposta: mensagem *“Nenhum resultado.”* (variante com query: *“Nenhum resultado para «{query}».”* se `q` não vazio).

### 5.7 Erro de rede / API

- Mensagem curta sob o campo ou dentro da lista: *“Não foi possível carregar os códigos. Tenta novamente.”*  
- **Não** usar `alert` nativo; preferir padrão do modal (`UserFacingErrorBlock` pode permanecer reservado a erros de **guardar**; erro de pesquisa pode ser **inline** no campo para não competir com o bloco global).  
- Em erro: lista vazia ou estado de retry (botão **Tentar novamente** opcional, P1).

---

## 6. Acessibilidade (NFR-CAT-04)

| Requisito | Implementação sugerida |
|-----------|-------------------------|
| Rótulo | Manter `<label htmlFor>` coerente com o gatilho; se o `id` mudar para um botão composto, usar `aria-labelledby` ou associar label ao `input` visível. |
| Lista | `role="listbox"` / `role="option"` **ou** padrão equivalente do componente (ex.: combobox WAI-ARIA 1.2); item destacado com `aria-selected`. |
| Teclado | ↑/↓ alteram destaque; Enter confirma; Esc fecha; Tab sai do controlo de forma previsível. |
| Foco | Anel de foco visível em modo escuro (`focus-visible`); contraste ≥ objetivo WCAG 2.1 AA nos textos do painel. |
| Leitor de ecrã | Ao abrir lista, anunciar número de resultados se trivial; ao selecionar, anunciar código escolhido. |

---

## 7. Design system e classes

| Aspeto | Orientação |
|--------|------------|
| **Input / gatilho** | `planner-input-compact w-full`; altura mínima alinhada aos outros inputs do modal. |
| **Painel da lista** | Fundo alinhado a `planner-card` / superfície modal: `bg-white dark:bg-slate-900` ou token já usado em overlays internos; borda `border-slate-200 dark:border-slate-700`; sombra discreta se o resto do app usar em dropdowns. |
| **Item** | Padding horizontal/vertical confortável (mín. ~40 px altura de linha tocável em mobile dentro do modal). |
| **Código** | `tabular-nums` opcional; não usar fonte menor que 14 px efectivos para o código. |
| **Estado highlight** | `bg-slate-100 dark:bg-slate-800` (ou equivalente já usado em listas do projeto). |

---

## 8. *Copy* (português de Portugal)

| Contexto | Texto |
|----------|--------|
| Label | **Código interno** *(opcional)* — manter como hoje. |
| Placeholder (gatilho vazio) | **Pesquisar código ou descrição…** |
| Lista a carregar | **A carregar…** |
| Sem resultados | **Nenhum resultado.** |
| Sem resultados (com texto) | **Nenhum resultado para «{query}».** |
| Limpar | **Limpar** ou ícone × com `aria-label="Limpar código interno"`. |
| Legado (helper) | **Este código não consta na lista de referência. Podes substituir pesquisando ou limpar.** |
| Erro de carga | **Não foi possível carregar os códigos. Tenta novamente.** |

---

## 9. Rastreabilidade PRD → UX

| FR | Secção(ões) desta spec |
|----|------------------------|
| FR-CAT-COD-01 | §5.1, §5.2 |
| FR-CAT-COD-02 | §2, §5.2 |
| FR-CAT-COD-03 | §4.2, §7 |
| FR-CAT-COD-04 | §5.4, §2 |
| FR-CAT-COD-05 | §4.3, §5.5 |
| FR-CAT-COD-06 | §4.4, §8 |
| FR-CAT-COD-07 | §5.2 |
| FR-CAT-COD-08 | §5.6, §8 |
| FR-CAT-COD-09 | §5.3 |
| FR-CAT-COD-10 | §2, §10 |

---

## 10. Critérios de aceite UX (checklist para QA)

1. Com tema escuro, label, campo, lista e estados de foco/highlight são legíveis sem sobreposição para fora do modal.  
2. Utilizador conclui **selecionar → guardar → reabrir edição** e vê o mesmo código e descrição de referência quando existir na tabela.  
3. Utilizador consegue **limpar** e guardar item sem código interno.  
4. Caso legado (código não na lista): UI mostra aviso conforme §4.4 / §8 e permite substituir ou limpar sem bloquear **Guardar**.  
5. Teclado: navegação na lista e Esc não fecham o modal acidentalmente (comportamento do modal existente mantido).  
6. Debounce perceptível: não dispara pedido a cada tecla sem intervalo (validação qualitativa ou log em dev).

---

## 11. Dependências e notas para engenharia

- Extrair um componente reutilizável (ex.: `MeiCodigoServicoCombobox`) **ou** estender o padrão de `AdminMeiCatalogProdutoCombobox` com props de fonte de dados e layout de linha — decisão `@dev`; esta spec fixa **comportamento e aparência**, não o nome do ficheiro.  
- Serviço HTTP dedicado no frontend: função em `meiNotasService.ts` (ou módulo adjacente) alinhada ao contrato acordado com o backend.  
- Testes: seguir padrão de `AdminMeiCatalogProdutoCombobox.test.tsx` para interações críticas (abrir, filtrar, selecionar, limpar).

---

## 12. Referências

- [`docs/prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../prd/PRD-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md)  
- [`docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md`](ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md)  
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`  
- `frontend/src/components/admin/AdminMeiCatalogProdutoCombobox.tsx`  

---

— *Especificação UX pronta para story, implementação e QA.*
