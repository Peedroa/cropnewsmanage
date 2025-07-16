import type { NewsSource, NewsClip } from '../types';

export class FileService {
  private rootDirectory: FileSystemDirectoryHandle | null = null;

  async selectRootDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      this.rootDirectory = await window.showDirectoryPicker({
        mode: 'read'
      });
      return this.rootDirectory;
    } catch (error) {
      console.error('Erro ao selecionar diretório:', error);
      return null;
    }
  }

  async getSubdirectories(): Promise<NewsSource[]> {
    if (!this.rootDirectory) {
      console.log('Nenhum diretório raiz selecionado');
      return [];
    }

    const sources: NewsSource[] = [];
    
    try {
      console.log('Lendo subdiretórios...');
      let count = 0;
      
      for await (const [name, handle] of this.rootDirectory.entries()) {
        console.log(`Encontrado: ${name} (tipo: ${handle.kind})`);
        count++;
        
        if (handle.kind === 'directory') {
          sources.push({
            name,
            path: name,
            clips: [],
            expanded: false
          });
          console.log(`Adicionado diretório: ${name}`);
        }
      }
      
      console.log(`Total de itens encontrados: ${count}`);
      console.log(`Diretórios encontrados: ${sources.length}`);
      console.log('Diretórios:', sources.map(s => s.name));
      
    } catch (error) {
      console.error('Erro ao ler subdiretórios:', error);
    }

    return sources;
  }

  async loadJsonFiles(source: NewsSource): Promise<NewsClip[]> {
    if (!this.rootDirectory) return [];

    try {
      console.log(`Carregando JSONs de: ${source.name}`);
      const sourceDir = await this.rootDirectory.getDirectoryHandle(source.name);
      const jsonDir = await sourceDir.getDirectoryHandle('json');
      
      const clips: NewsClip[] = [];
      
      for await (const [filename, handle] of jsonDir.entries()) {
        console.log(`Verificando arquivo: ${filename}`);
        if (filename.endsWith('.json')) {
          console.log(`Processando JSON: ${filename}`);
          const fileHandle = handle as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const content = await file.text();
          const jsonData = JSON.parse(content);
          
          console.log(`Conteúdo do JSON ${filename}:`, jsonData);
          
          // Assumindo que o JSON tem uma estrutura com array de clips
          if (Array.isArray(jsonData)) {
            clips.push(...jsonData);
            console.log(`Adicionados ${jsonData.length} clips do array`);
          } else if (jsonData.clips && Array.isArray(jsonData.clips)) {
            clips.push(...jsonData.clips);
            console.log(`Adicionados ${jsonData.clips.length} clips da propriedade clips`);
          } else {
            // Se for um objeto com múltiplas chaves, cada chave é um clip
            const keys = Object.keys(jsonData);
            console.log(`Encontradas ${keys.length} chaves no objeto:`, keys);
            
            for (const key of keys) {
              const clipData = jsonData[key];
              // Adicionar a chave como identificador se não existir
              if (typeof clipData === 'object' && clipData !== null) {
                const clip = {
                  ...clipData,
                  id: key,
                  title: clipData.title && clipData.title.trim() !== '' ? clipData.title : undefined,
                  pointers: clipData.pointers || key
                };
                clips.push(clip);
              }
            }
            console.log(`Adicionados ${keys.length} clips do objeto`);
          }
        }
      }
      
      console.log(`Total de clips carregados para ${source.name}: ${clips.length}`);
      return clips;
    } catch (error) {
      console.error(`Erro ao carregar arquivos JSON de ${source.name}:`, error);
      return [];
    }
  }

  async getPdfFiles(source: NewsSource, clip: NewsClip, viewMode: 'clips' | 'fullpages' = 'clips'): Promise<string[]> {
    if (!this.rootDirectory) return [];

    try {
      console.log(`Carregando PDFs para: ${source.name} (modo: ${viewMode})`);
      console.log(`Recorte:`, clip);
      console.log(`Pointers: ${clip.pointers}`);
      
      const sourceDir = await this.rootDirectory.getDirectoryHandle(source.name);
      const targetDir = await sourceDir.getDirectoryHandle(viewMode);
      
      const pdfFiles: string[] = [];
      const pointers = clip.pointers.split(',').map(p => p.trim());
      
      console.log(`Pointers processados:`, pointers);
      
      if (viewMode === 'clips') {
        // Modo recortes - lógica original
        for (const pointer of pointers) {
          const possibleFilenames = [
            `${source.name.replace('.com.br-info', '')}-${pointer}.pdf`,
            `${pointer}.pdf`,
            `${source.name}-${pointer}.pdf`
          ];
          
          let found = false;
          for (const filename of possibleFilenames) {
            console.log(`Procurando arquivo: ${filename}`);
            
            try {
              const fileHandle = await targetDir.getFileHandle(filename);
              const file = await fileHandle.getFile();
              const url = URL.createObjectURL(file);
              pdfFiles.push(url);
              console.log(`PDF encontrado e carregado: ${filename}`);
              found = true;
              break;
            } catch (error) {
              console.warn(`Arquivo PDF não encontrado: ${filename}`);
            }
          }
          
          if (!found) {
            console.warn(`Nenhum PDF encontrado para pointer: ${pointer}`);
          }
        }
      } else {
        // Modo página inteira - procurar por número da página
        for (const pointer of pointers) {
          // Extrair o número da página (ex: "001-05" -> "001")
          const pageNumber = pointer.split('-')[0];
          console.log(`Procurando página inteira: ${pageNumber}`);
          
          try {
            // Listar todos os arquivos na pasta fullpages
            const files: string[] = [];
            for await (const [filename] of targetDir.entries()) {
              if (filename.endsWith('.pdf')) {
                files.push(filename);
              }
            }
            
            // Procurar arquivo que contenha o número da página
            const matchingFile = files.find(filename => filename.includes(pageNumber));
            
            if (matchingFile) {
              const fileHandle = await targetDir.getFileHandle(matchingFile);
              const file = await fileHandle.getFile();
              const url = URL.createObjectURL(file);
              pdfFiles.push(url);
              console.log(`Página inteira encontrada e carregada: ${matchingFile}`);
            } else {
              console.warn(`Página inteira não encontrada para: ${pageNumber}`);
            }
          } catch (error) {
            console.error(`Erro ao procurar página inteira para ${pageNumber}:`, error);
          }
        }
      }
      
      console.log(`Total de PDFs carregados: ${pdfFiles.length}`);
      return pdfFiles;
    } catch (error) {
      console.error(`Erro ao carregar PDFs de ${source.name}:`, error);
      return [];
    }
  }
} 