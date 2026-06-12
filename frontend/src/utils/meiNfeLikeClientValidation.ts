import type { MeiNfeLikeFormState, MeiNfeLikeItemFormState } from './meiNfeLikeFormState';
import { parseMeiDecimalInput } from './meiNfeLikePayloadBuilder';
import { getDestinatarioIeValidationMessage, normalizeDestinatarioIndIeDest } from './meiNfeDestinatarioIe';
import { getDestinatarioEnderecoValidationMessage } from './meiNfeDestinatarioEndereco';
import { isValidCpfOrCnpjDigits as isValidCpfOrCnpjChecksum } from './validateCpfCnpjBr';

const normalizeDoc = (value: string) => String(value || '').replace(/\D/g, '');

export type MeiNfeLikeValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  /** Secção do formulário para expandir (emitente | destinatario | itens). */
  firstSection?: 'emitente' | 'destinatario' | 'itens';
};

/**
 * Validação cliente espelhando `validateNfeLikePayload` (backend).
 * Chaves estáveis para `aria-describedby` e testes.
 */
export function validateMeiNfeLikeForm(
  state: MeiNfeLikeFormState,
  label: 'NF-e' | 'NFC-e'
): MeiNfeLikeValidationResult {
  const errors: Record<string, string> = {};
  let firstSection: MeiNfeLikeValidationResult['firstSection'];

  const set = (key: string, message: string, section: NonNullable<MeiNfeLikeValidationResult['firstSection']>) => {
    if (!errors[key]) {
      errors[key] = message;
      if (!firstSection) firstSection = section;
    }
  };

  const emitDigits = normalizeDoc(state.emitenteCnpj);
  if (!emitDigits) {
    set('mei-nfe-emitente-cnpj', `CNPJ do emitente da ${label} é obrigatório`, 'emitente');
  } else if (emitDigits.length !== 14) {
    set('mei-nfe-emitente-cnpj', `CNPJ do emitente da ${label} deve ter 14 dígitos`, 'emitente');
  }

  const destDigits = normalizeDoc(state.destinatarioDoc);
  if (!destDigits) {
    set('mei-nfe-dest-doc', `CPF/CNPJ do destinatário da ${label} é obrigatório`, 'destinatario');
  } else if (!isValidCpfOrCnpjChecksum(destDigits)) {
    set('mei-nfe-dest-doc', `CPF/CNPJ do destinatário da ${label} inválido`, 'destinatario');
  }

  if (!state.destinatarioRazao.trim()) {
    set('mei-nfe-dest-razao', `Razão social do destinatário da ${label} é obrigatória`, 'destinatario');
  }

  const ieMsg = getDestinatarioIeValidationMessage(
    normalizeDestinatarioIndIeDest(state.destinatarioIndIEDest),
    state.destinatarioInscricaoEstadual,
    label,
  );
  if (ieMsg) {
    set('mei-nfe-dest-ie', ieMsg, 'destinatario');
  }

  if (label === 'NF-e') {
    const enderecoMsg = getDestinatarioEnderecoValidationMessage(state.destinatarioEndereco, label);
    if (enderecoMsg) {
      set('mei-nfe-dest-endereco', enderecoMsg, 'destinatario');
    }
  }

  if (!state.itens.length) {
    set('mei-nfe-itens', `Adicione pelo menos um item à ${label}.`, 'itens');
  }

  state.itens.forEach((item: MeiNfeLikeItemFormState, index: number) => {
    const p = index + 1;
    const prefix = `mei-nfe-item-${index}`;
    if (!item.codigo.trim()) {
      set(`${prefix}-codigo`, `Item ${p} da ${label}: código é obrigatório`, 'itens');
    }
    if (!item.descricao.trim()) {
      set(`${prefix}-descricao`, `Item ${p} da ${label}: descrição é obrigatória`, 'itens');
    }
    const ncm = normalizeDoc(item.ncm);
    if (ncm.length !== 8) {
      set(`${prefix}-ncm`, `Item ${p} da ${label}: NCM deve ter 8 dígitos`, 'itens');
    }
    const cfop = normalizeDoc(item.cfop);
    if (cfop.length !== 4) {
      set(`${prefix}-cfop`, `Item ${p} da ${label}: CFOP deve ter 4 dígitos`, 'itens');
    }
    if (!item.unidade.trim()) {
      set(`${prefix}-unidade`, `Item ${p} da ${label}: unidade é obrigatória`, 'itens');
    }
    const q = parseMeiDecimalInput(item.quantidade);
    if (q === null || q <= 0) {
      set(`${prefix}-qtd`, `Item ${p} da ${label}: quantidade deve ser maior que zero`, 'itens');
    }
    const vu = parseMeiDecimalInput(item.valorUnitario);
    if (vu === null || vu <= 0) {
      set(`${prefix}-vu`, `Item ${p} da ${label}: valor unitário deve ser maior que zero`, 'itens');
    }
    const hasIcms = Boolean(item.icmsCst.trim() || item.icmsCsosn.trim());
    if (!hasIcms) {
      set(`${prefix}-icms`, `Item ${p} da ${label}: informe CST ou CSOSN do ICMS`, 'itens');
    }
    if (!item.pisCst.trim()) {
      set(`${prefix}-pis`, `Item ${p} da ${label}: CST do PIS é obrigatório`, 'itens');
    }
    if (!item.cofinsCst.trim()) {
      set(`${prefix}-cofins`, `Item ${p} da ${label}: CST do COFINS é obrigatório`, 'itens');
    }
  });

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    firstSection
  };
}
