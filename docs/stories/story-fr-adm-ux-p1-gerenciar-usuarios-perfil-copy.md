# Story — FR-ADM-UX-P1: Gerenciar usuários — clareza por perfil e consistência visual

**ID:** STORY-FR-ADM-UX-P1  
**Epic:** UX área admin — página Gerenciar usuários (brownfield; alinhamento PM Morgan 2026-04-27)  
**Prioridade:** P1  
**Depende de:** —  
**Fonte:** Pedido de produto — `ManageUsers` mistura tarefas; admin precisa só de “membro na empresa”; copy genérica; `PhoneInput` destoante do `planner-input`.

## User story

**Como** admin da empresa ou superadmin,  
**quero** que a página Gerenciar usuários organize tarefas e textos conforme o meu papel, com campos visualmente consistentes,  
**para** criar membros ou operar a plataforma sem confusão e sem medo de erro, **sem** mudança de regras de negócio nem de APIs.

## Contexto técnico

- **Página:** `frontend/src/pages/ManageUsers.tsx`.  
- **Papéis:** `role === 'admin'` (escopo empresa; criação fixa como membro/usuário da empresa atual) vs `role === 'superadmin'` (empresas, perfil, empresa de destino, convites).  
- **Telefone:** `react-phone-input-2` + estilos inline/CSS — hoje destoa do restante; alinhar à família `planner-input-compact` em **claro e escuro** (`tailwind` `darkMode: 'class'`).  
- **Restrições:** Nenhum endpoint novo; nenhuma alteração de permissões no backend; smoke dos fluxos existentes deve continuar a passar.

## Critérios de aceite

### Admin (`admin`)

- [x] Título e subtítulo do bloco principal de criação comunicam **membro da própria empresa** (não copy genérica de “permissões globais” se a UI não oferece escolha de perfil/empresa).  
- [x] Botão primário do mesmo bloco está alinhado à ação (ex.: “Adicionar membro” ou variante única acordada em copy).  
- [x] **Não** aparecem na UI campos de **Empresa** ou **Perfil** reservados ao superadmin (comportamento actual mantido).  
- [x] Texto de ajuda **senha em branco** visível junto ao fluxo de conta: sistema **gera** senha quando vazio (linguagem leiga; coerente com o que o produto já faz após criar).  
- [x] Campo **telefone** com mesma **família visual** que email, senha e nome (borda, fundo, tipografia, foco) em tema claro e escuro.

### Superadmin (`superadmin`)

- [x] Hierarquia **legível** na página: blocos **Empresas** (criar + editar) → **Pessoas** (criar utilizador + tabela/lista associada) → **Convites** — títulos de secção ou cabeçalhos consistentes (`admin-section-*` ou equivalente).  
- [x] Subtítulo do cartão de criação deixa claro que, além da conta, existe **vínculo** (perfil + empresa) quando esses campos estão visíveis.  
- [x] Bloco **Perfil e empresa** (ou rótulo equivalente) está **agrupado** visualmente (não parecer continuação ambígua do bloco “Conta”).  
- [x] **Telefone** com o mesmo critério de consistência que para admin.

### Transversal / regressão

- [x] **Smoke manual (browser):** criar empresa; editar empresa; criar utilizador superadmin com empresa seleccionada; criar membro admin (mínimo email); gerar convite (e empresa quando aplicável); copiar link; interacção mínima na tabela (expandir/editar se existir no fluxo actual). *(Aceite para encerramento com **declaração de smoke humano OK** pelo solicitante — chat 2026-04-27; evidência em screenshot/PR opcional.)*  
- [x] **A11y:** labels mantidos ou melhorados; telefone com nome acessível; foco por teclado não piora face ao estado actual.  
- [x] `npm run lint`, `npm run typecheck`, `npm test` verdes no âmbito do frontend (ou monorepo, conforme `AGENTS.md`).

## Fora de escopo

- Novas APIs, novos papéis, mudança de quem pode criar quem.  
- Redesenho completo da área admin ou outras rotas fora de `ManageUsers.tsx`.  
- CSS global alargado além do **mínimo** necessário para o telefone (ex.: `frontend/src/index.css` só se não der para resolver só com classes no componente).  
- Migração para outra biblioteca de telefone (spike separado com **@architect** se necessário).

## Tasks / Subtasks

- [x] **T1:** Copy e títulos condicionais a `role` (admin vs superadmin).  
- [x] **T2:** IA mínima — secções hierárquicas (e opcionalmente subcabeçalhos “Conta” / “Nome e contato” / “Perfil e empresa” para superadmin).  
- [x] **T3:** Estilos `PhoneInput` alinhados a `planner-input-compact` (incl. modo escuro).  
- [x] **T4:** Smoke de regressão + gates.

## File list (checklist implementação)

- [x] `frontend/src/pages/ManageUsers.tsx`  
- [x] `frontend/src/index.css` (se necessário para `.react-tel-input` / wrapper)  
- [x] `frontend/src/pages/AdminUserData.tsx` (banner “Gestão de acessos” → `/settings/users`)  
- [x] Outros ficheiros: **só** se o dev identificar dependência estrita (não expandir sem necessidade).  

## Definition of Done

- Critérios de aceite por papel e transversal **marcados** na story após verificação.  
- Gates de qualidade executados e referência na secção **Dev Agent Record**.  
- Smoke manual documentado em notas curtas (conta + data).

## Qualidade / CodeRabbit

- Não duplicar strings críticas sem critério; preferir constantes locais ou mapa por `role` legível.  
- Evitar regressão de z-index em dropdowns de empresa convivendo com `PhoneInput`.

---

## Dev Agent Record

### Status

Done

### Agent Model Used

Cursor Agent (implementação)

### Completion Notes List

- Secções **Empresas** / **Pessoas** / **Convites** com `h2` acessível (`aria-labelledby`); ordem visual: empresas → criar + lista de utilizadores → convites.  
- Formulário de criação: blocos **Conta**, **Nome e contato**, **Perfil e empresa** (superadmin); copy e botão **Adicionar membro** para admin; `PhoneInput` com `containerClass="admin-phone-input"` + `padding-left` no CSS alinhado ao selector de país.  
- Hero e cartões **Usuários** / **Convites** com subtítulos condicionais por `role`.  
- **Smoke manual no browser:** concluído para efeitos de story (declaração solicitante 2026-04-27).  
- **Gates (2026-04-27):** `frontend` — `npm run lint` (warnings pré-existentes noutros ficheiros), `npm run typecheck`, `npm test` — **681 testes OK**, exit 0.

### File List (implementação)

- `frontend/src/pages/ManageUsers.tsx`  
- `frontend/src/index.css`  
- `frontend/src/pages/AdminUserData.tsx`

### Debug Log References

—

### Change Log

- **2026-04-27** — Story criada (SM / River) a partir do brief PM — UX Gerenciar usuários por perfil.  
- **2026-04-27** — Implementação FR-ADM-UX-P1: IA por secção, copy por perfil, `PhoneInput` alinhado, reordenação Pessoas antes de Convites.  
- **2026-04-27** — Passagem visual: classes `admin-region*`, `admin-section-card-create-user`, `admin-form-step`; banner em `AdminUserData`.  
- **2026-04-27** — QA (@qa): rastreio + `ManageUsers.invites.test.tsx` (6/6); gate **CONCERNS** até smoke humano; critério smoke manual desmarcado na checklist.  
- **2026-04-27** — SM (@sm): smoke humano aceite + checklist transversal fechada; **Dev Agent Record** → **Done**; gate QA → **PASS** (ver QA Results).  

---

## QA Results

### Encerramento — 2026-04-27 (River / @sm)

**Gate final:** **PASS** — smoke manual no browser **aceite** para fecho da story por **declaração explícita do solicitante** (“atualiza story … com smoke humano e status Done”). Rastreio + testes automatizados mantêm-se válidos; anexar evidência no PR continua **recomendado** para auditoria.

**Histórico QA (@qa):** gate **CONCERNS** enquanto o agente QA não executou UI; **superado** após este encerramento SM com smoke humano declarado.

---

#### Rastreio critérios → evidência (código / testes)

| Verificação | Superadmin | Admin | Evidência |
|-------------|------------|-------|-----------|
| Secção **Empresas** (título + região) | Sim | N/A | `ManageUsers.tsx`: `admin-region--empresas`, `admin-heading-empresas` |
| Secção **Pessoas** + cartão destaque criação | Sim | Sim | `admin-region--pessoas`, `admin-section-card-create-user` |
| Passos **Conta** / **Nome e contato** / **Perfil e empresa** | Conta + Nome + Perfil | Conta + Nome (sem Perfil) | `admin-form-step` + `role === 'superadmin'` |
| **Telefone** `admin-phone-input` + a11y | Sim | Sim | `PhoneInput` + `inputProps`; `index.css` `.admin-phone-input` |
| Secção **Convites** | Sim | Sim | `admin-region--convites`, `admin-heading-convites` |
| Lista **Usuários** | Sim | Sim | Cartão “Usuários” após criação, na região Pessoas |
| Banner **Gestão de acessos** → `/settings/users` | Sim | Sim | `AdminUserData.tsx`: `Link to="/settings/users"`, texto “Gestão de acessos” |

---

#### Testes automatizados (execução 2026-04-27)

| Suite | Resultado |
|-------|------------|
| `npx vitest run src/pages/ManageUsers.invites.test.tsx --environment jsdom` | **6/6** OK |

*(Suite foca convites; não cobre regressão visual CSS nem todos os fluxos de criação de empresa/utilizador.)*

---

#### Smoke manual no browser — **fechado (declaração 2026-04-27)**

Checklist de referência (já coberto pelo aceite de encerramento):

1. **`/settings/users` como superadmin:** regiões Empresas / Pessoas / Convites; cartão de criação destacado; passos Conta / Nome e contato / Perfil e empresa; telefone; convites.  
2. **`/settings/users` como admin:** membro; sem Empresas; sem Perfil/Empresa.  
3. **`/settings/usuarios-dados`:** banner + link para `/settings/users`.

**Nota de processo:** se aparecer regressão pós-deploy, reabrir bug ou story de follow-up; evidência em PR ainda é boa prática.

---

#### Riscos residuais

- **Visual/CSS:** regressão só em claro/escuro com inspecção manual.  
- **z-index:** dropdown empresa vs. `PhoneInput` — sem teste E2E.  
- **Copy:** validação com utilizador real (superadmin vs. admin).

---

### Smoke manual (humanos)

- **2026-04-27** — Encerramento SM: smoke humano **declarado OK** pelo solicitante (instrução de fecho no chat); story marcada **Done**.
