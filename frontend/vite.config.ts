import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __viteDirname = dirname(fileURLToPath(import.meta.url));

// Rotas críticas que precisam de arquivos HTML físicos
// privacidade/termos: HTML estático em public/*.html — não sobrescrever com cópia do index (SPA)
const criticalRoutes = [
  'reset-password',
  'forgot-password',
  'login',
  'register',
];
const isVitest = process.env.VITEST === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  define: isVitest
    ? {
        /** FR-GUIA-FISC-16 — testes RTL assumem seletor triplo (paridade POST-0); produção usa env real do build. */
        'import.meta.env.VITE_MEI_NFE_NFCE_EMIT_ENABLED': JSON.stringify('true'),
      }
    : undefined,
  plugins: [
    react(),
    {
      name: 'legal-static-routes-dev',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url?.split('?')[0] ?? '';
          if (url === '/privacidade' || url === '/privacidade/') req.url = '/privacidade.html';
          if (url === '/termos' || url === '/termos/') req.url = '/termos.html';
          next();
        });
      },
    },
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
    fs: {
      allow: [resolve(__viteDirname, '..')]
    },
    proxy: {
      // Em desenvolvimento, /api vai para o backend (evita CORS e 405 por preflight)
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      // GET /health na raiz do Express (fora de /api) — mesmo host que o proxy de API (US-CONN-MEI-04)
      '/health': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
});
