# Brief: cadastro Plugnotas em modo **NFS-e Nacional** (sem inscrição municipal / prefeitura no fluxo MEI)

**Data:** 2026-04-08  
**Origem:** necessidade de produto — o utilizador pretende **NFS-e Nacional** (painel Plugnotas: *“Ativar emissão de NFS-e Nacional”*), **não** o modelo clássico de NFS-e municipal que exige **inscrição municipal** e **`nfse.config.prefeitura`**.  
**Produto:** Meu Financeiro — Guia MEI / setup emissão fiscal (certificado A1 + `POST /empresa` no Plugnotas).

**Documentos relacionados (não substituídos por este brief):**

- `docs/adr/ADR-plugnotas-nfse-nacional-empresa-spike.md` — spike NAT-01 + contrato adoptado no código (`nfse.nacional`, **US-MEI-NAT-02**).  
- `docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md` — política “apenas NFS-e”, blocos `nfe`/`nfce` inativos.  
- `docs/operacao-mei-nfse.md` — operação, variáveis e âncoras NFS-e Nacional.  
- `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload` (já inclui `nfse.nacional: true` por defeito).  
- `backend/src/services/plugnotas/empresa.service.js` — normalização `POST`/`PATCH` empresa.  
- `frontend/src/utils/nfEmissionCompany.test.ts` — expectativa explícita de **não** enviar `inscricaoMunicipal` no payload canónico.

**Próximos passos típicos:** `@pm` — critérios de aceite e mensagens de erro; `@architect` — fecho de contrato com doc/suporte Plugnotas se a API continuar a exigir campos municipais; `@dev` — UI/copy e eventual ramificação de payload; `@qa` — regressão cadastro + resposta 400 municipal vs nacional.

---

## 1. Resumo executivo

O **objectivo de negócio** é que o utilizador MEI configure emissão alinhada ao **ambiente NFS-e Nacional**, reflectindo o toggle do painel Plugnotas, **sem** ser forçado a preencher **inscrição municipal** nem seleccionar **prefeitura** no produto — campos típicos do fluxo **NFS-e municipal**.

**Sintoma observado:** o provedor pode devolver validação do tipo *`inscricaoMunicipal` obrigatório* e *`nfse.config.prefeitura` obrigatório* no `POST /empresa`, mesmo quando no painel Plugnotas a **NFS-e Nacional** está activa. Isso pode indicar **desalinhamento** entre (a) o que o painel mostra, (b) o JSON efectivamente aceite pela API na conta/ambiente, e (c) expectativas do utilizador.

**Estado no repositório (referência):** o frontend já envia `nfse` com `nacional: true` por defeito e o backend reforça defaults em política MEI; os testes do payload **não** incluem `inscricaoMunicipal`. O brief pede **fecha de produto + verificação de integração** para sustentar o comportamento “só nacional” de ponta a ponta.

---

## 2. Problema / oportunidade

| Dimensão | Situação | Risco ou oportunidade |
|----------|----------|------------------------|
| **Expectativa do utilizador** | Quer **NFS-e Nacional** como modo principal; associa isso a **menos** dados municipais. | Frustração e abandono se o erro insistir em IM/prefeitura. |
| **Validação Plugnotas** | Mensagens 400 podem exigir campos **municipais** ainda listados como obrigatórios no contrato remoto. | Bloqueio de `POST /empresa` até haver **payload correcto** ou **adesão/habilitação** no lado Plugnotas/conta. |
| **Paridade UI ↔ API** | Painel mostra “NFS-e Nacional” activo; o JSON pode precisar de **combinación exacta** de chaves (ex.: `nfse.nacional` + estrutura de `config`) não documentada publicamente de forma citável. | Risco técnico residual já assinalado no ADR (**NFR-N04**). |
| **Copy e formulários** | Campos ou textos que **pressionam** IM/prefeitura sem distinção “municipal vs nacional” confundem. | Clarificar no produto qual modo está activo e o que é obrigatório **neste** modo. |

---

## 3. Objectivos

1. **Produto:** comunicar e implementar o fluxo como **NFS-e Nacional por defeito** para o escopo MEI suportado, coerente com o toggle Plugnotas descrito pelo utilizador.  
2. **Payload:** garantir que o `POST /empresa` (e `PATCH` quando aplicável) enviado pelo app está **consistente** com o modo nacional — mantendo ou ajustando `nfse` (`nacional`, `config`, `ativo`, `tipoContrato`) **após** confirmação com **documentação oficial, suporte ou sandbox** quando a API rejeitar o corpo actual.  
3. **UX:** não **exigir** inscrição municipal nem seleção de prefeitura no formulário do site **quando** o modo acordado for unicamente NFS-e Nacional; se algum campo for inevitável por conta do contrato remoto, tratar como **excepção documentada** (mensagem dirigida + acção), não como regra genérica MEI.  
4. **Erros:** melhorar mensagens quando o Plugnotas responder com exigência municipal (ligação a `nfseNacionalPlugnotasErrorHints` / operações), orientando conta no painel, suporte Plugnotas ou revisão de payload.  
5. **Prova:** evidência em sandbox ou produção (request/response **redigidos**) registada no ADR ou ticket, fechando o gap **NFR-N04** quando possível.

---

## 4. Fora de âmbito (sugerido; validar com PO)

- Substituir o motor fiscal ou mudar de provedor.  
- Garantir autorização de emissão real (depende de legislação, adesão municipal/nacional e credenciamentos externos).  
- Implementação completa de NFS-e **municipal** com matriz de todas as prefeituras (salvo decisão explícita de produto).

---

## 5. Decisões em aberto (críticas)

1. **Contrato API Plugnotas:** com `nfse.nacional: true`, a API **deixa** de exigir `inscricaoMunicipal` e `nfse.config.prefeitura` em **todos** os ambientes/contas, ou existe **condição** (plano, habilitação, CNPJ, município)?  
2. **Shape de `nfse.config`:** o objecto `{ producao: true }` é suficiente para nacional, ou o provedor espera **omitir** `prefeitura` explicitamente / outro campo (`emissaoNacional`, etc.)? **Não inventar chaves** sem evidência (ver ADR § *Evidências aceitáveis*).  
3. **Fallback:** se o modo nacional **não** estiver disponível na conta, o produto bloqueia com explicação ou oferece **modo municipal** opcional (fora do pedido actual — requer decisão).  
4. **Sincronização painel ↔ app:** após cadastro pelo site, validar no painel Plugnotas que **NFS-e Nacional** reflecte o esperado; definir quem é fonte da verdade em conflito (reconciliação `GET /empresa`).

---

## 6. Critérios de aceite (proposta)

1. Utilizador conclui **certificado + empresa** sem ser obrigado a **inscrição municipal** nem **prefeitura** no formulário, **desde que** o contrato Plugnotas/conta permita NFS-e Nacional com o payload acordado.  
2. O payload enviado ao `POST /empresa` inclui a política **NFS-e Nacional** documentada (`nfse.nacional` ou ajuste formalmente aprovado) e permanece alinhado aos testes de contrato existentes, actualizados se o contrato mudar.  
3. Respostas 400 que mencionem IM/prefeitura geram **mensagem acionável** (retry, verificar painel, contactar suporte, link para doc interna).  
4. documentação operacional (`docs/operacao-mei-nfse.md`) menciona explicitamente o modo **NFS-e Nacional** e a distinção face ao fluxo municipal.

---

## 7. Riscos

- **NFR-N04 / FR-NA02:** contrato `nfse.nacional` adoptado no código sem chave oficial citável na documentação pública — pode divergir por versão de API ou conta.  
- **Regressão:** alteração em `nfse.config` que reintroduza validação SEFAZ ou campos municipalizados indevidamente.  
- **Conta Plugnotas:** limitações comerciais ou de habilitação que impossibilitem nacional para determinados emitentes.

---

## 8. Referência do erro de utilizador (contexto)

Falha relatada no cadastro (validação no provedor): obrigatoriedade de **`inscricaoMunicipal`** e **`nfse.config.prefeitura`** no `POST /empresa`. Este brief trata essa exigência como **incompatível com o objectivo “só NFS-e Nacional”** até prova de contrário via API/conta, e pede **actualização alinhada** (payload + produto + prova).

---

## Change log

| Data | Nota |
| --- | --- |
| 2026-04-08 | Versão inicial do brief (pedido: NFS-e Nacional sem IM/prefeitura no fluxo). |
