# Especificação de front-end e UX — PlugNotas empresa: **RPS inicial** (lote / numeração canónica)

**Versão:** 1.0  
**Data:** 2026-04-16  
**Autoria:** Uma (UX design expert / fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md`](../prd/PRD-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md) (**FR-RPS-***, **NFR-RPS-***)  
**Brief de apoio:** [`docs/brief/brief-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md`](../brief/brief-plugnotas-empresa-rps-lote-numero-serie-inicial-1-2026-04-16.md)

**Relação com specs e código de referência:**

- **Cadastro fiscal (Guia MEI):** `frontend/src/pages/GuidesMei.tsx` — fluxo certificado + `POST`/`PATCH` empresa; alertas via `FiscalIntegrationErrorAlert`.  
- **Payload cliente:** `frontend/src/utils/nfEmissionCompany.ts` — **não** inclui `rps` neste MVP de produto; a garantia de experiência consistente é **BFF** (PRD §6.2).  
- **Padrão global Guia MEI (quando aplicável):** [`docs/specs/ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md).

---

## 1. Objetivo deste documento

Definir o **contrato de experiência** para a entrega **RPS inicial canónico** no cadastro PlugNotas quando **não há novos controlos de formulário** obrigatórios (PRD §9, §5.2). Inclui:

1. **Superfície de UI:** confirmação de **zero** campos novos para lote/série/número RPS (**UX-RPS-SURFACE-01**).  
2. **Comportamento percebido:** o utilizador **não** precisa de aprender novos conceitos; o primeiro cadastro continua com os mesmos passos visuais (**UX-RPS-FLOW-01**).  
3. **Erros e feedback:** reutilizar o **stack fiscal existente** (`FiscalIntegrationErrorAlert` / variantes Plugnotas) sem obrigatoriedade de copy específica “RPS” na v1 (**UX-RPS-ERR-01**, **UX-RPS-ERR-02**).  
4. **Acessibilidade:** sem novos widgets; manter padrões já usados no painel de cadastro (**UX-RPS-A11Y-01**).  
5. **Evolução futura (opcional):** critérios para **reabrir** UX se o PO pedir transparência ao utilizador ou edição avançada (**§8**).

Serve para **critérios de aceite de UX**, revisão de QA visual e alinhamento com **@sm**; **não** substitui contrato técnico nem story de backend.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Opacidade benéfica** | Parâmetros técnicos de numeração inicial (**`rps`**) são **decisão de plataforma**; o MEI não precisa configurar lote/série no primeiro uso (**alinha PRD §2**). |
| **Sem sobrecarga** | Não acrescentar campos “RPS”, “lote” ou “série” ao formulário nesta versão (**PRD §5.2**). |
| **Erro honesto** | Se o emissor falhar com mensagem opaca ou técnica, o utilizador vê o **mesmo tipo de alerta fiscal** já usado hoje, com texto útil quando mapeado; **não** inventar explicação fiscal além do PRD. |
| **Consistência com PATCH** | Quem **atualiza** cadastro não vê mudança de UI porque **não** há alteração de `rps` no cliente nem mensagem nova (**FR-RPS-PATCH-01**). |

---

## 3. Arquitetura de informação (IA)

### 3.1 Área afectada

**Nenhuma nova secção** (CAD-Lx), **nenhum** novo *fieldset*, **nenhuma** nova linha obrigatória no bloco *Dados mínimos* / certificado.

| Nível | Decisão |
|-------|---------|
| **Formulário de empresa** | Mantém hierarquia e ordem actuais em `GuidesMei.tsx`. |
| **Payload** | O utilizador **não** escolhe `rps` na UI; valores aplicados no **servidor** ao criar empresa (**NFR-RPS-SINGLE-01**). |

### 3.2 Ordem de leitura

**Inalterada** em relação ao estado pré-entrega.

---

## 4. Superfície de UI e controlos

| ID | Requisito |
|----|-----------|
| **UX-RPS-SURFACE-01** | **Não** introduzir inputs, *checkboxes*, *selects* nem toggles para `lote`, `numeracao`, `numero` ou `serie` no cadastro Guia MEI nesta versão. |
| **UX-RPS-SURFACE-02** | **Não** introduzir texto de ajuda visível (*hint* sob campo, *tooltip* ou parágrafo) dedicado a RPS/lote/série no MVP — coerente com PRD §9 (“nenhuma copy de UI obrigatória”). |

**Excepção documental:** se **@dev** adicionar `rps` também no `buildNfEmissionEmpresaPayload` **apenas** para paridade com DevTools, isso é **transparente** ao utilizador (sem label novo).

---

## 5. Fluxos e comportamento percebido

| ID | Cenário | Comportamento esperado na UI |
|----|---------|------------------------------|
| **UX-RPS-FLOW-01** | Primeiro **envio** de cadastro de empresa (criação no Plugnotas) | O utilizador percorre o **mesmo** fluxo actual (certificado → dados → enviar). **Não** aparece passo extra. |
| **UX-RPS-FLOW-02** | **Atualizar cadastro** sem novo certificado (`PATCH`) | **Indistinguível** do comportamento anterior quanto a RPS: sem campos novos, sem mensagens novas sobre numeração. |
| **UX-RPS-FLOW-03** | Utilizador abre **DevTools** e inspecciona o corpo do `POST` | Pode ou não ver `rps` no JSON **se** o front for alinhado ao backend; isto **não** é requisito de produto (PRD §6.2). |

---

## 6. Estados de erro e mensagens

### 6.1 Falha no cadastro (HTTP 4xx do BFF / Plugnotas)

| ID | Requisito |
|----|-----------|
| **UX-RPS-ERR-01** | Manter o **mesmo componente** e hierarquia de alertas fiscais já usados no cadastro (ex.: `FiscalIntegrationErrorAlert` e variantes resolvidas por `getPlugnotasEmpresaCadastroErrorUxVariant` / helpers em `nfseNacionalPlugnotasErrorHints.ts`). **Não** é obrigatório criar variante **específica** “RPS” na v1. |
| **UX-RPS-ERR-02** | Se a mensagem bruta do emissor citar `rps`, `numeracao`, `lote` ou `serie`, o utilizador pode ver texto técnico **ou** mensagem genérica já mapeada — aceite para MVP. **Melhoria futura (P2):** detectar substrings e acrescentar linha de ajuda neutra do tipo *“Se o problema persistir, contacte o suporte com o horário da tentativa.”* **sem** prometer ajuste manual de série na app. |
| **UX-RPS-ERR-03** | **Não** mostrar toast de sucesso específico “RPS configurado”; o sucesso continua a ser o feedback **já existente** de cadastro aceite. |

### 6.2 Conteúdo fiscal / legal

**Não** adicionar *disclaimer* legal sobre numeração municipal na UI nesta versão (fora do escopo PRD §5.2). Qualquer necessidade futura passa por **novo PRD** e revisão UX.

---

## 7. Acessibilidade

| ID | Requisito |
|----|-----------|
| **UX-RPS-A11Y-01** | Sem novos controlos ⇒ **sem** novos requisitos de foco, `aria-*` ou ordem de tabulação específicos desta entrega. Regressões de a11y no ecrã de cadastro devem ser tratadas como bugs gerais, não como escopo RPS. |
| **UX-RPS-A11Y-02** | Se no futuro existir texto de ajuda sobre RPS, deve seguir contraste e estrutura de headings já definidos em [`ux-spec-meu-mei-ui-2026-03-30.md`](ux-spec-meu-mei-ui-2026-03-30.md). |

---

## 8. Design system e tokens

**Sem alterações** de tokens, tipografia ou componentes shadcn para esta entrega. Cores de alerta fiscal existentes aplicam-se a erros (**UX-RPS-ERR-01**).

---

## 9. Evolução futura (backlog UX — não MVP)

Reabrir especificação de UI se o PO aprovar **uma** das seguintes:

1. **Transparência:** secção colapsável *“Avançado — numeração inicial (emissor)”* só leitura com valores espelhados da API.  
2. **Suporte a múltiplas séries:** fluxo guiado com validação e risco explícito.  
3. **Erro dedicado:** variante de alerta quando `plugnotasCode` ou regex estável identificar conflito de `rps`.

Até lá, **UX-RPS-SURFACE-01** permanece vigente.

---

## 10. Critérios de aceite (UX / QA)

- [ ] **UX-RPS-SURFACE-01** — Nenhum campo novo de RPS no cadastro Guia MEI.  
- [ ] **UX-RPS-FLOW-01** — Fluxo de primeiro cadastro sem passos adicionais atribuíveis a RPS.  
- [ ] **UX-RPS-FLOW-02** — Fluxo de atualização sem mensagens novas sobre RPS/lote/série.  
- [ ] **UX-RPS-ERR-01** — Erros de cadastro usam o padrão de alerta fiscal existente (sem regressão de layout).  
- [ ] **UX-RPS-A11Y-01** — Sem novos problemas de a11y introduzidos por esta feature (baseline: ecrã de cadastro actual).

---

## 11. Rastreabilidade PRD ↔ UX

| PRD | Spec UX |
|-----|---------|
| §5.2 Fora de escopo — UI para editar lote/série | **UX-RPS-SURFACE-01**, **§9** |
| §6.2 Fonte de verdade backend | **§3**, **UX-RPS-FLOW-03** |
| §6.1 PATCH não altera `rps` | **UX-RPS-FLOW-02** |
| §9 Sem copy nova obrigatória | **UX-RPS-SURFACE-02** |
| NFR-RPS-OBS-01 (ops) | **UX-RPS-ERR-02** (melhoria opcional) |

---

*Especificação UX — Uma (AIOX). Deriva apenas do PRD referenciado; alterações de âmbito exigem nova versão.*
