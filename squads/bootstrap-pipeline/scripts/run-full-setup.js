#!/usr/bin/env node
/**
 * CLI: *full-setup — roda PipelineEngine a partir da raiz do projeto (cwd).
 *
 * Uso:
 *   node squads/bootstrap-pipeline/scripts/run-full-setup.js [--resume] [--dry-run] [--force] [--interactive] [--verbose]
 */

const path = require('path');
const { PipelineEngine } = require('./bootstrap/pipeline-engine.js');

function parseFlags(argv) {
  return {
    resume: argv.includes('--resume'),
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    interactive: argv.includes('--interactive'),
    verbose: argv.includes('--verbose'),
  };
}

async function main() {
  const projectRoot = process.cwd();
  const flags = parseFlags(process.argv.slice(2));

  console.log('');
  console.log('👑 [AIOX] Full Setup Pipeline');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const engine = new PipelineEngine({ projectRoot, flags });

  try {
    const report = await engine.run();
    process.exitCode = report.success ? 0 : 1;
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

main();
