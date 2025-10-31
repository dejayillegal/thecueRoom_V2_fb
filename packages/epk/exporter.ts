import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface EPKData {
  artistName: string;
  bio: string;
  genre?: string;
  region?: string;
  discography?: Array<{
    title: string;
    year: string;
    label?: string;
  }>;
  pressQuotes?: string[];
  socialLinks?: Record<string, string>;
}

export async function generateEPKPDF(data: EPKData): Promise{
  try {
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    
    // Embed fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Add a page
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    
    let yPosition = height - 60;
    const margin = 50;
    const lineHeight = 20;

    // Title
    page.drawText(data.artistName || 'Electronic Press Kit', {
      x: margin,
      y: yPosition,
      size: 24,
      font: fontBold,
      color: rgb(0.85, 1, 0.24), // Lime color
    });
    
    yPosition -= 40;

    // Genre & Region
    if (data.genre || data.region) {
      const subtitle = [data.genre, data.region].filter(Boolean).join(' • ');
      page.drawText(subtitle, {
        x: margin,
        y: yPosition,
        size: 12,
        font: fontRegular,
        color: rgb(0.6, 0.6, 0.6),
      });
      yPosition -= 30;
    }

    // Bio section
    if (data.bio) {
      page.drawText('Biography', {
        x: margin,
        y: yPosition,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      const bioLines = wrapText(data.bio, width - 2 * margin, fontRegular, 11);
      for (const line of bioLines) {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - 60;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      yPosition -= 20;
    }

    // Discography
    if (data.discography && data.discography.length > 0) {
      if (yPosition < 200) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 60;
      }

      page.drawText('Discography', {
        x: margin,
        y: yPosition,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      for (const release of data.discography) {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - 60;
        }
        
        const releaseText = `${release.year} - ${release.title}${release.label ? ` (${release.label})` : ''}`;
        page.drawText(releaseText, {
          x: margin + 10,
          y: yPosition,
          size: 11,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;
      }
      yPosition -= 20;
    }

    // Press Quotes
    if (data.pressQuotes && data.pressQuotes.length > 0) {
      if (yPosition < 200) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 60;
      }

      page.drawText('Press', {
        x: margin,
        y: yPosition,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;

      for (const quote of data.pressQuotes) {
        if (yPosition < 100) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = height - 60;
        }
        
        const quoteLines = wrapText(`"${quote}"`, width - 2 * margin - 20, fontRegular, 10);
        for (const line of quoteLines) {
          page.drawText(line, {
            x: margin + 10,
            y: yPosition,
            size: 10,
            font: fontRegular,
            color: rgb(0.3, 0.3, 0.3),
          });
          yPosition -= lineHeight;
        }
        yPosition -= 10;
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    
    return { success: true, data: Buffer.from(pdfBytes) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
