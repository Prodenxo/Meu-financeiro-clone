# Story — FR-P-05: Cadastro e edição de empresa na UI (superadmin)

**ID:** STORY-FR-P-05  
**Prioridade (PRD):** Should  
**Fonte:** `docs/brief-event1-1.md`, PRD §5.3  
**Relacionado:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`

## User story

**Como** superadmin,  
**quero** criar e editar os dados da empresa através de um modal em Definições, com autopreenchimento por CNPJ via API Brasil,  
**para** configurar a organização sem alterar a base de dados manualmente.

## Contexto técnico

- **Frontend:** `frontend/src/pages/Settings.tsx` (ou equivalente) — card «Empresa» + modal alinhado ao design system existente.
- **API externa:** `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` (normalizar CNPJ antes da chamada).
- **Backend:** expor `POST /empresas` e `PUT /empresas/:id` (ou convenção já usada no projeto) com validação e auth.
- **Autorização:** apenas role **superadmin** vê o card e pode submeter.
- **Campos (brief):** Razão Social, Nome Fantasia, CNPJ, IE, Regime, endereço completo, telefone, e-mail (ajustar ao modelo de dados real).

## Critérios de aceite

- [ ] Superadmin vê o card e o modal; outros papéis não acedem à funcionalidade.
- [ ] Ao sair do campo CNPJ (blur), dispara busca Brasil API e preenche campos quando a resposta for válida; trata erro de rede/CNPJ inválido com mensagem acionável.
- [ ] Criar e atualizar empresa persistem no backend e refletem em nova leitura (lista/detalhe conforme existir).
- [ ] Nenhum segredo ou token de integração exposto ao cliente (`docs/architecture.md` — backend como fronteira).
- [ ] `lint` / `typecheck` / testes afetados passam.

## Dependências

- Modelo/tabela `empresas` (ou nome canónico no repo) e políticas RLS coerentes.

## Fora de escopo

- Multi-empresa avançada ou convites (ver ADRs/runbooks se existirem).

## Definition of Done

- Fluxo feliz + erro API documentado ou tratado na UI.

## Qualidade / CodeRabbit

- Validar CNPJ no backend; rate-limit/abuse básico na rota se exposta publicamente.
