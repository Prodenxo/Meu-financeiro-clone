# Minuta PO — copy canónica v1.0 (erros ao utilizador)

**Data:** 2026-04-07  
**Origem:** [inventario-erros-utilizador-final-2026-04-07.md](./inventario-erros-utilizador-final-2026-04-07.md) §2

## Checklist

- [ ] Li a tabela de copy por `category` (réplica da spec UX §6).
- [ ] Aprovo o *wording* v1.0 **ou** registo abaixo alterações pedidas por linha.

## Alterações pedidas (preencher se aplicável)

| category | Alteração desejada |
|----------|-------------------|
| | |

## Revisão desenvolvimento (pós-QA — DoD parcial)

*Preenche critério “inventário revisto por quem conhece código” da story; não substitui a aprovação de copy pelo PO.*

- [x] Matriz §1 do [inventario-erros-utilizador-final-2026-04-07.md](./inventario-erros-utilizador-final-2026-04-07.md) confrontada com os ficheiros: `frontend/src/pages/GuidesMei.tsx`, `frontend/src/services/apiClient.ts`, `frontend/src/components/FetchErrorBanner.tsx`, `frontend/src/store/transactionStore.ts`, `frontend/src/pages/MeiCatalogoClientes.tsx`, `frontend/src/pages/MeiCatalogoServicosProdutos.tsx`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`.
- [x] Correcção documental da nomenclatura fiscal na spec NFS-e (§7 — `FiscalIntegrationErrorAlert.tsx` + exports).
- [ ] Auditoria exaustiva de **todos** os `toast.error` no repo — **fora** do âmbito da Fase A; pode ser fechada incrementalmente em **FR-ERR-P0-D** se necessário.

**Registo:** 2026-04-07 — implementação documental pós-QA.

## Assinatura / registo

- **Nome / data (PO — copy v1.0):** _pendente_
