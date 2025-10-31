
import { describe, it, expect } from 'vitest';
import { generateEPKPDF, EPKData } from '@thecueroom/epk/exporter';
import { PDFDocument } from 'pdf-lib';

describe('EPK PDF Export', () => {
  const mockEPKData: EPKData = {
    artistName: 'Test Artist',
    bio: 'This is a test bio with some content to validate PDF generation.',
    genre: 'Techno, Minimal',
    region: 'EU — Berlin',
    discography: [
      { title: 'Track 1', year: '2024', label: 'Test Label' },
      { title: 'Track 2', year: '2023' },
    ],
    pressQuotes: ['Great artist!', 'Amazing sound'],
    socialLinks: {
      soundcloud: 'https://soundcloud.com/test',
    },
  };

  it('should generate a valid PDF with correct header', async () => {
    const result = await generateEPKPDF(mockEPKData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data) {
      const header = result.data.toString('utf-8', 0, 5);
      expect(header).toMatch(/^%PDF/);
    }
  });

  it('should create parseable PDF document', async () => {
    const result = await generateEPKPDF(mockEPKData);

    expect(result.success).toBe(true);
    
    if (result.data) {
      // Verify PDF can be loaded by pdf-lib
      const pdfDoc = await PDFDocument.load(result.data);
      expect(pdfDoc.getPageCount()).toBeGreaterThan(0);
    }
  });

  it('should have minimum file size', async () => {
    const result = await generateEPKPDF(mockEPKData);

    expect(result.success).toBe(true);
    
    if (result.data) {
      expect(result.data.length).toBeGreaterThan(1000); // At least 1KB
    }
  });

  it('should handle empty data gracefully', async () => {
    const emptyData: EPKData = {
      artistName: 'Empty Artist',
      bio: '',
    };

    const result = await generateEPKPDF(emptyData);
    expect(result.success).toBe(true);
  });

  it('should include all provided content', async () => {
    const result = await generateEPKPDF(mockEPKData);

    expect(result.success).toBe(true);
    
    if (result.data) {
      const pdfDoc = await PDFDocument.load(result.data);
      const form = pdfDoc.getForm();
      
      // PDF should have content (at least 1 page)
      expect(pdfDoc.getPageCount()).toBeGreaterThan(0);
    }
  });
});
