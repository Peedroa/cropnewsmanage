import { useState } from 'react';

interface SimplePdfViewerProps {
  pdfUrl: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export function SimplePdfViewer({ pdfUrl, onLoad, onError }: SimplePdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    const errorMessage = 'Erro ao carregar PDF';
    setError(errorMessage);
    onError?.(errorMessage);
  };

  if (error) {
    return (
      <div className="pdf-error">
        <p>Erro ao carregar PDF: {error}</p>
        <button onClick={() => window.open(pdfUrl, '_blank')}>
          Abrir PDF em nova aba
        </button>
      </div>
    );
  }

  return (
    <div className="simple-pdf-viewer">
      {loading && (
        <div className="pdf-loading">
          <p>Carregando PDF...</p>
        </div>
      )}
      
      <iframe
        src={pdfUrl}
        width="100%"
        height="600px"
        onLoad={handleLoad}
        onError={handleError}
        style={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}
      />
    </div>
  );
} 