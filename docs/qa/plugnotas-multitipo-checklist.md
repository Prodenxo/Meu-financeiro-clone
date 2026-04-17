# Checklist QA - PlugNotas Multi-tipo

## Objetivo
Validar o fluxo de notas fiscais multi-documento (`NFSE`, `NFE`, `NFCE`) com evidências mínimas para homologação/release.

## Pré-condições
- Backend ativo.
- Frontend ativo.
- Variáveis PlugNotas configuradas para o ambiente alvo.
- Empresa e certificado A1 válidos no ambiente.
- Webhook configurado e acessível.

## Matriz de validação

| Cenário | NFSE | NFE | NFCE | Evidência |
| --- | --- | --- | --- | --- |
| Emissão assíncrona retorna `id/id_integracao/status/protocol` | [ ] | [ ] | [ ] | JSON de resposta |
| Consulta/sync atualiza status final | [ ] | [ ] | [ ] | JSON consulta antes/depois |
| Webhook atualiza nota por `plugnotas_id` | [ ] | [ ] | [ ] | Log + payload webhook |
| Webhook atualiza nota por `id_integracao` | [ ] | [ ] | [ ] | Log + payload webhook |
| Download PDF disponível após conclusão | [ ] | [ ] | [ ] | Arquivo PDF |
| Download XML disponível após conclusão | [ ] | [ ] | [ ] | Arquivo XML |
| Cancelamento processado | [ ] | [ ] | [ ] | Status/retorno cancelamento |
| Catálogo de clientes/produtos por tipo | [ ] | [ ] | [ ] | `GET /catalogo/*?documentType=` |
| Filtro por tipo na listagem (`documentType`) | [ ] | [ ] | [ ] | `GET /api/mei-notas?documentType=` |

## Rejeições e schema (NF-e/NFC-e)
- Validar pelo menos 1 cenário de rejeição controlada (ex.: schema/tributação).
- Confirmar mensagem retornada para operador.
- Registrar correção aplicada e novo envio com sucesso.

## Guia MEI — anti-duplo clique e retry em emissão (FR-GUIA-FISC-13)

Referência: `STORY-FR-GUIA-FISC-POST-13-EMITIR-RETRY`, `isMeiEmissionErrorRetryable`, `meiEmitInFlightRef` em `GuidesMei.tsx`.

- [ ] Com pedido em curso, **Emitir** em *loading* / desactivado e **seletor** NFSE/NFE/NFCE bloqueado — segundo clique **não** dispara novo POST.
- [ ] Erro **retryable** (5xx, 429, 408, rede, código `plugnotas_gateway_*`) → **Tentar novamente** → novo POST; retry **NFS-e** **não** reenvia `idIntegracao` manual (servidor gera novo id).
- [ ] Erro **não retryable** (ex.: 4xx de validação) → sem botão **Tentar novamente**.
- [ ] Testes: `frontend/src/utils/meiEmissionRetryable.test.ts`, `frontend/src/pages/GuidesMei.emission-fr-guia-fisc-13.test.tsx`.

## Guia MEI — capacidade NF-e / NFC-e (`consultarEmpresaEmissaoNf`)

Referência: **FR-GUIA-FISC-11** (`STORY-FR-GUIA-FISC-POST-11-REFETCH-CAPACIDADE`), callout `MeiFiscalCapabilityCallout`, hook `useMeiPlugnotasFiscalCapability`.

- [ ] Com tipo **NF-e** ou **NFC-e** e CNPJ válido: após **guardar / actualizar dados da empresa** no emissor, o callout de capacidade **actualiza sem F5** (loading → resultado, ou erro com **Tentar de novo**).
- [ ] Com **NFS-e** seleccionado: sem regressão visual e **sem** chamadas desnecessárias ao GET empresa só para NF-e/NFC-e (o hook permanece inactivo para NFS-e).
- [ ] Testes automatizados de regressão: `frontend/src/hooks/useMeiPlugnotasFiscalCapability.test.ts`, `frontend/src/hooks/useMeiPlugnotasFiscalCapability.rtl.test.tsx`, `frontend/src/components/mei/MeiFiscalCapabilityCallout.test.tsx`.

## Guia MEI — D3 visibilidade NF-e / NFC-e no seletor (FR-GUIA-FISC-16)

Referência: `STORY-FR-GUIA-FISC-POST-16-VITE-FLAG-NFE-NFCE`, `VITE_MEI_NFE_NFCE_EMIT_ENABLED=true` (build-time), `isMeiNfeNfceEmitEnabled`, `MeiFiscalEmissionTypeSegmented`.

- [ ] Com flag **desligada** (omitir ou não `true`): seletor mostra **só NFS-e**; sem buracos no layout; estado NFE/NFCE forçado para NFS-e ao abrir.
- [ ] Com flag **ligada** (`true` no build): três segmentos; smoke alinhado ao POST-0 e à matriz multi-tipo acima.
- [ ] *(Opcional)* Backend com `MEI_NFE_NFCE_EMIT_ENABLED=false`: `POST emitir` com `documentType` NFE/NFC-e → **403**.

## Guia MEI — D2 habilitação NF-e / NFC-e (FR-GUIA-FISC-14)

Referência: `STORY-FR-GUIA-FISC-POST-14-D2-HABILITACAO`, `VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED=true`, `MeiFiscalModalidadesActivationWizard`, CTA no callout (modo **blocked**).

- [ ] Com flag **ligada** e modalidade inactiva no emissor: callout mostra **Configurar emissão de NF-e** ou **NFC-e**; *wizard* com passos intro → checklist → confirmação → resultado.
- [ ] **Solicitar activação** chama `PATCH /mei-notas/setup/emissao-fiscal/empresa` com `documentosAtivos` (paridade `buildDocumentosAtivosSolicitacaoModalidade`).
- [ ] Sucesso: refetch de capacidade sem F5 (`bumpFiscalCapabilityRefetchIfApplicable` + invalidação cache GET empresa).
- [ ] Erro: mensagem legível (sem PII); regressão callout D1 / **Rever configuração**.
- [ ] Testes automatizados de regressão: `MeiFiscalModalidadesActivationWizard.test.tsx` (mock GET/PATCH); UX §6.3 (teclado/SR) — QA manual.

## Guia MEI — catálogo → linhas NF-e / NFC-e (FR-GUIA-FISC-12)

Referência: `STORY-FR-GUIA-FISC-POST-12-CATALOGO-LINHAS-NFE-NFCE`, selector `MeiNfeLikeCatalogProdutoPickerModal`, mapper `mapCatalogProdutoToNfeItemRow`.

- [ ] Com tipo **NF-e** ou **NFC-e**: secção Itens mostra **Adicionar do catálogo**; lista produtos com `documentType` correspondente (`NFE` / `NFCE`).  
- [ ] Seleccionar produto acrescenta linha editável; sem regressão com **NFS-e** (botão ausente).  
- [ ] Lista vazia: *empty state* com CTA **Ir ao catálogo** (`/mei-catalogo/servicos-produtos`).  
- [ ] Testes: `frontend/src/utils/mapCatalogProdutoToNfeItem.test.ts`, `frontend/src/components/mei/MeiNfeLikeEmitForm.catalog.test.tsx`.

## Guia MEI — actualizar estado na lista (FR-GUIA-FISC-15 onda 1)

Referência: `STORY-FR-GUIA-FISC-POST-15-POS-EMISSAO-ONDA1`, `GET /api/mei-notas/:id?sync=true` (`obterNota` → `refreshWithPlugNotas`), botão **Actualizar estado** por linha em `MeiNfseListRowActions`.

- [ ] **NFSE / NFE / NFCE:** com identificador no emissor (`plugnotas_id`, `protocol` ou `id_integracao` + CNPJ prestador), **Actualizar estado** consulta o emissor e actualiza *badge* de status na lista.
- [ ] Sem identificadores: botão desactivado e `title` com mensagem honesta.
- [ ] Erro de API: mensagem legível na pilha (sem PII); *loading* na linha (`aria-busy`).
- [ ] Testes: `MeiNfseListRowActions.refresh-status.test.tsx`, `notaFiscalPodeSincronizarEstadoEmissor` em `meiNotasService.test.ts`.

## Guia MEI — limite de faturamento (somatório)

Referência: **FR-GUIA-FISC-17** (`STORY-FR-GUIA-FISC-POST-17-LIMITE-MEI`), `isDocumentTypeMeiLimiteRelevante` / `agregarLimiteFaturamento`, *widget* `MeiLimiteFaturamentoBlock`.

- [ ] Com notas **NFSE**, **NFE** e **NFCE** no ano: o *widget* de limite **só** incorpora **NFSE** concluídas; valores de NF-e/NFC-e **não** entram no total (paridade com `GET /api/mei-notas/limite-faturamento`).
- [ ] **Como calculamos** (botão no bloco): copy sobre exclusão de NF-e/NFC-e; focável por teclado.
- [ ] Tabela de histórico: NFE/NFC-e **visíveis** com valores; sem dupla contagem no *widget*.
- [ ] Testes: `backend/tests/mei-limite-payload-sum.test.js`, `frontend/src/utils/meiLimiteFaturamento.test.ts`, `frontend/src/components/MeiLimiteFaturamentoBlock.test.tsx`.

## Segurança operacional
- [ ] `PLUGNOTAS_WEBHOOK_REQUIRE_TOKEN` ativo no ambiente alvo.
- [ ] Query token desabilitada (`PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN=false`) salvo exceção justificada.
- [ ] Token não exposto em logs/evidências.

## Testes automatizados mínimos
- Backend:
  - `npm test --workspace backend -- tests/mei-notas-core.test.js tests/mei-notas-routes.test.js tests/plugnotas-nfse.test.js tests/plugnotas-nfe.test.js tests/plugnotas-nfce.test.js`
- Frontend:
  - `npm test --workspace frontend -- src/services/meiNotasService.test.ts`
  - `npm run typecheck --workspace frontend`

## Resultado final
- [ ] Aprovado para homologação
- [ ] Aprovado para produção
- [ ] Reprovado (informar bloqueadores)

## Bloqueadores encontrados
- TBD
