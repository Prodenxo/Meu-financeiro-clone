# Bug Fix Flow — AIOS Orchestrated Workflow

Fluxo completo para investigação e correção de bugs, do diagnóstico ao QA gate.

## Como usar

**Cursor (slash command):** `/bug-fix-flow` — definido em `.cursor/commands/bug-fix-flow.md` (aparece ao escrever `/` no chat).

**Definição executável (YAML AIOX, versionada):** [bug-fix-flow.yaml](./bug-fix-flow.yaml) — `workflow.id: bug-fix-flow`. Se o runner só ler `.aiox-core/development/workflows/`, copia ou faz symlink deste ficheiro para lá.

No agente **aiox-master:** `*workflow bug-fix-flow` ou `*run-workflow bug-fix-flow` (conforme o projeto apontar para `.cursor/workflows` ou cópia em `.aiox-core`).

Na mesma mensagem do comando, descreve o bug. Exemplo:
> `/bug-fix-flow` — Criação de campanha Meta retorna erro genérico ao salvar.

---

## Fluxo

```
@analyst → @po → @dev → @qa → @dev (se necessário)
```

---

## Execução por fase

### Fase 1 — @analyst: Investigação

**Ative:** `@analyst`

**Objetivo:** Identificar a causa raiz do bug antes de qualquer código ser tocado.

**O analyst deve:**
1. Ler os arquivos relevantes ao bug reportado
2. Rastrear o fluxo de dados: frontend → serviço → API → banco
3. Identificar o ponto exato de falha
4. Documentar: causa raiz, arquivos afetados, impacto
5. Propor abordagem de correção (sem implementar)

**Entrega para o próximo agente:**
- Causa raiz identificada
- Lista de arquivos a modificar
- Abordagem de correção proposta

**Handoff:** Quando o analyst completar a análise, ative `@po`.

---

### Fase 2 — @po: Validação de Escopo

**Ative:** `@po`

**Objetivo:** Validar que o escopo da correção é correto e não há side effects não mapeados.

**O po deve:**
1. Revisar a análise do analyst
2. Confirmar que a correção não quebra outros fluxos
3. Definir critérios de aceitação claros para o fix
4. Dar GO ou solicitar análise adicional ao analyst

**Decisão:**
- **GO** → ativa `@dev`
- **NO-GO** → retorna ao `@analyst` com questões específicas

---

### Fase 3 — @dev: Implementação

**Ative:** `@dev`

**Objetivo:** Implementar a correção de forma cirúrgica, sem escopo adicional.

**O dev deve:**
1. Ler os arquivos identificados pelo analyst
2. Implementar apenas o necessário para corrigir o bug
3. Verificar typecheck: `npm run typecheck`
4. Verificar lint: `npm run lint`
5. Não refatorar código além do necessário para o fix

**Regras:**
- Não adicionar features não solicitadas
- Não reformatar código não relacionado
- Se encontrar bugs adjacentes, documentar — não corrigir agora

**Handoff:** Quando o dev completar, ativa `@qa`.

---

### Fase 4 — @qa: Revisão de Qualidade

**Ative:** `@qa`

**Objetivo:** Verificar se a correção resolve o bug sem introduzir regressões.

**O qa deve:**
1. Revisar os arquivos modificados pelo dev
2. Verificar se os critérios de aceitação do po foram atendidos
3. Verificar se há regressões potenciais
4. Verificar typecheck e lint passando
5. Identificar tech debts (sem bloquear por eles)

**Decisão:**
- **PASS** → fix aprovado, workflow encerrado
- **CONCERNS** → aprovado com observações documentadas
- **FAIL** → retorna ao `@dev` com feedback específico

---

### Fase 5 — @dev: Aplicar Fixes do QA (se FAIL)

**Ative:** `@dev` novamente

**Objetivo:** Aplicar apenas as correções indicadas pelo QA.

**Repetir Fases 4-5 até PASS ou CONCERNS (máx 3 iterações).**

---

## Checklist de encerramento

- [ ] Causa raiz documentada (pelo analyst)
- [ ] Critérios de aceitação definidos (pelo po)
- [ ] Typecheck passando
- [ ] Lint passando
- [ ] QA gate: PASS ou CONCERNS com observações
- [ ] Tech debts identificados documentados

---

## Notas

- O fluxo é **linear** — cada agente aguarda o anterior completar
- O @dev não implementa nada sem GO do @po
- O @qa não aprova sem verificar os critérios do @po
- Tech debts identificados em qualquer fase são documentados mas **não bloqueiam** o fix
