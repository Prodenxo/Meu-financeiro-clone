/**
 * Contrato BFF `mei-prestador-prefill` (Épico 2) — paridade com mobile / docs em financas-pessoais-mobile.
 */

export interface NfsePrestadorEnderecoPrefill {
  logradouro: string | null;
  numero: string | null;
  codigoCidade: string | null;
  cep: string | null;
  complemento: string | null;
  bairro: string | null;
  estado: string | null;
  descricaoCidade: string | null;
}

export interface NfsePrestadorPrefillDto {
  prestadorCpfCnpj: string | null;
  prestadorRazaoSocial: string | null;
  prestadorEmail: string | null;
  prestadorInscricaoMunicipal: string | null;
  prestadorEndereco: NfsePrestadorEnderecoPrefill | null;
  sourceRowId?: string | null;
}
