/**
 * FR-GUIA-FISC-14 D2 — fluxo guiado para activar NF-e / NFC-e no cadastro Plugnotas.
 * Defeito: desligado até decisão PO/ops (`VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED=true`).
 */
export function isMeiFiscalD2ModalidadesEnabled(): boolean {
  return import.meta.env.VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED === 'true';
}

/**
 * FR-GUIA-FISC-16 D3 — mostrar segmentos NF-e / NFC-e no seletor de emissão (Guia MEI / admin).
 * Ligado só com a string exacta `true` em build-time (`VITE_MEI_NFE_NFCE_EMIT_ENABLED`). `1` ou outros valores = só NFS-e.
 */
export function isMeiNfeNfceEmitEnabled(): boolean {
  return import.meta.env.VITE_MEI_NFE_NFCE_EMIT_ENABLED === 'true';
}
