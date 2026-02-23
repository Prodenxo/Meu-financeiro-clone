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
const isVitest = process.env.VITEST === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      closeBundle() {
        if (isVitest) return;
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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          calendar: ['react-big-calendar', '@react-oauth/google'],
          utilities: ['date-fns', 'xlsx', 'zustand', 'classnames', 'react-toastify', 'lucide-react', 'react-phone-input-2']
        }
      }
    }
  },
  server: {
    port: 3000,
  },
  publicDir: 'public',
});
