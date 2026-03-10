---
epic: 5
title: Administracao de empresas e limites por MEI/nao-MEI
status: Planning
owner: "@pm"
created_at: 2026-03-10
---

# Epic 5: Administracao de empresas e limites por MEI/nao-MEI - Brownfield Enhancement

## Epic Goal

Permitir que superadmins criem empresas e definam limites de capacidade (MEI e nao-MEI), garantindo que a criacao/edicao de usuarios respeite esses limites sem regressao nos fluxos existentes.

## Epic Description

### Existing System Context
- Funcionalidade atual relevante: gestao de usuarios por empresa com roles em `role_x_user_x_empresa`, e listagem de empresas via backend.
- Stack: Frontend React + Vite (`frontend/src`), Backend Express (`backend/src`), dados em Supabase.
- Pontos de integracao: tabelas `empresas` e `role_x_user_x_empresa`; endpoints `/users` e `/users/empresas`; UI em `frontend/src/pages/ManageUsers.tsx`.

### Enhancement Details
- O que sera adicionado: criacao de empresas por superadmin com limites `max_mei` e `max_usuarios_nao_mei` e validacao de capacidade na criacao/edicao de usuarios.
- Como integra: backend valida limites antes de persistir `role_x_user_x_empresa`; frontend expõe formulario de criacao de empresa no painel de gerenciamento.
- Success criteria:
  - Superadmin consegue criar empresas com limites configuraveis.
  - Limites sao respeitados ao criar/editar usuarios (contando apenas vinculos ativos).
  - Admins continuam operando dentro do escopo da empresa, sem regressao de fluxo.

## Stories (Quality Planning)

### Story 5.2 - Backend/DB: criar empresas e validar limites
- Descricao: adicionar colunas `max_mei` e `max_usuarios_nao_mei` em `empresas`, expor endpoint de criacao para superadmin e validar limites antes de criar/editar usuarios.
- Executor Assignment: `executor: @data-engineer`, `quality_gate: @dev`
- Quality Gate Tools: `[schema_validation, migration_review, rls_test]`
- Quality Gates:
  - Pre-Commit: validacao de schema/migration
  - Pre-PR: revisao de SQL e compatibilidade

### Story 5.3 - Frontend: UI para criar empresa e limites
- Descricao: adicionar secao "Criar empresa" no gerenciamento de usuarios (superadmin), com campos de limites e feedback de erro/sucesso.
- Executor Assignment: `executor: @ux-design-expert`, `quality_gate: @dev`
- Quality Gate Tools: `[accessibility_check, design_review, component_validation]`
- Quality Gates:
  - Pre-Commit: a11y e consistencia visual
  - Pre-PR: revisao de UX e fluxo

### Story 5.4 - Superadmin: editar empresas existentes e limites
- Descricao: permitir editar nome da empresa e limites (MEI/nao-MEI) na UI, com API para atualizacao e lista retornando limites.
- Executor Assignment: `executor: @dev`, `quality_gate: @architect`
- Quality Gate Tools: `[code_review, pattern_validation]`
- Quality Gates:
  - Pre-Commit: validacao de regras e consistencia
  - Pre-PR: revisao de contrato e compatibilidade

## Compatibility Requirements
- APIs existentes permanecem compativeis.
- Mudancas de schema sao retrocompatíveis.
- UI segue padroes atuais de layout/estilos.
- Impacto de performance minimo.

## Risk Mitigation
- Risco principal: bloqueio indevido de criacao/edicao de usuarios por erro de contagem.
- Mitigacao: validacao server-side com contagem apenas de vinculos ativos e mensagens claras.
- Rollback: reverter migration das colunas e desativar validacao de limites.

## Quality Assurance Strategy
- Validar fluxos de criacao/edicao de usuarios e criacao de empresas.
- Executar gates `lint`, `typecheck`, `test` conforme quality gates do projeto.

## Definition of Done
- Todas as stories concluídas com ACs atendidos.
- Sem regressao em gerenciamento de usuarios.
- Documentacao atualizada conforme necessario.
