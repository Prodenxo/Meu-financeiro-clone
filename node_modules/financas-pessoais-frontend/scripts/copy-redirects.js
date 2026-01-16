import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const redirectsSource = join(rootDir, 'public', '_redirects');
const redirectsDest = join(rootDir, 'dist', '_redirects');

if (existsSync(redirectsSource)) {
  copyFileSync(redirectsSource, redirectsDest);
  console.log('✓ Arquivo _redirects copiado para dist/');
} else {
  console.warn('⚠ Arquivo _redirects não encontrado em public/');
}

