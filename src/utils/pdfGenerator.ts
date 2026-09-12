import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: [number, number] | string;
  marginMm?: number;
  multiPage?: boolean;
}

/**
 * Generate and download high-quality PDF from HTML element
 * Default format: Half of A4 Landscape (210mm x 148.5mm)
 */
export const downloadElementAsPDF = async (
  elementId: string,
  options: PDFOptions = {}
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return false;
  }

  const {
    filename = 'dokumen.pdf',
    orientation = 'landscape',
    format = [210, 148.5], // A4 dibagi 2 (Lebar 210mm x Tinggi 148.5mm)
    marginMm = 4,
    multiPage = false,
  } = options;

  try {
    // Render high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2.5, // Crisp text & borders
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pdfWidth = Array.isArray(format) ? format[0] : pdf.internal.pageSize.getWidth();
    const pdfHeight = Array.isArray(format) ? format[1] : pdf.internal.pageSize.getHeight();

    const renderWidth = pdfWidth - marginMm * 2;
    const availableHeight = pdfHeight - marginMm * 2;
    const totalRenderHeight = (canvas.height * renderWidth) / canvas.width;

    if (multiPage && totalRenderHeight > availableHeight) {
      // Multi-page slicing across A4 pages
      let remainingCanvasHeight = canvas.height;
      let pageCanvasY = 0;
      const pageCanvasHeight = (availableHeight * canvas.width) / renderWidth;
      let pageNum = 0;

      while (remainingCanvasHeight > 0) {
        if (pageNum > 0) {
          pdf.addPage(format, orientation);
        }

        const currentSliceCanvasHeight = Math.min(remainingCanvasHeight, pageCanvasHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentSliceCanvasHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, pageCanvasY, canvas.width, currentSliceCanvasHeight,
            0, 0, pageCanvas.width, currentSliceCanvasHeight
          );
          const pageImg = pageCanvas.toDataURL('image/png');
          const sliceRenderHeight = (currentSliceCanvasHeight * renderWidth) / canvas.width;
          pdf.addImage(pageImg, 'PNG', marginMm, marginMm, renderWidth, sliceRenderHeight);
        }

        pageCanvasY += currentSliceCanvasHeight;
        remainingCanvasHeight -= currentSliceCanvasHeight;
        pageNum++;
      }
    } else {
      // Single page fit
      const imgData = canvas.toDataURL('image/png');
      let finalWidth = renderWidth;
      let finalHeight = totalRenderHeight;
      let posX = marginMm;
      let posY = marginMm;

      if (totalRenderHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = (canvas.width * finalHeight) / canvas.height;
        posX = (pdfWidth - finalWidth) / 2;
        posY = marginMm;
      } else {
        posY = (pdfHeight - finalHeight) / 2;
      }

      pdf.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight);
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

