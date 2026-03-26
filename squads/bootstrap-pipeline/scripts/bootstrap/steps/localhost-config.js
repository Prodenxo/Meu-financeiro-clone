/**
 * Porta localhost AIOX (37770) em .claude/settings.json → env.AIOX_LOCALHOST_PORT
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');
const { readJsonSafe, writeJson, mergeDefaults } = require('../utils');

const PORT = '37770';

class LocalhostStep extends StepInterface {
  constructor() {
    super('localhost', 'Configure Localhost');
  }

  async check(context) {
    const f = path.join(context.projectRoot, '.claude', 'settings.json');
    if (!fs.existsSync(f)) return false;
    const j = readJsonSafe(f);
    return String(j.env?.AIOX_LOCALHOST_PORT || '') === PORT;
  }

  async dryRun() {
    return `Definir env.AIOX_LOCALHOST_PORT=${PORT} em .claude/settings.json`;
  }

  async execute(context) {
    const start = Date.now();
    try {
      const projectFile = path.join(context.projectRoot, '.claude', 'settings.json');
      const existing = readJsonSafe(projectFile);
      const merged = mergeDefaults({ env: { AIOX_LOCALHOST_PORT: PORT } }, existing);
      writeJson(projectFile, merged);

      return this._success(`Porta ${PORT} registrada em settings (env)`, 'configured', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { LocalhostStep };
