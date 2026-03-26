/**
 * Helpers for bootstrap steps — paths, JSON merge, YAML snippets, shell.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/** Squad root: squads/bootstrap-pipeline */
function squadRootFromStepsDir(stepsDir) {
  return path.join(stepsDir, '..', '..', '..');
}

function expandHome(p) {
  if (typeof p !== 'string') return p;
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  if (p === '~') return os.homedir();
  return p;
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

/** Overlay user `existing` on top of `defaults` (user wins on conflicts). */
function mergeDefaults(defaults, existing) {
  if (existing === null || existing === undefined) {
    return JSON.parse(JSON.stringify(defaults));
  }
  if (typeof defaults !== 'object' || defaults === null || Array.isArray(defaults)) {
    return existing;
  }
  const out = { ...defaults };
  for (const k of Object.keys(existing)) {
    const ev = existing[k];
    const dv = defaults[k];
    if (
      ev &&
      typeof ev === 'object' &&
      !Array.isArray(ev) &&
      dv &&
      typeof dv === 'object' &&
      !Array.isArray(dv)
    ) {
      out[k] = mergeDefaults(dv, ev);
    } else {
      out[k] = ev;
    }
  }
  return out;
}

function writeFileEnsuringDir(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function copyIfMissingOrDifferent(src, dest) {
  const content = fs.readFileSync(src, 'utf8');
  if (fs.existsSync(dest)) {
    if (fs.readFileSync(dest, 'utf8') === content) return 'unchanged';
  }
  writeFileEnsuringDir(dest, content);
  return 'written';
}

/** Minimal parser for default-squads.yaml blocks */
function parseSquadsYaml(content) {
  const squads = [];
  const re = /-\s*name:\s*(\S+)([\s\S]*?)(?=\r?\n\s*-\s*name:|\r?\n\r?\n\w|\s*$|$)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const block = m[0];
    const name = m[1];
    const src = (block.match(/source:\s*["']?([^"'\r\n#]+)["']?/) || [])[1];
    const source = (src || 'unknown').trim();
    const required = /required:\s*true/.test(block);
    squads.push({ name, source, required });
  }
  return squads;
}

/** Plugins: name + optional install_commands lines */
function parsePluginsYaml(content) {
  const plugins = [];
  const re = /-\s*name:\s*(\S+)([\s\S]*?)(?=\r?\n\s*-\s*name:|\r?\n\r?\n\w|\s*$|$)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const block = m[0];
    const name = m[1];
    const required = /required:\s*true/.test(block);
    plugins.push({ name, required, block });
  }
  return plugins;
}

function hasClaudeCli() {
  const { execSync } = require('child_process');
  const opts = { stdio: 'pipe', encoding: 'utf8', shell: true };
  try {
    execSync(process.platform === 'win32' ? 'where claude' : 'which claude', opts);
    return true;
  } catch {
    try {
      execSync('claude --version', opts);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = {
  squadRootFromStepsDir,
  expandHome,
  readJsonSafe,
  writeJson,
  mergeDefaults,
  writeFileEnsuringDir,
  copyIfMissingOrDifferent,
  parseSquadsYaml,
  parsePluginsYaml,
  hasClaudeCli,
};
