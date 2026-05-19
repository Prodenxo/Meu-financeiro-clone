import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Rotas críticas que precisam de arquivos HTML físicos
// privacidade/termos: HTML estático em public/ — não sobrescrever com SPA
const criticalRoutes = [
  'reset-password',
  'forgot-password',
  'login',
  'register',
];

const distDir = join(rootDir, 'dist');
const indexHtmlPath = join(distDir, 'index.html');

// Verificar se o dist existe e se index.html existe
if (!existsSync(distDir)) {
  console.error('❌ Diretório dist/ não encontrado. Execute o build primeiro.');
  process.exit(1);
}

if (!existsSync(indexHtmlPath)) {
  console.error('❌ Arquivo dist/index.html não encontrado. Execute o build primeiro.');
  process.exit(1);
}

// Ler o index.html
let indexHtml;
try {
  indexHtml = readFileSync(indexHtmlPath, 'utf-8');
  console.log('✓ index.html lido com sucesso');
} catch (error) {
  console.error('❌ Erro ao ler index.html:', error.message);
  process.exit(1);
}

// Criar arquivos HTML para cada rota crítica
let createdCount = 0;
for (const route of criticalRoutes) {
  const routeHtmlPath = join(distDir, `${route}.html`);
  
  try {
    writeFileSync(routeHtmlPath, indexHtml, 'utf-8');
    console.log(`✓ Criado: ${route}.html`);
    createdCount++;
  } catch (error) {
    console.error(`❌ Erro ao criar ${route}.html:`, error.message);
  }
}

console.log(`\n✅ ${createdCount} arquivo(s) HTML criado(s) com sucesso!`);
console.log('   Rotas críticas agora têm arquivos físicos e não retornarão 404.');

