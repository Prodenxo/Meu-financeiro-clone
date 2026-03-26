/**
 * Verifica plugins em default-plugins.yaml; instruções interativas quando não automatizável.
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');
const { squadRootFromStepsDir, expandHome, parsePluginsYaml } = require('../utils');

function pluginLikelyInstalled(name) {
  const home = expandHome('~/.claude');
  const candidates = [
    path.join(home, 'plugins', name),
    path.join(home, 'plugins', `claude-${name}`),
    path.join(home, 'data', 'plugins', name),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

class InstallPluginsStep extends StepInterface {
  constructor() {
    super('install-plugins', 'Install Plugins');
  }

  _dataFile() {
    return path.join(squadRootFromStepsDir(__dirname), 'data', 'default-plugins.yaml');
  }

  async check(context) {
    const file = this._dataFile();
    if (!fs.existsSync(file)) return true;
    const plugins = parsePluginsYaml(fs.readFileSync(file, 'utf8'));
    for (const p of plugins) {
      if (!p.required) continue;
      if (!pluginLikelyInstalled(p.name)) return false;
    }
    return true;
  }

  async dryRun() {
    return 'Ler default-plugins.yaml; verificar diretórios em ~/.claude/plugins; registrar comandos /plugin se faltar';
  }

  async execute(context) {
    const start = Date.now();
    const file = this._dataFile();
    if (!fs.existsSync(file)) {
      return this._success('Sem default-plugins.yaml — ignorado', 'skipped', Date.now() - start);
    }

    const plugins = parsePluginsYaml(fs.readFileSync(file, 'utf8'));
    const pending = [];

    for (const p of plugins) {
      if (!p.required) continue;
      if (!pluginLikelyInstalled(p.name)) pending.push(p.name);
    }

    if (pending.length) {
      let msg = `Plugin(s) não detectado(s) em ~/.claude: ${pending.join(
        ', '
      )} — instale no Claude Code (comandos em squads/bootstrap-pipeline/data/default-plugins.yaml)`;
      if (pending.includes('claude-mem')) {
        msg +=
          ' | **Cursor:** use `.cursor/mem/PROJECT_MEMORY.md` + a regra `.cursor/rules/cursor-mem-protocol.mdc` como equivalente ao claude-mem.';
      }
      return this._success(msg, 'delegated', Date.now() - start);
    }

    return this._success('Plugins obrigatórios parecem instalados', 'verified', Date.now() - start);
  }
}

module.exports = { InstallPluginsStep };
