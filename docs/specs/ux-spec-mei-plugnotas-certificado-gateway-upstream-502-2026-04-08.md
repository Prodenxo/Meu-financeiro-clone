# Especificação de front-end e UX — **Erro de gateway (502/503/504)** no envio de certificado Plugnotas (Guia MEI)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md`](../prd/PRD-mei-plugnotas-certificado-gateway-upstream-502-2026-04-08.md) (**FR-UX-FISC-GW-01** a **FR-UX-FISC-GW-04**, **FR-MEI-CERT-GW-01/02**, **CR-GW-03**, alinhamento a **FR-GW-QA-01**)  
**Brief de apoio:** [`docs/brief/brief-mei-plugnotas-certificado-502-bad-gateway-2026-04-08.md`](../brief/brief-mei-plugnotas-certificado-502-bad-gateway-2026-04-08.md)

**Relação com specs e código de referência:**

- **Mensagens de erro (taxonomia e anatomia):** [`docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md) — categoria `indisponivel` e hierarquia título + descrição + detalhe; este fluxo mantém **fonte** fiscal (**CR-GW-03**) com copy de **indisponibilidade**, não de validação.  
- **Orquestração certificado + empresa:** [`docs/specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) — estados E4/E5; o erro de **fase 1** por gateway **não** deve imitar erro de **validação de negócio**.  
- **Padrões Guia MEI:** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md) — `admin-alert-*`, hierarquia DAS.  
- **NFS-e Nacional (mesmo painel):** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) — convive no mesmo ecrã; erros **gateway** **não** devem disparar hints de IM/prefeitura.  
- **Operação:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — após **NFR-DOC-MEI-01**, link de ajuda pode apontar para âncora de troubleshooting 502/503 (a definir na story).  
- **Implementação de referência:**  
  - `frontend/src/components/FiscalIntegrationErrorAlert.tsx` — `LongFiscalErrorMessage`, painéis de erro certificado/empresa, `meiFiscalUserCopyToUserFacing`.  
  - `frontend/src/lib/fiscalUserError.ts` — `mapMeiFiscalErrorToCopy`, limiares e heurísticas.  
  - `frontend/src/lib/meiFiscalUserCopyToUserFacing.ts` — `technicalDetail`, `embedRawAsTechnicalDetail`.  
  - `frontend/src/utils/guiaMeiConnectivityUserMessage.ts` — **não** reutilizar a mesma copy para 502 no **emissor** (semântica diferente — ver secção 6).

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou número do PRD.

---

## 1. Objetivo deste documento

Contrato de **experiência, microcopy, hierarquia visual, estados de erro, supressão de ruído técnico e acessibilidade** para:

1. Quando o `POST …/emissao-fiscal/certificado` falhar com **502, 503 ou 504** (ou corpo HTML de proxy), o utilizador ver **título e texto** de **indisponibilidade temporária do emissor fiscal**, **não** “validação ou rejeição no provedor” nem HTML bruto (**FR-UX-FISC-GW-01**).  
2. **Eliminar duplicação** do mesmo conteúdo longo (HTML) entre corpo principal e detalhe expandível (**FR-UX-FISC-GW-02**).  
3. **Rodapé / hints** que hoje falam em validação de JSON ou campos fiscais **não** aparecem neste subcaso (**FR-UX-FISC-GW-03**).  
4. Opcionalmente alinhar **link de ajuda** ou bloco visual com padrões de conectividade **sem** confundir “servidor do aplicativo” com “emissor fiscal indisponível” (**FR-UX-FISC-GW-04**).

Serve para critérios de aceite de story, *file list* e QA; **não** substitui normalização no BFF (**FR-MEI-CERT-GW-01**), que é a primeira linha de defesa.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Semântica correcta** | Gateway ≠ validação de certificado ≠ falha de rede **local** até ao BFF. Três causas, três famílias de copy (esta spec cobre **gateway no emissor**). |
| **Zero HTML na área de leitura** | Nenhum `<html>`, `<title>`, página de nginx visível ao utilizador final. |
| **Uma mensagem, uma hierarquia** | Título escaneável; descrição 2–3 frases; sem repetir o mesmo parágrafo em dois blocos. |
| **Honestidade sem culpa** | O emissor **não respondeu de forma utilizável**; não implicar que o .pfx está “errado” por defeito. |
| **Recuperação** | `recoverable: true`; CTA **Tentar novamente** (ou reenvio do mesmo passo) quando já existir no fluxo; não bloquear edição dos campos. |
| **Compatibilidade de componente** | Manter `source: provedor_fiscal` (ou equivalente no contrato actual) para **CR-GW-03**; mudar **só** título, descrição, rodapé condicional e regras de `technicalDetail`. |
| **A11y** | Manter `role="alert"` onde já existe; não anunciar duas vezes o mesmo texto longo (leitores de ecrã). |

---

## 3. Arquitetura de informação (IA)

### 3.1 Área afetada

**Workspace:** Guia MEI — painel **DAS** / **Certificado digital** (área onde o utilizador envia `.pfx` e dispara `cadastrarCertificadoEmissaoNf` ou fluxo orquestrado com fase 1 = certificado).

**Superfícies de UI:** qualquer bloco que hoje mostre erro de certificado via `FiscalIntegrationErrorAlert`, `UserFacingErrorBlock`, ou `LongFiscalErrorMessage` alimentados por `mapMeiFiscalErrorToCopy` + `meiFiscalUserCopyToUserFacing` para esta rota.

### 3.2 Hierarquia de conteúdo no estado **gateway** (GW)

| Ordem | Bloco | Comportamento |
|------|--------|----------------|
| **GW-L0** | **Título** (`h3` / cabeçalho do alerta) | Copy canónica **§4.1** — **não** usar o título de “Validação ou rejeição no provedor”. |
| **GW-L1** | **Descrição** | Copy canónica **§4.2** (igual ou equivalente à mensagem normalizada do BFF). |
| **GW-L2** | **Detalhe técnico** / `LongFiscalErrorMessage` | **Omitido** por defeito (**FR-UX-FISC-GW-02**). Se existir código estável `errors.fiscalErrorCode` (**FR-MEI-CERT-GW-02**), pode mostrar **uma linha** `text-xs` opcional: ex. *“Código: plugnotas_gateway_502”* **apenas** se PO/QA validar utilidade para suporte — caso contrário, omitir. |
| **GW-L3** | **Rodapé de fonte** | Copy específica **§4.3** — **proibido** o texto genérico sobre validação de JSON/campos fiscais como causa. |
| **GW-L4** | **CTAs** | Manter padrão do alerta fiscal: primário **Tentar novamente** / **Reenviar** conforme implementação actual; secundário **Documentação** se já existir *href* para `operacao-mei-nfse` ou guia estático. |

### 3.3 O que **não** fazer

- Não mostrar o **raw** `message` antiga com HTML no `technicalDetail`.  
- Não classificar este erro como subtipo que abre hints de **IBGE**, **IM/prefeitura** ou **NFC-e** (outros ramos de `FiscalIntegrationErrorAlert`).  
- Não substituir o alerta pelo *toast* genérico sem contexto fiscal — o utilizador deve continuar a entender que o passo é **emissor fiscal**.

---

## 4. Microcopy canónica (PT-BR)

**Aprovação:** PO confirma na story uma única variante de **título** (A ou B). Descrição pode seguir o PRD §6.1 ou a versão ligeiramente mais curta abaixo.

### 4.1 Título (escolha única)

| ID | Texto | Notas |
|----|--------|--------|
| **GW-T-A** | Emissor fiscal temporariamente indisponível | Preferência alinhada a tom calmo e a `indisponivel` na spec global. |
| **GW-T-B** | Não foi possível contactar o emissor fiscal | Alternativa se PO quiser verbo de ação explícito. |

**Proibido** neste estado: *Validação ou rejeição no provedor* (ou equivalente que sugira rejeição de dados enviados).

### 4.2 Descrição (corpo principal)

**Texto canónico (alinhado ao PRD §6.1):**

> O emissor fiscal não está a responder neste momento (erro temporário no servidor). Tente de novo dentro de alguns minutos. Se o problema continuar, confirme no servidor a URL e a chave de API do emissor, ou contacte o suporte do emissor fiscal.

**Variante curta** (se UI apertada ou *mobile* — máx. 2 frases, mesma story):

> O serviço de emissão de notas está temporariamente indisponível. Tente de novo dentro de alguns minutos ou confirme a configuração do emissor no servidor.

**Regras de linguagem:** sem “JSON”, “HTTP”, “502”, “Bad Gateway”, “POST” na descrição visível por defeito.

### 4.3 Rodapé de fonte (substituição condicional)

Quando `isGatewayUpstreamCertificadoError === true` (nome lógico na implementação):

**Texto canónico sugerido:**

> Esta mensagem refere-se ao **serviço de emissão de notas** (emissor fiscal). Neste caso indica **indisponibilidade temporária**, não rejeição do seu certificado ou dos dados preenchidos.

**Proibido** neste estado: frases do tipo *“Quando a mensagem citar validação de JSON, campos fiscais…”* como **única** explicação — isso **confunde** com o problema real (**FR-UX-FISC-GW-03**).

Se for necessário manter **um** parágrafo genérico reutilizável para **outros** erros fiscais no mesmo componente, o componente deve ramificar: **bloco A** (gateway) vs **bloco B** (validação negócio).

### 4.4 CTAs

| CTA | Prioridade | Comportamento |
|-----|------------|----------------|
| **Tentar novamente** | Primária | Reexecuta o passo de envio do certificado (ou fase 1 da orquestração) **sem** obrigar a novo preenchimento se os dados já estão válidos. |
| **Ver guia de operação fiscal** (ou rótulo existente) | Secundária | `href` para `docs/operacao-mei-nfse.md` (ou env) com âncora de troubleshooting gateway após **NFR-DOC-MEI-01**. |

---

## 5. Comportamento de componentes

### 5.1 `mapMeiFiscalErrorToCopy` (ou equivalente)

- Entrada: `status` **502 / 503 / 504** **ou** `rawMessage` com heurística de HTML/gateway (alinhada ao backend).  
- Saída: objeto `MeiFiscalUserCopy` com **título** e **descrição** das secções **4.1** e **4.2**; `href` opcional para documentação.  
- **Prioridade:** se existir `errors.fiscalErrorCode` com prefixo `plugnotas_gateway_` (**FR-MEI-CERT-GW-02**), mapear **antes** de inspeccionar HTML.

### 5.2 `meiFiscalUserCopyToUserFacing` e `technicalDetail`

- Para classificação gateway: `technicalDetail` **null** (ou string vazia tratada como ausente).  
- `embedRawAsTechnicalDetail`: para este ramo, comportamento **false** lógico — não embutir `rawMessage` com HTML (**FR-UX-FISC-GW-02**).  
- Garantir que `LongFiscalErrorMessage` **não** é renderizado com o HTML antigo: ou não montar o filho, ou passar apenas texto já sanitizado igual à descrição (redundante — **evitar**).

### 5.3 `LongFiscalErrorMessage`

- **Estado gateway:** não usar para exibir conteúdo; a descrição em **§4.2** já é suficiente.  
- **Regressão:** para erros **400** com mensagem longa **JSON/texto fiscal**, o comportamento actual de expansão **mantém-se** (**CR-GW-02**).

---

## 6. Relação com conectividade local (**FR-UX-FISC-GW-04**)

| Cenário | Copy de referência | Uso no gateway Plugnotas |
|---------|-------------------|---------------------------|
| Falha **sem** resposta HTTP até ao **BFF** / app local | `GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE` | **Não** reutilizar — semântica: “servidor **deste aplicativo**”. |
| **502/503/504** com resposta JSON do BFF (erro propagado do emissor) | Esta spec **§4** | Indica problema no **emissor** ou infra à frente dele. |

**Recomendação:** não fundir os dois num único parágrafo. Opcional: link secundário *“Problemas de ligação no seu computador ou no servidor da app”* que aponta para `getGuiaMeiConnectivityHelpHref()`, **abaixo** da descrição principal, **só** se PO validar que não sobrecarrega; caso contrário, **omitir** na v1.

---

## 7. Estados e comparação (QA)

### 7.1 Matriz de estados visíveis (certificado)

| Estado | HTTP típico | Título visível | Rodapé | Detalhe longo |
|--------|-------------|----------------|--------|----------------|
| **VAL** | 400 / 422 JSON Plugnotas | Validação / rejeição no provedor (ou equivalente actual) | Bloco B — validação JSON/campos quando aplicável | Permitido texto do provedor (colapsável) |
| **GW** | 502 / 503 / 504 (ou HTML normalizado) | **§4.1** | **§4.3** | **Omitido** |
| **NET** | *fetch failed* / sem status | Mensagem de conectividade **local** (padrão existente) | Conforme spec conectividade | Curto |

### 7.2 Antes / depois (exemplo ilustrativo)

**Antes (indesejado):**

- Título: *Validação ou rejeição no provedor*  
- Corpo: *Certificado enviado… `<html>…502 Bad Gateway…</html>`*  
- Rodapé: *…validação de JSON…*

**Depois (alvo):**

- Título: *Emissor fiscal temporariamente indisponível*  
- Corpo: *O emissor fiscal não está a responder…* (§4.2)  
- Rodapé: *Esta mensagem… indisponibilidade temporária…* (§4.3)

---

## 8. Acessibilidade

- Um único `role="alert"` (ou região anunciada) por ocorrência; **não** duplicar o mesmo texto em elemento oculto + visível.  
- Se existir CTA “Ver detalhes”, no estado **GW** o botão **não** deve expandir HTML — preferir **ocultar** o botão ou desactivá-lo com `aria-disabled` e texto explicativo só em doc (evitar confusão).  
- Foco após erro: primeiro elemento focável útil = **Tentar novamente** (alinhado a **recoverable** na spec global).

---

## 9. Rastreabilidade PRD → UX

| ID PRD | Entrega UX (esta spec) |
|--------|-------------------------|
| **FR-UX-FISC-GW-01** | Secções **3.2**, **4.1**, **4.2**, **5.1** |
| **FR-UX-FISC-GW-02** | Secções **3.2**, **5.2**, **5.3**, **7.1** |
| **FR-UX-FISC-GW-03** | Secção **4.3**, matriz **7.1** |
| **FR-UX-FISC-GW-04** | Secção **6** |
| **FR-MEI-CERT-GW-01** | Coerência copy FE com mensagem BFF (§4.2); validação em QA |
| **FR-MEI-CERT-GW-02** | Secção **5.1**, **GW-L2** opcional |
| **CR-GW-03** | Secção **2** — manter fonte/categoria fiscal; ajustar copy |
| **FR-GW-QA-01** | Secção **7** — cenários de teste visual e automático |

---

## 10. Identificadores para QA e analytics (sugestão)

| Uso | Valor sugerido |
|-----|----------------|
| `data-testid` no alerta quando gateway | `mei-fiscal-cert-error-gateway-upstream` |
| Evento analítico *(opcional P2)* | `fiscal_error_shown` + `variant: gateway_upstream` (sem texto bruto completo) |

---

## 11. Checklist de aceite UX (revisão manual)

- [ ] Com resposta simulada 502 + HTML, **não** aparece substring `<html` na UI.  
- [ ] Título **não** contém “Validação” ou “rejeição” no sentido de dados inválidos.  
- [ ] Rodapé **não** cita “validação de JSON” como causa principal.  
- [ ] Não há dois blocos com o mesmo parágrafo longo.  
- [ ] Erro **400** Plugnotas (validação) **continua** com título/copy de validação e detalhe colapsável quando aplicável.  
- [ ] Tema claro/escuro: contraste do alerta coerente com `admin-alert-*` existente.

---

## 12. Change log

| Versão | Data | Autor | Notas |
|--------|------|--------|-------|
| 1.0 | 2026-04-08 | Uma | Versão inicial a partir do PRD **gateway upstream 502**. |

---

*Spec UX — Meu Financeiro / Guia MEI / certificado Plugnotas — erros de gateway.*
