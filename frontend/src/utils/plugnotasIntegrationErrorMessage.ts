/** Quando o Plugnotas devolve "rota não existe", o problema costuma ser base URL ou token em ambiente errado. */
export function formatPlugnotasIntegrationError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('não há cadastro desta empresa no plugnotas') || lower.includes('nao ha cadastro desta empresa no plugnotas')) {
    return message;
  }
  if (
    (lower.includes('não localizamos') || lower.includes('nao localizamos'))
    && (lower.includes('empresa') || lower.includes('parâmetros') || lower.includes('parametros'))
  ) {
    return (
      'O emissor fiscal não encontrou cadastro desta empresa para o seu token. '
      + 'Cadastre primeiro enviando o certificado (.pfx) e os dados na guia; depois use "Atualizar cadastro (sem novo certificado)" se precisar. '
      + 'Verifique também se o ambiente (sandbox/produção) e o token coincidem com a conta onde o CNPJ está registrado. '
      + `[Detalhe do emissor: ${message}]`
    );
  }
  if (
    lower.includes('rota')
    && (lower.includes('não existe') || lower.includes('nao existe'))
    && (lower.includes('serviço') || lower.includes('servico'))
  ) {
    return (
      'O provedor de emissão fiscal recusou a chamada (URL base ou ambiente incorreto). '
      + 'Confira no servidor se PLUGNOTAS_API_BASE_URL e PLUGNOTAS_API_KEY são do mesmo ambiente (sandbox ou produção). '
      + message
    );
  }
  return message;
}
