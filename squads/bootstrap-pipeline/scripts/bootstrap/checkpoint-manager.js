/**
 * CheckpointManager — Persists and recovers pipeline state for resume.
 *
 * @module checkpoint-manager
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = '.aiox/bootstrap-state.json';

class CheckpointManager {
  /**
   * @param {Object} options
   * @param {string} options.projectRoot - Project root path
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.statePath = path.join(this.projectRoot, STATE_FILE);
  }

  /**
   * Save current pipeline state.
   *
   * @param {Object} state - BootstrapState object
   * @returns {Promise<void>}
   */
  async save(state) {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2), 'utf8');
  }

  /**
   * Load saved pipeline state.
   *
   * @returns {Promise<Object|null>} BootstrapState or null if no checkpoint
   */
  async load() {
    if (!fs.existsSync(this.statePath)) {
      return null;
    }
    try {
      const data = fs.readFileSync(this.statePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear checkpoint state (after successful completion).
   *
   * @returns {Promise<void>}
   */
  async clear() {
    if (fs.existsSync(this.statePath)) {
      fs.unlinkSync(this.statePath);
    }
  }

  /**
   * Check if a checkpoint exists.
   *
   * @returns {boolean}
   */
  exists() {
    return fs.existsSync(this.statePath);
  }
}

module.exports = { CheckpointManager };
