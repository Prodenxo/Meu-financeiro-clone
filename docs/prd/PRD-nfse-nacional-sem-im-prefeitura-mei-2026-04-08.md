# PRD — **NFS-e Nacional** no cadastro Plugnotas (MEI: sem inscrição municipal / prefeitura no fluxo)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — Guia MEI / setup emissão fiscal (`POST`/`PATCH` empresa no Plugnotas, certificado A1)  
**Fonte canónica do pedido:** [`docs/brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`](../brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md)

**Relação com outros artefatos:**

- **`docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md`** — contrato adoptado no código (`nfse.nacional`, **US-MEI-NAT-02**); risco **NFR-N04** / **FR-NA02**.  
- **`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`** — política “apenas NFS-e”; blocos `nfe`/`nfce` inactivos.  
- **`docs/operacao-mei-nfse.md`** — operação, variáveis, âncoras NFS-e Nacional e erros típicos.  
- **`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`** — documentos activos no cadastro; este PRD **não** substitui esse escopo, mas **alinha** o modo **NFS-e Nacional** quando só NFS-e (ou NFS-e + nacional) é o caminho desejado.  
- **`docs/prd/PRD-meu-financeiro-produto-brownfield-2026-03-26.md`** — contexto de produto.  
- **`frontend/src/utils/nfEmissionCompany.ts`**, **`frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`** — payload e dicas de erro.  
- **Não substitui** orientação legal/tributária: o produto orquestra dados e chamadas; habilitação real no ambiente nacional/municipal depende de regras externas e da conta Plugnotas.

---

## 1. Resumo executivo

O utilizador MEI deve conseguir concluir **certificado + cadastro de empresa** no fluxo fiscal com **NFS-e Nacional** como modo **principal e explícito**, **sem** ser obrigado a informar **inscrição municipal** nem seleccionar **prefeitura** na aplicação — desde que a **conta e o contrato Plugnotas** aceitem o payload **nacional** acordado.

Quando o provedor devolver validações que exijam campos típicos de **NFS-e municipal** (ex.: `inscricaoMunicipal`, `nfse.config.prefeitura` no `POST /empresa`), o produto deve **tratar o erro de forma acionável** (copy, próximos passos, ligação à documentação interna e, se aplicável, ao suporte Plugnotas), e a equipa deve **fechar evidência** (sandbox/produção redigida, doc oficial ou suporte) para ajustar payload ou política de conta, fechando o gap **NFR-N04** quando possível.

---

## 2. Visão de produto (experiência)

- O utilizador reconhece no site que o modo configurado é **NFS-e Nacional**, em linha com o toggle do **painel Plugnotas** (*“Ativar emissão de NFS-e Nacional”*).  
- Formulários e textos **não** sugerem que IM e prefeitura são requisitos **genéricos** do MEI neste fluxo.  
- Em caso de falha por exigência municipal na API, a mensagem **explica** a discrepância em linguagem simples e indica **ações concretas** (ver painel, chaves/ambiente, suporte), reutilizando ou estendendo `nfseNacionalPlugnotasErrorHints` conforme necessário.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Expectativa** | Utilizador associa “Nacional” a **menos** fricção municipal; erro 400 com IM/prefeitura **frustra**. | Fluxo e copy alinhados ao modo nacional; erros **guiados**. |
| **Paridade painel ↔ API** | Painel pode mostrar nacional activo enquanto o `POST /empresa` ainda exige campos municipais. | Investigación controlada + PRD/story para ajuste de payload ou política de conta. |
| **Contrato API** | Documentação pública citável do Plugnotas pode ser **incompleta** para `nfse.nacional` (**FR-NA02**). | Registrar evidência no ADR; não inventar chaves sem prova. |
| **Suporte** | Tickets genéricos “cadastro falhou”. | Mensagens mapeadas + `operacao-mei-nfse.md` actualizado. |

---

## 4. Personas e cenários

| Persona | Cenário de validação |
|---------|----------------------|
| **MEI — só serviços, modo nacional** | Completa dados mínimos **sem** IM/prefeitura; `POST /empresa` **aceite** com payload nacional acordado. |
| **MEI — mesmo fluxo, conta sem habilitação nacional** | Recebe bloqueio **claro** (não culpa silenciosa do formulário); próximos passos documentados. |
| **Utilizador que já activou nacional no painel** | Estado após cadastro pelo site é **coerente** com expectativa quando verificado via painel ou `GET /empresa` (dentro do que a API expõe). |
| **Retry após 400 municipal** | Pode repetir tentativa de empresa conforme fluxo actual (ex.: sem reenviar certificado quando aplicável), com mensagem **melhorada**. |

**Stakeholders:** PO (decisões §6), UX (copy e visibilidade do “modo nacional”), Architect (contrato Plugnotas, ADR), Backend/Frontend, QA, Suporte.

---

## 5. Escopo

### 5.1 Dentro do escopo (MVP / P0)

1. **Comunicação de produto:** o fluxo de cadastro MEI **declara** que a configuração visada é **NFS-e Nacional** (copy mínima: ecrã de configuração fiscal / separador NFS-e ou equivalente).  
2. **Formulário:** **não** tornar **obigatórios** `inscricaoMunicipal` nem seleção de **prefeitura** no percurso “só nacional” acordado com PO (**FR-NAT-UX-01**).  
3. **Payload:** manter ou ajustar `nfse` de forma **consistente** com o modo nacional (`nfse.nacional` ou evolução **formalmente** aprovada e registada no ADR); actualizar testes de contrato (`nfEmissionCompany.test.ts`, `plugnotas-empresa.test.js` ou equivalentes) quando o contrato mudar (**FR-NAT-API-01**).  
4. **Erros Plugnotas:** quando a mensagem indicar obrigatoriedade de IM ou `nfse.config.prefeitura`, apresentar **texto acionável** (painel, ambiente/token, suporte Plugnotas, doc interna) (**FR-NAT-ERR-01**).  
5. **Documentação operacional:** actualizar `docs/operacao-mei-nfse.md` com secção que distinga **NFS-e Nacional** vs **fluxo municipal** e referência a este PRD (**FR-NAT-DOC-01**).  
6. **Prova de integração:** registar, quando obtida, evidência **redigida** (request/response ou trecho oficial) no ADR nacional ou apêndice, para reduzir **NFR-N04** (**NFR-NAT-EV-01** — meta de processo, não gate bloqueante sem amostra).

### 5.2 Fora de escopo

- Mudança de provedor fiscal.  
- Garantia de **autorização** de emissão ou conformidade fiscal plena (dependências externas).  
- **Produto completo** de NFS-e municipal com catálogo de prefeituras (salvo decisão explícita futura de PO).  
- **Modo municipal opcional** como alternativa no mesmo PRD — se PO decidir, vira incremento ou PRD satélite (ver §6.3).

---

## 6. Decisões de produto

### 6.1 Modo por defeito (Guia MEI — escopo “só nacional”)

**Decisão:** Para o percurso abrangido por este PRD, o produto posiciona **NFS-e Nacional** como o **modo por defeito** comunicado ao utilizador, alinhado ao toggle do painel Plugnotas, **sem** colectar IM/prefeitura como campos obrigatórios do formulário.

**Critério de fecho:** revisão UX + QA sobre copy e ausência de validação local que **exija** IM/prefeitura nesse percurso.

### 6.2 Fonte da verdade quando painel ≠ API

**Decisão:** Em conflito entre o que o painel mostra e o que o `POST /empresa` aceita, a **autoridade** para ajuste de integração é: evidência Plugnotas (doc/suporte/sandbox) + revisão Architect; o produto **não** prometer estado remoto que a API não suporte.

**Critério de fecho:** entrada no ADR ou ticket ligado com referência **NFR-N04**.

### 6.3 Fallback “modo municipal” (opcional)

**Decisão em aberto (PO):** Se a conta **não** suportar nacional com o payload actual:

- **A)** Bloquear com explicação e contacto suporte; ou  
- **B)** Oferecer percurso municipal (IM + prefeitura) **explicitamente** como alternativa.

Este PRD **recomenda A** para o MVP descrito no brief; **B** exige escopo adicional e validação legal/UX.

### 6.4 P0 cadastro `nfse.config.prefeitura` — trilhos **C/D** (UI) vs este PRD

**Registo 2026-04-08:** no fecho do spike P0 ([`docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md`](../evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md)), o trilho principal foi **B** (derivação server-side opt-in de `nfse.config.prefeitura.codigoIbge`; ver [`story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md`](../stories/story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md)). A story de UI **C/D** ([`story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md`](../stories/story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md)) fica **fora de escopo** enquanto o PO **não** reabrir trilho **C** ou **D**.

**Coerência com §6.1 / FR-NAT-UX-01:** o formulário Guia MEI **continua** sem tornar **obrigatórios** IM nem campos de prefeitura na UI; o trilho **B** não contradiz esta decisão (enriquecimento no BFF a partir de `endereco.codigoCidade` já colectado). Se no futuro o PO activar **C** ou **D**, actualizar este parágrafo e o PRD PREF correspondente.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-NAT-UX-01** | O utilizador não é obrigado a preencher **inscrição municipal** nem **prefeitura** no fluxo de cadastro MEI alvo deste PRD. |
| **FR-NAT-UX-02** | O produto comunica visualmente que a configuração é **NFS-e Nacional** (local exacto e texto fino na story com UX). |
| **FR-NAT-API-01** | O JSON enviado a `POST /empresa` (e normalizações de `PATCH` associadas à política MEI) reflecte o modo **nacional** acordado no ADR, até revisão formal. |
| **FR-NAT-ERR-01** | Erros do provedor que exijam IM ou `nfse.config.prefeitura` são mapeados para mensagens **acionáveis** (sem jargão cru da API apenas). |
| **FR-NAT-DOC-01** | `docs/operacao-mei-nfse.md` documenta modo nacional vs municipal e aponta para este PRD. |

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-NAT-01** | Não introduzir chaves JSON **não validadas** no payload só para “tentar”; seguir **FR-NA02** do ADR spike. |
| **NFR-NAT-02** | Regressão: não reactivar `nfe`/`nfce` com `config` indevido (**ADR apenas NFS-e**). |
| **NFR-NAT-EV-01** | Obter e arquivar evidência de integração quando a API divergir do comportamento esperado (fecho **NFR-N04**). |
| **NFR-NAT-03** | Gates de qualidade do repo: `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |

---

## 9. Métricas de sucesso (proposta)

- Redução relativa de abandono no passo “registar empresa” após certificado (baseline definido por PO/analytics quando existir).  
- Redução de tickets classificados como “cadastro Plugnotas / IM / prefeitura” sem resolução autónoma.  
- **100%** dos novos erros 400 mapeados municipal → mensagem com **próximo passo** explícito (amostragem QA).

---

## 10. Critérios de aceite (release)

1. Cadastro **certificado + empresa** concluído **sem** IM/prefeitura no formulário, quando a conta Plugnotas aceitar o payload nacional acordado.  
2. Testes de contrato do payload **actualizados** se o JSON mudar; verdes no CI.  
3. Utilizador que receber validação municipal vê mensagem **FR-NAT-ERR-01** (conteúdo aprovado em story).  
4. `operacao-mei-nfse.md` actualizado (**FR-NAT-DOC-01**).  
5. Rastreabilidade: story(ies) ligam este PRD aos ficheiros tocados (frontend, backend, docs).

---

## 11. Dependências e riscos

- **Dependência externa:** Plugnotas (conta, plano, habilitação nacional).  
- **Risco técnico:** `nfse.nacional` pode não ser suficiente em todas as contas — exige ciclo **architect + operação** (**NFR-N04**).  
- **Risco de copy:** prometer “sempre sem IM” sem ressalva de conta pode gerar litígio de expectativa — incluir **nota honesta** quando o erro municipal ocorrer.

---

## 12. Rastreabilidade brief → PRD

| Secção do brief | Onde no PRD |
|-----------------|-------------|
| Resumo executivo | §1 |
| Objectivos | §5.1, §7 |
| Decisões em aberto | §6.2, §6.3 |
| Critérios de aceite (proposta) | §10 |
| Riscos | §8, §11 |

---

## Change log

| Data | Autor | Nota |
| --- | --- | --- |
| 2026-04-08 | PM (Morgan) | PRD inicial derivado do brief `brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`. |
| 2026-04-08 | Engenharia | §6.4 — trilho P0 **B** vs story UI C/D cancelada; alinhamento FR-NAT-UX-01. |
