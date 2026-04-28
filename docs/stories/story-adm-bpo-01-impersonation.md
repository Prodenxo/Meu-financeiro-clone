# Story — ADM-BPO-01: Impersonation Access (Login as User)

**ID:** STORY-ADM-BPO-01  
**Prioridade (PRD):** Must  
**Fonte:** Solicitação do usuário via Codex CLI  
**Relacionado:** Gestão de Usuários, BPO Operations

## User story

**Como** administrador ou superadmin,  
**quero** poder acessar a conta de um membro da minha empresa (ou qualquer usuário no caso de superadmin) com um único clique,  
**para** visualizar o sistema exatamente como o usuário o vê, facilitando o suporte e a execução de serviços de BPO sem solicitar senhas.

## Contexto técnico

- **Backend:** 
  - Nova rota `/auth/impersonate/:userId`.
  - Middleware de segurança: Apenas `admin` pode impersonar usuários da sua `empresaId`. `superadmin` pode impersonar qualquer um.
  - O JWT gerado deve conter metadados indicando impersonação (ex: `is_impersonated: true`, `original_user_id: string`).
- **Frontend:**
  - `UserListTab.tsx`: Adicionar botão de "Acessar Conta" (ícone de login/seta).
  - `authStore.ts`: Gerenciar estado de impersonação para permitir o "Switch Back".
  - `MainLayout.tsx`: Banner superior fixo em modo impersonação com botão "Sair do modo Usuário".

## Critérios de aceite

- [x] Admin só pode acessar usuários da própria empresa.
- [x] Superadmin pode acessar qualquer usuário.
- [x] Ao clicar no botão, o sistema redireciona para o dashboard com a visão do usuário alvo.
- [x] O banner de impersonação aparece em todas as páginas enquanto estiver logado como o usuário.
- [x] Ao clicar em "Sair do modo Usuário", o Admin deve retornar instantaneamente para sua sessão original.
- [x] Trilha de auditoria (Log): A ação de impersonação deve ser registrada no backend.

## Fora de escopo

- Alteração permanente de senhas.
- Bypass de permissões de visualização do usuário alvo.

## Definition of Done

- QA manual: Logar como Admin, acessar conta de um usuário comum, realizar uma ação (ex: ver despesa), sair e voltar ao Admin.
- Segurança: Validar que um usuário comum não consegue acessar a rota de impersonação.
