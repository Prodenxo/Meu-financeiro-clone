/**
 * Copy canónica UX §5.2 (FR-NAT-ERR-01) — única fonte para painel âmbar (GuidesMei) e dicas fiscais
 * (`NfseNacionalOperacaoDocHint`), conforme QA CONCERNS de manutenção.
 */

export function PlugnotasMunicipalRequirementOperacaoBody() {
  return (
    <>
      O emissor pediu dados de <strong className="font-semibold">cadastro municipal</strong> (inscrição municipal ou
      prefeitura). Para o fluxo de <strong className="font-semibold">NFS-e Nacional</strong> isso costuma indicar que a
      conta ou o ambiente ainda espera outro tipo de configuração. Confirme no{' '}
      <strong className="font-semibold">painel Plugnotas</strong> se &quot;NFS-e Nacional&quot; está ativo para este CNPJ
      e se a API do servidor usa o mesmo ambiente (produção ou homologação). Se estiver tudo certo, fale com o{' '}
      <strong className="font-semibold">suporte Plugnotas</strong>.
    </>
  );
}
