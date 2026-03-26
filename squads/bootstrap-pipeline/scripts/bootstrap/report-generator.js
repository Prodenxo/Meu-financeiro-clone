/**
 * ReportGenerator — Generates terminal and markdown reports.
 *
 * @module report-generator
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  /**
   * @param {Object} options
   * @param {string} options.projectRoot - Project root path
   */
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
  }

  /**
   * Generate report from step results.
   *
   * @param {StepResult[]} results - Array of step results
   * @param {PipelineContext} context - Pipeline context
   * @returns {Promise<Object>} Report object
   */
  async generate(results, context) {
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const passed = results.filter((r) => r.status === 'success').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const failed = results.filter((r) => r.status === 'failed').length;

    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      passed,
      skipped,
      failed,
      results,
      context: {
        os: context.os,
        nodeVersion: context.nodeVersion,
        projectRoot: context.projectRoot,
      },
      success: failed === 0,
    };

    // Save markdown report
    if (!context.flags.dryRun) {
      await this._saveMarkdown(report);
    }

    // Print terminal report
    this._printTerminal(report);

    return report;
  }

  /**
   * Save report as markdown file.
   * @private
   */
  async _saveMarkdown(report) {
    const reportsDir = path.join(this.projectRoot, '.aiox', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(reportsDir, `bootstrap-${ts}.md`);

    const lines = [
      '# AIOX Bootstrap Report',
      '',
      `**Date:** ${report.timestamp}`,
      `**Duration:** ${(report.totalDuration / 1000).toFixed(1)}s`,
      `**Result:** ${report.success ? 'SUCCESS' : 'FAILED'}`,
      '',
      '## Steps',
      '',
      '| Step | Status | Duration | Notes |',
      '|------|--------|----------|-------|',
    ];

    for (const r of report.results) {
      const icon = r.status === 'failed' ? '✗' : '✓';
      const dur = r.duration > 0 ? `${(r.duration / 1000).toFixed(1)}s` : '—';
      lines.push(`| ${icon} ${r.stepId} | ${r.status} | ${dur} | ${r.message} |`);
    }

    lines.push('', '## Environment', '');
    lines.push(`- **OS:** ${report.context.os}`);
    lines.push(`- **Node:** ${report.context.nodeVersion}`);
    lines.push(`- **Project:** ${report.context.projectRoot}`);

    if (report.success) {
      lines.push('', '## Next Steps', '');
      lines.push('1. `@dev *help` — Start implementing');
      lines.push('2. `@sm *create-story` — Create first story');
      lines.push('3. `@squad-creator *list-squads` — See installed squads');
    }

    fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  }

  /**
   * Print formatted terminal report.
   * @private
   */
  _printTerminal(report) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (report.success) {
      console.log(`✓ Setup complete in ${(report.totalDuration / 1000).toFixed(1)}s`);
    } else {
      console.log(`✗ Setup failed (${report.failed} step(s) failed)`);
    }

    console.log('');
    console.log('Environment Summary:');
    console.log(`  OS: ${report.context.os} | Node: ${report.context.nodeVersion}`);

    if (report.success) {
      console.log('');
      console.log('Next Steps:');
      console.log('  1. @dev *help — Start implementing');
      console.log('  2. @sm *create-story — Create first story');
      console.log('  3. @squad-creator *list-squads — See installed squads');
    }

    console.log('');
  }
}

module.exports = { ReportGenerator };
