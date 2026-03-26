/**
 * Instala regras de roteamento LLM:
 * - .claude/rules/llm-routing.md (Claude Code)
 * - .cursor/rules/llm-routing.mdc (Cursor)
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');

const ROUTING_RULES = `- **CLI first**: preferir scripts e gates (\`npm run lint\`, \`typecheck\`, \`test\`) antes da UI.
- **Idempotência**: passos do bootstrap devem poder rerodar sem corromper estado.
- **Checkpoint**: após falha, usar \`*full-setup --resume\`.`;

const ROUTING_TABLE_CLAUDE = `| Área | Modelo | Exemplos |
|------|--------|----------|
| Pré-checks, cópias, validação simples | haiku | listar arquivos, diff estático |
| Orquestração, merges de config, diagnóstico | sonnet | pipeline bootstrap, relatórios |
| Debugging profundo / causa raiz incerta | opus | falhas intermitentes, race conditions |`;

const ROUTING_TABLE_CURSOR = `| Área | Modelo no Cursor (sugestão) | Exemplos |
|------|------------------------------|----------|
| Pré-checks, cópias, validação simples | **Auto** ou modelo rápido / económico | listar ficheiros, diff estático, formatação |
| Orquestração, implementação, diagnóstico típico | **Auto** ou modelo predefinido equilibrado | features, refactors, revisão de PR |
| Debugging profundo / causa raiz incerta / arquitetura pesada | **Auto** com modelo **Max** ou raciocínio prolongado (quando disponível) | falhas intermitentes, race conditions, trade-offs amplos |`;

const ROUTING_EQUIV = `| Cursor (sugestão) | Claude API / Claude Code |
|-------------------|---------------------------|
| Modelo rápido / económico | Haiku |
| Modelo equilibrado / Auto típico | Sonnet |
| Max / raciocínio profundo | Opus |`;

function claudeRoutingDoc() {
  return `# LLM routing — bootstrap-pipeline

Matriz sugerida (AIOX). Ajuste por projeto. No **Claude Code**, prefira o modelo da coluna conforme a complexidade da tarefa (API / cliente).

## Mapa rápido Cursor → Claude Code

| Cursor (seletor manual) | Claude Code / API |
|-------------------------|-------------------|
| Auto, rápido, equilibrado, Max | **haiku**, **sonnet**, **opus** (ou equivalente no teu fluxo) |
| Sem roteamento automático no IDE | Pode combinar com automações e comandos internos |

## Quando mudar de modelo (heurística)

**Manter haiku** quando: leitura pontual, grep, pequenos edits, formatação, perguntas pontuais.

**Usar sonnet** para: implementação típica, refactors médios, diagnóstico habitual, orquestração de tarefas.

**Subir para opus** quando: causa raiz incerta, falha intermitente, concorrência, segurança/revisão sensível, desenho arquitetural novo, ou várias tentativas falhadas no mesmo problema.

## Matriz sugerida (AIOX)

${ROUTING_TABLE_CLAUDE}

## Equivalente no Cursor

Ficheiro versionado: \`.cursor/rules/llm-routing.mdc\` (mesma lógica, adaptada ao seletor do Cursor).

${ROUTING_EQUIV}

## Alinhamento com o fluxo AIOX

- **Stories:** requisitos em \`docs/stories/\` permanecem canónicos.
- **Memória Cursor:** \`.cursor/mem/PROJECT_MEMORY.md\`; no Claude Code pode usar plugin **claude-mem** onde configurado.
- **CLI first:** gates (\`npm run lint\`, \`typecheck\`, \`test\`) quando o trabalho toca código.

## Regras operacionais (bootstrap / pipeline)

${ROUTING_RULES}

## Bootstraps e manutenção

Este ficheiro pode ser **reescrito** pelo passo \`llm-routing\` do bootstrap. Personalizações: atualizar também \`squads/bootstrap-pipeline/scripts/bootstrap/steps/llm-routing.js\` ou registar desvio no \`PROJECT_MEMORY.md\`.

_Generado pelo pipeline AIOX bootstrap-pipeline._
`;
}

function cursorRoutingMdc() {
  return `---
description: Roteamento de modelo LLM no Cursor (paridade com llm-routing Claude)
alwaysApply: true
---

# LLM routing (Cursor)

No **Cursor**, o IDE **não** escolhe o modelo sozinho com base nesta regra. A matriz abaixo orienta **ti** e o assistente sobre **qual perfil** usar no **seletor de modelo** e, quando fizer sentido, no modo (**Chat**, **Composer**, **Agent**).

## Mapa rápido Claude Code → Cursor

| Claude Code (ex.: API / workflow com Haiku, Sonnet, Opus) | Cursor |
|----------------------------------------------------------|--------|
| Nomes de modelo explícitos | **Auto**, modelo **rápido/económico**, **equilibrado**, **Max** ou raciocínio prolongado (conforme o teu plano e disponibilidade) |
| Roteamento pode estar em automações internas | **Manual** — escolha no seletor **por tarefa** |

## Quando mudar de perfil (heurística)

**Manter Auto ou modelo rápido/económico** quando: leitura pontual, grep, pequenos edits, formatação, perguntas de esclarecimento, diff localizado.

**Subir para modelo mais forte ou Max / raciocínio prolongado** quando: causa raiz **incerta**, bug **intermitente**, concorrência/race conditions, segurança e revisão de auth/pagamentos, desenho arquitetural novo, refactors amplos em cadeia, ou **duas tentativas falhadas** seguidas no mesmo problema.

**Para o assistente:** se o risco ou a ambiguidade forem altos, **explicitar** que convém modelo/modo mais forte — sem assumir que o seletor já foi alterado.

## Matriz sugerida (AIOX)

Ajuste por projeto. Use o **seletor de modelo** do Cursor conforme a complexidade.

${ROUTING_TABLE_CURSOR}

## Equivalência com Claude Code (Anthropic)

${ROUTING_EQUIV}

## Alinhamento com o fluxo AIOX

- **Stories:** requisitos e critérios em \`docs/stories/\` permanecem canónicos; esta matriz **não** os substitui.
- **Memória:** factos transversais em \`.cursor/mem/PROJECT_MEMORY.md\`; consolidar muito contexto disperso costuma beneficiar de modelo mais forte.
- **CLI first:** preferir gates (\`npm run lint\`, \`typecheck\`, \`test\`) quando o trabalho toca código.

## Regras operacionais (bootstrap / pipeline)

${ROUTING_RULES}

## Bootstraps e manutenção

- O passo **\`llm-routing\`** do bootstrap AIOX pode **reescrever** \`.cursor/rules/llm-routing.mdc\` (e \`.claude/rules/llm-routing.md\`). Se personalizares este ficheiro, **replica** a alteração no gerador em \`squads/bootstrap-pipeline/scripts/bootstrap/steps/llm-routing.js\` para não perder mudanças no próximo setup — ou regista o desvio em \`PROJECT_MEMORY.md\`.

_Generado pelo pipeline AIOX bootstrap-pipeline._
`;
}

function claudeFileOk(projectRoot) {
  const f = path.join(projectRoot, '.claude', 'rules', 'llm-routing.md');
  if (!fs.existsSync(f)) return false;
  const body = fs.readFileSync(f, 'utf8');
  return body.includes('bootstrap-pipeline') && body.includes('LLM routing');
}

function cursorFileOk(projectRoot) {
  const f = path.join(projectRoot, '.cursor', 'rules', 'llm-routing.mdc');
  if (!fs.existsSync(f)) return false;
  const body = fs.readFileSync(f, 'utf8');
  return body.includes('bootstrap-pipeline') && body.includes('LLM routing (Cursor)');
}

class LlmRoutingStep extends StepInterface {
  constructor() {
    super('llm-routing', 'Install LLM Routing');
  }

  async check(context) {
    return claudeFileOk(context.projectRoot) && cursorFileOk(context.projectRoot);
  }

  async dryRun() {
    return 'Escrever .claude/rules/llm-routing.md e .cursor/rules/llm-routing.mdc com matriz de roteamento';
  }

  async execute(context) {
    const start = Date.now();
    try {
      const claudeDir = path.join(context.projectRoot, '.claude', 'rules');
      const cursorDir = path.join(context.projectRoot, '.cursor', 'rules');
      fs.mkdirSync(claudeDir, { recursive: true });
      fs.mkdirSync(cursorDir, { recursive: true });

      fs.writeFileSync(path.join(claudeDir, 'llm-routing.md'), claudeRoutingDoc(), 'utf8');
      fs.writeFileSync(path.join(cursorDir, 'llm-routing.mdc'), cursorRoutingMdc(), 'utf8');

      return this._success('Regras llm-routing instaladas (Claude + Cursor)', 'configured', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { LlmRoutingStep };
