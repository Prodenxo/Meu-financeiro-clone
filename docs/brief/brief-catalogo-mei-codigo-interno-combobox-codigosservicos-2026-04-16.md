# Brief: catálogo MEI — “Código interno” como combobox com filtro dinâmico (`codigosservicos`)

**Data:** 2026-04-16  
**Origem:** pedido de produto (Atlas / analista) — substituir o campo livre **Código interno (opcional)** no modal de novo/editar serviço ou produto por um **combobox pesquisável** alimentado pela tabela PostgreSQL `public.codigosservicos`.  
**Produto:** Meu Financeiro — catálogo de serviços/produtos reutilizáveis na emissão de NFS-e.

**Referências no repositório:**

- `frontend/src/components/MeiCatalogoProdutoModal.tsx` — campo atual `mei-cat-prod-cod` (input de texto) e envio de `codigo` em `criarCatalogoNfseProduto` / `atualizarCatalogoNfseProduto`.
- `frontend/src/services/meiNotasService.ts` — contrato `codigo` em `CriarCatalogoNfseProdutoInput` / `AtualizarCatalogoNfseProdutoInput`.
- `backend/src/routes/mei-notas.routes.js` — `POST/PATCH /catalogo/produtos` (auth + MEI habilitado).
- `backend/src/services/mei-notas.service.js` — persistência do catálogo e validações relacionadas a códigos de serviço na emissão (quando aplicável).
- [`docs/brief/brief-area-cadastro-clientes-servicos-produtos.md`](./brief-area-cadastro-clientes-servicos-produtos.md) — contexto do catálogo dedicado.

---

## 0. Resumo para stakeholders

- Hoje o utilizador **digita manualmente** o código interno; isso aumenta erro de digitação e dificulta alinhar com **lista oficial / tabela de referência** de códigos de serviço.
- A tabela `public.codigosservicos` (`codigo` PK `varchar(10)`, `descricao` `text`) deve ser a **fonte de seleção** apresentada num **dropdown com filtro ao digitar** (combobox), exibindo **código + descrição** para desambiguação.
- O valor gravado no item do catálogo continua sendo o campo **`codigo`** escolhido (paridade com o fluxo atual da API), salvo decisão explícita de expandir o modelo.

---

## 1. Resumo executivo

No modal **“Novo serviço ou produto”** / **“Editar serviço ou produto”**, o campo **Código interno (opcional)** deve deixar de ser um `<input>` texto isolado e passar a um **controlo tipo combobox**: o utilizador pode **filtrar em tempo real** os registos de `codigosservicos` e **selecionar** uma linha; opcionalmente pode **limpar** a seleção para manter o campo vazio.

A implementação deve respeitar o **tema escuro** e os padrões visuais já usados no modal (`planner-card`, `planner-input-compact`, tipografia e estados de foco).

---

## 2. Problema / oportunidade

| Aspeto | Situação atual | Desejado |
|--------|----------------|----------|
| Entrada de dados | Texto livre para `codigo` | Seleção guiada a partir de `codigosservicos` com busca |
| Descoberta | Utilizador precisa saber o código de cor | Lista filtrável mostra **código** e **descrição** |
| Consistência fiscal | Risco de código inválido ou formato incorreto | Aproximação a lista de referência mantida na base |

---

## 3. Estado atual (brownfield)

- **UI:** `MeiCatalogoProdutoModal` mantém estado local `codigo` e envia `codigo.trim()` ao backend; em criação, string vazia vira `undefined` no body.
- **API:** O backend já aceita `codigo` como string no catálogo; não existe hoje endpoint dedicado só para pesquisar `codigosservicos` no frontend.
- **Base de dados (referência solicitada):**

```sql
create table public.codigosservicos (
  codigo character varying(10) not null,
  descricao text null,
  constraint codigosservicos_pkey primary key (codigo)
) tablespace pg_default;
```

**Nota de alinhamento:** a emissão NFS-e no projeto aplica regras sobre códigos de serviço quando o código é usado no fluxo de emissão. O time de implementação deve **garantir** que códigos vindos desta tabela (ou o subset exposto ao utilizador) sejam **compatíveis** com essas regras, ou documentar exceções — sem reinventar requisitos fora dos artefatos; apenas **sinalizar** dependência para revisão em `@architect` / `@qa`.

---

## 4. Objetivos

1. Substituir o input simples de **Código interno** por um **combobox com filtro dinâmico** alimentado por `codigosservicos`.
2. Apresentar na lista resultados com **identificação clara**: pelo menos `codigo` + trecho de `descricao` (truncar visualmente se necessário, com título/tooltip para texto completo).
3. Manter o campo **opcional**: permitir **nenhuma seleção** (equivalente a vazio) e, se produto assim decidir, **editar** item já salvo mantendo ou alterando o código.
4. Preservar **acessibilidade** mínima: rótulo, foco, anúncio de erro, teclado (setas / Enter / Escape conforme padrão do componente escolhido).

---

## 5. Requisitos funcionais (proposta)

| ID | Descrição |
|----|-----------|
| RF-01 | Ao focar ou ao digitar no controlo, o sistema **consulta** registos de `codigosservicos` filtrados pelo texto (código e/ou descrição — ver RF-02). |
| RF-02 | A pesquisa deve cobrir **ambos** os campos `codigo` e `descricao` (normalização de acentos/caixa: **definir** na implementação, preferindo consistência com outras buscas do app). |
| RF-03 | O utilizador pode **selecionar** uma linha; o valor persistido no catálogo como `codigo` é o **`codigo`** da linha selecionada. |
| RF-04 | O utilizador pode **limpar** a seleção para deixar o código interno vazio. |
| RF-05 | Em modo **edição**, o controlo deve refletir o `codigo` atual do produto; se existir na tabela de referência, mostrar também a **descrição** correspondente; se não existir (dados legados), o time deve definir comportamento (ex.: mostrar só o código digitado + opção de trocar via busca). |
| RF-06 | **Debounce** na pesquisa para evitar requisições excessivas (intervalo sugerido: 200–400 ms; validar com UX/performance). |
| RF-07 | Estados de **carregamento** e **lista vazia** (“Nenhum resultado”) com copy curta em português. |
| RF-08 | Limite de resultados por pedido (ex.: 20–50) com mensagem ou scroll; evitar carregar a tabela inteira no browser de uma vez. |

---

## 6. Requisitos não funcionais

- **Performance:** consultas indexadas; avaliar índice em `descricao` ou busca full-text se o volume for alto (decisão em `@data-engineer` / `@architect`).
- **Segurança:** `codigosservicos` é dados de referência; definir se a leitura é **pública autenticada** (qualquer user logado) ou restrita — alinhado à política RLS do projeto. Não expor dados de outros utilizadores (não aplicável a esta tabela se for só referência global).
- **Consistência de UI:** reutilizar componente de combobox existente no monorepo (ex.: padrão shadcn Command + Popover, ou equivalente já adotado), com **dark mode** consistente com o modal atual.
- **Observabilidade:** opcional — log/métrica de falhas de API de pesquisa no BFF (sem PII).

---

## 7. Backend e dados (entregáveis sugeridos)

> Detalhe de stack (REST vs RPC Supabase direto) fica para `@architect`; abaixo está o **contrato lógico** mínimo.

1. **Endpoint ou função de leitura** que aceite `q` (string opcional) + `limit` (número capado), retornando lista `{ codigo, descricao }[]` ordenada de forma previsível (ex.: por `codigo`).
2. **Filtro SQL** seguro (parametrizado), por exemplo `codigo ilike` OU `descricao ilike` com wildcard, ou `pg_trgm` / unaccent se já estiverem disponíveis no projeto.
3. **Rate limit / cap de `limit`** no servidor para evitar abuso.
4. **Seed ou migração:** confirmar se a tabela `codigosservicos` já está populada em todos os ambientes; se não, documentar processo de carga (fora deste brief se for operação manual).

---

## 8. Frontend (entregáveis sugeridos)

1. Substituir o bloco do campo em `MeiCatalogoProdutoModal` (label **Código interno**) pelo combobox.
2. Integrar serviço HTTP (ou hook) para busca com debounce; tratar erro com padrão já usado no modal (`UserFacingErrorBlock` / mensagem inline no campo se preferido).
3. Garantir que o **submit** continua a enviar `codigo` compatível com `meiNotasService` (string ou omitido quando vazio).
4. Testes: pelo menos teste de componente ou e2e smoke para “abrir modal → pesquisar → selecionar → guardar” se o projeto já tiver padrão similar.

---

## 9. Critérios de aceitação (testáveis)

1. Com MEI habilitado, ao abrir **Novo serviço ou produto**, o campo **Código interno** permite **digitar para filtrar** e **escolher** um par código/descrição da lista.
2. Após guardar, o item na listagem do catálogo e em reedição mostra o **mesmo** `codigo` selecionado.
3. **Limpar** o campo resulta em produto **sem** código interno (comportamento equivalente ao atual com input vazio).
4. Não há regressão nos outros campos do formulário (discriminação obrigatória, CNAE, alíquota, valor sugerido).
5. Interface permanece legível no **tema escuro** (contraste e foco).

---

## 10. Fora de âmbito (sugerido)

- Importação em massa da tabela `codigosservicos` (assumir que já existe ou será tratada em história separada).
- Sincronização automática com API externa de prefeitura.
- Preencher automaticamente **Discriminação** a partir da `descricao` selecionada — **pode** ser melhoria futura; este brief não a exige.

---

## 11. Próximos passos recomendados

1. **@architect** — desenhar fronteira BFF vs Supabase, contrato do endpoint, índices e política de leitura.  
2. **@po / @sm** — fatiar story em `docs/stories/` com estimativa e dependência de migração/dados.  
3. **@dev** — implementação frontend + backend conforme decisão.  
4. **@qa** — casos de borda: rede lenta, zero resultados, código legado na edição, limite de caracteres `varchar(10)`.

---

## 12. Riscos e perguntas em aberto

- **Volume da tabela:** se for muito grande, a busca apenas com `LIKE` pode exigir índices ou estratégia alternativa.
- **Códigos legados:** itens do catálogo com `codigo` que não existe em `codigosservicos` — comportamento de exibição e edição (RF-05).
- **Unicidade:** confirmação de que `codigo` no catálogo do utilizador continua sendo apenas referência fiscal e não duplica chave da tabela global (são domínios diferentes: catálogo do user vs. tabela de referência).
