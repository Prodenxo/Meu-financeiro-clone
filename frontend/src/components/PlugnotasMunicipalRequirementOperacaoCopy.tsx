/**
 * Copy canónica UX §5.2 (FR-NAT-ERR-01) — única fonte para painel âmbar (GuidesMei) e dicas fiscais
 * (`NfseNacionalOperacaoDocHint`), conforme QA CONCERNS de manutenção.
 *
 * **FR-PREF-UX-01 (PREF-L1):** `PlugnotasPrefeituraConfigNfseOperacaoBlock` — spec
 * `ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md` §5.1.
 *
 * **FR-PLOGIN / PLOGIN-UX-L1:** `PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle` — spec
 * `ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` secção 5.2.
 */

export function PlugnotasMunicipalRequirementOperacaoBody() {
  return (
    <>
      O emissor pediu dados de <strong className="font-semibold">cadastro municipal</strong> (inscrição municipal ou
      prefeitura). Para o fluxo de <strong className="font-semibold">NFS-e Nacional</strong> isso costuma indicar que a
      conta ou o ambiente ainda espera outro tipo de configuração. Confirme no{' '}
      <strong className="font-semibold">painel do emissor</strong> se &quot;NFS-e Nacional&quot; está ativo para este CNPJ
      e se a API do servidor usa o mesmo ambiente (produção ou homologação). Se estiver tudo certo, fale com o{' '}
      <strong className="font-semibold">suporte do emissor</strong>.
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
      deveria exigir esse passo — confira no <strong className="font-semibold">painel do emissor</strong> se
      &quot;NFS-e Nacional&quot; está ativo para este CNPJ e se o ambiente (produção ou homologação) é o mesmo. Se estiver
      tudo certo, fale com o <strong className="font-semibold">suporte do emissor</strong> ou siga o guia de operação
      abaixo.
    </>
  );
}

/** Título acessível — variante `prefeitura-login-required` (PLOGIN-UX-L1). */
export function PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle() {
  return (
    <>
      Este município exige acesso ao portal da prefeitura, e esse cenário não é suportado neste fluxo
    </>
  );
}

/** Corpo PLOGIN-UX-L1 — distinção IBGE / trilho B e NFR-PLOGIN-02 (sem pedir credenciais em canais públicos). */
export function PlugnotasPrefeituraLoginRequiredNfseOperacaoBody() {
  return (
    <>
      Isto <strong className="font-semibold">não</strong> é erro de rota nem falta só de código IBGE. O emissor exigiu{' '}
      <strong className="font-semibold">credencial do portal municipal</strong>, mas a Guia MEI não recolhe nem envia esse
      tipo de acesso. O próximo passo é seguir a triagem operacional no guia, no suporte ou no painel do emissor, sem
      tentar preencher login ou senha aqui.
    </>
  );
}
