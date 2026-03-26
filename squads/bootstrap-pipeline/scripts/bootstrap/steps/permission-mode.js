/**
 * Sandbox desligado + permissões amplas (modo produtivo / YOLO alinhado ao template).
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');
const { squadRootFromStepsDir, readJsonSafe, writeJson, mergeDefaults } = require('../utils');

class PermissionModeStep extends StepInterface {
  constructor() {
    super('permission-mode', 'Configure Permission Mode');
  }

  async check(context) {
    const f = path.join(context.projectRoot, '.claude', 'settings.json');
    if (!fs.existsSync(f)) return false;
    const j = readJsonSafe(f);
    return j.sandbox?.enabled === false && Array.isArray(j.permissions?.allow) && j.permissions.allow.includes('Bash');
  }

  async dryRun() {
    return 'Garantir sandbox.enabled=false e permissions do bootstrap (template) mescladas';
  }

  async execute(context) {
    const start = Date.now();
    const settingsTmpl = path.join(squadRootFromStepsDir(__dirname), 'templates', 'settings.json.tmpl');
    try {
      if (!fs.existsSync(settingsTmpl)) {
        return this._failed(new Error('settings.json.tmpl não encontrado'), Date.now() - start);
      }
      const template = JSON.parse(fs.readFileSync(settingsTmpl, 'utf8'));
      const subset = {
        permissions: template.permissions,
        sandbox: template.sandbox,
      };
      const projectFile = path.join(context.projectRoot, '.claude', 'settings.json');
      const merged = mergeDefaults(subset, readJsonSafe(projectFile));
      writeJson(projectFile, merged);
      return this._success('Permissões e sandbox alinhados ao template AIOX', 'configured', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { PermissionModeStep };
