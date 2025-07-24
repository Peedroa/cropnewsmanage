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

  const [clipsPdfUrl, setClipsPdfUrl] = useState<string | null>(null);
  const [fullPagesPdfUrl, setFullPagesPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSourceSelect = (source: NewsSource) => {
    setSelectedSource(source);
    setSelectedClip(null);

    // Limpa os PDFs anteriores
    if (clipsPdfUrl) {
      PdfService.revokeObjectUrl(clipsPdfUrl);
      setClipsPdfUrl(null);
    }
    if (fullPagesPdfUrl) {
      PdfService.revokeObjectUrl(fullPagesPdfUrl);
      setFullPagesPdfUrl(null);
    }
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

  // Limpa a memória quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (clipsPdfUrl) {
        PdfService.revokeObjectUrl(clipsPdfUrl);
      }
      if (fullPagesPdfUrl) {
        PdfService.revokeObjectUrl(fullPagesPdfUrl);
      }
    };
  }, [clipsPdfUrl, fullPagesPdfUrl]);

  const handleClipSelect = async (source: NewsSource, clip: NewsClip) => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpa os PDFs anteriores
      if (clipsPdfUrl) {
        PdfService.revokeObjectUrl(clipsPdfUrl);
        setClipsPdfUrl(null);
      }
      if (fullPagesPdfUrl) {
        PdfService.revokeObjectUrl(fullPagesPdfUrl);
        setFullPagesPdfUrl(null);
      }
      
      setSelectedClip(clip);
      setSelectedSource(source);
      
      // Carrega os PDFs de recortes e páginas inteiras em paralelo
      const [clipsUrls, fullPagesUrls] = await Promise.all([
        fileService.getPdfFiles(source, clip, 'clips'),
        fileService.getPdfFiles(source, clip, 'fullpages')
      ]);
      
      // Combina os PDFs de recortes se houver mais de um
      if (clipsUrls.length > 1) {
        console.log('Combinando PDFs de recortes...');
        const combinedClipsUrl = await PdfService.combinePdfs(clipsUrls);
        setClipsPdfUrl(combinedClipsUrl);
      } else if (clipsUrls.length === 1) {
        setClipsPdfUrl(clipsUrls[0]);
      }
      
      // Combina os PDFs de páginas inteiras se houver mais de um
      if (fullPagesUrls.length > 1) {
        console.log('Combinando PDFs de páginas inteiras...');
        const combinedFullPagesUrl = await PdfService.combinePdfs(fullPagesUrls);
        setFullPagesPdfUrl(combinedFullPagesUrl);
      } else if (fullPagesUrls.length === 1) {
        setFullPagesPdfUrl(fullPagesUrls[0]);
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
              clipsPdfUrl={clipsPdfUrl}
              fullPagesPdfUrl={fullPagesPdfUrl}
              onSourceSelect={handleSourceSelect}
              onClipSelect={handleClipSelect}
            />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
