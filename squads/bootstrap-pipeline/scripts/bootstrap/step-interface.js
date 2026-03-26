/**
 * StepInterface — Base contract for all pipeline steps.
 *
 * Every step in the bootstrap pipeline MUST implement this interface.
 * Steps are idempotent: check() determines if execute() is needed.
 *
 * @module step-interface
 * @version 1.0.0
 * @see docs/architecture/aiox-bootstrap-pipeline.md
 */

/**
 * @typedef {Object} PipelineContext
 * @property {string} os - Detected OS ('linux' | 'macos' | 'wsl')
 * @property {string} projectRoot - Absolute path to project root
 * @property {string} nodeVersion - Detected Node.js version
 * @property {string} packageManager - Detected package manager ('npm' | 'yarn' | 'pnpm' | 'nix')
 * @property {boolean} gitInitialized - Whether .git/ exists
 * @property {boolean} claudeInstalled - Whether claude CLI is in PATH
 * @property {Object} flags - { resume, dryRun, force, interactive, verbose }
 */

/**
 * @typedef {Object} StepResult
 * @property {string} stepId - Unique step identifier (e.g., 'install-claude')
 * @property {'success'|'skipped'|'failed'} status - Step outcome
 * @property {string} message - Human-readable result description
 * @property {number} duration - Execution time in milliseconds
 * @property {string} action - Action taken ('installed', 'configured', 'skipped', 'delegated')
 * @property {Error|null} error - Captured error if failed
 */

class StepInterface {
  /**
   * @param {string} id - Unique step identifier (kebab-case)
   * @param {string} name - Display name for terminal output
   */
  constructor(id, name) {
    if (new.target === StepInterface) {
      throw new Error('StepInterface cannot be instantiated directly');
    }
    this.id = id;
    this.name = name;
  }

  /**
   * Check if this step has already been executed (idempotency guard).
   *
   * @param {PipelineContext} context - Shared pipeline context
   * @returns {Promise<boolean>} true if step is already done, false if needs execution
   * @example
   *   const done = await step.check(context);
   *   if (done) console.log('Already configured');
   */
  async check(context) {
    throw new Error(`${this.id}: check() not implemented`);
  }

  /**
   * Execute the step's action.
   *
   * @param {PipelineContext} context - Shared pipeline context
   * @returns {Promise<StepResult>} Result of execution
   * @throws {Error} Should NOT throw — capture errors and return StepResult with status 'failed'
   * @example
   *   const result = await step.execute(context);
   *   if (result.status === 'failed') handleError(result);
   */
  async execute(context) {
    throw new Error(`${this.id}: execute() not implemented`);
  }

  /**
   * Describe what this step would do without executing (dry-run).
   *
   * @param {PipelineContext} context - Shared pipeline context
   * @returns {Promise<string>} Human-readable description of planned action
   * @example
   *   const desc = await step.dryRun(context);
   *   console.log(`[DRY-RUN] ${step.name} → would: ${desc}`);
   */
  async dryRun(context) {
    throw new Error(`${this.id}: dryRun() not implemented`);
  }

  /**
   * Helper to create a successful StepResult.
   *
   * @param {string} message - Success message
   * @param {string} action - Action taken
   * @param {number} duration - Duration in ms
   * @returns {StepResult}
   */
  _success(message, action, duration) {
    return {
      stepId: this.id,
      status: 'success',
      message,
      duration,
      action,
      error: null,
    };
  }

  /**
   * Helper to create a skipped StepResult.
   *
   * @param {string} message - Skip reason
   * @returns {StepResult}
   */
  _skipped(message) {
    return {
      stepId: this.id,
      status: 'skipped',
      message,
      duration: 0,
      action: 'skipped',
      error: null,
    };
  }

  /**
   * Helper to create a failed StepResult.
   *
   * @param {Error} error - Captured error
   * @param {number} duration - Duration in ms
   * @returns {StepResult}
   */
  _failed(error, duration) {
    return {
      stepId: this.id,
      status: 'failed',
      message: error.message,
      duration,
      action: 'failed',
      error,
    };
  }
}

module.exports = { StepInterface };
