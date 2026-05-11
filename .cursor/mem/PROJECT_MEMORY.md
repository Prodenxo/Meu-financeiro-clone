# Memória do projeto (Cursor)

<!--
CURSOR-MEM-AIOX
Este ficheiro substitui o papel do plugin **claude-mem** no Cursor: factos estáveis
sobre o repo, decisões e preferências da equipa. Atualize após conclusões importantes.
Não grave secrets, tokens nem dados pessoais.
-->

## Mapa rápido do repositório

| Área | Caminho |
|------|---------|
| Frontend | `frontend/` |
| Backend | `backend/` |
| Scripts raiz | `scripts/` |
| Documentação / stories | `docs/` |
| Runbook Supabase / deploy | `docs/runbook/supabase-ambientes-e-deploy.md` |
| Template MR GitLab / Bitbucket | `docs/runbook/gitlab-merge-request-template.md` |
| Validação pós-schema NFS-e (CORR-03) | `docs/runbook/corr-03-validacao-guia-mei-nfse.md` |
| Framework AIOX (local) | `.aiox-core/` |
| Regras Cursor | `.cursor/rules/` |
| Bootstrap / squads | `squads/` |

## Decisões de arquitetura

- **2026-04-15 — FR-PFLNAT (P2):** runbook [`docs/operacao-mei-nfse.md`](docs/operacao-mei-nfse.md) — âncora `#pflnat-preflight-nacional-vs-login-municipal-suporte`; linha REC500 «BFF / classificação» pré vs pós-motor; seguimento @qa: «Decisão formal» §18 (épico/rollout) vs motor PFLNAT + parágrafo «Leitura conjunta».
- **2026-04-15 — FR-PFLNAT (P1) QA:** [`docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md`](docs/qa/pflnat-p1-matriz-preflight-hibrido-evidencia.md) — gate P0/CI (§0), pacote PR §2.1, spot check `/guias-mei` §3, sign-off §4; testes `fiscalUserError` / `nfseNacionalPlugnotasErrorHints`.
- **2026-04-15 — FR-PFLNAT (P0):** `resolveEmpresaCadastroMunicipioRuntimeDecision` concede `success_nacional` / `allowUpstream` quando `padraoNacionalEnabled === true` e `attemptNfseMode === 'nacional'` antes de `prefeitura_login_required_*`, exceto `authRequired && hasValidPair && !prefeituraCredentialsEnabled` (§4 PFLNAT). Testes de bloqueio por login municipal sem nacional usam preflight com `padraoNacional: false` nos mocks.
- **2026-04-07 — FR-POSQA-07 (POSQA-5):** smoke opcional Plugnotas — `scripts/smoke-nfe-nfce-plugnotas.mjs` + `npm run smoke:plugnotas:nfe-nfce`; CI GitHub só com secrets `PLUGNOTAS_API_BASE_URL` / `PLUGNOTAS_API_KEY` (workflow não bloqueia PR se ausentes).
- **2026-04-07 — Empresa Plugnotas NF-e/NFC-e (FR-POSQA-03 / PRD §8.1):** decisão **D1** — documentação + bloqueio honesto na UI (`MeiFiscalCapabilityCallout`, `parsePlugnotasEmpresaCapabilities`); **D2/D3** em backlog. ADR `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`.
- **2026-04-02 — Limite de faturamento MEI (LIM-MEI-01):** agregado MVP no cliente a partir de `NfseRecord[]` (`listarNfse`); ADR `docs/technical/mei-limite-faturamento-agregado-2026-04-02.md`; helpers `frontend/src/utils/meiLimiteFaturamento.ts` + `meiLimiteFaturamentoConfig.ts`.
- Dados mínimos NFS-e do emitente: colunas em `user_mei_certificates` (migrações `20260326140000_*` e `20260326150000_add_tipo_logradouro_user_mei_certificates.sql` para tipo de via); gravação via `POST /mei-guide/certificate` (multipart) e `PATCH /mei-guide/certificate/emitente-nfse`; leitura em `GET /mei-guide/certificate/status` no campo `nfseEmitente`.
- **2026-04-07 — FR-CAD-DOC P1 (UX):** título/hint do bloco dados mínimos em `guiaMeiCadastroDocumentosAtivos.ts`; banner NF-e/NFC-e com `VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI`; secção `<details>` requisitos adicionais (`MeiCadastroRequisitosNfeNfcePlaceholder`).
- **2026-04-07 — FR-CAD-DOC P1:** coluna `documentos_ativos` **jsonb** nullable em `user_mei_certificates` (`20260407130000_add_documentos_ativos_user_mei_certificates.sql`); espelho após POST/PATCH empresa Plugnotas (`saveDocumentosAtivosMirror` via `mei-notas-documentos-mirror.js`); leitura em `GET /mei-guide/certificate/status` como `documentosAtivos`; script `db:verify` / `db:apply` inclui a coluna. **RLS** (`20260407150000_user_mei_certificates_rls.sql`): políticas *own row* com `auth.uid() = user_id`; backend com service role contorna RLS.
- **2026-04-14 — RTCAD / cadastro empresa PlugNotas:** arquitetura alvo do MVP = manter `frontend -> BFF -> PlugNotas`, migrar o outbound para `nfse.config.nfseNacional` + `nfse.config.consultaNfseNacional`, e executar preflight obrigatório `GET /nfse/cidades/{codigoIbge}` no BFF antes de `POST`/`PATCH`; caminho nacional deixa de depender de `prefeitura.codigoIbge` como hot path principal e a fase 2 de credenciais municipais continua separada.
- **2026-05-06 — Cobrança MEI via Stripe (superadmin → empresa):** tabela `empresa_mei_subscription_lines` + `empresas.stripe_customer_id`; `POST /api/admin/billing/stripe/mei-checkout` com `billingTiming: checkout` (link) ou `next_cycle` (acrescenta item na Subscription existente, `proration_behavior: none`); opcional `stripeSubscriptionId`; migração `20260506200000_*` remove unique em `stripe_subscription_id`; webhooks em `POST /api/webhooks/stripe`; `STRIPE_SYNC_MAX_MEI` por defeito **ligado** (`true` no `env.js`); `POST /api/admin/billing/stripe/sync-max-mei` (superadmin) força alinhar `max_mei` com a soma das linhas ativas; **`GET /users/empresas` (superadmin)** chama `mergeStripeContractedMeiIntoEmpresaLimits` — `max_mei := max(cadastro, soma pacotes Stripe ativos)` e grava na BD (cobre webhook falho).
- **2026-05-06 — UI cobrança MEI (Stripe):** em **Gerir utilizadores → Empresas** (só superadmin), botão com ícone de cartão abre modal `EmpresaStripeMeiBillingModal` — histórico (`GET /admin/billing/stripe/subscription-lines`), novo pacote com link de Checkout ou «próxima fatura»; cliente HTTP `frontend/src/services/adminBillingService.ts`. **Regra:** sem linha ativa com `stripe_subscription_id` → só Checkout; com assinatura ativa → só `next_cycle`; backend recusa novo Checkout se já existir sub ativa na BD.
- **2026-05-06 — Legado PIX (registo histórico):** coluna `empresas.legacy_mei_slots_pix` (migração `20260506210000_empresa_legacy_mei_slots_pix.sql`) mantida para histórico interno. Fluxo ativo de cobrança MEI no admin é **somente Stripe por cartão** (`mei-checkout` com `checkout`/`next_cycle`); endpoint de migração legado PIX foi removido das rotas admin.

## Supabase — ambientes e deploy (CORR-02)

- **Mapeamento ambiente → projeto:** tabela editável em `docs/runbook/supabase-ambientes-e-deploy.md` (placeholders). **Não** versionar passwords nem URLs com credenciais; project ref e nome do projeto no painel ficam no **cofre** da equipa (indicar no runbook *onde* está documentado, não o segredo).
- **Gate de release:** PRs que alterem `supabase/migrations/` ou que dependam de schema novo devem documentar que as migrações foram aplicadas (ou na mesma janela de deploy) no ambiente alvo — checklist em `.github/pull_request_template.md` + detalhe no runbook; GitLab/Bitbucket: `docs/runbook/gitlab-merge-request-template.md`.
- **CI:** workflow `migrations-pr-reminder.yml` (GitHub) emite *notice* se o PR tocar em `supabase/migrations/**` — lembrete, não bloqueia merge.
- **Rastreio de correção schema:** `docs/stories/story-prd-correcao-supabase-schema-tipo-logradouro.md`, `docs/prd/PRD-correcao-supabase-schema-tipo-logradouro-2026-03-26.md`, `docs/brief/brief-correcao-supabase-tipo-logradouro-schema-cache.md`.

## Convenções do repositório

- (ex.: branches, commits, idioma de mensagens)

## Preferências da equipa

- Responder em **português** nas interações do assistente.
- Perguntar antes de alterar código quando o escopo não estiver explícito.
- **CLI first** — `npm run lint`, `typecheck`, `test` como gates (ver `AGENTS.md`).

## Comandos úteis (raiz)

```text
npm run dev              # frontend (via workspace)
npm run dev:backend
npm run lint
npm run typecheck
npm run test
npm run sync:ide              # regras .cursor/rules/agents/ + slash commands .cursor/commands/aiox-*.md
npm run validate:structure
npm run validate:agents
npm run db:verify:nfse-emitente-schema   # CORR-01: confirma colunas NFS-e + tipo_logradouro (SUPABASE_DB_URL em backend/.env)
npm run db:apply:nfse-emitente-schema    # aplica migrações user_mei_certificates (incl. documentos_ativos) via Postgres direto
npm run db:migrate:prod:check            # Supabase CLI link + migration list (requer SUPABASE_PROD_* + login)
npm run qa:corr03-smoke-backend          # CORR-03: teste unitário rota PATCH emitente-nfse (middlewares)
npm run smoke:plugnotas:nfe-nfce        # POSQA-5 / FR-POSQA-07: smoke opcional HTTP Plugnotas (requer PLUGNOTAS_* no .env)
```

Documentação: smoke E2E manual NF-e/NFC-e (Plugnotas sandbox) — `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` (PRD POSQA **FR-POSQA-01**); índice também em `docs/operacao-mei-nfse.md`.

GitHub Actions: `.github/workflows/corr03-smoke-backend.yml` executa o mesmo smoke em PRs que alterem ficheiros `mei-guide*`, `mei-certificate-store*`, migrações `*user_mei*` ou o teste emitente (ver `paths` no workflow).

## Glossário / termos

- (termos de domínio do app para manter consistência na UI e API)

## Armadilhas conhecidas

- `npm run db:verify:nfse-emitente-schema` / `db:apply:nfse-emitente-schema`: se `SUPABASE_URL` e `SUPABASE_DB_URL` existirem em `backend/.env` com **project ref** diferente, o script aborta (evita DDL no projeto errado). `--check` recusa também se `public.user_mei_certificates` não existir, com mensagem explícita.

## Contexto em aberto

- (pendências que afetam mais do que uma story)

## Última atualização

- **2026-05-06** — Migração legado PIX: sempre pacote `next_cycle` na Stripe (sem ramo só-metadata).
- **2026-05-06** — `GET /users/empresas` (superadmin): merge automático `max_mei` com soma Stripe ativa (`mergeStripeContractedMeiIntoEmpresaLimits`).
- **2026-05-06** — Webhooks / confirmação Stripe chamam `syncEmpresaMaxMeiFromLines` com `force: true` (atualiza `max_mei` mesmo com `STRIPE_SYNC_MAX_MEI=false`). UI: recarrega empresas ao abrir separador Empresas, ao voltar à página (`visibilitychange`) e ao fechar modal de cobrança.
- **2026-05-06** — `STRIPE_SYNC_MAX_MEI` default `true`; `POST /admin/billing/stripe/sync-max-mei`; botão «Alinhar limite com a Stripe» no modal.
- **2026-05-06** — UI modal cobrança MEI Stripe na aba **Empresas** (`EmpresaStripeMeiBillingModal` + `adminBillingService.ts`).
- **2026-05-06** — Cobrança MEI (superadmin): Stripe (Checkout + webhook `/api/webhooks/stripe`); schema inicial em `supabase/migrations/20260505220000_empresa_mei_stripe_billing.sql` (`empresa_mei_subscription_lines` + `stripe_customer_id`); env `STRIPE_*`.
- **2026-04-30** — DAS mensal: envio WhatsApp opcional após PDF gerado (`MEI_DAS_AUTO_WHATSAPP_ENABLED`, `N8N_WHATSAPP_WEBHOOK_URL`, `source: mei_das_automatico`, telefone em `user_metadata.phone`); falha do webhook não falha o job. Ver `docs/ops/das-mensal-e-assinatura-planilha-notas-2026-04-30.md`.
- **2026-04-30** — Cron teste unitário: `GET /api/cron/das-mensal/usuario?userId=` + Bearer `CRON_SECRET`; opcional `competencia=YYYY-MM`; JSON com `whatsappStatus`.
- **2026-04-15** — FR-PFLNAT P2: secção PFLNAT no runbook `operacao-mei-nfse.md`; story P2 critérios doc fechados — PR + aprovação @po / @qa por equipa.
- **2026-04-15** — FR-PFLNAT P1: revisão doc QA pós-@qa (§0–§4); story actualizada; sign-off @qa / gate P0+CI permanecem com equipa.
- **2026-04-15** — FR-PFLNAT P0: motor `empresa-cadastro-runtime-decision.js` — precedência nacional sobre bloqueio por login municipal no modo nacional default; regressão em `empresa-cadastro-runtime-rec500-regression.test.js` + integração `plugnotas-empresa.test.js` / `mei-notas-empresa-http.test.js`.
- **2026-04-15** — REC500 Epic 2 (`regra governada runtime 5002704`): story cancelada enquanto PRD §18 for `manter policy vigente`; reabrir só com decisão `correcao controlada` + PRD/arquitetura alinhados (`docs/stories/story-fr-rec500-p2-backend-regra-governada-runtime-5002704-2026-04-14.md`).
- **2026-04-14** — Arquitetura RTCAD documentada: contrato oficial + preflight municipal obrigatório no BFF antes do cadastro empresa PlugNotas; fase 2 municipal segue fora do MVP.
- **2026-04-07** — FR-CAD-DOC P1 UX (banner/título/campos condicionais): `guiaMeiCadastroDocumentosAtivos*` + componentes `MeiCadastroNfeNfceInfoBanner` / `MeiCadastroRequisitosNfeNfcePlaceholder`.
- **2026-04-07** — FR-CAD-DOC P1 pós-QA: migração RLS `user_mei_certificates` + `mei-notas-documentos-mirror.js` + testes `mei-notas-documentos-mirror.test.js`.
- **2026-04-07** — FR-CAD-DOC P1: espelho `documentos_ativos` em Supabase + consumo no status/hidratação Guia MEI; `npm run lint` / `typecheck` / `test` na raiz verdes após entrega.
- **2026-04-07** — FR-CAD-DOC P0 pós-QA: testes `MeiCatalogoClienteModal` / `MeiCatalogoProdutoModal` alinhados ao título «Validação ou rejeição no provedor» em `fiscalUserError.ts`; `npm test` na raiz verde.
- **2026-04-07** — FR-CAD-DOC P0 backend: `documentosAtivos` em `cadastrarEmpresaPlugNotas` / `atualizarEmpresaPlugNotas` — módulo `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js`; ADR complementar em `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`.
- **2026-04-07** — STORY-POSQA-5 pós-QA: runbook `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` v1.4 — critérios HTTP do smoke + troubleshooting (risco residual contrato Plugnotas).
- **2026-04-07** — STORY-POSQA-5 / **FR-POSQA-07:** smoke opcional Plugnotas — `scripts/smoke-nfe-nfce-plugnotas.mjs`, `npm run smoke:plugnotas:nfe-nfce`, workflow `.github/workflows/posqa-5-plugnotas-smoke-optional.yml` (só com secrets `PLUGNOTAS_API_*`); runbook `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` §Automação opcional.
- **2026-04-07** — STORY-POSQA-4: decisão **§8.1** **D1** (cadastro empresa Plugnotas); ADR `docs/technical/adr-empresa-plugnotas-nfe-nfce-d1-2026-04-07.md`; PRD POSQA v1.1 change log §15; runbook secção política empresa (`docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md`).
- **2026-04-07** — STORY-POSQA-1: runbook `docs/runbook/runbook-smoke-nfe-nfce-plugnotas-sandbox.md` + link em `docs/operacao-mei-nfse.md` (FR-POSQA-01/02).
- **2026-04-07** — Stories POSQA (pós-testes NF-e/NFC-e): `docs/stories/story-posqa-1-runbook-smoke-e2e-nfe-nfce.md` … `story-posqa-5-ci-e2e-opcional-nfe-nfce.md` (PRD `PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`).
- **2026-04-07** — Arquitetura POSQA: `docs/technical/architecture-mei-posqa-nfe-nfce-2026-04-07.md` (cadeia erro Plugnotas→UI, limite NFSE-only sem schema novo, smoke runbook, D1/D2/D3 empresa).
- **2026-04-07** — PRD `docs/prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md` (pós-QA automatizado: smoke E2E, empresa Plugnotas, reconciliação story, limite MEI copy, erros UI — FR-POSQA-*).
- **2026-04-02** — LIM-MEI-01: limite MEI — agregado cliente + ADR + config por ano (`meiLimiteFaturamento*`).
- **2026-03-26** — CORR-03 pós-QA: workflow `corr03-smoke-backend.yml` (smoke `qa:corr03-smoke-backend` em PRs relevantes); PATCH/UI/evidência §4 permanecem manuais.
- **2026-03-26** — CORR-03: roteiro QA `docs/runbook/corr-03-validacao-guia-mei-nfse.md` (API + UI + evidência ticket).
- **2026-03-26** — CORR-02: runbook `docs/runbook/supabase-ambientes-e-deploy.md`, mapeamento + gate de deploy; template de PR em `.github/pull_request_template.md`; pós-QA: `docs/runbook/gitlab-merge-request-template.md` + workflow `migrations-pr-reminder.yml`.
- **2026-03-26** — CORR-01: scripts `db:verify:nfse-emitente-schema` / `db:apply:nfse-emitente-schema` para alinhar DDL remoto com migrações `user_mei_certificates` (sem depender só do SQL Editor).
- **2026-03-26** — Emitente NFS-e persistido em `user_mei_certificates` + rotas `mei-guide` (`nfseEmitente` no status).
- **2026-03-25** — `npm run sync:ide` gera slash commands AIOX em `.cursor/commands/aiox-*.md` (integração IDE sync).
- **2026-03-25** — Protocolo Cursor ampliado (paridade operacional com fluxo claude-mem: leitura obrigatória em trabalhos grandes, formato de entradas, secções glossário/armadilhas).
