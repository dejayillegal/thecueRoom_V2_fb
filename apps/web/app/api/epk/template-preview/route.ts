import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PreviewRequestSchema = z.object({
  templateId: z.string(),
  modules: z.array(z.any()),
  artistName: z.string().optional(),
  releaseTitle: z.string().optional()
});

function generatePreviewHTML(templateId: string, modules: any[], artistName?: string, releaseTitle?: string): string {
  const style = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: #0B0B0B; color: #fff; padding: 40px; }
      .header { margin-bottom: 40px; }
      .header h1 { font-size: 48px; font-weight: 700; color: #D7FF3C; }
      .header h2 { font-size: 24px; font-weight: 400; color: #9B5CFF; margin-top: 8px; }
      .module { margin-bottom: 32px; page-break-inside: avoid; }
      .module h3 { font-size: 20px; font-weight: 600; color: #D7FF3C; margin-bottom: 16px; text-transform: uppercase; }
      .bio-text { font-size: 14px; line-height: 1.6; color: #ccc; }
      .tracklist-item { margin-bottom: 12px; padding: 12px; background: #1a1a1a; border-radius: 8px; border-left: 3px solid #9B5CFF; }
      .tracklist-title { font-weight: 600; color: #fff; }
      .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
      .gallery-item { background: #1a1a1a; padding: 8px; border-radius: 8px; height: 200px; display: flex; align-items: center; justify-content: center; color: #666; }
      .tech-rider-item { display: inline-block; margin: 8px; padding: 12px 20px; background: #9B5CFF; border-radius: 20px; font-weight: 600; color: #fff; }
      .quote { padding: 20px; background: #1a1a1a; border-left: 4px solid #D7FF3C; margin-bottom: 16px; font-style: italic; }
      .link-item { display: block; padding: 10px; background: #1a1a1a; border-radius: 6px; margin-bottom: 8px; color: #D7FF3C; text-decoration: none; }
      .link-item:hover { background: #252525; }
    </style>
  `;

  let modulesHTML = '';
  modules.forEach(module => {
    switch (module.type) {
      case 'bio':
        modulesHTML += `
          <div class="module">
            <h3>Biography</h3>
            <div class="bio-text">${module.data?.text || 'Add your artist biography here...'}</div>
          </div>
        `;
        break;
      case 'tracklist':
        modulesHTML += `
          <div class="module">
            <h3>Tracklist</h3>
            ${(module.data?.tracks || []).map((track: any) => `
              <div class="tracklist-item">
                <div class="tracklist-title">${track.title || 'Untitled'}</div>
                ${track.soundcloudUrl ? `<div style="margin-top: 8px; font-size: 12px; color: #9B5CFF;">SoundCloud: ${track.soundcloudUrl}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
        break;
      case 'gallery':
        modulesHTML += `
          <div class="module">
            <h3>Photo Gallery</h3>
            <div class="gallery">
              ${(module.data?.images || []).map((_: any, i: number) => `
                <div class="gallery-item">Image ${i + 1}</div>
              `).join('')}
            </div>
          </div>
        `;
        break;
      case 'techRider':
        modulesHTML += `
          <div class="module">
            <h3>Tech Rider</h3>
            <div>
              ${(module.data?.items || []).map((item: any) => `
                <span class="tech-rider-item">${item.quantity ? item.quantity + 'x ' : ''}${item.label}</span>
              `).join('')}
            </div>
          </div>
        `;
        break;
      case 'quotes':
        modulesHTML += `
          <div class="module">
            <h3>Press Quotes</h3>
            ${(module.data?.quotes || []).map((quote: any) => `
              <div class="quote">
                "${quote.text}"
                ${quote.source ? `<div style="margin-top: 8px; color: #9B5CFF; font-style: normal;">— ${quote.source}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
        break;
      case 'links':
        modulesHTML += `
          <div class="module">
            <h3>Links</h3>
            ${(module.data?.links || []).map((link: any) => `
              <a href="${link.url}" class="link-item" target="_blank">${link.label || link.url}</a>
            `).join('')}
          </div>
        `;
        break;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${artistName || 'EPK'} - Preview</title>
      ${style}
    </head>
    <body>
      <div class="header">
        <h1>${artistName || 'Artist Name'}</h1>
        ${releaseTitle ? `<h2>${releaseTitle}</h2>` : ''}
      </div>
      ${modulesHTML || '<div style="color: #666; text-align: center; padding: 60px;">Add modules to see your EPK preview</div>'}
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, modules, artistName, releaseTitle } = PreviewRequestSchema.parse(body);

    const html = generatePreviewHTML(templateId, modules, artistName, releaseTitle);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('[EPK API] Preview error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
