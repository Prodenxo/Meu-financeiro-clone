# Story — FR-AP-02: Frontend — autopreenchimento do prestador na emissão NFS-e

**ID:** STORY-FR-AP-02  
**Prioridade:** P0  
**Depende de:** [story-fr-ap-01-contrato-snapshot-prestador.md](./story-fr-ap-01-contrato-snapshot-prestador.md)  
**Fonte:** `docs/prd/PRD-autopreenchimento-prestador-user-mei-certificates-2026-03-31.md` (FR-AP-02, FR-AP-03, FR-AP-04, FR-AP-05)

## User story

**Como** utilizador do fluxo de emissão NFS-e,  
**quero** que os dados do prestador sejam preenchidos automaticamente quando houver cadastro em `user_mei_certificates`,  
**para** reduzir retrabalho e poder apenas revisar/ajustar antes de emitir.

## Contexto técnico

- A página `GuidesMei` já trabalha com status de certificado/emitente e campos de prestador no formulário NFS-e.
- O autopreenchimento deve usar `nfseEmitente` como hidratação inicial, com fallback seguro por campo.
- O utilizador continua com controlo total para editar os campos antes do envio.
- O payload final deve refletir os valores visíveis no formulário no momento de emitir.

## Critérios de aceite

- [ ] Com `nfseEmitente` disponível, os campos de prestador são preenchidos automaticamente ao abrir o fluxo NFS-e.
- [ ] Sem `nfseEmitente`, formulário abre com campos vazios e editáveis, sem erro de UI.
- [ ] Alteração manual dos campos autopreenchidos é preservada até o envio.
- [ ] O envio usa os valores atuais do formulário (não reaplica snapshot por cima de edição do utilizador).
- [ ] Não exigir novo upload de `.pfx` para apenas exibir/preencher dados do prestador.

## Fora de escopo

- Mudança de regras fiscais de emissão por município/provedor.  
- Redesign completo da página `GuidesMei`.

## File list (checklist implementação)

- [ ] `frontend/src/pages/GuidesMei.tsx`
- [ ] `frontend/src/services/guidesMeiService.ts` (se ajuste de tipo/contrato for necessário)
- [ ] `frontend/src/services/meiNotasService.ts` (se ajuste de payload/tipagem for necessário)
- [ ] Testes do frontend para hidratação e preservação de edição manual

## Definition of Done

- `cd frontend && npm run lint`  
- `cd frontend && npm run typecheck`  
- `cd frontend && npm test`

## Qualidade / CodeRabbit

- Evitar sobrescrever formulário em loop com rehidratação tardia (risco de apagar edição manual do utilizador).

---

## Dev Agent Record

### Status

Ready for Review

### Agent Model Used

Cursor (implementação assistida)

### Completion Notes List

- Hidratação **`nfseEmitente` → `nfseForm` (prestador)** na primeira carga com snapshot (`loadCertificateStatus`) e após upload MEI com `nfseEmitente` na resposta; **`nfseEmitenteHydratedRef`** evita reaplicar o merge em refreshes e protege edição manual.
- Função pura **`mergeEmitenteSnapshotIntoNfseForm`** (`nfseEmitenteHydration.ts`) — preenche só campos vazios; CNPJ do prestador via **`certDocument`** quando o campo ainda não tem 14 dígitos.
- **`emitenteSnapshotToForm`** deixa de espalhar `certDocument` no estado **`NfEmissionCompanyForm`**.
- Remoção de certificado limpa **prestador** em `nfseForm` (alinhado a “sem snapshot”).
- Testes: `nfseEmitenteHydration.test.ts` + `GuidesMei.nfse-emitente-hydration.test.tsx`. **`handleAtualizarCadastroSemNovoCertificado`** continua a atualizar só o formulário empresa persistido — não sobrescreve `nfseForm` (edição na NFS-e preservada).
- **Pós-QA:** aviso + botão **«Aplicar dados guardados ao formulário NFS-e»** após PATCH emitente com `nfseEmitente`; **`replacePrestadorFromEmitenteSnapshot`** (substituição explícita do bloco prestador). Testes extra: segundo merge preserva edição; replace sobrescreve opt-in.

### File List (implementação)

- `frontend/src/utils/nfseEmitenteHydration.ts`
- `frontend/src/utils/nfseEmitenteHydration.test.ts`
- `frontend/src/pages/GuidesMei.tsx`
- `frontend/src/pages/GuidesMei.nfse-emitente-hydration.test.tsx`

### Debug Log References

- `cd frontend && npm run lint` — OK (avisos pré-existentes no projeto)  
- `cd frontend && npm run typecheck` — OK  
- `cd frontend && npm test` — OK (212 pass, pós-QA FR-AP-02)

### Change Log

| Data | Nota |
|------|------|
| 2026-03-31 | Story criada pelo SM (River) a partir do PRD de autopreenchimento do prestador. |
| 2026-03-31 | Implementação FR-AP-02: merge snapshot → prestador NFS-e, testes, Ready for Review. |
| 2026-03-31 | Pós-QA: opt-in aplicar snapshot ao formulário NFS-e após PATCH; testes segundo merge + replace. |

---

## QA Results

**Revisor:** Quinn (QA)  
**Data:** 2026-03-31  
**Decisão de gate:** **PASS** com **CONCERNS** (baixa severidade)

### Evidência executada

- `cd frontend && npm test` — **210 testes pass** (incl. `nfseEmitenteHydration.test.ts`, `GuidesMei.nfse-emitente-hydration.test.tsx`).

### Rastreio — critérios de aceite

| Critério | Verificação |
|----------|-------------|
| Com `nfseEmitente`, prestador preenchido ao usar o fluxo NFS-e | **OK** — `loadCertificateStatus` aplica `mergeEmitenteSnapshotIntoNfseForm` na primeira hidratação; teste de integração com painel `#mei-panel-nfse` valida CNPJ/razão/email/logradouro. |
| Sem `nfseEmitente`, campos vazios/editáveis, sem erro de UI | **OK** — ramo sem snapshot não faz merge; remoção de certificado zera prestador em `nfseForm` antes de novo status. *Nuance:* o `useEffect` do CNPJ do MEI pode voltar a preencher só o CNPJ do prestador a partir do contribuinte (comportamento já existente). |
| Edição manual preservada até ao envio | **OK** — merge “só campos vazios”; `nfseEmitenteHydratedRef` impede re-aplicação em refreshes; testes unitários cobrem não sobrescrita de razão/logradouro/CNPJ já válido. |
| Envio reflete valores atuais do formulário | **OK** — `handleEmitNfse` constrói payload a partir de `nfseForm` (com `resolvePrestadorEndereco` para fallback de endereço quando vazio — não re-aplica snapshot por cima de edição explícita nos campos preenchidos). |
| Sem novo upload de `.pfx` só para exibir/preencher | **OK** — dados vêm de `GET /mei-guide/certificate/status` (`fetchMeiCertificateStatus`). |

### Nota de qualidade (story)

- Requisito explícito em **Qualidade / CodeRabbit**: evitar loop de rehidratação — **atendido** via `nfseEmitenteHydratedRef` + função pura de merge.

### Concerns (não bloqueantes)

1. **PATCH emitente (atualizar cadastro sem novo certificado):** após sucesso, `nfEmissionCompanyForm` é atualizado com `updatedStatus.nfseEmitente`, mas **`nfseForm` do prestador não é sincronizado**. Isto **protege** edição exclusiva na NFS-e (alinhado ao AC de preservação), mas pode deixar o painel NFS-e **desalinhado** do último snapshot persistido até o utilizador editar ou até nova hidratação completa (ex.: ref reset). Risco: utilizador assume que “guardar cadastro” atualizou também o que vê na NFS-e. *Sugestão futura:* mensagem na UI ou opt-in “Aplicar dados guardados ao formulário de emissão” (fora do escopo desta story).

2. **Cobertura de teste:** não há teste que simule dois ciclos de `loadCertificateStatus` no mesmo mount com edição intermédia; o comportamento é **inferido** por `ref` + testes do merge. Aceitável para P0; FR-AP-03 pode reforçar se necessário.

### Resumo

Implementação **consistente com o PRD/story**, testes **adequados** ao risco, gate **PASS** com registo dos concerns acima para consciência de produto/UX.

— Quinn, guardião da qualidade 🛡️
