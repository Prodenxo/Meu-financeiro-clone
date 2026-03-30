import React from 'react';
import type { NfseCatalogProduto } from '../services/meiNotasService';
import {
  MEI_CATALOGO_DELETE_PRODUTO_BODY_PARAGRAPHS,
  MEI_CATALOGO_DELETE_PRODUTO_CANCEL_BUTTON,
  MEI_CATALOGO_DELETE_PRODUTO_CONFIRM_BUTTON,
  MEI_CATALOGO_DELETE_PRODUTO_TITLE,
  buildMeiCatalogoDeleteProdutoSummaryLine
} from '../copy/meiCatalogoProdutoDelete';
import MeiCatalogoDeleteCatalogConfirmDialog from './MeiCatalogoDeleteCatalogConfirmDialog';

export interface MeiCatalogoDeleteProdutoConfirmDialogProps {
  open: boolean;
  produto: NfseCatalogProduto | null;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function MeiCatalogoDeleteProdutoConfirmDialog({
  open,
  produto,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm
}: MeiCatalogoDeleteProdutoConfirmDialogProps) {
  if (!open || !produto) return null;

  const summary = buildMeiCatalogoDeleteProdutoSummaryLine(produto.discriminacao, produto.codigo);

  return (
    <MeiCatalogoDeleteCatalogConfirmDialog
      open
      title={MEI_CATALOGO_DELETE_PRODUTO_TITLE}
      bodyParagraphs={MEI_CATALOGO_DELETE_PRODUTO_BODY_PARAGRAPHS}
      summaryLine={summary}
      confirmButtonLabel={MEI_CATALOGO_DELETE_PRODUTO_CONFIRM_BUTTON}
      cancelButtonLabel={MEI_CATALOGO_DELETE_PRODUTO_CANCEL_BUTTON}
      dataTestId="mei-delete-produto-confirm"
      titleDomId="mei-del-prod-title"
      descDomId="mei-del-prod-desc"
      isDeleting={isDeleting}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
