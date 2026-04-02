# Brief: painel admin — selecionar e gerir clientes (tomadores) do utilizador na emissão de NFSe

**Data:** 2026-04-02  
**Origem:** pedido de produto / operação de suporte (persona Atlas — analista)  
**Produto:** Meu Financeiro — **Painel admin**, vista de dados do utilizador (`AdminUserData`), modal **“Emitir NFSe”**

**Documentos relacionados (não substituídos por este brief):**

- `docs/brief/brief-area-cadastro-clientes-servicos-produtos.md` — áreas de catálogo no contexto do próprio utilizador.  
- `docs/brief/brief-nfse-gerir-catalogo-botoes-didaticos-2026-04-02.md` — UX dos atalhos “Gerir clientes” no Guia MEI.  
- `docs/technical/catalogo-mei-persistencia-e-api-2026-03-30.md` — modelo `mei_nfse_clientes`, fluxos de leitura/escrita e serviço `mei-notas.service.js`.  
- Stories de catálogo MEI (`docs/stories/story-cat-mei-*.md`), quando aplicável à paridade de dados.

---

## 1. Resumo executivo

No painel administrativo, ao **emitir NFSe em nome de um utilizador selecionado**, o administrador preenche hoje **manualmente** CPF/CNPJ, razão social e e-mail do tomador. O produto já mantém, para cada utilizador, um **catálogo de clientes NFS-e** (`mei_nfse_clientes`), usado no fluxo do **Guia MEI** com listagem e gestão autenticada como o próprio user.

Este brief pede **paridade operacional no admin**: no modal de emissão, permitir **escolher um cliente já cadastrado** desse utilizador (atalho que preenche o formulário) e **gerir o catálogo** desse mesmo utilizador (criar, editar, remover — conforme políticas já definidas para o catálogo), **sem** obrigar digitação repetida nem sair do contexto “utilizador X”.

---

## 2. Problema / oportunidade

| Dimensão | Situação atual | Impacto |
|----------|----------------|---------|
| **Eficiência** | Admin copia/cola dados de tomador de sistemas externos ou tickets. | Tempo, erros de transcrição, inconsistência com o catálogo do user. |
| **Fonte de verdade** | Catálogo existe no backend/BD por `user_id`; emissão admin **não** o consome na UI. | O mesmo tomador pode ficar duplicado ou desalinhado do que o MEI vê no Guia MEI. |
| **Suporte** | Emissão “em nome de” já está clara no copy do modal; falta ligação ao **universo de clientes** daquele utilizador. | Expectativa frustrada de quem assume que “dados do MEI” incluem tomadores habituais. |

**Oportunidade:** reutilizar o mesmo modelo e serviços de catálogo, expostos de forma **segura** ao papel admin **apenas** para o `userId` da linha selecionada (mesmo padrão de `listAdminUserMeiNfse` / `emitirNotaAsAdmin`).

---

## 3. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **Admin / suporte** | Emitir NFSe para o tomador habitual do MEI sem reintroduzir dados; corrigir e-mail ou razão social no catálogo antes de emitir. |
| **Admin** | Pré-cadastrar um tomador novo no catálogo do utilizador e de seguida emitir a nota com um clique. |
| **MEI (efeito indireto)** | Após ação do admin, o catálogo reflete alterações — próxima emissão pelo próprio utilizador no Guia MEI vê os mesmos registos (mesma tabela `mei_nfse_clientes`). |

---

## 4. Estado atual (brownfield)

| Aspeto | Detalhe |
|--------|---------|
| **UI admin** | `frontend/src/pages/AdminUserData.tsx` — secção “Notas fiscais”, botão “Emitir NFSe”, estado `emitirNotaForm` com `tomadorCpfCnpj`, `tomadorRazaoSocial`, `tomadorEmail`, etc.; abertura do modal **zera** campos (exceto defaults de serviço). |
| **API admin (NFSe)** | `GET /admin/users/:userId/mei-nfse`, `POST /admin/users/:userId/mei-nfse/emitir` (`admin.routes.js`); controller chama `ensureCanViewUser` + `meiNotasService.emitirNota(userId, body)`. |
| **API utilizador (catálogo)** | Rotas `mei-notas` com `requireAuth`, `requireMeiEnabled`: `GET/POST/PATCH/DELETE` em `/catalogo/clientes` (e produtos), operando sempre com `req.user.id`. |
| **Persistência** | `public.mei_nfse_clientes` — `user_id`, documento, nome, e-mail, `dedupe_key`, `document_type`, `last_used_at`, etc. |
| **Gap** | **Não** existem rotas admin para listar/criar/editar/eliminar clientes do catálogo **de outro** `userId`; o modal admin não chama catálogo. |

---

## 5. Objetivos de produto

1. **Seleção:** no modal “Emitir NFSe”, o admin pode **escolher um cliente do catálogo** do utilizador selecionado e **preencher automaticamente** CPF/CNPJ, razão social e e-mail (editáveis antes de submeter).  
2. **Gestão:** no mesmo contexto (ou fluxo de um clique), o admin pode **gerir clientes** desse utilizador: pelo menos **listar + criar + editar**; **eliminar** se estiver alinhado ao que o produto já permite ao utilizador (paridade).  
3. **Rastreio:** manter claro na UI que a emissão continua **em nome do utilizador selecionado** e que alterações no catálogo são **dados desse utilizador**.  
4. **Não regressão:** emissão manual (sem escolher catálogo) permanece possível para casos excecionais.

---

## 6. Fora de âmbito (sugerido, a validar com PO)

- Catálogo de **serviços/produtos** no modal admin (pode ser fase 2 se o valor for igual ao dos clientes).  
- Importação em massa de tomadores pelo admin.  
- Permissões granulares além de “admin que já pode ver o utilizador” (`ensureCanViewUser`).  
- Alteração do contrato com o provedor fiscal de emissão (continua a usar o payload atual de tomador).

---

## 7. Proposta de experiência (UX)

### 7.1 Modal “Emitir NFSe” — bloco tomador

- **Controlo principal:** select ou combobox **“Cliente do catálogo (opcional)”** com pesquisa por nome ou documento (reutilizar padrão mental do Guia MEI: “Cliente salvo”).  
- **Opção explícita:** entrada **“Preencher manualmente”** / valor vazio que mantém o comportamento atual.  
- **Ao selecionar um registo:** preencher os três campos (documento, razão social, e-mail); o admin pode ajustar antes de “Emitir” (nota avulsa com correção pontual sem gravar no catálogo — **comportamento a cravar**: só preenche UI ou também persiste; default recomendado: **só preenche UI**, persistência só via “Guardar no catálogo” se existir ação explícita).  
- **Gestão:** link ou botão secundário **“Gerir clientes deste utilizador”** que abre:  
  - **preferência A:** painel lateral / segundo passo modal com lista mínima + criar/editar (inline ou sub-modal), **ou**  
  - **preferência B:** navegação para rota dedicada admin `…/utilizador/:id/catalogo-clientes` com retorno ao modal (mais trabalho de rota; melhor se a gestão for pesada).  

Recomendação inicial: **preferência A** para não quebrar o fluxo “estou a emitir agora”.

### 7.2 Carga de dados

- Ao abrir o modal (ou ao expandir o bloco tomador), **carregar lista de clientes** do `userId` selecionado (com limite/paginação coerente com `listarCatalogoClientes`).  
- Estado vazio: mensagem curta *“Nenhum cliente cadastrado — adicione em ‘Gerir clientes’ ou preencha manualmente.”*

### 7.3 Acessibilidade e temas

- Labels associados, foco ao abrir sub-fluxos, erros de API anunciáveis — alinhado ao resto do painel admin.

---

## 8. Requisitos funcionais (rascunho para story)

| ID | Critério |
|----|----------|
| RF-ADM-NFSE-01 | Com utilizador U selecionado e admin autenticado autorizado, o modal lista clientes do catálogo de U. |
| RF-ADM-NFSE-02 | Selecionar um cliente preenche documento, razão social e e-mail no formulário de emissão. |
| RF-ADM-NFSE-03 | Admin pode emitir NFSe sem selecionar catálogo (entrada manual intacta). |
| RF-ADM-NFSE-04 | Admin pode criar cliente no catálogo de U a partir do fluxo de gestão ligado ao modal. |
| RF-ADM-NFSE-05 | Admin pode editar cliente existente de U (campos permitidos pelo domínio — paridade com PATCH utilizador). |
| RF-ADM-NFSE-06 | Se o produto permitir delete de cliente ao utilizador, admin com mesma política pode eliminar no catálogo de U; caso contrário, omitir ou só “arquivar” conforme story de catálogo. |
| RF-ADM-NFSE-07 | Falhas de API mostram mensagem clara; não vazar dados de outros utilizadores (sempre escopo U da página). |

---

## 9. Requisitos não funcionais

- **Segurança:** todas as operações de catálogo admin devem passar por **backend** com `requireAdmin` + **`ensureCanViewUser(token, userId)`** (ou equivalente canónico do projeto), e serviço que opera com **user_id = :userId** — nunca confiar no browser para o dono dos dados.  
- **Consistência:** mesmas validações de documento/e-mail/nome que `criarCatalogoCliente` / `atualizarCatalogoCliente` no serviço de notas.  
- **Performance:** lista com `limit` e opcionalmente `q` como nas rotas existentes de catálogo.  
- **Auditoria (opcional fase 2):** log de admin que alterou catálogo de qual utilizador — apenas se o produto já tiver padrão semelhante.

---

## 10. Dependências técnicas (entrega para @architect / @dev / @sm)

1. **Backend:** novas rotas sob `admin.routes.js`, por exemplo:  
   `GET /admin/users/:userId/mei-catalogo/clientes`  
   `POST /admin/users/:userId/mei-catalogo/clientes`  
   `PATCH /admin/users/:userId/mei-catalogo/clientes/:id`  
   `DELETE …` (se aplicável), cada uma delegando em `meiNotasService.listarCatalogoClientes(userId, …)`, `criarCatalogoCliente`, etc., **sem** duplicar regras de negócio.  
2. **Frontend:** extensões em `adminUserDataService.ts` + estado/modal em `AdminUserData.tsx` (ou componente extraído se o ficheiro exceder limite de manutenção).  
3. **Testes:** testes de rota admin (padrão existente para `admin.routes` / controller) cobrindo 403/404 para `userId` não autorizado e happy path de listagem.  
4. **Story:** uma story em `docs/stories/` deve referenciar este brief como entrada; checklist com file list e gates (`lint`, `typecheck`, `test`).

---

## 11. Métricas de sucesso (qualitativas)

- Redução de retrabalho reportada por quem opera o painel admin.  
- Menos erros de digitação em tomador nas emissões assistidas.  
- Paridade percebida entre “o que o MEI tem no catálogo” e “o que o admin vê ao emitir”.

---

## 12. Riscos e perguntas em aberto

| Item | Nota |
|------|------|
| **MEI não habilitado** | Definir se o catálogo admin fica oculto, somente leitura, ou igual (dados podem existir antes de MEI). |
| **Edição local vs persistência** | Se o admin alterar campos após selecionar cliente, a emissão deve usar só o payload do formulário; decidir se há botão “Atualizar cadastro com estes dados”. |
| **Rate limiting / abuso** | Mesmo perfil de risco que outras rotas admin já expõem; manter consistência. |

---

## 13. Próximos passos sugeridos

1. **PO / PM** — validar fora de âmbito (serviços/produtos na mesma entrega ou fase 2) e decisão “editar após select não persiste até…”  
2. **@architect** — desenhar contrato exato das rotas admin e reutilização do serviço existente  
3. **@sm** — cortar story com IDs RF-ADM-NFSE-* e estimativa  
4. **@dev** — implementação + gates de qualidade do `AGENTS.md`

---

*Documento gerado no âmbito AIOX Atlas (analyst); não substitui PRD nem decisão de arquitetura formal.*
