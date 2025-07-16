import { PDFDocument } from 'pdf-lib';

export class PdfService {
  /**
   * Combina múltiplos PDFs em um único PDF
   */
  static async combinePdfs(pdfUrls: string[]): Promise<string> {
    if (pdfUrls.length === 0) {
      throw new Error('Nenhum PDF fornecido para combinar');
    }

    if (pdfUrls.length === 1) {
      // Se há apenas um PDF, retorna ele mesmo
      return pdfUrls[0];
    }

    try {
      console.log(`Combinando ${pdfUrls.length} PDFs...`);
      
      // Cria um novo documento PDF
      const mergedPdf = await PDFDocument.create();
      
      // Processa cada PDF
      for (let i = 0; i < pdfUrls.length; i++) {
        const pdfUrl = pdfUrls[i];
        console.log(`Processando PDF ${i + 1}/${pdfUrls.length}: ${pdfUrl}`);
        
        try {
          // Busca o PDF
          const response = await fetch(pdfUrl);
          if (!response.ok) {
            console.warn(`Erro ao buscar PDF ${i + 1}: ${response.statusText}`);
            continue;
          }
          
          const pdfBytes = await response.arrayBuffer();
          
          // Carrega o PDF
          const pdf = await PDFDocument.load(pdfBytes);
          
          // Copia todas as páginas para o PDF combinado
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          pages.forEach((page) => mergedPdf.addPage(page));
          
          console.log(`PDF ${i + 1} adicionado com sucesso`);
        } catch (error) {
          console.error(`Erro ao processar PDF ${i + 1}:`, error);
          // Continua com os próximos PDFs mesmo se um falhar
        }
      }
      
      // Gera o PDF combinado
      const mergedPdfBytes = await mergedPdf.save();
      
      // Cria uma URL para o PDF combinado
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const combinedPdfUrl = URL.createObjectURL(blob);
      
      console.log(`PDFs combinados com sucesso. Total de páginas: ${mergedPdf.getPageCount()}`);
      return combinedPdfUrl;
      
    } catch (error) {
      console.error('Erro ao combinar PDFs:', error);
      throw new Error('Falha ao combinar os PDFs');
    }
  }

  /**
   * Libera a memória de uma URL de blob
   */
  static revokeObjectUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
} 