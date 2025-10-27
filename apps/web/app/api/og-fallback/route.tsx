import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'thecueRoom';

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
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
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
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #a3e635 0%, #84cc16 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                marginBottom: '30px',
                textAlign: 'center',
              }}
            >
              thecueRoom
            </div>
            
            <div
              style={{
                fontSize: 32,
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

          <div
            style={{
              position: 'absolute',
              bottom: 30,
              fontSize: 18,
              color: '#737373',
            }}
          >
            Music • Culture • Technology
          </div>
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
