# Especificação de front-end e UX — **Tabela IBGE** (`codigoIBGECidade`), hint **FR-CID-UX-02** e encadeamento com **404** (`GET` empresa)

**Versão:** 1.0  
**Data:** 2026-04-09  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](../prd/PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) (**FR-TIBGE-UX-01**, **FR-TIBGE-QA-01**; alinhamento **FR-CID-UX-02**; coerência com **NFR-TIBGE-01…04**)

**Brief de apoio:** [`docs/brief/brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09.md`](../brief/brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09.md)

**Relação com outras specs e código:**

- **Normalização formato/tipo `codigoCidade` (PRD CID):** [`docs/specs/ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — **CID-L1**, campo no formulário, hint opcional §6.2. **Esta spec** cobre o caso em que o código **já está bem formatado** mas o emissor **rejeita** por **não existir na tabela** do provedor, incluindo mensagens que citam **`codigoIBGECidade`** no texto de erro.  
- **400 prefeitura → 404 GET:** [`docs/specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **SOL-L1…L3**; reutilizar **encadeamento causal** quando o **400** for por **IBGE tabela** (mesmo efeito no **GET**).  
- **Prefeitura / PREF-L1:** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — copy principal **não** substituída aqui; prioridade de variantes **§4.2** desta spec.  
- **Implementação de referência:**  
  - `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — `isPlugnotasEmpresaIbgeCidadeMessage`, `getPlugnotasEmpresaCadastroErrorUxVariant`, `MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT`.  
  - `frontend/src/components/FiscalIntegrationErrorAlert.tsx` — hint secundário **FR-CID-UX-02**.  
  - `frontend/src/pages/GuidesMei.tsx` — painéis de cadastro empresa, fluxo `POST` / `GET`.  
- **Operação:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — **FR-TIBGE-DOC-01** (distinção de erros; entrega documental paralela).

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou ID do PRD/spec.

---

## 1. Objetivo deste documento

Contrato de **experiência, gatilhos de mensagem, prioridade de variantes, microcopy e QA de conteúdo** para:

1. **FR-TIBGE-UX-01:** Garantir que o texto de erro do emissor que cite **`codigoIBGECidade`** (nome usado pelo Plugnotas na mensagem) e/ou **“cidade … não encontrada na tabela … IBGE”** **active** a mesma linha de ajuda **FR-CID-UX-02** (hint IBGE) já especificada na spec **CID** §6.2 — **sem** confundir com erro **prefeitura** (**PREF-L1**).  
2. **Clareza de campo:** O utilizador **não** precisa saber que o JSON usa `codigoCidade`; se a mensagem expuser `codigoIBGECidade`, o hint explica em linguagem humana (**município**, **7 dígitos**, **endereço do CNPJ**).  
3. **404:** Quando aplicável, **reutilizar** a narrativa **SOL** (cadastro não concluído → consulta pode não achar empresa) **sem** duplicar parágrafos na mesma vista — ver secção 5.  
4. **Testes de regressão:** Critérios explícitos para **FR-TIBGE-QA-01** (mensagem sintética com `codigoIBGECidade`).

Serve para *file list* de story, revisão de copy e QA; **não** substitui o **PRD** nem o runbook de escalação ao Plugnotas.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Um problema, um tipo de ajuda** | Erro de **tabela IBGE** → hint de **verificação de município/código**; erro de **prefeitura** → variant **prefeitura-config** (spec PREF); **não** mostrar os dois blocos como se fossem o mesmo problema. |
| **Prioridade explícita** | Na função de variantes de cadastro, **PREF-L1** mantém precedência sobre texto genérico; o **hint IBGE** é **ortogonal** (condição `isPlugnotasEmpresaIbgeCidadeMessage`) — ver secção 4.2. |
| **Nomes do emissor na mensagem** | Se o utilizador ler *“codigoIBGECidade”* no texto repassado, o hint **não** repete o identificador técnico no título; o corpo do hint já fala em **código IBGE** e **tabela de cidades** em linguagem natural. |
| **404 como consequência** | Não assustar com “erro 404”; alinhar a **SOL** — primeiro corrigir **envio** (400), depois esperar **consulta** coerente. |
| **Sem prometer milagre** | Não afirmar que o Meu Financeiro “corrigiu” o código; orientar **consulta IBGE** ou **dados do CNPJ**. |

---

## 3. Arquitetura de informação — gatilhos **TIBGE**

### 3.1 Definição **TIBGE-L1** (novo rótulo operacional para QA/dev)

**TIBGE-L1** é verdadeiro quando a mensagem normalizada (minúsculas, sem acentos — mesma função que `normalizeForMatch` em `nfseNacionalPlugnotasErrorHints.ts`) satisfaz **pelo menos uma** condição:

| # | Condição (após normalização) | Exemplo de origem |
|---|------------------------------|-------------------|
| A | Contém `codigoibgecidade` **ou** `fields.endereco.codigoibgecidade` | Texto Plugnotas *«fields.endereco.codigoIBGECidade: …»* |
| B | Já coberto por **CID-L1** na spec CID: `endereco.codigocidade` / `fields.endereco.codigocidade` **e** indício de falha em **tabela** IBGE | Mensagens legadas |
| C | Contém **ibge** + **tabela** + (**cidades** ou **cidade** ou **municipio**) | *«…não encontrada na tabela de cidades do IBGE»* |
| D | **ibge** + (**codigo ibge** ou **codigocidade**) + contexto de validação | Frases equivalentes do BFF |

**Exclusões (não TIBGE-L1 por si só):**

- Mensagem **apenas** `nfse.config.prefeitura` **sem** sinais da tabela acima → tratar como **PREF-L1** (spec PREF), **não** activar hint IBGE por esta spec.  
- Mensagem **apenas** “inscrição municipal” sem IBGE/tabela/código cidade → **municipal-generic** ou fluxo NAT, conforme funções existentes.

### 3.2 Matriz de prioridade (UI de cadastro empresa)

| Ordem | Regra | Resultado na UI |
|-------|--------|-------------------|
| 1 | `isPlugnotasNfseConfigPrefeituraRequirementMessage` | Variante **prefeitura-config** + copy PREF §5.1 (spec PREF). **Se** também TIBGE-L1 (raro), PO decide: nesta v1, **mostrar primeiro** bloco PREF; hint IBGE **só** se copy PREF não cobrir o caso (teste de conteúdo). |
| 2 | `isPlugnotasEmpresaIbgeCidadeMessage` **actualizado** para incluir critérios **§3.1 (A)** | Mostrar **`MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT`** (FR-CID-UX-02) abaixo do parágrafo principal do alerta fiscal. |
| 3 | `isPlugnotasEmpresaMunicipalRequirementMessage` sem PREF-L1 nem TIBGE-L1 | Variante **municipal-generic** (comportamento actual). |
| 4 | Nenhuma das anteriores | **generic**. |

**Nota para @dev:** Implementação mínima do PRD: alargar `isPlugnotasEmpresaIbgeCidadeMessage` para captar **`codigoibgecidade`** (secção 3.1 A) e adicionar teste com a *string* exacta do brief/PRD.

---

## 4. Microcopy e componentes

### 4.1 Hint secundário (**FR-CID-UX-02**, inalterado no teor)

Manter a constante existente (spec CID §6.2):

- *“Se o erro citar código IBGE ou tabela de cidades, confira se o município e o código de 7 dígitos batem com o endereço do CNPJ ou com a consulta oficial do IBGE.”*

**Opcional (PO):** Se o utilizador confundir **nome do campo na mensagem** com outro documento, uma variante **mais curta** (substituição global, não acumular duas linhas):

- *“Confira se o código de 7 dígitos do município (IBGE) corresponde à cidade e UF do endereço.”*

### 4.2 `FiscalIntegrationErrorAlert` e painéis em `GuidesMei`

| Elemento | Especificação |
|----------|----------------|
| **Ordem visual** | Mensagem principal (emissor) → **hint IBGE** (se TIBGE-L1) → rodapé “informação do serviço de emissão”. |
| **Estilo do hint** | `text-sm`, cor secundária do tema (igual spec CID §6.2). |
| **A11y** | Se o hint for adicionado dinamicamente, associar ao alerta com estrutura que o leitor de ecrã anuncie: erro → ajuda → rodapé (sem dois `role="alert"` com texto duplicado). |

### 4.3 Campo “Código IBGE cidade” (formulário)

**Sem mudança obrigatória de layout** nesta entrega. **Recomendação:** manter o *hint* fixo sob o campo da spec CID §4.1 (*“Use o código de 7 dígitos…”*) — reforça prevenção **antes** do 400.

---

## 5. Encadeamento **400** (tabela IBGE) → **404** (`GET` empresa)

**Objetivo:** O utilizador **não** conclui que o **404** “quebrou o CNPJ” isoladamente.

| Situação | Comportamento UX |
|----------|------------------|
| **POST** falhou com mensagem TIBGE-L1 **e** a UI mostra resultado de **GET** / consulta com “não encontrado” | Aplicar **ux-spec SOL** §4.1 / §4.2 — bloco *“Cadastro ainda não foi criado no emissor”* ou linha curta **se** já existir no Guia MEI para falha recente de `POST`. **Não** exigir segundo parágrafo específico “IBGE” além do hint **§4.1** no alerta do **POST**. |
| Só **404** sem painel de erro do **POST** visível | **SOL-L2** / **SOL-L3** conforme spec SOL §5. |

**Regra de ouro:** O **hint TIBGE** explica **o 400**; a narrativa **SOL** explica **o 404** — complementares, não redundantes na mesma frase.

---

## 6. Front-end — contrato técnico resumido (para story)

| Artefacto | Alteração esperada (alinhada a **FR-TIBGE-UX-01**) |
|-----------|-----------------------------------------------------|
| `isPlugnotasEmpresaIbgeCidadeMessage` | Incluir match para **`codigoibgecidade`** / `fields.endereco.codigoibgecidade` após `normalizeForMatch`. Manter exclusões QA (não confundir com `inscricaoMunicipal` — comentários existentes). |
| Testes | `nfseNacionalPlugnotasErrorHints.test.ts` + testes de componente que já cobrem **FR-CID-UX-02** (`FiscalIntegrationErrorAlert.test.tsx` / painel cadastro): **nova** entrada com substring **`codigoIBGECidade`** no texto simulado. |
| `getPlugnotasEmpresaCadastroErrorUxVariant` | **Sem** mudança de prioridade **PREF > municipal > generic** salvo decisão PO na secção 3.2. |

**NFR-TIBGE-02:** Não enviar campo duplicado `codigoIBGECidade` no payload — apenas mensagem de erro pode usar esse nome.

---

## 7. Rastreabilidade PRD → UX

| ID PRD | Entrega nesta spec |
|--------|---------------------|
| **FR-TIBGE-UX-01** | Secções **3** (TIBGE-L1), **4** (hint), **6** (contrato `isPlugnotasEmpresaIbgeCidadeMessage`). |
| **FR-TIBGE-QA-01** | Secção **8** (checklist). |
| **FR-CID-UX-02** | Secção **4.1** (reuso do hint CID). |
| **NFR-TIBGE-01** | Sem lista local de municípios na UI nesta entrega. |
| **NFR-TIBGE-04** | Gates CI inalterados na UX; conteúdo testável. |

---

## 8. Checklist de QA (conteúdo e regressão)

- [ ] Mensagem de teste com *«fields.endereco.codigoIBGECidade»* e *«tabela de cidades do IBGE»* **activa** o hint **§4.1**.  
- [ ] Mensagem **PREF-L1** pura (`nfse.config.prefeitura` obrigatório) **sem** sinais TIBGE **não** activa hint IBGE por **TIBGE-L1** (teste negativo).  
- [ ] Mensagem TIBGE-L1 **não** mostra variant **prefeitura-config** como substituto do hint IBGE (salvo caso híbrido explicitamente testado e decidido em **§3.2**).  
- [ ] Fluxo **POST** falha (IBGE) + **GET** 404: utilizador vê **hint** no 400 **e** contextualização **SOL** se a UI apresentar ambos (sem contradição).  
- [ ] Contraste e legibilidade do hint em tema claro/escuro.  
- [ ] Leitor de ecrã: ordem lógica mensagem → hint → rodapé.

---

## 9. Wireframe de baixa fidelidade (texto)

**Alerta fiscal com TIBGE-L1 + FR-CID-UX-02:**

```text
┌──────────────────────────────────────────────────────────────┐
│ Integração fiscal / emissor                                    │
│ Falha na validação… codigoIBGECidade… tabela de cidades IBGE…  │
│                                                                │
│ Se o erro citar código IBGE ou tabela de cidades, confira…    │
│ (hint FR-CID-UX-02)                                            │
│                                                                │
│ Esta informação foi enviada pelo serviço de emissão…          │
└──────────────────────────────────────────────────────────────┘
```

**Opcional abaixo (se GET 404 visível no mesmo fluxo — SOL):**

```text
Cadastro ainda não foi criado no emissor → ver spec SOL §4.1
```

---

## 10. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-09 | Versão inicial a partir do **PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09**. |

---

*Especificação UX — Meu Financeiro / Guia MEI / Plugnotas — tabela IBGE e hint cadastro empresa.*
