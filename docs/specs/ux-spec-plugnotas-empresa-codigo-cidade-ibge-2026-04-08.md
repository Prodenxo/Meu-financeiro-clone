# Especificação de front-end e UX — **`endereco.codigoCidade` (IBGE)** no cadastro empresa Plugnotas

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../prd/PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) (**FR-CID-FE-01…03**, **FR-CID-PAY-01**, **FR-CID-UX-02** opcional, **NFR-CID-01…04**)  
**Brief de apoio:** [`docs/brief/brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../brief/brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md)

**Relação com specs e código de referência:**

- **Erros municipais / `nfse.config.prefeitura`:** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — **distinto**: este documento trata **`endereco.codigoCidade`** e mensagens do tipo **“tabela de cidades do IBGE”**, não **prefeitura** em `nfse.config`.  
- **NFS-e Nacional:** [`docs/specs/ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md).  
- **Cadastro empresa / documentos ativos:** [`docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md`](ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md) — bloco de dados mínimos onde vive o campo IBGE.  
- **Orquestração certificado + empresa:** [`docs/specs/ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md).  
- **Mensagens de erro (contexto global):** [`docs/specs/ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md).  
- **Operação:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — **FR-CID-DOC-01** (doc; esta spec alinha copy para o mesmo tema).  
- **Implementação de referência:**  
  - `frontend/src/utils/nfEmissionCompany.ts` — validação e `buildNfEmissionEmpresaPayload`.  
  - `frontend/src/pages/GuidesMei.tsx` — campo *Código IBGE cidade* (emitente), prestador NFSe, CNPJ blur Brasil API, `emitenteSnapshotToForm`.  
  - `frontend/src/components/FiscalIntegrationErrorAlert.tsx` — origem “emissor fiscal”.  
  - (Opcional após dev) helper `normalizeIbgeMunicipioCodigo` — local na story.

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou ID do PRD.

---

## 1. Objetivo deste documento

Contrato de **experiência, microcopy, estados de campo, hierarquia de erros e acessibilidade** para:

1. **Invisibilizar falhas técnicas** (ex.: excepções JavaScript ao submeter) no fluxo certificado + empresa — cumprimento **principal** via engenharia (**FR-CID-FE-01…03**, **FR-CID-PAY-01**); a UX especifica **o que o utilizador deve ou não ver** e **como falar do IBGE** sem jargão de implementação.  
2. Manter **clareza de origem** quando o Plugnotas rejeitar o código do município: mensagem continua a ser do **serviço de emissão fiscal**, alinhada a `FiscalIntegrationErrorAlert`.  
3. **Opcional (FR-CID-UX-02):** quando a mensagem citar falha na **tabela IBGE** / **`codigoCidade`**, acrescentar **uma linha de ajuda** acionável (confirmar município / dados do CNPJ).  
4. **Paridade** entre campo **emitente (cadastro empresa)** e campos **prestador / prestação** no mesmo workspace, onde o mesmo conceito aparece.

Serve para critérios de aceite de story, *file list* e QA de conteúdo; **não** define algoritmo de padding 6→7 (**PRD** secção 6.2 + **@architect**).

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Sem erro de programação na cara do utilizador** | Mensagens como *“trim is not a function”* **nunca** aparecem; tratamento é **silencioso** no cliente + camada técnica. |
| **Um conceito, um rótulo** | “Código IBGE da cidade” / “Código IBGE (município)” — evitar misturar com “código da prefeitura” ou `nfse.config` (spec **prefeitura**). |
| **Formato explícito mas simples** | Utilizador MEI entende **7 dígitos** e “só números”; não expor nomes de campos JSON (`endereco.codigoCidade`) no título do alerta. |
| **Não culpar o Meu Financeiro pela tabela do emissor** | Texto de rodapé existente do alerta fiscal **mantém-se**; o hint opcional **reforça** verificação de dados, não culpa. |
| **Autofill honesto** | Se o CNPJ preencher o código automaticamente, o *hint* pode mencionar “confira se bate com o seu município” (**opcional P1** de copy). |

---

## 3. Arquitetura de informação (IA)

### 3.1 Áreas afetadas (sem mudança estrutural obrigatória)

| Área | Ficheiro / bloco (referência) | Mudança de layout |
|------|--------------------------------|-------------------|
| **Dados mínimos — emitente** | `GuidesMei.tsx`, campo com `placeholder="Código IBGE cidade *"` | **Nenhuma** obrigatória; apenas *hint* e validação visual se §5.2 for adoptada. |
| **Orquestração certificado → empresa** | Mesma página, `submitPlugnotasEmitenteSetup` / catch | **Nenhuma** nova secção; só conteúdo de erro §6. |
| **Prestador NFSe** | Rótulo *Código IBGE da cidade do prestador*, *Código IBGE (prestação)* | **Paridade de microcopy** com §4 (rótulo + hint alinhados). |
| **Alertas fiscais** | `FiscalIntegrationErrorAlert` | Linha secundária condicional §6.2 se **FR-CID-UX-02** for implementado. |

### 3.2 Hierarquia de mensagens (ordem de especificidade para o utilizador)

| Prioridade | Gatilho (mensagem normalizada / substring segura) | Comportamento UX |
|------------|---------------------------------------------------|------------------|
| **CID-L1** | `tabela de cidades do IBGE`, `codigoCidade` + `IBGE`, `endereco.codigoCidade` (texto vindo do BFF) | Mostrar alerta fiscal **completo** + **opcionalmente** bloco **§6.2** (**FR-CID-UX-02**). |
| **CID-L2** | Outros 400 Plugnotas no mesmo fluxo (ex.: `nfse.config.prefeitura`) | Seguir [`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md); **não** mostrar hint de IBGE de §6.2. |
| **CID-L3** | Erro de rede / timeout | Manter padrões existentes de conectividade; **não** misturar com IBGE. |

**Implementação sugerida para dev:** função pura `isPlugnotasEmpresaIbgeCidadeMessage(message: string): boolean` com substrings estáveis (testes de regressão), sem depender de texto em inglês do utilizador.

---

## 4. Microcopy — campos de código IBGE

### 4.1 Emitente (cadastro empresa — dados mínimos)

| Elemento | Especificação |
|----------|----------------|
| **Placeholder** (existente) | Manter *“Código IBGE cidade *”* **ou** alinhar a *“Código IBGE do município (7 dígitos)”* se PO preferir consistência com o *hint* (uma única alteração em ambos). |
| **Hint abaixo do campo** (recomendado **P1** de UX, baixo esforço) | Texto sugerido (`text-xs`, cor secundária do tema): *“Use o código de 7 dígitos do município no IBGE. Se preencheu pelo CNPJ, confira se a cidade está correta.”* |
| **Validação local** (já existe) | Se vazio: manter *“Informe o código IBGE da cidade.”* (**FR** alinhado em `nfEmissionCompany.ts`). |
| **Validação local opcional (P2 UX)** | Se, após normalização no *blur* ou no *submit*, o valor tiver **dígitos mas comprimento ≠ 7**: mensagem curta *“O código IBGE do município costuma ter 7 dígitos. Verifique o número.”* — **só** se PO/QA aceitarem para evitar falsos positivos com regra de padding **PRD** 6.2; caso contrário **omitir** nesta entrega. |

### 4.2 Prestador NFSe (paridade)

| Elemento | Especificação |
|----------|----------------|
| **Rótulo** | Manter *“Código IBGE da cidade do prestador”*; garantir mesma **política de normalização** que o emitente (engenharia). |
| **Prestação** (*Código IBGE (prestação)*) | *Hint* opcional espelhado: *“Sete dígitos, conforme IBGE.”* (uma linha). |

### 4.3 O que evitar na UI

- Expor *“JSON”*, *“payload”*, *“trim”*, *“number”*.  
- Afirmar *“o Meu Financeiro rejeitou o código”* quando a mensagem vier do emissor.  
- Confundir com **inscrição municipal** ou **prefeitura** no NFS-e (ver spec **prefeitura**).

---

## 5. Comportamento e estados (front-end)

### 5.1 Estados invisíveis (P0 — obrigatório para UX)

| Estado | Comportamento esperado para o utilizador |
|--------|------------------------------------------|
| **Hidratação** snapshot / API com `codigo_municipio` numérico | Campo mostra **dígitos como texto** (ex.: `3550308`); **sem** flash vazio; **sem** crash ao clicar *Enviar*. |
| **Utilizador cola valor com pontos ou espaços** | Se a normalização remover não-dígitos, o campo pode **reflectir** o valor limpo no *blur* (**opcional**) ou só no envio — preferência **@dev**: *blur* melhora previsibilidade; documentar na story. |
| **Teclado / entrada** | `inputMode="numeric"` **opcional** para mobile; **pattern** não obrigatório se validação for por normalizador. |

### 5.2 Foco e acessibilidade (**NFR-CID-01** + A11y)

| Requisito | Especificação |
|-----------|----------------|
| **Associação label–input** | Manter `htmlFor` / `id` existentes; qualquer *hint* novo usa `id` + `aria-describedby` no input. |
| **Erro de servidor (400 IBGE)** | Se o alerta fiscal for `role="alert"` ou região ao vivo, **não** duplicar o mesmo texto num segundo alerta sem necessidade. |
| **Após erro** | Opcional: `scrollIntoView` no campo *Código IBGE* quando **CID-L1** + utilizador clica *“Corrigir dados”* (só se já existir padrão semelhante na página; **não** bloquear entrega). |

---

## 6. Microcopy — erro de cadastro / integração fiscal

### 6.1 Bloco principal (inalterado na intenção)

Manter o padrão actual **`FiscalIntegrationErrorAlert`**:

- Título / corpo que deixam claro: validação ou rejeição pelo **provedor de emissão** / **emissor fiscal**.  
- Rodapé que explica que a informação **não** é gerada pelo Meu Financeiro.

### 6.2 Variante **hint IBGE** (**FR-CID-UX-02**, opcional)

**Quando:** **CID-L1** (secção 3.2) é verdadeiro **e** PO activa **FR-CID-UX-02** na mesma release.

**Onde:** imediatamente **abaixo** do parágrafo principal do alerta (ou dentro do mesmo cartão, antes do rodapé), com estilo **secundário** (`text-sm`, cor muted).

**Texto sugerido (1–2 linhas):**

> *“Se o erro citar código IBGE ou tabela de cidades, confira se o município e o código de 7 dígitos batem com o endereço do CNPJ ou com a consulta oficial do IBGE.”*

**Tradução curta (alternativa mais seca):**

> *“Confira o código de 7 dígitos do município (IBGE) e se corresponde à cidade do cadastro.”*

**Teste de conteúdo:** utilizador distingue este caso de erro de **prefeitura** / **IM** sem ler documentação técnica.

### 6.3 Retry / 404 após falha

Se a UI mostrar *“empresa não encontrada”* após cadastro falhado, **manter** copy existente que contextualiza retry (ver **ux-spec** orquestração e `operacao-mei-nfse.md`); esta spec **não** exige novo parágrafo dedicado ao 404.

---

## 7. Wireframe de baixa fidelidade (texto)

**Emitente — bloco endereço (trecho):**

```text
[ Cidade (nome)          ]  (campo existente)
[ Código IBGE cidade *   ]  placeholder / label
    hint: "Use o código de 7 dígitos..."   ← opcional P1
[ UF                     ]
```

**Alerta (com FR-CID-UX-02):**

```text
┌─────────────────────────────────────────────────────┐
│ Validação ou rejeição no provedor                    │
│ [mensagem bruta ou formatada do emissor…]            │
│                                                      │
│ Se o erro citar código IBGE… (hint opcional)         │
│                                                      │
│ Esta informação foi enviada pelo serviço de emissão… │
└─────────────────────────────────────────────────────┘
```

---

## 8. Rastreabilidade PRD → UX

| ID PRD | Entrega UX nesta spec |
|--------|------------------------|
| **FR-CID-FE-01** | Comportamento estável do envio; sem mensagens técnicas §5.1. |
| **FR-CID-FE-02** | Hidratação estável §5.1. |
| **FR-CID-FE-03** | Hint CNPJ §4.1; prestador §4.2. |
| **FR-CID-PAY-01** | Coerência visual do valor no input (string de dígitos) §5.1. |
| **FR-CID-UX-02** | Secção **6.2** (opcional). |
| **NFR-CID-01** | Gates QA de conteúdo + A11y §5.2. |
| **NFR-CID-04** | Nenhuma alteração a documentos ativos / callouts NFS-e Nacional além do estritamente necessário para o hint. |

---

## 9. Checklist de QA (conteúdo e UX)

- [ ] Submissão com código preenchido via **simulação CNPJ** (valor numérico na API mock) **não** mostra erro técnico e o campo exibe dígitos legíveis.  
- [ ] **CID-L1:** com mensagem de teste injectada, o hint **6.2** aparece **só** quando a regra estiver activa.  
- [ ] **CID-L2:** mensagem `nfse.config.prefeitura` **não** dispara hint **6.2**.  
- [ ] Contraste e tamanho do *hint* cumprem legibilidade no tema claro/escuro (tokens existentes).  
- [ ] Leitor de ecrã: label + erro + hint não se contradizem (ordem de anúncio coerente).  

---

## 10. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-08 | Versão inicial a partir do **PRD-plugnotas-empresa-codigo-cidade-ibge-2026-04-08**. |

---

*Especificação UX — Meu Financeiro / Guia MEI / integração Plugnotas.*
