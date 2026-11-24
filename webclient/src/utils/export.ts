/**
 * Shared utility functions for exporting datasets to CSV, Excel, and downloading Blobs/Files.
 */

export const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const generateCsvContent = (
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string => {
  const headerRow = headers.map(escapeCsvCell).join(',');
  const dataRows = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  return '\uFEFF' + headerRow + '\n' + dataRows;
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void => {
  const csvContent = generateCsvContent(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStamp = new Date().toISOString().split('T')[0];
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}_export_${dateStamp}.csv`;
  downloadBlob(blob, finalFilename);
};

export const getDateRangeBounds = (
  range: string
): { startDate?: string; endDate?: string } => {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().substring(0, 10);

  if (range === 'today' || range === '1_day') {
    const todayStr = formatDate(today);
    return { startDate: todayStr, endDate: todayStr };
  }
  if (range === '7days' || range === '7_days') {
    const past = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { startDate: formatDate(past), endDate: formatDate(today) };
  }
  if (range === '30days' || range === '1_month' || range === 'month') {
    const past = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: formatDate(past), endDate: formatDate(today) };
  }
  return {};
};

export default {
  escapeCsvCell,
  generateCsvContent,
  downloadBlob,
  downloadCsv,
  getDateRangeBounds,
};

