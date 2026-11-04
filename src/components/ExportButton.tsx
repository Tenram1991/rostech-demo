import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: string[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, filename, columns }) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    
    const headers = columns || Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h] ?? '';
          return typeof value === 'string' && value.includes(';') ? `"${value}"` : value;
        }).join(';')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
        title="Экспорт в CSV (Excel)"
      >
        <FileSpreadsheet size={14} />
        <span>CSV</span>
      </button>
      <button
        onClick={exportToJSON}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
        title="Экспорт в JSON"
      >
        <FileText size={14} />
        <span>JSON</span>
      </button>
    </div>
  );
};