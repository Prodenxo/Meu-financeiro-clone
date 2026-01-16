import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Rotas críticas que precisam de arquivos HTML físicos
const criticalRoutes = [
  'reset-password',
  'forgot-password',
  'login',
  'register'
];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        // Garantir que _redirects seja copiado para dist após o build
        const redirectsSource = join(process.cwd(), 'public', '_redirects');
        const redirectsDest = join(process.cwd(), 'dist', '_redirects');
        
        if (existsSync(redirectsSource)) {
          copyFileSync(redirectsSource, redirectsDest);
          console.log('✓ Arquivo _redirects copiado para dist/');
        }

        // Criar arquivos HTML para rotas críticas
        const distDir = join(process.cwd(), 'dist');
        const indexHtmlPath = join(distDir, 'index.html');
        
        if (existsSync(indexHtmlPath)) {
          try {
            const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
            let createdCount = 0;
            
            for (const route of criticalRoutes) {
              const routeHtmlPath = join(distDir, `${route}.html`);
              writeFileSync(routeHtmlPath, indexHtml, 'utf-8');
              createdCount++;
            }
            
            console.log(`✓ ${createdCount} arquivo(s) HTML de rota criado(s) (${criticalRoutes.join(', ')}.html)`);
          } catch (error) {
            console.error('❌ Erro ao criar arquivos HTML de rota:', error);
          }
        }
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    copyPublicDir: true,
  },
  server: {
    port: 3000,
  },
  publicDir: 'public',
});
