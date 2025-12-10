import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import type { MaterialItem } from '../types';

interface ExportButtonProps {
  materials: MaterialItem[];
  onExportExcel: () => Promise<void>;
  onExportCsv: () => Promise<void>;
}

export function ExportButton({ materials, onExportExcel, onExportCsv }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (exportFn: () => Promise<void>) => {
    setExporting(true);
    setIsOpen(false);
    try {
      await exportFn();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const disabled = materials.length === 0 || exporting;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors
          ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
          }`}
      >
        <Download className={`h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
        {exporting ? 'Exporting...' : 'Export'}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <button
              onClick={() => handleExport(onExportExcel)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg"
            >
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Excel (.xlsx)</div>
                <div className="text-xs text-gray-500">With formatting & subtotals</div>
              </div>
            </button>
            <button
              onClick={() => handleExport(onExportCsv)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg border-t"
            >
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">CSV (.csv)</div>
                <div className="text-xs text-gray-500">Plain text format</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
