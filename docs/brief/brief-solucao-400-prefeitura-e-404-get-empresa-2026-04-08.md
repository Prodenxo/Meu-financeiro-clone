# Brief: solução para **400** `nfse.config.prefeitura` e **404** no `GET` empresa (Guia MEI / Plugnotas)

**Data:** 2026-04-08  
**Origem:** erros observados no browser / `apiClient` em desenvolvimento local.

**Sintomas reportados (referência):**

1. `POST http://localhost:3000/api/mei-notas/setup/emissao-fiscal/empresa` → **400 Bad Request**  
   - Corpo: `success: false`, `message` contendo  
     `Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório`

2. `GET http://localhost:3000/api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=46891823000155` → **404 Not Found**  
   - Corpo: *«Não localizamos qualquer Empresa com os parâmetros informados: cpfCnpj: …»*

**Documentos que este brief complementa (não os substitui):**

- [`brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](./brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — análise payload IM vs `prefeitura` e trilhos A–D.  
- [`brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`](./brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md) — intenção de produto NFS-e Nacional sem prefeitura no formulário (**NFR-N04**).  
- [`PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](../prd/PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md) — requisitos e decisões PO.  
- Código: `frontend/src/utils/nfEmissionCompany.ts` (`buildNfEmissionEmpresaPayload`), `backend/src/services/plugnotas/empresa.service.js`.

---

## 1. Diagnóstico correto (causa → efeito)

### 1.1 O **400** não é um “bug solto” do `GET`

O validador do **Plugnotas** (mensagem repassada pelo backend da app) está a recusar o corpo do **`POST /empresa`** porque, **no ambiente/conta/CNPJ em causa**, a regra remota exige **`nfse.config.prefeitura`** preenchido.

O payload canónico que a app envia hoje inclui, no bloco `nfse`, algo equivalente a:

- `config: { producao: true }` **sem** chave `prefeitura`  
- `nacional: true` (política MEI / ADR nacional)

Enquanto o contrato efectivo da API para essa conta continuar a marcar **`fields.nfse.config.prefeitura`** como obrigatório, o **POST falha** — **independentemente** de o utilizador ter preenchido **inscrição municipal** (`inscricaoMunicipal` na **raiz** do JSON). São **campos diferentes**: IM na raiz **não substitui** `nfse.config.prefeitura` (ver PRD PREF §6.3).

### 1.2 O **404** no `GET` é consequência **esperada** do POST falhado

Se o **POST** não cria a empresa no Plugnotas, o **`GET …/empresa?cpfCnpj=`** não encontra registo e devolve **404** com a mensagem de “não localizamos empresa”. **Não** tratar o 404 como falha isolada de “API de leitura”: primeiro é preciso **cadastro bem-sucedido** (POST 2xx) ou aceitar que ainda não existe empresa para aquele CNPJ na conta/ambiente.

---

## 2. Solução correcta (playbook — não é um único patch genérico)

Não existe, sem **evidência de contrato** ou **configuração de conta**, uma “única linha” garantida no código que faça o Plugnotas aceitar o JSON em **todos** os cenários. A solução correcta é **escolher um trilho** após diagnóstico:

| Ordem | Trilho | O que fazer | Quando é a solução “certa” |
|-------|--------|-------------|----------------------------|
| **1** | **A — Conta / ambiente Plugnotas** | Confirmar no **painel Plugnotas** que **NFS-e Nacional** está activo para o CNPJ; alinhar **homologação vs produção** com o `.env` da app; se necessário, **suporte Plugnotas** para a API deixar de exigir `nfse.config.prefeitura` neste modo. | Quando o problema é **desalinhamento** painel ↔ API ou conta sem habilitação nacional na ponta remota (**NFR-N04**). |
| **2** | **Descoberta obrigatória** | Obter formato oficial de **`nfse.config.prefeitura`** (doc, sandbox, ticket — resposta redigida, sem expor PII em repositório). Perguntas mínimas: estrutura exacta; se com `nacional: true` a API deveria dispensar `prefeitura` e sob que condições; lookup de prefeitura. | **Sempre** antes de implementar B/C/D “à tentativa”. |
| **3** | **B — Derivação no backend** | A partir de `endereco.codigoCidade` (IBGE) + schema acordado, montar `nfse.config.prefeitura` no servidor. | Após **B** validado com Plugnotas; aceite risco por município/provedor. |
| **4** | **C — UI / payload explícito** | Campos ou fluxo para o utilizador (ou JSON avançado) preencher o ramo `prefeitura` quando a API exigir. | Quando **A** não resolve e **B** não é fiável ou não existe API de mapeamento. |
| **5** | **D — Híbrido** | Primeiro POST com payload actual; em **400** que cite `nfse.config.prefeitura`, orientar painel/suporte ou abrir subfluxo B/C. | Melhor UX incremental; mais testes. |

**Recomendação prática:** executar **A em paralelo com descoberta (2)**. Só depois fechar **B**, **C** ou **D** em story com critérios do PRD PREF.

---

## 3. O que **não** resolve sozinho

- Preencher só **inscrição municipal** no formulário (campo raiz) **não** satisfaz `fields.nfse.config.prefeitura`.  
- Repetir o **GET** esperando 200 **antes** de um **POST** bem-sucedido — o 404 persiste enquanto não houver empresa criada.  
- Assumir que `nfse.nacional: true` no JSON **força** o servidor a ignorar `prefeitura` em **todas** as contas — a evidência em campo contradiz isso quando o 400 aparece (**tensão documentada** no brief NAT e **NFR-N04**).

---

## 4. Critérios de “problema resolvido”

1. **`POST …/emissao-fiscal/empresa`** retorna sucesso (2xx) e o Plugnotas passa a reconhecer a empresa para o CNPJ.  
2. **`GET …/empresa?cpfCnpj=`** passa a **200** com dados (ou resposta coerente de “existe cadastro”).  
3. Fica **registado** (ADR, PRD ou ticket interno) **qual** trilho (A–D) foi adoptado e, se houver mudança de payload, o **schema mínimo** de `nfse.config.prefeitura`.

---

## 5. Suporte UX (já previsto no repo)

Mensagens que citam `nfse.config.prefeitura` devem usar a variante **`prefeitura-config`** (não confundir com “falta só IM”) — ver `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`, `PlugnotasMunicipalRequirementOperacaoCopy.tsx`, story **FR-PREF P0** e `docs/operacao-mei-nfse.md` (âncora `#nfse-config-prefeitura-cadastro-pref`).

---

## Change log

| Data | Nota |
|------|------|
| 2026-04-08 | Brief de solução: encadeamento 400 `prefeitura` → 404 GET; playbook A–D; o que não resolve. |
