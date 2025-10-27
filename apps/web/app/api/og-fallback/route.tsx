
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Music News';

    const truncatedTitle = title.length > 100 ? title.substring(0, 97) + '...' : title;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            position: 'relative',
          }}
        >
          {/* Gradient overlays matching theme */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              left: '20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(215, 255, 60, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '20%',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(155, 92, 255, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              maxWidth: '90%',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: 36,
                color: '#e5e5e5',
                textAlign: 'center',
                lineHeight: 1.4,
                fontWeight: 600,
                padding: '0 40px',
              }}
            >
              {truncatedTitle}
            </div>
          </div>

          {/* Decorative line accents */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #D7FF3C 0%, #9B5CFF 100%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
