import Papa from 'papaparse';

// Format timestamp for display
export const formatTimestamp = (ts: string, locale: string = 'ja-JP'): string => {
  return new Date(ts).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Export to CSV (Client-side only)
export const exportToCsv = (data: any[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to Excel (using simple CSV format for MVP)
export const exportToExcel = (data: any[], filename: string): void => {
  // For MVP, we'll use CSV format that Excel can open
  const csvFilename = filename.replace('.xlsx', '.csv');
  exportToCsv(data, csvFilename);
};

// Add random variation to data
export const addVariation = (value: number, maxVariation: number = 0.05): number => {
  const variation = (Math.random() - 0.5) * 2 * maxVariation;
  return value * (1 + variation);
};

// Get delayed timestamp
export const getDelayedTimestamp = (): string => {
  const delayMin = 30;
  const delayMax = 60;
  const delay = delayMin + Math.random() * (delayMax - delayMin);
  
  const now = new Date();
  now.setMinutes(now.getMinutes() - delay);
  
  return now.toISOString();
};