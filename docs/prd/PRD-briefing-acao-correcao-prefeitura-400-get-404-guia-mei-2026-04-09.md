# PRD — Briefing de ação: operação e diagnóstico **400** `nfse.config.prefeitura` e **404** `GET` empresa (Guia MEI)

**Versão:** 1.0  
**Data:** 2026-04-09  
**Tipo:** Brownfield — operação, suporte e configuração (sem nova feature de produto além da governança já definida no PRD PREFB)  
**Fonte do briefing:** [`docs/brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../brief/briefing-acao-correcao-prefeitura-400-get-404-guia-mei-2026-04-09.md)

**Relação com outros artefatos (não substituição):**

| Artefacto | Papel |
|-----------|--------|
| [`PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](./PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) | **PRD canónico PREFB** — objetivos, escopo, **FR-PREFB-***, **NFR-PREFB-***, **DP-PREFB-***, epic/stories sugeridos. **Este PRD** deriva apenas o **briefing de ação** em IDs operacionais. |
| [`docs/technical/architecture-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../technical/architecture-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) | Ordem BFF (`normalizePayloadEnderecoCodigoCidade` → `applyNfsePrefeituraIbgeIfEnabled`), fronteiras FE/BFF/Plugnotas, env `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE === 'true'`. |
| [`docs/technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../technical/architecture-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | Triagem POST/GET, superfícies (browser, Node, deploy), observabilidade e mapeamento **FR-BRIEF-OP-*** → artefactos; complementa a arquitectura canónica trilho B. |
| [`docs/specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md`](../specs/ux-spec-briefing-acao-prefeitura-400-get-404-guia-mei-2026-04-09.md) | **BRIEF-OP-UX**, guardrails de causalidade na UI. |
| [`brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md`](../brief/brief-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09.md) | Causa raiz e detalhe técnico; o briefing de ação remete a este brief como canónico. |

---

## 1. Propósito deste documento

Formalizar em formato **PRD** o **briefing de ação** (checklist operacional e tabela de escalação) para:

- rastreio **PM ↔ operações ↔ suporte** sem reler apenas notas soltas;
- alinhar **critérios de “correção tentada”** antes de escalar para PRD PREF / P0 (**FR-PREFB-ESC-01**).

**MoSCoW (âmbito deste PRD):**

| Prioridade | Conteúdo |
|------------|----------|
| **Must** | Requisitos **FR-BRIEF-OP-01** a **FR-BRIEF-OP-05** (checklist e causalidade POST/GET). |
| **Should** | Tabela de escalação pós-checklist (**FR-BRIEF-OP-06**). |
| **Could** | Referência explícita a **POST** e **PATCH** no mesmo trilho B (arquitetura). |
| **Won’t** | Implementação nova de derivação ou UI de credenciais — fora; ver PRD PREF e PRD PREF amplo. |

---

## 2. Resumo executivo

O emissor Plugnotas pode responder **400** quando falta **`nfse.config.prefeitura`** no JSON de empresa. O **404** no **`GET` empresa** na sequência do fluxo ocorre porque o **POST** não criou o registo — **não** deve ser tratado como falha isolada da consulta.

A mitigação **trilho B** (env + IBGE 7 dígitos + reinício do API) está **implementada** no código; este PRD fixa **o que** equipas devem verificar **antes** de assumir bug de aplicação ou de contrato amplo.

---

## 3. Objetivos

1. Reduzir tempo de diagnóstico em **dev/staging** com checklist único (**FR-BRIEF-OP-01**–**04**).  
2. Impedir que **404 GET** seja priorizado em relação ao **400 POST** na triagem (**FR-BRIEF-OP-05**).  
3. Garantir **opt-in produção** coerente com **DP-PREFB-01** / **NFR-PREF-EV-01** (**FR-BRIEF-OP-04**).  
4. Encaminhar casos residuais conforme tabela §6 (**FR-BRIEF-OP-06**).

---

## 4. Personas

| Persona | Necessidade |
|---------|-------------|
| **Dev / staging** | Activar trilho B com env correcta e reinício, sem adivinhar nomes. |
| **Operação / deploy** | Saber quando pode pôr `PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true` em produção (opt-in). |
| **Suporte** | Ordem de perguntas: POST vs GET; flag; IBGE; depois escalação. |

---

## 5. Requisitos funcionais (operação / briefing)

| ID | Requisito |
|----|-----------|
| **FR-BRIEF-OP-01** | Qualquer procedimento de “correção rápida” documentado para este erro **deve** incluir a definição de **`PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE=true`** no **`.env` efectivo do backend** (não só `.env.example`). |
| **FR-BRIEF-OP-02** | O mesmo procedimento **deve** exigir **reinício** do processo Node do API após alterar a variável. |
| **FR-BRIEF-OP-03** | O procedimento **deve** exigir validação de **`endereco.codigoCidade`** com **7 dígitos** após normalização (cidade/município coerentes). |
| **FR-BRIEF-OP-04** | Em **produção**, a activação da flag **deve** seguir **opt-in** e critério de evidência (**NFR-PREF-EV-01** / processo interno), alinhado a **DP-PREFB-01**. |
| **FR-BRIEF-OP-05** | Documentação e formação de suporte **devem** declarar que **404** no `GET` empresa **após** falha de **POST** é **esperado** até existir **POST 2xx** — causalidade **POST → GET**, não “bug só do GET”. |
| **FR-BRIEF-OP-06** | Após o checklist **FR-BRIEF-OP-01**–**05**, se o **400** persistir, o encaminhamento **deve** seguir a matriz: payload redigido (`PLUGNOTAS_DEBUG` em não-prod conforme política); credenciais / contrato amplo → **PRD PREF** / **PRD P0**; dúvida de schema → documentação oficial Plugnotas (ex.: [Postman](https://documenter.getpostman.com/view/3720339/2sB3WpSh1R?version=latest)) — alinhado a **FR-PREFB-ESC-01**. |

---

## 6. Matriz de escalação (após checklist)

| Hipótese | Acção mínima |
|----------|----------------|
| Flag `true` mas ausência de `prefeitura` no wire | Confirmar logs BFF / payload redigido upstream. |
| IBGE com 7 dígitos e **400** mantém-se | Considerar exigências extra em `prefeitura` (credenciais, etc.) — **FR-PREFB-ESC-01**. |
| Dúvida de contrato JSON | Cruzar com documentação oficial do emissor. |

---

## 7. Requisitos não funcionais (operação)

| ID | Requisito |
|----|-----------|
| **NFR-BRIEF-OP-01** | Procedimentos internos **não** devem expor **PII** nem **secrets** em tickets públicos (alinhado a política de logs Plugnotas). |
| **NFR-BRIEF-OP-02** | A variável de ambiente **deve** ser interpretada como **`true`** literal (`=== 'true'`) no backend — documentação **deve** evitar ambiguidade (`True`, `1`) para reduzir falhas operacionais. |

---

## 8. Rastreio arquitetura → briefing

| Ponto do briefing | Onde está na arquitetura |
|-------------------|---------------------------|
| Env opt-in | `applyNfsePrefeituraIbgeIfEnabled` só com `process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE === 'true'`. |
| 7 dígitos | `applyNfseConfigPrefeituraDeriveIbge` — no-op se `codigo.length !== 7`. |
| POST e PATCH | `cadastrarEmpresaPlugNotas` e `atualizarEmpresaPlugNotas` após `normalizePayloadEnderecoCodigoCidade`. |
| Ordem | Normalizar endereço **antes** de derivar prefeitura. |

---

## 9. Critérios de aceite (este PRD)

- [ ] Runbook [`docs/operacao-mei-nfse.md`](../operacao-mei-nfse.md) cobre **FR-BRIEF-OP-05** e aponta para trilho B (**FR-PREFB-DOC-01** — já satisfeito no programa PREFB).  
- [ ] `backend/.env.example` mantém orientação sobre a flag (**FR-PREFB-ENV-01**).  
- [ ] Equipa de suporte reconhece **FR-BRIEF-OP-06** como gatilho para PRD PREF / P0.  
- [ ] Nenhum procedimento interno contradiz **NFR-BRIEF-OP-01**–**02**.

---

## 10. Métricas (qualitativas)

| Sinal | Interpretação |
|-------|-----------------|
| Menos tickets “404 é o bug principal” | **FR-BRIEF-OP-05** a ganhar tração. |
| Tempo médio até “flag + restart + IBGE” testado | Redução após divulgação do briefing/PRD. |

---

## 11. Riscos

| Risco | Mitigação |
|-------|-----------|
| Duplicação de verdade entre este PRD e PRD PREFB | Manter **PRD PREFB** como canónico para roadmap; este ficheiro como **camada operacional**. |
| Env mal escrita (`True` vs `true`) | **NFR-BRIEF-OP-02** + revisão de docs. |

---

## 12. Delegação (@sm / @po)

- Novas **stories** devem referenciar **FR-BRIEF-OP-*** apenas se o escopo for **runbook, suporte ou tooling**; features de código continuam sob **FR-PREFB-*** no PRD PREFB.  
- **@sm:** pode abrir story “divulgação interna do checklist” ou “treino suporte” se o PO priorizar.

---

## 13. Change log

| Versão | Data | Notas |
|--------|------|--------|
| 1.0 | 2026-04-09 | Versão inicial a partir do **briefing de ação** e alinhamento à **arquitetura** trilho B + **PRD PREFB** canónico. |

---

*PRD brownfield — Meu Financeiro — camada operacional derivada do briefing; produto canónico em **PRD-correcao-400-nfse-config-prefeitura-derive-ibge-2026-04-09**.*
