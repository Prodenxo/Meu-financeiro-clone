# Story — FR-P-07: Loading global e busca robusta (ManageUsers)

**ID:** STORY-FR-P-07  
**Prioridade (PRD):** Must  
**Fonte:** `docs/brief-event1-1.md`, PRD §5.3  
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`

## User story

**Como** superadmin na página de gestão de utilizadores,  
**quero** ver um estado de carregamento claro até os dados estarem prontos e manter o campo de busca sempre visível com resultados vazios compreensíveis,  
**para** gerir utilizadores sem perder o contexto do filtro nem interagir com UI incompleta.

## Contexto técnico

- **Frontend:** `frontend/src/pages` ou componente referido no brief (`ManageUsers.tsx` / rota `/settings/users`).
- **Busca:** debounce ~200ms; **fuse.js** (ou biblioteca já no projeto) para busca tolerante; input **fora** do branch `filteredUsers.length === 0`.
- **Loading:** overlay de tela (ou equivalente) até `loading === false` e dados necessários carregados.

## Critérios de aceite

- [ ] Enquanto dados carregam, a área de conteúdo relevante mostra loading de **tela completa** (não só texto inline no card).
- [ ] O input de busca permanece **sempre** visível, inclusive quando não há resultados.
- [ ] Com filtro ativo e zero resultados: mensagem inclui o termo pesquisado (ex.: «Nenhum utilizador encontrado para ‘…’.»).
- [ ] Busca com debounce e comportamento fuzzy conforme brief.
- [ ] Gates de qualidade nos ficheiros tocados (`lint` / `typecheck`).

## Fora de escopo

- Novas permissões ou alteração de API de listagem de utilizadores (salvo necessário para o loading).

## Definition of Done

- QA manual: carregar página lenta/simulada; buscar termo inexistente e limpar filtro sem perder o input.

## Qualidade / CodeRabbit

- Evitar re-renders excessivos; acessibilidade do overlay (foco/escape se aplicável ao padrão do projeto).
