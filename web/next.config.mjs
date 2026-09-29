/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Imagem da API no Docker/Easypanel pode usar `output: 'standalone'` quando for a vez do deploy web.
  poweredByHeader: false,
  // As regras para agentes ficam no AGENTS.md da raiz do repo.
  agentRules: false,
  // Páginas legais estáticas (copiadas de frontend/public); os links internos delas usam o caminho sem .html.
  async rewrites() {
    return [
      { source: '/privacidade', destination: '/privacidade.html' },
      { source: '/termos', destination: '/termos.html' },
    ];
  },
};

export default nextConfig;
