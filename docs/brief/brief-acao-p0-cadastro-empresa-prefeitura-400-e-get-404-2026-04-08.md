# Brief de ação (P0): corrigir cadastro empresa — **400** `nfse.config.prefeitura` e cadeia **404** no `GET`

**Data:** 2026-04-08  
**Estado:** problema **persistente** — melhorias de UX/copy/classificação de erro **não** eliminam a falha; o **POST** continua rejeitado pelo Plugnotas e o fluxo subsequente continua a ver **404** na consulta.

**Pedido:** dar seguimento **operacional** até o utilizador conseguir **criar** a empresa no emissor (2xx no `POST`) e, em consequência, **consultar** sem 404 quando o CNPJ existir na conta.

---

## 1. Evidência actual (reprodutível)

| Passo | Pedido | Resultado |
|-------|--------|-------------|
| Cadastro empresa | `POST /api/mei-notas/setup/emissao-fiscal/empresa` | **400** — `message`: `Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório` |
| Consulta após falha | `GET /api/mei-notas/setup/emissao-fiscal/empresa?cpfCnpj=46891823000155` (exemplo) | **404** — empresa não encontrada no Plugnotas para o CNPJ |

**Stack de referência (frontend):** `apiClient` → `meiNotasService.consultarEmpresaEmissaoNf` → `GuidesMei.tsx` / `guiaMeiEmpresaGetCache.ts` → `handleCertificateUpload` (upload de certificado dispara reconciliação/consulta).

**Contrato actual enviado pela app (resumo):** em `frontend/src/utils/nfEmissionCompany.ts`, `buildNfEmissionEmpresaPayload` monta `nfse` com `config: { producao: true }`, **`sem`** `prefeitura`, e `nacional: true`. A validação remota, para a conta/CNPJ/ambiente em causa, **exige** `nfse.config.prefeitura` — logo o corpo **não** passa.

---

## 2. Porque “ainda não está consertado”

1. **Causa raiz técnica** não foi **fechada**: ou o Plugnotas deixa de exigir `prefeitura` (conta/config **A**) ou a app passa a enviar o ramo **`nfse.config.prefeitura`** no formato aceite (**B/C/D**). Até lá, o 400 é **determinístico**.
2. O **404** no `GET` é **efeito** do POST falhar (não há empresa criada). Tratar só o 404 ou só a mensagem de erro **não** resolve o bloqueio de cadastro.
3. **`inscricaoMunicipal` na raiz** (quando preenchida) **não** substitui `nfse.config.prefeitura` no modelo de validação reportado.

Documentação de contexto já existente (manter como anexo, não repetir):  
[`brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md`](./brief-solucao-400-prefeitura-e-404-get-empresa-2026-04-08.md), [`brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md`](./brief-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08.md), [`brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md`](./brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md).

---

## 3. Decisão bloqueante (@pm / arquitetura)

Escolher **um** trilho principal (pode combinar A + implementação):

| Trilho | Acção | Critério de sucesso |
|--------|--------|---------------------|
| **A — Conta Plugnotas** | Confirmar no painel + ticket suporte: com **NFS-e Nacional** activo para o CNPJ, a API **não** deve exigir `nfse.config.prefeitura`; corrigir habilitação/ambiente se for o caso. | **POST** passa **sem** novo campo no JSON; evidência (ticket/resposta redigida) arquivada. |
| **B — Payload derivado** | Backend (ou BFF) preenche `nfse.config.prefeitura` a partir de `endereco.codigoCidade` + **schema oficial** acordado com Plugnotas. | **POST** 2xx com payload canónico documentado em ADR ou story. |
| **C — UI explícita** | Formulário ou passo guiado para dados mínimos de `nfse.config.prefeitura` quando a API exigir. | Utilizador consegue completar cadastro sem depender só de “nacional: true”. |
| **D — Híbrido** | Retry/fluxo após 400 `prefeitura` → painel + subfluxo B ou C. | Reduz abandono; testes cobrem ramos. |

**Sem** fechar **A** (evidência) **ou** **schema de `prefeitura`** (B/C), qualquer patch “no escuro” arrisca **NFR-N04** (contrato não citável) e regressões por município.

---

## 4. Plano de execução sugerido (ordem)

1. **Spike bloqueante (0,5–2 dias):** obter da Plugnotas (doc/sandbox/ticket) o **formato mínimo** de `nfse.config.prefeitura` **e** a regra: com `nfse.nacional: true`, o campo é obrigatório ou dispensável **e em que condições**. Responsável: **@architect** + operação/conta.  
2. **Se A:** executar checklist painel + ambiente (homologação vs produção) e re-testar **POST** com payload actual. Se passar, fechar com nota no ADR / `docs/operacao-mei-nfse.md`.  
3. **Se não A:** story **@dev** — implementar **B** ou **C** (ou **D**) com testes de contrato em `nfEmissionCompany.test.ts` / serviço Plugnotas empresa / integração mockada.  
4. **@qa:** matriz — POST sucesso, GET 200, regressão “só nacional” quando A for a solução; fluxo municipal quando C for adoptado.

---

## 5. Definição de pronto (mensurável)

- [ ] `POST /api/mei-notas/setup/emissao-fiscal/empresa` retorna **2xx** para o CNPJ de teste acordado (ou documentação explícita de **impossibilidade** na conta + mensagem de produto que não promete cadastro automático).  
- [ ] Após sucesso do POST, `GET …/empresa?cpfCnpj=` deixa de ser **404** para esse CNPJ (quando existir na mesma conta/ambiente).  
- [ ] Registo único (story fechada + ADR ou linha em `docs/operacao-mei-nfse.md`) com: trilho escolhido (A–D) e schema ou ticket de referência **sem PII**.

---

## 6. Riscos se não houver acção

- Utilizadores bloqueados **após certificado** no Guia MEI (mesma cadeia que `handleCertificateUpload`).  
- Desgaste de suporte: “já melhorámos o texto do erro” mas o cadastro **nunca** completa.  
- Tensão permanente com PRD “NFS-e nacional sem prefeitura na UI” até **A** estar provado ou **B/C** aceites explicitamente.

---

## Change log

| Data | Nota |
|------|------|
| 2026-04-08 | Brief de **ação P0** após constatação de que o erro permanece; foco em fecho de contrato + implementação, não só diagnóstico/UX. |
