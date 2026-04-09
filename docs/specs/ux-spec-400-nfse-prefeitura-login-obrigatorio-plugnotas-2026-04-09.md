# Especificação de front-end e UX — **400** `nfse.config.prefeitura.login` obrigatório (Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-09  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../prd/PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md) (**FR-PLOGIN-01** a **FR-PLOGIN-06**, **NFR-PLOGIN-01**–**02**, **DP-PLOGIN-01**–**03**)

**Brief:** [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)

**Referência contrato (equipas):** [Documentação da API PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest)

**Relação com outras specs (não substituição):**

| Artefacto | Papel |
|-----------|--------|
| [`ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) (**PREFB**) | Trilho B, **PREF-L1**, variante **prefeitura-config**, causalidade com IBGE. **Esta spec** cobre o caso em que o emissor exige **`login`** (credenciais de portal municipal) — **trilho B sozinho não chega**. |
| [`ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | **BRIEF-OP-UX**, causalidade **POST → GET**, triagem operacional. |
| [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) | **SOL-L*** — não inverter ordem cadastro vs consulta. |
| [`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) | Trilhos **A–D**, **PREF-L1** quando a mensagem cita `prefeitura` genérica; **esta spec** aprofunda o subcaso **login/senha obrigatórios** na mensagem de validação. |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook — triagem **FR-PLOGIN-02**–**03**. |

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou ID do PRD/spec.

---

## 1. Objetivo deste documento

Traduzir o **PRD PLOGIN** em:

1. **Reconhecimento de sintoma** na UI e nas heurísticas de erro — distinguir este **400** dos erros **tabela IBGE** e **falta de `prefeitura` / trilho B** (**PRD secção 4**).  
2. **Guardrails de copy** e hierarquia de mensagens até **decisão PO** (**DP-PLOGIN-03**): **não** assumir formulário de credenciais no produto sem **DP-PLOGIN-01** aprovada.  
3. **Requisitos condicionais de UI** quando **DP-PLOGIN-01** ou **DP-PLOGIN-02** forem aprovadas (secções 6 e 7).  
4. **Critérios de QA UX**, acessibilidade e privacidade alinhados a **NFR-PLOGIN-01**–**02** e à **spec SOL** / **BRIEF-OP-UX**.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Três erros 400, três narrativas** | O utilizador **não** deve ler “cidade IBGE” quando a mensagem fala em **login da prefeitura**; heurísticas e *hints* devem mapear palavras-chave distintas (ver secção 5). |
| **Causa antes de sintoma** | Manter **POST falho** como contexto principal antes de qualquer **404** / “empresa não encontrada” — alinhar **BRIEF-OP-UX** e **SOL**. |
| **Credenciais são sensíveis** | **NFR-PLOGIN-01**–**02:** nunca sugerir colar senhas em chats públicos; campos futuros com máscara/política de foco conforme story + **@architect**. |
| **Decisão antes de UI rica** | **DP-PLOGIN-03:** até haver evidência **FR-PLOGIN-01** e decisão **DP-PLOGIN-0***, a UI **não** obriga novo passo de formulário longo — apenas copy de triagem e encaminhamento seguro. |
| **Uma voz por camada** | Alerta principal = mensagem BFF; camada de ajuda = `nfseNacionalPlugnotasErrorHints` / painéis existentes — evitar segundo `role="alert"` redundante com o mesmo texto. |

---

## 3. Personas e superfícies

| Persona | Superfície | Foco desta spec |
|---------|------------|------------------|
| **MEI** | Guia MEI, fluxo cadastro empresa no emissor, alertas fiscais | Entender que o **emissor** exige **acesso ao portal da prefeitura** (conceito), sem jargão `nfse.config`. |
| **Suporte** | Runbook, macros internas | Tabela de triagem PRD secção 4 + **FR-PLOGIN-06**. |
| **PO** | Decisão **DP-PLOGIN-01** / **02** | Desbloqueia secções 6 e 7 desta spec. |

---

## 4. Arquitectura de informação — rótulos **PLOGIN-UX**

| Nível | Significado |
|-------|-------------|
| **PLOGIN-UX-L0** | Cadastro empresa **2xx** — sem narrativa especial PLOGIN. |
| **PLOGIN-UX-L1** | **400** com mensagem que indica **`prefeitura.login`** (ou **senha**) **obrigatório** — o bloqueio é **credencial municipal** exigida pelo emissor, não “cidade errada na tabela IBGE”. |
| **PLOGIN-UX-L2** | **L1** + utilizador tenta consultar empresa e vê **404** ou equivalente — reforçar **SOL** / **BRIEF-OP-05**: consulta falha porque o **cadastro não concluiu**. |

**Distinção explícita (conteúdo, não implementação):**

| Se a mensagem sugere… | Narrativa correcta para o MEI |
|------------------------|-------------------------------|
| Tabela IBGE / `codigoIBGECidade` | Ver **ux-spec** IBGE tabela / **TIBGE** — **não** esta spec. |
| Falta `prefeitura` / config (sem “login”) | Trilho B / **PREFB** — **não** esta spec como primeira hipótese. |
| **`login`** / **senha** da prefeitura obrigatórios | **PLOGIN-UX-L1** — esta spec. |

---

## 5. Heurísticas e encadeamento de mensagens (front-end)

### 5.1 Detecção sugerida (para `nfseNacionalPlugnotasErrorHints` ou equivalente)

Considerar variante **`prefeitura-login-required`** quando a mensagem normalizada incluir combinação coerente com:

- “prefeitura” e “login” e (“obrigatório” ou “preenchimento”); **ou**
- caminho tipo `prefeitura.login` na mensagem exposta pelo BFF.

**Prioridade relativa:** se a mesma resposta também citar **tabela IBGE**, a regra de negócio deve escolher **uma** narrativa dominante conforme a string completa (preferir a **primeira** causa técnica explícita na mensagem — definir em story com exemplos reais).

### 5.2 Microcopy base — **PLOGIN-UX-L1** (até decisão PO — **DP-PLOGIN-03**)

Objetivo: **clareza** sem prometer campos que ainda não existem.

| Elemento | Especificação |
|----------|----------------|
| **Título ou linha principal** (se *hint* dedicado) | Tom neutro: o serviço de emissão **pediu dados de acesso ao sistema da prefeitura** para concluir o cadastro NFS-e neste município. |
| **Corpo** | Uma frase: isso **não** é o mesmo que “cidade não reconhecida” nem “falta só o código IBGE” quando esses fluxos já foram tratados. |
| **Próximo passo** | Encaminhamento **seguro**: documentação de operação do produto, suporte interno, ou **portal do emissor** — **sem** pedir para colar credenciais em canais públicos (**NFR-PLOGIN-02**). |
| **O que evitar** | “Erro no nosso sistema” sem qualificação; culpar o utilizador por CNPJ; tratar **404** como causa raiz. |

### 5.3 Compatibilidade **SOL** e **BRIEF-OP-05**

Qualquer texto novo que mencione **consulta** ou **empresa não encontrada** **deve** manter a ordem **cadastro (POST) → consulta (GET)** e reutilizar padrões da **spec SOL** onde aplicável.

---

## 6. Requisitos condicionais — **DP-PLOGIN-01** (credenciais no fluxo)

**Aplicação:** apenas após aprovação PO e stories dedicadas (**FR-PLOGIN-04**).

| Área | Requisito UX |
|------|----------------|
| **Descoberta** | Formulário ou passo adicional **claramente** rotulado como dados do **portal municipal** / prefeitura (não confundir com inscrição municipal na raiz — ver **ux-spec PREF payload**). |
| **Campos** | Rótulos em linguagem natural (“utilizador do portal”, “senha do portal” ou termos aprovados legalmente); **não** expor nomes de campos JSON (`prefeitura.login`) como título principal. |
| **Segurança percetível** | Indicação breve de que são dados sensíveis; ligação à política de privacidade se o produto já o faz para certificado. |
| **Estados** | Carregamento, erro de rede, **400** persistente — mensagens distintas; **não** limpar campos sem confirmação se o utilizador estiver a corrigir. |
| **A11y** | `autocomplete` adequado só se **@architect** / segurança aprovarem; associação explícita rótulo–campo; foco no primeiro erro. |

*(Detalhe de *wireframe* e tokens: story + **@dev**.)*

---

## 7. Requisitos condicionais — **DP-PLOGIN-02** (sem credenciais no produto)

**Aplicação:** apenas após aprovação PO (**FR-PLOGIN-05**).

| Área | Requisito UX |
|------|----------------|
| **Bloqueio cedo** | Se o produto **não** recolher credenciais, a experiência **não** deve deixar o utilizador em loop de retry genérico — mensagem **L1** explica limite do serviço e próximo passo (suporte, outro canal, ou documentação). |
| **Expectativa** | Transparência: nem todos os municípios ficam disponíveis sem credenciais no emissor. |
| **Tom** | Empático, sem culpar; alinhado a **FR-PREFB-ESC-01** / escalação PRD PREF payload. |

**Identificador estável BFF (bloqueio cedo, antes do emissor):** `errors.plugnotasCode` = `prefeitura_ibge_apenas_insuficiente_dp02` — mapeado em `mapMeiFiscalErrorToCopy` (título *Limite do serviço — prefeitura no NFS-e*). Ver ADR apenas-NFS-e complemento DP-PLOGIN-02 e `prefeituraIbgeOnlyBlock.js`.

---

## 8. Documentação e conteúdo não-UI (espelho **FR-PLOGIN-02**–**03**)

Checklist para QA de **`docs/operacao-mei-nfse.md`** (ou anexo):

| FR | Deve constar (conteúdo) |
|----|-------------------------|
| **PLOGIN-02** | Linha de triagem **distinta** para **400** `prefeitura.login` vs tabela IBGE vs trilho B. |
| **PLOGIN-03** | Link para [documentação PlugNotas](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest) sem credenciais de exemplo no repo. |

---

## 9. Acessibilidade e privacidade

- **NFR-PLOGIN-01:** conteúdo de ajuda **não** incentiva partilha de PII em redes; exemplos mascarados em docs.  
- **NFR-PLOGIN-02:** materiais de suporte **sem** login/senha reais.  
- Hierarquia de alertas: manter padrão existente (um alerta principal por vista quando possível).  
- Regiões com `aria-labelledby` / título visível para blocos de ajuda longos (**PLOGIN-UX-L1**).

---

## 10. Critérios de aceite (QA UX)

- [ ] **Triagem de sintoma:** *Strings* ou heurísticas novas **não** confundem **PLOGIN-UX-L1** com erro de **tabela IBGE** nem com “falta `prefeitura`” do trilho B (critérios alinhados ao PRD secção 4).  
- [ ] **Causalidade:** Conteúdo novo não viola **FR-BRIEF-OP-05** / **spec SOL** (cadastro antes da consulta na narrativa).  
- [ ] **DP-PLOGIN-03:** Nenhum formulário obrigatório de credenciais de prefeitura na UI **antes** de decisão PO documentada + evidência **FR-PLOGIN-01**.  
- [ ] **Se DP-PLOGIN-01:** Secção 6 satisfeita em story específica (campos, rótulos, segurança percetível).  
- [ ] **Se DP-PLOGIN-02:** Secção 7 satisfeita em story específica (bloqueio / mensagem de limite).  
- [ ] **Privacidade:** **NFR-PLOGIN-01**–**02** verificados em copy e docs gerados.  
- [ ] **Compatibilidade PREFB:** Variante **prefeitura-config** e testes em `nfseNacionalPlugnotasErrorHints` permanecem coerentes (**FR-PREFB-QA-01**) após alterações.

---

## 11. Fora do escopo (versão 1.0 desta spec)

- Implementação efectiva de campos de **login/senha** — depende de **DP-PLOGIN-01** e story.  
- Alteração do contrato Plugnotas junto do fornecedor — **trilho A** do PRD PREF payload.  
- Duplicar aqui a totalidade da **spec PREFB** ou **plugnotas-nfse-config-prefeitura-payload** — remeter aos documentos canónicos para **PREF-L1** genérico.

---

## 12. Referência — ficheiros a tocar (quando story o exigir)

| Ficheiro | Alteração potencial |
|----------|----------------------|
| `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` | Nova heurística / variante **PLOGIN-UX-L1**; testes em `nfseNacionalPlugnotasErrorHints.test.ts`. |
| `frontend/src/pages/GuidesMei.tsx` | Contexto de painéis de erro / ordem de mensagens — só com critério em story. |
| `frontend/src/components/FiscalIntegrationErrorAlert.tsx` (se aplicável) | Propagação de *hint* sem duplicar `role="alert"`. |
| `docs/operacao-mei-nfse.md` | Secção 8 desta spec. |

---

## 13. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-09 | Versão inicial derivada do **PRD-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09**; alinhamento a **PREFB**, **briefing BRIEF-OP**, **SOL**, **PREF payload**. |

---

*Spec UX — Meu Financeiro — credenciais municipais / login obrigatório; decisão de produto em **DP-PLOGIN-0***.*
