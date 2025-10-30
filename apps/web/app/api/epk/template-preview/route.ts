import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PreviewRequestSchema = z.object({
  templateId: z.string(),
  modules: z.array(z.any()),
  artistName: z.string().optional(),
  releaseTitle: z.string().optional()
});

function generatePreviewHTML(templateId: string, modules: any[], artistName?: string, releaseTitle?: string): string {
  const templateStyles: Record<string, string> = {
    'brutalist-onepage': `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Space Grotesk', sans-serif; background: #0B0B0B; color: #fff; padding: 60px; }
      .header { margin-bottom: 60px; border-bottom: 4px solid #D7FF3C; padding-bottom: 20px; }
      .header h1 { font-size: 72px; font-weight: 700; color: #D7FF3C; text-transform: uppercase; letter-spacing: -2px; }
      .header h2 { font-size: 28px; font-weight: 400; color: #fff; margin-top: 12px; }
      .module { margin-bottom: 48px; }
      .module h3 { font-size: 24px; font-weight: 700; color: #D7FF3C; margin-bottom: 20px; text-transform: uppercase; }
      .bio-text { font-size: 16px; line-height: 1.8; color: #ccc; }
    `,
    'minimalist-clean': `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: #FAFAFA; color: #1A1A1A; padding: 80px; }
      .header { margin-bottom: 80px; text-align: center; }
      .header h1 { font-size: 56px; font-weight: 300; color: #000; letter-spacing: -1px; }
      .header h2 { font-size: 18px; font-weight: 400; color: #666; margin-top: 16px; }
      .module { margin-bottom: 60px; max-width: 800px; margin-left: auto; margin-right: auto; }
      .module h3 { font-size: 14px; font-weight: 600; color: #000; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
      .bio-text { font-size: 15px; line-height: 2; color: #333; font-weight: 300; }
    `,
    'magazine-editorial': `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Roboto:wght@300;400&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Roboto', sans-serif; background: #F8F8F8; color: #2A2A2A; padding: 60px; column-count: 2; column-gap: 40px; }
      .header { margin-bottom: 40px; column-span: all; }
      .header h1 { font-family: 'Playfair Display', serif; font-size: 64px; font-weight: 700; color: #FF3366; }
      .header h2 { font-size: 20px; font-weight: 300; color: #666; margin-top: 10px; }
      .module { margin-bottom: 40px; break-inside: avoid; }
      .module h3 { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1A1A1A; margin-bottom: 16px; }
      .bio-text { font-size: 14px; line-height: 1.7; color: #444; }
    `,
    'tech-neon': `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Orbitron', sans-serif; background: #0A0E27; color: #E6E6E6; padding: 50px; }
      .header { margin-bottom: 50px; border: 2px solid #00FFD1; padding: 30px; background: rgba(0,255,209,0.05); }
      .header h1 { font-size: 60px; font-weight: 900; color: #00FFD1; text-shadow: 0 0 20px #00FFD1; text-transform: uppercase; }
      .header h2 { font-size: 22px; font-weight: 400; color: #FF00FF; margin-top: 10px; text-shadow: 0 0 10px #FF00FF; }
      .module { margin-bottom: 40px; border-left: 4px solid #00FFD1; padding-left: 20px; }
      .module h3 { font-size: 22px; font-weight: 700; color: #FF00FF; margin-bottom: 18px; text-transform: uppercase; }
      .bio-text { font-size: 14px; line-height: 1.7; color: #B8B8B8; }
    `,
    'vintage-poster': `
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier Prime', monospace; background: #F4E8D8; color: #3A2415; padding: 60px; }
      .header { margin-bottom: 50px; text-align: center; border: 8px double #8B4513; padding: 30px; background: #2C1810; color: #D4A574; }
      .header h1 { font-family: 'Bebas Neue', sans-serif; font-size: 68px; font-weight: 400; letter-spacing: 4px; }
      .header h2 { font-size: 24px; font-weight: 400; margin-top: 12px; }
      .module { margin-bottom: 45px; }
      .module h3 { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: #8B4513; margin-bottom: 20px; letter-spacing: 2px; }
      .bio-text { font-size: 14px; line-height: 1.8; color: #3A2415; }
    `,
    'glass-modern': `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #111827; padding: 60px; }
      .header { margin-bottom: 50px; backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 40px; }
      .header h1 { font-size: 58px; font-weight: 600; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.3); }
      .header h2 { font-size: 22px; font-weight: 300; color: #E5E7EB; margin-top: 12px; }
      .module { margin-bottom: 40px; backdrop-filter: blur(10px); background: rgba(255,255,255,0.15); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.2); }
      .module h3 { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 18px; }
      .bio-text { font-size: 15px; line-height: 1.7; color: #F3F4F6; }
    `,
    'dark-luxury': `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Montserrat', sans-serif; background: #0A0A0A; color: #E5E5E5; padding: 70px; }
      .header { margin-bottom: 60px; border-bottom: 2px solid #FFD700; padding-bottom: 30px; }
      .header h1 { font-family: 'Cormorant Garamond', serif; font-size: 70px; font-weight: 300; color: #FFD700; letter-spacing: 3px; }
      .header h2 { font-size: 20px; font-weight: 300; color: #C0C0C0; margin-top: 15px; letter-spacing: 4px; }
      .module { margin-bottom: 50px; }
      .module h3 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 400; color: #FFD700; margin-bottom: 22px; }
      .bio-text { font-size: 15px; line-height: 1.9; color: #C8C8C8; font-weight: 300; }
    `,
    'grid-mosaic': `
      @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Work Sans', sans-serif; background: #FAFAFA; color: #27272A; padding: 50px; }
      .header { margin-bottom: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; }
      .header h1 { font-size: 54px; font-weight: 700; color: #F59E0B; grid-column: span 2; }
      .header h2 { font-size: 20px; font-weight: 400; color: #10B981; }
      .module { margin-bottom: 40px; border-left: 6px solid #F59E0B; padding-left: 24px; }
      .module h3 { font-size: 26px; font-weight: 600; color: #18181B; margin-bottom: 20px; }
      .bio-text { font-size: 15px; line-height: 1.8; color: #3F3F46; }
    `
  };

  const style = `
    <style>
      ${templateStyles[templateId] || templateStyles['brutalist-onepage']}
      .tracklist-item { margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; }
      .tracklist-title { font-weight: 600; }
      .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
      .gallery-item { background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; height: 200px; display: flex; align-items: center; justify-content: center; }
      .tech-rider-item { display: inline-block; margin: 8px; padding: 12px 20px; border-radius: 20px; font-weight: 600; }
      .quote { padding: 20px; margin-bottom: 16px; font-style: italic; opacity: 0.9; }
      .link-item { display: block; padding: 10px; border-radius: 6px; margin-bottom: 8px; text-decoration: none; }
      .footer { margin-top: 80px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; font-size: 12px; opacity: 0.6; }
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
      <div class="footer">
        Made using thecueRoom's AI EPK Generator
      </div>
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
