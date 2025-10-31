import { NextRequest, NextResponse } from 'next/server';
import { generateEPKPDF, EPKData } from '@thecueroom/epk/exporter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const epkData: EPKData = {
      artistName: body.artistName || 'Artist EPK',
      bio: body.bio || '',
      genre: body.genre,
      region: body.region,
      discography: body.discography || [],
      pressQuotes: body.pressQuotes || [],
      socialLinks: body.socialLinks || {},
    };

    const result = await generateEPKPDF(epkData);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'PDF generation failed' },
        { status: 500 }
      );
    }

    // Validate PDF integrity
    const pdfHeader = result.data.toString('utf-8', 0, 5);
    if (!pdfHeader.startsWith('%PDF')) {
      console.error('Invalid PDF header:', pdfHeader);
      return NextResponse.json(
        { success: false, error: 'Generated PDF is corrupted' },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const sanitizedName = epkData.artistName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
    const filename = `EPK-${sanitizedName}-${timestamp}.pdf`;

    // Stream PDF with proper download headers
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': result.data.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
