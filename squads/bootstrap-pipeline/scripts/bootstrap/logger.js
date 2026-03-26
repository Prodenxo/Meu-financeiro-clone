/**
 * Logger — Centralized logging for terminal and file output.
 *
 * @module logger
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class Logger {
  /**
   * @param {Object} options
   * @param {string} options.projectRoot - Project root path
   * @param {boolean} [options.verbose=false] - Enable verbose output
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.verbose = options.verbose || false;
    this._buffer = [];
    this._timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this._logDir = path.join(this.projectRoot, '.aiox', 'logs');
  }

  /**
   * Log an info message.
   * @param {string} message
   */
  info(message) {
    const line = `[${this._ts()}] [INFO] ${message}`;
    this._buffer.push(line);
    if (this.verbose) console.log(`  ℹ ${message}`);
  }

  /**
   * Log a warning.
   * @param {string} message
   */
  warn(message) {
    const line = `[${this._ts()}] [WARN] ${message}`;
    this._buffer.push(line);
    console.log(`  ⚠ ${message}`);
  }

  /**
   * Log a step error.
   * @param {string} stepId
   * @param {string} message
   */
  error(stepId, message) {
    const line = `[${this._ts()}] [ERROR] [${stepId}] ${message}`;
    this._buffer.push(line);
    console.error(`  ✗ [${stepId}] ${message}`);
  }

  /**
   * Log step progress.
   * @param {number} current - Current step (1-based)
   * @param {number} total - Total steps
   * @param {string} name - Step display name
   * @param {string} status - 'success' | 'skipped' | 'failed'
   * @param {number} duration - Duration in ms
   */
  progress(current, total, name, status, duration) {
    const pad = String(current).padStart(String(total).length, ' ');
    const dots = '.'.repeat(Math.max(1, 40 - name.length));
    const icon = status === 'failed' ? '✗' : '✓';
    const durStr = duration > 0 ? ` (${(duration / 1000).toFixed(1)}s)` : '';
    const statusStr = status === 'skipped' ? 'Already configured' : '';

    const line = `  [${pad}/${total}] ${name}${dots} ${icon} ${statusStr}${durStr}`;
    this._buffer.push(`[${this._ts()}] [${status.toUpperCase()}] [${name}] ${durStr}`);
    console.log(line);
  }

  /**
   * Log dry-run step.
   * @param {number} current
   * @param {number} total
   * @param {string} name
   * @param {string} description
   */
  dryRun(current, total, name, description) {
    const pad = String(current).padStart(String(total).length, ' ');
    console.log(`  [DRY-RUN] [${pad}/${total}] ${name} → would: ${description}`);
    this._buffer.push(`[${this._ts()}] [DRY-RUN] [${name}] ${description}`);
  }

  /**
   * Flush buffer to log file.
   * @returns {Promise<void>}
   */
  async flush() {
    if (this._buffer.length === 0) return;

    if (!fs.existsSync(this._logDir)) {
      fs.mkdirSync(this._logDir, { recursive: true });
    }

    const logPath = path.join(this._logDir, `bootstrap-${this._timestamp}.log`);
    fs.writeFileSync(logPath, this._buffer.join('\n') + '\n', 'utf8');
  }

  /** @private */
  _ts() {
    return new Date().toISOString();
  }
}

module.exports = { Logger };
