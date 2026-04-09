# Brief: **addCompany (Plugnotas)** ↔ cadastro **CNPJ / empresa** na **Guia MEI**

**Data:** 2026-04-09  
**Origem:** análise de descoberta (brownfield) — alinhamento documentação oficial Plugnotas ↔ implementação Meu Financeiro.  
**Produto:** Meu Financeiro — rota **Guia MEI** (`GuidesMei.tsx`), setup **emissão fiscal** (certificado A1 + emitente no **Plugnotas**).

**Documentos relacionados (não substituídos por este brief):**

- [Plugnotas — Empresa / addCompany](https://docs.plugnotas.com.br/#tag/Empresa/operation/addCompany) — operação OpenAPI equivalente a **POST `/empresa`**.  
- `docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` — requisito de produto e definição de escopo.
- `docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md` — narrativa UX, copy e comportamento de retry parcial.
- `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` — decisão técnica, fronteiras BFF e política de fallback.
- `docs/operacao-mei-nfse.md` — fluxo operacional MEI/NFS-e (quando existir no repo).  
- `docs/brief/brief-empresa-plugnotas-orquestrada-no-cadastro-certificado-2026-04-07.md` — contexto de orquestração certificado → empresa.  
- `backend/src/services/plugnotas/empresa.service.js` — `cadastrarEmpresaPlugNotas`, políticas de payload e conflito → atualização.  
- `frontend/src/utils/plugnotasEmitenteSetup.ts` — sequência canónica **certificado → empresa** (`FR-ORQ-CERT-02`).  
- `frontend/src/pages/GuidesMei.tsx` — UI, fases `certificado` / `empresa`, retry e mensagens de erro fiscal.

**Próximos passos típicos (conforme tipo de pedido):** paridade campo a campo com OpenAPI → `@architect` + `@dev`; PRD/priorização → `@pm`; story/sprint → `@sm`; QA de regressão → `@qa`.

---

## 0. Resumo para stakeholders internos

- **O que já existe hoje:** a **Guia MEI** já suporta o caso de uso **`addCompany`** do Plugnotas por composição de **certificado -> empresa**.
- **Como isso aparece no produto:** para o utilizador final, a app fala em **cadastro no emissor** ou **configuração fiscal**; a UI não precisa expor o termo `addCompany`.
- **Equivalência técnica:** o frontend envia os dados ao BFF e o backend materializa o cadastro via **`POST /empresa`** no Plugnotas.
- **Retry parcial:** se o certificado for aceite e a fase empresa falhar, o produto já suporta **repetir só o registo da empresa** sem novo upload de certificado.
- **O que isto não implica:** não há requisito atual para criar uma nova rota visual “addCompany” nem para permitir integração direta **browser -> Plugnotas**.

Se surgir dúvida de roadmap, suporte ou onboarding, use este brief como ponteiro curto e confirme o detalhe nos artefatos canônicos de PRD, UX e arquitetura listados acima.

---

## 1. Resumo executivo

A documentação Plugnotas descreve a criação de empresa com a operação **addCompany**. Na API REST do provedor, isso corresponde ao **POST `/empresa`** com o corpo da empresa (CNPJ, vínculo ao certificado, endereço, configurações NFSe, etc.).

No **Meu Financeiro**, esse cadastro **já está integrado** na jornada da **Guia MEI**, na zona de configuração fiscal onde o utilizador informa o **CNPJ** e demais dados do emitente: o frontend não chama o Plugnotas diretamente; envia o payload ao **BFF** (`POST /mei-notas/setup/emissao-fiscal/empresa`), que por sua vez invoca `cadastrarEmpresaPlugNotas` → **POST `/empresa`** no host configurado (`PLUGNOTAS_API_BASE_URL`).

**Conclusão:** não é necessário “inventar” uma nova rota só para addCompany — o fluxo atual **é** o encadeamento de cadastro de empresa no Plugnotas, precedido pelo upload do certificado quando aplicável.

---

## 2. Mapeamento documentação ↔ código

| Documentação Plugnotas | Implementação (referência) |
|--------------------------|----------------------------|
| **addCompany** (tag Empresa) | `requestJson('POST', '/empresa', payload)` em `cadastrarEmpresaPlugNotas` (`empresa.service.js`). |
| Corpo da empresa (CNPJ, certificado, endereço, NFSe…) | Payload montado no fluxo da Guia MEI + normalização no BFF (`normalizePayloadEnderecoCodigoCidade`, políticas de prefeitura/IBGE, `documentosAtivos`, etc.). |
| Conflito / empresa já existente | Tratamento em `cadastrarEmpresaPlugNotas`: em erro tipo conflito, tentativa de **atualização** via fluxo de `PATCH` documentado no mesmo serviço. |

---

## 3. Fluxo ponta a ponta (síntese)

1. **UI** (`GuidesMei`): utilizador completa dados (incluindo **CNPJ**) e certificado; ação primária dispara setup fiscal em fases.  
2. **Orquestração** (`submitPlugnotasEmitenteSetup`): **POST certificado** → obtém ID → **POST empresa** com `buildCompanyPayload(certificadoId)`.  
3. **Cliente HTTP** (`meiNotasService.cadastrarEmpresaEmissaoNf`): `POST /mei-notas/setup/emissao-fiscal/empresa` com `{ payload }`.  
4. **Backend**: valida e enriquece payload; chama Plugnotas **POST `/empresa`**; devolve mensagem/cnpj ao cliente.

Em falha **após** certificado OK, o produto suporta **retry** apenas da fase empresa (`retryPlugnotasEmpresaRegistro`), coerente com a análise de operações parciais.

---

## 4. Riscos e verificações (não bloqueantes deste brief)

| Tema | Nota |
|------|------|
| **Paridade OpenAPI** | Garantir que campos novos/obrigatórios na doc **addCompany** continuam espelhados no payload gerado pela Guia MEI e no BFF. |
| **Ambiente** | Sandbox vs produção: `PLUGNOTAS_API_BASE_URL` e chave devem corresponder ao ambiente de teste. |
| **UX de erro** | Mensagens Plugnotas já têm heurísticas em `nfseNacionalPlugnotasErrorHints.ts` e componentes de alerta na Guia MEI — alterações de contrato do provedor podem exigir ajuste de copy/códigos. |

---

## 5. Fora de âmbito deste briefing

- Definição de **PRD** ou prioridade de roadmap.  
- Decisão de **arquitetura** (ex.: expor Plugnotas ao browser).  
- Criação de **story** ou critérios de aceite formais.

---

## 6. Histórico

| Data | Autor / ferramenta | Alteração |
|------|---------------------|-----------|
| 2026-04-09 | Atlas (@analyst) — briefing de análise brownfield | Versão inicial. |
