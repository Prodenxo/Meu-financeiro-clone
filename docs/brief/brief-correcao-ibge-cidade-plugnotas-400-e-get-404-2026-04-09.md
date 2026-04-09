# Brief: correção planejada — **400** `endereco.codigoIBGECidade` (tabela IBGE Plugnotas) e **404** no `GET` empresa

**Data:** 2026-04-09  
**Origem:** reprodução local — `POST` e `GET` em `apiClient` (Guia MEI, cadastro empresa + certificado no emissor fiscal).

**Sintomas observados (referência):**

1. `POST /api/mei-notas/setup/emissao-fiscal/empresa` → **400 Bad Request**  
   - Mensagem (Plugnotas via BFF): *«Falha na validação do JSON de Empresa: `fields.endereco.codigoIBGECidade`: A cidade do código informado não encontrada na tabela de cidades do IBGE»*  
   - Nota: o provedor pode citar **`codigoIBGECidade`** na mensagem de erro; no payload da aplicação o campo enviado é **`endereco.codigoCidade`** (equivalente semântico no contrato de cadastro).

2. `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=…` → **404 Not Found**  
   - *«Não localizamos qualquer Empresa com os parâmetros informados: cpfCnpj: …»*

**Documentos relacionados (não substituir, apenas contextualizar):**

- [`brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](./brief-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — normalização `.trim` / tipo `number` vs `string` e `codigoCidade` no payload.  
- [`brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](./brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md) — cadeia **400 prefeitura → 404 GET** (outro código de validação; mesmo padrão “POST falha → GET sem registo”).  
- [`docs/technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](../technical/architecture-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — arquitetura FR-CID (se existir no repo).  
- Código: `frontend/src/utils/nfEmissionCompany.ts` (`buildNfEmissionEmpresaPayload`), `frontend/src/utils/ibgeMunicipioCodigo.ts`, `backend/src/services/plugnotas/empresa.service.js` (`normalizePayloadEnderecoCodigoCidade`), `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` (hints UX CID-L1).

---

## 1. Diagnóstico (causa → efeito)

### 1.1 Causa primária do **400**

O **Plugnotas** rejeita o JSON porque o valor em **`endereco.codigoCidade`** (validado internamente como cidade IBGE) **não existe na tabela de municípios que o emissor usa**. Isto é distinto de “formato” (já tratado em parte por `normalizeIbgeMunicipioCodigo` no cliente e no backend): aqui o código pode estar **bem formatado** (7 dígitos) e ainda assim **inválido para a tabela remota** — por exemplo:

- código **errado** para o município real do CNPJ (dados de origem desatualizados ou confusão entre homónimos);  
- **autopreenchimento** (Brasil API / certificado / snapshot) que associa **município errado** ao CNPJ;  
- utilizador alterou **cidade/UF** no formulário e deixou um **código IBGE que não corresponde** ao par cidade + UF;  
- diferença **rara** entre tabela oficial IBGE e a **snapshot** usada pelo Plugnotas (último recurso: suporte / doc do provedor).

### 1.2 O **404** no `GET` é efeito secundário

Enquanto o **POST** não criar a empresa, o **GET** por CNPJ continuará a devolver **404**. A correção do fluxo passa por **endereço + código IBGE coerentes e aceites pelo Plugnotas**, não por “repetir o GET”.

---

## 2. Estado actual do código (para alinhar expectativas)

- O cliente já envia `codigoCidade` via **`normalizeIbgeMunicipioCodigo`** em `buildNfEmissionEmpresaPayload` (`nfEmissionCompany.ts`).  
- O backend já aplica **`normalizePayloadEnderecoCodigoCidade`** antes do upstream (`empresa.service.js`).  

**Conclusão:** se o erro **persiste** com a mensagem da **tabela IBGE**, o trabalho seguinte é sobretudo **qualidade de dados e UX de validação**, não só “mais um `trim`”.

---

## 3. Plano de correção (prioridades sugeridas)

### P0 — Confirmação de dados no fluxo do utilizador

1. **Reprodução com dados mínimos:** anotar o **código IBGE de 7 dígitos** enviado no corpo do `POST` (DevTools → payload) e confrontar com a [consulta oficial IBGE](https://www.ibge.gov.br/explica/codigos-dos-municipios-do-brasil-1670360003609) ou API de municípios para a **mesma** combinação município + UF mostrada no formulário.  
2. **Traço de origem:** verificar se `codigoCidade` veio de **Brasil API** (`applyBrasilApiToEmitente`), de **snapshot** pós-certificado, ou **manual** — e se `descricaoCidade`/`estado` foram editados depois sem atualizar o código.

### P1 — UX e validação antes do `POST`

1. **Reforçar mensagens** já previstas para padrão CID (tabela IBGE): garantir que `FiscalIntegrationErrorAlert` / painel de cadastro mostram o hint **FR-CID-UX-02** quando a mensagem citar `codigoIBGECidade` ou “tabela de cidades” (ajustar detecção em `nfseNacionalPlugnotasErrorHints.ts` se o texto novo não for captado).  
2. **Validação de coerência (opcional, produto):** se existir lista de municípios no projeto ou API leve, validar **UF + nome (ou CEP) ↔ código IBGE** antes de submeter; caso contrário, mensagem explícita: “Confirme o código de 7 dígitos na consulta IBGE”.  
3. **Ligação ao guia:** manter ponte para o guia de operação fiscal já referido na UI quando o erro for de IBGE.

### P2 — Backend / observabilidade

1. **Log estruturado** (sem PII excessivo): em falhas 400 que mencionem IBGE/cidade, registar **comprimento do código** e **hash ou últimos dígitos do CNPJ** para suporte — útil a comparar ambientes.  
2. **Contrato:** confirmar com documentação Plugnotas se o campo oficial continua a ser **`codigoCidade`** e se **`codigoIBGECidade`** é apenas nome interno na mensagem de erro (evitar duplicar campos no JSON).

### P3 — Se após P0–P2 o 400 continuar com código “correcto” oficial

1. Abrir **ticket / evidência** junto do **Plugnotas** (código IBGE + ambiente + id de conta) — possível desfasamento de tabela no lado deles.  
2. Registar conclusão em ADR ou evidência em `docs/evidence/`.

---

## 4. Critérios de aceite

- [ ] Utilizador consegue **corrigir** cidade/código com instrução clara quando o 400 citar tabela IBGE (sem confundir com erro de prefeitura `nfse.config.prefeitura`).  
- [ ] O **POST** passa a **2xx** quando o código IBGE corresponde ao município do endereço e é aceite pela tabela do emissor (cenário feliz reprodutível em teste).  
- [ ] O **GET** `empresa?cpfCnpj=` passa a **200** **após** cadastro bem-sucedido (ou documentar excepção se a API for eventualmente assíncrona).  
- [ ] Testes: unitários para **detecção de hint** com substring `codigoIBGECidade` na mensagem; regressão `buildNfEmissionEmpresaPayload` inalterada salvo novas regras de validação.

---

## 5. Riscos e não-objectivos

- **Não-objectivo:** substituir a tabela IBGE do Plugnotas no nosso backend sem requisito explícito de produto (custo de manutenção de base completa).  
- **Risco:** validação local com lista desatualizada pode **piorar** UX; preferir fonte mantida ou validação “soft” (aviso, não bloqueio) até haver dataset acordado.

---

*Brief de planeamento para alinhar @dev / @qa / PO; stories canónicas em `docs/stories/` quando existirem itens explícitos para este tema.*
