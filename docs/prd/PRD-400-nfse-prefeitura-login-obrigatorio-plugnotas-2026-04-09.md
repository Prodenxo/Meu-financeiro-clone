# PRD — **400** cadastro empresa — `nfse.config.prefeitura.login` obrigatório (Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — Guia MEI / `POST` `/api/mei-notas/setup/emissao-fiscal/empresa` (BFF → Plugnotas)  
**Fonte do briefing:** [`docs/brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`](../brief/brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md)

**Referência externa (contrato):** [Documentação da API PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest)

---

## Relação com outros artefatos (não substituição)

| Artefacto | Papel |
|-----------|--------|
| [`PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](./PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) (**PRD PREFB**) | Trilho B — `prefeitura` com **`codigoIbge`** derivado do endereço quando a flag está activa e o IBGE tem 7 dígitos. **Este PRD** cobre o caso em que o emissor **ainda** exige **`login`** (e possivelmente **`senha`**) — **trilho B insuficiente** para concluir o cadastro. |
| [`PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](./PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | Checklist operacional e causalidade **POST → GET**; **FR-BRIEF-OP-06** já remete a “credenciais / contrato amplo” quando o 400 persiste após o checklist. |
| [`PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](./PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) | **Outro** código **400** — cidade não encontrada na **tabela IBGE** do emissor. **Distinto** da mensagem **`prefeitura.login` obrigatório**. |
| [`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](./PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) | Ecossistema `nfse.config.prefeitura`, trilhos A–D; credenciais explícitas quando o schema o exige. |
| [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) | Payload apenas NFS-e no cadastro MEI. |
| Código | `backend/src/services/plugnotas/nfsePrefeituraPayload.js` (`applyNfseConfigPrefeituraDeriveIbge`), `backend/src/services/plugnotas/empresa.service.js` (`cadastrarEmpresaPlugNotas`). |

---

## 1. Resumo executivo

O Plugnotas pode responder **HTTP 400** com validação do JSON de Empresa indicando que **`nfse.config.prefeitura.login`** é **obrigatório**. Este cenário é **diferente** de: **(a)** “cidade não está na tabela IBGE”; **(b)** ausência total de `nfse.config.prefeitura` quando o trilho B ainda não foi activado ou o IBGE é inválido (**PRD PREFB**).

Quando o sistema envia **`prefeitura`** apenas com **`codigoIbge`** (por exemplo após derivação) **e** o validador upstream exige **credenciais de portal municipal**, o utilizador permanece bloqueado até o produto definir **política** (recolher credenciais **ou** impedir o ramo que monta `prefeitura` incompleto **ou** escalar para operação / fornecedor).

Este PRD formaliza **requisitos de produto** para: **(1)** **triagem** e linguagem comum entre equipas; **(2)** **evidência** mínima antes de implementação (payload real no 400); **(3)** **decisão de política** explícita para o fluxo MEI; **(4)** **NFR** de segurança e privacidade em qualquer evolução que toque em credenciais.

---

## 2. Objetivos

1. Impedir que este **400** seja confundido com os outros **400** documentados (IBGE tabela, falta de `prefeitura` antes do trilho B).  
2. Exigir **diagnóstico baseado em evidência** (corpo enviado ao Plugnotas / mensagem completa) antes de **story** de código ou UX.  
3. Encadear com **FR-BRIEF-OP-06** e **FR-PREFB-ESC-01**: quando o checklist PREFB **não** resolve, o encaminhamento para **credenciais / contrato** está **explícito**.  
4. Fixar **critérios de aceite** para a **decisão de produto** (§8) e para **artefactos** (runbook, `.env.example` apenas se aplicável — sem inventar UI).

---

## 3. Contexto

O briefing consolidou hipóteses: **regra municipal** exigindo portal; **derivação IBGE** sem `login`/`senha`; **payload do cliente** incompleto; **regressão** na normalização. O código pode construir `nfse.config.prefeitura` **sem** credenciais (`nfsePrefeituraPayload.js`); o contrato Plugnotas (vide [Postman](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest)) trata frequentemente **`prefeitura.login`** / **`prefeitura.senha`** para NFS-e municipal.

**Gap de produto:** sem decisão explícita, equipas oscillam entre “é bug do nosso payload” e “o município exige credenciais” — este PRD separa **evidência** de **política**.

---

## 4. Distinção de sintomas (triagem)

| Mensagem / sintoma | PRD principal |
|---------------------|----------------|
| `codigoIBGECidade` / tabela IBGE / cidade não encontrada | [`PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](./PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) |
| Falta `prefeitura` no JSON; trilho B não activo ou IBGE ≠ 7 dígitos | [`PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](./PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) |
| **`prefeitura.login` (ou senha) obrigatório** | **Este PRD** |

---

## 5. Personas

| Persona | Necessidade |
|---------|-------------|
| **MEI** | Compreender por que o cadastro falha e qual o próximo passo **sem** jargão interno. |
| **Suporte / operação** | Distinguir este **400** na triagem e seguir escalação (**FR-PLOGIN-06**). |
| **PO / produto** | Decidir política §8 com input de **@architect** (segurança, armazenamento). |
| **Dev / QA** | Reproduzir com payload e logs **redigidos**, sem expor segredos. |

---

## 6. Escopo

### 6.1 Dentro do escopo

- Requisitos de **descoberta** e **documentação** (**FR-PLOGIN-01**–**03**).  
- **Matriz de decisão de produto** e requisitos condicionais (**FR-PLOGIN-04**–**05**).  
- **Escalação** e ligação aos PRDs existentes (**FR-PLOGIN-06**).  
- **NFR** de segurança e privacidade (**NFR-PLOGIN-01**–**02**).

### 6.2 Fora do escopo (até nova story aprovada)

- Implementação concreta de **campos de UI** para login/senha da prefeitura — depende de **DP-PLOGIN-01**.  
- Alteração unilateral do **contrato** junto do Plugnotas sem processo de conta/suporte (**trilho A** do PRD PREF payload).  
- Garantir que **todos** os municípios aceitam apenas `codigoIbge` — isso é **fora do controlo** da aplicação.

---

## 7. Decisões de produto (propostas — aprovação PO)

| ID | Decisão | Notas |
|----|---------|--------|
| **DP-PLOGIN-01** | **Política A — Credenciais quando obrigatórias:** se o PO aprovar recolha de `login`/`senha` no fluxo MEI, as stories subsequentes **devem** cumprir **NFR-PLOGIN-01**–**02** e revisão **@architect**. | Alternativa rejeitada implicitamente até aprovação explícita. |
| **DP-PLOGIN-02** | **Política B — Sem credenciais no produto:** não enviar `prefeitura` só com IBGE quando o emissor exige login; **bloquear antes** do upstream com copy acordada **ou** não activar derivação nesses perfis (definir em story técnica). | Evita 400 “surpresa” no fornecedor; pode limitar municípios suportados. |
| **DP-PLOGIN-03** | **Precedência de evidência:** nenhuma das políticas acima é **implementada** como feature até **FR-PLOGIN-01** (reprodução com payload analisado) estar satisfeita em **dev/staging** ou equivalente. | Reduz rework. |

---

## 8. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-PLOGIN-01** | A equipa **deve** registar, para pelo menos um caso real, se o JSON enviado ao Plugnotas contém `nfse.config.prefeitura` **sem** `login` (e se `senha` é citada na mensagem de erro). Evidência **sem** secrets em tickets públicos. |
| **FR-PLOGIN-02** | O `docs/operacao-mei-nfse.md` (ou secção acordada do runbook) **deve** mencionar este **400** (`prefeitura.login` obrigatório) como linha de triagem **distinta** da tabela IBGE e do “falta prefeitura” do trilho B. |
| **FR-PLOGIN-03** | O runbook **deve** apontar para a [documentação PlugNotas](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest) para **contrato** de `prefeitura`, sem copiar credenciais de exemplo para o repo. |
| **FR-PLOGIN-04** | Se **DP-PLOGIN-01** for aprovada, o backlog **deve** incluir épicos/stories que cubram recolha, trânsito e armazenamento de credenciais municipais conforme **NFR-PLOGIN-01**–**02** *(detalhe em stories; não neste PRD)*. |
| **FR-PLOGIN-05** | Se **DP-PLOGIN-02** for aprovada, o backlog **deve** incluir stories que impeçam cadastro com `prefeitura` incompleta relativamente às regras acordadas *(detalhe técnico em story + @architect)*. |
| **FR-PLOGIN-06** | Enquanto **DP-PLOGIN-01** e **DP-PLOGIN-02** não estiverem fechadas, o encaminhamento **deve** ser: triagem → evidência **FR-PLOGIN-01** → **@po** → decisão **DP-PLOGIN-0***; paralelamente, alinhar a [`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](./PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) para trilhos **C** (UI) se aplicável. |

---

## 9. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-PLOGIN-01** | Qualquer fluxo que persista ou exiba credenciais de prefeitura **deve** seguir política de **segredos** e **minimização de dados** do projeto (sem PII desnecessária em logs; alinhado a **NFR-BRIEF-OP-01** onde aplicável). |
| **NFR-PLOGIN-02** | Documentação e tickets **não** devem reproduzir **login/senha** reais; usar redacção ou ambientes de teste dedicados. |

---

## 10. Critérios de aceite (este PRD)

- [ ] **FR-PLOGIN-02** e **FR-PLOGIN-03** reflectidos no runbook ou documento operacional único referenciado em `docs/operacao-mei-nfse.md`.  
- [ ] Registo de evidência **FR-PLOGIN-01** (interno: acta, ticket privado ou nota de sprint — **sem** secrets).  
- [ ] **DP-PLOGIN-01** ou **DP-PLOGIN-02** (ou ambas em cenários segmentados) **documentadas** na acta PO / decisão registada com data.  
- [ ] Nenhum procedimento interno contradiz **NFR-PLOGIN-01**–**02**.

---

## 11. Métricas (qualitativas)

| Sinal | Interpretação |
|-------|----------------|
| Menos confusão entre “tabela IBGE” e “login obrigatório” em triagem | **FR-PLOGIN-02** efectivo. |
| Decisão **DP-PLOGIN-0*** registada antes de sprint de implementação pesada | **FR-PLOGIN-06** efectivo. |

---

## 12. Riscos

| Risco | Mitigação |
|-------|-----------|
| Implementar UI de credenciais sem decisão PO | **DP-PLOGIN-03** + **FR-PLOGIN-06**. |
| Expor segredos em logs ou docs | **NFR-PLOGIN-01**–**02**. |
| Sobreposição com PRD PREFB | Tabela “Relação com outros artefatos” + §4 deste PRD. |

---

## 13. Delegação

| Para | Entrega |
|------|---------|
| **@sm** | Stories de runbook / evidência **FR-PLOGIN-01**–**03**; após decisão PO, stories de produto alinhadas a **FR-PLOGIN-04** ou **05**. |
| **@architect** | Revisão de desenho se **DP-PLOGIN-01** envolver armazenamento ou segredos. |
| **@po** | Aprovar **DP-PLOGIN-01**, **DP-PLOGIN-02** (ou variante híbrida). |

---

## 14. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-09 | Versão inicial a partir do **brief** `brief-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md`; alinhamento a **PRD PREFB**, **briefing FR-BRIEF-OP**, **PRD PREF payload**. |

---

*PRD brownfield — Meu Financeiro — decisão de produto e triagem; implementação segue stories posteriores.*
