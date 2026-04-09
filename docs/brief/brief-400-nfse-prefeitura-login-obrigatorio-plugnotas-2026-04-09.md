# Brief: **400** no cadastro empresa — `nfse.config.prefeitura.login` obrigatório (validação Plugnotas)

**Data:** 2026-04-09  
**Origem:** brainstorm pós-reprodução — `POST /api/mei-notas/setup/emissao-fiscal/empresa` (Guia MEI / emissor fiscal), resposta **400** com eco da validação do JSON de Empresa no fluxo Plugnotas.

**Referência externa:** [Documentação da API PlugNotas (Postman)](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest) — contrato de cadastro de empresa / bloco NFS-e e campos esperados no objecto `prefeitura`.

---

## 1. Sintoma observado

| Campo | Valor |
|--------|--------|
| **Método / rota** | `POST` `/api/mei-notas/setup/emissao-fiscal/empresa` |
| **HTTP** | **400** `Bad Request` |
| **Content-Type** | `application/json; charset=utf-8` |
| **Mensagem (exemplo)** | *«Falha na validação do JSON de Empresa: … `fields.nfse…config.prefeitura.login`: Preenchimento obrigatório»* |

**Distinção:** este código **não** é o **400** da *tabela IBGE* (`codigoIBGECidade` não encontrado). Trata-se de regra de **credenciais / prefeitura** no payload NFS-e.

---

## 2. Enquadramento técnico (repositório)

- O backend envia o payload de empresa ao Plugnotas (`cadastrarEmpresaPlugNotas` em `backend/src/services/plugnotas/empresa.service.js`).
- Existe trilho opcional **`applyNfseConfigPrefeituraDeriveIbge`** (`backend/src/services/plugnotas/nfsePrefeituraPayload.js`) que, quando activo, pode preencher **`nfse.config.prefeitura`** com **`codigoIbge`** derivado de `endereco.codigoCidade`, **sem** fornecer `login` / `senha`.
- Comentário no próprio ficheiro: a documentação pública Plugnotas usa frequentemente **`prefeitura.login`** / **`prefeitura.senha`**; a derivação **não remove** credenciais já enviadas pelo cliente, mas **pode** criar um objecto `prefeitura` só com IBGE.

**Hipótese central do briefing:** o validador upstream (Plugnotas) para **este** município / perfil exige **`login`** (e possivelmente **`senha`**) quando `nfse.config.prefeitura` está presente ou quando o cenário municipal assim o determina — resultando em **400** se o payload chegar sem `login`.

---

## 3. Hipóteses (brainstorm — não excludentes)

1. **Regra municipal:** integração NFS-e daquele município exige **portal da prefeitura**; `codigoIbge` sozinho não basta.
2. **Derivação IBGE sem credenciais:** fluxo que activa derivação preenche `prefeitura` de forma **incompleta** relativamente às regras reais da API.
3. **Cliente / formulário:** campo de login não mapeado, vazio removido na serialização, ou ramo de UI que não recolhe credenciais quando o sistema monta `nfse.config`.
4. **Regressão de merge:** normalização que altera ou remove `prefeitura.login` antes do `POST` final (validar corpo **imediatamente antes** do `fetch` ao Plugnotas).

---

## 4. Implicações de produto / UX

- Se a política do produto for **não** pedir credenciais de prefeitura no fluxo MEI, então **não** basta “corrigir mensagem”: é preciso **regra explícita** — por exemplo não activar derivação que implique `prefeitura` sem credenciais, ou bloquear cadastro com mensagem guiada **antes** do upstream.
- Se a política for **permitir** credenciais quando obrigatórias, o fluxo deve **recolher e enviar** `login` / `senha` conforme contrato Plugnotas e política de segurança (armazenamento, trânsito, consentimento).

**Decisão:** cabe a **@pm** / **@po** com suporte de **@architect**; este briefing apenas documenta o problema e as opções.

---

## 5. Próximos passos sugeridos (evidência)

1. **Inspeccionar** o corpo JSON enviado ao Plugnotas no **400** (logs de cadastro empresa, se disponíveis em ambiente de desenvolvimento) — confirmar se `nfse.config.prefeitura` contém só `{ codigoIbge }` ou falta `login`.
2. **Comparar** com exemplos da [documentação PlugNotas](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest) para o mesmo tipo de cadastro.
3. **Cruzar** com [`brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](./brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md) — mesma família “**400** no POST → **404** no GET”, mas **causa** distinta (credenciais vs cadeia cadastro/consulta já abordada noutro brief).

---

## 6. Documentos relacionados

- [`brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09.md`](./brief-correcao-ibge-cidade-plugnotas-400-e-get-404-2026-04-09.md) — **outro** código **400** (tabela IBGE / `codigoCidade`).  
- [`docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md`](../adr/ADR-plugnotas-empresa-payload-apenas-nfse.md) — payload apenas NFS-e.  
- `backend/src/services/plugnotas/nfsePrefeituraPayload.js` — derivação `codigoIbge`.

---

*Brief derivado do brainstorm Atlas (@analyst); revisão técnica recomendada antes de PRD ou story.*
