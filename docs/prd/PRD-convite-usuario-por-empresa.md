# PRD — Convite por link: cadastro de usuário vinculado à empresa (admin escopado; fluxo oculto para usuários comuns)

| Campo | Valor |
| --- | --- |
| **Produto** | Meu Financeiro |
| **Tipo** | Brownfield (auth multi-tenant por `role_x_user_x_empresa`; rotas `/register`, `/settings`, `/settings/users`) |
| **Versão do documento** | 1.1 |
| **Data** | 2026-03-25 |
| **Autor** | Morgan (PM) |
| **Brief de entrada** | (1) Síntese @analyst — convite com empresa fixada; admin só na própria empresa; sem exposição na navegação para `usuario`. (2) Brief de projeto: [`docs/brief/brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md) — causal operacional `relation "public.empresa_invites" does not exist` e plano de aplicação de migrations. |

## Status

**Em entrega incremental** — gate @architect atendido no ADR [`docs/adr/ADR-empresa-user-invites-table-rls.md`](../adr/ADR-empresa-user-invites-table-rls.md); **US-INV-01** e **US-INV-02** encaminhadas conforme [`docs/stories/epic-convite-usuario-por-empresa-prd.md`](../stories/epic-convite-usuario-por-empresa-prd.md). Riscos residuais: **US-INV-03** (consumo pós-signup), UX admin/pública nas stories seguintes, e **alinhamento schema–código em cada ambiente** (ver §2.4 e NFR-07).

---

## 1. Goals and Background Context

### 1.1 Goals

- **G1 — Onboarding guiado:** Permitir que **administradores de empresa** convidem colaboradores com um **link** que, após cadastro, associa o novo usuário à **empresa correta** automaticamente.
- **G2 — Menor superfície de erro:** Evitar cadastros “soltos” ou na empresa errada por depender de ajuste manual pós-login.
- **G3 — Segurança e escopo:** **Admin** só gera convites para **`empresas_id` igual ao do seu contexto**; **superadmin** mantém capacidade ampla conforme regras já existentes de produto.
- **G4 — Discrição (“oculto”):** Usuários com papel **`usuario`** (e equivalentes sem privilégio) **não veem** telas nem itens de menu de geração de convite; o fluxo de **aceite** é acessível apenas por **URL** (deep link), não promovido na app autenticada.
- **G5 — Operável:** Copiar link a partir de **Configurações** (ou subseção dedicada), com feedback claro e rastreio mínimo (quem criou, validade, uso).

### 1.2 Background Context

Hoje existem cadastro em **`/register`**, gestão de usuários em **`/settings/users`** (restrita a `admin` via `hasRole`), e no backend **`getRequesterContext`** / **`listUsers`** / **`updateUser`** em `backend/src/services/users.service.js`, com vínculo em **`role_x_user_x_empresa`** e políticas RLS em `backend/supabase/roles_empresas_policies.sql` (funções `current_app_role()`, `current_empresa_id()`).

Não há, no escopo atual descrito no repositório, um **fluxo de convite com token** que amarre **signup público** à criação do vínculo empresa–usuário de forma **atômica e auditável**. Stakeholders pedem essa capacidade sem ampliar a visibilidade do recurso para todos os usuários finais.

### 1.3 Decisões de produto (PM) — registro explícito

| ID | Decisão | Detalhe |
| --- | --- | --- |
| **D-01** | Papel que recebe convite | Novo usuário criado pelo link entra como **`usuario`** vinculado à empresa do convite (alinhado a restrições atuais: admin não promove terceiros a `admin` sem fluxo separado). |
| **D-02** | Seleção de empresa na UI | **Admin:** não escolhe empresa em lista global — empresa **implícita** do contexto (backend valida). **Superadmin:** pode selecionar empresa alvo ao gerar convite (se a UI de configuração expuser lista). |
| **D-03** | “Página oculta” | **Sem** entrada em menu para não-admin; rota pública de aceite (ex. `/register?convite=…` ou rota dedicada) pode existir mas **não** é anunciada no app logado como `usuario`. |
| **D-04** | Revogação e expiração | Todo convite tem **validade** configurável (default sugerido: **7 dias**, ajustável por @po). Admin/superadmin pode **revogar** antes do uso. |
| **D-05** | E-mail do convidado | **Should:** opcão de **pré-fixar e-mail** no convite (convidado só completa senha / confirma) **ou** exigir que o e-mail do signup **coincida** com o convite — **decisão em §10** se não fechada antes da implementação. |
| **D-06** | Reuso do link | **Padrão proposto:** **1 uso** por convite (após consumo, token inválido). Alternativa (N usos) apenas se @po aprovar (maior risco de vazamento). |

### 1.4 Change Log

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 2026-03-25 | 1.0 | Versão inicial a partir do brief do @analyst (convite por empresa) | PM |
| 2026-03-25 | 1.1 | Incorporação do brief operacional (migrations / `empresa_invites`); requisitos de release §2.4; NFR-07; referências ao épico e ADR; suposições técnicas com nome de tabela acordado | PM |

---

## 2. Requirements

### 2.1 Funcionais

- **FR-01:** **Superadmin** e **admin** autenticados podem **criar** um convite; resposta inclui **URL completa** pronta para copiar (base da app + query/path acordado).
- **FR-02:** **Admin** autenticado só cria convites cuja empresa alvo é **estritamente** a retornada por seu contexto (`empresaId`); qualquer tentativa de especificar outra empresa no cliente é **ignorada ou rejeitada** no servidor.
- **FR-03:** **Usuario** (e demais papéis sem permissão) **não** acessam UI de criação/listagem de convites; rotas protegidas retornam **403** ou redirecionamento para `/settings` (padrão atual do projeto).
- **FR-04:** Visitante com link válido consegue **concluir cadastro** (fluxo existente de registro estendido) e, ao final, possui registro em **`role_x_user_x_empresa`** com `empresas_id` do convite e role **`usuario`**, e convite marcado **consumido** (se D-06 = 1 uso).
- **FR-05:** Endpoint ou ação **pública** (sem JWT) permite **validar** token: resposta indica válido/expirado/revogado/usado **sem** vazar dados sensíveis (no máximo nome fantasia ou id mascarado, conforme @architect).
- **FR-06:** Listagem de convites **pendentes** para admin: apenas da **própria empresa**; superadmin pode filtrar por empresa se produto incluir essa vista.
- **FR-07:** **Revogar** convite pendente; após revogação, link não aceita novos cadastros.
- **FR-08:** Auditoria mínima persistida: `created_by`, `empresas_id`, `created_at`, `expires_at`, `used_at`, `revoked_at` (nomes de colunas podem variar; conceito obrigatório).

### 2.2 Não funcionais

- **NFR-01 — Segurança:** Token **opaque** (alta entropia); armazenar **hash** no banco se @architect assim especificar; nunca logar token completo em produção.
- **NFR-02 — Abuso:** Rate limiting em validação de convite e em signup com convite (valores com @devops / backend).
- **NFR-03 — RLS:** Políticas Supabase consistentes com `current_app_role()` / `current_empresa_id()`; inserts de convite e leitura alinhados aos mesmos padrões de `role_x_user_x_empresa`.
- **NFR-04 — Consistência:** Criação do usuário Auth + linha em `role_x_user_x_empresa` + consumo do convite deve ser **confiável** (transação, fila, ou compensação — decisão em gate técnico).
- **NFR-05 — Qualidade:** `npm run lint`, `npm run typecheck`, `npm test` na raiz após entrega, conforme `AGENTS.md`.
- **NFR-06 — Privacidade:** Página pública de convite: considerar **`noindex`** / metadados para não indexação, se aplicável.
- **NFR-07 — Implantabilidade:** Nenhuma versão do backend que exponha `/api/invites` (persistência em `empresa_invites`) deve ir a staging/produção **sem** checklist que inclua aplicação das migrations correspondentes e smoke mínimo; objetivo: **zero** ocorrências de `relation "public.empresa_invites" does not exist` após release disciplinado.

### 2.3 Requisitos condicionados a arquitetura (gate)

- **FR-A01:** Documentado no ADR: tabela **`public.empresa_invites`**, políticas RLS, hash de token; contrato REST/backend nas rotas `/api/invites` (ver épico **US-INV-02**).
- **FR-A02:** Definir sem ambiguidade o **momento** em que o vínculo é criado (trigger Auth, RPC `security definer`, ou orquestração só no backend com service role) e o comportamento se signup falhar parcialmente — **pendente US-INV-03**.
- **FR-A03:** Política de capacidade: se existir **limite de usuários por empresa**, integração com convites (falha explicada ao gerar ou ao aceitar).

### 2.4 Requisitos operacionais e de release (brief de projeto)

*(Origem: incidente local “relation does not exist” ao chamar `POST /api/invites` com código e migrations no repositório, mas **banco do ambiente sem a tabela**.)*

- **OR-01 — Schema obrigatório:** Em **cada** ambiente (dev local, staging, produção), antes de considerar a funcionalidade de convites **disponível**, as migrations que criam e endurecem `public.empresa_invites` devem estar **aplicadas** no Postgres referenciado pelo backend (`supabase/migrations/20260325120000_create_empresa_invites.sql`, `20260326120000_empresa_invites_force_row_level_security.sql`).
- **OR-02 — Paridade projeto–banco:** O `.env` do backend deve apontar para o **mesmo** projeto Supabase (ou instância) onde as migrations foram aplicadas; “migrei o projeto A, app fala com B” é anti-padrão e reproduz falhas de schema.
- **OR-03 — Onboarding:** Documentação de setup do time deve incluir o passo **aplicar migrations** após `git pull` com novas migrações (local: fluxo Supabase CLI; remoto: `npm run db:migrate:prod*` ou pipeline acordado — ver brief e `scripts/supabase-migrate-prod.mjs`).
- **OR-04 — Verificação pós-deploy:** Critério objetivo aceito: `select to_regclass('public.empresa_invites');` retorna a relação (não `null`) no banco alvo.
- **OR-05 — Suporte:** Erros explícitos de Postgres do tipo **relation does not exist** para `empresa_invites` devem ser classificados como **release / migrations não aplicadas**, não como defeito da lógica de negócio do convite, até comprovar o contrário.

---

## 3. User Interface Design Goals

### 3.1 Visão de UX

Fluxo **simples para o admin**: “Gerar link” → “Copiar”. Fluxo **claro para o convidado**: landing mínima com estado do convite (válido / expirado / inválido) e formulário de cadastro coerente com `/register` atual.

### 3.2 Paradigmas de interação

- **Configurações:** Nova subseção **“Convidar usuários”** (ou inclusão em `ManageUsers` / `Settings`) visível apenas a **`admin`** e **`superadmin`**.
- **Deep link:** Parâmetros preservados ao navegar (padrão já usado em recovery/OAuth em `App.tsx` — reutilizar cuidados com `search`/`hash` onde fizer sentido).

### 3.3 Telas / vistas nucleares

| Área | Artefato sugerido |
| --- | --- |
| Autenticado admin | `frontend/src/pages/Settings.tsx` ou `ManageUsers.tsx` — entrada e lista/resumo de convites |
| Público | `frontend/src/pages/Register.tsx` estendido **ou** página `InviteAccept.tsx` dedicada acoplada ao signup |
| Roteamento | `frontend/src/App.tsx` — rota pública adicional se necessário |

### 3.4 Acessibilidade

Manter **WCAG 2.1 AA** em novos componentes (rótulos, estados de erro, botão copiar com nome acessível).

### 3.5 Branding

Reutilizar tokens e componentes de formulário já usados em Login/Register.

### 3.6 Plataformas

Web (Vite + React); link copiável em desktop e mobile.

---

## 4. Technical Assumptions

| Decisão | Escolha | Racional |
| --- | --- | --- |
| Repositório | Monorepo `frontend/`, `backend/` | Brownfield |
| Auth | Supabase Auth existente | Estender fluxo de registro |
| Autorização | `getRequesterContext`, `hasRole`, RLS atuais | Evitar duplicar regras só no front |
| API | Express em `backend/` | Endpoints convites: módulo `empresa-invites` + validação pública conforme épico |
| Dados (convites) | Tabela **`public.empresa_invites`** | Migrações canônicas em `supabase/migrations/`; RLS e ADR |

**Arquivos nucleares (referência atual):**  
`frontend/src/App.tsx`, `frontend/src/pages/Register.tsx`, `frontend/src/pages/ManageUsers.tsx`, `frontend/src/pages/Settings.tsx`, `frontend/src/lib/roles.ts`, `backend/src/services/users.service.js`, `backend/src/services/empresa-invites.service.js`, `backend/src/routes/empresa-invites.routes.js`, políticas legado em `backend/supabase/`, migrações canônicas em `supabase/migrations/`, ADR em `docs/adr/ADR-empresa-user-invites-table-rls.md`.

---

## 5. Epic List (alto nível)

1. **Épico A — Modelo e API (gate FR-A01–A03):** Tabela de convites, RLS, endpoints criar/listar/revogar/validar, estratégia transacional signup+vínculo.
2. **Épico B — Frontend admin:** UI em Configurações; copy link; lista e revogação escopada.
3. **Épico C — Frontend público:** Integração do token com registro; mensagens de estado; testes Vitest.
4. **Épico D — Qualidade:** Testes backend (Node test runner), revisão de segurança (tokens, rate limit), documentação curta em `docs/` se @po exigir runbook de suporte.

**MoSCoW sugerido:** **Must** — FR-01–FR-05, FR-08, NFR-01–NFR-04; **Should** — FR-06, FR-07, D-05, NFR-06; **Could** — métricas em dashboard interno de convites.

---

## 6. User Stories (semente para @sm)

*(Números ilustrativos — @sm alinha IDs ao backlog.)*

1. **Como** admin da minha empresa, **quero** gerar e copiar um link de convite, **para** enviar a um novo colaborador sem depender do superadmin.
2. **Como** admin da minha empresa, **quero** que o sistema **não permita** que eu crie convites para outra empresa, **para** evitar erros e violação de escopo.
3. **Como** convidado, **quero** abrir o link e **cadastrar-me** sabendo que serei associado à empresa correta, **para** acessar o sistema já no contexto certo.
4. **Como** superadmin, **quero** gerar convites para uma empresa selecionada (quando aplicável), **para** onboarding de clientes em multi-empresa.
5. **Como** usuario comum, **quero** **não ver** opções de convite na interface, **para** que o recurso permaneça administrativo.

**Critérios transversais:** testes verdes; nenhum vazamento de token em logs; admin sem `empresaId` no contexto não obtém convites até erro claro (alinhado a `listUsers` que exige empresa para admin).

---

## 7. Success Metrics

| Métrica | Alvo (direção) | Notas |
| --- | --- | --- |
| Tempo médio de onboarding de colaborador | ↓ | Do envio do link ao primeiro login útil |
| Tickets “usuário na empresa errada” | ↓ | Baseline antes do release |
| Taxa convites expirados / não usados | Monitorar | Ajustar default de expiração e comunicação |
| Tentativas falhas de validação de token | Monitorar | Possível abuso ou link mal copiado |
| Incidentes “relation … empresa_invites does not exist” | **Zero** pós-release | Indicador de falha de processo de migration (OR-01–OR-05) |

---

## 8. Risks and Mitigations

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Token vazado em chat/e-mail | Alto | Expiração curta, um uso, revogação, rate limit |
| Falha parcial (user criado sem vínculo) | Alto | Gate FR-A02 + testes de integração + runbook |
| Admin sem empresa no contexto | Médio | Mensagem explícita; espelhar comportamento de `listUsers` |
| Reuso indevido de link multi-uso | Médio | **D-06** default 1 uso; alternativa só com aprovação @po |
| Schema desatualizado vs. código (tabela inexistente) | Alto (bloqueio total da feature) | NFR-07 + §2.4; checklist de deploy; brief operacional para diagnóstico |

---

## 9. Out of Scope

- Promoção de convidados a **admin** ou **superadmin** via este fluxo.
- SSO corporativo ou SAML — apenas link + cadastro e-mail/senha (extensão futura).
- Convites para papel **`outsider`** — a menos que @po inclua explícita segunda fase.
- White-label de e-mail transacional (a menos que já exista provider; pode ser “link puro” no MVP).

---

## 10. Open Questions

1. **D-05:** Convite sem e-mail fixo (qualquer e-mail no signup) vs. **e-mail pré-vinculado** (mais seguro para B2B)?
2. Default de **TTL** do convite: 7 dias vs. 24h vs. configurável por empresa?
3. **Superadmin** deve ver **todas** as empresas no seletor ou apenas um subconjunto (feature existente)?
4. Deve existir **notificação por e-mail** automática ao gerar convite (MVP: apenas copiar link)?

---

## 11. References

- **Épico e stories:** `docs/stories/epic-convite-usuario-por-empresa-prd.md`
- **ADR (dados + RLS):** `docs/adr/ADR-empresa-user-invites-table-rls.md`
- **Brief operacional (schema / migrations):** `docs/brief/brief-empresa-invites-relation-does-not-exist.md`
- **Migrações:** `supabase/migrations/20260325120000_create_empresa_invites.sql`, `supabase/migrations/20260326120000_empresa_invites_force_row_level_security.sql`
- Backend usuários / contexto: `backend/src/services/users.service.js` (`getRequesterContext`, `listUsers`, `updateUser`)
- Backend convites: `backend/src/services/empresa-invites.service.js`, `backend/src/routes/empresa-invites.routes.js`
- RLS empresas/roles (legado / funções): `backend/supabase/roles_empresas_policies.sql`
- Rotas app: `frontend/src/App.tsx` (`/register`, `/settings/users`)

---

## 12. Apêndice — Síntese do brief de projeto (incidente schema)

O brief [`brief-empresa-invites-relation-does-not-exist.md`](../brief/brief-empresa-invites-relation-does-not-exist.md) documenta um cenário em que a UI **Convites por link** e `POST /api/invites` falham com mensagem PostgreSQL **`relation "public.empresa_invites" does not exist`**, enquanto o repositório já contém as migrations que criam a tabela. A resolução é **operacional**: alinhar ambiente e credenciais do backend ao banco correto e **aplicar** as migrations pendentes; validar com `to_regclass('public.empresa_invites')`. Esse fluxo está formalizado nos requisitos **OR-01–OR-05** e **NFR-07** para que produto e engenharia tratem o problema como **gate de release**, não como regressão de regra de negócio.

---

*Documento de requisitos de produto; estimativas e quebra fina de sprint ficam com @sm. Gate @architect para modelo de convites: atendido via ADR; gate transacional pós-signup (**FR-A02**): acompanhar **US-INV-03**.*
