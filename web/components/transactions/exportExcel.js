import { XLSX_COLUMN_WIDTHS, formatTransactionsForXlsx } from '@/lib/finance/transactions';

/** Gera `transacoes_AAAA-MM-DD.xlsx` no navegador (mesmo layout do app Expo). */
export async function exportTransactionsToExcel(transactions, todayKey) {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(formatTransactionsForXlsx(transactions));
  worksheet['!cols'] = XLSX_COLUMN_WIDTHS;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
  XLSX.writeFile(workbook, `transacoes_${todayKey}.xlsx`);
}
