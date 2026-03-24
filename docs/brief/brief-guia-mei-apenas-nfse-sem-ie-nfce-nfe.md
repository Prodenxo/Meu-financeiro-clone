# Brief: Guia MEI — apenas NFS-e, sem NFC-e/NF-e e sem inscrição estadual no formulário

**Contexto:** Usuário (ex.: Leonardo Richard) no fluxo **Guia MEI → dados mínimos para emissão fiscal** (`/guias-mei`), após enviar certificado e preencher cadastro, recebe **400** no `POST /api/mei-notas/setup/emissao-fiscal/empresa`.

**Mensagem observada (Plugnotas / proxy backend):**

> Falha na validação do JSON de Empresa: **fields.nfce.config.sefaz**: Preenchimento obrigatório quando **'versaoQrCode' for igual a 2** (POST /empresa no Plugnotas)

**Pedido de produto (stakeholder):**

1. Remover opções/uso de **NFC-e** e **NF-e** na aplicação; manter **apenas NFS-e**.
2. Remover do formulário a opção de **inscrição estadual** (IE).

---

## 1. O que a evidência técnica mostra (revisão rápida do repositório)

### 1.1 O erro **não** cita inscrição estadual

O texto do provedor fala de **`nfce.config.sefaz`** condicionado a **`versaoQrCode === 2`**. Ou seja, a rejeição está no **bloco NFC-e** do JSON de empresa, não numa regra explícita “IE inválida”.

Hipótese do usuário (“é por causa da inscrição estadual”) pode ser **correlata** (ex.: combinação de dados no painel Plugnotas × payload), mas **causalidade direta** não está demonstrada só pela mensagem.

### 1.2 O app hoje **sempre envia** NF-e, NFC-e e NFS-e no cadastro da empresa

Em `frontend/src/utils/nfEmissionCompany.ts`, `buildNfEmissionEmpresaPayload` monta o payload com:

- `nfse: { ativo: true, ... }`
- `nfe: { ativo: true, ... }`
- `nfce: { ativo: true, ... }` com `config` vindo de `config/plugnotas-nfce-empresa-defaults.json` (**`versaoQrCode: 1`** no arquivo versionado).

O backend (`empresa.service.js`) ainda **força** `nfce.config.versaoQrCode === 1` em vários fluxos (alinhado a ADR / stories NFC-e).

**Discrepância possível:** se em algum cenário o corpo efetivo chegar ao Plugnotas com **`versaoQrCode: 2`** (merge, empresa já existente, outro cliente, ou regra do provedor), a API exige **`sefaz`** — daí o 400. Isso exige **confirmar o JSON real** no log do backend ou no painel Plugnotas, não só o formulário.

### 1.3 Inscrição estadual hoje

- Formulário: `NfEmissionCompanyForm.inscricaoEstadual` com validação obrigatória em `getNfEmissionCompanyValidationMessage` (“use ISENTO se isento”).
- Payload: `inscricaoEstadual: form.inscricaoEstadual.trim()` no mesmo `buildNfEmissionEmpresaPayload`.

Remover o campo da UI **sem** ajustar contrato Plugnotas pode gerar novo 400 se o provedor continuar exigindo IE no cadastro da empresa (comportamento a validar na documentação Plugnotas ou em teste sandbox).

---

## 2. Objetivo de produto (escopo desejado)

| Item | Descrição |
|------|-----------|
| **G1** | Experiência Guia MEI / emissão focada em **NFS-e** apenas (sem fluxos NF-e/NFC-e na interface relevante). |
| **G2** | **Não** solicitar IE no formulário de configuração mínima (e definir se o backend envia valor fixo, omite campo, ou obtém de outra fonte). |
| **G3** | Reduzir erros de cadastro no Plugnotas **eliminando** a necessidade de configurar blocos **nfe/nfce** se o MEI usar só serviços. |

---

## 3. Impactos e dependências (para @architect + @dev)

1. **Contrato Plugnotas `POST/PATCH /empresa`**  
   - Confirmar se é permitido `nfce.ativo: false` e `nfe.ativo: false` (ou omitir blocos) sem quebrar conta/contingência do provedor.  
   - Se o provedor **exigir** estrutura mínima, documentar o mínimo aceitável.

2. **Backend**  
   - `cadastrarEmpresaPlugNotas` / `atualizarEmpresaPlugNotas` e `enforceEmpresaNfceVersaoQrV1` assumem presença/comportamento do bloco NFC-e em vários pontos.  
   - Ajustar para modo “somente NFSe” sem regressão para quem ainda precise de NFC-e (se houver **feature flag** ou perfil, decidir com @pm).

3. **Frontend**  
   - `GuidesMei.tsx`: hoje há workspace de notas com tipos `NFSE` \| `NFE` \| `NFCE` e formulários NF-e/NFC-e.  
   - Remover ou ocultar emissão NF-e/NFC-e implica limpar rotas de UI, estado, validações e chamadas `emitirNfe` / `emitirNfce` onde aplicável.  
   - `nfEmissionCompany.ts`: tirar IE do form + validação; decidir payload (`ISENTO` fixo, `null`, ou omitir chave).

4. **Testes**  
   - `nfEmissionCompany.test.ts`, testes de `GuidesMei`, `meiNotasService`, e testes backend `plugnotas-empresa` que assertam bloco `nfce` no POST.

5. **Documentação**  
   - `docs/operacao-mei-nfse.md` e textos de ajuda na tela (“IM e IE exigidas pelo Plugnotas”) precisam ser atualizados para não contradizer o novo escopo.

---

## 4. Riscos e decisões para @pm

1. **MEI que presta serviço e também vende mercadoria** — restringir a NFS-e pode ser **insuficiente** legalmente/operacionalmente; precisa critério de produto (ex.: “este app só suporta MEI prestador de serviços”).  
2. **IE no cadastro estadual** — mesmo sem campo na UI, alguns ambientes podem exigir valor no JSON; risco de novo 400.  
3. **Empresas já cadastradas** no Plugnotas com NFC-e ativa — PATCH parcial não deve reativar regras indesejadas; definir política de migração.

---

## 5. Próximos passos sugeridos

1. **@pm** — Aprovar escopo “apenas NFS-e” e política da IE (omitir vs. valor fixo vs. opcional).  
2. **@architect** — Validar contrato Plugnotas (sandbox) para payload sem ou com `nfce`/`nfe` inativos.  
3. **@dev** — Implementar por story (frontend + backend + testes + doc), com flag se necessário para não quebrar rollout.  
4. **Suporte** — Se o 400 persistir após mudanças, capturar **body exato** enviado ao Plugnotas (sem secrets) para comparar `versaoQrCode` e `sefaz`.

---

## 6. Referências no código (para implementação)

- Payload empresa MEI: `frontend/src/utils/nfEmissionCompany.ts` (`buildNfEmissionEmpresaPayload`, `getNfEmissionCompanyValidationMessage`).  
- Defaults NFC-e: `config/plugnotas-nfce-empresa-defaults.json` + `backend/src/services/plugnotas/nfce-empresa-defaults.js`.  
- UI guia / emissão: `frontend/src/pages/GuidesMei.tsx` (`NotaDocumentType`, formulários NF-e/NFC-e/NFS-e).  
- API: `POST /mei-notas/setup/emissao-fiscal/empresa` → serviços em `frontend/src/services/meiNotasService.ts` e controllers backend `mei-notas`.

---

*Brief elaborado pelo analista para apoio a produto e engenharia; não substitui PRD nem decisão formal de arquitetura.*
