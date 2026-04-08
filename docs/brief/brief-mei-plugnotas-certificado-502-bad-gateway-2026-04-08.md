# Brief: **502 Bad Gateway** no `POST …/certificado` (Plugnotas) e **404** esperado no `GET …/empresa`

**Data:** 2026-04-08  
**Origem:** desenvolvimento local — consola do browser e UI Guia MEI após envio de certificado A1.

**Evidência (Network / corpo JSON do BFF):**

1. `POST http://localhost:3000/api/mei-notas/setup/emissao-fiscal/certificado` → **502** `Bad Gateway`, `content-type: application/json`, corpo com `success: false` e `message` contendo **HTML** (`<title>502 Bad Gateway</title>`, corpo típico de proxy/nginx ou camada intermédia), não JSON de validação Plugnotas.
2. `GET http://localhost:3000/api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=…` → **404** com mensagem do tipo *«Não localizamos qualquer Empresa com os parâmetros informados»* (resposta alinhada ao Plugnotas quando **não há** cadastro de empresa para aquele CNPJ na conta/ambiente).

**Documentos relacionados (não substituídos por este brief):**

- `docs/operacao-mei-nfse.md` — fluxo certificado → empresa, troubleshooting e variáveis `PLUGNOTAS_*`.  
- `docs/technical/architecture-empresa-plugnotas-orquestrada-cadastro-certificado-2026-04-07.md` — contrato BFF `POST …/certificado`.  
- `backend/src/services/plugnotas/empresa.service.js` — `requestFormData` + `parseResponsePayload` (corpo não JSON vira **string** passada a `messageFromPlugnotasPayload`).  
- `frontend/src/components/FiscalIntegrationErrorAlert.tsx` — `GuiaMeiEmpresaCadastroErrorPanel` + `LongFiscalErrorMessage` (repetição da mensagem bruta).  
- `frontend/src/lib/fiscalUserError.ts` — `mapMeiFiscalErrorToCopy` (heurísticas de copy fiscal).  
- `frontend/src/utils/isFetchConnectivityFailure.ts` / painel de conectividade certificado — padrões para **falha de rede**, não necessariamente para **502 com corpo HTML**.

**Próximos passos típicos:** `@pm` — critérios de aceite e copy estável para 502/503; `@architect` — onde normalizar (BFF vs frontend); `@dev` — implementação + testes; `@qa` — regressão (HTML não aparece como “validação JSON”).

---

## 1. Resumo executivo

O **502** no passo do **certificado** indica, na prática, que **a cadeia até ao emissor fiscal** (Plugnotas ou proxy à frente) devolveu **indisponibilidade temporária** ou **erro de gateway**, **não** uma mensagem de negócio do tipo “certificado inválido”. O corpo em **HTML** é um forte indício de resposta gerada por **balanceador / API gateway / nginx**, não pelo JSON habitual de validação do Plugnotas.

O **404** no `GET …/empresa` **não é**, por si só, um segundo bug: se o certificado **não** foi aceite/registado com sucesso (porque o passo anterior falhou com 502), é **esperado** que ainda **não exista** empresa cadastrada para o CNPJ nessa conta — a UI ou o utilizador podem consultar de seguida e receber “não localizamos empresa”.

**Correcção em duas frentes:** (1) **Operacional** — ambiente, URL, chave, estado do sandbox/provedor, repetir mais tarde; (2) **Produto/engineering** — **não** mostrar HTML bruto como se fosse “validação ou rejeição no provedor”; mapear 502/503 + corpo HTML para **copy humana** e, se aplicável, painel de **indisponibilidade / tente mais tarde**, distinto de erros 400 de validação.

---

## 2. Cadeia técnica (porque a UI mostra HTML)

| Passo | O que acontece |
|--------|----------------|
| 1 | O backend chama o Plugnotas `POST /certificado` (multipart) via `requestFormData` em `empresa.service.js`. |
| 2 | A resposta HTTP vem com **status 502** e **corpo text/html** (ou texto que não é `application/json`). |
| 3 | `parseResponsePayload` trata como texto; `messageFromPlugnotasPayload` / `buildErrorMessageFromBody` acabam por expor **essa string inteira** como `message`. |
| 4 | O BFF devolve JSON ao frontend com `message: '<html>…502 Bad Gateway…</html>'` e status **502**. |
| 5 | O frontend classifica como erro do **provedor fiscal** e mostra título do tipo *“Validação ou rejeição no provedor”* + **bloco longo** com o HTML — **desalinhado** com a natureza do erro (indisponibilidade / gateway). |
| 6 | O **rodapé** genérico que fala em *“validação de JSON, campos fiscais…”* reforça a **má interpretação**: 502 HTML **não** é validação de payload. |

---

## 3. Diagnóstico operacional (o que verificar primeiro)

1. **`PLUGNOTAS_API_BASE_URL`** e **`PLUGNOTAS_API_KEY`** — mesma **conta** e mesmo **ambiente** (sandbox vs produção); URL acessível a partir da máquina onde corre o backend.  
2. **Estado do serviço Plugnotas / sandbox** — incidentes, manutenção, limites de taxa; repetir o envio **após alguns minutos**.  
3. **Rede local** — VPN, proxy corporativo, firewall a bloquear o host do emissor.  
4. **Não confundir** o 404 do `GET empresa` com falha de CNPJ “errado” **antes** de confirmar que o **certificado** foi concluído com **2xx** nesse ambiente.

---

## 4. Correcção de produto / engenharia (recomendada)

### 4.1 Backend (BFF / serviço Plugnotas)

- Ao receber resposta **502, 503, 504** (e opcionalmente **502** com corpo que começa por `<` ou contém `Bad Gateway` / `Gateway Timeout`):  
  - **Substituir** a `message` exposta ao cliente por texto **estável em português**, por exemplo: *«O emissor fiscal não está a responder neste momento (erro temporário no servidor). Tente de novo dentro de alguns minutos. Se persistir, confirme a URL e a chave de API no servidor ou contacte o suporte do emissor.»*  
  - Preservar detalhe técnico **só** em log redigido (`status`, `content-type`), **não** o HTML completo na resposta JSON ao browser.  
- Opcional: campo `errors.plugnotasUpstreamStatus` ou `errors.fiscalErrorCode` estável (`plugnotas_gateway_502`) para o frontend ramificar copy sem inspeccionar HTML.

### 4.2 Frontend

- Em `mapMeiFiscalErrorToCopy` (ou camada equivalente): se `rawMessage` contiver **marcas de HTML** (`<html`, `<title>502`, `Bad Gateway`) **ou** `status === 502` com mensagem não fiscal → **título/copy** de **indisponibilidade / gateway**, não *“validação no provedor”*.  
- Evitar que `LongFiscalErrorMessage` repita **duas vezes** o mesmo bloco HTML; para estes casos, preferir **uma** linha amigável + detalhe colapsável mínimo ou omitir detalhe técnico.  
- Reutilizar ou alinhar com o padrão **US-CONN-MEI-03** (conectividade) quando fizer sentido para **certificado** + **502**.

### 4.3 Documentação

- Acrescentar em `docs/operacao-mei-nfse.md` um bullet: **502/503 no POST certificado** = indisponibilidade ou gateway; checklist (URL, chave, ambiente, repetir mais tarde); **404 GET empresa** após falha de certificado = esperado até cadastro bem-sucedido.

---

## 5. O que **não** é prioridade para “corrigir” primeiro

- Tratar o **404** do `GET empresa` como bug **antes** de o fluxo de certificado devolver **sucesso** — é consequência natural do passo 1 falhar.  
- Assumir que o HTML 502 é “mensagem do Plugnotas” de validação — é, na maior parte dos casos, **camada intermédia** ou **sobrecarga**, não rejeição de .pfx.

---

## 6. Critérios de aceite sugeridos (para story derivada)

1. Utilizador **não** vê página HTML completa na área principal do alerta quando o BFF devolve 502 com corpo HTML do upstream.  
2. Copy e título refletem **indisponibilidade temporária** / **gateway**, não “validação JSON”.  
3. Testes unitários: entrada `message` com snippet `502 Bad Gateway` + HTML → copy mapeada estável; status 502 sem HTML → mesmo tratamento.  
4. Regressão: **400** com JSON Plugnotas real continua a mostrar fluxo actual de validação.

---

## 7. Rastreabilidade

| Tema | ID sugerido |
|------|-------------|
| Normalização mensagem 502/HTML certificado | FR-MEI-CERT-GW-01 (ou story única “Gateway Plugnotas”) |
| Copy / título fiscal | FR-UX-FISC-GW-01 |
| Documentação operação | NFR-DOC-MEI-01 |

---

*Brief — Meu Financeiro / Guia MEI / integração Plugnotas.*
