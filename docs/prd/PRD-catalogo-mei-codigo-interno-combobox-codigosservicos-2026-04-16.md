# PRD — Catálogo MEI: combobox pesquisável para **Código interno** (`codigosservicos`)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Tipo:** Brownfield — evolução de UX e leitura de dados de referência (frontend + backend / dados)  
**Fonte canónica:** [`docs/brief/brief-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../brief/brief-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md)

**Relação com PRD principal:** complementa [`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](./PRD-meu-financeiro-produto-brownfield-2026-03-26.md) no âmbito do catálogo de serviços/produtos para NFS-e. Não altera por si só as regras fiscais de emissão; introduz **seleção assistida** de código a partir de tabela de referência e **novo contrato de leitura** (pesquisa), a definir em detalhe técnico por `@architect`.

---

## 1. Resumo executivo

No modal **Novo serviço ou produto** / **Editar serviço ou produto** (`MeiCatalogoProdutoModal`), o campo opcional **Código interno** deixa de ser entrada de texto livre e passa a um **combobox com filtro dinâmico** alimentado pela tabela PostgreSQL `public.codigosservicos` (`codigo`, `descricao`). O valor persistido no catálogo do utilizador continua a ser o campo **`codigo`** (paridade com `POST/PATCH /catalogo/produtos`), salvo decisão explícita futura de expandir o modelo de dados.

Este PRD fixa **objetivos de produto**, **requisitos funcionais e não funcionais**, **métricas**, **riscos**, **critérios de release** e **delegação de backlog** (epic → stories via `@sm`), para execução alinhada ao brief e aos quality gates do repositório.

---

## 2. Visão de produto

O MEI (ou contador) ao preparar itens reutilizáveis para NFS-e deve **encontrar o código de serviço correto sem memorizar códigos**, com **feedback visual claro** (código + descrição) e **opcionalidade** preservada: pode guardar o item sem código interno. A experiência deve ser **consistente com o tema escuro** e com os padrões já usados no modal (`planner-card`, `planner-input-compact`, foco e contraste).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| Entrada | Texto livre aumenta erro de digitação e inconsistência. | Lista filtrável a partir de `codigosservicos`. |
| Descoberta | Utilizador não vê descrições oficiais ao escolher o código. | Exibir **código** e **descrição** na lista (e suporte a tooltip/título para texto longo). |
| Fiscal | Códigos incorretos prejudicam emissão ou validações downstream. | Aproximar a escolha a dados de referência mantidos na base (compatibilidade com validações de emissão a validar em engenharia/QA). |

---

## 4. Personas e cenários

| Persona | Necessidade | Cenário de validação |
|---------|-------------|----------------------|
| MEI autónomo | Escolher código sem consultar PDF externo. | Abrir “Novo serviço”, pesquisar por palavra da descrição, selecionar, guardar. |
| Utilizador recorrente | Corrigir ou trocar código num item existente. | Editar produto; alterar ou limpar código; guardar sem regressão nos outros campos. |
| Operações / suporte | Prever comportamento com dados legados. | Item com `codigo` que não existe em `codigosservicos`: UI e gravação previsíveis (ver FR-CAT-COD-06). |

**Stakeholders:** Produto (escopo), UX (padrão de combobox), Engenharia (BFF/dados), QA (regressão catálogo + emissão quando código preenchido), Dados (povoamento/índices da referência).

---

## 5. Escopo

### 5.1 Dentro do escopo

- Substituir o `<input>` de **Código interno** por **combobox pesquisável** no `MeiCatalogoProdutoModal`.
- **API de pesquisa** (ou contrato equivalente) sobre `codigosservicos` com parâmetros `q` opcional e `limit` com teto, retorno `{ codigo, descricao }[]` ordenado de forma previsível.
- Comportamentos: debounce, estados de carregamento e vazio, limpar seleção, limite de resultados por pedido.
- **Modo edição:** refletir código atual; tratar código presente no catálogo mas ausente da tabela de referência (comportamento mínimo definido em FR-CAT-COD-06).
- Acessibilidade mínima (rótulo, foco, teclado conforme componente).
- Tema escuro e consistência com o modal existente.

### 5.2 Fora do escopo

- Importação em massa ou pipeline de sincronização automática com API externa de prefeitura para `codigosservicos` (história separada).
- Preencher automaticamente o campo **Discriminação** a partir da `descricao` selecionada (melhoria futura opcional).
- Alteração do modelo de persistência do catálogo além do campo `codigo` já usado (salvo spike aprovado).
- Redesign global do design system.

---

## 6. Requisitos funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-CAT-COD-01 | Ao interagir com o controlo (foco e/ou digitação), o sistema obtém resultados de `codigosservicos` filtrados pelo texto de pesquisa. | Must |
| FR-CAT-COD-02 | A pesquisa considera **código** e **descrição**; normalização de maiúsculas/minúsculas e acentos deve seguir o padrão já usado noutras buscas do produto ou decisão documentada em ADR técnica. | Must |
| FR-CAT-COD-03 | Cada opção na lista apresenta **código** e **descrição** (com truncagem visual se necessário e texto completo acessível via `title` ou equivalente). | Must |
| FR-CAT-COD-04 | Ao selecionar uma linha, o valor persistido como código interno do item do catálogo é o **`codigo`** da linha. | Must |
| FR-CAT-COD-05 | O utilizador pode **limpar** a seleção, equivalente a código interno vazio (paridade com o comportamento atual de input vazio). | Must |
| FR-CAT-COD-06 | Em **edição**, se o `codigo` guardado existir em `codigosservicos`, mostrar código e descrição de referência; se **não** existir (legado), mostrar pelo menos o código armazenado e permitir substituir via pesquisa ou limpar — sem perder a possibilidade de guardar. | Must |
| FR-CAT-COD-07 | Debounce na pesquisa (faixa sugerida no brief: 200–400 ms); valor final ajustado se testes de performance indicarem necessidade. | Must |
| FR-CAT-COD-08 | Estados de **carregamento** e **lista vazia** (“Nenhum resultado”) com copy curta em português. | Must |
| FR-CAT-COD-09 | Resultados limitados por pedido (teto configurável; faixa indicativa 20–50) com lista rolável; não carregar a tabela inteira no cliente de uma só vez. | Must |
| FR-CAT-COD-10 | O envio do formulário mantém compatibilidade com `meiNotasService`: `codigo` como string ou omitido quando vazio; sem regressão em discriminação (obrigatória), CNAE, alíquota e valor sugerido. | Must |

---

## 7. Requisitos não funcionais

| ID | Requisito | Notas |
|----|-----------|--------|
| NFR-CAT-01 | **Performance** | Consultas eficientes; índices ou estratégia de busca adequada ao volume (decisão técnica). |
| NFR-CAT-02 | **Segurança** | Leitura de dados de referência apenas para utilizadores autorizados conforme política do produto (ex.: autenticado + MEI habilitado, alinhado às rotas existentes do catálogo). SQL parametrizado; `limit` máximo no servidor. |
| NFR-CAT-03 | **Consistência de UI** | Reutilizar componente de combobox já adotado no projeto quando existir; dark mode coerente com o modal. |
| NFR-CAT-04 | **Acessibilidade** | Teclado (setas, Enter, Escape conforme padrão do componente); foco visível; associação label/controlo. |
| NFR-CAT-05 | **Qualidade de código** | `npm run lint`, `npm run typecheck`, `npm test` nos pacotes alterados; testes de rota/serviço conforme padrão do backend. |
| NFR-CAT-06 | **Observabilidade (opcional)** | Métrica ou log de falhas da API de pesquisa sem PII. |

---

## 8. Modelo de dados de referência (imutável neste PRD)

Tabela `public.codigosservicos`:

- `codigo` `varchar(10)` NOT NULL, PK  
- `descricao` `text` NULL  

Povoamento e migrações são pré-requisito operacional; se a tabela estiver vazia em algum ambiente, o produto deve degradar com **lista vazia** e mensagem clara (sem erro não tratado).

---

## 9. Contrato de API (lógico; detalhe de implementação em `@architect`)

**Entrada sugerida:** `q` (string opcional), `limit` (inteiro positivo com máximo definido no servidor).  
**Saída sugerida:** array de `{ codigo: string, descricao: string | null }`, ordenação estável (ex.: por `codigo`).

A fronteira exata (REST no BFF vs RPC Supabase) não é fixada neste PRD; deve ser documentada na story técnica ou ADR.

---

## 10. Métricas de sucesso

| Objetivo | Métrica / evidência |
|----------|---------------------|
| Eficiência na seleção | Em teste interno ou moderado: ≥ 80 % dos participantes conseguem **selecionar um código** a partir da descrição em ≤ 3 tentativas de busca (cenário guiado). |
| Redução de erro | Redução qualitativa de suportes do tipo “código errado no catálogo” (baseline a recolher se existir canal). |
| Robustez | Taxa de erro 5xx na rota de pesquisa &lt; limiar acordado com operações após estabilização; lista vazia tratada sem *crash*. |
| Regressão | Zero regressões bloqueantes nos testes automatizados existentes do catálogo e fluxo de criação/edição de produto. |

---

## 11. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Grande volume em `codigosservicos` | Lentidão ou timeouts | Índices / `pg_trgm` / paginação; cap agressivo de `limit`; revisão por `@data-engineer`. |
| Códigos legados fora da referência | Confusão na edição | FR-CAT-COD-06; copy curta; QA de borda. |
| Desalinhamento com validação na emissão NFS-e | Emissão falha após catálogo “correto” na UI | Spike curto entre backend e QA; alinhar amostra de códigos da tabela com regras existentes em `mei-notas.service.js` (sem inventar regra nova fora de artefactos). |
| Abuso de pesquisa | Carga no DB | Debounce + rate limit / cap no servidor. |

---

## 12. Priorização (MoSCoW)

| Bucket | Itens |
|--------|--------|
| **Must** | FR-CAT-COD-01 a FR-CAT-COD-10; NFR-CAT-02, NFR-CAT-05 |
| **Should** | NFR-CAT-01, NFR-CAT-03, NFR-CAT-04 |
| **Could** | NFR-CAT-06 (observabilidade) |
| **Won’t (neste release)** | Autopreencher discriminação; import em massa; sync externo automático |

---

## 13. Critérios de release

1. Todos os requisitos **Must** verificados em ambiente de revisão (staging ou equivalente).
2. Critérios de aceite do brief reproduzidos como checklist na story (pesquisa, seleção, limpar, edição legada, tema escuro).
3. Quality gates do repositório verdes nos pacotes alterados.
4. QA assina regressão do modal de catálogo e smoke do endpoint de pesquisa (incluindo 401/403 conforme política de auth).

---

## 14. Dependências e próximos passos

| Área | Ação |
|------|------|
| **@architect** | Fronteira técnica, índices, contrato HTTP/RPC, RLS se aplicável. |
| **@sm** | Criar epic (opcional) e **story(ies)** em `docs/stories/` com acceptance criteria ligados a FR-CAT-COD-* e file list (`MeiCatalogoProdutoModal.tsx`, `meiNotasService.ts`, rotas/serviço backend, migrações se necessário). |
| **@dev** | Implementação incremental; testes alinhados aos padrões existentes (`mei-notas-catalog-*`, etc.). |
| **@qa** | Plano: rede lenta, zero resultados, código legado, limite `varchar(10)`, regressão emissão quando código preenchido. |

**Gate de delegação (produto):** este PRD define o **o quê**; o **como** técnico detalhado fica nas stories e no desenho do `@architect`, sem expandir requisitos além do brief sem novo artefacto.

---

## 15. Referências

- [`docs/brief/brief-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md`](../brief/brief-catalogo-mei-codigo-interno-combobox-codigosservicos-2026-04-16.md)  
- [`docs/brief/brief-area-cadastro-clientes-servicos-produtos.md`](../brief/brief-area-cadastro-clientes-servicos-produtos.md)  
- [`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`](./PRD-meu-financeiro-produto-brownfield-2026-03-26.md)  
- `frontend/src/components/MeiCatalogoProdutoModal.tsx`  
- `frontend/src/services/meiNotasService.ts`  
- `backend/src/routes/mei-notas.routes.js`  
- `backend/src/services/mei-notas.service.js`  

---

— *PRD pronto para desdobramento em epic/stories e implementação.*
