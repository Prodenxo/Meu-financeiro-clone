/**
 * Estado de formulário local para emissão NF-e / NFC-e (Guia MEI).
 * Alinhado a `validateNfeLikePayload` no backend (`mei-notas.service.js`).
 */

import type { EmitirNfseInput } from '../services/meiNotasService';
import { formatCpfCnpjPtBr, onlyDigits } from '../lib/formatCpfCnpjPtBr';
import { DEFAULT_DESTINATARIO_IND_IE_DEST } from './meiNfeDestinatarioIe';
import { getDefaultNfeDestinatarioEndereco } from './meiNfeDestinatarioEndereco';
import type { NfeDestinatarioEnderecoForm } from './meiNfeDestinatarioEndereco';
import type { DestinatarioIndIeDest } from './meiNfeDestinatarioIe';

export type MeiNfeLikeItemFormState = {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  icmsCst: string;
  icmsCsosn: string;
  pisCst: string;
  cofinsCst: string;
};

/** CSOSN típico para venda de mercadoria MEI no Simples Nacional (editável por item). */
export const MEI_DEFAULT_NFE_CSOSN = '102';

/** CST PIS/COFINS comum para MEI sem destaque (editável por item). */
export const MEI_DEFAULT_NFE_PIS_COFINS_CST = '49';

export type MeiNfeLikeFormState = {
  emitenteCnpj: string;
  emitenteRazao: string;
  /** IE do emitente (MEI) — opcional; distinta da IE do destinatário. */
  emitenteInscricaoEstadual: string;
  destinatarioDoc: string;
  destinatarioRazao: string;
  destinatarioEmail: string;
  destinatarioIndIEDest: DestinatarioIndIeDest;
  destinatarioInscricaoEstadual: string;
  destinatarioEndereco: NfeDestinatarioEnderecoForm;
  informacoesComplementares: string;
  itens: MeiNfeLikeItemFormState[];
};

export function createEmptyMeiNfeLikeItem(): MeiNfeLikeItemFormState {
  return {
    codigo: '',
    descricao: '',
    ncm: '',
    cfop: '5102',
    unidade: 'UN',
    quantidade: '1',
    valorUnitario: '',
    icmsCst: '',
    icmsCsosn: MEI_DEFAULT_NFE_CSOSN,
    pisCst: MEI_DEFAULT_NFE_PIS_COFINS_CST,
    cofinsCst: MEI_DEFAULT_NFE_PIS_COFINS_CST
  };
}

export function createEmptyMeiNfeLikeFormState(): MeiNfeLikeFormState {
  return {
    emitenteCnpj: '',
    emitenteRazao: '',
    emitenteInscricaoEstadual: '',
    destinatarioDoc: '',
    destinatarioRazao: '',
    destinatarioEmail: '',
    destinatarioIndIEDest: DEFAULT_DESTINATARIO_IND_IE_DEST,
    destinatarioInscricaoEstadual: '',
    destinatarioEndereco: getDefaultNfeDestinatarioEndereco(),
    informacoesComplementares: '',
    itens: []
  };
}

export function serializeMeiNfeLikeFormForDirty(state: MeiNfeLikeFormState): string {
  return JSON.stringify(state);
}

export function prefilledMeiNfeLikeFormState(partial: {
  emitenteCnpj: string;
  emitenteRazao: string;
  emitenteInscricaoEstadual?: string;
}): MeiNfeLikeFormState {
  return {
    ...createEmptyMeiNfeLikeFormState(),
    emitenteCnpj: partial.emitenteCnpj,
    emitenteRazao: partial.emitenteRazao,
    ...(partial.emitenteInscricaoEstadual?.trim()
      ? { emitenteInscricaoEstadual: partial.emitenteInscricaoEstadual.trim() }
      : {})
  };
}

/** CNPJ / razão a partir do fluxo NFS-e + cadastro emitente (sem catálogo NFE — story futura). */
export function buildPrefilledNfeLikeFormSnapshot(
  nfseForm: EmitirNfseInput,
  companyRazaoSocial: string,
  emitenteInscricaoEstadual = ''
): MeiNfeLikeFormState {
  const digits = onlyDigits(nfseForm.prestadorCpfCnpj || '').slice(0, 14);
  const cnpjUi = digits.length === 14 ? formatCpfCnpjPtBr(digits) : '';
  const razao =
    String(nfseForm.prestadorRazaoSocial || '').trim() || String(companyRazaoSocial || '').trim();
  return prefilledMeiNfeLikeFormState({
    emitenteCnpj: cnpjUi,
    emitenteRazao: razao,
    emitenteInscricaoEstadual
  });
}
