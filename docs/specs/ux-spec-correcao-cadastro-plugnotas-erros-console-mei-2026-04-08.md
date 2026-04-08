# Especificação de front-end e UX — Correção integrada: cadastro Plugnotas e triagem de erros na consola (Guia MEI)

**Versão:** 1.0  
**Data:** 2026-04-08  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) (**FR-CONS-MAP-01**, **FR-CONS-UX-01**, **FR-CONS-UX-02**, **FR-CONS-SERPRO-01**; alinhamento **NFR-CONS-02** acessibilidade)

**Brief de apoio:** [`docs/brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md`](../brief/brief-correcao-cadastro-plugnotas-erros-console-2026-04-08.md)

**Nota editorial:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou identificador da spec.

---

## 1. Objetivo deste documento

Contrato de **experiência, hierarquia visual, microcopy, estados de interface e acessibilidade** para:

1. **Orquestrar** a “tríade” da consola (falha **POST** empresa Plugnotas, **GET** empresa 404, **POST** `mei-guide/validate`) sem duplicar specs já fechadas para payload **`prefeitura`** e para encadeamento **POST → GET** (**FR-CONS-MAP-01**, **FR-CONS-UX-01**, **FR-CONS-UX-02**).  
2. Garantir que falhas do **validador do guia** (integração **Receita/Serpro** no backend) **não** pareçam falhas do **emissor fiscal Plugnotas** (**FR-CONS-SERPRO-01**).  
3. Servir de **mapa único** para @dev e QA: que componentes tocar, que gatilhos de copy aplicar, e onde aprofundar noutras specs.

**Fora de âmbito desta spec:** schema JSON `nfse.config.prefeitura`, trilhos **B/C/D** de payload (**PRD-PREF** + [`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md)).

---

## 2. Mapa de especificações relacionadas (não substituir)

| Tema | Documento | Uso neste fluxo |
|------|-----------|-----------------|
| Copy **400** `prefeitura` vs IM, **PREF-L1–L3** | [`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) | Corpo principal do erro de **cadastro empresa** no emissor. |
| Encadeamento **POST** falho → **GET** 404, **SOL-L0–L3** | [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) | Framing causal e *empty states* após falha de registo. |
| NFS-e Nacional, erros genéricos municipais | [`ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md`](ux-spec-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md) | Callouts e hints **FR-NAT-ERR-01**. |
| Orquestração certificado + empresa | [`ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md`](ux-spec-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md) | Fases, retry, painel âmbar. |
| Mensagens erro (padrões globais) | [`ux-spec-mensagens-erro-usuario-final-2026-04-07.md`](ux-spec-mensagens-erro-usuario-final-2026-04-07.md) | Tom e blocos técnicos. |
| Operação / suporte | [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Onde **FR-CONS-MAP-01** também se materializa em doc (paridade UI ↔ runbook). |

---

## 3. Princípios de UX (âmbito CONS)

| Princípio | Aplicação |
|-----------|-----------|
| **Três integrações, três “caixas” mentais** | Plugnotas **cadastro empresa** ≠ consulta **GET empresa** ≠ **validação CNPJ/DAS** (Serpro). A UI não deve misturar *headlines* entre elas. |
| **Um bloqueio primário por ecrã** | Na zona de emissão fiscal / registo empresa, o erro do **POST** empresa domina; validação Serpro pertence ao **bloco CNPJ/período** do guia — não como substituto do painel Plugnotas. |
| **Consola do browser ≠ UI** | O utilizador não deve precisar da consola; o que hoje aparece só no *Network* deve ter **eco** em mensagem clara ou doc ligada (**FR-CONS-MAP-01**). |
| **503 não é “CNPJ inválido”** | Quando o backend passar a devolver **503** (ou **502**) para falha Serpro, a copy trata **indisponibilidade de serviço**, não validação de formulário (**FR-CONS-SERPRO-01** + **NFR-CONS-SERPRO-01**). |
| **A11y** | Dois erros simultâneos (ex.: validação + cadastro): hierarquia com **um** `role="alert"` para o mais crítico no *viewport* ou **regiões** distintas com `aria-labelledby`; evitar leitores a repetirem o mesmo texto. |

---

## 4. Arquitetura de informação — gatilhos **CONS** (tríade)

Estes IDs complementam **SOL-L*** e **PREF-L***; @dev combina condições (estado global, último erro, HTTP).

| ID | Condição (lógica de produto) | Comportamento UX |
|----|------------------------------|------------------|
| **CONS-A** | Último erro relevante: **POST** `…/emissao-fiscal/empresa` **4xx/5xx** com mensagem Plugnotas/BFF (incl. `prefeitura`) | **Primário:** painel existente (`GuiaMeiEmpresaCadastroErrorPanel` + retry âmbar). Copy de detalhe: spec **PREF** secção 5.1 quando **PREF-L1**. **Secundário:** se o utilizador vê também “não encontrado”, aplicar **SOL-L1** (spec SOL secção 4). |
| **CONS-B** | **GET** `…/emissao-fiscal/empresa` **404** **sem** erro de POST visível no mesmo fluxo | **SOL-L2** ou **SOL-L3** conforme histórico de tentativa de POST (spec SOL matriz 3.2). **Proibido** (FR-CONS-UX-01): sugerir “confirme se a empresa existe no emissor” **sem** mencionar que o **registo pode não ter sido concluído** após falha anterior. |
| **CONS-C** | Falha em **`POST /mei-guide/validate`** (mensagem genérica tipo “Internal Server Error”, ou **503** após mudança de API) | **Bloco dedicado** no painel CNPJ (secção 6 desta spec). **Não** reutilizar título/copy do painel Plugnotas **prefeitura** / NFS-e Nacional. |
| **CONS-0** | Fluxo feliz: POST empresa OK, GET 200, validate OK | Estados de sucesso existentes; sem alteração além de consistência de labels. |

---

## 5. Wireframes textuais (baixa fidelidade)

### 5.1 Guia MEI — coluna principal (CNPJ + validação)

```
┌─────────────────────────────────────────────────────────────┐
│ [Sucesso] CNPJ validado...                    (admin-alert-success)
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Validação do guia (Receita Federal)                         │  ← título opcional, text-sm font-semibold
│ O serviço da Receita Federal está temporariamente           │
│ indisponível. Tente de novo em alguns minutos. Isto não      │  ← CONS-C, copy secção 6
│ está relacionado ao cadastro da empresa no emissor fiscal.   │
└─────────────────────────────────────────────────────────────┘
  (variante danger ou warning conforme HTTP; ver 6.3)

┌─────────────────────────────────────────────────────────────┐
│ CNPJ do MEI  [input]                                        │
│ Validando CNPJ...                                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Mesmo ecrã — secção registo empresa (fase 2), com erro Plugnotas

```
┌─────────────────────────────────────────────────────────────┐
│ [Âmbar] Não foi possível concluir o registro...  (retry)    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ [Danger] GuiaMeiEmpresaCadastroErrorPanel                    │
│   + hint NFS-e Nacional se aplicável                         │
│   + bloco SOL “Por que aparece não encontrado?” se CONS-A+B   │
└─────────────────────────────────────────────────────────────┘
```

**Regra de ouro:** **CONS-C** nunca substitui o título do painel **CONS-A**; aparecem em **secções verticalmente separadas** (validação acima ou abaixo conforme *scroll*, mas sempre com rótulo de integração).

---

## 6. Microcopy — validação guia / Serpro (**FR-CONS-SERPRO-01**)

### 6.1 Problema actual

`handleValidateBlur` em `GuidesMei.tsx` define `validationError` com `error.message` vindo do `apiClient`. Mensagens como **“Internal Server Error”** parecem falha **interna genérica** e não distinguem **Serpro** de **Plugnotas**.

### 6.2 Prefixo estável de integração (MVP copy)

Sempre que a falha for originada no caminho **validate** → Serpro (detectável por: `httpStatus` **503/502**, ou `errors.code` estável definido pelo backend, ou *path* da requisição conhecido no *parser* de erro):

| Elemento | Especificação |
|----------|----------------|
| **Título curto** (`text-sm font-semibold`) | *Validação do guia (Receita Federal)* |
| **Corpo** (1–3 frases) | *Não foi possível validar o CNPJ com a Receita Federal neste momento. Tente de novo em alguns minutos. Este passo não é o cadastro da empresa no emissor fiscal (Plugnotas).* |
| **Se HTTP 400** com mensagem genérica “Internal Server Error” (compatibilidade até **NFR-CONS-SERPRO-01**) | Mesmo corpo; **não** repetir literal “Internal Server Error” como única linha — substituir pelo parágrafo acima + *detalhe técnico* colapsável opcional com texto bruto (spec mensagens erro global). |

### 6.3 Variante visual por severidade

| HTTP (após story backend) | Componente sugerido | Nota |
|---------------------------|----------------------|------|
| **503** / **502** | `admin-alert-warning` **ou** `admin-alert-danger` com tom “indisponibilidade” | Preferir **warning** se o utilizador pode retentar; **danger** se sessão expirou (copy distinta em story). |
| **400** validação real (CNPJ inválido) | `admin-alert-danger` | Manter mensagens actuais curtas. |
| **401/403** (se exposto) | `admin-alert-danger` + copy de sessão | Fora do núcleo desta spec; alinhar auth. |

### 6.4 O que **não** dizer (alinhado **FR-CONS-UX-01**)

- “Erro no cadastro da empresa no Plugnotas” quando só falhou **validate**.  
- “Corrija os dados da NFS-e” quando só falhou **validate**.  
- Sugerir abrir painel Plugnotas **NFS-e Nacional** como **primeiro** passo para erro **CONS-C**.

---

## 7. Microcopy — **GET** 404 e **FR-CONS-UX-02**

Implementação **canónica** de texto: spec **SOL** (secções 4 e 5). Esta spec acrescenta **regra de consolidação**:

- Qualquer *toast*, *inline* ou resumo que diga “empresa não encontrada” **deve** incluir, quando **CONS-B** com histórico de **POST** falho, a ideia de **“registo ainda não criado no emissor”** — já coberta por **SOL-L1/SOL-L2**; @dev não duplica parágrafos, reutiliza o mesmo bloco de componente.

---

## 8. Componentes e ficheiros (checklist @dev)

| Área | Ficheiro / símbolo | Alteração esperada (alto nível) |
|------|-------------------|----------------------------------|
| Validação CNPJ + mensagens | `frontend/src/pages/GuidesMei.tsx` — `validationError`, `handleValidateBlur` | Mapear erro de API para copy **secção 6**; opcional `data-testid` / `data-cons-trigger="serpro-validate"`. |
| Cliente HTTP | `frontend/src/services/apiClient.ts` (ou helper de erro) | Expor `httpStatus` e `errors` para o *parser* de validate (**FR-CONS-SERPRO-01**). |
| Serviço validate | `frontend/src/services/guidesMeiService.ts` | Propagar corpo estruturado se o backend enviar `code`. |
| Cadastro empresa | `GuiaMeiEmpresaCadastroErrorPanel`, painel âmbar retry | Sem mudança de layout obrigatória; garantir coexistência com **SOL** blocos quando **CONS-A+B**. |
| Hints Plugnotas | `nfseNacionalPlugnotasErrorHints.ts`, `FiscalIntegrationErrorAlert.tsx` | **Não** disparar hint NFS-e Nacional para erros **CONS-C**. |

---

## 9. Acessibilidade (**NFR-CONS-02**, **PRD** secção 3.4)

| Requisito | Implementação |
|-----------|----------------|
| Erro de validação Serpro | Região com título associado (`aria-labelledby`) ou `role="alert"` **único** no bloco CNPJ quando for o único erro crítico visível. |
| Dois alertas visíveis (CONS-A + CONS-C) | Estrutura: primeiro alerta com `role="alert"`, segundo com `role="region"` + título, **ou** ordem DOM = ordem de importância anunciada; validar com leitor de ecrã (VoiceOver/NVDA) em story QA. |
| Cor | Nunca ser o único indicador; ícone ou texto “Aviso”/“Erro” já presente nos *alerts* existentes. |
| Foco | Após falha de **POST** empresa, foco pode ir para o painel de erro (opcional, melhoria; marcar como nice-to-have na story). |

---

## 10. Rastreabilidade PRD → spec

| ID PRD | Onde nesta spec |
|--------|-----------------|
| **FR-CONS-MAP-01** | Secções 2, 4, doc operacional em paralelo (conteúdo da “tríade” espelhado em `operacao-mei-nfse.md` — entrega story 2.1). |
| **FR-CONS-UX-01** | Secções 3, 4 **CONS-B**, 6.4 |
| **FR-CONS-UX-02** | Secção 7 + **SOL** |
| **FR-CONS-SERPRO-01** | Secções 5.1, 6, 8 |
| **FR-CONS-EVID-01** | Metadados da story devem citar PRD + brief + **esta spec**. |
| **FR-CONS-PREF-DELEG-01** | Secção 1 *fora de âmbito*; copy **PREF** permanece canónica. |

---

## 11. Critérios de aceite de UX (para QA de conteúdo)

1. Com **CONS-C** simulado, o utilizador consegue dizer **em uma frase** que o problema é **Receita/validação do guia**, não **Plugnotas**.  
2. Com **CONS-A** + **CONS-B**, a UI **não** apresenta só “empresa não encontrada” sem ligação ao **POST** falhado (**SOL-L1** satisfeito).  
3. Nenhuma *string* de UI usa “§” nem expõe *stack trace*.  
4. Leitor de ecrã anuncia os dois tipos de erro sem repetição confusa quando ambos visíveis (teste manual registado).  

---

## 12. Change log

| Data | Versão | Nota |
| --- | --- | --- |
| 2026-04-08 | 1.0 | Versão inicial a partir do **PRD-correcao-cadastro-plugnotas-erros-console-mei**; integração com specs **SOL**, **PREF**, **NAT**. |

---

*Uma — especificação front-end/UX para handoff @dev; contratos JSON e códigos HTTP finais dependem da story backend (**NFR-CONS-SERPRO-01**).*
