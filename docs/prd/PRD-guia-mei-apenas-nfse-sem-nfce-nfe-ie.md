# PRD — Guia MEI: escopo apenas NFS-e, sem NF-e/NFC-e na experiência e sem inscrição estadual no formulário

| Campo | Valor |
| --- | --- |
| **Produto** | Meu Financeiro |
| **Tipo** | Brownfield (redução de escopo fiscal no fluxo Guia MEI / mei-notas) |
| **Versão do documento** | 1.0 |
| **Data** | 2026-03-24 |
| **Autor** | Morgan (PM) |
| **Brief de entrada** | [`docs/brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md`](../brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md) |
| **PRDs relacionados** | [`PRD-guia-mei-plugnotas-jornada-fiscal.md`](./PRD-guia-mei-plugnotas-jornada-fiscal.md) (jornada diagnóstico/certificado) |

## Status

**Proposto** — depende de **validação @architect** do contrato Plugnotas (`POST/PATCH /empresa`) para payload sem NF-e/NFC-e ativos ou com blocos omitidos, e da política de **inscrição estadual** no JSON. Após aprovação técnica, priorizar com @po / backlog.

---

## 1. Goals and Background Context

### 1.1 Goals

- **G1 — Foco em NFS-e:** A experiência de **configuração inicial** e **emissão** no Guia MEI voltada ao MEI que **presta serviços** deve expor **apenas NFS-e**, sem seletores nem fluxos de **NF-e** e **NFC-e** na interface alvo.
- **G2 — Formulário sem IE:** O formulário **“Dados mínimos para emissão de notas fiscais”** não deve exigir nem exibir campo de **inscrição estadual (IE)**; o valor enviado ao Plugnotas segue **política fixa acordada** (ver §2.3 e §4).
- **G3 — Reduzir falhas de cadastro Plugnotas:** Evitar envio obrigatório de blocos **nfe/nfce** quando o produto declara suporte **somente a NFS-e**, reduzindo cenários como validação **`nfce.config.sefaz`** ligada a **`versaoQrCode`** no cadastro de empresa.
- **G4 — Clareza de posicionamento:** Comunicar ao usuário que o app, neste escopo, **não** suporta emissão de NF-e/NFC-e pelo Guia MEI (evitar expectativa incorreta para MEI que também **vende mercadoria**).

### 1.2 Background Context

Usuários no fluxo **Guia MEI** (`/guias-mei`) enviam certificado e preenchem dados da empresa; o backend chama o Plugnotas (`POST /empresa`). Foi observado **400** com mensagem do tipo:

> `fields.nfce.config.sefaz`: Preenchimento obrigatório quando `versaoQrCode` for igual a 2

O brief técnico esclarece que o problema está no **bloco NFC-e** do JSON, não numa regra explícita de IE. Hoje o código em `buildNfEmissionEmpresaPayload` envia **nfse**, **nfe** e **nfce** ativos; remover NF-e/NFC-e do escopo de produto alinha implementação à promessa “só serviço” e pode eliminar essa classe de erro para quem **nunca** usará NFC-e.

A **inscrição estadual** no formulário é hoje obrigatória na validação local; stakeholders pediram remoção do campo. Isso exige decisão sobre o **valor no payload** (omitir, constante, ou derivado), pois o Plugnotas pode continuar exigindo o campo no schema de empresa — **pré-requisito de arquitetura**.

### 1.3 Decisões de produto (PM) — registro explícito

| ID | Decisão | Detalhe |
| --- | --- | --- |
| **D-01** | Público-alvo do escopo reduzido | MEI **prestador de serviços** que emite **apenas NFS-e** pelo Meu Financeiro neste fluxo. MEI que **também comercializa mercadoria** (NFC-e/NF-e) **não** é público suportado neste PRD; orientação: usar outro canal ou produto. |
| **D-02** | NF-e e NFC-e na UI | **Remover** da Guia MEI (workspace fiscal) as opções e formulários de emissão **NF-e** e **NFC-e**; manter **apenas** fluxo **NFS-e** visível e utilizável. |
| **D-03** | IE no formulário | **Não** coletar IE na UI. Valor no JSON: **padrão proposto** — enviar **`ISENTO`** (texto) quando o MEI estiver em **Simples Nacional** e a validação Plugnotas aceitar; se @architect/sandbox indicar outro formato ou obrigatoriedade de omitir chave, seguir especificação técnica documentada em ADR ou nota em `docs/operacao-mei-nfse.md`. |
| **D-04** | Blocos nfe/nfce no `POST/PATCH /empresa` | **Meta:** `nfe` e `nfce` com **`ativo: false`** ou **omissão** dos blocos, conforme o que o Plugnotas permitir sem quebrar conta. **Não** enviar `config` NFC-e que dispare regra de `versaoQrCode`/SEFAZ se o bloco estiver inativo. |
| **D-05** | Rollout | Preferência por **mudança direta** de escopo (sem feature flag) **se** não houver clientes pagantes exigindo NF-e/NFC-e no Guia MEI; caso exista risco de regressão comercial, @po define **flag** ou **janela de comunicação**. |

### 1.4 Change Log

| Data | Versão | Descrição | Autor |
| --- | --- | --- | --- |
| 2026-03-24 | 1.0 | Versão inicial a partir do brief `brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md` | PM |

---

## 2. Requirements

### 2.1 Funcionais

- **FR-01:** O workspace de emissão no **Guia MEI** não deve apresentar escolha de tipo de documento **NF-e** ou **NFC-e**; apenas **NFS-e** permanece disponível para emissão e listagens associadas ao fluxo MEI fiscal.
- **FR-02:** O formulário de **dados mínimos da empresa** para integração Plugnotas **não** inclui campo de **inscrição estadual**; textos de ajuda não podem afirmar que o usuário deve preencher IE manualmente nesse formulário.
- **FR-03:** O payload de cadastro/atualização de empresa enviado ao Plugnotas (via backend) deve refletir **D-03** e **D-04**: IE conforme política acordada; **nfe/nfce** inativos ou ausentes conforme contrato validado.
- **FR-04:** Mensagens de erro da integração fiscal devem permanecer compreensíveis; se o Plugnotas rejeitar por IE ou por estrutura de empresa, a UI deve poder exibir a mensagem do provedor (ou mapeamento seguro) **sem** pedir IE na tela se a política for valor fixo backend.
- **FR-05:** Documentação operacional ([`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md)) deve descrever: escopo **apenas NFS-e**, ausência de campo IE na UI, política de valor IE no backend, e limitação a MEI prestador de serviços.
- **FR-06 (Could):** Página ou trecho de **FAQ** curto na Guia MEI (“Por que não vejo NF-e/NFC-e?”) com resposta alinhada a **D-01**.

### 2.2 Não funcionais

- **NFR-01:** Não expor segredos de certificado, senhas ou tokens nas mensagens de erro; manter padrões de redação já definidos no PRD da jornada fiscal.
- **NFR-02:** Testes automatizados devem cobrir novo formato de payload (frontend: `buildNfEmissionEmpresaPayload`; backend: `empresa.service` / cadastro empresa) e regressão de fluxo NFS-e.
- **NFR-03:** Compatibilidade com monorepo e gates existentes (`npm run lint`, `typecheck`, testes por workspace) após ajustes de ESLint já acordados no projeto.
- **NFR-04:** Empresas **já cadastradas** no Plugnotas com NFC-e ativa: **PATCH** não deve reintroduzir configuração NFC-e indesejada; comportamento documentado e testado com mocks.

### 2.3 Requisitos condicionados a arquitetura (gate)

- **FR-A01:** Somente após @architect documentar o **contrato efetivo** Plugnotas: formato final de `nfe`/`nfce` (omitido vs. `ativo: false`) e regra de `inscricaoEstadual` (valor fixo, opcional, ou obrigatório no schema).
- **FR-A02:** Se o sandbox **exigir** IE explícita e rejeitar `ISENTO`, **reabrir D-03** com @po (pode ser necessário campo opcional “IE” avançado ou outro canal) — o PRD assume sucesso do teste de integração **antes** de merge.

---

## 3. User Interface Design Goals

### 3.1 Visão de UX

Fluxo **mais simples**: menos campos no cadastro, uma única família de nota (NFS-e). Tom **transparente** sobre limitações (sem NF produto/consumidor no app).

### 3.2 Paradigmas de interação

- Remoção de **tabs/seletor** NF-e / NFC-e / NFS-e onde existir; **NFS-e** como único modo de emissão no contexto Guia MEI fiscal.
- Formulário de empresa: remover linha IE; revisar copy de IM e demais campos.

### 3.3 Telas / vistas nucleares

- `GuidesMei.tsx` — workspace fiscal, bloco dados mínimos, área de emissão de notas.
- Alertas de erro pós-`POST …/emissao-fiscal/empresa` (mensagens Plugnotas ainda possíveis).

### 3.4 Acessibilidade

Manter **WCAG 2.1 AA** nas alterações (rótulos atualizados, sem campos órfãos de descrição).

### 3.5 Branding

Manter classes e padrões admin existentes.

### 3.6 Plataformas

Web (Vite + React), foco desktop no fluxo MEI.

---

## 4. Technical Assumptions

| Decisão | Escolha | Racional |
| --- | --- | --- |
| Repositório | Monorepo `frontend/`, `backend/` | Brownfield |
| Payload empresa | Central em `nfEmissionCompany.ts` + normalização backend | Ponto único de verdade a atualizar |
| Plugnotas | API existente; sem novo provedor | Escopo é redução de blocos e campos |
| Validação técnica | Sandbox Plugnotas + revisão @architect | **Gate** antes de produção |

**Arquivos nucleares (implementação futura):**  
`frontend/src/utils/nfEmissionCompany.ts`, `frontend/src/pages/GuidesMei.tsx`, `frontend/src/services/meiNotasService.ts`, `backend/src/services/plugnotas/empresa.service.js`, `config/plugnotas-nfce-empresa-defaults.json` (se ainda usado só para NFC-e, avaliar uso residual), `docs/operacao-mei-nfse.md`.

---

## 5. Epic List (alto nível)

1. **Épico C — Arquitetura e contrato Plugnotas (gate):** Validar payload empresa sem NF-e/NFC-e ativos e política IE; documentar em ADR ou apêndice operacional; ajustar backend para não forçar bloco NFC-e quando produto for “somente NFS-e”.
2. **Épico D — Frontend Guia MEI (escopo NFS-e):** Remover UI e chamadas NF-e/NFC-e; simplificar formulário empresa (sem IE); atualizar testes Vitest.
3. **Épico E — Qualidade e documentação:** Atualizar `operacao-mei-nfse.md`, mensagens de ajuda, testes de integração backend (plugnotas-empresa), regressão NFS-e.

**MoSCoW sugerido:** Épico C (validação) = **Must** antes de release; Épico D = **Must** para cumprir PRD; Épico E = **Should**; FR-06 FAQ = **Could**.

---

## 6. User Stories (semente para @sm)

*(Números ilustrativos — @sm renomeia conforme épico/backlog.)*

1. **Como** MEI prestador de serviços, **quero** configurar a empresa fiscal **sem** preencher IE na tela, **para** concluir o cadastro Plugnotas com menos atrito.
2. **Como** MEI prestador de serviços, **quero** emitir e acompanhar **apenas NFS-e** no Guia MEI, **para** não ver opções de NF-e/NFC-e que não uso.
3. **Como** operação/suporte, **quero** documentação alinhada ao escopo real (só NFS-e, política IE), **para** responder tickets com consistência.

**Critérios transversais:** testes verdes; payload validado em sandbox; sem regressão no upload de certificado e cadastro NFS-e.

---

## 7. Success Metrics

| Métrica | Alvo (direção) | Notas |
| --- | --- | --- |
| Taxa de conclusão cadastro empresa (Guia MEI) após certificado | ↑ vs. baseline | Medir após release, coorte com mesmo perfil |
| Tickets relacionados a `nfce.config.sefaz` / versaoQrCode | ↓ | Monitorar texto de erro / suporte |
| Tempo médio de preenchimento do formulário mínimo | ↓ | Um campo a menos (IE) |

---

## 8. Risks and Mitigations

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Plugnotas exige IE no JSON e rejeita omissão/`ISENTO` | Alto | Gate **FR-A01/A02**; teste sandbox obrigatório |
| Usuários precisam de NFC-e/NF-e | Médio | Comunicar **D-01**; @po avalia roadmap separado ou outro produto |
| PATCH reativa NFC-e em empresa legada | Médio | Testes de regressão + revisão `atualizarEmpresaPlugNotas` |
| Escopo mal comunicado gera churn | Médio | Copy clara + doc operacional |

---

## 9. Out of Scope

- Emissão de **NF-e** ou **NFC-e** por outros módulos fora do Guia MEI (se existirem no futuro) — não tratado aqui salvo decisão @po.
- Alteração de regras fiscais municipais/estaduais reais (apenas **integração** e **UX**).
- Migração de dados históricos de notas já emitidas.

---

## 10. Open Questions

1. Existe base de usuários que **já emite** NF-e ou NFC-e pelo Guia MEI em produção? (impacta **D-05** e comunicação.)
2. Plugnotas aceita `inscricaoEstadual: "ISENTO"` para todos os UFs alvo do produto?
3. Deve-se **desativar** endpoints backend de emissão NF-e/NFC-e ou apenas ocultar no frontend? (Segurança vs. simplicidade — @architect.)

---

## 11. References

- Brief: [`docs/brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md`](../brief/brief-guia-mei-apenas-nfse-sem-ie-nfce-nfe.md)
- PRD jornada fiscal: [`docs/prd/PRD-guia-mei-plugnotas-jornada-fiscal.md`](./PRD-guia-mei-plugnotas-jornada-fiscal.md)
- Épico stories (referência): [`docs/stories/epic-guia-mei-fiscal-plugnotas-prd.md`](../stories/epic-guia-mei-fiscal-plugnotas-prd.md)

---

*Documento de requisitos de produto; implementação e estimativas ficam com @sm / @dev após gate de arquitetura.*
