import type { NfseEmitenteSnapshot } from '../services/guidesMeiService';
import type { EmitirNfseInput } from '../services/meiNotasService';
import { formatCpfCnpjPtBr, onlyDigits } from '../lib/formatCpfCnpjPtBr';

const fillText = (current: string | undefined, incoming: string | undefined) => {
  if (String(current ?? '').trim() !== '') return String(current);
  return String(incoming ?? '').trim();
};

/**
 * Preenche apenas campos de prestador da NFS-e que ainda estão vazios,
 * a partir do snapshot persistido (FR-AP-02 — sem sobrescrever edição manual).
 */
export function mergeEmitenteSnapshotIntoNfseForm(
  current: EmitirNfseInput,
  snap: NfseEmitenteSnapshot
): EmitirNfseInput {
  const pe = current.prestadorEndereco || {};
  const snapCnpjDigits = onlyDigits(snap.certDocument || '').slice(0, 14);
  const currentCnpjDigits = onlyDigits(current.prestadorCpfCnpj || '');
  const prestadorCpfCnpj =
    currentCnpjDigits.length === 14
      ? current.prestadorCpfCnpj
      : snapCnpjDigits.length === 14
        ? formatCpfCnpjPtBr(snapCnpjDigits)
        : current.prestadorCpfCnpj;

  const currentCep = onlyDigits(pe.cep || '');
  const cepOut =
    currentCep.length === 8
      ? currentCep.slice(0, 8)
      : onlyDigits(snap.cep || '').slice(0, 8);

  return {
    ...current,
    prestadorCpfCnpj,
    prestadorRazaoSocial: fillText(current.prestadorRazaoSocial, snap.razaoSocial),
    prestadorEmail: fillText(current.prestadorEmail, snap.email),
    prestadorInscricaoMunicipal: fillText(
      current.prestadorInscricaoMunicipal,
      snap.inscricaoMunicipal
    ),
    prestadorEndereco: {
      logradouro: fillText(pe.logradouro, snap.logradouro),
      numero: fillText(pe.numero, snap.numero),
      codigoCidade: fillText(pe.codigoCidade, snap.codigoCidade),
      cep: cepOut,
      complemento: fillText(pe.complemento, snap.complemento),
      bairro: fillText(pe.bairro, snap.bairro),
      estado:
        String(pe.estado ?? '').trim() !== ''
          ? String(pe.estado)
          : String(snap.estado ?? '')
              .trim()
              .toUpperCase(),
      descricaoCidade: fillText(pe.descricaoCidade, snap.descricaoCidade)
    }
  };
}

export const emptyNfsePrestadorEndereco = (): NonNullable<EmitirNfseInput['prestadorEndereco']> => ({
  logradouro: '',
  numero: '',
  codigoCidade: '',
  cep: '',
  complemento: '',
  bairro: '',
  estado: '',
  descricaoCidade: ''
});

/** Estado inicial do formulário de emissão NFS-e (reset após troca de tipo fiscal / testes). */
export function createInitialEmitirNfseInput(): EmitirNfseInput {
  return {
    prestadorCpfCnpj: '',
    prestadorRazaoSocial: '',
    prestadorEmail: '',
    prestadorEndereco: emptyNfsePrestadorEndereco(),
    tomadorCpfCnpj: '',
    tomadorRazaoSocial: '',
    tomadorEmail: '',
    servico: {
      codigo: '',
      discriminacao: '',
      cnae: '',
      codigoNbs: '',
      valorServico: ''
    },
    cidadePrestacao: {
      codigo: '',
      descricao: '',
      estado: ''
    },
    idIntegracao: '',
    enviarEmail: false,
    descricao: '',
    informacoesComplementares: ''
  };
}

/**
 * Substitui o bloco prestador da NFS-e pelos valores do snapshot (ação explícita do utilizador,
 * ex.: após PATCH emitente — mitigação QA FR-AP-02).
 */
export function replacePrestadorFromEmitenteSnapshot(
  current: EmitirNfseInput,
  snap: NfseEmitenteSnapshot
): EmitirNfseInput {
  return mergeEmitenteSnapshotIntoNfseForm(
    {
      ...current,
      prestadorCpfCnpj: '',
      prestadorRazaoSocial: '',
      prestadorEmail: '',
      prestadorInscricaoMunicipal: '',
      prestadorEndereco: emptyNfsePrestadorEndereco()
    },
    snap
  );
}
