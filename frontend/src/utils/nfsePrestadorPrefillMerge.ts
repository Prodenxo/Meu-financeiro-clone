/**
 * Merge DTO BFF → EmitirNfseInput (prestador). Paridade com financas-pessoais-mobile `meiNfseForms`.
 */
import type { EmitirNfseInput } from '../services/meiNotasService';
import type { NfsePrestadorPrefillDto } from '../lib/nfsePrestadorPrefillDto';
import { formatCpfCnpjPtBr, onlyDigits } from '../lib/formatCpfCnpjPtBr';

function takePrestadorField(
  current: string | undefined,
  incoming: string | null | undefined,
  onlyFillEmpty: boolean
): string {
  const c = String(current ?? '').trim();
  const inc = incoming == null || incoming === '' ? '' : String(incoming).trim();
  if (!inc) return String(current ?? '');
  if (onlyFillEmpty && c !== '') return c;
  return inc;
}

export function isNfsePrestadorPrefillEffectivelyEmpty(p: NfsePrestadorPrefillDto): boolean {
  const cnpj = onlyDigits(p.prestadorCpfCnpj || '');
  if (cnpj.length >= 11) return false;
  if ((p.prestadorRazaoSocial ?? '').trim()) return false;
  if ((p.prestadorEmail ?? '').trim()) return false;
  if ((p.prestadorInscricaoMunicipal ?? '').trim()) return false;
  const e = p.prestadorEndereco;
  if (e) {
    const parts = [
      e.logradouro,
      e.numero,
      e.codigoCidade,
      e.cep,
      e.complemento,
      e.bairro,
      e.estado,
      e.descricaoCidade,
    ];
    if (parts.some((x) => String(x ?? '').trim() !== '')) return false;
  }
  return true;
}

export interface MergeNfsePrestadorPrefillOptions {
  onlyFillEmpty?: boolean;
}

export function mergeNfsePrestadorPrefillIntoForm(
  current: EmitirNfseInput,
  prefill: NfsePrestadorPrefillDto,
  options: MergeNfsePrestadorPrefillOptions = {}
): EmitirNfseInput {
  const onlyFillEmpty = options.onlyFillEmpty !== false;
  const pec = current.prestadorEndereco ?? {};
  const pen = prefill.prestadorEndereco;

  let nextCnpj = String(current.prestadorCpfCnpj ?? '');
  const preCnpjDigits = onlyDigits(prefill.prestadorCpfCnpj || '');
  if (preCnpjDigits.length === 14) {
    if (!onlyFillEmpty || !String(nextCnpj).trim()) {
      nextCnpj = formatCpfCnpjPtBr(preCnpjDigits);
    }
  }

  let nextIm = current.prestadorInscricaoMunicipal;
  if (prefill.prestadorInscricaoMunicipal != null && prefill.prestadorInscricaoMunicipal !== '') {
    const cur = String(nextIm ?? '').trim();
    if (!onlyFillEmpty || cur === '') nextIm = prefill.prestadorInscricaoMunicipal.trim();
  }

  const nextRazao = takePrestadorField(current.prestadorRazaoSocial, prefill.prestadorRazaoSocial, onlyFillEmpty);
  const nextEmail = takePrestadorField(current.prestadorEmail, prefill.prestadorEmail, onlyFillEmpty);

  const cepDigits =
    pen?.cep != null && String(pen.cep).trim() !== ''
      ? onlyDigits(String(pen.cep)).slice(0, 8)
      : '';
  const curCep = onlyDigits(String(pec.cep ?? '')).slice(0, 8);
  const nextCep =
    cepDigits.length === 8 && (!onlyFillEmpty || curCep.length === 0)
      ? cepDigits
      : String(pec.cep ?? '').replace(/\D/g, '').slice(0, 8);

  const nextEstadoRaw = pen?.estado != null ? String(pen.estado).trim().toUpperCase().slice(0, 2) : '';
  const curEst = String(pec.estado ?? '').trim();
  const nextEstado =
    nextEstadoRaw && (!onlyFillEmpty || curEst === '') ? nextEstadoRaw : pec.estado ?? '';

  const nextEndereco = {
    logradouro: takePrestadorField(pec.logradouro, pen?.logradouro, onlyFillEmpty),
    numero: takePrestadorField(pec.numero, pen?.numero, onlyFillEmpty),
    codigoCidade: takePrestadorField(pec.codigoCidade, pen?.codigoCidade, onlyFillEmpty),
    cep: nextCep,
    complemento: takePrestadorField(pec.complemento, pen?.complemento, onlyFillEmpty),
    bairro: takePrestadorField(pec.bairro, pen?.bairro, onlyFillEmpty),
    estado: nextEstado,
    descricaoCidade: takePrestadorField(pec.descricaoCidade, pen?.descricaoCidade, onlyFillEmpty),
  };

  return {
    ...current,
    prestadorCpfCnpj: nextCnpj,
    ...(nextIm !== undefined && nextIm !== '' ? { prestadorInscricaoMunicipal: nextIm } : {}),
    ...(nextRazao ? { prestadorRazaoSocial: nextRazao } : {}),
    ...(nextEmail ? { prestadorEmail: nextEmail } : {}),
    prestadorEndereco: nextEndereco,
  };
}
