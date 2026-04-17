# ADR: D2 — Habilitação guiada de NF-e / NFC-e no Guia MEI (Plugnotas)

**Status:** Aceito (implementação brownfield)  
**Story:** [`docs/stories/story-fr-guia-fisc-post-14-p2-d2-habilitacao-modalidades-plugnotas.md`](../stories/story-fr-guia-fisc-post-14-p2-d2-habilitacao-modalidades-plugnotas.md) (**FR-GUIA-FISC-14**)  
**Arquitetura de referência:** [`docs/technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md`](../technical/architecture-mei-emissao-nfe-nfce-guia-2026-04-06.md) §6.2 (opções A / B / C)  
**ADR base (payload empresa):** [`ADR-plugnotas-empresa-payload-apenas-nfse.md`](./ADR-plugnotas-empresa-payload-apenas-nfse.md) e complemento **documentos activos**.

## Contexto

O Guia MEI força blocos NF-e / NFC-e inactivos em vários fluxos (“apenas NFS-e”) salvo quando o corpo inclui **`documentosAtivos`** com montagem canónica (`applyEmpresaPlugnotasDocumentSelectionForPatch` em `plugnotas-empresa-documentos-ativos.js`). O produto pediu um **fluxo guiado (D2)** para o utilizador solicitar a activação da modalidade no emissor sem depender só de suporte manual.

## Decisão

1. **Opção arquitectural — B (payload condicional no PATCH existente)**  
   Não se cria rota HTTP nova dedicada. O fluxo D2 reutiliza **`PATCH /api/mei-notas/setup/emissao-fiscal/empresa`** com corpo contendo **`documentosAtivos: { nfse, nfe, nfce }`**, já suportado pelo BFF e alinhado ao complemento do ADR de empresa.

2. **Superfície no cliente**  
   *Wizard* multi-passo (`MeiFiscalModalidadesActivationWizard`) aberto a partir do CTA **«Configurar emissão de [NF-e|NFC-e]»** no `MeiFiscalCapabilityCallout` (modo **blocked**), quando **`VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED=true`**. Defeito: **desligado** até decisão PO/ops.

3. **Montagem de `documentosAtivos`**  
   Antes do PATCH, o cliente faz **`GET`** empresa (`consultarEmpresaEmissaoNf`), extrai o estado actual com a mesma heurística que o cadastro (`extractDocumentosAtivosFromEmpresaResponse`), e aplica **`buildDocumentosAtivosSolicitacaoModalidade`** para activar **NFE** ou **NFCE** alvo sem desligar modalidades já activas sem intenção explícita.

4. **Pós-sucesso**  
   Invalidação do cache local de GET empresa (`invalidateMeiEmpresaGetCache`) + incremento de **`capabilityRefetchKey`** (**FR-GUIA-FISC-11**), para o callout reflectir o novo estado sem F5.

## Consequências

- **Positivo:** sem nova rota nem alteração em `mei-notas.routes.js` para D2; reaproveita validação e políticas existentes em `empresa.service.js`.
- **Negativo:** activação depende do Plugnotas aceitar o PATCH com `config` mínimo gerado no servidor; rejeições continuam a vir do emissor — o *wizard* apenas apresenta mensagens mapeadas de forma legível.

## Implementação (referência de código)

- `frontend/src/components/mei/MeiFiscalModalidadesActivationWizard.tsx`
- `frontend/src/config/meiFiscalFeatureFlags.ts` — `isMeiFiscalD2ModalidadesEnabled`
- `frontend/src/utils/plugnotasEmpresaDocumentosAtivos.ts` — `buildDocumentosAtivosSolicitacaoModalidade`
- `frontend/src/components/mei/MeiFiscalCapabilityCallout.tsx` — CTA D2
- `frontend/src/pages/GuidesMei.tsx` — estado do *wizard* + refetch capacidade
