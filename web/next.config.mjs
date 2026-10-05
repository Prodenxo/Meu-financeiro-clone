/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/bank-icon/[slug]': ['./node_modules/@edusites/bancos-brasil/**/*'],
  },
  poweredByHeader: false,
  // As regras para agentes ficam no AGENTS.md da raiz do repo.
  agentRules: false,
  // Caminho antigo do app (`/solicitacoes`), mantido como no Expo.
  async redirects() {
    return [{ source: '/solicitacoes', destination: '/configuracoes/solicitacoes', permanent: false }];
  },
};

export default nextConfig;
