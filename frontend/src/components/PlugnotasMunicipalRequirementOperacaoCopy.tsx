/**
 * Copy canónica UX §5.2 (FR-NAT-ERR-01) — única fonte para painel âmbar (GuidesMei) e dicas fiscais
 * (`NfseNacionalOperacaoDocHint`), conforme QA CONCERNS de manutenção.
 *
 * **FR-PREF-UX-01 (PREF-L1):** `PlugnotasPrefeituraConfigNfseOperacaoBlock` — spec
 * `ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md` §5.1.
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

/** Título acessível (região) para variante `prefeitura-config`. */
export function PlugnotasPrefeituraConfigNfseOperacaoTitle() {
  return <>O emissor pediu dados de configuração da prefeitura no NFS-e</>;
}

/**
 * Corpo FR-PREF-UX-01 — distingue IM opcional do formulário de `nfse.config.prefeitura` no payload.
 */
export function PlugnotasPrefeituraConfigNfseOperacaoBody() {
  return (
    <>
      Isto é diferente da <strong className="font-semibold">inscrição municipal opcional</strong> que você pode ter
      preenchido acima. Em muitos casos, o cadastro em modo <strong className="font-semibold">NFS-e Nacional</strong> não
      deveria exigir esse passo — confira no <strong className="font-semibold">painel Plugnotas</strong> se
      &quot;NFS-e Nacional&quot; está ativo para este CNPJ e se o ambiente (produção ou homologação) é o mesmo. Se estiver
      tudo certo, fale com o <strong className="font-semibold">suporte Plugnotas</strong> ou siga o guia de operação
      abaixo.
    </>
  );
}
