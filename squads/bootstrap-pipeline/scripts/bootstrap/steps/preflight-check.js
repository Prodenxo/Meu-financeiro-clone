/**
 * Pre-flight: Node >= 18, Git, GitHub CLI auth, context flags.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');
const { hasClaudeCli } = require('../utils');

class PreflightCheck extends StepInterface {
  constructor() {
    super('preflight', 'Pre-flight Check');
  }

  async check() {
    return false;
  }

  async dryRun() {
    return 'Verify Node.js >= 18, Git, GitHub CLI authenticated; detect Git / Claude CLI';
  }

  async execute(context) {
    const start = Date.now();
    const done = (msg, action) => this._success(msg, action, Date.now() - start);
    const sh = { stdio: 'pipe', encoding: 'utf8', shell: true, cwd: context.projectRoot };

    try {
      const major = parseInt(String(process.version).replace(/^v/, '').split('.')[0], 10);
      if (Number.isFinite(major) && major < 18) {
        return this._failed(new Error(`Node.js ${process.version} — requer >= 18`), Date.now() - start);
      }

      try {
        execSync('git --version', sh);
      } catch (e) {
        return this._failed(
          new Error(
            'Git não encontrado no PATH. Instale o Git para Windows e reinicie o terminal: https://git-scm.com/download/win'
          ),
          Date.now() - start
        );
      }

      let ghStatus = 'omitido (gh não instalado)';
      context.githubCliPresent = false;
      let ghInstalled = false;
      try {
        execSync('gh --version', sh);
        ghInstalled = true;
      } catch {
        /* gh opcional para este bootstrap (squads locais, npm) */
      }

      if (ghInstalled) {
        context.githubCliPresent = true;
        try {
          execSync('gh auth status', sh);
          ghStatus = 'autenticado';
        } catch {
          return this._failed(
            new Error(
              'GitHub CLI (gh) está instalado mas não há sessão ativa. Execute: gh auth login'
            ),
            Date.now() - start
          );
        }
      }

      context.gitInitialized = fs.existsSync(path.join(context.projectRoot, '.git'));
      context.claudeInstalled = hasClaudeCli();

      return done(
        `Node ${process.version}, Git OK, gh: ${ghStatus}, Claude CLI: ${context.claudeInstalled ? 'sim' : 'não'}`,
        'verified'
      );
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { PreflightCheck };
