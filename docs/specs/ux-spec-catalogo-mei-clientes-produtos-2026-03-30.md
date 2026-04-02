# Especificação de front-end e UX — Catálogo MEI (clientes e serviços/produtos)

**Versão:** 1.1  
**Data:** 2026-03-30  
**Autoria:** Uma (UX / design system — fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md`](../prd/PRD-catalogo-clientes-servicos-produtos-mei-2026-03-30.md)  
**Brief de apoio:** [`docs/brief/brief-area-cadastro-clientes-servicos-produtos.md`](../brief/brief-area-cadastro-clientes-servicos-produtos.md)  
**Implementação de referência (padrões):** `frontend/src/Layout/Sidebar.tsx`, `frontend/src/pages/Recorrencias.tsx`, `frontend/src/components/PageShell.tsx`, `frontend/src/pages/GuidesMei.tsx` (emissão + selects de catálogo), `frontend/src/services/meiNotasService.ts`  

---

## 1. Objetivo deste documento

Contrato de **experiência, estrutura de ecrã, comportamento, acessibilidade e *copy*** para as duas áreas dedicadas de **catálogo NFS-e** (clientes; serviços/produtos), alinhado ao PRD. Não substitui stories em `docs/stories/`; serve de base para critérios de aceite, *file list* e revisão QA.

**Fora desta spec:** contrato REST exato e campos obrigatórios por município (dependem do spike/backend) — aqui listam-se **campos UX** e estados; engenharia mapeia para payload real.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Paridade mental** | Utilizador reconhece “cadastro de clientes” e “cadastro de serviços” como nos ERPs/emissores, sem jargão interno (`nfseCatalog*` só em código). |
| **Uma fonte de verdade** | Lista e formulários refletem o mesmo catálogo que alimenta a emissão em Mei Infinito (FR-CAT-07). |
| **Feedback previsível** | Carregar, vazio, erro e sucesso são sempre explícitos; após guardar, lista atualiza sem exigir *hard refresh* (salvo limitação documentada). |
| **Consistência com o produto** | Reutilizar `PageShell`, `PageTitle`, botões `planner-button*`, toasts, padrão modal/lista de `Recorrencias.tsx` onde fizer sentido. |

---

## 3. Arquitetura de informação e navegação

### 3.1 Rotas sugeridas (a confirmar na story de roteamento)

| Rota canónica (proposta) | Ecrã | Notas |
|--------------------------|------|--------|
| `/mei-catalogo/clientes` | Lista + modal criar/editar cliente | Nome amigável na UI: **Clientes (NFS-e)** ou **Clientes para notas**. |
| `/mei-catalogo/servicos-produtos` | Lista + modal criar/editar item | UI: **Serviços e produtos** (subtítulo: “Itens do catálogo para NFS-e”). |

*Alternativa aceitável:* `/guias-mei/catalogo/clientes` se o produto quiser **aninhamento conceitual** exclusivamente na URL — a spec prefere rotas irmãs curtas para evitar confusão com o *workspace* interno de `GuidesMei`.

### 3.2 Menu lateral (`Sidebar.tsx`)

**Requisito PRD:** duas entradas **distintas** (FR-CAT-01).

**Proposta A (MVP, sidebar plana):** após “Mei Infinito”, inserir dois `Link`s condicionados ao mesmo `canAccessMeiArea` que hoje governa a entrada da área Mei Infinito:

1. **Clientes** → `/mei-catalogo/clientes` (ícone sugerido: `Users` ou `ContactRound` do `lucide-react`).  
2. **Serviços e produtos** → `/mei-catalogo/servicos-produtos` (ícone sugerido: `Package` ou `Briefcase`).

**Proposta B (agrupamento visual):** se no futuro o sidebar suportar secções, agrupar sob rótulo **MEI / Notas** com os três destinos: Mei Infinito, Clientes, Serviços e produtos. No MVP, se não houver componente de grupo, **Proposta A** cumpre o PRD.

**Estado ativo:** `location.pathname.startsWith('/mei-catalogo')` deve realçar o item correspondente sem marcar “Mei Infinito” como ativo (ajustar `isActive` se necessário para rotas irmãs).

### 3.3 Ligação contextual com a emissão

- Na página de **clientes** e na de **serviços/produtos**, bloco opcional (P1) no topo ou rodapé da `PageTitle`: texto do tipo *“Para emitir uma nota, use Mei Infinito → NFS-e.”* com `Link` para `/guias-mei` (o utilizador escolhe o *tab* NFS-e no destino; não é obrigatório deep-link ao *tab* na v1 desta spec).  
- Em `GuidesMei`, na área de emissão onde hoje existem os selects de catálogo (P1): link discreto *“Gerir clientes”* / *“Gerir serviços e produtos”* abrindo a rota dedicada em nova vista (mesma aba).

---

## 4. Guard e utilizador sem MEI

Alinhado à decisão de produto do PRD (ocultar + bloquear):

| Situação | Comportamento |
|----------|----------------|
| `canAccessMeiArea === false` | Não mostrar entradas de catálogo no sidebar. |
| Acesso direto à URL | `Navigate` para `/` ou página de *empty* com título **MEI não disponível**, texto curto e CTA para Configurações / suporte — **mesmo padrão** já usado para `/guias-mei` em `App.tsx` (reutilizar lógica). |

*Teste:* espelhar casos em `App.mei-gate.test.tsx` para as novas rotas.

---

## 5. Wireframes lógicos (baixa fidelidade)

### 5.1 Lista — Clientes (desktop ≥ md)

```text
┌─────────────────────────────────────────────────────────────────┐
│ [PageTitle] Clientes para NFS-e                                  │
│             Gerir tomadores usados na emissão de notas.           │
│  [Opcional: link → Mei Infinito]                                  │
├─────────────────────────────────────────────────────────────────┤
│ [Busca……………………………] debounce 300ms              [+ Novo cliente]   │
├─────────────────────────────────────────────────────────────────┤
│ Nome / razão social    │ Documento      │ E-mail        │ Ações   │
│────────────────────────┼────────────────┼───────────────┼─────────│
│ Maria Silva ME         │ 12.345.678/0001│ maria@…       │ Editar  │
│ …                      │ …              │ …             │ …       │
├─────────────────────────────────────────────────────────────────┤
│ [Carregar mais]  ou  paginação “Anterior | Seguinte”             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Lista — Serviços e produtos

```text
┌─────────────────────────────────────────────────────────────────┐
│ [PageTitle] Serviços e produtos                                   │
│             Itens do catálogo para NFS-e.                          │
├─────────────────────────────────────────────────────────────────┤
│ [Busca……………………………]                         [+ Novo item]          │
├─────────────────────────────────────────────────────────────────┤
│ Discriminação (resumo) │ CNAE │ Alíq. │ Valor sug. │ Código │ …  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Mobile

- **Barra de busca** full width; botão primário **Novo** fixo ou logo abaixo do título.  
- Tabela vira **lista de cartões** (stack): cada cartão com linhas chave + botão **Editar** à direita ou ícone `Pencil` com `aria-label`.

---

## 6. Componentes e comportamento

### 6.1 Shell e título

- `PageShell` + `PageTitle` com `subtitle` explicativo (uma linha).  
- Evitar títulos duplicados com “Mei Infinito”; estes ecrãs são **satélites** do ecossistema MEI.

### 6.2 Busca

- Campo `type="search"` com `aria-label` “Pesquisar clientes” / “Pesquisar serviços ou produtos”.  
- **Debounce** 300 ms antes de chamar API (NFR-CAT-02).  
- Estado **a pesquisar:** *skeleton* ou spinner inline no campo; não bloquear o teclado.  
- **Sem resultados:** `EmptyState` com mensagem neutra *“Nenhum resultado para «{query}».”* e botão limpar filtro.

### 6.3 Lista vazia (sem query)

- Ilustração ou ícone leve + título *“Ainda não há clientes no catálogo”* + CTA **Novo cliente** (análogo para produtos).  
- Microcopy opcional: *“Os dados aparecem aqui e na emissão de NFS-e.”*

### 6.4 Ações por linha (MVP listagem + extensão exclusão)

- **Editar:** ícone `Pencil` + texto em desktop se couber.  
- **Excluir** (fase 2 — PRD + UX): ver [`ux-spec-catalogo-mei-exclusao-2026-03-30.md`](ux-spec-catalogo-mei-exclusao-2026-03-30.md) (diálogo de confirmação, *copy* fiscal, lista e modal).  
- Área clicável mínima 44×44 px em *touch* por ação.

### 6.5 Modal criar / editar

- Reutilizar o **padrão** de `RecorrenciaModal`: overlay, foco preso, `Esc` fecha, botões **Cancelar** / **Guardar**.  
- Título dinâmico: *“Novo cliente”* / *“Editar cliente”* (idem para serviço/produto).  
- Em **edição**, desabilitar campos que a API marcar como imutáveis (ex.: `id`); se nenhum, todos editáveis conforme contrato.

### 6.6 Estados de persistência

| Estado | UI |
|--------|-----|
| Guardar | Botão **Guardar** com `aria-busy`, spinner ou texto “A guardar…”, formulário read-only ou campos desabilitados. |
| Sucesso | Fechar modal, `toast.success` com mensagem curta; **invalidar/refetch** da lista. |
| Erro | Mensagem no topo do modal ( `role="alert"` ) com texto amigável (FR-CAT-08); opcional `<details>` “Detalhes técnicos” para `message` do servidor **sem** dados sensíveis. |

### 6.7 Paginação / “Carregar mais”

- Se o GET usar `limit` fixo (ex.: 50), botão **Carregar mais** que acrescenta resultados ou incrementa página — preferir padrão já usado noutras listas do projeto; se não existir, **paginação simples** na base.

---

## 7. Formulários — campos UX (mapeamento aos tipos TS)

### 7.1 Cliente (`NfseCatalogCliente`)

| Campo UX | ID sugerido (`name`) | Obrigatório MVP | Validação UX | Ajuda |
|----------|----------------------|-----------------|--------------|--------|
| Nome / razão social | `nome` | Sim | Não vazio; limite exibido se API definir | — |
| CPF/CNPJ | `documento` | Sim | Normalizar dígitos; validação CPF/CNPJ igual ao resto da app | Máscara progressiva pt-BR |
| E-mail | `email` | Não | Formato RFC5322 simplificado se preenchido | — |
| Tipo de documento fiscal | `document_type` | Conforme API | Se sempre NFS-e no MVP, pode ser fixo oculto ou select | Só mostrar se necessário ao utilizador |

*Campos em `metadata_json`:* não expor no MVP salvo requisito explícito; caso contrário, secção **Avançado** colapsada na fase 2.

### 7.2 Serviço / produto (`NfseCatalogProduto`)

| Campo UX | ID sugerido | Obrigatório MVP | Ajuda |
|----------|-------------|-----------------|--------|
| Discriminação (descrição do serviço) | `discriminacao` | Sim | Texto que aparece na nota |
| CNAE | `cnae` | Conforme spike | Placeholder com formato esperado |
| Alíquota (%) | `aliquota` | Conforme spike | `input` numérico; locale pt-BR |
| Valor sugerido (R$) | `valor_sugerido` | Não | Formatação monetária na visualização |
| Código interno | `codigo` | Não | Opcional para organização |

### 7.3 Acessibilidade dos formulários (NFR-CAT-03)

- Cada input com `<label htmlFor=…>` visível.  
- Erros por campo: `aria-describedby` apontando para texto de erro; primeiro campo com erro recebe foco ao submeter.  
- Ordem de tab lógica: cabeçalho modal → campos → ações.

---

## 8. Design system e tokens

- **Botões primários:** `planner-button` (como em Recorrências).  
- **Secundários / fechar:** `planner-button-secondary` ou equivalente já usado em modais.  
- **Alertas:** mesmas classes de erro que `Recorrencias.tsx` (`border-red-200`, `dark:` variants).  
- **Tabela:** cabeçalho `text-sm font-semibold`, linhas zebradas opcionais alinhadas a tabelas existentes em `ManageUsers` / admin.  
- **Não** introduzir novo tema; respeitar CR-CAT-03.

---

## 9. Conteúdo (*copy*) — referência

| Contexto | Texto sugerido (pt-BR) |
|----------|-------------------------|
| Toast criar cliente | *Cliente adicionado ao catálogo.* |
| Toast atualizar | *Alterações guardadas.* |
| Erro genérico API | *Não foi possível guardar. Verifique os dados e tente novamente.* |
| Erro validação documento | *CPF ou CNPJ inválido.* |
| Guard rota | *Esta área está disponível quando o MEI está ativo na sua conta.* |

Ajustar tom com *content design* / PO se houver guia de voz.

---

## 10. Sincronização com emissão (`GuidesMei`)

- Após `POST`/`PATCH` bem-sucedido, o utilizador ao voltar a Mei Infinito → NFS-e deve ver o registo nos **selects** ou na **busca** de catálogo.  
- **Implementação recomendada (UX):** ao montar os selects na emissão, **refetch** do catálogo quando a página ganha foco (`visibilitychange` ou `useLocation` key) **ou** *cache* invalidado por evento global leve — a escolha é técnica; a spec exige **comportamento perceptível** sem F5 obrigatório.  
- Se a única solução viável for refetch ao entrar no *tab* NFS-e, documentar na story como aceite.

---

## 11. Mapeamento PRD → esta spec

| PRD | Secção desta spec |
|-----|-------------------|
| FR-CAT-01 | §3.1–3.2 |
| FR-CAT-02 | §5.1, §6.2–6.3 |
| FR-CAT-03 | §7.1, §9 |
| FR-CAT-04 | §6.5–6.6 |
| FR-CAT-05 | §5.2, §6.2 |
| FR-CAT-06 | §7.2 |
| FR-CAT-07 | §10 |
| FR-CAT-08 | §6.6 |
| FR-CAT-09 | §6.7 + ordenação por coluna opcional (P2) |
| NFR-CAT-01 | §4 |
| NFR-CAT-02 | §6.2, §6.7 |
| NFR-CAT-03 | §7.3, §8 |
| CR-CAT-03 | §8 |

---

## 12. Checklist de QA (UX)

1. Sidebar: com MEI, aparecem **duas** entradas; sem MEI, **não** aparecem.  
2. Busca: não dispara requisição a cada tecla; resultados coerentes com backend.  
3. Criar e editar: teclado apenas, sem rato, consegue percorrer e submeter.  
4. Leitor de ecrã: título da página e do modal anunciados; erros ligados aos campos.  
5. Dark mode: contraste de tabela, inputs e modal aceitável (WCAG AA como objetivo).  
6. Após guardar, lista mostra dados atualizados; emissão mostra novo registo após fluxo acordado em §10.

---

## 13. Registo de alterações

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-03-30 | Versão inicial a partir do PRD de catálogo MEI. |
| 1.1 | 2026-03-30 | §6.4 — ponte para spec de **exclusão** [`ux-spec-catalogo-mei-exclusao-2026-03-30.md`](ux-spec-catalogo-mei-exclusao-2026-03-30.md). |

---

**Documento vivo:** atualizar rotas finais, nomes de menu e campos obrigatórios após spike de API e revisão PO.
