# Story — FR-CONS (P2): QA — matriz manual **endpoint × sintoma** (tríade Guia MEI)

**ID:** STORY-FR-CONS-P2-QA-MATRIZ-TRIADE  
**Prioridade:** P2  
**Depende de:** [story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md](./story-fr-cons-p0-serpro-emitir-503-mei-guide-validate.md), [story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md](./story-fr-cons-p1-guidesmei-fr-cons-ux-paridade-sol.md) *(mínimo: P0 fechada; P1 desejável)*  
**Bloqueia:** —  
**Fonte PRD:** [`docs/prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../prd/PRD-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — Épico 3, **FR-CONS-EVID-01**, critérios **§8** release  
**Arquitetura:** [`docs/technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md`](../technical/architecture-correcao-cadastro-plugnotas-erros-console-mei-2026-04-08.md) — §4 matriz rastreabilidade

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @qa |
| **quality_gate** | @po *(aceite release)* |
| **quality_gate_tools** | Execução manual + evidência em comentário MR ou anexo interno |
| **revisão** | @dev — correcção de bugs encontrados em story separada |

---

## User story

**Como** QA,  
**quero** uma matriz executável que cubra os três endpoints da tríade (POST empresa, GET empresa, POST validate) com sintomas e expectativas de UI/copy,  
**para** assinar o release do pacote **FR-CONS** com evidência rastreável (**FR-CONS-EVID-01**).

---

## Contexto

- Não exige código novo; pode viver como secção nesta story + checklist na PR, ou ficheiro `docs/qa/` se o projeto adoptar (opcional).  
- Cenários: sucesso POST empresa; 400 `prefeitura`; GET 404 subsequente; validate com Serpro indisponível (**503** após P0); validate com CNPJ inválido (400 local).  
- **Staging:** se Serpro 500 não for reproduzível, usar mock backend ou ambiente de desenvolvimento com `emitirServico` mockado (coordenação com @dev).

---

## Critérios de aceite

- [ ] Matriz em tabela: **Endpoint**, **Pré-condição**, **Resposta HTTP**, **Copy/UI esperada** (referência spec: CONS-C, SOL-L1, PREF-L1 quando aplicável).  
- [ ] Mínimo **5** linhas de cenário cobrindo a tríade + um caminho feliz.  
- [ ] Evidência: data, ambiente, executor; **sem** CNPJ/real PII (usar mascarados).  
- [ ] Ligação explícita a PRD CONS, brief consola, stories **CONS-P0/P1** no rodapé da evidência.  
- [ ] Bugs abertos, se houver, com IDs ou stories filhas.

---

## Tasks (indicativas)

1. [x] Redigir matriz.  
2. [ ] Executar em ambiente acordado.  
3. [ ] Registar resultado e ligação ao release (**§8** PRD).

---

## File list (indicativo)

- [x] `docs/qa/qa-matriz-fr-cons-triade-2026-04-08.md` — matriz + template de execução / evidência  
- [ ] *(alternativa)* **QA Agent Record** abaixo preenchido + link MR *(se QA optar por não usar o ficheiro)*  

---

## Dev Agent Record

*(preenchido por @dev — artefacto da matriz)*

### Status

Ready for Review

### File list

- `docs/qa/qa-matriz-fr-cons-triade-2026-04-08.md` — 6 cenários (feliz + PREF + CONS-B duplo + CONS-C + validação local); links PRD §8, brief, arquitectura §4, operação, P0/P1/P1-operação

### Notes

- Execução manual e preenchimento da tabela §2 ficam com **@qa**; Serpro **503** pode usar evidência de testes backend se staging não reproduzir (nota na matriz).  
- **@po:** fecho release **§8** PRD após §2 completo + MR/comentário conforme story 3.2 PRD.
- **Follow-up QA (obs. §3):** em `qa-matriz-fr-cons-triade-2026-04-08.md`, secção **Bugs** com baseline **Nenhum** até haver defeitos.

### Change Log

- 2026-04-08 — Criação da matriz em `docs/qa/` e actualização de tasks / file list.
- 2026-04-08 — Matriz §3: baseline «Nenhum» conforme sugestão na QA Results da story.

---

## QA Agent Record

*(preencher por @qa)*

### Status

Draft

### Resultado

*(preencher)*

### Evidência

*(preencher)*

---

## QA Results

### 2026-04-08 — Quinn (@qa)

**Decisão de gate (artefacto matriz):** **PASS**

**Rastreio face aos critérios de aceite** *(revisão estática do ficheiro [`docs/qa/qa-matriz-fr-cons-triade-2026-04-08.md`](../qa/qa-matriz-fr-cons-triade-2026-04-08.md))*

| Critério | Verificação |
| --- | --- |
| Tabela **Endpoint × Pré-condição × Resposta HTTP × Copy/UI** + referências spec | Colunas alinhadas ao pedido; **PREF-L1** (QA-CONS-02), **SOL-L1 / CONS-B / §5.4** (QA-CONS-03), **SOL-L3** (QA-CONS-04), **CONS-C** §6 (QA-CONS-05), validação local vs Serpro (QA-CONS-06). |
| Mínimo **5** linhas + caminho feliz | **6** cenários: **QA-CONS-01** (feliz) + tríade **POST empresa / GET empresa / POST validate** + contraste 404 e validate local. |
| Evidência: data, ambiente, executor; sem PII | **§2** com colunas explícitas; aviso no cabeçalho sobre CNPJ mascarado. |
| Ligação PRD CONS, brief, stories P0/P1 no rodapé | **§4** + cabeçalho (PRD com âncora **§8**); brief; P0, P1 Guia MEI, **P1 operação** (valor acrescentado vs critério mínimo). |
| Bugs / stories filhas | **§3** reservada; *sugestão não bloqueante:* preencher com **«Nenhum»** até haver defeitos, para fechar visualmente o critério. |

**Épico 3 PRD (Story 3.1):** cobertura pedida — sucesso `POST` empresa; falha `prefeitura`; `GET 404` subsequente (QA-CONS-03) e variante sem histórico POST (QA-CONS-04); `validate` Serpro **503** (QA-CONS-05); nota explícita para mock / `emitir-servico-serpro-503.test.js` se staging não reproduzir.

**Observações (não bloqueantes)**

1. **Story ainda incompleta para release §8:** tasks **2–3** (execução + registo) abertas; **§2** do doc vazio — esperado até **@qa** executar. Este **PASS** refere-se à **qualidade do entregável de matriz**, não ao fecho do pacote FR-CONS no PO.  
2. **NFR-CONS-04:** não exigível a este markdown; pipeline continua a aplicar-se ao código nas stories P0/P1.

**Conclusão:** matriz **executável** e rastreável (**FR-CONS-EVID-01**); apta para uso em QA manual / MR; seguir com preenchimento de **§2–§3** e ligação **Story 3.2** (@po) após execução.

— Quinn, guardião da qualidade 🛡️
