/**
 * Install Claude Code CLI globally when missing (npm).
 */

const { execSync } = require('child_process');
const { StepInterface } = require('../step-interface');
const { hasClaudeCli } = require('../utils');

class InstallClaudeStep extends StepInterface {
  constructor() {
    super('install-claude', 'Install Claude Code');
  }

  async check(context) {
    if (context.claudeInstalled && hasClaudeCli()) return true;
    return hasClaudeCli();
  }

  async dryRun() {
    return 'npm install -g @anthropic-ai/claude-code (se o binário claude não estiver no PATH)';
  }

  async execute(context) {
    const start = Date.now();
    if (hasClaudeCli()) {
      context.claudeInstalled = true;
      return this._success('Claude CLI já disponível no PATH', 'skipped', Date.now() - start);
    }

    try {
      execSync('npm install -g @anthropic-ai/claude-code', {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, npm_config_yes: 'true' },
      });
      context.claudeInstalled = hasClaudeCli();
      if (!context.claudeInstalled) {
        return this._failed(
          new Error('Instalação terminou mas claude não apareceu no PATH'),
          Date.now() - start
        );
      }
      return this._success('Pacote @anthropic-ai/claude-code instalado globalmente', 'installed', Date.now() - start);
    } catch (e) {
      return this._failed(
        new Error(
          `Falha ao instalar Claude Code via npm: ${e.message}. Instale manualmente ou ajuste o PATH do npm global.`
        ),
        Date.now() - start
      );
    }
  }
}

module.exports = { InstallClaudeStep };
