# Especificação de front-end e UX — Trilho B (`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`), IBGE de 7 dígitos e encadeamento **400** → **404**

**Versão:** 1.0  
**Data:** 2026-04-09  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../prd/PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) (**FR-PREFB-DOC-01**, **FR-PREFB-ESC-01**; alinhamento **DP-PREFB-01…03**; coerência com **FR-PREFB-QA-01**)

**Brief de apoio:** [`docs/brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md)

**Relação com outras specs e código:**

- **400 `nfse.config.prefeitura` / variante PREF-L1 / copy principal:** [`docs/specs/ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`](ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md) — quando o **400** continua a citar `prefeitura`, o bloco principal do alerta **não** muda com esta spec; o trilho B é **mitigação no servidor** que pode **eliminar** o erro **antes** de chegar ao utilizador.  
- **Encadeamento 400 → 404 GET:** [`docs/specs/ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) — **SOL-L1…L3**; reutilizar narrativa causal quando o **POST** falhar por qualquer motivo, incluindo ausência de derivação no backend.  
- **Tabela IBGE / TIBGE-L1 (distinto de “só falta trilho B”):** [`docs/specs/ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md`](ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md) — não confundir rejeição por **tabela do emissor** com falha por **IBGE incompleto** que impede a derivação de `prefeitura`.  
- **Campo `codigoCidade` / CID:** [`docs/specs/ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md`](ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md) — formato e hint **FR-CID-UX-02**.  
- **Implementação de referência:** `frontend/src/utils/nfEmissionCompany.ts` (`buildNfEmissionEmpresaPayload`, `getNfEmissionCompanyValidationMessage`), `frontend/src/pages/GuidesMei.tsx`, `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts`, `frontend/src/components/FiscalIntegrationErrorAlert.tsx`, painéis `GuiaMeiEmpresaCadastroErrorPanel`.  
- **Operação / doc:** [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) — entrega **FR-PREFB-DOC-01** / **FR-PREFB-ESC-01** (conteúdo espelhado nos critérios desta spec, secção 6).

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou ID do PRD/spec.

---

## 1. Objetivo deste documento

Contrato de **experiência, camadas de mensagem, conteúdo de ajuda e critérios de QA** para o incremento **trilho B** (derivação de `nfse.config.prefeitura` a partir do IBGE do endereço quando o backend está configurado), de modo a:

1. **Clareza de papel:** distinguir **correção invisível ao MEI** (env no servidor + dados válidos) de **erros que continuam a aparecer na UI** (mensagem Plugnotas inalterada até o POST ter sucesso).  
2. **Sem contradizer PREF:** se o **400** ainda citar `nfse.config.prefeitura`, a variante **prefeitura-config** (**PREF-L1**) e a copy da spec PREF mantêm-se; **não** misturar com texto de “tabela IBGE” (**TIBGE-L1**) nem sugerir que **inscrição municipal** substitui `prefeitura` (**DP-PREFB-03**).  
3. **404:** reutilizar a narrativa **SOL** (cadastro não concluído → consulta pode não encontrar empresa) sem duplicar blocos longos — ver secção 4.  
4. **Fase 2 (opcional, PO):** critérios para reforço de **validação ou ajuda contextual** no campo IBGE (7 dígitos) **sem** obrigar implementação na v1.0 desta spec se o PRD fechar só documentação.

Serve para *file list* de story, revisão de copy e QA; **não** substitui o **PRD** nem o runbook de escalação ao Plugnotas.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Sucesso silencioso** | Quando o trilho B + IBGE correctos evitam o **400**, o utilizador **não** vê uma mensagem nova de “trilho B activo” — apenas o fluxo segue (certificado → empresa criada). |
| **Erro ainda é erro do emissor** | Enquanto o **POST** falhar, o texto repassado continua a ser o do Plugnotas/BFF; a nossa camada **explica** e **classifica** (PREF / TIBGE / municipal), não substitui o servidor. |
| **Ordem de diagnóstico (conteúdo de ajuda)** | Alinhar ao **DP-PREFB-02**: (1) backend com derivação activa em ambientes onde aplicável; (2) código IBGE com 7 dígitos coerente com cidade/UF; (3) depois escalação para PRD PREF / P0 se a mensagem persistir. |
| **Uma causa por vista** | Não mostrar simultaneamente o bloco **prefeitura-config** e o hint **TIBGE** para a **mesma** mensagem salvo sobreposição explícita acordada na spec TIBGE (matriz de prioridade). |
| **A11y** | Manter uma hierarquia: alerta principal → ajuda secundária → rodapé; evitar dois `role="alert"` com texto repetido. |

---

## 3. Arquitetura de informação — rótulos **PREFB**

### 3.1 Definição **PREFB-L0** (caminho feliz)

**PREFB-L0:** `POST` empresa **2xx** após configuração backend adequada e `endereco.codigoCidade` com **7 dígitos** válidos para derivação. **Sem** alteração obrigatória de componentes React na v1.0 desta spec.

### 3.2 Definição **PREFB-L1** (ainda 400 `prefeitura` visível ao utilizador)

**PREFB-L1:** Mensagem normalizada contém `nfse.config.prefeitura` ou `fields.nfse.config.prefeitura` e indício de **preenchimento obrigatório** (equivalente a **PREF-L1** na spec PREF).

**Comportamento UX:** igual à spec PREF — variante **prefeitura-config**, `aria-label` da região de ajuda conforme `PlugnotasMunicipalRequirementOperacaoCopy` / painel existente em `GuidesMei.tsx`. **Esta spec não altera** o parágrafo principal **FR-PREF-UX-01**.

**Nota:** **PREFB-L1** pode ocorrer porque (a) trilho B **não** está activo no ambiente; (b) IBGE com menos de 7 dígitos após normalização; (c) município exige **mais** do que `codigoIbge` (credenciais — fora de escopo do PRD PREFB). A distinção **(a)(b)** vs **(c)** é **operacional** (`docs/operacao-mei-nfse.md`, **FR-PREFB-ESC-01**), não obrigatoriamente um terceiro texto na UI na v1.0.

### 3.3 Relação com **TIBGE-L1** e **SOL-L***

| Combinação | Regra |
|------------|--------|
| Mensagem só **prefeitura** (sem sinais TIBGE) | **PREF-L1** / painel prefeitura-config; hint IBGE **não** por esta mensagem (alinhado **spec TIBGE** secção 3.1 exclusões). |
| Mensagem com **prefeitura** + **codigoIBGECidade** / tabela IBGE | Matriz da **spec TIBGE** secção 3.2 — ver PO se conflito; v1 preferir ordem documentada na spec TIBGE. |
| **POST** falhou + **GET** 404 | **SOL-L1** ou equivalente na spec SOL — bloco auxiliar “cadastro ainda não criado”. |

---

## 4. Microcopy e estados de interface

### 4.1 Alterações obrigatórias na UI (v1.0)

**Nenhuma** alteração obrigatória de *string* ou componente novo no **Guia MEI** **somente** por esta entrega, **se** o incremento de produto for **exclusivamente** documentação + env (**FR-PREFB-DOC-01**, **FR-PREFB-ENV-01**) — o utilizador final beneficia do trilho B **sem** novo copy.

**Condição:** Se PO incluir **uma** linha de ajuda no formulário (fase 2), usar secção 4.3.

### 4.2 Reutilização **SOL** para 404 após falha de POST

Quando **PREFB-L1** (ou outro 400) e o fluxo mostrar **404** na consulta, aplicar **spec SOL** — blocos **4.1 / 4.2** (encadeamento) da [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md). **Não** duplicar aqui o texto integral.

### 4.3 Fase 2 (opcional) — ajuda junto ao campo **Código IBGE da cidade**

**Gatilho de produto:** PO pede reforço após **DP-PREFB-02** (2) — utilizadores com IBGE incompleto.

| Elemento | Especificação |
|----------|----------------|
| **Local** | Junto ao campo já existente de código IBGE no formulário de empresa (Guia MEI), abaixo do *label* ou como `description` associado ao `input`. |
| **Texto sugerido** | *O código do município no IBGE tem 7 dígitos. Se faltar um dígito, o cadastro no emissor pode falhar.* |
| **Tom** | Informativo, **não** punitivo; `text-sm`, cor secundária do tema. |
| **A11y** | `id` + `aria-describedby` no campo, ou texto dentro de `p` ligado semanticamente ao grupo do campo. |
| **Validação** | Opcional: bloquear *submit* se, após `normalizeIbgeMunicipioCodigo`, o comprimento ≠ 7 — **só** com critério explícito em story (evitar regressão em fluxos que hoje aceitam correção iterativa). |

---

## 5. Documentação visível a equipas (espelho de conteúdo)

Esta secção **não** é UI do produto final; define **checklist de conteúdo** para `docs/operacao-mei-nfse.md` (**FR-PREFB-DOC-01**) e **encaminhamento** (**FR-PREFB-ESC-01**), para QA de documentação.

| Item | Deve constar |
|------|----------------|
| Sintoma | 400 com `fields.nfse.config.prefeitura` / preenchimento obrigatório. |
| Trilho B | Nome da env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`; reinício do API; âmbito **dev/staging** vs **produção** (opt-in **DP-PREFB-01**). |
| Pré-requisito dados | `endereco.codigoCidade` com **7 dígitos** após normalização. |
| Causalidade | **POST** falho → **GET** 404 esperado até cadastro criado. |
| Próximo passo | Ligação aos PRDs **PREF** e **P0** se o erro persistir após trilho B + IBGE válido. |

---

## 6. Critérios de aceite (QA UX)

- [ ] **Regressão:** Com mensagem **PREF-L1** sintética, a variante **prefeitura-config** continua a aplicar-se (**FR-PREFB-QA-01** via testes existentes em `nfseNacionalPlugnotasErrorHints.test.tsx` / painéis).  
- [ ] **Camadas:** Mensagem só TIBGE **não** activa **prefeitura-config** por engano (spec TIBGE).  
- [ ] **SOL:** Após POST falhado + 404, utilizador vê narrativa alinhada à spec SOL (quando a UI entrar nesse estado).  
- [ ] **Doc:** `docs/operacao-mei-nfse.md` (ou entrega equivalente) satisfaz a tabela da secção 5.  
- [ ] **Fase 2:** Se **não** implementada, não há novos *strings* obrigatórios em `GuidesMei.tsx` por esta spec; se implementada, cumpre secção 4.3.

---

## 7. Fora do escopo (remissões)

- Formulário para **login/senha** da prefeitura — **PRD-plugnotas-empresa-nfse-config-prefeitura-payload-2026-04-08** / trilho C.  
- Novo *banner* “activar trilho B” **para o utilizador final** — a flag é **servidor**; utilizador não configura env.  
- Alterar o texto **exacto** devolvido pelo Plugnotas no **400**.

---

## 8. Referência rápida — ficheiros a tocar (se houver incremento UI fase 2)

| Ficheiro | Alteração potencial |
|----------|---------------------|
| `frontend/src/pages/GuidesMei.tsx` | Texto de ajuda opcional junto ao IBGE; *aria-describedby*. |
| `frontend/src/utils/nfEmissionCompany.ts` | Validação de comprimento opcional em `getNfEmissionCompanyValidationMessage`. |
| `docs/operacao-mei-nfse.md` | Secção trilho B + links PRD (**FR-PREFB-DOC-01**). |

---

## 9. Change log

| Versão | Data | Notas |
|--------|------|-------|
| 1.0 | 2026-04-09 | Versão inicial derivada do **PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09**. |

---

*Spec UX — Meu Financeiro / Guia MEI — trilho B derivação `prefeitura` + IBGE 7 dígitos.*
