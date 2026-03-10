# Project Brief: event1-1 — Melhorias de UX, Estabilidade e Cadastro de Empresa

## Executive Summary

O projeto `event1-1` consolida quatro melhorias imediatas no produto: (1) cadastro de empresa via modal em `/settings`, integrado à API Brasil para autopreenchimento de dados a partir do CNPJ; (2) correção do bug que dispara downloads automáticos de DAE ao atualizar o histórico no componente `GuidesMei`; (3) loading de tela inteira em `/settings/users` enquanto os dados do banco ainda carregam; e (4) robustez do campo de busca em `ManageUsers`, que atualmente some quando não encontra resultados, adicionando busca fuzzy e estado de vazio visível.

O objetivo é reduzir fricção operacional para admins, eliminar comportamentos inesperados no fluxo de gestão de documentos e elevar a confiança do usuário em telas críticas do produto.

---

## Problem Statement

### Dores identificadas

1. **Ausência de cadastro de empresa:** não existe UI nem endpoint de criação/edição de empresa. O único endpoint existente (`GET /empresas`) apenas lista empresas. Para qualquer operação de onboarding ou correção de dados, é necessário intervenção direta no banco via Supabase — risco operacional alto e processo não escalável.

2. **Download automático indevido de DAE:** em `GuidesMei.tsx`, o `useEffect` que aciona `loadMeiPeriods` e o fluxo de `handleDownload` disparam o download de guias sem interação do usuário ao clicar em "Atualizar histórico". O download **só deve ocorrer** quando o usuário clicar explicitamente no botão "Baixar guia".

3. **Ausência de loading adequado em `/settings/users`:** o estado de carregamento atual renderiza apenas `<p>Carregando...</p>` inline dentro do card de usuários, sem bloquear a tela. O usuário visualiza layout parcial e pode interagir com elementos ainda não carregados.

4. **Campo de busca some quando sem resultados:** em `ManageUsers.tsx`, o bloco de renderização condicional (`filteredUsers.length === 0`) exibe apenas `"Nenhum usuário encontrado."` — o input de busca fica fora do bloco renderizado e desaparece, frustrando o usuário que tentou buscar e precisa limpar o filtro.

---

## Proposed Solution

### Feature 1 — Modal de Cadastro de Empresa em `/settings`

- Adicionar card "Empresa" na tela `Settings.tsx` (mesma área do card "Administração", linha `<div class="planner-card p-4 md:p-6">`).
- O card exibe um botão "Configurar empresa" que abre um **modal** seguindo o padrão visual já existente na tela.
- O modal contém:
  - Campo CNPJ com máscara; ao sair do campo, dispara chamada à **API Brasil** (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`) para autopreenchimento.
  - Campos: Razão Social, Nome Fantasia, CNPJ, Inscrição Estadual, Regime Tributário, Logradouro, Número, Complemento, Bairro, Cidade, Estado, CEP, Telefone, E-mail.
  - Ação: criar ou editar empresa (dependência: novo endpoint `POST /empresas` e `PUT /empresas/:id` no backend).
- **Permissão:** somente usuários com role `superadmin` visualizam e acessam o modal.

### Feature 2 — Correção Bug Download Automático (`GuidesMei`)

- Auditar todos os `useEffect` em `GuidesMei.tsx` que invocam fluxo de download.
- Garantir que `handleDownload` só seja chamado por evento explícito do usuário (clique no botão "Baixar guia").
- "Atualizar histórico" deve chamar apenas `loadMeiPeriods()` — **sem efeito colateral de download**.
- Remover qualquer chamada automática a `downloadMeiGuide` fora de handler de clique.

### Feature 3 — Loading de Tela Inteira em `/settings/users` (`ManageUsers`)

- Substituir o `<p>Carregando...</p>` por um **overlay de loading de tela inteira** que cobre toda a área de conteúdo da página.
- O loading é removido **somente quando todos os dados (último registro da tabela) tiverem sido carregados**, controlado pelo estado `loading` já existente.
- Usar um componente de spinner/overlay consistente com o design system do projeto.

### Feature 4 — Campo de Busca Robusto com Estado Vazio (`ManageUsers`)

- Mover o input de busca para **fora** do bloco condicional `filteredUsers.length === 0`, garantindo que ele seja sempre renderizado.
- Quando `filteredUsers.length === 0` com `userQuery` preenchida: exibir mensagem `"Nenhum usuário encontrado para '[termo buscado]'."` abaixo do input, mantendo o input visível.
- Implementar **busca fuzzy** usando a biblioteca `fuse.js` (ou equivalente já no projeto) para tolerância a erros de digitação.
- Busca é **instantânea com debounce de 200ms** para evitar re-renders excessivos.

---

## Target Users

### Primary User Segment: Superadmin

- Perfil: gestor responsável por configurar e manter o ambiente da empresa no sistema.
- Necessidades: cadastrar e editar dados da empresa sem precisar de acesso direto ao banco; gerenciar usuários com visibilidade imediata dos estados de carregamento.
- Objetivos: onboarding de empresa ágil, operação estável e previsível.

### Secondary User Segment: Admin / Contador

- Perfil: usuário com papel administrativo, gerencia clientes e documentos fiscais.
- Necessidades: atualizar histórico de guias sem downloads não solicitados; buscar usuários sem perda de contexto de filtro.
- Objetivos: eficiência operacional e confiança nas ações do sistema.

---

## Goals & Success Metrics

### Business Objectives

- Habilitar cadastro de empresa 100% via UI, sem intervenção direta no banco.
- Eliminar downloads automáticos não solicitados de DAE.
- Reduzir confusão de carregamento em `/settings/users` a zero reclamações pós-deploy.
- Manter campo de busca sempre presente e funcional em todos os estados.

### User Success Metrics

- Tempo para cadastrar uma empresa nova via UI < 2 minutos (com autopreenchimento via CNPJ).
- Zero ocorrências de download automático após correção.
- Estado de loading cobrindo 100% da área de conteúdo da página antes dos dados chegarem.
- Campo de busca visível e funcionando em 100% dos estados da lista (vazia, parcial, total).

### KPIs

- Taxa de erro no modal de cadastro de empresa: < 5% (campos obrigatórios não preenchidos após interação com API Brasil).
- Cobertura de testes automatizados para as 4 features: >= 80%.
- Regressão de bug de download: 0 ocorrências em QA após fix.

---

## MVP Scope

### Core Features (Must Have)

- **Modal Cadastro de Empresa:** integrado com API Brasil, campos completos, permissão superadmin, criação e edição.
- **Fix Bug Download Automático:** `useEffect` e `handleDownload` desacoplados; download somente por clique explícito.
- **Loading Tela Inteira:** overlay cobrindo conteúdo de `/settings/users` até dados carregados.
- **Campo de Busca Sempre Visível:** input fora do condicional, estado vazio com mensagem, busca fuzzy com debounce.

### Out of Scope para este evento

- Deleção de empresa (operação de alto risco, requer fluxo de confirmação separado).
- Upload de logotipo ou documentos da empresa.
- Múltiplas empresas por superadmin no mesmo modal.
- Migração de dados históricos de empresas existentes.

### MVP Success Criteria

O evento `event1-1` é concluído quando: (1) superadmin consegue cadastrar e editar empresa via modal em `/settings` com dados autopreenchidos por CNPJ; (2) botão "Atualizar histórico" não dispara nenhum download; (3) `/settings/users` exibe overlay de loading até todos os dados chegarem; (4) campo de busca permanece visível em todos os estados e retorna resultados fuzzy.

---

## Technical Considerations

### Arquivos Impactados (mapeamento real)

| Área | Arquivo | Tipo de mudança |
|---|---|---|
| Frontend | `frontend/src/pages/Settings.tsx` | Novo card + modal de empresa |
| Frontend | `frontend/src/components/EmpresaModal.tsx` | Novo componente modal isolado (criar) |
| Frontend | `frontend/src/pages/GuidesMei.tsx` | Remover `triggerAutoDownload` de `loadMeiPeriods` (linha 291) |
| Frontend | `frontend/src/pages/ManageUsers.tsx` | Loading overlay + busca fuzzy |
| Frontend | `frontend/src/components/LoadingOverlay.tsx` | Novo componente de overlay (criar) |
| Frontend | `frontend/src/services/usersService.ts` | Novos métodos: createEmpresa, updateEmpresa |
| Backend | `backend/src/routes/users.routes.js` | Novas rotas POST /empresas, PUT /empresas/:id |
| Backend | `backend/src/middlewares/requireSuperAdmin.js` | Novo middleware de autorização exclusivo superadmin (criar) |
| Backend | `backend/src/controllers/users.controller.js` | createEmpresa, updateEmpresa handlers |
| Backend | `backend/src/services/users.service.js` | Lógica de criação/edição na tabela `empresas` |
| Database | `supabase/migrations/YYYYMMDD_add_empresa_fields.sql` | Migration não-destrutiva com ~14 novos campos na tabela `empresas` (pré-requisito da Feature 1) |

### Dependência Técnica: Endpoints de Empresa

O backend atual só expõe `GET /empresas` (`listEmpresas`). São necessários:

- `POST /empresas` — criar empresa (somente superadmin)
- `PUT /empresas/:id` — editar empresa (somente superadmin)

**Schema atual confirmado por análise do código:** a tabela `empresas` tem apenas `id` e `empresa` em uso (`SELECT id, empresa` em `listEmpresas`). Não existem outras migrations para esta tabela no projeto.

**Migration obrigatória (pré-requisito — deve ser executada antes do desenvolvimento da Feature 1):**

Adicionar os seguintes campos à tabela `empresas` (todos nullable, não-destrutivos):

```sql
cnpj               TEXT
razao_social       TEXT
nome_fantasia      TEXT
inscricao_estadual TEXT
regime_tributario  TEXT
logradouro         TEXT
numero             TEXT
complemento        TEXT
bairro             TEXT
cidade             TEXT
estado             TEXT
cep                TEXT
telefone           TEXT
email              TEXT
```

### Dependência Técnica: API Brasil (CNPJ)

- Endpoint público: `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`
- Chamada direto do frontend (sem proxy necessário para este MVP).
- Tratar erros: CNPJ inválido, empresa não encontrada, timeout.

### Technology Preferences

- **Frontend:** React + TypeScript, padrão de componentes existente, design system `planner-card` / `planner-input-compact`.
- **Busca Fuzzy:** `fuse.js` (a adicionar como dependência se não presente).
- **Backend:** Node.js + Express + Supabase Admin Client.
- **Database:** Supabase (`empresas` table) — verificar schema atual e criar migration se necessário.

### Security / Permissions

**Situação atual confirmada por análise:**
- `requireAuth` (`backend/src/middlewares/auth.js`): valida token JWT — já existe.
- `requireAdmin` (`backend/src/middlewares/requireAdmin.js`): aceita `admin` **e** `superadmin` — **não é suficiente** para as rotas de empresa.
- Não existe `requireSuperAdmin` no projeto.

**Ação necessária:** Criar `backend/src/middlewares/requireSuperAdmin.js` — middleware centralizado que bloqueia qualquer role diferente de `superadmin`. As rotas `POST /empresas` e `PUT /empresas/:id` devem usar a cadeia: `requireAuth, requireSuperAdmin`.

- Modal no frontend: visível somente se `user.role === 'superadmin'`.

---

## Constraints & Assumptions

### Constraints

- Sem novas plataformas externas além da API Brasil (pública, gratuita).
- Manter compatibilidade total com design system existente (sem nova biblioteca de UI).
- Migrations de banco devem ser não-destrutivas.

### Key Assumptions

- A tabela `empresas` aceita os campos adicionais via migration sem impacto em dados existentes (todos nullable).
- A API Brasil tem disponibilidade >= 99% e tempo de resposta < 2s para o fluxo de autopreenchimento.
- ~~O role `superadmin` já está corretamente implementado no middleware de auth do backend.~~ **CORRIGIDO:** `requireAdmin` existente aceita `admin` e `superadmin`. Um middleware `requireSuperAdmin` exclusivo precisa ser criado.
- `fuse.js` **não está** no `frontend/package.json` — confirmado. Será adicionada como dependência nova.
- O estado `loading` existente em `ManageUsers.tsx` (linha 12) já cobre o ciclo completo de fetch de usuários.

---

## Risks & Open Questions

### Key Risks

- **Migration da tabela `empresas` (ALTO):** Confirmado que apenas `id` e `empresa` existem hoje. Migration com ~14 campos novos é pré-requisito obrigatório da Feature 1. Outros módulos usam `empresas_id` como FK — a migration não pode alterar nem remover colunas existentes.
- **API Brasil indisponível:** o modal deve funcionar sem autopreenchimento (campos manuais sempre habilitados como fallback).
- **Bug de download — causa raiz identificada (BAIXO risco de fix):** A função `triggerAutoDownload` (linha 225) é chamada diretamente dentro de `loadMeiPeriods` (linha 291) após cada fetch de períodos. O fix é remover essa chamada e a função `triggerAutoDownload` por completo — não afeta nenhum outro fluxo, pois `handleDownloadClick` (botão explícito) chama `handleDownload` diretamente.
- **Loading overlay pode mascarar outros erros:** se a requisição falhar silenciosamente, o overlay nunca sai. Deve haver timeout e estado de erro explícito.
- **Ausência de `requireSuperAdmin`:** usar `requireAdmin` nas rotas de empresa seria um risco de segurança — admins de empresa poderiam criar/editar outras empresas. O novo middleware deve ser criado.

### Open Questions

> **Todas as open questions foram respondidas pela análise do código.** Não há questões em aberto.

| Questão | Resposta |
|---|---|
| Campos da tabela `empresas`? | Apenas `id` e `empresa` confirmados. Os demais precisam de migration. |
| `fuse.js` está no projeto? | Não. Deve ser adicionada via `npm install fuse.js`. |
| Middleware `superadmin` centralizado existe? | Não. `requireAdmin` aceita `admin` e `superadmin`. Criar `requireSuperAdmin`. |
| Causa raiz do download automático? | `triggerAutoDownload()` chamada em `loadMeiPeriods()` linha 291. Fix: remover a chamada e a função. |

### Areas Needing Further Research

- Padrão de modal já utilizado em outras telas para reutilização de componente (avaliar antes de criar `EmpresaModal.tsx`).

---

## Acceptance Criteria (por Feature)

### AC-1: Cadastro de Empresa
- [ ] Card "Empresa" visível em `/settings` somente para superadmin.
- [ ] Clique em "Configurar empresa" abre modal com campos completos.
- [ ] Ao informar CNPJ válido, campos são preenchidos automaticamente via API Brasil.
- [ ] Formulário valida campos obrigatórios antes de submeter.
- [ ] Empresa criada/editada persiste no Supabase via `POST /empresas` ou `PUT /empresas/:id`.
- [ ] Modal fecha ao concluir; tela exibe feedback de sucesso ou erro.

### AC-2: Fix Bug Download Automático
- [ ] Clicar em "Atualizar histórico" recarrega somente a lista de períodos, sem iniciar download.
- [ ] Download ocorre **apenas** ao clicar no botão "Baixar guia".
- [ ] A chamada `await triggerAutoDownload(periods || [])` foi removida de `loadMeiPeriods` (linha 291 de `GuidesMei.tsx`).
- [ ] A função `triggerAutoDownload` foi removida do componente (linhas 225-255 de `GuidesMei.tsx`).
- [ ] Nenhum `useEffect` nem callback chama `downloadMeiGuide` ou `triggerFileDownload` sem interação explícita do usuário.

### AC-3: Loading Tela Inteira em `/settings/users`
- [ ] Ao acessar `/settings/users`, overlay de loading cobre toda a área de conteúdo.
- [ ] Overlay é removido somente após `loading === false` (dados carregados).
- [ ] Se a requisição falhar, overlay some e mensagem de erro é exibida.

### AC-4: Busca Robusta em `ManageUsers`
- [ ] Campo de busca renderizado em todos os estados (lista vazia, parcial, total).
- [ ] Com busca sem resultado: input visível + mensagem `"Nenhum usuário encontrado para '[termo]'."`.
- [ ] Busca fuzzy tolera erros de digitação (ex.: "joao" encontra "João").
- [ ] Debounce de 200ms aplicado — sem re-render a cada tecla.

---

## Definition of Done

- Todos os ACs acima verificados manualmente em ambiente local.
- Testes automatizados cobrindo os 4 fluxos principais (criação de empresa, comportamento do botão de histórico, estado de loading, busca vazia).
- Sem regressões em testes existentes (`npm test` passando).
- `npm run lint` e `npm run typecheck` sem erros.
- Story atualizada com checkboxes marcados e File List completo.

---

## Next Steps

### Immediate Actions

1. **[PRONTO]** ~~Verificar schema atual da tabela `empresas`~~ — confirmado: apenas `id` e `empresa`.
2. **[PRONTO]** ~~Confirmar `fuse.js`~~ — não está no projeto; adicionar via `npm install fuse.js`.
3. **[PRONTO]** ~~Auditar `useEffect` em `GuidesMei.tsx`~~ — causa raiz identificada em `loadMeiPeriods` linha 291.
4. Criar migration `supabase/migrations/YYYYMMDD_add_empresa_fields.sql` com os ~14 campos novos.
5. Criar `backend/src/middlewares/requireSuperAdmin.js`.
6. Criar story técnica consolidada `event1-1`.
7. Implementar na ordem: **Fix Bug** → **Loading Overlay** → **Busca Fuzzy** → **Migration + Modal Empresa**.

### PM Handoff

Este Project Brief está **completo e pronto para geração de story de implementação**. Todas as dependências técnicas foram investigadas e mapeadas. Não há questões em aberto. O desenvolvimento pode iniciar imediatamente após criação da story.
