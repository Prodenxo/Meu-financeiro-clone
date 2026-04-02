import { Link } from 'react-router-dom';
import { Package, Users } from 'lucide-react';

const DEFAULT_HINT = 'Cadastre ou edite itens para os atalhos acima.';

/** FR-NFSE-GCAT-03 — curto e distinto do cabeçalho dinâmico (FR-NFSE-UX-07). */
const EMPTY_CATALOG_HINT = 'Ainda sem itens guardados.';

const NAV_BUTTON_CLASS =
  'planner-button-secondary inline-flex min-h-[44px] w-full flex-1 items-center justify-center gap-2 whitespace-normal text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/50 sm:min-h-0';

export type MeiNfseCatalogManageActionsProps = {
  /** Se true, usa `Link`; caso contrário `<a href>`. */
  inRouter: boolean;
  /** Texto didático acima dos botões (zona atalhos). Omitido quando `showHint` é false. */
  hintText?: string;
  idHint?: string;
  showHint?: boolean;
  clienteLabel?: string;
  /** Rótulo visível do botão serviços/produtos (pode ser curto). */
  produtoLabel?: string;
  /** Nome acessível completo quando `produtoLabel` é curto; opcional para hero com texto longo. */
  produtoAriaLabel?: string;
  className?: string;
  /**
   * Catálogo já carregado e sem linhas (clientes e produtos vazios).
   * O pai deve passar `false` durante `nfseCatalogLoading` para evitar *flash* da linha extra.
   */
  catalogEmpty?: boolean;
  idCatalogEmptyHint?: string;
};

/**
 * Ações para navegar ao catálogo NFS-e (clientes e serviços/produtos), com hint opcional.
 * FR-NFSE-GCAT — reutilizado no hero Mei Infinito e na secção "Antes de emitir".
 */
export function MeiNfseCatalogManageActions({
  inRouter,
  hintText = DEFAULT_HINT,
  idHint = 'mei-nfse-catalog-actions-hint',
  showHint = true,
  clienteLabel = 'Gerir clientes',
  produtoLabel = 'Serviços e produtos',
  produtoAriaLabel,
  className = '',
  catalogEmpty = false,
  idCatalogEmptyHint = 'mei-nfse-catalog-empty-hint'
}: MeiNfseCatalogManageActionsProps) {
  const produtoAccessible =
    produtoAriaLabel !== undefined
      ? produtoAriaLabel
      : produtoLabel === 'Serviços e produtos'
        ? 'Gerir serviços e produtos'
        : undefined;

  /** Liga os parágrafos didáticos aos botões (incl. linha FR-NFSE-GCAT-03 quando `catalogEmpty`). */
  const hintsDescribedBy =
    showHint && catalogEmpty
      ? `${idHint} ${idCatalogEmptyHint}`
      : showHint
        ? idHint
        : undefined;

  const buttons = inRouter ? (
    <>
      <Link
        to="/mei-catalogo/clientes"
        className={NAV_BUTTON_CLASS}
        aria-describedby={hintsDescribedBy}
      >
        <Users className="h-4 w-4 shrink-0" aria-hidden />
        {clienteLabel}
      </Link>
      <Link
        to="/mei-catalogo/servicos-produtos"
        className={NAV_BUTTON_CLASS}
        aria-label={produtoAccessible}
        aria-describedby={hintsDescribedBy}
      >
        <Package className="h-4 w-4 shrink-0" aria-hidden />
        {produtoLabel}
      </Link>
    </>
  ) : (
    <>
      <a href="/mei-catalogo/clientes" className={NAV_BUTTON_CLASS} aria-describedby={hintsDescribedBy}>
        <Users className="h-4 w-4 shrink-0" aria-hidden />
        {clienteLabel}
      </a>
      <a
        href="/mei-catalogo/servicos-produtos"
        className={NAV_BUTTON_CLASS}
        aria-label={produtoAccessible}
        aria-describedby={hintsDescribedBy}
      >
        <Package className="h-4 w-4 shrink-0" aria-hidden />
        {produtoLabel}
      </a>
    </>
  );

  return (
    <div className={className}>
      {showHint ? (
        <div className="mb-2 space-y-1">
          <p id={idHint} className="text-xs text-slate-500 dark:text-slate-400">
            {hintText}
          </p>
          {catalogEmpty ? (
            <p id={idCatalogEmptyHint} className="text-xs text-slate-500 dark:text-slate-400">
              {EMPTY_CATALOG_HINT}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">{buttons}</div>
    </div>
  );
}
