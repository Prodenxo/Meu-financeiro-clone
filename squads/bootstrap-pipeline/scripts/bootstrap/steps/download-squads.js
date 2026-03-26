/**
 * Valida squads em data/default-squads.yaml (local-copy → pasta squads/<name>).
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');
const { squadRootFromStepsDir, parseSquadsYaml } = require('../utils');

class DownloadSquadsStep extends StepInterface {
  constructor() {
    super('download-squads', 'Download Essential Squads');
  }

  _dataFile() {
    return path.join(squadRootFromStepsDir(__dirname), 'data', 'default-squads.yaml');
  }

  async check(context) {
    const file = this._dataFile();
    if (!fs.existsSync(file)) return true;
    const squads = parseSquadsYaml(fs.readFileSync(file, 'utf8'));
    for (const s of squads) {
      if (!s.required) continue;
      const dir = path.join(context.projectRoot, 'squads', s.name);
      if (!fs.existsSync(dir)) return false;
    }
    return true;
  }

  async dryRun(context) {
    return 'Ler default-squads.yaml e garantir pastas squads/<name> para itens obrigatórios';
  }

  async execute(context) {
    const start = Date.now();
    const file = this._dataFile();
    if (!fs.existsSync(file)) {
      return this._success('Sem default-squads.yaml — etapa ignorada', 'skipped', Date.now() - start);
    }

    const squads = parseSquadsYaml(fs.readFileSync(file, 'utf8'));
    const missing = [];

    for (const s of squads) {
      if (!s.required) continue;
      const dir = path.join(context.projectRoot, 'squads', s.name);
      if (!fs.existsSync(dir)) missing.push(`${s.name} (source: ${s.source})`);
    }

    if (missing.length) {
      return this._failed(
        new Error(
          `Squads obrigatórios ausentes em squads/: ${missing.join(
            '; '
          )}. Adicione os diretórios ou ajuste data/default-squads.yaml.`
        ),
        Date.now() - start
      );
    }

    const required = squads.filter((s) => s.required);
    return this._success(
      `${required.length || squads.length} squad(s) obrigatório(s) presentes no repositório`,
      'verified',
      Date.now() - start
    );
  }
}

module.exports = { DownloadSquadsStep };
