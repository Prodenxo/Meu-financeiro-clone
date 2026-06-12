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

function resolvePrefillCnpjMerge(
  currentMasked: string,
  prefillDigits: string,
  onlyFillEmpty: boolean,
): { nextCnpj: string; cnpjUpdated: boolean } {
  let nextCnpj = String(currentMasked ?? '');
  if (prefillDigits.length !== 14) {
    return { nextCnpj, cnpjUpdated: false };
  }
  const curDigits = onlyDigits(nextCnpj);
  if (!onlyFillEmpty || !curDigits) {
    nextCnpj = formatCpfCnpjPtBr(prefillDigits);
    return { nextCnpj, cnpjUpdated: curDigits !== prefillDigits };
  }
  if (curDigits && curDigits !== prefillDigits) {
    nextCnpj = formatCpfCnpjPtBr(prefillDigits);
    return { nextCnpj, cnpjUpdated: true };
  }
  return { nextCnpj, cnpjUpdated: false };
}

export function mergeNfsePrestadorPrefillIntoForm(
  current: EmitirNfseInput,
  prefill: NfsePrestadorPrefillDto,
  options: MergeNfsePrestadorPrefillOptions = {}
): EmitirNfseInput {
  const onlyFillEmpty = options.onlyFillEmpty !== false;
  const pec = current.prestadorEndereco ?? {};
  const pen = prefill.prestadorEndereco;

  const preCnpjDigits = onlyDigits(prefill.prestadorCpfCnpj || '');
  const { nextCnpj, cnpjUpdated } = resolvePrefillCnpjMerge(
    current.prestadorCpfCnpj ?? '',
    preCnpjDigits,
    onlyFillEmpty,
  );
  const fieldOnlyFillEmpty = onlyFillEmpty && !cnpjUpdated;

  let nextIm = current.prestadorInscricaoMunicipal;
  if (prefill.prestadorInscricaoMunicipal != null && prefill.prestadorInscricaoMunicipal !== '') {
    const cur = String(nextIm ?? '').trim();
    if (!fieldOnlyFillEmpty || cur === '') nextIm = prefill.prestadorInscricaoMunicipal.trim();
  }

  const nextRazao = takePrestadorField(
    current.prestadorRazaoSocial,
    prefill.prestadorRazaoSocial,
    fieldOnlyFillEmpty,
  );
  const nextEmail = takePrestadorField(current.prestadorEmail, prefill.prestadorEmail, fieldOnlyFillEmpty);

  const cepDigits =
    pen?.cep != null && String(pen.cep).trim() !== ''
      ? onlyDigits(String(pen.cep)).slice(0, 8)
      : '';
  const curCep = onlyDigits(String(pec.cep ?? '')).slice(0, 8);
  const nextCep =
    cepDigits.length === 8 && (!fieldOnlyFillEmpty || curCep.length === 0)
      ? cepDigits
      : String(pec.cep ?? '').replace(/\D/g, '').slice(0, 8);

  const nextEstadoRaw = pen?.estado != null ? String(pen.estado).trim().toUpperCase().slice(0, 2) : '';
  const curEst = String(pec.estado ?? '').trim();
  const nextEstado =
    nextEstadoRaw && (!fieldOnlyFillEmpty || curEst === '') ? nextEstadoRaw : pec.estado ?? '';

  const nextEndereco = {
    logradouro: takePrestadorField(pec.logradouro, pen?.logradouro, fieldOnlyFillEmpty),
    numero: takePrestadorField(pec.numero, pen?.numero, fieldOnlyFillEmpty),
    codigoCidade: takePrestadorField(pec.codigoCidade, pen?.codigoCidade, fieldOnlyFillEmpty),
    cep: nextCep,
    complemento: takePrestadorField(pec.complemento, pen?.complemento, fieldOnlyFillEmpty),
    bairro: takePrestadorField(pec.bairro, pen?.bairro, fieldOnlyFillEmpty),
    estado: nextEstado,
    descricaoCidade: takePrestadorField(pec.descricaoCidade, pen?.descricaoCidade, fieldOnlyFillEmpty),
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
