---
description: Fluxo AIOS para novas funcionalidades (analyst → po → dev → qa).
---

# Feature Flow — AIOS Orchestrated Workflow

Fluxo completo para implementação de novas funcionalidades, do levantamento ao QA gate.

## Como usar

Comando Cursor: **`/feature-flow`**. Na mesma mensagem, descreve a feature (objetivo, utilizador, critérios de sucesso).

**Referência igual:** `.cursor/workflows/feature-flow.md`

**AIOX (aiox-master):** `*workflow feature-flow` ou `*run-workflow feature-flow`, quando o motor AIOX estiver disponível.

---

## Fluxo

```
@analyst → @po → @dev → @qa → @dev (se necessário)
```

---

## Execução por fase

### Fase 1 — @analyst: Análise e Descoberta

**Ative:** `@analyst`

**Objetivo:** Entender o que precisa ser feito, onde e como, antes de qualquer código.

**O analyst deve:**
1. Mapear onde a feature se encaixa na arquitetura existente
2. Identificar componentes/serviços/APIs que serão afetados ou reutilizados
3. Verificar se já existe algo similar que pode ser adaptado (princípio REUSE > ADAPT > CREATE)
4. Identificar dependências externas (APIs Meta, Supabase, etc.)
5. Estimar complexidade e riscos
6. Propor abordagem de implementação

**Entrega para o próximo agente:**
- Mapa de arquivos afetados
- Abordagem proposta
- Riscos e dependências identificados
- Componentes existentes que podem ser reaproveitados

**Handoff:** Quando o analyst completar, ative `@po`.

---

### Fase 2 — @po: Definição de Escopo e Critérios

**Ative:** `@po`

**Objetivo:** Transformar a análise em critérios de aceitação claros e escopo fechado.

**O po deve:**
1. Revisar a análise do analyst
2. Definir o que está IN e OUT do escopo
3. Escrever critérios de aceitação testáveis (Given/When/Then quando possível)
4. Validar que a abordagem proposta faz sentido para o produto
5. Dar GO ou solicitar ajustes ao analyst

**Decisão:**
- **GO** → ativa `@dev` com escopo e critérios definidos
- **NO-GO** → retorna ao `@analyst` com refinamentos necessários

---

### Fase 3 — @dev: Implementação

**Ative:** `@dev`

**Objetivo:** Implementar a feature conforme o escopo e critérios definidos pelo po.

**O dev deve:**
1. Ler os arquivos identificados pelo analyst
2. Verificar padrões existentes antes de criar algo novo
3. Implementar seguindo as convenções do projeto (`@/` imports, Tailwind, Radix UI, etc.)
4. Verificar typecheck: `npm run typecheck`
5. Verificar lint: `npm run lint`
6. Não implementar além do escopo aprovado pelo po

**Regras:**
- Preferir editar arquivos existentes a criar novos
- Não adicionar abstrações prematuras
- Se descobrir necessidade de escopo adicional, pausar e consultar o po

**Handoff:** Quando o dev completar, ativa `@qa`.

---

### Fase 4 — @qa: Revisão de Qualidade

**Ative:** `@qa`

**Objetivo:** Verificar se a feature atende os critérios do po e segue os padrões do projeto.

**O qa deve:**
1. Verificar cada critério de aceitação definido pelo po
2. Revisar o código: padrões, multi-tenancy (owner_type/owner_id), imports absolutos
3. Verificar regressões potenciais em fluxos adjacentes
4. Verificar typecheck e lint passando
5. Documentar tech debts identificados (sem bloquear por eles)

**Checklist específico deste projeto:**
- [ ] Props passadas corretamente (não declaradas na interface mas nunca usadas)
- [ ] Queries usam `owner_id + owner_type` (não `company_id` direto)
- [ ] Imports usando `@/` (não relativos)
- [ ] Funciona para `ownerType === 'person'` além de `'company'`

**Decisão:**
- **PASS** → feature aprovada, workflow encerrado
- **CONCERNS** → aprovada com observações documentadas
- **FAIL** → retorna ao `@dev` com feedback específico

---

### Fase 5 — @dev: Aplicar Fixes do QA (se FAIL)

**Ative:** `@dev` novamente

**Objetivo:** Aplicar apenas as correções indicadas pelo QA.

**Repetir Fases 4-5 até PASS ou CONCERNS (máx 3 iterações).**

---

## Checklist de encerramento

- [ ] Análise de impacto feita (pelo analyst)
- [ ] Escopo fechado e critérios de aceitação definidos (pelo po)
- [ ] Padrões existentes verificados (REUSE > ADAPT > CREATE)
- [ ] Typecheck passando
- [ ] Lint passando
- [ ] Todos critérios de aceitação atendidos
- [ ] QA gate: PASS ou CONCERNS com observações
- [ ] Tech debts identificados documentados

---

## Notas

- O @dev **nunca implementa** sem GO do @po
- O escopo é **fechado** — se surgir algo novo, consultar o po antes de implementar
- Tech debts identificados em qualquer fase são documentados mas não bloqueiam a entrega
