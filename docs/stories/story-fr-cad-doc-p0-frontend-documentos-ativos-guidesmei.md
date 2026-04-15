# Story — FR-CAD-DOC (P0): Frontend — **Documentos ativos** no cadastro (Guia MEI)

**ID:** STORY-FR-CAD-DOC-P0-FE-DOC-ATIVOS  
**Prioridade:** P0  
**Depende de:** [story-fr-cad-doc-p0-backend-documentos-ativos-plugnotas.md](./story-fr-cad-doc-p0-backend-documentos-ativos-plugnotas.md) (contrato `documentosAtivos` estável)  
**Bloqueia:** [story-fr-cad-doc-p1-ux-copy-banner-campos-condicionais.md](./story-fr-cad-doc-p1-ux-copy-banner-campos-condicionais.md) (opcional; pode paralelizar copy mínima)  
**Fonte PRD:** [`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — **FR-CAD-DOC-01** a **FR-CAD-DOC-07**, **FR-CAD-DOC-06**  
**UX:** [`docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md)  
**Arquitetura:** [`docs/technical/architecture-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](../technical/architecture-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) §4

## User story

**Como** MEI a cadastrar o emitente no Plugnotas,  
**quero** escolher **quais** tipos de documento ficam ativos (NFS-e, NF-e, NFC-e) e ver essa escolha refletida na consulta ao emissor,  
**para** alinhar a app ao painel Plugnotas e preparar emissão futura sem surpresas (**FR-CAD-DOC-01**–**06**).

## Escopo desta story (MVP P0)

- Secção **Documentos ativos** (checkboxes) **acima** do bloco de dados mínimos (`GuidesMei.tsx` — UX §3.1).  
- Estado `documentosAtivos: { nfse, nfe, nfce }` com default **PRD §6.2** (NFS-e on; NF-e/NFC-e off).  
- Validação: **pelo menos um** tipo — mensagem **"Selecione pelo menos um tipo de documento."** (pt-BR).  
- **Modal** ao desmarcar NFS-e (PRD §6.4, UX §6.3).  
- Incluir `documentosAtivos` no payload gerado por `buildNfEmissionEmpresaPayload` (`nfEmissionCompany.ts`) + chamadas POST/PATCH existentes.  
- Após **Consultar cadastro no emissor**, hidratar checkboxes via parser defensivo (arquitetura §4.2); se resposta ambígua, mensagem honesta (**FR-CAD-DOC-06**).  
- **Não** é obrigatório nesta story: título dinâmico longo nem banner P1 (podem ficar só placeholder ou mínimo).

## Critérios de aceite

- [ ] **FR-CAD-DOC-01 / 02:** três checkboxes com `fieldset`/`legend` e labels acessíveis (NFR-CAD-DOC-01).  
- [ ] **FR-CAD-DOC-03:** submit bloqueado com zero tipos + mensagem visível/`aria-live` conforme UX §6.2.  
- [ ] **FR-CAD-DOC-04:** envio de cadastro (POST empresa) inclui `documentosAtivos` coerente com a UI e o backend aceita.  
- [ ] **FR-CAD-DOC-05:** "Atualizar cadastro (sem novo certificado)" envia `documentosAtivos` no PATCH quando o utilizador altera a seleção.  
- [ ] **FR-CAD-DOC-06:** consulta GET atualiza checkboxes quando `nfse`/`nfe`/`nfce.ativo` forem parseáveis; caso contrário aviso de limitação (sem estado falso).  
- [ ] **FR-CAD-DOC-07:** com só NFS-e ativo, experiência não remove caminhos existentes (título pode permanecer como hoje).  
- [ ] Testes: unitários do parser (`*.test.ts`) + teste de componente ou integração leve se o repo já usar para Guia MEI.  
- [ ] Gates `AGENTS.md`.

## Tasks (implementação)

1. [x] Estado `documentosAtivos` em `GuidesMei.tsx` (ou componente extraído).  
2. [x] UI fieldset + checkboxes + modal desmarcar NFS-e.  
3. [x] Estender `buildNfEmissionEmpresaPayload` e chamadas que montam `payload` para POST/PATCH.  
4. [x] Implementar `mapPlugnotasEmpresaToDocumentSelection` (nome pode variar) + testes com fixtures.  
5. [x] Integrar fluxo "Consultar cadastro" existente com hidratação dos checkboxes.

## Fora de escopo (outras stories)

- Copy neutra para múltiplos tipos e banner FR-CAD-DOC-10 → [story-fr-cad-doc-p1-ux-copy-banner-campos-condicionais.md](./story-fr-cad-doc-p1-ux-copy-banner-campos-condicionais.md).  
- Campos condicionais extras (CSC, etc.) → P1.  
- Persistência `user_mei_certificates` → [story-fr-cad-doc-p1-persistencia-documentos-ativos-supabase.md](./story-fr-cad-doc-p1-persistencia-documentos-ativos-supabase.md).

## File list (checklist)

- [ ] `frontend/src/pages/GuidesMei.tsx`  
- [ ] `frontend/src/utils/nfEmissionCompany.ts`  
- [ ] `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts` (ou nome acordado) + `*.test.ts`  
- [ ] Serviço API que chama setup empresa (ex.: `meiNotasService.ts` / helpers) — apenas se precisar de tipo TS

## Definition of Done

- Critérios de aceite verificados manualmente (fluxo cadastro + consulta) ou com mocks.  
- Sem regressão nos testes existentes do Guia MEI.

## Qualidade / CodeRabbit

- Não assumir formato fixo do JSON do GET — reutilizar padrão defensivo de `plugnotasEmpresaCapabilities` se aplicável.  
- Evitar duplicar strings de erro fiscal; alinhar a `fiscalUserError` / integração existente.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes List

- Secção **Documentos ativos** (`fieldset`/`legend`) acima dos dados mínimos; título/hint dinâmicos (só NFS-e vs múltiplos tipos, UX §5.1).
- Validação ≥1 tipo em **Enviar certificado** e **Atualizar cadastro (sem novo certificado)**; `role="alert"` no erro; foco no checkbox NFS-e.
- Modal `alertdialog` **Desativar NFS-e?** (UX §6.3); `documentosAtivos` em POST/PATCH via `buildNfEmissionEmpresaPayload`.
- **Consultar cadastro**: `mapPlugnotasEmpresaToDocumentSelection`; aviso honesto se resposta parcial.
- Reset de `documentosAtivos` ao remover certificado.
- Testes: `plugnotasEmpresaDocumentosAtivos.test.ts`, `nfEmissionCompany.test.ts` (payload com `documentosAtivos`).
- Gates: `npm run lint`, `npm run typecheck`, `npm run test` (workspaces) — OK.
- **Follow-up QA (2026-04-07):** validação «zero tipos» em **Atualizar cadastro** usa `documentosAtivosSubmitError` (fieldset + `role="alert"`), alinhado a **Enviar certificado**; testes RTL `GuidesMei.documentos-ativos.test.tsx` (modal NFS-e + PATCH bloqueado).
- **Follow-up DEV (2026-04-15):** o payload local enviado pelo browser passou a espelhar `nfse/nfe/nfce.ativo` conforme os checkboxes do site; `nfse.config.nfseNacional` e `consultaNfseNacional` permanecem apenas quando `NFS-e` está ativa, reduzindo desvio entre UI e request antes da normalização do backend.

### File List (final)

- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.documentos-ativos.test.tsx`
- `frontend/src/components/mei/GuiaMeiDesativarNfseDialog.tsx`
- `frontend/src/utils/nfEmissionCompany.ts`
- `frontend/src/utils/nfEmissionCompany.test.ts`
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts`
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.test.ts`
- `docs/brief/brief-alinhamento-payload-local-empresa-plugnotas-documentos-ativos-2026-04-15.md`

---

## QA Results

**Revisor:** Quinn (QA / advisory)  
**Data:** 2026-04-07  
**Decisão de gate:** **PASS com recomendações** (sem bloqueio de merge por defeitos P0 na story)

### Rastreio critérios de aceite → evidência

| Critério | Veredicto | Evidência |
|----------|-----------|-----------|
| FR-CAD-DOC-01 / 02 (fieldset, legend, 3 checkboxes, labels) | **Atende** | `GuidesMei.tsx`: `fieldset` + `legend` «Documentos ativos», três `<label>` com texto e linha de ajuda; primeiro controlo com `ref` para foco. |
| FR-CAD-DOC-03 (≥1 tipo, bloqueio submit, mensagem acessível) | **Atende** (*ver nota*) | Validação em `handleCertificateUpload` e `handleAtualizarCadastroSemNovoCertificado`; mensagem canónica `MSG_DOCUMENTOS_ATIVOS_MIN_ONE`; registo com `role="alert"` e `aria-describedby` no fieldset no fluxo **Enviar certificado**. No fluxo **Atualizar cadastro**, o mesmo texto vai para `nfEmissionCompanySyncError` (painel global), não para o erro inline do fieldset — bloqueio e foco mantidos, UX ligeiramente inconsistente. |
| FR-CAD-DOC-04 (POST com `documentosAtivos`) | **Atende** | `buildNfEmissionEmpresaPayload` + passagem de `documentosAtivos` em `handleCertificateUpload`; teste `nfEmissionCompany.test.ts` «inclui documentosAtivos quando fornecido». |
| FR-CAD-DOC-05 (PATCH com `documentosAtivos`) | **Atende** | `handleAtualizarCadastroSemNovoCertificado` chama `buildNfEmissionEmpresaPayload` com `documentosAtivos`. |
| FR-CAD-DOC-06 (consulta: hidratação ou aviso honesto) | **Atende** | `mapPlugnotasEmpresaToDocumentSelection` + `extractPlugnotasEmpresaBody`; `full` atualiza estado; `partial` apenas `setDocumentosAtivosConsultWarning` (não força ticks falsos). Testes em `plugnotasEmpresaDocumentosAtivos.test.ts`. |
| FR-CAD-DOC-07 (só NFS-e: não regredir fluxo) | **Atende** | Default alinhado ao PRD; com só NFS-e o título do bloco mantém «Dados mínimos para emissão de NFS-e». |
| Testes (parser + payload) | **Atende** | 7 testes unitários nos ficheiros acima (execução QA local: OK). Não há teste RTL dedicado ao fieldset na Guia MEI — aceitável face ao texto da story («integração leve se o repo já usar»); cobertura principal via utils. |
| Gates AGENTS.md | **Atende** (declaratório dev) | Completar `lint` / `typecheck` / `test` workspaces no CI local do repositório antes do merge. |

### Comportamentos validados por código (amostra)

- **Modal NFS-e:** `GuiaMeiDesativarNfseDialog` com `role="alertdialog"`, `aria-labelledby` / `aria-describedby`, copy alinhada à UX §6.3.
- **Desmarcar NFS-e:** `handleDocumentosAtivosChange` abre o modal sem alterar estado até confirmação.
- **Reset:** remoção de certificado repõe `documentosAtivos` para default (notas dev).

### Riscos / dívida menor

1. **Homogeneidade de erro (FR-CAD-DOC-03):** unificar exibição da validação «zero tipos» no PATCH para o mesmo padrão do fieldset (ou `role="alert"` no painel de sync) reduz confusão.
2. **Teste de integração UI (opcional):** um teste RTL mínimo em `GuidesMei` (desmarcar NFS-e abre modal; submit com zero tipos não chama API) aumentaria confiança regressiva.

### NFR (amostra)

- **A11y:** fieldset/legend e `alertdialog` em boa direção; texto de erro no PATCH poderia referenciar explicitamente o grupo «Documentos ativos» via copy ou região única.
- **Segurança:** sem superfície nova de dados sensíveis além do fluxo fiscal já existente.

---

*Secção QA apenas; demais secções da story não alteradas por QA.*
