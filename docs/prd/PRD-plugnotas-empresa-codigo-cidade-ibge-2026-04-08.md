# PRD — Cadastro empresa Plugnotas: **normalização `endereco.codigoCidade` (IBGE)** e robustez de tipo

**Versão:** 1.0  
**Data:** 2026-04-08  
**Tipo:** Brownfield — Guia MEI / `POST`/`PATCH` empresa no Plugnotas (certificado A1 + payload `endereco`)  
**Fonte canónica do pedido:** [`docs/brief/brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../brief/brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`** — cadastro emitente e payload empresa; este PRD **não** altera requisitos de documentos activos, apenas **garante** que `codigoCidade` chegue ao provedor em formato válido.  
- **`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`** — erros `nfse.config.prefeitura`; distinto deste PRD (campo **`endereco.codigoCidade`** vs bloco **`nfse`**).  
- **`docs/operacao-mei-nfse.md`** — rotas `…/emissao-fiscal/empresa`, troubleshooting 400 Plugnotas; deve referenciar este PRD após implementação (**FR-CID-DOC-01**).  
- **`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`** — política de blocos `nfe`/`nfce`/`nfse`; alterações aqui **não** mudam essa política.  
- **`frontend/src/utils/nfEmissionCompany.ts`**, **`frontend/src/pages/GuidesMei.tsx`**, **`backend/src/services/plugnotas/empresa.service.js`** — ficheiros âncora citados no brief.  
- **Não substitui** a tabela IBGE do Plugnotas nem validação fiscal: o produto **normaliza e transmite** dados; códigos incorrectos na fonte (ex.: CNPJ desactualizado) podem continuar a gerar 400 **após** a correcção técnica.

---

## 1. Resumo executivo

Utilizadores no fluxo **certificado + cadastro de empresa** no emissor fiscal (Plugnotas) podem encontrar:

1. **Erro JavaScript** **`form.codigoCidade.trim is not a function`** ao montar o payload no cliente — quando `codigoCidade` no estado React é **número** (ex.: JSON da Brasil API ou snapshot do emitente) mas o código assume **string**.  
2. **HTTP 400** do Plugnotas com validação do tipo **`fields.endereco.codigoCidade: Valor informado não encontrada na tabela de cidades do IBGE`** — por tipo/formato na serialização JSON, dígitos inválidos, ou **dados de negócio** incorrectos.  
3. **HTTP 404** em `GET …/empresa` após falha do `POST` — comportamento esperado até cadastro bem-sucedido.

Este PRD define **requisitos rastreáveis** para: **coerção de tipo e normalização canónica** do código IBGE do município **antes** de `POST`/`PATCH` no provedor; **defesa no backend** opcional mas recomendada; **testes** de regressão; e **documentação** operacional. **Não** garante sucesso se o código IBGE na origem for factualmente errado — nesse caso o produto mantém mensagens de origem **emissor fiscal** com eventual **hint** de verificação manual (**FR-CID-UX-02**).

---

## 2. Visão de produto (experiência)

- O utilizador **não** vê falhas técnicas do tipo **`.trim is not a function`** durante o envio dos dados mínimos da empresa.  
- O mesmo fluxo com **consulta CNPJ (Brasil API)** ou **hidratação a partir do certificado / Supabase** produz um payload onde **`endereco.codigoCidade`** é **sempre string** com **apenas dígitos** e comprimento alinhado ao **código IBGE de município (7 dígitos)** quando aplicável.  
- Se o Plugnotas **ainda** rejeitar após normalização, a UI continua a deixar claro que a **validação veio do emissor fiscal**, sem culpar o “Meu Financeiro” pela tabela IBGE do provedor; copy opcional sugere **confirmar código/cidade** (**FR-CID-UX-02**).

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Robustez de tipo** | Validação usa `String()` indirectamente; montagem do payload usa `.trim()` directo → crash com `number`. | Uma regra única de normalização + coerção em pontos de entrada (formulário, snapshot, API CNPJ). |
| **Contrato JSON** | `codigoCidade` numérico no JSON pode falhar lookup no validador Plugnotas. | Enviar **string** normalizada ao BFF e ao Plugnotas. |
| **Confiança** | 404 pós-falha parece “empresa inexistente” sem contexto. | Documentação + retry existente; **não** objectivo principal deste PRD mas alinhado a `operacao-mei-nfse.md`. |
| **Extensibilidade** | Futuros clientes (mobile, scripts) podem omitir normalização. | Camada backend **idempotente** antes de `POST`/`PATCH` (**FR-CID-BE-01**). |

---

## 4. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **MEI — primeiro cadastro** | Preenche dados manualmente ou via CNPJ; submete certificado + empresa **sem excepção JS** mesmo que `codigo_municipio` venha como número na API. |
| **MEI — retorno ao fluxo** | Estado hidratado de `nfseEmitente` com `codigoCidade` deserializado como número → **mesmo comportamento estável**. |
| **Operação / suporte** | Reproduz 400 IBGE após release: distingue **formato corrigido** vs **código errado na fonte** (runbook). |
| **Engenharia** | Testes unitários cobrem número vs string; backend aplica a mesma regra que o frontend. |

**Stakeholders:** PO (decisão pad 6→7 dígitos — §6), UX (hint opcional §7), Architect (local do helper partilhado), Backend, Frontend, QA.

---

## 5. Escopo

### 5.1 Dentro do escopo

1. **Frontend — P0:** `buildNfEmissionEmpresaPayload` (e outros `.trim()` em campos de endereço do mesmo fluxo se partilharem o mesmo risco) **não** assumem string sem coerção; uso de normalizador ou `String(…).trim()` consistente (**FR-CID-FE-01**).  
2. **Frontend — P0:** `emitenteSnapshotToForm` (e merges relacionados) **forçam** `codigoCidade` para string normalizada ao entrar no formulário (**FR-CID-FE-02**).  
3. **Frontend — P0:** `applyBrasilApiToEmitente` e fluxo que copia `codigo_municipio` para prestador NFSe **coergem** entrada para o normalizador (**FR-CID-FE-03**).  
4. **Frontend — P1:** Helper **`normalizeIbgeMunicipioCodigo`** (nome final na story): entrada `unknown`; saída string **só dígitos**; regra de **padding à esquerda para 7 dígitos** **apenas** quando `^\d{6}$` e **critério documentado** no código + PRD §6.2 (**FR-CID-PAY-01**).  
5. **Backend — P2:** Antes de `requestJson` para `POST`/`PATCH` `/empresa`, normalizar `payload.endereco.codigoCidade` com a **mesma semântica** que o cliente (**FR-CID-BE-01**).  
6. **Testes:** unitários frontend (payload com `number`, mock Brasil API, snapshot); teste backend ou contract mínimo conforme prática do repo (**FR-CID-QA-01**).  
7. **Documentação:** actualizar `docs/operacao-mei-nfse.md` com bullet sobre 400 “código cidade IBGE” + ligação a este PRD (**FR-CID-DOC-01**).

### 5.2 Fora do escopo

- Sincronizar ou substituir a **tabela de municípios** do Plugnotas.  
- Corrigir **automaticamente** códigos IBGE incorrectos na Receita/Brasil API sem input do utilizador.  
- Alterar **obrigatoriedade** de campos municipais no formulário (covered por outros PRDs).  
- Fluxos que **não** passam por `endereco.codigoCidade` no cadastro empresa (ex.: outros integradores).

---

## 6. Decisões de produto

### 6.1 Prioridade de entrega

1. **P0** — Eliminar crash `.trim` e garantir string no payload gerado no cliente.  
2. **P1** — Normalização IBGE (dígitos + regra de comprimento §6.2).  
3. **P2** — Espelho da normalização no backend.  
4. **P3** — Copy/hint quando 400 IBGE persistir após normalização (**opcional** na mesma story se esforço marginal for baixo).

### 6.2 Regra de padding 6 → 7 dígitos

**Decisão (PO):** Só aplicar padding quando o valor, após remover não-dígitos, tiver **exactamente 6 caracteres numéricos** **e** a story/regressão incluir **pelo menos um exemplo real** de município que exija esse tratamento; caso contrário, **não** padear automaticamente (evita código IBGE inventado). **Architect** confirma na implementação se a Brasil API ou outra fonte do projecto exige este passo.

### 6.3 Mensagens ao utilizador

**Decisão:** Manter o padrão actual de **`FiscalIntegrationErrorAlert`** (origem = serviço de emissão). **FR-CID-UX-02** é **melhoria opcional**: uma linha do tipo “Se o erro citar código IBGE, confira o município no cadastro CNPJ ou no IBGE.” — sujeita a revisão UX na story.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-CID-FE-01** | `buildNfEmissionEmpresaPayload` (e funções no mesmo fluxo que montem `endereco` para Plugnotas) **não** invocam `.trim()` em `codigoCidade` sem coerção prévia; o valor enviado em `endereco.codigoCidade` é **string** normalizada conforme **FR-CID-PAY-01**. |
| **FR-CID-FE-02** | `emitenteSnapshotToForm` (Guia MEI) normaliza `codigoCidade` ao mapear snapshot → `NfEmissionCompanyForm`, de modo que o estado do formulário **não** mantenha `number` para esse campo. |
| **FR-CID-FE-03** | Preenchimento a partir de **`fetchBrasilApiCnpj`** (emitente e prestador NFSe quando aplicável) passa `codigo_municipio` pelo mesmo normalizador antes de `setState` / merge. |
| **FR-CID-PAY-01** | O JSON enviado ao BFF em `POST …/empresa` (e `PATCH` quando o mesmo campo for enviado) contém `endereco.codigoCidade` como **string** composta **apenas** por dígitos; comprimento **7** quando o valor original já tinha 7 dígitos ou quando a regra §6.2 padear de 6 para 7. |
| **FR-CID-BE-01** | `cadastrarEmpresaPlugNotas` e `atualizarEmpresaPlugNotas` (ou helper partilhado invocado por ambos) aplicam a **mesma** normalização a `payload.endereco.codigoCidade` antes da chamada HTTP ao Plugnotas, **sem** alterar outros campos do payload excepto quando necessário para esta normalização. |
| **FR-CID-QA-01** | Existem testes automáticos que cobrem `codigoCidade` como **number** no formulário/snapshot e verificam payload serializado com **string** de dígitos; backend coberto se o repo já tiver padrão de teste para `empresa.service.js`. |
| **FR-CID-DOC-01** | `docs/operacao-mei-nfse.md` referencia este PRD e descreve em 1–3 bullets o erro de validação IBGE em `endereco.codigoCidade` e a distinção técnica vs dados incorrectos na fonte. |
| **FR-CID-UX-02** | *(Opcional)* Quando a mensagem do provedor indicar falha na tabela IBGE de `codigoCidade`, a UI pode mostrar hint curto de verificação manual (copy aprovada na story). |

---

## 8. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-CID-01** | Gates do repositório: `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |
| **NFR-CID-02** | Normalização **idempotente**: aplicar duas vezes não altera um valor já válido. |
| **NFR-CID-03** | **Não** logar em claro o CNPJ completo nem PII extra em novos logs de diagnóstico; reutilizar padrões de redacção existentes no backend Plugnotas. |
| **NFR-CID-04** | Regressão zero: política “apenas NFS-e” (**ADR** correspondente) e `documentosAtivos` **inalterados** por esta entrega. |

---

## 9. Métricas e sucesso

| Métrica | Alvo |
|---------|------|
| **Incidências** `trim is not a function` no fluxo cadastro empresa | **0** em ambientes monitorizados após release. |
| **400 Plugnotas** apenas por tipo JSON numérico em `codigoCidade` | **0** em testes de contrato / sandbox após release. |
| **Tempo de resolução suporte** para “IBGE cidade” | Redução qualitativa via runbook (sem KPI numérico obrigatório na v1). |

---

## 10. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Padding 6→7 gera código errado | Só aplicar com critério §6.2 + teste com caso real. |
| Backend e frontend divergem | Extrair função pura documentada; testes espelhados ou teste de integração mínimo. |
| Utilizador interpreta todo 400 como “culpa do app” | `FR-CID-UX-02` + doc operacional. |

---

## 11. Critérios de aceite (checklist de release)

- [ ] **FR-CID-FE-01** a **FR-CID-FE-03** implementados e revistos em code review.  
- [ ] **FR-CID-PAY-01** verificado com teste (número `3550308` → `"3550308"` no JSON).  
- [ ] **FR-CID-BE-01** implementado **ou** explicitamente deferido com registo no change log (não recomendado).  
- [ ] **FR-CID-QA-01** satisfeito.  
- [ ] **FR-CID-DOC-01** satisfeito.  
- [ ] **NFR-CID-01** a **NFR-CID-04** verificados no CI.  
- [ ] Story em `docs/stories/` (quando criada) com file list e checklist actualizados.

---

## 12. Change log

| Versão | Data | Autor / papel | Notas |
|--------|------|----------------|-------|
| 1.0 | 2026-04-08 | PM (derivado do brief) | Versão inicial a partir de **`brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08`**. |

---

*PRD brownfield — Meu Financeiro / integração Plugnotas — cadastro empresa.*
