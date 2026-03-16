import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  downloadMeiGuide,
  fetchMeiCertificateStatus,
  fetchMeiPeriods,
  fetchMeiPeriodsByCnpj,
  removeMeiCertificate,
  uploadMeiCertificate,
  validateMeiGuide,
  type MeiPeriod
} from '../services/guidesMeiService';
import {
  arquivarNfse,
  atualizarNfse,
  baixarNfsePdf,
  baixarNfseXml,
  cadastrarPlugNotasCertificado,
  cadastrarPlugNotasEmpresa,
  cancelarNfse,
  emitirNfce,
  emitirNfe,
  emitirNfse,
  listarCatalogoNfseClientes,
  listarCatalogoNfseProdutos,
  listarNfse,
  obterNfse,
  type DocumentType,
  type NfeLikePayloadInput,
  type NfeItemInput,
  type NfeTributosInput,
  type NfseCatalogCliente,
  type NfseCatalogProduto,
  type EmitirNfseInput,
  type NfseRecord
} from '../services/meiNotasService';
import { useAuthStore } from '../store/authStore';

const buildFilenameFromCompetencia = (competencia: string | null) => {
  if (!competencia) return 'guia-mei.pdf';
  return `guia-mei-${competencia}.pdf`;
};

const normalizeDoc = (value: string) => value.replace(/\D/g, '');

const getDocType = (value: string) => {
  const digits = normalizeDoc(value);
  if (digits.length === 11) return 1;
  if (digits.length === 14) return 2;
  return null;
};

const formatDocument = (value: string) => {
  const digits = normalizeDoc(value).slice(0, 14);
  let formatted = '';
  for (let i = 0; i < digits.length; i += 1) {
    formatted += digits[i];
    if (digits.length <= 11) {
      if (i === 2 || i === 5) formatted += '.';
      if (i === 8) formatted += '-';
    } else {
      if (i === 1 || i === 4) formatted += '.';
      if (i === 7) formatted += '/';
      if (i === 11) formatted += '-';
    }
  }
  return formatted;
};

const formatCompetencia = (month: string, year: number) => {
  return `${month}/${year}`;
};

const toPeriodoApuracao = (month: string, year: number) => {
  return `${year}${month}`;
};


const triggerFileDownload = (blob: Blob, filename: string) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
};

const getNfseStatusKey = (status?: string | null) => {
  const text = String(status || '').toLowerCase();
  if (!text) return 'processando';
  if (text.includes('cancelamento_pendente')) return 'cancelamento_pendente';
  if (text.includes('concluido') || text.includes('autoriz')) return 'concluido';
  if (text.includes('process')) return 'processando';
  if (text.includes('rejeit')) return 'rejeitado';
  if (text.includes('cancel')) return 'cancelado';
  if (text.includes('interromp')) return 'interrompido';
  return text;
};

const formatNfseStatus = (status?: string | null) => {
  const key = getNfseStatusKey(status);
  if (key === 'concluido') return 'Concluída';
  if (key === 'processando') return 'Processando';
  if (key === 'rejeitado') return 'Rejeitada';
  if (key === 'cancelado') return 'Cancelada';
  if (key === 'cancelamento_pendente') return 'Cancelamento pendente';
  if (key === 'interrompido') return 'Interrompida';
  return status || 'Processando';
};

const getNfseStatusBadgeClass = (status?: string | null) => {
  const key = getNfseStatusKey(status);
  if (key === 'concluido') return 'admin-badge-success';
  if (key === 'processando') return 'admin-badge-primary';
  if (key === 'cancelamento_pendente') return 'admin-badge-warning';
  if (key === 'rejeitado' || key === 'cancelado' || key === 'interrompido') {
    return 'admin-badge-danger';
  }
  return 'admin-badge-neutral';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '---';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR');
};

const buildClienteCatalogLabel = (item: NfseCatalogCliente) => {
  const chunks = [
    item.nome || null,
    item.documento ? formatDocument(item.documento) : null,
    item.email || null
  ].filter(Boolean);
  return chunks.length ? chunks.join(' • ') : 'Cliente sem identificação';
};

const buildProdutoCatalogLabel = (item: NfseCatalogProduto) => {
  const chunks = [
    item.codigo || null,
    item.cnae ? `CNAE ${item.cnae}` : null,
    item.discriminacao || null
  ].filter(Boolean);
  return chunks.length ? chunks.join(' • ') : 'Serviço sem identificação';
};

const toNfseMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const toNfsePeriodKey = (value?: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const formatDasCompetenciaLabel = (value?: string | null) => {
  if (!value) return '---';
  const match = String(value).match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[1]}`;
  }
  return String(value);
};

const getDasStatusLabel = (status?: MeiPeriod['status'] | null) => {
  if (status === 'pago') return 'Pago';
  if (status === 'erro') return 'Erro/Indeterminado';
  return 'Em aberto';
};

const getDasStatusClasses = (status?: MeiPeriod['status'] | null) => {
  if (status === 'pago') return 'admin-badge-success';
  if (status === 'erro') return 'admin-badge-danger';
  return 'admin-badge-warning';
};

const getDefaultPeriod = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    year: previous.getFullYear(),
    month: String(previous.getMonth() + 1).padStart(2, '0')
  };
};

const hasRequiredText = (value: unknown) => String(value || '').trim().length > 0;
const parseDecimalInput = (value: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
type PlugNotasRegimeTributario = '1' | '2' | '3';
type GuidesMeiWorkspace = 'overview' | 'das' | 'nfse';
type NotaDocumentType = 'NFSE' | 'NFE' | 'NFCE';

type NfeItemForm = {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  desconto: string;
  cest: string;
  sku: string;
  tributos: {
    icms: {
      origem: string;
      cst: string;
      csosn: string;
      modalidadeBaseCalculo: string;
      baseCalculo: string;
      aliquota: string;
      valor: string;
    };
    ipi: {
      cst: string;
      codigoEnquadramentoLegal: string;
      baseCalculo: string;
      aliquota: string;
      valor: string;
    };
    pis: {
      cst: string;
      baseCalculo: string;
      aliquota: string;
      valor: string;
    };
    cofins: {
      cst: string;
      baseCalculo: string;
      aliquota: string;
      valor: string;
    };
  };
};

type NfeLikeForm = {
  idIntegracao: string;
  natureza: string;
  emitenteCpfCnpj: string;
  emitenteRazaoSocial: string;
  emitenteInscricaoEstadual: string;
  destinatarioCpfCnpj: string;
  destinatarioRazaoSocial: string;
  destinatarioEmail: string;
  enviarEmail: boolean;
  informacoesComplementares: string;
  itens: NfeItemForm[];
};

type PlugNotasCompanyForm = {
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoMunicipal: string;
  inscricaoEstadual: string;
  email: string;
  regimeTributario: PlugNotasRegimeTributario;
  simplesNacional: boolean;
  cep: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  codigoCidade: string;
  descricaoCidade: string;
  estado: string;
};

type NfsePrestadorEndereco = {
  logradouro: string;
  numero: string;
  codigoCidade: string;
  cep: string;
  complemento: string;
  bairro: string;
  estado: string;
  descricaoCidade: string;
};

const getDefaultNfeTributos = (): NfeItemForm['tributos'] => ({
  icms: {
    origem: '',
    cst: '',
    csosn: '',
    modalidadeBaseCalculo: '',
    baseCalculo: '',
    aliquota: '',
    valor: ''
  },
  ipi: {
    cst: '',
    codigoEnquadramentoLegal: '',
    baseCalculo: '',
    aliquota: '',
    valor: ''
  },
  pis: {
    cst: '',
    baseCalculo: '',
    aliquota: '',
    valor: ''
  },
  cofins: {
    cst: '',
    baseCalculo: '',
    aliquota: '',
    valor: ''
  }
});

const getDefaultNfeItem = (): NfeItemForm => ({
  codigo: '',
  descricao: '',
  ncm: '',
  cfop: '',
  unidade: 'UN',
  quantidade: '',
  valorUnitario: '',
  desconto: '',
  cest: '',
  sku: '',
  tributos: getDefaultNfeTributos()
});

const getDefaultNfeLikeForm = (): NfeLikeForm => ({
  idIntegracao: '',
  natureza: 'VENDA',
  emitenteCpfCnpj: '',
  emitenteRazaoSocial: '',
  emitenteInscricaoEstadual: '',
  destinatarioCpfCnpj: '',
  destinatarioRazaoSocial: '',
  destinatarioEmail: '',
  enviarEmail: false,
  informacoesComplementares: '',
  itens: [getDefaultNfeItem()]
});

const resolvePrestadorEndereco = (
  endereco: EmitirNfseInput['prestadorEndereco'],
  fallback: Partial<NfsePrestadorEndereco> = {}
): NfsePrestadorEndereco => ({
  logradouro: String(endereco?.logradouro || fallback.logradouro || '').trim(),
  numero: String(endereco?.numero || fallback.numero || '').trim(),
  codigoCidade: String(endereco?.codigoCidade || fallback.codigoCidade || '').trim(),
  cep: normalizeDoc(String(endereco?.cep || fallback.cep || '')).slice(0, 8),
  complemento: String(endereco?.complemento || fallback.complemento || '').trim(),
  bairro: String(endereco?.bairro || fallback.bairro || '').trim(),
  estado: String(endereco?.estado || fallback.estado || '').trim().toUpperCase(),
  descricaoCidade: String(endereco?.descricaoCidade || fallback.descricaoCidade || '').trim()
});

const getDefaultPlugNotasCompanyForm = (): PlugNotasCompanyForm => ({
  razaoSocial: '',
  nomeFantasia: '',
  inscricaoMunicipal: '',
  inscricaoEstadual: '',
  email: '',
  regimeTributario: '1',
  simplesNacional: true,
  cep: '',
  tipoLogradouro: 'Rua',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  codigoCidade: '',
  descricaoCidade: '',
  estado: ''
});

const getPlugNotasCompanyValidationMessage = (form: PlugNotasCompanyForm) => {
  if (!hasRequiredText(form.razaoSocial)) return 'Informe a razão social da empresa para configurar a PlugNotas.';
  if (!hasRequiredText(form.logradouro)) return 'Informe o logradouro do endereço da empresa.';
  if (!hasRequiredText(form.numero)) return 'Informe o número do endereço da empresa.';
  if (!hasRequiredText(form.bairro)) return 'Informe o bairro do endereço da empresa.';
  if (normalizeDoc(form.cep).length !== 8) return 'Informe um CEP válido com 8 dígitos.';
  if (!hasRequiredText(form.codigoCidade)) return 'Informe o código IBGE da cidade.';
  if (!hasRequiredText(form.descricaoCidade)) return 'Informe a cidade da empresa.';
  if (form.estado.trim().length !== 2) return 'Informe a UF com 2 letras (ex.: PR).';
  return null;
};

const buildPlugNotasEmpresaPayload = ({
  cnpj,
  certificadoId,
  form
}: {
  cnpj: string;
  certificadoId: string;
  form: PlugNotasCompanyForm;
}) => {
  const endereco: Record<string, unknown> = {
    tipoLogradouro: form.tipoLogradouro.trim() || 'Rua',
    logradouro: form.logradouro.trim(),
    numero: form.numero.trim(),
    bairro: form.bairro.trim(),
    codigoPais: '1058',
    descricaoPais: 'Brasil',
    codigoCidade: form.codigoCidade.trim(),
    descricaoCidade: form.descricaoCidade.trim(),
    estado: form.estado.trim().toUpperCase(),
    cep: normalizeDoc(form.cep).slice(0, 8)
  };
  if (form.complemento.trim()) {
    endereco.complemento = form.complemento.trim();
  }

  const payload: Record<string, unknown> = {
    cpfCnpj: cnpj,
    certificado: certificadoId,
    razaoSocial: form.razaoSocial.trim(),
    nomeFantasia: form.nomeFantasia.trim() || form.razaoSocial.trim(),
    regimeTributario: Number(form.regimeTributario || '1'),
    simplesNacional: Boolean(form.simplesNacional),
    endereco,
    nfse: {
      ativo: true,
      tipoContrato: 0,
      config: { producao: true }
    },
    nfe: {
      ativo: true,
      tipoContrato: 0,
      config: {
        producao: true,
        serie: 1,
        numero: 1
      }
    },
    nfce: {
      ativo: true,
      tipoContrato: 0,
      config: {
        producao: true,
        serie: 1,
        numero: 1
      }
    }
  };
  if (form.email.trim()) {
    payload.email = form.email.trim();
  }
  if (form.inscricaoMunicipal.trim()) {
    payload.inscricaoMunicipal = form.inscricaoMunicipal.trim();
  }
  if (form.inscricaoEstadual.trim()) {
    payload.inscricaoEstadual = form.inscricaoEstadual.trim();
  }

  return payload;
};

const getNfseValidationMessage = (
  input: EmitirNfseInput,
  fallbackPrestadorEndereco: Partial<NfsePrestadorEndereco> = {}
) => {
  const prestadorCpfCnpj = normalizeDoc(input.prestadorCpfCnpj || '');
  if (prestadorCpfCnpj.length !== 14) {
    return 'Informe um CNPJ válido do prestador.';
  }
  const prestadorEndereco = resolvePrestadorEndereco(input.prestadorEndereco, fallbackPrestadorEndereco);
  if (!prestadorEndereco.logradouro) {
    return 'Informe o logradouro do prestador.';
  }
  if (!prestadorEndereco.numero) {
    return 'Informe o número do endereço do prestador.';
  }
  if (!prestadorEndereco.codigoCidade) {
    return 'Informe o código IBGE da cidade do prestador.';
  }
  if (prestadorEndereco.cep.length !== 8) {
    return 'Informe um CEP válido do prestador com 8 dígitos.';
  }

  const tomadorCpfCnpj = normalizeDoc(input.tomadorCpfCnpj || '');
  if (!tomadorCpfCnpj) {
    return 'Informe o CPF/CNPJ do tomador.';
  }
  if (tomadorCpfCnpj.length !== 11 && tomadorCpfCnpj.length !== 14) {
    return 'CPF/CNPJ do tomador inválido.';
  }
  const tomadorRazaoSocial = String(input.tomadorRazaoSocial || '').trim();
  if (!tomadorRazaoSocial) {
    return 'Informe a razão social do tomador.';
  }

  const servico = input.servico;
  if (!servico) {
    return 'Preencha os campos obrigatórios do serviço.';
  }

  if (
    !hasRequiredText(servico.codigo)
    || !hasRequiredText(servico.cnae)
    || !hasRequiredText(servico.discriminacao)
    || !hasRequiredText(servico.aliquota)
    || !hasRequiredText(servico.valorServico)
  ) {
    return 'Preencha os campos obrigatórios do serviço.';
  }

  const aliquota = parseDecimalInput(servico.aliquota);
  if (aliquota === null) {
    return 'Informe uma alíquota ISS válida.';
  }
  const valorServico = parseDecimalInput(servico.valorServico);
  if (valorServico === null || valorServico <= 0) {
    return 'Informe um valor de serviço maior que zero.';
  }

  return null;
};

const buildNfeLikeLabel = (documentType: NotaDocumentType) => (
  documentType === 'NFE' ? 'NF-e' : 'NFC-e'
);

const isValidCpfOrCnpj = (value: string) => {
  const digits = normalizeDoc(value);
  return digits.length === 11 || digits.length === 14;
};

const toOptionalDecimal = (value: string) => {
  const parsed = parseDecimalInput(value);
  return parsed === null ? undefined : parsed;
};

const getNfeLikeValidationMessage = (form: NfeLikeForm, documentType: NotaDocumentType) => {
  const label = buildNfeLikeLabel(documentType);
  const emitenteCpfCnpj = normalizeDoc(form.emitenteCpfCnpj);
  if (emitenteCpfCnpj.length !== 14) {
    return `Informe um CNPJ válido do emitente da ${label}.`;
  }

  if (form.destinatarioCpfCnpj.trim() && !isValidCpfOrCnpj(form.destinatarioCpfCnpj)) {
    return `CPF/CNPJ do destinatário da ${label} inválido.`;
  }
  if (!hasRequiredText(form.destinatarioRazaoSocial)) {
    return `Informe a razão social do destinatário da ${label}.`;
  }

  if (!Array.isArray(form.itens) || form.itens.length === 0) {
    return `Adicione ao menos um item para emitir ${label}.`;
  }

  for (let index = 0; index < form.itens.length; index += 1) {
    const item = form.itens[index];
    const linha = index + 1;
    if (!hasRequiredText(item.codigo)) return `Item ${linha}: informe o código.`;
    if (!hasRequiredText(item.descricao)) return `Item ${linha}: informe a descrição.`;
    if (normalizeDoc(item.ncm).length !== 8) return `Item ${linha}: NCM deve conter 8 dígitos.`;
    if (!hasRequiredText(item.cfop)) return `Item ${linha}: informe o CFOP.`;
    if (!hasRequiredText(item.unidade)) return `Item ${linha}: informe a unidade comercial.`;
    const quantidade = parseDecimalInput(item.quantidade);
    if (quantidade === null || quantidade <= 0) return `Item ${linha}: quantidade deve ser maior que zero.`;
    const valorUnitario = parseDecimalInput(item.valorUnitario);
    if (valorUnitario === null || valorUnitario <= 0) return `Item ${linha}: valor unitário deve ser maior que zero.`;

    const hasIcmsCode = hasRequiredText(item.tributos.icms.cst) || hasRequiredText(item.tributos.icms.csosn);
    if (!hasIcmsCode) return `Item ${linha}: informe CST ou CSOSN do ICMS.`;
    if (!hasRequiredText(item.tributos.pis.cst)) return `Item ${linha}: informe CST do PIS.`;
    if (!hasRequiredText(item.tributos.cofins.cst)) return `Item ${linha}: informe CST do COFINS.`;
  }

  return null;
};

const mapNfeTributos = (tributos: NfeItemForm['tributos']): NfeTributosInput => ({
  icms: {
    ...(tributos.icms.origem.trim() ? { origem: tributos.icms.origem.trim() } : {}),
    ...(tributos.icms.cst.trim() ? { cst: tributos.icms.cst.trim() } : {}),
    ...(tributos.icms.csosn.trim() ? { csosn: tributos.icms.csosn.trim() } : {}),
    ...(tributos.icms.modalidadeBaseCalculo.trim()
      ? { modalidadeBaseCalculo: tributos.icms.modalidadeBaseCalculo.trim() }
      : {}),
    ...(toOptionalDecimal(tributos.icms.baseCalculo) !== undefined
      ? { baseCalculo: toOptionalDecimal(tributos.icms.baseCalculo) }
      : {}),
    ...(toOptionalDecimal(tributos.icms.aliquota) !== undefined
      ? { aliquota: toOptionalDecimal(tributos.icms.aliquota) }
      : {}),
    ...(toOptionalDecimal(tributos.icms.valor) !== undefined
      ? { valor: toOptionalDecimal(tributos.icms.valor) }
      : {})
  },
  ...(hasRequiredText(tributos.ipi.cst)
    || hasRequiredText(tributos.ipi.codigoEnquadramentoLegal)
    || hasRequiredText(tributos.ipi.baseCalculo)
    || hasRequiredText(tributos.ipi.aliquota)
    || hasRequiredText(tributos.ipi.valor)
    ? {
        ipi: {
          ...(tributos.ipi.cst.trim() ? { cst: tributos.ipi.cst.trim() } : {}),
          ...(tributos.ipi.codigoEnquadramentoLegal.trim()
            ? { codigoEnquadramentoLegal: tributos.ipi.codigoEnquadramentoLegal.trim() }
            : {}),
          ...(toOptionalDecimal(tributos.ipi.baseCalculo) !== undefined
            ? { baseCalculo: toOptionalDecimal(tributos.ipi.baseCalculo) }
            : {}),
          ...(toOptionalDecimal(tributos.ipi.aliquota) !== undefined
            ? { aliquota: toOptionalDecimal(tributos.ipi.aliquota) }
            : {}),
          ...(toOptionalDecimal(tributos.ipi.valor) !== undefined
            ? { valor: toOptionalDecimal(tributos.ipi.valor) }
            : {})
        }
      }
    : {}),
  pis: {
    ...(tributos.pis.cst.trim() ? { cst: tributos.pis.cst.trim() } : {}),
    ...(toOptionalDecimal(tributos.pis.baseCalculo) !== undefined
      ? { baseCalculo: toOptionalDecimal(tributos.pis.baseCalculo) }
      : {}),
    ...(toOptionalDecimal(tributos.pis.aliquota) !== undefined
      ? { aliquota: toOptionalDecimal(tributos.pis.aliquota) }
      : {}),
    ...(toOptionalDecimal(tributos.pis.valor) !== undefined
      ? { valor: toOptionalDecimal(tributos.pis.valor) }
      : {})
  },
  cofins: {
    ...(tributos.cofins.cst.trim() ? { cst: tributos.cofins.cst.trim() } : {}),
    ...(toOptionalDecimal(tributos.cofins.baseCalculo) !== undefined
      ? { baseCalculo: toOptionalDecimal(tributos.cofins.baseCalculo) }
      : {}),
    ...(toOptionalDecimal(tributos.cofins.aliquota) !== undefined
      ? { aliquota: toOptionalDecimal(tributos.cofins.aliquota) }
      : {}),
    ...(toOptionalDecimal(tributos.cofins.valor) !== undefined
      ? { valor: toOptionalDecimal(tributos.cofins.valor) }
      : {})
  }
});

const mapNfeItem = (item: NfeItemForm): NfeItemInput => ({
  codigo: item.codigo.trim(),
  descricao: item.descricao.trim(),
  ncm: normalizeDoc(item.ncm).slice(0, 8),
  cfop: item.cfop.trim(),
  unidade: item.unidade.trim() || 'UN',
  quantidade: parseDecimalInput(item.quantidade) || 0,
  valorUnitario: parseDecimalInput(item.valorUnitario) || 0,
  ...(toOptionalDecimal(item.desconto) !== undefined ? { desconto: toOptionalDecimal(item.desconto) } : {}),
  ...(item.cest.trim() ? { cest: item.cest.trim() } : {}),
  ...(item.sku.trim() ? { sku: item.sku.trim() } : {}),
  tributos: mapNfeTributos(item.tributos)
});

const buildNfeLikePayloadFromForm = (
  form: NfeLikeForm,
  documentType: NotaDocumentType
): NfeLikePayloadInput => ({
  ...(form.idIntegracao.trim() ? { idIntegracao: form.idIntegracao.trim() } : {}),
  modelo: documentType === 'NFE' ? '55' : '65',
  natureza: form.natureza.trim() || 'VENDA',
  emitente: {
    cpfCnpj: normalizeDoc(form.emitenteCpfCnpj),
    ...(form.emitenteRazaoSocial.trim() ? { razaoSocial: form.emitenteRazaoSocial.trim() } : {}),
    ...(form.emitenteInscricaoEstadual.trim()
      ? { inscricaoEstadual: form.emitenteInscricaoEstadual.trim() }
      : {})
  },
  destinatario: {
    ...(normalizeDoc(form.destinatarioCpfCnpj)
      ? { cpfCnpj: normalizeDoc(form.destinatarioCpfCnpj) }
      : {}),
    ...(form.destinatarioRazaoSocial.trim() ? { razaoSocial: form.destinatarioRazaoSocial.trim() } : {}),
    ...(form.destinatarioEmail.trim() ? { email: form.destinatarioEmail.trim() } : {})
  },
  itens: form.itens.map(mapNfeItem),
  ...(form.informacoesComplementares.trim()
    ? { informacoesComplementares: form.informacoesComplementares.trim() }
    : {}),
  config: {
    producao: true
  }
});

export default function GuidesMei() {
  const { role, mei } = useAuthStore();
  const canViewNfse = role === 'superadmin'
    || role === 'admin'
    || (role === 'usuario' && mei !== false);
  const [contribuinteDoc, setContribuinteDoc] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState<GuidesMeiWorkspace>('overview');
  const defaultPeriod = useMemo(() => getDefaultPeriod(), []);
  const [selectedYear, setSelectedYear] = useState<number>(defaultPeriod.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultPeriod.month);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isRemovingCert, setIsRemovingCert] = useState(false);
  const [hasUserCertificate, setHasUserCertificate] = useState(false);
  const [hasServerCertificate, setHasServerCertificate] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [isDownloadingGuide, setIsDownloadingGuide] = useState(false);

  const [meiPeriods, setMeiPeriods] = useState<MeiPeriod[]>([]);
  const [meiPeriodsLoading, setMeiPeriodsLoading] = useState(false);
  const [meiPeriodsError, setMeiPeriodsError] = useState<string | null>(null);
  const hasCertificate = hasUserCertificate;
  const [notaDocumentType, setNotaDocumentType] = useState<NotaDocumentType>('NFSE');
  const [nfseForm, setNfseForm] = useState<EmitirNfseInput>({
    prestadorCpfCnpj: '',
    prestadorInscricaoMunicipal: '',
    prestadorRazaoSocial: '',
    prestadorEmail: '',
    prestadorEndereco: {
      logradouro: '',
      numero: '',
      codigoCidade: '',
      cep: '',
      complemento: '',
      bairro: '',
      estado: '',
      descricaoCidade: ''
    },
    tomadorCpfCnpj: '',
    tomadorRazaoSocial: '',
    tomadorEmail: '',
    servico: {
      codigo: '',
      discriminacao: '',
      cnae: '',
      aliquota: '',
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
  });
  const [nfeForm, setNfeForm] = useState<NfeLikeForm>(() => getDefaultNfeLikeForm());
  const [nfceForm, setNfceForm] = useState<NfeLikeForm>(() => getDefaultNfeLikeForm());
  const [nfseList, setNfseList] = useState<NfseRecord[]>([]);
  const [nfseLoading, setNfseLoading] = useState(false);
  const [nfseSubmitting, setNfseSubmitting] = useState(false);
  const [nfseActionMap, setNfseActionMap] = useState<Record<string, boolean>>({});
  const [nfseError, setNfseError] = useState<string | null>(null);
  const [nfseSuccess, setNfseSuccess] = useState<string | null>(null);
  const [nfseCatalogLoading, setNfseCatalogLoading] = useState(false);
  const [nfseCatalogError, setNfseCatalogError] = useState<string | null>(null);
  const [nfseCatalogClientes, setNfseCatalogClientes] = useState<NfseCatalogCliente[]>([]);
  const [nfseCatalogProdutos, setNfseCatalogProdutos] = useState<NfseCatalogProduto[]>([]);
  const [selectedCatalogClienteId, setSelectedCatalogClienteId] = useState('');
  const [selectedCatalogProdutoId, setSelectedCatalogProdutoId] = useState('');
  const [nfseStatusFilter, setNfseStatusFilter] = useState('all');
  const [nfsePeriodFilter, setNfsePeriodFilter] = useState('all');
  const [nfseShowArchived, setNfseShowArchived] = useState(false);
  const [nfseDocumentTypeFilter, setNfseDocumentTypeFilter] = useState<'all' | DocumentType>('NFSE');
  const [certificateSuccess, setCertificateSuccess] = useState<string | null>(null);
  const [plugNotasCompanyForm, setPlugNotasCompanyForm] = useState<PlugNotasCompanyForm>(() => (
    getDefaultPlugNotasCompanyForm()
  ));
  const nfseValidationMessage = useMemo(() => (
    getNfseValidationMessage(nfseForm, {
      logradouro: plugNotasCompanyForm.logradouro,
      numero: plugNotasCompanyForm.numero,
      codigoCidade: plugNotasCompanyForm.codigoCidade,
      cep: plugNotasCompanyForm.cep,
      complemento: plugNotasCompanyForm.complemento,
      bairro: plugNotasCompanyForm.bairro,
      estado: plugNotasCompanyForm.estado,
      descricaoCidade: plugNotasCompanyForm.descricaoCidade
    })
  ), [nfseForm, plugNotasCompanyForm]);
  const nfeValidationMessage = useMemo(
    () => getNfeLikeValidationMessage(nfeForm, 'NFE'),
    [nfeForm]
  );
  const nfceValidationMessage = useMemo(
    () => getNfeLikeValidationMessage(nfceForm, 'NFCE'),
    [nfceForm]
  );
  const notaValidationMessage = useMemo(() => {
    if (notaDocumentType === 'NFE') return nfeValidationMessage;
    if (notaDocumentType === 'NFCE') return nfceValidationMessage;
    return nfseValidationMessage;
  }, [nfceValidationMessage, nfeValidationMessage, nfseValidationMessage, notaDocumentType]);

  const normalizedContribuinte = useMemo(() => normalizeDoc(contribuinteDoc), [contribuinteDoc]);
  const contribuinteTipo = useMemo(() => getDocType(normalizedContribuinte), [normalizedContribuinte]);
  const canLoadPeriods = normalizedContribuinte.length === 14;

  const applyDocumento = useCallback((documento?: string | null, force = false) => {
    if (!documento) return;
    const formatted = formatDocument(documento);
    setContribuinteDoc((current) => (force || !current ? formatted : current));
  }, []);

  const loadCertificateStatus = useCallback(async () => {
    try {
      const status = await fetchMeiCertificateStatus();
      setHasUserCertificate(Boolean(status.hasUserCertificate));
      setHasServerCertificate(Boolean(status.hasEnvCertificate));
      applyDocumento(status.documento);
    } catch {
      setHasUserCertificate(false);
      setHasServerCertificate(false);
    }
  }, [applyDocumento]);

  const loadMeiPeriods = useCallback(async () => {
    if (!canLoadPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    setMeiPeriodsLoading(true);
    setMeiPeriodsError(null);
    try {
      const contribuinte = contribuinteTipo
        ? { numero: normalizedContribuinte, tipo: contribuinteTipo }
        : undefined;
      const periods = hasUserCertificate
        ? await fetchMeiPeriods(normalizedContribuinte, contribuinte)
        : await fetchMeiPeriodsByCnpj(normalizedContribuinte);
      setMeiPeriods(periods || []);
    } catch (error) {
      setMeiPeriodsError(error instanceof Error ? error.message : 'Erro ao listar períodos do DAS.');
    } finally {
      setMeiPeriodsLoading(false);
    }
  }, [canLoadPeriods, contribuinteTipo, hasUserCertificate, normalizedContribuinte]);

  const loadNfseList = useCallback(async () => {
    if (!canViewNfse) {
      setNfseList([]);
      setNfseLoading(false);
      setNfseError(null);
      return;
    }
    setNfseLoading(true);
    setNfseError(null);
    try {
      const list = await listarNfse({
        includeArchived: nfseShowArchived,
        ...(nfseDocumentTypeFilter !== 'all' ? { documentType: nfseDocumentTypeFilter } : {})
      });
      setNfseList(list);
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao listar NFSe.');
    } finally {
      setNfseLoading(false);
    }
  }, [canViewNfse, nfseDocumentTypeFilter, nfseShowArchived]);

  const loadNfseCatalog = useCallback(async () => {
    if (!canViewNfse) {
      setNfseCatalogClientes([]);
      setNfseCatalogProdutos([]);
      setNfseCatalogLoading(false);
      setNfseCatalogError(null);
      return;
    }
    setNfseCatalogLoading(true);
    setNfseCatalogError(null);
    try {
      const [clientes, produtos] = await Promise.all([
        listarCatalogoNfseClientes({ limit: 30, documentType: notaDocumentType }),
        listarCatalogoNfseProdutos({ limit: 30, documentType: notaDocumentType })
      ]);
      setNfseCatalogClientes(clientes || []);
      setNfseCatalogProdutos(produtos || []);
    } catch (error) {
      setNfseCatalogError(error instanceof Error ? error.message : 'Erro ao carregar catálogo fiscal.');
    } finally {
      setNfseCatalogLoading(false);
    }
  }, [canViewNfse, notaDocumentType]);

  const updateNfseForm = (updates: Partial<EmitirNfseInput>) => {
    setNfseForm((current) => ({ ...current, ...updates }));
  };

  const updateNfseServico = (updates: Partial<EmitirNfseInput['servico']>) => {
    setNfseForm((current) => ({
      ...current,
      servico: {
        ...current.servico,
        ...updates
      }
    }));
  };

  const updateNfseCidade = (updates: Partial<NonNullable<EmitirNfseInput['cidadePrestacao']>>) => {
    setNfseForm((current) => ({
      ...current,
      cidadePrestacao: {
        ...(current.cidadePrestacao || {}),
        ...updates
      }
    }));
  };

  const updateNfsePrestadorEndereco = (
    updates: Partial<NonNullable<EmitirNfseInput['prestadorEndereco']>>
  ) => {
    setNfseForm((current) => ({
      ...current,
      prestadorEndereco: {
        ...(current.prestadorEndereco || {}),
        ...updates
      }
    }));
  };

  const getNfeLikeFormByType = (documentType: NotaDocumentType) => (
    documentType === 'NFE' ? nfeForm : nfceForm
  );

  const updateNfeLikeFormByType = (documentType: NotaDocumentType, updates: Partial<NfeLikeForm>) => {
    if (documentType === 'NFE') {
      setNfeForm((current) => ({ ...current, ...updates }));
      return;
    }
    setNfceForm((current) => ({ ...current, ...updates }));
  };

  const updateNfeLikeItemByType = (
    documentType: NotaDocumentType,
    index: number,
    updates: Partial<NfeItemForm>
  ) => {
    const apply = (current: NfeLikeForm): NfeLikeForm => ({
      ...current,
      itens: current.itens.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...updates } : item
      ))
    });
    if (documentType === 'NFE') {
      setNfeForm(apply);
      return;
    }
    setNfceForm(apply);
  };

  const updateNfeLikeItemTributosByType = <
    T extends keyof NfeItemForm['tributos']
  >(
    documentType: NotaDocumentType,
    index: number,
    tributo: T,
    updates: Partial<NfeItemForm['tributos'][T]>
  ) => {
    const apply = (current: NfeLikeForm): NfeLikeForm => ({
      ...current,
      itens: current.itens.map((item, itemIndex) => (
        itemIndex === index
          ? {
              ...item,
              tributos: {
                ...item.tributos,
                [tributo]: {
                  ...item.tributos[tributo],
                  ...updates
                }
              }
            }
          : item
      ))
    });
    if (documentType === 'NFE') {
      setNfeForm(apply);
      return;
    }
    setNfceForm(apply);
  };

  const addNfeLikeItemByType = (documentType: NotaDocumentType) => {
    const apply = (current: NfeLikeForm): NfeLikeForm => ({
      ...current,
      itens: [...current.itens, getDefaultNfeItem()]
    });
    if (documentType === 'NFE') {
      setNfeForm(apply);
      return;
    }
    setNfceForm(apply);
  };

  const removeNfeLikeItemByType = (documentType: NotaDocumentType, index: number) => {
    const apply = (current: NfeLikeForm): NfeLikeForm => {
      if (current.itens.length <= 1) {
        return {
          ...current,
          itens: [getDefaultNfeItem()]
        };
      }
      return {
        ...current,
        itens: current.itens.filter((_, itemIndex) => itemIndex !== index)
      };
    };
    if (documentType === 'NFE') {
      setNfeForm(apply);
      return;
    }
    setNfceForm(apply);
  };

  const updatePlugNotasCompanyForm = (updates: Partial<PlugNotasCompanyForm>) => {
    setPlugNotasCompanyForm((current) => ({
      ...current,
      ...updates
    }));
  };

  const handleSelectCatalogCliente = (id: string) => {
    setSelectedCatalogClienteId(id);
    if (!id) return;
    const selected = nfseCatalogClientes.find((item) => item.id === id);
    if (!selected) return;
    if (notaDocumentType === 'NFSE') {
      updateNfseForm({
        tomadorCpfCnpj: selected.documento ? formatDocument(selected.documento) : '',
        tomadorRazaoSocial: selected.nome || '',
        tomadorEmail: selected.email || ''
      });
      return;
    }
    updateNfeLikeFormByType(notaDocumentType, {
      destinatarioCpfCnpj: selected.documento ? formatDocument(selected.documento) : '',
      destinatarioRazaoSocial: selected.nome || '',
      destinatarioEmail: selected.email || ''
    });
  };

  const handleSelectCatalogProduto = (id: string) => {
    setSelectedCatalogProdutoId(id);
    if (!id) return;
    const selected = nfseCatalogProdutos.find((item) => item.id === id);
    if (!selected) return;
    if (notaDocumentType === 'NFSE') {
      updateNfseServico({
        codigo: selected.codigo || '',
        cnae: selected.cnae || '',
        discriminacao: selected.discriminacao || '',
        aliquota: selected.aliquota ?? '',
        valorServico: selected.valor_sugerido ?? ''
      });
      return;
    }
    const cnaeDigits = normalizeDoc(selected.cnae || '');
    const ncm = cnaeDigits.length === 8 ? cnaeDigits : '';
    const cfop = cnaeDigits.length === 4 ? cnaeDigits : '';
    updateNfeLikeItemByType(notaDocumentType, 0, {
      codigo: selected.codigo || '',
      descricao: selected.discriminacao || '',
      ncm,
      cfop,
      valorUnitario: selected.valor_sugerido ? String(selected.valor_sugerido) : ''
    });
  };

  const isNfseActionLoading = (actionKey: string) => Boolean(nfseActionMap[actionKey]);
  const isNfseRowBusy = (id: string) => Object.entries(nfseActionMap)
    .some(([key, value]) => value && key.startsWith(`${id}:`));

  const startNfseAction = (actionKey: string) => {
    setNfseActionMap((current) => ({ ...current, [actionKey]: true }));
  };

  const finishNfseAction = (actionKey: string) => {
    setNfseActionMap((current) => {
      const next = { ...current };
      delete next[actionKey];
      return next;
    });
  };

  useEffect(() => {
    void loadCertificateStatus();
  }, [loadCertificateStatus]);

  useEffect(() => {
    if (!canLoadPeriods) {
      setMeiPeriods([]);
      setMeiPeriodsError(null);
      return;
    }
    void loadMeiPeriods();
  }, [canLoadPeriods, hasUserCertificate, loadMeiPeriods]);

  useEffect(() => {
    void loadNfseList();
  }, [loadNfseList]);

  useEffect(() => {
    void loadNfseCatalog();
  }, [loadNfseCatalog]);

  useEffect(() => {
    setSelectedCatalogClienteId('');
    setSelectedCatalogProdutoId('');
    setNfseCatalogError(null);
  }, [notaDocumentType]);

  useEffect(() => {
    if (!canViewNfse && activeWorkspace === 'nfse') {
      setActiveWorkspace('overview');
    }
  }, [activeWorkspace, canViewNfse]);

  useEffect(() => {
    if (!normalizedContribuinte) return;
    const formatted = formatDocument(normalizedContribuinte);
    setNfseForm((current) => (
      current.prestadorCpfCnpj
        ? current
        : { ...current, prestadorCpfCnpj: formatted }
    ));
    setNfeForm((current) => (
      current.emitenteCpfCnpj
        ? current
        : { ...current, emitenteCpfCnpj: formatted }
    ));
    setNfceForm((current) => (
      current.emitenteCpfCnpj
        ? current
        : { ...current, emitenteCpfCnpj: formatted }
    ));
  }, [normalizedContribuinte]);

  useEffect(() => {
    setPlugNotasCompanyForm((current) => {
      const razao = nfseForm.prestadorRazaoSocial?.trim() || '';
      const email = nfseForm.prestadorEmail?.trim() || '';
      if (!razao && !email) return current;

      let changed = false;
      const next = { ...current };
      if (razao && !current.razaoSocial.trim()) {
        next.razaoSocial = razao;
        changed = true;
      }
      if (razao && !current.nomeFantasia.trim()) {
        next.nomeFantasia = razao;
        changed = true;
      }
      if (email && !current.email.trim()) {
        next.email = email;
        changed = true;
      }
      return changed ? next : current;
    });
  }, [nfseForm.prestadorEmail, nfseForm.prestadorRazaoSocial]);

  useEffect(() => {
    setValidationError(null);
    setValidationSuccess(null);
  }, [normalizedContribuinte, selectedMonth, selectedYear, hasUserCertificate]);

  const handleDownload = async (periodoApuracao: string, competencia?: string | null) => {
    const contribuinte = normalizedContribuinte && contribuinteTipo !== null
      ? { numero: normalizedContribuinte, tipo: contribuinteTipo }
      : undefined;
    const { blob, filename } = await downloadMeiGuide(
      normalizedContribuinte,
      periodoApuracao,
      contribuinte
    );
    triggerFileDownload(blob, filename || buildFilenameFromCompetencia(competencia || null));
  };

  const handleCertificateUpload = async () => {
    if (!certificateFile) {
      setCertificateError('Selecione o arquivo do certificado.');
      return;
    }
    const trimmedPassword = certificatePassword.trim();
    if (!trimmedPassword) {
      setCertificateError('Informe a senha do certificado.');
      return;
    }
    if (canViewNfse) {
      const companyValidationMessage = getPlugNotasCompanyValidationMessage(plugNotasCompanyForm);
      if (companyValidationMessage) {
        setCertificateError(companyValidationMessage);
        return;
      }
    }

    setCertificateError(null);
    setCertificateSuccess(null);
    setIsUploadingCert(true);
    let uploadedToMei = false;
    try {
      const status = await uploadMeiCertificate(certificateFile, trimmedPassword);
      uploadedToMei = true;
      applyDocumento(status.documento, true);

      if (!canViewNfse) {
        setCertificateFile(null);
        setCertificatePassword('');
        setCertificateSuccess('Certificado enviado com sucesso.');
        return;
      }

      const cnpj = normalizeDoc(
        status.documento
        || normalizedContribuinte
        || nfseForm.prestadorCpfCnpj
        || contribuinteDoc
      );
      if (cnpj.length !== 14) {
        throw new Error('Não foi possível identificar um CNPJ válido para configurar a empresa na PlugNotas.');
      }

      const certificateResponse = await cadastrarPlugNotasCertificado({
        arquivo: certificateFile,
        senha: trimmedPassword,
        ...(
          plugNotasCompanyForm.email.trim()
            ? { email: plugNotasCompanyForm.email.trim() }
            : {}
        )
      });
      const certificateId = String(certificateResponse.id || '').trim();
      if (!certificateId) {
        throw new Error('A PlugNotas não retornou o ID do certificado.');
      }

      const companyPayload = buildPlugNotasEmpresaPayload({
        cnpj,
        certificadoId: certificateId,
        form: plugNotasCompanyForm
      });
      const companyResponse = await cadastrarPlugNotasEmpresa(companyPayload);
      const returnedCnpj = normalizeDoc(String(companyResponse.cnpj || cnpj));
      const formattedCnpj = formatDocument(returnedCnpj || cnpj);

      setContribuinteDoc(formattedCnpj);
      updateNfseForm({
        prestadorCpfCnpj: formattedCnpj,
        ...(plugNotasCompanyForm.razaoSocial.trim()
          ? { prestadorRazaoSocial: plugNotasCompanyForm.razaoSocial.trim() }
          : {}),
        ...(plugNotasCompanyForm.email.trim()
          ? { prestadorEmail: plugNotasCompanyForm.email.trim() }
          : {}),
        prestadorEndereco: resolvePrestadorEndereco(undefined, {
          logradouro: plugNotasCompanyForm.logradouro,
          numero: plugNotasCompanyForm.numero,
          codigoCidade: plugNotasCompanyForm.codigoCidade,
          cep: plugNotasCompanyForm.cep,
          complemento: plugNotasCompanyForm.complemento,
          bairro: plugNotasCompanyForm.bairro,
          estado: plugNotasCompanyForm.estado,
          descricaoCidade: plugNotasCompanyForm.descricaoCidade
        })
      });
      updateNfeLikeFormByType('NFE', {
        emitenteCpfCnpj: formattedCnpj,
        ...(plugNotasCompanyForm.razaoSocial.trim()
          ? { emitenteRazaoSocial: plugNotasCompanyForm.razaoSocial.trim() }
          : {}),
        ...(plugNotasCompanyForm.inscricaoEstadual.trim()
          ? { emitenteInscricaoEstadual: plugNotasCompanyForm.inscricaoEstadual.trim() }
          : {})
      });
      updateNfeLikeFormByType('NFCE', {
        emitenteCpfCnpj: formattedCnpj,
        ...(plugNotasCompanyForm.razaoSocial.trim()
          ? { emitenteRazaoSocial: plugNotasCompanyForm.razaoSocial.trim() }
          : {}),
        ...(plugNotasCompanyForm.inscricaoEstadual.trim()
          ? { emitenteInscricaoEstadual: plugNotasCompanyForm.inscricaoEstadual.trim() }
          : {})
      });

      setCertificateFile(null);
      setCertificatePassword('');
      setCertificateSuccess(
        [
          'Certificado enviado no MEI e configurado na PlugNotas.',
          certificateResponse.message || null,
          companyResponse.message || 'Empresa configurada na PlugNotas com sucesso.'
        ].filter(Boolean).join(' ')
      );
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Erro ao enviar certificado.';
      setCertificateError(
        uploadedToMei
          ? `Certificado enviado no MEI, mas falhou a configuração automática da PlugNotas: ${fallbackMessage}`
          : fallbackMessage
      );
    } finally {
      if (uploadedToMei) {
        try {
          await loadCertificateStatus();
        } catch {
          // mantém o resultado principal e evita bloquear o fluxo por refresh de status.
        }
      }
      setIsUploadingCert(false);
    }
  };

  const handleCertificateRemove = async () => {
    setCertificateError(null);
    setCertificateSuccess(null);
    setIsRemovingCert(true);
    try {
      await removeMeiCertificate();
      await loadCertificateStatus();
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : 'Erro ao remover certificado.');
    } finally {
      setIsRemovingCert(false);
    }
  };

  const handleValidateBlur = async () => {
    if (isValidating) return;
    setValidationError(null);
    setValidationSuccess(null);

    if (!normalizedContribuinte) {
      return;
    }
    if (normalizedContribuinte.length !== 14) {
      setValidationError('CNPJ do MEI deve ter 14 dígitos.');
      return;
    }

    setIsValidating(true);
    try {
      const periodoApuracao = toPeriodoApuracao(selectedMonth, selectedYear);
      const result = await validateMeiGuide(normalizedContribuinte, periodoApuracao);
      const fallbackMessage = hasUserCertificate
        ? 'CNPJ e certificado validados com sucesso.'
        : 'CNPJ validado com sucesso.';
      setValidationSuccess(result?.message || fallbackMessage);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Erro ao validar CNPJ.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleEmitNfse = async () => {
    if (nfseSubmitting) return;
    setNfseError(null);
    setNfseSuccess(null);

    if (notaValidationMessage) {
      setNfseError(notaValidationMessage);
      return;
    }

    setNfseSubmitting(true);
    try {
      let created: NfseRecord;
      if (notaDocumentType === 'NFSE') {
        const prestadorCpfCnpj = normalizeDoc(nfseForm.prestadorCpfCnpj);
        const tomadorCpfCnpj = normalizeDoc(nfseForm.tomadorCpfCnpj || '');
        const servico = nfseForm.servico;
        const prestadorEndereco = resolvePrestadorEndereco(nfseForm.prestadorEndereco, {
          logradouro: plugNotasCompanyForm.logradouro,
          numero: plugNotasCompanyForm.numero,
          codigoCidade: plugNotasCompanyForm.codigoCidade,
          cep: plugNotasCompanyForm.cep,
          complemento: plugNotasCompanyForm.complemento,
          bairro: plugNotasCompanyForm.bairro,
          estado: plugNotasCompanyForm.estado,
          descricaoCidade: plugNotasCompanyForm.descricaoCidade
        });

        const payload: EmitirNfseInput = {
          prestadorCpfCnpj,
          servico: {
            codigo: servico.codigo.trim(),
            cnae: servico.cnae.trim(),
            discriminacao: servico.discriminacao.trim(),
            aliquota: servico.aliquota,
            valorServico: servico.valorServico
          },
          prestadorEndereco: {
            logradouro: prestadorEndereco.logradouro,
            numero: prestadorEndereco.numero,
            codigoCidade: prestadorEndereco.codigoCidade,
            cep: prestadorEndereco.cep,
            ...(prestadorEndereco.complemento ? { complemento: prestadorEndereco.complemento } : {}),
            ...(prestadorEndereco.bairro ? { bairro: prestadorEndereco.bairro } : {}),
            ...(prestadorEndereco.estado ? { estado: prestadorEndereco.estado } : {}),
            ...(prestadorEndereco.descricaoCidade ? { descricaoCidade: prestadorEndereco.descricaoCidade } : {})
          },
          enviarEmail: Boolean(nfseForm.enviarEmail)
        };

        if (nfseForm.prestadorInscricaoMunicipal?.trim()) {
          payload.prestadorInscricaoMunicipal = nfseForm.prestadorInscricaoMunicipal.trim();
        }
        if (nfseForm.prestadorRazaoSocial?.trim()) {
          payload.prestadorRazaoSocial = nfseForm.prestadorRazaoSocial.trim();
        }
        if (nfseForm.prestadorEmail?.trim()) {
          payload.prestadorEmail = nfseForm.prestadorEmail.trim();
        }
        if (tomadorCpfCnpj) {
          payload.tomadorCpfCnpj = tomadorCpfCnpj;
        }
        if (nfseForm.tomadorRazaoSocial?.trim()) {
          payload.tomadorRazaoSocial = nfseForm.tomadorRazaoSocial.trim();
        }
        if (nfseForm.tomadorEmail?.trim()) {
          payload.tomadorEmail = nfseForm.tomadorEmail.trim();
        }
        if (nfseForm.idIntegracao?.trim()) {
          payload.idIntegracao = nfseForm.idIntegracao.trim();
        }
        if (nfseForm.descricao?.trim()) {
          payload.descricao = nfseForm.descricao.trim();
        }
        if (nfseForm.informacoesComplementares?.trim()) {
          payload.informacoesComplementares = nfseForm.informacoesComplementares.trim();
        }

        const cidade = nfseForm.cidadePrestacao || {};
        if (cidade.codigo || cidade.descricao || cidade.estado) {
          payload.cidadePrestacao = {
            ...(cidade.codigo ? { codigo: cidade.codigo.trim() } : {}),
            ...(cidade.descricao ? { descricao: cidade.descricao.trim() } : {}),
            ...(cidade.estado ? { estado: cidade.estado.trim() } : {})
          };
        }
        created = await emitirNfse(payload);
      } else {
        const nfeLikeForm = getNfeLikeFormByType(notaDocumentType);
        const payload = buildNfeLikePayloadFromForm(nfeLikeForm, notaDocumentType);
        created = notaDocumentType === 'NFE'
          ? await emitirNfe(payload)
          : await emitirNfce(payload);
      }
      const docLabel = notaDocumentType === 'NFE'
        ? 'NF-e'
        : notaDocumentType === 'NFCE'
          ? 'NFC-e'
          : 'NFSe';
      setNfseSuccess(
        created?.protocol
          ? `${docLabel} enviada. Protocolo ${created.protocol}.`
          : `${docLabel} enviada. Acompanhe o status na lista.`
      );
      await Promise.all([loadNfseList(), loadNfseCatalog()]);
      setSelectedCatalogClienteId('');
      setSelectedCatalogProdutoId('');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao emitir nota fiscal.');
    } finally {
      setNfseSubmitting(false);
    }
  };

  const handleSyncNfse = async (id: string) => {
    const actionKey = `${id}:sync`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await obterNfse(id, true);
      setNfseList((current) => current.map((item) => (item.id === id ? updated : item)));
      setNfseSuccess('Status da NFSe atualizado com sucesso.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao atualizar NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleDownloadNfsePdf = async (record: NfseRecord) => {
    const actionKey = `${record.id}:pdf`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const { blob, filename } = await baixarNfsePdf(record.id);
      triggerFileDownload(blob, filename || `nfse-${record.id}.pdf`);
      setNfseSuccess('Download do PDF iniciado.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao baixar PDF da NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleDownloadNfseXml = async (record: NfseRecord) => {
    const actionKey = `${record.id}:xml`;
    if (isNfseActionLoading(actionKey)) return;
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const { blob, filename } = await baixarNfseXml(record.id);
      triggerFileDownload(blob, filename || `nfse-${record.id}.xml`);
      setNfseSuccess('Download do XML iniciado.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao baixar XML da NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleToggleReviewNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:update`;
    if (isNfseActionLoading(actionKey)) return;
    const metadata = toNfseMetadata(record.metadata_json);
    const reviewRequested = Boolean(metadata.reviewRequested);
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await atualizarNfse(record.id, {
        metadata: {
          reviewRequested: !reviewRequested,
          reviewRequestedAt: !reviewRequested ? new Date().toISOString() : null
        }
      });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess(!reviewRequested ? 'NFSe marcada para revisão.' : 'Marcação de revisão removida.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao atualizar NFSe.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleCancelNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:cancel`;
    if (isNfseActionLoading(actionKey)) return;
    if (!window.confirm('Deseja solicitar o cancelamento desta nota fiscal?')) return;

    const reason = window.prompt('Motivo do cancelamento (opcional):', '') || '';
    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await cancelarNfse(record.id, {
        ...(reason.trim() ? { reason: reason.trim() } : {})
      });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess('Solicitação de cancelamento processada.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao cancelar nota fiscal.');
    } finally {
      finishNfseAction(actionKey);
    }
  };

  const handleArchiveNfse = async (record: NfseRecord) => {
    const actionKey = `${record.id}:archive`;
    if (isNfseActionLoading(actionKey)) return;
    const isArchived = Boolean(record.archived_at);
    if (!window.confirm(isArchived ? 'Deseja desarquivar esta NFSe?' : 'Deseja arquivar esta NFSe?')) return;

    startNfseAction(actionKey);
    setNfseError(null);
    setNfseSuccess(null);
    try {
      const updated = await arquivarNfse(record.id, { archived: !isArchived });
      setNfseList((current) => current.map((item) => (item.id === record.id ? updated : item)));
      setNfseSuccess(!isArchived ? 'Nota fiscal arquivada com sucesso.' : 'Nota fiscal desarquivada com sucesso.');
    } catch (error) {
      setNfseError(error instanceof Error ? error.message : 'Erro ao atualizar arquivamento da nota fiscal.');
    } finally {
      finishNfseAction(actionKey);
    }
  };


  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, index) => currentYear - index);
  }, []);

  const availableMonths = useMemo(() => (
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  ), []);

  const nfsePeriodOptions = useMemo(() => {
    const uniquePeriods = Array.from(new Set(
      nfseList
        .map((item) => toNfsePeriodKey(item.created_at))
        .filter(Boolean)
    ));
    return uniquePeriods.sort().reverse();
  }, [nfseList]);

  const filteredNfseList = useMemo(() => {
    return nfseList.filter((item) => {
      if (
        nfseDocumentTypeFilter !== 'all'
        && String(item.document_type || '').toUpperCase() !== nfseDocumentTypeFilter
      ) {
        return false;
      }
      if (nfseStatusFilter !== 'all' && getNfseStatusKey(item.status) !== nfseStatusFilter) {
        return false;
      }
      if (nfsePeriodFilter !== 'all' && toNfsePeriodKey(item.created_at) !== nfsePeriodFilter) {
        return false;
      }
      return true;
    });
  }, [nfseDocumentTypeFilter, nfseList, nfsePeriodFilter, nfseStatusFilter]);

  const dasPendentesCount = useMemo(
    () => meiPeriods.filter((period) => period.status !== 'pago').length,
    [meiPeriods]
  );

  const certificateScopeLabel = useMemo(() => {
    if (hasUserCertificate) return 'Certificado';
    if (hasServerCertificate) return 'Certificado do servidor';
    return 'Sem certificado ativo';
  }, [hasServerCertificate, hasUserCertificate]);

  const workspaceTabs = useMemo(() => {
    const tabs: Array<{
      id: GuidesMeiWorkspace;
      label: string;
      description: string;
      badge: string;
    }> = [
      {
        id: 'overview',
        label: 'Visão geral',
        description: 'Resumo e atalhos rápidos',
        badge: `${meiPeriods.length} períodos DAS`
      },
      {
        id: 'das',
        label: 'Certificado e DAS',
        description: 'Configuração e geração de guias',
        badge: dasPendentesCount > 0 ? `${dasPendentesCount} pendências` : 'Sem pendências'
      }
    ];

    if (canViewNfse) {
      tabs.push({
        id: 'nfse',
        label: 'Notas fiscais',
        description: 'Emissão e acompanhamento',
        badge: `${filteredNfseList.length} notas no filtro`
      });
    }

    return tabs;
  }, [canViewNfse, dasPendentesCount, filteredNfseList.length, meiPeriods.length]);

  const handleDownloadClick = async () => {
    if (isDownloadingGuide) return;
    if (!normalizedContribuinte) {
      setPeriodError('Informe o CNPJ do MEI para baixar a guia.');
      return;
    }
    if (normalizedContribuinte.length !== 14) {
      setPeriodError('CNPJ do MEI deve ter 14 dígitos.');
      return;
    }
    setPeriodError(null);
    const competencia = formatCompetencia(selectedMonth, selectedYear);
    const periodoApuracao = toPeriodoApuracao(selectedMonth, selectedYear);
    setIsDownloadingGuide(true);
    try {
      await handleDownload(periodoApuracao, competencia);
    } catch (error) {
      setPeriodError(error instanceof Error ? error.message : 'Erro ao baixar guia.');
    } finally {
      setIsDownloadingGuide(false);
    }
  };

  const isNfeLikeDocument = notaDocumentType === 'NFE' || notaDocumentType === 'NFCE';
  const notaDocumentTypeLabel = notaDocumentType === 'NFE'
    ? 'NF-e'
    : notaDocumentType === 'NFCE'
      ? 'NFC-e'
      : 'NFSe';
  const activeNfeLikeForm = isNfeLikeDocument ? getNfeLikeFormByType(notaDocumentType) : null;

  return (
    <>
      <div className="admin-page-shell">
        <section className="admin-hero">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="admin-hero-title">Meu MEI</h1>
              <p className="admin-hero-subtitle">
                {canViewNfse
                  ? 'Gerencie certificado, DAS e emissão de notas fiscais no mesmo fluxo.'
                  : 'Gerencie certificado e DAS no mesmo fluxo.'}
              </p>
            </div>
            <span
              className={
                hasUserCertificate
                  ? 'admin-badge-success'
                  : hasServerCertificate
                    ? 'admin-badge-primary'
                    : 'admin-badge-warning'
              }
            >
              {certificateScopeLabel}
            </span>
          </div>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-label">Períodos DAS</p>
              <p className="admin-stat-value">{meiPeriods.length}</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-label">Pendências DAS</p>
              <p className="admin-stat-value">{dasPendentesCount}</p>
            </div>
            {canViewNfse ? (
              <div className="admin-stat-card">
                <p className="admin-stat-label">Notas exibidas</p>
                <p className="admin-stat-value">{filteredNfseList.length}</p>
              </div>
            ) : null}
            <div className="admin-stat-card">
              <p className="admin-stat-label">Status do certificado</p>
              <p className="admin-stat-value text-base md:text-lg">{certificateScopeLabel}</p>
            </div>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Fluxo do MEI</h2>
              <p className="admin-section-subtitle">
                Navegue por contexto para reduzir rolagem e focar no que precisa agora.
              </p>
            </div>
          </div>
          <div className="admin-toolbar space-y-3">
            <div className={`grid gap-2 ${canViewNfse ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {workspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWorkspace(tab.id)}
                  className={`planner-tab h-full w-full items-start justify-between rounded-xl px-4 py-3 text-left ${
                    activeWorkspace === tab.id ? 'planner-tab-active' : ''
                  }`}
                  aria-pressed={activeWorkspace === tab.id}
                >
                  <span className="flex flex-col items-start gap-1">
                    <span className="text-sm font-semibold">{tab.label}</span>
                    <span className="text-xs opacity-90">{tab.description}</span>
                  </span>
                  <span className="text-xs font-medium opacity-90">{tab.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {activeWorkspace === 'overview' ? (
          <section className="admin-section-card">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Visão geral operacional</h2>
                <p className="admin-section-subtitle">
                  Escolha uma etapa para continuar com menos ruído visual.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveWorkspace('das')}
                className="admin-toolbar text-left transition hover:border-slate-300/80 dark:hover:border-slate-700/80"
              >
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Certificado e DAS</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Configure certificado, valide CNPJ e gere o DAS do período.
                </p>
                <div className="mt-3 admin-actions">
                  <span className={hasUserCertificate ? 'admin-badge-success' : 'admin-badge-warning'}>
                    {hasUserCertificate ? 'Certificado em uso' : 'Certificado pendente'}
                  </span>
                  <span className={dasPendentesCount > 0 ? 'admin-badge-warning' : 'admin-badge-success'}>
                    {dasPendentesCount > 0 ? `${dasPendentesCount} pendências DAS` : 'DAS sem pendências'}
                  </span>
                </div>
              </button>

              {canViewNfse ? (
                <button
                  type="button"
                  onClick={() => setActiveWorkspace('nfse')}
                  className="admin-toolbar text-left transition hover:border-slate-300/80 dark:hover:border-slate-700/80"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notas fiscais</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Preencha dados essenciais e acompanhe o ciclo das notas emitidas.
                  </p>
                  <div className="mt-3 admin-actions">
                    <span className="admin-badge-primary">{`${filteredNfseList.length} notas no filtro`}</span>
                    <span className="admin-badge-neutral">Emissão com PlugNotas</span>
                  </div>
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeWorkspace === 'das' ? (
          <>
            <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Certificado digital</h2>
            </div>
          </div>

          {hasUserCertificate && (
            <div className="admin-alert-success">
              Certificado em uso. Ele expira após algumas horas ou ao reiniciar o servidor.
            </div>
          )}

          {!hasCertificate && (
            <div className="admin-alert-warning">
              Opcional: envie o certificado para autenticar. Sem certificado, informe o CNPJ e
              selecione o período abaixo para gerar o DAS.
            </div>
          )}

          {canViewNfse ? (
            <div className="admin-alert-warning">
              Atenção: para emissão de notas fiscais, a empresa emitente precisa estar cadastrada com certificado digital A1 válido.
            </div>
          ) : null}

          {certificateError && (
            <div className="admin-alert-danger">
              {certificateError}
            </div>
          )}

          {certificateSuccess && (
            <div className="admin-alert-success">
              {certificateSuccess}
            </div>
          )}

          {validationSuccess && (
            <div className="admin-alert-success">
              {validationSuccess}
            </div>
          )}

          {validationError && (
            <div className="admin-alert-danger">
              {validationError}
            </div>
          )}

          <div className="admin-toolbar grid gap-3 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">CNPJ do MEI</label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={contribuinteDoc}
                onChange={(event) => setContribuinteDoc(formatDocument(event.target.value))}
                onBlur={handleValidateBlur}
                placeholder="00.000.000/0001-00"
              />
              {isValidating ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Validando CNPJ...</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="grid gap-2 md:grid-cols-[1fr_220px]">
                <input
                  className="planner-input-compact"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={(event) => setCertificateFile(event.target.files?.[0] || null)}
                />
                <input
                  className="planner-input-compact"
                  type="password"
                  value={certificatePassword}
                  onChange={(event) => setCertificatePassword(event.target.value)}
                  placeholder="Senha do certificado"
                />
              </div>

              {canViewNfse ? (
                <div className="rounded-xl border border-slate-300/80 bg-white/70 p-3 dark:border-slate-700/80 dark:bg-slate-950/30">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Dados mínimos para emissão de notas fiscais
                  </p>
                  <p className="admin-field-hint mb-2">Campos com * são obrigatórios para a configuração inicial.</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.razaoSocial}
                      onChange={(event) => updatePlugNotasCompanyForm({ razaoSocial: event.target.value })}
                      placeholder="Razão social *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.nomeFantasia}
                      onChange={(event) => updatePlugNotasCompanyForm({ nomeFantasia: event.target.value })}
                      placeholder="Nome fantasia (opcional)"
                    />
                    <input
                      className="planner-input-compact"
                      type="email"
                      value={plugNotasCompanyForm.email}
                      onChange={(event) => updatePlugNotasCompanyForm({ email: event.target.value })}
                      placeholder="Email fiscal (opcional)"
                    />
                    <select
                      className="planner-input-compact"
                      value={plugNotasCompanyForm.regimeTributario}
                      onChange={(event) => updatePlugNotasCompanyForm({
                        regimeTributario: event.target.value as PlugNotasRegimeTributario
                      })}
                    >
                      <option value="1">Regime tributário: Simples Nacional (1)</option>
                      <option value="2">Regime tributário: Simples excesso sublimite (2)</option>
                      <option value="3">Regime tributário: Regime normal (3)</option>
                    </select>
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.inscricaoMunicipal}
                      onChange={(event) => updatePlugNotasCompanyForm({ inscricaoMunicipal: event.target.value })}
                      placeholder="Inscrição municipal (opcional)"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.inscricaoEstadual}
                      onChange={(event) => updatePlugNotasCompanyForm({ inscricaoEstadual: event.target.value })}
                      placeholder="Inscrição estadual (opcional)"
                    />
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-4">
                    <input
                      className="planner-input-compact"
                      type="text"
                      inputMode="numeric"
                      value={plugNotasCompanyForm.cep}
                      onChange={(event) => updatePlugNotasCompanyForm({ cep: event.target.value })}
                      placeholder="CEP *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.tipoLogradouro}
                      onChange={(event) => updatePlugNotasCompanyForm({ tipoLogradouro: event.target.value })}
                      placeholder="Tipo logradouro"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.logradouro}
                      onChange={(event) => updatePlugNotasCompanyForm({ logradouro: event.target.value })}
                      placeholder="Logradouro *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.numero}
                      onChange={(event) => updatePlugNotasCompanyForm({ numero: event.target.value })}
                      placeholder="Número *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.complemento}
                      onChange={(event) => updatePlugNotasCompanyForm({ complemento: event.target.value })}
                      placeholder="Complemento (opcional)"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.bairro}
                      onChange={(event) => updatePlugNotasCompanyForm({ bairro: event.target.value })}
                      placeholder="Bairro *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.codigoCidade}
                      onChange={(event) => updatePlugNotasCompanyForm({ codigoCidade: event.target.value })}
                      placeholder="Código IBGE cidade *"
                    />
                    <input
                      className="planner-input-compact"
                      type="text"
                      value={plugNotasCompanyForm.descricaoCidade}
                      onChange={(event) => updatePlugNotasCompanyForm({ descricaoCidade: event.target.value })}
                      placeholder="Cidade *"
                    />
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-[120px_auto]">
                    <input
                      className="planner-input-compact"
                      type="text"
                      maxLength={2}
                      value={plugNotasCompanyForm.estado}
                      onChange={(event) => updatePlugNotasCompanyForm({ estado: event.target.value.toUpperCase() })}
                      placeholder="UF *"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={plugNotasCompanyForm.simplesNacional}
                        onChange={(event) => updatePlugNotasCompanyForm({ simplesNacional: event.target.checked })}
                      />
                      Empresa optante pelo Simples Nacional
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="admin-actions">
                <button
                  className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleCertificateUpload}
                  disabled={isUploadingCert || !certificateFile || !certificatePassword}
                >
                  {isUploadingCert ? (canViewNfse ? 'Enviando e configurando...' : 'Enviando...') : 'Enviar certificado'}
                </button>
                {hasUserCertificate && (
                  <button
                    className="planner-button-secondary-compact w-full sm:w-auto"
                    onClick={handleCertificateRemove}
                    disabled={isRemovingCert}
                  >
                    {isRemovingCert ? 'Removendo...' : 'Remover certificado'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Período da guia</h2>
              <p className="admin-section-subtitle">Selecione mês e ano para gerar o DAS.</p>
            </div>
          </div>

          {periodError && (
            <div className="admin-alert-danger">
              {periodError}
            </div>
          )}

          <div className="admin-toolbar">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[170px_170px_auto] md:items-end">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Mês</label>
                <select
                  className="planner-input-compact"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Ano</label>
                <select
                  className="planner-input-compact"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="planner-button w-full sm:w-auto md:justify-self-start disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDownloadClick}
                disabled={isDownloadingGuide || !normalizedContribuinte || normalizedContribuinte.length !== 14}
              >
                {isDownloadingGuide ? 'Baixando...' : 'Baixar guia'}
              </button>
            </div>
          </div>
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Histórico do DAS</h2>
              <p className="admin-section-subtitle">Últimos períodos consultados e situação do pagamento.</p>
            </div>
            <button
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void loadMeiPeriods()}
              disabled={!canLoadPeriods || meiPeriodsLoading}
            >
              {meiPeriodsLoading ? 'Atualizando...' : 'Atualizar histórico'}
            </button>
          </div>

          {!hasUserCertificate && canLoadPeriods ? (
            <div className="admin-alert-warning">
              Consulta via CNPJ sem certificado. Se houver falha, envie o certificado.
            </div>
          ) : null}

          {!canLoadPeriods ? (
            <div className="admin-empty-state">Informe o CNPJ do MEI para consultar meses pagos.</div>
          ) : meiPeriodsLoading ? (
            <div className="admin-empty-state">Carregando histórico...</div>
          ) : meiPeriodsError ? (
            <div className="admin-alert-danger">
              {meiPeriodsError}
            </div>
          ) : meiPeriods.length === 0 ? (
            <div className="admin-empty-state">Nenhum período encontrado.</div>
          ) : (
            <div className="space-y-2">
              {meiPeriods.map((period) => (
                <div
                  key={`${period.competencia || 'period'}-${period.guideId || period.status}`}
                  className="admin-toolbar flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-slate-700 dark:text-gray-200">
                      {formatDasCompetenciaLabel(period.competencia)}
                    </div>
                    {period.status === 'erro' ? (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                        {period.errorMessage || 'Falha ao consultar o período no Serpro.'}
                      </p>
                    ) : null}
                  </div>
                  <span className={getDasStatusClasses(period.status)}>
                    {getDasStatusLabel(period.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
          </>
        ) : null}

        {canViewNfse && activeWorkspace === 'nfse' ? (
          <>
            <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">{`Emitir ${notaDocumentTypeLabel}`}</h2>
              <p className="admin-section-subtitle">
                Preencha os dados fiscais para emissão via PlugNotas.
              </p>
            </div>
          </div>

          <div className="admin-alert-warning">
            Atenção: para emissão de notas fiscais, a empresa emitente precisa estar cadastrada com certificado digital A1 válido.
          </div>
          <p className="admin-field-hint">
            {notaDocumentType === 'NFSE'
              ? 'Campos obrigatórios: CNPJ e endereço mínimo do prestador, CPF/CNPJ e razão social do tomador, código do serviço, CNAE, alíquota, valor e discriminação.'
              : 'Campos obrigatórios: emitente, destinatário, item com NCM/CFOP, quantidade, valor unitário e tributação mínima (ICMS/PIS/COFINS).'}
          </p>

          <div className="admin-toolbar space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Tipo de documento
                </label>
                <select
                  className="planner-input-compact w-full"
                  value={notaDocumentType}
                  onChange={(event) => setNotaDocumentType(event.target.value as NotaDocumentType)}
                >
                  <option value="NFSE">NFSe</option>
                  <option value="NFE">NF-e</option>
                  <option value="NFCE">NFC-e</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Cliente salvo (atalho)
                </label>
                <select
                  className="planner-input-compact w-full"
                  value={selectedCatalogClienteId}
                  onChange={(event) => handleSelectCatalogCliente(event.target.value)}
                >
                  <option value="">Selecionar cliente...</option>
                  {nfseCatalogClientes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {buildClienteCatalogLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  {notaDocumentType === 'NFSE' ? 'Serviço salvo (atalho)' : 'Item salvo (atalho)'}
                </label>
                <select
                  className="planner-input-compact w-full"
                  value={selectedCatalogProdutoId}
                  onChange={(event) => handleSelectCatalogProduto(event.target.value)}
                >
                  <option value="">{notaDocumentType === 'NFSE' ? 'Selecionar serviço...' : 'Selecionar item...'}</option>
                  {nfseCatalogProdutos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {buildProdutoCatalogLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {nfseCatalogLoading ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atualizando catálogo fiscal...
              </p>
            ) : null}
          </div>

          {nfseCatalogError && (
            <div className="admin-alert-danger">
              {nfseCatalogError}
            </div>
          )}

          {notaDocumentType === 'NFSE' ? (
            <>
          <div className="admin-toolbar grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                CNPJ do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.prestadorCpfCnpj}
                onChange={(event) =>
                  updateNfseForm({
                    prestadorCpfCnpj: formatDocument(event.target.value)
                  })
                }
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Inscrição municipal (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorInscricaoMunicipal}
                onChange={(event) => updateNfseForm({ prestadorInscricaoMunicipal: event.target.value })}
                placeholder="Inscrição municipal"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Razão social do prestador (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorRazaoSocial}
                onChange={(event) => updateNfseForm({ prestadorRazaoSocial: event.target.value })}
                placeholder="Razão social"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Email do prestador (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="email"
                value={nfseForm.prestadorEmail}
                onChange={(event) => updateNfseForm({ prestadorEmail: event.target.value })}
                placeholder="email@prestador.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Logradouro do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorEndereco?.logradouro || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ logradouro: event.target.value })}
                placeholder="Rua / Avenida"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Número do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorEndereco?.numero || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ numero: event.target.value })}
                placeholder="123"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Código IBGE da cidade do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.prestadorEndereco?.codigoCidade || ''}
                onChange={(event) => updateNfsePrestadorEndereco({ codigoCidade: event.target.value })}
                placeholder="3304557"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                CEP do prestador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.prestadorEndereco?.cep || ''}
                onChange={(event) => updateNfsePrestadorEndereco({
                  cep: normalizeDoc(event.target.value).slice(0, 8)
                })}
                placeholder="20040002"
              />
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dica: se você já configurou a empresa na PlugNotas, os dados salvos serão usados como fallback no envio.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                CPF/CNPJ do tomador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={nfseForm.tomadorCpfCnpj}
                onChange={(event) =>
                  updateNfseForm({
                    tomadorCpfCnpj: formatDocument(event.target.value)
                  })
                }
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Razão social do tomador
                <span className="admin-required-mark">*</span>
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.tomadorRazaoSocial}
                onChange={(event) => updateNfseForm({ tomadorRazaoSocial: event.target.value })}
                placeholder="Razão social"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Email do tomador (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="email"
                value={nfseForm.tomadorEmail}
                onChange={(event) => updateNfseForm({ tomadorEmail: event.target.value })}
                placeholder="email@tomador.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                ID de integração (opcional)
              </label>
              <input
                className="planner-input-compact w-full"
                type="text"
                value={nfseForm.idIntegracao}
                onChange={(event) => updateNfseForm({ idIntegracao: event.target.value })}
                placeholder="NFSE-123"
              />
            </div>
          </div>

          <div className="admin-toolbar space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Serviço</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Código do serviço
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  className="planner-input-compact w-full"
                  type="text"
                  value={nfseForm.servico.codigo}
                  onChange={(event) => updateNfseServico({ codigo: event.target.value })}
                  placeholder="1.02"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  CNAE
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  className="planner-input-compact w-full"
                  type="text"
                  value={nfseForm.servico.cnae}
                  onChange={(event) => updateNfseServico({ cnae: event.target.value })}
                  placeholder="6201500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Alíquota ISS (%)
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  className="planner-input-compact w-full"
                  type="text"
                  inputMode="decimal"
                  value={nfseForm.servico.aliquota}
                  onChange={(event) => updateNfseServico({ aliquota: event.target.value })}
                  placeholder="3"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Valor do serviço
                  <span className="admin-required-mark">*</span>
                </label>
                <input
                  className="planner-input-compact w-full"
                  type="text"
                  inputMode="decimal"
                  value={nfseForm.servico.valorServico}
                  onChange={(event) => updateNfseServico({ valorServico: event.target.value })}
                  placeholder="1500,00"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                Discriminação do serviço
                <span className="admin-required-mark">*</span>
              </label>
              <textarea
                className="planner-input-compact w-full min-h-[90px]"
                value={nfseForm.servico.discriminacao}
                onChange={(event) => updateNfseServico({ discriminacao: event.target.value })}
                placeholder="Descreva o serviço prestado"
              />
            </div>
          </div>

          <div className="admin-toolbar space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-200">
              Cidade de prestação (opcional)
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="planner-input-compact"
                type="text"
                value={nfseForm.cidadePrestacao?.codigo || ''}
                onChange={(event) => updateNfseCidade({ codigo: event.target.value })}
                placeholder="Código IBGE"
              />
              <input
                className="planner-input-compact"
                type="text"
                value={nfseForm.cidadePrestacao?.descricao || ''}
                onChange={(event) => updateNfseCidade({ descricao: event.target.value })}
                placeholder="Cidade"
              />
              <input
                className="planner-input-compact"
                type="text"
                value={nfseForm.cidadePrestacao?.estado || ''}
                onChange={(event) => updateNfseCidade({ estado: event.target.value })}
                placeholder="UF"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input
                id="nfse-enviar-email"
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(nfseForm.enviarEmail)}
                onChange={(event) => updateNfseForm({ enviarEmail: event.target.checked })}
              />
              Enviar email ao tomador (se configurado)
            </label>
          </div>
            </>
          ) : (
            <div className="admin-toolbar space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    CNPJ do emitente
                    <span className="admin-required-mark">*</span>
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    inputMode="numeric"
                    value={activeNfeLikeForm?.emitenteCpfCnpj || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      emitenteCpfCnpj: formatDocument(event.target.value)
                    })}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Razão social do emitente
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    value={activeNfeLikeForm?.emitenteRazaoSocial || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      emitenteRazaoSocial: event.target.value
                    })}
                    placeholder="Razão social"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Inscrição estadual do emitente
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    value={activeNfeLikeForm?.emitenteInscricaoEstadual || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      emitenteInscricaoEstadual: event.target.value
                    })}
                    placeholder="Inscrição estadual"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    CPF/CNPJ do destinatário
                    <span className="admin-required-mark">*</span>
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    inputMode="numeric"
                    value={activeNfeLikeForm?.destinatarioCpfCnpj || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      destinatarioCpfCnpj: formatDocument(event.target.value)
                    })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Razão social do destinatário
                    <span className="admin-required-mark">*</span>
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    value={activeNfeLikeForm?.destinatarioRazaoSocial || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      destinatarioRazaoSocial: event.target.value
                    })}
                    placeholder="Razão social"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Email do destinatário
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="email"
                    value={activeNfeLikeForm?.destinatarioEmail || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      destinatarioEmail: event.target.value
                    })}
                    placeholder="email@destinatario.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Natureza da operação
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    value={activeNfeLikeForm?.natureza || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      natureza: event.target.value
                    })}
                    placeholder="VENDA"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    ID de integração
                  </label>
                  <input
                    className="planner-input-compact w-full"
                    type="text"
                    value={activeNfeLikeForm?.idIntegracao || ''}
                    onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                      idIntegracao: event.target.value
                    })}
                    placeholder={`${notaDocumentType}-20260316-0001`}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                  Informações complementares
                </label>
                <textarea
                  className="planner-input-compact w-full min-h-[90px]"
                  value={activeNfeLikeForm?.informacoesComplementares || ''}
                  onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                    informacoesComplementares: event.target.value
                  })}
                  placeholder="Informações complementares fiscais"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  id="nfe-like-enviar-email"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={Boolean(activeNfeLikeForm?.enviarEmail)}
                  onChange={(event) => updateNfeLikeFormByType(notaDocumentType, {
                    enviarEmail: event.target.checked
                  })}
                />
                Enviar email ao destinatário (se configurado)
              </label>

              <div className="admin-toolbar space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-200">Itens e tributação</h3>
                  <button
                    type="button"
                    className="planner-button-secondary-compact"
                    onClick={() => addNfeLikeItemByType(notaDocumentType)}
                  >
                    Adicionar item
                  </button>
                </div>
                {(activeNfeLikeForm?.itens || []).map((item, itemIndex) => (
                  <div key={`${notaDocumentType}-item-${itemIndex}`} className="rounded-xl border border-slate-200/70 p-3 dark:border-slate-700/70">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {`Item ${itemIndex + 1}`}
                      </p>
                      <button
                        type="button"
                        className="planner-button-secondary-compact"
                        onClick={() => removeNfeLikeItemByType(notaDocumentType, itemIndex)}
                      >
                        Remover item
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.codigo}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          codigo: event.target.value
                        })}
                        placeholder="Código *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.ncm}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          ncm: normalizeDoc(event.target.value).slice(0, 8)
                        })}
                        placeholder="NCM (8 dígitos) *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.cfop}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          cfop: normalizeDoc(event.target.value).slice(0, 4)
                        })}
                        placeholder="CFOP *"
                      />
                      <input
                        className="planner-input-compact md:col-span-3"
                        type="text"
                        value={item.descricao}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          descricao: event.target.value
                        })}
                        placeholder="Descrição *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.unidade}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          unidade: event.target.value
                        })}
                        placeholder="Unidade *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.quantidade}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          quantidade: event.target.value
                        })}
                        placeholder="Quantidade *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.valorUnitario}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          valorUnitario: event.target.value
                        })}
                        placeholder="Valor unitário *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.desconto}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          desconto: event.target.value
                        })}
                        placeholder="Desconto (opcional)"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.cest}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          cest: event.target.value
                        })}
                        placeholder="CEST (opcional)"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.sku}
                        onChange={(event) => updateNfeLikeItemByType(notaDocumentType, itemIndex, {
                          sku: event.target.value
                        })}
                        placeholder="SKU (opcional)"
                      />
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.tributos.icms.cst}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'icms', {
                          cst: event.target.value
                        })}
                        placeholder="ICMS CST"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.tributos.icms.csosn}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'icms', {
                          csosn: event.target.value
                        })}
                        placeholder="ICMS CSOSN"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.tributos.icms.aliquota}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'icms', {
                          aliquota: event.target.value
                        })}
                        placeholder="ICMS alíquota (%)"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.tributos.icms.valor}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'icms', {
                          valor: event.target.value
                        })}
                        placeholder="ICMS valor"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.tributos.pis.cst}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'pis', {
                          cst: event.target.value
                        })}
                        placeholder="PIS CST *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.tributos.pis.aliquota}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'pis', {
                          aliquota: event.target.value
                        })}
                        placeholder="PIS alíquota (%)"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.tributos.cofins.cst}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'cofins', {
                          cst: event.target.value
                        })}
                        placeholder="COFINS CST *"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.tributos.cofins.aliquota}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'cofins', {
                          aliquota: event.target.value
                        })}
                        placeholder="COFINS alíquota (%)"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        value={item.tributos.ipi.cst}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'ipi', {
                          cst: event.target.value
                        })}
                        placeholder="IPI CST (opcional)"
                      />
                      <input
                        className="planner-input-compact"
                        type="text"
                        inputMode="decimal"
                        value={item.tributos.ipi.aliquota}
                        onChange={(event) => updateNfeLikeItemTributosByType(notaDocumentType, itemIndex, 'ipi', {
                          aliquota: event.target.value
                        })}
                        placeholder="IPI alíquota (%)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="admin-actions">
            <button
              className="planner-button w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleEmitNfse}
              disabled={nfseSubmitting || Boolean(notaValidationMessage)}
            >
              {nfseSubmitting ? 'Enviando...' : `Emitir ${notaDocumentTypeLabel}`}
            </button>
          </div>

          {notaValidationMessage && (
            <div className="admin-alert-warning">{notaValidationMessage}</div>
          )}

          {nfseError && (
            <div className="admin-alert-danger">
              {nfseError}
            </div>
          )}
          {nfseSuccess && (
            <div className="admin-alert-success">
              {nfseSuccess}
            </div>
          )}
        </section>

        <section className="admin-section-card">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">Notas emitidas</h2>
              <p className="admin-section-subtitle">
                Acompanhe status, revise e baixe XML/PDF das notas emitidas.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={nfseShowArchived}
                  onChange={(event) => setNfseShowArchived(event.target.checked)}
                />
                Mostrar arquivadas
              </label>
              <button
                className="planner-button-secondary-compact w-full sm:w-auto"
                onClick={() => void loadNfseList()}
                disabled={nfseLoading}
              >
                {nfseLoading ? 'Atualizando...' : 'Atualizar lista'}
              </button>
            </div>
          </div>

          <div className="admin-toolbar grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <select
              className="planner-input-compact"
              value={nfseDocumentTypeFilter}
              onChange={(event) => setNfseDocumentTypeFilter(event.target.value as 'all' | DocumentType)}
            >
              <option value="all">Todos os tipos</option>
              <option value="NFSE">NFSe</option>
              <option value="NFE">NF-e</option>
              <option value="NFCE">NFC-e</option>
            </select>
            <select
              className="planner-input-compact"
              value={nfseStatusFilter}
              onChange={(event) => setNfseStatusFilter(event.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="processando">Processando</option>
              <option value="concluido">Concluída</option>
              <option value="rejeitado">Rejeitada</option>
              <option value="interrompido">Interrompida</option>
              <option value="cancelamento_pendente">Cancelamento pendente</option>
              <option value="cancelado">Cancelada</option>
            </select>
            <select
              className="planner-input-compact"
              value={nfsePeriodFilter}
              onChange={(event) => setNfsePeriodFilter(event.target.value)}
            >
              <option value="all">Todos os períodos</option>
              {nfsePeriodOptions.map((period) => (
                <option key={period} value={period}>
                  {period.split('-').reverse().join('/')}
                </option>
              ))}
            </select>
          </div>

          {nfseLoading ? (
            <div className="admin-empty-state">Carregando notas...</div>
          ) : filteredNfseList.length === 0 ? (
            <div className="admin-empty-state">Nenhuma nota fiscal encontrada para o filtro atual.</div>
          ) : (
            <div className="space-y-3">
              {filteredNfseList.map((item) => {
                const statusKey = getNfseStatusKey(item.status);
                const rowBusy = isNfseRowBusy(item.id);
                const metadata = toNfseMetadata(item.metadata_json);
                const reviewRequested = Boolean(metadata.reviewRequested);
                const isArchived = Boolean(item.archived_at);
                return (
                  <div key={item.id} className="admin-user-card">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                          {item.id_integracao || item.plugnotas_id || item.id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          Emitida em {formatDateTime(item.created_at)}
                          {item.document_type ? ` • Tipo ${item.document_type}` : ''}
                          {item.protocol ? ` • Protocolo ${item.protocol}` : ''}
                        </p>
                      </div>
                      <div className="admin-actions">
                        <span className={getNfseStatusBadgeClass(item.status)}>
                          {formatNfseStatus(item.status)}
                        </span>
                        {isArchived && <span className="admin-badge-neutral">Arquivada</span>}
                        {reviewRequested && <span className="admin-badge-warning">Revisão</span>}
                      </div>
                    </div>
                    <div className="admin-actions-grid">
                      <button
                        className="planner-button-secondary-compact w-full"
                        onClick={() => handleSyncNfse(item.id)}
                        disabled={rowBusy}
                      >
                        {isNfseActionLoading(`${item.id}:sync`) ? 'Atualizando...' : 'Atualizar status'}
                      </button>
                      <button
                        className="planner-button-secondary-compact w-full"
                        onClick={() => handleDownloadNfsePdf(item)}
                        disabled={rowBusy || statusKey === 'processando'}
                      >
                        {isNfseActionLoading(`${item.id}:pdf`) ? 'Baixando PDF...' : 'Baixar PDF'}
                      </button>
                      <button
                        className="planner-button-secondary-compact w-full"
                        onClick={() => handleDownloadNfseXml(item)}
                        disabled={rowBusy || statusKey === 'processando'}
                      >
                        {isNfseActionLoading(`${item.id}:xml`) ? 'Baixando XML...' : 'Baixar XML'}
                      </button>
                      <button
                        className="planner-button-secondary-compact w-full"
                        onClick={() => handleToggleReviewNfse(item)}
                        disabled={rowBusy || isArchived}
                      >
                        {isNfseActionLoading(`${item.id}:update`)
                          ? 'Salvando...'
                          : reviewRequested
                            ? 'Remover revisão'
                            : 'Marcar revisão'}
                      </button>
                      <button
                        className="planner-button-secondary-compact w-full"
                        onClick={() => handleCancelNfse(item)}
                        disabled={rowBusy || statusKey === 'cancelado' || statusKey === 'cancelamento_pendente'}
                      >
                        {isNfseActionLoading(`${item.id}:cancel`) ? 'Cancelando...' : 'Cancelar nota'}
                      </button>
                      <button
                        className="planner-button-secondary-compact w-full"
                        onClick={() => handleArchiveNfse(item)}
                        disabled={rowBusy}
                      >
                        {isNfseActionLoading(`${item.id}:archive`)
                          ? 'Salvando...'
                          : isArchived
                            ? 'Desarquivar'
                            : 'Arquivar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
          </>
        ) : null}
      </div>
    </>
  );
}
