# Épico: Convite por link — cadastro vinculado à empresa (admin escopado)

## Metadados

| Campo | Valor |
| --- | --- |
| **PRD** | [`docs/prd/PRD-convite-usuario-por-empresa.md`](../prd/PRD-convite-usuario-por-empresa.md) |
| **Arquitetura** | [`docs/architecture.md`](../architecture.md) — backend como fronteira; Express + Supabase; auth existente |
| **Sobreposição** | Nova capacidade; reutiliza `getRequesterContext`, `role_x_user_x_empresa`, RLS em `roles_empresas_policies.sql` |
| **Prioridade sugerida** | P0 Must: **US-INV-01**, **US-INV-02**, **US-INV-03**, **US-INV-07** (repetir por ambiente antes de smoke E2E); P1 Should: **US-INV-04**, **US-INV-05**; P2 Could: **US-INV-06** |
| **Owner épico** | Produto (@pm) |
| **Execução** | @dev; **gate** @architect (FR-A01–A03 do PRD); @qa; push/PR @github-devops |

## Objetivo do épico

Permitir que **admin** e **superadmin** gerem **links de convite** que, após cadastro público, criam usuário **`usuario`** já vinculado à **empresa correta**, com **admin limitado à própria empresa**, **sem** expor a funcionalidade na navegação para usuários comuns.

## Mapa técnico (handoff)

| Camada | Artefatos relevantes |
| --- | --- |
| Dados | Tabela **`public.empresa_invites`**; migrações em `supabase/migrations/`; RLS alinhada a `current_app_role()` / `current_empresa_id()` (ver ADR) |
| Backend | `backend/src/services/users.service.js` (`getRequesterContext`, `listUsers`, `updateUser`, checagem de capacidade); novas rotas em módulo dedicado (ex. `invites` ou extensão `users`); service role onde necessário |
| Frontend | `frontend/src/App.tsx` (rotas públicas vs. layout); `frontend/src/pages/Register.tsx`; `frontend/src/pages/ManageUsers.tsx` e/ou `Settings.tsx`; `frontend/src/lib/roles.ts` / `apiClient` |
| Segurança | Token opaco + hash no servidor (NFR-01); rate limit em validação/signup com convite (NFR-02); sem logar token cru |

## Ordem sugerida no sprint

1. **US-INV-01** — Persistência + RLS + documentação do modelo (bloqueia o restante; gate FR-A01)
2. **US-INV-07** — Operações/release: aplicar migrations `empresa_invites` + smoke por ambiente antes de E2E de convites (**NFR-07**, **OR-01–OR-05** do PRD v1.1); repetir ao promover cada ambiente
3. **US-INV-02** — APIs autenticadas criar/listar/revogar + API pública validar token (FR-01, FR-02, FR-05–FR-08)
4. **US-INV-03** — Consumo do convite: vínculo `role_x_user_x_empresa` + marcar convite usado (FR-04, FR-A02, D-06; integração capacidade se existir — FR-A03)
5. **US-INV-04** — UI admin: gerar, copiar, listar pendentes, revogar (FR-03, FR-06, FR-07)
6. **US-INV-05** — UI pública: `register` com parâmetro de convite, estados de erro, `noindex` se aplicável (NFR-06)
7. **US-INV-06** *(Could)* — Convite com e-mail pré-vinculado (D-05), se @po fechar antes ou após MVP

## Definição de pronto (épico)

- [ ] Documento técnico (@architect) referenciado na **US-INV-01** descreve tabela, RLS, formato de URL e estratégia FR-A02.
- [ ] **US-INV-07:** em **cada** ambiente onde `/api/invites` é exercido, migrations de `empresa_invites` aplicadas e smoke `to_regclass('public.empresa_invites')` evidenciado (ou checklist @github-devops).
- [ ] Admin sem `empresaId` não cria convite — comportamento explícito (erro claro, alinhado a `listUsers`).
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` na raiz conforme `AGENTS.md`.
- [ ] Regressão: fluxo `/register` **sem** convite permanece válido; login e gestão de usuários atuais intactos.

## Riscos (do PRD)

- Falha parcial entre Auth e vínculo → mitigar com estratégia FR-A02 e testes.
- Vazamento de token → hash, TTL, uso único, rate limit.
- Schema desatualizado vs. código → **US-INV-07**, brief [`brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md).

---

## User stories

---

### US-INV-01 — Dados e RLS: convites por empresa

**Como** time de plataforma, **quero** uma tabela persistida de convites com políticas RLS coerentes com o multi-tenant atual, **para** que apenas perfis autorizados criem ou vejam convites no escopo correto (FR-08, NFR-03, gate FR-A01).

**Critérios de aceite**

1. Existe migração Supabase (ou script versionado equivalente) criando a tabela de convites com, no mínimo, campos equivalentes a: `empresas_id`, `token_hash` (ou coluna acordada pelo @architect), `created_by`, `created_at`, `expires_at`, `used_at`, `revoked_at`, e opcionalmente `invited_email` (nulo no MVP se US-INV-06 não entrar).
2. **RLS:** `superadmin` consegue **insert/select/update** conforme regra documentada; `admin` só **insert/select/update** onde `empresas_id = public.current_empresa_id()`; papéis não administrativos **não** leem nem inserem convites via cliente Supabase direto (se política aplicável).
3. **Documentação:** arquivo em `docs/adr/` **ou** seção em `docs/architecture.md` referenciando nome da tabela, sem expor formato de token em claro nos docs públicos.
4. Nenhuma alteração de comportamento em rotas existentes até **US-INV-02** (apenas infra de dados + policies).
5. Quality gates da raiz passam após quaisquer scripts ou tipos tocados.

**Notas técnicas**

- Preferir **hash** (ex. SHA-256) do token na coluna; token completo só na resposta de criação uma vez.
- Alinhar `expires_at` ao default de produto (PRD sugere **7 dias** até @po decidir).

**Dependências:** Aprovação @architect (FR-A01).

**CodeRabbit:** revisar políticas RLS para não abrir `select` amplo em convites; evitar PII desnecessária na tabela.

#### Dev Agent Record — US-INV-01

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Migração `20260325120000_create_empresa_invites.sql` (tabela `empresa_invites`, índices, RLS select/insert/update, grants). Follow-up QA: `20260326120000_empresa_invites_force_row_level_security.sql` (`FORCE ROW LEVEL SECURITY`). ADR atualizado com FORCE RLS + nota de deploy/smoke. Sem alteração de rotas Express (US-INV-02). |
| **File List** | `supabase/migrations/20260325120000_create_empresa_invites.sql`, `supabase/migrations/20260326120000_empresa_invites_force_row_level_security.sql`, `docs/adr/ADR-empresa-user-invites-table-rls.md` |
| **Change Log** | 2026-03-25 — US-INV-01: schema + RLS + ADR · 2026-03-25 — Pós-QA: FORCE RLS + ADR (deploy/smoke) |

#### QA Results — US-INV-01

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-25 |
| **Gate** | **PASS** (com observações não bloqueantes) |

**Rastreio (critérios de aceite → evidência)**

1. **AC1 (schema)** — `supabase/migrations/20260325120000_create_empresa_invites.sql` define `empresa_invites` com `empresas_id`, `token_hash` (único), `created_by`, `created_at`, `expires_at`, `used_at`, `revoked_at`, `invited_email` opcional; FKs e índices coerentes.
2. **AC2 (RLS)** — Políticas `select` / `insert` / `update`: superadmin via `current_app_role()` **ou** `current_role()`; admin apenas `empresas_id = current_empresa_id()` e insert exige `created_by = auth.uid()` + empresa alinhada. Papéis sem match não recebem linhas (RLS sem política aplicável → negação). `GRANT` só para `authenticated`; sem política para `anon` — alinhado ao ADR (validação pública na API na US-INV-02).
3. **AC3 (documentação)** — [`docs/adr/ADR-empresa-user-invites-table-rls.md`](../adr/ADR-empresa-user-invites-table-rls.md) nomeia a tabela, RLS, hash e **não** documenta segredo de URL.
4. **AC4 (sem rotas)** — Diff limitado a migração + ADR; sem alteração em `backend/src` rotas — atende escopo “só infra”.
5. **AC5 (quality gates)** — Evidência na entrega do dev: `lint` / `typecheck` / `test` na raiz com exit 0; **recomenda-se repetir no branch antes do merge** após aplicar migração no ambiente alvo.

**Observações (não bloqueantes)**

- **Produção / staging:** validar migração com `supabase db push` (ou pipeline do time) e smoke RLS no painel ou script — fora do repositório, risco operacional normal.
- **`FORCE ROW LEVEL SECURITY`:** outras tabelas (ex. DAS) usam; aqui não. Se política interna exigir endurecimento para papéis bypass de dono, pode ser follow-up com @architect.
- **TTL 7 dias:** não no banco; depende da US-INV-02 ao preencher `expires_at` — esperado pelo PRD.

**Riscos residuais (baixo para US-INV-01)**

- Uso do **service role** no backend ignora RLS (por design); confiar em validação na camada Express nas stories seguintes.

---

### US-INV-02 — Backend: criar, listar, revogar e validar convite (API)

**Como** aplicação web, **quero** endpoints Express para o ciclo de vida do convite e uma validação pública segura, **para** suportar UI admin e fluxo de cadastro sem expor o token no banco em texto puro (FR-01–FR-03, FR-05–FR-08, NFR-01, NFR-02).

**Critérios de aceite**

1. **POST autenticado** cria convite: resposta inclui **URL absoluta** utilizável (base configurável — env ou derivada do request — documentada para @dev). Corpo opcional para `empresas_id` **somente** aceito se requester for `superadmin`; para `admin`, `empresas_id` é sempre derivado do `getRequesterContext` e qualquer outro valor é **rejeitado** (400/403) (FR-02).
2. **Admin** sem `empresaId` no contexto: criação retorna erro explícito (**403** ou **400** com mensagem clara), consistente com expectativa de `listUsers`.
3. **GET autenticado** lista convites **pendentes** (não usados, não revogados, não expirados — definir filtro na spec @architect): escopo por empresa para `admin`; `superadmin` pode filtrar por `empresas_id` quando parâmetro presente (FR-06).
4. **POST/PATCH autenticado** revoga convite pendente no mesmo escopo de escrita (FR-07); convite já usado ou revogado não pode “ser reativado” por esse endpoint.
5. **GET ou POST público** (sem JWT) **valida** token: respostas discretas `valid` / `expired` / `revoked` / `used` / `invalid` **sem** expor lista de usuários, e com dados mínimos opcionais (ex. nome fantasia) apenas se @architect aprovar (FR-05).
6. **Rate limiting** básico ou middleware placeholder documentado para rotas públicas de validação (NFR-02 — pode ser “TODO configurável” com limite default em dev).
7. Testes backend (Node test runner) cobrem: criação como admin (empresa forçada), rejeição de empresa incorreta, validação pública, revogação.
8. Quality gates da raiz passam.

**Notas técnicas**

- Centralizar reuso de normalização de role/empresa com `users.service.js`.
- Não logar query string completa com token em `console.log` em produção.

**Dependências:** **US-INV-01** mergeada.

**CodeRabbit:** validação de entrada nos controllers; respostas de erro sem stack trace em produção.

#### Dev Agent Record — US-INV-02

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | API `/api/invites`: POST criar, GET listar pendentes, POST/PATCH `:id/revoke`, GET/POST `validate` público com rate limit. Service role no serviço; escopo admin/superadmin alinhado a `getRequesterContext`. Env: `INVITE_APP_BASE_URL`, `INVITE_VALIDATE_MAX_PER_MINUTE`. ADR (tabela de rotas). Pós-QA: token `morgan` mascarado em URLs de `/invites/validate`; testes `validate` expirado e `revoke` com sucesso; `log-redact` + testes unitários; ADR com PATCH revoke. |
| **File List** | `backend/src/server.js`, `backend/src/utils/log-redact.js`, `backend/src/services/empresa-invites.service.js`, `backend/src/controllers/empresa-invites.controller.js`, `backend/src/routes/empresa-invites.routes.js`, `backend/src/middlewares/invite-validate-rate-limit.js`, `backend/src/routes/index.js`, `backend/src/config/env.js`, `backend/src/utils/errors.js`, `backend/.env.example`, `backend/tests/log-redact.test.js`, `backend/tests/empresa-invites.service.test.js`, `backend/tests/empresa-invites-routes.contract.test.js`, `docs/adr/ADR-empresa-user-invites-table-rls.md` |
| **Change Log** | 2026-03-25 — US-INV-02: API convites + testes + doc \| 2026-03-25 — US-INV-02 pós-QA: redação de URL em logs (validate), PATCH revoke, cenários expired/revoke OK em testes |

#### QA Results — US-INV-02

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-25 |
| **Gate** | **PASS** (com observações não bloqueantes) |

**Rastreio (critérios de aceite → evidência)**

1. **AC1** — `createInvite` usa `getRequesterContext`; **admin** rejeita `empresas_id` no corpo (**400**); **superadmin** exige `empresas_id`; resposta inclui `inviteUrl` absoluto via `resolveInviteAppBaseUrl` (`INVITE_APP_BASE_URL` → `FRONTEND_URL` → `Origin`). Documentado no ADR e `.env.example`.
2. **AC2** — Admin sem `empresaId`: `throw forbidden()` (**403**), alinhado a `listUsers` / `listPendingInvites`.
3. **AC3** — `listPendingInvites` filtra `used_at`/`revoked_at` nulos, `expires_at > now`; **admin** força `empresas_id` do contexto; **superadmin** aplica `query.empresas_id` quando presente.
4. **AC4** — Revogação via **`POST /api/invites/:inviteId/revoke`** (critério cita POST/PATCH; PATCH não exposto — aceitável se produto padronizar POST). Bloqueia convite **usado** ou **já revogado** (**400**); escopo **admin** por empresa.
5. **AC5** — `GET` e `POST /validate` sem `requireAuth`; resposta só `data.status` ∈ `valid` \| `expired` \| `revoked` \| `used` \| `invalid` sem nome fantasia (conforme escopo mínimo).
6. **AC6** — `inviteValidateRateLimit` + `INVITE_VALIDATE_MAX_PER_MINUTE`; comentário de limitação multi-instância no middleware.
7. **AC7** — `empresa-invites.service.test.js` cobre criação admin, recusa `empresas_id` no corpo, validação pública, revogação com erro se já usado, listagem; `empresa-invites-routes.contract.test.js` cobre ordem auth/rate limit.
8. **AC8** — Gates da raiz executados na entrega (**lint** / **typecheck** / **test**); revalidar no branch antes do merge.

**Observações (não bloqueantes)**

- **Rate limit:** estado em memória por processo; em **várias réplicas** o limite é por instância — mitigar com API gateway/Redis se necessário.
- **Logs:** em `development`, `morgan('dev')` pode registrar `GET /api/invites/validate?token=…` — evitar compartilhar logs brutos; produção costuma reduzir verbosidade.
- **Testes:** falta cenário explícito de `validate` com **`expired`** e **revoke com sucesso** (happy path); bom incremento para regressão futura.
- **PATCH revoke:** não implementado; se API pública precisar simetria com outros recursos, tratar como dívida opcional.

**Riscos residuais**

- Enumeração de tokens: mitigado por token longo + hash + rate limit; não substitui CAPTCHA (fora de escopo).

---

### US-INV-03 — Backend: ao concluir cadastro, vincular usuário e consumir convite

**Como** convidado que completou signup com token válido, **quero** que o sistema crie o vínculo em `role_x_user_x_empresa` com papel **`usuario`** e empresa do convite, **e** marque o convite como usado exatamente uma vez, **para** cumprir FR-04, D-01, D-06 e NFR-04.

**Critérios de aceite**

1. **Gate:** Documento da **US-INV-01** ou ADR complementado descreve o **momento** da operação (ex.: após `signUp` bem-sucedido no cliente + chamada ao backend com sessão; **ou** RPC `security definer`; **ou** endpoint backend que orquestra sign-up com service role) — implementação segue esse contrato sem ambiguidade (FR-A02).
2. Após fluxo bem-sucedido, existe linha em `role_x_user_x_empresa` com `user_id` do novo usuário, `empresas_id` do convite, e `roles_id` correspondente a **`usuario`** (mesma fonte de verdade que `updateUser`/`listUsers`).
3. Convite passa a estado **consumido** (`used_at` preenchido); segunda tentativa com mesmo token **não** cria segundo vínculo (erro controlado).
4. Se existir **limite de capacidade** por empresa (vide lógica em `users.service.js`), aceitar convite **respeita** a mesma regra: falha com mensagem compreensível (FR-A03).
5. Testes cobrem: happy path; token expirado; token revogado; condição de corrida minimizada (ex. upsert idempotente ou constraint única documentada).
6. Quality gates da raiz passam.

**Notas técnicas**

- Definir interação com `profiles` (trigger existente) se necessário para coerência de papel.
- Não promover a **admin** via este fluxo (fora de escopo do PRD).

**Dependências:** **US-INV-02** (criação/validação de tokens); frontend ou fluxo Register preparado para enviar token ao backend conforme contrato (pode ser entregue em paralelo com **US-INV-05** após contrato estável).

**CodeRabbit:** atenção a race conditions e vazamento de e-mail em logs.

#### Dev Agent Record — US-INV-03

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | `POST /api/invites/accept` (Bearer + `{ "token": "..." }`, opcional `mei`) após signup no cliente. Consumo: update condicional em `empresa_invites.used_at`; `ensureEmpresaCapacity` + `ensureRoleId('usuario')`; insert em `role_x_user_x_empresa`; **upsert** `profiles.role = 'usuario'` (mitigação QA coerência perfil). Compensação: em falha após claim remove vínculo inserido + `used_at` null; falhas de reversão logadas. ADR FR-A02: `mei` para US-INV-05 + smoke staging. |
| **File List** | `backend/src/services/users.service.js`, `backend/src/services/empresa-invites.service.js`, `backend/src/controllers/empresa-invites.controller.js`, `backend/src/routes/empresa-invites.routes.js`, `backend/tests/empresa-invites.service.test.js`, `backend/tests/empresa-invites-routes.contract.test.js`, `docs/adr/ADR-empresa-user-invites-table-rls.md` |
| **Change Log** | 2026-03-25 — US-INV-03: endpoint accept, vínculo usuario, testes e ADR \| 2026-03-25 — pós-QA US-INV-03: `profiles` upsert, compensação com delete do vínculo, logs de reversão, ADR (`mei`/smoke), teste falha upsert |

#### QA Results — US-INV-03

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-25 |
| **Gate** | **PASS** (observações não bloqueantes) |

**Rastreio (critérios de aceite → evidência)**

1. **AC1 / FR-A02** — ADR `docs/adr/ADR-empresa-user-invites-table-rls.md` (§ FR-A02) define momento pós-signup e `POST /api/invites/accept` com Bearer e `{ "token", "mei"? }`; implementação em `acceptInvite` (`empresa-invites.service.js`) consistente com o ADR.
2. **AC2** — Após sucesso, insert em `role_x_user_x_empresa` com `ensureRoleId(..., 'usuario')` e `empresas_id` do convite; mesma stack que `createUser` / `updateUser` (`users.service.js`).
3. **AC3** — `used_at` preenchido por `UPDATE` condicional (`used_at`/`revoked_at` nulos, `expires_at` futuro); leitura prévia rejeita convite já usado; `!claimed` → 400 controlada; não há segundo vínculo pelo mesmo token na mesma corrida bem-sucedida.
4. **AC4** — `ensureEmpresaCapacity` reutilizado; mensagens alinhadas a `createUser`; teste `acceptInvite — limite de capacidade reverte used_at` valida falha + compensação de `used_at`.
5. **AC5** — Cobertura em `backend/tests/empresa-invites.service.test.js`: happy path, expirado, revogado, já utilizado, corrida (`claimData` vazio), conta já vinculada, perfil admin bloqueado, capacidade; contrato `POST /accept` + `requireAuth` em `empresa-invites-routes.contract.test.js`.
6. **AC6** — `npm test` na raiz do monorepo executado nesta revisão: **0** falhas (frontend Vitest + backend node:test).

**NFR / segurança (CodeRabbit)**

- **Concorrência:** claim “compare-and-set” documentado no código; cenário de corrida coberto por teste unitário.
- **Logs:** `errorHandler` em `NODE_ENV === 'production'` não registra corpo; fora disso usa apenas `summarizeBody` (chaves/tamanho), não valores — risco baixo de vazar token em log de erro.

**Observações não bloqueantes**

1. **Coerência `profiles.role`:** elegibilidade bloqueia admin/superadmin via `profiles`; após aceite o contexto da app prioriza `role_x_user_x_empresa` (`getRequesterContext`). Divergência residual de `profiles` não atualizado é aceitável até exigência explícita em story futura.
2. **`deps.ensureEmpresaCapacity` / `deps.mei`:** injeção no serviço só para testes; HTTP expõe opcionalmente `mei` no corpo — documentar no contrato público para US-INV-05 se o front precisar de não-MEI.
3. **Teste integrado Supabase:** não há E2E contra banco real nesta story; recomenda-se smoke manual ou teste de contrato HTTP em staging antes de produção.

**Risco residual**

- Entre `claim` e `releaseInvite`, falha grave de persistência poderia, em teoria, deixar convite consumido sem vínculo; probabilidade baixa; recuperação operacional/manual se custo de transação única RPC não for adotado.

---

### US-INV-04 — Frontend admin: gerar link, copiar, listar e revogar

**Como** admin ou superadmin, **quero** uma seção em **Configurações** (ou em **Gerenciar usuários**) para criar convites e copiar o link, **para** onboarding sem superadmin (FR-01, FR-03, FR-06, FR-07, G5).

**Critérios de aceite**

1. Apenas **`admin`** e **`superadmin`** veem a seção; **`usuario`** (e demais sem permissão) **não** veem link no menu nem rota dedicada autenticada (redirecionamento igual a `/settings/users` hoje para não-admin) (FR-03).
2. **Admin:** botão “Gerar link” chama API **sem** enviar outro `empresas_id`; feedback de sucesso com **Copiar link** (acessível: nome no botão ou `aria-label`).
3. **Superadmin:** seletor de empresa (lista vinda de endpoint existente ou novo — alinhado ao PRD §10 Q3) antes de gerar, quando aplicável.
4. Lista de convites pendentes mostra ao menos: data de criação, expiração, criador (se disponível); ação **Revogar** com confirmação.
5. Erros de API exibidos com toast ou mensagem inline, sem exibir token em logs do cliente.
6. Testes Vitest (ou ampliar existentes) cobrem visibilidade por role e fluxo de cópia mockando API.
7. Quality gates da raiz passam.

**Notas técnicas**

- Reutilizar `apiClient` e padrões de `ManageUsers.tsx` / `Settings.tsx`.
- URL retornada pelo backend deve ser a fonte de verdade (evitar montar token no front).

**Dependências:** **US-INV-02** estável (contrato de resposta).

**CodeRabbit:** acessibilidade do botão copiar; evitar armazenar token em `localStorage` sem necessidade.

#### Dev Agent Record — US-INV-04

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Igual baseline US-INV-04; **pós-QA:** testes Vitest superadmin (`createInvite` com `{ empresas_id }` após seleção de empresa), revogação com `confirm` (chama API se OK, não chama se cancelar); botão **Gerar link** com `aria-busy`; `console.log` em `fetchEmpresas` apenas em `import.meta.env.DEV`. |
| **File List** | `frontend/src/services/invitesService.ts`, `frontend/src/services/invitesService.test.ts`, `frontend/src/pages/ManageUsers.tsx`, `frontend/src/pages/ManageUsers.invites.test.tsx` |
| **Change Log** | 2026-03-25 — US-INV-04: UI convites admin/superadmin, serviço, testes Vitest, gates \| 2026-03-25 — pós-QA US-INV-04: testes superadmin/revogar, `aria-busy`, logs empresas só em DEV |

#### QA Results — US-INV-04

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-25 |
| **Gate** | **PASS** (observações não bloqueantes) |

**Rastreio (critérios de aceite → evidência)**

1. **AC1 (FR-03)** — `ManageUsers` usa `hasRole(role, ['admin'])` (superadmin incluído por `roles.ts`); early return para não autorizados. `App.tsx` redireciona `/settings/users` quando `!hasRole(role, ['admin'])`. Em `Settings.tsx`, entrada “Gerenciar usuários” só para `superadmin` \| `admin`. Papel `outsider` não passa em `hasRole(..., ['admin'])` (mesmo guard que `usuario`). Teste: `ManageUsers.invites.test.tsx` — `usuario` não vê “Convites por link” e não chama `listPendingInvites`.
2. **AC2** — `handleGenerateInvite`: admin chama `createInvite({})`. Teste Vitest confirma `createInviteMock` com `{}`. Botão “Copiar link” com `aria-label="Copiar link de convite"`.
3. **AC3** — Superadmin: seletor dedicado (“Empresa para o convite”) + `createInvite({ empresas_id: inviteEmpresaId })`; botão “Gerar link” desabilitado sem empresa. Lista de empresas via `listEmpresas` (existente). *Cobertura automática:* fluxo superadmin + corpo `{ empresas_id }` **não** está em teste de página (ver observações).
4. **AC4** — Tabela: criação, expiração, criador (`getInviteCreatorLabel` ↔ `listUsers`), coluna extra e-mail convidado; **Revogar** com `window.confirm`. OK por inspeção de código.
5. **AC5** — Falha em **listagem**: `toast.error` + `invitesError` inline. **Gerar/revogar**: toast. `inviteUrl` vem só da API; texto de sucesso não ecoa URL completa na UI. Sem `localStorage` do token/URL.
6. **AC6** — `invitesService.test.ts` (contrato HTTP); `ManageUsers.invites.test.tsx` (visibilidade + gerar/copiar admin). *Lacunas:* ver observações.
7. **AC7** — `npm test` na raiz nesta revisão: **0** falhas (Vitest frontend + backend `node:test`).

**NFR / segurança (nota CodeRabbit)**

- **A11y:** `aria-label` no copiar atende; botão “Gerar link” poderia ter `aria-busy` ou texto dinâmico em loading (melhoria menor).
- **Dados sensíveis:** URL com `convite` só em estado React + clipboard a pedido do utilizador — alinhado à nota de não persistir em `localStorage`.

**Observações não bloqueantes**

1. **Testes:** acrescentar 1–2 casos: superadmin seleciona empresa e `createInvite` recebe `{ empresas_id }`; revogação chama `revokeInvite` após `confirm` mockado (`vi.stubGlobal('confirm', ...)`).
2. **Criador “—”:** se `created_by` não estiver na lista carregada de utilizadores (ex.: utilizador removido), a célula mostra “—”; aceitável face ao “se disponível”.
3. **`console.log`** em `fetchEmpresas` em `ManageUsers.tsx` é pré-existente ao épico de convites; não regista convites; avaliar remoção/guard `DEV` em housekeeping.

**Risco residual**

- Baixo: regressão de fluxo superadmin não coberta por teste de integração UI; mitigado por implementação explícita e contrato backend já testado (US-INV-02).

---

### US-INV-05 — Frontend público: cadastro com convite e estados de token

**Como** convidado, **quero** abrir o link, ver se o convite ainda é válido e concluir o cadastro, **para** entrar já na empresa certa (FR-04, FR-05, G1, D-03).

**Critérios de aceite**

1. Rota pública (ex. `/register?convite=<token>` **ou** rota dedicada) preserva o parâmetro ao recarregar, em linha com cuidados já usados em recovery/OAuth em `App.tsx` quando relevante.
2. Na montagem, chama validação pública: estados **válido**, **expirado**, **revogado**, **já usado**, **inválido** com mensagens amigáveis e **sem** vazar dados sensíveis.
3. Em estado válido, formulário de registro reutiliza componentes/validações de `Register.tsx` atual; após sucesso, executa fluxo acordado na **US-INV-03** (chamada explícita documentada na story técnica).
4. Meta **`noindex`** (ou equivalente) na página de cadastro com convite, se tecnicamente simples no Vite (NFR-06) — ou nota de follow-up documentada no épico se não feito.
5. Fluxo **sem** query `convite` permanece **inalterado** em comportamento (regressão).
6. Testes Vitest cobrem parsing de query e estados mockados da API pública.
7. Quality gates da raiz passam.

**Notas técnicas**

- Não exibir token inteiro na UI; truncar em logs de debug.

**Dependências:** **US-INV-03** (handshake pós-signup); **US-INV-02** (validate).

**CodeRabbit:** XSS em query params (React já escapa; não usar `dangerouslySetInnerHTML` com token).

#### Dev Agent Record — US-INV-05

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | `/register?convite=` preservado via `useLocation().search` (React Router). Montagem: `validateInviteTokenPublic` → mensagens por `status` (sem mostrar token). Formulário extraído em `RegisterFormFields`; fluxo convite: `signUp` → `getSession` ou `signIn` → `acceptInviteRequest` → `initAuth`. Backend `signUp` passa `session` quando Supabase devolve (para Bearer no `accept`). Meta `noindex` injetada no `head` só com query convite. Util `registerInviteQuery.ts`; testes `registerInviteQuery.test.ts`, `Register.invite.test.tsx`; contrato em `invitesService.test.ts` (validate/accept). **Pós-QA US-INV-05:** `apiClient` mascarar `token` em `logRequestFailure` para URLs `/invites/validate`; testes Vitest `redactInviteValidateTokenInUrlForLogs`; `Register.invite.test.tsx` cobre `revoked` / `used` / `invalid` na página. |
| **File List** | `backend/src/services/auth.service.js`, `frontend/src/services/authService.ts`, `frontend/src/services/apiClient.ts`, `frontend/src/services/apiClient.test.ts`, `frontend/src/store/authStore.ts`, `frontend/src/services/invitesService.ts`, `frontend/src/services/invitesService.test.ts`, `frontend/src/pages/Register.tsx`, `frontend/src/utils/registerInviteQuery.ts`, `frontend/src/utils/registerInviteQuery.test.ts`, `frontend/src/pages/Register.invite.test.tsx` |
| **Change Log** | 2026-03-25 — US-INV-05: registo com convite, validate público, accept pós-signup, session opcional no signup, testes · 2026-03-25 — pós-QA US-INV-05: redact `token` nos logs do cliente (validate), testes UI revoked/used/invalid, `apiClient.test.ts` |

#### QA Results — US-INV-05

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-25 |
| **Gate** | **PASS** (observações não bloqueantes) |

**Rastreio (critérios de aceite → evidência)**

1. **AC1** — `Register` usa `useLocation().search` + `getConviteTokenFromSearch`; query mantida pelo React Router em navegação/reload. Link “Faça login” usa `loginHref` com `location.search` quando existe (preserva `convite`). Fallback `index.html`/recovery usa `token=` / recovery — não colide com `convite`.
2. **AC2** — Montagem: `validateInviteTokenPublic` → `GET /api/invites/validate?token=`. Estados `InviteValidationStatus` mapeados em `inviteStatusUserMessage`; `network_error` em rejeição da promise. UI não renderiza o token; mensagens genéricas. Token vazio → `invalid` sem HTTP (`invitesService`).
3. **AC3** — `RegisterFormFields` reutiliza os mesmos campos/validações HTML5; fluxo pós-cadastro: `signUp` → `getSession` ou `signIn` → `acceptInviteRequest` (`POST /invites/accept`, `mei: true`) → `initAuth`. Backend `signUp` devolve `session` quando Supabase a fornece (alinhado US-INV-03).
4. **AC4** — `useEffect` injeta `<meta name="robots" content="noindex, nofollow">` apenas com `hasInviteQuery`; cleanup remove o nó.
5. **AC5** — Sem `convite`: `validateInviteTokenPublic` não é chamado (`Register.invite.test.tsx`); formulário e título “Criar conta” como baseline.
6. **AC6** — `registerInviteQuery.test.ts` (parsing + mensagens para todos os `status`); `Register.invite.test.tsx` (sem query, válido, expirado); `invitesService.test.ts` (validate URL/encode, accept body). *Lacuna leve:* não há teste de página para `revoked` / `used` / `invalid` (mensagens já cobertas por util).
7. **AC7** — `npm test` na raiz nesta revisão: **0** falhas (Vitest **135** + backend **173**).

**NFR / segurança (CodeRabbit)**

- **XSS:** texto via React; sem `dangerouslySetInnerHTML` com query — **OK**.
- **Segredo em logs:** `apiClient.logRequestFailure` pode registar `url` em falhas HTTP; em erro sobre `/invites/validate` o URL poderia conter query `token` em ambientes com logging verboso — risco **baixo**; backend já trata redact em logs de rota validate (US-INV-02). Mitigação futura opcional: mascarar query no cliente para essa rota.

**Observações não bloqueantes**

1. **Confirmação de e-mail Supabase:** se não houver sessão após `signUp`/`signIn`, mensagem orienta utilizador; fluxo automático de `accept` pode exigir login manual — aceitável até produto exigir contrato explícito pós-confirmação.
2. **Testes UI:** 1 caso por estado negativo (`revoked`, `used`, `invalid`) em `Register.invite.test.tsx` fecharia o rácio AC6 na UI.
3. **React Router v7** warnings nos testes — cosmético.

**Risco residual**

- **Baixo:** happy path E2E (signup + accept) depende de Supabase com sessão imediata ou `signIn` bem-sucedido; documentado no código.

---

### US-INV-07 — Operações e release: schema `empresa_invites` por ambiente

**Como** desenvolvedor ou responsável por release, **quero** um processo claro para aplicar as migrations de `public.empresa_invites` no **mesmo** Postgres/Supabase que o backend usa em cada ambiente, **para** cumprir **NFR-07** e **OR-01–OR-05** do PRD v1.1 e evitar o erro `relation "public.empresa_invites" does not exist`.

**Critérios de aceite**

1. Documentação de onboarding ou runbook de release (ex. trecho em `README.md` da raiz ou `backend/README.md`, com link ao brief [`docs/brief/brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md)) descreve: confirmar paridade **`.env` do backend ↔ projeto Supabase** (OR-02); após `git pull` com novas migrações, aplicar `supabase/migrations/20260325120000_create_empresa_invites.sql` e `20260326120000_empresa_invites_force_row_level_security.sql` no banco alvo — local (Supabase CLI: `db reset` ou `migration up`, conforme política do time) e remoto (`npm run db:migrate:prod:check` / `db:migrate:prod` com variáveis, ou pipeline equivalente) (OR-01, OR-03).
2. Checklist de pós-deploy (ou template de PR de release) inclui verificação: `select to_regclass('public.empresa_invites');` retorna a relação, não `null`, no banco do ambiente (OR-04).
3. Playbook de suporte: erro Postgres **`relation "public.empresa_invites" does not exist`** classificado como **migrations não aplicadas** ou **projeto/errado de conexão**, não como defeito da regra de negócio do convite, até evidência em contrário (OR-05).
4. **NFR-07:** está declarado que versão do backend que expõe **`/api/invites`** não sobe para staging/prod **sem** esse checklist (aceite por @po / @github-devops conforme governo do time).

**Notas técnicas**

- Story **não** exige alteração de código de produto; foco em **docs + processo**. Se o repositório já cumpre 1–4 apenas com o brief + PRD, marcar critérios como atendidos com referência explícita aos arquivos.
- **Dependências:** **US-INV-01** mergeada (migrations presentes no repo).

**CodeRabbit:** N/A.

#### Dev Agent Record — US-INV-07

| Campo | Valor |
| --- | --- |
| **Status** | Ready for Review |
| **Agent model** | Cursor agent |
| **Completion notes** | Runbook [`docs/runbooks/supabase-empresa-invites-migrations.md`](../runbooks/supabase-empresa-invites-migrations.md): NFR-07, OR-01–OR-05, local/remoto, smoke `to_regclass`, checklist PR/release, triagem suporte. README raiz + `backend/README.md` com links. Brief atualizado com referência ao runbook. **Pós-QA:** `.github/PULL_REQUEST_TEMPLATE/supabase-migrations.md`; runbook — subsecção “Só projeto Supabase remoto” + nota sobre contexto da CLI em `migration up`; README — linha sobre modelo de PR. |
| **File List** | `docs/runbooks/supabase-empresa-invites-migrations.md`, `README.md`, `backend/README.md`, `docs/brief/brief-empresa-invites-relation-does-not-exist.md`, `.github/PULL_REQUEST_TEMPLATE/supabase-migrations.md` |
| **Change Log** | 2026-03-25 — US-INV-07: runbook + READMEs + link no brief · 2026-03-25 — pós-QA: PR template supabase-migrations + runbook remoto/CLI + README |

#### QA Results — US-INV-07

| Campo | Valor |
| --- | --- |
| **Revisor** | Quinn (QA) |
| **Data** | 2026-03-25 |
| **Gate** | **PASS** (observações não bloqueantes) |

**Rastreio (critérios de aceite → evidência)**

1. **AC1** — [`docs/runbooks/supabase-empresa-invites-migrations.md`](../runbooks/supabase-empresa-invites-migrations.md): OR-02 (paridade `backend/.env` ↔ projeto Supabase), OR-01 (ficheiros de migration nomeados), OR-03 local (`npx supabase db reset` / `migration up`) e remoto (`npm run db:migrate:prod:check` / `db:migrate:prod`, `scripts/supabase-migrate-prod.mjs`); link ao brief. [`README.md`](../../README.md) e [`backend/README.md`](../../backend/README.md) apontam para o runbook e o sintoma.
2. **AC2** — Runbook: secção “Smoke pós-deploy (OR-04)” com `select to_regclass('public.empresa_invites');` e “Checklist rápido (PR / release)” com checkboxes incluindo essa verificação.
3. **AC3** — Runbook “Sintoma típico (suporte — OR-05)” classifica `relation "public.empresa_invites" does not exist` como schema/ambiente; [`docs/brief/brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md) referencia o runbook.
4. **AC4** — Runbook “NFR-07 (gate de release)” + parágrafo **NFR-07** no README raiz; aceite operacional atribuído a @po / @github-devops conforme story.

**Observações (não bloqueantes)**

- Não existe ficheiro em `.github/` para template de PR; o AC2 admite checklist em Markdown — atendido no runbook. Follow-up opcional: template de PR com link ao checklist.
- Utilizadores só com Supabase remoto: runbook já cita `supabase link` + `db push`; reforço explícito na secção “Desenvolvimento local” é melhoria opcional.
- Sem testes automatizados para documentação; validação manual + smoke no ambiente alvo.

---

### US-INV-06 *(Could)* — Convite com e-mail pré-vinculado

**Como** admin, **quero** opcionalmente fixar o e-mail do convidado ao gerar o link, **para** reduzir risco de cadastro com e-mail errado (D-05, Should do PRD).

**Critérios de aceite**

1. Corpo opcional `invited_email` na criação; validação de formato.
2. No aceite, signup **só prossegue** se e-mail coincidir (case-insensitive, normalização documentada).
3. Token sem `invited_email` mantém comportamento da **US-INV-05**.
4. Testes backend + frontend cobrem os dois modos.
5. Quality gates da raiz passam.

**Dependências:** **US-INV-02**, **US-INV-03**, **US-INV-04**, **US-INV-05** baseline.

**CodeRabbit:** não armazenar e-mail duplicado em claro sem necessidade; revisar LGPD interna.

---

## Referências rápidas

- PRD: [`docs/prd/PRD-convite-usuario-por-empresa.md`](../prd/PRD-convite-usuario-por-empresa.md)
- `backend/src/services/users.service.js` — contexto, capacidade, `role_x_user_x_empresa`
- `frontend/src/App.tsx` — `/register`, guards de role

---

*Stories preparadas para handoff @dev; ordem e IDs ajustáveis pelo @po no backlog.*
