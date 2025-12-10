import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getPageImageUrl } from '../services/api';

interface DrawingPreviewProps {
  sessionId: string;
  pageCount: number;
  selectedPage: number;
  onPageChange: (page: number) => void;
}

export function DrawingPreview({
  sessionId,
  pageCount,
  selectedPage,
  onPageChange
}: DrawingPreviewProps) {
  const [zoom, setZoom] = useState(1);

  const imageUrl = getPageImageUrl(sessionId, selectedPage);

  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.25, z - 0.25));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, selectedPage - 1))}
            disabled={selectedPage <= 1}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            Page {selectedPage} of {pageCount}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pageCount, selectedPage + 1))}
            disabled={selectedPage >= pageCount}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
            title="Zoom out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-sm w-14 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
            title="Zoom in"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-gray-200 ml-1"
            title="Reset zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="inline-block min-w-full min-h-full flex items-start justify-center">
          <img
            src={imageUrl}
            alt={`Page ${selectedPage}`}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              maxWidth: zoom === 1 ? '100%' : 'none'
            }}
            className="shadow-lg bg-white"
          />
        </div>
      </div>

      {/* Page thumbnails for multi-page PDFs */}
      {pageCount > 1 && (
        <div className="flex gap-2 p-2 bg-gray-100 border-t overflow-x-auto">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex-shrink-0 w-12 h-12 rounded border-2 text-xs font-medium
                ${selectedPage === page
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
