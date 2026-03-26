/**
 * StepRunner — Executes individual pipeline steps with timeout and formatting.
 *
 * @module step-runner
 * @version 1.0.0
 */

const DEFAULT_TIMEOUT = 120000; // 2 minutes

class StepRunner {
  /**
   * @param {Object} options
   * @param {Object} options.logger - Logger instance
   * @param {number} [options.timeout=120000] - Step timeout in ms
   */
  constructor(options = {}) {
    this.logger = options.logger;
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Execute a single step with idempotency check and error handling.
   *
   * @param {StepInterface} step - Step to execute
   * @param {PipelineContext} context - Shared context
   * @param {number} current - Current step number (1-based)
   * @param {number} total - Total number of steps
   * @returns {Promise<StepResult>}
   */
  async executeStep(step, context, current, total) {
    const start = Date.now();

    try {
      // Idempotency check
      const alreadyDone = await step.check(context);
      if (alreadyDone) {
        const result = step._skipped(`Already configured`);
        this.logger.progress(current, total, step.name, 'skipped', 0);
        return result;
      }

      // Execute with timeout
      const result = await this._withTimeout(
        step.execute(context),
        this.timeout,
        step.id
      );

      const duration = Date.now() - start;
      result.duration = duration;

      this.logger.progress(current, total, step.name, result.status, duration);
      if (result.status === 'failed' && result.message) {
        console.error(`  └─ ${result.message}`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const result = step._failed(error, duration);
      this.logger.progress(current, total, step.name, 'failed', duration);
      if (result.message) console.error(`  └─ ${result.message}`);
      return result;
    }
  }

  /**
   * Wrap a promise with a timeout.
   * @private
   */
  async _withTimeout(promise, timeout, stepId) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Step '${stepId}' timed out after ${timeout}ms`)),
          timeout
        )
      ),
    ]);
  }
}

module.exports = { StepRunner };
