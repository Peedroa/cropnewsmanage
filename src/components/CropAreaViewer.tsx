import { useState, useRef, useEffect } from 'react';
import type { ClipData, CropArea } from '../types';

interface CropAreaViewerProps {
  onBack: () => void;
}

export function CropAreaViewer({ onBack }: CropAreaViewerProps) {
  const [clipsData, setClipsData] = useState<Record<string, ClipData>>({});
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Array<{ page: string; url: string }>>([]);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [zoom, setZoom] = useState(1); // 1 = 100%

  const handleSelectFolder = async () => {
    try {
      setLoading(true);
      setError(null);

      // @ts-ignore - API do File System Access
      const handle = await window.showDirectoryPicker();
      setDirectoryHandle(handle);

      // Procura pela pasta 'json' dentro da pasta selecionada
      let jsonFolderHandle: FileSystemDirectoryHandle | null = null;
      // @ts-ignore - values() não está tipado no FileSystemDirectoryHandle
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory' && entry.name === 'json') {
          jsonFolderHandle = entry as FileSystemDirectoryHandle;
          break;
        }
      }

      if (!jsonFolderHandle) {
        setError('Pasta "json" não encontrada na pasta selecionada');
        setLoading(false);
        return;
      }

      // Procura pelo arquivo JSON dentro da pasta json
      const jsonFiles: FileSystemFileHandle[] = [];
      // @ts-ignore - values() não está tipado no FileSystemDirectoryHandle
      for await (const entry of jsonFolderHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
          jsonFiles.push(entry as FileSystemFileHandle);
        }
      }

      if (jsonFiles.length === 0) {
        setError('Nenhum arquivo JSON encontrado na pasta "json"');
        setLoading(false);
        return;
      }

      // Pega o primeiro arquivo JSON encontrado
      const jsonFile = await jsonFiles[0].getFile();
      const jsonText = await jsonFile.text();
      const data = JSON.parse(jsonText);

      setClipsData(data);
      console.log('JSON carregado:', Object.keys(data).length, 'clips encontrados');
    } catch (err) {
      console.error('Erro ao selecionar pasta:', err);
      setError('Erro ao carregar arquivo JSON');
    } finally {
      setLoading(false);
    }
  };

  const loadImage = async (domain: string, page: string) => {
    if (!directoryHandle) return;

    try {
      setLoading(true);
      setError(null);

      // Procura pela pasta fullpages
      let fullpagesHandle: FileSystemDirectoryHandle | null = null;
      // @ts-ignore - values() não está tipado no FileSystemDirectoryHandle
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'directory' && entry.name === 'fullpages') {
          fullpagesHandle = entry as FileSystemDirectoryHandle;
          break;
        }
      }

      if (!fullpagesHandle) {
        setError('Pasta "fullpages" não encontrada');
        setLoading(false);
        return;
      }

      // Formata o nome do arquivo: domain-page.jpg
      // Ex: d24am.com-infofour-005.jpg
      const fileName = `${domain}-${page.padStart(3, '0')}.jpg`;
      console.log('Procurando por imagem:', fileName);

      try {
        const imageFileHandle = await fullpagesHandle.getFileHandle(fileName);
        const imageFile = await imageFileHandle.getFile();
        const url = URL.createObjectURL(imageFile);
        
        setImages(prev => {
          const filtered = prev.filter(p => p.page !== page);
          return [...filtered, { page, url }].sort((a, b) => parseInt(a.page) - parseInt(b.page));
        });
      } catch (err) {
        console.error('Imagem não encontrada:', fileName);
        setError(`Imagem não encontrada: ${fileName}`);
      }
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
      setError('Erro ao carregar imagem');
    } finally {
      setLoading(false);
    }
  };

  const drawCropAreas = (canvas: HTMLCanvasElement, img: HTMLImageElement, cropAreas: CropArea[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Renderização em alta densidade (HiDPI) + zoom
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.round(img.width * zoom);
    const displayHeight = Math.round(img.height * zoom);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    ctx.imageSmoothingEnabled = true;
    // high melhora quando reduzimos
    // @ts-ignore - algumas engines não tipam essa propriedade
    ctx.imageSmoothingQuality = 'high';

    // Desenha a imagem
    ctx.drawImage(img, 0, 0);

    // Desenha as áreas de crop
    cropAreas.forEach((area, index) => {
      const x = parseFloat(area.x) * img.width;
      const width = parseFloat(area.width) * img.width;
      const height = parseFloat(area.height) * img.height;

      // Converte Y (topo)
      const yJson = parseFloat(area.y);
      const y = (1 - yJson) * img.height;

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`${index + 1}`, x + 5, y + 25);
    });
  };

  useEffect(() => {
    if (!selectedClipId || !clipsData[selectedClipId]) return;

    const clip = clipsData[selectedClipId];
    images.forEach(({ page, url }) => {
      const canvas = canvasRefs.current[page];
      if (!canvas) return;
      const img = new Image();
      img.onload = () => {
        const areasForPage = (clip.cropAreas || []).filter(a => a.page === page);
        drawCropAreas(canvas, img, areasForPage);
      };
      img.src = url;
    });
  }, [images, selectedClipId, clipsData, zoom]);

  const handleClipSelect = (clipId: string) => {
    setSelectedClipId(clipId);
    const clip = clipsData[clipId];
    
    if (clip.cropAreas && clip.cropAreas.length > 0) {
      const uniquePages = Array.from(new Set(clip.cropAreas.map(a => a.page)));
      setImages([]);
      uniquePages.forEach((p) => {
        loadImage(clip.domain, p);
      });
    }
  };

  const clipsList = Object.entries(clipsData);

  return (
    <div className="crop-area-viewer">
      <header className="viewer-header">
        <button onClick={onBack} className="back-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar
        </button>
        <h1>Visualizador de Áreas de Recorte</h1>
        <button onClick={handleSelectFolder} className="select-folder-btn" disabled={loading}>
          {loading ? 'Carregando...' : directoryHandle ? 'Trocar Pasta' : 'Selecionar Pasta'}
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="viewer-content">
        {/* Coluna esquerda: Lista de clips */}
        <div className="clips-sidebar">
          <div className="sidebar-header">
            <h2>Clips</h2>
            <span className="clips-count">{clipsList.length} clips</span>
          </div>

          {clipsList.length > 0 ? (
            <div className="clips-list">
              {clipsList.map(([clipId, clip]) => (
                <div
                  key={clipId}
                  className={`clip-item ${selectedClipId === clipId ? 'selected' : ''}`}
                  onClick={() => handleClipSelect(clipId)}
                >
                  <h3>{clip.title || 'Sem título'}</h3>
                  <div className="clip-meta">
                    <span className="meta-badge">{clip.paper}</span>
                    {clip.cropAreas && (
                      <span className="meta-info">
                        {clip.cropAreas.length} área{clip.cropAreas.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {clip.pages && (
                    <div className="clip-pages">
                      <span>📄 Páginas: {clip.pages}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              <h3>Nenhum clip carregado</h3>
              <p>Selecione uma pasta com arquivo JSON para começar</p>
            </div>
          )}
        </div>

        {/* Coluna direita: Visualização da imagem */}
        <div className="image-viewer">
          {selectedClipId && clipsData[selectedClipId] ? (
            <>
              <div className="image-header">
                <h2>{clipsData[selectedClipId].title || 'Sem título'}</h2>
                <div className="clip-info-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {clipsData[selectedClipId].author && clipsData[selectedClipId].author.length > 0 && (
                    <span>✍️ {clipsData[selectedClipId].author.join(', ')}</span>
                  )}
                  {clipsData[selectedClipId].section && clipsData[selectedClipId].section.length > 0 && (
                    <span>📂 {clipsData[selectedClipId].section.filter(s => s).join(', ')}</span>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
                      className="nav-btn"
                      style={{ padding: '6px 10px' }}
                    >-
                    </button>
                    <span className="pdf-counter">{Math.round(zoom * 100)}%</span>
                    <button 
                      onClick={() => setZoom(z => Math.min(4, z + 0.25))}
                      className="nav-btn"
                      style={{ padding: '6px 10px' }}
                    >+
                    </button>
                  </div>
                </div>
              </div>

              <div className="canvas-container">
                {images.length > 0 ? (
                  images.map(({ page }) => (
                    <canvas
                      key={page}
                      ref={(el) => { canvasRefs.current[page] = el; }}
                      className="crop-canvas"
                      style={{ marginRight: '16px' }}
                    />
                  ))
                ) : (
                  <div className="loading-image">
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        <p>Carregando imagem...</p>
                      </>
                    ) : (
                      <>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <p>Selecione um clip para visualizar</p>
                      </>
                    )}
                  </div>
                )}
              </div>

            </>
          ) : (
            <div className="empty-viewer">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <h3>Nenhum clip selecionado</h3>
              <p>Escolha um clip na lista à esquerda para visualizar as áreas de recorte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

