import type { NfeLikePayloadInput } from '../services/meiNotasService';
import type { MeiNfeLikeFormState } from './meiNfeLikeFormState';

const normalizeDoc = (value: string) => String(value || '').replace(/\D/g, '');

export function parseMeiDecimalInput(raw: string): number | null {
  const t = String(raw ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Monta o payload enviado a `emitirNfe` / `emitirNfce` (servidor define `modelo` 55/65). */
export function buildNfeLikePayloadFromMeiForm(state: MeiNfeLikeFormState): NfeLikePayloadInput {
  const emitDigits = normalizeDoc(state.emitenteCnpj);
  const destDigits = normalizeDoc(state.destinatarioDoc);
  return {
    emitente: {
      cpfCnpj: emitDigits,
      ...(state.emitenteRazao.trim() ? { razaoSocial: state.emitenteRazao.trim() } : {})
    },
    destinatario: {
      cpfCnpj: destDigits,
      razaoSocial: state.destinatarioRazao.trim(),
      ...(state.destinatarioEmail.trim() ? { email: state.destinatarioEmail.trim() } : {})
    },
    itens: state.itens.map((item) => {
      const q = parseMeiDecimalInput(item.quantidade);
      const vu = parseMeiDecimalInput(item.valorUnitario);
      return {
        codigo: item.codigo.trim(),
        descricao: item.descricao.trim(),
        ncm: normalizeDoc(item.ncm),
        cfop: normalizeDoc(item.cfop),
        unidade: item.unidade.trim(),
        quantidade: q ?? 0,
        valorUnitario: vu ?? 0,
        tributos: {
          icms: {
            ...(item.icmsCst.trim() ? { cst: item.icmsCst.trim() } : {}),
            ...(item.icmsCsosn.trim() ? { csosn: item.icmsCsosn.trim() } : {})
          },
          pis: { cst: item.pisCst.trim() },
          cofins: { cst: item.cofinsCst.trim() }
        }
      };
    }),
    ...(state.informacoesComplementares.trim()
      ? { informacoesComplementares: state.informacoesComplementares.trim() }
      : {})
  };
}
