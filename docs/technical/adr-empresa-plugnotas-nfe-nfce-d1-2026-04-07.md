# ADR — Empresa Plugnotas: modalidades NF-e / NFC-e (**D1** adoptado)

**Status:** Aceite (documentação)  
**Data:** 2026-04-07  
**Story:** [`STORY-POSQA-4-DECISAO-EMPRESA-PLUGNOTAS`](../stories/story-posqa-4-decisao-empresa-plugnotas-registo.md)  
**PRD:** [`PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md`](../prd/PRD-melhorias-nfe-nfce-pos-testes-automatizados-2026-04-07.md) §8.1 (**FR-POSQA-03**)

## Contexto

O cadastro da empresa no Plugnotas pode expor `nfe` / `nfce` **inactivos** (política de produto “apenas NFS-e” em parte dos fluxos). O utilizador precisa de distinguir **falha de configuração no emissor** de bug da aplicação.

## Decisão

**Adoptar **D1 — Documentação + bloqueio honesto**** como linha de produto à data de registo:

- Manter a lógica actual: consulta de capacidades (`parsePlugnotasEmpresaCapabilities` / `GET` empresa) e **bloqueio de emissão** na UI quando a modalidade não está disponível no integrador — componente **`MeiFiscalCapabilityCallout`** no Guia MEI (ver UX spec POSQA §6).
- **Não** implementar neste incremento PATCH/POST automático no `empresa.service.js` para activar modalidades (isso seria **D2**).
- **Não** implementar **D3** (feature flag de visibilidade NF-e/NFC-e); o selector permanece disponível para contas com capacidade; utilizadores sem modalidade vêem bloqueio e orientação.

## Opções não adoptadas (backlog explícito)

| Opção | Nota |
|-------|------|
| **D2 — Roadmap habilitação** | Story filha futura: fluxo guiado e/ou alteração controlada de `empresa.service.js` + contrato Plugnotas; requer PRD/estimativa próprios. |
| **D3 — Feature flag** | Se no futuro: definir variável de ambiente (ex. prefixo `VITE_`), critérios de rollout e dono; implementação em story separada. |

## Consequências

- Suporte e QA podem apontar para runbook + este ADR + PRD §8.1.
- **FR-POSQA-03** fica satisfeito com registo auditável sem novo código obrigatório.

## Referências técnicas

- `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx`
- `frontend/src/utils/plugnotasEmpresaCapabilities.ts`
- `backend/src/services/empresa.service.js` (sem alteração imposta por este ADR)
