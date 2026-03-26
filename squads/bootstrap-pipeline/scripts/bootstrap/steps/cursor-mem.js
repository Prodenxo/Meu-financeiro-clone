/**
 * Equivalente ao claude-mem para Cursor: memória de projeto versionada em .cursor/mem/
 * (o plugin claude-mem continua só no Claude Code; aqui é ficheiro + protocolo em rules).
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');

const MARKER = 'CURSOR-MEM-AIOX';

const PROJECT_MEMORY_TEMPLATE = `# Memória do projeto (Cursor)

<!--
${MARKER}
Este ficheiro substitui o papel do plugin **claude-mem** no Cursor: factos estáveis
sobre o repo, decisões e preferências da equipa. Atualize após conclusões importantes.
Não grave secrets, tokens nem dados pessoais.
-->

## Mapa rápido do repositório

| Área | Caminho |
|------|---------|
| Frontend | \`frontend/\` |
| Backend | \`backend/\` |
| Scripts raiz | \`scripts/\` |
| Documentação / stories | \`docs/\` |
| Framework AIOX (local) | \`.aiox-core/\` |
| Regras Cursor | \`.cursor/rules/\` |
| Bootstrap / squads | \`squads/\` |

## Decisões de arquitetura

- (ex.: stack auth, BD, limites entre frontend e backend)

## Convenções do repositório

- (ex.: branches, commits, idioma de mensagens)

## Preferências da equipa

- Responder em **português** nas interações do assistente.
- **CLI first** — \`npm run lint\`, \`typecheck\`, \`test\` como gates (ver \`AGENTS.md\`).

## Comandos úteis (raiz)

\`\`\`text
npm run dev
npm run dev:backend
npm run lint
npm run typecheck
npm run test
npm run sync:ide
npm run validate:structure
npm run validate:agents
\`\`\`

## Glossário / termos

- (termos de domínio do app para manter consistência na UI e API)

## Armadilhas conhecidas

- (bugs ambientais, passos manuais, "não fazer X porque Y")

## Contexto em aberto

- (pendências que afetam mais do que uma story)

## Última atualização

- Data: (YYYY-MM-DD) — Resumo: (uma linha)

`;

class CursorMemStep extends StepInterface {
  constructor() {
    super('cursor-mem', 'Install Cursor Project Memory');
  }

  async check(context) {
    const f = path.join(context.projectRoot, '.cursor', 'mem', 'PROJECT_MEMORY.md');
    if (!fs.existsSync(f)) return false;
    return fs.readFileSync(f, 'utf8').includes(MARKER);
  }

  async dryRun() {
    return 'Criar .cursor/mem/PROJECT_MEMORY.md se ausente (paridade com claude-mem)';
  }

  async execute(context) {
    const start = Date.now();
    try {
      const dir = path.join(context.projectRoot, '.cursor', 'mem');
      fs.mkdirSync(dir, { recursive: true });
      const f = path.join(dir, 'PROJECT_MEMORY.md');
      if (fs.existsSync(f)) {
        return this._success('PROJECT_MEMORY.md já existe — não sobrescrito', 'skipped', Date.now() - start);
      }
      fs.writeFileSync(f, PROJECT_MEMORY_TEMPLATE, 'utf8');
      return this._success('PROJECT_MEMORY.md criado (.cursor/mem/)', 'configured', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { CursorMemStep };
