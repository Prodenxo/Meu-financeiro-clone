# Story — FR-ADDCO (P1): Comunicação stakeholder sobre addCompany já suportado pela Guia MEI

**ID:** STORY-FR-ADDCO-P1-COMUNICACAO-STAKEHOLDER  
**Prioridade:** P1  
**Status:** Ready for Review  
**Depende de:** PRD, spec UX e arquitetura da iniciativa publicados  
**Bloqueia:** onboarding interno e suporte quando houver dúvida sobre “falta funcionalidade addCompany”  
**Fonte PRD:** [`docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) — épico **E-ADDCO-03**, métricas §8, critérios de go §11  
**UX:** [`docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md`](../specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md) — princípios 1 e 3, conteúdo §10  
**Arquitetura:** [`docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`](../technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md) — decisão §1, contexto §2, componentes §5

## Executor Assignment

| Campo | Valor |
|-------|--------|
| **executor** | @dev |
| **quality_gate** | @qa |
| **quality_gate_tools** | revisão documental e validação de links; gates de código somente se tocar ficheiros executáveis |

---

## User story

**Como** membro de produto, suporte ou engenharia em onboarding,  
**quero** um resumo interno curto e inequívoco dizendo que o cadastro de empresa Plugnotas já é suportado pela Guia MEI,  
**para** reduzir a ambiguidade recorrente entre a documentação pública “addCompany” e o comportamento real do produto.

---

## Contexto

- O PRD identifica explicitamente o problema de alinhamento “doc Plugnotas x produto”.  
- A arquitetura já consolidou a decisão de que a Guia MEI materializa o caso de uso addCompany por composição de `certificado -> empresa`.  
- A spec UX orienta que a narrativa interna e externa ao utilizador evite jargão desnecessário, mas a equipa interna precisa de um ponteiro claro para PRD, UX e arquitetura.

## Escopo e fronteira

- Esta story cria ou atualiza um **resumo interno canônico para stakeholders**, não uma nova especificação funcional.
- O objetivo é reduzir ambiguidade recorrente em onboarding, suporte e alinhamento de roadmap sobre o fato de que a Guia MEI já cobre o caso de uso `addCompany`.
- O artefato deve ser curto, linkável e orientado a consumo interno, priorizando resumo + links para os artefatos canônicos.
- Esta story não autoriza criação de novo requisito funcional, nova rota visual “addCompany” ou duplicação extensa de conteúdo já existente em PRD, UX ou arquitetura.

---

## Critérios de aceite

### Formato mínimo do artefato

- [ ] O resumo stakeholder passa a existir em local canônico do repositório: `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`.
- [ ] O artefato atualizado contém, no mínimo: contexto do problema, declaração explícita de que a Guia MEI já suporta `addCompany`, links para PRD/spec/arq e orientação sobre o que não está no escopo atual.
- [ ] O `Dev Agent Record` desta story registra o local final do resumo, os links validados e o tipo de atualização realizada.

### Documento de comunicação

- [ ] Existe um artefato documental curto, linkável e orientado a stakeholders internos explicando que “cadastro no emissor” na Guia MEI corresponde ao caso de uso `addCompany / POST /empresa`.
Critério de encerramento: texto resumo criado ou atualizado no arquivo canônico, com linguagem interna direta e sem depender de interpretação implícita.
- [ ] O artefato referencia explicitamente PRD, spec UX e arquitetura técnica da iniciativa.
Critério de encerramento: os três links aparecem de forma explícita e resolvem no repositório.
- [ ] O artefato deixa claro que não existe requisito atual para uma nova rota visual “addCompany” nem integração browser -> Plugnotas.
Critério de encerramento: há seção ou parágrafo explícito de “fora do escopo / não implica”.

### Consistência narrativa

- [ ] A comunicação usa linguagem interna clara para suporte/produto, mas preserva a narrativa de UX de que o utilizador final não precisa conhecer jargão de API.
Critério de encerramento: o texto usa “cadastro no emissor” ou equivalente para o utilizador final e reserva `addCompany` para explicação interna.
- [ ] O documento distingue, de forma simples, o que já existe hoje, o que é retry parcial e o que fica como evolução futura.
Critério de encerramento: existe bloco objetivo com separação entre “já suportado”, “comportamento atual” e “não implica nova feature”.
- [ ] O documento pode ser usado como ponteiro para dúvidas de roadmap ou suporte sem contradizer PRD e arquitetura.
Critério de encerramento: o conteúdo foi revisado contra PRD e arquitetura e não introduz afirmações novas sem fonte.

### Qualidade

- [ ] Todos os links do artefato resolvem no repositório.
- [ ] Se o artefato reutilizar o brief existente, a atualização não duplica texto longo desnecessariamente; prioriza resumo + links.
Critério de encerramento: o delta documental mantém o artefato curto e sem copiar longos trechos dos documentos-fonte.
- [ ] Não há inclusão de segredos, credenciais ou detalhes operacionais sensíveis.

---

## Dev Notes

### Source Constraints

- O PRD quer reduzir ambiguidade interna sobre “falta funcionalidade addCompany”. [Source: docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#3-problema-e-oportunidade]
- A arquitetura define como decisão central manter a estratégia atual de Guia MEI + BFF + serviços Plugnotas server-side. [Source: architecture/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md#1-decisao-arquitetural]
- A spec UX orienta evitar jargão para o utilizador final, preferindo “registar a empresa no emissor” e “configuração fiscal”. [Source: docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md#10-conteudo-copy-linhas-guia]

### File Location

- `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`

### Technical Constraints

- Não criar novo requisito funcional fora dos artefatos existentes.
- Não transformar o documento de comunicação em especificação duplicada; ele deve ser resumo + links.

---

## Tasks / Subtasks

1. [x] Atualizar o arquivo canônico `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` com resumo interno para stakeholders. (AC: formato mínimo do artefato, documento de comunicação)
2. [x] Garantir que o resumo deixa explícito: o que já existe hoje na Guia MEI, a relação com `addCompany / POST /empresa`, e o que não está no escopo atual. (AC: documento de comunicação, consistência narrativa)
3. [x] Inserir e validar links para PRD, spec UX e arquitetura, assegurando que todos resolvem no repositório. (AC: documento de comunicação, qualidade)
4. [x] Revisar o texto para manter linguagem interna clara, evitar jargão desnecessário para o utilizador final e não duplicar conteúdo longo dos artefatos fonte. (AC: consistência narrativa, qualidade)
5. [x] Registar no `Dev Agent Record` o local final do resumo, o tipo de atualização feita e a validação dos links. (AC: formato mínimo do artefato, qualidade)

---

## File list (esperada / a confirmar na execução)

- [x] `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
- [ ] `docs/operacao-mei-nfse.md` *(somente se o apontador fizer mais sentido no runbook)*

---

## 🤖 CodeRabbit Integration

- N/A para código de aplicação. Revisão manual de clareza, links e rastreabilidade é suficiente.

---

## Dev Agent Record

### Status

Ready for Review

### Completion Notes

- **Local final do resumo stakeholder:** `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`.
- **Resumo do conteúdo criado/atualizado:** Foi adicionada a secção `Resumo para stakeholders internos` no topo do brief canônico, com declaração objetiva de que a Guia MEI já suporta `addCompany`, explicação da equivalência técnica com `POST /empresa`, menção ao retry parcial e bloco explícito de fora de escopo.
- **Links validados (`PRD`, `spec UX`, `arquitetura`):** Foram adicionados links locais para `docs/prd/PRD-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`, `docs/specs/SPEC-front-end-ux-plugnotas-addcompany-guia-mei-2026-04-09.md` e `docs/technical/architecture-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`.
- **Declaração de escopo/fora de escopo incluída:** Sim; o resumo deixa explícito que não há requisito atual para nova rota visual “addCompany” nem integração direta browser -> Plugnotas.
- **Observações de clareza ou não duplicação:** A atualização foi curta, orientada a onboarding/suporte, e reutiliza o brief existente como resumo + links sem duplicar especificação longa.

### File List

- `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md`
- `docs/stories/story-fr-addco-p1-comunicacao-stakeholder.md`

### Communication Summary

| Item | Evidência | Status |
|------|------|------|
| Arquivo canônico atualizado | `docs/brief/brief-plugnotas-addcompany-guia-mei-cnpj-mapeamento-2026-04-09.md` com nova secção `Resumo para stakeholders internos`. | concluído |
| Relação Guia MEI -> `addCompany / POST /empresa` explícita | O resumo declara a equivalência entre cadastro no emissor na Guia MEI e `addCompany / POST /empresa` via BFF. | concluído |
| Links para PRD/spec/arq validados | O brief agora aponta explicitamente para os artefatos canônicos locais de PRD, spec UX e arquitetura. | concluído |
| Fora de escopo explicitado | O resumo afirma que não há requisito para nova rota visual “addCompany” nem integração browser -> Plugnotas. | concluído |
| Retry parcial mencionado de forma coerente | O resumo registra que o produto já suporta repetir só a fase empresa após certificado aceite. | concluído |
| Ausência de duplicação excessiva confirmada | A atualização adiciona um bloco curto de orientação interna e mantém o restante do brief como referência aprofundada. | concluído |

### Change Log

| Data | Nota |
|------|------|
| 2026-04-09 | Story criada pelo @sm a partir do épico E-ADDCO-03 do PRD e da arquitetura da iniciativa. |
| 2026-04-09 | Story refinada para explicitar arquivo canônico, formato mínimo do resumo, critérios de encerramento e rastreabilidade documental. |
| 2026-04-09 | Resumo stakeholder implementado no brief canônico com links para PRD, UX e arquitetura; execução documental sem alteração de código. |

---

## Checklist DoD (story)

- [x] Resumo documental criado ou atualizado
- [x] Links verificados
- [x] File list preenchida
- [x] Critérios de aceite encerrados com evidência objetiva

---

## QA Results

- A preencher por @qa.
