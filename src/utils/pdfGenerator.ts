import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: [number, number] | string;
  marginMm?: number;
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
  } = options;

  try {
    // Render high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 3, // Higher scale for crisp text & borders
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pdfWidth = Array.isArray(format) ? format[0] : pdf.internal.pageSize.getWidth();
    const pdfHeight = Array.isArray(format) ? format[1] : pdf.internal.pageSize.getHeight();

    const renderWidth = pdfWidth - marginMm * 2;
    const renderHeight = (canvas.height * renderWidth) / canvas.width;

    let finalWidth = renderWidth;
    let finalHeight = renderHeight;
    let posX = marginMm;
    let posY = marginMm;

    if (renderHeight > (pdfHeight - marginMm * 2)) {
      finalHeight = pdfHeight - marginMm * 2;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
      posX = (pdfWidth - finalWidth) / 2;
      posY = marginMm;
    } else {
      posY = (pdfHeight - finalHeight) / 2;
    }

    pdf.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight);
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
