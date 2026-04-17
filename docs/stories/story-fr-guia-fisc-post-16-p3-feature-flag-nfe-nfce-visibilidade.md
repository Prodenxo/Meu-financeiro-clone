# Story — FR-GUIA-FISC-16 (P3): Feature flag D3 — visibilidade NF-e / NFC-e no Guia MEI *(PRD: Won’t por defeito — requer decisão PO para rollout)*

**ID:** STORY-FR-GUIA-FISC-POST-16-VITE-FLAG-NFE-NFCE  
**Prioridade:** P3  
**Epic:** Epic 2 — Consolidação pós-brainstorm (`docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md`)  
**Depende de:** **Decisão PO explícita** para activar incremento **D3** (PRD: *Won’t* salvo decisão PO; **FR-GUIA-FISC-16** opcional / **desligado por defeito**); baseline do seletor triplo — [story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) *(comportamento com três segmentos quando flag **ligada**)*  
**Bloqueia:** —  
**Fonte:** `docs/prd/PRD-implementacao-nfe-nfce-pos-brainstorm-2026-04-16.md` (**FR-GUIA-FISC-16**)  
**UX:** `docs/specs/ux-spec-guia-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §8  
**Arquitetura:** `docs/technical/architecture-mei-nfe-nfce-pos-brainstorm-2026-04-16.md` §7  
**QA (opcional):** `docs/qa/plugnotas-multitipo-checklist.md` — actualizar quando D3 fechar, se aplicável.

## User story

**Como** equipa de produto,  
**quero** poder **ocultar** as opções **NF-e** e **NFC-e** no Guia MEI por **variável de ambiente** (rollout gradual),  
**para** controlar exposição sem remover código (**FR-GUIA-FISC-16**).

## Contexto técnico

- **Cliente:** `import.meta.env.VITE_MEI_NFE_NFCE_EMIT_ENABLED` (nome exacto — architecture §7.1) — *ligado* só com string **`true`**; caso contrário (omitir, `false`, `1`, etc.), o *segmented control* mostra apenas **NFS-e** (UX §8.1).  
- **Servidor (opcional):** *defence in depth* — `emitir` rejeita `NFE`/`NFCE` com **403** quando a política de *flag* estiver *off* (architecture §7.1); **alinhar com PO** (pode ser desnecessário se só houver *gate* na UI).  
- **Vite (build-time):** variáveis `VITE_*` são resolvidas em **build**; alterar o valor efectivo no browser exige **novo build** (ou outro *deploy*/*preview* com env diferente no pipeline). Matriz dev / *preview* / prod deve ficar clara para QA (ver DoR e *Completion Notes*).  
- Documentar em **`.env.example`** sem *secrets* (architecture §7.2).

## BDD (aceite)

| Cenário | Dado | Quando | Então |
|--------|------|--------|--------|
| Flag desligada | `VITE_MEI_NFE_NFCE_EMIT_ENABLED` ausente, `false` ou interpretado como *off* (regra na *Completion Notes*) | Utilizador abre o Guia MEI — área de emissão | Apenas **NFS-e** visível no seletor; **sem** espaços vazios nem *placeholders* que sugiram funcionalidade oculta (UX §8.1). |
| Flag ligada | `VITE_MEI_NFE_NFCE_EMIT_ENABLED` exactamente a string **`true`** (build-time) | Mesmo ecrã | Comportamento **idêntico** ao baseline triplo (UX §8.2 + §4). |
| Erro / deep link *(Could)* | *Flag* por utilizador ou URL profunda obsoleta *(se aplicável)* | Navegação inválida | Falha *graceful* com mensagem genérica (UX §8.2) — só se PO/tech fecharem nesta story; senão *follow-up*. |

## Âmbito

| Must | Could | Fora |
|------|-------|------|
| Condicional no seletor (`MeiFiscalEmissionTypeSegmented` / `GuidesMei`) + `.env.example` | *Guard* `403` em `emitir` quando flag *off* | Remover código NF-e/NFC-e do repositório |
| Documentar variável e critério **«ligado» = só `'true'`** nas *Completion Notes* (`1` não conta) | Mensagem UX §8.2 para URL profunda | *Feature flag* por utilizador na BD (fora desta story salvo decisão PO) |
| Testes RTL flag on/off | | Alterar regras fiscais ou limite MEI (FR-17) |

## Definition of Ready

- [ ] **Decisão PO** registada para **activar** D3 neste release (email/acta ou backlog) — PRD assume *Won’t* por defeito. *(Negócio — fora do âmbito do patch técnico.)*  
- [x] [POST-0](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) compreendido como baseline **com três segmentos** quando a flag está **ligada**.  
- [x] Nome e semântica da env (`VITE_MEI_NFE_NFCE_EMIT_ENABLED`) fechados: **ligado** só com string **`true`**; `1` e outros valores tratam-se como *off* (ver *Completion Notes*).  
- [x] **Build-time (Vite):** a equipa sabe que *on* vs *off* implica **artefactos** distintos ou *deploys* com env diferentes; acordar como validar **local** e, se aplicável, ***preview*/CI** (dois builds ou variáveis no painel de deploy) e registar matriz mínima nas *Completion Notes*.  
- [ ] **Owner QA** atribuído (ver *Dev Agent Record* — placeholder **A atribuir** até nomeação).

## Critérios de aceite

### (a) UI — flag desligada / ligada

- [x] Com flag **desligada** (ou indefinida conforme regra documentada), o utilizador **não** vê segmentos NF-e/NFC-e; **sem** *placeholders* vazios estranhos (UX §8.1).  
- [x] Com flag **ligada**, comportamento **idêntico** ao baseline triplo (UX §8.2).  
- [ ] **A11y:** com um único segmento visível, o controlo permanece utilizável (teclado / rótulos coerentes com o baseline). *(Validação manual — QA #3.)*

### (b) Configuração e documentação

- [x] Variável listada em **`.env.example`** e valor efectivo referenciado nas *Completion Notes* (sem *secrets*).  
- [x] Critério de rollout (quem liga a flag em cada ambiente) mencionado nas *Completion Notes* ou doc de deploy *(mínimo aceitável: story + `.env.example`)*.  
- [x] Para *preview*/produção: referência a onde o *pipeline* define `VITE_MEI_NFE_NFCE_EMIT_ENABLED` (sem *secrets*), para QA reproduzir o estado esperado **após** o *build*. *(Ver *Completion Notes* → Onde definir no deploy.)*

### (c) Backend *(opcional — alinhar PO)*

- [x] Se **@architect**/PO fecharem *guard* em `emitir`, documentar comportamento (**403** para `NFE`/`NFCE` quando política *off*) e testes; caso contrário, marcar **N/A** nas *Completion Notes* com justificação. *(Guard implementado + teste `mei-notas-core`.)*

### (d) Qualidade e observabilidade

- [x] Testes **RTL** (ou equivalente): cenários flag **on** vs **off** no seletor.  
- [x] **NFR-POST-02 / NFR-POST-01:** não logar valores de env sensíveis em *info* em produção; eventos analíticos (se existirem) sem PII (architecture §9 / UX §10). *(Sem logging novo de env; verificação estática na implementação.)*

## Tasks (implementação)

1. [x] Ler env no módulo do seletor (`MeiFiscalEmissionTypeSegmented` / `GuidesMei`) com regra **«ligado» = `'true'`** documentada.  
2. [x] Condicionar renderização dos segmentos NF-e/NFC-e (UX §8).  
3. [x] *(Opcional)* Guard no backend em `emitir` — implementado (`MEI_NFE_NFCE_EMIT_ENABLED=false`).  
4. [x] Actualizar `.env.example` + *Completion Notes*.  
5. [x] Testes + gates `AGENTS.md`.

## QA manual (obrigatório)

| # | Acção | Resultado esperado |
|---|--------|---------------------|
| 1 | Env **sem** `VITE_MEI_NFE_NFCE_EMIT_ENABLED` (ou valor *off*) | Só **NFS-e** no seletor; layout sem buracos estranhos (UX §8.1). |
| 2 | Env **com** flag *on* | Três segmentos; paridade com [POST-0](./story-fr-guia-fisc-p0-seletor-formulario-nfe-nfce-emitir.md) (smoke). |
| 3 | Teclado / foco no seletor (flag on e off) | Navegação coerente; sem regressão A11y face ao baseline. |
| 4 | *Preview*/CI *(se couber no release):* artefacto com env **off** vs **on** conforme política do projecto | Critérios **1** ou **2** verificados no URL de *preview* correcto; evidência (link + env do *build*) nas *Completion Notes*. |

**Multitipo:** com flag **on**, cruzar com [`docs/qa/plugnotas-multitipo-checklist.md`](../qa/plugnotas-multitipo-checklist.md) para smoke NFSE/NFE/NFCE.

**Build-time:** não é possível alternar *on/off* só com F5 — cada cenário corresponde ao *bundle* construído com aquele valor de `VITE_…` (local: `.env.local` + rebuild; *preview*: variável no hosting/CI).

*Owner QA:* preencher **uma única vez** em **Dev Agent Record → Owner QA** (fim deste documento).

## File list (checklist implementação)

- [x] `frontend/src/pages/GuidesMei.tsx` e/ou `frontend/src/components/mei/MeiFiscalEmissionTypeSegmented.tsx`  
- [x] `.env.example` *(raiz do frontend / monorepo — alinhar ao repo)*  
- [x] `backend/src/services/mei-notas.service.js` / `mei-notas.controller.js` *(opcional — guard `emitir`)*

## Definition of Done

- Critérios de aceite (a)–(d) cumpridos ou **N/A** documentado em **(c)**; QA manual executado; **Owner QA** preenchido.  
- Gates `AGENTS.md`; **NFR** verificada para logs/eventos desta story.  
- Actualizar `docs/qa/plugnotas-multitipo-checklist.md` se novo fluxo QA.

## Refinamento

| Iteração | Data | Mudanças |
|----------|------|----------|
| 1 | 2026-04-16 | Alinhamento padrão epic (POST-15): Epic+PRD, dependências (decisão PO + POST-0), BDD, âmbito, DoR, AC (a)–(d), QA manual, NFR, Dev Agent Record; feedback PO ~6,5→meta *Ready*. |
| 2 | 2026-04-16 | Feedback PO 9,5/10: **Vite build-time** no contexto; DoR + AC (b) + QA **4** e nota *Build-time*; *Completion Notes* com matriz de ambientes. |

## Dev Agent Record

### Agent Model Used

Cursor / implementação conforme repositório (2026-04-16).

### Debug Log References

—

### Completion Notes List

- **«Ligado» (frontend):** apenas `VITE_MEI_NFE_NFCE_EMIT_ENABLED === 'true'` (string exacta, build-time Vite). **Não** contar `1`, `yes` nem *truthy* genérico — comportam-se como *off* (só NFS-e). Paridade com `isMeiNfeNfceEmitEnabled()` e comentário em `frontend/.env.example`.
- **Onde definir no deploy (AC b):** o valor entra no **build** do frontend, não em runtime no browser. Com **Vercel**: *Dashboard* → projecto que faz o build do app React (directório `frontend/` ou raiz conforme o *Project* ligado ao repositório) → **Settings → Environment Variables** → adicionar `VITE_MEI_NFE_NFCE_EMIT_ENABLED` por ambiente (**Production** / **Preview** / **Development**). O ficheiro `vercel.json` (raiz ou `frontend/`) define *build* e *rewrites*, **não** substitui as env — o QA deve confirmar o URL do *deployment* que usou o artefacto com a env esperada. Outro hosting: equivalente (variáveis de build do *pipeline* antes de `npm run build`).
- **Rollout:** equipa de produto/plataforma define por ambiente qual valor vai no build (p.ex. *preview* `true` para multitipo, *prod* omitido até decisão PO). Local: `frontend/.env` ou `.env.local` + **rebuild** completo.
- **Matriz mínima:** dev — omitir vs `true`; preview/prod — painel do hosting com o mesmo nome de variável no *scope* correcto.
- **Assimetria UI vs backend (esperada):** com env **omitida**, a UI oculta NF-e/NFC-e; no servidor, **só** `MEI_NFE_NFCE_EMIT_ENABLED=false` devolve **403** em NFE/NFC-e — omitir no backend não bloqueia API. Para alinhar *defence in depth* com a UI *off*, definir explicitamente `MEI_NFE_NFCE_EMIT_ENABLED=false` onde o backend corre.
- **Guard backend (implementado):** `MEI_NFE_NFCE_EMIT_ENABLED=false` → `emitir` com `documentType` **NFE** ou **NFCE** responde **403** (`mei-notas.service.js`). Teste: `backend/tests/mei-notas-core.test.js`. Omitir a env no servidor = sem bloqueio extra (deploys antigos).
- **QA manual obrigatório:** evidência de smoke (tabela *QA manual* §) e, se aplicável, **QA #4** (link do *preview* + nota de qual env de build foi usada) — anexar ou referenciar no *Change Log* / comentário de release.

### File List (final)

- `frontend/src/config/meiFiscalFeatureFlags.ts`
- `frontend/src/components/mei/MeiFiscalEmissionTypeSegmented.tsx`
- `frontend/src/components/mei/MeiFiscalEmissionTypeSegmented.test.tsx`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/AdminUserData.tsx`
- `frontend/src/vite-env.d.ts`
- `frontend/.env.example`
- `backend/src/services/mei-notas.service.js`
- `backend/.env.example`
- `backend/tests/mei-notas-core.test.js`
- `docs/qa/plugnotas-multitipo-checklist.md`

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-04-16 | 1.1 | Pós-revisão QA: semântica `true` vs `1`; onde definir env no Vercel; assimetria UI/backend; AC/tasks/file list; evidência manual pendente (A11y #3). | Dex + Quinn |

### Status

**Implementado** (código + testes automatizados + doc). **Rollout D3** continua sujeito a **decisão PO** (PRD *Won’t* por defeito). QA manual **#1–2** e **#3** (A11y) obrigatórios antes de declarar *Done* comercial; **#4** opcional por release.

### Owner QA

**A atribuir** pela equipa (Product / QA). **Revisão técnica** registada: Quinn (2026-04-16) — *gate* condicional; fechar Owner após execução da tabela *QA manual* e evidência (ou nota «N/A preview»).
