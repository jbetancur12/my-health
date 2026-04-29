import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, FileText } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

export function PDFViewer({ fileUrl, fileName, onClose }: PDFViewerProps) {
  const [scale, setScale] = useState(1);
  const isPDF = fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('pdf');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
          <div className="flex items-center gap-2">
            {!isPDF && (
              <>
                <button onClick={() => setScale((current) => Math.max(current - 0.2, 0.5))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 min-w-16 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale((current) => Math.min(current + 0.2, 3))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}

            <a href={fileUrl} download={fileName} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div className="flex justify-center">
            {isPDF ? (
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl text-center space-y-4">
                <FileText className="w-16 h-16 mx-auto text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Documento PDF</h3>
                <p className="text-gray-600">Para ver este PDF, descárgalo usando el botón de arriba.</p>
                <a href={fileUrl} download={fileName} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="w-5 h-5" />
                  Descargar PDF
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="max-w-full max-h-[calc(90vh-120px)] object-contain"
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
