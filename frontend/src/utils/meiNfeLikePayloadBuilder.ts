import type { NfeLikePayloadInput } from '../services/meiNotasService';
import type { MeiNfeLikeFormState } from './meiNfeLikeFormState';
import {
  buildDestinatarioIePayload,
  normalizeDestinatarioIndIeDest,
} from './meiNfeDestinatarioIe';
import { mapDestinatarioEnderecoToPayload } from './meiNfeDestinatarioEndereco';
import {
  mapIcmsForPlugnotas,
  mapNfeItemForPlugnotas,
  parseDecimalInput,
  resolveNfeConsumidorFinal,
  buildDefaultNfePagamentos,
} from './plugnotasNfeItem';

const normalizeDoc = (value: string) => String(value || '').replace(/\D/g, '');

export { parseDecimalInput };

function computeItemsTotal(state: MeiNfeLikeFormState): number {
  return state.itens.reduce((acc, item) => {
    const q = parseDecimalInput(item.quantidade);
    const vu = parseDecimalInput(item.valorUnitario);
    if (q === null || vu === null || q <= 0 || vu <= 0) return acc;
    return acc + q * vu;
  }, 0);
}

/** Monta o payload enviado a `emitirNfe` / `emitirNfce` (servidor define `modelo` 55/65). */
export function buildNfeLikePayloadFromMeiForm(
  state: MeiNfeLikeFormState,
  documentType: 'NFE' | 'NFCE' = 'NFE',
): NfeLikePayloadInput {
  const emitDigits = normalizeDoc(state.emitenteCnpj);
  const destDigits = normalizeDoc(state.destinatarioDoc);
  const indIEDest = normalizeDestinatarioIndIeDest(state.destinatarioIndIEDest);
  const ieFields = buildDestinatarioIePayload(indIEDest, state.destinatarioInscricaoEstadual);
  const enderecoPayload =
    documentType === 'NFE' ? mapDestinatarioEnderecoToPayload(state.destinatarioEndereco) : undefined;
  const itens = state.itens.map((item) =>
    mapNfeItemForPlugnotas(item, {
      icms: mapIcmsForPlugnotas({ csosn: item.icmsCsosn, cst: item.icmsCst }),
      pis: { cst: item.pisCst.trim() },
      cofins: { cst: item.cofinsCst.trim() },
    }),
  );
  const total = computeItemsTotal(state);

  return {
    emitente: {
      cpfCnpj: emitDigits,
      ...(state.emitenteRazao.trim() ? { razaoSocial: state.emitenteRazao.trim() } : {}),
      ...(state.emitenteInscricaoEstadual.trim()
        ? { inscricaoEstadual: state.emitenteInscricaoEstadual.trim() }
        : {}),
    },
    destinatario: {
      cpfCnpj: destDigits,
      razaoSocial: state.destinatarioRazao.trim(),
      ...(state.destinatarioEmail.trim() ? { email: state.destinatarioEmail.trim() } : {}),
      ...ieFields,
      ...(enderecoPayload ? { endereco: enderecoPayload } : {}),
    },
    ...(documentType === 'NFE'
      ? {
          consumidorFinal: resolveNfeConsumidorFinal(
            destDigits,
            indIEDest,
            state.destinatarioInscricaoEstadual,
          ),
        }
      : {}),
    itens,
    ...(total > 0 ? { pagamentos: buildDefaultNfePagamentos(total) } : {}),
    ...(state.informacoesComplementares.trim()
      ? { informacoesComplementares: state.informacoesComplementares.trim() }
      : {}),
  };
}
