/**
 * FR-CAD-DOC-09 — estrutura UI para requisitos adicionais NF-e/NFC-e (campos futuros no backend).
 */
export function MeiCadastroRequisitosNfeNfcePlaceholder() {
  return (
    <details className="mb-3 planner-card-muted p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-800 outline-none marker:text-slate-500 dark:text-slate-100 dark:marker:text-slate-400">
        Dados adicionais no emissor (NF-e / NFC-e)
      </summary>
      <div className="mt-2 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-slate-600 dark:border-slate-600/80 dark:text-slate-300">
        <p>
          Para NF-e e NFC-e, o painel do emissor fiscal pode exigir dados que ainda não estão neste formulário (por exemplo
          CSC, token SEFAZ ou cadastro de produtos). Complete ou valide no{' '}
          <a
            href="/guia-mei-nfse-nacional.html"
            className="font-medium text-slate-800 underline decoration-slate-400 hover:decoration-slate-600 dark:text-slate-100 dark:decoration-slate-500"
          >
            painel web do emissor
          </a>{' '}
          conforme a sua operação.
        </p>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Quando o backend passar a expor campos obrigatórios para estes tipos, eles aparecerão aqui sem alterar o fluxo
          de NFS-e.
        </p>
      </div>
    </details>
  );
}
