/**
 * Status line: ~/.claude/statusline.sh + trecho statusLine em .claude/settings.json
 */

const fs = require('fs');
const path = require('path');
const { StepInterface } = require('../step-interface');
const {
  squadRootFromStepsDir,
  expandHome,
  readJsonSafe,
  writeJson,
  mergeDefaults,
  copyIfMissingOrDifferent,
} = require('../utils');

class StatusLineStep extends StepInterface {
  constructor() {
    super('status-line', 'Configure Status Line');
  }

  _paths() {
    const squadRoot = squadRootFromStepsDir(__dirname);
    const tmplSettings = path.join(squadRoot, 'templates', 'settings.json.tmpl');
    const tmplScript = path.join(squadRoot, 'templates', 'statusline.sh.tmpl');
    return { squadRoot, tmplSettings, tmplScript };
  }

  async check(context) {
    const { tmplSettings, tmplScript } = this._paths();
    if (!fs.existsSync(tmplSettings) || !fs.existsSync(tmplScript)) return false;

    const projectSettings = path.join(context.projectRoot, '.claude', 'settings.json');
    const j = readJsonSafe(projectSettings);
    if (!j.statusLine || j.statusLine.type !== 'command') return false;

    const homeScript = expandHome('~/.claude/statusline.sh');
    return fs.existsSync(homeScript);
  }

  async dryRun(context) {
    return `Copiar statusline.sh.tmpl → ${expandHome('~/.claude/statusline.sh')} e mesclar statusLine no .claude/settings.json do projeto`;
  }

  async execute(context) {
    const start = Date.now();
    const { tmplSettings, tmplScript } = this._paths();

    if (!fs.existsSync(tmplSettings) || !fs.existsSync(tmplScript)) {
      return this._failed(
        new Error('Templates statusline/settings ausentes em squads/bootstrap-pipeline/templates'),
        Date.now() - start
      );
    }

    try {
      const templateSettings = JSON.parse(fs.readFileSync(tmplSettings, 'utf8'));
      const statusCfg = templateSettings.statusLine;
      const projectFile = path.join(context.projectRoot, '.claude', 'settings.json');
      const merged = mergeDefaults({ statusLine: statusCfg }, readJsonSafe(projectFile));
      writeJson(projectFile, merged);

      const destScript = expandHome('~/.claude/statusline.sh');
      copyIfMissingOrDifferent(tmplScript, destScript);
      if (process.platform !== 'win32') {
        try {
          fs.chmodSync(destScript, 0o755);
        } catch {
          /* ignore */
        }
      }

      return this._success('Status line configurada (script em ~/.claude, settings no projeto)', 'configured', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { StatusLineStep };
