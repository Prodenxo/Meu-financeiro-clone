#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const supabaseDir = resolve(repoRoot, 'supabase');
const linkedProjectRefFile = resolve(supabaseDir, '.temp', 'project-ref');

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (flag) => {
  const inline = args.find((arg) => arg.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  return args[index + 1];
};

const mode = hasFlag('--apply') ? 'apply' : 'check';
const isApplyMode = mode === 'apply';
const projectRef = String(process.env.SUPABASE_PROD_PROJECT_REF || '').trim();
const expectedDbHost = String(process.env.SUPABASE_PROD_DB_HOST || '').trim().toLowerCase();
const confirmedRef = String(getArgValue('--confirm-ref') || '').trim();
const acceptedApply = hasFlag('--yes');

const usage = `
Uso:
  node scripts/supabase-migrate-prod.mjs --check
  node scripts/supabase-migrate-prod.mjs --apply --yes --confirm-ref=<SUPABASE_PROD_PROJECT_REF>

Variaveis obrigatorias:
  SUPABASE_PROD_PROJECT_REF
  SUPABASE_PROD_DB_HOST
`.trim();

const fail = (message, details = '') => {
  console.error(`\n[ERRO] ${message}`);
  if (details) {
    console.error(details);
  }
  process.exit(1);
};

const info = (message) => {
  console.log(`[INFO] ${message}`);
};

const supabaseBin = resolve(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'supabase.cmd' : 'supabase');

const runSupabase = (cmdArgs, { capture = false } = {}) => {
  // workdir = raiz do repo (contém supabase/); apontar só para supabase/ quebra db push (histórico local vazio).
  const runArgs = ['--workdir', repoRoot, ...cmdArgs];
  const opts = { encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', cwd: repoRoot };
  let result = spawnSync('supabase', runArgs, opts);

  if (result.error && result.error.code === 'ENOENT' && existsSync(supabaseBin)) {
    result = spawnSync(supabaseBin, runArgs, { ...opts, shell: true });
  }
  if (result.error && result.error.code === 'ENOENT') {
    result = spawnSync('npx', ['supabase', ...runArgs], opts);
  }

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      fail(
        'Supabase CLI nao encontrada.',
        'Instale com: npm install supabase --save-dev\nOu veja: https://github.com/supabase/cli/releases'
      );
    }
    fail('Falha ao executar Supabase CLI.', String(result.error.message || result.error));
  }

  if (result.status !== 0) {
    const stderr = capture ? String(result.stderr || '').trim() : '';
    const stdout = capture ? String(result.stdout || '').trim() : '';
    const details = [stderr, stdout].filter(Boolean).join('\n');
    fail(`Comando falhou: supabase ${runArgs.join(' ')}`, details);
  }

  return capture ? String(result.stdout || '') : '';
};

const validateEnvironment = () => {
  if (!existsSync(supabaseDir)) {
    fail('Diretorio supabase/ nao encontrado no repositorio.');
  }

  if (!projectRef) {
    fail(
      'SUPABASE_PROD_PROJECT_REF nao configurado.',
      'Defina no ambiente local antes de executar.'
    );
  }

  if (!/^[a-z0-9]{20}$/i.test(projectRef)) {
    fail(
      'SUPABASE_PROD_PROJECT_REF invalido.',
      `Valor recebido: ${projectRef}`
    );
  }

  if (!expectedDbHost) {
    fail(
      'SUPABASE_PROD_DB_HOST nao configurado.',
      'Exemplo esperado: db.<project-ref>.supabase.co'
    );
  }

  if (expectedDbHost.includes('localhost') || expectedDbHost.includes('127.0.0.1')) {
    fail('SUPABASE_PROD_DB_HOST nao pode apontar para localhost.');
  }

  if (!expectedDbHost.includes(projectRef)) {
    fail(
      'SUPABASE_PROD_DB_HOST nao parece ser do projeto configurado.',
      `project_ref=${projectRef}\ndb_host=${expectedDbHost}`
    );
  }

  if (isApplyMode) {
    if (!acceptedApply) {
      fail(
        'Aplicacao em producao requer confirmacao explicita.',
        'Use --yes para continuar.'
      );
    }
    if (!confirmedRef || confirmedRef !== projectRef) {
      fail(
        'Confirmacao de producao invalida.',
        'Use --confirm-ref com o mesmo valor de SUPABASE_PROD_PROJECT_REF.'
      );
    }
  }
};

const validateSupabaseAuth = () => {
  runSupabase(['--version']);
  info('Supabase CLI encontrada.');

  const projectsRaw = runSupabase(['projects', 'list', '--output', 'json'], { capture: true });
  let projects = [];
  try {
    projects = JSON.parse(projectsRaw);
  } catch {
    fail(
      'Falha ao validar autenticacao Supabase.',
      'Execute: supabase login'
    );
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    fail(
      'Nenhum projeto retornado pelo Supabase CLI.',
      'Confirme login com: supabase login'
    );
  }

  const exists = projects.some((project) => {
    if (!project || typeof project !== 'object') return false;
    const values = Object.values(project).filter((value) => typeof value === 'string');
    return values.includes(projectRef);
  });

  if (!exists) {
    fail(
      'Project ref de producao nao encontrado na conta autenticada.',
      `project_ref esperado: ${projectRef}`
    );
  }

  info(`Autenticacao validada. Project ref alvo: ${projectRef}`);
};

const ensureLinkedProject = () => {
  info(`Executando link seguro para ${projectRef}...`);
  runSupabase(['link', '--project-ref', projectRef]);

  if (!existsSync(linkedProjectRefFile)) {
    fail(
      'Supabase link executado, mas arquivo de controle nao foi encontrado.',
      `Esperado em: ${linkedProjectRefFile}`
    );
  }

  const linkedRef = String(readFileSync(linkedProjectRefFile, 'utf8')).trim();
  if (linkedRef !== projectRef) {
    fail(
      'Projeto linkado diverge do esperado.',
      `esperado=${projectRef}\nlinkado=${linkedRef}`
    );
  }

  info('Projeto linkado e validado com sucesso.');
};

const runCheck = () => {
  info('Listando migrations com --linked...');
  runSupabase(['migration', 'list', '--linked']);
  info('Check concluido com sucesso.');
};

const runApply = () => {
  info('Aplicando migrations com db push --linked...');
  runSupabase(['db', 'push', '--linked']);
  info('Migrations aplicadas com sucesso.');
};

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(usage);
  process.exit(0);
}

if (!hasFlag('--check') && !hasFlag('--apply')) {
  fail(
    'Modo nao informado.',
    `${usage}\n\nSugestao: use --check para validacao segura.`
  );
}

info(`Modo selecionado: ${mode}`);
validateEnvironment();
validateSupabaseAuth();
ensureLinkedProject();
runCheck();

if (isApplyMode) {
  runApply();
}

