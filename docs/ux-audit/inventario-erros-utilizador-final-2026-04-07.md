# Inventário de erros ao utilizador final + copy canónica + decisão backend (Fase A)

**Data:** 2026-04-07  
**Story:** [STORY-FR-ERR-P0-A](../stories/story-fr-err-p0-a-inventario-copy-decisao-backend.md)  
**PRD:** [`docs/prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md`](../prd/PRD-mensagens-erro-ux-usuario-final-2026-04-07.md)  
**Spec UX:** [`docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](../specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md)  
**Arquitetura:** [`docs/technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md`](../technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md)

**Minuta PO (DoD):** o produto deve confirmar leitura da **§2 Copy canónica** ou registar alterações pedidas em comentário de PR / ficheiro `docs/ux-audit/po-copy-erros-utilizador-2026-04-07.md` (criar se necessário).

---

## 1. Matriz de inventário (FR-ERR-A01)

Colunas: superfície, componente / ficheiro, origem actual da string, categoria taxonómica alvo, copy proposta (resumo), recoverable, CTAs, surfaceId (analytics futuro).

| ID | Superfície / rota | Componente / origem | Origem actual da string | Categoria alvo | Copy proposta (resumo) | Recoverable | CTAs | surfaceId |
|----|-------------------|---------------------|-------------------------|----------------|-------------------------|-------------|------|-----------|
| ERR-INV-001 | `/guias-mei` — NFS-e | `GuidesMei.tsx` → `formatMeiFiscalErr` → `mapMeiFiscalErrorFromUnknown` / `formatFiscalError` | `Error.message` pós-API + mapeamento fiscal | `provedor_fiscal` / `sessao` / … | Spec §6 + título estável + detalhe longo em painel | Sim (maioria) | Tentar novamente / Rever dados / doc | `guia_mei.nfse.emit` |
| ERR-INV-002 | `/guias-mei` — lista NFSe | Idem — `setOperationNfseError` | Idem | `provedor_fiscal` / `rede` | Idem | Sim | Retry conforme acção | `guia_mei.nfse.list` |
| ERR-INV-003 | `/guias-mei` — NF-e / NFC-e | Idem — `setEmissionNfseError` (nome histórico) | Idem | `provedor_fiscal` | Idem | Sim | Idem | `guia_mei.nfe.emit` |
| ERR-INV-004 | `/guias-mei` — certificado | `setCertificateError`, conectividade | `formatMeiFiscalErr` / painel `GuiaMeiCertificateConnectivityPanel` | `rede` / `provedor_fiscal` | Copy rede vs emissor já parcialmente separada | Sim | Reenviar cert / ajuda | `guia_mei.cert` |
| ERR-INV-005 | `/guias-mei` — emitente / empresa | `nfEmissionCompanySyncError`, cadastro Plugnotas | `formatMeiFiscalErr` | `provedor_fiscal` / `validacao_servidor` | Título humano + detalhe | Sim | Salvar de novo / revisar | `guia_mei.emitente` |
| ERR-INV-006 | `/guias-mei` — catálogo embutido | Erros de carregamento catálogo NFS-e | `formatMeiFiscalErr` | `provedor_fiscal` / `rede` | §6 `rede` ou `provedor_fiscal` | Sim | Tentar novamente | `guia_mei.nfse.catalog` |
| ERR-INV-007 | `/guias-mei` — `MeiFiscalCapabilityCallout` | `fetch_error` / `blocked` | Props `errorMessage` / modo | `provedor_fiscal` / `permissao` | Já orientador; alinhar labels a copy canónica | Parcial | Revisar configuração | `guia_mei.capability` |
| ERR-INV-008 | `/mei-catalogo/clientes` | `MeiCatalogoClientes.tsx` — `toast.error(msg)` | `formatPlugnotasIntegrationError` / `err.message` | `provedor_fiscal` / `validacao_servidor` | Toast deve resumir; detalhe noutra superfície se longo | Sim | — | `mei_catalogo.clientes.page` |
| ERR-INV-009 | `/mei-catalogo/clientes` | `MeiCatalogoClienteModal.tsx` — banner API | `formatPlugnotasIntegrationError` | Idem | Bloco `UserFacingError` alvo | Sim | Fechar / corrigir | `mei_catalogo.clientes.modal` |
| ERR-INV-010 | `/mei-catalogo/servicos-produtos` | `MeiCatalogoServicosProdutos.tsx` | Idem ERR-INV-008 | Idem | Idem | Sim | — | `mei_catalogo.produtos.page` |
| ERR-INV-011 | `/mei-catalogo/servicos-produtos` | `MeiCatalogoProdutoModal.tsx` — validação + API | Mensagem inline + API | `validacao_cliente` / `provedor_fiscal` | Separar validação local de erro API | Sim | — | `mei_catalogo.produtos.modal` |
| ERR-INV-012 | `/transacoes` | `Transactions.tsx` — `FetchErrorBanner` | `transactionStore.error` ← `getErrorMessage` | `rede` / `validacao_servidor` / `desconhecido` | §6 — nunca só “Erro ao carregar…” sem segunda frase | Sim | Tentar novamente | `transacoes.list` |
| ERR-INV-013 | `/transacoes` | `Transactions.tsx` — `toast.error` | `errorMsg` de store / resultado | Idem | Mapear toast | Sim | — | `transacoes.mutate` |
| ERR-INV-014 | `/` (dashboard) | `Dashboard.tsx` — `FetchErrorBanner` | Erro fetch transações | `rede` / `desconhecido` | §6 `rede` | Sim | Retry | `dashboard.transactions` |
| ERR-INV-015 | `transactionStore.ts` | `getErrorMessage(error, fallback)` | `Error.message` cru do serviço | *(classificar no mapper)* | Substituir por `mapUnknownErrorToUserFacing` na story B | Sim | — | `store.transactions` |
| ERR-INV-016 | Vários | `FetchErrorBanner` | Prop `message` string única | *(inferir no call site)* | Wrapper deve receber `UserFacingErrorProps` ou mapear antes | Sim | `onRetry` | `fetch_banner.generic` |
| ERR-INV-017 | `/categorias` | `Categorias.tsx` | `loadError` → banner | `rede` / `validacao_servidor` | §6 | Sim | Retry | `categorias.list` |
| ERR-INV-018 | `/agenda` | `Agenda.tsx` | `FetchErrorBanner` | Idem | Idem | Sim | Retry | `agenda.list` |
| ERR-INV-019 | `/recorrencias` | `Recorrencias.tsx` | Banner + toast | Idem | Idem | Sim | Retry | `recorrencias.list` |
| ERR-INV-020 | `/orcamentos` | `Orcamentos.tsx` | Banner + toasts negócio | Mistura | Toasts de validação = `validacao_cliente`; API = mapper | Varia | — | `orcamentos.*` |
| ERR-INV-021 | DRE / orçamentos | `DreBudgetPanel.tsx` | `FetchErrorBanner` | `rede` / `validacao_servidor` | §6 | Sim | Retry | `orcamentos.dre` |
| ERR-INV-022 | `/settings` | `Settings.tsx` — `setError(err.message)` | `Error.message` directo | `sessao` / `validacao_servidor` / `desconhecido` | Não mostrar mensagem crua só; mapear 401/403 | Parcial | — | `settings.profile` |
| ERR-INV-023 | `/admin/...` / gestão | `ManageUsers.tsx` | `toast.error` + `setError` com `err.message` | `permissao` / `validacao_servidor` | FR-ERR-B05 alinhamento | Sim | — | `admin.users` |
| ERR-INV-024 | Admin dados utilizador | `AdminUserData.tsx` | `formatPlugnotasIntegrationError` | `provedor_fiscal` | Mesmo padrão Guia MEI | Sim | — | `admin.user.mei` |
| ERR-INV-025 | `apiClient.ts` | `request` / `requestJson` | `apiClientErrorFromPayload(..., buildApiErrorMessage)` → `throw` | *(sempre classificar no cliente)* | **Não** usar string agregada como única UI | — | — | `api_client.throw` |
| ERR-INV-026 | `buildApiErrorMessage.ts` | Função pura | Concatena `message`, `details`, `plugnotasRequest`, tentativas | — | Destino deve ser `technicalDetail`, não título | — | — | `build_api_error` |
| ERR-INV-027 | `MeiLimiteFaturamentoBlock` | Prop `errorMessage` | String externa | `provedor_fiscal` / `rede` | Alinhar a bloco unificado | Sim | — | `guia_mei.limite` |
| ERR-INV-028 | `FiscalIntegrationErrorAlert.tsx` | Vários exports | Mensagem longa + hint provedor | `provedor_fiscal` | Composer sobre `UserFacingErrorBlock` (story C) | Sim | Variável | `fiscal.alert` |
| ERR-INV-029 | `useMeiPlugnotasFiscalCapability.ts` | Hook | `formatPlugnotasIntegrationError` | `provedor_fiscal` | Passar a modelo estruturado | Sim | — | `hook.fiscal.capability` |
| ERR-INV-030 | Auth / reset | `ResetPassword.tsx` | `getErrorMessage` | `sessao` / `validacao_cliente` | Copy amigável já parcial; alinhar categorias | Sim | — | `auth.reset` |

**Notas:**

- A matriz **P0 do PRD §10** está coberta nas linhas **ERR-INV-001–011, 012–015, 016, 025–026, 028** (Guia MEI, catálogos, transações + store, banner, *pipeline* API).  
- Linhas **017–024, 027–030** são **P1** ou adjacentes; úteis para onda seguinte e para completar **FR-ERR-A05** (*buildApiErrorMessage* entra na UI indirectamente via **qualquer** `catch` que mostre `error.message` sem mapper).

---

## 2. Copy canónica v1.0 por categoria (FR-ERR-A02)

Réplica normativa da [`spec UX §6`](../specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md#6-copy-canónica-v10-por-category). Aprovação PO pode ajustar *wording* sem alterar chaves `category`.

| `category` | Título | Descrição | CTA primária (se `recoverable`) | CTA secundária (opcional) |
|------------|--------|-----------|-----------------------------------|---------------------------|
| `rede` | Ligação à internet instável | Não foi possível comunicar com o servidor. Verifique se está ligado à internet e tente outra vez. | Tentar novamente | — |
| `indisponivel` | Serviço temporariamente indisponível | O serviço está a demorar mais do que o habitual ou não respondeu. Espere um momento e tente novamente. | Tentar novamente | Voltar ao início |
| `sessao` | Sessão expirada ou inválida | Por segurança, precisa de voltar a entrar na conta para continuar. | Entrar novamente | — |
| `permissao` | Não tem permissão para esta ação | A sua conta não pode executar esta operação. Se precisar de acesso, fale com o administrador da empresa. | Voltar | Contactar suporte |
| `validacao_cliente` | Revise os dados indicados | Alguns campos estão em falta ou incorretos. Corrija os valores assinalados e envie de novo. | — | — |
| `provedor_fiscal` | A nota não foi aceite pelo serviço de emissão | O emissor fiscal devolveu uma validação. Leia os detalhes abaixo, ajuste os dados conforme a mensagem e tente emitir novamente. | Rever dados / Tentar novamente | Abrir documentação MEI |
| `validacao_servidor` | Não foi possível concluir o pedido | Os dados enviados não foram aceites. Verifique as informações e tente outra vez. Se o problema continuar, contacte o suporte. | Tentar novamente | — |
| `desconhecido` | Algo inesperado aconteceu | Não conseguimos concluir esta operação. Tente novamente, verifique a ligação à internet ou contacte o suporte e diga o que estava a fazer. | Tentar novamente | Contactar suporte |

---

## 3. Pontos `buildApiErrorMessage` / `Error.message` → UI (FR-ERR-A05)

### 3.1 Cadeia `buildApiErrorMessage`

| Passo | Ficheiro | O que acontece |
|-------|----------|----------------|
| 1 | `frontend/src/services/apiClient.ts` | Em respostas JSON de erro, chama-se `buildApiErrorMessage(payload)` dentro de `apiClientErrorFromPayload` → `ApiClientError.message` contém **tudo** agregado (incl. método/path Plugnotas e tentativas). |
| 2 | *Call sites* | Muitos fazem `catch (e) { toast.error(e instanceof Error ? e.message : ...) }` ou passam a string ao `FetchErrorBanner` — o utilizador vê **jargão** na mesma linha que o resumo. |
| 3 | `frontend/src/utils/buildApiErrorMessage.ts` | Função pura; continua necessária para **logs** e para campo `technicalDetail` após refactor. |

### 3.2 Outras entradas de `Error.message` cru

- `transactionStore.getErrorMessage` — propaga `error.message` do `fetch`/API.  
- `Settings.tsx`, `ManageUsers.tsx`, vários modais — `err instanceof Error ? err.message`.  
- Caminhos fiscais já mitigam via `formatMeiFiscalErr` / `mapMeiFiscalErrorFromUnknown`, mas a **string** final pode ainda ser densa.

### 3.3 Decisão **D2** (JSON `userFacing` no backend)

| Opção | Descrição |
|-------|-----------|
| **D2 — Não (recomendado para v1)** | Implementar **D1** no cliente: estender `ApiClientError` com `payload` opcional (arquitetura §4.2 **D3**), mapeadores `mapApiClientErrorToUserFacing` + taxonomia. **Vantagem:** sem coordenação de *deploy* backend/frontend, sem versão de API. **Risco:** mensagens muito opacas continuam a depender de heurísticas até haver mais códigos estáveis. |
| **D2 — Sim (fase posterior)** | Backend passa a incluir bloco opcional `userFacing: { category, title, description, supportDetail?, requestId? }` (ver [arquitetura §6](../technical/architecture-mensagens-erro-ux-usuario-final-2026-04-07.md#6-backend-opcional--decisão-d2)). **Quando reavaliar:** após **ERR-P0-D**, se ainda houver taxa alta de `desconhecido` ou copy incorreta por parsing de inglês do provedor. **Story sugerida:** `story-fr-err-p1-backend-user-facing-payload.md` (criar quando PO aprovar). |

**Registo:** **D2 = Não** para a primeira onda; **rever** após migração P0.

---

## 4. Rastreio a requisitos PRD

| PRD ID | Onde está satisfeito neste entregável |
|--------|--------------------------------------|
| FR-ERR-A01 | §1 Matriz |
| FR-ERR-A02 | §2 Tabela |
| FR-ERR-A05 | §3 |
| FR-ERR-A04 | Parágrafos adicionados em `ux-spec-mei-nfse-workspace-2026-04-01.md` e `ux-spec-guia-mei-emissao-nfe-nfce-2026-04-06.md` |

---

## 5. Próximos passos (stories)

1. [STORY-FR-ERR-P0-B](../stories/story-fr-err-p0-b-user-facing-error-core-mapeadores.md) — núcleo técnico.  
2. [STORY-FR-ERR-P0-C](../stories/story-fr-err-p0-c-fiscal-adapter-guiamei-alertas.md) — fiscal.  
3. [STORY-FR-ERR-P0-D](../stories/story-fr-err-p0-d-migracao-p0-transacoes-catalogos-settings.md) — migração P0 + actualização de estado **Feito** neste inventário.

---

## 6. Validação técnica pós-QA (correcções 2026-04-07)

Resposta aos pontos da revisão QA na story **FR-ERR-P0-A** (gate PASS com ressalvas):

| Ponto QA | Acção |
|----------|--------|
| Nomenclatura `PlugnotasIntegrationErrorAlert` vs ficheiro | `ux-spec-mei-nfse-workspace-2026-04-01.md` §7 — parágrafo A04 actualizado: indica explicitamente `FiscalIntegrationErrorAlert.tsx` e lista exports relevantes. |
| Paridade “grep real” / `toast.error` exaustivo | A Fase A **não** exige inventário de **todos** os `toast.error` do monorepo; a matriz cobre P0 PRD e a cadeia `buildApiErrorMessage` → UI. A story **FR-ERR-P0-B/D** pode acrescentar linhas `ERR-INV-###` se a migração encontrar *call sites* em falta. |
| DoD “inventário revisto por quem conhece código” | Secção **Revisão desenvolvimento** em [`po-copy-erros-utilizador-2026-04-07.md`](po-copy-erros-utilizador-2026-04-07.md) — confirmação de confronto com ficheiros-chave. |
| DoD PO copy v1.0 | Mantém-se **pendente** da checklist PO na mesma minuta (apenas produto assina *wording*). |

---

## 7. Estado migração FR-ERR-P0-D (2026-04-07)

Actualização após [STORY-FR-ERR-P0-D](../stories/story-fr-err-p0-d-migracao-p0-transacoes-catalogos-settings.md): *call sites* P0 alinhados a `mapUnknownErrorToUserFacing` / `UserFacingErrorBlock` / `FetchErrorBanner` com `error` + `surfaceId` e toasts via `userFacingToastSummary` onde aplicável. Os IDs **ERR-INV-001–007** (Guia MEI) constam como **Feito (P0-C)** para fecho literal do critério “100% P0” da matriz §1 em conjunto com a story fiscal.

| ID | Estado | Nota breve |
|----|--------|------------|
| ERR-INV-001 | Feito (P0-C) | `/guias-mei` NFS-e — story fiscal / Guia MEI |
| ERR-INV-002 | Feito (P0-C) | Lista NFSe Guia MEI |
| ERR-INV-003 | Feito (P0-C) | NF-e / NFC-e Guia MEI |
| ERR-INV-004 | Feito (P0-C) | Certificado / conectividade Guia MEI |
| ERR-INV-005 | Feito (P0-C) | Emitente / empresa Plugnotas |
| ERR-INV-006 | Feito (P0-C) | Catálogo embutido NFS-e |
| ERR-INV-007 | Feito (P0-C) | `MeiFiscalCapabilityCallout` |
| ERR-INV-008 | Feito | `MeiCatalogoClientes` — lista, toast e fluxo exclusão |
| ERR-INV-009 | Feito | `MeiCatalogoClienteModal` — `mapMeiCatalogApiErrorToUserFacing` |
| ERR-INV-010 | Feito | `MeiCatalogoServicosProdutos` |
| ERR-INV-011 | Feito | `MeiCatalogoProdutoModal` |
| ERR-INV-012 | Feito | `Transactions` — banner + `surfaceId` `transacoes.list` |
| ERR-INV-013 | Feito | `Transactions` — toasts exclusão / validação com resumo canónico |
| ERR-INV-014 | Feito | `Dashboard` — banner transacções |
| ERR-INV-015 | Feito | `transactionStore` — `error` como `unknown`; sem `getErrorMessage` na UI |
| ERR-INV-016 | Feito | Banners P0 migrados para prop `error` (âmbito D) |
| ERR-INV-019 | Feito | `Recorrencias` |
| ERR-INV-022 | Feito | `Settings` — perfil / sessão com mapper + `settings.profile` |
| ERR-INV-025–026 | N/A | Pipeline `apiClient` / `buildApiErrorMessage`; destino UI continua a ser mapeadores nos *call sites* |
| ERR-INV-028 | N/A (P0-C) | `FiscalIntegrationErrorAlert` — story fiscal |

---

*Documento gerado na Fase A; IDs `ERR-INV-###` estáveis para PRs e QA.*
