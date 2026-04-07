#!/usr/bin/env node
/**
 * Smoke opcional Plugnotas NF-e / NFC-e (FR-POSQA-07).
 *
 * Envia POST com payload **inválido** a `/nfe` e `/nfce` (formato array igual ao backend).
 * Espera resposta **4xx** de validação — prova conectividade + credenciais sem emitir nota real.
 *
 * Variáveis: `PLUGNOTAS_API_BASE_URL`, `PLUGNOTAS_API_KEY` (obrigatórias para executar o teste);
 * `PLUGNOTAS_API_PATH_PREFIX` opcional (igual ao backend).
 *
 * Uso (raiz do repo):
 *   node scripts/smoke-nfe-nfce-plugnotas.mjs
 *   node scripts/smoke-nfe-nfce-plugnotas.mjs --strict
 *
 * `--strict`: sem credenciais → exit 1. Sem `--strict`: sem credenciais → exit 0 (SKIP), para desenvolvimento local.
 *
 * NFR-POSQA-01: não imprimir corpo completo da resposta nem PII.
 *
 * Critérios de sucesso (pós-QA POSQA-5): para este payload inválido, espera-se **4xx**
 * (incl. 404). **401/403** → falha (credenciais). **5xx** / rede → falha. **2xx** → falha
 * (inesperado; possível mudança de contrato no integrador).
 */

import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const backendRoot = resolve(repoRoot, 'backend');

require('dotenv').config({ path: resolve(repoRoot, '.env') });
require('dotenv').config({ path: resolve(backendRoot, '.env') });

const args = process.argv.slice(2);
const strict = args.includes('--strict');

const trimSlashEnd = (value) => String(value || '').replace(/\/$/, '');

function getPlugnotasRootUrl() {
  const base = trimSlashEnd(process.env.PLUGNOTAS_API_BASE_URL || '');
  const raw = String(process.env.PLUGNOTAS_API_PATH_PREFIX || '').trim();
  if (!raw) return base;
  const prefix = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${trimSlashEnd(prefix)}`;
}

/** Payload mínimo inválido: força erro de validação no emissor (determinístico em sandbox). */
const INVALID_BODY_NFE = [
  {
    emitente: { cpfCnpj: '000' },
    destinatario: { cpfCnpj: '12345678901', razaoSocial: 'Smoke invalido' },
    itens: []
  }
];

const INVALID_BODY_NFCE = [
  {
    emitente: { cpfCnpj: '000' },
    destinatario: { cpfCnpj: '12345678901', razaoSocial: 'Smoke invalido' },
    itens: []
  }
];

async function postSmoke(path, body, label) {
  const base = getPlugnotasRootUrl();
  const key = process.env.PLUGNOTAS_API_KEY;
  const url = `${base}${path}`;
  const timeoutMs = Math.min(Math.max(Number(process.env.PLUGNOTAS_TIMEOUT_MS || 20000), 5000), 120000);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': key
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const status = response.status;
    const text = await response.text();
    const snippet = text.length > 180 ? `${text.slice(0, 180)}…` : text;
    const safeSnippet = snippet.replace(/\d{11,14}/g, '***');

    if (status === 401 || status === 403) {
      console.error(`[posqa-5-smoke] ${label}: HTTP ${status} — credenciais ou permissão.`);
      return { ok: false, status };
    }

    if (status >= 400 && status < 500) {
      console.log(`[posqa-5-smoke] ${label}: HTTP ${status} (validação esperada). Resumo: ${safeSnippet.replace(/\s+/g, ' ').trim()}`);
      return { ok: true, status };
    }

    if (status >= 500) {
      console.error(`[posqa-5-smoke] ${label}: HTTP ${status} — erro servidor.`);
      return { ok: false, status };
    }

    console.error(`[posqa-5-smoke] ${label}: HTTP ${status} inesperado para payload inválido.`);
    return { ok: false, status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[posqa-5-smoke] ${label}: falha de rede — ${msg}`);
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const baseUrl = process.env.PLUGNOTAS_API_BASE_URL;
  const apiKey = process.env.PLUGNOTAS_API_KEY;

  if (!baseUrl || !apiKey) {
    const msg =
      '[posqa-5-smoke] SKIP: defina PLUGNOTAS_API_BASE_URL e PLUGNOTAS_API_KEY (ex.: backend/.env). CI: configure secrets no repositório.';
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.log(msg);
    process.exit(0);
  }

  console.log('[posqa-5-smoke] Início — smoke de contrato (payload inválido → 4xx esperado).');

  const nfe = await postSmoke('/nfe', INVALID_BODY_NFE, 'NFE');
  const nfce = await postSmoke('/nfce', INVALID_BODY_NFCE, 'NFCE');

  if (nfe.ok && nfce.ok) {
    console.log('[posqa-5-smoke] Concluído: NF-e e NFC-e responderam com erro de validação (conectividade + API key).');
    process.exit(0);
  }

  process.exit(1);
}

main();
