import React from 'react';
import type { NfseCatalogCliente } from '../services/meiNotasService';
import { formatDocumentoListaPtBr } from '../lib/formatCpfCnpjPtBr';
import {
  MEI_CATALOGO_DELETE_CLIENTE_BODY_PARAGRAPHS,
  MEI_CATALOGO_DELETE_CLIENTE_CANCEL_BUTTON,
  MEI_CATALOGO_DELETE_CLIENTE_CONFIRM_BUTTON,
  MEI_CATALOGO_DELETE_CLIENTE_TITLE,
  buildMeiCatalogoDeleteClienteSummaryLine
} from '../copy/meiCatalogoClienteDelete';
import MeiCatalogoDeleteCatalogConfirmDialog from './MeiCatalogoDeleteCatalogConfirmDialog';

export interface MeiCatalogoDeleteClienteConfirmDialogProps {
  open: boolean;
  cliente: NfseCatalogCliente | null;
  isDeleting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  overlayZIndexClass?: string;
}

export default function MeiCatalogoDeleteClienteConfirmDialog({
  open,
  cliente,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
  overlayZIndexClass
}: MeiCatalogoDeleteClienteConfirmDialogProps) {
  if (!open || !cliente) return null;

  const nome = (cliente.nome || 'Cliente').trim();
  const docDisplay = formatDocumentoListaPtBr(cliente.documento);
  const summary = buildMeiCatalogoDeleteClienteSummaryLine(nome, docDisplay);

  return (
    <MeiCatalogoDeleteCatalogConfirmDialog
      open
      title={MEI_CATALOGO_DELETE_CLIENTE_TITLE}
      bodyParagraphs={MEI_CATALOGO_DELETE_CLIENTE_BODY_PARAGRAPHS}
      summaryLine={summary}
      confirmButtonLabel={MEI_CATALOGO_DELETE_CLIENTE_CONFIRM_BUTTON}
      cancelButtonLabel={MEI_CATALOGO_DELETE_CLIENTE_CANCEL_BUTTON}
      dataTestId="mei-delete-cliente-confirm"
      titleDomId="mei-del-cli-title"
      descDomId="mei-del-cli-desc"
      isDeleting={isDeleting}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
      overlayZIndexClass={overlayZIndexClass}
    />
  );
}
