import { normalizeIbgeMunicipioCodigo } from './ibgeMunicipioCodigo'

export interface CatalogoClienteEnderecoForm {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  codigoCidade: string
  descricaoCidade: string
  estado: string
}

const normalizeDoc = (value: string) => value.replace(/\D/g, '')

export function emptyCatalogoClienteEndereco(): CatalogoClienteEnderecoForm {
  return {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    codigoCidade: '',
    descricaoCidade: '',
    estado: '',
  }
}

export function formatCepPtBrInput(digits: string): string {
  const cep = normalizeDoc(digits).slice(0, 8)
  if (cep.length <= 5) return cep
  return `${cep.slice(0, 5)}-${cep.slice(5)}`
}

function readEnderecoFromMetadata(meta: Record<string, unknown>): CatalogoClienteEnderecoForm {
  const endereco = meta.endereco
  if (!endereco || typeof endereco !== 'object' || Array.isArray(endereco)) {
    return emptyCatalogoClienteEndereco()
  }
  const e = endereco as Record<string, unknown>
  return {
    cep: formatCepPtBrInput(String(e.cep ?? '')),
    logradouro: String(e.logradouro ?? '').trim(),
    numero: String(e.numero ?? '').trim(),
    complemento: String(e.complemento ?? '').trim(),
    bairro: String(e.bairro ?? '').trim(),
    codigoCidade: normalizeIbgeMunicipioCodigo(e.codigoCidade),
    descricaoCidade: String(e.descricaoCidade ?? '').trim(),
    estado: String(e.estado ?? '').trim().toUpperCase().slice(0, 2),
  }
}

export function catalogoClienteEnderecoFromMetadata(
  metadata: unknown,
): CatalogoClienteEnderecoForm {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return emptyCatalogoClienteEndereco()
  }
  return readEnderecoFromMetadata(metadata as Record<string, unknown>)
}

export function mergeCatalogoEnderecoFromCepLookup(
  current: CatalogoClienteEnderecoForm,
  lookup: Partial<CatalogoClienteEnderecoForm> | null | undefined,
): CatalogoClienteEnderecoForm {
  if (!lookup) return current
  return {
    cep: lookup.cep ? formatCepPtBrInput(lookup.cep) : current.cep,
    logradouro: lookup.logradouro?.trim() ? lookup.logradouro.trim() : current.logradouro,
    numero: current.numero,
    complemento: lookup.complemento?.trim() ? lookup.complemento.trim() : current.complemento,
    bairro: lookup.bairro?.trim() ? lookup.bairro.trim() : current.bairro,
    codigoCidade: lookup.codigoCidade
      ? normalizeIbgeMunicipioCodigo(lookup.codigoCidade)
      : current.codigoCidade,
    descricaoCidade: lookup.descricaoCidade?.trim()
      ? lookup.descricaoCidade.trim()
      : current.descricaoCidade,
    estado: lookup.estado?.trim()
      ? lookup.estado.trim().toUpperCase().slice(0, 2)
      : current.estado,
  }
}

export function buildCatalogoClienteMetadataJson(
  endereco: CatalogoClienteEnderecoForm,
): Record<string, unknown> | null {
  const cep = normalizeDoc(endereco.cep).slice(0, 8)
  const codigoCidade = normalizeIbgeMunicipioCodigo(endereco.codigoCidade).slice(0, 7)
  const logradouro = endereco.logradouro.trim()
  const numero = endereco.numero.trim()
  const bairro = endereco.bairro.trim()
  const descricaoCidade = endereco.descricaoCidade.trim()
  const estado = endereco.estado.trim().toUpperCase().slice(0, 2)
  const complemento = endereco.complemento.trim()

  if (
    cep.length !== 8
    && !logradouro
    && !bairro
    && codigoCidade.length !== 7
    && !descricaoCidade
    && estado.length !== 2
  ) {
    return null
  }

  return {
    endereco: {
      ...(cep.length === 8 ? { cep } : {}),
      ...(logradouro ? { logradouro } : {}),
      ...(numero ? { numero } : (logradouro ? { numero: 'S/N' } : {})),
      ...(bairro ? { bairro } : {}),
      ...(codigoCidade.length === 7 ? { codigoCidade } : {}),
      ...(descricaoCidade ? { descricaoCidade } : {}),
      ...(estado.length === 2 ? { estado } : {}),
      ...(complemento ? { complemento } : {}),
    },
  }
}

export function validateCatalogoClienteEndereco(
  endereco: CatalogoClienteEnderecoForm,
  options: { obrigatorio?: boolean } = {},
): string | null {
  const obrigatorio = options.obrigatorio !== false
  if (!obrigatorio) return null

  const cep = normalizeDoc(endereco.cep)
  if (cep.length !== 8) {
    return 'Informe o CEP com 8 dígitos.'
  }
  if (!endereco.logradouro.trim()) {
    return 'Informe o logradouro (preencha o CEP para buscar automaticamente).'
  }
  if (!endereco.bairro.trim()) {
    return 'Informe o bairro (preencha o CEP para buscar automaticamente).'
  }
  const ibge = normalizeIbgeMunicipioCodigo(endereco.codigoCidade)
  if (ibge.length !== 7) {
    return 'Código IBGE da cidade incompleto — informe o CEP para preencher automaticamente.'
  }
  if (!endereco.descricaoCidade.trim()) {
    return 'Informe a cidade (preencha o CEP para buscar automaticamente).'
  }
  const uf = endereco.estado.trim().toUpperCase()
  if (uf.length !== 2) {
    return 'Informe a UF com 2 letras.'
  }
  return null
}
