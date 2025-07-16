import { useState } from 'react';
import type { NewsSource, NewsClip } from '../types';

interface ThreeColumnLayoutProps {
  sources: NewsSource[];
  selectedSource: NewsSource | null;
  selectedClip: NewsClip | null;
  combinedPdfUrl?: string | null;
  viewMode: 'clips' | 'fullpages';
  loading: boolean;
  onSourceSelect: (source: NewsSource) => void;
  onClipSelect: (source: NewsSource, clip: NewsClip) => void;
  onViewModeToggle: () => void;
}

export function ThreeColumnLayout({
  sources,
  selectedSource,
  selectedClip,
  combinedPdfUrl = null,
  viewMode,
  loading,
  onSourceSelect,
  onClipSelect,
  onViewModeToggle
}: ThreeColumnLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [navigationMode, setNavigationMode] = useState<'sources' | 'titles'>('sources');

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

  return (
    <div className="three-column-layout">
      {/* COLUNA 1: Fontes e Títulos */}
      <div className="column sources-titles-column">
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

      {/* COLUNA 2: Texto do Recorte */}
      <div className="column text-column">
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

      {/* COLUNA 3: Visualizador de PDF */}
      <div className="column pdf-column">
        {selectedClip && combinedPdfUrl ? (
          <div className="pdf-viewer-container">
            <div className="pdf-controls">
             
              <div className="view-mode-buttons">
                <button 
                  className={`view-mode-btn ${viewMode === 'clips' ? 'active' : ''}`}
                  onClick={() => viewMode !== 'clips' && onViewModeToggle()}
                  disabled={loading}
                >
                  Recortes
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'fullpages' ? 'active' : ''}`}
                  onClick={() => viewMode !== 'fullpages' && onViewModeToggle()}
                  disabled={loading}
                >
                  Página Inteira
                </button>
              </div>
            </div>

            <div className="pdf-content">
              <iframe
                src={combinedPdfUrl}
                width="100%"
                height="100%"
                style={{ 
                  border: 'none', 
                  borderRadius: '0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
                title="PDF Viewer"
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
              <p>Escolha um título na coluna esquerda para visualizar o PDF</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 