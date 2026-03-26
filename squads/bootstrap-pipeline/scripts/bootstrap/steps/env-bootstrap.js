/**
 * Diretórios .aiox e git init quando necessário (não altera remotes).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { StepInterface } = require('../step-interface');

class EnvBootstrapStep extends StepInterface {
  constructor() {
    super('env-bootstrap', 'Environment Bootstrap');
  }

  async check(context) {
    const aiox = path.join(context.projectRoot, '.aiox');
    const hasDirs =
      fs.existsSync(path.join(aiox, 'logs')) && fs.existsSync(path.join(aiox, 'reports'));
    return hasDirs && fs.existsSync(path.join(context.projectRoot, '.git'));
  }

  async dryRun(context) {
    return 'Criar .aiox/logs e .aiox/reports; git init apenas se .git não existir';
  }

  async execute(context) {
    const start = Date.now();
    const root = context.projectRoot;
    try {
      const aiox = path.join(root, '.aiox');
      fs.mkdirSync(path.join(aiox, 'logs'), { recursive: true });
      fs.mkdirSync(path.join(aiox, 'reports'), { recursive: true });

      const gitDir = path.join(root, '.git');
      if (!fs.existsSync(gitDir)) {
        execSync('git init', { cwd: root, stdio: 'pipe', encoding: 'utf8' });
        context.gitInitialized = true;
        return this._success('git init + pastas .aiox criadas', 'initialized', Date.now() - start);
      }

      context.gitInitialized = true;
      return this._success('Repositório Git já existia; .aiox garantido', 'verified', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { EnvBootstrapStep };
