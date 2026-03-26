/**
 * Mescla settings.json.tmpl, CLAUDE.md.tmpl, hook detect-agent em ~/.claude/hooks
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

class BasicConfigsStep extends StepInterface {
  constructor() {
    super('basic-configs', 'Install Basic Configs');
  }

  _tmplDir() {
    return path.join(squadRootFromStepsDir(__dirname), 'templates');
  }

  async check(context) {
    const tdir = this._tmplDir();
    const claudeMd = path.join(context.projectRoot, '.claude', 'CLAUDE.md');
    const hook = expandHome('~/.claude/hooks/detect-agent.cjs');
    const settings = path.join(context.projectRoot, '.claude', 'settings.json');

    if (!fs.existsSync(tdir) || !fs.existsSync(settings)) return false;
    const j = readJsonSafe(settings);
    if (!Array.isArray(j.permissions?.allow)) return false;
    if (!j.hooks?.UserPromptSubmit) return false;
    if (!fs.existsSync(claudeMd)) return false;
    if (!fs.existsSync(hook)) return false;
    return true;
  }

  async dryRun(context) {
    return 'Mesclar templates/settings.json.tmpl → .claude/settings.json; CLAUDE.md.tmpl; detect-agent.cjs → ~/.claude/hooks';
  }

  async execute(context) {
    const start = Date.now();
    const tdir = this._tmplDir();
    const settingsTmpl = path.join(tdir, 'settings.json.tmpl');
    const claudeTmpl = path.join(tdir, 'CLAUDE.md.tmpl');
    const hookTmpl = path.join(tdir, 'detect-agent.cjs.tmpl');

    try {
      if (!fs.existsSync(settingsTmpl) || !fs.existsSync(claudeTmpl) || !fs.existsSync(hookTmpl)) {
        return this._failed(new Error('Templates básicos ausentes em squads/bootstrap-pipeline/templates'), Date.now() - start);
      }

      const template = JSON.parse(fs.readFileSync(settingsTmpl, 'utf8'));
      const projectSettings = path.join(context.projectRoot, '.claude', 'settings.json');
      const merged = mergeDefaults(template, readJsonSafe(projectSettings));
      writeJson(projectSettings, merged);

      const claudeDest = path.join(context.projectRoot, '.claude', 'CLAUDE.md');
      copyIfMissingOrDifferent(claudeTmpl, claudeDest);

      const hookDest = expandHome('~/.claude/hooks/detect-agent.cjs');
      copyIfMissingOrDifferent(hookTmpl, hookDest);

      return this._success('Settings, CLAUDE.md e hook detect-agent aplicados', 'configured', Date.now() - start);
    } catch (e) {
      return this._failed(e, Date.now() - start);
    }
  }
}

module.exports = { BasicConfigsStep };
