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

export type MeiNfeLikeFormState = {
  emitenteCnpj: string;
  emitenteRazao: string;
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
    cfop: '',
    unidade: 'UN',
    quantidade: '1',
    valorUnitario: '',
    icmsCst: '',
    icmsCsosn: '',
    pisCst: '',
    cofinsCst: ''
  };
}

export function createEmptyMeiNfeLikeFormState(): MeiNfeLikeFormState {
  return {
    emitenteCnpj: '',
    emitenteRazao: '',
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
}): MeiNfeLikeFormState {
  return {
    ...createEmptyMeiNfeLikeFormState(),
    emitenteCnpj: partial.emitenteCnpj,
    emitenteRazao: partial.emitenteRazao
  };
}

/** CNPJ / razão a partir do fluxo NFS-e + cadastro emitente (sem catálogo NFE — story futura). */
export function buildPrefilledNfeLikeFormSnapshot(
  nfseForm: EmitirNfseInput,
  companyRazaoSocial: string
): MeiNfeLikeFormState {
  const digits = onlyDigits(nfseForm.prestadorCpfCnpj || '').slice(0, 14);
  const cnpjUi = digits.length === 14 ? formatCpfCnpjPtBr(digits) : '';
  const razao =
    String(nfseForm.prestadorRazaoSocial || '').trim() || String(companyRazaoSocial || '').trim();
  return prefilledMeiNfeLikeFormState({
    emitenteCnpj: cnpjUi,
    emitenteRazao: razao
  });
}
