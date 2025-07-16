import type { NewsSource, NewsClip } from '../types';

interface NewsSourceListProps {
  sources: NewsSource[];
  onSourceToggle: (sourceName: string) => void;
  onClipSelect: (source: NewsSource, clip: NewsClip) => void;
}

export function NewsSourceList({ sources, onSourceToggle, onClipSelect }: NewsSourceListProps) {
  if (sources.length === 0) {
    return (
      <div className="no-sources">
        <p>Nenhuma fonte de notícias encontrada.</p>
        <p>Selecione uma pasta para começar.</p>
      </div>
    );
  }

  return (
    <div className="news-sources">
      <h2>Fontes de Notícias</h2>
      {sources.map((source) => (
        <div key={source.name} className="news-source">
          <div 
            className="source-header"
            onClick={() => onSourceToggle(source.name)}
          >
            <span className="expand-icon">
              {source.expanded ? '▼' : '▶'}
            </span>
            <span className="source-name">{source.name}</span>
            <span className="clip-count">
              ({source.clips.length} recortes)
            </span>
          </div>
          
          {source.expanded && (
            <div className="clips-list">
              {source.clips.length === 0 ? (
                <p className="no-clips">Carregando recortes...</p>
              ) : (
                source.clips.map((clip, index) => (
                  <div 
                    key={index} 
                    className="clip-item"
                    onClick={() => onClipSelect(source, clip)}
                  >
                    <span className="clip-title">
                      {clip.title || clip.id || `Recorte ${index + 1}`}
                    </span>
                    {clip.date && (
                      <span className="clip-date">{clip.date}</span>
                    )}
                    {clip.id && !clip.title && (
                      <span className="clip-id">{clip.id}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 