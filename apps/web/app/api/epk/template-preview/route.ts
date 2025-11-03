import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PreviewRequestSchema = z.object({
  templateId: z.string(),
  modules: z.array(z.any()),
  artistName: z.string().optional(),
  releaseTitle: z.string().optional()
});

function generatePreviewHTML(templateId: string, modules: any[], artistName?: string, releaseTitle?: string): string {
  // Add example data if modules are empty
  if (modules.length === 0) {
    modules = [
      { 
        id: 'bio-1', 
        type: 'bio', 
        order: 0, 
        data: { text: 'A dynamic force in the electronic music scene, blending cutting-edge production with raw energy. Known for pushing boundaries and creating immersive sonic experiences that captivate audiences worldwide.' }
      },
      {
        id: 'quotes-1',
        type: 'quotes',
        order: 1,
        data: {
          quotes: [
            { text: 'A masterclass in electronic music production', source: 'DJ Mag' },
            { text: 'Innovative and boundary-pushing', source: 'Mixmag' }
          ]
        }
      },
      {
        id: 'tracklist-1',
        type: 'tracklist',
        order: 2,
        data: {
          tracks: [
            { title: 'Midnight Drive', soundcloudUrl: 'https://soundcloud.com/example' },
            { title: 'Electric Dreams', soundcloudUrl: '' }
          ]
        }
      },
      {
        id: 'tech-1',
        type: 'techRider',
        order: 3,
        data: {
          items: [
            { label: 'CDJ-3000', quantity: 2 },
            { label: 'DJM-900NXS2', quantity: 1 },
            { label: 'Monitor Speakers', quantity: 2 }
          ]
        }
      },
      {
        id: 'links-1',
        type: 'links',
        order: 4,
        data: {
          links: [
            { label: 'SoundCloud', url: 'https://soundcloud.com/artist' },
            { label: 'Instagram', url: 'https://instagram.com/artist' },
            { label: 'Spotify', url: 'https://spotify.com/artist' }
          ]
        }
      }
    ];
  }

  const templateStyles: Record<string, string> = {
    'brutalist-onepage': `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Space Grotesk', sans-serif; background: #0B0B0B; color: #fff; padding: 40px 60px; }
      .header { margin-bottom: 40px; border-bottom: 4px solid #D7FF3C; padding-bottom: 20px; }
      .header h1 { font-size: 56px; font-weight: 700; color: #D7FF3C; text-transform: uppercase; letter-spacing: -2px; }
      .header h2 { font-size: 20px; font-weight: 400; color: #fff; margin-top: 10px; }
      .header .location { font-size: 16px; color: #999; margin-top: 8px; }
      .module { margin-bottom: 36px; }
      .module h3 { font-size: 20px; font-weight: 700; color: #D7FF3C; margin-bottom: 16px; text-transform: uppercase; }
      .bio-text { font-size: 15px; line-height: 1.7; color: #ccc; }
    `,
    'minimalist-clean': `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; background: #FAFAFA; color: #1A1A1A; padding: 50px; }
      .header { margin-bottom: 50px; text-align: center; }
      .header h1 { font-size: 44px; font-weight: 300; color: #000; letter-spacing: -1px; }
      .header h2 { font-size: 16px; font-weight: 400; color: #666; margin-top: 12px; }
      .header .location { font-size: 14px; color: #999; margin-top: 6px; }
      .module { margin-bottom: 40px; max-width: 800px; margin-left: auto; margin-right: auto; }
      .module h3 { font-size: 12px; font-weight: 600; color: #000; margin-bottom: 18px; text-transform: uppercase; letter-spacing: 2px; }
      .bio-text { font-size: 14px; line-height: 1.8; color: #333; font-weight: 300; }
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
      .header { margin-bottom: 50px; background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 40px; box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
      .header h1 { font-size: 58px; font-weight: 600; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
      .header h2 { font-size: 22px; font-weight: 300; color: #E5E7EB; margin-top: 12px; }
      .module { margin-bottom: 40px; background: rgba(255,255,255,0.3); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
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
      .tracklist-item { margin-bottom: 10px; padding: 10px 14px; background: rgba(255,255,255,0.05); border-radius: 6px; }
      .tracklist-title { font-weight: 600; font-size: 14px; }
      .tracklist-link { margin-top: 6px; font-size: 11px; color: #9B5CFF; opacity: 0.8; }
      
      .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
      .gallery-item { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; height: 150px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
      
      .tech-rider-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
      .tech-rider-item { padding: 10px 16px; background: rgba(255,255,255,0.08); border-radius: 6px; font-size: 13px; font-weight: 500; }
      
      .quote { padding: 16px 0; margin-bottom: 14px; border-left: 3px solid #9B5CFF; padding-left: 16px; }
      .quote-text { font-style: italic; font-size: 15px; line-height: 1.6; margin-bottom: 8px; }
      .quote-source { font-style: normal; font-size: 13px; color: #9B5CFF; font-weight: 600; }
      
      .links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
      .link-item { display: block; padding: 10px 14px; background: rgba(155,92,255,0.1); border: 1px solid rgba(155,92,255,0.3); border-radius: 6px; text-decoration: none; color: inherit; font-size: 13px; transition: all 0.2s; }
      .link-item:hover { background: rgba(155,92,255,0.2); border-color: rgba(155,92,255,0.5); }
      
      .video-placeholder { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 60px; text-align: center; font-size: 24px; color: #666; }
      
      .tour-date-item { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 14px; }
      .tour-date { font-weight: 600; }
      
      .footer { margin-top: 50px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; font-size: 11px; opacity: 0.6; }
    </style>
  `;

  let modulesHTML = '';
  modules.forEach(module => {
    switch (module.type) {
      case 'bio':
        modulesHTML += `
          <div class="module">
            <h3>Biography</h3>
            <div class="bio-text">${module.data?.text || 'A dynamic force in the electronic music scene, blending cutting-edge production with raw energy. Known for pushing boundaries and creating immersive sonic experiences.'}</div>
          </div>
        `;
        break;
      case 'tracklist':
        const tracks = module.data?.tracks?.length > 0 ? module.data.tracks : [
          { title: 'Midnight Drive', soundcloudUrl: 'https://soundcloud.com/track1' },
          { title: 'Electric Dreams', soundcloudUrl: '' },
          { title: 'Neon Lights', soundcloudUrl: 'https://soundcloud.com/track3' }
        ];
        modulesHTML += `
          <div class="module">
            <h3>Tracklist</h3>
            ${tracks.map((track: any) => `
              <div class="tracklist-item">
                <div class="tracklist-title">${track.title || 'Untitled'}</div>
                ${track.soundcloudUrl ? `<div class="tracklist-link">🎵 ${track.soundcloudUrl}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
        break;
      case 'gallery':
        const images = module.data?.images?.length > 0 ? module.data.images : [1, 2, 3, 4];
        modulesHTML += `
          <div class="module">
            <h3>Photo Gallery</h3>
            <div class="gallery">
              ${images.map((_: any, i: number) => `
                <div class="gallery-item">📷 Photo ${i + 1}</div>
              `).join('')}
            </div>
          </div>
        `;
        break;
      case 'techRider':
        const riderItems = module.data?.items?.length > 0 ? module.data.items : [
          { label: 'CDJ-3000', quantity: 2 },
          { label: 'DJM-900NXS2', quantity: 1 },
          { label: 'Monitor Speakers', quantity: 2 },
          { label: 'Wireless Microphone', quantity: 1 }
        ];
        modulesHTML += `
          <div class="module">
            <h3>Technical Requirements</h3>
            <div class="tech-rider-grid">
              ${riderItems.map((item: any) => `
                <div class="tech-rider-item">${item.quantity ? item.quantity + 'x ' : ''}${item.label}</div>
              `).join('')}
            </div>
          </div>
        `;
        break;
      case 'quotes':
        const quotes = module.data?.quotes?.length > 0 ? module.data.quotes : [
          { text: 'A masterclass in electronic music production', source: 'DJ Mag' },
          { text: 'Innovative and boundary-pushing', source: 'Mixmag' }
        ];
        modulesHTML += `
          <div class="module">
            <h3>Press Quotes</h3>
            ${quotes.map((quote: any) => `
              <div class="quote">
                <div class="quote-text">"${quote.text}"</div>
                ${quote.source ? `<div class="quote-source">— ${quote.source}</div>` : ''}
              </div>
            `).join('')}
          </div>
        `;
        break;
      case 'links':
        const links = module.data?.links?.length > 0 ? module.data.links : [
          { label: '🎵 SoundCloud', url: 'https://soundcloud.com/artist' },
          { label: '📸 Instagram', url: 'https://instagram.com/artist' },
          { label: '🎧 Spotify', url: 'https://spotify.com/artist' },
          { label: '🌐 Website', url: 'https://artist.com' }
        ];
        modulesHTML += `
          <div class="module">
            <h3>Social Links</h3>
            <div class="links-grid">
              ${links.map((link: any) => `
                <a href="${link.url}" class="link-item" target="_blank">${link.label || link.url}</a>
              `).join('')}
            </div>
          </div>
        `;
        break;
      case 'video':
        modulesHTML += `
          <div class="module">
            <h3>Video Showcase</h3>
            <div class="video-placeholder">
              🎬 Video Player Preview
            </div>
          </div>
        `;
        break;
      case 'tourDates':
        const tourDates = module.data?.dates?.length > 0 ? module.data.dates : [
          { date: '2025-02-15', venue: 'Club XYZ', city: 'Berlin' },
          { date: '2025-03-01', venue: 'Warehouse', city: 'London' }
        ];
        modulesHTML += `
          <div class="module">
            <h3>Tour Dates</h3>
            ${tourDates.map((date: any) => `
              <div class="tour-date-item">
                <span class="tour-date">${date.date}</span> - 
                <span class="tour-venue">${date.venue}, ${date.city}</span>
              </div>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${artistName || 'EPK'} - Preview</title>
      ${style}
    </head>
    <body>
      <div class="header">
        <h1>${artistName || 'Artist Name'}</h1>
        ${releaseTitle ? `<h2>${releaseTitle}</h2>` : '<h2>Electronic Music Producer & DJ</h2>'}
        <div class="location">📍 Based in Berlin, Germany</div>
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
