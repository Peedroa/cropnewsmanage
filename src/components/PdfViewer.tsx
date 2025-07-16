import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js para usar o worker local
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

interface PdfViewerProps {
  pdfUrl: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export function PdfViewer({ pdfUrl, onLoad, onError }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        setTotalPages(pdf.numPages);
        
        if (currentPage <= pdf.numPages) {
          const page = await pdf.getPage(currentPage);
          const canvas = canvasRef.current;
          if (!canvas) return;

          const viewport = page.getViewport({ scale: 1.5 });
          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
        }

        setLoading(false);
        onLoad?.();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar PDF';
        setError(errorMessage);
        setLoading(false);
        onError?.(errorMessage);
      }
    };

    loadPdf();
  }, [pdfUrl, currentPage, onLoad, onError]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (error) {
    return (
      <div className="pdf-error">
        <p>Erro ao carregar PDF: {error}</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      {loading && (
        <div className="pdf-loading">
          <p>Carregando PDF...</p>
        </div>
      )}
      
      <div className="pdf-controls">
        <button 
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Anterior
        </button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <button 
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Próxima
        </button>
      </div>

      <div className="pdf-canvas-container">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
} 