/**
 * FR-CAD-DOC-10 — faixa informativa (tom info) quando NF-e/NFC-e estão activos e a emissão multi-tipo não está na UI.
 */
export type MeiCadastroNfeNfceInfoBannerProps = {
  docHref: string;
};

export function MeiCadastroNfeNfceInfoBanner({ docHref }: MeiCadastroNfeNfceInfoBannerProps) {
  return (
    <div
      className="admin-alert-info space-y-2"
      role="status"
      data-testid="mei-cadastro-nfe-nfce-info-banner"
    >
      <p>
        Você ativou NF-e ou NFC-e no emissor. A emissão dessas notas nesta aplicação pode exigir passos adicionais (por
        exemplo dados de produto, CSC ou configuração na SEFAZ). Consulte o guia fiscal ou o seu contador.
      </p>
      <p>
        <a
          className="text-sm font-medium text-blue-800 underline decoration-blue-800/70 underline-offset-2 hover:text-blue-900 dark:text-blue-100 dark:decoration-blue-200/80 dark:hover:text-white"
          href={docHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir guia de operação fiscal (MEI)
        </a>
      </p>
    </div>
  );
}
