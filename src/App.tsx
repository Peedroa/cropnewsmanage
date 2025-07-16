import { useState, useEffect } from 'react';
import { FileService } from './services/fileService';
import { PdfService } from './services/pdfService';
import { ThreeColumnLayout } from './components/ThreeColumnLayout';
import { InitialScreen } from './components/InitialScreen';
import type { NewsSource, NewsClip } from './types';
import './App.css';

function App() {
  const [fileService] = useState(() => new FileService());
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [selectedClip, setSelectedClip] = useState<NewsClip | null>(null);
  const [selectedSource, setSelectedSource] = useState<NewsSource | null>(null);

  const [combinedPdfUrl, setCombinedPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'clips' | 'fullpages'>('clips');

  const handleSourceSelect = (source: NewsSource) => {
    setSelectedSource(source);
    setSelectedClip(null);

    setCombinedPdfUrl(null);
  };

  const handleSelectDirectory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Iniciando seleção de diretório...');
      
      const directory = await fileService.selectRootDirectory();
      if (!directory) {
        setError('Nenhum diretório selecionado');
        console.log('Nenhum diretório foi selecionado');
        return;
      }

      console.log('Diretório selecionado com sucesso');
      const subdirectories = await fileService.getSubdirectories();
      console.log('Subdiretórios encontrados:', subdirectories);
      
      // Carrega os clips para todas as fontes automaticamente
      const sourcesWithClips = await Promise.all(
        subdirectories.map(async (source) => {
          try {
            const clips = await fileService.loadJsonFiles(source);
            return { ...source, clips };
          } catch (error) {
            console.error(`Erro ao carregar clips de ${source.name}:`, error);
            return source;
          }
        })
      );
      
      setSources(sourcesWithClips);
      console.log('Estado atualizado com', sourcesWithClips.length, 'fontes e clips carregados');
      
    } catch (err) {
      setError('Erro ao selecionar diretório');
      console.error('Erro na seleção de diretório:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleViewModeToggle = async () => {
    if (!selectedClip || !selectedSource) return;
    
    const newViewMode = viewMode === 'clips' ? 'fullpages' : 'clips';
    setViewMode(newViewMode);
    
    // Recarrega os PDFs com o novo modo
    try {
      setLoading(true);
      setError(null);
      
      // Limpa o PDF combinado anterior
      if (combinedPdfUrl) {
        PdfService.revokeObjectUrl(combinedPdfUrl);
        setCombinedPdfUrl(null);
      }
      
      const urls = await fileService.getPdfFiles(selectedSource, selectedClip, newViewMode);
      
      // Combina os PDFs se houver mais de um
      if (urls.length > 1) {
        console.log('Combinando PDFs...');
        const combinedUrl = await PdfService.combinePdfs(urls);
        setCombinedPdfUrl(combinedUrl);
      } else if (urls.length === 1) {
        setCombinedPdfUrl(urls[0]);
      }
    } catch (err) {
      setError('Erro ao carregar PDFs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  // Limpa a memória quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (combinedPdfUrl) {
        PdfService.revokeObjectUrl(combinedPdfUrl);
      }
    };
  }, [combinedPdfUrl]);

  const handleClipSelect = async (source: NewsSource, clip: NewsClip) => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpa o PDF combinado anterior
      if (combinedPdfUrl) {
        PdfService.revokeObjectUrl(combinedPdfUrl);
        setCombinedPdfUrl(null);
      }
      
      const urls = await fileService.getPdfFiles(source, clip, viewMode);
      setSelectedClip(clip);
      setSelectedSource(source);
      
      // Combina os PDFs se houver mais de um
      if (urls.length > 1) {
        console.log('Combinando PDFs...');
        const combinedUrl = await PdfService.combinePdfs(urls);
        setCombinedPdfUrl(combinedUrl);
      } else if (urls.length === 1) {
        setCombinedPdfUrl(urls[0]);
      }
    } catch (err) {
      setError('Erro ao carregar PDFs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {sources.length === 0 ? (
        // Tela inicial quando nenhuma pasta está selecionada
        <>
          <InitialScreen 
            onSelectDirectory={handleSelectDirectory}
            loading={loading}
          />
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Fechar</button>
            </div>
          )}
        </>
      ) : (
        // Interface principal quando pasta está selecionada
        <>
          <header className="app-header">
            <h1></h1>
            <button 
              onClick={handleSelectDirectory}
              disabled={loading}
              className="select-directory-btn"
            >
              {loading ? 'Carregando...' : 'Trocar Pasta'}
            </button>
          </header>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Fechar</button>
            </div>
          )}

          <main className="app-main">
            <ThreeColumnLayout
              sources={sources}
              selectedSource={selectedSource}
              selectedClip={selectedClip}

              combinedPdfUrl={combinedPdfUrl}
              viewMode={viewMode}
              loading={loading}
              onSourceSelect={handleSourceSelect}
              onClipSelect={handleClipSelect}

              onViewModeToggle={handleViewModeToggle}
            />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
