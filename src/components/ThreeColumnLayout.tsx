import { useState, useRef, useEffect } from 'react';
import type { NewsSource, NewsClip } from '../types';

interface ThreeColumnLayoutProps {
  sources: NewsSource[];
  selectedSource: NewsSource | null;
  selectedClip: NewsClip | null;
  clipsPdfUrl?: string | null;
  fullPagesPdfUrl?: string | null;
  onSourceSelect: (source: NewsSource) => void;
  onClipSelect: (source: NewsSource, clip: NewsClip) => void;
}

export function ThreeColumnLayout({
  sources,
  selectedSource,
  selectedClip,
  clipsPdfUrl = null,
  fullPagesPdfUrl = null,
  onSourceSelect,
  onClipSelect
}: ThreeColumnLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [navigationMode, setNavigationMode] = useState<'sources' | 'titles'>('sources');
  
  // Estados para redimensionamento
  const [columnWidths, setColumnWidths] = useState({
    sources: 15,
    text: 25,
    fullpage: 30,
    clips: 30
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizer, setActiveResizer] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredClips = selectedSource?.clips.filter(clip => 
    clip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clip.id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const handleBackToSources = () => {
    setNavigationMode('sources');
    setSearchTerm('');
  };

  const handleSourceClick = (source: NewsSource) => {
    onSourceSelect(source);
    setNavigationMode('titles');
  };

  // Função para iniciar o redimensionamento
  const handleResizeStart = (resizerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setActiveResizer(resizerId);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    // Adiciona uma classe ao body para indicar que está redimensionando
    document.body.classList.add('resizing-columns');
  };

  // Função para o redimensionamento
  const handleResize = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current || !activeResizer) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    const mousePercent = (mouseX / containerWidth) * 100;

    setColumnWidths(prev => {
      const newWidths = { ...prev };
      
      switch (activeResizer) {
        case 'sources-text':
          // Limita a largura mínima e máxima
          const newSourcesWidth = Math.max(10, Math.min(30, mousePercent));
          const newTextWidth = Math.max(15, Math.min(40, 100 - newSourcesWidth - prev.fullpage - prev.clips));
          newWidths.sources = newSourcesWidth;
          newWidths.text = newTextWidth;
          break;
          
        case 'text-fullpage':
          const newTextWidth2 = Math.max(15, Math.min(40, mousePercent - prev.sources));
          const newFullpageWidth = Math.max(20, Math.min(50, 100 - prev.sources - newTextWidth2 - prev.clips));
          newWidths.text = newTextWidth2;
          newWidths.fullpage = newFullpageWidth;
          break;
          
        case 'fullpage-clips':
          const totalLeft = prev.sources + prev.text;
          const newFullpageWidth2 = Math.max(20, Math.min(50, mousePercent - totalLeft));
          const newClipsWidth = Math.max(20, Math.min(50, 100 - totalLeft - newFullpageWidth2));
          newWidths.fullpage = newFullpageWidth2;
          newWidths.clips = newClipsWidth;
          break;
      }
      
      return newWidths;
    });
  };

  // Função para parar o redimensionamento
  const handleResizeEnd = () => {
    setIsResizing(false);
    setActiveResizer(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Remove a classe do body
    document.body.classList.remove('resizing-columns');
  };

  // Event listeners para redimensionamento
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, activeResizer, columnWidths]);

  return (
    <div className={`four-column-layout ${isResizing ? 'resizing' : ''}`} ref={containerRef}>
      {/* Overlay transparente durante redimensionamento */}
      {isResizing && (
        <div 
          className="resize-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'transparent',
            cursor: 'col-resize'
          }}
        />
      )}
      
      {/* COLUNA 1: Fontes e Títulos */}
      <div 
        className="column sources-titles-column"
        style={{ width: `${columnWidths.sources}%` }}
      >
        <div className="column-header">
          {navigationMode === 'sources' ? (
            <>
              <h2>Fontes de Notícias</h2>
              <span className="total-sources">{sources.length} fontes</span>
            </>
          ) : (
            <>
              <button className="back-btn" onClick={handleBackToSources}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Voltar
              </button>
              <div className="source-info">
                <h2>{selectedSource?.name}</h2>
                <span className="source-count">{selectedSource?.clips.length} recortes</span>
              </div>
            </>
          )}
        </div>

        {navigationMode === 'sources' ? (
          // Lista de Fontes
          <div className="sources-list">
            {sources.map((source) => (
              <div 
                key={source.name}
                className={`source-card ${selectedSource?.name === source.name ? 'selected' : ''}`}
                onClick={() => handleSourceClick(source)}
              >
                <div className="source-header">
                  <div className="source-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                    </svg>
                  </div>
                  <div className="source-info">
                    <h3 className="source-name">{source.name}</h3>
                    <span className="source-count">{source.clips.length} recortes</span>
                  </div>
                  <div className="source-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Lista de Títulos
          <>
            <div className="search-container">
              <input
                type="text"
                placeholder="Filtrar títulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="titles-list">
              {filteredClips.length > 0 ? (
                filteredClips.map((clip, index) => (
                  <div 
                    key={index}
                    className={`title-card ${selectedClip?.id === clip.id ? 'selected' : ''}`}
                    onClick={() => onClipSelect(selectedSource!, clip)}
                  >
                    <div className="title-content">
                      <h3 className="clip-title">
                        {clip.title && clip.title.trim() !== '' 
                          ? clip.title 
                          : 'Título não informado'
                        }
                      </h3>
                      
                      <div className="clip-meta">
                        {clip.date && (
                          <span className="meta-item">
                            <span className="meta-icon">📅</span>
                            {formatDate(clip.date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <h3>Nenhum resultado encontrado</h3>
                    <p>{searchTerm ? 'Tente ajustar os filtros de busca' : 'Nenhum recorte disponível nesta fonte'}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* DIVISOR 1: Entre Fontes e Texto */}
      <div 
        className={`column-resizer ${activeResizer === 'sources-text' ? 'active' : ''}`}
        onMouseDown={(e) => handleResizeStart('sources-text', e)}
      />

      {/* COLUNA 2: Texto do Recorte */}
      <div 
        className="column text-column"
        style={{ width: `${columnWidths.text}%` }}
      >
        {selectedClip && selectedClip.fulltext ? (
          <div className="text-content">
            <div className="clip-title">
              <h3>
                {selectedClip.title && selectedClip.title.trim() !== '' 
                  ? selectedClip.title 
                  : 'Título não disponível'
                }
              </h3>
            </div>
            
            <div className="clip-info">
              {selectedClip.author && (
                <div className="info-item">
                  <span className="info-label">Autor:</span>
                  <span className="info-value">
                    {selectedClip.author === undefined || selectedClip.author === '' || selectedClip.author === null || selectedClip.author.length === 0 
                      ? 'Não informado' 
                      : selectedClip.author}
                  </span>
                </div>
              )}
              
              {selectedClip.pointers && (
                <div className="info-item">
                  <span className="info-label">Páginas:</span>
                  <span className="info-value">{selectedClip.pointers}</span>
                </div>
              )}
              
              {selectedClip.date && (
                <div className="info-item">
                  <span className="info-label">Data:</span>
                  <span className="info-value">{formatDate(selectedClip.date)}</span>
                </div>
              )}
            </div>
            
            <div className="clip-text">
              <p dangerouslySetInnerHTML={{ 
                __html: selectedClip.fulltext?.replace(/\r?\n/g, '<br>') || '' 
              }} />
            </div>
          </div>
        ) : (
          <div className="no-text-selected">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              <h3>Selecione um recorte</h3>
              <p>Escolha um título na coluna esquerda para ver o texto</p>
            </div>
          </div>
        )}
      </div>

      {/* DIVISOR 2: Entre Texto e Página Inteira */}
      <div 
        className={`column-resizer ${activeResizer === 'text-fullpage' ? 'active' : ''}`}
        onMouseDown={(e) => handleResizeStart('text-fullpage', e)}
      />

      {/* COLUNA 3: Página Inteira */}
      <div 
        className="column fullpage-column"
        style={{ width: `${columnWidths.fullpage}%` }}
      >
        <div className="column-header">
          <h2>Página Inteira</h2>
        </div>
        
        {selectedClip && fullPagesPdfUrl ? (
          <div className="pdf-viewer-container">
            <div className="pdf-content">
              <iframe
                src={fullPagesPdfUrl}
                width="100%"
                height="100%"
                style={{ 
                  border: 'none', 
                  borderRadius: '0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  pointerEvents: isResizing ? 'none' : 'auto'
                }}
                title="Full Page PDF Viewer"
              />
            </div>
          </div>
        ) : (
          <div className="no-pdf-selected">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
              <h3>Selecione um recorte</h3>
              <p>Escolha um título na coluna esquerda para visualizar a página inteira</p>
            </div>
          </div>
        )}
      </div>

      {/* DIVISOR 3: Entre Página Inteira e Recortes */}
      <div 
        className={`column-resizer ${activeResizer === 'fullpage-clips' ? 'active' : ''}`}
        onMouseDown={(e) => handleResizeStart('fullpage-clips', e)}
      />

      {/* COLUNA 4: Recortes */}
      <div 
        className="column clips-column"
        style={{ width: `${columnWidths.clips}%` }}
      >
        <div className="column-header">
          <h2>Recortes</h2>
        </div>
        
        {selectedClip && clipsPdfUrl ? (
          <div className="pdf-viewer-container">
            <div className="pdf-content">
              <iframe
                src={clipsPdfUrl}
                width="100%"
                height="100%"
                style={{ 
                  border: 'none', 
                  borderRadius: '0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  pointerEvents: isResizing ? 'none' : 'auto'
                }}
                title="Clips PDF Viewer"
              />
            </div>
          </div>
        ) : (
          <div className="no-pdf-selected">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
              <h3>Selecione um recorte</h3>
              <p>Escolha um título na coluna esquerda para visualizar os recortes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 