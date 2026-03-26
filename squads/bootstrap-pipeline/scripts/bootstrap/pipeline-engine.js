/**
 * PipelineEngine — Orchestrates the bootstrap pipeline.
 *
 * Loads steps, executes them sequentially, manages checkpoints,
 * and generates reports. Supports resume, dry-run, and force modes.
 *
 * @module pipeline-engine
 * @version 1.0.0
 * @see docs/architecture/aiox-bootstrap-pipeline.md
 */

const path = require('path');
const { CheckpointManager } = require('./checkpoint-manager');
const { StepRunner } = require('./step-runner');
const { ReportGenerator } = require('./report-generator');
const { Logger } = require('./logger');

// Step imports
const { PreflightCheck } = require('./steps/preflight-check');
const { InstallClaudeStep } = require('./steps/install-claude');
const { StatusLineStep } = require('./steps/status-line');
const { LocalhostStep } = require('./steps/localhost-config');
const { BasicConfigsStep } = require('./steps/basic-configs');
const { PackageInstallStep } = require('./steps/package-install');
const { EnvBootstrapStep } = require('./steps/env-bootstrap');
const { PermissionModeStep } = require('./steps/permission-mode');
const { DownloadSquadsStep } = require('./steps/download-squads');
const { LlmRoutingStep } = require('./steps/llm-routing');
const { CursorMemStep } = require('./steps/cursor-mem');
const { InstallPluginsStep } = require('./steps/install-plugins');
const { FinalValidationStep } = require('./steps/final-validation');

const PIPELINE_VERSION = '1.0.0';

class PipelineEngine {
  /**
   * @param {Object} options
   * @param {string} options.projectRoot - Absolute path to project root
   * @param {Object} options.flags - CLI flags { resume, dryRun, force, interactive, verbose }
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.flags = {
      resume: false,
      dryRun: false,
      force: false,
      interactive: false,
      verbose: false,
      ...options.flags,
    };

    this.logger = new Logger({
      projectRoot: this.projectRoot,
      verbose: this.flags.verbose,
    });

    this.checkpoint = new CheckpointManager({
      projectRoot: this.projectRoot,
    });

    this.runner = new StepRunner({ logger: this.logger });
    this.reporter = new ReportGenerator({ projectRoot: this.projectRoot });

    this.steps = [
      new PreflightCheck(),
      new InstallClaudeStep(),
      new StatusLineStep(),
      new LocalhostStep(),
      new BasicConfigsStep(),
      new PackageInstallStep(),
      new EnvBootstrapStep(),
      new PermissionModeStep(),
      new DownloadSquadsStep(),
      new LlmRoutingStep(),
      new CursorMemStep(),
      new InstallPluginsStep(),
      new FinalValidationStep(),
    ];
  }

  /**
   * Run the complete pipeline.
   *
   * @returns {Promise<Object>} Pipeline report with results per step
   * @example
   *   const engine = new PipelineEngine({ projectRoot: '/path/to/project' });
   *   const report = await engine.run();
   */
  async run() {
    const context = await this._buildContext();
    const results = [];
    let completedSteps = [];

    // Handle resume
    if (this.flags.resume) {
      const state = await this.checkpoint.load();
      if (state) {
        completedSteps = state.completedSteps || [];
        this.logger.info(`Resuming from checkpoint (${completedSteps.length} steps completed)`);
      } else {
        this.logger.warn('No checkpoint found — starting from beginning');
      }
    }

    const total = this.steps.length;

    for (let i = 0; i < total; i++) {
      const step = this.steps[i];

      // Skip if already completed (resume mode)
      if (completedSteps.includes(step.id) && !this.flags.force) {
        results.push(step._skipped(`Already completed (resumed)`));
        this.logger.progress(i + 1, total, step.name, 'skipped', 0);
        continue;
      }

      // Dry-run mode
      if (this.flags.dryRun) {
        const description = await step.dryRun(context);
        results.push(step._skipped(`[DRY-RUN] would: ${description}`));
        this.logger.dryRun(i + 1, total, step.name, description);
        continue;
      }

      // Execute step
      const result = await this.runner.executeStep(step, context, i + 1, total);
      results.push(result);

      if (result.status === 'success' || result.status === 'skipped') {
        completedSteps.push(step.id);
        await this.checkpoint.save({
          pipelineVersion: PIPELINE_VERSION,
          startedAt: context._startedAt,
          completedSteps,
          currentStep: null,
          context: this._serializableContext(context),
          lastError: null,
        });
      } else if (result.status === 'failed') {
        // Save checkpoint with error
        await this.checkpoint.save({
          pipelineVersion: PIPELINE_VERSION,
          startedAt: context._startedAt,
          completedSteps,
          currentStep: step.id,
          context: this._serializableContext(context),
          lastError: {
            stepId: step.id,
            message: result.message,
            timestamp: new Date().toISOString(),
          },
        });

        this.logger.error(step.id, `Pipeline stopped. To resume: *full-setup --resume`);
        break;
      }
    }

    // Generate report
    const report = await this.reporter.generate(results, context);

    // Clear checkpoint on full success
    const allPassed = results.every((r) => r.status !== 'failed');
    if (allPassed && !this.flags.dryRun) {
      await this.checkpoint.clear();
    }

    await this.logger.flush();
    return report;
  }

  /**
   * Build the initial PipelineContext.
   * @private
   * @returns {Promise<PipelineContext>}
   */
  async _buildContext() {
    const os = this._detectOS();
    return {
      os,
      projectRoot: this.projectRoot,
      nodeVersion: process.version,
      packageManager: 'npm', // Updated by PackageInstallStep
      gitInitialized: false, // Updated by PreflightCheck
      claudeInstalled: false, // Updated by PreflightCheck
      flags: { ...this.flags },
      _startedAt: new Date().toISOString(),
    };
  }

  /**
   * Detect the operating system.
   * @private
   * @returns {string} 'linux' | 'macos' | 'wsl'
   */
  _detectOS() {
    const platform = process.platform;
    if (platform === 'darwin') return 'macos';
    if (platform === 'linux') {
      try {
        const release = require('fs').readFileSync('/proc/version', 'utf8');
        if (release.toLowerCase().includes('microsoft')) return 'wsl';
      } catch (e) {
        // Not WSL
      }
      return 'linux';
    }
    return platform;
  }

  /**
   * Create a JSON-serializable version of context (for checkpoint).
   * @private
   */
  _serializableContext(context) {
    const { _startedAt, ...rest } = context;
    return rest;
  }
}

module.exports = { PipelineEngine, PIPELINE_VERSION };
