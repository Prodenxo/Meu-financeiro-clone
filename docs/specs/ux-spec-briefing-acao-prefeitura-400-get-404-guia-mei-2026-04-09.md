# Especificação de front-end e UX — Briefing de ação (**400** prefeitura / **404** GET) e triagem operacional

**Versão:** 1.0  
**Data:** 2026-04-09  
**Autoria:** Uma (UX design expert, fluxo AIOX)  
**Requisitos de origem:** [`docs/prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../prd/PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md) (**FR-BRIEF-OP-01** a **FR-BRIEF-OP-06**, **NFR-BRIEF-OP-01**–**02**)

**Briefing de ação:** [`docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md)

**Relação com outras specs (não substituição):**

| Artefacto | Papel |
|-----------|--------|
| [`ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) | **Spec canónica PREFB** — **PREFB-L0/L1**, variante **prefeitura-config**, **SOL**, **TIBGE**, fase 2 IBGE. **Esta spec** cobre apenas a **camada operacional** do **PRD briefing** (triage, equipas, reforço de causalidade **POST → GET**). |
| [`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`](ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md) | Encadeamento **POST** falho → **GET** **404** (**SOL-L***). |
| [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) | Runbook — âncora [Trilho B / env](../operacao-mei-nfse.md#prefb-trilho-b-env-derive-ibge). |
| [`docs/technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | Triagem técnica, superfícies e fluxo de decisão alinhado a **FR-BRIEF-OP-***. |

**Nota:** não usar o carácter “§” em *strings* de UI. Em documentação interna, usar “secção” ou ID do PRD/spec.

---

## 1. Objetivo deste documento

Traduzir **FR-BRIEF-OP-*** em:

1. **Experiência de triagem** para equipas (dev, operação, suporte) — ordem mental **POST antes de GET**.  
2. **Guardrails de produto** para o **utilizador MEI** na Guia MEI: **não** contradizer a narrativa causal **POST → GET** nem sugerir que o **404** é o problema principal quando o **400** veio antes (**FR-BRIEF-OP-05**).  
3. **Checklist de conteúdo** para documentação interna / runbook alinhado ao briefing PRD.  
4. **Critérios de QA** quando uma story implementar apenas comunicação ou doc (sem nova feature de credenciais).

**Não duplica** parágrafos longos da spec PREFB canónica: para copy **prefeitura-config**, **PREF-L1**, painéis e testes, usar **`ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09`**.

---

## 2. Princípios de UX

| Princípio | Aplicação |
|-----------|-----------|
| **Causa antes de sintoma** | Qualquer mensagem de ajuda ou estado de retry **não** deve tratar o **404** na consulta como falha isolada se o **POST** acabou de falhar com **400** — alinhar a **spec SOL** e **FR-BRIEF-OP-05**. |
| **Trilho B é invisível ao MEI** | O utilizador **não** configura `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE`; copy de produto **não** pede para “ligar a flag” (é **servidor** / operação). |
| **Uma voz por camada** | Alerta principal = mensagem BFF/Plugnotas; camada de ajuda = heurísticas existentes (`nfseNacionalPlugnotasErrorHints`, painéis) — **sem** segundo `role="alert"` redundante. |
| **Privacidade** | **NFR-BRIEF-OP-01:** UI e documentação de suporte **não** incentivam colar CNPJ completo, tokens ou payloads em canais públicos. |
| **Literal `true`** | **NFR-BRIEF-OP-02:** conteúdo para **equipas** (runbook, *tooltips* internos se existirem) deve mostrar o valor exacto `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` (minúsculas), não `True` / `1`. |

---

## 3. Personas e superfícies

| Persona | Superfície | Foco desta spec |
|---------|------------|------------------|
| **MEI** | Guia MEI (`GuidesMei.tsx`), alertas fiscais | Coerência causal **400** → **404**; reutilizar **SOL** onde aplicável. |
| **Dev / staging** | `.env`, consola, `docs/operacao-mei-nfse.md` | Checklist **FR-BRIEF-OP-01**–**03** (env efectiva, reinício, IBGE 7 dígitos). |
| **Operação** | Deploy, variáveis de ambiente | **FR-BRIEF-OP-04** — opt-in produção. |
| **Suporte** | Scripts internos, *macros*, runbook | Ordem de perguntas: **POST** / mensagem **400** → depois **GET** / **404** (**FR-BRIEF-OP-05**–**06**). |

---

## 4. Requisitos mapeados (FR-BRIEF-OP → UX)

### 4.1 **FR-BRIEF-OP-01** e **FR-BRIEF-OP-02** (env + reinício)

- **Produto (MEI):** sem novo copy obrigatório — a correcção é **fora** da UI.  
- **Equipas:** runbook e materiais internos **devem** nomear a variável e o reinício (conteúdo espelhado em `docs/operacao-mei-nfse.md` / briefing).

### 4.2 **FR-BRIEF-OP-03** (IBGE 7 dígitos)

- **Alinhamento** à spec PREFB **secção 4.3** (fase 2 opcional): texto de ajuda junto ao campo IBGE **só** se PO abrir story; **não** é obrigatório pela entrega “só PRD briefing”.  
- Se implementado, seguir tabela de *microcopy* da **ux-spec PREFB** (comprimento, tom, **A11y**).

### 4.3 **FR-BRIEF-OP-04** (produção opt-in)

- **UI MEI:** sem alteração — decisão de **deploy**.  
- **Documentação para operações:** deve mencionar **DP-PREFB-01** / **NFR-PREF-EV-01** onde o runbook já o faz.

### 4.4 **FR-BRIEF-OP-05** (causalidade POST → GET) — **crítico para produto**

| Cenário | Comportamento esperado |
|---------|-------------------------|
| Utilizador vê **400** no cadastro empresa e, em seguida, **404** ou mensagem de “não encontrámos empresa” na consulta | A experiência **não** deve dar a entender que o problema é **só** a consulta. |
| Implementação | Reutilizar blocos da **spec SOL** (`ux-spec-solucao-400-prefeitura-404-get-empresa-mei-2026-04-08.md`) — prefixos / painéis **SOL-L*** já previstos; **não** introduzir texto que inverta a ordem causal. |

**Verificação de regressão (conteúdo):** revisão de *strings* em `GuidesMei.tsx` / painéis de empresa que mencionem **404** ou “consulta” — não devem aparecer **antes** ou **sem** contexto de falha de **POST** quando o fluxo veio de cadastro falhado.

### 4.5 **FR-BRIEF-OP-06** (escalação)

- **UI:** quando a mensagem persistir após trilho B + IBGE (cenário **PREFB-L1** / **PREF-L1**), manter encaminhamento da **spec PREF** (link operação / documentação).  
- **Suporte:** matriz do PRD briefing — próximo passo = logs redigidos, depois PRD PREF / P0, depois doc oficial Plugnotas.

---

## 5. Arquitectura de informação — rótulo **BRIEF-OP-UX**

**BRIEF-OP-UX-L1 (triage):** Estado em que o utilizador ou suporte precisa de entender **duas** falhas em sequência (**400** depois **404** ou equivalente na app). A narrativa correcta é: **cadastro não concluído no emissor** → consulta pode não encontrar empresa — **não** “API de consulta partida” como primeira hipótese.

**BRIEF-OP-UX-L0:** **POST** **2xx** — utilizador não precisa de narrativa especial de briefing; segue fluxo normal.

---

## 6. Documentação e conteúdo não-UI (espelho FR-BRIEF-OP)

Checklist para QA de **`docs/operacao-mei-nfse.md`** e materiais derivados do **PRD briefing** (equipas):

| FR | Deve constar (conteúdo) |
|----|-------------------------|
| **OP-01** | Env no **backend efectivo**; não basta `.env.example`. |
| **OP-02** | Reinício do processo Node após mudar env. |
| **OP-03** | IBGE **7 dígitos** após normalização. |
| **OP-04** | Opt-in produção / evidência. |
| **OP-05** | **POST** falho → **GET** **404** esperado até **POST** **2xx**. |
| **OP-06** | Escalação: logs → PRD PREF/P0 → doc Plugnotas. |

---

## 7. Acessibilidade e conteúdo sensível

- **NFR-BRIEF-OP-01:** textos de ajuda e exemplos em docs **não** devem incentivar partilha de PII/secrets; exemplos com CNPJ mascarado ou placeholders.  
- Hierarquia visual dos alertas existente mantém-se (**spec PREFB** §2).

---

## 8. Critérios de aceite (QA UX)

- [ ] **Causalidade:** Nenhum novo ou alterado *string* na Guia MEI contradiz **FR-BRIEF-OP-05** (prioridade do **400** sobre interpretação errada do **404`).  
- [ ] **Compatibilidade:** Variante **prefeitura-config** e testes em `nfseNacionalPlugnotasErrorHints` permanecem alinhados à **ux-spec PREFB** (**FR-PREFB-QA-01**).  
- [ ] **SOL:** Estados **POST** falho + consulta sem empresa seguem a **spec SOL** quando aplicável.  
- [ ] **Doc equipas:** Tabela da secção 6 satisfeita no runbook ou entrega equivalente (**critérios PRD briefing §9**).  
- [ ] **Privacidade:** Materiais de suporte gerados a partir deste PRD respeitam **NFR-BRIEF-OP-01**.  
- [ ] **Env literal:** Texto para devs usa `…=true` conforme **NFR-BRIEF-OP-02**.

---

## 9. Fora do escopo

- Novo formulário de credenciais de prefeitura — **PRD PREF** / trilho C.  
- Banner ao MEI para “activar trilho B” — a flag é **servidor**.  
- Duplicar aqui os parágrafos **FR-PREF-UX-01** da spec **plugnotas-nfse-config-prefeitura-payload** — remeter sempre à spec PREFB canónica para copy principal **PREF-L1**.

---

## 10. Referência — ficheiros a tocar (se story o exigir)

| Ficheiro | Alteração potencial |
|----------|---------------------|
| `frontend/src/pages/GuidesMei.tsx` | Revisão de ordem/contexto de mensagens **404** vs **400**; alinhar a **spec SOL** — só com critério em story. |
| `frontend/src/utils/nfseNacionalPlugnotasErrorHints.ts` | Sem mudança obrigatória por esta spec se heurísticas já cobrem **PREF-L1** / **SOL**; ajustes **só** se QA identificar violação **FR-BRIEF-OP-05**. |
| `docs/operacao-mei-nfse.md` | Manter coerência com secção 6 desta spec. |

---

## 11. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-09 | Versão inicial derivada do **PRD-briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09**. |

---

*Spec UX — Meu Financeiro — camada operacional / triagem; produto Guia MEI canónico em **ux-spec-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09**.*
