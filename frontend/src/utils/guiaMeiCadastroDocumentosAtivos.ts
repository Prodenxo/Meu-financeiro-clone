/**
 * FR-CAD-DOC-08 / 09 / 10 — copy do bloco «dados mínimos», flag de emissão NF-e/NFC-e na UI, link para doc.
 * FR-UPD-DOC-01 — secção «Documentos ativos» visível após cadastro (subtítulo de descoberta).
 * @see docs/specs/ux-spec-cadastro-empresa-documentos-ativos-plugnotas-2026-04-07.md §5–§7
 */
import type { DocumentosAtivosState } from './plugnotasEmpresaDocumentosAtivos';

/** UX §5.1 — título da secção (continuidade com cadastro). */
export const TITULO_SECAO_DOCUMENTOS_ATIVOS_EMISSOR = 'Documentos ativos no emissor fiscal';

/** UX §5.1 — subtítulo opcional (alteração posterior + envio ao emissor). */
export const SUBTITULO_OPCIONAL_ALTERAR_DEPOIS_DOCUMENTOS_ATIVOS =
  'Você pode alterar esta configuração depois do primeiro cadastro. As mudanças são enviadas ao emissor fiscal ao salvar.';

/** UX spec — bloco permanece descoberto pós-cadastro (Guia MEI). */
export const SUBTITULO_SECAO_DOCUMENTOS_ATIVOS_DESCOBERTA =
  'Esta secção fica sempre disponível para rever ou alterar os tipos de documento ativos no emissor.';

/** UX §6 / FR-UPD-DOC-08 — banner de deriva (sem jargão técnico). */
export const MSG_BANNER_DIVERGENCIA_DOCUMENTOS_ATIVOS =
  'A configuração guardada aqui differe do que encontramos no emissor. Mostramos o estado do emissor.';

export const CTA_ATUALIZAR_VISTA_DOCUMENTOS_ATIVOS = 'Atualizar vista';
export const CTA_SINCRONIZAR_EMISSOR_DOCUMENTOS_ATIVOS = 'Sincronizar com o emissor';

/** UX §7 — `role="region"` */
export const ARIA_LABEL_REGIAO_DIVERGENCIA_DOCUMENTOS_ATIVOS =
  'Aviso de diferença de configuração';

/** UX §5.3 / FR-UPD-DOC-07 — pós-PATCH quando `documentosAtivos` foi alterado pelo utilizador. */
export const MSG_SUCESSO_PATCH_DOCUMENTOS_ATIVOS_EMISSOR =
  'Configuração atualizada no emissor fiscal.';

/** FR-UPD-DOC-06 / UX §4.3 — falha GET empresa na hidratação (ecrã continua utilizável). */
export const MSG_DOCUMENTOS_ATIVOS_GET_EMPRESA_HIDRATACAO_FALHOU =
  'Não foi possível obter a configuração atual no emissor fiscal. A seleção abaixo usa os dados guardados nesta aplicação ou os valores por defeito.';

/** UX §5.1 — só um tipo activo e é NFS-e. */
export const TITULO_DADOS_MINIMOS_SO_NFSE = 'Dados mínimos para emissão de NFS-e';

/** UX §5.1 — dois ou mais tipos activos, ou um único tipo que não é só NFS-e. */
export const TITULO_DADOS_MINIMOS_NEUTRO = 'Configuração fiscal do emitente';

export function countDocumentosAtivosSelecionados(d: DocumentosAtivosState): number {
  return [d.nfse, d.nfe, d.nfce].filter(Boolean).length;
}

/**
 * FR-CAD-DOC-08: título neutro quando há ≥2 tipos activos (ou não é o caso «só NFS-e»).
 */
export function getTituloBlocoDadosMinimosEmitente(d: DocumentosAtivosState): string {
  const onlyNfse = d.nfse && !d.nfe && !d.nfce;
  return onlyNfse ? TITULO_DADOS_MINIMOS_SO_NFSE : TITULO_DADOS_MINIMOS_NEUTRO;
}

export function getHintBlocoDadosMinimosEmitente(d: DocumentosAtivosState): string {
  const onlyNfse = d.nfse && !d.nfe && !d.nfce;
  return onlyNfse
    ? 'Campos com * são obrigatórios para a configuração inicial em NFS-e Nacional. A inscrição estadual não é solicitada (política MEI). Inscrição municipal é opcional; login e senha de prefeitura não fazem parte deste fluxo.'
    : 'Preencha os campos obrigatórios para os documentos selecionados. Campos com * são obrigatórios onde indicado.';
}

/**
 * FR-CAD-DOC-10 / PRD §6.1: quando `false`, a Guia MEI não expõe emissão NF-e/NFC-e na UI — mostrar banner no cadastro.
 * Por omissão `true` (produto actual emite NF-e/NFC-e na aba de emissão). Defina `VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI=false` para activar o banner.
 */
export function isGuiaMeiEmissaoNfeNfceDisponivelNaUi(): boolean {
  const raw = import.meta.env.VITE_GUIA_MEI_EMISSAO_NFE_NFCE_UI;
  if (raw === '0' || raw === 'false') return false;
  return true;
}

/**
 * Link para guia interno / operação (env ou página estática em public/).
 */
export function getGuiaMeiCadastroFiscalDocHref(): string {
  const raw = typeof import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL === 'string'
    ? import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL.trim()
    : '';
  if (raw) {
    const base = raw.replace(/#.*$/, '');
    return `${base}#guia-mei-escopo-apenas-nfse`;
  }
  return '/guia-mei-nfce-cadastro.html#cadastro-empresa-nfce-qrcode-sefaz';
}

export function shouldShowCadastroNfeNfceInfoBanner(
  documentosAtivos: DocumentosAtivosState
): boolean {
  if (isGuiaMeiEmissaoNfeNfceDisponivelNaUi()) return false;
  return documentosAtivos.nfe || documentosAtivos.nfce;
}

export function shouldShowRequisitosNfeNfceSecao(documentosAtivos: DocumentosAtivosState): boolean {
  return documentosAtivos.nfe || documentosAtivos.nfce;
}
