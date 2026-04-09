# NFR-PREF-EV-01 / FR-P0-SPIKE-01 — Fecho do spike `nfse.config.prefeitura` (P0)

**Estado:** registo técnico **sem PII** para **FR-P0-DOC-01** e desbloqueio documental das stories filhas. **NFR-PREF-EV-01** (aceitação formal **por conta/ambiente** Plugnotas) continua a exigir validação em sandbox/homologação **sem** colar CNPJ, chaves nem payloads reais neste repositório.

**Modelo vazio (preservado):** [`NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md`](./NFR-PREF-EV-01-plugnotas-nfse-config-prefeitura-TEMPLATE.md)

**PRD P0 (canónico):** [`docs/prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md`](../prd/PRD-acao-p0-cadastro-empresa-prefeitura-400-get-404-2026-04-08.md)

**Story spike:** [`docs/stories/story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md`](../stories/story-fr-cons-p0-plugnotas-empresa-spike-prefeitura-decisao-doc.md)

**Story implementação trilho B:** [`docs/stories/story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md`](../stories/story-fr-cons-p0-plugnotas-empresa-backend-trilho-b-nfse-prefeitura.md)

---

## NFR-P0-TIME-01 — Janela do spike

| Campo | Valor (UTC-3 Brasil, data civil) |
|-------|----------------------------------|
| Início | 2026-04-08 |
| Fim | 2026-04-08 |
| Autor do registo | Engenharia (fecho documental no repo) |

---

## 1. Checklist de evidência (NFR-PREF-EV-01)

- [x] Fonte citável **sem PII:** documentação pública Plugnotas/TecnoSpeed (URLs abaixo) + código e testes do trilho B no repositório (contrato **derivado**, não export sandbox com dados reais).
- [x] Schema mínimo **redigido** para o trilho adoptado (secção 3).
- [x] Compatibilidade declarada com `nfse.nacional: true` no mesmo payload (resposta à pergunta 2 da arquitectura P0).
- [x] Lookup: explícito “não há endpoint dedicado no BFF” (resposta à pergunta 3).
- [x] Data e autor da recolha (tabela acima).

**Pendente fora do Git:** execução em **sandbox/homologação** com conta real, resultado **POST** 2xx e **GET** empresa coerente (**FR-P0-OUT-01 / 02**) — anotar em ticket interno ou QA Results **sem** PII.

---

## 2. Resumo — fontes (tipo)

| Campo | Valor |
|-------|--------|
| Data do registo | 2026-04-08 |
| Fonte (tipo) | Doc público + decisão técnica/produto alinhada ao trilho **B** |
| Link | [Documentação API Plugnotas](https://docs.plugnotas.com.br/) — schema geral empresa / NFS-e; artigos TecnoSpeed (ex.: primeiros passos) com exemplos municipais **genéricos** |
| Ambiente | Comportamento **varia** sandbox vs produção e por conta (**NFR-N04**) |

---

## 3. Respostas às quatro perguntas mínimas (arquitectura P0 §2)

### 3.1 Schema mínimo aceite / usado no trilho **B**

O validador Plugnotas pode exigir o ramo **`nfse.config.prefeitura`**. A documentação pública cita frequentemente credenciais municipais (`login` / `senha`). Para contas que aceitam identificação municipal por **código IBGE do município** (7 dígitos), o BFF pode enviar:

```json
{
  "nfse": {
    "ativo": true,
    "config": {
      "producao": true,
      "prefeitura": {
        "codigoIbge": "3550308"
      }
    }
  }
}
```

Exemplo **anonimizado:** `3550308` é código IBGE público (São Paulo/SP), **não** identifica pessoa nem empresa. **Nunca** usar CNPJ, razão social ou credenciais reais em exemplos versionados.

Quando o cliente já envia `prefeitura` com `login` / `senha`, o trilho **B** faz *merge* **só** de `codigoIbge` em falta (ver `nfsePrefeituraPayload.js`).

### 3.2 Condicionalidade com `nfse.nacional: true`

No payload canónico MEI o produto envia **`nfse.nacional: true`**. O spike **não** assume que isso **dispensa** `prefeitura` em **todas** as contas: mensagens **400** citando `fields.nfse.config.prefeitura` demonstram o contrário em cenários reais. Com trilho **B** activo (`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`), `nacional` e `prefeitura.codigoIbge` podem **coexistir** no JSON enviado ao Plugnotas.

### 3.3 Lookup município → `prefeitura`

**Não** há, no BFF, chamada a endpoint Plugnotas de catálogo de prefeituras. A única fonte usada na derivação **B** é **`endereco.codigoCidade`** já normalizado (7 dígitos) — alinhado a **FR-CID** e à tabela IBGE implicitamente usada pelo emissor.

### 3.4 Compatibilidade `nacional: true` + `prefeitura` preenchida

**Hipótese adoptada para implementação:** combinação **suportada** pelo contrato que montamos (testes de integração *mock* + opt-in). **Risco residual:** conta ou ambiente específico pode ainda rejeitar ou exigir campos adicionais — tratar com ticket ao provedor e actualizar este registo (**NFR-N04** / **NFR-PREF-EV-01**).

---

## 4. FR-P0-DEC-01 — Trilho principal

| Decisão | Valor |
|---------|--------|
| Trilho principal | **B** — derivação server-side **opt-in** de `nfse.config.prefeitura.codigoIbge` a partir de `endereco.codigoCidade` |
| Variável | `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` (defeito `false`, **NFR-P0-REG-01**) |
| Trilho **A** (só painel) | **Não** seleccionado como trilho **único** de fecho P0; checklist de painel/ambiente mantém-se no runbook [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) |
| Trilhos **C** / **D** | **Não** implementados neste P0. A story de UI C/D foi marcada **Cancelled / Won’t do** enquanto o trilho principal for **B** ([`story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md`](../stories/story-fr-cons-p0-plugnotas-empresa-ui-trilho-c-d-prefeitura.md), 2026-04-08). Reabrir só com decisão PO explícita **C** ou **D**. |

**Governança:** confirmação assíncrona do **PO** (ou delegado) em canal interno pode formalizar a mesma letra **B**; este ficheiro é o **ponteiro versionado** para engenharia e QA.

---

## 5. Registos únicos (FR-P0-DOC-01)

| Artefacto | Função |
|-----------|--------|
| Este ficheiro | Evidência / spike |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) § P0 prefeitura | Runbook operacional |
| [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) | Complemento técnico trilho **B** |

---

## 6. Notas de QA

Após leitura, @qa pode: (1) validar ausência de PII em commits que toquem estes docs; (2) marcar na story spike o fecho documental; (3) manter **FR-P0-OUT-01/02** pendente até evidência interna adequada. Ver também §§7–9 (seguimento recomendações QA 2026-04-08).

---

## 7. FR-P0-DEC-01 — Registo para confirmação PO (metadados **sem PII**)

Preenche **@po** (ou delegado) quando a governança exigir assinatura explícita. **Não** colar CNPJ, e-mail pessoal, payloads reais nem chaves API **neste repositório** — use só referência opaca a ticket/acta interna.

| Campo | Valor |
|-------|--------|
| Data da confirmação (AAAA-MM-DD) | *(preencher)* |
| Trilho confirmado | **B** |
| Ponteiro evidência (path no repo) | `docs/evidence/NFR-PREF-EV-01-plugnotas-prefeitura-spike-p0-closure-2026-04-08.md` |
| Referência interna (ex. ID ticket / acta) | *(preencher fora do Git ou ID opaco)* |

Texto mínimo sugerido para acta/ticket interno: *«Trilho **B** aprovado para P0 cadastro empresa / prefeitura Plugnotas; evidência versionada no path acima.»*

---

## 8. NFR-PREF-EV-01 — Dois níveis (fecha ambiguidade QA sobre PRs vs produção)

| Nível | O que significa | Estado |
|-------|-----------------|--------|
| **A — Baseline no repositório** | Registo técnico (este doc), schema redigido, implementação trilho **B** opt-in, testes *mock* / unitários | **Satisfeito** para merge e para uso em **dev/CI** |
| **B — Conta / produção** | Validação **POST** 2xx + **GET** empresa coerente numa conta Plugnotas acordada, com `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` **só** após esse resultado | **Obrigatório antes** de activar a flag em **produção**; anexar resultado **redigido** ao processo de release (sem PII no Git) |

O critério da story *«NFR-PREF-EV-01 satisfeito antes de abrir PRs de código dependentes»* aplica-se ao **nível A** para código já integrado: PRs **não** devem inventar contrato fora do spike; o **nível B** permanece gate operacional de **deploy** em ambiente real.

---

## 9. Ordem temporal — documentação vs implementação trilho **B**

A implementação de código do trilho **B** pode ter sido **anterior** à redacção final deste fecho; o presente documento é a **fonte canónica** retroativa para contrato, variável de ambiente e limites **NFR-N04**. Alterações futuras ao JSON enviado ao Plugnotas devem actualizar este fecho (ou ADR ligado) em conjunto com o código.
