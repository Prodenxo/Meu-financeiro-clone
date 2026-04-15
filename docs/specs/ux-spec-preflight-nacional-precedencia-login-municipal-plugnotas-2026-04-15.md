# Especificação de front-end e UX — precedência preflight NFS-e Nacional sobre login municipal (PlugNotas)

**Versão:** 1.0  
**Data:** 2026-04-15  
**Autoria:** Uma (UX / design system, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) (**FR-PFLNAT-01** a **FR-PFLNAT-04**, **NFR-PFLNAT-01**–**04**, **CR-PFLNAT-01**–**03**)

**Briefing de diagnóstico:** [`docs/brief/brief-diagnostico-preflight-nacional-antes-login-campo-grande-5002704-2026-04-15.md`](../brief/brief-diagnostico-preflight-nacional-antes-login-campo-grande-5002704-2026-04-15.md)

**Nota:** não usar o carácter "§" em *strings* de UI. Em documentação interna, usar "secção" ou ID do PRD/spec.

---

## 1. Objetivo deste documento

Traduzir o PRD **PFLNAT** em:

1. **Impacto na experiência do utilizador MEI** no fluxo Guia MEI / cadastro da empresa no emissor fiscal — sobretudo o que **deixa de acontecer** (falso bloqueio com narrativa de "login da prefeitura" quando o município tem NFS-e Nacional disponível).  
2. **Requisitos de superfície front-end** mínimos: o PRD prioriza **backend**; a UI deve **manter-se coerente** com `runtimeDecision` e códigos existentes, sem novo ecrã de credenciais municipais.  
3. **Guardrails de copy e cenários** para **QA e regressão** — quando `plugnotasCode = prefeitura_login_required_blocked` ainda é legítimo vs quando o utilizador deve **não** ver esse ramo após o fix.  
4. **Critérios de aceite UX** alinhados aos critérios de aceite do PRD (secção 11).

**Não substitui** especificações anteriores de PLOGIN / PREFB / SOL: reutiliza o mapeamento existente em `fiscalUserError.ts` e *hints* em `nfseNacionalPlugnotasErrorHints.ts`.

---

## 2. Resumo de impacto UX (nível PFLNAT-UX-0)

| Camada | Mudança esperada |
|--------|-------------------|
| **Backend / BFF** | Ordem da decisão de preflight: nacional antes de bloqueio por login municipal (fonte de verdade do PRD). |
| **UI — fluxo feliz** | Utilizador em município **híbrido** (ex.: IBGE 5002704) com nacional ativo **conclui** o passo de cadastro da empresa **sem** alerta `prefeitura_login_required_blocked` **apenas** por causa do sinal `requiresLogin` no preflight. |
| **UI — copy existente** | Textos para `prefeitura_login_required_blocked` **mantêm-se** para casos **válidos** após o fix (sem nacional + exige login, etc.). **Não** é obrigatório alterar *microcopy* se o comportamento de disparo for corrigido no BFF. |
| **Novos componentes** | **Fora de escopo** (PRD secção 4 e 7.2): sem formulário novo de credenciais municipais nesta entrega. |

---

## 3. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Verdade do estado** | A mensagem "login da prefeitura obrigatório" só deve aparecer quando o BFF **classificar** o cenário como tal **depois** da nova precedência (DP-PFLNAT-01 a DP-PFLNAT-03). |
| **Sem culpar o utilizador injustamente** | Em municípios com nacional disponível, **não** sugerir recolha de credenciais municipais como pré-requisito do cadastro **só** porque o metadado `requiresLogin` veio `true` no preflight. |
| **Paridade runtime → UI** | **FR-PFLNAT-03:** o front continua a ler `errors.runtimeDecision` (e `plugnotasCode`) como hoje; **resolveMeiFiscalScenario** em `fiscalUserError.ts` já prioriza `runtimeDecision.scenario` — não é necessário novo ramo de cenário para "nacional com login assinalado" se o backend devolver `success_nacional` e **não** HTTP 400 com PLOGIN. |
| **Uma voz por erro** | Manter padrão actual: título + descrição + *hints* contextuais (`nfseNacionalPlugnotasErrorHints`) sem segundo `role="alert"` conflituoso. |
| **Privacidade** | **NFR-PFLNAT-01:** UI e materiais de suporte **não** expõem credenciais; runbook não pede colagem de passwords em canais abertos. |

---

## 4. Personas e superfícies

| Persona | Superfície | Foco desta spec |
|---------|------------|-----------------|
| **MEI** | Guia MEI, fluxo de emissão fiscal / cadastro empresa | Deixa de ver bloqueio PLOGIN **indevido**; fluxo continua com passos já conhecidos após sucesso upstream. |
| **QA** | Testes em `fiscalUserError`, `nfseNacionalPlugnotasErrorHints`, componentes de alerta fiscal | Regressão: cenário **5002704** não deve mapear para `prefeitura_login_required_blocked` quando a API retorna sucesso / outro código. |
| **Suporte** | Macros, triagem | Ordem mental: se o utilizador **ainda** reportar PLOGIN em cidade com nacional, verificar ambiente, versão deployada e `runtimeDecision` nos logs redigidos — não assumir de imediato "falta credencial" para IBGEs híbridos. |

---

## 5. Mapeamento PRD → UX / front-end

### 5.1 **FR-PFLNAT-01** (precedência nacional no preflight)

| Aspeto | Especificação UX |
|--------|------------------|
| Comportamento percebido | Após correcção BFF, o pedido de cadastro **prossegue** para o emissor quando `padraoNacionalEnabled` é verdadeiro, **sem** 400 PLOGIN só por `requiresLogin`. |
| UI | Nenhum novo estado visual obrigatório: o utilizador vê **progresso normal** (loading → sucesso ou erro **real** downstream). |
| Anti-padrão | Evitar mensagens genéricas do tipo "a sua cidade exige login na prefeitura" **antes** de o BFF devolver erro; isso seria *client-side* e está **fora** deste PRD. |

### 5.2 **FR-PFLNAT-02** (sem nacional + login — comportamento mantido)

| Aspeto | Especificação UX |
|--------|------------------|
| Comportamento | Mantém-se o fluxo actual de bloqueio / fallback conforme `plugnotasCode` e `runtimeDecision`. |
| Copy | Reutilizar textos e variantes já definidas para `prefeitura_login_required_blocked` e `prefeitura_login_required_fallback_available` em `mapMeiFiscalErrorToCopy`. |

### 5.3 **FR-PFLNAT-03** (runtimeDecision estável)

| Aspeto | Especificação UX |
|--------|------------------|
| Campos | Continuar a expor `padraoNacionalEnabled`, `requiresLogin`, `requiresSenha`, `codigoIbge`, `upstreamCallSkipped` onde a app já os consome para diagnóstico ou *hints*. |
| Cenário `success_nacional` | Quando o cadastro **tem êxito**, o utilizador **não** precisa de ver cartão de erro; opcionalmente, telemetria interna pode registar `runtimeDecision` em modo *dev* apenas. |

### 5.4 **FR-PFLNAT-04** (teste IBGE 5002704)

| Aspeto | Especificação UX |
|--------|------------------|
| Prova UX | Teste automatizado ou e2e: fluxo que simula resposta BFF **sem** `prefeitura_login_required_blocked` para o par híbrido, **ou** teste de integração que assegura que a UI **não** aplica copy PLOGIN quando `plugnotasCode` não é PLOGIN. |

---

## 6. Arquitectura de informação — rótulos **PFLNAT-UX**

**PFLNAT-UX-L0 (fluxo corrigido):** Utilizador em município com nacional disponível **não** entra no estado de erro **PLOGIN** por precedência errada; a narrativa principal é **cadastro a avançar** no Guia MEI.

**PFLNAT-UX-L1 (erro legítimo PLOGIN):** Mantém-se o estado já desenhado: título + descrição + próximo passo alinhados a `MeiFiscalScenario = 'prefeitura_login_required_blocked'` (ou fallback disponível).

**PFLNAT-UX-L2 (suporte):** Documentação interna distingue "bloqueio por policy antiga / bug" vs "bloqueio real por falta de nacional + login" — referência ao PRD e ao brief de diagnóstico.

---

## 7. Componentes e ficheiros tocados (verificação mínima)

| Área | Ficheiros / notas |
|------|-------------------|
| Cenário e copy | `frontend/src/lib/fiscalUserError.ts` — `resolveMeiFiscalScenario`, `mapMeiFiscalErrorToCopy`; **alteração só se** QA identificar texto desalinhado **após** o fix de backend (não obrigatório pelo PRD). |
| Hints contextuais | `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` e testes associados — garantir que **variante** `prefeitura-login-required` **não** dispara em respostas que já não levam `plugnotasCode` PLOGIN para o caso híbrido. |
| Alertas | `FiscalIntegrationErrorAlert` (e consumidores na Guia MEI) — regressão visual: menos ocorrências indevidas do cartão PLOGIN. |
| Tipos | `frontend/src/types/empresaCadastroRuntimeDecision.ts` — sem mudança de forma exigida pelo PRD; validar que `scenario` continua tipado. |

---

## 8. Acessibilidade e conteúdo

| Requisito | Nota |
|-----------|------|
| **WCAG** | Sem alteração de padrões: alertas existentes mantêm hierarquia e *roles* já definidos. |
| **Comprimento** | Se copy PLOGIN for tocada no futuro, respeitar `FISCAL_ERROR_LONG_THRESHOLD` e padrões da Story 6.3 (Guia MEI). |
| **Tom** | Neutro e orientado a acção; não culpar o utilizador por "não ter login da prefeitura" quando o sistema deveria ter seguido pelo nacional. |

---

## 9. Critérios de aceite UX (espelho PRD §11)

- [ ] Utilizador em cenário equivalente a **5002704** + nacional + `requiresLogin` **não** vê a experiência de erro **PLOGIN** apenas por esse preflight, após deploy do BFF.  
- [ ] Casos que **devem** continuar a mostrar PLOGIN (sem nacional, etc.) mantêm copy e *hints* coerentes.  
- [ ] Nenhum novo *string* obrigatório na UI para esta entrega — salvo decisão explícita de PO após testes com utilizadores.  
- [ ] Testes front (unit / integração) relevantes permanecem verdes; adicionar regressão se necessário para o re-export DP-PLOGIN / FR-NATEX referenciado nos testes existentes.  

---

## 10. Fora de escopo UX (confirmado pelo PRD)

- Novo ecrã ou *modal* para credenciais da prefeitura.  
- Alteração da rota `POST /api/mei-notas/setup/emissao-fiscal/empresa`.  
- Garantir mensagem de sucesso específica "NFS-e Nacional" ao MEI (opcional futuro; não bloqueia PFLNAT).  

---

## 11. Referências cruzadas

| Artefacto | Uso |
|-----------|-----|
| [`PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md`](../prd/PRD-preflight-nacional-precedencia-sobre-login-municipal-plugnotas-2026-04-15.md) | Requisitos canónicos |
| [`ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | Causalidade POST/GET e narrativa de erro |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook operacional (actualizar referência PFLNAT se a equipa incluir Story C do PRD) |

---

## 12. Change log

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-04-15 | 1.0 | Versão inicial a partir do PRD PFLNAT — impacto UX mínimo, foco em falsos positivos PLOGIN e regressão. |

---

— Uma, desenhando com empatia 💝
