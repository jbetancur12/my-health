import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

function isPdfFile(fileUrl: string, fileName: string) {
  return fileName.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().endsWith('.pdf');
}

export function PDFViewer({ fileUrl, fileName, onClose }: PDFViewerProps) {
  const [scale, setScale] = useState(1);
  const isPDF = isPdfFile(fileUrl, fileName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="truncate text-lg font-semibold text-gray-900">{fileName}</h2>
          <div className="flex items-center gap-2">
            {!isPDF && (
              <>
                <button
                  onClick={() => setScale((current) => Math.max(current - 0.2, 0.5))}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <span className="min-w-16 text-center text-sm text-gray-600">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale((current) => Math.min(current + 0.2, 3))}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </>
            )}

            <a
              href={fileUrl}
              download={fileName}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <Download className="h-5 w-5" />
            </a>
            <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex h-full justify-center">
            {isPDF ? (
              <iframe
                src={fileUrl}
                title={fileName}
                className="h-full w-full rounded-lg border border-gray-200 bg-white shadow-lg"
              />
            ) : (
              <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-h-[calc(90vh-120px)] max-w-full object-contain"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
