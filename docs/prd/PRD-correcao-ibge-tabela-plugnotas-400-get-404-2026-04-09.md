# PRD — Validação **tabela IBGE** (`codigoIBGECidade` / `endereco.codigoCidade`) e **404** no `GET` empresa (Guia MEI / Plugnotas)

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — Guia MEI / `POST` e `GET` `…/mei-notas/setup/emissao-fiscal/empresa`  
**Fonte canónica do pedido:** [`docs/brief/brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09.md`](../brief/brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09.md)

**Relação com outros artefatos:**

- **`docs/prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`** — normalização de tipo e formato (`FR-CID-*`): **string**, só dígitos, espelho backend. Este PRD **não duplica** esses requisitos; assume que **FR-CID-PAY-01** / **FR-CID-BE-01** estão ou estarão satisfeitos. O problema aqui é o código **rejeitado pela tabela de municípios do emissor** (dados ou coerência), não o `.trim` nem o tipo JSON.  
- **`docs/prd/PRD-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`** — encadeamento **400 prefeitura → 404**; mesmo padrão causal **POST falha → GET sem registo**, mas **causa HTTP 400 distinta** (`nfse.config.prefeitura` vs `endereco` / IBGE).  
- **`docs/prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`** — distingue mensagens de **prefeitura** das de **cidade IBGE**.  
- **`docs/technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`** — contexto FR-CID.  
- **Código:** `frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, `backend/src/services/plugnotas/empresa.service.js`.

**Não substitui** documentação oficial IBGE nem garante aceitação em todas as contas Plugnotas; **não** obriga espelhar a tabela completa de municípios no backend sem decisão explícita de produto (§5.2).

---

## 1. Resumo executivo

Após normalização técnica do **`endereco.codigoCidade`**, o Plugnotas pode continuar a devolver **HTTP 400** com mensagem equivalente a *«cidade do código informado não encontrada na tabela de cidades do IBGE»*, citando internamente **`fields.endereco.codigoIBGECidade`** (nome na mensagem de erro do provedor). Na aplicação, o campo enviado mantém-se **`endereco.codigoCidade`** (equivalente semântico).

Em seguida, **`GET …/empresa?cpfCnpj=`** pode devolver **404** (*«Não localizamos qualquer Empresa…»*) — **efeito esperado** enquanto o **POST** não criar a empresa.

Este PRD define requisitos para: **(1)** não confundir este erro com **prefeitura** ou com falhas de **formato** já cobertas por **PRD CID**; **(2)** **UX** que oriente o utilizador a **verificar** município, UF e código de 7 dígitos; **(3)** **detecção de mensagens** que citam `codigoIBGECidade` ou “tabela de cidades” para acionar hints (**alinhado a FR-CID-UX-02**); **(4)** **observabilidade** mínima no backend; **(5)** **runbook** e critérios de escalação ao **Plugnotas** quando o código for oficial e a rejeição persistir.

---

## 2. Visão de produto (experiência)

1. **Clareza causal:** o utilizador e o suporte entendem que **404 no GET** após **POST** falhado por IBGE **não** é “API de consulta partida” isolada — primeiro é preciso **cadastro bem-sucedido** com dados aceites pelo emissor.  
2. **Mensagens accionáveis:** erros que citam **tabela IBGE** / **`codigoIBGECidade`** activam o hint **FR-CID-UX-02** (ou copy equivalente aprovada), **sem** misturar com a variante **prefeitura-config** do **`nfse.config.prefeitura`**.  
3. **Transparência de origem:** quando aplicável, a documentação operacional distingue erro de **dados** (código errado para o endereço) de **formato** (PRD CID) e de **configuração municipal** (PRD PREF).  
4. **Operação:** logs permitem correlacionar falhas 400 IBGE com ambiente e tentativa de cadastro **sem** expor PII desnecessária.

---

## 3. Problema e oportunidade

| Dimensão | Problema | Oportunidade |
|----------|----------|--------------|
| **Diagnóstico** | Dois HTTP (400 + 404) parecem bugs independentes; a mensagem pode citar **`codigoIBGECidade`** e gerar dúvida sobre o campo do payload. | Documentação + UX explicam **causa** e **campo canónico** (`codigoCidade`). |
| **Qualidade de dados** | Código IBGE **incoerente** com cidade/UF (edição manual, Brasil API desactualizada, homónimos). | Hint + runbook de verificação; opcionalmente validação **soft** no futuro (§6.2). |
| **Detecção de padrão** | Novo texto do emissor pode **não** coincidir com regex/hints existentes. | Actualizar **`nfseNacionalPlugnotasErrorHints`** e testes (**FR-TIBGE-UX-01**). |
| **Suporte** | Dificuldade em provar se o problema é **nosso** vs **tabela Plugnotas**. | Logs estruturados + escalação documentada (**FR-TIBGE-OBS-01**, **NFR-TIBGE-03**). |

---

## 4. Personas e cenários

| Persona | Cenário |
|---------|---------|
| **MEI** | Submete empresa com código que não bate com o município; vê 400; tenta consultar empresa → 404; precisa de **passos claros** para corrigir cidade/código. |
| **Dev / QA** | Reproduz com payload válido em formato; distingue teste de **tabela** de teste de **normalização** (PRD CID). |
| **Operação** | Prioriza verificar **corpo do POST** e mensagem completa antes de assumir bug de **GET**. |
| **PO / Architect** | Decide se **validação local** de município entra no roadmap (provavelmente **fase 2**). |

**Stakeholders:** PO, UX, Backend, Frontend, QA, Operação.

---

## 5. Escopo

### 5.1 Dentro do escopo

1. **UX / detecção de erro:** garantir que mensagens que citam **`codigoIBGECidade`**, **“tabela de cidades”** do IBGE (no sentido do emissor) ou equivalentes documentados no brief activam a cadeia de hints **CID-L1** / **FR-CID-UX-02** (**FR-TIBGE-UX-01**).  
2. **Testes automáticos** para novas substrings ou padrões (**FR-TIBGE-QA-01**).  
3. **Documentação:** actualizar ou acrescentar secção em **`docs/operacao-mei-nfse.md`** distinguindo: (a) formato/tipo — PRD CID; (b) tabela IBGE / código inexistente no emissor — este PRD; (c) prefeitura — PRD PREF / SOL (**FR-TIBGE-DOC-01**).  
4. **Observabilidade:** em respostas **400** repassadas ao cliente quando a mensagem indicar falha IBGE/cidade, o backend regista campos mínimos acordados (comprimento do código, trilho de ambiente; CNPJ truncado/hash conforme padrão do repo) (**FR-TIBGE-OBS-01**).  
5. **Contrato:** confirmar na implementação que **não** se duplica campo `codigoIBGECidade` no JSON enviado ao Plugnotas se o contrato oficial continuar a ser **`codigoCidade`** — apenas alinhar mensagens de erro (**NFR-TIBGE-02**).  
6. **Runbook de escalação:** quando o código for **confirmado** na fonte oficial IBGE e o 400 persistir, procedimento para **ticket Plugnotas** + registo em **`docs/evidence/`** ou ADR (**FR-TIBGE-OPS-01**).

### 5.2 Fora do escopo

- Substituir ou sincronizar **toda** a tabela de municípios do Plugnotas no nosso backend (**NFR-TIBGE-01**).  
- **Validação bloqueante** local UF+cidade↔IBGE **sem** dataset mantido e critérios de produto (fica como **opcional futuro** em §6.2).  
- Alterar o **provedor** fiscal ou o contrato legal de emissão.  
- Reimplementar requisitos **FR-CID-*** do PRD de normalização.

---

## 6. Decisões de produto

### 6.1 Prioridade de entrega

1. **P1** — **FR-TIBGE-UX-01** + **FR-TIBGE-QA-01** (baixo risco, alto valor percebido).  
2. **P1** — **FR-TIBGE-DOC-01** (suporte e desenvolvimento).  
3. **P2** — **FR-TIBGE-OBS-01** (observabilidade).  
4. **P2** — **FR-TIBGE-OPS-01** (texto de procedimento; pode ser documental na v1).  
5. **P3** — Validação **soft** ou lookup leve (só com **ADR** ou PRD addendum se houver dataset).

### 6.2 Validação de coerência município ↔ IBGE (opcional)

**Decisão v1.0:** Não exigir lista local de municípios. Se no futuro existir **API** ou **lista versionada** com custo de manutenção aceite, reabrir com PRD específico; até lá, copy e hints **dirigem** o utilizador à consulta oficial IBGE.

---

## 7. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| **FR-TIBGE-UX-01** | A função de classificação / hints em **`nfseNacionalPlugnotasErrorHints.ts`** (e componentes que a consomem, ex. **`FiscalIntegrationErrorAlert`**, painel de cadastro) reconhece mensagens de erro que citam **`codigoIBGECidade`** e/ou falha na **tabela de cidades** do IBGE no sentido descrito no brief, de modo consistente com **CID-L1** / **FR-CID-UX-02** (hint secundário de verificação manual). |
| **FR-TIBGE-QA-01** | Existem testes (unitários ou de componente já usados no repo) que cobrem pelo menos um exemplo de mensagem com **`codigoIBGECidade`** e verificam que o hint IBGE apropriado é exibido ou que o código de erro fiscal é classificado como esperado. |
| **FR-TIBGE-DOC-01** | **`docs/operacao-mei-nfse.md`** inclui distinção explícita entre erro de **formato/tipo** (PRD CID), erro de **tabela IBGE / código inexistente no emissor** (este PRD) e erro de **prefeitura** (PRD PREF), com ligação aos PRDs. |
| **FR-TIBGE-OBS-01** | Em falhas **400** do fluxo empresa cujo corpo/mensagem indique problema de **cidade IBGE** / tabela de municípios, o backend regista informação útil à operação (pelo menos comprimento do código normalizado e identificação do ambiente; CNPJ apenas conforme política de logging existente), sem novos logs verbosos de payload completo. |
| **FR-TIBGE-OPS-01** | Existe procedimento documentado (neste PRD §8 ou em `docs/operacao-mei-nfse.md`) para: confirmar código na fonte IBGE; se válido e 400 persistir, recolher dados para **ticket Plugnotas** e registo de evidência. |

---

## 8. Procedimento de escalação (runbook resumido)

1. Confirmar no DevTools o valor de **`endereco.codigoCidade`** enviado no **POST** (após normalização).  
2. Comparar com a consulta oficial IBGE para o **mesmo** município e UF do formulário.  
3. Se **incorreto** — corrigir dados (manual ou nova consulta CNPJ); repetir **POST**.  
4. Se **correcto** e **400** mantém-se — abrir ticket junto do **Plugnotas** (ambiente, conta, código, CNPJ conforme política do fornecedor) e registar em **`docs/evidence/`**.  
5. **GET 404** — esperado até **POST** 2xx; não tratar como defeito isolado da rota de leitura.

---

## 9. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| **NFR-TIBGE-01** | Não introduzir base completa de municípios IBGE no repositório sem decisão de produto e plano de atualização. |
| **NFR-TIBGE-02** | Manter um único campo canónico no payload **`endereco.codigoCidade`** para o Plugnotas, salvo alteração documentada do contrato da API pelo fornecedor. |
| **NFR-TIBGE-03** | Observabilidade **FR-TIBGE-OBS-01** respeita **NFR-CID-03** (PRD CID) e padrões de redacção de logs do backend Plugnotas. |
| **NFR-TIBGE-04** | Gates do repositório: `npm run lint`, `npm run typecheck`, `npm test` conforme **`AGENTS.md`**. |

---

## 10. Métricas e sucesso

| Métrica | Alvo |
|---------|------|
| **Tickets de suporte** confundindo IBGE tabela com erro **prefeitura** | Redução qualitativa após **FR-TIBGE-DOC-01** e hints. |
| **Regressões** de detecção de hint para mensagens `codigoIBGECidade` | **0** em CI para casos cobertos por **FR-TIBGE-QA-01**. |

*(KPIs quantitativos opcionais — não obrigatórios na v1.0.)*

---

## 11. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Regex demasiado larga activa hint IBGE em erros não relacionados | Testes negativos; revisão UX; alinhar a **CID-L1** existente. |
| Lista local de municípios desactualizada | Fora de escopo v1 (**NFR-TIBGE-01**); se reaberto, versionamento explícito. |
| Utilizador culpa o app pela tabela do emissor | Copy **FR-CID-UX-02** + doc operacional. |

---

## 12. Critérios de aceite (checklist de release)

- [ ] **FR-TIBGE-UX-01** implementado e revisto em code review.  
- [ ] **FR-TIBGE-QA-01** satisfeito no CI.  
- [ ] **FR-TIBGE-DOC-01** satisfeito.  
- [ ] **FR-TIBGE-OBS-01** implementado ou explicitamente deferido com entrada no change log (preferência: implementar na mesma onda).  
- [ ] **FR-TIBGE-OPS-01** reflectido em documentação ligada.  
- [ ] **NFR-TIBGE-01** a **NFR-TIBGE-04** verificados.  
- [ ] Story em **`docs/stories/`** (quando criada) com checklist e file list actualizados.

---

## 13. Change log

| Versão | Data | Autor / papel | Notas |
|--------|------|----------------|-------|
| 1.0 | 2026-04-09 | PM (derivado do brief) | Versão inicial a partir de **`brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09`**. |

---

*PRD brownfield — Meu Financeiro / integração Plugnotas — cadastro empresa e validação tabela IBGE do emissor.*
