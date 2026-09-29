const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Ícones de banco: só `core.js` (o `index` da lib importa Vue e quebra no Metro).
 * NÃO usar `unstable_enablePackageExports` global — em produção web isso pode
 * resolver exports ESM errados e causar `TypeError: n is not a function` no ExpoRoot.
 */
const BANCOS_BRASIL_CORE_REL = '@edusites/bancos-brasil/src/core.js';

/**
 * No monorepo (npm workspaces) o pacote pode ficar em `frontend/node_modules`
 * ou hoisted em `<raiz>/node_modules`. Procura nos dois; o `exports` da lib
 * bloqueia `require.resolve` do caminho profundo, por isso testamos no disco.
 */
const resolveBancosBrasilCore = () => {
  const candidates = [
    path.resolve(__dirname, 'node_modules', BANCOS_BRASIL_CORE_REL),
    path.resolve(__dirname, '..', 'node_modules', BANCOS_BRASIL_CORE_REL),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(
      `[metro.config] Não encontrei ${BANCOS_BRASIL_CORE_REL}. Rode "npm install" na raiz do repo.\n` +
        `Procurado em:\n${candidates.map((c) => `  - ${c}`).join('\n')}`,
    );
  }
  return found;
};

const bancosBrasilCore = resolveBancosBrasilCore();

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === '@edusites/bancos-brasil' ||
    moduleName === '@edusites/bancos-brasil/src/core.js'
  ) {
    return { type: 'sourceFile', filePath: bancosBrasilCore };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
