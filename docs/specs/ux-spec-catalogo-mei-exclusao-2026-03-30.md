# Especificação de front-end e UX — Exclusão no catálogo MEI (clientes e serviços/produtos)

**Versão:** 1.0  
**Data:** 2026-03-30  
**Autoria:** Uma (UX / design system — fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md`](../prd/PRD-catalogo-mei-exclusao-clientes-produtos-2026-03-30.md)  
**Spec irmã (lista e modais):** [`docs/specs/ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md`](ux-spec-catalogo-mei-clientes-produtos-2026-03-30.md)  
**Implementação de referência:** `frontend/src/pages/MeiCatalogoClientes.tsx`, `MeiCatalogoServicosProdutos.tsx`, `MeiCatalogoClienteModal.tsx`, `MeiCatalogoProdutoModal.tsx`, `frontend/src/pages/GuidesMei.tsx`

---

## 1. Objetivo deste documento

Contrato de **experiência, estrutura, *copy*, acessibilidade e estados** para **excluir** registos do catálogo NFS-e (clientes; serviços/produtos), sem duplicar a spec de listagem/edição. Complementa a spec do catálogo (§6.4 da spec irmã previa “sem eliminar no MVP”; esta entrega cobre **FR-CAT-10 … FR-CAT-14**).

**Fora desta spec:** contrato HTTP exato, códigos 204/404 por entidade — assunto da story + validação de arquitetura (hard vs soft delete no PRD §6.3).

---

## 2. Princípios de UX (ação destrutiva)

| Princípio | Aplicação |
|-----------|-----------|
| **Clareza > velocidade** | Nunca eliminar sem um **passo de confirmação** dedicado; um toque/clique no ícone não apaga. |
| **Expectativa fiscal honesta** | Comunicar **remoção do atalho no catálogo**; **não** sugerir anulação ou apagamento de notas já emitidas (FR-CAT-13). |
| **Reversão implícita ausente** | Tratar a ação como **irreversível** na UI (salvo produto adoptar *soft delete* com “restaurar” em fase futura). |
| **Paridade com o restante MEI** | Mesmos *tokens*, `PageShell`, toasts e padrão modal já usados nas páginas de catálogo e em `Recorrencias`-like flows. |
| **NFR-CAT-08** | Foco preso no diálogo, `Esc` fecha sem eliminar, botão destrutivo claramente etiquetado. |

---

## 3. Arquitetura de informação e pontos de entrada

### 3.1 Onde a exclusão aparece

| Local | Descrição | Prioridade |
|-------|-----------|------------|
| **Lista (desktop e mobile)** | Nova ação por linha/cartão: **“Excluir”** ou ícone `Trash2` com `aria-label` explícito (ex.: *“Excluir cliente Maria Silva ME do catálogo”*). | P0 |
| **Modal criar/editar** | Zona **perigosa** no rodapé do modal de edição (não no fluxo de “Novo”): texto curto + botão **“Excluir do catálogo…”** que abre o **mesmo** diálogo de confirmação que a lista. | P0 (recomendado para descoberta após abrir edição) |

### 3.2 Navegação até ao catálogo

O utilizador pode chegar às páginas de catálogo pelos **links contextuais** em Mei Infinito / NFS-e (*Gerir clientes* / *Gerir serviços e produtos*) e URLs diretas, conforme implementação vigente. Esta spec **não** exige nova entrada global; apenas que o fluxo de exclusão seja **idêntico** em ambas as páginas de catálogo.

---

## 4. Wireframes lógicos

### 4.1 Lista — coluna / cartão com ações (após entrega)

**Desktop (tabela):**

```text
│ Nome … │ Documento │ … │ Ações                    │
│────────┼───────────┼───┼──────────────────────────│
│ Maria… │ 12.345…   │ … │ [Editar]  [Excluir]       │
```

**Mobile (cartão):**

```text
┌─────────────────────────────────────┐
│ Maria Silva ME                      │
│ 12.345.678/0001-90                  │
│ [Editar]            [Excluir]        │
└─────────────────────────────────────┘
```

- **Ordem visual sugerida:** primário cognitivo “Editar” à esquerda; **Excluir** à direita, estilo **ghost/outline** ou texto vermelho discretamente (`text-red-600` / `dark:text-red-400`), sem competir com “Novo”.
- **Área mínima tocável:** 44×44 px no alvo “Excluir”.

### 4.2 Diálogo de confirmação (obrigatório)

```text
┌─────────────────────────────────────────────────────┐
│ Excluir cliente do catálogo?                    [×] │
├─────────────────────────────────────────────────────┤
│ Este registo deixa de aparecer no catálogo e nos     │
│ atalhos da emissão de NFS-e. A ação não pode ser    │
│ desfeita aqui.                                      │
│                                                     │
│ Cliente: Maria Silva ME · 12.345.678/0001-90       │
│ (ou últimos dígitos se política de privacidade)     │
│                                                     │
│ Notas fiscais já emitidas não são anuladas por     │
│ esta ação.                                          │
├─────────────────────────────────────────────────────┤
│              [ Cancelar ]     [ Excluir do catálogo ]│
│                              (estilo destrutivo)    │
└─────────────────────────────────────────────────────┘
```

**Variante produto/serviço:** título *“Excluir item do catálogo?”*; corpo com **discriminação** (1–2 linhas truncadas) + **código** se existir.

### 4.3 Modal de edição — zona perigosa

```text
… campos do formulário …
─────────────────────────────────
Eliminar do catálogo
Remove este registo dos atalhos. Isto não anula notas já emitidas.
[ Excluir do catálogo… ]
```

- O botão abre o **mesmo** *overlay* de confirmação da §4.2 (não eliminar directamente ao clicar).

---

## 5. Comportamento e estados

### 5.1 Fluxo feliz

1. Utilizador aciona **Excluir** → abre diálogo; foco vai para o título do diálogo ou botão **Cancelar** (preferir **Cancelar** como primeiro foco para reduzir erro — *alternativa aceitável:* foco no título se o design system já fixar padrão para diálogos destrutivos).  
2. **Cancelar** ou **Esc** → fecha sem pedido à API; retorno de foco ao botão que abriu o diálogo.  
3. **Excluir do catálogo** → botões desabilitados, *spinner* ou texto “A eliminar…” no botão destrutivo (NFR duplo clique / PRD §13).  
4. Sucesso → fechar diálogo; se modal de edição estiver aberto, fechá-lo; `toast.success`; **refetch** da lista na página actual.  
5. Emissão NFS-e: o item **deixa de surgir** nos selects/atalhos após o mesmo mecanismo acordado para criar/editar (paridade **FR-CAT-12 / FR-CAT-07** — refetch ao separador / visibilidade / documentado na story).

### 5.2 Erros

| Situação | UX |
|----------|-----|
| Rede / 5xx | `toast.error` com *“Não foi possível eliminar. Tente novamente.”*; reabilitar botões. |
| 404 / não encontrado | *“Este registo já não existe ou foi removido.”* + refetch silencioso da lista. |
| 401 / sessão | Mensagem de sessão expirada (padrão app) + CTA voltar a iniciar sessão se existir. |

- Não mostrar **id** técnico ao utilizador na mensagem de erro salvo modo *dev*.

### 5.3 Idempotência percetível

Se o segundo pedido retornar “já apagado”, tratar como **sucesso de UI** (fechar diálogo, toast neutro *“Registo já não está no catálogo.”* ou silêncio + refetch) — alinhar com convenção backend (NFR-CAT-06).

---

## 6. Acessibilidade (checlist mínima)

- Diálogo com `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando ao título.  
- Botão destrutivo: texto **“Excluir do catálogo”** (não só ícone no passo final).  
- Ícone “Excluir” na lista: sempre com `aria-label` que inclui **nome ou discriminação** (truncado) para diferenciar linhas.  
- **Cancelar** visível antes do destrutivo na ordem de leitura (pt: LTR).  
- Contraste do texto de aviso e dos botões em **dark mode** (objectivo AA).

---

## 7. Design system e tokens

- **Botão destrutivo:** fundo `red-600` / hover `red-700`, texto branco; em dark, tons equivalentes já usados em alertas do projeto.  
- **Botão secundário no diálogo:** `planner-button-secondary` ou equivalente ao **Cancelar** do modal de recorrências.  
- **Zona perigosa no modal:** `border-t border-slate-200 dark:border-slate-700`, tipografia `text-sm text-slate-600 dark:text-slate-400`.  
- **Sem** novos componentes de marca; preferir extrair **`ConfirmDeleteDialog`** reutilizável apenas se reduzir duplicação entre clientes e produtos (decisão @dev).

---

## 8. Conteúdo (*copy*) — referência (pt-BR)

| Contexto | Texto sugerido |
|----------|------------------|
| Título diálogo (cliente) | *Excluir cliente do catálogo?* |
| Título diálogo (item) | *Excluir item do catálogo?* |
| Corpo (obrigatório) | *Este registo deixa de aparecer no catálogo e nos atalhos da emissão de NFS-e. A ação não pode ser desfeita aqui.* |
| Aviso fiscal (obrigatório FR-CAT-13) | *Notas fiscais já emitidas não são anuladas por esta ação.* |
| Botão destrutivo | *Excluir do catálogo* |
| Botão cancelar | *Cancelar* |
| Toast sucesso | *Cliente removido do catálogo.* / *Item removido do catálogo.* |
| Toast erro genérico | *Não foi possível eliminar. Tente novamente.* |
| Zona perigosa (modal) | *Eliminar do catálogo* + descrição de uma linha |

Afinar com PO / content design se existir guia de voz.

---

## 9. Sincronização com emissão (`GuidesMei`)

- O utilizador **não** deve precisar de F5 para deixar de ver o item eliminado nos atalhos, **no mesmo espírito** que §10 da spec do catálogo para criar/editar.  
- Estratégia técnica (refetch ao *tab* NFS-e, `visibilitychange`, etc.): **reutilizar** o mecanismo já implementado para FR-CAT-07; esta spec exige **comportamento perceptível** após `DELETE` bem-sucedido.

---

## 10. Variante *soft delete* (PRD §6.3-B)

Se a arquitectura adoptar `deleted_at`:

- A **lista** de catálogo continua **sem** mostrar arquivados no MVP.  
- *Não* é necessário badge “Arquivado” até decisão de produto P2.  
- O fluxo de confirmação e *copy* mantêm-se; apenas o verbo interno muda para *arquivar* se o PO quiser alinhar linguagem (opcional).

---

## 11. Mapeamento PRD → esta spec

| PRD | Secção |
|-----|--------|
| FR-CAT-10 | §3.1, §4.1–4.2, §5, §8 |
| FR-CAT-11 | Idem, variantes título/corpo |
| FR-CAT-12 | §5.1 passo 5, §9 |
| FR-CAT-13 | §2, §4.2, §8 |
| FR-CAT-14 | §5.2 |
| FR-CAT-15 | Fora de UI (servidor) |
| NFR-CAT-06 | §5.3 |
| NFR-CAT-07–10 | §5.1 (debounce N/A aqui), §6–§7 |

---

## 12. Checklist de QA (UX)

1. Exclusão **só** após diálogo; **Esc** e **Cancelar** não chamam API.  
2. Leitor de ecrã: título do diálogo e botões anunciados; rótulos das linhas distinguem qual registo se elimina.  
3. Duplo clique rápido no confirmar: no máximo um efeito visível coerente (lista sem duplicar toasts estranhos).  
4. Após sucesso, registo **desaparece** da lista sem *hard refresh*.  
5. Em Mei Infinito → NFS-e (fluxo acordado), registo eliminado **não** reaparece nos atalhos.  
6. Dark mode: diálogo legível; botão destrutivo não só a cor.  
7. Copy de **não anular notas** visível no diálogo (FR-CAT-13).

---

## 13. Registo de alterações

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-03-30 | Versão inicial a partir do PRD de exclusão; alinhamento à spec de catálogo existente. |

---

**Documento vivo:** actualizar após decisão final de *focus* no diálogo, *copy* aprovada pelo PO e convenção exata de toast em caso idempotente.
