# Brief: resolver **400** de cadastro empresa Plugnotas — `nfse.config.prefeitura` vs payload actual (Guia MEI)

**Data:** 2026-04-08  
**Origem:** incidente real em produção — `POST …/setup/emissao-fiscal/empresa` devolve **400** com mensagem do provedor no sentido de **`fields.nfse.config.prefeitura: Preenchimento obrigatório`**, mesmo quando o utilizador preenche **inscrição municipal** no formulário do site.  
**Produto:** Meu Financeiro — Guia MEI / certificado + cadastro empresa no Plugnotas (`POST /empresa`).

**Documentos relacionados (não substituídos por este brief):**

- `docs/brief/brief-nfse-nacional-sem-im-prefeitura-2026-04-08.md` — intenção de produto “modo nacional” sem IM/prefeitura no fluxo MEI.  
- `docs/prd/PRD-nfse-nacional-sem-im-prefeitura-mei-2026-04-08.md` — **FR-NAT-*** e **NFR-N04**.  
- `docs/operacao-mei-nfse.md` — secção nacional vs municipal e erros típicos.  
- `frontend/src/utils/nfEmissionCompany.ts` — `buildNfEmissionEmpresaPayload` (`nfse.config` mínimo `{ producao: true }`, `nacional: true`; `inscricaoMunicipal` opcional na raiz quando preenchida).  
- `backend/src/services/plugnotas/plugnotas-empresa-documentos-ativos.js` — montagem de `nfse` no `POST` após selecção de documentos activos.  
- `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` — classificação de mensagens municipais (incl. `nfse.config.prefeitura`).

**Próximos donos típicos:** `@pm` — decisão de produto (quando obrigar colecta municipal explícita vs. contas só nacionais); `@architect` — contrato JSON e mapeamento IBGE → `prefeitura`; `@dev` — campos UI / BFF / testes de contrato; `@qa` — matriz de erros e regressão; operação — evidência redigida com suporte Plugnotas.

---

## 1. Resumo executivo

O validador do **Plugnotas** (mensagem propagada pelo backend) está a exigir **`nfse.config.prefeitura`**, não apenas **`inscricaoMunicipal`** ao nível da empresa.

- **`inscricaoMunicipal`** e **`nfse.config.prefeitura`** são **campos distintos** no modelo mental da API: o primeiro identifica o número de inscrição; o segundo refere-se à **configuração de prefeitura/provedor municipal** dentro do bloco **`nfse.config`** (estrutura própria do emissor, não substituível pelo número de IM na raiz).

Enquanto o `POST /empresa` enviado pela app **não** incluir o objecto/campos que o Plugnotas espera em **`nfse.config.prefeitura`** (ou enquanto a **conta/ambiente** não deixar de exigir esse ramo na validação), o cadastro **continuará a falhar** com o mesmo 400, **independentemente** da IM opcional no formulário.

Este brief define **o problema em termos de payload**, **hipóteses de causa**, **descoberta necessária** e **opções de resolução** para @pm/@architect encadearem PRD/story.

---

## 2. Sintoma e evidência

| Item | Detalhe |
|------|---------|
| **Endpoint app** | `POST /api/mei-notas/setup/emissao-fiscal/empresa` (ou equivalente BFF) |
| **HTTP** | 400 |
| **Mensagem típica** | `Falha na validação do JSON de Empresa: fields.nfse.config.prefeitura: Preenchimento obrigatório` |
| **Efeito secundário** | `GET …/empresa?cpfCnpj=…` → **404** (“empresa não localizada”) porque o **POST nunca criou** o registo |
| **Confusão UX** | Texto “inscrição municipal opcional” **não** implica que **`nfse.config.prefeitura`** esteja preenchido no JSON |

---

## 3. Análise técnica (causa raiz provável)

1. **Payload actual (referência de código):** `nfse` inclui `config: { producao: true }` e chave nacional (`nacional: true`), **sem** `prefeitura` dentro de `config`.  
2. **Validação remota:** o esquema ou regra aplicada à conta/CNPJ/ambiente **marca `nfse.config.prefeitura` como obrigatório** — cenário típico de **NFS-e municipal** ou de **conta ainda não totalmente em modo nacional** na API, apesar do produto enviar `nacional: true` (**NFR-N04**).  
3. **`inscricaoMunicipal` na raiz:** útil para outros ramos de validação Plugnotas; **não satisfaz** a regra que aponta explicitamente para **`nfse.config.prefeitura`**.

---

## 4. Perguntas de descoberta (bloqueantes para fechar solução)

Responder com **doc oficial Plugnotas**, **sandbox** ou **ticket de suporte** (resposta redigida, sem PII em doc público):

1. **Formato exacto** de `nfse.config.prefeitura`: é objecto? que chaves (ex.: código IBGE, id interno Plugnotas, `codigoMunicipio`, `codigoSiafi`, etc.)?  
2. Quando **`nfse.nacional` é `true`**, a API **deveria** dispensar `prefeitura`? Se sim, que **pré-condições** (conta, plano, CNPJ pré-cadastrado no painel, ambiente homologação vs produção)?  
3. Existe **endpoint ou lista** para o utilizador/app escolher a prefeitura (lookup por município) em vez de valores “à mão”?  
4. **Compatibilidade:** enviar **simultaneamente** `nacional: true` e `config.prefeitura` preenchido é suportado ou gera conflito?

---

## 5. Opções de resolução (para @pm priorizar)

| ID | Abordagem | Prós | Contras / risco |
|----|-----------|------|------------------|
| **A — Conta / provedor** | Garantir no **painel Plugnotas** + **suporte** que o CNPJ está em **NFS-e Nacional** de forma que a **API** não exija `prefeitura` neste `POST`. | Zero mudança de payload se a causa for só configuração de conta. | Depende de terceiros; pode não ser possível para todos os CNPJs. |
| **B — Derivação automática** | A partir de **`endereco.codigoCidade` (IBGE)** + regras acordadas, o **backend** monta **`nfse.config.prefeitura`** mínimo aceite pela API. | UX continua “sem campo prefeitura” se a derivação for fiável. | Risco alto sem schema oficial; municípios/provedores podem exigir ids específicos. |
| **C — Campos explícitos (opcional ou condicional)** | Novos campos UI (ou JSON avançado) para **`nfse.config.prefeitura`** quando a API exigir; validação local antes do `POST`. | Alinha expectativa utilizador ↔ payload; desbloqueia cadastros municipais. | Afasta do PRD “sem prefeitura no fluxo nacional”; exige copy clara (“só se o emissor exigir”). |
| **D — Híbrido** | Tentativa **1**: payload nacional actual; se 400 com `prefeitura`, mostrar **fluxo guiado** (B ou C) ou CTA “contactar suporte / verificar painel” conforme **FR-NAT-ERR-01**. | Melhor UX incremental. | Mais complexidade e testes. |

**Recomendação de análise:** fechar **A** com evidência (ticket) **em paralelo** com **descoberta §4**; só depois escolher **B**, **C** ou **D** com base no contrato real.

---

## 6. Critérios de aceite sugeridos (rascunho para story/PRD)

1. **Documentação:** este brief ou ADR aponta o **schema mínimo** de `nfse.config.prefeitura` **ou** regista que a API **não** exige mais esse campo para o cenário nacional acordado (com evidência).  
2. **Payload:** o `POST /empresa` gerado pelo produto **ou** satisfaz o validador Plugnotas **ou** falha com mensagem **accionável** que distingue IM raiz vs `nfse.config.prefeitura` (sem culpar o utilizador por “falta de IM” quando o erro é `prefeitura`).  
3. **Testes:** teste de contrato (unit/integration) que cobre corpo com `prefeitura` quando a story adoptar **B/C**; regressão para modo só nacional quando **A** for a solução.  
4. **Operação:** entrada em `docs/operacao-mei-nfse.md` (ou equivalente) com passos para 400 `nfse.config.prefeitura` + link a este brief.

---

## 7. Fora de escopo (neste brief)

- Alterar provedor fiscal (sair do Plugnotas).  
- Garantia legal de emissão autorizada em todos os municípios.  
- Implementação concreta de código (fica para story @dev após decisão @pm).

---

## 8. Rastreabilidade

| Artefacto | Ligação |
|-----------|---------|
| Erro observado | `nfse.config.prefeitura` obrigatório no JSON de empresa |
| PRD existente | NFS-e nacional sem IM/prefeitura no fluxo — tensão com **NFR-N04** |
| Este brief | Fecha lacuna **payload** IM ≠ `prefeitura` em `nfse.config` |

---

*Brief gerado para apoio a decisão produto/arquitetura; não substitui PRD nem story implementada.*
