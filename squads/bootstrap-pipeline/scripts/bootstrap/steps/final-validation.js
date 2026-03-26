/**
 * Roda validate:agents e validate:structure quando existirem em package.json.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { StepInterface } = require('../step-interface');

class FinalValidationStep extends StepInterface {
  constructor() {
    super('final-validation', 'Final Validation');
  }

  async check() {
    return false;
  }

  async dryRun(context) {
    return 'npm run validate:structure e validate:agents (se definidos na raiz)';
  }

  async execute(context) {
    const start = Date.now();
    const pkgPath = path.join(context.projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      return this._success('Sem package.json — validação de monorepo ignorada', 'skipped', Date.now() - start);
    }

    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (e) {
      return this._failed(new Error(`package.json inválido: ${e.message}`), Date.now() - start);
    }

    const scripts = pkg.scripts || {};
    const chain = [];
    if (scripts['validate:structure']) chain.push('validate:structure');
    if (scripts['validate:agents']) chain.push('validate:agents');

    if (!chain.length) {
      return this._success(
        'Nenhum script validate:* na raiz — defina validate:structure / validate:agents para ativar',
        'skipped',
        Date.now() - start
      );
    }

    try {
      for (const s of chain) {
        execSync(`npm run ${s}`, {
          cwd: context.projectRoot,
          stdio: 'inherit',
          shell: true,
        });
      }
      return this._success(`OK: ${chain.join(', ')}`, 'verified', Date.now() - start);
    } catch (e) {
      return this._failed(
        new Error(`Validação falhou (${chain.join(', ')}): ${e.message}`),
        Date.now() - start
      );
    }
  }
}

module.exports = { FinalValidationStep };
