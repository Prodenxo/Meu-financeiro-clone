import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isKnownLibrarySlug } from '@/lib/finance/bankCatalog';

/**
 * SVG do banco via `@edusites/bancos-brasil` (mesma lib do app Expo).
 * O `exports` do pacote bloqueia importar `src/core.js` pelo nome, e o `index.js`
 * puxa Vue — então localizamos `core.js` no disco (sem `require.resolve`, para o
 * bundler não tentar empacotar o pacote) e devolvemos o SVG como imagem.
 * O browser só recebe `<img src="/api/bank-icon/nubank">`.
 */
const CORE_REL = join('node_modules', '@edusites', 'bancos-brasil', 'src', 'core.js');

function findCorePath() {
  let dir = process.cwd();
  for (let i = 0; i < 4; i += 1) {
    const candidate = join(dir, CORE_REL);
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Não encontrei ${CORE_REL}. Rode "npm install" em web/.`);
}

let svgBancoPromise = null;

async function loadSvgBanco() {
  if (!svgBancoPromise) {
    svgBancoPromise = (async () => {
      const coreUrl = pathToFileURL(findCorePath()).href;
      const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ coreUrl);
      if (typeof mod.svgBanco !== 'function') throw new Error('svgBanco indisponível');
      return mod.svgBanco;
    })().catch((err) => {
      svgBancoPromise = null;
      throw err;
    });
  }
  return svgBancoPromise;
}

const FORMATOS = new Set(['circulo', 'quadrado', 'sem']);

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!isKnownLibrarySlug(slug)) {
    return new Response('Banco desconhecido', { status: 404 });
  }

  const url = new URL(request.url);
  const tamanho = Math.min(256, Math.max(16, Number(url.searchParams.get('size')) || 64));
  const formatoParam = url.searchParams.get('formato') || 'circulo';
  const formato = FORMATOS.has(formatoParam) ? formatoParam : 'circulo';

  try {
    const svgBanco = await loadSvgBanco();
    const xml = svgBanco({ nome: slug, formato, tamanho });
    if (!xml) return new Response('Sem ícone', { status: 404 });
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
      },
    });
  } catch (err) {
    console.warn('[bank-icon] falha ao gerar SVG:', err?.message || err);
    return new Response('Ícone indisponível', { status: 500 });
  }
}
