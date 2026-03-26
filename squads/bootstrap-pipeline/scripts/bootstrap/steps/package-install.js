/**
 * npm / yarn / pnpm install na raiz do projeto.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { StepInterface } = require('../step-interface');

function detectPm(root) {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

class PackageInstallStep extends StepInterface {
  constructor() {
    super('package-install', 'Package Install');
  }

  async check(context) {
    return fs.existsSync(path.join(context.projectRoot, 'node_modules'));
  }

  async dryRun(context) {
    const pm = detectPm(context.projectRoot);
    return `Executar ${pm} install na raiz (${context.projectRoot})`;
  }

  async execute(context) {
    const start = Date.now();
    const root = context.projectRoot;
    const pkg = path.join(root, 'package.json');
    if (!fs.existsSync(pkg)) {
      return this._skipped('Sem package.json na raiz — nada a instalar');
    }

    const pm = detectPm(root);
    context.packageManager = pm;

    const cmds = {
      npm: ['npm', 'install'],
      yarn: ['yarn', 'install'],
      pnpm: ['pnpm', 'install'],
    };
    const [bin, ...args] = cmds[pm];

    try {
      execSync([bin, ...args].join(' '), {
        cwd: root,
        stdio: 'inherit',
        shell: true,
      });
      return this._success(`${pm} install concluído`, 'installed', Date.now() - start);
    } catch (e) {
      return this._failed(new Error(`${pm} install falhou: ${e.message}`), Date.now() - start);
    }
  }
}

module.exports = { PackageInstallStep };
