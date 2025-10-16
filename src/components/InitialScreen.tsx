interface InitialScreenProps {
  onSelectDirectory: () => void;
  onOpenCropViewer?: () => void;
  loading?: boolean;
}

export function InitialScreen({ onSelectDirectory, onOpenCropViewer, loading = false }: InitialScreenProps) {
  return (
    <div className="initial-screen">
      <div className="initial-content">
        <div 
          className={`folder-circle ${loading ? 'loading' : ''}`}
          onClick={!loading ? onSelectDirectory : undefined}
        >
          <div className="folder-icon">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
            </svg>
          </div>
        </div>
        
        <h2 className="initial-title">
          Gerenciador de Recortes de Jornais
        </h2>
        
        <p className="initial-subtitle">
          Clique para selecionar uma pasta
        </p>
        
        <div className="initial-instructions">
          <p>A pasta deve conter subpastas com a estrutura:</p>
          <div className="folder-structure">
            <div className="structure-item">
              <span className="folder-name">nome-da-fonte/</span>
            </div>
            <div className="structure-item indent">
              <span className="folder-icon-small">📁</span>
              <span className="folder-name">json/</span>
              <span className="folder-desc">(arquivo .json com metadados)</span>
            </div>
            <div className="structure-item indent">
              <span className="folder-icon-small">📁</span>
              <span className="folder-name">fullpages/</span>
              <span className="folder-desc">(imagens das páginas completas)</span>
            </div>
          </div>
        </div>

        {onOpenCropViewer && (
          <div style={{ marginTop: '2rem' }}>
            <button 
              className="crop-viewer-btn"
              onClick={onOpenCropViewer}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              Visualizador de Áreas de Recorte
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 