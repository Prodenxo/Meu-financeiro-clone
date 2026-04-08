# Brief: correção cadastro empresa Plugnotas — `codigoCidade` (IBGE) e erro `trim`

**Data:** 2026-04-08  
**Origem:** incidente em desenvolvimento local — `POST /api/mei-notas/setup/emissao-fiscal/empresa` **400** com validação Plugnotas; UI com mensagem que inclui **`form.codigoCidade.trim is not a function`**; `GET …/empresa?cpfCnpj=` **404** (“não localizamos empresa”) após falha do cadastro.

**Produto:** Meu Financeiro — Guia MEI, fluxo certificado + empresa no emissor fiscal (Plugnotas).

**Documentos relacionados:**

- `docs/operacao-mei-nfse.md` — rotas setup `emissao-fiscal/empresa`, troubleshooting 400 Plugnotas.  
- `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload`, validação do formulário de empresa para emissão.  
- `frontend/src/pages/GuidesMei.tsx` — `applyBrasilApiToEmitente`, `emitenteSnapshotToForm`, orquestração pós-certificado (`submitPlugnotasEmitenteSetup`).  
- `backend/src/services/plugnotas/empresa.service.js` — `cadastrarEmpresaPlugNotas` (reencaminha payload para `POST /empresa` sem normalizar `endereco.codigoCidade`).

**Próximos passos típicos:** `@dev` — implementar normalização e testes; `@qa` — regressão com `codigo_municipio` numérico no mock Brasil API e snapshot emitente; `@pm` — copy de erro amigável se o código IBGE for inválido após normalização.

---

## 1. Resumo executivo

Há **dois sintomas** ligados ao mesmo campo:

| Sintoma | Onde aparece | Interpretação |
|--------|----------------|---------------|
| **`form.codigoCidade.trim is not a function`** | UI / excepção JavaScript ao montar payload | Em tempo de execução, **`codigoCidade` não é `string`** (ex.: `number` vindo de JSON/API), mas o código chama **`.trim()`** directamente. |
| **`fields.endereco.codigoCidade: Valor informado não encontrada na tabela de cidades do IBGE`** | Resposta **400** do Plugnotas (via BFF) | O valor enviado em **`endereco.codigoCidade`** não bate com a tabela IBGE do provedor — por **conteúdo errado**, **tipo** (número vs string na serialização JSON), **formato** (dígitos insuficientes / lixo), ou **incoerência** com município/UF. |
| **`GET …/empresa` 404** | Após falha do `POST` | Comportamento esperado: empresa **não** foi criada no provedor. |

A correção deve ser **em camadas**: (1) **robustez no cliente** ao construir o formulário e o payload; (2) **normalização canónica** (string só com dígitos, 7 posições IBGE quando aplicável) antes de `POST /empresa`; (3) **opcional no backend** como última linha de defesa para qualquer cliente.

---

## 2. Evidência (logs / reprodução)

- **Network:** `POST http://localhost:3000/api/mei-notas/setup/emissao-fiscal/empresa` → **400**, corpo com `message` alinhada à validação JSON Plugnotas sobre **`endereco.codigoCidade`**.  
- **Network:** `GET …/empresa?cpfCnpj=46891823000155` → **404**, mensagem tipo “Não localizamos qualquer Empresa…”.  
- **UI:** alerta de integração fiscal com texto do provedor **concatenado** com a mensagem de erro JS **`form.codigoCidade.trim is not a function`** (indica falha **no cliente** ao gerar ou re-tentar payload, não mensagem nativa do Plugnotas).

---

## 3. Causa raiz (análise no repositório)

### 3.1 `.trim()` em valor que nem sempre é string

Em `frontend/src/utils/nfEmissionCompany.ts`, `buildNfEmissionEmpresaPayload` faz:

- `codigoCidade: form.codigoCidade.trim()` (e `descricaoCidade` / `estado` com `.trim()` assumindo string).

A validação `getNfEmissionCompanyValidationMessage` usa `hasRequiredText(form.codigoCidade)`, que faz `String(value || '').trim()` — portanto **aceita `number`** e **não garante** que o estado React mantenha `codigoCidade` como `string`.

**Fontes prováveis de `number` no estado:**

1. **`applyBrasilApiToEmitente`** em `GuidesMei.tsx`: `codigoCidade: data.codigo_municipio ?? ''` — o tipo TS em `brasilApi.ts` é `string | null`, mas a API real pode devolver **número** em JSON; isso entra no estado sem coerção.  
2. **`emitenteSnapshotToForm`**: faz spread de `snap` sobre defaults; se o backend / `nfseEmitente` devolver **`ibgeMunicipio` / `codigoCidade` como número** na deserialização, o formulário fica com **número**.  
3. **`mergeIfEmpty`** e outros merges podem copiar o valor “como veio”.

Com `codigoCidade` numérico, **`form.codigoCidade.trim` é `undefined`** → erro **`is not a function`**.

### 3.2 Rejeição IBGE no Plugnotas

Mesmo sem crash, o payload pode chegar ao Plugnotas com:

- **`codigoCidade` numérico** em JSON (`"codigoCidade": 3550308` vs string `"3550308"`) — se o validador do provedor esperar **string** estrita na árvore “fields”, pode falhar o lookup.  
- **Código inválido ou desactualizado** relativamente à tabela que o Plugnotas usa (menos provável se for o mesmo código IBGE oficial, mas possível com dados errados da fonte CNPJ).  
- **Dígitos a menos** (falta de zero à esquerda em casos raros) ou **caracteres não numéricos** colados ao código.

O **`backend`** (`cadastrarEmpresaPlugNotas`) **não normaliza** `payload.endereco.codigoCidade` antes do `requestJson('POST', '/empresa', payload)`.

---

## 4. Direcção de correção (recomendada)

### P0 — Cliente: nunca assumir string em `codigoCidade`

1. **`buildNfEmissionEmpresaPayload`** (e, se necessário, outros pontos que façam `.trim()` em campos de endereço): usar padrão **`String(form.codigoCidade ?? '').trim()`** ou função única **`normalizeIbgeCodigoCidade(form.codigoCidade)`**.  
2. **`emitenteSnapshotToForm`**: ao mapear snapshot → formulário, **forçar** `codigoCidade` (e campos de texto críticos) para **string normalizada**.  
3. **`applyBrasilApiToEmitente`** (e fluxo prestador NFSe que copia `codigo_municipio`): coergir **`String(data.codigo_municipio ?? '').trim()`** (ou normalizador IBGE abaixo).

### P1 — Normalização canónica IBGE (7 dígitos, só dígitos)

Introduzir helper partilhado (ex.: `frontend/src/utils/ibgeMunicipioCodigo.ts` ou junto de `nfEmissionCompany.ts`):

- Entrada: `unknown`.  
- Saída: `string` com **apenas dígitos**; se o comprimento for **6** e fizer sentido para o domínio, **pad com zero à esquerda até 7** (validar com casos reais — códigos IBGE de município são em geral **7 dígitos**).  
- Rejeitar / limpar valores vazios ou não numéricos para o fluxo de validação existente.

**Testes unitários:** payload com `codigoCidade: 3550308` (number) → JSON com string `"3550308"`; snapshot com número; Brasil API mock com `codigo_municipio` numérico.

### P2 — Backend (defesa em profundidade)

Em `cadastrarEmpresaPlugNotas` / função utilitária partilhada:

- Se existir `payload.endereco` e `codigoCidade`, **normalizar** da mesma forma que no cliente antes de `POST`/`PATCH` ao Plugnotas.  
- Isto protege chamadas futuras (mobile, scripts) que contornem o frontend.

### P3 — Produto / mensagens

- Se, após normalização, o Plugnotas **ainda** rejeitar, a mensagem já é de **dados ou tabela do provedor** — manter o padrão de `FiscalIntegrationErrorAlert` (origem = emissor fiscal) e eventualmente hint: “confirme código IBGE no IBGE ou dados do CNPJ”.

---

## 5. Critérios de aceite (checklist)

- [ ] Com **`codigoCidade` como `number`** no estado React, **não** ocorre excepção ao chamar `buildNfEmissionEmpresaPayload` nem ao submeter certificado + empresa.  
- [ ] O JSON enviado ao BFF contém **`endereco.codigoCidade` como string** com **apenas dígitos** (e comprimento IBGE acordado, tipicamente **7**).  
- [ ] `POST …/empresa` com dados válidos deixa de retornar 400 **só** por tipo/formato de `codigoCidade` (teste com CNPJ/cidade conhecida).  
- [ ] Testes unitários cobrem **Brasil API numérica** + **snapshot numérico**.  
- [ ] (Opcional) Teste de integração backend ou contract test que assegure normalização em `empresa.service.js`.

---

## 6. Referências de código (âncoras)

```99:101:frontend/src/utils/nfEmissionCompany.ts
    codigoCidade: form.codigoCidade.trim(),
    descricaoCidade: form.descricaoCidade.trim(),
    estado: form.estado.trim().toUpperCase(),
```

```1996:2008:frontend/src/pages/GuidesMei.tsx
  const applyBrasilApiToEmitente = (data: BrasilApiCnpjResponse) => {
    setNfEmissionCompanyForm((prev) => mergeIfEmpty(prev, {
      ...
      codigoCidade: data.codigo_municipio ?? '',
```

```218:228:frontend/src/pages/GuidesMei.tsx
const emitenteSnapshotToForm = (snap: NfseEmitenteSnapshot): NfEmissionCompanyForm => {
  ...
  return {
    ...getDefaultNfEmissionCompanyForm(),
    ...companyFields,
```

```603:625:backend/src/services/plugnotas/empresa.service.js
export const cadastrarEmpresaPlugNotas = async (input) => {
  ...
  try {
    const response = await requestJson('POST', '/empresa', payload);
```

---

## 7. Riscos e não-objectivos deste brief

- **Não-objectivo:** alterar a tabela IBGE do Plugnotas ou resolver divergência de dados **fonte CNPJ vs IBGE** sem validação humana — após normalização técnica, se o erro persistir, o passo seguinte é **dados de negócio** ou **suporte Plugnotas**, não só código.  
- **Risco:** pad de 6→7 dígitos sem regra clara pode gerar código **errado**; implementar só com critério documentado (ex.: só quando `^\d{6}$` e alinhado a exemplos oficiais).

---

*Brief preparado para correção técnica alinhada ao fluxo AIOX (story/checklist em `docs/stories/` quando existir item explícito para este bug).*
