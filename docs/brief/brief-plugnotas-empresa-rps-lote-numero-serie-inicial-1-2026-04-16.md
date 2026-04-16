# Brief: cadastro de empresa PlugNotas — **RPS** com **lote 1**, **número 1** e **série "1"**

**Data:** 2026-04-16  
**Persona / origem:** pedido de produto (Guia MEI / emissão fiscal) — padronizar numeração inicial do RPS no cadastro de empresa.  
**Referência externa:** [Documentação API PlugNotas — `addCompany` (Empresa)](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany).

---

## 1. Objetivo

Garantir que, na **configuração de empresas** enviada ao PlugNotas no fluxo de cadastro/atualização alinhado a `POST /empresa` (e, quando aplicável, complementos via `PATCH /empresa`), o bloco **`rps`** reflita **sempre** os valores iniciais **1 e 1** no sentido operacional habitual de NFS-e:

| Campo (contrato PlugNotas) | Valor fixo desejado | Significado (doc.) |
|----------------------------|---------------------|---------------------|
| `rps.lote` | **1** | Lote inicial utilizado no RPS. |
| `rps.numeracao[]` (pelo menos uma entrada) | **`numero`: 1** (obrigatório) | Número inicial do RPS. |
| | **`serie`: `"1"`** (obrigatório, string) | Série do RPS. |

**Payload de referência (ilustrativo):**

```json
"rps": {
  "lote": 1,
  "numeracao": [
    { "numero": 1, "serie": "1" }
  ]
}
```

A documentação indica que **`numero`** e **`serie`** são obrigatórios dentro de `numeracao`, e que séries adicionais podem ser registadas mais tarde via **`PATCH /empresa`**. Este brief limita-se ao pedido de **valores iniciais canónicos 1 / 1** no cadastro gerido pela aplicação.

---

## 2. Contexto no produto (brownfield)

- O cadastro de emitente usa o BFF (`POST` … `emissao-fiscal/empresa`) e políticas já documentadas em [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) e serviços em `backend/src/services/plugnotas/empresa.service.js`.
- O payload montado no cliente para empresa (`buildNfEmissionEmpresaPayload` em `frontend/src/utils/nfEmissionCompany.ts`) **não inclui** hoje o objeto `rps` — ou seja, a numeração inicial RPS **não está explícita** no contrato enviado pelo front.
- O pedido é **normativo para a app**: sempre enviar (ou impor no servidor) `rps` com **lote 1** e **numeracao** com **número 1** e **série "1"**, salvo decisão futura em contrário registada em PRD/ADR.

---

## 3. Escopo sugerido (para @architect / @dev)

1. **Onde fixar a regra**
   - **Opção A (preferida para consistência):** aplicar no **backend**, após validação e junto das outras políticas de payload PlugNotas (`applyEmpresa…`), para que **todo** cadastro de empresa (independentemente do cliente) receba o mesmo `rps`.
   - **Opção B:** incluir `rps` no **`buildNfEmissionEmpresaPayload`** — útil para transparência no DevTools, mas duplica a fonte de verdade se o backend também normalizar.

2. **POST vs PATCH**
   - Esclarecer com o PO se `rps` deve ser forçado **só no primeiro cadastro (POST)** ou também em **PATCH** de empresa. Sobrescrever numeração em empresas que já emitiram pode ser **indesejável**; o brief assume **padrão seguro**: aplicar de forma **idempotente** no cadastro inicial e **não** repor sequência em PATCH salvo regra explícita de produto.

3. **Contrato e erros**
   - Se o PlugNotas rejeitar combinação `lote` / `numeracao` em algum município ou conta, registar mensagem de erro e alinhar com o runbook em `docs/operacao-mei-nfse.md` (evidência NFR).

---

## 4. Critérios de aceite (proposta)

- [ ] Todo **novo** cadastro de empresa enviado ao PlugNotas inclui `rps` com `lote: 1` e `numeracao: [{ numero: 1, serie: "1" }]` (tipos: número inteiro para `lote` e `numero`, string para `serie`), salvo excepção documentada.
- [ ] Comportamento em **PATCH** definido e documentado (aplicar só se aceite pelo PO: não alterar séries já em uso).
- [ ] Testes automatizados mínimos no backend (snapshot ou assert estrutural do payload após política) para evitar regressão.
- [ ] Nenhuma alteração de copy de UI obrigatória; opcional: nota técnica interna ou comentário de código apontando para este brief e para a doc PlugNotas.

---

## 5. Riscos e perguntas em aberto

| Tema | Nota |
|------|------|
| **Empresas já cadastradas** | Forçar `numero`/`serie` via PATCH pode conflitar com a sequência real já consumida no município — confirmar política com PO. |
| **Múltiplas séries** | O pedido actual é **uma** série `"1"`. Séries adicionais continuam a cargo de `PATCH /empresa` no painel ou fluxos futuros. |
| **Homologação vs produção** | Validar no sandbox PlugNotas que o payload é aceite no `addCompany` da conta do projeto. |

---

## 6. Artefactos relacionados (não substituir)

- [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md)  
- `backend/src/services/plugnotas/empresa.service.js`  
- `frontend/src/utils/nfEmissionCompany.ts`

---

## 7. Próximo passo recomendado

1. **PO** confirma regra de **PATCH** e excepções.  
2. **@architect** descreve o ponto único de aplicação da política `rps` (BFF).  
3. **@dev** implementa e **@qa** valida em sandbox com um CNPJ de teste.

---

*Brief de descoberta / alinhamento — Atlas (AIOX Analyst). Não substitui PRD; serve de entrada para story e implementação.*
