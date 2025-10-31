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

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 500 }
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `EPK-${epkData.artistName.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.pdf`;

    // Return PDF as downloadable file
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': result.data.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'PDF generation failed' },
      { status: 500 }
    );
  }
}
