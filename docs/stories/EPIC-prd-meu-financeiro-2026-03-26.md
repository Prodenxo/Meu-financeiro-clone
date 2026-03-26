# Épico — PRD Meu Financeiro (brownfield)

**PRD:** `docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`  
**Arquitetura de referência:** `docs/architecture.md` (camadas Express/React/Supabase); operação NFSe: `docs/operacao-mei-nfse.md`.

## Mapa de stories

| Ordem sugerida | ID FR (PRD) | Story |
|----------------|---------------|--------|
| 1 | FR-P-06 | [story-fr-p-06-guidesmei-download-apenas-manual.md](./story-fr-p-06-guidesmei-download-apenas-manual.md) |
| 2 | FR-P-07 | [story-fr-p-07-manageusers-loading-busca.md](./story-fr-p-07-manageusers-loading-busca.md) |
| 3 | FR-P-05 | [story-fr-p-05-cadastro-empresa-superadmin.md](./story-fr-p-05-cadastro-empresa-superadmin.md) |
| 4 | FR-P-03, FR-P-04 | [story-fr-p-03-04-nfse-emitente-user-mei-certificates.md](./story-fr-p-03-04-nfse-emitente-user-mei-certificates.md) |
| 5 | FR-P-01, FR-P-02 | [story-fr-p-01-02-das-automacao-mensal-painel.md](./story-fr-p-01-02-das-automacao-mensal-painel.md) |

## PRD satélite — correção schema Supabase (emitente NFS-e)

| Contexto | Story |
|----------|--------|
| Alinhar DB remoto com migrações `20260326140000_*` / `20260326150000_*` (coluna `tipo_logradouro`); ops + doc + QA | [story-prd-correcao-supabase-schema-tipo-logradouro.md](./story-prd-correcao-supabase-schema-tipo-logradouro.md) |

**PRD:** `docs/prd/PRD-correcao-supabase-schema-tipo-logradouro-2026-03-26.md` — **depende** da funcionalidade de `story-fr-p-03-04-*` já no código; desbloqueia persistência em ambientes com schema atrasado.

---

## Notas

- **Segurança P0–P2** está em `docs/prd.md` + `docs/architecture.md`; não duplicado aqui como story de feature — implementação segue esse trilho em paralelo.
- Priorização MoSCoW do PRD: Must → FR-P-06; Should → FR-P-05, FR-P-03/04; Could → FR-P-01/02 (ajustar ao sprint).

**Última atualização:** 2026-03-26 — secção PRD satélite (correção schema NFS-e).
